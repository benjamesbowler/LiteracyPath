import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { REEL_READ_ART } from '../../src/components/learn/games/games/reelReadArtData.js';
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const manifest = JSON.parse(fs.readFileSync('source-art/arcade/physical-worlds/reel-read/scene-kit-clean-cartoon.json'));
const authorOnly = new Set(['packing', 'generation', 'supersedes']);

test('current Reel source authority retains sealed historical inputs and exact registered runtime projection', () => {
  for (const lineage of [manifest.historicalManifest, manifest.historicalRegistration, manifest.registration]) {
    assert.equal(digest(lineage.path), lineage.sha256);
  }
  assert.deepEqual(REEL_READ_ART, Object.fromEntries(Object.entries(manifest.assets).map(([id, asset]) =>
    [id, Object.fromEntries(Object.entries(asset).filter(([key]) => !authorOnly.has(key)))])));
  assert.ok(!JSON.stringify(REEL_READ_ART).includes('/Users/'));
  const registration = JSON.parse(fs.readFileSync(manifest.registration.path)).currentSources;
  for (const [id, spec] of Object.entries(registration)) {
    for (const [key, value] of Object.entries(spec)) assert.deepEqual(manifest.assets[id][key], value, `${id}/${key}`);
  }
});

test('current Reel complete bodies, real grips, independent tools and both derivative tiers match decoded pixels', async () => {
  for (const [id, asset] of Object.entries(manifest.assets)) {
    assert.equal(digest(asset.source), asset.sourceSha256, `${id} source`);
    assert.equal(digest(`public${asset.runtime}`), asset.runtimeSha256, `${id} delivery`);
    const { data, info } = await sharp(`public${asset.runtime}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual([info.width, info.height], [asset.width, asset.height]);
    const alpha = point => data[(Math.round(point[1]) * info.width + Math.round(point[0])) * 4 + 3];
    for (const frame of asset.frames || []) for (const point of Object.values(frame.sockets)) assert.ok(alpha(point) >= 192, `${id}/${frame.id} real hand`);
    for (const name of ['rodGrip', 'reelGrip', 'rodTip']) if (asset.parts?.[name]) assert.ok(alpha(asset.parts[name]) >= 192, `${id}/${name} actual tool`);
    if (!asset.generation?.packingRecipes) continue;
    const { data: native, info: ni } = await sharp(asset.generation.acceptedNativeSource).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(digest(asset.generation.acceptedNativeSource), asset.generation.acceptedNativeSHA);
    assert.equal(asset.generation.packingRecipes.length, id.includes('actions') ? 16 : 18);
    for (const recipe of asset.generation.packingRecipes) for (const point of Object.values(recipe.nativeAnatomicalContacts || {})) {
      assert.ok(native[(point[1] * ni.width + point[0]) * 4 + 3] >= 192, `${id}/${recipe.id} native visible grip`);
    }
    if (asset.frames) {
      assert.equal(asset.packing.wholeGeneratedBodiesRetained, true);
      for (const frame of asset.frames) {
        assert.equal(alpha([frame.cell[0] + frame.anchor[0], frame.cell[1] + frame.anchor[1]] ) >= 192, true);
        assert.ok(frame.bounds[0] >= 38 && frame.bounds[1] >= 38 && frame.bounds[2] <= 346 && frame.bounds[3] <= 346);
      }
    }
  }
});
