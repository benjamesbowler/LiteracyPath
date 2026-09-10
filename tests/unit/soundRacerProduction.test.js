import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RACER_DRIVER_CLIPS, racerDriverState } from '../../src/components/learn/games/games/soundRacerKartAsset.js';
import { racerStripGeometry, racerSceneryPlacements, circuitClearance } from '../../src/components/learn/games/games/soundRacerScenery.js';
import { buildTrack } from '../../src/utils/soundRacerTracks.js';
const file = new URL('../../public/game-assets/sound-racer/models/pip-kart.glb', import.meta.url);
async function load() {
  const bytes = fs.readFileSync(file);
  return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
}
function skinPoints(scene, name) {
  const result = [];
  scene.updateMatrixWorld(true);
  scene.traverse(mesh => {
    if (!mesh.isSkinnedMesh) return;
    mesh.skeleton.update();
    const bone = mesh.skeleton.bones.findIndex(b => b.name === name);
    const indices = mesh.geometry.attributes.skinIndex, weights = mesh.geometry.attributes.skinWeight;
    for (let i = 0; i < indices.count; i++) {
      if (indices.getX(i) !== bone || weights.getX(i) < .99) continue;
      result.push(mesh.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(mesh.matrixWorld));
    }
  });
  return result;
}

test('Pip kart is a bounded real skinned GLB with six authored states and four independent wheel axes', async () => {
  const gltf = await load();
  assert.ok(fs.statSync(file).size < 2_000_000);
  assert.deepEqual(gltf.animations.map(c => c.name).sort(), [...RACER_DRIVER_CLIPS].sort());
  assert.equal(gltf.animations.every(c => c.duration > .9 && c.tracks.length > 30), true);
  let skins = 0, vertices = 0;
  gltf.scene.traverse(node => { if (node.isSkinnedMesh) { skins++; vertices += node.geometry.attributes.position.count; } });
  assert.ok(skins >= 8 && skins <= 20, `draw meshes ${skins}`);
  assert.ok(vertices > 5000 && vertices < 40000, `vertices ${vertices}`);
  for (const axle of ['front', 'rear']) for (const side of ['L', 'R']) {
    const bone = gltf.scene.getObjectByName(`roll${axle}${side}`);
    assert.ok(bone?.isBone);
    assert.equal(bone.parent.name, `steer${axle}${side}`);
  }
  const size = new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());
  assert.ok(size.x < 2.6 && size.y < 2.5 && size.z < 3.1, size.toArray().join(','));
});

test('all seated clips preserve sole/pedal and hand/steering contact and torso roll', async () => {
  const gltf = await load();
  const mixer = new THREE.AnimationMixer(gltf.scene);
  const chest = gltf.scene.getObjectByName('chest');
  gltf.scene.updateMatrixWorld(true);
  const bindChest = chest.getWorldQuaternion(new THREE.Quaternion());
  const measurements = [];
  for (const clip of gltf.animations) {
    mixer.stopAllAction();
    mixer.clipAction(clip).reset().play();
    for (const time of [0, clip.duration / 2, clip.duration - .035]) {
      mixer.setTime(time); gltf.scene.updateMatrixWorld(true);
      const up = chest.getWorldQuaternion(new THREE.Quaternion());
      assert.ok(Math.abs(bindChest.dot(up)) > .85, `${clip.name}: authored torso roll flipped`);
      const rim = skinPoints(gltf.scene, 'steering');
      for (const side of ['L', 'R']) {
        const feet = skinPoints(gltf.scene, `foot${side}`);
        const bottom = Math.min(...feet.map(p => p.y));
        assert.ok(bottom > .275 && bottom < .335, `${clip.name} ${side}: sole ${bottom}`);
        const hand = skinPoints(gltf.scene, `hand${side}`);
        let contact = Infinity;
        for (const p of hand) for (const q of rim) contact = Math.min(contact, p.distanceTo(q));
        assert.ok(contact < .045, `${clip.name} ${side}: grip gap ${contact}`);
        measurements.push({ clip: clip.name, time, side, bottom, contact });
      }
      for (const axle of ['front', 'rear']) for (const side of ['L', 'R']) {
        const tyre = skinPoints(gltf.scene, `roll${axle}${side}`);
        const bottom = Math.min(...tyre.map(p => p.y));
        assert.ok(bottom > -.022 && bottom < .015, `${clip.name}: tyre ground ${bottom}`);
      }
    }
  }
  assert.equal(measurements.length, 36);
});

