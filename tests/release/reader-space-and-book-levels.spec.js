import { expect, test } from "@playwright/test";
import { getRuntimeGuidedReadingBooks } from "../../src/utils/guidedReading/runtimeBooks.js";
import { getBookTextAnalysis } from "../../src/utils/guidedReading/bookTextAnalysis.js";

for (const viewport of [{ width: 1920, height: 1080 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }]) {
  test(`fullscreen story spends its space on the illustration at ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => { HTMLElement.prototype.requestFullscreen = () => Promise.reject(new Error("Unsupported")); });
    await page.goto("/preview/child-surfaces.html?surface=story-quests");
    await page.locator(".kg-quest-open").filter({ hasText: "The Flying Map" }).click();
    const reader = page.locator(".story-quest-reader");
    await reader.locator('summary[aria-label="More story controls"]').click();
    await reader.getByRole("button", { name: "Full screen", exact: true }).click();
    await expect(reader).toHaveClass(/fullscreen/);
    const geometry = await reader.evaluate(el => {
      const image = el.querySelector(".story-quest-image"), imageBox = image.getBoundingClientRect();
      const ratio = Math.min(imageBox.width / image.naturalWidth, imageBox.height / image.naturalHeight);
      const text = el.querySelector(".story-quest-text").getBoundingClientRect(), decision = el.querySelector(".story-quest-decision").getBoundingClientRect();
      return { paintedHeight: image.naturalHeight * ratio, maximumUncroppedHeight: imageBox.width * image.naturalHeight / image.naturalWidth, bottom: decision.bottom, textTop: text.top, imageBottom: imageBox.bottom, overflowX: document.documentElement.scrollWidth > innerWidth };
    });
    // A landscape illustration on a portrait screen is bounded by its width.
    // Require the large-screen height benefit up to that uncropped limit.
    expect(geometry.paintedHeight).toBeGreaterThan(Math.min(viewport.height * .44, geometry.maximumUncroppedHeight * .95));
    expect(geometry.bottom).toBeLessThanOrEqual(viewport.height);
    expect(geometry.textTop).toBeGreaterThanOrEqual(geometry.imageBottom - 1);
    expect(geometry.overflowX).toBe(false);
    await expect(reader.getByRole("button", { name: "Next", exact: true })).toBeInViewport();
    await page.screenshot({ path: info.outputPath("fullscreen-story.png") });
    await reader.getByRole("button", { name: "Next", exact: true }).click();
    await expect(reader.locator(".story-quest-position")).toHaveText("Scene 2");
    await page.keyboard.press("Escape");
    await expect(reader).not.toHaveClass(/fullscreen/);
    await expect(page.locator("#root")).toHaveJSProperty("inert", false);
    await expect(reader.locator('summary[aria-label="More story controls"]')).toBeFocused();
  });
}

for (const viewport of [{ width: 1920, height: 1080 }, { width: 1024, height: 768 }, { width: 320, height: 568 }, { width: 568, height: 320 }]) {
  test(`Hollow controls stay above the saved room at ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => localStorage.setItem("lp-hollow:child-surface-preview", JSON.stringify({
      purchases: [{ id: "owned-jar", item: "hollow-glow-jar", cost: 20, at: "2026-09-30T00:00:00Z" }], feeds: [], chests: [],
      layout: { at: "2026-09-30T00:00:00Z", equipped: {}, slots: { s1: "hollow-glow-jar" } }
    })));
    await page.goto("/preview/child-surfaces.html?surface=my-hollow");
    await expect(page.locator('[data-decoration-id="hollow-glow-jar"]')).toHaveCount(1);
    const controls = page.locator(".hollow-entry-controls"), scene = page.locator(".hollow-home-scene");
    const boxes = { controls: await controls.boundingBox(), scene: await scene.boundingBox() };
    expect(boxes.scene.y).toBeGreaterThanOrEqual(boxes.controls.y + boxes.controls.height - 1);
    await scene.scrollIntoViewIfNeeded();
    await expect(scene).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.screenshot({ path: info.outputPath("hollow-room.png") });
    await page.getByRole("button", { name: "My Guide", exact: true }).click();
    await expect(page.getByRole("heading", { name: "My Guide", exact: true })).toBeVisible();
  });
}

test("children can browse every reviewed app level and still open the real reader", async ({ page }) => {
  const library = getRuntimeGuidedReadingBooks();
  await page.goto("/preview/child-surfaces.html?surface=reading-library");
  const picker = page.getByRole("navigation", { name: "Book levels", exact: true });
  await expect(picker).toBeVisible();
  const levels = [...new Set(library.map(book => getBookTextAnalysis(book).appReadingLevel))].filter(Boolean);
  expect(levels.length).toBeGreaterThanOrEqual(4);
  for (const level of levels) {
    await picker.getByRole("button", { name: `App level ${level}`, exact: true }).click();
    const cards = page.locator(".kg-book-card");
    const expected = library.filter(book => getBookTextAnalysis(book).appReadingLevel === level);
    await expect(cards).toHaveCount(expected.length);
    expect(await cards.locator("[data-book-level]").allTextContents()).toEqual(expected.map(() => `App level ${level}`));
    await expect(cards.first()).toContainText("Lexile pending");
  }
  await page.locator(".kg-book-card").first().click();
  await expect(page.locator(".guided-reader-shell.fullscreen")).toBeVisible();
});

test("teachers can browse the same reviewed levels across every book type", async ({ page }) => {
  test.setTimeout(90_000);
  const library = getRuntimeGuidedReadingBooks();
  await page.goto("/preview/guided-reading-preview.html?book=ab-a-01&mode=teacher");
  await page.getByRole("button", { name: "Back to reading library", exact: true }).click();
  const picker = page.getByRole("navigation", { name: "Book levels", exact: true });
  await expect(picker).toBeVisible();
  const levels = [...new Set(library.map(book => getBookTextAnalysis(book).appReadingLevel))].filter(Boolean);
  for (const level of levels) {
    await picker.getByRole("button", { name: `App level ${level}`, exact: true }).click();
    const cards = page.locator(".guided-book-card");
    await expect(cards.first()).toContainText(`App level ${level}`);
    await expect(cards.first()).toContainText("Lexile pending");
    await cards.first().locator("summary").click();
    await expect(cards.first().locator(".guided-book-analysis-detail p").first()).toBeVisible();
  }
  await picker.getByRole("button", { name: "All levels", exact: true }).click();
  await expect(picker.getByRole("button", { name: "All levels", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("searchbox", { name: "Search books for a word", exact: true }).fill("said");
  const searchCard = page.locator(".guided-word-search-results .guided-book-card").first();
  await expect(searchCard).toContainText("Lexile pending");
  await searchCard.getByText("About this level", { exact: true }).click();
  await expect(searchCard.locator(".guided-book-analysis-detail p").first()).toBeVisible();
});
