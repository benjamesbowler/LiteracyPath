import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newWordBridgeConstructionMotion, advanceWordBridgeConstructionMotion,
  wordBridgeSlotSurface, wordBridgeConstructionSample
} from '../../src/components/learn/games/games/wordBridgeConstructionMotion.js';

const hand = { centre: { x: 140, y: 120 }, angle: -.15, width: 76, height: 58 };
const slot = { x: 220, y: 176, w: 64, h: 58 };

test('pickup follows current measured hands while movement and facing change', () => {
  const motion = newWordBridgeConstructionMotion('pickup', 2);
  const first = wordBridgeConstructionSample(motion, hand);
  const moved = { ...hand, centre: { x: 170, y: 125 }, angle: .12 };
  const second = wordBridgeConstructionSample(advanceWordBridgeConstructionMotion(motion, .1), moved);
  assert.deepEqual(first.surface, hand);
  assert.deepEqual(second.surface, moved);
  assert.equal(second.physicalId, 2);
  assert.equal(second.attachedToMeasuredPalms, true);
  assert.deepEqual(hand.centre, { x: 140, y: 120 });
});

test('one placed piece begins at palms and ends at its actual slot without moving either physical owner', () => {
  const destination = wordBridgeSlotSurface(slot);
  const motion = newWordBridgeConstructionMotion('place', 2, destination);
  assert.deepEqual(wordBridgeConstructionSample(motion, hand).surface, hand);
  assert.deepEqual(wordBridgeConstructionSample({ ...motion, elapsed: motion.duration }, hand).surface, destination);
  assert.equal(wordBridgeConstructionSample(motion, hand).suppressPlacedPiece, true);
  assert.deepEqual(slot, { x: 220, y: 176, w: 64, h: 58 });
  assert.deepEqual(destination.centre, { x: 252, y: 205 });
  assert.equal(advanceWordBridgeConstructionMotion(motion, motion.duration), null);
});

test('pause-owned zero steps keep a handoff unchanged and reduced motion exposes the actual placed piece immediately', () => {
  const motion = newWordBridgeConstructionMotion('place', 1, wordBridgeSlotSurface(slot));
  assert.deepEqual(advanceWordBridgeConstructionMotion(motion, 0), motion);
  const sample = wordBridgeConstructionSample(motion, hand, { reducedMotion: true });
  assert.deepEqual(sample.surface, wordBridgeSlotSurface(slot));
  assert.equal(sample.suppressPlacedPiece, false);
  assert.equal(sample.reaching, false);
  assert.equal(newWordBridgeConstructionMotion('place', 1, { ...hand, width: NaN }), null);
  assert.equal(wordBridgeConstructionSample(motion, { ...hand, centre: { x: Infinity, y: 0 } }), null);
});
