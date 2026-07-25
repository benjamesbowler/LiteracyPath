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
  await expect(page.getByRole("heading", { name: "Teacher login" })).toBeVisible();
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({
    timeout: 20_000
  });
}

async function openClass(page, className) {
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Classes", exact: true })
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
  await aaravRow.getByRole("button", { name: "Open learner", exact: true }).click();

  let learnerDetail = page.getByRole("region", { name: "Learner detail: Aarav" });
  await expect(learnerDetail).toBeVisible();
  await learnerDetail.getByRole("button", { name: "Assess Aarav", exact: true }).click();

  const assessmentHub = page.getByRole("region", { name: "Assessment hub tools" });
  await expect(assessmentHub).toBeVisible();
  await assessmentHub.getByRole("article").filter({ hasText: "Universal benchmark" })
    .getByRole("button", { name: "Open", exact: true })
    .click();
  await expect(page.getByText("Universal benchmark", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter Full Screen Assessment", exact: true }))
    .toBeVisible();

  const reportRoster = await openClass(page, "Audit Class A");
  await reportRoster.getByRole("row").filter({ hasText: "Aarav" })
    .getByRole("button", { name: "Open learner", exact: true })
    .click();
  learnerDetail = page.getByRole("region", { name: "Learner detail: Aarav" });
  await learnerDetail.getByRole("button", { name: "Review Aarav’s progress", exact: true }).click();
  await page.getByRole("navigation", { name: "Progress tools" })
    .getByRole("button", { name: "Reports", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Open Skills Check", exact: true })).toBeEnabled({
    timeout: 20_000
  });
  await page.getByRole("button", { name: "Open Skills Check", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Skills Check", exact: true })).toBeVisible();

  const provenance = page.getByRole("region", { name: "Report provenance" });
  await expect(provenance).toContainText("Aarav");
  await expect(provenance).toContainText("Audit Class A");
  await expect(provenance).toContainText(
    "CONFIDENTIAL — student educational record — authorised school staff only"
  );

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Skills Check data", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  const csv = await readDownloadText(download);
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const provenanceRows = lines.filter(line => line.includes('"Report provenance"'));
  const assessmentRows = lines.filter(line => line.includes('"Assessment attempt"'));
  const questionRows = lines.filter(line => line.includes('"Question evidence"'));

  expect(provenanceRows.length).toBeGreaterThan(10);
  expect(assessmentRows.length).toBe(520);
  expect(questionRows.length).toBeGreaterThanOrEqual(520);
  expect(csv).toContain('"Learner","Aarav"');
  expect(csv).toContain('"Class","Audit Class A"');
  expect(csv).toContain('"Privacy classification","CONFIDENTIAL — student educational record — authorised school staff only"');
  expect(csv).toContain("audit-long-history-0001");
  expect(csv).toContain("audit-long-history-0520");
  expect(pageErrors).toEqual([]);
});

test("A9.7 @teacher-route-deep-link owned class report survives refresh and browser history", async ({
  page
}) => {
  test.setTimeout(90_000);
  await logIn(page, "audit-teacher-a@literacypath.invalid");

  const skillsCheckRoute =
    `/#teacher/progress/report?class=${AUDIT_CLASS_A_ID}&learner=${AARAV_ID}&report=skills-check`;
  await page.goto(skillsCheckRoute);
  await expect(page.getByRole("heading", { name: "Skills Check", exact: true })).toBeVisible({
    timeout: 20_000
  });
  await expect(page.getByRole("region", { name: "Report provenance" })).toContainText("Aarav");
  await expect(page).toHaveURL(new RegExp(
    `#teacher/progress/report\\?class=${AUDIT_CLASS_A_ID}&learner=${AARAV_ID}&report=skills-check$`
  ));

  await page.reload();
  await expect(page.getByRole("heading", { name: "Skills Check", exact: true })).toBeVisible({
    timeout: 20_000
  });
  await expect(page.getByRole("region", { name: "Report provenance" })).toContainText("Audit Class A");

  await page.getByRole("link", { name: /Whole Child/ }).click();
  await expect(page.getByRole("heading", { name: "Whole Child", exact: true })).toBeVisible();
  await expect(page).toHaveURL(new RegExp("report=whole-child$"));

  await page.goBack();
  await expect(page.getByRole("heading", { name: "Skills Check", exact: true })).toBeVisible({
    timeout: 20_000
  });
  await expect(page).toHaveURL(new RegExp("report=skills-check$"));
});

test("A10.7 teacher B cannot discover or deep-link into teacher A's class or learner", async ({
  page
}) => {
  await logIn(page, "audit-teacher-b@literacypath.invalid");
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Classes", exact: true })
    .click();

  const classSelect = page.getByLabel("Current class");
  await expect(classSelect.locator("option").filter({ hasText: "Audit Class A" })).toHaveCount(0);
  await expect(classSelect.locator("option").filter({ hasText: "Audit Class B" })).toHaveCount(1);

  await page.goto(
    `/#teacher/progress/report?class=${AUDIT_CLASS_A_ID}&learner=${AARAV_ID}&report=skills-check`
  );
  await expect(page.locator('[data-teacher-product="class-dashboard"]')).toBeVisible({
    timeout: 20_000
  });
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Progress", exact: true })
    .click();

  await expect(page.getByLabel("Current class").locator("option")
    .filter({ hasText: "Audit Class A" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Learner progress evidence: Aarav" }))
    .toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Skills Check", exact: true })).toHaveCount(0);
});
