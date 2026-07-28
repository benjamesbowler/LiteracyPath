import { expect, test } from "@playwright/test";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";
const AUDIT_CLASS_A_ID = "30000000-0000-4000-8000-000000000001";
const AARAV_ID = "40000000-0000-4000-8000-000000000001";

async function logIn(page) {
  if (!teacherPassword) {
    throw new Error(
      "LP_AUDIT_TEACHER_PASSWORD is required for the authenticated teacher evidence gate."
    );
  }

  await page.goto("/");
  await page.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" }).click();
  await expect(page.getByRole("heading", { name: "Teacher sign-in" })).toBeVisible();
  await page.getByRole("textbox", { name: "Email" })
    .fill("audit-teacher-a@literacypath.invalid");
  await page.getByLabel("Password", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({
    timeout: 20_000
  });
}

async function selectAuditClassFromToday(page) {
  const classSelect = page.getByLabel("Current class");
  await expect(classSelect).toBeEnabled({ timeout: 20_000 });
  if (await classSelect.inputValue() !== AUDIT_CLASS_A_ID) {
    await classSelect.selectOption({ label: "Audit Class A" });
  }
  await expect(classSelect).toHaveValue(AUDIT_CLASS_A_ID);
}

function dashboardAnswersRequest(request) {
  const url = new URL(request.url());
  const selectedColumns = String(url.searchParams.get("select") || "");
  return url.pathname.endsWith("/rest/v1/answers")
    && selectedColumns.includes("client_event_id")
    && selectedColumns.includes("diagnostic_target")
    && url.searchParams.get("teacher_id") !== null
    && String(url.searchParams.get("student_id") || "").startsWith("in.");
}

function requestRangeStart(request) {
  const url = new URL(request.url());
  const offset = Number(url.searchParams.get("offset"));
  if (Number.isFinite(offset)) return offset;

  const header = String(request.headers().range || "");
  const match = header.match(/(\d+)-\d+/);
  return match ? Number(match[1]) : 0;
}

function fullDashboardAnswerPage() {
  return Array.from({ length: 1000 }, (_, index) => ({
    id: `audit-truncated-answer-${index}`,
    client_event_id: `audit-truncated-event-${index}`,
    student_id: AARAV_ID,
    skill: "Initial Sounds",
    stage: "Initial Sounds",
    diagnostic_target: "/m/",
    question: `Paging ceiling probe ${index}`,
    chosen_answer: "m",
    correct_answer: "m",
    is_correct: true,
    answered_at: "2026-07-27T08:00:00.000Z"
  }));
}

async function expectDashboardPartialTruth(page, expectedDetail) {
  const partial = page.locator(
    '[data-teacher-surface="today"][data-teacher-state="partial"]'
  );
  await expect(partial).toBeVisible({ timeout: 20_000 });
  await expect(partial).toContainText(
    "Today's suggestions are paused because the student list or saved results could not be read completely."
  );
  await expect(partial).toContainText(
    "Missing students and results are not counted as zero. Class and student records are unchanged."
  );
  await expect(partial).toContainText(expectedDetail);
  await expect(page.getByRole("region", { name: "Today's class briefing" })).toHaveCount(0);
  await expect(partial.getByRole("button", { name: "Try loading again", exact: true }))
    .toBeVisible();
  return partial;
}

test(
  "@teacher-dashboard-source-truth a failed or truncated dashboard source is never converted to zero and a retry restores the briefing",
  async ({ page }) => {
    test.setTimeout(120_000);
    let sourceMode = "error";
    const observedRangeStarts = [];
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));

    await page.route("**/rest/v1/answers?**", async route => {
      const request = route.request();
      if (!dashboardAnswersRequest(request) || sourceMode === "complete") {
        await route.continue();
        return;
      }

      const rangeStart = requestRangeStart(request);
      observedRangeStarts.push({ mode: sourceMode, rangeStart });
      if (sourceMode === "truncated" && rangeStart === 0) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: {
            "Content-Range": "0-999/*"
          },
          body: JSON.stringify(fullDashboardAnswerPage())
        });
        return;
      }

      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          code: sourceMode === "truncated"
            ? "AUDIT_DASHBOARD_SECOND_PAGE_UNAVAILABLE"
            : "AUDIT_DASHBOARD_ANSWERS_UNAVAILABLE",
          message: "Intentional authenticated release-gate dashboard source failure"
        })
      });
    });

    await logIn(page);
    await selectAuditClassFromToday(page);

    let partial = await expectDashboardPartialTruth(
      page,
      "Class results could not be confirmed. No earlier class figure is being reused for today's suggestions."
    );
    expect(observedRangeStarts.some(entry => entry.mode === "error")).toBe(true);

    sourceMode = "complete";
    await partial.getByRole("button", { name: "Try loading again", exact: true }).click();
    await expect(page.getByRole("region", { name: "Today's class briefing" }))
      .toBeVisible({ timeout: 20_000 });

    sourceMode = "truncated";
    await page.reload();
    await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({
      timeout: 20_000
    });
    partial = await expectDashboardPartialTruth(
      page,
      "The full set of class results reached its safety limit. No missing result is being counted as zero."
    );
    expect(observedRangeStarts.some(
      entry => entry.mode === "truncated" && entry.rangeStart === 0
    )).toBe(true);
    expect(observedRangeStarts.some(
      entry => entry.mode === "truncated" && entry.rangeStart >= 1000
    )).toBe(true);

    sourceMode = "complete";
    await partial.getByRole("button", { name: "Try loading again", exact: true }).click();
    await expect(page.getByRole("region", { name: "Today's class briefing" }))
      .toBeVisible({ timeout: 20_000 });
    await expect(page.locator(
      '[data-teacher-surface="today"][data-teacher-state="partial"]'
    )).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  }
);

