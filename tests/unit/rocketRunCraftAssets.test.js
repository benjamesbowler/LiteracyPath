import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createRocketCraftAssets } from '../../src/components/learn/games/games/rocketRunCraftAssets.js';

const clips = ['cruise', 'bank_left', 'bank_right', 'boost', 'shield_recover', 'catch', 'celebrate'];
const records = { meadow: { url: '/game-assets/rocket-run/models/bouncy-spacecraft-v1.glb',
  capture: { socket: 'wordCaptureSocket' } } };
function fixture() {
  // An actual CPU skinned mesh exercises SkeletonUtils cloning and mixers.
  // This is deliberately not a claim that the final generated GLB renders.
  const hips = new THREE.Bone(); hips.name = 'hips';
  const receiver = new THREE.Bone(); receiver.name = 'wordCaptureSocket'; receiver.position.set(0, .54, -1.8);
  hips.add(receiver);
  const geometry = new THREE.BoxGeometry(1, 1, 1), count = geometry.attributes.position.count;
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(count * 4), 4));
  const weights = new Float32Array(count * 4); for (let index = 0; index < count; index++) weights[index * 4] = 1;
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
  const texture = new THREE.DataTexture(new Uint8Array(16), 2, 2);
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const mesh = new THREE.SkinnedMesh(geometry, material); mesh.add(hips);
  mesh.bind(new THREE.Skeleton([hips, receiver]));
  const scene = new THREE.Group(); scene.add(mesh);
  const gltf = { scene, animations: clips.map((name, index) => new THREE.AnimationClip(name, 1,
    [new THREE.VectorKeyframeTrack('hips.position', [0, 1], [0, 0, 0, index * .1, 0, 0])])) };
  const disposed = { geometry: 0, material: 0, texture: 0 };
  geometry.addEventListener('dispose', () => disposed.geometry++);
  material.addEventListener('dispose', () => disposed.material++);
  texture.addEventListener('dispose', () => disposed.texture++);
  return { gltf, geometry, material, mesh, receiver, texture, disposed };
}

test('leased spacecraft skins, bones, geometry and materials are independent, with shared ref-counted textures', async () => {
  const f = fixture(), cache = new Map(); let requests = 0;
  const loader = { loadAsync: async () => { requests++; return f.gltf; } };
  const firstBank = createRocketCraftAssets({ records, loader, cache });
  const secondBank = createRocketCraftAssets({ records, loader, cache });
  const first = await firstBank.load('meadow'), second = await secondBank.load('meadow');
  assert.equal(requests, 1);
  const firstMesh = first.root.children[0], secondMesh = second.root.children[0];
  assert.notEqual(firstMesh.skeleton, secondMesh.skeleton);
  assert.notEqual(firstMesh.skeleton.bones[0], f.mesh.skeleton.bones[0]);
  assert.notEqual(firstMesh.geometry, secondMesh.geometry); assert.notEqual(firstMesh.geometry, f.geometry);
  assert.notEqual(firstMesh.material, f.material); assert.equal(firstMesh.material.map, f.texture);
  assert.equal(first.play('catch', { blend: 0 }), true); first.update(.1);
  assert.notEqual(first.socket('wordCaptureSocket').x, second.socket('wordCaptureSocket').x);
  assert.equal(f.receiver.getWorldPosition(new THREE.Vector3()).x, 0);
  assert.equal(first.inspect().rendered, false); assert.equal(firstBank.inspect().delivery[0].status, 'loaded');
  first.markRendered(); assert.equal(firstBank.inspect().delivery[0].status, 'rendered');
  const snapshot = first.inspect(); snapshot.resources.meshes = 999;
  assert.equal(first.inspect().resources.meshes, 1);
  firstBank.dispose(); assert.equal(f.disposed.geometry, 0); assert.equal(f.disposed.texture, 0);
  secondBank.dispose(); assert.equal(f.disposed.geometry, 1); assert.equal(f.disposed.texture, 1);
  assert.equal(cache.size, 0); assert.equal(first.socket('wordCaptureSocket'), null);
});

