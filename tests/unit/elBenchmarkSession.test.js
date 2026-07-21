import test from "node:test";
import assert from "node:assert/strict";
import { EL_BENCHMARK_IDS } from "../../src/data/elBenchmarkAssessments.js";
import {
  createElBenchmarkSession,
  findLatestElBenchmarkAttempt,
  getElBenchmarkPrerequisiteStatus,
  resolveElBenchmarkStartMicrophase
} from "../../src/data/elBenchmarkSession.js";

const base = {
  studentId: "student-1",
  gradePath: "1",
  benchmarkWindow: "MOY"
};

test("latest benchmark lookup is student, domain, grade, and window scoped", () => {
  const history = [
    { ...base, attemptId: "older", assessmentType: EL_BENCHMARK_IDS.ENCODING, updatedAt: "2026-01-01T00:00:00.000Z" },
    { ...base, attemptId: "newer", assessmentType: EL_BENCHMARK_IDS.ENCODING, updatedAt: "2026-02-01T00:00:00.000Z" },
    { ...base, studentId: "student-2", attemptId: "other-student", assessmentType: EL_BENCHMARK_IDS.ENCODING, updatedAt: "2026-03-01T00:00:00.000Z" },
    { ...base, benchmarkWindow: "EOY", attemptId: "other-window", assessmentType: EL_BENCHMARK_IDS.ENCODING, updatedAt: "2026-04-01T00:00:00.000Z" },
    { studentId: "student-1", attemptId: "unscoped-newest", assessmentType: EL_BENCHMARK_IDS.ENCODING, updatedAt: "2026-05-01T00:00:00.000Z" }
  ];
  const latest = findLatestElBenchmarkAttempt({
    assessmentHistory: history,
    studentId: "student-1",
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade: "1",
    window: "MOY"
  });
  assert.equal(latest.attemptId, "newer");
});

test("decoding never auto-routes from an unconfirmed encoding suggestion", () => {
  const history = [{
    ...base,
    attemptId: "encoding-unconfirmed",
    assessmentType: EL_BENCHMARK_IDS.ENCODING,
    candidatePlacement: {
      candidateMicrophase: "late_partial",
      requiresTeacherConfirmation: true
    }
  }];
  const route = resolveElBenchmarkStartMicrophase({
    assessmentHistory: history,
    studentId: "student-1",
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "1",
    window: "MOY"
  });
  assert.equal(route.startMicrophase, "");
  assert.equal(route.routeSource, "grade_window_expected_anchor");
});

test("confirmed Encoding and completed Decoding evidence hand off to the next domain", () => {
  const history = [
    {
      ...base,
      attemptId: "encoding-confirmed",
      assessmentType: EL_BENCHMARK_IDS.ENCODING,
      administrationStatus: "completed",
      confirmedPlacement: { candidateMicrophase: "late_partial" }
    },
    {
      ...base,
      attemptId: "decoding-complete",
      assessmentType: EL_BENCHMARK_IDS.DECODING,
      administrationStatus: "completed",
      metrics: {
        fluencyStartMicrophase: {
          microphase: "middle_full",
          cycle: 39,
          evidence: { automaticCount: 7, denominator: 8 }
        }
      }
    }
  ];
  const decoding = resolveElBenchmarkStartMicrophase({
    assessmentHistory: history,
    studentId: "student-1",
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "1",
    window: "MOY"
  });
  const fluency = resolveElBenchmarkStartMicrophase({
    assessmentHistory: history,
    studentId: "student-1",
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    grade: "1",
    window: "MOY"
  });
  assert.deepEqual(decoding, {
    startMicrophase: "late_partial",
    routeSource: "confirmed_encoding_placement",
    sourceAttemptId: "encoding-confirmed"
  });
  assert.deepEqual(fluency, {
    startMicrophase: "middle_full",
    routeSource: "decoding_fluency_handoff",
    sourceAttemptId: "decoding-complete"
  });
});

