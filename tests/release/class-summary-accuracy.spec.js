import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("A4.3 class summary shows both weighted views, counts, and weak-comparability suppression", async ({
  page
}) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto("/preview/learning-policy.html");

  const preview = page.locator('[data-preview-surface="learning-policy"]');
  await expect(preview).toHaveAttribute("data-learning-policy-version", "2026.07.28-a4.3b");
  await preview.getByText("Class overview", { exact: true }).click();

  const summary = preview.getByRole("region", { name: "Class summary" });
  const accuracy = summary
    .locator(".teacher-roster-metric-accuracy")
    .filter({ hasText: "Class accuracy" });
  const heldBack = summary.locator("[data-class-average-suppressed]");
  await expect(heldBack).toHaveAttribute("data-class-average-suppressed", "true");
  await expect(accuracy).toContainText("Not enough results yet");

  await accuracy.getByText("See both averages", { exact: true }).click();
  const learnerWeighted = accuracy.locator("dl > div").filter({
    hasText: "Averaging students equally"
  });
  const responseWeighted = accuracy.locator("dl > div").filter({
    hasText: "Averaging every answer equally"
  });
  await expect(learnerWeighted.locator("dt")).toHaveText("Averaging students equally");
  await expect(learnerWeighted.locator("dd")).toContainText("66%");
  await expect(learnerWeighted.locator("dd")).toContainText(
    "2 students with at least 8 scored answers each."
  );
  await expect(responseWeighted.locator("dt")).toHaveText("Averaging every answer equally");
  await expect(responseWeighted.locator("dd")).toContainText("71.9%");
  await expect(responseWeighted.locator("dd")).toContainText(
    "32 scored answers from 2 students."
  );
  await expect(
    summary.getByText(
      /Only 2 students of 3 have done enough assessments so far/
    )
  ).toBeVisible();

  const axe = await new AxeBuilder({ page })
    .include('[aria-label="Class summary"]')
    .analyze();
  expect(
    axe.violations.filter(violation => ["serious", "critical"].includes(violation.impact))
  ).toEqual([]);
  expect(pageErrors).toEqual([]);
});
