import { expect, test } from "@playwright/test";
import {
  chooseStudentReportView,
  expectStudentReportViewsAvailable
} from "./support/studentReportNavigation.js";
import {
  expectAdminSectionAvailable,
  expectAdminSectionUnavailable,
  openAdminArea,
  openAdminSection
} from "./adminNavigation.js";
import { auditClassForEmail, completeTeacherClassEntry } from "./support/teacherLanding.js";
import {
  expectStudentRoster,
  openStudentPanel,
  openStudentSettings
} from "./support/teacherStudents.js";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";
const AUDIT_CLASS_A_ID = "30000000-0000-4000-8000-000000000001";
const AARAV_ID = "40000000-0000-4000-8000-000000000001";

async function logIn(page, email) {
  if (!teacherPassword) {
    throw new Error("LP_AUDIT_TEACHER_PASSWORD is required for the reachable teacher route gate.");
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" }).click();
  await expect(page.getByRole("heading", { name: "Teacher sign-in" })).toBeVisible();
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await completeTeacherClassEntry(page, auditClassForEmail(email));
  await expect(page.locator('[data-teacher-product="class-dashboard"]')).toBeVisible();
  await expect(page.locator(".admin-dashboard")).toHaveCount(0);
}

async function selectAuditClass(page, className = "Audit Class A") {
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Students", exact: true })
    .click();
  const classSelect = page.getByLabel("Current class");
  await classSelect.selectOption({ label: className });
  await expect(classSelect.locator("option:checked")).toHaveText(className);
  return expectStudentRoster(page, className);
}

async function openAaravReports(page) {
  const roster = page.locator(".teacher-roster-table");
  const studentDetail = await openStudentPanel(page, roster, "Aarav");
  // The Student panel opens that child's report directly - it already knows who
  // it is about, so there is no picker in between.
  await studentDetail.getByRole("button", { name: "Open report", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Summary", exact: true })).toBeVisible({
    timeout: 20_000
  });
  await expect(page.locator(".lg-report-topbar-copy").getByText("Aarav", { exact: true })).toBeVisible();
}

async function readDownloadText(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function recordPageErrors(page) {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  return errors;
}

function recordConsoleErrors(page) {
  const errors = [];
  page.on("console", message => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

test("@teacher-six-intention-ia @teacher-assessment-hub @teacher-contextual-help uses six clear, separate sections", async ({
  page
}) => {
  const pageErrors = recordPageErrors(page);
  const consoleErrors = recordConsoleErrors(page);
  await logIn(page, "audit-teacher-a@literacypath.invalid");

  const primaryNav = page.getByTestId("teacher-primary-nav");
  const intentButtons = primaryNav.locator(":scope > .lg-sb-intent > .lg-sb-item");
  const expectedSections = ["Dashboard", "Students", "Assessments", "Reports", "Resources", "Settings"];
  await expect(intentButtons).toHaveCount(expectedSections.length);
  for (const [index, label] of expectedSections.entries()) {
    await expect(intentButtons.nth(index)).toHaveAttribute("aria-label", label);
  }

  // The roster shortcut stays: an assessment can still start from a row, and lands on
  // the same funnel with the class and the student already answered.
  const roster = await selectAuditClass(page);
  await expect(
    roster.getByRole("button", { name: /^Assess / }).first()
  ).toBeVisible();

  // 2026-07-29: Assessments is the v2 three-step screen (student, assessment,
  // run it) with the class carried by the shared context bar; Reports is still
  // the numbered funnel.
  await primaryNav.getByRole("button", { name: "Assessments", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Assess a student", exact: true })).toBeVisible();
  const assessSteps = page.locator(".teacher-assess-step");
  await expect(assessSteps).toHaveCount(3);
  for (const step of ["Choose the student", "Choose the assessment", "Run it and save"]) {
    await expect(assessSteps.filter({ hasText: step })).toHaveCount(1);
  }
  await expect(page.getByRole("heading", { name: "Choose a class", exact: true })).toHaveCount(0);

  await primaryNav.getByRole("button", { name: "Reports", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Open a report", exact: true })).toBeVisible();
  for (const step of ["Choose a class", "Whole class, or one student?", "Choose a report"]) {
    await expect(page.getByRole("heading", { name: step, exact: true })).toBeVisible();
  }

  await primaryNav.getByRole("button", { name: "Resources", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Choose a teaching resource", exact: true })).toBeVisible();
  for (const card of ["Worksheets", "Present"]) {
    await expect(page.getByRole("heading", { name: card, exact: true })).toBeVisible();
  }

  await page.getByRole("button", { name: "Build a worksheet", exact: true }).click();
  await expect(page.locator('main[data-teacher-route="worksheets"]')).toBeVisible();
  await expect(page).toHaveURL(/#teacher\/resources\/worksheets\?class=/);
  await page.reload();
  await expect(page.locator('main[data-teacher-route="worksheets"]')).toBeVisible({
    timeout: 20_000
  });
  await page.getByRole("button", { name: "← Back to Resources", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Choose a teaching resource", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Open a presentation", exact: true }).click();
  await expect(page.locator('main[data-teacher-route="present"]')).toBeVisible();
  await expect(page).toHaveURL(/#teacher\/resources\/present\?class=/);
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Choose a teaching resource", exact: true })).toBeVisible();

  await primaryNav.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Class and account", exact: true })).toBeVisible();
  // v2 Settings is a grid of doorway cards; every section the rail used to list
  // is still one click away, now behind the card that opens it.
  for (const card of [
    "Manage classes",
    "Manage sign-in",
    "Open accessibility",
    "Open data rights",
    "Open school information",
    "Open teacher account"
  ]) {
    await expect(page.getByRole("button", { name: card, exact: true })).toBeVisible();
  }
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("@teacher-reports-route-recovery preserves valid context and recovers from a bare Reports link", async ({
  page
}) => {
  const pageErrors = recordPageErrors(page);
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  const primaryNav = page.getByTestId("teacher-primary-nav");

  // 2026-07-29: the class comes from the shared context bar, so it is chosen on
  // Students; Assessments then scopes its own student select to it.
  await primaryNav.getByRole("button", { name: "Students", exact: true }).click();
  await page.getByLabel("Current class").selectOption({ label: "Audit Class A" });
  await primaryNav.getByRole("button", { name: "Assessments", exact: true }).click();
  await page.locator(".teacher-assess-panel-student select").selectOption({ label: "Aarav" });
  await expect(page.getByRole("heading", { name: "2 · Assessment", exact: true })).toBeVisible();

  await primaryNav.getByRole("button", { name: "Reports", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Open a report", exact: true })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(
    `#teacher/reports\\?.*class=${AUDIT_CLASS_A_ID}.*learner=${AARAV_ID}`
  ));
  const reportFunnel = page.locator('[data-teacher-funnel="reports"]');
  await expect(reportFunnel).toContainText("Audit Class A");
  await expect(reportFunnel).toContainText("Aarav");
  await expect(page.getByText(
    "That link is unavailable. Choose a class and a student under Reports.",
    { exact: true }
  )).toHaveCount(0);
  await expect(page.getByText("No progress results yet", { exact: true })).toHaveCount(0);

  await page.evaluate(() => {
    window.location.hash = "#teacher/reports?group=all";
  });
  await expect(page.getByRole("heading", { name: "Open a report", exact: true })).toBeVisible();
  await expect(reportFunnel).toContainText("Audit Class A");
  await expect(page.getByRole("heading", {
    name: "Whole class, or one student?",
    exact: true
  })).toBeVisible();
  await expect(page.getByText(
    "That link is unavailable. Choose a class and a student under Reports.",
    { exact: true }
  )).toHaveCount(0);
  await expect(page.getByText("No progress results yet", { exact: true })).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test("@teacher-dashboard-data @teacher-class-progress @teacher-evidence-basis @teacher-growth-history @teacher-instructional-groups @teacher-insight-actions keeps the reachable report simple", async ({
  page
}) => {
  const pageErrors = recordPageErrors(page);
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  const roster = await selectAuditClass(page);

  // Essential learning fields are fixed; sign-in readiness stays visible
  // beneath the student's name rather than becoming a hideable column.
  for (const column of ["Student", "Current focus", "Accuracy", "Status", "Last active", "Actions"]) {
    await expect(roster.getByRole("columnheader", { name: column, exact: true })).toBeVisible();
  }
  await expect(roster.locator("tbody > tr")).toHaveCount(10);
  await expect(page.getByRole("navigation", { name: "Student roster pages" })).toContainText("Page 1 of 2");
  for (const student of ["Aarav", "Aisha", "Amara", "Bao", "Camila"]) {
    await expect(roster.getByText(student, { exact: true })).toBeVisible();
  }

  await openAaravReports(page);
  // 2026-07-26: teacher copy no longer says "child" or "has been exposed to" — the
  // report nav is "Student reports" and tiles read "Aarav answered X 4 times".
  // 2026-07-26: Guided reading and Other learning are real report views again — they
  // were silently redirected to the overview while both still rendered.
  await expectStudentReportViewsAvailable(page, [
    "whole-child",
    "skills-check",
    "hfw",
    "el-assessments",
    "guided-reading",
    "other-learning"
  ]);

  await chooseStudentReportView(page, "skills-check");
  await expect(page.getByRole("heading", { name: "Skills", exact: true })).toBeVisible();
  for (const band of ["Secure", "Developing", "Needs support", "Not enough results or not checked"]) {
    await expect(page.getByText(band, { exact: true })).toBeVisible();
  }
  const firstTile = page.locator(".simple-report-tile").first();
  await expect(firstTile).toContainText(/Aarav answered/i);
  await expect(firstTile).toContainText(/correct answer/i);
  await expect(page.getByText(/confidence interval|outlier|instructional group/i)).toHaveCount(0);
  await expect(page).toHaveURL(/#teacher\/reports\/report\?.*report=skills-check/);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Skills", exact: true })).toBeVisible({
    timeout: 20_000
  });
  await expect(page.locator(".lg-report-topbar-copy").getByText("Aarav", { exact: true })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("@teacher-child-lifecycle @teacher-roster-scale edits, opens privacy, archives, and restores one student", async ({
  page
}) => {
  const pageErrors = recordPageErrors(page);
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  const roster = await selectAuditClass(page);

  const rosterTools = page.getByRole("region", { name: "Search and filter students" });
  await rosterTools.getByLabel("Search students").fill("Aarav");
  await expect(roster.locator("tbody > tr")).toHaveCount(1);
  await rosterTools.getByLabel("Search students").fill("");

  let options = await openStudentSettings(page, roster, "Aarav");
  await options.getByRole("button", { name: "Edit student information", exact: true }).click();
  const editDialog = page.getByRole("dialog", { name: "Edit Aarav" });
  await editDialog.getByLabel("Display name").fill("Aarav Audit");
  await editDialog.getByRole("button", { name: "Save student information", exact: true }).click();
  await expect(roster.getByText("Aarav Audit", { exact: true })).toBeVisible();

  // Resetting sign-in pictures is confirmed inside the app, where the teacher
  // can read the consequence and cancel without a browser-chrome interruption.
  options = await openStudentSettings(page, roster, "Aarav Audit");
  const resetSignInTrigger = options.getByRole("button", {
    name: "Reset sign-in pictures",
    exact: true
  });
  await expect(resetSignInTrigger).toHaveAttribute("aria-haspopup", "dialog");
  await resetSignInTrigger.click();
  const resetSignInDialog = page.getByRole("dialog", {
    name: "Reset sign-in pictures for Aarav Audit"
  });
  await expect(resetSignInDialog).toContainText(
    "will not be able to sign in with their current pictures"
  );
  await expect(resetSignInDialog).toContainText("Nothing else is changed.");
  await resetSignInDialog.getByRole("button", { name: "Cancel", exact: true }).click();

  options = await openStudentSettings(page, roster, "Aarav Audit");
  await options.getByRole("button", { name: "Privacy and data rights", exact: true }).click();
  const privacyDialog = page.getByRole("dialog", { name: "Data choices for Aarav Audit" });
  await privacyDialog.getByLabel("Who made the request?").selectOption({ index: 1 });
  await privacyDialog.getByLabel("How was identity and authority verified?").selectOption({ index: 1 });
  await expect(privacyDialog.getByRole("button", { name: "Download student data", exact: true })).toBeEnabled();
  await expect(privacyDialog.getByRole("heading", {
    name: "Privacy request history",
    exact: true
  })).toBeVisible();
  await privacyDialog.getByRole("button", { name: "Close", exact: true }).click();

  // The trigger opens a dialog; the dialog carries the final act. These two
  // labels were identical ("Archive child"), which read as "nothing happened".
  options = await openStudentSettings(page, roster, "Aarav Audit");
  await expect(options.getByRole("button", { name: "Archive student…", exact: true }))
    .toHaveAttribute("aria-haspopup", "dialog");
  await options.getByRole("button", { name: "Archive student…", exact: true }).click();
  const archiveDialog = page.getByRole("dialog", { name: "Archive Aarav Audit" });
  await expect(archiveDialog).toContainText("Nothing is deleted.");
  await expect(archiveDialog).toContainText("you can restore them at any time");
  await expect(archiveDialog.getByRole("button", { name: "Archive student…", exact: true })).toHaveCount(0);
  await archiveDialog.getByRole("button", { name: "Yes, archive Aarav Audit", exact: true }).click();
  await expect(roster.getByText("Aarav Audit", { exact: true })).toHaveCount(0);

  // Archiving must report itself. A silent no-op is the failure this whole
  // spec exists to catch.
  const archiveFeedback = page.locator("[data-action-feedback]")
    .filter({ hasText: "Aarav Audit archived" });
  await expect(archiveFeedback).toBeVisible();

  await page.getByText("Archived students (2)", { exact: true }).click();
  await page.getByRole("button", { name: "Restore Aarav Audit", exact: true }).click();
  await expect(roster.getByText("Aarav Audit", { exact: true })).toBeVisible();

  options = await openStudentSettings(page, roster, "Aarav Audit");
  await options.getByRole("button", { name: "Edit student information", exact: true }).click();
  const restoreNameDialog = page.getByRole("dialog", { name: "Edit Aarav Audit" });
  await restoreNameDialog.getByLabel("Display name").fill("Aarav");
  await restoreNameDialog.getByRole("button", { name: "Save student information", exact: true }).click();
  await expect(roster.getByText("Aarav", { exact: true })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("@teacher-child-lifecycle offers a real delete whose friction matches what is destroyed", async ({
  page
}) => {
  const pageErrors = recordPageErrors(page);
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  const roster = await selectAuditClass(page);

  // Aarav carries a long saved history, so deleting has to name what it
  // destroys and stay disabled until the teacher types the display name.
  // The dialog is opened and cancelled: this fixture is shared, and the point
  // is the gate, not the destruction.
  const aaravRow = roster.getByRole("row").filter({ hasText: "Aarav" });
  const removeTrigger = aaravRow.getByRole("button", {
    name: "Remove Aarav from class",
    exact: true
  });
  await expect(removeTrigger).toBeVisible();
  await removeTrigger.click();

  const deleteDialog = page.getByRole("dialog", { name: "Delete Aarav permanently" });
  await expect(deleteDialog).toContainText(
    /(?:The roster currently shows \d+ saved answers?|Saved-result totals are still loading or unavailable\.)/
  );
  await expect(deleteDialog).toContainText(
    /Permanent deletion (?:also )?removes/
  );
  await expect(deleteDialog).toContainText(/saved for Aarav|Aarav's student record/);
  await expect(deleteDialog).toContainText("It cannot be undone.");
  await expect(deleteDialog).toContainText("Archive Aarav instead");
  const confirmDelete = deleteDialog.getByRole("button", {
    name: "Yes, delete Aarav permanently",
    exact: true
  });
  await expect(confirmDelete).toBeDisabled();
  await deleteDialog.getByLabel("Type Aarav to confirm").fill("Aarav");
  await expect(confirmDelete).toBeEnabled();
  await deleteDialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(roster.getByText("Aarav", { exact: true })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("@teacher-today-briefing @teacher-urgency-order @teacher-action-feedback @teacher-intervention-loop keeps Today focused", async ({
  page
}) => {
  const pageErrors = recordPageErrors(page);
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  const classSelect = page.getByLabel("Current class");
  await classSelect.selectOption({ label: "Audit Class A" });
  await expect(classSelect.locator("option:checked")).toHaveText("Audit Class A");

  const briefing = page.getByRole("region", { name: "Today's class briefing" });
  await expect(briefing).toBeVisible();
  await expect(briefing.getByText("Today's briefing", { exact: true })).toBeVisible();
  await expect(briefing.getByRole("button").first()).toBeVisible();
  await expect(page.locator("details.teacher-dashboard-secondary")).not.toHaveAttribute("open", "");
  await expect(page.locator(".teacher-roster-table")).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test("@teacher-class-code @teacher-login-card-print keeps class entry controls inside Class sign-in", async ({
  page
}) => {
  const pageErrors = recordPageErrors(page);
  await page.addInitScript(() => {
    window.print = () => {
      window.__literacyPathLoginCardsPrinted = true;
    };
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async text => {
          window.__literacyPathCopiedClassCode = text;
        }
      }
    });
  });

  await logIn(page, "audit-teacher-a@literacypath.invalid");
  await selectAuditClass(page);
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Settings", exact: true })
    .click();
  await page.getByRole("button", { name: "Manage classes", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Classes and groups", exact: true })).toBeVisible();
  const codeValue = page.locator(".teacher-settings-code");
  const originalCode = (await codeValue.textContent())?.trim();
  expect(originalCode).toMatch(/^[A-Z0-9]{6}$/);
  await page.getByRole("button", { name: "Copy code", exact: true }).click();
  await expect(page.locator(".teacher-inline-status")).toContainText(`Class code ${originalCode} copied.`);
  await expect.poll(() => page.evaluate(() => window.__literacyPathCopiedClassCode)).toBe(originalCode);
  await page.getByRole("button", { name: "New code", exact: true }).click();
  const newCodeDialog = page.getByRole("dialog", { name: "Make a new class code?" });
  await expect(newCodeDialog).toContainText("every student in the class needs the new code");
  await newCodeDialog.getByRole("button", { name: "Make a new code", exact: true }).click();
  await expect(codeValue).not.toHaveText(originalCode);
  expect((await codeValue.textContent())?.trim()).toMatch(/^[A-Z0-9]{6}$/);
  await expect(page.getByRole("button", { name: "See sign-in history", exact: true })).toBeVisible();
  await expect(page.getByRole("radio", { name: "This class only", exact: true })).toBeChecked();

  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Students", exact: true })
    .click();
  const roster = page.locator(".teacher-roster-table");
  for (const student of ["Aarav", "Aisha"]) {
    await roster.getByRole("checkbox", { name: `Select ${student}`, exact: true }).check();
  }
  const rosterSetup = page.locator(".teacher-roster-admin");
  if (!await rosterSetup.evaluate(element => element.open)) {
    await rosterSetup.locator(":scope > summary").click();
  }
  await page.getByText("More tools", { exact: true }).click();
  await page.getByRole("button", { name: "Preview selected cards (2)", exact: true }).click();
  const printRoute = page.getByRole("main", { name: "Sign-in cards", exact: true });
  await expect(printRoute).toHaveAttribute("data-teacher-route", "login-cards");
  await expect(page).toHaveURL(/#teacher\/children\?.*view=sign-in-cards/);
  await expect(printRoute.getByRole("article", { name: "Aarav sign-in card" })).toBeVisible();
  await expect(printRoute.getByRole("article", { name: "Aisha sign-in card" })).toBeVisible();
  await page.goBack();
  await expectStudentRoster(page, "Audit Class A");
  await page.goForward();
  await expect(printRoute).toBeVisible();
  await page.reload();
  await expect(printRoute).toBeVisible({ timeout: 20_000 });
  await printRoute.getByRole("button", { name: "Print cards", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__literacyPathLoginCardsPrinted)).toBe(true);
  expect(pageErrors).toEqual([]);
});

test("@teacher-metric-definitions @report-export-provenance @el-empty-export-policy @el-export-consistency @product-finish-surface keeps EL detailed and other reports concise", async ({
  page
}) => {
  const pageErrors = recordPageErrors(page);
  await page.addInitScript(() => {
    window.print = () => {
      window.__literacyPathPrintRequested = true;
    };
  });
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  await selectAuditClass(page);
  await openAaravReports(page);

  await chooseStudentReportView(page, "skills-check");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download skills assessment data", exact: true }).click();
  const csv = await readDownloadText(await downloadPromise);
  expect(csv).toContain('"Student","Aarav"');
  expect(csv).not.toMatch(/student_id|learner_id|schema_version|policy_version/i);
  await expect(page.getByRole("region", { name: "About this report" })).toContainText("Audit Class A");

  await chooseStudentReportView(page, "el-assessments");
  await expect(page.getByRole("heading", { name: "EL assessments", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Letter and sound assessments", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Reading assessments", exact: true })).toBeVisible();
  await expect(page.getByText(
    "These records show what the student did in each completed assessment.",
    { exact: true }
  )).toBeVisible();
  await page.getByRole("button", { name: "Print or save PDF", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__literacyPathPrintRequested)).toBe(true);
  await expect(page.getByRole("button", {
    name: /^(?:Download EL data|Choose an assessment period)$/
  })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("@teacher-persistent-context @teacher-student-preview preserves the selected student across teacher sections", async ({
  page
}) => {
  const pageErrors = recordPageErrors(page);
  const consoleErrors = recordConsoleErrors(page);
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  const roster = await selectAuditClass(page);
  await openStudentPanel(page, roster, "Aarav");

  const shell = page.locator(".lg-app-shell");
  await expect(shell).toHaveAttribute("data-teacher-class-id", AUDIT_CLASS_A_ID);
  await expect(shell).toHaveAttribute("data-teacher-learner-id", AARAV_ID);

  const primaryNav = page.getByTestId("teacher-primary-nav");
  // Story Quests is a per-student tool, so it opens from the Student panel
  // rather than from a second student picker on Resources.
  const studentPanel = page.getByRole("region", { name: /^Student details: Aarav$/ });
  await studentPanel.getByText("Learning tools", { exact: true }).click();
  await studentPanel.getByRole("button", { name: "Preview Story Quests", exact: true }).click();
  const previewBanner = page.getByRole("complementary", { name: "Previewing as Aarav" });
  await expect(previewBanner).toBeVisible();
  await expect(previewBanner).toContainText("Read-only preview");
  const storyQuestSurface = page.getByRole("main", { name: "Story Quests" });
  await expect(storyQuestSurface.getByRole("heading", {
    name: "Story Quests",
    level: 1
  })).toBeVisible();
  await expect(storyQuestSurface).toContainText("This is a clean practice preview.");
  await expect(storyQuestSurface.getByRole("button", { name: /^Preview / }).first()).toBeVisible();
  await storyQuestSurface.getByRole("button", { name: /^Preview / }).first().click();
  await expect(page.getByText("Student progress is not saved", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Back to Story Quests", exact: true })).toBeVisible();
  const previewStorageKeys = await page.evaluate(() => Object.keys(window.localStorage)
    .filter(key => key.startsWith("literacyPath.storyQuestProgress.v1.teacher-preview")));
  expect(previewStorageKeys).toEqual([]);
  await previewBanner.getByRole("button", { name: /Return to/ }).click();

  await primaryNav.getByRole("button", { name: "Students", exact: true }).click();
  await expect(shell).toHaveAttribute("data-teacher-class-id", AUDIT_CLASS_A_ID);
  await expect(shell).toHaveAttribute("data-teacher-learner-id", AARAV_ID);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("@teacher-onboarding fresh teacher starts the saved setup path from Students", async ({ page }) => {
  const pageErrors = recordPageErrors(page);
  await logIn(page, "audit-teacher-fresh@literacypath.invalid");

  const checklist = page.getByRole("region", { name: "Class setup checklist" });
  await expect(checklist).toHaveAttribute("data-setup-complete", "false");
  await expect(checklist.getByLabel("0 of 4 setup steps complete")).toBeVisible();
  await expect(checklist.getByText("Create your class", { exact: true })).toBeVisible();
  await expect(checklist.getByRole("button", { name: "Explore with a sample class", exact: true })).toBeVisible();
  await checklist.getByRole("button", { name: "Continue: Create your class", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Students", exact: true })).toBeVisible();
  await expect(page.getByLabel("Class name")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create class", exact: true })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("@teacher-onboarding-demo sample class is clearly labelled and evidence-empty", async ({ page }) => {
  const pageErrors = recordPageErrors(page);
  await logIn(page, "audit-teacher-demo@literacypath.invalid");
  const checklist = page.getByRole("region", { name: "Class setup checklist" });
  if (await checklist.count()) {
    await checklist.getByRole("button", {
      name: "Explore with a sample class",
      exact: true
    }).click();
  } else {
    await page.getByTestId("teacher-primary-nav")
      .getByRole("button", { name: "Students", exact: true })
      .click();
  }

  const classSelect = page.getByLabel("Current class");
  await classSelect.selectOption({ label: "Demo Class (sample)" });
  await expect(classSelect.locator("option:checked")).toHaveText("Demo Class (sample)");
  const roster = await expectStudentRoster(page, "Demo Class (sample)");
  for (const student of ["Demo Ava", "Demo Ben", "Demo Chen"]) {
    const row = roster.getByRole("row").filter({ hasText: student });
    await expect(row).toBeVisible();
    await expect(row.getByText("No scored answers yet", { exact: true })).toBeVisible();
  }
  expect(pageErrors).toEqual([]);
});

test("@release-readiness-surface @admin-content-qa keeps operational support and safety controls reachable", async ({
  page
}) => {
  const pageErrors = recordPageErrors(page);
  await logIn(page, "audit-admin@literacypath.invalid");
  await page.getByRole("button", { name: "Admin", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Admin Dashboard", exact: true })).toBeVisible();
  await openAdminSection(page, "operations");
  await expect(page.getByRole("heading", { name: "Support & safety", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open reported questions", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Fleet error monitor", exact: true })).toBeVisible();
  await expect(page.getByText("Content Coverage", { exact: true })).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test("@admin-compartmentalised-ia @admin-history Admin exposes one operational navigation and browser history works", async ({
  page
}) => {
  const pageErrors = recordPageErrors(page);
  await logIn(page, "audit-admin@literacypath.invalid");
  await page.getByRole("button", { name: "Admin", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Admin Dashboard", exact: true }))
    .toBeVisible();
  await expectAdminSectionAvailable(page, "school", "signups");
  await expectAdminSectionUnavailable(page, "school", "calibration");
  await expectAdminSectionUnavailable(page, "school", "release");
  await expectAdminSectionAvailable(page, "operations", "operations");
  await expect(page.getByText("Access activity and pending saves", { exact: true }))
    .toHaveCount(0);

  await openAdminSection(page, "questionFlags");
  await expect(page).toHaveURL(/\/admin\/question-flags$/);
  await expect(page.getByRole("heading", { name: "Reported questions", exact: true }))
    .toBeVisible();

  await page.goBack();
  await expect(page).not.toHaveURL(/\/admin\/question-flags/);
  await expect(page.getByRole("heading", { name: "Admin Dashboard", exact: true }))
    .toBeVisible();

  await page.goForward();
  await expect(page.getByRole("heading", { name: "Reported questions", exact: true }))
    .toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Reported questions", exact: true }))
    .toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Back to admin", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Admin Dashboard", exact: true }))
    .toBeVisible();

  await page.goto("/admin/question-flags");
  await expect(page.getByRole("heading", { name: "Reported questions", exact: true }))
    .toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Admin", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Admin Dashboard", exact: true }))
    .toBeVisible();
  await expect(page).not.toHaveURL(/\/admin\/question-flags/);

  await page.goto("/admin/question-flags");
  await expect(page.getByRole("heading", { name: "Reported questions", exact: true }))
    .toBeVisible({ timeout: 20_000 });
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Dashboard", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Start with these students", exact: true })).toBeVisible();
  await expect(page).not.toHaveURL(/\/admin\/question-flags/);
  await expect(page).toHaveURL(/#teacher\/dashboard/);
  expect(pageErrors).toEqual([]);
});

test("@admin-mobile-navigation exposes Support & safety in the compact Admin picker", async ({
  page
}) => {
  const pageErrors = recordPageErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await logIn(page, "audit-admin@literacypath.invalid");
  await page.getByRole("button", { name: "Admin", exact: true }).click();
  await openAdminArea(page);

  const compactPicker = page.getByLabel("Choose an admin page");
  await expect(compactPicker.getByRole("option", { name: "Support & safety", exact: true }))
    .toHaveCount(1);
  await compactPicker.selectOption("operations");
  await page.getByRole("button", { name: "Open reported questions", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/question-flags$/);
  await expect(page.getByRole("heading", { name: "Reported questions", exact: true }))
    .toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("@question-report-cloud sends once, appears in another browser, and records only the chosen review", async ({
  browser,
  page
}, testInfo) => {
  const pageErrors = recordPageErrors(page);
  let reportId = "";
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  const roster = await selectAuditClass(page);
  const aaravRow = roster.getByRole("row").filter({ hasText: "Aarav" });
  await aaravRow.getByRole("button", { name: "Assess Aarav", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Assess a student", exact: true }))
    .toBeVisible();
  await page.getByRole("button", { name: "Start Skills assessment", exact: true }).click();
  await expect(page.locator(".teacher-assess-panel-start")).toBeInViewport();
  await expect(page.getByRole("button", { name: "Begin Skills assessment", exact: true }))
    .toBeInViewport();
  await page.getByRole("button", { name: "Begin Skills assessment", exact: true }).click();

  const questionCard = page.locator("[data-assessment-question-id]").first();
  await expect(questionCard).toBeVisible({ timeout: 20_000 });
  const questionId = await questionCard.getAttribute("data-assessment-question-id");
  expect(questionId).toBeTruthy();

  const adminContext = await browser.newContext({
    baseURL: testInfo.project.use.baseURL,
    deviceScaleFactor: testInfo.project.use.deviceScaleFactor,
    hasTouch: testInfo.project.use.hasTouch,
    isMobile: testInfo.project.use.isMobile,
    userAgent: testInfo.project.use.userAgent,
    viewport: testInfo.project.use.viewport
  });
  const adminPage = await adminContext.newPage();
  try {
    await logIn(adminPage, "audit-admin@literacypath.invalid");
    await adminPage.getByRole("button", { name: "Admin", exact: true }).click();
    await openAdminArea(adminPage, "technical");

    await questionCard.getByRole("button", { name: "Report question", exact: true }).click();
    const reportStatus = questionCard.getByText("Question report sent.", { exact: true });
    await expect(reportStatus).toBeVisible();
    reportId = await reportStatus.getAttribute("data-question-report-id");
    expect(reportId).toMatch(/^[0-9a-f-]{36}$/i);

    await openAdminSection(adminPage, "technical", "questionFlags");

    let reportCard = adminPage.locator(
      `.question-flag-review-card[data-question-report-id="${reportId}"]`
    );
    await expect(reportCard).toBeVisible({ timeout: 20_000 });
    await expect(reportCard).toContainText(questionId);
    await expect(reportCard).toContainText("Review: Not reviewed");
    await reportCard.getByRole("button", {
      name: "Record question problem",
      exact: true
    }).click();
    await expect(adminPage.getByText(
      "Review saved: Question needs checking.",
      { exact: true }
    )).toBeVisible();

    await adminPage.getByRole("button", { name: "All", exact: true }).click();
    reportCard = adminPage.locator(
      `.question-flag-review-card[data-question-report-id="${reportId}"]`
    );
    await expect(reportCard).toContainText("Review: Question needs checking");
    await expect(reportCard).not.toContainText(/delete question|replace question/i);

    await reportCard.getByRole("button", { name: "Delete report", exact: true }).click();
    await reportCard.getByRole("button", {
      name: "Confirm delete report",
      exact: true
    }).click();
    await expect(adminPage.locator(
      `.question-flag-review-card[data-question-report-id="${reportId}"]`
    )).toHaveCount(0);
  } finally {
    if (!reportId) {
      reportId = await questionCard.locator("[data-question-report-id]")
        .first()
        .getAttribute("data-question-report-id")
        .catch(() => "");
    }
    if (reportId) {
      await adminPage.evaluate(async reportIdToDelete => {
        const { supabase } = await import("/src/supabaseClient.js");
        await supabase.table("assessment_question_reports")
          .delete()
          .eq("id", reportIdToDelete);
      }, reportId).catch(() => {});
    }
    await adminContext.close();
  }
  expect(pageErrors).toEqual([]);
});

test("@release-readiness-surface reachable 520-item report is paginated and exported completely", async ({
  page
}) => {
  test.setTimeout(120_000);
  const pageErrors = recordPageErrors(page);
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  await selectAuditClass(page);
  await openAaravReports(page);
  await chooseStudentReportView(page, "skills-check");
  await expect(page.getByRole("heading", { name: "Skills", exact: true })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download skills assessment data", exact: true }).click();
  const csv = await readDownloadText(await downloadPromise);
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const itemRows = lines.filter(line => line.includes('"Item summary"'));
  const attemptRows = lines.filter(line => line.includes('"Assessment attempt"'));
  const questionRows = lines.filter(line => line.includes('"Question result"'));
  expect(itemRows.length).toBeGreaterThanOrEqual(520);
  expect(attemptRows.length).toBeGreaterThanOrEqual(520);
  expect(questionRows.length).toBeGreaterThanOrEqual(520);
  expect(csv).not.toMatch(/Attempt ID|Question ID|audit-long-history|audit-item-/i);
  expect(pageErrors).toEqual([]);
});
