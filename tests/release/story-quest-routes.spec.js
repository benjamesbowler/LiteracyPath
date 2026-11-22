import { expect, test } from "@playwright/test";
import { storyQuests } from "../../src/data/storyQuests.js";

test.describe.configure({ timeout: 90_000 });

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
      const endingScene = quest.pages.find(scene => scene.id === ending);
      await expect(reader.locator(".story-quest-choice-prompt")).toHaveText(endingScene.replayPrompt);
      await expect(reader.getByRole("heading", { name: endingScene.endingTitle })).toBeFocused();
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
  await expect(reader.getByRole("button", { name: "Hear the scene actions", exact: true })).toBeFocused();
  const targets = await reader.locator('header button, header summary').evaluateAll(elements => elements.map(element => ({ width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height }))).then(rows => rows.filter(row => row.width && row.height));
  expect(targets.every(row => row.width >= 44 && row.height >= 44)).toBe(true);
  expect(await page.evaluate(() => document.scrollingElement.scrollWidth <= innerWidth)).toBe(true);
});

test("scene actions reveal different clues and replay keeps discoveries across visits", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/preview/child-surfaces.html?surface=story-quests");
  const card = page.locator(".kg-quest-open").filter({ hasText: "A Quiet Hello" });
  await card.click();
  const reader = page.locator(".story-quest-reader");
  await reader.getByRole("button", { name: "Next", exact: true }).click();
  const first = reader.getByRole("button", { name: "Watch Shy jump" });
  const second = reader.getByRole("button", { name: "Listen at the barn" });
  await first.focus();
  await first.press("Enter");
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await expect(reader.getByText("Both feet leave the ground!")).toBeVisible();
  const marker = reader.locator(".story-quest-illustration-focus");
  await expect(marker).toBeVisible();
  await expect(marker).toHaveCSS("animation-name", "none");
  await second.click();
  await expect(second).toHaveAttribute("aria-pressed", "true");
  await expect(reader.getByText("That hello could fill the whole barn!")).toBeVisible();
  await expect(reader).toHaveAttribute("data-page-id", "p04_call_shy");

  for (let step = 0; step < 3; step += 1) {
    await reader.getByRole("button", { name: "Next", exact: true }).click();
  }
  await reader.getByRole("button", { name: "Lean in and hug", exact: true }).click();
  await reader.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(reader.getByText("1 of 2 endings found")).toBeVisible();
  await reader.getByRole("button", { name: "Try another path" }).click();
  await expect(reader).toHaveAttribute("data-page-id", "p07_tree_under");
  await expect(reader.locator(".story-quest-position")).toHaveText("Scene 5");
  await reader.getByRole("button", { name: "Sit a little apart", exact: true }).click();
  await reader.getByRole("button", { name: "Back to Story Quests" }).click();
  await expect(card).toContainText("Continue");
  await card.click();
  await expect(reader).toHaveAttribute("data-page-id", "p08_tree_purr");
  await reader.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(reader.getByText("2 of 2 endings found")).toBeVisible();
  await expect(reader.getByRole("region", { name: "Endings found" }).getByRole("listitem"))
    .toHaveText(["A hug from Shy", "Room under the tree"]);
  await expect(reader.getByRole("button", { name: "Try another path" })).toHaveCount(0);
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
  const samAndPam = storyQuests.find(quest => quest.id === "story_quest_short_a_sam_pam_01");
  await expect(picture).toHaveAttribute("src", samAndPam.wordCards.find(card => card.word === "van").imageUrl);
  await expect.poll(() => page.evaluate(() => window.__earlyWordAudio.some(audio => audio.src.includes("/isolated_word/van-") && audio.currentTime > 0 && !audio.error))).toBe(true);
  await expect(reader).toHaveAttribute("data-page-id", scene);
  await expect(reader.getByRole("button", { name: "Hear the letters", exact: true })).toBeEnabled();
  const helpTargets = await reader.locator(".story-quest-word-support button").evaluateAll(buttons => buttons.map(button => ({ width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })));
  expect(helpTargets.every(target => target.width >= 44 && target.height >= 44)).toBe(true);
  expect(await page.evaluate(() => document.scrollingElement.scrollWidth <= innerWidth)).toBe(true);
});
