import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("A4.4 child recommendation gives one brief visible reason", async ({ page }) => {
  await page.goto("/preview/student-home-preview.html");

  const explanation = page.locator(
    '[data-child-surface="student-home"] [data-recommendation-explanation="child"]'
  );
  await expect(explanation).toBeVisible();
  await expect(explanation).toHaveText("This is your next step in today’s adventure.");
  await expect(explanation).toHaveAttribute("data-recommendation-policy", "recommendation-explanation");
  await expect(explanation).toHaveAttribute("data-recommendation-version", "2026.07.24-a4.4");
  await expect(explanation).toHaveAttribute("data-recommendation-surface", "student-home");

  const axe = await new AxeBuilder({ page })
    .include('[data-home-priority="primary"]')
    .analyze();
  expect(
    axe.violations.filter(violation => ["serious", "critical"].includes(violation.impact))
  ).toEqual([]);
});

test("A4.4 teacher recommendations disclose evidence, dependency, confidence, and unlock", async ({
  page
}) => {
  await page.goto("/preview/teacher-a11y.html?surface=today");

  const explanations = page.locator('[data-recommendation-explanation="teacher"]');
  await expect(explanations).not.toHaveCount(0);
  const explanation = explanations.first();
  await expect(explanation).toHaveAttribute("data-recommendation-policy", "recommendation-explanation");
  await expect(explanation).toHaveAttribute("data-recommendation-version", "2026.07.24-a4.4");
  await expect(explanation).toHaveAttribute("data-recommendation-surface", "teacher-today");
  await explanation.locator("summary").click();
  await expect(explanation.locator("dt")).toHaveText([
    "Results used",
    "Why now",
    "How certain",
    "What next"
  ]);
  for (const field of ["Results used", "Why now", "How certain", "What next"]) {
    const row = explanation.locator("div").filter({ has: page.getByText(field, { exact: true }) });
    await expect(row.locator("dd")).not.toBeEmpty();
  }

  const axe = await new AxeBuilder({ page })
    .include('[data-recommendation-explanation="teacher"]')
    .analyze();
  expect(
    axe.violations.filter(violation => ["serious", "critical"].includes(violation.impact))
  ).toEqual([]);
});
