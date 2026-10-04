import { expect, test } from "@playwright/test";
import { GAME_LIST } from "../../src/data/learnGamesData.js";
import { sampleGameIds } from "../../src/policy/freeTierContent.js";
import { STUDENT_NAVIGATION_ART } from "../../src/policy/studentTabBar.js";

const PREVIEW = "/preview/child-surfaces.html";
const AVAILABLE_IDS = GAME_LIST.filter(game => !game.hidden).map(game => game.id).sort();
const HOME_IDS = ["map", "books", "stories", "arcade", "phonics", "words", "sounds", "skills"];

async function expectCompleteLabels(cards, selector) {
  const failures = await cards.evaluateAll((nodes, labelSelector) => nodes.flatMap(card => {
    const label = card.querySelector(labelSelector);
    const box = card.getBoundingClientRect();
    const labelBox = label.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(label);
    const textBoxes = [...range.getClientRects()].filter(rect => rect.width > 0 && rect.height > 0);
    const contained = textBoxes.every(rect => rect.left >= box.left - 1 && rect.right <= box.right + 1 && rect.top >= box.top - 1 && rect.bottom <= box.bottom + 1);
    const complete = label.scrollWidth <= label.clientWidth + 1 && label.scrollHeight <= label.clientHeight + 1;
    return contained && complete && labelBox.height > 0 ? [] : [{ title: label.textContent, contained, complete }];
  }), selector);
  expect(failures).toEqual([]);
}

