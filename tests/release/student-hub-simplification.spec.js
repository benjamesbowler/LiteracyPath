import { expect, test } from "@playwright/test";
test.setTimeout(120_000);

import { GAME_LIST } from "../../src/data/learnGamesData.js";
import { LETTER_PRACTICE_VERSION } from "../../src/policy/letterPractice.js";
import { getRuntimeGuidedReadingBooks } from "../../src/utils/guidedReading/runtimeBooks.js";

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

async function phonicsPaintFailures(page) {
  return page.locator(".phonics-simple-picker").evaluate(picker => {
    const failures = [];
    const targets = [...picker.querySelectorAll("[data-child-title], [data-child-instruction], [data-child-progress], .phonics-letter-feature strong, .phonics-letter-feature small, .phonics-familiar-letters > span, .phonics-alphabet-pages [role=status], button"), ...picker.closest(".phonics-island-view").querySelectorAll(".phonics-island-switcher button")];
    for (const target of targets) {
      const label = target.getAttribute("aria-label") || target.textContent.trim();
      const box = target.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) failures.push({ label, kind: "unpainted" });
      if (target.tagName === "BUTTON" && (box.width < 55.9 || box.height < 55.9)) failures.push({ label, kind: "small-target", box: box.toJSON() });
      const clips = [{ name: "viewport", x: true, y: true, left: 0, top: 0, right: innerWidth, bottom: innerHeight }];
      for (let ancestor = target; ancestor; ancestor = ancestor.parentElement) {
        const css = getComputedStyle(ancestor);
        const x = /hidden|clip|auto|scroll/.test(css.overflowX);
        const y = /hidden|clip|auto|scroll/.test(css.overflowY);
        if (!x && !y) continue;
        const rect = ancestor.getBoundingClientRect();
        const scaleX = rect.width / ancestor.offsetWidth;
        const scaleY = rect.height / ancestor.offsetHeight;
        const left = rect.left + ancestor.clientLeft * scaleX;
        const top = rect.top + ancestor.clientTop * scaleY;
        clips.push({ name: ancestor.className, x, y, left, top, right: left + ancestor.clientWidth * scaleX, bottom: top + ancestor.clientHeight * scaleY });
      }
      const painted = [box];
      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent.trim()) continue;
        const css = getComputedStyle(node.parentElement);
        if (css.display === "none" || css.visibility === "hidden" || Number(css.opacity) === 0) continue;
        const range = document.createRange(); range.selectNodeContents(node);
        painted.push(...[...range.getClientRects()].filter(rect => rect.width > 0 && rect.height > 0));
      }
      const clip = clips.find(ancestor => painted.some(rect => (ancestor.x && (rect.left < ancestor.left - 1 || rect.right > ancestor.right + 1)) || (ancestor.y && (rect.top < ancestor.top - 1 || rect.bottom > ancestor.bottom + 1))));
      if (clip) failures.push({ label, kind: "clipped", ancestor: clip.name, box: box.toJSON(), clip });
    }
    return failures;
  });
}

