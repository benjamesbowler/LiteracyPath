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
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({
    timeout: 20_000
  });
  await expect(page.locator('[data-teacher-product="class-dashboard"]')).toBeVisible();
  await expect(page.locator(".admin-dashboard")).toHaveCount(0);
}

async function selectAuditClass(page) {
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Classes", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Classes", exact: true })).toBeVisible();
  const classSelect = page.getByLabel("Current class");
  await classSelect.selectOption({ label: "Audit Class A" });
  await expect(classSelect.locator("option:checked")).toHaveText("Audit Class A");
  await expect(page.getByRole("heading", { name: "Students - Audit Class A", exact: true })).toBeVisible();
}

async function openAaravReports(page) {
  const roster = page.locator(".teacher-roster-table");
  const aaravRow = roster.getByRole("row").filter({ hasText: "Aarav" });
  await aaravRow.getByRole("button", { name: "Open learner", exact: true }).click();
  const learnerDetail = page.getByRole("region", { name: "Learner detail: Aarav" });
  await expect(learnerDetail).toBeVisible();
  await learnerDetail.getByRole("button", { name: "Review Aarav’s progress", exact: true }).click();
  await expect(page.locator('[data-teacher-intent="progress"]')).toBeVisible();
  await page.getByRole("navigation", { name: "Progress tools" })
    .getByRole("button", { name: "Reports", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Reports", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open Skills Check", exact: true })).toBeEnabled({
    timeout: 20_000
  });
}

