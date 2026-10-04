import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { SOUNDKEYS_ART } from '../../src/components/learn/games/games/soundKeysArtData.js';
import { SOUNDKEYS_CAST, soundKeysKeyContactPose, soundKeysRestingPose } from '../../src/components/learn/games/games/soundKeysWorld.js';
import { registeredPalCanvasPose } from '../../src/components/learn/games/shared/registeredPalArt.js';

const root = new URL('../../', import.meta.url);
const bank = { pose(id, index, placement) { const atlas = SOUNDKEYS_ART[id]; return registeredPalCanvasPose(atlas, atlas.frames[index], placement); } };
const sha = data => createHash('sha256').update(data).digest('hex');

test('all three eight-word bands own original venue, physical kit, canonical bodies and registered pressing contacts', async () => {
  for (const [band, world] of ['meadow', 'dino', 'moonwood'].entries()) {
    for (const id of [`${world}-keyboard-venue-v1`, band === 0 ? 'instrument-kit-v1' : `${world}-instrument-kit-v1`]) {
      const asset = SOUNDKEYS_ART[id]; assert.ok(asset, id);
      const delivered = await readFile(new URL('public' + asset.runtime, root));
      assert.equal(sha(delivered), asset.runtimeSha256);
      const shape = await sharp(delivered).metadata(); assert.equal(shape.width, asset.width); assert.equal(shape.height, asset.height);
      if (asset.parts) for (const name of ['goldBar', 'blueBar', 'woodenFrame', 'bellResonator', 'reedResonator', 'frontFascia']) assert.ok(asset.parts[name]);
      const fallback = SOUNDKEYS_ART[id.replace('-v1', '-fallback-v1')]; assert.ok(fallback);
      assert.equal(fallback.sourceSha256, asset.sourceSha256);
      const fallbackBytes = await readFile(new URL('public' + fallback.runtime, root)); assert.equal(sha(fallbackBytes), fallback.runtimeSha256);
      const smaller = await sharp(fallbackBytes).metadata(); assert.equal(smaller.width, fallback.width); assert.equal(smaller.height, fallback.height);
      assert.ok(smaller.width < asset.width && smaller.height < asset.height);
      if (asset.parts) {
        assert.equal(smaller.hasAlpha, true);
        for (const cell of Object.values(fallback.parts)) assert.ok(cell[0] >= 0 && cell[1] >= 0 && cell[2] <= smaller.width && cell[3] <= smaller.height);
      }
    }
    for (const character of SOUNDKEYS_CAST[band]) {
      const id = `${character}-keyboard-actions-v1`, asset = SOUNDKEYS_ART[id]; assert.ok(asset, id);
      assert.equal(asset.frames.length, 16); assert.equal(asset.contactFrames.length, 8);
      const original = await readFile(new URL(asset.source, root)); assert.equal(sha(original), asset.sourceSha256);
      const delivered = await readFile(new URL('public' + asset.runtime, root)); assert.equal(sha(delivered), asset.runtimeSha256);
      const { data, info } = await sharp(delivered).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      assert.equal(info.width, asset.width); assert.equal(info.height, asset.height);
      for (const [index, frame] of asset.contactFrames.entries()) {
        const contacts = Object.values(asset.frames[frame].sockets); assert.equal(contacts.length, 1);
        const point = contacts[0]; assert.ok(data[(point[1] * info.width + point[0]) * info.channels + 3] >= 192, `${character}/${frame} real decoded limb`);
        for (const mirror of [false, true]) assert.ok(soundKeysKeyContactPose(bank, character, frame, { x: 18 + index * 68, y: 254 }, 112, mirror).separation < 1e-10);
      }
      if (band) {
        assert.equal(asset.packing.method, 'original-connected-body-pixel-assembly');
        assert.equal(asset.packing.originalOpaqueBodyPixelsPreserved, true);
        assert.equal(asset.packing.isolatedCells, true);
        for (const proof of asset.packing.frames) {
          assert.ok(proof.bodyOpaquePixels > 1000);
          const frame = asset.frames[proof.id];
          assert.ok(frame.cell[0] >= (proof.id % 4) * 384 && frame.cell[2] <= (proof.id % 4 + 1) * 384);
          assert.ok(frame.cell[1] >= Math.floor(proof.id / 4) * 384 && frame.cell[3] <= (Math.floor(proof.id / 4) + 1) * 384);
        }
      }
      const fallback = SOUNDKEYS_ART[`${character}-keyboard-fallback-v1`]; assert.ok(fallback, character);
      assert.equal(fallback.frames.length, 1); assert.equal(fallback.originalFrame, 0);
      assert.equal(sha(await readFile(new URL('public' + fallback.runtime, root))), fallback.runtimeSha256);
    }
  }
});

test('every authored finale body fits its separate phone/short region without hiding another performer', () => {
  for (const cast of SOUNDKEYS_CAST) {
    for (const [x, width, y, height] of [[8, (304-8*(cast.length-1))/cast.length, 216, 180], [220, (92-4*(cast.length-1))/cast.length, 74, 64]]) {
      for (const [index, character] of cast.entries()) for (const frame of [0, 13, 14]) {
        const region = { x: x + index * (width+8), y, width, height };
        const pose = soundKeysRestingPose(bank, character, frame, region, 148, index === 0);
        assert.ok(pose.bounds.x >= region.x-1e-8 && pose.bounds.x+pose.bounds.width <= region.x+width+1e-8);
        assert.ok(pose.bounds.y >= region.y-1e-8 && pose.bounds.y+pose.bounds.height <= region.y+height+1e-8);
      }
    }
  }
});
