import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { withRepairedImageVersion } from '../../src/utils/repairedImageVersion.js';
import { syncCleanCartoonBackgroundVersions } from '../../tools/syncCleanCartoonBackgroundVersions.mjs';
import { loadImage, getImage, imageState } from '../../src/features/soundSeekers/v3/render/sprites.js';
import { campaignPlayfieldLandscape } from '../../src/features/soundSeekers/rounded/campaignPlayfield.js';
const manifest = JSON.parse(fs.readFileSync('source-art/app-clean-cartoon/resumed-backgrounds/manifest.json'));

test('all current background transports bind exact delivered bytes and CSS has current revisions', async () => {
  assert.equal(manifest.assets.length, 21);
  for (const asset of manifest.assets) {
    const bytes = fs.readFileSync(`public${asset.path}`);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), asset.outputSha256);
    const versioned = withRepairedImageVersion(asset.path), url = new URL(versioned, 'https://literacy.guide');
    assert.equal(url.pathname, asset.path);
    assert.equal(url.searchParams.get('v'), asset.outputSha256.slice(0, 12));
    assert.equal(withRepairedImageVersion(versioned), versioned);
  }
  const css = await syncCleanCartoonBackgroundVersions();
  assert.equal(css.write, false); assert.deepEqual(css.changed, []); assert.equal(css.cssAssets, 13);
  assert.equal(campaignPlayfieldLandscape({ stageId: 'dino-01' }), '/game-assets/sound-seekers/v2/biomes/fossil-canyon/background.webp');
  assert.equal(campaignPlayfieldLandscape({ stageId: 'moonwood-01' }), '/game-assets/sound-seekers/v2/biomes/lantern-forest/background.webp');
});

test('v3 image loading keeps its canonical cache key while requesting the current transport URL', async t => {
  const previous = globalThis.Image, requests = [];
  t.after(() => { globalThis.Image = previous; });
  globalThis.Image = class { set src(value) { this.url = value; requests.push(this); } };
  const source = '/game-assets/sound-seekers/v3/backdrops/bg-dino-forge.webp';
  const first = loadImage(source), again = loadImage(source);
  assert.equal(first, again); assert.equal(requests.length, 1);
  assert.equal(requests[0].url, withRepairedImageVersion(source));
  assert.equal(imageState(source), 'loading'); requests[0].onload();
  assert.equal(await first, requests[0]); assert.equal(getImage(source), requests[0]); assert.equal(imageState(source), 'ready');
  assert.equal(requests.length, 1);
});
