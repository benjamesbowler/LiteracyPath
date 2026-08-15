import { expect, test } from "@playwright/test";
import {
  chooseStudentReportView
} from "./support/studentReportNavigation.js";
import { completeTeacherClassEntry } from "./support/teacherLanding.js";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";
const CLASS_ID = "00000000-0000-4000-8000-0000000000a1";
const STUDENT_ID = "student-aarav";
const AUDIT_CLASS_A_ID = "30000000-0000-4000-8000-000000000001";
const AARAV_ID = "40000000-0000-4000-8000-000000000001";

async function logIn(page) {
  if (!teacherPassword) {
    throw new Error(
      "LP_AUDIT_TEACHER_PASSWORD is required for the teacher navigation and scale gate."
    );
  }
  await page.goto("/");
  await page.getByRole("button", {
    name: "Teachers: Literacy Guide Teacher Tools"
  }).click();
  await page.getByRole("textbox", { name: "Email" })
    .fill("audit-teacher-a@literacypath.invalid");
  await page.getByLabel("Password", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await completeTeacherClassEntry(page);
}

test("Reports funnel restores report choices through refresh, Back and Forward and focuses its final action", async ({
  page
}) => {
  const reportRoute =
    `/preview/teacher-a11y.html?surface=progress#teacher/reports?class=${CLASS_ID}`
    + `&learner=${STUDENT_ID}&report=skills-check&show=1`;
  await page.goto(reportRoute);
  const previewResult = page.getByRole("region", { name: "Preview report result" });
  await expect(previewResult.getByRole("heading")).toHaveText("skills-check");
  await page.reload();
  await expect(previewResult.getByRole("heading")).toHaveText("skills-check");

  await page.evaluate(({ classId, studentId }) => {
    window.location.hash = `#teacher/reports?class=${classId}&learner=${studentId}&report=hfw&show=1`;
  }, { classId: CLASS_ID, studentId: STUDENT_ID });
  await expect(previewResult.getByRole("heading")).toHaveText("hfw");

  await page.goBack();
  await expect(previewResult.getByRole("heading")).toHaveText("skills-check");
  await page.goForward();
  await expect(previewResult.getByRole("heading")).toHaveText("hfw");

  await page.goto(
    `/preview/teacher-a11y.html?surface=progress#teacher/reports?class=${CLASS_ID}`
    + `&learner=${STUDENT_ID}`
  );
  const reportStep = page.locator(".teacher-funnel-step[data-step='3']");
  await reportStep.getByRole("button", { name: /^Skills/ }).click();
  const showReport = page.getByRole("button", { name: "Show the report", exact: true });
  await expect(showReport).toBeFocused();
  await expect(page).toHaveURL(/report=skills-check/);
  await showReport.click();
  await expect(page).toHaveURL(/report=skills-check.*show=1|show=1.*report=skills-check/);
  await expect(previewResult.getByRole("heading")).toHaveText("skills-check");
});

test("authenticated Reports funnel keeps its visible report, URL and browser history together", async ({
  page
}) => {
  test.setTimeout(60_000);
  await logIn(page);
  await page.goto(
    `/#teacher/reports?class=${AUDIT_CLASS_A_ID}&learner=${AARAV_ID}`
  );
  await expect(page.getByRole("heading", {
    name: "Open a report",
    exact: true
  })).toBeVisible({ timeout: 20_000 });
  const reportStep = page.locator(".teacher-funnel-step[data-step='3']");
  await reportStep.getByRole("button", { name: /^Skills/ }).click();
  const showReport = page.getByRole("button", { name: "Show the report", exact: true });
  await expect(showReport).toBeFocused();
  await showReport.click();
  await expect(page.getByRole("heading", { name: "Skills", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/report=skills-check.*show=1|show=1.*report=skills-check/);

  await chooseStudentReportView(page, "hfw");
  await expect(page.getByRole("heading", {
    name: "High-frequency words",
    exact: true
  })).toBeVisible();
  await expect(page).toHaveURL(/report=hfw.*show=1|show=1.*report=hfw/);
  await page.reload();
  await expect(page.getByRole("heading", {
    name: "High-frequency words",
    exact: true
  })).toBeVisible({ timeout: 20_000 });

  await page.goBack();
  await expect(page.getByRole("heading", { name: "Skills", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/report=skills-check.*show=1|show=1.*report=skills-check/);
  await page.goForward();
  await expect(page.getByRole("heading", {
    name: "High-frequency words",
    exact: true
  })).toBeVisible();
  await expect(page).toHaveURL(/report=hfw.*show=1|show=1.*report=hfw/);
});

test("the report student chooser bounds a 40-pupil class to eight keyboard choices", async ({
  page
}) => {
  await page.goto(
    `/preview/teacher-a11y.html?surface=progress&students=40`
    + `#teacher/reports?class=${CLASS_ID}&learner=${STUDENT_ID}`
  );
  const studentStep = page.locator(".teacher-funnel-step[data-step='2']");
  const change = studentStep.getByRole("button", { name: "Change", exact: true });
  if (await change.count()) await change.click();

  const picker = studentStep.locator(".teacher-funnel-student-picker-panel");
  const search = picker.getByRole("searchbox", { name: "Find a student" });
  const studentButtons = picker.getByRole("list", {
    name: "Students in this class"
  }).getByRole("button");
  await expect(studentButtons).toHaveCount(8);
  await expect(picker).toContainText("Showing 1–8 of 40 students");

  await search.focus();
  for (let index = 0; index < 9; index += 1) await page.keyboard.press("Tab");
  await expect(picker.getByRole("button", { name: "Next", exact: true })).toBeFocused();

  await picker.getByRole("button", { name: "Next", exact: true }).click();
  await expect(picker).toContainText("Page 2 of 5");
  await expect(studentButtons.first()).toHaveText("Learner 009");
  await search.fill("Learner 040");
  await expect(studentButtons).toHaveCount(1);
  await expect(studentButtons.first()).toHaveText("Learner 040");
});

// 2026-07-29: the v2 Assessments screen scopes ONE select to the class instead
// of a paged picker, so a 40-pupil class is one control away from any student
// and reaching the last one costs no paging at all.
test("the assessment student chooser reaches any of 40 pupils in one control", async ({
  page
}) => {
  await page.goto(
    `/preview/teacher-a11y.html?surface=assess&students=40`
    + `#teacher/assessments?class=${CLASS_ID}&learner=${STUDENT_ID}`
  );
  const select = page.locator(".teacher-assess-panel-student select");
  await expect(select).toBeVisible();
  await expect(select.locator("option")).toHaveCount(41);
  await expect(select).toHaveCSS("min-height", "44px");
  await select.selectOption({ label: "Learner 040" });
  await expect(select.locator("option:checked")).toHaveText("Learner 040");
  // Changing the student stays on this page.
  await expect(page.getByRole("heading", { name: "Assess a student", exact: true }))
    .toBeVisible();
  await expect(page.locator('[data-teacher-funnel="checks"]')).toBeVisible();
});

test("a 105-pupil roster uses a compact page window with ellipses", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/preview/teacher-a11y.html?surface=classes&students=105");
  const pagination = page.getByRole("navigation", { name: "Student roster pages" });
  await expect(pagination).toContainText("Page 1 of 11");
  await expect(pagination.getByRole("button", { name: "Page 1", exact: true }))
    .toHaveAttribute("aria-current", "page");
  await expect(pagination.getByRole("button", { name: "Page 5", exact: true })).toBeVisible();
  await expect(pagination.getByRole("button", { name: "Page 6", exact: true })).toHaveCount(0);
  await expect(pagination.locator(".teacher-roster-pagination-ellipsis")).toHaveCount(1);

  await pagination.getByRole("button", { name: "Page 5", exact: true }).click();
  await expect(pagination.getByRole("button", { name: "Page 5", exact: true }))
    .toHaveAttribute("aria-current", "page");
  await expect(pagination.getByRole("button", { name: "Page 2", exact: true })).toHaveCount(0);
  await expect(pagination.getByRole("button", { name: "Page 6", exact: true })).toBeVisible();
  await expect(pagination.locator(".teacher-roster-pagination-ellipsis")).toHaveCount(2);
});

test("archived students stay searchable and bounded to ten rows per page", async ({
  page
}) => {
  await page.goto("/preview/teacher-a11y.html?surface=classes&archived=25");
  const archived = page.getByRole("region", { name: "Archived students", exact: true });
  await archived.getByText("Archived students (25)", { exact: true }).click();

  const archivedList = archived.getByRole("list", {
    name: "Matching archived students",
    exact: true
  });
  const pagination = archived.getByRole("navigation", {
    name: "Archived student pages",
    exact: true
  });
  await expect(archivedList.getByRole("listitem")).toHaveCount(10);
  await expect(archivedList).toContainText("Archived learner 001");
  await expect(archivedList).not.toContainText("Archived learner 011");
  await expect(pagination).toContainText("Page 1 of 3");
  await expect(pagination.getByRole("button", {
    name: "Archived page 1",
    exact: true
  })).toHaveAttribute("aria-current", "page");

  await pagination.getByRole("button", {
    name: "Archived page 3",
    exact: true
  }).click();
  await expect(archivedList.getByRole("listitem")).toHaveCount(5);
  await expect(archivedList).toContainText("Archived learner 021");
  await expect(archivedList).toContainText("Archived learner 025");

  const search = archived.getByRole("searchbox", {
    name: "Search archived students",
    exact: true
  });
  await search.fill("Archived learner 025");
  await expect(archivedList.getByRole("listitem")).toHaveCount(1);
  await expect(archivedList).toContainText("Archived learner 025");
  await expect(archived).toContainText("Showing 1–1 of 1 matching archived students");
  await expect(pagination).toHaveCount(0);

  await search.fill("No such student");
  await expect(archivedList).toHaveCount(0);
  await expect(archived.getByText(
    "No archived students match this search.",
    { exact: true }
  )).toBeVisible();
  await archived.getByRole("button", {
    name: "Clear archived search",
    exact: true
  }).click();
  await expect(archivedList.getByRole("listitem")).toHaveCount(10);
  await expect(pagination).toContainText("Page 1 of 3");
});

test("formal EL assessment progress is labelled as a teacher-facing assessment plan", async ({
  page
}) => {
  await page.goto("/preview/teacher-a11y.html?surface=assessment");
  await page.getByText("Review answers or instructions", { exact: true }).click();
  const plan = page.getByRole("complementary", {
    name: "Assessment plan and progress",
    exact: true
  });

  await expect(plan).toBeVisible();
  await expect(plan).toContainText("Assessment plan");
  await expect(plan).toContainText("starting reading stage");
  await expect(plan).not.toContainText(/\bassessment route\b/i);
  await expect(plan).not.toContainText(/\bmicrophase\b/i);
});

test("teacher rail sections and sign-out remain reachable at 667 by 320", async ({ page }) => {
  await page.setViewportSize({ width: 667, height: 320 });
  await page.goto("/preview/teacher-a11y.html?surface=today");
  const primary = page.getByTestId("teacher-primary-nav");
  for (const label of [
    "Dashboard",
    "Students",
    "Assessments",
    "Reports",
    "Resources",
    "Settings"
  ]) {
    const button = primary.getByRole("button", { name: label, exact: true });
    await button.focus();
    await expect(button).toBeFocused();
    await expect(button).toBeInViewport();
  }
  const signOut = page.getByRole("button", {
    name: "Sign out audit-teacher-a@literacypath.invalid"
  });
  await expect(signOut).toBeVisible();
  await expect(signOut).toBeInViewport();
});

test("Today shows at most three urgent rows and Assess a student opens Assessments", async ({
  page
}) => {
  test.setTimeout(60_000);
  await logIn(page);
  await page.getByLabel("Current class").selectOption({ label: "Audit Class A" });
  const priorityGrid = page.locator(".teacher-today-priority-grid");
  await expect(priorityGrid).toBeVisible({ timeout: 20_000 });
  const visibleUrgentRows = priorityGrid.locator(":scope > section > ul > li");
  expect(await visibleUrgentRows.count()).toBeLessThanOrEqual(3);

  await page.getByRole("button", { name: "Assess a student", exact: true }).click();
  await expect(page.getByRole("heading", {
    name: "Assess a student",
    exact: true
  })).toBeVisible();
  await expect(page).toHaveURL(/#teacher\/assessments/);
});
