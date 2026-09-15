import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

// Exercise the production controller with held network promises. Its imports
// belong to the browser app; only the service and React boundaries are faked.
const controller = readFileSync(new URL("../../src/appState/assessmentRoundController.js", import.meta.url), "utf8");

function controllerFunction(name, nextName, scope) {
  const start = controller.indexOf(`  async function ${name}(`);
  const end = controller.indexOf(`  ${nextName}`, start);
  assert.ok(start >= 0 && end > start);
  return vm.runInNewContext(`(${controller.slice(start, end).trim()})`, scope);
}

function deferred() {
  let resolve;
  const promise = new Promise(yes => { resolve = yes; });
  return { promise, resolve };
}

const tick = () => new Promise(resolve => setImmediate(resolve));

function answerHarness({ saveAnswer, updateSummary, roundLength = 10 } = {}) {
  const stage = { id: "cvc_short_vowels", label: "CVC words" };
  const question = { id: "test-cvc-cat", skillId: stage.id, skill: stage.label, answer: "cat", question: "Listen and find the word." };
  const state = {
    feedback: null, currentQuestion: question, assessmentTransitioning: false,
    answerHistory: [], totalAnswered: 0, correctAnswered: 0, usedByStage: {},
    roundAnswers: [], roundQuestionIds: [], roundItemKeys: [], message: "", mastery: {}
  };
  const calls = { answers: 0, summaries: 0, completions: 0 };
  const scope = {
    currentQuestion: question,
    currentStage: stage,
    skillTree: [stage],
    answerInFlightRef: { current: false },
    assessmentSummarySaveRef: { current: Promise.resolve() },
    assessmentMode: "mastery",
    independentFocusAssessment: true,
    studentFocusSession: {},
    roundAnswers: [], roundItemKeys: [],
    roundQuestionIdsRef: { current: [] }, roundItemKeysRef: { current: [] },
    answerHistoryRef: { current: [] },
    studentId: "student-test", studentName: "Test learner", selectedClassId: "class-test", evidenceTeacherId: "teacher-test",
    ROUND_LENGTH: roundLength, PASS_SCORE: 1,
    getStageIndex: () => 0,
    normalizeAssessmentQuestion: value => value,
    getQuestionAnswer: value => value.answer,
    isFixSentenceQuestion: () => false,
    isPairSelectionQuestion: () => false,
    inferItemMetadata: () => ({ itemType: "cvc_word", itemKey: "cat" }),
    getItemMasteryStateKey: (key, type) => `${type}:${key}`,
    getQuestionPathStep: () => ({ level: 1, phase: 1 }),
    normalizeAnswerRecordShape: value => value,
    getRuntimeQuestionSignature: value => value.id,
    getRuntimeQuestionPromptAnswerSignature: value => value.id,
    getRepeatOptionSetSignature: () => "cat,dog,sun,map",
    getQuestionTargetWord: () => "cat",
    getQuestionPrompt: value => value.question,
    getDiagnosticTarget: () => "short a",
    getQuestionRoutingFormat: () => "LISTEN_FIND_WORD",
    makeEvidenceEventId: () => "answer-event-test",
    debugAssessmentCoverage: () => {},
    getTeachingTip: () => "",
    buildFeedbackSupport: () => ({}),
    buildCheckpointDecision: () => ({ pathStatus: { level: 1, phase: 1 } }),
    buildAssessmentAttemptRecord: value => ({ ...value, attemptId: "attempt-test" }),
    getAssessmentAttemptType: () => "skill_checkpoint",
    assessmentAttemptsToSkillLedger: value => value,
    computeSkillStatus: () => ({ level1: { phases: { 1: { passed: true } } } }),
    SKILL_STATUS_IDS: { SECURE: "secure" },
    saveMasteryToSupabase: async () => ({ durable: true }),
    resetAssessmentMediaUsage: () => {},
    APP_VIEWS: { CHECKPOINT: "checkpoint", ASSESSMENTS: "assessments" },
    console,
    saveAnswerToSupabase: async record => {
      calls.answers += 1;
      return saveAnswer ? saveAnswer(record) : { durable: true };
    },
    updateItemMastery: () => {
      calls.summaries += 1;
      const promise = updateSummary ? updateSummary() : Promise.resolve({ durable: true });
      scope.assessmentSummarySaveRef.current = promise;
      return promise;
    },
    persistCompletedAssessmentAttempt: async () => {
      calls.completions += 1;
      return { durable: true };
    }
  };
  for (const key of [
    ...Object.keys(state), "showConfetti", "checkpointDecision", "appView"
  ]) {
    const setter = `set${key[0].toUpperCase()}${key.slice(1)}`;
    scope[setter] = value => { state[key] = typeof value === "function" ? value(state[key]) : value; };
  }
  return { answer: controllerFunction("answerQuestion", "function reviseLastAnswer", scope), state, scope, calls };
}

