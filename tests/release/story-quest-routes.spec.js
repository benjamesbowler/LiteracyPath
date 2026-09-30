import { expect, test } from "@playwright/test";
import { storyQuests } from "../../src/data/storyQuests.js";

function routesFor(quest) {
  const pages = new Map(quest.pages.map(page => [page.id, page]));
  const routes = [];
  function visit(id, route, choices) {
    if (route.includes(id)) throw new Error(`Narrative loop in ${quest.id}/${id}`);
    const scene = pages.get(id);
    const nextRoute = [...route, id];
    if (scene.choices.some(choice => choice.nextPageId === "end")) {
      routes.push({ pages: nextRoute, choices });
      return;
    }
    for (const choice of scene.choices) visit(choice.nextPageId, nextRoute, [...choices, choice.label]);
  }
  visit(quest.startPageId, [], []);
  return routes;
}

for (const quest of storyQuests) {
  test(`${quest.shortTitle}: every route loads its prose, picture and earned ending`, async ({ page }) => {
    test.setTimeout(120_000);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/preview/child-surfaces.html?surface=story-quests");
    const world = quest.id.startsWith("mw_") ? "Moonwood" : quest.id.startsWith("dp_") ? "Dino" : "Meadow";
    await page.getByRole("button", { name: world, exact: true }).click();
    await page.locator(".kg-quest-open").filter({ hasText: quest.shortTitle }).click();
    const reader = page.locator(".story-quest-reader");
    for (const route of routesFor(quest)) {
      for (const [index, id] of route.pages.entries()) {
        const scene = quest.pages.find(candidate => candidate.id === id);
        await expect(reader).toHaveAttribute("data-page-id", id);
        await expect(reader.locator(".story-quest-text p")).toHaveText(scene.text);
        await expect(reader.locator(".story-quest-position")).toHaveText(`Scene ${index + 1}`);
        await expect(reader.locator(".story-quest-image")).toHaveAttribute("alt", scene.imageAlt);
        await expect.poll(() => reader.locator(".story-quest-image").evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
        await expect(reader.getByRole("button", { name: "Hear the story", exact: true })).toBeEnabled();
        if (index) await expect(reader.getByRole("heading", { level: 1 })).toBeFocused();
        if (route.choices[index]) await reader.getByRole("button", { name: route.choices[index], exact: true }).click();
      }
      const ending = route.pages.at(-1);
      const source = await reader.locator(".story-quest-image").getAttribute("src");
      await reader.getByRole("button", { name: "Finish", exact: true }).click();
      await expect(reader).toHaveAttribute("data-page-id", ending);
      await expect(reader.locator(".story-quest-position")).toHaveText("The end");
      await expect(reader.locator(".story-quest-image")).toHaveAttribute("src", source);
      await expect(reader.locator(".story-quest-choice-prompt")).toHaveText(quest.pages.find(scene => scene.id === ending).replayPrompt);
      await reader.getByRole("button", { name: "Read again", exact: true }).click();
    }
    expect(errors).toEqual([]);
  });
}

test("leaving an unfinished story resumes the actual route and stops narration", async ({ page }) => {
  await page.addInitScript(() => {
    const BrowserAudio = window.Audio;
    window.__storyAudio = [];
    window.Audio = function RecordedAudio(source) {
      const element = new BrowserAudio(source);
      window.__storyAudio.push(element);
      return element;
    };
    window.Audio.prototype = BrowserAudio.prototype;
  });
  await page.goto("/preview/child-surfaces.html?surface=story-quests");
  await page.getByRole("button", { name: "Dino", exact: true }).click();
  await page.locator(".kg-quest-open").filter({ hasText: "Shy’s Snail Trail" }).click();
  const reader = page.locator(".story-quest-reader");
  await reader.getByRole("button", { name: "Lay a twig", exact: true }).click();
  await reader.getByRole("button", { name: "Lay flat bark", exact: true }).click();
  const savedScene = await reader.getAttribute("data-page-id");
  await reader.getByRole("button", { name: "Hear the story", exact: true }).click();
  await expect(reader.getByRole("button", { name: "Stop audio", exact: true })).toBeVisible();
  await reader.getByRole("button", { name: "Back to Story Quests", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__storyAudio.every(audio => audio.paused))).toBe(true);
  const card = page.locator(".kg-quest-open").filter({ hasText: "Shy’s Snail Trail" });
  await expect(card).toContainText("Continue");
  await card.click();
  await expect(reader).toHaveAttribute("data-page-id", savedScene);
  await expect(reader.locator(".story-quest-position")).toHaveText("Scene 3");
  await expect(reader.getByRole("button", { name: "Hear the story", exact: true })).toBeEnabled();
  await reader.getByRole("button", { name: "Previous scene", exact: true }).click();
  await expect(reader.locator(".story-quest-position")).toHaveText("Scene 2");
});

test("keyboard word help uses one tab stop and arrows while phone navigation stays touchable", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/preview/child-surfaces.html?surface=story-quests");
  await page.locator(".kg-quest-open").filter({ hasText: "The Missing Hat" }).click();
  const reader = page.locator(".story-quest-reader");
  const words = reader.locator(".story-quest-word");
  await expect(reader.locator('.story-quest-word[tabindex="0"]')).toHaveCount(1);
  await words.first().focus();
  await words.first().press("ArrowRight");
  await expect(words.nth(1)).toBeFocused();
  await words.nth(1).press("End");
  await expect(words.last()).toBeFocused();
  await words.last().press("Tab");
  await expect(reader.getByRole("button", { name: "Hear the choices", exact: true })).toBeFocused();
  const targets = await reader.locator('header button, header summary').evaluateAll(elements => elements.map(element => ({ width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height }))).then(rows => rows.filter(row => row.width && row.height));
  expect(targets.every(row => row.width >= 44 && row.height >= 44)).toBe(true);
  expect(await page.evaluate(() => document.scrollingElement.scrollWidth <= innerWidth)).toBe(true);
});

test("Early word help shows the matching meaning picture without choosing a story path", async ({ page }) => {
  await page.addInitScript(() => {
    const BrowserAudio = window.Audio;
    window.__earlyWordAudio = [];
    window.Audio = function RecordedWordAudio(source) {
      const audio = new BrowserAudio(source);
      window.__earlyWordAudio.push(audio);
      return audio;
    };
    window.Audio.prototype = BrowserAudio.prototype;
  });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/preview/child-surfaces.html?surface=story-quests");
  await page.locator(".kg-quest-open").filter({ hasText: "Sam and Pam" }).click();
  const reader = page.locator(".story-quest-reader");
  const scene = await reader.getAttribute("data-page-id");
  await reader.getByRole("button", { name: "Hear van", exact: true }).click();
  const picture = reader.getByRole("img", { name: "Illustration of van", exact: true });
  await expect.poll(() => picture.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(picture).toHaveAttribute("src", "/images/story-quests/sam-pam/words/word-van.webp");
  await expect.poll(() => page.evaluate(() => window.__earlyWordAudio.some(audio => audio.src.includes("/isolated_word/van-") && audio.currentTime > 0 && !audio.error))).toBe(true);
  await expect(reader).toHaveAttribute("data-page-id", scene);
  await expect(reader.getByRole("button", { name: "Hear the letters", exact: true })).toBeEnabled();
  const helpTargets = await reader.locator(".story-quest-word-support button").evaluateAll(buttons => buttons.map(button => ({ width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })));
  expect(helpTargets.every(target => target.width >= 44 && target.height >= 44)).toBe(true);
  expect(await page.evaluate(() => document.scrollingElement.scrollWidth <= innerWidth)).toBe(true);
});