async function readDownloadText(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

test("@teacher-five-intention-ia reachable navigation has five intentions and contextual modules", async ({ page }) => {
  await logIn(page, "audit-teacher-a@literacypath.invalid");

  const primaryNav = page.getByTestId("teacher-primary-nav");
  const intentButtons = primaryNav.locator(":scope > .lg-sb-intent > .lg-sb-item");
  await expect(intentButtons).toHaveCount(5);
  for (const [index, label] of ["Today", "Classes", "Assess", "Progress", "Plan/Resources"].entries()) {
    await expect(intentButtons.nth(index)).toHaveAttribute("aria-label", label);
  }

  await primaryNav.getByRole("button", { name: "Classes", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Classes", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Classes tools" })).toBeVisible();

  await primaryNav.getByRole("button", { name: "Assess", exact: true }).click();
  await expect(page.locator('[data-teacher-intent="assess"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choose the evidence you need", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Assess tools" })).toBeVisible();

  await primaryNav.getByRole("button", { name: "Progress", exact: true }).click();
  await expect(page.locator('[data-teacher-intent="progress"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Turn evidence into a clear next step", exact: true })).toBeVisible();

  await primaryNav.getByRole("button", { name: "Plan/Resources", exact: true }).click();
  await expect(page.locator('[data-teacher-intent="resources"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Prepare teaching and practice", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Plan/Resources tools" })).toBeVisible();
});

test("@teacher-today-briefing reachable seeded briefing has four evidence zones and working actions", async ({ page }) => {
  await logIn(page, "audit-teacher-a@literacypath.invalid");

  const classSelect = page.getByLabel("Current class");
  await classSelect.selectOption({ label: "Audit Class A" });
  await expect(classSelect.locator("option:checked")).toHaveText("Audit Class A");

  const attention = page.getByRole("region", { name: "Who needs attention" });
  const due = page.getByRole("region", { name: "What's due" });
  const changed = page.getByRole("region", { name: "What changed" });
  const actions = page.getByRole("region", { name: "Direct actions" });

  await expect(attention).toBeVisible();
  await expect(attention.getByText("Aisha", { exact: true })).toBeVisible();
  await expect(attention.getByText("20 responses · 30% accuracy", { exact: true })).toBeVisible();
  await expect(attention.getByText(/below 70% after at least 8 responses/)).toBeVisible();
  await expect(attention.getByText(/1 low early result is held back/)).toBeVisible();
  await expect(attention.getByText("Amara", { exact: true })).toHaveCount(0);

  await expect(due).toBeVisible();
  await expect(due.getByText("Bao", { exact: true })).toBeVisible();
  await expect(due.getByText("First checkpoint due", { exact: true })).toBeVisible();
  await expect(due.getByText("No scored responses yet.", { exact: true })).toBeVisible();

  await expect(changed).toBeVisible();
  const aishaChange = changed.getByRole("listitem").filter({ hasText: "Aisha" });
  await expect(aishaChange.getByText("Aisha", { exact: true })).toBeVisible();
  await expect(aishaChange.getByText(/20 new responses/)).toBeVisible();
  await expect(aishaChange.getByText(/Prior 7 days:/)).toBeVisible();

  await expect(actions).toBeVisible();
  await actions.getByRole("button", { name: "Manage this class", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Classes", exact: true })).toBeVisible();

  const primaryNav = page.getByTestId("teacher-primary-nav");
  await primaryNav.getByRole("button", { name: "Today", exact: true }).click();
  await expect(page.getByRole("region", { name: "Direct actions" })).toBeVisible();
  await page.getByRole("region", { name: "Direct actions" })
    .getByRole("button", { name: "Start an assessment", exact: true })
    .click();
  await expect(page.locator('[data-teacher-intent="assess"]')).toBeVisible();

  await primaryNav.getByRole("button", { name: "Today", exact: true }).click();
  await page.getByRole("region", { name: "Direct actions" })
    .getByRole("button", { name: "Review progress", exact: true })
    .click();
  await expect(page.locator('[data-teacher-intent="progress"]')).toBeVisible();

  await primaryNav.getByRole("button", { name: "Today", exact: true }).click();
  await page.getByRole("region", { name: "Who needs attention" })
    .getByRole("button", { name: "Review Aisha", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Classes", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Learner detail: Aisha" })).toBeVisible();
});

test("@teacher-persistent-context drills through groups and three learners without swapping the student session", async ({ page }) => {
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  await selectAuditClass(page);

  const shell = page.locator(".lg-app-shell");
  await expect(shell).toHaveAttribute("data-student-session-id", "");
  await expect(shell).toHaveAttribute("data-teacher-group-id", "all");
  await expect(page).toHaveURL(/#teacher\/classes\?class=30000000-0000-4000-8000-000000000001&group=all$/);

  const groups = page.getByRole("region", { name: "Roster groups" });
  await groups.getByRole("button", { name: /Needs attention/ }).click();
  await expect(shell).toHaveAttribute("data-teacher-group-id", "attention");
  await expect(page).toHaveURL(/group=attention$/);

  const attentionRoster = page.locator(".teacher-roster-table");
  await attentionRoster.getByRole("row").filter({ hasText: "Aisha" })
    .getByRole("button", { name: "Open learner", exact: true })
    .click();
  await expect(page.getByRole("region", { name: "Learner detail: Aisha" })).toBeVisible();
  await expect(shell).toHaveAttribute("data-teacher-learner-id", "40000000-0000-4000-8000-000000000002");
  await expect(shell).toHaveAttribute("data-student-session-id", "");
  await expect(page).toHaveURL(/group=attention&learner=40000000-0000-4000-8000-000000000002$/);

  await groups.getByRole("button", { name: /Whole class/ }).click();
  const roster = page.locator(".teacher-roster-table");
  for (const [name, id] of [
    ["Aarav", "40000000-0000-4000-8000-000000000001"],
    ["Camila", "40000000-0000-4000-8000-000000000005"]
  ]) {
    await roster.getByRole("row").filter({ hasText: name })
      .getByRole("button", { name: "Open learner", exact: true })
      .click();
    await expect(page.getByRole("region", { name: `Learner detail: ${name}` })).toBeVisible();
    await expect(shell).toHaveAttribute("data-teacher-learner-id", id);
    await expect(shell).toHaveAttribute("data-teacher-class-id", "30000000-0000-4000-8000-000000000001");
    await expect(shell).toHaveAttribute("data-teacher-group-id", "all");
    await expect(shell).toHaveAttribute("data-student-session-id", "");
    await expect(page.getByRole("heading", { name: "Classes", exact: true })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`group=all&learner=${id}$`));
  }

  await expect.poll(() => page.evaluate(() => {
    const profile = JSON.parse(
      localStorage.getItem("readingMasteryProfile:10000000-0000-4000-8000-000000000001") || "null"
    );
    return {
      appView: profile?.appView,
      classId: profile?.selectedClassId,
      groupId: profile?.teacherGroupId,
      learnerId: profile?.teacherStudentId
    };
  })).toEqual({
    appView: "teacherClasses",
    classId: "30000000-0000-4000-8000-000000000001",
    groupId: "all",
    learnerId: "40000000-0000-4000-8000-000000000005"
  });

  await page.reload();
  await expect(page.getByRole("heading", { name: "Classes", exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("region", { name: "Learner detail: Camila" })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".lg-app-shell")).toHaveAttribute("data-student-session-id", "");
  await expect(page).toHaveURL(/group=all&learner=40000000-0000-4000-8000-000000000005$/);
});

test("@teacher-onboarding fresh teacher completes the saved golden path", async ({ page }) => {
  test.setTimeout(120_000);
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await logIn(page, "audit-teacher-fresh@literacypath.invalid");

  let checklist = page.getByRole("region", { name: "Teacher setup checklist" });
  await expect(checklist).toHaveAttribute("data-setup-complete", "false");
  await expect(checklist.getByLabel("0 of 4 setup steps complete")).toBeVisible();
  await expect(checklist.getByText("Create a class", { exact: true })).toBeVisible();
  await expect(checklist.getByRole("button", { name: "Explore with a sample class", exact: true })).toBeVisible();
  await expect(checklist.getByText(/contains no assessment evidence/)).toBeVisible();

  await checklist.getByRole("button", { name: "Continue: Create a class", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Classes", exact: true })).toBeVisible();
  await page.getByLabel("New class").fill("Golden Path Class");
  await page.getByRole("button", { name: "Create Class", exact: true }).click();

  checklist = page.getByRole("region", { name: "Teacher setup checklist" });
  await expect(checklist.getByLabel("1 of 4 setup steps complete")).toBeVisible();
  await expect(checklist.getByText("Add or import learners", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Import names", exact: true }).click();
  const rosterImport = page.getByRole("region", { name: "Import learner names" });
  await rosterImport.getByLabel("Learner names").fill("Ava");
  await rosterImport.getByRole("button", { name: "Import learners", exact: true }).click();

  await expect(checklist.getByLabel("2 of 4 setup steps complete")).toBeVisible();
  await checklist.getByRole("button", { name: "Continue: Set login pictures", exact: true }).click();
  const passwordDialog = page.getByRole("dialog", { name: "Change password for Ava" });
  await expect(passwordDialog).toBeVisible();
  for (const symbol of ["Cat", "Dog", "Fish"]) {
    await passwordDialog.getByRole("button", { name: symbol, exact: true }).click();
  }

  await expect(passwordDialog).toHaveCount(0);
  await expect(checklist.getByLabel("3 of 4 setup steps complete")).toBeVisible();
  await checklist.getByRole("button", { name: "Continue: Run the first check", exact: true }).click();
  await expect(page.locator('[data-teacher-intent="assess"]')).toBeVisible();

  const checkpointCard = page.getByRole("article").filter({ hasText: "Start or review a checkpoint" });
  await checkpointCard.getByRole("button", { name: "Open", exact: true }).click();
  await expect(page.getByText("Student Overview", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Enter Full Screen Assessment", exact: true }).click();
  await expect(page.locator(".assessment-question-layout")).toBeVisible({ timeout: 30_000 });

  const pairChoices = page.locator(".initial-sound-image-button");
  if (await pairChoices.count()) {
    await pairChoices.nth(0).click();
    await pairChoices.nth(1).click();
    await page.getByRole("button", { name: "Submit", exact: true }).click();
  } else {
    const immediateChoice = page.locator([
      ".visual-assessment-card-button",
      ".ixl-answer-button",
      ".choice-button",
      ".sentence-option-button"
    ].join(", ")).first();
    await expect(immediateChoice).toBeVisible();
    await immediateChoice.click();
  }

  await expect(page.locator(".assessment-feedback")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "End Assessment", exact: true }).click();
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Classes", exact: true })
    .click();

  checklist = page.getByRole("region", { name: "Teacher setup checklist" });
  await expect(checklist).toHaveAttribute("data-setup-complete", "true", { timeout: 20_000 });
  await expect(checklist.getByLabel("4 of 4 setup steps complete")).toBeVisible();
  await expect(checklist.getByRole("heading", { name: "Your class is ready to use", exact: true })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("@teacher-onboarding-demo sample class is labelled, login-ready, and evidence-empty", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await logIn(page, "audit-teacher-demo@literacypath.invalid");
  const checklist = page.getByRole("region", { name: "Teacher setup checklist" });
  await checklist.getByRole("button", { name: "Explore with a sample class", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Classes", exact: true })).toBeVisible();
  await expect(page.getByLabel("Current class").locator("option:checked")).toHaveText("Demo Class (sample)");
  await expect(checklist.getByLabel("3 of 4 setup steps complete")).toBeVisible();
  await expect(checklist.getByText("Run the first check", { exact: true })).toBeVisible();

  const roster = page.locator(".teacher-roster-table");
  for (const learner of ["Demo Ava", "Demo Ben", "Demo Chen"]) {
    const row = roster.getByRole("row").filter({ hasText: learner });
    await expect(row).toBeVisible();
    await expect(row.getByText("Ready", { exact: true })).toBeVisible();
    await expect(row.getByText("No practice yet", { exact: true })).toBeVisible();
  }
  await expect(roster.getByText("No practice yet", { exact: true })).toHaveCount(3);
  await expect(page.getByRole("region", { name: "Class summary" }).getByText("0/3", { exact: true })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("@teacher-dashboard-data reachable seeded roster columns and rows", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await logIn(page, "audit-teacher-a@literacypath.invalid");
  await selectAuditClass(page);
  await expect(page.getByText("QA7M2K", { exact: true })).toBeVisible();
  const leaderboardPrivacy = page.getByLabel("High-score privacy");
  await expect(leaderboardPrivacy.getByText("Class nicknames", { exact: true })).toBeVisible();
  await expect(leaderboardPrivacy.getByText(
    "Children only see generated Reader nicknames. Class-only is the privacy default.",
    { exact: true }
  )).toBeVisible();
  await expect(leaderboardPrivacy.getByRole("checkbox", { name: "Include this school" })).not.toBeChecked();

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

  await openAaravReports(page);
  await page.getByRole("button", { name: "Class Report", exact: true }).click();
  const formalElPanel = page.getByRole("region", { name: "EL Formal Assessments" });
  await expect(formalElPanel).toBeVisible();
  await expect(formalElPanel.getByLabel("EL evidence scope")).toBeEnabled();
  await expect(formalElPanel.getByRole("button", { name: "Print or save EL PDF", exact: true })).toBeEnabled();
  await expect(formalElPanel.getByRole("button", { name: "Export EL Excel", exact: true })).toBeEnabled();
  await expect(formalElPanel.getByText(/latest 12 reports for offline access/)).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("@product-finish-surface reachable reports, formal EL evidence, and exports", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.print = () => {
      window.__literacyPathPrintRequested = true;
    };
  });

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
  const formalElPanel = page.getByRole("region", { name: "EL Formal Assessments" });
  await expect(formalElPanel).toBeVisible();
  const evidenceScope = formalElPanel.getByLabel("EL evidence scope");
  await expect(evidenceScope).toBeEnabled();
  await expect(evidenceScope.locator("option")).not.toHaveCount(0);

  await formalElPanel.getByRole("button", { name: "Print or save EL PDF", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__literacyPathPrintRequested)).toBe(true);

  const savedRows = formalElPanel.locator(".el-saved-report-row");
  await expect(savedRows.first()).toBeVisible({ timeout: 20_000 });
  const beforeExportCount = await savedRows.count();
  const downloadPromise = page.waitForEvent("download");
  await formalElPanel.getByRole("button", { name: "Export EL Excel", exact: true }).click();
  const workbookDownload = await downloadPromise;
  expect(workbookDownload.suggestedFilename()).toMatch(/\.xlsx$/i);
  await expect(formalElPanel.getByText(/Excel downloaded and saved/)).toBeVisible({
    timeout: 20_000
  });
  await expect(savedRows).toHaveCount(beforeExportCount + 1);

  await savedRows.first().getByRole("button", { name: "Delete", exact: true }).click();
  const deleteConfirmation = savedRows.first().getByRole("group", {
    name: "Confirm saved report deletion"
  });
  await expect(deleteConfirmation).toBeVisible();
  await expect(deleteConfirmation.getByText(/removes both cloud and browser copies/)).toBeVisible();
  await deleteConfirmation.getByRole("button", { name: "Delete permanently", exact: true }).click();
  await expect(formalElPanel.getByText("Saved report deleted from cloud history and this browser.")).toBeVisible({
    timeout: 20_000
  });
  await expect(savedRows).toHaveCount(beforeExportCount);

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

test("@release-readiness-surface reachable 520-item report is paginated from storage and exported completely", async ({ page }) => {
  test.setTimeout(120_000);
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await logIn(page, "audit-teacher-a@literacypath.invalid");
  await selectAuditClass(page);
  await openAaravReports(page);
  await page.getByRole("button", { name: "Open Skills Check", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Skills Check", exact: true })).toBeVisible({
    timeout: 20_000
  });
  await expect(page.getByText(/Attempt history \(17[34]\)/)).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Skills Check data", exact: true }).click();
  const csv = await readDownloadText(await downloadPromise);
  const csvLines = csv.split("\n");
  const itemSummaries = csvLines.filter(line => line.includes('"Item summary"'));
  const seededQuestionEvidence = csvLines.filter(line => (
    line.includes('"Question evidence"') && /audit-item-\d+/.test(line)
  ));
  const seededQuestionIds = new Set(seededQuestionEvidence.map(line => (
    line.match(/audit-item-\d+/)?.[0]
  )).filter(Boolean));

  expect(itemSummaries.length).toBeGreaterThanOrEqual(520);
  expect((csv.match(/"Assessment attempt"/g) || [])).toHaveLength(520);
  expect(seededQuestionEvidence).toHaveLength(520);
  expect(seededQuestionIds.size).toBe(520);
  expect(csv).toContain("audit-long-history-0001");
  expect(csv).toContain("audit-long-history-0520");
  expect(csv).toContain("audit-item-1");
  expect(csv).toContain("audit-item-520");
  expect(csv).toContain('"Summary"');
  expect(csv).toContain('"Evidence appendix"');
  expect(pageErrors).toEqual([]);
});