async function answersInSelectedPeriod(page) {
  const fact = page.locator(".class-report-screen-facts > div")
    .filter({ hasText: "Answers in period" });
  await expect(fact).toBeVisible();
  const value = await fact.locator("dd").innerText();
  const total = Number(value.trim());
  expect(Number.isFinite(total), "the selected-period answer count should be numeric").toBe(true);
  return total;
}

async function readButtonVisualState(button) {
  return button.evaluate(element => {
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      borderColor: style.borderColor,
      boxShadow: style.boxShadow,
      className: element.className,
      color: style.color,
      filter: style.filter,
      opacity: Number(style.opacity),
      transform: style.transform
    };
  });
}

function rgbChannels(value) {
  const match = String(value || "").match(
    /rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/
  );
  expect(match, `expected a computed RGB colour, received "${value}"`).not.toBeNull();
  return match.slice(1, 4).map(Number);
}

function expectRedDominant(value) {
  const [red, green, blue] = rgbChannels(value);
  expect(red).toBeGreaterThan(green);
  expect(red).toBeGreaterThan(blue);
}

test(
  "@teacher-class-report-output selected periods change real evidence and the printable class summary stays concise and truthful",
  async ({ page }) => {
    test.setTimeout(120_000);
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));

    await logIn(page);
    await selectAuditClassFromToday(page);
    await page.getByTestId("teacher-primary-nav")
      .getByRole("button", { name: "Reports", exact: true })
      .click();
    await expect(page.getByRole("heading", { name: "Open a report", exact: true }))
      .toBeVisible();

    const wholeClassStep = page.locator(".teacher-funnel-step[data-step='2']");
    await wholeClassStep.getByRole("button", { name: /^Whole class/ }).click();
    await page.getByRole("button", { name: "Show the report", exact: true }).click();

    await expect(page.getByRole("heading", { name: "Class report", exact: true }))
      .toBeVisible();
    await expect(page.locator("body")).not.toContainText(/\b(?:BOY|MOY|EOY)\b/);
    await expect(page.getByRole("button", { name: "Back to reports", exact: true }))
      .toBeVisible();
    const printButton = page.getByRole("button", { name: "Print or save PDF", exact: true });
    await expect(printButton).toBeEnabled({ timeout: 30_000 });

    const report = page.locator(".formal-class-report-document");
    await expect(report).toBeAttached();
    await expect(report).toBeHidden();
    await expect(report).toHaveAttribute("data-report-detail", "concise");
    const periodSelect = page.getByLabel("Class assessment period");
    await periodSelect.selectOption("last30");
    await expect(periodSelect).toHaveValue("last30");
    await expect(report.locator(".formal-class-report-provenance"))
      .toContainText("Last 30 days");
    const last30Total = await answersInSelectedPeriod(page);

    await periodSelect.selectOption("all");
    await expect(periodSelect).toHaveValue("all");
    await expect(report.locator(".formal-class-report-provenance")).toContainText("All time");
    await expect.poll(
      () => answersInSelectedPeriod(page),
      { timeout: 20_000 }
    ).toBeGreaterThan(last30Total);

    await page.emulateMedia({ media: "print" });
    const printEvidence = await report.evaluate(root => {
      const visible = element => {
        const style = getComputedStyle(element);
        return style.display !== "none" && style.visibility !== "hidden";
      };
      const pages = [...root.querySelectorAll(".formal-class-report-page")]
        .filter(visible)
        .map(pageElement => ({
          bodyText: String(
            pageElement.querySelector(".formal-class-report-page-body")?.innerText || ""
          ).trim(),
          footerText: String(
            pageElement.querySelector(".formal-class-report-running-footer")?.innerText || ""
          ).trim(),
          sectionCount: pageElement.querySelectorAll(
            ".formal-class-report-hero, .formal-class-report-section-band"
          ).length
        }));
      return {
        text: root.innerText,
        pages
      };
    });

    expect(printEvidence.pages).toHaveLength(1);
    printEvidence.pages.forEach((reportPage, index) => {
      expect(reportPage.sectionCount, `print page ${index + 1} needs real content`)
        .toBeGreaterThan(0);
      expect(reportPage.bodyText.length, `print page ${index + 1} must not be empty`)
        .toBeGreaterThan(80);
      expect(reportPage.footerText).toContain(`Page ${index + 1}`);
    });
    expect(printEvidence.text).not.toMatch(/(?:null|undefined|nan)%/i);
    expect(printEvidence.text).not.toMatch(/(^|\s)NR(?=\s|$)/m);
    expect(printEvidence.text).toContain("Teach next");
    expect(printEvidence.text).toContain("Suggested groups");
    expect(printEvidence.text).toContain("How to read this");
    expect(printEvidence.text).not.toContain("Student progress");
    expect(printEvidence.text).not.toContain("Reading summary");
    expect(pageErrors).toEqual([]);
  }
);

