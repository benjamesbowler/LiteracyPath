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
  await aaravRow.getByRole("button", { name: "Open", exact: true }).click();
  const studentOverview = page.locator(".teacher-overview-dashboard");
  await expect(studentOverview).toBeVisible({ timeout: 20_000 });
  await expect(studentOverview.getByRole("heading", { name: "Aarav", exact: true })).toBeVisible();
  const primaryNav = page.getByTestId("teacher-primary-nav");
  await primaryNav.getByRole("button", { name: "Progress", exact: true }).click();
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
  await expect(page.locator(".teacher-overview-dashboard")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".teacher-overview-dashboard")
    .getByRole("heading", { name: "Aisha", exact: true })).toBeVisible();
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
