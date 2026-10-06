import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';

const directory = 'source-art/arcade/physical-worlds/sound-safari';
const manifest = JSON.parse(await fs.readFile(`${directory}/manifest.json`, 'utf8'));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const alpha = (data, info, [x, y]) => data[(Math.round(y) * info.width + Math.round(x)) * 4 + 3];

test('all three Safari action families use real opaque palms and two actual soles within independent source crops', async () => {
  for (const id of ['bouncy-operator-v1', 'chompy-operator', 'pip-operator']) {
    const asset = manifest.assets.find(row => row.id === id), bytes = await fs.readFile(asset.source);
    assert.equal(hash(bytes), asset.sourceSha256);
    const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual([info.width, info.height], asset.sourceSize);
    assert.equal(data[3], 0, 'A transparent corner is actual alpha, not a painted background');
    assert.deepEqual(asset.frames.map(frame => frame.action), ['anticipate', 'swing', 'catch', 'recover', 'follow-through', 'celebrate']);
    for (const frame of asset.frames) {
      const [left, top, right, bottom] = frame.cell;
      assert.ok(left >= 0 && top >= 0 && right <= info.width && bottom <= info.height);
      for (const name of ['nearHand', 'farHand', 'bootLeft', 'bootRight', 'feet']) {
        const point = frame.sockets[name];
        assert.ok(point[0] >= left && point[0] < right && point[1] >= top && point[1] < bottom, `${frame.id}/${name} is not clipped`);
        assert.ok(alpha(data, info, point) >= 160, `${frame.id}/${name} is visible original anatomy`);
      }
      assert.equal(frame.anchor[1] + top, Math.max(frame.sockets.bootLeft[1], frame.sockets.bootRight[1]), 'The physical baseline follows the actual lower sole');
    }
  }
});

test('Safari wildlife captures retain whole independent wings, tails and antennae without invented grounded contacts', () => {
  for (const id of ['meadow-critters', 'dino-critters', 'moonwood-critters']) {
    const asset = manifest.assets.find(row => row.id === id);
    assert.equal(asset.frames.length, 6);
    assert.equal(asset.sourceRegistration.foreignOpaqueCropPixels, 0);
    for (const species of asset.species) {
      assert.deepEqual(asset.frames.filter(frame => frame.species === species).map(frame => frame.action), ['idle', 'travel']);
    }
    for (const frame of asset.frames) {
      assert.deepEqual(Object.keys(frame.sockets), ['captureCenter']);
      const [left, top, right, bottom] = frame.measurement.opaqueBodyBounds;
      assert.ok(frame.cell[0] <= left && frame.cell[1] <= top && frame.cell[2] >= right && frame.cell[3] >= bottom);
      assert.deepEqual(frame.sockets.captureCenter, [(left + right) / 2, (top + bottom) / 2]);
    }
  }
});

test('live net capture geometry distinguishes the transparent capture centre from its actual opaque shaft connector', async () => {
  const asset = manifest.assets.find(row => row.id === 'nets-v2'), bytes = await fs.readFile(asset.source);
  assert.equal(hash(bytes), asset.sourceSha256);
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(asset.frames.length, 3);
  for (const frame of asset.frames) {
    assert.ok(alpha(data, info, frame.sockets.connector) >= 160);
    assert.ok(alpha(data, info, frame.sockets.captureCenter) <= 1, 'The net interior preserves a genuine mesh hole');
    assert.ok(frame.sockets.connector[1] - frame.sockets.captureCenter[1] > frame.captureRadius);
    assert.deepEqual(frame.anchor, [frame.sockets.captureCenter[0] - frame.cell[0], frame.sockets.captureCenter[1] - frame.cell[1]]);
  }
});

test('actual Safari derivatives retain registered dimensions, complete alpha silhouettes and measured tool/body contacts', async () => {
  assert.equal(manifest.assets.length, 10);
  for (const asset of manifest.assets) {
    assert.ok(asset.runtime?.startsWith('/game-assets/physical-arcade/sound-safari/'), `${asset.id}: planned metadata is insufficient`);
    const source = await fs.readFile(asset.source), output = await fs.readFile(`public${asset.runtime}`);
    assert.equal(hash(source), asset.sourceSha256);
    assert.equal(hash(output), asset.runtimeSha256);
    assert.equal(output.length, asset.runtimeBytes);
    const original = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const delivered = await sharp(output).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual([delivered.info.width, delivered.info.height], asset.sourceSize);
    assert.deepEqual(asset.runtimeSize, asset.sourceSize);
    if (asset.frames) {
      const originalAlpha = Buffer.alloc(original.info.width * original.info.height);
      const deliveredAlpha = Buffer.alloc(originalAlpha.length);
      for (let pixel = 0; pixel < originalAlpha.length; pixel++) {
        originalAlpha[pixel] = original.data[pixel * 4 + 3];
        deliveredAlpha[pixel] = delivered.data[pixel * 4 + 3];
      }
      assert.deepEqual(deliveredAlpha, originalAlpha, `${asset.id}: every silhouette/mesh alpha pixel remains exact; RGB is declared q90`);
      for (const frame of asset.frames) for (const [name, point] of Object.entries(frame.sockets)) {
        if (name !== 'captureCenter') assert.ok(alpha(delivered.data, delivered.info, point) >= 160, `${frame.id}/${name}: encoded contact is visible anatomy or tool`);
      }
    }
  }
  assert.equal(manifest.review.humanApproval, 'UNKNOWN');
  assert.equal(manifest.review.physicalDeviceObservation, 'UNKNOWN');
});

test('the Safari runtime table uses every real encoded source crop without converting file existence into delivery', async () => {
  const { SOUND_SAFARI_ATLASES, SOUND_SAFARI_HORIZONS, SOUND_SAFARI_HORIZON_SIZES } =
    await import('../../src/components/learn/games/games/soundSafariArt.generated.js');
  // Runtime lookups are keyed by asset identity; manifest authoring order and
  // compiler processing order need not coincide. Every per-frame order below
  // remains exact because it selects real action/source registration.
  assert.deepEqual(Object.keys(SOUND_SAFARI_ATLASES).sort(), manifest.assets.filter(asset => asset.frames).map(asset => asset.id).sort());
  for (const asset of manifest.assets) {
    if (!asset.frames) {
      assert.equal(SOUND_SAFARI_HORIZONS[asset.world], asset.runtime);
      assert.deepEqual(SOUND_SAFARI_HORIZON_SIZES[asset.world], asset.sourceSize);
      continue;
    }
    const atlas = SOUND_SAFARI_ATLASES[asset.id];
    assert.equal(atlas.runtime, asset.runtime);
    assert.deepEqual([atlas.width, atlas.height], asset.sourceSize);
    assert.equal(atlas.pixelsPerUnit, asset.pixelsPerUnit);
    assert.equal(atlas.nominalHeight, asset.nominalHeight);
    assert.deepEqual(atlas.frames, asset.frames.map(({ id, action, species, direction, cell, anchor, sockets, captureRadius }) =>
      ({ id, action, ...(species ? { species } : {}), ...(direction ? { direction } : {}), cell, anchor, sockets, ...(captureRadius ? { captureRadius } : {}) })));
    assert.equal('delivery' in atlas, false, 'Only the engine decode bank may report rendered asset availability');
  }
});