test('identical material-mesh skins share one matrix owner only within their actor lease', async () => {
  const f = fixture();
  const second = new THREE.SkinnedMesh(f.geometry, f.material);
  second.bind(new THREE.Skeleton([...f.mesh.skeleton.bones], f.mesh.skeleton.boneInverses.map(matrix => matrix.clone())), f.mesh.bindMatrix.clone());
  f.gltf.scene.add(second);
  const bank = createRocketCraftAssets({ records, loader: { loadAsync: async () => f.gltf } });
  const one = await bank.load('meadow'), two = await bank.load('meadow');
  const oneMeshes = [], twoMeshes = [];
  one.root.traverse(node => { if (node.isSkinnedMesh) oneMeshes.push(node); });
  two.root.traverse(node => { if (node.isSkinnedMesh) twoMeshes.push(node); });
  assert.equal(oneMeshes[0].skeleton, oneMeshes[1].skeleton);
  assert.notEqual(oneMeshes[0].skeleton, twoMeshes[0].skeleton);
  assert.equal(one.inspect().resources.skinnedMeshes, 2);
  assert.equal(one.inspect().resources.skeletonOwners, 1);
  assert.equal(one.inspect().resources.boneMatrixBytes, 2 * 16 * 4);
  one.sample('bank_left', .45);
  assert.notEqual(one.socket('wordCaptureSocket').x, two.socket('wordCaptureSocket').x);
  bank.dispose();
});

test('different inverse bind matrices cannot be merged as an identical skin', async () => {
  const f = fixture(), inverses = f.mesh.skeleton.boneInverses.map(matrix => matrix.clone());
  inverses[0].elements[12] += .125;
  const second = new THREE.SkinnedMesh(f.geometry, f.material);
  second.bind(new THREE.Skeleton([...f.mesh.skeleton.bones], inverses), f.mesh.bindMatrix.clone());
  f.gltf.scene.add(second);
  const bank = createRocketCraftAssets({ records, loader: { loadAsync: async () => f.gltf } });
  const lease = await bank.load('meadow'), meshes = [];
  lease.root.traverse(node => { if (node.isSkinnedMesh) meshes.push(node); });
  assert.notEqual(meshes[0].skeleton, meshes[1].skeleton);
  assert.equal(lease.inspect().resources.skeletonOwners, 2);
  assert.equal(f.mesh.skeleton.boneInverses[0].elements[12], 0);
  bank.dispose();
});

test('an unmounted pending caller cannot resurrect a model or dispose another live caller’s decode', async () => {
  const f = fixture(), cache = new Map(); let resolve;
  const loader = { loadAsync: () => new Promise(done => { resolve = done; }) };
  const first = createRocketCraftAssets({ records, loader, cache }), second = createRocketCraftAssets({ records, loader, cache });
  const abandoned = first.load('meadow'), retained = second.load('meadow');
  first.dispose(); resolve(f.gltf);
  assert.equal(await abandoned, null); assert.ok(await retained);
  assert.equal(first.inspect().activeLeases, 0); assert.equal(f.disposed.texture, 0);
  second.dispose(); assert.equal(f.disposed.texture, 1); assert.equal(cache.size, 0);
});

test('missing actions or receiver source fail honestly and leave a surviving lease’s source untouched', async () => {
  const f = fixture(), cache = new Map(), loader = { loadAsync: async () => f.gltf };
  const first = createRocketCraftAssets({ records, loader, cache }), second = createRocketCraftAssets({ records, loader, cache });
  assert.ok(await first.load('meadow'));
  f.receiver.name = 'missing-receiver';
  assert.equal(await second.load('meadow'), null);
  assert.equal(second.inspect().delivery[0].status, 'failed');
  assert.equal(f.disposed.geometry, 0, 'rejected pre-clone validation must not dispose borrowed geometry');
  second.dispose(); first.dispose(); assert.equal(f.disposed.geometry, 1);
  const missing = fixture(); missing.gltf.animations.pop();
  const incomplete = createRocketCraftAssets({ records, loader: { loadAsync: async () => missing.gltf } });
  assert.equal(await incomplete.load('meadow'), null);
  assert.match(incomplete.inspect().delivery[0].reason, /clips/);
  assert.equal(missing.disposed.texture, 1); incomplete.dispose();
  const unrelated = fixture(); unrelated.gltf.animations.push(new THREE.AnimationClip('drive', 1, []));
  const mixed = createRocketCraftAssets({ records, loader: { loadAsync: async () => unrelated.gltf } });
  assert.equal(await mixed.load('meadow'), null);
  assert.match(mixed.inspect().delivery[0].reason, /unrelated/);
  assert.equal(unrelated.disposed.texture, 1); mixed.dispose();
});

