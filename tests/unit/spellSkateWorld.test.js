import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createSkateParkDressing, createSkateTextSign, sampleSkateSurface, skateRampProfile, skateSurfaceTilt, createSkateRampGeometry, createSkateDeckGeometry, planSkateRoute, skateObstacleAt, resolveSkateObstacleContact, skateDeckClearance, skateFrameSteps, nextSkateQuality, skateMotion, skateAction, measureSkateTravel, chooseSkateDestination, SKATE_DESTINATION_DISTANCE } from '../../src/components/learn/games/games/spellSkatePark.js';
import { chooseSkaterState, SPELL_SKATER_STATES } from '../../src/components/learn/games/games/spellSkaterAsset.js';
import { grammarGrindLadder } from '../../src/utils/grammarGrindLevels.js';
test('the planted park hills face outward and upward to receive daylight',()=>{
  const park=createSkateParkDressing({accent2:'#42b9a7'},'easy');
  const hills=[];
  park.traverse(node=>{if(node.name==='Planted park hill')hills.push(node);});
  assert.equal(hills.length,12);
  for(const hill of hills) {
    const position=hill.geometry.attributes.position,normal=hill.geometry.attributes.normal;
    const index=10;
    assert.ok(position.getX(index)*normal.getX(index)+position.getZ(index)*normal.getZ(index)>0);
    assert.ok(normal.getY(index)>0);
  }
  park.traverse(node=>{node.geometry?.dispose();for(const material of Array.isArray(node.material)?node.material:[node.material])material?.dispose();});
});
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

test('compressed network recovery preserves exactly the same retained authored skin',async()=>{
  const {gunzipSync}=await import('node:zlib');
  const recovery=await fs.readFile(new URL('../../src/assets/game-recovery/spell-skater.glb.gz',import.meta.url));
  const original=await fs.readFile(new URL('../../public/game-assets/spell-skate/spell-skater.glb',import.meta.url));
  assert.deepEqual(gunzipSync(recovery),original);
});


test('park banners keep left-to-right lettering on both approaches without mirrored backfaces', () => {
  const texture=new THREE.Texture();
  const sign=createSkateTextSign(texture,6.8,2.1);
  assert.equal(sign.material.side,THREE.FrontSide);
  assert.equal(sign.material.map,texture);
  const position=sign.geometry.attributes.position,uv=sign.geometry.attributes.uv;
  const normal=sign.geometry.attributes.normal;
  for(const [offset,side] of [[0,1],[4,-1]]){
    assert.equal(uv.getX(offset),0);assert.equal(uv.getX(offset+2),1);
    assert.ok((position.getX(offset+2)-position.getX(offset))*side>0,'texture progresses rightward from the viewer on each side');
    assert.ok(normal.getZ(offset)*side>.99,'each printed face points toward its own approach');
    assert.ok(position.getZ(offset)*side>0,'faces are separated so they cannot fight for depth');
    const ray=new THREE.Raycaster(new THREE.Vector3(0,0,side*10),new THREE.Vector3(0,0,-side));
    sign.updateMatrixWorld();const hits=ray.intersectObject(sign);
    assert.ok(hits.length>=1);assert.ok(hits[0].normal.z*side>.99,'the visible text is the outward face');
  }
  sign.geometry.dispose();sign.material.dispose();texture.dispose();
});


test('one skate action responds to ground, rails, airborne repeats and recovery', () => {
  const grounded = { onGround: true, speed: 12, airTricks: 0 };
  assert.equal(skateAction(grounded), 'ollie');
  assert.equal(skateAction(grounded, true), 'grind');
  assert.equal(skateAction({ ...grounded, speed: -8 }, true), 'grind');
  assert.equal(skateAction({ ...grounded, speed: 0 }, true), 'ollie');
  assert.equal(skateAction({ ...grounded, grind: .5 }, true), 'pop-out');
  assert.equal(skateAction({ ...grounded, onGround: false }), 'spin');
  assert.equal(skateAction({ ...grounded, onGround: false, airTricks: 1 }), 'spin');
  assert.equal(skateAction({ ...grounded, onGround: false, airTricks: 2 }), 'none');
  assert.equal(skateAction({ ...grounded, stun: .2 }, true), 'none');
});

