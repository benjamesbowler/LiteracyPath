import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { completeTeacherClassEntry } from "./support/teacherLanding.js";

const teacherPassword = process.env.LP_AUDIT_TEACHER_PASSWORD || "";
const AUDIT_TEACHER_A_ID = "10000000-0000-4000-8000-000000000001";
const AUDIT_CLASS_A_ID = "30000000-0000-4000-8000-000000000001";
const AISHA_ID = "40000000-0000-4000-8000-000000000002";
const BAO_ID = "40000000-0000-4000-8000-000000000004";
const DELETION_CONFIRMATION = "DELETE LEARNER DATA";

test.describe.configure({ mode: "serial" });

async function logIn(page) {
  if (!teacherPassword) {
    throw new Error(
      "LP_AUDIT_TEACHER_PASSWORD is required for the teacher edge-workflow gate."
    );
  }
  await page.goto("/");
  await page.getByRole("button", {
    name: "Teachers: Literacy Guide Teacher Tools"
  }).click();
  await page.getByRole("textbox", { name: "Email" })
    .fill("audit-teacher-a@literacypath.invalid");
  await page.getByLabel("Password", { exact: true }).fill(teacherPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await completeTeacherClassEntry(page);
  await expect(page.locator('[data-teacher-product="class-dashboard"]')).toBeVisible();
}

async function openAuditRoster(page) {
  await page.getByTestId("teacher-primary-nav")
    .getByRole("button", { name: "Students", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Students", exact: true })).toBeVisible();
  const classSelect = page.getByLabel("Current class");
  await classSelect.selectOption({ label: "Audit Class A" });
  await expect(classSelect.locator("option:checked")).toHaveText("Audit Class A");
  const roster = page.locator(".teacher-roster-table");
  await expect(roster.getByRole("row").filter({ hasText: "Aisha" })).toBeVisible();
  return roster;
}

async function openStudentSettings(page, roster, studentName) {
  const row = roster.getByRole("row").filter({ hasText: studentName });
  await row.getByRole("button", { name: `Open ${studentName}`, exact: true }).click();
  const details = page.getByRole("dialog", { name: `Student details: ${studentName}` });
  await expect(details).toBeVisible();
  await details.getByRole("button", { name: "Student settings", exact: true }).click();
  const options = page.getByRole("dialog", { name: `Options for ${studentName}` });
  await expect(options).toBeVisible();
  return options;
}

async function setSymbolPassword(page, studentId, sequence) {
  const result = await page.evaluate(async ({ id, nextSequence }) => {
    const { supabase } = await import("/src/supabaseClient.js");
    const { data, error } = await supabase.call("teacher_set_student_symbol_password", {
      p_student_id: id,
      p_sequence: nextSequence,
      p_set_at: new Date().toISOString()
    });
    return {
      data,
      error: error ? { code: error.code || "", message: error.message || "" } : null
    };
  }, { id: studentId, nextSequence: sequence });
  if (result.error || result.data?.ok !== true) {
    throw new Error(result.error?.message || "Could not restore the sign-in pictures.");
  }
}

async function readStudentProgressProfile(page, studentId) {
  return page.evaluate(async id => {
    const { supabase } = await import("/src/supabaseClient.js");
    const { data, error } = await supabase.table("student_progress")
      .select("id,student_id,area,key,payload,updated_at")
      .eq("student_id", id)
      .eq("area", "profile")
      .eq("key", "__all__")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data || null;
  }, studentId);
}

async function restoreStudentProgressProfile(page, studentId, original) {
  const result = await page.evaluate(async ({ id, previous }) => {
    const { supabase } = await import("/src/supabaseClient.js");
    const restoredAt = previous?.updated_at || new Date().toISOString();
    const payload = previous?.payload || {
      accessibilitySettings: {
        reducedEffects: false,
        extendedResponse: false,
        lowerAudioIntensity: false,
        narration: false,
        simplifiedBackgrounds: false
      },
      accessibilitySettingsAt: restoredAt,
      accessibilitySettingsBy: "teacher"
    };
    const { error } = await supabase.table("student_progress").upsert({
      student_id: id,
      area: "profile",
      key: "__all__",
      payload,
      updated_at: restoredAt
    }, { onConflict: "student_id,area,key" });
    return error ? { message: error.message || "Profile restore failed." } : null;
  }, { id: studentId, previous: original });
  if (result) throw new Error(result.message);
}

async function seedDisposableLearner(page, learner) {
  return page.evaluate(async record => {
    const { supabase } = await import("/src/supabaseClient.js");
    const { error } = await supabase.table("students").insert({
      id: record.studentId,
      class_id: record.classId,
      teacher_id: record.teacherId,
      name: record.studentName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    if (error) throw new Error(error.message);
    return true;
  }, {
    ...learner,
    classId: AUDIT_CLASS_A_ID,
    teacherId: AUDIT_TEACHER_A_ID
  });
}

async function cleanupDisposableLearner(page, learner, preparedRequest = null) {
  await page.evaluate(async ({ record, prepared, confirmation }) => {
    const { supabase } = await import("/src/supabaseClient.js");
    const {
      buildLearnerLocalCleanupProof,
      completeLearnerDeletion,
      deleteLearnerData,
      loadLearnerDeletionStatus
    } = await import("/src/data/learnerDataRights.js");
    const { deleteRosterStudent } = await import("/src/data/teacherRosterOperations.js");
    const {
      clearAndVerifyLocalProgressForStudent
    } = await import("/src/utils/progressSync.js");
    const {
      clearLocalElAssessmentDataForStudent
    } = await import("/src/utils/elAssessmentReset.js");
    const runVerifiedLocalCleanup = async () => {
      const progressCleanup =
        await clearAndVerifyLocalProgressForStudent(record.studentId);
      const evidenceCleanup = await clearLocalElAssessmentDataForStudent({
        teacherId: record.teacherId,
        studentId: record.studentId,
        studentName: record.studentName
      });
      return { progressCleanup, evidenceCleanup };
    };
    const { data, error } = await supabase.table("students")
      .select("id")
      .eq("id", record.studentId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    if (data && prepared?.requestId && prepared?.subjectRef) {
      await deleteLearnerData({
        client: supabase,
        studentId: record.studentId,
        preparedRequest: prepared,
        confirmation,
        studentName: record.studentName,
        accountId: record.teacherId
      });
      const cleanupResult = await runVerifiedLocalCleanup();
      const localCleanupProof = buildLearnerLocalCleanupProof({
        preparedRequest: prepared,
        studentId: record.studentId,
        ...cleanupResult
      });
      await completeLearnerDeletion({
        client: supabase,
        preparedRequest: prepared,
        localCleanupProof
      });
      return;
    }
    if (data) {
      await deleteRosterStudent({
        supabase,
        studentId: record.studentId,
        studentName: record.studentName,
        accountId: record.teacherId,
        cleanup: runVerifiedLocalCleanup
      });
      return;
    }
    if (prepared?.requestId && prepared?.subjectRef) {
      const status = await loadLearnerDeletionStatus({
        client: supabase,
        preparedRequest: prepared
      });
      if (status.status !== "completed") {
        const cleanupResult = await runVerifiedLocalCleanup();
        const localCleanupProof = buildLearnerLocalCleanupProof({
          preparedRequest: prepared,
          studentId: record.studentId,
          ...cleanupResult
        });
        await completeLearnerDeletion({
          client: supabase,
          preparedRequest: prepared,
          localCleanupProof
        });
      }
    }
  }, {
    record: {
      ...learner,
      teacherId: AUDIT_TEACHER_A_ID
    },
    prepared: preparedRequest,
    confirmation: DELETION_CONFIRMATION
  });
}

test("@teacher-sign-in-picture-retry a failed picture save keeps the draft and a real retry closes only after success", async ({
  page
}) => {
  test.setTimeout(60_000);
  await logIn(page);
  const roster = await openAuditRoster(page);
  let uiWriteCount = 0;
  await page.route("**/rest/v1/rpc/teacher_set_student_symbol_password", async route => {
    const request = route.request();
    const body = request.postDataJSON?.() || {};
    if (
      request.method() === "POST"
      && body.p_student_id === AISHA_ID
      && body.p_sequence !== "112"
    ) {
      uiWriteCount += 1;
      if (uiWriteCount === 1) {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            code: "LP_TEST_WRITE_FAILURE",
            details: null,
            hint: null,
            message: "Synthetic sign-in-picture save failure."
          })
        });
        return;
      }
    }
    await route.continue();
  });

  try {
    const aishaRow = roster.getByRole("row").filter({ hasText: "Aisha" });
    await aishaRow.getByRole("button", {
      name: "Change sign-in pictures for Aisha",
      exact: true
    }).click();
    const dialog = page.getByRole("dialog", {
      name: "Change sign-in pictures for Aisha"
    });
    const pad = dialog.locator(".symbol-password-pad");
    for (const picture of ["Cat", "Dog", "Fish"]) {
      await pad.getByRole("button", { name: picture, exact: true }).click();
    }

    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("alert")).toHaveText(
      "We couldn't save those sign-in pictures. Nothing changed. Try again or cancel."
    );
    await expect(pad.locator(".symbol-password-dots"))
      .toHaveAttribute("aria-label", "3 of 3 symbols entered");

    await pad.getByRole("button", { name: "Back", exact: true }).click();
    await pad.getByRole("button", { name: "House", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect.poll(() => uiWriteCount).toBe(2);

    const savedSequence = await page.evaluate(async id => {
      const { supabase } = await import("/src/supabaseClient.js");
      const { data, error } = await supabase.table("students")
        .select("symbol_password")
        .eq("id", id)
        .single();
      if (error) throw new Error(error.message);
      return data.symbol_password;
    }, AISHA_ID);
    expect(savedSequence).toBe("129");
  } finally {
    await setSymbolPassword(page, AISHA_ID, "112");
  }
});

test("@teacher-accessibility-save-retry a failed save stays in the modal with its draft, then a genuine retry persists it", async ({
  page
}) => {
  test.setTimeout(60_000);
  await logIn(page);
  const originalProfile = await readStudentProgressProfile(page, AISHA_ID);
  const roster = await openAuditRoster(page);
  let accessibilityWriteCount = 0;
  await page.route("**/rest/v1/student_progress*", async route => {
    const request = route.request();
    const bodyText = request.postData() || "";
    if (
      request.method() === "POST"
      && bodyText.includes(`"student_id":"${AISHA_ID}"`)
      && bodyText.includes('"accessibilitySettings"')
    ) {
      accessibilityWriteCount += 1;
      if (accessibilityWriteCount === 1) {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            code: "LP_TEST_WRITE_FAILURE",
            details: null,
            hint: null,
            message: "Synthetic accessibility save failure."
          })
        });
        return;
      }
    }
    await route.continue();
  });

  try {
    const options = await openStudentSettings(page, roster, "Aisha");
    await options.getByRole("button", { name: "Accessibility settings", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Accessibility settings for Aisha"
    });
    const reducedEffects = dialog.getByRole("checkbox", {
      name: /^Reduced effects/
    });
    const targetChecked = !(await reducedEffects.isChecked());
    if (targetChecked) await reducedEffects.check();
    else await reducedEffects.uncheck();

    await dialog.getByRole("button", { name: "Save accessibility settings" }).click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("alert")).toHaveText(
      "We couldn't save these accessibility settings. Nothing changed. Review the choices and try again."
    );
    if (targetChecked) await expect(reducedEffects).toBeChecked();
    else await expect(reducedEffects).not.toBeChecked();
    const saveButton = dialog.getByRole("button", {
      name: "Save accessibility settings"
    });
    const saveWasFocusedAfterFailure = await saveButton.evaluate(
      button => document.activeElement === button
    );

    await saveButton.click();
    await expect(dialog).toHaveCount(0);
    await expect.poll(() => accessibilityWriteCount).toBe(2);

    const savedProfile = await readStudentProgressProfile(page, AISHA_ID);
    expect(savedProfile?.payload?.accessibilitySettings?.reducedEffects)
      .toBe(targetChecked);
    expect(
      saveWasFocusedAfterFailure,
      "the failed save must return keyboard focus to the retry control"
    ).toBe(true);
  } finally {
    await restoreStudentProgressProfile(page, AISHA_ID, originalProfile);
  }
});

