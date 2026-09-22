import test from "node:test";
import assert from "node:assert/strict";
import { assessmentAttemptsToSkillLedger, computeSkillStatus } from "../../src/policy/skillStatusPolicy.js";
import { skillBlueprints, getSkillBlueprint, RETENTION_RULE } from "../../src/content/blueprints/skillBlueprints.js";
import { composeAssessmentSitting, learnerAssessmentStatus, nextAssessmentStep, repeatsSittingQuestion } from "../../src/appState/assessmentSitting.js";
import { loadAssessmentSelectionHistory, saveAssessmentSelectionHistory } from "../../src/data/assessmentSelectionHistory.js";
import { loadAssessmentSkillBank } from "../../src/data/loadAssessmentSkillBank.js";
import { prepareRuntimeQuestionBank, getAssessmentQuestionPhase } from "../../src/appState/assessmentRuntime.js";
import { getInitialSoundRoundPlan } from "../../src/content/initialSounds/initialSoundSelector.js";
import { isRuntimeEligibleEarlySkillQuestion } from "../../src/utils/earlySkills/isRuntimeEligibleEarlySkillQuestion.js";
import { resolveAssessmentLedaAudioPath } from "../../src/utils/assessmentLedaResolver.js";
import { getLedaWordAudioPath } from "../../src/data/ledaProductionAudio.js";
import { getPreferredPhonemeAudioPath } from "../../src/data/phonemeAudioBank.js";
import { playAssessmentCue } from "../../src/utils/audio/assessmentPlayback.js";

const NOW = Date.parse("2026-09-22T10:00:00Z"), DAY = 86400000;
function attempt({ studentId = "A", skillId = "nouns", level = 1, phase = 1, correct = true, count = getSkillBlueprint(skillId).sitting, time = NOW - 5 * DAY, id = `${studentId}-${level}-${phase}`, status = "completed", mode = "skill_checkpoint", ids } = {}) {
  return { studentId, skillId, skillLevel: level, skillPhase: phase, attemptId: id, administrationStatus: status, assessmentType: mode, completedAt: new Date(time).toISOString(), totalQuestions: getSkillBlueprint(skillId).sitting,
    questionRecords: Array.from({ length: count }, (_, i) => ({ questionId: ids?.[i] || `${id}-${i}`, skillId, level, phase, itemKey: getSkillBlueprint(skillId).unitsByLevel[level][0], isCorrect: correct, responseStatus: correct ? "correct" : "incorrect", timestamp: new Date(time).toISOString() })) };
}

test("one teacher's completed passes cannot unlock another learner", () => {
  const records = [attempt({ phase: 1 }), attempt({ phase: 2 }), attempt({ studentId: "B", correct: false, time: NOW })];
  assert.equal(learnerAssessmentStatus(records, "nouns", "B", { now: NOW }).nextSkillUnlocked, false);
  assert.equal(learnerAssessmentStatus(records, "nouns", "A", { now: NOW }).nextSkillUnlocked, true);
});

test("partial, duplicate and mixed-phase archives cannot pass incomplete phases", () => {
  const partial = [attempt({ phase: 1, count: 1, status: "partial" }), attempt({ phase: 2, count: 1, status: "partial" })];
  assert.equal(learnerAssessmentStatus(partial, "nouns", "A", { now: NOW }).level1.passed, false);
  const duplicate = attempt({ ids: Array(8).fill("same-item") });
  assert.equal(learnerAssessmentStatus([duplicate], "nouns", "A", { now: NOW }).level1.phases[1].passed, false);
  const mixed = attempt({ skillId: "initial_sounds" });
  mixed.questionRecords.forEach((row, index) => { row.phase = index < 5 ? 1 : 2; });
  const status = learnerAssessmentStatus([mixed], "initial_sounds", "A", { now: NOW });
  assert.equal(status.level1.phases[1].passed, false);
  assert.equal(status.level1.phases[2].passed, false);
});

test("unscored archive states survive conversion and never become wrong answers", () => {
  const record = attempt({ count: 4 });
  record.questionRecords.forEach((row, index) => { row.isCorrect = null; row.responseStatus = ["media_failed", "supported", "not_administered", "skipped"][index]; });
  const ledger = assessmentAttemptsToSkillLedger([record], "nouns");
  assert.deepEqual(ledger.map(row => row.responseState), ["media_failed", "supported", "not_administered", "skipped"]);
  assert.equal(computeSkillStatus(ledger, "nouns", { now: NOW }).evidence.scored, 0);
  const replaced = attempt();
  replaced.totalQuestions += 1;
  replaced.questionRecords.push({ questionId: "failed", responseStatus: "media_failed", isCorrect: null });
  assert.equal(learnerAssessmentStatus([replaced], "nouns", "A", { now: NOW }).level1.phases[1].passed, true,
    "compact token-scoped archives without policySnapshot must keep media failures out of the planned scored count");
});

