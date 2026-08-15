import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { openAdminSection } from "./adminNavigation.js";
import { auditClassForEmail, completeTeacherClassEntry } from "./support/teacherLanding.js";
import { expectStudentRoster, openStudentSettings } from "./support/teacherStudents.js";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";
const AUDIT_CLASS_A_ID = "30000000-0000-4000-8000-000000000001";
const AUDIT_TEACHER_A_ID = "10000000-0000-4000-8000-000000000001";
const RIGHTS_LEARNER_NAME = "Rights Gate Reader";

function createRightsLearnerIds() {
  const suffix = randomUUID();
  return {
    studentId: randomUUID(),
    studentName: `${RIGHTS_LEARNER_NAME} ${suffix.slice(0, 6)}`,
    classId: AUDIT_CLASS_A_ID,
    teacherId: AUDIT_TEACHER_A_ID,
    answerId: randomUUID(),
    attemptId: `audit-data-rights-attempt-${suffix}`,
    reportId: `audit-data-rights-report-${suffix}`
  };
}

async function logIn(page, email) {
  if (!teacherPassword) {
    throw new Error(
      "LP_AUDIT_TEACHER_PASSWORD is required for the learner data-rights gate."
    );
  }
  await page.goto("/");
  await page.getByRole("button", {
    name: "Teachers: Literacy Guide Teacher Tools"
  }).click();
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await completeTeacherClassEntry(page, auditClassForEmail(email));
}

