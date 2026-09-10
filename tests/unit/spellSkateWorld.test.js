import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sampleSkateSurface, skateRampProfile, skateSurfaceTilt, createSkateRampGeometry, createSkateDeckGeometry, planSkateRoute, skateObstacleAt, skateDeckClearance, skateFrameSteps, nextSkateQuality, skateMotion, measureSkateTravel, chooseSkateDestination, SKATE_DESTINATION_DISTANCE } from '../../src/components/learn/games/games/spellSkatePark.js';
import { chooseSkaterState, SPELL_SKATER_STATES } from '../../src/components/learn/games/games/spellSkaterAsset.js';
import { grammarGrindLadder } from '../../src/utils/grammarGrindLevels.js';
test('every ramp vertex and sampled riding surface agree, including rotated quarters and bowl', () => {
  for (const kind of ['ramp', 'quarter']) {
    const zone = {
      x: 4,
      z: -7,
      rot: .7,
      width: 12,
      depth: 18,
      height: 4,
      kind
    };
    const geometry = createSkateRampGeometry(12, 18, 4, kind);
    const p = geometry.attributes.position;
    for (let row = 0; row <= 32; row++) {
      const x = p.getX(row * 2),
        z = p.getZ(row * 2);
      assert.ok(Math.abs(p.getY(row * 2) - skateRampProfile(zone, z)) < 1e-5);
      const innerZ = z * .999 + (kind === 'quarter' ? -zone.depth * .0005 : 0),
        innerX = x * .999;
      const sample = sampleSkateSurface(zone.x + Math.cos(zone.rot) * innerX + Math.sin(zone.rot) * innerZ, zone.z - Math.sin(zone.rot) * innerX + Math.cos(zone.rot) * innerZ, [zone]);
      assert.ok(Math.abs(sample.height - skateRampProfile(zone, innerZ)) < 1e-5);
    }
    geometry.dispose();
  }
  const bowl = {
    x: 0,
    z: 0,
    rot: 0,
    radius: 16,
    height: 4,
    kind: 'bowl'
  };
  assert.equal(sampleSkateSurface(0, 0, [bowl]).height, 0);
  assert.equal(sampleSkateSurface(16, 0, [bowl]).height, 4);
  assert.equal(sampleSkateSurface(17, 0, [bowl]).height, 0);
});
test('surface pitch follows the slope rather than bobbing independently of the board', () => {
  const zone = {
    x: 0,
    z: 0,
    rot: 0,
    width: 12,
    depth: 18,
    height: 4
  };
  assert.ok(skateSurfaceTilt(0, 0, 0, [zone], []).pitch < 0);
  assert.ok(Math.abs(skateSurfaceTilt(0, 0, 0, [zone], []).roll) < 1e-8);
  assert.equal(sampleSkateSurface(40, 40, [zone]).height, 0);
});
test('animation states distinguish landing, rail, motor recovery and user movement', () => {
  const p = {
    onGround: true,
    speed: 8
  };
  assert.equal(chooseSkaterState(p, {}), 'coast');
  assert.equal(chooseSkaterState(p, {
    push: true
  }), 'push');
  assert.equal(chooseSkaterState(p, {
    left: true
  }), 'turn_left');
  assert.equal(chooseSkaterState(p, {
    right: true
  }), 'turn_right');
  assert.equal(chooseSkaterState(p, {
    brake: true
  }), 'crouch');
  assert.equal(chooseSkaterState({
    ...p,
    onGround: false
  }, {}), 'jump');
  assert.equal(chooseSkaterState({
    ...p,
    landTime: .2
  }, {}), 'land');
  assert.equal(chooseSkaterState({
    ...p,
    grind: .4
  }, {}), 'grind');
  assert.equal(chooseSkaterState({
    ...p,
    stun: .2
  }, {}), 'stumble');
  assert.equal(chooseSkaterState({
    ...p,
    recoverTime: .2
  }, {}), 'recover');
});
test('all thirty current levels explicitly teach spelling parts without treating blends as single phonemes', () => {
  for (const difficulty of ['easy', 'medium', 'hard']) {
    const ladder = grammarGrindLadder(difficulty);
    assert.equal(ladder.length, 10);
    for (const level of ladder) {
      assert.equal(level.type, 'spelling');
      assert.match(level.prompt, /spelling parts/);
      assert.ok(level.options.includes(level.correct));
      assert.equal(level.correct, level.audioWord);
    }
  }
});
test('authored asset retains semantic skin, all ten clips, and planted shoes at board height', async () => {
  const bytes = await fs.readFile(new URL('../../public/game-assets/spell-skate/spell-skater.glb', import.meta.url));
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  assert.deepEqual(gltf.animations.map(a => a.name), SPELL_SKATER_STATES);
  let skins = 0;
  gltf.scene.traverse(n => {
    if (n.isSkinnedMesh) skins++;
  });
  assert.ok(skins > 0);
  const mixer = new THREE.AnimationMixer(gltf.scene);
  for (const name of SPELL_SKATER_STATES) for (const fraction of [0, .25, .5, .75, .99]) {
    mixer.stopAllAction();
    const action = mixer.clipAction(gltf.animations.find(a => a.name === name));
    action.reset().play();
    mixer.update(action.getClip().duration * fraction);
    gltf.scene.updateMatrixWorld(true);
    for (const side of ['L', 'R']) {
      const foot = gltf.scene.getObjectByName('Sole' + side) || gltf.scene.getObjectByName('Sole.' + side);
      assert.ok(foot, `sole ${side}`);
      foot.skeleton.update();
      const vertex = new THREE.Vector3();
      let min = Infinity;
      for (let i = 0; i < foot.geometry.attributes.position.count; i++) {
        foot.getVertexPosition(i, vertex).applyMatrix4(foot.matrixWorld);
        min = Math.min(min, vertex.y);
      }
      const wave = Math.sin(fraction * Math.PI * 2);
      const contact = name === 'push' && side === 'R' ? .565 - .565 * Math.max(0, wave) + .22 * Math.max(0, -wave) : .565;
      assert.ok(Math.abs(min - contact) < .025, `${name} ${side} sole=${min}`);
    }
  }
  mixer.stopAllAction();
  mixer.uncacheRoot(gltf.scene);
  gltf.scene.traverse(n => {
    n.geometry?.dispose();
    for (const mat of Array.isArray(n.material) ? n.material : [n.material]) mat?.dispose();
  });
});
test('assisted traversal routes around solid park furniture with clearance on every segment', () => {
  const obstacles = [{
    x: 0,
    z: 0,
    radius: 5.4
  }];
  const route = planSkateRoute({
    x: 0,
    z: 20
  }, {
    x: 0,
    z: -20
  }, [], [], obstacles);
  assert.ok(route.length > 3);
  let previous = {
    x: 0,
    z: 20
  };
  for (const point of route) {
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      assert.equal(skateObstacleAt(previous.x + (point.x - previous.x) * t, previous.z + (point.z - previous.z) * t, obstacles), null);
    }
    previous = point;
  }
  assert.deepEqual(route.at(-1), {
    x: 0,
    z: -20
  });
});
test('flat ground beside a raised deck never tilts the skater toward its wall', () => {
  const deck = {
    x: 0,
    z: 0,
    rot: 0,
    width: 10,
    depth: 10,
    height: 2
  };
  for (const x of [4.9, 5.1, 5.4]) assert.deepEqual(skateSurfaceTilt(x, 0, 0, [], [deck]), {
    pitch: 0,
    roll: 0
  });
});
test('assisted route clears a rotated deck corner by the full board width', () => {
  const deck = {
    x: 25,
    z: 24,
    rot: -Math.PI * .12,
    width: 26,
    depth: 9,
    height: 1.9
  };
  const start = {
    x: 14.48,
    z: 36.96
  };
  const route = planSkateRoute(start, {
    x: 12,
    z: 8
  }, [], [deck], []);
  assert.ok(route.length > 3);
  let previous = start;
  for (const point of route) {
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      assert.equal(skateDeckClearance(previous.x + (point.x - previous.x) * t, previous.z + (point.z - previous.z) * t, [deck], 2), true);
    }
    previous = point;
  }
});
test('bevelled decks retain the exact top height used by collision sampling', () => {
  for (const height of [.16, 1.9]) {
    const geometry = createSkateDeckGeometry(10, 8, height);
    geometry.computeBoundingBox();
    assert.ok(Math.abs(geometry.boundingBox.max.y - height / 2) < 1e-5);
    assert.ok(Math.abs(geometry.boundingBox.min.y + height / 2) < 1e-5);
    geometry.dispose();
  }
});
test('valid destination remains reachable when its nearest grid cell is blocked', () => {
  const target = {
    x: 18.98,
    z: 9.5
  };
  const route = planSkateRoute({
    x: 16.53,
    z: 33.07
  }, target, [], [{
    x: 25,
    z: 24,
    rot: -Math.PI * .12,
    width: 26,
    depth: 9,
    height: 1.9
  }], [{
    x: 24,
    z: 0,
    radius: 5.4
  }, {
    x: 17,
    z: 1,
    radius: 2.5
  }]);
  assert.ok(route.length > 1);
  assert.deepEqual(route.at(-1), target);
});
test('slow frames preserve safe physical time steps and reduce expensive effects', () => {
  const steps = skateFrameSteps(.10);
  assert.equal(steps.length, 5);
  assert.ok(steps.every(step => step <= .02));
  assert.ok(Math.abs(steps.reduce((a, b) => a + b, 0) - .10) < 1e-8);
  assert.ok(skateFrameSteps(3).reduce((a, b) => a + b, 0) <= .120001);
  assert.equal(nextSkateQuality('high', .08), 'medium');
  assert.equal(nextSkateQuality('medium', .08), 'low');
  assert.equal(nextSkateQuality('high', .016), 'high');
});