test("stopped rounds and expired evidence cannot move the authoritative chooser", () => {
  const partials = [attempt({ count: 4, status: "partial", id: "stop-one" }), attempt({ count: 4, status: "partial", id: "stop-two" })];
  assert.deepEqual(nextAssessmentStep(learnerAssessmentStatus(partials, "nouns", "A", { now: NOW })), { level: 1, phase: 1 });
  assert.deepEqual(nextAssessmentStep(learnerAssessmentStatus([attempt({ time: NOW - 100 * DAY })], "nouns", "A", { now: NOW })), { level: 1, phase: 1 });
});

test("every published phase forms two full disjoint runtime sittings", async () => {
  for (const [skillId, blueprint] of Object.entries(skillBlueprints)) {
    const loaded = await loadAssessmentSkillBank(skillId);
    const bank = prepareRuntimeQuestionBank(loaded);
    assert.equal(bank.length, loaded.length, `${skillId} must not lose reviewed items to legacy filters`);
    for (const row of bank) {
      const authored = loaded.find(item => item.id === row.id);
      assert.deepEqual(row.choices, authored.choices, `${row.id} choices must survive runtime normalization`);
      assert.equal(getAssessmentQuestionPhase(row), authored.phase, `${row.id} phase must survive runtime normalization`);
    }
    for (const level of [1, 2]) for (const phase of [1, 2]) {
      const first = composeAssessmentSitting({ bank, skillId, studentId: "A", assignedStep: { level, phase }, now: NOW, random: () => 0.5 });
      assert.equal(first.error, undefined, `${skillId} L${level}P${phase} first: ${first.error}`);
      assert.equal(first.questionIds.length, blueprint.sitting);
      const previous = attempt({ skillId, level, phase, correct: false, ids: first.questionIds });
      const retry = composeAssessmentSitting({ bank, skillId, studentId: "A", attempts: [previous], assignedStep: { level, phase }, now: NOW, random: () => 0.5 });
      assert.equal(retry.error, undefined, `${skillId} L${level}P${phase} retry: ${retry.error}`);
      assert.equal(retry.questionIds.length, blueprint.sitting);
      assert.equal(retry.questionIds.some(id => first.questionIds.includes(id)), false);
      assert.equal(retry.questionIds.some(id => bank.find(row => row.id === id).retentionOnly), false);
    }
  }
});

test("Initial Sounds actual adaptive selector respects blueprint length and authored phase", async () => {
  const bank = await loadAssessmentSkillBank("initial_sounds");
  for (const level of [1, 2]) for (const assessmentPhase of [1, 2]) {
    const plan = getInitialSoundRoundPlan({ level, assessmentPhase, roundLength: 10, roundNumber: assessmentPhase, seed: 1, itemBank: bank, requireImportedMedia: false, itemEligibility: row => isRuntimeEligibleEarlySkillQuestion(row, { skillId: "initial_sounds", level }) });
    assert.equal(plan.items.length, 10);
    assert.equal(plan.items.every(row => row.phase === assessmentPhase && row.level === level), true);
    assert.equal(new Set(plan.items.map(row => row.id)).size, 10);
  }
});

test("retention is a real eight-item reserved form and cannot start before the existing delay", async () => {
  const skillId = "nouns";
  const records = [1, 2].flatMap(level => [1, 2].map(phase => attempt({ level, phase, time: NOW - 4 * DAY })));
  const bank = prepareRuntimeQuestionBank(await loadAssessmentSkillBank(skillId, { retention: true }));
  const early = composeAssessmentSitting({ bank, skillId, studentId: "A", attempts: records, now: NOW - 2 * DAY });
  assert.match(early.error, /opens on/);
  const ready = composeAssessmentSitting({ bank, skillId, studentId: "A", attempts: records, now: NOW });
  assert.equal(ready.mode, "retention");
  assert.equal(ready.questionIds.length, RETENTION_RULE.items);
  assert.equal(ready.questionIds.every(id => bank.find(row => row.id === id).retentionOnly), true);
  const retention = attempt({ count: RETENTION_RULE.items, mode: "retention", id: "retention", time: NOW, ids: ready.questionIds });
  const status = learnerAssessmentStatus([...records, retention], skillId, "A", { now: NOW });
  assert.equal(status.status, "secure");
});

