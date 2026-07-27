import { expect, test } from "@playwright/test";

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
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({
    timeout: 20_000
  });
  await expect(page.locator('[data-teacher-product="class-dashboard"]')).toBeVisible();
  await expect(page.locator(".admin-dashboard")).toHaveCount(0);
}

async function selectAuditClass(page, className = "Audit Class A") {
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Children", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Children", exact: true })).toBeVisible();
  const classSelect = page.getByLabel("Current class");
  await classSelect.selectOption({ label: className });
  await expect(classSelect.locator("option:checked")).toHaveText(className);
  await expect(page.getByRole("heading", { name: "Children", exact: true })).toBeVisible();
  await expect(page.getByText(
    `Add, update, move, or archive children in ${className}.`,
    { exact: true }
  )).toBeVisible();
  const rosterAdmin = page.locator(".teacher-roster-admin");
  if (!await rosterAdmin.evaluate(element => element.open)) {
    await rosterAdmin.locator(":scope > summary").click();
  }
  return page.locator(".teacher-roster-table");
}

async function openAaravReports(page) {
  const roster = page.locator(".teacher-roster-table");
  const aaravRow = roster.getByRole("row").filter({ hasText: "Aarav" });
  await aaravRow.getByRole("button", { name: "Open child", exact: true }).click();
  const childDetail = page.getByRole("region", { name: "Child details: Aarav" });
  await expect(childDetail).toBeVisible();
  await childDetail.getByRole("button", { name: "Review Aarav’s progress", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Choose a child’s report", exact: true })).toBeVisible();
  const aaravReport = page.getByRole("article").filter({
    has: page.getByRole("heading", { name: "Aarav", exact: true })
  });
  await aaravReport.getByRole("button", { name: "Open report", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeVisible({
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

test("@teacher-five-intention-ia @teacher-assessment-hub @teacher-contextual-help uses six clear, separate sections", async ({
  page
}) => {
  const pageErrors = recordPageErrors(page);
  const consoleErrors = recordConsoleErrors(page);
  await logIn(page, "audit-teacher-a@literacypath.invalid");

  const primaryNav = page.getByTestId("teacher-primary-nav");
  const intentButtons = primaryNav.locator(":scope > .lg-sb-intent > .lg-sb-item");
  const expectedSections = ["Dashboard", "Students", "Reports", "Resources", "Settings"];
  await expect(intentButtons).toHaveCount(expectedSections.length);
  for (const [index, label] of expectedSections.entries()) {
    await expect(intentButtons.nth(index)).toHaveAttribute("aria-label", label);
  }

  // Checks is no longer a destination: a check starts from a roster row or the
  // Student panel, so the roster row carries the button instead of a nav item.
  await primaryNav.getByRole("button", { name: "Students", exact: true }).click();
  await expect(
    page.getByRole("table").getByRole("button", { name: /^Check / }).first()
  ).toBeVisible();

  await primaryNav.getByRole("button", { name: "Reports", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Choose a child’s report", exact: true })).toBeVisible();

  await primaryNav.getByRole("button", { name: "Resources", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Choose a teaching resource", exact: true })).toBeVisible();
  for (const card of ["Worksheets", "Present"]) {
    await expect(page.getByRole("heading", { name: card, exact: true })).toBeVisible();
  }

  await primaryNav.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  for (const section of ["School information", "Site settings", "Privacy settings", "Account"]) {
    await expect(page.getByRole("button", { name: section, exact: true })).toBeVisible();
  }
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("@teacher-dashboard-data @teacher-class-progress @teacher-evidence-basis @teacher-growth-history @teacher-instructional-groups @teacher-insight-actions keeps the reachable report simple", async ({
  page
}) => {
  const pageErrors = recordPageErrors(page);
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  const roster = await selectAuditClass(page);

  // 2026-07-26: "Sign-in" is a default column again — it holds the only per-student
  // control that lets a class sign in, so it can no longer be opt-in.
  for (const column of ["Display name", "Focus", "Progress", "Sign-in", "Last active", "Actions"]) {
    await expect(roster.getByRole("columnheader", { name: column, exact: true })).toBeVisible();
  }
  await expect(roster.locator("tbody > tr")).toHaveCount(12);
  for (const child of ["Aarav", "Aisha", "Amara", "Bao", "Camila"]) {
    await expect(roster.getByText(child, { exact: true })).toBeVisible();
  }

  await openAaravReports(page);
  // 2026-07-26: teacher copy no longer says "child" or "has been exposed to" — the
  // report nav is "Student reports" and tiles read "Aarav answered X 4 times".
  const reportNav = page.getByRole("navigation", { name: "Student reports" });
  // 2026-07-26: Guided reading and Other learning are real report views again — they
  // were silently redirected to the overview while both still rendered.
  for (const view of [
    "Overview",
    "Skills",
    "Guided reading",
    "HFW / sight words",
    "Other learning",
    "EL formal report"
  ]) {
    await expect(reportNav.getByRole("link", {
      name: new RegExp(`^${view.replace("/", "\\/")}`)
    })).toBeVisible();
  }

  await reportNav.getByRole("link", { name: /^Skills/ }).click();
  await expect(page.getByRole("heading", { name: "Skills", exact: true })).toBeVisible();
  for (const band of ["Grey · not seen", "Red · below 20%", "Orange · 20–49%", "Green · 50% or more"]) {
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

test("@teacher-child-lifecycle @teacher-roster-scale edits, opens privacy, archives, and restores one child", async ({
  page
}) => {
  const pageErrors = recordPageErrors(page);
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  const roster = await selectAuditClass(page);

  const rosterTools = page.getByRole("region", { name: "Search, sort, and filter children" });
  await rosterTools.getByLabel("Search children").fill("Aarav");
  await expect(roster.locator("tbody > tr")).toHaveCount(1);
  await rosterTools.getByLabel("Search children").fill("");

  let childRow = roster.getByRole("row").filter({ hasText: "Aarav" });
  await childRow.getByRole("button", { name: "More options for Aarav", exact: true }).click();
  let options = page.getByRole("dialog", { name: "Options for Aarav" });
  await options.getByRole("button", { name: "Edit child information", exact: true }).click();
  const editDialog = page.getByRole("dialog", { name: "Edit Aarav" });
  await editDialog.getByLabel("Display name").fill("Aarav Audit");
  await editDialog.getByRole("button", { name: "Save child information", exact: true }).click();
  await expect(roster.getByText("Aarav Audit", { exact: true })).toBeVisible();

  childRow = roster.getByRole("row").filter({ hasText: "Aarav Audit" });
  await childRow.getByRole("button", { name: "More options for Aarav Audit", exact: true }).click();
  options = page.getByRole("dialog", { name: "Options for Aarav Audit" });
  await options.getByRole("button", { name: "Privacy and data rights", exact: true }).click();
  const privacyDialog = page.getByRole("dialog", { name: "Data choices for Aarav Audit" });
  await privacyDialog.getByLabel("Who made the request?").selectOption({ index: 1 });
  await privacyDialog.getByLabel("How was identity and authority verified?").selectOption({ index: 1 });
  await expect(privacyDialog.getByRole("button", { name: "Download child data", exact: true })).toBeEnabled();
  await expect(privacyDialog.getByRole("heading", { name: "Request history", exact: true })).toBeVisible();
  await privacyDialog.getByRole("button", { name: "Close", exact: true }).click();

  await childRow.getByRole("button", { name: "More options for Aarav Audit", exact: true }).click();
  await page.getByRole("dialog", { name: "Options for Aarav Audit" })
    .getByRole("button", { name: "Archive child", exact: true })
    .click();
  const archiveDialog = page.getByRole("dialog", { name: "Archive Aarav Audit" });
  await expect(archiveDialog).toContainText("saved results stay attached and can be restored");
  await archiveDialog.getByRole("button", { name: "Archive child", exact: true }).click();
  await expect(roster.getByText("Aarav Audit", { exact: true })).toHaveCount(0);

  await page.getByText("Archived children (2)", { exact: true }).click();
  await page.getByRole("button", { name: "Restore Aarav Audit", exact: true }).click();
  await expect(roster.getByText("Aarav Audit", { exact: true })).toBeVisible();

  childRow = roster.getByRole("row").filter({ hasText: "Aarav Audit" });
  await childRow.getByRole("button", { name: "More options for Aarav Audit", exact: true }).click();
  await page.getByRole("dialog", { name: "Options for Aarav Audit" })
    .getByRole("button", { name: "Edit child information", exact: true })
    .click();
  const restoreNameDialog = page.getByRole("dialog", { name: "Edit Aarav Audit" });
  await restoreNameDialog.getByLabel("Display name").fill("Aarav");
  await restoreNameDialog.getByRole("button", { name: "Save child information", exact: true }).click();
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
  await expect(briefing.getByText("Today's results", { exact: true })).toBeVisible();
  await expect(briefing.getByRole("button").first()).toBeVisible();
  await expect(page.locator("details.teacher-dashboard-secondary")).not.toHaveAttribute("open", "");
  await expect(page.locator(".teacher-roster-table")).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test("@teacher-class-code @teacher-login-card-print keeps class entry controls inside Site settings", async ({
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
  await page.getByRole("button", { name: "Site settings", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Class sign-in and visibility", exact: true })).toBeVisible();
  const codeValue = page.locator(".teacher-settings-code");
  const originalCode = (await codeValue.textContent())?.trim();
  expect(originalCode).toMatch(/^[A-Z0-9]{6}$/);
  await page.getByRole("button", { name: "Copy code", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(`Class code ${originalCode} copied.`);
  await expect.poll(() => page.evaluate(() => window.__literacyPathCopiedClassCode)).toBe(originalCode);
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "New code", exact: true }).click();
  await expect(codeValue).not.toHaveText(originalCode);
  expect((await codeValue.textContent())?.trim()).toMatch(/^[A-Z0-9]{6}$/);
  await expect(page.getByRole("button", { name: "See sign-in history", exact: true })).toBeVisible();
  await expect(page.getByRole("radio", { name: "This class only", exact: true })).toBeChecked();

  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Children", exact: true })
    .click();
  const roster = page.locator(".teacher-roster-table");
  for (const child of ["Aarav", "Aisha"]) {
    await roster.getByRole("checkbox", { name: `Select ${child}`, exact: true }).check();
  }
  await page.getByText("More tools", { exact: true }).click();
  await page.getByRole("button", { name: "Preview selected cards (2)", exact: true }).click();
  const printRoute = page.getByRole("region", { name: "Sign-in cards", exact: true });
  await expect(printRoute).toHaveAttribute("data-teacher-route", "login-cards");
  await expect(printRoute.getByRole("article", { name: "Aarav sign-in card" })).toBeVisible();
  await expect(printRoute.getByRole("article", { name: "Aisha sign-in card" })).toBeVisible();
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

  const reportNav = page.getByRole("navigation", { name: "Student reports" });
  await reportNav.getByRole("link", { name: /^Skills/ }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Skills Check data", exact: true }).click();
  const csv = await readDownloadText(await downloadPromise);
  expect(csv).toContain('"Child","Aarav"');
  expect(csv).not.toMatch(/student_id|learner_id|schema_version|policy_version/i);
  await expect(page.getByRole("region", { name: "About this report" })).toContainText("Audit Class A");

  await reportNav.getByRole("link", { name: /^EL formal report/ }).click();
  await expect(page.getByRole("heading", { name: "EL formal report", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Letter and sound checks", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Reading checks", exact: true })).toBeVisible();
  await expect(page.getByText(
    "These checks describe what the child did. They do not use a made-up pass percentage.",
    { exact: true }
  )).toBeVisible();
  await page.getByRole("button", { name: "Print or save PDF", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__literacyPathPrintRequested)).toBe(true);
  await expect(page.getByRole("button", {
    name: /^(?:Download EL data|Choose a check period)$/
  })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("@teacher-persistent-context @teacher-student-preview preserves the selected child across teacher sections", async ({
  page
}) => {
  const pageErrors = recordPageErrors(page);
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  const roster = await selectAuditClass(page);
  await roster.getByRole("row").filter({ hasText: "Aarav" })
    .getByRole("button", { name: "Open child", exact: true })
    .click();

  const shell = page.locator(".lg-app-shell");
  await expect(shell).toHaveAttribute("data-teacher-class-id", AUDIT_CLASS_A_ID);
  await expect(shell).toHaveAttribute("data-teacher-learner-id", AARAV_ID);

  const primaryNav = page.getByTestId("teacher-primary-nav");
  // Story Quests is a per-student tool, so it opens from the Student panel
  // rather than from a second student picker on Resources.
  const studentPanel = page.getByRole("region", { name: /^Student details: Aarav$/ });
  await studentPanel.getByRole("button", { name: "Story Quests", exact: true }).click();
  const previewBanner = page.getByRole("complementary", { name: "Previewing as Aarav" });
  await expect(previewBanner).toBeVisible();
  await expect(previewBanner).toContainText("Read-only preview");
  await previewBanner.getByRole("button", { name: /Return to/ }).click();

  await primaryNav.getByRole("button", { name: "Students", exact: true }).click();
  await expect(shell).toHaveAttribute("data-teacher-class-id", AUDIT_CLASS_A_ID);
  await expect(shell).toHaveAttribute("data-teacher-learner-id", AARAV_ID);
  expect(pageErrors).toEqual([]);
});

test("@teacher-onboarding fresh teacher starts the saved setup path from Children", async ({ page }) => {
  const pageErrors = recordPageErrors(page);
  await logIn(page, "audit-teacher-fresh@literacypath.invalid");

  const checklist = page.getByRole("region", { name: "Class setup checklist" });
  await expect(checklist).toHaveAttribute("data-setup-complete", "false");
  await expect(checklist.getByLabel("0 of 4 setup steps complete")).toBeVisible();
  await expect(checklist.getByText("Create your class", { exact: true })).toBeVisible();
  await expect(checklist.getByRole("button", { name: "Explore with a sample class", exact: true })).toBeVisible();
  await checklist.getByRole("button", { name: "Continue: Create your class", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Children", exact: true })).toBeVisible();
  await expect(page.getByLabel("New class")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create class", exact: true })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("@teacher-onboarding-demo sample class is clearly labelled and evidence-empty", async ({ page }) => {
  const pageErrors = recordPageErrors(page);
  await logIn(page, "audit-teacher-demo@literacypath.invalid");
  const checklist = page.getByRole("region", { name: "Class setup checklist" });
  await checklist.getByRole("button", { name: "Explore with a sample class", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Children", exact: true })).toBeVisible();
  await expect(page.getByLabel("Current class").locator("option:checked")).toHaveText("Demo Class (sample)");
  const rosterAdmin = page.locator(".teacher-roster-admin");
  if (!await rosterAdmin.evaluate(element => element.open)) {
    await rosterAdmin.locator(":scope > summary").click();
  }
  const roster = page.locator(".teacher-roster-table");
  for (const child of ["Demo Ava", "Demo Ben", "Demo Chen"]) {
    const row = roster.getByRole("row").filter({ hasText: child });
    await expect(row).toBeVisible();
    await expect(row.getByText("No practice yet", { exact: true })).toBeVisible();
  }
  expect(pageErrors).toEqual([]);
});

test("@release-readiness-surface @admin-content-qa exposes the real admin release and content audit", async ({
  page
}) => {
  const pageErrors = recordPageErrors(page);
  await logIn(page, "audit-admin@literacypath.invalid");
  await page.getByRole("button", { name: "Admin", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Admin Dashboard", exact: true })).toBeVisible();
  await page.getByRole("tab", { name: /Release Check/ }).click();

  const releasePanel = page.locator(".release-readiness-panel");
  await expect(releasePanel).toBeVisible();
  await expect(releasePanel.getByRole("heading", { name: "Cleanup Tools", exact: true })).toBeVisible();
  await expect(releasePanel.getByRole("heading", { name: "Content QA Workflow", exact: true })).toBeVisible();

  await page.getByRole("button", { name: /Content coverage/ }).click();
  const coveragePanel = page.getByRole("heading", { name: "Content Coverage", exact: true }).locator("..");
  await expect(coveragePanel.locator("tbody tr")).toHaveCount(30);
  const initialSoundsRow = page.getByRole("row").filter({
    has: page.getByRole("cell", { name: "Initial Sounds", exact: true })
  });
  await expect(initialSoundsRow.getByRole("cell", { name: "READY", exact: true })).toBeVisible();
  await expect(initialSoundsRow.getByRole("cell", {
    name: "92 questions (L1 46; L2 46)",
    exact: true
  })).toBeVisible();
  await expect(initialSoundsRow.getByRole("cell", {
    name: "All canonical release dimensions pass.",
    exact: true
  })).toBeVisible();
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
  await page.getByRole("navigation", { name: "Student reports" })
    .getByRole("link", { name: /^Skills/ })
    .click();
  await expect(page.getByRole("heading", { name: "Skills", exact: true })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Skills Check data", exact: true }).click();
  const csv = await readDownloadText(await downloadPromise);
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const itemRows = lines.filter(line => line.includes('"Item summary"'));
  const attemptRows = lines.filter(line => line.includes('"Check attempt"'));
  const questionRows = lines.filter(line => line.includes('"Question result"'));
  expect(itemRows.length).toBeGreaterThanOrEqual(520);
  expect(attemptRows.length).toBeGreaterThanOrEqual(520);
  expect(questionRows.length).toBeGreaterThanOrEqual(520);
  expect(csv).not.toMatch(/Attempt ID|Question ID|audit-long-history|audit-item-/i);
  expect(pageErrors).toEqual([]);
});
