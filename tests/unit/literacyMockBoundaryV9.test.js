import test from 'node:test';
import assert from 'node:assert/strict';
import { LITERACY_MOCK_AREA_MAX } from '../../src/policy/literacyMockAdaptivePolicy.js';
import { LITERACY_MOCK_V9_AREA_BUDGETS, LITERACY_MOCK_V9_MAX_ITEMS,
  literacyMockBoundaryStateV9, literacyMockBoundaryScheduleV9 } from '../../src/policy/literacyMockBoundaryV9.js';
import { selectLiteracyMockBoundaryPlan, adaptLiteracyMockBoundaryPlan, repairLiteracyMockBoundaryPlan } from '../../src/utils/literacyMockBoundaryPlanner.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';

// This fixture isolates routing and identity allocation from literal question
// validity. The actual published V9 bank has separate content/media gates.
const bank = Object.entries(LITERACY_MOCK_AREA_MAX).flatMap(([domainId, maximum]) => Array.from({ length: maximum + 1 }, (_, adaptiveAreaBand) => {
  const lowerPrint = domainId === 'print' && adaptiveAreaBand <= 1;
  return Array.from({ length: lowerPrint ? 26 : 70 }, (_, index) => {
    const letter = String.fromCharCode(97 + index);
    const id = `boundary-fixture.${domainId}.${adaptiveAreaBand}.${index}`;
    const item = { id, contentVersion: 'literacy-mock-v9', adaptiveAreaVersion: 'areas-v5', adaptiveAreaBand,
      adaptiveMixedEligible: true, adaptiveDemand: { operation: `fixture-${domainId}-${adaptiveAreaBand}` }, domainId,
      skillId: lowerPrint ? 'letter_knowledge' : `${domainId}-${index % 2}`, level: 1, format: 'choice',
      constructClaim: lowerPrint ? adaptiveAreaBand === 0 ? 'letter_name' : 'letter_case_correspondence' : `fixture-${domainId}-${adaptiveAreaBand}`,
      modality: 'recognition', targetWord: lowerPrint ? letter : '',
      exposureFamilyId: lowerPrint ? `letter-case:${letter}` : id,
      stimulusKey: lowerPrint ? `letter-case:${letter}` : id,
      choices: [{ id: 'a', label: lowerPrint ? letter : 'A' }, { id: 'b', label: 'B' }], answer: 'a',
      mediaReady: true, requiredAudioPaths: [], requiredImagePaths: [], requiredAudioCues: [] };
    return { ...item, itemSnapshot: { ...item } };
  });
}).flat());
const byId = new Map(bank.map(item => [item.id, item]));
const response = (item, correct, flags = {}) => ({ questionId: item.id, skillId: item.skillId, domainId: item.domainId,
  level: item.level, itemSnapshot: item.itemSnapshot, responseStatus: 'answered', evidenceType: 'independent', isCorrect: correct, ...flags });

function run(outcome, { exposures = [], offline = false, name = 'fixture' } = {}) {
  let ids = [], plan = selectLiteracyMockBoundaryPlan(bank, { sessionId: name, studentId: 'child', exposures,
    ...(offline ? { onOfflineItems: value => { ids = value; } } : {}) });
  const available = offline ? bank.filter(item => ids.includes(item.id)) : bank;
  const responses = [], counts = {};
  while (responses.length < plan.itemIds.length) {
    const item = byId.get(plan.itemIds[responses.length]);
    const states = literacyMockBoundaryStateV9(responses, { bank: byId });
    assert.equal(item.domainId, literacyMockBoundaryScheduleV9(responses, { bank: byId })[responses.length]);
    assert.equal(item.adaptiveAreaBand, states[item.domainId].nextBand);
    assert.equal(getLiteracyExposure(item, buildLiteracyExposureIndex({ exposures, responses })).knownFamiliar, null);
    const index = counts[item.domainId] || 0; counts[item.domainId] = index + 1;
    const value = outcome(index, item);
    responses.push(response(item, value.correct, value.flags));
    const prefix = plan.itemIds.slice(0, responses.length);
    plan = adaptLiteracyMockBoundaryPlan(available, plan, responses, [], [], { exposures });
    assert.deepEqual(plan.itemIds.slice(0, responses.length), prefix);
    assert.ok(plan.itemIds.length <= LITERACY_MOCK_V9_MAX_ITEMS);
  }
  return { responses, plan, states: literacyMockBoundaryStateV9(responses, { bank: byId }) };
}

