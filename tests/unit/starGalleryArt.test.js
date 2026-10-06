import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { registeredPalCanvasPose } from '../../src/components/learn/games/shared/registeredPalArt.js';

const directory = 'source-art/arcade/physical-worlds/star-gallery';
const manifest = JSON.parse(await fs.readFile(`${directory}/manifest.json`, 'utf8'));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const alpha = (data, info, [x, y]) => data[(Math.round(y) * info.width + Math.round(x)) * 4 + 3];

test('all three rear driver action families attach actual visible hands to their seat point without inventing hidden feet', async () => {
  for (const id of ['bouncy-driver', 'chompy-driver', 'pip-driver']) {
    const asset = manifest.assets.find(row => row.id === id), bytes = await fs.readFile(asset.source);
    assert.equal(hash(bytes), asset.sourceSha256);
    const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual([info.width, info.height], asset.sourceSize);
    assert.equal(data[3], 0);
    assert.deepEqual(asset.frames.map(frame => frame.action), ['ready', 'steer-left', 'steer-right', 'lever-anticipation', 'lever-contact', 'recover']);
    for (const frame of asset.frames) {
      assert.deepEqual(Object.keys(frame.sockets), ['seat', 'leftHand', 'rightHand']);
      for (const [name, point] of Object.entries(frame.sockets)) assert.ok(alpha(data, info, point) >= 160, `${frame.id}/${name} is actual original source anatomy`);
      const atlas = { width: info.width, height: info.height, pixelsPerUnit: asset.pixelsPerUnit, nominalHeight: asset.nominalHeight };
      const pose = registeredPalCanvasPose(atlas, frame, { x: 180, y: 220, unitScale: 100 });
      assert.deepEqual(pose.sockets.seat, { x: 180, y: 220 }, 'Changing a pose preserves the actual rover attachment');
      const mirrored = registeredPalCanvasPose(atlas, frame, { x: 180, y: 220, unitScale: 100, mirror: true });
      assert.deepEqual(mirrored.sockets.seat, { x: 180, y: 220 });
      assert.ok(Math.abs(mirrored.sockets.rightHand.x + pose.sockets.rightHand.x - 360) < 1e-8, 'The live lever socket mirrors with its drawn hand');
    }
  }
  assert.equal(manifest.assets.find(row => row.id === 'pip-driver').nominalHeight, 1.55, 'Visible upper body is independently registered, not stretched to full standing height');
});

test('the Grove tree, cut stump, regrowth and flowers retain complete semantic alpha regions and real bark/root contacts in all themes', async () => {
  for (const id of ['meadow-grove-kit', 'dino-grove-kit', 'moonwood-grove-kit']) {
    const asset = manifest.assets.find(row => row.id === id), bytes = await fs.readFile(asset.source);
    assert.equal(hash(bytes), asset.sourceSha256);
    const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual(asset.frames.map(frame => frame.action), ['tree', 'stump', 'sapling', 'flower-bed']);
    for (const frame of asset.frames) {
      const [left, top, right, bottom] = frame.cell;
      const [x, y, width, height] = frame.measurement.semanticRegion;
      assert.ok(left >= x && top >= y && right <= x + width && bottom <= y + height);
      for (const [name, point] of Object.entries(frame.sockets)) assert.ok(alpha(data, info, point) >= 160, `${frame.id}/${name} is visible source geometry`);
      for (let row = y; row < y + height; row++) for (let column = x; column < x + width; column++) {
        if (alpha(data, info, [column, row]) >= 8) assert.ok(column >= left && column < right && row >= top && row < bottom, `${frame.id}: no semantic leaf/root/flower pixel is clipped`);
      }
    }
    const tree = asset.frames[0];
    assert.ok(tree.cell[3] > info.height / 2, 'The tall original tree continues below a fixed contact-sheet quadrant');
    assert.deepEqual(Object.keys(tree.sockets), ['ground', 'cut']);
  }
});

test('the live Grove atlas metadata retains measured source registration and declares no delivery from a planned URL', async () => {
  const { STAR_GALLERY_ATLASES } = await import('../../src/components/learn/games/games/starGalleryArt.generated.js');
  assert.deepEqual(Object.keys(STAR_GALLERY_ATLASES), manifest.assets.map(asset => asset.id));
  for (const asset of manifest.assets) {
    const atlas = STAR_GALLERY_ATLASES[asset.id];
    const kind = asset.kind.startsWith('authored-tree-') ? 'scenery' : 'characters';
    const basename = asset.source.split('/').at(-1).replace(/\.png$/, '.webp');
    assert.deepEqual(Object.keys(atlas), ['width', 'height', 'nominalHeight', 'pixelsPerUnit', 'runtime', 'frames']);
    assert.deepEqual([atlas.width, atlas.height], asset.sourceSize);
    assert.equal(atlas.nominalHeight, asset.nominalHeight);
    assert.equal(atlas.pixelsPerUnit, asset.pixelsPerUnit);
    assert.equal(atlas.runtime, `/game-assets/physical-arcade/star-gallery/${kind}/${basename}`);
    assert.deepEqual(atlas.frames, asset.frames.map(({ id, action, direction, cell, anchor, sockets }) =>
      ({ id, action, direction, cell, anchor, sockets })));
    for (const frame of atlas.frames) {
      const point = frame.sockets.seat || frame.sockets.ground;
      const pose = registeredPalCanvasPose(atlas, frame, { x: 83, y: 167, unitScale: 72 });
      const socket = frame.sockets.seat ? 'seat' : 'ground';
      assert.ok(point, `${frame.id}: a real source attachment is required`);
      assert.deepEqual(pose.sockets[socket], { x: 83, y: 167 }, `${frame.id}: runtime attachment must use the same registered source contact`);
    }
  }
});

test('actual Grove derivatives preserve every alpha pixel and visible seat, palm, root and bark registration', async () => {
  assert.equal(manifest.assets.length, 6);
  for (const asset of manifest.assets) {
    assert.ok(asset.runtime?.startsWith('/game-assets/physical-arcade/star-gallery/'), `${asset.id}: planned metadata is insufficient`);
    const source = await fs.readFile(asset.source), output = await fs.readFile(`public${asset.runtime}`);
    assert.equal(hash(source), asset.sourceSha256);
    assert.equal(hash(output), asset.runtimeSha256);
    assert.equal(output.length, asset.runtimeBytes);
    const original = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const delivered = await sharp(output).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual([delivered.info.width, delivered.info.height], asset.sourceSize);
    assert.deepEqual(asset.runtimeSize, asset.sourceSize);
    const originalAlpha = Buffer.alloc(original.info.width * original.info.height);
    const deliveredAlpha = Buffer.alloc(originalAlpha.length);
    for (let pixel = 0; pixel < originalAlpha.length; pixel++) {
      originalAlpha[pixel] = original.data[pixel * 4 + 3];
      deliveredAlpha[pixel] = delivered.data[pixel * 4 + 3];
    }
    assert.deepEqual(deliveredAlpha, originalAlpha, `${asset.id}: full source silhouette remains exact; RGB is declared q90`);
    for (const frame of asset.frames) for (const [name, point] of Object.entries(frame.sockets)) {
      assert.ok(alpha(delivered.data, delivered.info, point) >= 160, `${frame.id}/${name}: encoded source contact remains opaque`);
    }
  }
  assert.equal(manifest.review.humanApproval, 'UNKNOWN');
  assert.equal(manifest.review.physicalDeviceObservation, 'UNKNOWN');
});
