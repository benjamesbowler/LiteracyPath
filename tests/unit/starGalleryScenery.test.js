import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as THREE from 'three';
import { STAR_GALLERY_ATLASES } from '../../src/components/learn/games/games/starGalleryArt.generated.js';
import { GROVE_SCENERY_ASSETS } from '../../src/components/learn/games/games/starGallerySceneryData.js';
import { createGroveSceneryDetails, groveSceneryPlan } from '../../src/components/learn/games/games/starGalleryScenery.js';
import { groveAffineTexture, drawGroveTexturedTriangle } from '../../src/components/learn/games/games/starGallerySurfaceProjection.js';

const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
test('retained Grove surfaces preserve exact original/runtime identities and declared resize provenance', () => {
  const manifest = JSON.parse(fs.readFileSync('source-art/arcade/physical-worlds/star-gallery/scenery-manifest.json'));
  assert.equal(manifest.assets.length, 5);
  for (const asset of manifest.assets) {
    assert.equal(hash(asset.source), asset.sourceSha256);
    assert.equal(hash('public' + asset.runtime), asset.runtimeSha256);
    assert.equal(fs.statSync('public' + asset.runtime).size, asset.runtimeBytes);
    assert.equal(hash(asset.sourceManifest), asset.sourceManifestSha256);
    assert.deepEqual(GROVE_SCENERY_ASSETS[asset.id], { runtime: asset.runtime, width: asset.runtimeSize[0], height: asset.runtimeSize[1] });
  }
  assert.equal(manifest.runtimeAcceptance.humanApproval, 'UNKNOWN');
  assert.equal(manifest.runtimeAcceptance.physicalDeviceObservation, 'UNKNOWN');
});

function fixture(t) {
  const original = globalThis.Image, requests = [];
  const dimensions = new Map([...Object.values(GROVE_SCENERY_ASSETS), ...Object.values(STAR_GALLERY_ATLASES)].map(asset => [asset.runtime, asset]));
  globalThis.Image = class {
    set src(url) { const size = dimensions.get(url); assert(size); this.url = url; this.width = this.naturalWidth = size.width; this.height = this.naturalHeight = size.height; requests.push(this); }
    async decode() {}
  };
  t.after(() => { globalThis.Image = original; });
  const root = new THREE.Group(), ground = new THREE.Mesh(new THREE.PlaneGeometry(256, 196), new THREE.MeshBasicMaterial({ map: new THREE.Texture() }));
  const paths = new THREE.Group(), material = new THREE.MeshBasicMaterial({ map: new THREE.Texture() });
  paths.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material), new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
  root.add(ground, paths);
  t.after(() => { root.traverse(mesh => { mesh.geometry?.dispose(); mesh.material?.dispose(); }); });
  return { root, ground, paths, requests };
}

