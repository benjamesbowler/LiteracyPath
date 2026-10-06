import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createRacerFixedStepper, createKart, stepKart, classifyRacerContact } from '../../src/utils/soundRacerPhysics.js';
import { buildTrack } from '../../src/utils/soundRacerTracks.js';
import { racerVenuePlacements, racerDensityIncludes } from '../../src/components/learn/games/games/soundRacerAuthoredWorld.js';
import { circuitClearance, racerTerrainHeight } from '../../src/components/learn/games/games/soundRacerScenery.js';

const root = new URL('../../', import.meta.url);
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function glb(path) {
  const bytes = fs.readFileSync(new URL(path, root));
  const length = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + length).toString());
  const start = 20 + length;
  const bin = bytes.subarray(start + 8, start + 8 + bytes.readUInt32LE(start));
  return { bytes, json, bin };
}
async function geometryOnly({ json: original, bin }) {
  // Texture decode is a browser gate. Keep the original geometry, indices,
  // complete skin/clip bytes and rest transforms unchanged for contact geometry.
  const json = structuredClone(original);
  for (const material of json.materials) {
    delete material.pbrMetallicRoughness?.baseColorTexture;
    delete material.pbrMetallicRoughness?.metallicRoughnessTexture;
    for (const key of ['normalTexture', 'occlusionTexture', 'emissiveTexture']) delete material[key];
  }
  delete json.images; delete json.textures; delete json.samplers;
  const encoded = Buffer.from(JSON.stringify(json)), padded = Buffer.alloc(Math.ceil(encoded.length / 4) * 4, 0x20);
  encoded.copy(padded);
  const copy = Buffer.alloc(12 + 8 + padded.length + 8 + bin.length);
  copy.writeUInt32LE(0x46546c67, 0); copy.writeUInt32LE(2, 4); copy.writeUInt32LE(copy.length, 8);
  copy.writeUInt32LE(padded.length, 12); copy.writeUInt32LE(0x4e4f534a, 16); padded.copy(copy, 20);
  copy.writeUInt32LE(bin.length, 20 + padded.length); copy.writeUInt32LE(0x004e4942, 24 + padded.length); bin.copy(copy, 28 + padded.length);
  return new GLTFLoader().parseAsync(copy.buffer.slice(copy.byteOffset, copy.byteOffset + copy.byteLength), '');
}
function skinPoints(scene, name) {
  const points = [];
  scene.updateMatrixWorld(true);
  scene.traverse(mesh => {
    if (!mesh.isSkinnedMesh) return;
    mesh.skeleton.update();
    const bone = mesh.skeleton.bones.findIndex(node => node.name === name);
    const weights = mesh.geometry.attributes.skinWeight, indices = mesh.geometry.attributes.skinIndex;
    for (let i = 0; i < indices.count; i++) {
      if (indices.getX(i) !== bone || weights.getX(i) < .99) continue;
      points.push(mesh.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(mesh.matrixWorld));
    }
  });
  return points;
}

