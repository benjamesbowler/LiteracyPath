import { expect, test } from "@playwright/test";

const BOOK_ID = "level-c-nonfiction-01-bees";

test.describe("Guided Reading reader", () => {
  test("finishing a book saves completion and returns without questions", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));

    await page.goto(`/preview/guided-reading-preview.html?book=${BOOK_ID}`);
    const finishBook = page.getByRole("button", { name: /finish book/i });
    for (let pageNumber = 0; pageNumber < 20 && await finishBook.count() === 0; pageNumber += 1) {
      await page.getByRole("button", { name: /next page/i }).click();
    }
    await expect(finishBook).toBeVisible();
    await finishBook.click();

    await expect(page.getByRole("region", { name: /full-screen reader$/ })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Reading library" })).toBeVisible();
    await expect(page.getByRole("dialog", { name: /quiz|questions/i })).toHaveCount(0);
    await expect(page.getByText(/talk and write/i)).toHaveCount(0);
    expect(await page.evaluate(bookId => window.__guidedReadingPreviewRecords?.[bookId]?.completed, BOOK_ID)).toBe(true);
    expect(pageErrors).toEqual([]);
  });

  test("opens the requested reader and keeps keyboard page navigation current", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));

    await page.goto(`/preview/guided-reading-preview.html?book=${BOOK_ID}`);

    const reader = page.getByRole("region", { name: /full-screen reader$/ });
    await expect(reader).toBeVisible();
    await expect(reader.getByRole("heading", { name: "Honeybees and Pollination" })).toBeVisible();
    await expect(reader.getByText(/Page 1 of \d+/, { exact: true })).toBeVisible();

    await page.keyboard.press("ArrowRight");
    await expect(reader.getByText(/Page 2 of \d+/, { exact: true })).toBeVisible();

    await page.keyboard.press("ArrowLeft");
    await expect(reader.getByText(/Page 1 of \d+/, { exact: true })).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test("student reader replaces internal book metadata with a child-friendly level badge", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));

    await page.goto("/preview/guided-reading-preview.html?book=moonwood-tales-c-25");

    const reader = page.getByLabel("One Night in the Deep Dark full-screen reader");
    await expect(reader).toBeVisible();
    await expect(reader.getByText("Level C", { exact: true })).toBeVisible();
    await expect(reader).not.toContainText("level-c");
    await expect(reader).not.toContainText("moonwood-tales");
    await expect(reader).not.toContainText("longer-story-pages");
    expect(pageErrors).toEqual([]);
  });
});
