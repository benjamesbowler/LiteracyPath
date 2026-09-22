import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createRacerScenery, racerSceneryPlacements, circuitClearance, RACER_SCENERY_URLS } from '../../src/components/learn/games/games/soundRacerScenery.js';
import { BLENDER_WORLD_ASSETS, BLENDER_SPRITE, createBlenderWorldSprite } from '../../src/components/learn/games/shared/arcadeBlenderWorlds.js';
import { createBlenderLandmarks } from '../../src/components/learn/games/shared/arcadeBlenderLandmarks.js';
import { GAME_LIST } from '../../src/data/learnGamesData.js';
import { attachRocketCourier } from '../../src/components/learn/games/games/rocketCourierAsset.js';
import { soundRacerLadder } from '../../src/utils/soundRacerTracks.js';
import { buildSoundRacerRace } from '../../src/utils/soundRacerRace.js';
const root = new URL('../../', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('public/game-assets/arcade-blender/manifest.json', root)));
const bytesFor = url => fs.readFileSync(new URL(`public${url}`, root));
const parse = bytes => new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');

test('owned Blender GLBs are complete, small, traceable and valid through the runtime loader', async () => {
  assert.match(manifest.tool, /Blender/);
  assert.ok(fs.existsSync(new URL(manifest.source, root)));
  assert.equal(createHash('sha256').update(fs.readFileSync(new URL(manifest.source, root))).digest('hex'), manifest.sourceSha256);
  assert.ok(fs.existsSync(new URL('source-art/arcade/Arcade-worlds.blend', root)));
  for (const asset of manifest.assets) {
    const bytes = bytesFor(asset.url);
    assert.equal(bytes.length, asset.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256);
    assert.ok(bytes.length < 6 * 1024 * 1024); // Current 3D library per-model policy.
    const doc = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
    assert.equal([...doc.buffers || [], ...doc.images || []].some(d => d.uri), false);
    const gltf = await parse(bytes);
    const bounds = new THREE.Box3().setFromObject(gltf.scene);
    assert.equal(bounds.isEmpty(), false);
    assert.equal([...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite), true);
    gltf.scene.traverse(mesh => {
      if (!mesh.isMesh) return;
      assert.ok(mesh.geometry.attributes.normal);
      assert.equal(Array.from(mesh.geometry.attributes.position.array).every(Number.isFinite), true);
    });
    if (asset.id === 'meadow-windmill') {
      const rotor = gltf.scene.getObjectByName('WindmillRotor');
      assert.ok(rotor, 'export retains the authored rotor pivot');
      assert.ok(rotor.position.distanceTo(new THREE.Vector3(0, 3.2, -1.15)) < .001);
    }
  }
});

test('landmarks and foliage retain their actual exported footprint outside every adjacent bend', async () => {
  const radii = {};
  for (const [name, url] of Object.entries(RACER_SCENERY_URLS)) {
    if (!url.includes('/arcade-blender/')) continue;
    const gltf = await parse(bytesFor(url));
    const size = new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());
    radii[name] = Math.hypot(size.x, size.z) / size.y / 2;
  }
  for (const [difficulty, world, landmark] of [['easy','meadow','windmill'],['medium','dino','fossil'],['hard','moonwood','moonTower']]) {
    for (const seed of [0, 9, 73]) for (const tier of ['low','medium','high']) {
      const track = buildSoundRacerRace(soundRacerLadder(difficulty)[0], { difficulty, seed });
      const placements = racerSceneryPlacements(track, world, tier);
      assert.ok(placements.some(p => p.name === landmark), `${world}/${tier}: missing landmark`);
      for (const p of placements.filter(p => radii[p.name])) assert.ok(circuitClearance(track.path,p.x,p.z) >= 4.8 + radii[p.name] * p.height + 1);
    }
  }
});

