import { expect, test } from "@playwright/test";
import {
  chooseStudentReportView
} from "./support/studentReportNavigation.js";
import {
  auditClassForEmail,
  completeTeacherClassEntry,
  openTeacherClassControls,
  selectTeacherClassFromStudents
} from "./support/teacherLanding.js";
import {
  expectStudentRoster,
  openStudentPanel,
  studentRosterHeading
} from "./support/teacherStudents.js";
import {
  readDownloadWorkbook,
  worksheetRowsAsObjects,
  worksheetText
} from "./support/workbookDownload.js";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";
const AUDIT_CLASS_A_ID = "30000000-0000-4000-8000-000000000001";
const AARAV_ID = "40000000-0000-4000-8000-000000000001";

async function logIn(page, email) {
  if (!teacherPassword) {
    throw new Error("LP_AUDIT_TEACHER_PASSWORD is required for the authenticated teacher E2E gate.");
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" }).click();
  await expect(page.getByRole("heading", { name: "Teacher sign-in" })).toBeVisible();
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await completeTeacherClassEntry(page, auditClassForEmail(email));
}

async function openClass(page, className) {
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Students", exact: true })
    .click();
  await selectTeacherClassFromStudents(page, className);
  return expectStudentRoster(page, className);
}

test("A10.7 teacher A completes login → class → learner → assessment → report → parsed export", async ({
  page
}) => {
  test.setTimeout(120_000);
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await logIn(page, "audit-teacher-a@literacypath.invalid");
  const roster = await openClass(page, "Audit Class A");
  const studentDetail = await openStudentPanel(page, roster, "Aarav");
  // One click to a check: the Student panel starts it directly.
  await expect(studentDetail.getByRole("button", { name: /^Assess Aarav$/ })).toBeEnabled();
  const compactViewport = (page.viewportSize()?.width || 1280) <= 560;
  if (compactViewport) {
    // The student panel intentionally fills a phone. Its own primary report
    // action is the reachable fast path; the collapsed rail remains behind
    // the panel until the teacher closes it.
    await studentDetail.getByRole("button", { name: "Open report", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Summary", exact: true })).toBeVisible();
    await chooseStudentReportView(page, "skills-check");
  } else {
    // 2026-07-27: Reports is one page - class, who, report - and the report
    // opens in place at the end of it rather than on a separate screen.
    await page.getByTestId("teacher-primary-nav")
      .getByRole("button", { name: "Reports", exact: true })
      .click();
    await expect(page.getByRole("heading", { name: "Open a report", exact: true })).toBeVisible();
    // The report funnel preserves the owned class and student selected on the
    // Students page. Open step 3 to choose the report instead of re-answering
    // the first two questions.
    await expect(page.locator(".teacher-funnel-step[data-step='1']")).toContainText("Audit Class A");
    await expect(page.locator(".teacher-funnel-step[data-step='2']")).toContainText("Aarav");
    const reportStep = page.locator(".teacher-funnel-step[data-step='3']");
    if (await reportStep.getByRole("button", { name: "Change", exact: true }).count()) {
      await reportStep.getByRole("button", { name: "Change", exact: true }).click();
    }
    await reportStep.getByRole("button", { name: /^Skills/ }).click();
    await page.getByRole("button", { name: "Show the report", exact: true }).click();
  }
  const skillsHeading = page.getByRole("heading", { name: "Skills", exact: true });
  await expect(skillsHeading).toBeVisible();
  const reportContextHeading = compactViewport
    ? skillsHeading
    : page.locator("#teacher-funnel-report-title");
  await expect(reportContextHeading).toBeVisible();
  await expect(reportContextHeading).toBeFocused();
  await expect.poll(async () => reportContextHeading.evaluate(element => ({
    outlineStyle: getComputedStyle(element).outlineStyle,
    outlineWidth: getComputedStyle(element).outlineWidth
  }))).toEqual({ outlineStyle: "solid", outlineWidth: "3px" });
  // Once the teacher has made all three choices, the report is the task. The
  // completed chooser must not occupy the laptop fold above the first result.
  await expect(page.getByRole("heading", { name: "Open a report", exact: true })).toBeHidden();
  await expect(page.locator(".teacher-funnel-step[data-step='1']")).toBeHidden();
  await expect.poll(async () => {
    const box = await skillsHeading.boundingBox();
    return box?.y ?? Number.POSITIVE_INFINITY;
  }).toBeLessThan(page.viewportSize()?.height || 720);

  const provenance = page.getByRole("region", { name: "About this report" });
  await expect(provenance).toContainText("Aarav");
  await expect(provenance).toContainText("Audit Class A");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download skills assessment data", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/i);
  const workbook = await readDownloadWorkbook(download);
  expect(workbook.worksheets.map(sheet => sheet.name)).toEqual(["Report", "Skills", "Data"]);
  const dataRows = worksheetRowsAsObjects(workbook.getWorksheet("Data"));
  const provenanceRows = dataRows.filter(row => row["Row type"] === "Report detail");
  const assessmentRows = dataRows.filter(row => row["Row type"] === "Assessment attempt");
  const questionRows = dataRows.filter(row => row["Row type"] === "Question result");
  const dataText = worksheetText(workbook.getWorksheet("Data"));

  expect(provenanceRows.length).toBeGreaterThanOrEqual(10);
  expect(assessmentRows.length).toBeGreaterThanOrEqual(520);
  expect(questionRows.length).toBeGreaterThanOrEqual(520);
  expect(dataText).toContain("Aarav");
  expect(dataText).toContain("Audit Class A");
  expect(dataText).not.toMatch(/Attempt ID|Question ID|audit-long-history|audit-item-/i);
  expect(pageErrors).toEqual([]);
});

test("A9.7 @teacher-route-deep-link owned class report survives refresh and browser history", async ({
  page
}) => {
  test.setTimeout(90_000);
  await logIn(page, "audit-teacher-a@literacypath.invalid");

  const skillsCheckRoute =
    `/#teacher/reports/report?class=${AUDIT_CLASS_A_ID}&learner=${AARAV_ID}&report=skills-check`;
  await page.goto(skillsCheckRoute);
  const skillsHeading = page.getByRole("heading", { name: "Skills", exact: true });
  await expect(skillsHeading).toBeVisible({
    timeout: 20_000
  });
  await expect(skillsHeading).toBeFocused();
  await expect(page.getByRole("region", { name: "About this report" })).toContainText("Aarav");
  await expect(page).toHaveURL(new RegExp(
    `#teacher/reports/report\\?class=${AUDIT_CLASS_A_ID}&learner=${AARAV_ID}&report=skills-check$`
  ));

  await page.reload();
  const reloadedSkillsHeading = page.getByRole("heading", { name: "Skills", exact: true });
  await expect(reloadedSkillsHeading).toBeVisible({
    timeout: 20_000
  });
  await expect(reloadedSkillsHeading).toBeFocused();
  await expect(page.getByRole("region", { name: "About this report" })).toContainText("Audit Class A");

  await chooseStudentReportView(page, "whole-child");
  await expect(page.getByRole("heading", { name: "Summary", exact: true })).toBeVisible();
  await expect(page).toHaveURL(new RegExp("report=whole-child$"));

  await page.goBack();
  await expect(page.getByRole("heading", { name: "Skills", exact: true })).toBeVisible({
    timeout: 20_000
  });
  await expect(page).toHaveURL(new RegExp("report=skills-check$"));
});

test("A9.7 @teacher-route-deep-link a failed class read preserves and resumes the exact report link", async ({
  page
}) => {
  test.setTimeout(90_000);
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  let refuseClassRead = true;
  await page.route("**/rest/v1/classes?**", async route => {
    const requestUrl = new URL(route.request().url());
    const isTeacherClassList = requestUrl.searchParams.has("teacher_id")
      && String(requestUrl.searchParams.get("select") || "").includes("leaderboard_scope");
    if (refuseClassRead && isTeacherClassList) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          code: "AUDIT_CLASSES_UNAVAILABLE",
          message: "Intentional release-gate class failure"
        })
      });
      return;
    }
    await route.continue();
  });

  const reportRoute =
    `/#teacher/reports/report?class=${AUDIT_CLASS_A_ID}&learner=${AARAV_ID}&report=skills-check`;
  await page.goto(reportRoute);

  await expect(page.getByRole("button", { name: "Try loading again", exact: true })).toBeVisible({
    timeout: 20_000
  });
  await expect(page).toHaveURL(new RegExp(
    `#teacher/reports/report\\?class=${AUDIT_CLASS_A_ID}&learner=${AARAV_ID}&report=skills-check$`
  ));
  const shell = page.locator(".lg-app-shell");
  await expect(shell).toHaveAttribute("data-teacher-class-id", AUDIT_CLASS_A_ID);
  await expect(shell).toHaveAttribute("data-teacher-learner-id", "");

  refuseClassRead = false;
  await page.getByRole("button", { name: "Try loading again", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Skills", exact: true })).toBeVisible({
    timeout: 20_000
  });
  await expect(page.getByRole("region", { name: "About this report" })).toContainText("Aarav");
  await expect(page).toHaveURL(new RegExp(
    `#teacher/reports/report\\?class=${AUDIT_CLASS_A_ID}&learner=${AARAV_ID}&report=skills-check$`
  ));
});

