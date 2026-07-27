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
  const policySurface = preview.locator("[data-learning-policy-version]");
  await expect(policySurface).toHaveAttribute("data-learning-policy-version", "2026.07.24-a4.3");
  await expect(preview.getByText(/Not enough evidence for an accuracy conclusion/)).toBeVisible();
  await expect(preview.getByText("Not enough evidence · 1 of 8 required attempts", { exact: true })).toBeVisible();
  await expect(preview.getByText("1 scored response", { exact: true })).toBeVisible();
  await expect(preview.getByText("100% accuracy")).toHaveCount(0);

  const notEnoughBand = preview
    .locator(".teacher-progress-distribution-list li")
    .filter({ hasText: "Fewer than 8" });
  await expect(notEnoughBand).toContainText("1");
  await expect(preview.getByRole("button", { name: "Review Amara evidence" })).toBeVisible();
  await expect(
    preview.getByRole("button", { name: "m Not enough evidence · 10 recorded encounters" })
  ).toBeVisible();
  await expect(preview.getByText("2 of 1", { exact: true })).toHaveCount(0);

  const axe = await new AxeBuilder({ page })
    .include('[data-preview-surface="learning-policy"]')
    .analyze();
  expect(blockingViolations(axe)).toEqual([]);
  expect(pageErrors).toEqual([]);
});