test('destination route detours around a different spelling pickup before the selected one', () => {
  const start={x:-40.29,z:60.69},target={x:-18.60,z:70};
  const wrong={x:-27.68,z:70,radius:2.2};
  const route=planSkateRoute(start,target,[],[],[wrong]);
  assert.deepEqual(route.at(-1),target);
  let previous=start;
  for(const point of route){
    for(let t=0;t<=1;t+=.05) assert.ok(Math.hypot(previous.x+(point.x-previous.x)*t-wrong.x,previous.z+(point.z-previous.z)*t-wrong.z)>4.2);
    previous=point;
  }
});

test('shared steering motion and offline route timing remain stable at normal frame rates',()=>{
  const state={speed:8,yaw:.4,onGround:true};
  const controls={turn:.5,push:1,brake:0,boost:false,active:true,maxSpeed:29,minSpeed:0,topSpeed:14};
  const result=skateMotion(state,controls,1/60);
  assert.ok(Math.abs(result.speed-(8+24/60)*Math.pow(.945,8/60))<1e-12);
  assert.ok(Math.abs(result.yaw-(.4+.5/60*(1.65+8/29*1.1)))<1e-12);
  const travels=[{start:{x:0,z:0,yaw:0,speed:0},target:{x:20,z:30},route:[{x:0,z:20},{x:20,z:30}],radius:4.2,maxSpeed:29}];
  const sixty=measureSkateTravel(travels),oneTwenty=measureSkateTravel(travels,1/120);
  assert.ok(sixty>3 && sixty<20);
  assert.ok(Math.abs(sixty-oneTwenty)<.15);
});

