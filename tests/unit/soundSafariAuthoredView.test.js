import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { safariOperatorAction, safariOperatorFrame, safariWildlifeFrame } from '../../src/components/learn/games/games/soundSafariAuthoredView.js';
import { safariAttachedNetGeometry } from '../../src/components/learn/games/games/soundSafariToolGeometry.js';

const manifest = JSON.parse(await fs.readFile('source-art/arcade/physical-worlds/sound-safari/manifest.json', 'utf8'));
const atlases = Object.fromEntries(manifest.assets.filter(asset => asset.frames).map(asset => [asset.id, {
  width: asset.sourceSize[0], height: asset.sourceSize[1], pixelsPerUnit: asset.pixelsPerUnit, nominalHeight: asset.nominalHeight, frames: asset.frames
}]));

test('Safari live motor and feedback timers select anticipation, swing, catch, recovery and celebration without answer-dependent poses', () => {
  assert.equal(safariOperatorAction({}), 'anticipate');
  assert.equal(safariOperatorAction({ net: { swingT: .22 } }), 'swing');
  assert.equal(safariOperatorAction({ net: { swingT: .08 } }), 'follow-through');
  assert.equal(safariOperatorAction({ judgement: 'CAUGHT', judgementT: .4 }), 'catch');
  assert.equal(safariOperatorAction({ judgement: 'TRY AGAIN', judgementT: .4 }), 'recover');
  assert.equal(safariOperatorAction({ wordClearT: .1 }), 'celebrate');
  assert.equal(safariOperatorAction({ ended: true }), 'celebrate');
});

test('Every actual operator pose remains inside title/rack bounds at portrait, short and wide sizes, with wrist-connected full-field net reach', () => {
  for (const world of ['meadow', 'dino', 'moonwood']) for (const [width, height] of [[320, 570], [568, 234], [1360, 768]]) {
    for (const action of ['anticipate', 'swing', 'catch', 'recover', 'follow-through', 'celebrate']) {
      const selected = safariOperatorFrame(atlases, world, action, width, height);
      assert.ok(selected, `${world}/${action}`);
      const { placement, pose } = selected;
      assert.ok(placement.x + pose.destination.x >= 8 - 1e-8);
      assert.ok(placement.x + pose.destination.x + pose.destination.width <= width - 8 + 1e-8);
      assert.ok(placement.y + pose.destination.y >= 88 - 1e-8);
      assert.ok(placement.y + pose.destination.y + pose.destination.height <= height - 70 + 1e-8);
      const netAtlas = atlases['nets-v2'], netFrame = netAtlas.frames.find(frame => frame.id === `${world}-net`);
      for (const centre of [{ x: width * .1, y: height * .18 }, { x: width * .93, y: height * .79 }]) {
        const geometry = safariAttachedNetGeometry({ operatorPose: pose, netAtlas, netFrame, centre, radius: 34 });
        assert.deepEqual(geometry.captureCentre, centre);
        assert.deepEqual(geometry.measuredWrist, pose.sockets.nearHand);
        assert.deepEqual(geometry.shaft.sections[0].from, pose.sockets.nearHand);
      }
    }
  }
});

test('All original wildlife alternate real source actions at exactly the controller capture centre and radius', () => {
  for (const world of ['meadow', 'dino', 'moonwood']) for (const type of [0, 1, 2]) {
    const critter = { type, phase: 0, x: 220, y: 170, hitX: 222, hitY: 176, r: 42, hitRadius: 39, vx: -20 };
    const idle = safariWildlifeFrame(atlases, world, critter, 0), travel = safariWildlifeFrame(atlases, world, critter, .3);
    assert.equal(idle.frame.action, 'idle'); assert.equal(travel.frame.action, 'travel');
    assert.equal(idle.frame.species, travel.frame.species); assert.equal(idle.placement.mirror, true);
    assert.deepEqual(idle.pose.sockets.captureCenter, { x: 222, y: 176 });
    assert.ok(Math.abs(idle.frame.captureRadius * idle.pose.pixelScale - 39) < 1e-8);
    assert.deepEqual(travel.pose.sockets.captureCenter, { x: 222, y: 176 });
  }
});