test("a newer partial attempt never replaces the completed prerequisite route evidence", () => {
  const history = [
    {
      ...base,
      attemptId: "encoding-completed",
      assessmentType: EL_BENCHMARK_IDS.ENCODING,
      administrationStatus: "completed",
      completedAt: "2026-07-20T10:00:00.000Z",
      confirmedPlacement: { candidateMicrophase: "late_partial" }
    },
    {
      ...base,
      attemptId: "encoding-newer-partial",
      assessmentType: EL_BENCHMARK_IDS.ENCODING,
      administrationStatus: "partial",
      updatedAt: "2026-07-21T10:00:00.000Z",
      confirmedPlacement: { candidateMicrophase: "middle_full" }
    },
    {
      ...base,
      attemptId: "encoding-newer-invalid-completed",
      assessmentType: EL_BENCHMARK_IDS.ENCODING,
      administrationStatus: "completed",
      scoreStatus: "partial",
      updatedAt: "2026-07-21T10:30:00.000Z",
      validationIssues: ["encoding_exact_judgment_conflicts_with_transcription"],
      confirmedPlacement: { candidateMicrophase: "middle_full" }
    },
    {
      ...base,
      attemptId: "decoding-completed",
      assessmentType: EL_BENCHMARK_IDS.DECODING,
      administrationStatus: "completed",
      completedAt: "2026-07-20T11:00:00.000Z",
      fluencyStartMicrophase: { microphase: "early_full" }
    },
    {
      ...base,
      attemptId: "decoding-newer-partial",
      assessmentType: EL_BENCHMARK_IDS.DECODING,
      administrationStatus: "partial",
      updatedAt: "2026-07-21T11:00:00.000Z",
      fluencyStartMicrophase: { microphase: "late_full" }
    },
    {
      ...base,
      attemptId: "decoding-newer-invalid-completed",
      assessmentType: EL_BENCHMARK_IDS.DECODING,
      administrationStatus: "completed",
      scoreStatus: "partial",
      updatedAt: "2026-07-21T11:30:00.000Z",
      validationIssues: ["response_transcription_required"],
      fluencyStartMicrophase: { microphase: "late_full" }
    }
  ];

  assert.deepEqual(resolveElBenchmarkStartMicrophase({
    assessmentHistory: history,
    studentId: "student-1",
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "1",
    window: "MOY"
  }), {
    startMicrophase: "late_partial",
    routeSource: "confirmed_encoding_placement",
    sourceAttemptId: "encoding-completed"
  });
  assert.deepEqual(resolveElBenchmarkStartMicrophase({
    assessmentHistory: history,
    studentId: "student-1",
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    grade: "1",
    window: "MOY"
  }), {
    startMicrophase: "early_full",
    routeSource: "decoding_fluency_handoff",
    sourceAttemptId: "decoding-completed"
  });
  assert.equal(getElBenchmarkPrerequisiteStatus({
    assessmentHistory: history,
    studentId: "student-1",
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "1",
    window: "MOY"
  }).evidenceAttemptId, "encoding-completed");
  assert.equal(getElBenchmarkPrerequisiteStatus({
    assessmentHistory: history,
    studentId: "student-1",
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    grade: "1",
    window: "MOY"
  }).evidenceAttemptId, "decoding-completed");
});

test("an explicit teacher-selected decoding start wins and is preserved in the session", () => {
  const session = createElBenchmarkSession({
    assessmentHistory: [],
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "1",
    window: "MOY",
    requestedStart: "early_full",
    ownership: {
      studentId: "student-1",
      studentName: "Ada",
      classId: "class-1",
      teacherId: "teacher-1"
    },
    startedAt: "2026-07-21T01:02:03.000Z",
    sessionToken: "stable-token"
  });
  assert.equal(session.startMicrophase, "early_full");
  assert.equal(session.routeSource, "teacher_selected");
  assert.equal(session.sessionId, "el_benchmark_session_stable-token");
  assert.equal(session.attemptId, "el_benchmark_attempt_student-1_stable-token");
  assert.equal(session.studentId, "student-1");
  assert.equal(session.status, "in_progress");
  assert.deepEqual(session.responses, {});
});

test("session creation rejects an ownerless or unstable draft", () => {
  assert.throws(() => createElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    startedAt: "2026-07-21T01:02:03.000Z",
    sessionToken: "token"
  }), /selected student/i);
  assert.throws(() => createElBenchmarkSession({
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    ownership: { studentId: "student-1" },
    sessionToken: "token"
  }), /start timestamp/i);
});

test("the ordered route requires explicit evidence or an auditable exception", () => {
  const noEvidence = [];
  assert.equal(getElBenchmarkPrerequisiteStatus({
    assessmentHistory: noEvidence,
    studentId: "student-1",
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade: "K",
    window: "MOY"
  }).state, "override");
  assert.equal(getElBenchmarkPrerequisiteStatus({
    assessmentHistory: noEvidence,
    studentId: "student-1",
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "1",
    window: "MOY"
  }).code, "confirmed_encoding_start_missing");
  assert.equal(getElBenchmarkPrerequisiteStatus({
    assessmentHistory: noEvidence,
    studentId: "student-1",
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    grade: "2",
    window: "EOY"
  }).code, "decoding_fluency_handoff_missing");

  const letter = {
    studentId: "student-1",
    attemptId: "letters-1",
    assessmentType: "el_letter_assessment",
    administrationStatus: "completed",
    completedAt: "2026-01-01T00:00:00.000Z"
  };
  assert.equal(getElBenchmarkPrerequisiteStatus({
    assessmentHistory: [letter],
    studentId: "student-1",
    assessmentId: EL_BENCHMARK_IDS.ENCODING,
    grade: "K",
    window: "MOY"
  }).state, "confirmation");

  const encoding = {
    ...base,
    attemptId: "encoding-confirmed",
    assessmentType: EL_BENCHMARK_IDS.ENCODING,
    administrationStatus: "completed",
    confirmedPlacement: { candidateMicrophase: "late_partial" }
  };
  assert.equal(getElBenchmarkPrerequisiteStatus({
    assessmentHistory: [encoding],
    studentId: "student-1",
    assessmentId: EL_BENCHMARK_IDS.DECODING,
    grade: "1",
    window: "MOY"
  }).state, "ready");

  const decoding = {
    ...base,
    attemptId: "decoding-handoff",
    assessmentType: EL_BENCHMARK_IDS.DECODING,
    administrationStatus: "completed",
    fluencyStartMicrophase: { microphase: "middle_full" }
  };
  assert.equal(getElBenchmarkPrerequisiteStatus({
    assessmentHistory: [decoding],
    studentId: "student-1",
    assessmentId: EL_BENCHMARK_IDS.ORAL_READING_FLUENCY,
    grade: "1",
    window: "MOY"
  }).state, "ready");
});
