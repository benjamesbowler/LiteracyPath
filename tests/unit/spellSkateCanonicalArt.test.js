import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SPELL_SKATER_STATES } from '../../src/components/learn/games/games/spellSkaterAsset.js';

const root = new URL('../../', import.meta.url);
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function readModel(character) {
  const bytes = fs.readFileSync(new URL(`public/game-assets/spell-skate/models/${character}-skater-v2.glb`, root));
  const length = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + length));
  const start = 20 + length;
  const bin = bytes.subarray(start + 8, start + 8 + bytes.readUInt32LE(start));
  return { bytes, json, bin };
}
async function contactScene({ json: original, bin }) {
  // Native browser review owns image decoding and likeness. This test retains
  // actual skin, transforms, vertices, indices and animation bytes for contact.
  const json = structuredClone(original);
  for (const material of json.materials) {
    delete material.pbrMetallicRoughness?.baseColorTexture;
    delete material.pbrMetallicRoughness?.metallicRoughnessTexture;
    for (const key of ['normalTexture', 'occlusionTexture', 'emissiveTexture']) delete material[key];
  }
  delete json.images; delete json.textures; delete json.samplers;
  delete json.extensionsUsed; delete json.extensionsRequired;
  const encoded = Buffer.from(JSON.stringify(json));
  const padded = Buffer.alloc(Math.ceil(encoded.length / 4) * 4, 0x20);
  encoded.copy(padded);
  const copy = Buffer.alloc(12 + 8 + padded.length + 8 + bin.length);
  copy.writeUInt32LE(0x46546c67, 0); copy.writeUInt32LE(2, 4); copy.writeUInt32LE(copy.length, 8);
  copy.writeUInt32LE(padded.length, 12); copy.writeUInt32LE(0x4e4f534a, 16); padded.copy(copy, 20);
  copy.writeUInt32LE(bin.length, 20 + padded.length); copy.writeUInt32LE(0x004e4942, 24 + padded.length); bin.copy(copy, 28 + padded.length);
  return new GLTFLoader().parseAsync(copy.buffer.slice(copy.byteOffset, copy.byteOffset + copy.byteLength), '');
}
function pointsForBone(scene, name) {
  const points = [];
  scene.updateMatrixWorld(true);
  scene.traverse(mesh => {
    if (!mesh.isSkinnedMesh) return;
    mesh.skeleton.update();
    // GLTFLoader sanitises dots in bone names when creating animation bindings.
    const bone = mesh.skeleton.bones.findIndex(node => node.name === name.replaceAll('.', ''));
    const weights = mesh.geometry.attributes.skinWeight, indices = mesh.geometry.attributes.skinIndex;
    for (let i = 0; i < indices.count; i++) {
      if (indices.getX(i) !== bone || weights.getX(i) < .99) continue;
      points.push(mesh.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(mesh.matrixWorld));
    }
  });
  return points;
}

for (const [world, character] of [['meadow', 'bouncy'],['dino','chompy'],['moonwood','pip']]) {
  test(`${character} carries original UV bytes, complete board skin and all ten native skate states`, () => {
    const model = readModel(character);
    assert.ok(model.bytes.length < 6_000_000);
    assert.equal(model.json.images.length, 2);
    assert.ok(model.json.images.every(image => image.uri === undefined && image.bufferView >= 0));
    assert.deepEqual(model.json.animations.map(animation => animation.name), SPELL_SKATER_STATES);
    for (const name of ['board', 'hips', 'head', 'foot.L', 'foot.R', 'hand.L', 'hand.R']) assert.ok(model.json.nodes.some(node => node.name === name));
    assert.equal(model.json.nodes.filter(node => node.name?.startsWith('wheel_')).length, 4);
    const textured = model.json.materials.flatMap((material, i) => material.pbrMetallicRoughness?.baseColorTexture ? [i] : []);
    assert.ok(textured.length >= 2);
    assert.ok(model.json.meshes.flatMap(mesh => mesh.primitives).filter(primitive => textured.includes(primitive.material)).every(primitive => primitive.attributes.TEXCOORD_0 !== undefined));
    const manifest = JSON.parse(fs.readFileSync(new URL(`source-art/arcade/spell-skate-3d/${character}-skater-v2.json`, root)));
    assert.equal(manifest.world, world);
    assert.equal(manifest.sha256, hash(model.bytes));
    assert.equal(manifest.recipeSha256, hash(fs.readFileSync(new URL(manifest.source, root))));
    assert.equal(manifest.actorRecipeSha256, hash(fs.readFileSync(new URL(manifest.actorRecipe, root))));
    assert.equal(manifest.boardRecipeSha256, hash(fs.readFileSync(new URL(manifest.boardAndContactRecipe, root))));
    assert.ok(fs.statSync(new URL(manifest.editable, root)).size > model.bytes.length / 2);
  });
  test(`${character} keeps planted soles, the intentional pushing foot and four ground tyres through all actual clips`, async () => {
    const gltf = await contactScene(readModel(character));
    const mixer = new THREE.AnimationMixer(gltf.scene);
    for (const clip of gltf.animations) {
      mixer.stopAllAction(); mixer.clipAction(clip).reset().play();
      for (const phase of [0, .25, .5, .75, .98]) {
        mixer.setTime(clip.duration * phase);
        for (const side of ['L', 'R']) {
          const foot = pointsForBone(gltf.scene, `foot.${side}`);
          assert.ok(foot.length > 20);
          const min = Math.min(...foot.map(p => p.y));
          const wave = Math.sin(phase * Math.PI * 2);
          const expected = clip.name === 'push' && side === 'R' ? .565 - .565 * Math.max(0, wave) + .22 * Math.max(0, -wave) : .565;
          assert.ok(Math.abs(min - expected) < .027, `${character}/${clip.name}/${phase}/${side} sole ${min} expected ${expected}`);
        }
        for (const x of [-.56, .56]) for (const z of [-1.06, 1.06]) {
          const tyre = pointsForBone(gltf.scene, `wheel_${x}_${z}`);
          assert.ok(tyre.length > 20);
          const min = Math.min(...tyre.map(p => p.y));
          assert.ok(Math.abs(min) < .012, `${character}/${clip.name}/${phase} tyre ${min}`);
        }
      }
    }
    mixer.stopAllAction(); mixer.uncacheRoot(gltf.scene);
    gltf.scene.traverse(node => { node.geometry?.dispose(); if (node.isSkinnedMesh) node.skeleton.dispose(); });
  });
}
