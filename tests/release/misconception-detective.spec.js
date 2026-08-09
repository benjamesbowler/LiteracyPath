import { expect, test } from "@playwright/test";

test("Misconception Detective shows a cautious repeated-error hypothesis and teaching move", async ({ page }) => {
  await page.goto("/preview/teacher-a11y.html?surface=today&misconception=1");
  const panel = page.getByRole("region", { name: "Repeated wrong-answer patterns" });
  await expect(panel).toContainText("not diagnoses");
  await expect(panel).toContainText("Aarav");
  await expect(panel).toContainText("3 times across 3 days");
  await expect(panel).toContainText("middle vowel");
  await expect(panel).toContainText("Contrast pan with pin");
  await expect(panel.getByRole("button", { name: "Open student" })).toBeVisible();
});

test("Misconception Detective fails closed when history is unavailable", async ({ page }) => {
  await page.goto("/preview/teacher-a11y.html?surface=today&misconception=1&misconception-error=1");
  await expect(page.getByRole("alert")).toContainText("no pattern claim is shown");
});
