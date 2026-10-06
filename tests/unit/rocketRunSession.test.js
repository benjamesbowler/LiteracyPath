import test from 'node:test';
import assert from 'node:assert/strict';
import { newGameSeed } from '../../src/utils/gameReplay.js';
import { getPreferredPhonemeAudioPath } from '../../src/data/phonemeAudioBank.js';
import { ROCKET_RUN_CONTENT_VERSION, newRocketRunEvidence } from '../../src/utils/rocketRunEvidence.js';
import { createRocketCourierState, selectRocketCourier, stepRocketCouriers, pauseRocketCourier } from '../../src/utils/rocketRunCourierSimulation.js';
import { validateRocketRunSession } from '../../src/utils/rocketRunSession.js';

const plan = { round: 0, target: 'm', needed: 2, choices: [
  { id: 'map', word: 'map', correct: true }, { id: 'sun', word: 'sun', correct: false },
  { id: 'moon', word: 'moon', correct: true },
] };
const context = seed => ({ seed, round: 0, journeyIndex: 1, plans: [plan], difficulty: 'easy' });
function fixture(seed = 127) {
  const receipt = { round: 0, target: 'm', kind: 'target-phoneme', src: getPreferredPhonemeAudioPath('m'), at: 0 };
  const state = createRocketCourierState(plan, { seed, evidence: { ...newRocketRunEvidence(), audioReceipts: [receipt] } });
  state.activeTargetReceipt = receipt;
  return { ...state, version: ROCKET_RUN_CONTENT_VERSION, journeyIndex: 1, originRound: 0 };
}
function catchWord(state, id) {
  state.queue = state.queue.filter(row => row.trialId !== id);
  state.carriers.push({ trialId: id, word: id, flightId: state.nextFlightId++, lane: 1, x: 0, z: -1.82,
    radius: .43, depthRadius: .24, misses: 0, alive: true, passed: false,
    approachSpoken: false, visible: true, readable: true });
  assert.equal(selectRocketCourier(state, plan, 'keyboard'), true);
  return stepRocketCouriers(state, plan, 1 / 120, { presentation: () => ({ visible: true, readable: true }) })[0];
}

test('full canonical uint32 seeds preserve wrong first reading and accepted catch on resume', () => {
  for (const seed of [newGameSeed(0, () => .75), 0x80000000, 0xffffffff]) {
    const state = fixture(seed);
    assert.equal(catchWord(state, 'sun').type, 'wrong-onset');
    assert.equal(catchWord(state, 'map').type, 'accepted-word');
    const wrong = structuredClone(state.evidence.firstResponses[0]);
    const saved = validateRocketRunSession(state, context(seed));
    assert.ok(saved); assert.deepEqual(saved.caughtIds, ['map']);
    assert.deepEqual(saved.evidence.firstResponses[0], wrong);
    assert.deepEqual(saved.evidence.assistedRetries, state.evidence.assistedRetries);
    assert.deepEqual(saved.queue, [{ trialId: 'moon', misses: 0 }]);
    for (const invalid of [-1, 0x100000000, seed + .5, NaN]) {
      assert.equal(validateRocketRunSession({ ...state, seed: invalid }, context(invalid)), null);
    }
  }
});

test('zero-life motor state cannot rewrite a retained reading result or the true word denominator', () => {
  const state = fixture(); catchWord(state, 'sun'); catchWord(state, 'map');
  state.flight.hearts = 0; state.flight.stopped = true; state.flight.motorHits = 3;
  const saved = validateRocketRunSession(state, context(state.seed));
  assert.ok(saved); assert.equal(saved.flight.stopped, true);
  assert.deepEqual(saved.evidence, state.evidence); assert.deepEqual(saved.caughtIds, ['map']);
  for (const change of [value => value.flight.stopped = false, value => value.caughtIds.push('moon'),
    value => value.evidence.firstResponses[0].correct = true, value => value.evidence.assistedRetries[0].independentOnsetPractice = true,
    value => value.queue = [], value => value.queue[0].trialId = 'invented']) {
    const bad = structuredClone(state); change(bad);
    assert.equal(validateRocketRunSession(bad, context(state.seed)), null);
  }
});

test('actual completed distinct catches and rubric are reconstructed rather than inferred from survival', () => {
  const state = fixture(); catchWord(state, 'map'); catchWord(state, 'moon');
  assert.equal(state.completed, true);
  assert.ok(validateRocketRunSession(state, context(state.seed)));
  for (const change of [value => value.evidence.completions[0].needed = 1,
    value => value.evidence.completions[0].stars = 1, value => value.evidence.completions[0].caughtIds = ['map', 'map'],
    value => value.evidence.acceptedResponses.pop(), value => value.completed = false]) {
    const bad = structuredClone(state); change(bad);
    assert.equal(validateRocketRunSession(bad, context(state.seed)), null);
  }
});

test('saved physical carriers retain identity but cannot resume a stale readable/approach/Catch assertion', () => {
  const state = fixture();
  state.queue = state.queue.filter(row => row.trialId !== 'map');
  state.carriers = [{ trialId: 'map', word: 'map', flightId: state.nextFlightId++, lane: 1, x: 0, z: -10,
    radius: .43, depthRadius: .24, misses: 2, alive: true, passed: false,
    approachSpoken: true, visible: true, readable: true }];
  selectRocketCourier(state, plan, 'touch');
  assert.equal(validateRocketRunSession(state, context(state.seed)), null);
  pauseRocketCourier(state, true);
  const saved = validateRocketRunSession(state, context(state.seed)); assert.ok(saved);
  assert.equal(saved.carriers[0].flightId, state.carriers[0].flightId);
  assert.equal(saved.carriers[0].misses, 2); assert.equal(saved.carriers[0].readable, false);
  assert.equal(saved.carriers[0].approachSpoken, false); assert.equal(saved.paused, false);
  saved.carriers[0].word = 'changed'; assert.equal(state.carriers[0].word, 'map');
});

test('wrong source paths, future clocks and a fabricated presented word fail the receipt/history contract', () => {
  const state = fixture(); catchWord(state, 'map');
  for (const change of [value => value.evidence.audioReceipts[0].src = '/audio/invented.mp3',
    value => value.evidence.audioReceipts[0].target = 's', value => value.evidence.audioReceipts[0].at = 10,
    value => value.evidence.firstResponses[0].choices.push({ id: 'future', word: 'invented' }),
    value => value.evidence.firstResponses[0].source = 'meteor', value => value.foregroundElapsed = -1]) {
    const bad = structuredClone(state); change(bad);
    assert.equal(validateRocketRunSession(bad, context(state.seed)), null);
  }
});