test("A9.7 @teacher-route-deep-link a failed roster read preserves and resumes the exact report link", async ({
  page
}) => {
  test.setTimeout(90_000);
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  let refuseRosterRead = true;
  await page.route("**/rest/v1/students?**", async route => {
    const requestUrl = new URL(route.request().url());
    const isAuditClassRoster = requestUrl.searchParams.get("class_id") === `eq.${AUDIT_CLASS_A_ID}`
      && String(requestUrl.searchParams.get("select") || "").includes("symbol_password");
    if (refuseRosterRead && isAuditClassRoster) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          code: "AUDIT_ROSTER_UNAVAILABLE",
          message: "Intentional release-gate roster failure"
        })
      });
      return;
    }
    await route.continue();
  });

  const reportRoute =
    `/#teacher/reports/report?class=${AUDIT_CLASS_A_ID}&learner=${AARAV_ID}&report=skills-check`;
  await page.goto(reportRoute);

  await expect(page.getByRole("heading", { name: "Open a report", exact: true })).toBeVisible({
    timeout: 20_000
  });
  await expect(page).toHaveURL(new RegExp(
    `#teacher/reports/report\\?class=${AUDIT_CLASS_A_ID}&learner=${AARAV_ID}&report=skills-check$`
  ));
  const shell = page.locator(".lg-app-shell");
  await expect(shell).toHaveAttribute("data-teacher-class-id", AUDIT_CLASS_A_ID);
  await expect(shell).toHaveAttribute("data-teacher-learner-id", "");

  refuseRosterRead = false;
  await page.getByRole("button", { name: "Try loading students again", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Skills", exact: true })).toBeVisible({
    timeout: 20_000
  });
  await expect(page.getByRole("region", { name: "About this report" })).toContainText("Aarav");
  await expect(page).toHaveURL(new RegExp(
    `#teacher/reports/report\\?class=${AUDIT_CLASS_A_ID}&learner=${AARAV_ID}&report=skills-check$`
  ));
});

