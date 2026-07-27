import process from "node:process";
import { createClient } from "@supabase/supabase-js";
import {
  archiveAssessmentEvidence,
  compactAssessmentAttemptForStorage,
  normalizeAssessmentAttempt
} from "../src/data/assessmentHistoryStore.js";

const TEACHER_A = {
  email: "audit-teacher-a@literacypath.invalid",
  classId: "30000000-0000-4000-8000-000000000001",
  studentId: "40000000-0000-4000-8000-000000000001"
};
const TEACHER_B = {
  email: "audit-teacher-b@literacypath.invalid"
};
const ATTEMPT_ID = "audit-immutable-evidence-replay";

function clientFor(apiUrl, anonKey) {
  return createClient(apiUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

function requireNoError(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result;
}

function requireCondition(condition, label) {
  if (!condition) throw new Error(label);
}

async function main() {
  const apiUrl = process.env.LP_AUDIT_SUPABASE_URL;
  const anonKey = process.env.LP_AUDIT_SUPABASE_ANON_KEY;
  const password = process.env.LP_AUDIT_TEACHER_PASSWORD;
  if (!apiUrl || !anonKey || !password) {
    throw new Error(
      "LP_AUDIT_SUPABASE_URL, LP_AUDIT_SUPABASE_ANON_KEY, and LP_AUDIT_TEACHER_PASSWORD are required."
    );
  }

  const teacherA = clientFor(apiUrl, anonKey);
  const teacherB = clientFor(apiUrl, anonKey);
  const teacherALogin = requireNoError(
    await teacherA.auth.signInWithPassword({ email: TEACHER_A.email, password }),
    "Teacher A login"
  );
  requireNoError(
    await teacherB.auth.signInWithPassword({ email: TEACHER_B.email, password }),
    "Teacher B login"
  );
  const teacherId = teacherALogin.data.user.id;
  const attempt = normalizeAssessmentAttempt({
    attemptId: ATTEMPT_ID,
    studentId: TEACHER_A.studentId,
    studentName: "Aarav",
    classId: TEACHER_A.classId,
    teacherId,
    assessmentType: "skill_checkpoint",
    assessmentVersion: "backend-form-2026.1",
    contentVersion: "backend-content-2026.1",
    policyVersion: "backend-policy-2026.1",
    policySnapshot: {
      roundLength: 1,
      passScore: 1
    },
    skillId: "initial_sounds",
    skillName: "Initial Sounds",
    startedAt: "2026-07-23T08:00:00.000Z",
    completedAt: "2026-07-23T08:01:00.000Z",
    updatedAt: "2026-07-23T08:01:00.000Z",
    administrationStatus: "completed",
    status: "mastered",
    passed: true,
    totalQuestions: 1,
    correctCount: 1,
    questionRecords: [{
      questionId: "backend-old-m",
      prompt: "Which word starts with /m/?",
      itemType: "initial_sound",
      itemKey: "m",
      targetSound: "m",
      correctAnswer: "moon",
      selectedAnswer: "moon",
      responseStatus: "correct",
      isCorrect: true
    }]
  });
  const payload = compactAssessmentAttemptForStorage(attempt);
  const rawEvidence = archiveAssessmentEvidence(attempt);
  const row = {
    attempt_id: attempt.attemptId,
    student_id: attempt.studentId,
    class_id: attempt.classId,
    teacher_id: attempt.teacherId,
    assessment_type: attempt.assessmentType,
    skill_id: attempt.skillId,
    skill_name: attempt.skillName,
    skill_level: attempt.skillLevel,
    skill_phase: attempt.skillPhase,
    started_at: attempt.startedAt,
    completed_at: attempt.completedAt,
    total_questions: attempt.totalQuestions,
    correct_count: attempt.correctCount,
    accuracy: attempt.accuracy,
    status: attempt.status,
    administration_status: attempt.administrationStatus,
    schema_version: attempt.schemaVersion,
    evidence_schema_version: attempt.evidenceSchemaVersion,
    assessment_version: attempt.assessmentVersion,
    content_version: attempt.contentVersion,
    policy_version: attempt.policyVersion,
    raw_evidence: rawEvidence,
    payload
  };

  try {
    await teacherA.from("assessment_attempts").delete().eq("attempt_id", ATTEMPT_ID);
    const inserted = requireNoError(
      await teacherA.from("assessment_attempts").insert(row).select(
        "attempt_id,assessment_version,content_version,policy_version,raw_evidence,payload"
      ).single(),
      "Versioned assessment evidence insert"
    );
    requireCondition(
      inserted.data.assessment_version === attempt.assessmentVersion
        && inserted.data.content_version === attempt.contentVersion
        && inserted.data.policy_version === attempt.policyVersion
        && inserted.data.raw_evidence.result.questionRecords[0].prompt
          === "Which word starts with /m/?"
        && inserted.data.raw_evidence.result.attemptId === inserted.data.payload.attemptId
        && inserted.data.raw_evidence.result.questionRecords.length
          === inserted.data.payload.questionRecords.length,
      "Stored result and immutable replay envelope diverged"
    );
    requireNoError(
      await teacherA.from("assessment_attempts").upsert(row, {
        onConflict: "attempt_id"
      }),
      "Idempotent terminal evidence retry"
    );

    const hidden = requireNoError(
      await teacherB.from("assessment_attempts")
        .select("attempt_id")
        .eq("attempt_id", ATTEMPT_ID),
      "Cross-teacher evidence read"
    );
    requireCondition(hidden.data.length === 0, "Teacher B could read Teacher A's evidence archive");

    const changedAttempt = normalizeAssessmentAttempt({
      ...attempt,
      skillName: "Rewritten Current Content",
      questionRecords: [{
        ...attempt.questionRecords[0],
        prompt: "A later deployment rewrote this prompt."
      }]
    });
    const changedPayload = compactAssessmentAttemptForStorage(changedAttempt);
    const changedArchive = archiveAssessmentEvidence(changedAttempt);
    const mutation = await teacherA.from("assessment_attempts").update({
      skill_name: changedAttempt.skillName,
      payload: changedPayload,
      raw_evidence: changedArchive
    }).eq("attempt_id", ATTEMPT_ID);
    requireCondition(
      Boolean(mutation.error?.message?.includes("immutable")),
      "A completed assessment result could be rewritten with current content"
    );

    const mismatched = await teacherA.from("assessment_attempts").insert({
      ...row,
      attempt_id: `${ATTEMPT_ID}-mismatch`
    });
    requireCondition(
      Boolean(mismatched.error?.message?.includes("does not match")),
      "The database accepted a replay envelope for a different attempt"
    );

    const captureId = `${ATTEMPT_ID}-capture`;
    const capturePayload = {
      ...payload,
      id: captureId,
      attemptId: captureId
    };
    const captureArchive = {
      ...rawEvidence,
      attemptId: captureId,
      capturedAt: "2026-07-24T08:01:00.000Z",
      result: capturePayload
    };
    const mismatchedCapture = await teacherA.from("assessment_attempts").insert({
      ...row,
      attempt_id: captureId,
      payload: capturePayload,
      raw_evidence: captureArchive
    });
    requireCondition(
      Boolean(mismatchedCapture.error?.message?.includes("does not match")),
      "The database accepted an archive capture time detached from completion"
    );
  } finally {
    requireNoError(
      await teacherA.from("assessment_attempts")
        .delete()
        .in("attempt_id", [
          ATTEMPT_ID,
          `${ATTEMPT_ID}-mismatch`,
          `${ATTEMPT_ID}-capture`
        ]),
      "Immutable evidence verifier cleanup"
    );
    await Promise.all([teacherA.auth.signOut(), teacherB.auth.signOut()]);
  }

  console.log(
    "Immutable assessment versions, raw replay evidence, terminal protection, and tenant isolation passed."
  );
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
