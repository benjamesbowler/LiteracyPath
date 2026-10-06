import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { STAR_GALLERY_ATLASES } from '../../src/components/learn/games/games/starGalleryArt.generated.js';
import { createSentenceGroveAuthoredWorld } from '../../src/components/learn/games/games/starGalleryAuthoredWorld.js';

async function retainedRover() {
  const bytes = await fs.readFile('public/game-assets/arcade-worlds/garden-rover.glb');
  const gltf = await new Promise((resolve, reject) => new GLTFLoader().parse(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '', resolve, reject));
  const vehicle = new THREE.Group(); vehicle.add(gltf.scene);
  vehicle.position.set(12, .1, -8); vehicle.rotation.y = 1.25;
  return vehicle;
}

async function withDelivery(world, failedKind, run, { pendingDriver = false } = {}) {
  const previous = globalThis.Image, priorDocument = globalThis.document;
  const drawContext = new Proxy({}, { get: (value, key) => key in value ? value[key] : () => {} });
  globalThis.document = { createElement: () => ({ getContext: () => drawContext }) };
  let pending;
  const atlases = Object.fromEntries(Object.entries(STAR_GALLERY_ATLASES).map(([id, atlas]) =>
    [id, { ...atlas, runtime: `/unit-grove-cutter-${failedKind}-${world}/${id}.webp` }]));
  const byUrl = new Map(Object.entries(atlases).map(([id, atlas]) => [atlas.runtime, { id, atlas }]));
  globalThis.Image = class {
    set src(value) {
      const { id, atlas } = byUrl.get(value);
      this.naturalWidth = atlas.width; this.naturalHeight = atlas.height;
      if (pendingDriver && id.endsWith('driver')) pending = this;
      else queueMicrotask(() => (id.endsWith(failedKind) ? this.onerror : this.onload)?.());
    }
    async decode() {}
  };
  let owner;
  try {
    const vehicle = await retainedRover();
    const camera = new THREE.PerspectiveCamera(); camera.position.set(15, 8, 12);
    camera.lookAt(vehicle.position); camera.updateMatrixWorld(true);
    owner = createSentenceGroveAuthoredWorld(THREE, { world, atlases });
    assert.equal(owner.attachRover(vehicle), true);
    await owner.ready; await new Promise(resolve => setImmediate(resolve));
    const group = new THREE.Group(); group.position.set(14, 0, -9); group.rotation.y = -.7;
    const cutMark = new THREE.Mesh(new THREE.SphereGeometry(.08), new THREE.MeshBasicMaterial());
    cutMark.position.set(.12, 1.1, .16); group.add(cutMark);
    const token = { group, cutMark, treeFallback: [cutMark] };
    owner.attachTree(token);
    await run({ owner, vehicle, camera, token, failDriver: async () => { pending.onerror(); await new Promise(resolve => setImmediate(resolve)); } });
    cutMark.geometry.dispose(); cutMark.material.dispose();
  } finally { owner?.dispose(); globalThis.Image = previous; globalThis.document = priorDocument; }
}

