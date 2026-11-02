import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { RALLY_PALS_WORLD_ART } from '../../src/utils/rallyPalsRules.js';

const manifestPath = 'source-art/arcade/physical-worlds/rally-pals/clean-cartoon-manifest.json';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

test('all three Rally scenery banks bind current clean alpha sources, exact provenance and whole-prop frames', async () => {
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  assert.equal(manifest.assets.length, 6);
  assert.ok(manifest.assets.reduce((sum, asset) => sum + asset.bytes, 0) < 5 * 1024 * 1024);
  for (const asset of manifest.assets) {
    const [source, runtime, prompt] = await Promise.all([fs.readFile(asset.nativeSaved), fs.readFile('public' + asset.path), fs.readFile(asset.promptFile)]);
    assert.equal(digest(source), asset.nativeSha256, asset.jobId);
    assert.equal(digest(prompt), asset.promptSha256, asset.jobId);
    assert.equal(digest(runtime), asset.outputSha256, asset.jobId);
    assert.equal(runtime.length, asset.bytes);
    assert.ok(prompt.toString().includes('TRUE ALPHA') || prompt.toString().includes('TRUE TRANSPARENT'), asset.jobId);
    for (const bytes of [source, runtime]) {
      const metadata = await sharp(bytes).metadata(), stats = await sharp(bytes).stats();
      assert.equal(metadata.hasAlpha, true);
      assert.equal(stats.channels[3].min, 0);
      assert.ok(stats.channels[3].max >= 254);
    }
    const metadata = await sharp(runtime).metadata();
    assert.equal(metadata.width, asset.width); assert.equal(metadata.height, asset.height);
    if (asset.frames) {
      const world = asset.path.match(/\/([a-z]+)-scenery-v1.webp$/)[1], art = RALLY_PALS_WORLD_ART[world];
      assert.equal(art.width, asset.width); assert.equal(art.height, asset.height);
      assert.equal(art.scenery, asset.path);
      assert.deepEqual(art.frames, asset.frames);
      assert.deepEqual(Object.keys(art.frames).sort(), ['club', 'crowd', 'flowers', 'tree']);
      for (const [key, [left, top, width, height]] of Object.entries(art.frames)) {
        assert.ok(left >= 0 && top >= 0 && width > 0 && height > 0 && left + width <= art.width && top + height <= art.height, `${world}:${key}`);
        const alpha = await sharp(runtime).extract({ left, top, width, height }).stats();
        assert.ok(alpha.channels[3].max >= 254 && alpha.channels[3].min === 0, `${world}:${key}`);
      }
    } else {
      const world = asset.path.match(/\/([a-z]+)-horizon-v1.webp$/)[1], art = RALLY_PALS_WORLD_ART[world];
      assert.equal(art.horizon, asset.path); assert.equal(art.horizonFoot, asset.horizonFoot);
      assert.equal(art.horizonHeight, asset.height);
    }
  }
});
