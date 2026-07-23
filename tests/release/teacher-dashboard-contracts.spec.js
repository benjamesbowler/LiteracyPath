import { expect, test } from "@playwright/test";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";

async function logIn(page, email) {
  if (!teacherPassword) {
    throw new Error("LP_AUDIT_TEACHER_PASSWORD is required for the reachable teacher route gate.");
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" }).click();
  await expect(page.getByRole("heading", { name: "Teacher login" })).toBeVisible();
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Class roster|Audit Class A/ })).toBeVisible({
    timeout: 20_000
  });
}

async function selectAuditClass(page) {
  const classSelect = page.getByLabel("Current class");
  await classSelect.selectOption({ label: "Audit Class A" });
  await expect(page.getByRole("heading", { name: "Audit Class A", exact: true })).toBeVisible();
}

async function openAaravReports(page) {
  const roster = page.locator(".teacher-roster-table");
  const aaravRow = roster.getByRole("row").filter({ hasText: "Aarav" });
  await aaravRow.getByRole("button", { name: "Open", exact: true }).click();
  const studentOverview = page.locator(".teacher-overview-dashboard");
  await expect(studentOverview).toBeVisible({ timeout: 20_000 });
  await expect(studentOverview.getByRole("heading", { name: "Aarav", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reports", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Reports", exact: true })).toBeVisible();
}

test("@teacher-dashboard-data reachable seeded roster columns and rows", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await logIn(page, "audit-teacher-a@literacypath.invalid");
  await selectAuditClass(page);
  await expect(page.getByText("QA7M2K", { exact: true })).toBeVisible();

  const roster = page.locator(".teacher-roster-table");
  await expect(roster).toBeVisible();
  for (const column of [
    "Display name",
    "Focus",
    "Progress",
    "Sound Seekers",
    "Login",
    "Last Active",
    "Actions"
  ]) {
    await expect(roster.getByRole("columnheader", { name: column, exact: true })).toBeVisible();
  }
  await expect(roster.locator("tbody > tr")).toHaveCount(13);
  for (const learner of ["Aarav", "Aisha", "Amara", "Bao", "Camila"]) {
    await expect(roster.getByText(learner, { exact: true })).toBeVisible();
  }
  expect(pageErrors).toEqual([]);
});

test("@product-finish-surface reachable reports, formal EL evidence, and exports", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await logIn(page, "audit-teacher-a@literacypath.invalid");
  await selectAuditClass(page);
  await openAaravReports(page);
  await expect(page.locator(".report-choice-student").getByRole("heading", { name: "Aarav" })).toBeVisible();
  for (const report of ["Whole Child", "EL Assessments", "Guided Reading", "Skills Check", "Other Learning"]) {
    await expect(page.getByRole("heading", { name: report, exact: true })).toBeVisible();
  }
  await expect(page.getByText(
    "See formal checkpoint results, skill progress and question-level evidence.",
    { exact: true }
  )).toBeVisible();

  await page.getByRole("button", { name: "Class Report", exact: true }).click();
  await expect(page.getByRole("button", { name: "Export Class PDF", exact: true })).toBeVisible();
  await expect(page.getByLabel("Class Report").getByText("Aarav", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Student Report", exact: true }).click();
  await page.getByRole("button", { name: "Open EL Assessments", exact: true }).click();
  await expect(page.getByRole("heading", { name: "EL Assessments", exact: true })).toBeVisible({
    timeout: 20_000
  });
  await expect(page.getByRole("heading", { name: "Assessments 1 and 2", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Assessments 3-6", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Print or save PDF", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download EL data", exact: true })).toBeVisible();

  expect(pageErrors).toEqual([]);
});

test("@release-readiness-surface reachable admin release workflow", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await logIn(page, "audit-admin@literacypath.invalid");
  await page.getByRole("button", { name: "Admin", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Admin Dashboard", exact: true })).toBeVisible();
  await page.getByRole("tab", { name: /Release Check/ }).click();

  const releasePanel = page.locator(".release-readiness-panel");
  await expect(releasePanel).toBeVisible();
  await expect(releasePanel.getByRole("heading", { name: "Cleanup Tools", exact: true })).toBeVisible();
  await expect(releasePanel.getByRole("heading", { name: "Content QA Workflow", exact: true })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
