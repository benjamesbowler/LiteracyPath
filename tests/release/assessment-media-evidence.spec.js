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

test("A3.10 failed answer evidence is removed, refilled, and never scored", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto("/preview/assessment-media-evidence.html");

  const preview = page.locator('[data-preview-surface="assessment-media-evidence"]');
  await expect(preview).toHaveAttribute("data-failure-count", "1");
  await expect(preview).toHaveAttribute(
    "data-round-question-ids",
    "replacement-picture-item,second-safe-picture-item"
  );
  await expect(
    page.locator('[data-assessment-question-id="replacement-picture-item"]')
  ).toBeVisible();
  await expect(page.getByText("Question 1 of 2", { exact: true })).toBeVisible();
  await expect(page.getByText(/Correct!|Let's learn from that one/)).toHaveCount(0);

  const evidenceImages = page.locator('img[data-assessment-media-kind="evidence"]');
  await expect(evidenceImages).toHaveCount(2);
  await expect(evidenceImages.nth(0)).toHaveAttribute("alt", "Picture of sun");
  await expect(evidenceImages.nth(1)).toHaveAttribute("alt", "A folded map");
  await expect(evidenceImages.nth(0)).toHaveAttribute("data-assessment-media-role", "choice");
  await expect.poll(async () => evidenceImages.evaluateAll(images => (
    images.every(image => image.complete && image.naturalWidth > 0)
  ))).toBe(true);

  const decoration = page.locator('[data-assessment-media-kind="decorative"]');
  await expect(decoration).toHaveCount(1);
  await expect(decoration).toHaveAttribute("aria-hidden", "true");

  const axe = await new AxeBuilder({ page })
    .include('[data-preview-surface="assessment-media-evidence"]')
    .analyze();
  expect(blockingViolations(axe)).toEqual([]);
  expect(pageErrors).toEqual([]);
});
