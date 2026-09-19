import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAssessmentAttemptRecord,
  compactAssessmentAttemptForStorage,
  mergeAssessmentAttemptRecords,
  normalizeAssessmentAttempt
} from "../../src/data/assessmentHistoryStore.js";

const fixture = {
  teacherId: "a1100000-0000-4000-8000-000000000001",
  studentId: "a1400000-0000-4000-8000-000000000001",
  classId: "a1300000-0000-4000-8000-000000000001",
  studentName: "Synthetic Learner",
  skillId: "initial_sounds",
  skillName: "Initial Sounds",
  startedAt: "2026-09-19T01:00:00.000Z",
  completedAt: "2026-09-19T01:01:00.000Z",
  questionRecords: Array.from({ length: 10 }, (_, index) => ({
    questionId: `initial-sounds-assessment-level-one-phase-one-word-choice-${index}`,
    isCorrect: index < 7,
    timestamp: "2026-09-19T01:00:00.000Z"
  }))
};

test("full classroom rounds have bounded, deterministic IDs through every persistence normalization", () => {
  const normalized = normalizeAssessmentAttempt(fixture);
  assert.ok(normalized.attemptId.length <= 200);
  assert.equal(normalizeAssessmentAttempt(structuredClone(fixture)).attemptId, normalized.attemptId);
  assert.equal(compactAssessmentAttemptForStorage(normalized).attemptId, normalized.attemptId);
  assert.equal(normalizeAssessmentAttempt(JSON.parse(JSON.stringify(normalized))).attemptId, normalized.attemptId);

  const built = buildAssessmentAttemptRecord({
    ...fixture,
    stage: { id: fixture.skillId, label: fixture.skillName },
    checkpoint: { skillId: fixture.skillId, pathStatus: { level: 1, phase: 1 } }
  });
  assert.ok(built.attemptId.length <= 200);
  assert.equal(compactAssessmentAttemptForStorage(built).attemptId, built.attemptId);
});

test("bounded identities retain differences in learner, teacher, skill, time, and the end of a long question list", () => {
  const identities = [
    fixture,
    { ...fixture, teacherId: "a1100000-0000-4000-8000-000000000002" },
    { ...fixture, studentId: "a1400000-0000-4000-8000-000000000002" },
    { ...fixture, skillId: "syllables" },
    { ...fixture, startedAt: "2026-09-19T01:00:00.001Z" },
    { ...fixture, questionRecords: fixture.questionRecords.map((question, index) => index === 9
      ? { ...question, questionId: `${question.questionId}-different` } : question) }
  ].map(record => normalizeAssessmentAttempt(record).attemptId);
  assert.equal(new Set(identities).size, identities.length);
  assert.ok(identities.every(id => id.length <= 200));
});

test("long question identities preserve sequence boundaries instead of conflating delimiter characters", () => {
  const prefix = fixture.questionRecords;
  const left = normalizeAssessmentAttempt({ ...fixture,
    questionRecords: [...prefix, { questionId: "a-b", isCorrect: true }, { questionId: "c", isCorrect: true }]
  });
  const right = normalizeAssessmentAttempt({ ...fixture,
    questionRecords: [...prefix, { questionId: "a", isCorrect: true }, { questionId: "b-c", isCorrect: true }]
  });
  assert.notEqual(left.attemptId, right.attemptId);
});

test("existing explicit IDs and short legacy generated IDs remain unchanged", () => {
  const legacyId = `attempt_${"old-immutable-id_".repeat(30)}`;
  const existing = normalizeAssessmentAttempt({ ...fixture, attemptId: legacyId });
  assert.equal(existing.attemptId, legacyId);
  assert.equal(compactAssessmentAttemptForStorage(existing).attemptId, legacyId);
  const merged = mergeAssessmentAttemptRecords([existing], [existing]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].attemptId, legacyId);
  assert.equal(normalizeAssessmentAttempt({
    teacherId: "t", studentId: "s", skillId: "skill",
    startedAt: fixture.startedAt, completedAt: fixture.completedAt,
    questionRecords: [{ questionId: "q1", isCorrect: true }]
  }).attemptId, "attempt_t_s_skill_2026_09_19t01_00_00_000z_q1");
});