test("a durable answer advances while the secondary mastery network write is still pending", async () => {
  const network = deferred();
  const harness = answerHarness({ updateSummary: () => network.promise });
  let advanced = false;
  const submitting = harness.answer("cat").then(() => { advanced = true; });
  await tick();
  try {
    assert.equal(harness.calls.summaries, 1);
    assert.equal(advanced, true, "a held mastery summary request must not freeze every answer");
    assert.equal(harness.state.feedback?.answerEventId, "answer-event-test");
    assert.equal(harness.state.currentQuestion, null);
    assert.equal(harness.scope.answerHistoryRef.current.length, 1);
  } finally {
    network.resolve({ durable: true });
    await submitting;
  }
});

test("answer durability still gates advancement and rapid repeated taps save only once", async () => {
  const network = deferred();
  const harness = answerHarness({ saveAnswer: () => network.promise });
  const submitting = harness.answer("cat");
  await harness.answer("dog");
  assert.equal(harness.calls.answers, 1);
  assert.equal(harness.calls.summaries, 0);
  assert.equal(harness.state.assessmentTransitioning, true);
  assert.equal(harness.state.feedback, null);
  assert.equal(harness.state.currentQuestion.id, "test-cvc-cat");
  network.resolve({ durable: false, error: new Error("offline and no storage") });
  await submitting;
  assert.equal(harness.scope.answerHistoryRef.current.length, 0);
  assert.equal(harness.state.totalAnswered, 0);
  assert.equal(harness.state.roundQuestionIds.length, 0);
  assert.equal(harness.scope.answerInFlightRef.current, false);
  assert.equal(harness.calls.summaries, 0);
  assert.match(harness.state.message, /could not be saved/);
});

test("completion waits for pending mastery writes before closing the student session", async () => {
  const network = deferred();
  const harness = answerHarness({ updateSummary: () => network.promise, roundLength: 1 });
  const submitting = harness.answer("cat");
  await tick();
  assert.equal(harness.calls.completions, 0);
  network.resolve({ durable: true });
  await submitting;
  assert.equal(harness.calls.completions, 1);
  assert.equal(harness.state.appView, "checkpoint");
});

