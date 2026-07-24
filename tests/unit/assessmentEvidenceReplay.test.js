import assert from "node:assert/strict";
import test from "node:test";
import {
  archiveAssessmentEvidence,
  normalizeAssessmentAttempt
} from "../../src/data/assessmentHistoryStore.js";
import { replayAssessmentEvidence } from "../../src/data/assessmentEvidenceReplay.js";
import { buildStudentReportingWorkspaceModel } from "../../src/data/studentReportingWorkspaceModel.js";

const student = {
  id: "student-replay",
  name: "Aisha",
  classId: "class-replay"
};

function reportResult(attempt) {
  const model = buildStudentReportingWorkspaceModel({
    student,
    assessmentHistory: [attempt]
  });
  return {
    student: model.student,
    wholeChild: model.wholeChild,
    skillsCheck: model.skillsCheck,
    provenance: model.provenance
  };
}

function oldAttempt(overrides = {}) {
  return normalizeAssessmentAttempt({
    attemptId: "attempt-replay-old",
    studentId: student.id,
    studentName: student.name,
    classId: student.classId,
    teacherId: "teacher-replay",
    assessmentType: "skill_checkpoint",
    assessmentVersion: "initial-sounds-form-2026.1",
    contentVersion: "initial-sounds-content-2026.1",
    policyVersion: "adaptive-policy-2026.1",
    policySnapshot: {
      roundLength: 1,
      passScore: 1,
      masteryThresholdPercent: 80
    },
    skillId: "initial_sounds",
    skillName: "Initial Sounds",
    startedAt: "2026-01-10T09:00:00.000Z",
    completedAt: "2026-01-10T09:01:00.000Z",
    administrationStatus: "completed",
    status: "mastered",
    passed: true,
    totalQuestions: 1,
    correctCount: 1,
    questionRecords: [{
      questionId: "old-m-item",
      prompt: "Which picture starts with /m/?",
      itemType: "initial_sound",
      itemKey: "m",
      targetSound: "m",
      correctAnswer: "moon",
      selectedAnswer: "moon",
      responseStatus: "correct",
      isCorrect: true,
      timestamp: "2026-01-10T09:00:30.000Z"
    }],
    ...overrides
  });
}

test("an archived result re-renders identically after content and policy change", () => {
  const original = oldAttempt();
  const originalReport = reportResult(original);
  const archive = archiveAssessmentEvidence(original);

  const currentDeployment = oldAttempt({
    attemptId: "attempt-current-deployment",
    assessmentVersion: "initial-sounds-form-2026.2",
    contentVersion: "initial-sounds-content-2026.2",
    policyVersion: "adaptive-policy-2026.2",
    policySnapshot: {
      roundLength: 2,
      passScore: 2,
      masteryThresholdPercent: 90
    },
    passed: false,
    status: "needs_retry",
    totalQuestions: 2,
    correctCount: 1,
    questionRecords: [{
      questionId: "new-m-item",
      prompt: "Say the first sound in map.",
      itemType: "initial_sound",
      itemKey: "m",
      targetSound: "m",
      correctAnswer: "m",
      selectedAnswer: "n",
      responseStatus: "incorrect",
      isCorrect: false
    }, {
      questionId: "new-s-item",
      prompt: "Say the first sound in sun.",
      itemType: "initial_sound",
      itemKey: "s",
      targetSound: "s",
      correctAnswer: "s",
      selectedAnswer: "s",
      responseStatus: "correct",
      isCorrect: true
    }]
  });
  assert.notDeepEqual(reportResult(currentDeployment), originalReport);

  const replayed = replayAssessmentEvidence(archive);
  assert.deepEqual(reportResult(replayed), originalReport);
  assert.equal(replayed.questionRecords[0].prompt, "Which picture starts with /m/?");
  assert.equal(replayed.policySnapshot.masteryThresholdPercent, 80);
  assert.equal(replayed.contentVersion, "initial-sounds-content-2026.1");
});

test("archive provenance cannot be detached from its result", () => {
  const archive = archiveAssessmentEvidence(oldAttempt());
  assert.throws(
    () => replayAssessmentEvidence({
      ...archive,
      policyVersion: "rewritten-policy"
    }),
    /provenance does not match/
  );
  assert.throws(
    () => replayAssessmentEvidence({
      ...archive,
      result: { ...archive.result, attemptId: "other-attempt" }
    }),
    /provenance does not match/
  );
  assert.throws(
    () => replayAssessmentEvidence({
      ...archive,
      capturedAt: "2026-02-01T00:00:00.000Z"
    }),
    /provenance does not match/
  );
});

test("unversioned item content receives a deterministic evidence fingerprint", () => {
  const first = normalizeAssessmentAttempt({
    ...oldAttempt(),
    contentVersion: "",
    questionRecords: oldAttempt().questionRecords
  });
  const repeated = normalizeAssessmentAttempt({
    ...oldAttempt(),
    contentVersion: "",
    questionRecords: oldAttempt().questionRecords
  });
  const changed = normalizeAssessmentAttempt({
    ...oldAttempt(),
    contentVersion: "",
    questionRecords: [{
      ...oldAttempt().questionRecords[0],
      prompt: "Changed prompt"
    }]
  });
  const differentResponse = normalizeAssessmentAttempt({
    ...oldAttempt(),
    contentVersion: "",
    questionRecords: [{
      ...oldAttempt().questionRecords[0],
      selectedAnswer: "mouse",
      responseStatus: "incorrect",
      isCorrect: false
    }]
  });
  assert.match(first.contentVersion, /^content-[0-9a-f]{8}$/);
  assert.equal(repeated.contentVersion, first.contentVersion);
  assert.equal(differentResponse.contentVersion, first.contentVersion);
  assert.notEqual(changed.contentVersion, first.contentVersion);
});
