import test from 'node:test';
import assert from 'node:assert/strict';
import { wordClimbCanvasContact, wordClimbCanvasProjection } from '../../src/components/learn/games/games/wordClimbCanvasWorld.js';
import { WORD_CLIMB_ATLASES } from '../../src/components/learn/games/games/wordClimbArt.generated.js';

test('Canvas Climb uses real route x/height and the same sole/shelf plane in wide, portrait and short landscape', () => {
  const world = { camera: 510 - 115, x: 810, y: 510 };
  for (const [width, height] of [[1280, 672], [320, 440], [568, 180]]) {
    const projection = wordClimbCanvasProjection(world, width, height), sole = projection.physical(world.x, world.y);
    assert.ok(Math.abs(sole.x - width * .81) < 1e-9);
    assert.ok(Math.abs(sole.y - (height - (world.y - world.camera - projection.metrics.cameraOffset) * height / projection.metrics.viewHeight)) < 1e-9);
  }
});

test('Canvas safety vine contacts are measured original palms transformed by the actual same lean and foot anchor', () => {
  for (const atlas of Object.values(WORD_CLIMB_ATLASES)) {
    const frame = atlas.frames.find(item => item.action === 'recover-grip');
    const point = { x: 400, y: 500 }, height = 92, lean = .1;
    const result = wordClimbCanvasContact(atlas, frame, point, height, lean), raw = result.pose.sockets.grip;
    assert.ok(raw); assert.ok(Math.abs(result.sockets.grip.x - (point.x + raw.x * Math.cos(lean) - raw.y * Math.sin(lean))) < 1e-9);
    assert.ok(Math.abs(result.sockets.grip.y - (point.y + raw.x * Math.sin(lean) + raw.y * Math.cos(lean))) < 1e-9);
    const rest = atlas.frames.find(item => item.action === 'rest');
    assert.equal(wordClimbCanvasContact(atlas, rest, point, height).sockets.grip, undefined);
  }
});