test("@teacher-mixed-activity Bao's zero-answer row still reports its saved Sound Seekers activity", async ({
  page
}) => {
  await logIn(page);
  const roster = await openAuditRoster(page);
  const baoRow = roster.getByRole("row").filter({ hasText: "Bao" });
  await expect(baoRow.getByText("No scored answers yet", { exact: true })).toBeVisible();
  await expect(baoRow).not.toContainText(/no practice|no activity/i);

  await baoRow.getByRole("button", { name: "Open Bao", exact: true }).click();
  const details = page.getByRole("dialog", { name: "Student details: Bao" });
  await expect(details.getByText("Sound Seekers", { exact: true })).toBeVisible();
  await expect(details).toContainText(/3 of 40 trails/i);
  await expect(details).not.toContainText(/Sound Seekers\s+Not started/i);
});

test("@teacher-deletion-confirmation Bao's zero-answer row and formal record still require exact typed confirmation", async ({
  page
}) => {
  await logIn(page);
  const formalAttemptCount = await page.evaluate(async id => {
    const { supabase } = await import("/src/supabaseClient.js");
    const { count, error } = await supabase.table("assessment_attempts")
      .select("attempt_id", { count: "exact", head: true })
      .eq("student_id", id);
    if (error) throw new Error(error.message);
    return count || 0;
  }, BAO_ID);
  expect(formalAttemptCount).toBeGreaterThan(0);

  const roster = await openAuditRoster(page);
  const baoRow = roster.getByRole("row").filter({ hasText: "Bao" });
  await expect(baoRow.getByText("No scored answers yet", { exact: true })).toBeVisible();
  await baoRow.getByRole("button", { name: "Open Bao", exact: true }).click();
  const details = page.getByRole("dialog", { name: "Student details: Bao" });
  await details.getByRole("button", { name: "Student settings", exact: true }).click();
  const options = page.getByRole("dialog", { name: "Options for Bao" });
  await options.getByRole("button", { name: "Delete student…", exact: true }).click();

  const deleteDialog = page.getByRole("dialog", { name: "Delete Bao permanently" });
  await expect(deleteDialog).toContainText(/3 Sound Seekers stops?/i);
  const confirm = deleteDialog.getByRole("button", {
    name: "Yes, delete Bao permanently",
    exact: true
  });
  await expect(confirm).toBeDisabled();
  await deleteDialog.getByLabel("Type Bao to confirm").fill("bao ");
  await expect(confirm).toBeEnabled();
  await expect(deleteDialog).toContainText(/minimal .*record .*request .*kept/i);
  await deleteDialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(baoRow).toBeVisible();
});

