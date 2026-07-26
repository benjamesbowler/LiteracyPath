import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("A4.7 an event interrupted offline remains durable and recovers after reload", async ({
  context,
  page
}) => {
  await page.goto("/preview/engagement-sync.html");
  await context.setOffline(true);

  const failed = await page.evaluate(() => window.__engagementChaos.enqueueAndFlush());
  expect(failed.result.failed).toBe(1);
  expect(failed.health.pending).toBe(1);
  expect(failed.health.lost).toBe(0);
  await expect(page.getByRole("definition").nth(2)).toHaveText("1");

  await context.setOffline(false);
  await page.route("**/preview/engagement-event-endpoint", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true })
  }));
  await page.reload();
  const recovered = await page.evaluate(() => window.__engagementChaos.flush());

  expect(recovered.result.delivered).toBe(1);
  expect(recovered.result.recovered).toBe(1);
  expect(recovered.health.pending).toBe(0);
  expect(recovered.health.delivered).toBe(1);
  expect(recovered.health.lost).toBe(0);
});

test("A4.7 overlapping client flushes deliver and count one event exactly once", async ({
  page
}) => {
  await page.goto("/preview/engagement-sync.html");

  const result = await page.evaluate(() => window.__engagementChaos.concurrentClientFlush());

  expect(result.eventRpcCalls).toBe(1);
  expect(result.health.attempted).toBe(1);
  expect(result.health.delivered).toBe(1);
  expect(result.health.pending).toBe(0);
  expect(result.health.lost).toBe(0);
});

test("A4.7 teachers see per-class pending, recovered, loss, and threshold alert", async ({
  page
}) => {
  await page.goto("/preview/engagement-sync.html");

  const panel = page.getByRole("region", { name: "Saving and syncing" });
  await expect(panel).toHaveAttribute("data-sync-health-status", "alert");
  await expect(panel).toHaveAttribute("data-sync-health-version", "2026.07.24-a4.7");
  await expect(panel.getByRole("alert").first()).toHaveText("Sync loss alert");
  await expect(panel.getByRole("definition").filter({ hasText: "97 of 100" })).toBeVisible();
  await expect(panel.getByText("9", { exact: true })).toBeVisible();
  await expect(panel.getByText("3", { exact: true })).toBeVisible();
  await expect(panel).toContainText("Some results may not have reached the dashboard.");

  const axe = await new AxeBuilder({ page })
    .include('[aria-label="Saving and syncing"]')
    .analyze();
  expect(
    axe.violations.filter(violation => ["serious", "critical"].includes(violation.impact))
  ).toEqual([]);
});