test('instanced windmill rotation preserves the pivot, freezes for reduced motion and releases resources', async () => {
  const original = GLTFLoader.prototype.loadAsync;
  GLTFLoader.prototype.loadAsync = async function (url) {
    // The exact new exports exercise the import/motion path; unrelated legacy
    // scenery is outside this test and carries external texture dependencies.
    return url.includes('/arcade-blender/') ? parse(bytesFor(url)) : { scene: new THREE.Group() };
  };
  try {
    const scenery = createRacerScenery(buildSoundRacerRace('b',{ difficulty:'easy',seed:0 }), 'meadow', 'high');
    await scenery.ready;
    const rotor = scenery.root.getObjectByProperty('isInstancedMesh', true);
    assert.ok(rotor);
    const rotors = [];
    scenery.root.traverse(node => { if (node.userData.windmillRotor) rotors.push(node); });
    assert.ok(rotors.length > 0);
    const before = new THREE.Matrix4(); rotors[0].getMatrixAt(0,before);
    scenery.update(.05);
    const after = new THREE.Matrix4(); rotors[0].getMatrixAt(0,after);
    assert.notDeepEqual(after.elements,before.elements);
    assert.ok(new THREE.Vector3().setFromMatrixPosition(before).distanceTo(new THREE.Vector3().setFromMatrixPosition(after)) < .0001);
    scenery.update(.05,true);
    const frozen = new THREE.Matrix4(); rotors[0].getMatrixAt(0,frozen);
    assert.deepEqual(after.elements,frozen.elements);
    let disposed = false; rotors[0].geometry.addEventListener('dispose',()=>{disposed=true;});
    scenery.dispose(); assert.equal(disposed,true);
  } finally { GLTFLoader.prototype.loadAsync = original; }
});

test('rocket loading and failure cannot remove the playable fallback or revive an exited game', async () => {
  const original = GLTFLoader.prototype.loadAsync;
  try {
    const parent = new THREE.Group();
    const fallback = new THREE.Group(); parent.add(fallback);
    GLTFLoader.prototype.loadAsync = () => Promise.reject(new Error('offline'));
    const failed = attachRocketCourier(parent);
    assert.equal(await failed.ready,false); assert.equal(parent.children[0],fallback); failed.dispose();
    let deliver;
    GLTFLoader.prototype.loadAsync = () => new Promise(resolve => { deliver=resolve; });
    const pending = attachRocketCourier(parent); pending.dispose();
    const late = await parse(bytesFor('/game-assets/arcade-blender/rocket-courier.glb'));
    let released=false; late.scene.traverse(n=>{ if(n.isMesh)n.geometry.addEventListener('dispose',()=>{released=true;}); });
    deliver(late); assert.equal(await pending.ready,false); assert.equal(released,true); assert.equal(parent.children.length,1);
  } finally { GLTFLoader.prototype.loadAsync=original; }
});

test('every current Arcade game has Blender delivery and all authoring inputs are traceable', () => {
  const arcade = GAME_LIST.filter(game => game.surfaces?.includes('arcade')).map(game => game.id).sort();
  assert.deepEqual([...Object.keys(BLENDER_WORLD_ASSETS), 'sound-racer', 'rocket-run'].sort(), arcade);
  for (const [file, hash] of Object.entries(manifest.authoringSources)) {
    assert.equal(createHash('sha256').update(fs.readFileSync(new URL(file, root))).digest('hex'), hash);
  }
  for (const [game, id] of Object.entries(BLENDER_WORLD_ASSETS)) {
    const asset = manifest.assets.find(asset => asset.id === id);
    assert.equal(asset.game, game);
    if (!asset.sprite) continue;
    const bytes = bytesFor(asset.sprite.url);
    assert.equal(bytes.length, asset.sprite.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sprite.sha256);
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    assert.equal(asset.sprite.frameWidth, BLENDER_SPRITE.size);
    assert.equal(asset.sprite.frames, BLENDER_SPRITE.frames);
    assert.equal(asset.sprite.columns, BLENDER_SPRITE.columns);
  }
});

