import { expect, test } from "@playwright/test";
import { readDownloadWorkbook, worksheetText } from "./support/workbookDownload.js";

test.setTimeout(90000);

for (const width of [1366, 1024, 390]) {
  test(`teaching actions stay before maintenance and preserve evidence scope at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/preview/teacher-a11y.html?surface=today&focus-evidence=1");
    await expect(page.getByRole("heading", { name: "Do next", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Plan focused practice for Aisha in Initial Sounds" })).toBeVisible();
    await expect(page.locator(".teacher-today-metrics")).toBeHidden();
    await expect(page.locator(".teacher-today-priority-grid")).toContainText("Observed difficulty");
    await expect(page.locator(".teacher-today-priority-grid")).toContainText("Latest saved activity");
    await page.goto("/preview/teacher-a11y.html?surface=classes&focus-evidence=1");
    const row = page.getByRole("row").filter({ has: page.getByRole("button", { name: "View Aisha", exact: true }) });
    await expect(row.getByRole("button", { name: "View Aisha", exact: true })).toBeVisible();
    await expect(row.getByRole("button", { name: "Assess Aisha", exact: true })).toBeVisible();
    await expect(row.getByRole("button", { name: "Remove Aisha from class", exact: true })).toBeHidden();
    await expect(page.getByRole("columnheader", { name: "Focus accuracy", exact: true })).toHaveCount(0);
    await row.getByRole("button", { name: "View Aisha", exact: true }).click();
    const panel = page.getByRole("region", { name: "Student details: Aisha", exact: true });
    await expect(panel).toContainText("Current focus:");
    await expect(panel.getByRole("button", { name: "Plan focused practice for Aisha", exact: true })).toBeVisible();
    await expect(panel.getByRole("button", { name: "Start assessment", exact: true })).toBeEnabled();
    await expect(panel.getByText("Across skills:", { exact: true })).toBeHidden();
    await panel.locator(".teacher-student-panel-evidence > summary").click();
    await expect(panel.locator(".teacher-student-panel-summary").filter({ hasText: "Across skills:" })).toContainText("Not enough results");
    await expect(panel.getByRole("button", { name: /sign-in pictures for Aisha/ })).toBeHidden();
    await panel.locator(".teacher-student-manage > summary").click();
    await expect(panel.getByRole("button", { name: /sign-in pictures for Aisha/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `.artifacts/app-simplification/teacher/roster-${width}.png`, fullPage: true, animations: "disabled" });
  });
}

test("Summary keeps detailed evidence one step away, retains every source item, and exports the named workbook", async ({ page }) => {
  await page.goto("/preview/teacher-a11y.html?surface=report");
  await page.locator('.lg-report-nav a[href*="whole-child"]').click();
  const priority = page.getByRole("region", { name: "Current instructional priority" });
  await expect(priority).toContainText("Collect current independent answers before choosing what to teach next.");
  await expect(priority.getByRole("button", { name: "Start assessment", exact: true })).toBeEnabled();
  await expect(priority.getByRole("button", { name: "Plan focused practice", exact: true })).toHaveCount(0);
  await expect(page.locator(".simple-report-coverage")).not.toHaveAttribute("open", "");
  await page.locator(".simple-report-coverage > summary").click();
  await expect(page.locator(".simple-report-coverage")).toHaveAttribute("open", "");
  await expect(page.locator(".simple-report-intro")).toContainText("of 126 items have saved answers");
  const evidence = page.getByRole("region", { name: "All source items by literacy domain" });
  expect(await evidence.locator("details[open]").count()).toBeGreaterThan(0);
  await expect(evidence).not.toContainText("Nothing is in this group yet");
  for (const group of await evidence.locator("details").all()) {
    if (!await group.evaluate(element => element.open)) await group.locator(":scope > summary").click();
    const showAll = group.getByRole("button", { name: /^Show all \d+$/ });
    if (await showAll.count()) await showAll.click();
  }
  await expect(evidence.locator(".simple-report-tile")).toHaveCount(126);
  await page.locator(".lg-report-export-menu > summary").click();
  await expect(page.locator(".lg-report-export-options")).toContainText("Aarav · Summary");
  await expect(page.locator(".lg-report-export-options")).toContainText("progress across tabs");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download progress and results workbook (XLSX)", exact: true }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toMatch(/^aarav-progress-\d{4}-\d{2}-\d{2}\.xlsx$/);
  const workbook = await readDownloadWorkbook(download);
  expect(workbook.worksheets.map(sheet => sheet.name)).toEqual(["Report", "Skills", "Data"]);
  expect(worksheetText(workbook.getWorksheet("Skills"))).toContain("Not assessed");
  expect(worksheetText(workbook.getWorksheet("Data"))).toContain("About this report");
  await page.screenshot({ path: ".artifacts/app-simplification/teacher/report-summary.png", fullPage: true, animations: "disabled" });
});

test("report print preparation restores disclosures after the print dialog closes", async ({ page }) => {
  await page.goto("/preview/teacher-a11y.html?surface=report");
  await page.locator('.lg-report-nav a[href*="whole-child"]').click();
  const before = await page.locator(".lg-report-main details").evaluateAll(rows => rows.map(row => row.open));
  await page.evaluate(() => { window.print = () => { window.__printExpanded = [...document.querySelectorAll('.lg-report-main details')].every(row => row.open); window.dispatchEvent(new Event('afterprint')); }; });
  await page.locator(".lg-report-export-menu > summary").click();
  await page.getByRole("button", { name: "Print current summary / Save as PDF", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__printExpanded)).toBe(true);
  expect(await page.locator(".lg-report-main details").evaluateAll(rows => rows.map(row => row.open))).toEqual(before);
});
