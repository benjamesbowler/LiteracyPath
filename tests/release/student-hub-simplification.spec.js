import { expect, test } from "@playwright/test";
test.setTimeout(120_000);

import { GAME_LIST } from "../../src/data/learnGamesData.js";

async function expectPaneFit(page) {
  const fit = await page.locator(".kg-main").evaluate(element => ({ x: element.scrollWidth - element.clientWidth, y: element.scrollHeight - element.clientHeight }));
  const layout = fit.x || fit.y ? await page.locator(".kg-main").evaluate(main => [main, ...main.querySelectorAll('.kg-books, .kg-books > *, .kg-picture-shelf, .kg-book-card, .student-surface-phonics, .phonics-learn-page, .phonics-tab-shell, .phonics-island-view, .phonics-island-switcher, .phonics-picker, .phonics-picker > *')].map(element => ({
    name: element.className, box: element.getBoundingClientRect().toJSON(), minHeight: getComputedStyle(element).minHeight, rows: getComputedStyle(element).gridTemplateRows
  }))) : [];
  expect(fit, JSON.stringify(layout)).toEqual({ x: 0, y: 0 });
  const primary = page.locator("[data-child-primary]");
  await expect(primary).toHaveCount(1);
  await expect(primary).toBeInViewport();
  const clippedChoices = await page.locator(".kg-main").evaluate(main => {
    const pane = main.getBoundingClientRect();
    return [...main.querySelectorAll("[data-child-choices] button")].filter(button => {
      const box = button.getBoundingClientRect(); return box.width > 0 && box.height > 0
        && (box.top < pane.top - 1 || box.bottom > pane.bottom + 1 || box.left < pane.left - 1 || box.right > pane.right + 1);
    }).map(button => button.textContent.trim());
  });
  expect(clippedChoices).toEqual([]);
}

