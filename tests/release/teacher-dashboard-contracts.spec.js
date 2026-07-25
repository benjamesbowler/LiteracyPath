import AxeBuilder from "@axe-core/playwright";
import ExcelJS from "exceljs";
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
  const rosterAdmin = page.locator(".teacher-roster-admin");
  if (!await rosterAdmin.evaluate(element => element.open)) {
    await rosterAdmin.locator(":scope > summary").click();
  }
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
  await expect(page.getByRole("heading", { name: "Choose an assessment purpose", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Assess tools" })).toBeVisible();

  await primaryNav.getByRole("button", { name: "Progress", exact: true }).click();
  await expect(page.locator('[data-teacher-intent="progress"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Turn evidence into a clear next step", exact: true })).toBeVisible();

  await primaryNav.getByRole("button", { name: "Plan/Resources", exact: true }).click();
  await expect(page.locator('[data-teacher-intent="resources"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Prepare teaching and practice", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Plan/Resources tools" })).toBeVisible();
});

test("@teacher-class-progress reaches exact learner item evidence from class view in three clicks", async ({
  page
}) => {
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  await selectAuditClass(page);

  let clicks = 0;
  const primaryNav = page.getByTestId("teacher-primary-nav");
  await primaryNav.getByRole("button", { name: "Progress", exact: true }).click();
  clicks += 1;

  const overview = page.getByRole("region", { name: "Class progress overview" });
  await expect(overview).toBeVisible();
  for (const section of ["Distribution", "Coverage", "Groups", "Outliers"]) {
    await expect(overview.getByText(section, { exact: true })).toBeVisible();
  }
  await expect(overview.getByText("75% median", { exact: true })).toBeVisible();
  await expect(overview.getByText("Accuracy bands require at least 8 scored responses.", {
    exact: true
  })).toBeVisible();

  const outliers = overview.getByRole("article").filter({ hasText: "Outliers" });
  await expect(outliers.getByText("Aisha", { exact: true })).toBeVisible();
  await expect(outliers.getByText("30% · 45 points below median", { exact: true })).toBeVisible();
  await outliers.getByRole("button", { name: "Review Aisha evidence", exact: true }).click();
  clicks += 1;

  const learnerEvidence = page.getByRole("region", { name: "Learner progress evidence: Aisha" });
  await expect(learnerEvidence).toBeVisible();
  await expect(page).toHaveURL(
    /#teacher\/progress\?class=30000000-0000-4000-8000-000000000001&group=all&learner=40000000-0000-4000-8000-000000000002$/
  );
  await expect(learnerEvidence.getByText("20 scored responses · 30% accuracy · 0 mastered skills", {
    exact: true
  })).toBeVisible();
  await learnerEvidence.getByRole("button", { name: /^m Needs re-teaching/ }).click();
  clicks += 1;

  const itemEvidence = learnerEvidence.getByRole("article", { name: "Item evidence: m" });
  await expect(itemEvidence).toBeVisible();
  await expect(itemEvidence.getByText("Needs re-teaching", { exact: true })).toBeVisible();
  await expect(itemEvidence.getByText("12", { exact: true })).toHaveCount(2);
  await expect(itemEvidence.getByText("33%", { exact: true })).toBeVisible();
  await expect(itemEvidence.getByText(/saved Sound Seekers item history/)).toBeVisible();
  expect(clicks).toBeLessThanOrEqual(3);

  await page.reload();
  await expect(page.getByRole("region", { name: "Class progress overview" })).toBeVisible({
    timeout: 20_000
  });
  await expect(page.getByRole("region", { name: "Learner progress evidence: Aisha" })).toBeVisible();
  await expect(page).toHaveURL(
    /#teacher\/progress\?class=30000000-0000-4000-8000-000000000001&group=all&learner=40000000-0000-4000-8000-000000000002$/
  );
});

test("@teacher-evidence-basis exposes every basis and withholds the seeded sparse percentage", async ({
  page
}) => {
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  await selectAuditClass(page);
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Progress", exact: true })
    .click();

  const overview = page.getByRole("region", { name: "Class progress overview" });
  await expect(overview).toBeVisible();
  const distributionBasis = page.getByLabel("Class distribution conclusion evidence basis");
  const coverageBasis = page.getByLabel("Class coverage conclusion evidence basis");
  for (const basis of [distributionBasis, coverageBasis]) {
    await expect(basis).toBeVisible();
    for (const dimension of ["Attempts", "Diversity", "Recency", "Confidence", "Support use"]) {
      await expect(basis.getByText(dimension, { exact: true })).toBeVisible();
    }
  }
  const groupBasis = page.getByLabel(/group conclusion evidence basis/).first();
  const outlierBasis = page.getByLabel(/outlier conclusion evidence basis/).first();
  await expect(groupBasis).toBeAttached();
  await groupBasis.locator("xpath=..").locator("summary").click();
  await expect(groupBasis).toBeVisible();
  await expect(outlierBasis).toBeAttached();
  await outlierBasis.locator("xpath=..").locator("summary").click();
  await expect(outlierBasis).toBeVisible();

  const insufficient = overview.getByRole("list", { name: "Learners with not enough evidence" });
  await expect(insufficient.getByText("Amara", { exact: true })).toBeVisible();
  await insufficient.getByRole("button", { name: "Review Amara evidence", exact: true }).click();

  const learner = page.getByRole("region", { name: "Learner progress evidence: Amara" });
  await expect(learner).toBeVisible();
  await expect(learner).toContainText("1 scored response");
  await expect(learner).toContainText("Not enough evidence for an accuracy conclusion");
  await expect(learner).not.toContainText("100% accuracy");

  const learnerBasis = learner.getByLabel("Amara learner conclusion evidence basis");
  await expect(learnerBasis.getByText("1 scored response", { exact: true })).toBeVisible();
  await expect(learnerBasis.getByText("1 assessment skill", { exact: true })).toBeVisible();
  await expect(learnerBasis.getByText(/Jul 2026/, { exact: true })).toBeVisible();
  await expect(learnerBasis.getByText("Not enough evidence · 1 of 8 required attempts", {
    exact: true
  })).toBeVisible();
  await expect(learnerBasis.getByText("0 supported of 10 recorded Sound Seekers encounters", {
    exact: true
  })).toBeVisible();
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("@teacher-growth-history renders five longitudinal views and curriculum versions from paginated history", async ({
  page
}) => {
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  await selectAuditClass(page);

  const aaravRow = page.locator(".teacher-roster-table").getByRole("row").filter({ hasText: "Aarav" });
  await aaravRow.getByRole("button", { name: "Open learner", exact: true }).click();
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Progress", exact: true })
    .click();

  const growth = page.getByRole("region", { name: "Learner growth over time: Aarav" });
  await expect(growth).toHaveAttribute("data-growth-state", "ready", { timeout: 20_000 });
  await expect(growth).toHaveAttribute("data-growth-attempt-count", "524");
  await expect(growth.getByRole("status")).toHaveText(
    "524 completed attempts · 3 intervention reviews"
  );

  for (const version of [
    "LP-CURRICULUM-2025.2",
    "LP-CURRICULUM-2026.1",
    "LP-CURRICULUM-2026.2"
  ]) {
    await expect(growth.locator(`[data-curriculum-version="${version}"]`)).toBeVisible();
  }

  const expectations = [
    ["Acquisition", "skill-acquisition", /^[1-9]\d*$/],
    ["Retention", "retention", /^[1-9]\d*$/],
    ["Fluency", "fluency", "3"],
    ["Support use", "support-dependence", /^[1-9]\d*$/],
    ["Interventions", "intervention-response", "3"]
  ];
  for (const [buttonName, metricId, pointCount] of expectations) {
    await growth.getByRole("button", { name: new RegExp(`^${buttonName}`) }).click();
    const view = growth.locator(`[data-growth-metric="${metricId}"]`);
    await expect(view).toBeVisible();
    await expect(view).toHaveAttribute("data-growth-point-count", pointCount);
    await expect(view.getByRole("img")).toHaveAccessibleName(/over time/);
  }
  const axeResult = await new AxeBuilder({ page }).include(".teacher-growth").analyze();
  expect(axeResult.violations.filter(
    violation => violation.impact === "serious" || violation.impact === "critical"
  )).toEqual([]);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("@teacher-instructional-groups creates, saves, compares, reviews, and assigns private cohorts", async ({
  page
}) => {
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  await selectAuditClass(page);
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Progress", exact: true })
    .click();

  const workspace = page.getByRole("region", { name: "Saved instructional groups" });
  await expect(workspace).toHaveAttribute("data-saved-group-state", "ready", { timeout: 20_000 });
  await expect(workspace).toHaveAttribute("data-saved-group-count", "0");
  await expect(workspace).toHaveAttribute("data-public-ranking", "false");

  const suggestionPanel = page.locator(".teacher-progress-groups");
  const saveButtons = suggestionPanel.getByRole("button", { name: "Save group", exact: true });
  await expect(saveButtons).toHaveCount(3);

  const initialSoundsSuggestion = suggestionPanel.getByRole("listitem").filter({
    hasText: "Initial Sounds"
  });
  await expect(initialSoundsSuggestion).toHaveCount(1);
  await initialSoundsSuggestion.getByRole("button", { name: "Save group", exact: true }).click();
  let saveForm = workspace.locator(".teacher-group-save-form");
  await saveForm.getByLabel("Group name").fill("Audit Initial Sounds Group");
  await saveForm.getByRole("button", { name: "Save instructional group", exact: true }).click();
  await expect(workspace).toHaveAttribute("data-saved-group-count", "1", { timeout: 20_000 });
  await expect(workspace.getByRole("article", {
    name: "Saved instructional group: Audit Initial Sounds Group"
  })).toBeVisible();

  const sharedFocusSuggestion = suggestionPanel.getByRole("listitem").filter({
    hasText: "CVC and Short Vowels"
  });
  await expect(sharedFocusSuggestion).toHaveCount(1);
  await sharedFocusSuggestion.getByRole("button", { name: "Save group", exact: true }).click();
  saveForm = workspace.locator(".teacher-group-save-form");
  await saveForm.getByLabel("Group name").fill("Audit CVC Group");
  await saveForm.getByRole("button", { name: "Save instructional group", exact: true }).click();
  await expect(workspace).toHaveAttribute("data-saved-group-count", "2", { timeout: 20_000 });

  const firstGroup = workspace.getByRole("article", {
    name: "Saved instructional group: Audit Initial Sounds Group"
  });
  const secondGroup = workspace.getByRole("article", {
    name: "Saved instructional group: Audit CVC Group"
  });
  await firstGroup.getByRole("button", { name: "Compare group", exact: true }).click();
  await secondGroup.getByRole("button", { name: "Compare group", exact: true }).click();

  const comparison = workspace.getByRole("region", { name: "Instructional group comparison" });
  await expect(comparison.getByText("2 of 2 selected", { exact: true })).toBeVisible();
  await expect(comparison.getByRole("article")).toHaveCount(2);
  await expect(comparison.getByText("Scored responses", { exact: true })).toHaveCount(2);
  await expect(comparison.getByText("Policy-ready learners", { exact: true })).toHaveCount(2);

  for (const viewport of [
    { width: 1366, height: 768, label: "1366" },
    { width: 1024, height: 768, label: "1024" },
    { width: 768, height: 1024, label: "768" },
    { width: 390, height: 844, label: "390" }
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await expect.poll(() => page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      controlHeights: [...document.querySelectorAll(
        ".teacher-saved-groups button:not([disabled]), .teacher-saved-groups input, .teacher-saved-groups textarea"
      )].map(element => Math.round(element.getBoundingClientRect().height))
    }))).toEqual(expect.objectContaining({
      viewport: viewport.width,
      documentWidth: viewport.width
    }));
    const undersizedControls = await page.evaluate(() => (
      [...document.querySelectorAll(
        ".teacher-saved-groups button:not([disabled]), .teacher-saved-groups input, .teacher-saved-groups textarea"
      )].map(element => ({
        element: element.tagName.toLowerCase(),
        className: element.className,
        label: element.getAttribute("aria-label") || element.textContent?.trim() || "",
        height: Math.round(element.getBoundingClientRect().height)
      })).filter(control => control.height < 44)
    ));
    expect(undersizedControls).toEqual([]);
    await expect(workspace).toHaveScreenshot(
      `teacher-instructional-groups-${viewport.label}.png`,
      { animations: "disabled", maxDiffPixelRatio: 0.025 }
    );
  }
  await page.setViewportSize({ width: 1366, height: 768 });

  await firstGroup.getByText("Review movement", { exact: true }).click();
  await expect(firstGroup.getByText(/stayed · 0 joined · 0 left/)).toBeVisible();
  await firstGroup.getByRole("button", {
    name: "Record current movement review",
    exact: true
  }).click();
  await expect(workspace.getByRole("status")).toContainText(
    "Movement review recorded for Audit Initial Sounds Group."
  );

  await firstGroup.getByRole("button", { name: "Assign follow-up", exact: true }).click();
  const assignment = workspace.locator(".teacher-group-assignment");
  await expect(assignment.getByRole("heading", {
    name: "Assign follow-up · Audit Initial Sounds Group",
    exact: true
  })).toBeVisible();
  await assignment.getByLabel("Teaching activity").fill(
    "Model the shared target, rehearse together, then check one unseen transfer item."
  );
  await assignment.getByRole("button", { name: "Assign tracked follow-up", exact: true }).click();
  await expect(workspace.getByRole("status")).toContainText(
    "Follow-up assigned for Audit Initial Sounds Group. It is now tracked on Today."
  );

  const axeResult = await new AxeBuilder({ page }).include(".teacher-saved-groups").analyze();
  expect(axeResult.violations.filter(
    violation => violation.impact === "serious" || violation.impact === "critical"
  )).toEqual([]);

  await page.reload();
  await expect(page.getByRole("heading", {
    name: "Turn evidence into a clear next step",
    exact: true
  })).toBeVisible({
    timeout: 20_000
  });
  const restoredWorkspace = page.getByRole("region", { name: "Saved instructional groups" });
  await expect(restoredWorkspace).toHaveAttribute("data-saved-group-count", "2", {
    timeout: 20_000
  });
  await expect(restoredWorkspace.getByRole("article", {
    name: "Saved instructional group: Audit Initial Sounds Group"
  })).toBeVisible();

  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Today", exact: true })
    .click();
  const intervention = page.getByRole("article", {
    name: "Intervention for Audit Initial Sounds Group"
  });
  await expect(intervention).toBeVisible({ timeout: 20_000 });
  await expect(intervention).toContainText("Planned · delivery needed");
  await expect(intervention).toContainText(
    "Model the shared target, rehearse together, then check one unseen transfer item."
  );

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("@teacher-insight-actions wires every actionable insight into practice, planning, print, and observation", async ({
  page
}) => {
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  await selectAuditClass(page);
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Progress", exact: true })
    .click();

  const insights = page.locator('[data-actionable-insight="true"]');
  await expect(insights.first()).toBeVisible({ timeout: 20_000 });
  const insightCount = await insights.count();
  expect(insightCount).toBeGreaterThan(0);
  for (let index = 0; index < insightCount; index += 1) {
    const insight = insights.nth(index);
    for (const label of [
      "Assign practice",
      "Plan small group",
      "Print resource",
      "Record observation"
    ]) {
      await expect(insight.getByRole("button", { name: label, exact: true })).toBeVisible();
      await expect(insight.getByRole("button", { name: label, exact: true })).toBeEnabled();
    }
  }

  for (const viewport of [
    { width: 1366, height: 768, label: "1366" },
    { width: 1024, height: 768, label: "1024" },
    { width: 768, height: 1024, label: "768" },
    { width: 390, height: 844, label: "390" }
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await expect.poll(() => page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      actionHeights: [...document.querySelectorAll(
        '[data-actionable-insight="true"] > .teacher-insight-action-buttons > button'
      )].map(element => Math.round(element.getBoundingClientRect().height))
    }))).toEqual(expect.objectContaining({
      viewport: viewport.width,
      documentWidth: viewport.width
    }));
    const undersizedActions = await page.evaluate(() => (
      [...document.querySelectorAll(
        '[data-actionable-insight="true"] > .teacher-insight-action-buttons > button'
      )].filter(element => Math.round(element.getBoundingClientRect().height) < 44)
        .map(element => element.textContent?.trim())
    ));
    expect(undersizedActions).toEqual([]);
    await expect(insights.first()).toHaveScreenshot(
      `teacher-insight-actions-${viewport.label}.png`,
      { animations: "disabled", maxDiffPixelRatio: 0.025 }
    );
  }
  await page.setViewportSize({ width: 1366, height: 768 });

  const exactInsight = insights.first();
  await expect(exactInsight).toHaveCount(1);
  const exactInsightLabel = await exactInsight.getAttribute("data-insight-label");
  expect(exactInsightLabel).toBeTruthy();

  await exactInsight.getByRole("button", { name: "Assign practice", exact: true }).click();
  let dialog = page.getByRole("dialog", {
    name: `Assign practice for ${exactInsightLabel}`
  });
  await expect(dialog).toBeVisible();
  const dialogAxe = await new AxeBuilder({ page }).include(".teacher-insight-action-modal").analyze();
  expect(dialogAxe.violations.filter(
    violation => violation.impact === "serious" || violation.impact === "critical"
  )).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => dialog.evaluate(element => ({
    left: Math.round(element.getBoundingClientRect().left),
    right: Math.round(element.getBoundingClientRect().right),
    viewport: window.innerWidth,
    controlHeights: [...element.querySelectorAll("button, input:not([type='checkbox']), textarea")]
      .map(control => Math.round(control.getBoundingClientRect().height))
  }))).toEqual(expect.objectContaining({
    left: 0,
    right: 390,
    viewport: 390
  }));
  const undersizedDialogControls = await dialog.evaluate(element => (
    [...element.querySelectorAll("button, input:not([type='checkbox']), textarea")]
      .filter(control => Math.round(control.getBoundingClientRect().height) < 44)
      .map(control => control.getAttribute("aria-label") || control.textContent?.trim())
  ));
  expect(undersizedDialogControls).toEqual([]);
  await expect(dialog.locator(".teacher-insight-action-dialog")).toHaveScreenshot(
    "teacher-insight-action-dialog-390.png",
    { animations: "disabled", maxDiffPixelRatio: 0.025 }
  );
  await page.setViewportSize({ width: 1366, height: 768 });
  await expect(
    dialog.locator("fieldset").nth(1).locator('input[type="checkbox"]:checked').first()
  ).toBeChecked();
  await dialog.getByRole("button", {
    name: "Assign practice and track response",
    exact: true
  }).click();
  await expect(exactInsight.getByRole("status")).toContainText(
    `Practice assigned for ${exactInsightLabel}; its response is tracked on Today.`
  );

  await exactInsight.getByRole("button", { name: "Plan small group", exact: true }).click();
  dialog = page.getByRole("dialog", {
    name: `Plan small group for ${exactInsightLabel}`
  });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", {
    name: "Plan small group and track response",
    exact: true
  }).click();
  await expect(exactInsight.getByRole("status")).toContainText(
    `Small-group plan saved for ${exactInsightLabel}; its response is tracked on Today.`
  );

  const popupPromise = page.waitForEvent("popup");
  await exactInsight.getByRole("button", { name: "Print resource", exact: true }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState("domcontentloaded");
  await expect(popup).toHaveTitle(/sound practice pack/);
  await popup.close();
  await expect(exactInsight.getByRole("status")).toContainText(
    `Printable decodable resource opened for ${exactInsightLabel}.`
  );

  await exactInsight.getByRole("button", { name: "Record observation", exact: true }).click();
  dialog = page.getByRole("dialog", {
    name: `Record observation for ${exactInsightLabel}`
  });
  await dialog.getByLabel("Observed evidence").fill(
    "Learners segmented the initial phoneme accurately with counters but needed a model before blending."
  );
  await dialog.getByRole("button", {
    name: "Record observation and track response",
    exact: true
  }).click();
  await expect(exactInsight.getByRole("status")).toContainText(
    `Observation recorded for ${exactInsightLabel}; its follow-up is tracked on Today.`
  );

  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Today", exact: true })
    .click();
  const practiceIntervention = page.getByRole("article", {
    name: `Intervention for ${exactInsightLabel} practice`
  });
  const groupIntervention = page.getByRole("article", {
    name: `Intervention for ${exactInsightLabel} group`
  });
  const observationIntervention = page.getByRole("article", {
    name: `Intervention for ${exactInsightLabel} observation follow-up`
  });
  await expect(practiceIntervention).toHaveCount(1, { timeout: 20_000 });
  await expect(groupIntervention).toHaveCount(1);
  await expect(observationIntervention).toHaveCount(1);
  await expect(practiceIntervention).toContainText("Planned · delivery needed");
  await expect(groupIntervention).toContainText("Planned · delivery needed");
  await expect(observationIntervention).toContainText("Planned · delivery needed");

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("@teacher-assessment-hub uses purpose-led language and routes every purpose from one hub", async ({
  page
}) => {
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  await selectAuditClass(page);

  const primaryNav = page.getByTestId("teacher-primary-nav");
  await primaryNav.getByRole("button", { name: "Assess", exact: true }).click();
  const unscopedHub = page.locator('[data-teacher-intent="assess"]');
  const unscopedActions = unscopedHub.getByRole("region", { name: "Assessment hub tools" });
  await expect(unscopedActions.getByRole("button", { name: "Choose learner", exact: true })).toHaveCount(3);
  await unscopedActions.getByRole("article").filter({ hasText: "Universal benchmark" })
    .getByRole("button", { name: "Choose learner", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Classes", exact: true })).toBeVisible();

  const rosterAdmin = page.locator(".teacher-roster-admin");
  if (!await rosterAdmin.evaluate(element => element.open)) {
    await rosterAdmin.locator(":scope > summary").click();
  }
  const aaravRow = page.locator(".teacher-roster-table").getByRole("row").filter({ hasText: "Aarav" });
  await aaravRow.getByRole("button", { name: "Open learner", exact: true }).click();
  await page.getByRole("region", { name: "Learner detail: Aarav" })
    .getByRole("button", { name: "Assess Aarav", exact: true })
    .click();

  const assessTools = page.getByRole("navigation", { name: "Assess tools" });
  await expect(assessTools.getByRole("button")).toHaveCount(1);
  await expect(assessTools.getByRole("button", { name: "Assessment hub", exact: true })).toBeVisible();
  await expect(primaryNav).not.toContainText(/Checkpoints|EL Checks|Advanced Phonics/);

  const hub = page.locator('[data-teacher-intent="assess"]');
  await expect(hub.getByRole("heading", { name: "Choose an assessment purpose", exact: true })).toBeVisible();
  const actions = hub.getByRole("region", { name: "Assessment hub tools" });
  await expect(actions.getByRole("article")).toHaveCount(4);
  for (const category of [
    "Universal benchmark",
    "Diagnostic follow-up",
    "Progress monitoring",
    "Practice"
  ]) {
    await expect(actions.getByText(category, { exact: true })).toBeVisible();
  }
  await expect(actions).not.toContainText(/Checkpoints|EL Checks|Advanced Phonics/);

  const languageGuide = hub.locator(".teacher-assessment-language-guide");
  await expect(languageGuide.getByText("Assessment language guide", { exact: true })).toBeVisible();
  for (const legacyLabel of ["Checkpoints", "EL Checks", "Advanced Phonics"]) {
    await expect(languageGuide.getByText(legacyLabel, { exact: true })).toBeAttached();
  }

  await actions.getByRole("article").filter({ hasText: "Universal benchmark" })
    .getByRole("button", { name: "Open", exact: true })
    .click();
  await expect(page.getByText("Universal benchmark", { exact: true })).toBeVisible();
  await expect(page.getByText(/consistent starting point/)).toBeVisible();

  await primaryNav.getByRole("button", { name: "Assess", exact: true }).click();
  await page.getByRole("region", { name: "Assessment hub tools" })
    .getByRole("article").filter({ hasText: "Diagnostic follow-up" })
    .getByRole("button", { name: "Open", exact: true })
    .click();
  await expect(page.getByText("Diagnostic follow-up", { exact: true })).toBeVisible();
  await expect(page.getByText(/closer evidence you need/)).toBeVisible();

  await primaryNav.getByRole("button", { name: "Assess", exact: true }).click();
  await page.getByRole("region", { name: "Assessment hub tools" })
    .getByRole("article").filter({ hasText: "Progress monitoring" })
    .getByRole("button", { name: "Open", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Choose a comparable assessment for Aarav", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Phonics Pattern Diagnostic", exact: true })).toBeVisible();

  await primaryNav.getByRole("button", { name: "Assess", exact: true }).click();
  await page.getByRole("region", { name: "Assessment hub tools" })
    .getByRole("article").filter({ hasText: "Practice" })
    .getByRole("button", { name: "Open", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Prepare teaching and practice", exact: true })).toBeVisible();
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

test("@teacher-urgency-order puts setup and Today actions before pulse, with roster admin collapsed", async ({
  page
}) => {
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  const classSelect = page.getByLabel("Current class");
  await classSelect.selectOption({ label: "Audit Class A" });
  await expect(page.getByRole("region", { name: "Today's class briefing" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Class summary" })).toBeVisible();

  expect(await page.locator("[data-teacher-priority]").evaluateAll(elements => (
    elements.map(element => element.dataset.teacherPriority)
  ))).toEqual(["setup-blockers", "today-actions", "today-actions", "class-pulse"]);

  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Classes", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Classes", exact: true })).toBeVisible();

  const rosterAdmin = page.locator(".teacher-roster-admin");
  const rosterSummary = rosterAdmin.locator(":scope > summary");
  await expect(rosterSummary).toContainText("Roster administration");
  await expect(rosterSummary).toContainText("12 active learners");
  await expect(rosterAdmin).not.toHaveAttribute("open", "");
  await expect(page.getByRole("heading", { name: "Students - Audit Class A", exact: true })).toBeHidden();
  expect(await page.locator("[data-teacher-priority]").evaluateAll(elements => (
    elements.map(element => element.dataset.teacherPriority)
  ))).toEqual(["setup-blockers", "class-pulse", "roster-admin"]);

  await rosterSummary.focus();
  await page.keyboard.press("Enter");
  await expect(rosterAdmin).toHaveAttribute("open", "");
  await expect(page.getByRole("heading", { name: "Students - Audit Class A", exact: true })).toBeVisible();
  await expect(rosterSummary).toBeFocused();
});

test("@teacher-action-feedback announces clipboard, undo, print, and export states consistently", async ({
  page
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async text => {
          if (window.__literacyPathRejectClipboard) throw new Error("Clipboard blocked");
          window.__literacyPathCopiedClassCode = text;
        }
      }
    });
    window.print = () => {
      window.__literacyPathPrintRequested = true;
    };
  });

  await logIn(page, "audit-teacher-a@literacypath.invalid");
  await selectAuditClass(page);

  const classCodePanel = page.getByLabel("Class sign-in code");
  await classCodePanel.getByRole("button", { name: "Copy code", exact: true }).click();
  const classCodeFeedback = classCodePanel.locator("[data-action-feedback]");
  await expect(classCodeFeedback).toHaveAttribute("data-feedback-kind", "success");
  await expect(classCodeFeedback).toHaveAttribute("aria-live", "polite");
  await expect(classCodeFeedback).toHaveAttribute("aria-atomic", "true");

  await page.evaluate(() => {
    window.__literacyPathRejectClipboard = true;
  });
  await classCodePanel.getByRole("button", { name: "Copy code", exact: true }).click();
  await expect(classCodeFeedback).toHaveAttribute("data-feedback-kind", "error");
  await expect(classCodeFeedback).toHaveAttribute("role", "alert");
  await expect(classCodeFeedback).toHaveAttribute("aria-live", "assertive");

  const roster = page.locator(".teacher-roster-table");
  const kaiRow = roster.getByRole("row").filter({ hasText: "Kai" });
  await kaiRow.getByRole("button", { name: "Archive", exact: true }).click();
  await page.getByRole("dialog", { name: "Archive Kai" })
    .getByRole("button", { name: "Archive learner", exact: true })
    .click();
  const undoFeedback = page.locator('[data-action-feedback][data-feedback-kind="undo"]');
  await expect(undoFeedback).toContainText("Kai archived");
  await undoFeedback.getByRole("button", { name: "Undo archive for Kai", exact: true }).click();
  await expect(roster.getByRole("row").filter({ hasText: "Kai" })).toBeVisible();
  await expect(page.locator(".teacher-dashboard-message[data-feedback-kind='success']")).toContainText(
    "Kai restored"
  );

  await roster.getByRole("checkbox", { name: "Select Aarav", exact: true }).check();
  await page.getByRole("button", { name: "Preview selected cards (1)", exact: true }).click();
  const cardFeedback = page.locator(".teacher-login-card-feedback");
  await expect(cardFeedback).toHaveAttribute("data-feedback-kind", "success");
  await page.getByRole("button", { name: "Print cards", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__literacyPathPrintRequested)).toBe(true);
  await expect(cardFeedback).toContainText("Print dialog opened");
  await page.getByRole("button", { name: "Return to roster", exact: true }).click();

  await openAaravReports(page);
  await page.getByRole("button", { name: "Open Whole Child", exact: true }).click();
  await page.getByRole("button", { name: "Print or save PDF", exact: true }).click();
  const reportFeedback = page.locator(".lg-report-live-message[data-action-feedback]");
  await expect(reportFeedback).toHaveAttribute("data-feedback-kind", "success");
  await expect(reportFeedback).toContainText("Print dialog opened");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download knowledge data", exact: true }).click();
  await downloadPromise;
  await expect(reportFeedback).toHaveAttribute("data-feedback-kind", "success");
  await expect(reportFeedback).toContainText("Report data downloaded");
});

test("@el-empty-export-policy requires scope, warns, and downloads a banner-only workbook", async ({
  page
}) => {
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  await selectAuditClass(page);

  const roster = page.locator(".teacher-roster-table");
  const amaraRow = roster.getByRole("row").filter({ hasText: "Amara" });
  await amaraRow.getByRole("button", { name: "Open learner", exact: true }).click();
  const learnerDetail = page.getByRole("region", { name: "Learner detail: Amara" });
  await learnerDetail.getByRole("button", { name: "Review Amara’s progress", exact: true }).click();
  await page.getByRole("navigation", { name: "Progress tools" })
    .getByRole("button", { name: "Reports", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Open EL Assessments", exact: true })).toBeEnabled({
    timeout: 20_000
  });
  await page.getByRole("button", { name: "Open EL Assessments", exact: true }).click();

  const benchmarkScopeLine = page.locator(".student-report-benchmark-scope-line");
  await expect(benchmarkScopeLine).toContainText(
    "Choose grade and assessment window"
  );
  await expect(page.getByRole("button", { name: "Export This Route", exact: true })).toBeDisabled();
  await page.getByLabel("EL report grade").selectOption("K");
  await page.getByLabel("EL report assessment window").selectOption("BOY");
  await expect(benchmarkScopeLine).toContainText(
    "Kindergarten · Beginning of year"
  );

  await page.getByRole("button", { name: "Download EL data", exact: true }).click();
  const warning = page.getByRole("dialog", { name: "Nothing to report for Amara" });
  await expect(warning).toBeVisible();
  await expect(warning).toContainText(/No saved EL evidence/i);
  await expect(warning).toContainText("It will not contain zero-filled assessment rows.");

  const downloadPromise = page.waitForEvent("download");
  await warning.getByRole("button", { name: "Export anyway", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/kindergarten-boy.*\.xlsx$/i);
  expect(download.suggestedFilename()).not.toMatch(/not[-_\s]*recorded/i);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(await download.path());
  expect(workbook.worksheets.map(sheet => sheet.name)).toEqual([
    "Student Summary",
    "Report Provenance",
    "Metric Definitions"
  ]);
  const summary = workbook.getWorksheet("Student Summary");
  expect(summary.getCell("A2").value).toBe("Nothing to report");
  expect(String(summary.getCell("B2").value)).toContain("Nothing to report for Amara");
  expect(workbook.getWorksheet("Letter Names & Sounds")).toBeUndefined();
  expect(workbook.getWorksheet("Advanced Phonics Patterns")).toBeUndefined();
});

test("@el-export-consistency reconciles seeded Skills Check letters into both reachable exports", async ({
  page
}) => {
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  await selectAuditClass(page);

  const roster = page.locator(".teacher-roster-table");
  const baoRow = roster.getByRole("row").filter({ hasText: "Bao" });
  await baoRow.getByRole("button", { name: "Open learner", exact: true }).click();
  const learnerDetail = page.getByRole("region", { name: "Learner detail: Bao" });
  await learnerDetail.getByRole("button", { name: "Review Bao’s progress", exact: true }).click();
  await page.getByRole("navigation", { name: "Progress tools" })
    .getByRole("button", { name: "Reports", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Open Whole Child", exact: true })).toBeEnabled({
    timeout: 20_000
  });
  await page.getByRole("button", { name: "Open Whole Child", exact: true }).click();

  const csvDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download knowledge data", exact: true }).click();
  const wholeChildCsv = await readDownloadText(await csvDownloadPromise);
  expect(wholeChildCsv).toContain("Uppercase M: letter name");
  expect(wholeChildCsv).toContain("Lowercase M: letter sound");
  expect(wholeChildCsv).toContain("Skills Check");
  expect(wholeChildCsv).toMatch(/"Uppercase M: letter name","Secure"/);
  expect(wholeChildCsv).toMatch(/"Lowercase M: letter sound","Needs support"/);
  expect(wholeChildCsv).not.toMatch(/"M: letter (?:name|sound)"/);

  await page.getByRole("link", { name: /EL Assessments/ }).click();
  await page.getByLabel("EL report grade").selectOption("K");
  await page.getByLabel("EL report assessment window").selectOption("BOY");
  await page.getByRole("button", { name: "Download EL data", exact: true }).click();
  const warning = page.getByRole("dialog", { name: "No saved EL administrations for Bao" });
  await expect(warning).toContainText("relevant Skills Check letter evidence");

  const workbookDownloadPromise = page.waitForEvent("download");
  await warning.getByRole("button", { name: "Export anyway", exact: true }).click();
  const workbookDownload = await workbookDownloadPromise;
  expect(workbookDownload.suggestedFilename()).not.toMatch(/not[-_\s]*recorded/i);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(await workbookDownload.path());
  const letterSheet = workbook.getWorksheet("Letter Names & Sounds");
  expect(letterSheet).toBeDefined();
  const headers = letterSheet.getRow(1).values.slice(1);
  let letterM = null;
  letterSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1 || row.getCell(1).value !== "M/m") return;
    const values = row.values.slice(1);
    letterM = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
  expect(letterM).not.toBeNull();
  expect(letterM["Uppercase name result"]).toBe("Mastered");
  expect(letterM["Lowercase sound result"]).toBe("Needs Support");
  expect(letterM["Uppercase name evidence provenance"]).toContain("Source: Skills Check");

  const summaryValues = workbook.getWorksheet("Student Summary").getColumn(2).values.join(" ");
  expect(summaryValues).toContain("assessment_attempts:");
  expect(summaryValues).toMatch(/Evidence Read|2026-/);
});

test("@teacher-metric-definitions exposes complete definitions on every core figure and in exports", async ({
  page
}) => {
  async function expectDefinedMetric(scope, metricId) {
    const figure = scope.locator(`[data-metric-figure="${metricId}"]`).first();
    await expect(figure).toBeVisible();
    const definition = figure.locator(`[data-metric-definition="${metricId}"]`);
    const trigger = definition.getByRole("button", { name: /definition$/ });
    await expect(trigger).toHaveAttribute("aria-describedby", /.+/);
    await trigger.focus();
    const tooltip = definition.getByRole("tooltip");
    await expect(tooltip).toBeVisible();
    const tooltipBox = await tooltip.boundingBox();
    const viewport = page.viewportSize();
    expect(tooltipBox).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(tooltipBox.x).toBeGreaterThanOrEqual(0);
    expect(tooltipBox.y).toBeGreaterThanOrEqual(0);
    expect(tooltipBox.x + tooltipBox.width).toBeLessThanOrEqual(viewport.width);
    expect(tooltipBox.y + tooltipBox.height).toBeLessThanOrEqual(viewport.height);
    for (const label of ["Denominator:", "Date range:", "Minimum evidence:", "Updated:"]) {
      await expect(tooltip).toContainText(label);
    }
  }

  await logIn(page, "audit-teacher-a@literacypath.invalid");
  await selectAuditClass(page);

  const classSummary = page.getByRole("region", { name: "Class summary" });
  for (const metricId of ["started", "accuracy", "active"]) {
    await expectDefinedMetric(classSummary, metricId);
  }

  const aaravRow = page.locator(".teacher-roster-table").getByRole("row").filter({ hasText: "Aarav" });
  for (const metricId of ["current-skill", "mastered", "accuracy"]) {
    await expectDefinedMetric(aaravRow, metricId);
  }

  await aaravRow.getByRole("button", { name: "Open learner", exact: true }).click();
  const learnerDetail = page.getByRole("region", { name: "Learner detail: Aarav" });
  for (const metricId of ["current-skill", "accuracy", "mastered", "active", "trails"]) {
    await expectDefinedMetric(learnerDetail, metricId);
  }

  await learnerDetail.getByRole("button", { name: "Review Aarav’s progress", exact: true }).click();
  await page.getByRole("navigation", { name: "Progress tools" })
    .getByRole("button", { name: "Reports", exact: true })
    .click();
  await page.getByRole("button", { name: "Open Skills Check", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Skills Check data", exact: true }).click();
  const csv = await readDownloadText(await downloadPromise);
  for (const content of [
    "Metric definitions",
    "Metric definition",
    "Denominator",
    "Date range",
    "Minimum evidence",
    "Update time",
    "current-skill",
    "trails"
  ]) {
    expect(csv).toContain(content);
  }
});

test("@report-export-provenance keeps the complete provenance snapshot in reachable PDF and CSV surfaces", async ({
  page
}) => {
  const requiredFields = [
    "Report",
    "School / organisation",
    "Class",
    "Learner",
    "Learner ID",
    "Learner ID policy",
    "Generated at",
    "Time zone",
    "Filters",
    "Evidence window",
    "App version(s)",
    "Assessment version(s)",
    "Content version(s)",
    "Policy version(s)",
    "Definitions",
    "Privacy classification"
  ];
  const readRenderedSnapshot = async locator => locator.locator("dl > div").evaluateAll(rows => (
    rows.map(row => ({
      field: row.querySelector("dt")?.textContent?.trim() || "",
      value: row.querySelector("dd")?.textContent?.trim() || ""
    }))
  ));

  await logIn(page, "audit-teacher-a@literacypath.invalid");
  await selectAuditClass(page);
  await openAaravReports(page);

  await page.getByRole("button", { name: "Class Report", exact: true }).click();
  const classProvenance = page
    .getByRole("region", { name: "Class Report" })
    .getByRole("region", { name: "Report provenance" });
  await expect(classProvenance).toBeVisible();
  const classSnapshot = await readRenderedSnapshot(classProvenance);
  expect(classSnapshot.map(row => row.field)).toEqual(requiredFields);
  expect(classSnapshot.every(row => row.value.length > 0)).toBe(true);
  expect(classSnapshot.find(row => row.field === "Filters")?.value).toContain("Audit Class A");
  expect(classSnapshot.find(row => row.field === "Privacy classification")?.value).toBe(
    "CONFIDENTIAL — student educational record — authorised school staff only"
  );

  await page.getByRole("button", { name: "Student Report", exact: true }).click();
  await page.getByRole("button", { name: "Open Skills Check", exact: true }).click();
  const studentProvenance = page.getByRole("region", { name: "Report provenance" });
  await expect(studentProvenance).toBeVisible({ timeout: 20_000 });
  const studentSnapshot = await readRenderedSnapshot(studentProvenance);
  expect(studentSnapshot.map(row => row.field)).toEqual(requiredFields);
  expect(studentSnapshot.find(row => row.field === "Learner")?.value).toBe("Aarav");
  expect(studentSnapshot.find(row => row.field === "Class")?.value).toBe("Audit Class A");
  expect(studentSnapshot.find(row => row.field === "Generated at")?.value).toMatch(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
  );

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Skills Check data", exact: true }).click();
  const csv = await readDownloadText(await downloadPromise);
  for (const field of requiredFields) {
    expect(csv).toContain(`"${field}"`);
  }
  expect(csv).toContain('"Report provenance"');
  expect(csv).toContain('"CONFIDENTIAL — student educational record — authorised school staff only"');
  expect(csv).toMatch(/"Content version\(s\)","(?:content-|\d+ distinct exact versions; complete-set FNV-1a checksum)/);
  expect(csv).toMatch(/"Policy version\(s\)","(?!No versioned)[^"]+"/);
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

  await page.getByRole("region", { name: "Learner detail: Aisha" })
    .getByRole("button", { name: "Close learner", exact: true })
    .click();
  await groups.getByRole("button", { name: /Whole class/ }).click();
  const roster = page.locator(".teacher-roster-table");
  const learners = [
    ["Aarav", "40000000-0000-4000-8000-000000000001"],
    ["Camila", "40000000-0000-4000-8000-000000000005"]
  ];
  for (const [index, [name, id]] of learners.entries()) {
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
    if (index < learners.length - 1) {
      await page.getByRole("region", { name: `Learner detail: ${name}` })
        .getByRole("button", { name: "Close learner", exact: true })
        .click();
    }
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

test("@teacher-contextual-help keeps the question guide out of the dashboard and reachable from evidence", async ({
  page
}) => {
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  await selectAuditClass(page);

  await expect(page.locator(".question-type-guide, .question-guide-table")).toHaveCount(0);
  await expect(page.getByText("What each check actually tests", { exact: true })).toHaveCount(0);

  const groups = page.getByRole("region", { name: "Roster groups" });
  const directGuideButton = groups.getByRole("button", { name: "Question type guide", exact: true });
  await directGuideButton.click();
  let guide = page.getByRole("dialog", { name: "Question type guide" });
  await expect(guide).toBeVisible();
  const search = guide.getByRole("searchbox", {
    name: "Search checks, skills, or teaching guidance"
  });
  await expect(search).toBeFocused();
  await expect.poll(() => search.evaluate(input => input.getBoundingClientRect().width))
    .toBeGreaterThan(700);
  await expect(guide.getByRole("status")).toHaveText("18 of 18 question types shown");
  await expect(guide.locator(".teacher-question-guide-dialog")).toHaveScreenshot(
    "teacher-question-type-guide-searchable.png",
    { animations: "disabled", maxDiffPixelRatio: 0.025 }
  );
  await search.fill("digraphs");
  await expect(guide.getByRole("status")).toHaveText("2 of 18 question types shown");
  await expect(guide.getByRole("listitem")).toHaveCount(2);
  await expect(guide.getByRole("heading", { name: "Digraphs · choose the picture", exact: true })).toBeVisible();
  await expect(guide.getByText("Teach it as two letters, one sound with a gesture.", { exact: false })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(guide).toHaveCount(0);
  await expect(directGuideButton).toBeFocused();

  await page.locator(".teacher-roster-table").getByRole("row").filter({ hasText: "Aarav" })
    .getByRole("button", { name: "Open learner", exact: true })
    .click();
  const learnerDrawer = page.getByRole("region", { name: "Learner detail: Aarav" });
  await expect(learnerDrawer).toBeVisible();
  await learnerDrawer.getByRole("button", { name: "Question type guide", exact: true }).click();
  guide = page.getByRole("dialog", { name: "Question type guide" });
  await expect(guide).toBeVisible();
  await expect(guide.getByRole("searchbox", {
    name: "Search checks, skills, or teaching guidance"
  })).toBeFocused();
  await expect(guide.getByRole("status")).toHaveText("18 of 18 question types shown");
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
  await page.getByRole("button", { name: "Import CSV", exact: true }).click();
  const rosterImport = page.getByRole("region", { name: "Import learner names" });
  await rosterImport.getByLabel("Learner names").fill("Ava");
  await rosterImport.getByRole("button", { name: "Review import", exact: true }).click();
  await rosterImport.getByRole("button", { name: "Import 1 unique learners", exact: true }).click();

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

  const checkpointCard = page.getByRole("article").filter({ hasText: "Find the learner's starting point" });
  await checkpointCard.getByRole("button", { name: "Open", exact: true }).click();
  await expect(page.getByText("Universal benchmark", { exact: true })).toBeVisible();
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
  const columnPicker = page.locator(".teacher-roster-column-picker");
  await columnPicker.getByText(/Choose columns/).click();
  await columnPicker.getByLabel("Login", { exact: true }).check();
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

test("@teacher-roster-scale imports duplicates, bulk previews cards, archives, and transfers safely", async ({ page }) => {
  test.setTimeout(120_000);
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await logIn(page, "audit-teacher-b@literacypath.invalid");
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Classes", exact: true })
    .click();
  await page.getByLabel("New class").fill("Transfer Target");
  await page.getByRole("button", { name: "Create Class", exact: true }).click();
  const classSelect = page.getByLabel("Current class");
  await expect(classSelect.locator("option:checked")).toHaveText("Transfer Target");
  await classSelect.selectOption({ label: "Audit Class B" });
  await expect(classSelect.locator("option:checked")).toHaveText("Audit Class B");
  await expect(page.getByRole("heading", { name: "Students - Audit Class B", exact: true })).toBeVisible();
  await expect(page.locator(".teacher-roster-table").getByText("Mateo", { exact: true })).toBeVisible();

  const importNames = [
    "Mateo",
    "Mei",
    ...Array.from({ length: 26 }, (_, index) => `Bulk ${String(index + 1).padStart(2, "0")}`)
  ];
  const csv = `name\n${importNames.map(name => `"${name}"`).join("\n")}\n`;
  await page.getByRole("button", { name: "Import CSV", exact: true }).click();
  const rosterImport = page.getByRole("region", { name: "Import learner names" });
  await rosterImport.locator('input[type="file"]').setInputFiles({
    name: "roster.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv)
  });
  await expect(rosterImport.getByText("26 ready", { exact: true })).toBeVisible();
  await expect(rosterImport.getByRole("status")).toContainText("2 duplicates skipped");
  await expect(rosterImport.getByRole("list", { name: "Duplicate learner names" }).getByRole("listitem")).toHaveCount(2);
  await rosterImport.getByRole("button", { name: "Import 26 unique learners", exact: true }).click();

  const classSummary = page.getByRole("region", { name: "Class summary" });
  await expect(classSummary.locator(".teacher-roster-metric").filter({ hasText: "Students" }).getByText("39", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Roster groups" })
    .getByRole("button", { name: "Whole class 39", exact: true })).toBeVisible();
  const rosterTools = page.getByRole("region", { name: "Roster search, sort, and filters" });
  await rosterTools.getByLabel("Search roster").fill("Bulk 01");
  await expect(page.locator(".teacher-roster-table tbody > tr")).toHaveCount(1);
  await rosterTools.getByLabel("Sort").selectOption("last-active");
  await rosterTools.getByLabel("Filter").selectOption("not-started");
  await expect(rosterTools.getByText(/Showing/)).toContainText("1");
  await rosterTools.getByLabel("Search roster").fill("");
  await rosterTools.getByLabel("Filter").selectOption("all");

  const roster = page.locator(".teacher-roster-table");
  for (const learner of ["Mateo", "Mei"]) {
    await roster.getByRole("checkbox", { name: `Select ${learner}`, exact: true }).check();
  }
  await page.getByRole("button", { name: "Preview selected cards (2)", exact: true }).click();
  const cardPreview = page.getByRole("region", { name: "Login cards", exact: true });
  await expect(cardPreview).toHaveAttribute("data-teacher-route", "login-cards");
  await expect(cardPreview.locator(".teacher-print-login-card")).toHaveCount(2);
  await expect(cardPreview.getByText("2 cards", { exact: false }).first()).toBeVisible();
  await expect(cardPreview.getByText("Mateo", { exact: true })).toBeVisible();
  await expect(cardPreview.getByText("Mei", { exact: true })).toBeVisible();
  await cardPreview.getByRole("button", { name: "Return to roster", exact: true }).click();

  const bulk03 = roster.getByRole("row").filter({ hasText: "Bulk 03" });
  await bulk03.getByRole("button", { name: "Archive", exact: true }).click();
  const archiveDialog = page.getByRole("dialog", { name: "Archive Bulk 03" });
  await expect(archiveDialog.getByText(/complete evidence stays attached/)).toBeVisible();
  await archiveDialog.getByRole("button", { name: "Archive learner", exact: true }).click();
  await expect(classSummary.locator(".teacher-roster-metric").filter({ hasText: "Students" }).getByText("38", { exact: true })).toBeVisible();
  await expect(page.getByText("Archived learners (1)", { exact: true })).toBeVisible();

  const bulk04 = roster.getByRole("row").filter({ hasText: "Bulk 04" });
  await bulk04.getByRole("button", { name: "Transfer", exact: true }).click();
  const transferDialog = page.getByRole("dialog", { name: "Transfer Bulk 04" });
  await expect(transferDialog.getByText(/complete evidence history move together/)).toBeVisible();
  await transferDialog.getByLabel("Destination class").selectOption({ label: "Transfer Target" });
  await transferDialog.getByRole("button", { name: "Transfer learner", exact: true }).click();
  await expect(classSummary.locator(".teacher-roster-metric").filter({ hasText: "Students" }).getByText("37", { exact: true })).toBeVisible();

  await classSelect.selectOption({ label: "Transfer Target" });
  await expect(page.getByRole("heading", { name: "Students - Transfer Target", exact: true })).toBeVisible();
  await expect(page.locator(".teacher-roster-table").getByText("Bulk 04", { exact: true })).toBeVisible();
  await expect(page.locator(".teacher-roster-table").getByText("No practice yet", { exact: true })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("@teacher-class-code copies with an announcement and regenerates in-product", async ({ page }) => {
  const pageErrors = [];
  const nativeDialogs = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("dialog", async dialog => {
    nativeDialogs.push(dialog.message());
    await dialog.dismiss();
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async text => {
          window.__literacyPathCopiedClassCode = text;
        }
      }
    });
  });

  await logIn(page, "audit-teacher-b@literacypath.invalid");
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Classes", exact: true })
    .click();
  const classSelect = page.getByLabel("Current class");
  await classSelect.selectOption({ label: "Audit Class B" });

  const classCodePanel = page.getByLabel("Class sign-in code");
  const codeValue = classCodePanel.locator(".teacher-class-code-value");
  const originalCode = (await codeValue.textContent())?.trim();
  expect(originalCode).toMatch(/^[A-Z0-9]{6}$/);

  await classCodePanel.getByRole("button", { name: "Copy code", exact: true }).click();
  await expect(classCodePanel.getByRole("status")).toHaveText(`Class code ${originalCode} copied.`);
  await expect.poll(() => page.evaluate(() => window.__literacyPathCopiedClassCode)).toBe(originalCode);

  await classCodePanel.getByRole("button", { name: "New code", exact: true }).click();
  const codeDialog = page.getByRole("dialog", { name: "Make a new class code" });
  await expect(codeDialog).toBeVisible();
  await expect(codeDialog.getByText(/will stop working immediately/)).toBeVisible();
  await expect(codeDialog.getByText(/progress, and assessment evidence will not change/)).toBeVisible();
  await codeDialog.getByRole("button", { name: "Make new code", exact: true }).click();

  await expect(codeDialog).toHaveCount(0);
  await expect(codeValue).not.toHaveText(originalCode);
  const newCode = (await codeValue.textContent())?.trim();
  expect(newCode).toMatch(/^[A-Z0-9]{6}$/);
  await expect(classCodePanel.getByRole("status")).toHaveText(
    `New class code ${newCode} is ready. The old code no longer works.`
  );
  expect(nativeDialogs).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("@teacher-login-card-print opens an accessible A4 route and prints exact class context", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.print = () => {
      window.__literacyPathLoginCardsPrinted = true;
    };
  });

  await logIn(page, "audit-teacher-a@literacypath.invalid");
  await selectAuditClass(page);
  const roster = page.locator(".teacher-roster-table");
  for (const learner of ["Aarav", "Aisha"]) {
    await roster.getByRole("checkbox", { name: `Select ${learner}`, exact: true }).check();
  }
  await page.getByRole("button", { name: "Preview selected cards (2)", exact: true }).click();

  const printRoute = page.getByRole("region", { name: "Login cards", exact: true });
  await expect(printRoute).toHaveAttribute("data-teacher-route", "login-cards");
  await expect(printRoute.getByRole("status")).toHaveText("Print preview ready with 2 login cards.");
  const printPage = printRoute.getByRole("region", { name: "Login cards page 1 of 1" });
  await expect(printPage).toBeVisible();
  await expect(printPage.getByText("Audit Class A login cards", { exact: true })).toBeVisible();
  await expect(printPage.getByText("Class code QA7M2K", { exact: true })).toBeVisible();
  await expect(printPage.getByRole("article", { name: "Aarav login card" })).toBeVisible();
  await expect(printPage.getByRole("article", { name: "Aisha login card" })).toBeVisible();
  await expect.poll(() => printPage.evaluate(element => parseFloat(getComputedStyle(element).minHeight))).toBeGreaterThan(1000);

  await printRoute.getByRole("button", { name: "Print cards", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__literacyPathLoginCardsPrinted)).toBe(true);
  await printRoute.getByRole("button", { name: "Return to roster", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Students - Audit Class A", exact: true })).toBeVisible();
  await expect(page.getByLabel("Current class").locator("option:checked")).toHaveText("Audit Class A");
  expect(pageErrors).toEqual([]);
});

test("@teacher-student-preview blocks writes and returns to the exact teacher context", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await logIn(page, "audit-teacher-a@literacypath.invalid");
  await selectAuditClass(page);
  const roster = page.locator(".teacher-roster-table");
  await roster.getByRole("row").filter({ hasText: "Aarav" })
    .getByRole("button", { name: "Open learner", exact: true })
    .click();
  const shell = page.locator(".lg-app-shell");
  await expect(shell).toHaveAttribute("data-teacher-class-id", "30000000-0000-4000-8000-000000000001");
  await expect(shell).toHaveAttribute("data-teacher-group-id", "all");
  await expect(shell).toHaveAttribute("data-teacher-learner-id", "40000000-0000-4000-8000-000000000001");

  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Plan/Resources", exact: true })
    .click();
  const exactTeacherUrl = page.url();
  const storyAction = page.getByRole("article").filter({ hasText: "Story Quests" });
  const learnerProgressKey = "literacyPath.storyQuestProgress.v1.40000000-0000-4000-8000-000000000001";
  const learnerProgressBefore = await page.evaluate(key => localStorage.getItem(key), learnerProgressKey);
  await storyAction.getByRole("button", { name: "Open", exact: true }).click();

  const previewBanner = page.getByRole("complementary", { name: "Previewing as Aarav" });
  await expect(previewBanner).toBeVisible();
  await expect(previewBanner.getByText("Read-only preview · learner progress is protected", { exact: true })).toBeVisible();
  const firstStory = page.locator(".learn-story-quest-card").first();
  await expect(firstStory).toBeVisible();
  await firstStory.click();
  await expect(previewBanner.getByRole("status")).toHaveText(
    "Preview activity was blocked and was not saved to the learner record."
  );
  const learnerProgressAfter = await page.evaluate(key => localStorage.getItem(key), learnerProgressKey);
  expect(learnerProgressAfter).toBe(learnerProgressBefore);

  await previewBanner.getByRole("button", { name: "Return to Plan/Resources", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Prepare teaching and practice", exact: true })).toBeVisible();
  await expect(page).toHaveURL(exactTeacherUrl);
  await expect(shell).toHaveAttribute("data-teacher-class-id", "30000000-0000-4000-8000-000000000001");
  await expect(shell).toHaveAttribute("data-teacher-group-id", "all");
  await expect(shell).toHaveAttribute("data-teacher-learner-id", "40000000-0000-4000-8000-000000000001");
  expect(pageErrors).toEqual([]);
});

test("@teacher-intervention-loop plans, delivers, records, reviews, and resurfaces follow-up", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await logIn(page, "audit-teacher-a@literacypath.invalid");
  const classSelect = page.getByLabel("Current class");
  await classSelect.selectOption({ label: "Audit Class A" });
  await expect(classSelect.locator("option:checked")).toHaveText("Audit Class A");

  const attention = page.getByRole("region", { name: "Who needs attention" });
  const suggestion = attention.getByRole("listitem").first();
  const learnerName = (await suggestion.locator("strong").first().textContent())?.trim();
  expect(learnerName).toBeTruthy();
  await suggestion.getByRole("button", { name: `Plan support for ${learnerName}`, exact: true }).click();

  const lifecycle = page.getByRole("region", { name: "Intervention lifecycle" });
  const planner = lifecycle.locator("form.teacher-intervention-planner");
  await expect(planner).toBeVisible();
  await expect(planner.getByLabel(learnerName, { exact: true })).toBeChecked();
  await expect(planner.getByLabel("Evidence focus")).not.toHaveValue("");

  const groupName = `A5.10 lifecycle ${Date.now()}`;
  await planner.getByLabel("Owner").fill("Audit class teacher");
  await planner.getByLabel("Group name").fill(groupName);
  await planner.getByLabel("Teaching activity").fill("Model, blend, and reread six controlled words with immediate corrective feedback.");
  await planner.getByRole("button", { name: "Save intervention plan", exact: true }).click();
  await expect(lifecycle.getByRole("status")).toHaveText(`Intervention planned for ${groupName}.`);

  let intervention = lifecycle.getByRole("article", { name: `Intervention for ${groupName}` });
  await expect(intervention.getByText("Planned · delivery needed", { exact: true })).toBeVisible();
  await expect(intervention.getByText("Audit class teacher", { exact: true })).toBeVisible();
  await intervention.getByRole("button", { name: "Mark delivered", exact: true }).click();
  await expect(lifecycle.getByRole("status")).toHaveText(
    `Delivery recorded for ${groupName}. Add the observed outcome next.`
  );

  intervention = lifecycle.getByRole("article", { name: `Intervention for ${groupName}` });
  await intervention.getByLabel("Observed outcome").selectOption("ineffective");
  await intervention.getByLabel("Observation").fill(
    "The learner still guessed from the first sound on four of six words."
  );
  await intervention.getByRole("button", { name: "Record outcome", exact: true }).click();
  await expect(lifecycle.getByRole("status")).toHaveText(
    `Outcome recorded for ${groupName}. Review the response next.`
  );

  intervention = lifecycle.getByRole("article", { name: `Intervention for ${groupName}` });
  await expect(intervention.getByText("Outcome recorded · review needed", { exact: true })).toBeVisible();
  await intervention.getByRole("button", { name: "Review intervention", exact: true }).click();
  await expect(lifecycle.getByRole("status")).toHaveText(
    `Review complete for ${groupName}. Follow-up is now on Today.`
  );

  const resurfaced = lifecycle.getByRole("region", { name: "Interventions resurfaced on Today" });
  await expect(resurfaced.getByText("Ineffective — follow-up needed", { exact: true })).toBeVisible();
  await expect(resurfaced.getByText(new RegExp(groupName))).toBeVisible();
  await expect(resurfaced.getByRole("button", { name: "Plan follow-up", exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({ timeout: 20_000 });
  if ((await page.getByLabel("Current class").inputValue()) !== "30000000-0000-4000-8000-000000000001") {
    await page.getByLabel("Current class").selectOption("30000000-0000-4000-8000-000000000001");
  }
  const reloadedLifecycle = page.getByRole("region", { name: "Intervention lifecycle" });
  await expect(reloadedLifecycle.getByRole("article", { name: `Intervention for ${groupName}` })).toContainText(
    "Reviewed · follow-up needed"
  );
  await expect(
    reloadedLifecycle.getByRole("region", { name: "Interventions resurfaced on Today" })
      .getByText("Ineffective — follow-up needed", { exact: true })
  ).toBeVisible();
  await reloadedLifecycle.getByRole("button", { name: "Plan follow-up", exact: true }).click();
  const followUpPlanner = reloadedLifecycle.locator("form.teacher-intervention-planner");
  await expect(followUpPlanner.getByLabel("Group name")).toHaveValue(`${groupName} follow-up`);
  await followUpPlanner.getByLabel("Teaching activity").fill(
    "Reduce the set to three words, add sound boxes, and check transfer with three new words."
  );
  await followUpPlanner.getByRole("button", { name: "Save intervention plan", exact: true }).click();
  await expect(reloadedLifecycle.getByRole("status")).toHaveText(
    `Intervention planned for ${groupName} follow-up.`
  );
  await expect(
    reloadedLifecycle.getByRole("article", { name: `Intervention for ${groupName} follow-up` })
  ).toContainText("Planned · delivery needed");
  await expect(
    reloadedLifecycle.getByRole("region", { name: "Interventions resurfaced on Today" })
  ).toHaveCount(0);
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
    "Last Active",
    "Actions"
  ]) {
    await expect(roster.getByRole("columnheader", { name: column, exact: true })).toBeVisible();
  }
  const columnPicker = page.locator(".teacher-roster-column-picker");
  await columnPicker.getByText(/Choose columns/).click();
  await columnPicker.getByLabel("Sound Seekers", { exact: true }).check();
  await columnPicker.getByLabel("Login", { exact: true }).check();
  for (const column of ["Sound Seekers", "Login"]) {
    await expect(roster.getByRole("columnheader", { name: column, exact: true })).toBeVisible();
  }
  await expect(roster.locator("tbody > tr")).toHaveCount(12);
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

test("@admin-content-qa shows authored, approved, and runtime-selectable counts for a seeded skill", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await logIn(page, "audit-admin@literacypath.invalid");
  await page.getByRole("button", { name: "Admin", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Admin Dashboard", exact: true })).toBeVisible();
  await page.getByRole("tab", { name: /Release Check/ }).click();
  await page.getByRole("button", { name: /Content coverage/ }).click();

  const coveragePanel = page.getByRole("heading", { name: "Content Coverage", exact: true }).locator("..");
  await expect(coveragePanel.getByText(
    "One canonical rubric decides each skill. Authored is the deduplicated source bank, approved passes the strict content review, and student exposure today comes from the exact release-gated bank the child loader can return.",
    { exact: true }
  )).toBeVisible();
  await expect(coveragePanel.locator("tbody tr")).toHaveCount(30);

  const initialSoundsRow = page.getByRole("row").filter({
    has: page.getByRole("cell", { name: "Initial Sounds", exact: true })
  });
  await expect(initialSoundsRow.getByRole("cell", { name: "151", exact: true })).toBeVisible();
  await expect(initialSoundsRow.getByRole("cell", { name: "132", exact: true })).toBeVisible();
  await expect(initialSoundsRow.getByRole("cell", { name: "READY", exact: true })).toBeVisible();
  await expect(initialSoundsRow.getByRole("cell", {
    name: "Phonics curriculum + media QA",
    exact: true
  })).toBeVisible();
  await expect(initialSoundsRow.getByRole("cell", {
    name: "92 questions (L1 46; L2 46)",
    exact: true
  })).toBeVisible();
  await expect(initialSoundsRow.getByRole("cell", {
    name: "sha256:3e64b7a127d3",
    exact: true
  })).toBeVisible();
  await expect(initialSoundsRow.getByRole("cell", {
    name: "All canonical release dimensions pass.",
    exact: true
  })).toBeVisible();
  await expect(initialSoundsRow.getByRole("cell", { name: "None", exact: true })).toBeVisible();

  const hfwRow = page.getByRole("row").filter({
    has: page.getByRole("cell", { name: "High-Frequency Words 1-25", exact: true })
  });
  await expect(hfwRow.getByRole("cell", { name: "READY", exact: true })).toBeVisible();
  await expect(hfwRow.getByRole("cell", { name: "150", exact: true })).toBeVisible();
  await expect(hfwRow.getByRole("cell", { name: "147", exact: true })).toBeVisible();
  await expect(hfwRow.getByRole("cell", {
    name: "147 questions (L1 72; L2 75)",
    exact: true
  })).toBeVisible();
  await expect(hfwRow.getByRole("cell", {
    name: "sha256:12fe53fe2754",
    exact: true
  })).toBeVisible();
  await expect(hfwRow.getByRole("cell", {
    name: "All canonical release dimensions pass.",
    exact: true
  })).toBeVisible();
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
