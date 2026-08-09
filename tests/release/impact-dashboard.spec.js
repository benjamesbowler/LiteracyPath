import { expect, test } from "@playwright/test";

test("Impact Dashboard compares equal learner windows and exports its evidence basis", async ({ page }) => {
  await page.goto("/preview/teacher-a11y.html?surface=progress");
  await page.getByRole("button", { name: "Open Impact Dashboard" }).click();
  const dashboard = page.getByRole("main", { name: "Impact Dashboard" });
  await expect(dashboard).toContainText("+50.0 pp");
  await expect(dashboard).toContainText("2 of 3 students had at least 5 scored answers in each window");
  await expect(dashboard).toContainText("observed association, not proof");
  await expect(dashboard.getByRole("table")).toContainText("CVC Short Vowels");

  await page.evaluate(() => {
    window.__impactDownload = {};
    URL.createObjectURL = blob => { window.__impactDownload.blob = blob; return "blob:impact"; };
    URL.revokeObjectURL = () => {};
    HTMLAnchorElement.prototype.click = function click() { window.__impactDownload.name = this.download; };
  });
  await dashboard.getByRole("button", { name: "Download evidence CSV" }).click();
  const download = await page.evaluate(async () => ({
    name: window.__impactDownload.name,
    csv: await window.__impactDownload.blob.text()
  }));
  expect(download.name).toContain("observed-change.csv");
  expect(download.csv).toContain("observed_association_not_causal_impact");
  expect(download.csv).toContain("minimum_responses_per_learner_per_window");
});

test("Impact Dashboard is phone-safe and keeps the wide evidence table contained", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/preview/teacher-a11y.html?surface=progress");
  await page.getByRole("button", { name: "Open Impact Dashboard" }).click();
  const dashboard = page.getByRole("main", { name: "Impact Dashboard" });
  const metrics = await dashboard.evaluate(element => ({
    pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    tableContainerScrolls: element.querySelector(".impact-skills").scrollWidth > element.querySelector(".impact-skills").clientWidth
  }));
  expect(metrics.pageOverflow).toBe(0);
  expect(metrics.tableContainerScrolls).toBe(true);
});
