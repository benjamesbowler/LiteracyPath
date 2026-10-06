import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newRocketRunEvidence, rocketRunCatchResponse, completeRocketRunRound, rocketRunLanguageResult,
} from '../../src/utils/rocketRunEvidence.js';
import { rocketFlightState, hitRocketMeteor, retryRocketFlight } from '../../src/utils/rocketRunFlightMotion.js';
import { phonemeAudioCandidates } from '../../src/data/phonemeAudioBank.js';
import { createRocketCourierState } from '../../src/utils/rocketRunCourierSimulation.js';
import { validateRocketRunSession } from '../../src/utils/rocketRunSession.js';
import { ROCKET_RUN_CONTENT_VERSION } from '../../src/utils/rocketRunEvidence.js';

const plan = { round: 0, target: 'm', needed: 2, choices: [
  { id: 'm1', word: 'map', correct: true }, { id: 's1', word: 'sun', correct: false }, { id: 'm2', word: 'moon', correct: true },
] };
const receipt = { round: 0, target: 'm', kind: 'target-phoneme', src: '/audio/phonemes/m.mp3', at: 1 };
const delivered = () => ({ ...newRocketRunEvidence(), audioReceipts: [receipt] });
const catchVisible = (evidence, plan, options) => rocketRunCatchResponse(evidence, plan,
  { presentedChoices: plan.choices, ...options });

test('wrong-onset first response remains immutable through actual distinct correct trials', () => {
  let evidence = delivered(), caughtIds = [];
  const wrong = catchVisible(evidence, plan, { trialId: 's1', caughtIds, at: 2, source: 'keyboard', targetReceipt: receipt });
  assert.equal(wrong.row.correct, false); evidence = wrong.evidence;
  for (const [index, trialId] of ['m1', 'm2'].entries()) {
    const next = catchVisible(evidence, plan, { trialId, caughtIds, at: 3 + index, source: 'touch', targetReceipt: receipt });
    evidence = next.evidence; caughtIds = next.caughtIds;
  }
  assert.equal(evidence.firstResponses[0].selected, 'sun');
  assert.equal(evidence.firstResponses[0].correct, false);
  assert.equal(evidence.assistedRetries[0].selected, 'map');
  assert.ok(evidence.assistedRetries[0].supportReasons.includes('repeat-response'));
  const repeated = catchVisible(evidence, plan, { trialId: 'm1', caughtIds, at: 5 });
  assert.equal(repeated.row, null);
  assert.equal(completeRocketRunRound(evidence, plan, ['m1', 'm1'], 6), evidence);
  evidence = completeRocketRunRound(evidence, plan, caughtIds, 6);
  assert.equal(evidence.completions.length, 1);
  assert.deepEqual(rocketRunLanguageResult(evidence), { correct: 2, total: 2, mistakes: 1, stars: 3, literacyScore: 20 });
});

test('only a ledger-matched current target end can claim delivered phoneme context', () => {
  for (const altered of [{ ...receipt, at: 9 }, { ...receipt, round: 1 }, { ...receipt, kind: 'approach-word' },
    { ...receipt, target: 's' }, { ...receipt, src: '/audio/unowned.mp3' }]) {
    const result = catchVisible(delivered(), plan, { trialId: 'm1', at: 2, targetReceipt: altered });
    assert.equal(result.row.deliveryAtResponse, 'pending');
    assert.equal(result.row.independentOnsetPractice, false);
  }
});

test('actual approaching spoken-word model is supported reading, separate from target end', () => {
  const model = { round: 0, trialId: 'm1', word: 'map', kind: 'approach-word', src: '/audio/map.mp3', at: 1.8 };
  const evidence = { ...delivered(), audioReceipts: [receipt, model] };
  const result = catchVisible(evidence, plan, { trialId: 'm1', at: 2, targetReceipt: receipt, wordReceipt: model });
  assert.equal(result.row.deliveryAtResponse, 'delivered');
  assert.equal(result.row.wordAudioModel, 'delivered');
  assert.equal(result.row.independentOnsetPractice, false);
  assert.ok(result.row.supportReasons.includes('spoken-word-model'));
  const other = catchVisible(evidence, plan, { trialId: 'm2', at: 2, targetReceipt: receipt, wordReceipt: model });
  assert.equal(other.row.wordAudioModel, 'none');
});

