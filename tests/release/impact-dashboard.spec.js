import { expect, test } from "@playwright/test";

test("Impact Dashboard compares equal learner windows and exports its evidence basis", async ({ page }) => {
  await page.goto("/preview/teacher-a11y.html?surface=progress");
  await page.getByRole("button", { name: "Open Impact Dashboard" }).click();
  const dashboard = page.getByRole("main", { name: "Observed Change" });
  await expect(dashboard).toContainText("Not enough comparable evidence yet");
  await expect(dashboard).toContainText("2 of 3 students had at least 5 scored answers in each window");
  await expect(dashboard).toContainText("observed association, not proof");
  await expect(dashboard.getByRole("button", { name: "Download evidence CSV" })).toBeDisabled();
});

test("Impact Dashboard is phone-safe and keeps the wide evidence table contained", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/teacher-a11y.html?surface=progress");
  await page.getByRole("button", { name: "Open Impact Dashboard" }).click();
  const dashboard = page.getByRole("main", { name: "Observed Change" });
  const metrics = await dashboard.evaluate(element => ({
    pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    controls: [...element.querySelectorAll("button, select")].map(control => Math.round(control.getBoundingClientRect().height))
  }));
  expect(metrics.pageOverflow).toBe(0);
  expect(Math.min(...metrics.controls)).toBeGreaterThanOrEqual(44);
});
