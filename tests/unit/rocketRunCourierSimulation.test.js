import test from 'node:test';
import assert from 'node:assert/strict';
import { newRocketRunEvidence } from '../../src/utils/rocketRunEvidence.js';
import {
  createRocketCourierState, selectRocketCourier, pauseRocketCourier,
  stepRocketCouriers, retryRocketCourier, rocketCourierSpeed,
} from '../../src/utils/rocketRunCourierSimulation.js';

const plan = { round: 0, target: 'm', needed: 2, choices: [
  { id: 'map', word: 'map', correct: true }, { id: 'sun', word: 'sun', correct: false },
  { id: 'moon', word: 'moon', correct: true },
] };
const receipt = { round: 0, target: 'm', kind: 'target-phoneme', src: '/audio/phonemes/m.mp3', at: 0 };
const presentation = () => ({ visible: true, readable: true });
const body = (id, flightId = 1, lane = 1) => ({ trialId: id, flightId, word: id, lane,
  x: [-2.2, 0, 2.2][lane], z: -1.82, alive: true, passed: false,
  radius: .43, depthRadius: .24, visible: true, readable: true, misses: 0 });
const stateWith = id => {
  const state = createRocketCourierState(plan, { seed: 127, evidence: { ...newRocketRunEvidence(), audioReceipts: [receipt] } });
  state.queue = []; state.spawnIn = 99; state.activeTargetReceipt = receipt;
  state.carriers = [body(id)]; state.nextFlightId = 2;
  return state;
};
const step = (state, options = {}) => stepRocketCouriers(state, plan, 1 / 120, { presentation, ...options });

test('a passive physical correct-word contact returns the same trial without a language row', () => {
  const state = stateWith('map'), original = structuredClone(state.evidence);
  const events = step(state);
  assert.equal(events[0].type, 'motor-contact');
  assert.deepEqual(state.evidence, original); assert.deepEqual(state.caughtIds, []);
  assert.deepEqual(state.queue, [{ trialId: 'map', misses: 1 }]);
  assert.equal(state.flight.hearts, 3); assert.equal(state.flight.motorMisses, 1);
});

test('anticipation speed includes the actual next long recording and equals physical distance, including boost', () => {
  const state = createRocketCourierState(plan, { seed: 127 });
  state.queue = [{ trialId: 'moon', misses: 0 }]; state.carriers = [{ ...body('map'), z: -15 }]; state.spawnIn = 99;
  const duration = word => word === 'moon' ? 4 : .6;
  const expected = rocketCourierSpeed(state, plan, 18, duration);
  assert.equal(expected.longest, 4); assert.ok(expected.speed < 8);
  const before = state.distance;
  step(state, { requestedSpeed: 18, clipSeconds: duration });
  assert.ok(Math.abs(state.distance - before - expected.speed / 120) < 1e-12);
  assert.equal(state.evidence.firstResponses.length, 0);
});

test('an armed wrong courier records a language contrast without losing a motor life', () => {
  const state = stateWith('sun');
  assert.equal(selectRocketCourier(state, plan, 'keyboard'), true);
  const events = step(state);
  assert.equal(events[0].type, 'wrong-onset');
  assert.equal(events[0].row.selected, 'sun');
  assert.deepEqual(events[0].row.choices, [{ id: 'sun', word: 'sun' }]);
  assert.equal(events[0].row.deliveryAtResponse, 'delivered');
  assert.equal(state.flight.hearts, 3); assert.equal(state.flight.motorHits, 0);
  assert.equal(state.intent, null); assert.deepEqual(state.caughtIds, []);
});

test('the first swept interception consumes ownership rather than answering for the selected later word', () => {
  const state = stateWith('sun');
  state.carriers[0].z = -1.82;
  state.carriers.push({ ...body('map', 2), z: -2.25 });
  state.nextFlightId = 3;
  // This explicit ID mirrors a deliberate word selection; moving into the
  // same lane by itself would not arm either printed carrier.
  state.intent = { round: 0, target: 'm', trialId: 'map', flightId: 2, source: 'pointer', at: 0 };
  const events = step(state);
  assert.equal(events[0].trialId, 'sun'); assert.equal(events[0].type, 'motor-contact');
  assert.equal(state.evidence.firstResponses.length, 0); assert.equal(state.intent, null);
});

test('pause freezes the physical clock and cancels Catch ownership without changing bank or history', () => {
  const state = stateWith('map'); selectRocketCourier(state, plan, 'touch');
  const before = structuredClone({ carriers: state.carriers, evidence: state.evidence, queue: state.queue });
  pauseRocketCourier(state, true);
  assert.deepEqual(step(state), []); assert.equal(state.elapsed, 0); assert.equal(state.intent, null);
  assert.deepEqual({ carriers: state.carriers, evidence: state.evidence, queue: state.queue }, before);
  pauseRocketCourier(state, false);
  assert.equal(step(state)[0].type, 'motor-contact');
});

test('zero-life Retry retains accepted reading and wrong history while visibly restoring immunity', () => {
  const state = stateWith('sun'); selectRocketCourier(state, plan, 'keyboard'); step(state);
  state.carriers = [{ ...body('map', 2), z: -10 }]; state.nextFlightId = 3;
  state.flight.hearts = 0; state.flight.stopped = true;
  const before = structuredClone(state.evidence);
  assert.equal(retryRocketCourier(state, plan), true);
  assert.equal(state.flight.hearts, 3); assert.equal(state.flight.immunity, 1.4);
  assert.equal(state.flight.motorRetries, 1); assert.equal(state.intent, null);
  assert.deepEqual(state.evidence, before); assert.deepEqual(state.queue, [{ trialId: 'map', misses: 1 }]);
  assert.equal(retryRocketCourier(state, plan), false);
});

test('boost preserves clip-derived reading travel and the deterministic original trial queue', () => {
  const left = createRocketCourierState(plan, { seed: 127 }), right = createRocketCourierState(plan, { seed: 127 });
  for (let frame = 0; frame < 55; frame++) {
    step(left, { requestedSpeed: 1000, clipSeconds: () => 2 });
    step(right, { requestedSpeed: 1000, clipSeconds: () => 2 });
  }
  assert.deepEqual(left, right);
  assert.ok(left.distance < 55 / 120 * 12.31);
  assert.equal(left.carriers.length, 1); assert.equal(left.carriers[0].trialId, 'map');
  assert.deepEqual(left.queue.map(row => row.trialId), ['sun', 'moon']);
  assert.equal(left.evidence.firstResponses.length, 0);
});
