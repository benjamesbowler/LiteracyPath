import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("@calibration-dashboard renders the guarded seeded monitoring surface", async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/tests/fixtures/calibration-monitoring.html");

  const panel = page.getByRole("region", { name: "Calibration monitoring", exact: true });
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute("data-calibration-state", "seeded_preview");
  await expect(panel).toHaveAttribute("data-calibration-source", "seeded_preview");
  await expect(panel).toHaveAttribute("data-human-validation", "not_started");
  await expect(panel.getByText("Seeded preview", { exact: true })).toBeVisible();
  await expect(panel.getByText(
    "Synthetic demonstration data — not real child evidence.",
    { exact: true }
  )).toBeVisible();
  const summary = panel.getByLabel("Calibration preview summary");
  await expect(summary).toBeVisible();
  await expect(summary.getByText("72", { exact: true })).toBeVisible();
  await expect(summary.getByText("1,440 item events", { exact: true })).toBeVisible();
  await expect(summary.getByText("10", { exact: true })).toBeVisible();
  await expect(summary.getByText("5", { exact: true })).toBeVisible();
  await expect(summary.getByText("2", { exact: true })).toBeVisible();
  await expect(summary.getByText("none adjudicated", { exact: false })).toBeVisible();
  await expect(summary.getByText(
    "Screening flags, not bias findings",
    { exact: true }
  )).toBeVisible();
  await expect(panel.getByText(
    "Seeded item-difficulty monitoring",
    { exact: true }
  )).toBeVisible();
  await expect(panel.getByText(
    "Declared subgroup performance with small-cell suppression",
    { exact: true }
  )).toBeVisible();
  await expect(panel.getByText(
    "Matched differential item behavior screening",
    { exact: true }
  )).toBeVisible();
  await expect(panel.getByText("Specialist review", { exact: true })).toHaveCount(2);
  await expect(panel).not.toContainText("calibration complete");
  await expect(panel).not.toContainText("validated fair");

  const layout = await page.evaluate(() => ({
    bodyOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    panelOverflow: document.querySelector(".calibration-monitoring").scrollWidth
      - document.querySelector(".calibration-monitoring").clientWidth,
    disclaimerVisible: Boolean(
      document.querySelector(".calibration-disclaimer")?.getBoundingClientRect().height
    )
  }));
  expect(layout.bodyOverflow).toBeLessThanOrEqual(1);
  expect(layout.panelOverflow).toBeLessThanOrEqual(1);
  expect(layout.disclaimerVisible).toBe(true);

  const axeResult = await new AxeBuilder({ page }).include(".calibration-monitoring").analyze();
  expect(axeResult.violations.filter(
    violation => violation.impact === "serious" || violation.impact === "critical"
  )).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
