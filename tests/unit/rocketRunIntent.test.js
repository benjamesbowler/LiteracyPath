import test from 'node:test';
import assert from 'node:assert/strict';
import { nearestRocketCourier, armRocketIntent, validRocketIntent, consumeRocketIntent } from '../../src/utils/rocketRunIntent.js';

const plan = { round: 3, target: 'm', choices: [
  { id: 'map', word: 'map', correct: true }, { id: 'sun', word: 'sun', correct: false },
  { id: 'moon', word: 'moon', correct: true },
] };
const carriers = [
  { trialId: 'map', flightId: 12, word: 'map', lane: 1, z: -3, visible: true, readable: true },
  { trialId: 'sun', flightId: 13, word: 'sun', lane: 0, z: -2, visible: true, readable: true },
  { trialId: 'moon', flightId: 14, word: 'moon', lane: 1, z: -20, visible: true, readable: false },
];

test('Catch selects the nearest readable current-lane courier without choosing by correctness', () => {
  assert.equal(nearestRocketCourier(plan, carriers, 1).trialId, 'map');
  const wrong = armRocketIntent(plan, carriers, { lane: 0, source: 'touch', at: 2 });
  assert.equal(wrong.trialId, 'sun');
  assert.equal(armRocketIntent(plan, carriers, { lane: 1, trialId: 'moon', source: 'keyboard', at: 2 }), null);
  assert.equal(armRocketIntent(plan, carriers, { lane: 2, source: 'keyboard', at: 2 }), null);
});

test('passive default-lane contact and another-carrier interception cannot make a language response', () => {
  assert.equal(consumeRocketIntent(null, plan, carriers, carriers[0]).deliberate, false);
  const selected = armRocketIntent(plan, carriers, { lane: 1, source: 'keyboard', at: 2 });
  const intercepted = consumeRocketIntent(selected, plan, carriers, carriers[1]);
  assert.equal(intercepted.deliberate, false); assert.equal(intercepted.intent, null);
  const actual = consumeRocketIntent(selected, plan, carriers, carriers[0]);
  assert.equal(actual.deliberate, true); assert.equal(actual.source, 'keyboard'); assert.equal(actual.intent, null);
});

test('task, visibility and physical-instance expiry reject stale ownership after a return', () => {
  const intent = armRocketIntent(plan, carriers, { lane: 1, source: 'pointer', at: 2 });
  assert.equal(validRocketIntent(intent, plan, carriers), true);
  for (const changed of [carriers.map(row => ({ ...row, passed: true })),
    carriers.map(row => ({ ...row, alive: false })), carriers.map(row => ({ ...row, readable: false })),
    carriers.map(row => ({ ...row, flightId: row.flightId + 100 }))]) {
    assert.equal(validRocketIntent(intent, plan, changed), false);
  }
  assert.equal(validRocketIntent(intent, { ...plan, round: 4 }, carriers), false);
  assert.equal(validRocketIntent(intent, { ...plan, target: 's' }, carriers), false);
});