test("A9.7 @teacher-roster-read-state a failed roster read stays retryable and never becomes an empty class", async ({
  page
}) => {
  let refuseRosterRead = true;
  let markSuccessfulRetryStarted;
  let releaseSuccessfulRetry;
  const successfulRetryStarted = new Promise(resolve => {
    markSuccessfulRetryStarted = resolve;
  });
  const successfulRetryMayFinish = new Promise(resolve => {
    releaseSuccessfulRetry = resolve;
  });
  await page.route("**/rest/v1/students?**", async route => {
    const requestUrl = new URL(route.request().url());
    const isAuditClassRoster = requestUrl.searchParams.get("class_id") === `eq.${AUDIT_CLASS_A_ID}`
      && String(requestUrl.searchParams.get("select") || "").includes("symbol_password");
    if (refuseRosterRead && isAuditClassRoster) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          code: "AUDIT_ROSTER_UNAVAILABLE",
          message: "Intentional release-gate roster failure"
        })
      });
      return;
    }
    if (!refuseRosterRead && isAuditClassRoster) {
      markSuccessfulRetryStarted();
      await successfulRetryMayFinish;
    }
    await route.continue();
  });

  await logIn(page, "audit-teacher-a@literacypath.invalid");
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Students", exact: true })
    .click();
  await selectTeacherClassFromStudents(page, "Audit Class A");

  const rosterState = page.locator(
    '.teacher-dashboard-roster [data-teacher-surface="classes"][data-teacher-state="partial"]'
  );
  await expect(rosterState).toContainText("The student list could not be confirmed");
  await expect(page.getByText("Add your first student to Audit Class A.", { exact: true }))
    .toHaveCount(0);
  await expect(page.getByText("0 students", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Aarav", { exact: true })).toHaveCount(0);

  // A failed retry replaces the button with a live loading status, then returns
  // keyboard focus to the new retry control instead of dropping it on <body>.
  await rosterState.getByRole("button", { name: "Try loading again", exact: true }).click();
  await expect(rosterState).toBeVisible({ timeout: 20_000 });
  await expect(
    rosterState.getByRole("button", { name: "Try loading again", exact: true })
  ).toBeFocused();

  refuseRosterRead = false;
  const successfulRetryClick = rosterState
    .getByRole("button", { name: "Try loading again", exact: true })
    .click();
  await successfulRetryStarted;
  const loadingState = page.locator(
    '.teacher-dashboard-roster [data-teacher-surface="classes"][data-teacher-state="loading"]'
  );
  await expect(loadingState).toBeFocused();
  releaseSuccessfulRetry();
  await successfulRetryClick;
  const roster = page.locator(".teacher-roster-table");
  await expect(roster.getByRole("row").filter({ hasText: "Aarav" })).toBeVisible();
  await expect(page.getByText("12 students", { exact: true })).toBeVisible();
  await expect(studentRosterHeading(page, "Audit Class A")).toBeFocused();
});

test("A10.7 @teacher-route-denial teacher B cannot discover or deep-link into teacher A's class or learner", async ({
  page
}) => {
  await logIn(page, "audit-teacher-b@literacypath.invalid");
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Students", exact: true })
    .click();

  const classSelect = await openTeacherClassControls(page);
  await expect(classSelect.locator("option").filter({ hasText: "Audit Class A" })).toHaveCount(0);
  await expect(classSelect.locator("option").filter({ hasText: "Audit Class B" })).toHaveCount(1);

  await page.goto(
    `/#teacher/reports/report?class=${AUDIT_CLASS_A_ID}&learner=${AARAV_ID}&report=skills-check`
  );
  // 2026-07-27: a rejected deep link now falls back to the Reports funnel,
  // which is where the teacher would have had to start anyway.
  await expect(page.getByRole("heading", { name: "Open a report", exact: true })).toBeVisible({
    timeout: 20_000
  });

  await expect(page.getByLabel("Class", { exact: true }).locator("option")
    .filter({ hasText: "Audit Class A" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Child progress results: Aarav" }))
    .toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Skills", exact: true })).toHaveCount(0);
});