test("@teacher-data-rights-delete both privacy copy and the completed backend retain only the minimal request record", async ({
  page
}) => {
  test.setTimeout(90_000);
  const suffix = randomUUID();
  const learner = {
    studentId: randomUUID(),
    studentName: `Edge Delete ${suffix.slice(0, 6)}`
  };
  let preparedRequest = null;

  await logIn(page);
  await seedDisposableLearner(page, learner);
  try {
    const roster = await openAuditRoster(page);
    await page.getByRole("searchbox", { name: "Search students" })
      .fill(learner.studentName);
    const row = roster.getByRole("row").filter({ hasText: learner.studentName });
    await expect(row).toBeVisible();
    const options = await openStudentSettings(page, roster, learner.studentName);
    await options.getByRole("button", {
      name: "Privacy and data rights",
      exact: true
    }).click();
    const dialog = page.getByRole("dialog", {
      name: `Data choices for ${learner.studentName}`
    });
    await expect(dialog).toContainText(
      "The school keeps only the date, outcome and reason for the request."
    );
    await expect(dialog).toContainText(
      "No student work, results or profile details remain after deletion."
    );
    await dialog.getByLabel("Who made the request?").selectOption("school");
    await dialog.getByLabel("How was identity and authority verified?")
      .selectOption("authorised_school_official");

    const prepareResponse = page.waitForResponse(response => (
      response.url().includes("/rest/v1/rpc/teacher_prepare_learner_deletion")
      && response.request().method() === "POST"
    ));
    await dialog.getByRole("button", { name: "Review deletion request" }).click();
    preparedRequest = await (await prepareResponse).json();
    expect(preparedRequest.requestId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(preparedRequest.subjectRef).toMatch(/^[0-9a-f]{64}$/);

    const deleteButton = dialog.getByRole("button", {
      name: "Delete all student data",
      exact: true
    });
    await expect(deleteButton).toBeDisabled();
    await dialog.getByLabel("Exact confirmation").fill(DELETION_CONFIRMATION);
    await expect(deleteButton).toBeEnabled();
    await deleteButton.click();

    await expect(dialog).toHaveCount(0, { timeout: 20_000 });
    await expect(page.locator("[data-action-feedback]").filter({
      hasText: `${learner.studentName}'s data and saved results were deleted permanently.`
    })).toContainText(
      "The school keeps only the date, outcome and reason for the deletion request."
    );
    await expect(row).toHaveCount(0);

    const proof = await page.evaluate(async ({ studentId, prepared }) => {
      const { supabase } = await import("/src/supabaseClient.js");
      const [student, status] = await Promise.all([
        supabase.table("students").select("id").eq("id", studentId),
        supabase.call("teacher_get_learner_deletion_status", {
          p_request_id: prepared.requestId,
          p_subject_ref: prepared.subjectRef
        })
      ]);
      if (student.error) throw new Error(student.error.message);
      if (status.error) throw new Error(status.error.message);
      return {
        activeStudentCount: student.data.length,
        status: status.data
      };
    }, { studentId: learner.studentId, prepared: preparedRequest });
    expect(proof.activeStudentCount).toBe(0);
    expect(proof.status).toMatchObject({
      requestId: preparedRequest.requestId,
      subjectRef: preparedRequest.subjectRef,
      status: "completed",
      databaseDeleted: true,
      residualManagedRecords: 0
    });
  } finally {
    await cleanupDisposableLearner(page, learner, preparedRequest);
  }
});

test("@teacher-mixed-skill-drawer separates Aisha's current focus from accuracy across all skills", async ({
  page
}) => {
  await logIn(page);
  const roster = await openAuditRoster(page);
  const aishaRow = roster.getByRole("row").filter({ hasText: "Aisha" });
  await aishaRow.getByRole("button", { name: "Open Aisha", exact: true }).click();
  const details = page.getByRole("dialog", { name: "Student details: Aisha" });
  const drawer = details.getByRole("region", { name: "Student details: Aisha" });
  await expect(drawer).toContainText("Current focus:");
  await expect(drawer).toContainText("Initial Sounds");

  const metrics = drawer.locator(
    '.teacher-learner-drawer-metrics[aria-label="Aisha results summary"]'
  );
  await expect(metrics.getByText("Accuracy across skills", { exact: true })).toBeVisible();
  const accuracy = metrics.locator(".teacher-roster-metric").first();
  await expect(accuracy.getByText("30%", { exact: true })).toBeVisible();
  await expect(accuracy).not.toContainText("Initial Sounds");
});