async function readDownloadJson(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function chooseVerifiedSchoolRequest(dialog) {
  await dialog.getByLabel("Who made the request?").selectOption("school");
  await dialog.getByLabel("How was identity and authority verified?")
    .selectOption("authorised_school_official");
}

async function seedRightsLearner(page, ids) {
  return page.evaluate(async ids => {
    const { supabase } = await import("/src/supabaseClient.js");
    const { error: studentError } = await supabase.table("students").insert({
      id: ids.studentId,
      class_id: ids.classId,
      teacher_id: ids.teacherId,
      name: ids.studentName,
      created_at: "2026-07-25T04:00:00.000Z",
      updated_at: "2026-07-25T04:00:00.000Z"
    });
    if (studentError) throw new Error(studentError.message);

    const { error: answerError } = await supabase.table("answers").insert({
      id: ids.answerId,
      student_id: ids.studentId,
      teacher_id: ids.teacherId,
      skill: "Initial Sounds",
      stage: "Initial Sounds",
      diagnostic_target: "/m/",
      question: "Which word starts with /m/?",
      chosen_answer: "moon",
      correct_answer: "moon",
      is_correct: true,
      answered_at: "2026-07-25T04:05:00.000Z"
    });
    if (answerError) throw new Error(answerError.message);

    const { error: attemptError } = await supabase.table("assessment_attempts").insert({
      attempt_id: ids.attemptId,
      student_id: ids.studentId,
      class_id: ids.classId,
      teacher_id: ids.teacherId,
      assessment_type: "skill_checkpoint",
      skill_id: "initial_sounds",
      skill_name: "Initial Sounds",
      total_questions: 1,
      correct_count: 1,
      accuracy: 100,
      status: "passed",
      administration_status: "completed",
      payload: {
        attemptId: ids.attemptId,
        studentId: ids.studentId,
        questionRecords: [{
          questionId: "rights-gate-question",
          responseStatus: "correct",
          chosenAnswer: "moon"
        }]
      }
    });
    if (attemptError) throw new Error(attemptError.message);

    const { error: reportError } = await supabase.table("el_assessment_reports").insert({
      report_id: ids.reportId,
      report_type: "individual",
      class_id: ids.classId,
      student_id: ids.studentId,
      teacher_id: ids.teacherId,
      file_name: "rights-gate-reader-report.xlsx",
      summary: { totalAssessments: 1, averageAccuracy: 100 },
      payload: {
        reportId: ids.reportId,
        studentId: ids.studentId,
        studentName: ids.studentName
      }
    });
    if (reportError) throw new Error(reportError.message);
    return { seeded: true };
  }, ids);
}

async function openClassRoster(page) {
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Students", exact: true })
    .click();
  await page.getByLabel("Current class").selectOption({ label: "Audit Class A" });
  return expectStudentRoster(page, "Audit Class A");
}

test("A8.8 admin can produce a tracked, verified learner access export", async ({
  page
}) => {
  test.setTimeout(90_000);
  await logIn(page, "audit-admin@literacypath.invalid");
  await page.getByRole("button", { name: "Admin", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Admin Dashboard", exact: true }))
    .toBeVisible();
  await openAdminSection(page, "school", "students");

  const learnerRow = page.getByRole("row").filter({ hasText: "Aarav" });
  await learnerRow.getByRole("button", { name: "Export or delete data" }).click();
  const dialog = page.getByRole("dialog", { name: "Data choices for Aarav" });
  await expect(dialog.getByRole("region", {
    name: "Privacy request history"
  })).not.toContainText("unavailable");
  await chooseVerifiedSchoolRequest(dialog);

  await expect(dialog.getByRole("button", { name: "Download student data" }))
    .toBeEnabled();
  const downloadPromise = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download student data" }).click();
  const exported = await readDownloadJson(await downloadPromise);
  expect(exported.schemaVersion).toBe(1);
  expect(exported.learner.displayName).toBe("Aarav");
  expect(exported.answers.length).toBeGreaterThan(0);
  expect(exported.assessmentAttempts.length).toBeGreaterThanOrEqual(520);
  expect(exported.request.status).toBe("completed");
  expect(exported.request.subjectRef).toMatch(/^[0-9a-f]{64}$/);
  await expect(dialog.getByRole("region", {
    name: "Privacy request history"
  })).toContainText("Data download");
});

test("A8.8 verified deletion removes seeded learner UI and evidence but keeps its audit tombstone", async ({
  page
}) => {
  test.setTimeout(120_000);
  const rightsLearner = createRightsLearnerIds();
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  await expect(await seedRightsLearner(page, rightsLearner)).toEqual({ seeded: true });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Start with these students", exact: true })).toBeVisible({
    timeout: 20_000
  });

  const roster = await openClassRoster(page);
  await page.getByRole("searchbox", { name: "Search students" })
    .fill(rightsLearner.studentName);
  const learnerRow = roster.getByRole("row").filter({ hasText: rightsLearner.studentName });
  await expect(learnerRow).toBeVisible();
  const options = await openStudentSettings(page, roster, rightsLearner.studentName);
  await options
    .getByRole("button", { name: "Privacy and data rights", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: `Data choices for ${rightsLearner.studentName}`
  });
  await expect(dialog.getByRole("region", {
    name: "Privacy request history"
  })).not.toContainText("unavailable");
  await chooseVerifiedSchoolRequest(dialog);

  await expect(dialog.getByRole("button", { name: "Download student data" }))
    .toBeEnabled();
  const exportPromise = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download student data" }).click();
  const beforeDeletion = await readDownloadJson(await exportPromise);
  expect(beforeDeletion.answers).toHaveLength(1);
  expect(beforeDeletion.assessmentAttempts).toHaveLength(1);
  expect(beforeDeletion.individualReports).toHaveLength(1);
  expect(beforeDeletion.assessmentAttempts[0].attempt_id).toBe(rightsLearner.attemptId);
  expect(beforeDeletion.individualReports[0].report_id).toBe(rightsLearner.reportId);

  await dialog.getByRole("button", { name: "Review deletion request" }).click();
  const deletionSection = dialog.getByText("Delete permanently").locator("..");
  const requestId = await deletionSection.locator("p strong").first().textContent();
  expect(requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f-]{27}$/i);
  await dialog.getByLabel("Exact confirmation").fill("DELETE LEARNER DATA");
  await dialog.getByRole("button", { name: "Delete all student data" }).click();

  await expect(page.getByRole("dialog", {
    name: `Data choices for ${rightsLearner.studentName}`
  })).toHaveCount(0);
  await expect(roster.getByRole("row").filter({ hasText: rightsLearner.studentName }))
    .toHaveCount(0);
  await expect(page.locator(".teacher-dashboard-message").filter({
    hasText: "deleted permanently"
  })).toContainText(rightsLearner.studentName);

  const proof = await page.evaluate(async ({ studentId, deletionRequestId }) => {
    const { supabase } = await import("/src/supabaseClient.js");
    const [
      student,
      answers,
      attempts,
      reports,
      exportRetry
    ] = await Promise.all([
      supabase.table("students").select("id").eq("id", studentId),
      supabase.table("answers").select("id").eq("student_id", studentId),
      supabase.table("assessment_attempts").select("attempt_id").eq("student_id", studentId),
      supabase.table("el_assessment_reports").select("report_id").eq("student_id", studentId),
      supabase.call("teacher_export_learner_data", {
        p_student_id: studentId,
        p_requester_role: "school",
        p_verification_method: "authorised_school_official"
      })
    ]);
    return {
      counts: {
        students: student.data?.length,
        answers: answers.data?.length,
        attempts: attempts.data?.length,
        reports: reports.data?.length
      },
      deletionRequestId,
      exportRetryError: exportRetry.error?.message || ""
    };
  }, {
    studentId: rightsLearner.studentId,
    deletionRequestId: requestId
  });

  expect(proof.counts).toEqual({
    students: 0,
    answers: 0,
    attempts: 0,
    reports: 0
  });
  expect(proof.deletionRequestId).toBe(requestId);
  expect(proof.exportRetryError).toContain("owned learner");
});
