import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { SOUND_RACER_SCENE_KIT as kit, getSoundRacerAssetUrls } from '../../src/features/soundRacer/sceneKit.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../public');
const digest = (data) => createHash('sha256').update(data).digest('hex');
function parseGlb(asset) {
  const bytes = readFileSync(resolve(root, `.${asset.url}`));
  assert.equal(bytes.length, asset.bytes);
  assert.equal(digest(bytes), asset.sha256);
  assert.equal(bytes.readUInt32LE(0), 0x46546c67);
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  const jsonLength = bytes.readUInt32LE(12);
  assert.equal(jsonLength % 4, 0);
  assert.equal(bytes.readUInt32LE(16), 0x4e4f534a);
  const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
  const offset = 20 + jsonLength;
  assert.equal(bytes.readUInt32LE(offset + 4), 0x004e4942);
  assert.equal(bytes.readUInt32LE(offset) + offset + 8, bytes.length);
  const binary = bytes.subarray(offset + 8);
  assert.ok(binary.length >= gltf.buffers[0].byteLength);
  assert.ok(binary.length - gltf.buffers[0].byteLength < 4);
  assert.equal(gltf.buffers[0].uri, undefined);
  return { gltf, binary };
}
function positions(gltf, binary, index) {
  const accessor = gltf.accessors[index];
  const view = gltf.bufferViews[accessor.bufferView];
  assert.equal(accessor.componentType, 5126);
  assert.equal(accessor.type, 'VEC3');
  const start = (view.byteOffset || 0) + (accessor.byteOffset || 0);
  const stride = view.byteStride || 12;
  assert.ok(start + (accessor.count - 1) * stride + 12 <= binary.length);
  return Array.from({ length: accessor.count }, (_, i) => [0, 1, 2].map((axis) => binary.readFloatLE(start + i * stride + axis * 4)));
}
function meshBounds(gltf, binary) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  const visited = new Set();
  const walk = (index, parent) => {
    assert.ok(!visited.has(index), 'tree has no shared/cyclic transform nodes');
    visited.add(index);
    const node = gltf.nodes[index];
    assert.equal(node.matrix, undefined);
    assert.equal(node.rotation, undefined);
    assert.equal(node.scale, undefined);
    const location = parent.map((v, axis) => v + (node.translation?.[axis] || 0));
    if (node.mesh !== undefined) for (const primitive of gltf.meshes[node.mesh].primitives) {
      for (const point of positions(gltf, binary, primitive.attributes.POSITION)) {
        for (let axis = 0; axis < 3; axis += 1) {
          assert.ok(Number.isFinite(point[axis]));
          min[axis] = Math.min(min[axis], point[axis] + location[axis]);
          max[axis] = Math.max(max[axis], point[axis] + location[axis]);
        }
      }
      const indices = gltf.accessors[primitive.indices];
      assert.ok(indices.count > 0 && indices.count % 3 === 0);
      const indexView = gltf.bufferViews[indices.bufferView];
      const byteSize = { 5121: 1, 5123: 2, 5125: 4 }[indices.componentType];
      assert.ok(byteSize);
      const indexStart = (indexView.byteOffset || 0) + (indices.byteOffset || 0);
      const vertexCount = gltf.accessors[primitive.attributes.POSITION].count;
      for (let i = 0; i < indices.count; i += 1) {
        assert.ok(binary.readUIntLE(indexStart + i * byteSize, byteSize) < vertexCount, 'triangle index references a real vertex');
      }
      for (const accessorIndex of Object.values(primitive.attributes)) {
        const accessor = gltf.accessors[accessorIndex];
        assert.equal(accessor.count, vertexCount, 'UVs and normals cover all vertices');
        const view = gltf.bufferViews[accessor.bufferView];
        assert.ok((view.byteOffset || 0) + view.byteLength <= binary.length);
      }
    }
    for (const child of node.children || []) walk(child, location);
  };
  for (const index of gltf.scenes[gltf.scene].nodes) walk(index, [0, 0, 0]);
  assert.equal(visited.size, gltf.nodes.length, 'no disconnected placeholder nodes');
  return { min, max };
}

test('all eleven deployed models contain valid geometry, contact bounds and shared atlas dependencies', () => {
  assert.equal(getSoundRacerAssetUrls().length, 11);
  for (const [role, asset] of Object.entries(kit.assets)) {
    const { gltf, binary } = parseGlb(asset);
    const bounds = meshBounds(gltf, binary);
    for (const side of ['min', 'max']) for (let axis = 0; axis < 3; axis += 1) {
      assert.ok(Math.abs(bounds[side][axis] - asset.bounds[side][axis]) < 1e-6, `${role} ${side} ${axis}`);
    }
    assert.ok(Math.abs(bounds.min[1]) < 1e-6, `${role} rests at ground`);
    assert.ok(Math.abs(bounds.max[1] * asset.scale - asset.height) < 1e-6);
    assert.equal(gltf.images.length, 1);
    const imagePath = resolve(dirname(resolve(root, `.${asset.url}`)), gltf.images[0].uri);
    const atlas = kit.atlases[asset.atlasId];
    assert.equal(imagePath, resolve(root, `.${atlas.url}`));
    assert.equal(digest(readFileSync(imagePath)), atlas.sha256);
    assert.equal(gltf.materials[0].pbrMetallicRoughness.baseColorTexture.index, 0);
    assert.ok(!asset.url.includes('/library/'));
  }
});