test('meteor loss, a zero-life Retry and motor recovery cannot alter the language result', () => {
  let evidence = delivered(), caughtIds = [];
  for (const trialId of ['m1', 'm2']) {
    const next = catchVisible(evidence, plan, { trialId, caughtIds, at: caughtIds.length + 2, targetReceipt: receipt });
    evidence = next.evidence; caughtIds = next.caughtIds;
  }
  evidence = completeRocketRunRound(evidence, plan, caughtIds, 5);
  const before = structuredClone(evidence), result = rocketRunLanguageResult(evidence);
  const motor = rocketFlightState();
  for (let i = 0; i < 3; i++) { motor.immunity = 0; hitRocketMeteor(motor); }
  retryRocketFlight(motor);
  assert.deepEqual(evidence, before);
  assert.deepEqual(rocketRunLanguageResult(evidence), result);
  assert.equal(result.stars, 3);
});

test('only actually readable current carriers are recorded; a future bank word cannot claim a presented contact', () => {
  const visible = [plan.choices[0], plan.choices[1]];
  const accepted = rocketRunCatchResponse(delivered(), plan, { trialId: 'm1', presentedChoices: visible,
    at: 2, targetReceipt: receipt });
  assert.deepEqual(accepted.row.choices, visible.map(({ id, word }) => ({ id, word })));
  assert.equal(accepted.row.choicesContext, 'readable-current-carriers');
  const unpainted = rocketRunCatchResponse(delivered(), plan, { trialId: 'm2', presentedChoices: visible,
    at: 2, targetReceipt: receipt });
  assert.equal(unpainted.kind, 'unpresented-contact'); assert.equal(unpainted.row, null);
  const renamed = rocketRunCatchResponse(delivered(), plan, { trialId: 'm1', presentedChoices: [{ id: 'm1', word: 'invented' }], at: 2 });
  assert.equal(renamed.row, null);
});

test('approach model onset must match its actual start ledger, independently of an end receipt', () => {
  const start = { round: 0, trialId: 'm1', word: 'map', src: '/audio/map.mp3', at: 1.8 };
  const unowned = catchVisible(delivered(), plan, { trialId: 'm1', at: 2, targetReceipt: receipt, wordStarted: start });
  assert.equal(unowned.row.wordAudioModel, 'none');
  const evidence = { ...delivered(), audioStarts: [start] };
  const actual = catchVisible(evidence, plan, { trialId: 'm1', at: 2, targetReceipt: receipt, wordStarted: start });
  assert.equal(actual.row.wordAudioModel, 'started'); assert.equal(actual.row.independentOnsetPractice, false);
  assert.deepEqual(actual.row.wordAudioStart, start);
});

test('every approved V2 recording extra can really complete and hydrate after a wrong first onset', () => {
  for (const [word, target] of [['added', 'a'], ['ink', 'i'], ['inside', 'i'], ['mother', 'm'], ['otter', 'o'], ['voice', 'v']]) {
    const actual = { round: 0, target, needed: 1, choices: [
      { id: 'required-0', word, correct: true }, { id: 'contrast-1', word: 'sun', correct: false },
    ] };
    const end = { round: 0, target, kind: 'target-phoneme', src: phonemeAudioCandidates(target)[0], at: 1 };
    const initial = { ...newRocketRunEvidence(), audioReceipts: [end] };
    const wrong = catchVisible(initial, actual, { trialId: 'contrast-1', at: 2, source: 'pointer', targetReceipt: end });
    assert.equal(wrong.kind, 'wrong-onset'); assert.deepEqual(wrong.caughtIds, []);
    const accepted = catchVisible(wrong.evidence, actual, { trialId: 'required-0', at: 3,
      source: 'keyboard', targetReceipt: end, difficulty: 'hard' });
    assert.equal(accepted.kind, 'accepted-word', `${word}: a real required response was rejected`);
    assert.equal(accepted.row.word, word); assert.equal(accepted.row.deliveryAtResponse, 'delivered');
    assert.equal(accepted.evidence.firstResponses[0].selected, 'sun');
    assert.equal(accepted.evidence.assistedRetries[0].selected, word);
    const evidence = completeRocketRunRound(accepted.evidence, actual, accepted.caughtIds, 4);
    assert.equal(evidence.completions[0]?.needed, 1);
    const state = createRocketCourierState(actual, { seed: 0xffffffff, evidence, caughtIds: accepted.caughtIds,
      elapsed: 4, foregroundElapsed: 4 });
    Object.assign(state, { completed: true, originRound: 0, journeyIndex: 0,
      activeTargetReceipt: end, version: ROCKET_RUN_CONTENT_VERSION });
    const resumed = validateRocketRunSession(state, { seed: 0xffffffff, round: 0, journeyIndex: 0,
      plans: [actual], difficulty: 'hard' });
    assert.ok(resumed, `${word}: completed immutable retry did not hydrate`);
    assert.deepEqual(resumed.evidence, evidence); assert.deepEqual(resumed.caughtIds, ['required-0']);
  }
});
