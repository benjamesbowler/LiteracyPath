import { expect, test } from "@playwright/test";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";
const denseAnalyticsJargon = /\b(?:confidence interval|denominator|outlier|percentile|instructional group|weighted average)\b/i;

async function logIn(page) {
  if (!teacherPassword) {
    throw new Error("LP_AUDIT_TEACHER_PASSWORD is required for the report-audience gate.");
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" }).click();
  await page.getByRole("textbox", { name: "Email" }).fill("audit-teacher-a@literacypath.invalid");
  await page.getByLabel("Password", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({
    timeout: 20_000
  });
}

async function openAaravReport(page) {
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Students", exact: true })
    .click();
  await page.getByLabel("Current class").selectOption({ label: "Audit Class A" });
  const rosterAdmin = page.locator(".teacher-roster-admin");
  if (!await rosterAdmin.evaluate(element => element.open)) {
    await rosterAdmin.locator(":scope > summary").click();
  }
  const aaravRow = page.locator(".teacher-roster-table").getByRole("row").filter({ hasText: "Aarav" });
  await aaravRow.getByRole("button", { name: "Open student", exact: true }).click();
  await page.getByRole("region", { name: "Student details: Aarav" })
    .getByRole("button", { name: "Review Aarav’s progress", exact: true })
    .click();
  const aaravReport = page.getByRole("article").filter({
    has: page.getByRole("heading", { name: "Aarav", exact: true })
  });
  await aaravReport.getByRole("button", { name: "Open report", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeVisible({
    timeout: 20_000
  });
}

test("@report-audience-templates keeps Aarav's reachable report brief and audience-safe", async ({
  page
}) => {
  await logIn(page);
  await openAaravReport(page);

  // 2026-07-26: teacher copy no longer says "child" or "has been exposed to" — the
  // report nav is "Student reports" and tiles read "Aarav answered X 4 times".
  const reportNav = page.getByRole("navigation", { name: "Student reports" });
  await expect(reportNav.getByRole("link")).toHaveCount(4);
  for (const view of ["Overview", "Skills", "HFW / sight words", "EL formal report"]) {
    await expect(reportNav.getByRole("link", {
      name: new RegExp(`^${view.replace("/", "\\/")}`)
    })).toBeVisible();
  }

  await reportNav.getByRole("link", { name: /^Skills/ }).click();
  const firstTile = page.locator(".simple-report-tile").first();
  await expect(firstTile).toContainText(/Aarav answered/i);
  await expect(firstTile).toContainText(/correct answer/i);
  const reportText = await page.locator(".lg-report-main").innerText();
  expect(reportText).not.toMatch(denseAnalyticsJargon);
  expect(reportText).not.toMatch(/[£$€¥]/u);
});
