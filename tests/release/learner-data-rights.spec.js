import { expect, test } from "@playwright/test";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";
const AUDIT_CLASS_A_ID = "30000000-0000-4000-8000-000000000001";
const AUDIT_TEACHER_A_ID = "10000000-0000-4000-8000-000000000001";
const RIGHTS_LEARNER_ID = "40000000-0000-4000-8000-000000000099";
const RIGHTS_LEARNER_NAME = "Rights Gate Reader";
const RIGHTS_ANSWER_ID = "49000000-0000-4000-8000-000000000099";
const RIGHTS_ATTEMPT_ID = "audit-data-rights-attempt";
const RIGHTS_REPORT_ID = "audit-data-rights-report";

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
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({
    timeout: 20_000
  });
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

async function seedRightsLearner(page) {
  return page.evaluate(async ids => {
    const { supabase } = await import("/src/supabaseClient.js");
    const failures = [];
    for (const operation of [
      () => supabase.from("assessment_attempts")
        .delete()
        .eq("student_id", ids.studentId),
      () => supabase.from("el_assessment_reports")
        .delete()
        .eq("student_id", ids.studentId),
      () => supabase.from("students")
        .delete()
        .eq("id", ids.studentId)
    ]) {
      const { error } = await operation();
      if (error) failures.push(error.message);
    }
    if (failures.length) throw new Error(failures.join("; "));

    const { error: studentError } = await supabase.from("students").insert({
      id: ids.studentId,
      class_id: ids.classId,
      teacher_id: ids.teacherId,
      name: ids.studentName,
      created_at: "2026-07-25T04:00:00.000Z",
      updated_at: "2026-07-25T04:00:00.000Z"
    });
    if (studentError) throw new Error(studentError.message);

    const { error: answerError } = await supabase.from("answers").insert({
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

    const { error: attemptError } = await supabase.from("assessment_attempts").insert({
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

    const { error: reportError } = await supabase.from("el_assessment_reports").insert({
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
  }, {
    studentId: RIGHTS_LEARNER_ID,
    studentName: RIGHTS_LEARNER_NAME,
    classId: AUDIT_CLASS_A_ID,
    teacherId: AUDIT_TEACHER_A_ID,
    answerId: RIGHTS_ANSWER_ID,
    attemptId: RIGHTS_ATTEMPT_ID,
    reportId: RIGHTS_REPORT_ID
  });
}

async function openClassRoster(page) {
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Classes", exact: true })
    .click();
  await page.getByLabel("Current class").selectOption({ label: "Audit Class A" });
  const rosterAdmin = page.locator(".teacher-roster-admin");
  if (!await rosterAdmin.evaluate(element => element.open)) {
    await rosterAdmin.locator(":scope > summary").click();
  }
  return page.locator(".teacher-roster-table");
}

test("A8.8 admin can produce a tracked, verified learner access export", async ({
  page
}) => {
  test.setTimeout(90_000);
  await logIn(page, "audit-admin@literacypath.invalid");
  await page.getByRole("button", { name: "Admin", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Admin Dashboard", exact: true }))
    .toBeVisible();
  await page.getByLabel("Choose dashboard section").selectOption("students");

  const learnerRow = page.getByRole("row").filter({ hasText: "Aarav" });
  await learnerRow.getByRole("button", { name: "Export or delete data" }).click();
  const dialog = page.getByRole("dialog", { name: "Data rights for Aarav" });
  await expect(dialog.getByRole("region", {
    name: "Data-rights request history"
  })).not.toContainText("unavailable");
  await chooseVerifiedSchoolRequest(dialog);

  await expect(dialog.getByRole("button", { name: "Download learner data" }))
    .toBeEnabled();
  const downloadPromise = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download learner data" }).click();
  const exported = await readDownloadJson(await downloadPromise);
  expect(exported.schemaVersion).toBe(1);
  expect(exported.learner.displayName).toBe("Aarav");
  expect(exported.answers.length).toBeGreaterThan(0);
  expect(exported.assessmentAttempts.length).toBe(520);
  expect(exported.request.status).toBe("completed");
  expect(exported.request.subjectRef).toMatch(/^[0-9a-f]{64}$/);
  await expect(dialog.getByRole("region", {
    name: "Data-rights request history"
  })).toContainText("Access export");
});

test("A8.8 verified deletion removes seeded learner UI and evidence but keeps its audit tombstone", async ({
  page
}) => {
  test.setTimeout(120_000);
  await logIn(page, "audit-teacher-a@literacypath.invalid");
  await expect(await seedRightsLearner(page)).toEqual({ seeded: true });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Today", exact: true })).toBeVisible({
    timeout: 20_000
  });

  const roster = await openClassRoster(page);
  const learnerRow = roster.getByRole("row").filter({ hasText: RIGHTS_LEARNER_NAME });
  await expect(learnerRow).toBeVisible();
  await learnerRow.getByRole("button", { name: "Data rights", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: `Data rights for ${RIGHTS_LEARNER_NAME}`
  });
  await expect(dialog.getByRole("region", {
    name: "Data-rights request history"
  })).not.toContainText("unavailable");
  await chooseVerifiedSchoolRequest(dialog);

  await expect(dialog.getByRole("button", { name: "Download learner data" }))
    .toBeEnabled();
  const exportPromise = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download learner data" }).click();
  const beforeDeletion = await readDownloadJson(await exportPromise);
  expect(beforeDeletion.answers).toHaveLength(1);
  expect(beforeDeletion.assessmentAttempts).toHaveLength(1);
  expect(beforeDeletion.individualReports).toHaveLength(1);
  expect(beforeDeletion.assessmentAttempts[0].attempt_id).toBe(RIGHTS_ATTEMPT_ID);
  expect(beforeDeletion.individualReports[0].report_id).toBe(RIGHTS_REPORT_ID);

  await dialog.getByRole("button", { name: "Prepare verified deletion" }).click();
  const deletionSection = dialog.getByText("Permanent deletion").locator("..");
  const deletionText = await deletionSection.textContent();
  const requestId = deletionText?.match(
    /Request ([0-9a-f]{8}-[0-9a-f-]{27}) is verified/i
  )?.[1];
  expect(requestId).toBeTruthy();
  await dialog.getByLabel("Exact confirmation").fill("DELETE LEARNER DATA");
  await dialog.getByRole("button", { name: "Delete all learner data" }).click();

  await expect(page.getByRole("dialog", {
    name: `Data rights for ${RIGHTS_LEARNER_NAME}`
  })).toHaveCount(0);
  await expect(roster.getByRole("row").filter({ hasText: RIGHTS_LEARNER_NAME }))
    .toHaveCount(0);
  await expect(page.locator(".teacher-dashboard-message")).toContainText(
    `${RIGHTS_LEARNER_NAME}'s data was deleted`
  );

  const proof = await page.evaluate(async ({ studentId, deletionRequestId }) => {
    const { supabase } = await import("/src/supabaseClient.js");
    const [
      student,
      answers,
      attempts,
      reports,
      request,
      events,
      exportRetry
    ] = await Promise.all([
      supabase.from("students").select("id").eq("id", studentId),
      supabase.from("answers").select("id").eq("student_id", studentId),
      supabase.from("assessment_attempts").select("attempt_id").eq("student_id", studentId),
      supabase.from("el_assessment_reports").select("report_id").eq("student_id", studentId),
      supabase.from("data_rights_requests")
        .select("id,subject_ref,status,completed_at")
        .eq("id", deletionRequestId)
        .single(),
      supabase.from("data_rights_audit_events")
        .select("event_type")
        .eq("request_id", deletionRequestId),
      supabase.rpc("teacher_export_learner_data", {
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
      request: request.data,
      eventTypes: (events.data || []).map(event => event.event_type),
      exportRetryError: exportRetry.error?.message || ""
    };
  }, {
    studentId: RIGHTS_LEARNER_ID,
    deletionRequestId: requestId
  });

  expect(proof.counts).toEqual({
    students: 0,
    answers: 0,
    attempts: 0,
    reports: 0
  });
  expect(proof.request.status).toBe("completed");
  expect(proof.request.completed_at).toBeTruthy();
  expect(proof.request.subject_ref).toMatch(/^[0-9a-f]{64}$/);
  expect(proof.eventTypes).toContain("deletion_completed");
  expect(proof.exportRetryError).toContain("owned learner");
});