test("every skill supports a full retention check and fresh retry", async () => {
  for (const skillId of Object.keys(skillBlueprints)) {
    const records = [1, 2].flatMap(level => [1, 2].map(phase => attempt({ skillId, level, phase, time: NOW - 4 * DAY })));
    const bank = prepareRuntimeQuestionBank(await loadAssessmentSkillBank(skillId, { retention: true }));
    const first = composeAssessmentSitting({ bank, skillId, studentId: "A", attempts: records, now: NOW });
    assert.equal(first.questionIds?.length, RETENTION_RULE.items, `${skillId}: first retention form`);
    const retry = composeAssessmentSitting({ bank, skillId, studentId: "A", attempts: records, previousSittings: [first], now: NOW + 1 });
    assert.equal(retry.questionIds?.length, RETENTION_RULE.items, `${skillId}: ${retry.error || "fresh retention retry"}`);
    assert.equal(retry.questionIds.some(id => first.questionIds.includes(id)), false);
    for (const id of retry.questionIds) assert.equal(repeatsSittingQuestion(bank.find(row => row.id === id), retry.protectedSignatures), false);
  }
});

test("abandoned forms persist repeat protection scoped to learner and phase, without adding scored attempts", async () => {
  const values = new Map(), storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  const scope = { teacherId: "teacher", studentId: "A" };
  const bank = prepareRuntimeQuestionBank(await loadAssessmentSkillBank("nouns"));
  const first = composeAssessmentSitting({ bank, skillId: "nouns", studentId: "A", now: NOW });
  assert.equal(saveAssessmentSelectionHistory(first, scope, storage), true);
  const previousSittings = loadAssessmentSelectionHistory(scope, storage);
  const retry = composeAssessmentSitting({ bank, skillId: "nouns", studentId: "A", previousSittings, now: NOW + 1 });
  assert.equal(retry.error, undefined);
  assert.equal(retry.phase, 1);
  assert.equal(retry.questionIds.some(id => first.questionIds.includes(id)), false);
  for (const id of first.questionIds) assert.equal(repeatsSittingQuestion(bank.find(row => row.id === id), retry.protectedSignatures), true);
  assert.deepEqual(loadAssessmentSelectionHistory({ ...scope, studentId: "B" }, storage), []);
  assert.deepEqual(loadAssessmentSelectionHistory({ ...scope, teacherId: "other-teacher" }, storage), []);
  assert.equal(saveAssessmentSelectionHistory(first, scope, { setItem() { throw new Error("quota"); } }), false);
  assert.equal(learnerAssessmentStatus([], "nouns", "A", { now: NOW }).evidence.scored, 0);
});

test("audio playback error propagates before and after actual player start, once", async () => {
  const priorAudio = globalThis.Audio;
  const priorWindow = globalThis.window;
  const instances = [];
  class FakeAudio {
    constructor() { this.listeners = new Map(); this.src = ""; instances.push(this); }
    addEventListener(type, callback) { this.listeners.set(type, callback); }
    removeEventListener(type, callback) { if (this.listeners.get(type) === callback) this.listeners.delete(type); }
    pause() {} load() {} play() { return Promise.resolve(); }
  }
  globalThis.Audio = FakeAudio;
  globalThis.window = { speechSynthesis: { cancel() {} } };
  try {
    let failed = 0;
    const cue = await import("../../src/utils/audio/cuePlayer.js");
    const pending = playAssessmentCue("/missing-required.mp3", { onUnavailable: () => { failed += 1; } });
    instances[0].listeners.get("error")();
    assert.deepEqual(await pending, { ok: false, reason: "unavailable" });
    assert.equal(failed, 1);
    const started = playAssessmentCue("/fails-after-start.mp3", { onUnavailable: () => { failed += 1; } });
    assert.deepEqual(await started, { ok: true });
    instances[0].listeners.get("error")();
    assert.equal(failed, 2);
    cue.stopCueAudio();
  } finally { globalThis.Audio = priorAudio; globalThis.window = priorWindow; }
});

 test("spoken word choices use exact word recordings instead of instruction aliases", () => {
  for (const word of ["dog", "jam", "map", "pen"]) {
    assert.equal(resolveAssessmentLedaAudioPath(word), getLedaWordAudioPath(word));
    assert.equal(resolveAssessmentLedaAudioPath(word, "choice"), getLedaWordAudioPath(word));
    assert.equal(resolveAssessmentLedaAudioPath(word, "target_word"), getLedaWordAudioPath(word));
  }
  for (const sound of ["a", "e", "th"]) assert.equal(resolveAssessmentLedaAudioPath(sound, "phoneme"), getPreferredPhonemeAudioPath(sound));
});
