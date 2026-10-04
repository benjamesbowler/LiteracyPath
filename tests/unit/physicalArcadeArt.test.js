import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

test('every authored physical world has intact original sources and decodable same-origin delivery art', async () => {
  const registry = JSON.parse(readFileSync('source-art/arcade/physical-worlds/manifest.json', 'utf8'));
  let verified = 0;
  for (const game of registry.games) {
    const manifest = JSON.parse(readFileSync(game.sceneManifest, 'utf8'));
    assert.ok(manifest.assets.length >= 5, `${game.id} has its own complete scene kit`);
    for (const asset of manifest.assets) {
      const sourcePath = asset.source || asset.sourcePath;
      const runtimePath = asset.runtime || asset.runtimePath;
      assert.ok(sourcePath.startsWith(`source-art/arcade/physical-worlds/${game.id}/`));
      assert.match(runtimePath, /^(?:public)?\/game-assets\/physical-arcade\//);
      const source = readFileSync(sourcePath), runtime = readFileSync(runtimePath.startsWith('/') ? `public${runtimePath}` : runtimePath);
      assert.equal(createHash('sha256').update(source).digest('hex'), asset.sourceSha256 || asset.sourceSHA256, sourcePath);
      assert.equal(createHash('sha256').update(runtime).digest('hex'), asset.runtimeSha256 || asset.runtimeSHA256 || asset.sha256, runtimePath);
      assert.equal(runtime.length, asset.bytes);
      const expected = asset.size || [asset.width, asset.height];
      for (const [bytes, dimensions] of [[source, asset.sourceSize || expected], [runtime, expected]]) {
        const metadata = await sharp(bytes).metadata();
        assert.deepEqual([metadata.width, metadata.height], dimensions, runtimePath);
        const transparent = asset.alpha === true || typeof asset.alpha === 'object' || asset.alphaMin === 0;
        if (transparent) {
          assert.equal(metadata.hasAlpha, true, runtimePath);
          const { channels } = await sharp(bytes).stats();
          assert.ok(channels.at(-1).min <= 2 && channels.at(-1).max >= 200, `${runtimePath} retains transparent padding and visible authored objects`);
        }
      }
      verified++;
    }
  }
  assert.equal(verified, 19);
});
