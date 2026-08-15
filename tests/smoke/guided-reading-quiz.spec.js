import { expect, test } from "@playwright/test";
import { GUIDED_READING_QUIZZES } from "../../src/data/generated/guidedReadingQuizzes.generated.js";

const BOOK_ID = "level-c-nonfiction-01-bees";
const BOOK_QUIZ = GUIDED_READING_QUIZZES[BOOK_ID];

test.describe("Guided Reading post-book quiz", () => {
  test("keeps focus, scoring, progression, and reset state reliable", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));

    await page.goto(`/preview/guided-reading-preview.html?book=${BOOK_ID}&quiz=1`);

    const dialog = page.getByRole("dialog", { name: "Book quiz" });
    const firstQuestion = page.getByRole("heading", { name: BOOK_QUIZ.questions[0].prompt });
    await expect(dialog).toBeVisible();
    await expect(firstQuestion).toBeFocused();

    const firstWrongAnswer = BOOK_QUIZ.questions[0].choices.find(choice => choice !== BOOK_QUIZ.questions[0].answer);
    await page.getByRole("button", { name: firstWrongAnswer, exact: true }).click();
    await expect(dialog.getByRole("status").filter({ hasText: "Not that one - try again!" })).toBeVisible();

    await page.getByRole("button", { name: BOOK_QUIZ.questions[0].answer, exact: true }).click();
    const secondQuestion = page.getByRole("heading", { name: BOOK_QUIZ.questions[1].prompt });
    await expect(secondQuestion).toBeVisible();
    await expect(secondQuestion).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest("[role='dialog']")))).toBe(true);

    await page.getByRole("button", { name: BOOK_QUIZ.questions[1].answer, exact: true }).click();
    const thirdQuestion = page.getByRole("heading", { name: BOOK_QUIZ.questions[2].prompt });
    await expect(thirdQuestion).toBeVisible();
    await expect(thirdQuestion).toBeFocused();

    await page.getByRole("button", { name: BOOK_QUIZ.questions[2].answer, exact: true }).click();
    const result = dialog.getByRole("status");
    await expect(result).toContainText("2/3 right on the first try!");
    await expect(result).toBeFocused();
    await expect(page.getByText("Preview finished: 2/3", { exact: true })).toBeVisible();

    const viewport = page.viewportSize();
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBeLessThanOrEqual(viewport.width);
    expect(pageErrors).toEqual([]);

    await page.reload();
    await expect(firstQuestion).toBeVisible();
    await expect(firstQuestion).toBeFocused();
    await expect(page.getByText("Question 1 of 3", { exact: true })).toBeVisible();
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
