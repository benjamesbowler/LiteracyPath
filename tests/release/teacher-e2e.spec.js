import { expect, test } from "@playwright/test";

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
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({
    timeout: 20_000
  });
}

async function openClass(page, className) {
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Students", exact: true })
    .click();
  const classSelect = page.getByLabel("Current class");
  await classSelect.selectOption({ label: className });
  await expect(classSelect.locator("option:checked")).toHaveText(className);
  const rosterAdmin = page.locator(".teacher-roster-admin");
  if (!await rosterAdmin.evaluate(element => element.open)) {
    await rosterAdmin.locator(":scope > summary").click();
  }
  return page.locator(".teacher-roster-table");
}

async function readDownloadText(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

test("A10.7 teacher A completes login → class → learner → assessment → report → parsed export", async ({
  page
}) => {
  test.setTimeout(120_000);
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await logIn(page, "audit-teacher-a@literacypath.invalid");
  const roster = await openClass(page, "Audit Class A");
  const aaravRow = roster.getByRole("row").filter({ hasText: "Aarav" });
  await expect(aaravRow).toBeVisible();
  await aaravRow.getByRole("button", { name: "Open student", exact: true }).click();

  const childDetail = page.getByRole("region", { name: "Student details: Aarav" });
  await expect(childDetail).toBeVisible();
  // One click to a check: the Student panel starts it directly.
  await expect(childDetail.getByRole("button", { name: /^Check Aarav$/ })).toBeEnabled();

  // 2026-07-27: Reports is one page - class, who, report - and the report opens
  // in place at the end of it rather than on a separate screen.
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Reports", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Open a report", exact: true })).toBeVisible();
  await page.getByLabel("Class", { exact: true }).selectOption({ label: "Audit Class A" });
  await page.getByRole("button", { name: "Aarav", exact: true }).click();
  await page.getByRole("button", { name: /^Skills/ }).click();
  await page.getByRole("button", { name: "Show the report", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Skills", exact: true })).toBeVisible();

  const provenance = page.getByRole("region", { name: "About this report" });
  await expect(provenance).toContainText("Aarav");
  await expect(provenance).toContainText("Audit Class A");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Skills Check data", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  const csv = await readDownloadText(download);
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const provenanceRows = lines.filter(line => line.includes('"About this report"'));
  const assessmentRows = lines.filter(line => line.includes('"Check attempt"'));
  const questionRows = lines.filter(line => line.includes('"Question result"'));

  expect(provenanceRows.length).toBeGreaterThanOrEqual(10);
  expect(assessmentRows.length).toBeGreaterThanOrEqual(520);
  expect(questionRows.length).toBeGreaterThanOrEqual(520);
  expect(csv).toContain('"Child","Aarav"');
  expect(csv).toContain('"Class","Audit Class A"');
  expect(csv).not.toMatch(/Attempt ID|Question ID|audit-long-history|audit-item-/i);
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
  await expect(page.getByRole("heading", { name: "Skills", exact: true })).toBeVisible({
    timeout: 20_000
  });
  await expect(page.getByRole("region", { name: "About this report" })).toContainText("Aarav");
  await expect(page).toHaveURL(new RegExp(
    `#teacher/reports/report\\?class=${AUDIT_CLASS_A_ID}&learner=${AARAV_ID}&report=skills-check$`
  ));

  await page.reload();
  await expect(page.getByRole("heading", { name: "Skills", exact: true })).toBeVisible({
    timeout: 20_000
  });
  await expect(page.getByRole("region", { name: "About this report" })).toContainText("Audit Class A");

  await page.getByRole("link", { name: /^Overview/ }).click();
  await expect(page.getByRole("heading", { name: "Overview", exact: true })).toBeVisible();
  await expect(page).toHaveURL(new RegExp("report=whole-child$"));

  await page.goBack();
  await expect(page.getByRole("heading", { name: "Skills", exact: true })).toBeVisible({
    timeout: 20_000
  });
  await expect(page).toHaveURL(new RegExp("report=skills-check$"));
});

test("A10.7 @teacher-route-denial teacher B cannot discover or deep-link into teacher A's class or learner", async ({
  page
}) => {
  await logIn(page, "audit-teacher-b@literacypath.invalid");
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Students", exact: true })
    .click();

  const classSelect = page.getByLabel("Current class");
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