test("Home shows eight picture destinations and Words has its recorded label", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const audio = [];
  page.on("request", request => { if (request.url().includes("/audio/production/")) audio.push(request.url()); });
  await page.goto(`${PREVIEW}?surface=student-home`);
  await expect.poll(() => page.locator(".kg-home-door-art img").evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  await page.evaluate(() => document.fonts.ready);
  const cards = page.locator(".kg-home-door");
  await expect(cards).toHaveCount(8);
  expect(await cards.evaluateAll(nodes => nodes.map(node => node.dataset.railDestination))).toEqual(HOME_IDS);
  for (const card of await cards.all()) {
    const destination = await card.getAttribute("data-rail-destination");
    await expect(card.locator(".kg-home-door-art img")).toHaveAttribute("src", STUDENT_NAVIGATION_ART[destination]);
  }
  for (const tabId of ["sounds", "books", "games", "hollow"]) {
    const art = page.locator(`[data-tab="${tabId}"] .kg-tab-art`);
    await expect(art).toHaveAttribute("src", STUDENT_NAVIGATION_ART[tabId === "games" ? "arcade" : tabId]);
    await expect.poll(() => art.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    const box = await art.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(25);
    expect(box.width).toBeLessThanOrEqual(32);
  }
  await expect(page.locator('[data-tab="home"] .kg-tab-art')).toHaveCount(0);
  await expect(page.locator(".kg-home-letter-glyphs")).toHaveText("abc");
  await expectCompleteLabels(cards, ".kg-card-title");
  for (const card of await cards.all()) await expect(card).toBeInViewport({ ratio: 0.99 });
  await expect(page.locator(".kg-home-door-hear")).toHaveCount(8);
  await expect(page.getByRole("heading", { name: "My Hollow", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open my Hollow", exact: true })).toBeInViewport();
  await page.getByRole("button", { name: "Hear about Skills trail", exact: true }).click();
  await expect.poll(() => audio.some(url => url.includes("practice-helps-you-improve-7bbfd2695f"))).toBe(true);
  for (const speaker of await page.locator(".kg-home-door-hear").all()) {
    const box = await speaker.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(56);
    expect(box.height).toBeGreaterThanOrEqual(56);
  }
  await page.getByRole("button", { name: "Hear Words", exact: true }).click();
  await expect.poll(() => audio.some(url => url.includes("isolated_word/words-99f5f6e7ac"))).toBe(true);
  await page.locator('[data-rail-destination="words"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-student-destination", "word-workshop");
  await page.screenshot({ path: ".artifacts/child-redesign-review/implementation-home-1366.png" });
});

for (const viewport of [{ width: 1024, height: 768 }, { width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 320, height: 568 }, { width: 568, height: 320 }]) {
  test(`Home pictures, complete labels and replay targets stay separate at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${PREVIEW}?surface=student-home`);
    await page.evaluate(() => document.fonts.ready);
    const cards = page.locator(".kg-home-door");
    await expect(cards).toHaveCount(8);
    await expectCompleteLabels(cards, ".kg-card-title");
    expect(await page.locator(".kg-home-door-wrap").evaluateAll(nodes => nodes.flatMap(node => {
      const art = node.querySelector(".kg-home-menu-object, .kg-home-word-object").getBoundingClientRect();
      const hear = node.querySelector(".kg-home-door-hear").getBoundingClientRect();
      const intersects = art.left < hear.right && art.right > hear.left && art.top < hear.bottom && art.bottom > hear.top;
      return intersects || hear.width < 56 || hear.height < 56 ? [node.textContent.trim()] : [];
    }))).toEqual([]);
    await cards.last().scrollIntoViewIfNeeded();
    await expect(cards.last()).toBeInViewport({ ratio: 0.99 });
    await page.screenshot({ path: `.artifacts/child-redesign-review/implementation-home-${viewport.width}.png` });
  });
}

test("Games exposes the complete Arcade and Phonics roster on one page", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto(`${PREVIEW}?surface=arcade`);
  const cards = page.locator(".lg-game-tile");
  await expect(cards).toHaveCount(27);
  expect(await cards.evaluateAll(nodes => nodes.map(node => node.dataset.gameId).sort())).toEqual(AVAILABLE_IDS);
  await expect(page.getByRole("button", { name: /More games|Next games|Previous games|Close games/ })).toHaveCount(0);
  await expectCompleteLabels(cards, ".lg-game-tile-name");
  await expect(page.getByRole("group", { name: "Arcade", exact: true }).locator(".lg-game-tile")).toHaveCount(16);
  await expect(page.getByRole("group", { name: "Phonics games", exact: true }).locator(".lg-game-tile")).toHaveCount(11);
  for (const card of await cards.all()) await expect(card).toBeInViewport({ ratio: 0.99 });
  await expect(page.locator(".lg-game-tile [data-child-emphasis-cue]")).toHaveCount(1);
  await page.screenshot({ path: ".artifacts/child-redesign-review/implementation-arcade-1366.png" });
  await page.locator('[data-game-id="reading-race"]').click();
  await expect(page.locator(".lg-game-title-chip")).toContainText("Sentence Fix-It");
});

for (const viewport of [{ width: 390, height: 844 }, { width: 568, height: 320 }]) {
  test(`Arcade keeps every card reachable through one native catalogue scroll at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(`${PREVIEW}?surface=arcade`);
    const cards = page.locator(".lg-game-tile");
    await expect(cards).toHaveCount(27);
    await expectCompleteLabels(cards, ".lg-game-tile-name");
    const scroller = page.locator(".lg-game-choice-area");
    expect(await scroller.evaluate(node => getComputedStyle(node).overflowY)).toBe("auto");
    expect(await scroller.evaluate(node => node.scrollHeight > node.clientHeight)).toBe(true);
    await cards.last().scrollIntoViewIfNeeded();
    await expect(cards.last()).toBeInViewport({ ratio: 0.99 });
    const box = await cards.last().boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(56);
    expect(box.width).toBeGreaterThanOrEqual(56);
    await page.screenshot({ path: `.artifacts/child-redesign-review/implementation-arcade-${viewport.width}.png` });
    await cards.last().click();
    await expect(page.locator(".lg-game-player")).toBeVisible();
  });
}

test("Arcade retains sample restrictions and exact assigned game boundaries", async ({ page }) => {
  await page.goto(`${PREVIEW}?surface=arcade&sampleContent=1`);
  const sampleIds = [...sampleGameIds(GAME_LIST)].filter(id => AVAILABLE_IDS.includes(id)).sort();
  await expect(page.locator(".lg-game-tile")).toHaveCount(sampleIds.length);
  expect(await page.locator(".lg-game-tile").evaluateAll(nodes => nodes.map(node => node.dataset.gameId).sort())).toEqual(sampleIds);
  await page.goto(`${PREVIEW}?surface=arcade&lockedGame=rocket-run`);
  await expect(page.locator(".lg-game-tile")).toHaveCount(1);
  await expect(page.locator(".lg-game-title-chip")).toContainText("Rocket Run");
  await page.goto(`${PREVIEW}?surface=arcade&lockedGame=missing-game`);
  await expect(page.locator('[data-assigned-content-unavailable="game"]')).toContainText("Game unavailable");
  await expect(page.locator(".lg-game-tile")).toHaveCount(0);
});

test("Arcade optional settings keep keyboard focus inside and restore the trigger", async ({ page }) => {
  await page.goto(`${PREVIEW}?surface=arcade`);
  const trigger = page.getByRole("button", { name: "Game settings", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Game settings", exact: true });
  const close = dialog.getByRole("button", { name: "Close settings", exact: true });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("Words retains prerequisites and offers real picture and phoneme letter practice", async ({ page }) => {
  await page.goto(`${PREVIEW}?surface=phonics&island=words`);
  await expect(page.locator(".cvc-family-card:disabled")).toHaveCount(8);
  await expect(page.getByRole("heading", { name: "First, practise these letters" })).toBeVisible();
  const practise = page.locator(".cvc-readiness-practise").first();
  await expect(practise.locator("img")).toBeVisible();
  const label = await practise.getAttribute("aria-label");
  await practise.click();
  await expect(page.locator(".phonics-learning-flow")).toBeVisible();
  await expect(page.locator(".phonics-round-label")).toContainText(label.split(" ").at(-1).toUpperCase());
  await page.goto(`${PREVIEW}?surface=phonics&island=words&unlockWords=1`);
  await expect(page.locator(".cvc-family-card:not(:disabled)")).toHaveCount(8);
  await expect(page.locator(".cvc-letter-readiness")).toHaveCount(0);
  await page.goto(`${PREVIEW}?surface=phonics&island=words&lockedLetters=1`);
  await expect(page.locator(".cvc-picker")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Letters", exact: true })).toBeVisible();
});

test("the real Home Words shortcut never changes ordinary Letters or Games entry", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try for free", exact: true }).click();
  await page.getByRole("button", { name: "Start playing", exact: true }).click();
  const guide = page.getByRole("dialog", { name: "Choose your Little Literacy Guide" });
  if (await guide.isVisible()) await guide.getByRole("button", { name: "Fluff Bob and Nan" }).click();
  await page.locator('[data-rail-destination="words"]').click();
  await expect(page.getByRole("heading", { name: "Words", exact: true })).toBeVisible();
  await page.locator('.kg-tab[data-tab="home"]').click();
  await page.locator('[data-rail-destination="phonics"]').click();
  await expect(page.getByRole("heading", { name: "Letters", exact: true })).toBeVisible();
  await expect(page.locator(".cvc-picker")).toHaveCount(0);
  await page.locator('.kg-tab[data-tab="home"]').click();
  await page.locator('[data-rail-destination="arcade"]').click();
  await expect(page.locator(".lg-game-tile").first()).toBeVisible();
  await expect(page.locator(".cvc-picker")).toHaveCount(0);
});