for (const viewport of [{ width: 568, height: 320 }, { width: 736, height: 390 }]) {
  for (const mode of [
    { id: "independent", query: "" },
    { id: "class review", query: "&teachingCycle=cycle-6", familiar: true, savedRound: true },
    { id: "teacher assigned", query: "&lockedLetters=1&teachingCycle=cycle-6", familiar: true }
  ]) {
    test(`Letters compact landscape paints progress and every browse page: ${mode.id} at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize(viewport);
      await page.goto(`/preview/child-surfaces.html?surface=phonics${mode.query}`);
      await expect(page.locator(".phonics-letter-feature")).toBeVisible();
      if (mode.savedRound) {
        await page.evaluate(version => {
          localStorage.setItem("lp_phonics_progress_child-surface-preview", JSON.stringify({ R: { v: 3, status: "inprogress", completions: [{
            id: "compact-R-round-1", contentVersion: version, completedAt: "2026-10-01T00:00:00Z",
            steps: [1, 2, 3].map(practiceStep => ({ practiceRound: 1, practiceStep }))
          }] } }));
          dispatchEvent(new CustomEvent("lp-progress-hydrated", { detail: { studentId: "child-surface-preview" } }));
        }, LETTER_PRACTICE_VERSION);
        await expect(page.locator(".phonics-letter-feature small")).toHaveText("1 of 5 rounds");
      }
      await page.evaluate(() => document.fonts.ready);
      const shellScale = await page.locator(".kg-stage").evaluate(element => {
        const transform = new DOMMatrixReadOnly(getComputedStyle(element).transform);
        return { x: transform.a, y: transform.d };
      });
      expect(shellScale).toEqual({ x: 1, y: 1 });
      await expectPaneFit(page);
      await expect(page.locator(".phonics-picker-progress")).toHaveText("0 of 26 letters finished");
      if (mode.familiar) await expect(page.getByRole("group", { name: "Letters to practise again" }).getByRole("button")).toHaveCount(3);
      await expect.poll(() => phonicsPaintFailures(page)).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath("letters-compact-closed.png") });
      await page.getByRole("button", { name: "Choose a letter", exact: true }).press("Enter");
      const seen = new Set();
      let sawSavedRound = false;
      for (let index = 0; index < 9; index += 1) {
        await expect.poll(() => phonicsPaintFailures(page)).toEqual([]);
        const letters = page.getByRole("group", { name: "All letters" }).getByRole("button");
        if (mode.savedRound && await letters.filter({ has: page.locator(".phonics-letter-rounds") }).count()) {
          sawSavedRound = true;
          const savedLetter = letters.filter({ has: page.locator(".phonics-letter-rounds") });
          await expect(letters.locator(".phonics-letter-rounds")).toHaveText("1 of 5");
          await expect(savedLetter).toHaveAttribute("aria-description", "1 of 5 rounds");
          const glyph = await savedLetter.locator(".phonics-letter-symbol").boundingBox();
          const badge = await letters.locator(".phonics-letter-rounds").boundingBox();
          expect(glyph.y + glyph.height).toBeLessThanOrEqual(badge.y + 1);
          await page.screenshot({ path: testInfo.outputPath("letters-compact-saved-round.png") });
        }
        for (const label of await letters.evaluateAll(elements => elements.map(element => element.getAttribute("aria-label")))) seen.add(label.match(/^Letter ([A-Z])/)[1]);
        await letters.last().focus(); await expect(letters.last()).toBeFocused();
        if (index === 0) await page.screenshot({ path: testInfo.outputPath("letters-compact-alphabet.png") });
        const more = page.getByRole("button", { name: "More letters", exact: true });
        if (await more.isDisabled()) break;
        await more.press("Enter");
      }
      expect(seen.size).toBe(26);
      if (mode.savedRound) expect(sawSavedRound).toBe(true);
      await page.getByRole("button", { name: "Close alphabet", exact: true }).press("Enter");
      await expect.poll(() => phonicsPaintFailures(page)).toEqual([]);
      // The geometry gate must detect the reported progress-only defect even
      // when overflow:hidden prevents it from changing the pane's scroll size.
      await page.locator(".phonics-picker-progress").evaluate(element => { element.style.position = "relative"; element.style.top = "100px"; });
      expect((await phonicsPaintFailures(page)).some(failure => failure.label === "0 of 26 letters finished" && failure.kind === "clipped")).toBe(true);
    });
  }
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
    const choices = page.locator(".lg-game-tile");
    await expect(choices).toHaveCount(27);
    await expect(page.getByRole("group", { name: "Difficulty", exact: true })).toHaveCount(0);
    expect(await page.locator(".kg-main").evaluate(element => ({ x: element.scrollWidth - element.clientWidth, y: element.scrollHeight - element.clientHeight }))).toEqual({ x: 0, y: 0 });
    await expect(page.getByRole("button", { name: "More games", exact: true })).toHaveCount(0);
    const expected = GAME_LIST.filter(game => !game.hidden).map(game => game.id).sort();
    expect(await choices.evaluateAll(nodes => nodes.map(node => node.dataset.gameId).sort())).toEqual(expected);
    await page.screenshot({ path: testInfo.outputPath("hub.png") });
    await choices.last().scrollIntoViewIfNeeded();
    await expect(choices.last()).toBeInViewport({ ratio: 0.99 });
    await choices.last().focus();
    await expect(choices.last()).toBeFocused();
    const box = await choices.last().boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(56);
    expect(box.height).toBeGreaterThanOrEqual(56);
    await page.getByRole("button", { name: "Game settings", exact: true }).click();
    await page.getByRole("button", { name: "hard", exact: true }).click();
    await expect(page.getByRole("button", { name: "hard", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Close settings" }).click();
    expect(peers).toEqual([]);
  });

  test(`Books keep the full gallery, truthful art and optional discovery at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(viewport);
    await page.goto("/preview/child-surfaces.html?surface=reading-library", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-child-primary]")).toBeVisible({ timeout: 90_000 });
    await expect(page.locator(".kg-book-card")).toHaveCount(getRuntimeGuidedReadingBooks().length);
    await page.locator(".kg-book-card").first().scrollIntoViewIfNeeded();
    await expect(page.locator('.kg-book-card [data-book-cover-state="ready"]').first()).toBeVisible();
    await expect.poll(() => page.locator('.kg-book-card [data-book-cover-state="ready"] > img').evaluateAll(images => images.every(image => {
      const box = image.getBoundingClientRect();
      return image.naturalWidth > 0 && box.width > 0 && box.height > 0 && getComputedStyle(image).opacity === "1";
    }))).toBe(true);
    await expect(page.locator('[data-book-cover-state="ready"] .kg-book-cover-fallback-art')).toHaveCount(0);
    expect(await page.locator(".kg-main").evaluate(element => ({ x: element.scrollWidth - element.clientWidth, y: element.scrollHeight - element.clientHeight }))).toEqual({ x: 0, y: 0 });
    expect(await page.locator(".kg-books").evaluate(element => ({ y: getComputedStyle(element).overflowY, page: document.documentElement.scrollHeight <= innerHeight + 1 }))).toEqual({ y: "auto", page: true });
    await page.screenshot({ path: testInfo.outputPath("hub.png") });
    await expect(page.locator(".kg-single-shelf")).toHaveCount(1);
    await expect(page.getByRole("button", { name: "More books", exact: true })).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Book pictures" }).getByRole("button", { name: "Facts", exact: true })).toBeVisible();
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
    await page.locator(".guided-reader-shell").getByRole("button", { name: "Back to Books", exact: true }).click();
    await expect(page.locator(".kg-book-filter-state")).toHaveText("Dino Pals");
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
