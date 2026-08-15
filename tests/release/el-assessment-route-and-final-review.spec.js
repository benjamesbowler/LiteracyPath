import { expect, test } from "@playwright/test";
import {
  completeTeacherClassEntry,
  selectTeacherClassFromStudents
} from "./support/teacherLanding.js";
import { expectStudentRoster, openStudentPanel } from "./support/teacherStudents.js";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";

async function logIn(page) {
  if (!teacherPassword) {
    throw new Error("LP_AUDIT_TEACHER_PASSWORD is required for the EL assessment route gate.");
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Teachers: Literacy Guide Teacher Tools" }).click();
  await page.getByRole("textbox", { name: "Email" }).fill("audit-teacher-a@literacypath.invalid");
  await page.getByLabel("Password", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await completeTeacherClassEntry(page);
}

async function openAmaraAssessmentHub(page) {
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Students", exact: true })
    .click();
  await selectTeacherClassFromStudents(page, "Audit Class A");
  const roster = await expectStudentRoster(page, "Audit Class A");
  await openStudentPanel(page, roster, "Amara");
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Assessments", exact: true })
    .click();
  // Opening the student establishes the class and student context. Assessments
  // then opens already scoped to them, on the assessment question.
  await expect(page.getByRole("heading", { name: "Assess a student", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "2 · Assessment", exact: true })).toBeVisible();
}

async function startEncoding(page) {
  // Panel 2: which assessment. Panel 3: grade and time of year. Then Begin.
  await page.getByRole("button", { name: "Start Spelling", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Grade", exact: true })).toHaveValue("K");
  await expect(page.getByRole("combobox", { name: "Time of year", exact: true })).toHaveValue("BOY");
  await page.getByRole("button", { name: "Begin Spelling", exact: true }).click();
  // Starting somewhere the child's own results do not point at still needs a
  // recorded reason before it will run.
  const review = page.getByRole("region", { name: "One quick question before you start" });
  if (await review.count()) {
    await review.getByRole("button", { name: /Recent classroom work/ }).click();
    await review.getByRole("button", { name: "Begin Spelling", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "Word Encoding and Spelling", exact: true })).toBeVisible();
}

async function acceptPlacement(page) {
  const stickyBar = page.locator(".el-benchmark-topbar");
  await stickyBar.getByRole("button", { name: "Choose starting point", exact: true }).click();
  await page.getByRole("region", { name: "Choose where to start next" })
    .getByRole("button", { name: "Use this starting point", exact: true })
    .click();
}

test("@el-assessment-route-resume @el-assessment-final-review restores the item and confirms a corrected final tap", async ({
  page
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  await logIn(page);
  await openAmaraAssessmentHub(page);
  await startEncoding(page);

  await expect(page).toHaveURL(/#teacher\/checks\/el-benchmark\?.*assessment=el_encoding.*item=1/);
  for (let itemNumber = 1; itemNumber <= 3; itemNumber += 1) {
    await page.getByRole("button", { name: "Correct spelling", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "Item 4 of 8", exact: true })).toBeVisible();
  await expect(page).toHaveURL(/#teacher\/checks\/el-benchmark\?.*item=4/);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Word Encoding and Spelling", exact: true })).toBeVisible({
    timeout: 20_000
  });
  await expect(page.getByRole("heading", { name: "Item 4 of 8", exact: true })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "3 of 8 items resolved" })).toBeVisible();
  await expect(page).toHaveURL(/#teacher\/checks\/el-benchmark\?.*item=4/);

  for (let itemNumber = 4; itemNumber <= 7; itemNumber += 1) {
    await page.getByRole("button", { name: "Correct spelling", exact: true }).click();
  }
  await page.getByRole("button", { name: "Not yet", exact: true }).click();
  await acceptPlacement(page);

  await page.locator(".el-benchmark-topbar")
    .getByRole("button", { name: "Finish assessment", exact: true })
    .click();
  let finishReview = page.getByRole("dialog", { name: "Review the tally before finishing" });
  await expect(finishReview).toContainText("8 scored · 0 skipped");
  await finishReview.getByRole("button", { name: "Change final answer", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Item 8 of 8", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Correct spelling", exact: true }).click();

  await acceptPlacement(page);
  await page.locator(".el-benchmark-topbar")
    .getByRole("button", { name: "Finish assessment", exact: true })
    .click();
  finishReview = page.getByRole("dialog", { name: "Review the tally before finishing" });
  await expect(finishReview).toContainText("8 scored · 0 skipped");
  await finishReview.getByRole("button", { name: "Confirm and finish", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Assess a student", exact: true }))
    .toBeVisible({ timeout: 20_000 });
  await expect(page).toHaveURL(/#teacher\/assessments\?/);
  await expect(page).not.toHaveURL(/el-benchmark/);
});
