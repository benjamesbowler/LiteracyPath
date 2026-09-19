import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const controller = readFileSync(new URL("../../src/appState/assessmentRoundController.js", import.meta.url), "utf8");

function controllerFunction(name, nextFunction, scope) {
  const start = controller.indexOf(`  async function ${name}(`);
  const end = controller.indexOf(`  ${nextFunction}`, start);
  assert.ok(start >= 0 && end > start, `Missing production function ${name}`);
  return vm.runInNewContext(`(${controller.slice(start, end).trim()})`, scope);
}

function harness(response, { error = null } = {}) {
  const state = { history: [], completedSessions: [], requests: [], warnings: [] };
  const service = async request => {
    state.requests.push(request);
    if (error) throw error;
    return response;
  };
  const scope = {
    studentId: "student-test",
    evidenceTeacherId: "teacher-test",
    independentFocusAssessment: true,
    studentSessionToken: "synthetic-token",
    studentFocusSession: { id: "focus-test", class_id: "class-test" },
    focusSessionId: "focus-test",
    supabase: { id: "synthetic-client" },
    getAssignedFocusStep: () => ({ level: 1, phase: 2 }),
    normalizeAnswerRecordShape: record => record,
    saveStudentFocusAssessmentAnswer: service,
    saveStudentFocusItemMastery: service,
    saveStudentFocusAssessmentAttempt: service,
    setAssessmentHistory: updater => { state.history = updater(state.history); },
    mergeAssessmentAttemptRecords: (existing, added) => [...existing, ...added],
    onStudentFocusAssessmentComplete: id => { state.completedSessions.push(id); },
    console: { warn: (...values) => { state.warnings.push(values); } }
  };
  return {
    state,
    saveAnswer: () => controllerFunction("saveAnswerToSupabase", "async function saveMasteryToSupabase", scope)({
      answerEventId: "answer-test", skillId: "initial_sounds", chosen: "a", correct: "a", isCorrect: true
    }),
    saveItem: () => controllerFunction("saveItemMasteryToSupabase", "async function updateItemMastery", scope)({
      skillId: "initial_sounds", itemKey: "a", itemType: "initial_sound", attempts: 1, correct: 1
    }),
    saveAttempt: () => controllerFunction("persistCompletedAssessmentAttempt", "function getSkillIdForMasteryRow", scope)({
      studentId: "student-test", attemptId: "attempt-test", skillId: "initial_sounds"
    }, { deriveMastery: false })
  };
}

const missingAcknowledgements = [
  ["null", null],
  ["undefined", undefined],
  ["empty object", {}],
  ["missing ok with duplicate metadata", { duplicate: true, attempt_id: "attempt-test" }],
  ["explicit rejection", { ok: false, error: "assignment_mismatch" }],
  ["string true", { ok: "true" }],
  ["numeric true", { ok: 1 }]
];

for (const [label, response] of missingAcknowledgements) {
  test(`independent answers, mastery and completion require a positive acknowledgement: ${label}`, async () => {
    const answer = harness(response);
    const answerResult = await answer.saveAnswer();
    assert.equal(answerResult.durable, false);
    assert.equal(answerResult.error.message, response?.error || "student_focus_answer_failed");
    assert.equal(answer.state.requests.length, 1);

    const item = harness(response);
    const itemResult = await item.saveItem();
    assert.equal(itemResult.error.message, response?.error || "student_focus_item_mastery_failed");
    assert.equal(itemResult.row.itemKey, "a");
    assert.equal(item.state.requests.length, 1);

    const attempt = harness(response);
    assert.equal(await attempt.saveAttempt(), null);
    assert.equal(attempt.state.requests.length, 1);
    assert.equal(attempt.state.history.length, 0, "missing acknowledgement must not add completed evidence");
    assert.equal(attempt.state.completedSessions.length, 0, "missing acknowledgement must not complete the session");
  });
}

for (const duplicate of [false, true]) {
  test(`independent saves accept explicit server success${duplicate ? " for an idempotent retry" : ""}`, async () => {
    const response = { ok: true, duplicate };
    const answer = harness(response);
    const answerResult = await answer.saveAnswer();
    assert.equal(answerResult.durable, true);
    assert.equal(answerResult.error, null);
    assert.equal(answerResult.duplicate, duplicate);

    const item = harness(response);
    assert.equal((await item.saveItem()).error, null);

    const attempt = harness(response);
    const attemptResult = await attempt.saveAttempt();
    assert.equal(attemptResult.saveResult.cloudSaved, true);
    assert.equal(attemptResult.saveResult.durable, true);
    assert.equal(attempt.state.history.length, 1);
    assert.equal(attempt.state.history[0].attemptId, "attempt-test");
    assert.deepEqual(attempt.state.completedSessions, ["focus-test"]);
  });
}

test("transport failures cannot acknowledge an independent assessment write", async () => {
  const error = new Error("synthetic transport unavailable");
  const instance = harness({ ok: true }, { error });
  const answer = await instance.saveAnswer();
  assert.equal(answer.durable, false);
  assert.equal(answer.error, error);
  assert.equal((await instance.saveItem()).error, error);
  assert.equal(await instance.saveAttempt(), null);
  assert.equal(instance.state.history.length, 0);
  assert.equal(instance.state.completedSessions.length, 0);
});