for (const [world, character] of [['meadow', 'bouncy'], ['dino', 'chompy'], ['moonwood', 'pip']]) {
  test(`${character} retains the tested 2MB delivery envelope, actual UV image, original source and all six states`, async () => {
    const model = glb(`public/game-assets/sound-racer/models/${character}-kart-v2.glb`);
    assert.ok(model.bytes.length < 2_000_000, `${character} model ${model.bytes.length}`);
    assert.equal(model.json.images.length, 1);
    assert.equal(model.json.images[0].uri, undefined, 'all material bytes are embedded in the measured delivery envelope');
    assert.ok(model.json.images[0].bufferView >= 0);
    const textured = model.json.materials.findIndex(m => m.pbrMetallicRoughness?.baseColorTexture);
    assert.ok(textured >= 0);
    assert.ok(model.json.meshes.flatMap(m => m.primitives).filter(p => p.material === textured).every(p => p.attributes.TEXCOORD_0 !== undefined));
    const manifest = JSON.parse(fs.readFileSync(new URL(`source-art/arcade/sound-racer-3d/${character}-kart-v2.json`, root)));
    assert.equal(manifest.sha256, hash(model.bytes));
    assert.equal(manifest.world, world);
    assert.ok(fs.statSync(new URL(manifest.editable, root)).size > model.bytes.length / 2);
    assert.ok(fs.statSync(new URL(manifest.textureSource, root)).size > 10_000);
    const scene = await geometryOnly(model);
    assert.deepEqual(scene.animations.map(c => c.name).sort(), ['brake','celebrate','drive','recover','turn_left','turn_right']);
    const size = new THREE.Box3().setFromObject(scene.scene).getSize(new THREE.Vector3());
    assert.ok(size.x < 2.6 && size.y < 2.5 && size.z < 3.1, `${character} ${size.toArray()}`);
  });
  test(`${character} actually keeps both soles/pedals, both grips/rim and all four tyre contacts through sampled native clips`, async () => {
    const gltf = await geometryOnly(glb(`public/game-assets/sound-racer/models/${character}-kart-v2.glb`));
    const mixer = new THREE.AnimationMixer(gltf.scene);
    for (const clip of gltf.animations) {
      mixer.stopAllAction(); mixer.clipAction(clip).reset().play();
      for (const time of [0, clip.duration / 2, clip.duration - .035]) {
        mixer.setTime(time);
        const rim = skinPoints(gltf.scene, 'steering');
        for (const side of ['L','R']) {
          const foot = Math.min(...skinPoints(gltf.scene, `foot${side}`).map(p => p.y));
          assert.ok(foot > .275 && foot < .335, `${character}/${clip.name}/${side} sole ${foot}`);
          let gap = Infinity;
          for (const p of skinPoints(gltf.scene, `hand${side}`)) for (const q of rim) gap = Math.min(gap, p.distanceTo(q));
          assert.ok(gap < .045, `${character}/${clip.name}/${side} grip ${gap}`);
          for (const axle of ['front','rear']) {
            const ground = Math.min(...skinPoints(gltf.scene, `roll${axle}${side}`).map(p => p.y));
            assert.ok(ground > -.022 && ground < .015, `${character}/${clip.name}/${axle}/${side} tyre ${ground}`);
          }
        }
      }
    }
    mixer.stopAllAction(); mixer.uncacheRoot(gltf.scene);
  });
  test(`${world} 3D venue templates carry real original wood/stone maps and remain bounded outside every road arm`, () => {
    const kit = glb(`public/game-assets/sound-racer/venues/${world}-circuit-venues-v1.glb`);
    assert.ok(kit.bytes.length < 6_000_000);
    assert.equal(kit.json.images.length, 2);
    assert.ok(kit.json.images.every(image => image.uri === undefined && image.bufferView >= 0));
    for (const name of ['clubhouse','grandstand','flowerbed','bench','landmark']) assert.ok(kit.json.nodes.some(node => node.name === name));
    const difficulty = { meadow:'easy', dino:'medium', moonwood:'hard' }[world];
    for (const seed of [0,3,7]) {
      const track = buildTrack('b', { difficulty, seed });
      for (const tier of ['low','high']) {
        const placements = racerVenuePlacements(track, circuitClearance, racerTerrainHeight, tier);
        assert.ok(placements.length >= 12, `${world}/${seed}/${tier} venues ${placements.length}`);
        for (const p of placements) {
          assert.ok(circuitClearance(track.path,p.x,p.z) >= 4.8+p.radius+.9);
          assert.equal(p.y,racerTerrainHeight(track.path,p.x,p.z));
        }
      }
    }
  });
}

test('fixed Racer contact simulation is frame-rate independent and discards the hidden/pause remainder', () => {
  const path = buildTrack('b', { difficulty:'easy',seed:0 }).path;
  function run(fps) {
    const clock=createRacerFixedStepper();let kart=createKart(path);
    for(let frame=0;frame<fps*4;frame++) {
      const result=clock.advance(1/fps);
      for(const dt of result.steps) {
        assert.equal(dt,1/60);
        kart=stepKart(path,kart,{steer:.22,speed:9,roadAssist:true},dt);
      }
    }
    return kart;
  }
  for(const fps of [24,120]) {
    const a=run(60),b=run(fps);
    assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<1e-7);
    assert.ok(Math.abs(a.progress-b.progress)<1e-7);
  }
  const clock=createRacerFixedStepper();clock.advance(.01);clock.reset();
  assert.equal(clock.advance(.008).steps.length,0);
  assert.equal(clock.advance(3).steps.length,9);
});

test('automatic default-lane travel never invents a literacy response or word penalty', () => {
  const track=buildTrack('j',{difficulty:'medium',seed:0});
  let kart=createKart(track.path),resolved=0;
  const wordResponses=[];
  for(let step=0;step<60*20;step++) {
    kart=stepKart(track.path,kart,{steer:0,speed:13,roadAssist:true},1/60);
    for(const gate of track.gates) {
      if(gate.kind!=='word'||gate.z>kart.progress||gate.observed)continue;
      gate.observed=true;resolved++;
      const hit=Math.abs(kart.lateral-[-3.15,0,3.15][gate.lane])<=1.18;
      wordResponses.push(classifyRacerContact({...gate,hit,hasLaneIntent:false}));
    }
  }
  assert.ok(resolved>4,'actual idle travel crosses several gates');
  assert.ok(!wordResponses.some(response=>response==='correct'||response==='wrong'));
  assert.equal(classifyRacerContact({kind:'word',correct:true,hit:true,hasLaneIntent:true}),'correct');
  assert.equal(classifyRacerContact({kind:'word',correct:false,hit:true,hasLaneIntent:true}),'wrong');
  assert.equal(classifyRacerContact({kind:'obstacle',hit:true,hasLaneIntent:false}),'obstacle');
});

test('sustained quality reduction preserves authored foliage across the entire circuit', () => {
  const selected = Array.from({length:128}, (_, index) => index).filter(index => racerDensityIncludes(index, .42));
  assert.ok(selected.length >= 52 && selected.length <= 55);
  for (let quarter=0; quarter<4; quarter++) assert.ok(selected.filter(index=>index>=quarter*32&&index<(quarter+1)*32).length>=12);
  assert.equal(racerDensityIncludes(127, 1), true);
});