for (const world of ['meadow', 'dino', 'moonwood']) {
  test(`${world} retained rover carries the real cutter to registered bark when its driver atlas fails`, async () => {
    await withDelivery(world, 'driver', ({ owner, vehicle, camera, token }) => {
      owner.setRetainedRoverDelivery('delivered');
      const state = { cutterRemaining: .16, steerVisual: .3, paused: false, ended: false };
      owner.update(camera, state, 1 / 60);
      const bark = owner.treeCutContact(token);
      assert(bark, 'delivered kit supplies its measured bark socket');
      const position = vehicle.position.clone(), treePosition = token.group.position.clone();
      owner.beginCut(token); owner.update(camera, state, 1 / 60);
      const snapshot = owner.inspect();
      assert.equal(snapshot.driver.delivery, 'unavailable'); assert.equal(snapshot.kitDelivery, 'delivered');
      assert.equal(snapshot.retainedRoverDelivery, 'delivered');
      assert.equal(snapshot.fallbackDriver.character, { meadow: 'bouncy', dino: 'chompy', moonwood: 'pip' }[world]);
      assert.equal(snapshot.fallbackDriver.representation, 'procedural-art-unavailable');
      assert.equal(snapshot.retainedDriver.canonicalRecoveryVisible, true);
      assert.equal(snapshot.retainedDriver.hiddenOnlyAfterAuthoredDelivery, false);
      const oldDriver = []; vehicle.traverse(mesh => { if (mesh.isMesh && ['Skin', 'Hair', 'Tunic'].includes(mesh.material?.name)) oldDriver.push(mesh); });
      assert(oldDriver.length >= 3); assert(oldDriver.every(mesh => !mesh.visible), 'Only retained human meshes are hidden while the same physical rover remains');
      assert.equal(snapshot.cutter.delivered, true); assert.equal(snapshot.cutter.actualContact, true);
      assert.equal(vehicle.getObjectByName('grove-articulated-cutter').visible, true);
      assert(new THREE.Vector3(...snapshot.cutter.tip).distanceTo(bark) < 1e-8);
      const seat = new THREE.Vector3(...snapshot.physicalSeat.point);
      assert(new THREE.Vector3(...snapshot.cutter.mount).distanceTo(vehicle.localToWorld(seat.add(new THREE.Vector3(0, -.42, -.55)))) < 1e-8);
      assert.deepEqual(vehicle.position, position); assert.deepEqual(token.group.position, treePosition);
      assert.equal(snapshot.cutter.representation, 'physical-hinged-telescopic-cut-tool');
    });
  });

  test(`${world} delivered driver cuts the visible retained mark when its tree kit fails`, async () => {
    await withDelivery(world, 'kit', ({ owner, vehicle, camera, token }) => {
      owner.setRetainedRoverDelivery('delivered');
      const state = { cutterRemaining: .16, paused: false, ended: false };
      owner.update(camera, state, 1 / 60);
      assert.equal(owner.treeCutContact(token), null, 'missing kit cannot claim an authored bark socket');
      const actualMark = token.cutMark.getWorldPosition(new THREE.Vector3());
      owner.beginCut(token); owner.update(camera, state, 1 / 60);
      const snapshot = owner.inspect();
      assert.equal(snapshot.driver.delivery, 'delivered'); assert.equal(snapshot.kitDelivery, 'unavailable');
      assert.equal(token.cutMark.visible, true); assert.equal(snapshot.fallbackDriver, null);
      assert.equal(snapshot.cutter.delivered, true); assert.equal(snapshot.cutter.actualContact, true);
      assert(new THREE.Vector3(...snapshot.cutter.tip).distanceTo(actualMark) < 1e-8);
      const spin = vehicle.getObjectByName('actual-bark-contact-cutter').rotation.y;
      owner.update(camera, { ...state, paused: true }, 10);
      assert.equal(vehicle.getObjectByName('actual-bark-contact-cutter').rotation.y, spin);
      owner.update(camera, { ...state, cutterRemaining: 0 }, 1 / 60);
      assert.equal(owner.inspect().cutter.actualContact, false);
      assert.equal(owner.inspect().cutter.target, null);
    });
  });
}

test('pending canonical art is not reported as failure; genuine failed decode draws recovery at the same actual rover cushion and disposal retires its tool', async () => {
  await withDelivery('meadow', 'driver', async ({ owner, vehicle, camera, token, failDriver }) => {
    owner.setRetainedRoverDelivery('pending');
    const state = { cutterRemaining: .16, paused: false, ended: false };
    owner.beginCut(token); owner.update(camera, state, 1 / 60);
    assert.equal(owner.inspect().driver.delivery, 'pending');
    assert.equal(owner.inspect().fallbackDriver, null);
    assert.equal(owner.inspect().cutter.delivered, false);
    await failDriver(); owner.setRetainedRoverDelivery('delivered'); owner.update(camera, state, 1 / 60);
    const delivered = owner.inspect(); assert.equal(delivered.driver.delivery, 'unavailable');
    assert.equal(delivered.fallbackDriver.character, 'bouncy');
    const expectedSeat = vehicle.localToWorld(new THREE.Vector3(...delivered.physicalSeat.point));
    assert(new THREE.Vector3(...delivered.fallbackDriver.physicalSeat).distanceTo(expectedSeat) < 1e-8);
    assert.equal(delivered.cutter.delivered, true);
    owner.dispose(); owner.update(camera, state, 1 / 60);
    assert.equal(vehicle.getObjectByName('grove-articulated-cutter'), undefined);
  }, { pendingDriver: true });
});