test('recovery payload is byte-identical to the authored kart, retaining driver and animation at asset failure', async () => {
  const { RACER_KART_BASE64 } = await import('../../src/components/learn/games/games/soundRacerKartFallback.js');
  assert.deepEqual(Buffer.from(RACER_KART_BASE64, 'base64'), fs.readFileSync(file));
});

test('continuous raised kerbs close the seam and authored scenery clears every neighbouring hairpin', () => {
  for (const [difficulty, world] of [['easy', 'meadow'], ['medium', 'dino'], ['hard', 'moonwood']]) {
    const track = buildTrack('b', { difficulty, seed: 0 });
    const geometry = racerStripGeometry(track.path, 4.4, 5.1, 0, .1, true);
    const positions = geometry.attributes.position;
    for (let i = 0; i < 4; i++) assert.ok(new THREE.Vector3().fromBufferAttribute(positions, i).distanceTo(new THREE.Vector3().fromBufferAttribute(positions, positions.count - 4 + i)) < .001);
    for (const tier of ['low', 'high']) {
      const placements = racerSceneryPlacements(track, world, tier);
      assert.ok(placements.length > 15, `${difficulty} ${tier} placements ${placements.length}`);
      for (const p of placements) assert.ok(circuitClearance(track.path, p.x, p.z) > 6, `${world}: scenery intrudes`);
    }
    geometry.dispose();
  }
});

test('driver reactions keep motor recovery separate from word evaluation', () => {
  assert.equal(racerDriverState({ steering: -1 }), 'turn_left');
  assert.equal(racerDriverState({ steering: 1 }), 'turn_right');
  assert.equal(racerDriverState({ braking: true }), 'brake');
  assert.equal(racerDriverState({ recovered: true, complete: true }), 'recover');
  assert.equal(racerDriverState({ complete: true }), 'celebrate');
  assert.equal(racerDriverState({ wordsWrong: 1 }), 'drive');
});

test('runtime mixer keeps wheel contacts while steering, suspension and repeated recovery act independently', async () => {
  const { createRacerKart } = await import('../../src/components/learn/games/games/soundRacerKartAsset.js');
  const originalLoad = GLTFLoader.prototype.loadAsync;
  GLTFLoader.prototype.loadAsync = load;
  try {
    const kart = createRacerKart();
    assert.equal(await kart.ready, true);
    for (let i = 0; i < 20; i++) kart.update(.05, { speed: 9, steering: 1 });
    const snap = kart.snapshot();
    assert.equal(snap.state, 'turn_right');
    assert.equal(snap.wheelCount, 4);
    for (const name of ['rollfrontL', 'rollfrontR', 'rollrearL', 'rollrearR']) assert.ok(Math.abs(snap.joints[name].position[1] - .37) < .002);
    const spin = kart.root.userData.wheelRoll;
    assert.ok(Math.abs(spin) > .1);
    kart.update(.05, { recovered: true, speed: 3.2 });
    assert.equal(kart.snapshot().state, 'recover');
    for (let i = 0; i < 18; i++) kart.update(.05, { speed: 8 });
    assert.equal(kart.snapshot().state, 'drive');
    kart.update(.05, { recovered: true });
    assert.equal(kart.snapshot().state, 'recover');
    kart.dispose();
    assert.equal(kart.root.children.length, 0);
  } finally { GLTFLoader.prototype.loadAsync = originalLoad; }
});
