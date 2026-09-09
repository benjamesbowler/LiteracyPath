import test from "node:test";
import assert from "node:assert/strict";
import { restoreCyclePracticeSession } from "../../src/components/cycle-practice/cyclePracticeRecovery.js";
import { CYCLE_ACTIVITY_REVISION } from "../../src/policy/cyclePracticePolicy.js";

function freshSession() {
  return { mode: "practice", practiceIndex: 0, assessmentIndex: 0, pass: 0,
    attempts: 0, earnedCount: 0, assessmentRecords: [], practiceRecords: [],
    pendingAttempt: null, result: null, startedAt: "2026-09-09T00:00:00.000Z" };
}

test("a new session starts with the current activity revision without mutating its defaults", () => {
  const fresh = freshSession();
  const restored = restoreCyclePracticeSession(null, fresh);
  assert.deepEqual(restored, { ...fresh, activityRevision: CYCLE_ACTIVITY_REVISION });
  assert.notEqual(restored, fresh);
  assert.equal(fresh.activityRevision, undefined);
});

test("unfinished legacy practice resets the deck while retaining every source record for recovery", () => {
  const saved = Object.freeze({ ...freshSession(), practiceIndex: 18, pass: 3, attempts: 2,
    practiceRecords: [{ questionId: "old-sound-gate", selected: "m" }],
    clock: { activePracticeSeconds: 901 }, attemptId: "legacy-practice" });
  const fresh = freshSession();
  const restored = restoreCyclePracticeSession(saved, fresh);
  assert.deepEqual(restored, { ...fresh, activityRevision: CYCLE_ACTIVITY_REVISION, previousContentSession: saved });
  assert.equal(restored.previousContentSession, saved);
  assert.equal(restored.practiceRecords.length, 0);
  assert.equal(restored.practiceIndex, 0);
  assert.equal(restored.attemptId, undefined);
  assert.equal(saved.practiceIndex, 18);
});

test("an unfinished old check cannot mix its prior answers or index into the replacement assessment", () => {
  const saved = { ...freshSession(), activityRevision: "previous-activity-revision", mode: "assessment",
    assessmentIndex: 7, assessmentRecords: [{ questionId: "old-word-window", selected: "cat" }],
    frozenPracticeSeconds: 1800, attemptId: "legacy-check" };
  const restored = restoreCyclePracticeSession(saved, freshSession());
  assert.equal(restored.mode, "practice");
  assert.equal(restored.assessmentIndex, 0);
  assert.deepEqual(restored.assessmentRecords, []);
  assert.equal(restored.previousContentSession.assessmentRecords, saved.assessmentRecords);
  assert.equal(restored.frozenPracticeSeconds, undefined);
});

test("an immutable pending legacy save stays byte-identical and retryable", () => {
  const pendingAttempt = Object.freeze({ attemptId: "pending-old-result", assessmentVersion: "old-v2",
    questionRecords: [{ questionId: "retired-mechanic", selected: "m", responseStatus: "incorrect" }] });
  const saved = Object.freeze({ ...freshSession(), mode: "assessment", assessmentIndex: 10,
    pendingAttempt, assessmentRecords: pendingAttempt.questionRecords, attemptId: pendingAttempt.attemptId });
  const before = JSON.stringify(pendingAttempt);
  const restored = restoreCyclePracticeSession(saved, freshSession());
  assert.equal(restored.pendingAttempt, pendingAttempt);
  assert.equal(JSON.stringify(restored.pendingAttempt), before);
  assert.equal(restored.mode, "assessment");
  assert.equal(restored.assessmentIndex, 10);
  assert.equal(restored.attemptId, saved.attemptId);
  assert.equal(restored.activityRevision, CYCLE_ACTIVITY_REVISION);
  assert.equal(saved.activityRevision, undefined);
  assert.equal(restored.previousContentSession, undefined);
});

test("completed legacy results remain visible instead of starting another session", () => {
  const result = Object.freeze({ attemptId: "already-saved", savedToTeacher: true, scorePercent: 80,
    questionRecords: [{ questionId: "old-item", responseStatus: "correct" }] });
  const saved = Object.freeze({ ...freshSession(), mode: "assessment", result, attemptId: result.attemptId });
  const restored = restoreCyclePracticeSession(saved, freshSession());
  assert.equal(restored.result, result);
  assert.equal(restored.attemptId, result.attemptId);
  assert.equal(restored.activityRevision, CYCLE_ACTIVITY_REVISION);
});

test("current-revision recovery preserves progress and its retained earlier source exactly", () => {
  const saved = Object.freeze({ ...freshSession(), activityRevision: CYCLE_ACTIVITY_REVISION,
    practiceIndex: 37, pass: 1, attempts: 1, earnedCount: 37,
    previousContentSession: { attemptId: "retained-old-session" },
    practiceRecords: [{ questionId: "current-item", selected: "m" }], clock: { activePracticeSeconds: 612 } });
  assert.equal(restoreCyclePracticeSession(saved, freshSession()), saved);
});
