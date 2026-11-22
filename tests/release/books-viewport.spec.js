import { expect, test } from "@playwright/test";
import { STUDENT_DEVICE_PROFILES, STUDENT_MINIMUM_TARGET_PX } from "../../src/policy/studentDeviceMatrix.js";
import { getRuntimeGuidedReadingBooks } from "../../src/utils/guidedReading/runtimeBooks.js";
import { readBookShelf } from "./helpers/bookShelf.js";

async function expectCompleteChoices(container, selector, { paneSelector, minSize = STUDENT_MINIMUM_TARGET_PX } = {}) {
  const result = await container.evaluate((root, { selector, paneSelector, minSize }) => {
    const pane = paneSelector ? root.closest(paneSelector).getBoundingClientRect() : root.getBoundingClientRect();
    const choices = [...root.querySelectorAll(selector)].filter(node => node.getClientRects().length && getComputedStyle(node).visibility === "visible");
    const failures = choices.flatMap(node => {
      const { left, top, right, bottom, width, height } = node.getBoundingClientRect();
      const inFrame = width >= minSize - 1 && height >= minSize - 1 && left >= pane.left - 1 && top >= pane.top - 1
        && right <= pane.right + 1 && bottom <= pane.bottom + 1 && left >= -1 && top >= -1
        && right <= innerWidth + 1 && bottom <= innerHeight + 1;
      const receivesTap = node.contains(document.elementFromPoint((left + right) / 2, (top + bottom) / 2));
      return inFrame && receivesTap ? [] : [{ label: node.getAttribute("aria-label") || node.textContent.trim(), left, top, right, bottom, inFrame, receivesTap }];
    });
    return { count: choices.length, failures };
  }, { selector, paneSelector, minSize });
  expect(result.count).toBeGreaterThan(0);
  expect(result.failures).toEqual([]);
}

for (const profile of STUDENT_DEVICE_PROFILES) {
  test(`Books and Find a book show all current choices in the frame at ${profile.id}`, async ({ page }, info) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: profile.width, height: profile.height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/preview/child-surfaces.html?surface=reading-library", { waitUntil: "domcontentloaded" });
    const shelf = page.locator(".kg-books");
    const card = shelf.locator(".kg-book-card").first();
    await expect(card).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expectCompleteChoices(shelf, "button", { paneSelector: ".kg-main" });
    const cover = card.locator(".kg-book-cover");
    await expect(cover).toHaveAttribute("data-book-cover-state", "ready");
    expect((await cover.boundingBox()).height).toBeGreaterThan(25);
    const firstTitle = await card.locator(".kg-book-title").textContent();
    const pages = shelf.getByRole("navigation", { name: "Books pages" });
    await pages.getByRole("button", { name: "Next", exact: true }).click();
    await expect(shelf).toHaveAttribute("data-book-page", "2");
    await expect(card.locator(".kg-book-title")).not.toHaveText(firstTitle);
    await expectCompleteChoices(shelf, "button", { paneSelector: ".kg-main" });
    await pages.getByRole("button", { name: "Previous", exact: true }).click();
    await expect(card.locator(".kg-book-title")).toHaveText(firstTitle);
    await expect(shelf.locator('.kg-book-cover:not([data-book-cover-state="ready"])')).toHaveCount(0);
    await page.screenshot({ path: info.outputPath("books.png") });

    const find = shelf.getByRole("button", { name: "Find a book", exact: true });
    await find.click();
    const dialog = page.getByRole("dialog", { name: "Find a book" });
    await expect(dialog).toBeVisible();
    await expectCompleteChoices(dialog, "button, select");
    await dialog.getByRole("button", { name: "Read again", exact: true }).click();
    await expectCompleteChoices(dialog, "button, select");
    await dialog.getByRole("button", { name: "Clear filters", exact: true }).click();
    await page.screenshot({ path: info.outputPath("find-a-book.png") });

    await dialog.getByRole("button", { name: "About App levels A–H", exact: true }).click();
    for (let index = 0; index < 5; index++) {
      await expectCompleteChoices(dialog, "button");
      if (index < 4) await dialog.getByRole("button", { name: "Next", exact: true }).click();
    }
    await dialog.getByRole("button", { name: "Back to filters", exact: true }).click();
    await dialog.getByRole("button", { name: "Find by title", exact: true }).click();
    await expectCompleteChoices(dialog, "button, input");
    await dialog.getByRole("searchbox", { name: "Book title", exact: true }).fill("Emperor Penguins and Their Relatives");
    await dialog.getByRole("button", { name: "See 1 book", exact: true }).click();
    await expect(find).toBeFocused();
    await expect(card.locator(".kg-book-title")).toHaveText("Emperor Penguins and Their Relatives");
    await expectCompleteChoices(shelf, "button", { paneSelector: ".kg-main" });
    await expect(cover).toHaveAttribute("data-book-cover-state", "ready");
    await card.click();
    const reader = page.locator(".guided-reader-shell.fullscreen");
    await expect(reader).toBeVisible();
    const more = reader.getByLabel("More reader controls", { exact: true });
    await more.click();
    const tools = reader.locator(".guided-transport-options-panel");
    await expectCompleteChoices(tools, "button");
    await tools.getByRole("button", { name: "About this book", exact: true }).click();
    await expectCompleteChoices(tools, "button");
    const textMeasure = tools.getByRole("button", { name: "Text measure", exact: true });
    if (await textMeasure.isVisible()) await textMeasure.click();
    await expect(tools.getByRole("region", { name: "About this book" }).locator("p").last()).toBeInViewport({ ratio: 1 });
    await page.keyboard.press("Escape");
    await expect(more).toBeFocused();
    await reader.getByRole("button", { name: "Back to Books", exact: true }).click();
    await expect(card).toBeFocused();
    await expect(card.locator(".kg-book-title")).toHaveText("Emperor Penguins and Their Relatives");
  });
}

test("visible Book page controls reach each eligible book once", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/preview/child-surfaces.html?surface=reading-library", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".kg-book-card").first()).toBeVisible();
  const reached = (await readBookShelf(page)).map(book => book.id);
  const eligible = getRuntimeGuidedReadingBooks().map(book => book.id);
  expect(reached.toSorted()).toEqual(eligible.toSorted());
  expect(await page.locator(".kg-books").evaluate(node => node.scrollTop)).toBe(0);
});

for (const { width, height, keyboardHeight } of [
  { width: 320, height: 568, keyboardHeight: 340 }, { width: 568, height: 320, keyboardHeight: 260 }
]) {
  test(`Find by title keeps the input and results control visible at ${width}x${keyboardHeight}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height });
    await page.goto("/preview/child-surfaces.html?surface=reading-library", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Find a book", exact: true }).click();
    await page.getByRole("button", { name: "Find by title", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Find a book" });
    const title = dialog.getByRole("searchbox", { name: "Book title", exact: true });
    await title.focus();
    await page.setViewportSize({ width, height: keyboardHeight });
    await expectCompleteChoices(dialog, "button, input");
    await title.fill("Emperor Penguins and Their Relatives");
    await expect(title).toHaveValue("Emperor Penguins and Their Relatives");
    await expectCompleteChoices(dialog, "button, input");
    const results = dialog.getByRole("button", { name: "See 1 book", exact: true });
    await expect(results).toBeInViewport({ ratio: 1 });
    await results.click();
    await page.setViewportSize({ width, height });
    await expect(page.locator(".kg-book-title")).toHaveText("Emperor Penguins and Their Relatives");
  });
}
