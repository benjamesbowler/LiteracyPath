import test from 'node:test';
import assert from 'node:assert/strict';
import { createWordClimbSession } from '../../src/utils/wordClimbLevels.js';
import { createClimbJourney, advanceClimbJourney } from '../../src/components/learn/games/games/wordClimbJourney.js';
import { pacedClimbNativeKeys } from '../release/word-climb-steering.js';

function firstCrossing() {
  const world = createClimbJourney(createWordClimbSession('easy', () => .32), 0, 0, () => .32);
  for (let n = 0; n < 1200 && !world.journey.crossing; n++) {
    const keys = pacedClimbNativeKeys(world).keys;
    advanceClimbJourney(world, 1 / 60, { up: keys.includes('ArrowUp'), left: keys.includes('ArrowLeft'), right: keys.includes('ArrowRight') });
  }
  assert(world.journey.crossing);
  return world;
}

test('native steering reaches the actual bough endpoint where the old trunk deadzone stalled, without changing ascent or terrain', () => {
  const world = firstCrossing();
  for (let n = 0; n < 160 && world.x < 899; n++) advanceClimbJourney(world, Math.min(1 / 60, (899 - world.x) / 180), { up: true, right: true });
  assert.equal(world.x, 899); assert.equal(world.y, 572);
  const old = structuredClone(world), geometry = structuredClone(world.platforms);
  for (let n = 0; n < 60; n++) advanceClimbJourney(old, 1 / 60, { up: true });
  assert.equal(old.x, 899); assert(old.journey.crossing);
  assert.deepEqual(pacedClimbNativeKeys(world).keys, ['ArrowUp', 'ArrowRight']);
  advanceClimbJourney(world, 1 / 60, { up: true, right: true });
  assert.equal(world.x, 900); assert.equal(world.y, 572); assert.equal(world.journey.crossing, null);
  assert.equal(world.step, 0); assert.equal(world.motorFalls, 0); assert.equal(world.wrong, 0);
  assert.deepEqual(world.platforms, geometry);
});

test('the same exact steering reaches left and return connections while ordinary trunk tracking keeps its broad deadzone', () => {
  for (const [phase, side, x, target, key] of [['out', -1, 101, 100, 'ArrowLeft'], ['back', 1, 501, 500, 'ArrowLeft'], ['back', -1, 499, 500, 'ArrowRight']]) {
    const world = firstCrossing();
    world.x = x; world.journey.crossing = { phase, side, y: world.y };
    assert(pacedClimbNativeKeys(world, side).keys.includes(key));
    advanceClimbJourney(world, 1 / 60, { up: true, left: key === 'ArrowLeft', right: key === 'ArrowRight' });
    assert.equal(world.x, target); assert.equal(world.journey.crossing, null); assert.equal(world.y, 572);
  }
  const world = firstCrossing(); world.journey.crossing = null; world.y = 100; world.x = 499;
  assert.deepEqual(pacedClimbNativeKeys(world).keys, ['ArrowUp']);
});
