import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { RALLY_PALS_WORLD_ART } from '../../src/utils/rallyPalsRules.js';

const manifestPath = 'source-art/arcade/physical-worlds/rally-pals/manifest.json';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

test('all three Rally scenery banks retain original alpha sources, exact provenance and bounded frames', async () => {
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const prompts = JSON.parse(await fs.readFile(manifest.promptAuthority, 'utf8'));
  assert.equal(manifest.assets.length, 6);
  assert.equal(prompts.generator, 'built-in image_gen');
  assert.ok(manifest.assets.reduce((sum, asset) => sum + asset.bytes, 0) < 5 * 1024 * 1024);
  for (const asset of manifest.assets) {
    const [source, runtime] = await Promise.all([fs.readFile(asset.source), fs.readFile(asset.runtime)]);
    assert.equal(digest(source), asset.sourceSha256, asset.id);
    assert.equal(digest(runtime), asset.runtimeSha256, asset.id);
    assert.equal(runtime.length, asset.bytes);
    const prompt = prompts.requests.find(request => request.id === asset.id);
    assert.ok(prompt?.transparentBackground && prompt.prompt.length > 500, asset.id);
    for (const bytes of [source, runtime]) {
      const metadata = await sharp(bytes).metadata(), stats = await sharp(bytes).stats();
      assert.equal(metadata.width, asset.width);
      assert.equal(metadata.height, asset.height);
      assert.equal(metadata.hasAlpha, true);
      assert.equal(stats.channels[3].min, 0);
      assert.ok(stats.channels[3].max >= 254);
    }
    if (asset.id.includes('scenery')) {
      const world = asset.id.split('-')[0], art = RALLY_PALS_WORLD_ART[world];
      assert.equal(art.width, asset.width); assert.equal(art.height, asset.height);
      assert.deepEqual(Object.keys(art.frames).sort(), ['club', 'crowd', 'flowers', 'tree']);
      for (const [key, [left, top, width, height]] of Object.entries(art.frames)) {
        assert.ok(left >= 0 && top >= 0 && width > 0 && height > 0 && left + width <= art.width && top + height <= art.height, `${world}:${key}`);
        const alpha = await sharp(source).extract({ left, top, width, height }).stats();
        assert.ok(alpha.channels[3].max >= 254 && alpha.channels[3].min === 0, `${world}:${key}`);
      }
    }
  }
});