test('forward acceleration reaches cruising speed without a boost resource and release coasts', () => {
  const state = { speed: 0, yaw: 0, onGround: true };
  const controls = { active: true, turn: 0, push: 1, brake: 0, boost: true, maxSpeed: 9, minSpeed: -4.05, topSpeed: 17 };
  for (let n = 0; n < 40; n++) Object.assign(state, skateMotion(state, controls, 1 / 60));
  assert.equal(state.speed, 17);
  const coast = skateMotion(state, { ...controls, push: 0, boost: false }, 1 / 60);
  assert.ok(coast.speed < 17 && coast.speed > 16);
  const reverse = { ...state };
  for (let n = 0; n < 90; n++) Object.assign(reverse, skateMotion(reverse, { ...controls, push: 0, boost: false, brake: 1 }, 1 / 60));
  assert.equal(reverse.speed, -4.05);
});


test('landing anywhere in park furniture resolves contact once without trapping movement', () => {
  for (const difficulty of ['easy', 'medium', 'hard']) {
    const park = createSkateParkDressing({ accent2: '#42b9a7' }, difficulty);
    const obstacles = park.userData.obstacles;
    for (const obstacle of obstacles) for (const depth of [0, .2, .8, .999]) {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
        const position = {
          x: obstacle.x + Math.sin(angle) * (obstacle.radius + 2.15) * depth,
          z: obstacle.z + Math.cos(angle) * (obstacle.radius + 2.15) * depth
        };
        const previous = { x: position.x + .1, z: position.z + .1 };
        const contact = resolveSkateObstacleContact(position, previous, obstacles);
        assert.ok(contact, `${difficulty}: landing must resolve`);
        assert.ok(Number.isFinite(contact.x) && Number.isFinite(contact.z));
        assert.equal(skateObstacleAt(contact.x, contact.z, obstacles), null);
        assert.equal(resolveSkateObstacleContact(contact, contact, obstacles), null, 'stationary next frame must not restart stun');
        assert.ok(Math.hypot(contact.x - position.x, contact.z - position.z) < 10, 'separation stays local to the furniture');
      }
    }
    park.traverse(node => {
      node.geometry?.dispose();
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) material?.dispose();
    });
  }
});

test('landing resolves overlapping furniture, coincident centres and shallow contacts', () => {
  for (const obstacles of [
    [{ x: 0, z: 0, radius: 5.4 }, { x: 7, z: 1, radius: 2.5 }],
    [{ x: 0, z: 0, radius: 2 }, { x: 0, z: 0, radius: 5 }],
    [{ x: 0, z: 0, radius: 2 }, { x: 3, z: 0, radius: 2 }, { x: 1.5, z: 2, radius: 2 }]
  ]) {
    const contact = resolveSkateObstacleContact({ x: 0, z: 0 }, { x: 0, z: 0 }, obstacles);
    assert.ok(contact);
    assert.equal(skateObstacleAt(contact.x, contact.z, obstacles), null);
  }
  const obstacle = [{ x: 0, z: 0, radius: 5 }];
  const shallow = resolveSkateObstacleContact({ x: 7.14, z: 0 }, { x: 7.2, z: 0 }, obstacle);
  assert.ok(Math.abs(shallow.x - 7.14) < .021, 'a shallow impact must not jump to a spawn point');
  assert.equal(resolveSkateObstacleContact({ x: 10, z: 0 }, { x: 10, z: 0 }, obstacle), null);
});