test('V9 maximum is 67, entry is zero, and all-correct ceilings have two independent observations', () => {
  assert.equal(LITERACY_MOCK_V9_MAX_ITEMS, 67);
  const result = run(() => ({ correct: true }));
  assert.equal(result.responses.length, 58);
  for (const [domain, state] of Object.entries(result.states)) {
    assert.equal(state.stopReason, 'ceiling_confirmed');
    assert.equal(state.correctByBand[LITERACY_MOCK_AREA_MAX[domain]], 2);
    assert.equal(result.responses.find(row => row.domainId === domain).itemSnapshot.adaptiveAreaBand, 0);
    assert.ok(state.answered <= LITERACY_MOCK_V9_AREA_BUDGETS[domain]);
  }
});

test('all incorrect stops after two fresh floor errors in every area', () => {
  const result = run(() => ({ correct: false }));
  assert.equal(result.responses.length, 16);
  for (const state of Object.values(result.states)) {
    assert.equal(state.stopReason, 'floor_confirmed'); assert.equal(state.incorrectByBand[0], 2); assert.equal(state.nextBand, 0);
  }
});

test('one early floor slip still permits two ceiling observations within the non-print budgets', () => {
  const result = run(index => ({ correct: index !== 0 }));
  assert.equal(result.responses.length, 66);
  for (const [domain, state] of Object.entries(result.states)) {
    assert.equal(state.stopReason, 'ceiling_confirmed', domain);
    assert.equal(state.correctByBand[LITERACY_MOCK_AREA_MAX[domain]], 2);
  }
});

test('a single lucky floor answer cannot confirm a ceiling, and replicated adjacent outcomes are explicit', () => {
  const guess = run(index => ({ correct: index === 0 }));
  for (const state of Object.values(guess.states)) assert.equal(state.stopReason, 'floor_confirmed');
  const boundary = run((_, item) => ({ correct: item.adaptiveAreaBand <= 2 }));
  for (const state of Object.values(boundary.states)) {
    assert.equal(state.stopReason, 'adjacent_boundary'); assert.deepEqual(state.boundary, { lowerBand: 2, upperBand: 3 });
    assert.equal(state.correctByBand[2], 2); assert.equal(state.incorrectByBand[3], 2);
  }
});

test('a late ceiling slip reaches the bounded budget without manufacturing repeated ceiling success', () => {
  const result = run((index, item) => ({ correct: index !== LITERACY_MOCK_AREA_MAX[item.domainId] }));
  assert.equal(result.responses.length, 67);
  for (const [domain, state] of Object.entries(result.states)) {
    assert.equal(state.stopReason, domain === 'print' ? 'ceiling_confirmed' : 'budget_limit');
    if (domain !== 'print') { assert.equal(state.correctByBand[LITERACY_MOCK_AREA_MAX[domain]], 1); assert.equal(state.boundary, null); }
  }
});

test('two supported, familiar or skipped observations stop unconfirmed rather than forcing a long unmeasured sitting', () => {
  for (const flags of [{ supportUsed: true }, { knownFamiliar: true }, { responseStatus: 'skipped', evidenceType: 'unscored' }]) {
    const result = run(() => ({ correct: true, flags }));
    assert.equal(result.responses.length, 16);
    for (const [domain, state] of Object.entries(result.states)) {
      assert.equal(state.eligible, 0); assert.equal(state.nextBand, 0); assert.equal(state.boundary, null);
      assert.equal(state.stopReason, 'independent_followup_needed', domain);
      assert.equal(state.nonIndependentStreak, 2);
    }
    assert.equal(result.states.print.lowerLetterTargets.length, 2);
  }
});

test('five supported floor retakes retain fresh letters and a bounded offline reserve', () => {
  const exposures = [];
  for (let sitting = 0; sitting < 5; sitting++) {
    const result = run(() => ({ correct: true, flags: { supportUsed: true } }), { exposures, offline: true, name: `retake-${sitting}` });
    exposures.push(...result.responses);
    assert.equal(result.states.print.lowerLetterTargets.length, 2);
  }
  assert.equal(new Set(exposures.filter(row => row.domainId === 'print').map(row => row.itemSnapshot.targetWord)).size, 10);
});

