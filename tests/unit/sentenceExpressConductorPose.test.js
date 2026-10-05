import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { sentenceExpressConductorAction, sentenceExpressCouplingPose } from '../../src/components/learn/games/games/sentenceExpressConductorPose.js';

const manifest = JSON.parse(await fs.readFile('source-art/arcade/physical-worlds/sentence-express/manifest.json', 'utf8'));
const atlases = Object.fromEntries(manifest.assets.filter(asset => asset.id.endsWith('conductor')).map(asset => [asset.id, {
  width: asset.sourceSize[0], height: asset.sourceSize[1], nominalHeight: asset.nominalHeight,
  pixelsPerUnit: asset.pixelsPerUnit, frames: asset.frames
}]));

test('Express actual rail and coupling height place each unstretched source palm exactly on the real connector with grounded boots', () => {
  for (const world of ['meadow', 'dino', 'moonwood']) for (const mirror of [false, true]) {
    const result = sentenceExpressCouplingPose(atlases, world, { coupler: { x: 400, y: 272 }, railY: 300, mirror });
    assert(result); assert(Math.abs(result.pose.sockets.nearHand.x - 400) < 1e-8); assert(Math.abs(result.pose.sockets.nearHand.y - 272) < 1e-8);
    assert.equal(result.pose.sockets.feet.y, 300);
    assert(result.height >= 72 && result.height <= 164);
    assert.equal(result.placement.y, 300);
  }
  assert.equal(sentenceExpressCouplingPose(atlases, 'meadow', { coupler: { x: 400, y: 295 }, railY: 300 }), null, 'a tiny stretched arm/figure is not reported as actual contact');
  assert.equal(sentenceExpressCouplingPose(atlases, 'moonwood', { coupler: { x: 400, y: 200 }, railY: 300 }), null, 'oversized contact must be reframed rather than clamped');
  assert.equal(sentenceExpressCouplingPose(atlases, 'dino', { coupler: { x: 400, y: 301 }, railY: 300 }), null);
});

test('Express conductor actions follow actual coupling, Send/departure and recovery without language selection inputs', () => {
  assert.equal(sentenceExpressConductorAction({}), 'ready');
  assert.equal(sentenceExpressConductorAction({ needsEngine: true }), 'point');
  assert.equal(sentenceExpressConductorAction({ coupling: true }), 'couple-low');
  assert.equal(sentenceExpressConductorAction({ canSend: true }), 'send-ready');
  assert.equal(sentenceExpressConductorAction({ departing: true }), 'wave');
  assert.equal(sentenceExpressConductorAction({ departing: true, recovering: true }), 'recover');
});