test('a spelling choice remains reachable from furniture landings throughout all authored parks', () => {
  const target = { x: 0, z: 36 };
  for (const difficulty of ['easy', 'medium', 'hard']) {
    const park = createSkateParkDressing({ accent2: '#42b9a7' }, difficulty);
    const obstacles = park.userData.obstacles;
    const ramps = [
      { x: -51, z: -14, rot: Math.PI, width: 12, depth: 18, height: 3.6 },
      { x: -51, z: -39, rot: 0, width: 32, depth: 32, radius: 16, height: 3.6, kind: 'bowl' }
    ];
    const platforms = [];
    if (difficulty === 'easy') ramps.push({ x: 35, z: -64, rot: -Math.PI * .12, width: 15, depth: 18, height: 3.2 });
    else {
      ramps.push(...[
        [38, 32, Math.PI * 1.18, 20, 22, 5.2], [-2, 56, Math.PI, 32, 18, 4.1], [44, -46, -Math.PI * .38, 16, 18, 3.8]
      ].map(([x, z, rot, width, depth, height]) => ({ x, z, rot, width, depth, height })));
      ramps.push(...[
        [-58, 22, Math.PI * .48, 24, 7.8], [58, -24, -Math.PI * .52, 28, 8.2], [-2, -68, 0, 34, 7.4]
      ].map(([x, z, rot, width, depth]) => ({ x, z, rot, width, depth, height: depth, kind: 'quarter' })));
      platforms.push(...[
        [-20, -18, Math.PI * .08, 22, 10, 1.7], [25, 24, -Math.PI * .12, 26, 9, 1.9], [7, -34, Math.PI * .42, 18, 8, 1.45]
      ].map(([x, z, rot, width, depth, height]) => ({ x, z, rot, width, depth, height })));
    }
    for (const obstacle of obstacles) for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      const position = {
        x: obstacle.x + Math.sin(angle) * (obstacle.radius + 2.15) * .8,
        z: obstacle.z + Math.cos(angle) * (obstacle.radius + 2.15) * .8
      };
      const start = resolveSkateObstacleContact(position, position, obstacles);
      const route = planSkateRoute(start, target, ramps, platforms, obstacles);
      assert.ok(route.length, `${difficulty}: no escape route at ${JSON.stringify(start)}`);
      assert.deepEqual(route.at(-1), target);
      let previous = start;
      for (const [index, point] of route.entries()) {
        for (const solid of obstacles) {
          let distance = Math.hypot(previous.x - solid.x, previous.z - solid.z);
          const escaping = index === 0 && distance < solid.radius + 4;
          for (let n = 1; n <= 20; n++) {
            const x = previous.x + (point.x - previous.x) * n / 20;
            const z = previous.z + (point.z - previous.z) * n / 20;
            const nextDistance = Math.hypot(x - solid.x, z - solid.z);
            assert.ok(nextDistance >= solid.radius + (escaping ? 2.15 : 4) - 1e-7, 'route enters furniture');
            if (escaping) assert.ok(nextDistance >= distance - 1e-7, 'first edge approaches an enclosing object');
            distance = nextDistance;
          }
        }
        previous = point;
      }
    }
    park.traverse(node => {
      node.geometry?.dispose();
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) material?.dispose();
    });
  }
});

test('the first route segment leaves the actual contact position without cutting through it', () => {
  const obstacles = [{ x: 0, z: 0, radius: 5.4 }];
  const start = { x: 7.56, z: 0 };
  assert.deepEqual(planSkateRoute(start, { x: 12, z: 0 }, [], [], obstacles), [{ x: 12, z: 0 }]);
  assert.deepEqual(planSkateRoute(start, { x: 6, z: 6 }, [], [], obstacles), [], 'nearby target cannot bypass the actual first-segment collision');
  const overlapping = [{ x: 0, z: 0, radius: 5.4 }, { x: 7, z: 1, radius: 2.5 }];
  const contact = resolveSkateObstacleContact({ x: 6, z: 0 }, { x: 6, z: 0 }, overlapping);
  const route = planSkateRoute(contact, { x: 20, z: -20 }, [], [], overlapping);
  assert.ok(route.length);
  for (const obstacle of overlapping) {
    const dx = contact.x - obstacle.x, dz = contact.z - obstacle.z;
    if (Math.hypot(dx, dz) < obstacle.radius + 4) {
      assert.ok(dx * (route[0].x - contact.x) + dz * (route[0].z - contact.z) >= 0, 'escape must leave both overlapping margins');
    }
  }
});

test('egress beside a raised deck preserves its wall and restores normal clearance afterward', () => {
  const deck = { x: 0, z: 0, rot: .24, width: 10, depth: 8, height: 2 };
  const distanceToDeck = point => {
    const x = point.x * Math.cos(deck.rot) - point.z * Math.sin(deck.rot);
    const z = point.x * Math.sin(deck.rot) + point.z * Math.cos(deck.rot);
    return Math.hypot(Math.max(0, Math.abs(x) - 5), Math.max(0, Math.abs(z) - 4));
  };
  const start = { x: 5.5 * Math.cos(deck.rot), z: -5.5 * Math.sin(deck.rot) };
  const route = planSkateRoute(start, { x: -20, z: 0 }, [], [deck], []);
  assert.ok(route.length);
  let previous = start;
  for (const [index, point] of route.entries()) {
    let distance = distanceToDeck(previous);
    for (let n = 1; n <= 40; n++) {
      const sample = { x: previous.x + (point.x - previous.x) * n / 40, z: previous.z + (point.z - previous.z) * n / 40 };
      const nextDistance = distanceToDeck(sample);
      assert.ok(nextDistance > 0, 'route must never enter the raised deck wall');
      if (index === 0) assert.ok(nextDistance >= distance - 1e-7, 'escape must move away from the deck');
      else assert.ok(skateDeckClearance(sample.x, sample.z, [deck], 2), 'later segments retain board clearance');
      distance = nextDistance;
    }
    previous = point;
  }
});
