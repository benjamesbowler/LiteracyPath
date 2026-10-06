import test from 'node:test';
import assert from 'node:assert/strict';
import { createSoundSafariCaptureMotion } from '../../src/components/learn/games/games/soundSafariCaptureMotion.js';

const catchEvent = slot => ({ id: `accepted-catch:${slot}`, roundId: 'heard-word:4', slot, slotCount: 3,
  centre: { x: 600, y: 170 }, radius: 45, width: 1000, height: 600,
  critter: { type: 2, phase: .4, vx: -20, color: 1, spriteFrame: 3 } });
const destination = slot => ({ x: 400 + slot * 60, y: 550 });

test('accepted creature follows the earned slot, retains its real body identity and never creates a learning or controller event', () => {
  const motion = createSoundSafariCaptureMotion(), input = catchEvent(1), original = structuredClone(input);
  assert.equal(motion.begin(input), true); assert.equal(motion.begin(input), false);
  const first = motion.sample(1000, 600, destination)[0];
  assert.deepEqual([first.x, first.y, first.radius], [600, 170, 45]);
  assert.equal(first.critter.type, 2); assert.equal(first.critter.vx, -20);
  for (let step = 0; step < 24; step++) motion.advance(1 / 60);
  const earned = motion.sample(1000, 600, destination)[0];
  assert.equal(earned.phase, 'guide'); assert.deepEqual([earned.x, earned.y, earned.radius], [460, 550, 12]);
  assert.deepEqual(input, original); assert.equal(motion.inspect().firstResponses, undefined);
  for (let step = 0; step < 120; step++) motion.advance(1 / 60);
  motion.release(input.roundId); motion.advance(.1);
  const released = motion.sample(1000, 600, destination)[0];
  assert.equal(released.phase, 'release'); assert.ok(released.opacity > .5,
    'A creature held during the next sounds releases from the guide instead of expiring on its old collection age');
  motion.dispose(); assert.deepEqual(motion.sample(1000, 600, destination), []);
});

test('word release waits for actual collection motion then finishes on the same fixed clock; cadence and pause preserve it', () => {
  const outcomes = [];
  for (const fps of [30, 60, 120]) {
    const motion = createSoundSafariCaptureMotion(); motion.begin(catchEvent(0)); motion.release('another-word');
    motion.advance(.1); assert.equal(motion.inspect().flights[0].releasing, false);
    motion.release('heard-word:4');
    const paused = motion.inspect(); // No advance while the owning controller is paused.
    assert.deepEqual(motion.inspect(), paused);
    for (let frame = 0; frame < fps / 2; frame++) motion.advance(1 / fps);
    const released = motion.sample(1000, 600, destination)[0];
    assert.equal(released.phase, 'release'); assert.ok(released.opacity > 0 && released.opacity < 1);
    outcomes.push(released);
    for (let frame = 0; frame < fps; frame++) motion.advance(1 / fps);
    assert.deepEqual(motion.inspect().flights, []); motion.dispose();
  }
  for (const result of outcomes.slice(1)) for (const key of ['x', 'y', 'radius', 'opacity'])
    assert.ok(Math.abs(result[key] - outcomes[0][key]) < 1e-8);
});

test('viewport/reduced-motion changes preserve the earned slot and bounded visual ownership without replaying a catch', () => {
  const motion = createSoundSafariCaptureMotion(); motion.begin(catchEvent(2)); motion.advance(.19);
  const paused = motion.inspect(), size = { width: 390, height: 844 };
  const actualSlot = () => ({ x: 220, y: 774 });
  const normal = motion.sample(size.width, size.height, actualSlot)[0];
  const reduced = motion.sample(size.width, size.height, actualSlot, true)[0];
  assert.equal(normal.x, reduced.x); assert.ok(normal.y < reduced.y);
  assert.deepEqual(motion.inspect(), paused, 'Rendering cannot advance or duplicate the accepted catch');
  assert.equal(motion.begin({ ...catchEvent(0), id: 'bad', slot: 3 }), false);
  motion.clear(); assert.deepEqual(motion.inspect().flights, []); motion.dispose();
  assert.equal(motion.begin(catchEvent(0)), false);
});