test('front steering and wheel rolling have separate transforms independent of chassis lean', () => {
  for (const role of ['hero', 'rival']) {
    const asset = kit.assets[role];
    const { gltf, binary } = parseGlb(asset);
    const rootNode = gltf.nodes[gltf.scenes[0].nodes[0]];
    const chassis = gltf.nodes.findIndex(({ name }) => name === asset.chassisNode);
    assert.ok(rootNode.children.includes(chassis));
    assert.equal(gltf.nodes[chassis].children, undefined);
    assert.equal(asset.wheels.length, 4);
    for (const wheel of asset.wheels) {
      const steer = gltf.nodes.findIndex(({ name }) => name === wheel.steerNode);
      const roll = gltf.nodes.findIndex(({ name }) => name === wheel.rollNode);
      const mesh = gltf.nodes.findIndex(({ name }) => name === wheel.meshNode);
      assert.ok(rootNode.children.includes(steer));
      assert.deepEqual(gltf.nodes[steer].children, [roll]);
      assert.deepEqual(gltf.nodes[roll].children, [mesh]);
      assert.equal(gltf.nodes[mesh].translation, undefined);
      assert.equal(wheel.steers, wheel.position.startsWith('front'));
      assert.equal(wheel.axle, 'x');
      assert.equal(wheel.steerAxis, 'y');
      const points = positions(gltf, binary, gltf.meshes[gltf.nodes[mesh].mesh].primitives[0].attributes.POSITION);
      const minY = Math.min(...points.map((p) => p[1]));
      const maxY = Math.max(...points.map((p) => p[1]));
      assert.ok(Math.abs((maxY - minY) / 2 - wheel.radius) < 1e-7);
      assert.ok(Math.abs(gltf.nodes[steer].translation[1] + minY) < 1e-6);
      assert.equal(Math.sign(gltf.nodes[steer].translation[2]), wheel.steers ? 1 : -1);
    }
  }
});

test('closure is exact and source rights/revisions/dependency fingerprints are retained', () => {
  assert.deepEqual(Object.keys(kit.atlases), ['city', 'medieval']);
  assert.equal(kit.modelBytes, Object.values(kit.assets).reduce((n, a) => n + a.bytes, 0));
  assert.equal(kit.textureBytes, Object.values(kit.atlases).reduce((n, a) => n + a.bytes, 0));
  assert.equal(kit.closureBytes, kit.modelBytes + kit.textureBytes);
  for (const asset of Object.values(kit.assets)) {
    assert.equal(asset.source.license, 'CC0-1.0');
    assert.match(asset.source.revision, /^[a-f0-9]{40}$/);
    assert.equal(asset.source.dependencies.length, 3);
    for (const dep of asset.source.dependencies) {
      assert.match(dep.sha256, /^[a-f0-9]{64}$/);
      assert.match(dep.gitBlobSha, /^[a-f0-9]{40}$/);
      assert.ok(dep.upstreamPath.endsWith(dep.path.split('/').at(-1)));
    }
    assert.match(asset.modifications, /ground-contact/);
  }
  for (const pack of Object.values(kit.packs)) {
    const distributedBytes = readFileSync(resolve(root, `.${pack.licenseUrl}`));
    const license = distributedBytes.toString('utf8');
    assert.equal(digest(distributedBytes), pack.licenseSha256, 'distributed licence matches its own receipt');
    assert.match(pack.upstreamLicenseSha256, /^[a-f0-9]{64}$/, 'pinned upstream receipt is retained separately');
    if (pack.licenseModifications === 'none') {
      assert.equal(pack.licenseSha256, pack.upstreamLicenseSha256);
    } else {
      assert.equal(pack.licenseModifications, 'Trimmed trailing line whitespace and added final newline; licence wording unchanged.');
      assert.equal(license, `${license.trimEnd().split('\n').map(line => line.trimEnd()).join('\n')}\n`);
    }
    assert.match(license, /CC0/i);
    assert.match(license, /Kay/i);
  }
  assert.equal(kit.driver.image, '/images/companions/muddy.webp');
  assert.ok(existsSync(resolve(root, `.${kit.driver.image}`)));
});
