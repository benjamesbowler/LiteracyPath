import { expect, test } from "@playwright/test";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";
const TEACHER_A_EMAIL = "audit-teacher-a@literacypath.invalid";
const AUDIT_CLASS_A_ID = "30000000-0000-4000-8000-000000000001";
const AARAV_ID = "40000000-0000-4000-8000-000000000001";

async function logIn(page) {
  if (!teacherPassword) {
    throw new Error(
      "LP_AUDIT_TEACHER_PASSWORD is required for the assessment-history evidence gate."
    );
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" }).click();
  await page.getByRole("textbox", { name: "Email" }).fill(TEACHER_A_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({
    timeout: 20_000
  });
}

async function installAssessmentHistoryTailFailure(page) {
  let refuseTailPages = true;
  let globalTailFailures = 0;
  let aaravTailFailures = 0;
  let allowedTailReads = 0;

  await page.route("**/rest/v1/assessment_attempts?**", async route => {
    const request = route.request();
    const requestUrl = new URL(request.url());
    const rangeHeader = request.headers().range || "";
    const rangeStart = Number(
      requestUrl.searchParams.get("offset")
      || rangeHeader.match(/^(\d+)-/)?.[1]
      || 0
    );
    const isTailPage = rangeStart >= 500;
    const isAaravRead =
      requestUrl.searchParams.get("student_id") === `eq.${AARAV_ID}`;

    if (isTailPage && refuseTailPages) {
      if (isAaravRead) aaravTailFailures += 1;
      else globalTailFailures += 1;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          code: "AUDIT_ASSESSMENT_HISTORY_TAIL_UNAVAILABLE",
          message: "Intentional release-gate failure after the first 500 history rows."
        })
      });
      return;
    }

    if (isTailPage) allowedTailReads += 1;
    await route.continue();
  });

  return {
    allowCompleteReads() {
      refuseTailPages = false;
    },
    get aaravTailFailures() {
      return aaravTailFailures;
    },
    get globalTailFailures() {
      return globalTailFailures;
    },
    get allowedTailReads() {
      return allowedTailReads;
    }
  };
}

async function chooseAaravForAssessment(page) {
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Assessments", exact: true })
    .click();
  await page.getByRole("combobox", { name: "Class", exact: true })
    .selectOption({ label: "Audit Class A" });
  await page.getByRole("button", { name: "Aarav", exact: true }).click();
}

test("@assessment-history-completeness @teacher-assessment-hub blocks a formal launch until the full student history retry succeeds", async ({
  page
}) => {
  test.setTimeout(120_000);
  const historyRead = await installAssessmentHistoryTailFailure(page);
  await logIn(page);
  await chooseAaravForAssessment(page);

  await expect.poll(() => historyRead.aaravTailFailures).toBeGreaterThan(0);
  const evidenceState = page.locator(".teacher-funnel-evidence-state");
  await expect(evidenceState).toHaveAttribute("role", "alert");
  await expect(evidenceState).toContainText(
    "We couldn't load all of Aarav’s saved results. Nothing is being counted as zero."
  );
  await expect(page.getByRole("heading", { name: "EL assessments", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Spelling/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Begin / })).toHaveCount(0);
  await expect(page).not.toHaveURL(/el-benchmark/);

  historyRead.allowCompleteReads();
  await evidenceState.getByRole("button", { name: "Try again", exact: true }).click();

  await expect.poll(() => historyRead.allowedTailReads).toBeGreaterThan(0);
  await expect(evidenceState).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "EL assessments", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /^Spelling/ }).click();
  const beginSpelling = page.getByRole("button", { name: "Begin Spelling", exact: true });
  await expect(beginSpelling).toBeEnabled();
  await beginSpelling.click();

  const reasonReview = page.getByRole("region", {
    name: "One quick question before you start"
  });
  if (await reasonReview.count()) {
    await reasonReview.getByRole("button", { name: /Recent classroom work/ }).click();
    await reasonReview.getByRole("button", { name: "Begin Spelling", exact: true }).click();
  }
  await expect(page.getByRole("heading", {
    name: "Word Encoding and Spelling",
    exact: true
  })).toBeVisible();
});