test('park encounters retain substantial travel even at every boundary and the shortest outing exceeds two minutes',()=>{
  for(const x of [-70,-35,0,35,70])for(const z of [-70,-35,0,35,70]){
    const occupied=[];
    for(let i=0;i<3;i++){
      const destination=chooseSkateDestination({x,z},.7,i,5,occupied,[],[],[]);
      assert.ok(Math.hypot(destination.x-x,destination.z-z)>=SKATE_DESTINATION_DISTANCE);
      assert.ok(Math.abs(destination.x)<=70 && Math.abs(destination.z)<=70);
      occupied.push(destination);
    }
  }
  for(const difficulty of ['easy','medium','hard']){
    const visits=grammarGrindLadder(difficulty).reduce((n,level)=>n+level.segments.length+1,0);
    // Conservative bound assumes instantly reaching top assisted speed, no turns,
    // and collecting every encounter at its largest collision radius.
    assert.ok(visits*(SKATE_DESTINATION_DISTANCE-4.8)/14>120);
  }
});

test('network recovery embeds exactly the same retained authored skin',async()=>{
  const {SPELL_SKATER_BASE64}=await import('../../src/components/learn/games/games/spellSkaterFallback.js');
  const original=await fs.readFile(new URL('../../public/game-assets/spell-skate/spell-skater.glb',import.meta.url));
  assert.deepEqual(Buffer.from(SPELL_SKATER_BASE64,'base64'),original);
});
