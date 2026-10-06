import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import { PHYSICAL_PAL_ART } from '../../src/components/learn/games/shared/physicalPalArtData.js';
import { safariRecoveryAtlas, safariRetainedOperatorFrame, safariProceduralOperator } from '../../src/components/learn/games/games/soundSafariRecoveryArt.js';
import { safariAttachedNetGeometry } from '../../src/components/learn/games/games/soundSafariToolGeometry.js';
import { createSoundSafariAuthoredView } from '../../src/components/learn/games/games/soundSafariAuthoredView.js';

const manifest = JSON.parse(await fs.readFile('source-art/arcade/physical-worlds/sound-safari/manifest.json', 'utf8'));
const atlases = Object.fromEntries(manifest.assets.filter(asset => asset.frames).map(asset => [asset.id, {
  runtime: `/unit-safari/${asset.id}.webp`, width: asset.sourceSize[0], height: asset.sourceSize[1],
  pixelsPerUnit: asset.pixelsPerUnit, nominalHeight: asset.nominalHeight, frames: asset.frames
}]));
const cast = { meadow: 'bouncy', dino: 'chompy', moonwood: 'pip' };

test('Safari retained recovery uses only original visible opaque palms/soles within exact unchanged canonical source crops', async () => {
  for (const [world, hero] of Object.entries(cast)) {
    const atlas = safariRecoveryAtlas(world), original = PHYSICAL_PAL_ART[hero].actionAtlases.tools;
    const { data, info } = await sharp(await fs.readFile('public' + atlas.runtime)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(atlas.runtime, original.runtime);
    for (let index = 0; index < 2; index++) {
      const frame = atlas.frames[index]; assert.deepEqual(frame.cell, original.frames[index + 6].cell); assert.deepEqual(frame.anchor, original.frames[index + 6].anchor);
      assert.deepEqual(Object.keys(frame.sockets), ['nearHand', 'feet']); assert.equal(frame.action, 'retained-static-tool-grip');
      for (const point of Object.values(frame.sockets)) {
        assert(point[0] >= frame.cell[0] && point[0] < frame.cell[2] && point[1] >= frame.cell[1] && point[1] < frame.cell[3]);
        assert(data[(point[1] * info.width + point[0]) * 4 + 3] >= 160, hero + ' actual source contact is opaque');
      }
    }
  }
});

test('both original-facing retained poses and actual procedural palms fit all layouts and retain connected full-field capture geometry', () => {
  for (const [world, hero] of Object.entries(cast)) for (const [width, height] of [[320, 570], [568, 234], [1280, 727]]) {
    for (const centre of [{ x: 12, y: 110 }, { x: width - 18, y: height - 88 }]) {
      const retained = safariRetainedOperatorFrame(world, width, height, centre), procedural = safariProceduralOperator(world, width, height, 5);
      assert.equal(retained.character, hero); assert.equal(retained.pose.mirror, false); assert.equal(retained.index, centre.x < Math.max(42, width * .1) ? 1 : 0);
      const bounds = { x: retained.placement.x + retained.pose.destination.x, y: retained.placement.y + retained.pose.destination.y,
        width: retained.pose.destination.width, height: retained.pose.destination.height };
      for (const body of [bounds, procedural.bodyBounds]) {
        assert(body.x >= 8 - 1e-8 && body.x + body.width <= width - 8 + 1e-8);
        assert(body.y >= 88 - 1e-8 && body.y + body.height <= height - 70 + 1e-8);
      }
      assert.equal(procedural.fallback.character, hero); assert.deepEqual(procedural.pose.sockets.nearHand, procedural.fallback.handSockets.rightHand);
      const netAtlas = atlases['nets-v2'], netFrame = netAtlas.frames.find(frame => frame.id === `${world}-net`);
      for (const operatorPose of [retained.pose, procedural.pose]) {
        const geometry = safariAttachedNetGeometry({ operatorPose, netAtlas, netFrame, centre, radius: 34 });
        assert.deepEqual(geometry.captureCentre, centre); assert.deepEqual(geometry.measuredWrist, operatorPose.sockets.nearHand);
        assert.deepEqual(geometry.shaft.sections[0].from, operatorPose.sockets.nearHand);
        // The final interpolation has one floating-point subtraction/addition.
        // A sub-billionth pixel bound retains the measured physical contact.
        assert(Math.abs(geometry.shaft.sections[2].to.x - geometry.connector.x) < 1e-9);
        assert(Math.abs(geometry.shaft.sections[2].to.y - geometry.connector.y) < 1e-9);
      }
    }
  }
});

test('actual view draws canonical pending/final bodies immediately, independently preloads retained tools, and releases both owners on dispose', async t => {
  const previous = globalThis.Image, requests = [];
  globalThis.Image = class {
    set src(value) { this.url = value; const atlas = Object.values(atlases).find(a => a.runtime === value)
      || Object.keys(cast).map(safariRecoveryAtlas).find(a => a.runtime === value)
      || { width: 512, height: 256 };
      this.naturalWidth = atlas.width; this.naturalHeight = atlas.height; requests.push(this); }
    async decode() {}
  };
  t.after(() => { globalThis.Image = previous; });
  const ctx = new Proxy({}, { get(target, key) { return target[key] || (() => {}); }, set(target, key, value) { target[key] = value; return true; } });
  for (const [world, hero] of Object.entries(cast)) {
    requests.length = 0;
    const view = createSoundSafariAuthoredView({ atlases, horizons: Object.fromEntries(Object.keys(cast).map(w => [w, `/unit-safari/${w}-horizon.webp`])),
      horizonSizes: Object.fromEntries(Object.keys(cast).map(w => [w, [512, 256]])) });
    try {
      const pending = view.preload(world), state = { time: 8, net: { x: 280, y: 160 } };
      assert(view.drawOperatorAndNet(ctx, world, state, 568, 234, 34));
      const initial = view.inspect(); assert.equal(initial.contact.character, hero); assert.equal(initial.contact.representation, 'procedural-art-loading');
      assert.deepEqual(initial.contact.shaft.sections[0].from, initial.contact.wrist); assert.equal(initial.recoveryDelivery[world], 'pending');
      const retained = requests.find(image => image.url === safariRecoveryAtlas(world).runtime); assert(retained, 'preload requests the separate canonical recovery owner');
      for (const image of requests) if (image === retained) await image.onload(); else image.onerror();
      await pending;
      assert(view.drawOperatorAndNet(ctx, world, state, 568, 234, 34)); const recovery = view.inspect();
      assert.equal(recovery.contact.representation, 'retained-static-canonical-tool-grip'); assert.equal(recovery.contact.operatorDelivery, 'unavailable'); assert.equal(recovery.contact.recoveryDelivery, 'delivered');
      assert.deepEqual(recovery.contact.shaft.sections[0].from, recovery.contact.wrist); assert.equal(recovery.contact.netDelivery, 'unavailable');
    } finally { view.dispose(); }
    assert.equal(view.inspect().disposed, true); assert.equal(view.inspect().contact, null);
    assert.equal(view.inspect().recoveryDelivery[world], 'disposed'); assert.equal(view.drawOperatorAndNet(ctx, world, { net: { x: 280, y: 160 } }, 568, 234, 34), false);
  }
});