test("@assessment-history-completeness @official-class-export keeps formal class output blocked until a complete real retry", async ({
  page
}) => {
  test.setTimeout(120_000);
  const historyRead = await installAssessmentHistoryTailFailure(page);
  await logIn(page);
  await expect.poll(() => historyRead.globalTailFailures).toBeGreaterThan(0);

  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Reports", exact: true })
    .click();
  await page.getByRole("combobox", { name: "Class", exact: true })
    .selectOption({ label: "Audit Class A" });
  await page.getByRole("button", { name: /^Whole class/ }).click();
  const unavailableState = page.locator(
    '[data-teacher-surface="progress"][data-teacher-state="partial"]'
  );
  await expect(unavailableState).toContainText("Some report information could not be loaded");
  await expect(unavailableState).toContainText(
    "Missing students and results are not counted as zero"
  );
  await expect(page.getByRole("button", { name: "Show the report", exact: true }))
    .toHaveCount(0);
  await expect(page.getByRole("heading", {
    name: "Audit Class A · class report",
    exact: true
  })).toHaveCount(0);
  await expect(page.getByText("Answers in period", { exact: true })).toHaveCount(0);

  historyRead.allowCompleteReads();
  await unavailableState.getByRole("button", {
    name: "Try loading again",
    exact: true
  }).click();

  await expect.poll(() => historyRead.allowedTailReads).toBeGreaterThan(0);
  await expect(unavailableState).toHaveCount(0);
  await page.getByRole("button", { name: "Show the report", exact: true }).click();
  await expect(page.getByRole("heading", {
    name: "Audit Class A · class report",
    exact: true
  })).toBeVisible();
  const reportPeriod = page.getByRole("combobox", {
    name: "Class assessment period",
    exact: true
  });
  await reportPeriod.selectOption("all");
  const formalTools = page.locator("details.class-report-formal-tools");
  await formalTools.locator("summary").click();
  await expect(reportPeriod).toHaveValue("all");
  await expect(page.getByRole("button", {
    name: "Print or save PDF",
    exact: true
  })).toBeEnabled();
  await expect(page.getByRole("button", {
    name: "Print or save EL PDF",
    exact: true
  })).toBeEnabled();
  await expect(page.getByRole("button", {
    name: "Export EL Excel",
    exact: true
  })).toBeEnabled();
  await expect(page.locator(".lg-app-shell")).toHaveAttribute(
    "data-teacher-class-id",
    AUDIT_CLASS_A_ID
  );
});

test("@assessment-history-completeness an individual report never turns an incomplete read into zero results", async ({
  page
}) => {
  test.setTimeout(120_000);
  const historyRead = await installAssessmentHistoryTailFailure(page);
  await logIn(page);
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Reports", exact: true })
    .click();
  await page.getByRole("combobox", { name: "Class", exact: true })
    .selectOption({ label: "Audit Class A" });
  await page.getByRole("button", { name: "Aarav", exact: true }).click();
  await page.getByRole("button", { name: /^Summary/ }).click();

  await expect.poll(() => historyRead.aaravTailFailures).toBeGreaterThan(0);
  const unavailableState = page.locator(
    '[data-teacher-surface="progress"][data-teacher-state="partial"]'
  );
  await expect(unavailableState).toContainText("Some report information could not be loaded");
  await expect(unavailableState).toContainText(
    "Missing students and results are not counted as zero"
  );
  await expect(page.getByRole("button", { name: "Show the report", exact: true }))
    .toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Summary", exact: true })).toHaveCount(0);
  await expect(page.getByText("No dated results saved", { exact: true })).toHaveCount(0);

  historyRead.allowCompleteReads();
  await unavailableState.getByRole("button", { name: "Try loading again", exact: true }).click();
  await expect.poll(() => historyRead.allowedTailReads).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Show the report", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Summary", exact: true })).toBeVisible();
});
