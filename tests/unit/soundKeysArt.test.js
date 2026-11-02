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
const currentManifest = async () => JSON.parse(await readFile(new URL('source-art/arcade/physical-worlds/soundkeys/scene-kit-clean-cartoon.json', root)));

test('current SoundKeys source and fallback registration preserve exact sealed lineage and canonical delivery identities', async () => {
  const manifest = await currentManifest();
  const historicalBytes = await readFile(new URL(manifest.historicalManifest.path, root));
  assert.equal(sha(historicalBytes), manifest.historicalManifest.sha256);
  assert.equal(sha(await readFile(new URL(manifest.historicalRegistration.path, root))), manifest.historicalRegistration.sha256);
  const registrationBytes = await readFile(new URL(manifest.registration.path, root));
  assert.equal(sha(registrationBytes), manifest.registration.sha256);
  const registration = JSON.parse(registrationBytes).currentSources, historical = JSON.parse(historicalBytes).assets;
  const venueIds = new Set(['meadow', 'dino', 'moonwood'].flatMap(world => [`${world}-keyboard-venue-v1`, `${world}-keyboard-venue-fallback-v1`]));
  for (const [name, asset] of Object.entries(manifest.assets).filter(([, row]) => row.productionRevision)) {
    assert.deepEqual(asset.supersedes, historical[name]);
    assert.equal(asset.runtime, historical[name].runtime, 'current source never renames a canonical delivery or fallback');
    assert.equal(sha(await readFile(new URL(asset.source, root))), asset.sourceSha256, name + ' current input');
    assert.equal(sha(await readFile(new URL(asset.prompt, root))), asset.promptSha256, name + ' retained prompt');
    const delivered = await readFile(new URL('public' + asset.runtime, root)), dimensions = await sharp(delivered).metadata();
    assert.equal(sha(delivered), asset.runtimeSha256, name + ' exact delivery');
    assert.equal(delivered.length, asset.runtimeBytes);
    assert.deepEqual([dimensions.width, dimensions.height], [asset.width, asset.height], name + ' measured current size');
    if (venueIds.has(name)) continue; // Independently sealed venue receipts and exact encoder contracts are checked below.
    assert.ok(registration[name], name + ' must have current body/part registration');
    for (const key of ['source', 'sourceSha256', 'parts', 'frames', 'pixelsPerUnit', 'deliveryRecipe']) {
      assert.deepEqual(asset[key] ?? null, registration[name][key] ?? null, name + '/' + key);
    }
  }
  assert.deepEqual(Object.keys(registration).sort(), Object.entries(manifest.assets).filter(([name, asset]) => asset.productionRevision && !venueIds.has(name)).map(([name]) => name).sort());
  for (const [name, asset] of Object.entries(manifest.assets)) {
    const browserMetadata = Object.fromEntries(Object.entries(asset).filter(([key]) => !['packing', 'generation', 'supersedes'].includes(key)));
    assert.deepEqual(SOUNDKEYS_ART[name], browserMetadata, name + ' exact runtime registration without author-only evidence');
  }
  assert.doesNotMatch(JSON.stringify(SOUNDKEYS_ART), /\/Users\/|Literacy(?:\s+)?Path/);
});

test('three accepted venue receipts retain exact primary and encoded-primary fallback lineage and Sharp recipes', async () => {
  const manifest = await currentManifest();
  for (const world of ['meadow', 'dino', 'moonwood']) {
    const primary = manifest.assets[`${world}-keyboard-venue-v1`], fallback = manifest.assets[`${world}-keyboard-venue-fallback-v1`];
    const receiptBytes = await readFile(new URL(primary.generation.receipt, root));
    assert.equal(sha(receiptBytes), primary.generation.receiptSha256);
    const receipt = JSON.parse(receiptBytes);
    assert.equal(primary.sourceSha256, receipt.nativeSha256);
    assert.equal(primary.runtimeSha256, receipt.finalSha256);
    assert.equal(primary.promptSha256, receipt.promptSha256);
    assert.equal(primary.generation.acceptedAttempt, receipt.attempt);
    assert.deepEqual([primary.width, primary.height], [receipt.dimensions.width, receipt.dimensions.height]);
    assert.deepEqual(primary.encoding, { tool: 'sharp', quality: 92, alphaQuality: 100, effort: 6, resize: { width: primary.width, height: primary.height, fit: 'fill' } });
    const native = await readFile(new URL(primary.source, root));
    const primaryBytes = await sharp(native).resize(primary.width, primary.height, { fit: 'fill' }).webp({ quality: 92, alphaQuality: 100, effort: 6 }).toBuffer();
    assert.equal(sha(primaryBytes), primary.runtimeSha256, world + ' exact accepted primary encoder');
    assert.equal(fallback.source, 'public' + primary.runtime);
    assert.equal(fallback.sourceSha256, primary.runtimeSha256, 'fallback input is the accepted encoded primary');
    assert.equal(fallback.deliveryRecipe.acceptedNativeSource, primary.source);
    assert.equal(fallback.deliveryRecipe.acceptedNativeSha256, primary.sourceSha256);
    assert.equal(fallback.deliveryRecipe.actualInput, fallback.source);
    assert.equal(fallback.deliveryRecipe.actualInputSha256, fallback.sourceSha256);
    assert.deepEqual(fallback.deliveryRecipe.resize, { width: 768, height: 432, fit: 'inside' });
    assert.deepEqual(fallback.encoding, { tool: 'sharp', format: 'webp', quality: 90, alphaQuality: 100, effort: 6 });
    const fallbackBytes = await sharp(primaryBytes).resize(768, 432, { fit: 'inside' }).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toBuffer();
    assert.equal(sha(fallbackBytes), fallback.runtimeSha256, world + ' exact accepted fallback encoder');
    const decoded = await sharp(fallbackBytes).metadata();
    assert.deepEqual([decoded.width, decoded.height], [fallback.width, fallback.height]);
  }
});

test('all three eight-word bands own original venue, physical kit, canonical bodies and registered pressing contacts', async () => {
  const manifest = await currentManifest();
  for (const [band, world] of ['meadow', 'dino', 'moonwood'].entries()) {
    for (const id of [`${world}-keyboard-venue-v1`, band === 0 ? 'instrument-kit-v1' : `${world}-instrument-kit-v1`]) {
      const asset = SOUNDKEYS_ART[id]; assert.ok(asset, id);
      const delivered = await readFile(new URL('public' + asset.runtime, root));
      assert.equal(sha(delivered), asset.runtimeSha256);
      const shape = await sharp(delivered).metadata(); assert.equal(shape.width, asset.width); assert.equal(shape.height, asset.height);
      if (asset.parts) for (const name of ['goldBar', 'blueBar', 'woodenFrame', 'bellResonator', 'reedResonator', 'frontFascia']) assert.ok(asset.parts[name]);
      const fallback = SOUNDKEYS_ART[id.replace('-v1', '-fallback-v1')]; assert.ok(fallback);
      assert.equal(fallback.sourceSha256, id.includes('-keyboard-venue-') ? asset.runtimeSha256 : asset.sourceSha256);
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
        const packing = manifest.assets[id].packing;
        assert.equal(packing.method, asset.productionRevision ? 'current-connected-body-proportional-registration' : 'original-connected-body-pixel-assembly');
        if (asset.productionRevision) assert.equal(packing.wholeGeneratedBodiesRetained, true);
        else assert.equal(packing.originalOpaqueBodyPixelsPreserved, true);
        assert.equal(packing.isolatedCells, true);
        for (const proof of packing.frames) {
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
