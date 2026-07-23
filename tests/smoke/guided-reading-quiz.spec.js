import { expect, test } from "@playwright/test";

test.describe("Guided Reading post-book quiz", () => {
  test("keeps focus, scoring, progression, and reset state reliable", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));

    await page.goto("/guided-reading-preview.html?book=level-c-nonfiction-01-bees&quiz=1");

    const dialog = page.getByRole("dialog", { name: "Book quiz" });
    const firstQuestion = page.getByRole("heading", { name: "What sweet liquid do worker bees collect?" });
    await expect(dialog).toBeVisible();
    await expect(firstQuestion).toBeFocused();

    await page.getByRole("button", { name: "sap", exact: true }).click();
    await expect(dialog.getByRole("status").filter({ hasText: "Not that one - try again!" })).toBeVisible();

    await page.getByRole("button", { name: "nectar", exact: true }).click();
    const secondQuestion = page.getByRole("heading", { name: "Why is moving pollen between flowers important?" });
    await expect(secondQuestion).toBeVisible();
    await expect(secondQuestion).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest("[role='dialog']")))).toBe(true);

    await page.getByRole("button", { name: "it helps plants make seeds", exact: true }).click();
    const thirdQuestion = page.getByRole("heading", { name: "Which action does the book recommend to help bees?" });
    await expect(thirdQuestion).toBeVisible();
    await expect(thirdQuestion).toBeFocused();

    await page.getByRole("button", { name: "plant flowers", exact: true }).click();
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
});