test(
  "@teacher-el-class-pdf the selected EL route prints its EL document rather than the general class report",
  async ({ page }) => {
    test.setTimeout(120_000);
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));

    await logIn(page);
    await selectAuditClassFromToday(page);
    await page.getByTestId("teacher-primary-nav")
      .getByRole("button", { name: "Reports", exact: true })
      .click();
    await page.locator(".teacher-funnel-step[data-step='2']")
      .getByRole("button", { name: /^Whole class/ })
      .click();
    await page.getByRole("button", { name: "Show the report", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Class report", exact: true }))
      .toBeVisible();

    await page.getByText("Formal EL reports and downloads", { exact: true }).click();
    const scopeSelect = page.getByRole("combobox", {
      name: "Choose EL results to include",
      exact: true
    });
    await expect(scopeSelect).toBeEnabled({ timeout: 30_000 });
    const availableScopes = await scopeSelect.locator("option").evaluateAll(options => (
      options
        .filter(option => option.value)
        .map(option => ({
          value: option.value,
          label: String(option.textContent || "").split(" (")[0].trim()
        }))
        .filter(option => (
          /^(?:Kindergarten|Grade \d+) · (?:Beginning|Middle|End) of year$/
            .test(option.label)
        ))
    ));
    expect(availableScopes.length).toBeGreaterThan(0);
    const chosenScope = availableScopes.at(-1);
    await scopeSelect.selectOption(chosenScope.value);
    await expect(scopeSelect.locator("option:checked")).toContainText(chosenScope.label);
    const formalPanel = page.locator(".el-formal-assessments-panel");
    await expect(formalPanel).toContainText(/saved EL assessments?/i);
    await expect(formalPanel).not.toContainText(
      /\b(?:EL route|included attempts?|candidate microphases?|assessment routes?)\b/i
    );

    const elDocument = page.locator('[data-print-document="el-class"]');
    await expect(elDocument).toBeAttached();
    await expect(elDocument).toContainText("Formal EL assessment record");
    await expect(elDocument).toContainText("Audit Class A");
    await expect(elDocument).toContainText(chosenScope.label);
    await expect(elDocument).toContainText("Aarav");
    await expect(elDocument).toContainText("Phonological and Phonemic Awareness");
    await expect(elDocument).toContainText("Decoding and Automaticity");
    await expect(elDocument).toContainText("Grade and time of year");
    await expect(elDocument).toContainText("Saved EL assessments included");
    await expect(elDocument).not.toContainText(
      /\b(?:EL route|included attempts?|candidate microphases?|assessment routes?|provisional microphase|teacher-confirmed microphase)\b/i
    );
    await expect(elDocument).not.toContainText(/\b(?:BOY|MOY|EOY)\b/);

    await page.evaluate(() => {
      window.__auditElPrintSnapshot = null;
      window.print = () => {
        window.__auditElPrintSnapshot = {
          target: document.body.dataset.teacherPrintTarget || "",
          elText: document.querySelector('[data-print-document="el-class"]')?.textContent || "",
          generalText: document.querySelector(".formal-class-report-document")?.textContent || ""
        };
      };
    });
    await page.getByRole("button", {
      name: "Print or save EL PDF",
      exact: true
    }).click();

    await expect.poll(() => page.evaluate(() => window.__auditElPrintSnapshot))
      .toMatchObject({
        target: "el-class"
      });
    const printSnapshot = await page.evaluate(() => window.__auditElPrintSnapshot);
    expect(printSnapshot.elText).toContain("Formal EL assessment record");
    expect(printSnapshot.elText).toContain("Aarav");
    expect(printSnapshot.elText).toContain("Phonological and Phonemic Awareness");
    expect(printSnapshot.elText).not.toMatch(
      /\b(?:EL route|included attempts?|candidate microphases?|assessment routes?|provisional microphase|teacher-confirmed microphase)\b/i
    );
    expect(printSnapshot.generalText).not.toContain("Formal EL assessment record");

    await page.emulateMedia({ media: "print" });
    await page.evaluate(() => {
      document.body.dataset.teacherPrintTarget = "el-class";
    });
    await expect(elDocument).toBeVisible();
    await expect(page.locator(".formal-class-report-document")).toBeHidden();
    const visiblePages = await elDocument.locator(".formal-class-report-page")
      .evaluateAll(pages => pages.filter(pageElement => {
        const style = getComputedStyle(pageElement);
        return style.display !== "none" && style.visibility !== "hidden";
      }).length);
    expect(visiblePages).toBeGreaterThanOrEqual(3);
    await page.evaluate(() => {
      delete document.body.dataset.teacherPrintTarget;
    });
    expect(pageErrors).toEqual([]);
  }
);