test('independent answers reset the non-independent streak and a fifth lower letter can stop without a false boundary', () => {
  const print = bank.filter(item => item.domainId === 'print');
  const lower = (letter, demand) => print.find(item => item.targetWord === letter && item.adaptiveAreaBand === demand);
  const rows = [response(lower('a', 0), false), response(lower('b', 0), true, { supportUsed: true }),
    response(lower('c', 0), true), response(lower('d', 1), true, { knownFamiliar: true }), response(lower('e', 1), false)];
  const state = literacyMockBoundaryStateV9(rows, { bank }).print;
  assert.equal(state.stopReason, 'letter_limit'); assert.equal(state.lowerLetterTargets.length, 5);
  assert.equal(state.nonIndependentStreak, 0); assert.equal(state.eligible, 3); assert.equal(state.boundary, null);
  const changedBand = [response(lower('a', 0), true, { supportUsed: true }), response(lower('b', 1), true, { supportUsed: true })];
  assert.equal(literacyMockBoundaryStateV9(changedBand, { bank }).print.nonIndependentStreak, 1);
});

test('five mixed print sittings can consume the allowed 25 distinct lower targets without recycling a letter', () => {
  const exposures = [];
  for (let sitting = 0; sitting < 5; sitting++) {
    const result = run((index, item) => item.domainId !== 'print' ? { correct: false }
      : [1, 3].includes(index) ? { correct: true, flags: { supportUsed: true } } : { correct: index === 2 },
    { exposures, offline: true, name: `print-limit-${sitting}` });
    assert.equal(result.states.print.stopReason, 'letter_limit');
    assert.equal(result.states.print.lowerLetterTargets.length, 5);
    exposures.push(...result.responses);
  }
  assert.equal(new Set(exposures.filter(row => row.domainId === 'print').map(row => row.itemSnapshot.targetWord)).size, 25);
});

test('late assistance removes confirmation and can restore unused bounded slots while preserving shown current work', () => {
  let plan = selectLiteracyMockBoundaryPlan(bank, { sessionId: 'late-help', studentId: 'child' });
  const responses = [];
  while (responses.filter(row => row.domainId === 'sound_awareness').length < 4) {
    const item = byId.get(plan.itemIds[responses.length]);
    responses.push(response(item, item.domainId === 'sound_awareness' ? item.adaptiveAreaBand === 0 : true));
    plan = adaptLiteracyMockBoundaryPlan(bank, plan, responses);
  }
  assert.equal(literacyMockBoundaryStateV9(responses, { bank }).sound_awareness.stopReason, 'adjacent_boundary');
  const shorter = plan.itemIds.length, shown = plan.itemIds[responses.length];
  responses[0] = { ...responses[0], supportUsed: true };
  const restored = adaptLiteracyMockBoundaryPlan(bank, plan, responses, [], [{ questionId: shown }]);
  assert.equal(literacyMockBoundaryStateV9(responses, { bank }).sound_awareness.stopReason, null);
  assert.ok(restored.itemIds.length > shorter);
  assert.equal(restored.itemIds[responses.length], shown);
  assert.deepEqual(restored.itemIds.slice(0, responses.length), responses.map(row => row.questionId));
});

test('repair retains the canonical task and demand and fails without discarding saved work', () => {
  const plan = selectLiteracyMockBoundaryPlan(bank, { sessionId: 'repair', studentId: 'child' });
  const first = byId.get(plan.itemIds[0]), failures = [{ questionId: first.id, failedMediaPaths: [] }];
  const repaired = repairLiteracyMockBoundaryPlan(bank, plan, [], failures);
  assert.equal(repaired.unavailable, false);
  const replacement = byId.get(repaired.plan.itemIds[0]);
  assert.notEqual(replacement.id, first.id); assert.equal(replacement.adaptiveAreaBand, first.adaptiveAreaBand);
  assert.equal(replacement.constructClaim, first.constructClaim); assert.equal(replacement.skillId, first.skillId);
  const unavailable = repairLiteracyMockBoundaryPlan(plan.itemIds.map(id => byId.get(id)), plan, [], failures);
  assert.equal(unavailable.unavailable, true); assert.equal(unavailable.plan, plan);
});