test('all eleven new landmarks retain real four-second motion in the exported model', async () => {
  for (const asset of manifest.assets.filter(asset => asset.game)) {
    const gltf = await parse(bytesFor(asset.url));
    assert.equal(gltf.animations.length, 1, asset.id);
    assert.ok(Math.abs(gltf.animations[0].duration - 4) < .01, asset.id);
    const detail = gltf.scene.getObjectByName('AnimatedDetail');
    assert.ok(detail, asset.id);
    const mixer = new THREE.AnimationMixer(gltf.scene);
    mixer.clipAction(gltf.animations[0]).play();
    mixer.setTime(0); const before = detail.quaternion.clone();
    mixer.setTime(1);
    assert.ok(before.angleTo(detail.quaternion) > .02, asset.id);
    mixer.stopAllAction(); mixer.uncacheRoot(gltf.scene);
  }
});

test('sprite playback follows active game time, freezes on pause and tolerates failed or late loads', () => {
  let instance;
  class SpriteImage { constructor() { instance = this; this.naturalWidth = 1536; this.naturalHeight = 2304; } }
  const host = { dataset: {} }, calls = [];
  const ctx = { globalAlpha: 1, save() {}, restore() {}, drawImage(...args) { calls.push(args); } };
  const sprite = createBlenderWorldSprite('letter-leap', host, { ImageClass: SpriteImage });
  sprite.draw(ctx, 0, 0, 200, 200, 0);
  assert.equal(calls.length, 0);
  instance.onload();
  for (let frame = 1; frame <= 30; frame++) sprite.draw(ctx, 0, 0, 200, 200, frame / 60);
  const moving = host.dataset.blenderWorldFrame;
  assert.notEqual(moving, '0');
  sprite.draw(ctx, 0, 0, 200, 200, 600, { paused: true });
  assert.equal(host.dataset.blenderWorldFrame, moving);
  sprite.draw(ctx, 0, 0, 200, 200, 601, { reducedMotion: true });
  assert.equal(host.dataset.blenderWorldFrame, '0');
  const lateLoad = instance.onload;
  sprite.dispose(); lateLoad();
  const count = calls.length;
  sprite.draw(ctx, 0, 0, 200, 200, 602);
  assert.equal(calls.length, count);
  const failed = createBlenderWorldSprite('word-bridge', host, { ImageClass: SpriteImage });
  instance.onerror(); failed.draw(ctx, 0, 0, 200, 200, 0);
  assert.equal(host.dataset.blenderWorldState, 'fallback');
  assert.equal(calls.length, count);
  failed.dispose();
});

test('native landmarks freeze, release shared resources once, and discard late exports', async () => {
  const original = GLTFLoader.prototype.loadAsync;
  try {
    GLTFLoader.prototype.loadAsync = url => parse(bytesFor(url));
    const landmarks = createBlenderLandmarks('word-climb', [{ x: -100, y: 0, z: -20, height: 80 }, { x: 100, y: 200, z: -20, height: 80 }]);
    await landmarks.ready;
    const first = landmarks.root.children[0].getObjectByName('AnimatedDetail');
    const before = first.quaternion.clone();
    landmarks.update(.05);
    assert.ok(before.angleTo(first.quaternion) > 0);
    const moving = first.quaternion.clone();
    landmarks.update(.05, { paused: true }); landmarks.update(.05, { reducedMotion: true });
    assert.ok(moving.equals(first.quaternion));
    let disposals = 0;
    const mesh = landmarks.root.children[0].getObjectByProperty('isMesh', true);
    mesh.geometry.addEventListener('dispose', () => disposals++);
    landmarks.dispose(); landmarks.dispose();
    assert.equal(disposals, 1);
    let deliver;
    GLTFLoader.prototype.loadAsync = () => new Promise(resolve => { deliver = resolve; });
    const late = createBlenderLandmarks('star-gallery', [{ x: 0, z: 0, height: 8 }]);
    late.dispose(); deliver(await parse(bytesFor('/game-assets/arcade-blender/orchard-greenhouse.glb')));
    assert.equal(await late.ready, false);
    assert.equal(late.root.children.length, 0);
  } finally { GLTFLoader.prototype.loadAsync = original; }
});