test(
  "@teacher-saved-report-actions authenticated saved-report actions keep Download primary and Delete visibly destructive",
  async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));

    await logIn(page);
    await selectAuditClassFromToday(page);
    await page.getByTestId("teacher-primary-nav")
      .getByRole("button", { name: "Reports", exact: true })
      .click();
    await expect(page.getByRole("heading", { name: "Open a report", exact: true }))
      .toBeVisible();

    const wholeClassStep = page.locator(".teacher-funnel-step[data-step='2']");
    await wholeClassStep.getByRole("button", { name: /^Whole class/ }).click();
    await page.getByRole("button", { name: "Show the report", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Class report", exact: true }))
      .toBeVisible();

    await page.getByText("Formal EL reports and downloads", { exact: true }).click();
    const savedReport = page.locator(".el-saved-report-row")
      .filter({ hasText: "Grade 1 · Beginning of year" })
      .first();
    await expect(savedReport).toBeVisible({ timeout: 20_000 });
    await expect(savedReport).not.toContainText(/\b(?:BOY|MOY|EOY)\b/);

    const downloadButton = savedReport.getByRole("button", {
      name: "Download Excel",
      exact: true
    });
    const deleteButton = savedReport.getByRole("button", {
      name: "Delete",
      exact: true
    });
    await expect(downloadButton).toBeEnabled();
    await expect(deleteButton).toBeEnabled();

    const primary = await readButtonVisualState(downloadButton);
    const destructive = await readButtonVisualState(deleteButton);
    expect(primary.className).toContain("report-button");
    expect(primary.className).not.toContain("danger");
    expect(primary.backgroundImage).toContain("linear-gradient");
    expect(destructive.className).toContain("danger");
    expect(destructive.backgroundImage).toBe("none");
    expect(destructive.backgroundColor).not.toBe(primary.backgroundColor);
    expect(destructive.borderColor).not.toBe(primary.borderColor);
    expect(destructive.color).not.toBe(primary.color);
    expectRedDominant(destructive.color);
    expectRedDominant(destructive.borderColor);

    if (testInfo.project.name === "desktop") {
      await deleteButton.hover();
      const hovered = await readButtonVisualState(deleteButton);
      expect(hovered.backgroundColor).toBe(destructive.backgroundColor);
      expect(hovered.borderColor).toBe(destructive.borderColor);
      expect(hovered.color).toBe(destructive.color);
      expect(hovered.filter).not.toBe(destructive.filter);
    }

    await downloadButton.focus();
    await page.keyboard.press("Tab");
    await expect(deleteButton).toBeFocused();
    const focused = await readButtonVisualState(deleteButton);
    expect(focused.backgroundColor).toBe(destructive.backgroundColor);
    expect(focused.borderColor).toBe(destructive.borderColor);
    expect(focused.color).toBe(destructive.color);
    expect(focused.boxShadow).not.toBe(destructive.boxShadow);

    let signalDeleteRequestStarted;
    const deleteRequestStarted = new Promise(resolve => {
      signalDeleteRequestStarted = resolve;
    });
    let releaseDeleteRequest;
    const deleteRequestRelease = new Promise(resolve => {
      releaseDeleteRequest = resolve;
    });
    const deleteRpcPattern = "**/rest/v1/rpc/teacher_delete_saved_assessment_report";
    await page.route(deleteRpcPattern, async route => {
      signalDeleteRequestStarted();
      await deleteRequestRelease;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          code: "AUDIT_SAVED_REPORT_DELETE_PAUSED",
          message: "Intentional release-gate failure; the saved report must remain."
        })
      });
    });

    try {
      await deleteButton.click();
      const confirmation = savedReport.getByRole("group", {
        name: "Confirm saved report deletion",
        exact: true
      });
      await expect(confirmation).toBeVisible();
      const permanentDelete = confirmation.locator("button.report-button.danger");
      await expect(permanentDelete).toHaveAccessibleName("Delete permanently");
      const enabledDestructive = await readButtonVisualState(permanentDelete);
      await permanentDelete.click();
      await deleteRequestStarted;
      await expect(permanentDelete).toBeDisabled();
      await expect.poll(
        async () => (await readButtonVisualState(permanentDelete)).opacity
      ).toBeLessThan(enabledDestructive.opacity);
      const disabledDestructive = await readButtonVisualState(permanentDelete);
      expect(disabledDestructive.backgroundColor).toBe(enabledDestructive.backgroundColor);
      expect(disabledDestructive.borderColor).toBe(enabledDestructive.borderColor);
      expect(disabledDestructive.color).toBe(enabledDestructive.color);
      expectRedDominant(disabledDestructive.color);
    } finally {
      releaseDeleteRequest();
    }

    await expect(savedReport).toBeVisible();
    await expect(page.getByText(
      "The saved report could not be deleted from cloud history, so the browser copy was kept.",
      { exact: true }
    )).toBeVisible();
    await page.unroute(deleteRpcPattern);
    expect(pageErrors).toEqual([]);
  }
);
