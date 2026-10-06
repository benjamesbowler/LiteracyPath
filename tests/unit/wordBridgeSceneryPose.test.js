import test from 'node:test';
import assert from 'node:assert/strict';
import { WORD_BRIDGE_SCENERY } from '../../src/components/learn/games/games/wordBridgeScenery.generated.js';
import { wordBridgeSceneryPose } from '../../src/components/learn/games/games/wordBridgeSceneryPose.js';

test('all original bank turf contacts meet the walking plane with uniform source scale', () => {
  for (const atlas of Object.values(WORD_BRIDGE_SCENERY)) {
    const frame = atlas.frames.find(frame => frame.action === 'bank');
    const original = structuredClone(frame);
    for (const mirror of [false, true]) {
      const selected = wordBridgeSceneryPose(atlas, frame, { x: 180, y: 490, width: 680, socket: 'walkSurface', mirror });
      assert(selected);
      assert.deepEqual(selected.pose.sockets.walkSurface, { x: 180, y: 490 });
      const source = selected.pose.source, delivered = selected.pose.destination;
      assert(Math.abs(delivered.width / source.width - delivered.height / source.height) < 1e-12);
      assert(Math.abs(delivered.width - 680) < 1e-9);
      assert(selected.pose.sockets.ground.y > selected.pose.sockets.walkSurface.y, 'Actual lower bank face remains below the turf contact');
      assert.equal(selected.pose.mirror, mirror);
    }
    assert.deepEqual(frame, original, 'Source registration stays unchanged');
  }
});

test('the actual workbench and rack ground pixels attach independently of their crop edge', () => {
  for (const atlas of Object.values(WORD_BRIDGE_SCENERY)) for (const action of ['workbench', 'rack']) {
    const frame = atlas.frames.find(frame => frame.action === action);
    const selected = wordBridgeSceneryPose(atlas, frame, { x: 340, y: 490, width: 130 });
    assert(selected);
    assert.deepEqual(selected.pose.sockets.ground, { x: 340, y: 490 });
    const visibleTop = selected.placement.y + selected.pose.destination.y;
    assert(visibleTop < 490, 'Complete scenery extends above its actual ground contact');
    assert.equal(selected.pose.source.height, frame.cell[3] - frame.cell[1]);
  }
});

test('unknown or invalid scenery contacts cannot invent an attachment', () => {
  const atlas = Object.values(WORD_BRIDGE_SCENERY)[0], frame = atlas.frames[0];
  assert.equal(wordBridgeSceneryPose(atlas, frame, { x: 0, y: 100, width: 90, socket: 'not-authored' }), null);
  for (const width of [0, -1, Infinity, NaN]) assert.equal(wordBridgeSceneryPose(atlas, frame, { x: 0, y: 100, width }), null);
  assert.equal(wordBridgeSceneryPose(atlas, frame, { x: Infinity, y: 100, width: 90 }), null);
  assert.equal(wordBridgeSceneryPose(atlas, frame, { x: 0, y: 100, width: 90, mirror: 'left' }), null);
});
