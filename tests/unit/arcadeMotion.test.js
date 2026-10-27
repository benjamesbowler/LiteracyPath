import test from 'node:test';
import assert from 'node:assert/strict';
import { interpolateArcadeMotion, createArcadeMotionTrack } from '../../src/components/learn/games/shared/arcadeMotion.js';

test('fixed 60 Hz travel renders continuously at 120 Hz without advancing collision state', () => {
  const step = 1 / 60, speed = 288, current = { x: 0 }, previous = { x: 0 }, output = {};
  let remainder = 0;
  const positions = [];
  for (let frame = 0; frame < 120; frame += 1) {
    remainder += 1 / 120;
    while (remainder >= step) {
      previous.x = current.x;
      current.x += speed * step;
      remainder -= step;
    }
    const collisionX = current.x;
    interpolateArcadeMotion(previous, current, remainder / step, output, ['x']);
    assert.equal(current.x, collisionX);
    positions.push(output.x);
  }
  for (let i = 2; i < positions.length; i += 1) assert.ok(Math.abs(positions[i] - positions[i - 1] - 2.4) < 1e-9);
  assert.ok(Math.abs(current.x - speed) < 1e-9);
});

test('heading crosses the wrap boundary along the short turn', () => {
  const degrees = Math.PI / 180;
  const result = interpolateArcadeMotion({ yaw: 179 * degrees }, { yaw: -179 * degrees }, .5, {}, ['yaw'], ['yaw']);
  assert.ok(Math.abs(result.yaw - Math.PI) < 1e-12);
});

test('sampling clamps stalls and snaps new or reset identities without overwriting unrelated fields', () => {
  const out = { active: true };
  assert.equal(interpolateArcadeMotion({ x: 2 }, { x: 5 }, 3, out, ['x']), out);
  assert.deepEqual(out, { active: true, x: 5 });
  interpolateArcadeMotion({ x: 2 }, { x: 5 }, -1, out, ['x']);
  assert.equal(out.x, 2);
  interpolateArcadeMotion(null, { x: 100 }, .25, out, ['x']);
  assert.equal(out.x, 100);
  interpolateArcadeMotion({ x: 0 }, { x: 100 }, NaN, out, ['x']);
  assert.equal(out.x, 100);
});

test('a replaced actor keeps continuous presentation while resets and events take immediate effect', () => {
  const track = createArcadeMotionTrack(['x']);
  const before = { x: 1, grounded: false }, after = { x: 3, grounded: true };
  track.capture(before);
  const rendered = track.sample(after, .25);
  assert.deepEqual(rendered, { x: 1.5, grounded: true });
  assert.deepEqual(after, { x: 3, grounded: true });
  assert.equal(track.sample(after, .5), rendered);
  assert.equal(rendered.x, 2);
  track.reset();
  assert.equal(track.sample({ x: 100 }, 0).x, 100);
  assert.equal(Object.hasOwn(rendered, 'grounded'), false);
});