test('failed URLs cannot be relabelled as delivered art and loaders reject non-owned records', async () => {
  let requests = 0;
  const loader = { loadAsync: async () => { requests++; throw new Error('actual load failure'); } };
  const bank = createRocketCraftAssets({ records, loader });
  assert.equal(await bank.load('meadow'), null); assert.equal(bank.inspect().delivery[0].status, 'failed');
  assert.equal(await bank.load('dino'), null); assert.equal(requests, 1); bank.dispose();
});

test('explicit registered phases evaluate real bones without leftover blends or cumulative mixer time', async () => {
  const f = fixture(), bank = createRocketCraftAssets({ records, loader: { loadAsync: async () => f.gltf } });
  const lease = await bank.load('meadow');
  assert.equal(lease.sample('bank_right', .75), true);
  assert.ok(Math.abs(lease.socket('wordCaptureSocket').x - .15) < 1e-6);
  lease.sample('catch', .4);
  assert.ok(Math.abs(lease.socket('wordCaptureSocket').x - .2) < 1e-6);
  lease.sample('cruise', .9);
  assert.ok(Math.abs(lease.socket('wordCaptureSocket').x) < 1e-6, 'the previous action must not keep a faded contact offset');
  assert.equal(lease.sample('drive', .5), false); assert.equal(lease.sample('catch', NaN), false);
  assert.equal(lease.inspect().rendered, false, 'evaluated poses alone are not rendered delivery');
  assert.equal(f.receiver.getWorldPosition(new THREE.Vector3()).x, 0, 'a leased sample cannot mutate source bones');
  bank.dispose(); assert.equal(lease.sample('catch', .4), false);
});

test('actual loaded grip/sole observations follow evaluated source bones and never mutate live contact registration', async () => {
  const f = fixture();
  const hand = new THREE.Bone(); hand.name = THREE.PropertyBinding.sanitizeNodeName('hand.L'); hand.position.set(.2, .1, .3);
  const grip = new THREE.Bone(); grip.name = 'leftGripSocket'; grip.position.copy(hand.position);
  f.mesh.skeleton.bones[0].add(hand, grip);
  f.gltf.animations.find(clip => clip.name === 'celebrate').tracks.push(
    new THREE.VectorKeyframeTrack(`${hand.name}.position`, [0, 1], [.2, .1, .3, .2, .5, .3]));
  const contactRecords = { meadow: { ...records.meadow, contacts: { leftGrip: {
    bone: 'hand.L', support: 'leftGripSocket', sourcePoint: [.2, -.3, .1] } } } };
  const bank = createRocketCraftAssets({ records: contactRecords, loader: { loadAsync: async () => f.gltf } });
  const lease = await bank.load('meadow');
  assert.ok(lease);
  assert.ok(lease.contacts()[0].separation < 1e-7);
  lease.sample('celebrate', .5);
  assert.ok(Math.abs(lease.contacts()[0].separation - .2) < 1e-6);
  const observed = lease.contacts(); observed[0].point[0] = 999;
  assert.notEqual(lease.contacts()[0].point[0], 999);
  assert.deepEqual(hand.position.toArray(), [.2, .1, .3], 'leased runtime observation cannot alter the canonical source');
  bank.dispose(); assert.deepEqual(lease.contacts(), []);
});
