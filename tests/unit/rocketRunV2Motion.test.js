import test from 'node:test';
import assert from 'node:assert/strict';
import {
  rocketFlightState, steerRocketFlight, stepRocketFlight,
  hitRocketMeteor, retryRocketFlight, rocketFlightContact,
} from '../../src/utils/rocketRunFlightMotion.js';
import { rocketRunV2Outing, returnRocketTrial } from '../../src/utils/rocketRunV2Rounds.js';

const laneX = lane => [-2.2, 0, 2.2][lane];

test('a new opposite command immediately owns the visible lane movement', () => {
  const state = rocketFlightState();
  assert.equal(steerRocketFlight(state, 1), true);
  stepRocketFlight(state, 1 / 120, laneX);
  assert.ok(state.x > 0);
  assert.equal(steerRocketFlight(state, -1), true);
  assert.equal(steerRocketFlight(state, -1), true);
  assert.equal(state.lane, 0);
  for (let i = 0; i < 45; i++) stepRocketFlight(state, 1 / 120, laneX);
  assert.ok(state.x < -2.1);
  assert.ok(state.bank > 0);
  stepRocketFlight(state, 1 / 120, laneX, { reducedMotion: true });
  assert.equal(state.bank, 0);
});

test('meteor immunity, zero-life recovery and retained learning state are separate', () => {
  const flight = rocketFlightState(), accepted = ['rocket-0-3'], language = { firstResponses: [{ choice: 'sun', correct: false }] };
  const before = structuredClone({ accepted, language });
  assert.equal(hitRocketMeteor(flight), true);
  assert.equal(flight.hearts, 2);
  assert.equal(hitRocketMeteor(flight), false);
  for (let loss = 0; loss < 2; loss++) {
    for (let frame = 0; frame < 170; frame++) stepRocketFlight(flight, 1 / 120, laneX);
    assert.equal(hitRocketMeteor(flight), true);
  }
  assert.equal(flight.stopped, true);
  assert.equal(steerRocketFlight(flight, 1), false);
  assert.equal(retryRocketFlight(flight), true);
  assert.equal(flight.hearts, 3);
  assert.equal(flight.motorRetries, 1);
  assert.equal(retryRocketFlight(flight), false);
  assert.deepEqual({ accepted, language }, before);
  assert.deepEqual(Object.keys(flight).filter(key => /wrong|answer|star|receipt/i.test(key)), []);
});

test('the first swept physical body wins regardless of its spelling or correctness', () => {
  const wrong = { id: 'wrong', x: 0, z: 2, correct: false }, right = { id: 'right', x: 0, z: 4, correct: true };
  const hit = rocketFlightContact({ x: 0, z: 0 }, { x: 0, z: 6 }, [right, wrong]);
  assert.equal(hit.body.id, 'wrong');
  assert.equal(rocketFlightContact({ x: 0, z: 0 }, { x: 0, z: 6 }, [{ ...right, x: 2.2 }]), null);
});

test('all existing ten-round denominators and missed trial identities survive reconstruction', () => {
  for (const difficulty of ['easy', 'medium', 'hard']) {
    const plans = rocketRunV2Outing(difficulty, 127);
    assert.equal(plans.length, 10);
    assert.deepEqual(plans, rocketRunV2Outing(difficulty, 127));
    for (const plan of plans) {
      assert.equal(plan.needed, plan.choices.filter(choice => choice.correct).length);
      assert.equal(new Set(plan.choices.map(choice => choice.id)).size, plan.choices.length);
      const correct = plan.choices.find(choice => choice.correct);
      const returned = returnRocketTrial(plan, correct, [], 3);
      assert.equal(returned.id, correct.id);
      assert.equal(returned.word, correct.word);
      assert.equal(returned.misses, 4);
      assert.deepEqual(returned.support, ['motor-return']);
      assert.equal(returnRocketTrial(plan, correct, [correct.id]), null);
      assert.equal(returnRocketTrial(plan, plan.choices.find(choice => !choice.correct), []), null);
    }
  }
});