test('world-placed kit frames, retained maps and exact decoded delivery remain independent of all answers', async t => {
  const f = fixture(t), details = createGroveSceneryDetails(THREE, { ...f, world: 'meadow', atlases: STAR_GALLERY_ATLASES });
  t.after(() => details.dispose());
  const before = { ground: f.ground.position.toArray(), paths: f.paths.children.map(mesh => mesh.position.toArray()), childCount: f.paths.children.length };
  assert.deepEqual(details.inspect().delivery, { grass: 'pending', soil: 'pending', horizon: 'pending', kit: 'pending' });
  await Promise.all(f.requests.map(image => image.onload())); assert.equal(await details.ready, true);
  assert.equal(details.inspect().plantCount, 28); assert.equal(details.inspect().horizonCount, 4);
  assert.equal(details.inspect().collisionObjectsAdded, 0);
  assert.deepEqual(f.ground.position.toArray(), before.ground); assert.deepEqual(f.paths.children.map(mesh => mesh.position.toArray()), before.paths);
  assert.equal(f.paths.children.length, before.childCount); assert.equal(f.paths.children[0].material.map, f.paths.children[1].material.map);
  assert.equal(f.ground.material.map.image.url, GROVE_SCENERY_ASSETS['grass-albedo-v1'].runtime);
  const camera = new THREE.PerspectiveCamera(); camera.rotation.set(.2, .3, 0); camera.updateMatrixWorld(); details.update(camera);
  for (const world of ['meadow', 'dino', 'moonwood']) {
    const plan = groveSceneryPlan(world), kit = STAR_GALLERY_ATLASES[world + '-grove-kit'];
    assert.equal(plan.plants.length, 28);
    for (const plant of plan.plants) assert(kit.frames.some(frame => frame.action === plant.action));
  }
  const maps = new Set([f.ground.material.map, f.paths.children[0].material.map]);
  details.canvasAssets().group.traverse(mesh => { if (mesh.material?.map) maps.add(mesh.material.map); });
  let disposed = 0; for (const map of maps) map.addEventListener('dispose', () => disposed++);
  details.dispose(); details.dispose(); assert.equal(disposed, maps.size); assert.equal(f.ground.material.map, null);
  assert.equal(f.paths.children[0].material.map, null); assert.equal(details.canvasAssets(), null); assert.equal(f.root.children.length, 2);
});

test('one failed boundary image preserves delivered physical ground, trails and plants; late teardown does not resurrect them', async t => {
  const f = fixture(t), details = createGroveSceneryDetails(THREE, { ...f, world: 'dino', atlases: STAR_GALLERY_ATLASES });
  t.after(() => details.dispose());
  await Promise.all(f.requests.map(image => image.url.includes('horizon') ? image.onerror() : image.onload()));
  assert.equal(await details.ready, false); assert.equal(details.inspect().delivery.horizon, 'unavailable');
  assert.equal(details.inspect().delivery.grass, 'delivered'); assert.equal(details.inspect().plantCount, 28);
  assert.equal(details.inspect().horizonCount, 0); details.dispose();
  const next = createGroveSceneryDetails(THREE, { ...f, world: 'moonwood', atlases: STAR_GALLERY_ATLASES });
  const pending = f.requests.slice(-4).map(image => image.onload); next.dispose();
  await Promise.all(pending.map(fn => fn())); assert.equal(await next.ready, false);
  assert.equal(next.inspect().plantCount, 0); assert.equal(next.canvasAssets(), null); assert.equal(f.root.children.length, 2);
});

test('Canvas affine projection retains every measured UV vertex and rejects nonfinite/degenerate geometry', () => {
  const source = [{ x: 3, y: 8 }, { x: 103, y: 8 }, { x: 3, y: 208 }], destination = [{ x: 12, y: 17 }, { x: 92, y: 23 }, { x: 33, y: 80 }];
  const matrix = groveAffineTexture(source, destination);
  source.forEach((point, i) => {
    assert(Math.abs(matrix[0] * point.x + matrix[2] * point.y + matrix[4] - destination[i].x) < 1e-10);
    assert(Math.abs(matrix[1] * point.x + matrix[3] * point.y + matrix[5] - destination[i].y) < 1e-10);
  });
  assert.equal(groveAffineTexture([source[0], source[0], source[0]], destination), null);
  assert.equal(groveAffineTexture(source, [{ x: Infinity, y: 1 }, ...destination.slice(1)]), null);
  const calls = [], ctx = Object.fromEntries(['save', 'beginPath', 'lineTo', 'moveTo', 'closePath', 'clip', 'transform', 'drawImage', 'restore'].map(name => [name, (...args) => calls.push([name, ...args])]));
  assert.equal(drawGroveTexturedTriangle(ctx, {}, source, destination.map(point => ({ ...point, visible: false }))), false);
  assert.equal(calls.length, 0);
  assert.equal(drawGroveTexturedTriangle(ctx, {}, source, destination.map(point => ({ ...point, visible: true }))), true);
  assert.deepEqual(calls.find(call => call[0] === 'transform').slice(1), matrix);
});