test("mastery summaries retain their order while local counters update immediately", async () => {
  const firstNetwork = deferred();
  const state = { itemSessionSeen: {}, itemMastery: {} };
  const calls = [];
  const sharedRef = { current: Promise.resolve() };
  const makeUpdate = () => controllerFunction("updateItemMastery", "async function persistCompletedAssessmentAttempt", {
    inferItemMetadata: () => ({ itemType: "cvc_word", itemKey: "cat" }),
    debugAssessmentCoverage: () => {},
    getQuestionFormatMetadata: () => ({}),
    getItemMasteryStateKey: () => "cvc_word:cat",
    itemSessionSeen: state.itemSessionSeen,
    itemMastery: state.itemMastery,
    assessmentSummarySaveRef: sharedRef,
    setItemSessionSeen: updater => { state.itemSessionSeen = updater(state.itemSessionSeen); },
    setItemMastery: updater => { state.itemMastery = updater(state.itemMastery); },
    nextItemMasteryRow: previous => ({ attempts: (previous?.attempts || 0) + 1 }),
    saveItemMasteryToSupabase: row => {
      calls.push(row.attempts);
      return row.attempts === 1 ? firstNetwork.promise : Promise.resolve({ row });
    },
    isMissingItemMasteryTableError: () => false
  });
  const first = makeUpdate()({ source: "assessment" }, true);
  await tick();
  const second = makeUpdate()({ source: "assessment" }, false);
  await tick();
  try {
    assert.equal(state.itemMastery["cvc_word:cat"].attempts, 2);
    assert.deepEqual(calls, [1], "the second summary must not overtake the first request");
  } finally {
    firstNetwork.resolve({ row: { attempts: 1 } });
    await Promise.all([first, second]);
  }
  assert.deepEqual(calls, [1, 2]);
});

test("queued summaries retain their submitting learner, token, client and session after a learner switch", async () => {
  const network = deferred();
  const calls = [];
  const client = { id: "test-service-client" };
  const createController = vm.runInNewContext(`(${controller
    .slice(controller.indexOf("export function createAssessmentRoundController"))
    .replace(/^export /, "")
    .replaceAll("import.meta.env.DEV", "false")})`, {
    assessmentSummarySaves: new WeakMap(),
    STUDENT_FOCUS_TARGETS: { SKILLS_ASSESSMENT: "skills_assessment" },
    supabase: client,
    inferItemMetadata: () => ({ itemType: "cvc_word", itemKey: "cat" }),
    normalizeItemKey: value => value,
    getQuestionFormatMetadata: () => ({ formatType: "LISTEN_FIND_WORD" }),
    getBlueprintUnitRuleByItem: () => null,
    isMasteryEligible: () => ({ eligible: false, blockers: [] }),
    getStageIndex: () => 0,
    skillTree: [{ id: "cvc_short_vowels", label: "CVC words" }],
    debugAssessmentCoverage: () => {},
    isMissingItemMasteryTableError: () => false,
    saveStudentFocusItemMastery: args => {
      calls.push(args);
      return calls.length === 1 ? network.promise : Promise.resolve({ ok: true });
    }
  });
  const historyOwner = { current: [] };
  const contexts = ["first", "second"].map(id => ({
    answerHistoryRef: historyOwner,
    studentId: `learner-${id}`,
    studentSessionToken: `token-${id}`,
    studentFocusSession: { id: `session-${id}`, target: "skills_assessment", teacher_id: `teacher-${id}` },
    itemMastery: {}, itemSessionSeen: {},
    setItemMastery: () => {}, setItemSessionSeen: () => {}
  }));
  // No new queue ref is supplied: the ordinary existing context remains valid.
  const first = createController(contexts[0]).updateItemMastery({ source: "assessment" }, true);
  await tick();
  const second = createController(contexts[1]).updateItemMastery({ source: "assessment" }, false);
  contexts[1].studentId = "learner-after-leaving";
  contexts[1].studentSessionToken = "token-after-leaving";
  contexts[1].studentFocusSession.id = "session-after-leaving";
  await tick();
  assert.equal(calls.length, 1);
  network.resolve({ ok: true });
  const results = await Promise.all([first, second]);
  assert.equal(results.every(result => result.durable), true);
  assert.deepEqual(calls.map(call => ({ token: call.token, sessionId: call.sessionId })), [
    { token: "token-first", sessionId: "session-first" },
    { token: "token-second", sessionId: "session-second" }
  ]);
  assert.equal(calls.every(call => call.client === client), true);
  assert.deepEqual(calls.map(call => call.itemMastery.last_result), [true, false]);
});
