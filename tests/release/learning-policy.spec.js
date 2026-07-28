import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

function blockingViolations(result) {
  return result.violations
    .filter(violation => ["serious", "critical"].includes(violation.impact))
    .map(violation => ({
      id: violation.id,
      targets: violation.nodes.map(node => node.target.join(" "))
    }));
}

test("A4.1/A4.2 sparse evidence is withheld by the versioned live UI policy", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto("/preview/learning-policy.html");

  const preview = page.locator('[data-preview-surface="learning-policy"]');
  await expect(preview).toHaveAttribute("data-learning-policy-version", "2026.07.28-a4.3b");

  await preview.getByRole("button", { name: "Open Amara" }).click();
  const studentDetails = preview.getByRole("region", { name: "Student details: Amara" });
  const resultSummary = studentDetails.getByLabel("Amara results summary");
  const accuracy = resultSummary
    .locator(".teacher-roster-metric")
    .filter({ hasText: "Accuracy across skills" });
  await expect(studentDetails).toBeVisible();
  await expect(accuracy).toContainText("Not enough results");
  await expect(accuracy).toContainText("1 scored answer from the last 90 days.");
  await expect(preview.getByText("100% accuracy")).toHaveCount(0);
  await expect(accuracy).not.toContainText("100%");

  const axe = await new AxeBuilder({ page })
    .include('[aria-label="Student details: Amara"]')
    .analyze();
  expect(blockingViolations(axe)).toEqual([]);
  expect(pageErrors).toEqual([]);
});