for (const viewport of [{ width: 1366, height: 768 }, { width: 1024, height: 768 }, { width: 390, height: 844 }, { width: 320, height: 568 }, { width: 568, height: 320 }]) {
  test(`Letters lead with the current letter and deliberately reach all 26 at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(viewport);
    await page.goto("/preview/child-surfaces.html?surface=phonics&teachingCycle=cycle-6", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-child-primary]")).toBeVisible({ timeout: 90_000 });
    await expect(page.getByRole("button", { name: "Practise R", exact: true })).toBeVisible();
    await expect(page.getByRole("group", { name: "All letters" })).toHaveCount(0);
    await expectPaneFit(page);
    await page.screenshot({ path: testInfo.outputPath("hub.png") });
    await page.getByRole("button", { name: "Choose a letter", exact: true }).click();
    const seen = new Set();
    for (let index = 0; index < 9; index += 1) {
      const letters = page.getByRole("group", { name: "All letters" }).locator("button");
      await expectPaneFit(page);
      for (const label of await letters.evaluateAll(elements => elements.map(element => element.getAttribute("aria-label")))) seen.add(label.match(/^Letter ([A-Z])/)[1]);
      for (const card of [letters.first(), letters.last()]) {
        await card.focus(); await expect(card).toBeFocused();
        const box = await card.boundingBox(); expect(box.width).toBeGreaterThanOrEqual(55.5); expect(box.height).toBeGreaterThanOrEqual(55.5);
      }
      if (await page.getByRole("button", { name: "More letters", exact: true }).isDisabled()) break;
      await page.getByRole("button", { name: "More letters", exact: true }).click();
    }
    expect(seen.size).toBe(26);
    await page.getByRole("button", { name: "Close alphabet" }).click();
    await page.getByRole("button", { name: "Practise R", exact: true }).click();
    await expect(page.locator(".phonics-trace-pad")).toBeVisible();
  });

  test(`Arcade reveals every game and optional settings at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(viewport);
    const peers = []; page.on("request", request => { if (request.url().includes("get_game_leaderboard")) peers.push(request.url()); });
    await page.goto("/preview/child-surfaces.html?surface=arcade", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-child-primary]")).toBeVisible({ timeout: 90_000 });
    await expect(page.locator(".lg-game-tile")).toHaveCount(viewport.width <= 350 ? 2 : 3);
    await expect(page.getByRole("group", { name: "Difficulty", exact: true })).toHaveCount(0);
    await expectPaneFit(page);
    await page.screenshot({ path: testInfo.outputPath("hub.png") });
    const seen = new Set([await page.locator("[data-child-primary]").getAttribute("data-game-id")]);
    await page.getByRole("button", { name: "More games", exact: true }).click();
    for (const tabName of ["Arcade", "Phonics Practice"]) {
      await page.getByRole("tab", { name: tabName, exact: true }).click();
      for (let pageIndex = 0; pageIndex < 5; pageIndex += 1) {
        const choices = page.locator(".lg-game-tile");
        await expectPaneFit(page);
        for (const id of await choices.evaluateAll(elements => elements.map(element => element.getAttribute("data-game-id")))) seen.add(id);
        await choices.last().focus(); await expect(choices.last()).toBeFocused();
        if (await page.getByRole("button", { name: "Next games", exact: true }).isDisabled()) break;
        await page.getByRole("button", { name: "Next games", exact: true }).click();
      }
    }
    const expected = GAME_LIST.filter(game => !game.hidden && game.id !== "word-climb" || game.surfaces?.includes("arcade")).map(game => game.id);
    expect([...seen].sort()).toEqual([...new Set(expected)].sort());
    expect(seen.size).toBe(22);
    await page.getByRole("button", { name: "Close games" }).click();
    await page.getByRole("button", { name: "Game settings", exact: true }).click();
    await page.getByRole("button", { name: "hard", exact: true }).click();
    await expect(page.getByRole("button", { name: "hard", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Close settings" }).click();
    expect(peers).toEqual([]);
  });

  test(`Books keep one shelf, truthful art and full discovery at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(viewport);
    await page.goto("/preview/child-surfaces.html?surface=reading-library", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-child-primary]")).toBeVisible({ timeout: 90_000 });
    await expect(page.locator('.kg-book-card [data-book-cover-state="ready"]')).toHaveCount(viewport.height <= 430 && viewport.width > viewport.height || viewport.width <= 350 ? 2 : viewport.width <= 500 ? 3 : 6);
    await expect.poll(() => page.locator('.kg-book-card [data-book-cover-state="ready"] > img').evaluateAll(images => images.every(image => {
      const box = image.getBoundingClientRect();
      return image.naturalWidth > 0 && box.width > 0 && box.height > 0 && getComputedStyle(image).opacity === "1";
    }))).toBe(true);
    await expect(page.locator('[data-book-cover-state="ready"] .kg-book-cover-fallback-art')).toHaveCount(0);
    await expectPaneFit(page);
    await page.screenshot({ path: testInfo.outputPath("hub.png") });
    await expect(page.locator(".kg-single-shelf")).toHaveCount(1);
    await expect(page.locator(".kg-book-card")).toHaveCount(viewport.height <= 430 && viewport.width > viewport.height || viewport.width <= 350 ? 2 : viewport.width <= 500 ? 3 : 6);
    await expect(page.getByRole("button", { name: "More books", exact: true })).toHaveCount(1);
    const featureTitle = await page.locator(".kg-continue-title").innerText();
    await expect(page.locator(".kg-book-card .kg-book-title")).not.toContainText([featureTitle]);
    await expect(page.locator('[data-book-cover-state="ready"]').first()).toBeVisible();
    await page.getByRole("button", { name: "Find a book", exact: true }).click();
    await page.getByLabel("Friends or topic", { exact: true }).selectOption("dino-pals");
    await page.getByRole("button", { name: "Back to shelf", exact: true }).click();
    await expect(page.locator(".kg-book-card").first()).toBeVisible();
    const dom = await page.locator('[data-child-surface="reading-library"]').innerText();
    expect(dom).not.toMatch(/Level [A-Z]|C Standard|C Extended/);
    await page.locator(".kg-book-card").first().focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("region", { name: /full-screen reader/ })).toBeVisible();
  });
}

test("a failed cover retries only that book's pages, then uses an intentional title fallback", async ({ page }) => {
  await page.route("**/guided-reading/**", route => route.request().resourceType() === "image" ? route.abort() : route.continue());
  await page.goto("/preview/child-surfaces.html?surface=reading-library", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-child-primary]")).toBeVisible({ timeout: 90_000 });
  const fallback = page.locator('.kg-book-card [data-book-cover-state="fallback"]');
  await expect(fallback.first()).toBeVisible();
  await expect(fallback.first().locator("svg")).toBeVisible();
  await expect(fallback.first().locator("strong")).not.toBeEmpty();
  await expect(page.locator('[data-child-surface="reading-library"]')).not.toContainText(/Level [A-Z]/);
});
