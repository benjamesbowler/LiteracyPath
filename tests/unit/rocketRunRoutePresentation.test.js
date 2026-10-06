import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createRocketViewGeometry } from '../../src/utils/rocketRunViewGeometry.js';
import { createRocketRoutePresentation, rocketRunRoutePlacements, rocketRunRouteScreenPlacement }
  from '../../src/components/learn/games/games/rocketRunRoutePresentation.js';

const sample = () => ({ distance: 125, round: 3, seed: 0xffffffff,
  carriers: [{ alive: true, passed: false, flightId: 7, x: -2.2, z: -8, radius: .42 }] });
const sourceRadius = role => ({courier:.42,asteroid:.64})[role] || null;

test('cargo and hazards follow their unchanged actual centres/radii without consulting answer or history', () => {
  const state = sample(), courier = state.carriers[0];
  for (const field of ['word','correct','trialId']) Object.defineProperty(courier, field,
    { get() { throw new Error('presentation read language field '+field); } });
  for (const field of ['target','intent','responses']) Object.defineProperty(state, field,
    { enumerable: true, get() { throw new Error('presentation read language history '+field); } });
  const before = { ...courier };
  const rows = rocketRunRoutePlacements(state,
    [{ id: 'meteor-3-0', alive: true, x: 2.2, z: -14, radius: .55 }],sourceRadius).objects;
  const cargo = rows.find(row => row.kind === 'cargo'), hazard = rows.find(row => row.kind === 'hazard');
  assert.deepEqual([cargo.x,cargo.y,cargo.z,cargo.scale,cargo.motorId], [-2.2,.54,-8,1,7]);
  assert.deepEqual([hazard.x,hazard.y,hazard.z,hazard.scale,hazard.motorId], [2.2,.54,-14,.55/.64,'meteor-3-0']);
  assert.deepEqual({ ...courier }, before);
  cargo.x = 90;
  assert.equal(courier.x, -2.2);
  assert.equal(rocketRunRoutePlacements(state,[],sourceRadius).objects.find(row => row.kind === 'cargo').x, -2.2);
  assert.equal(rocketRunRoutePlacements(state).objects.find(row => row.kind === 'cargo').scale,0,
    'undelivered source size must not acquire a fabricated core scale');
});

test('all three world presentations use their own authored itinerary while cargo and hazard geometry stay exact', () => {
  const state={...sample(),journeyIndex:5};
  const meteors=[{id:'meteor-real',alive:true,x:2.2,z:-14,radius:.55}];
  const physical=[];
  for(const world of ['meadow','dino','moonwood']){
    const direct=rocketRunRoutePlacements(state,meteors,sourceRadius,{world});
    assert.ok(direct.itineraryId.startsWith(world+'-'));
    physical.push(direct.objects.filter(row=>row.kind!=='scenery'));
    const group=new THREE.Group();
    const assets={coreRadius:sourceRadius,draw(){return true;},
      createMesh(){throw new Error('Canvas cannot request a new geometry');},releaseMesh(){}};
    const scene=createRocketRoutePresentation(assets,group,{world});
    scene.update(state,createRocketViewGeometry(320,340),meteors,{createMeshes:false});
    assert.equal(scene.inspect().itineraryId,direct.itineraryId);
    assert.deepEqual(scene.inspect().objects,direct.objects);
    scene.dispose();
  }
  assert.deepEqual(physical[0],physical[1]);assert.deepEqual(physical[1],physical[2]);
});

test('Canvas uses the actual camera-facing Three plane scale in wide/portrait/short and off-axis placements', () => {
  for (const [width,height] of [[1366,768],[320,568],[320,340],[568,260]]) {
    const view = createRocketViewGeometry(width,height);
    for (const x of [-8,-2.2,0,2.2,8]) {
      const row = { x,y:.54,z:-10,scale:.9 }, screen = rocketRunRouteScreenPlacement(row,view);
      const right = new THREE.Vector3(1,0,0).applyQuaternion(view.camera.quaternion);
      const origin = new THREE.Vector3(row.x,row.y,row.z);
      const actual = origin.clone().addScaledVector(right,row.scale);
      const p = origin.project(view.camera), q = actual.project(view.camera);
      const expected = Math.hypot((q.x-p.x)*width/2,(q.y-p.y)*height/2);
      assert.ok(Math.abs(screen.unitScale-expected)<1e-9,
        `registered plane diverged at ${width}x${height}, x=${x}`);
    }
  }
});

test('scene instances rebuild after an atlas retry and release without disposing bank-owned shared resources', () => {
  const group = new THREE.Group(), geometry = new THREE.PlaneGeometry(1,1), material = new THREE.MeshBasicMaterial();
  const owned = new Set(), drawn = [];
  let prematureDisposals = 0;
  geometry.addEventListener('dispose', () => prematureDisposals++);
  material.addEventListener('dispose', () => prematureDisposals++);
  const assets = {
    coreRadius:sourceRadius,
    createMesh(role) { const mesh = new THREE.Mesh(geometry,material); mesh.userData.role = role; owned.add(mesh); return mesh; },
    releaseMesh(mesh) { owned.delete(mesh); mesh.removeFromParent(); },
    draw(_ctx,role,screen) { drawn.push({role,screen}); return true; },
  };
  const scene = createRocketRoutePresentation(assets,group), state = sample(), view = createRocketViewGeometry(320,568);
  scene.update(state,view);
  const first = group.children.find(mesh => mesh.userData.motorId === 7);
  assert.ok(first);
  const expected = rocketRunRoutePlacements(state,[],sourceRadius).objects;
  assert.equal(scene.inspect().instanceCount,expected.length);
  const snapshot = scene.inspect(); snapshot.objects[0].x = 999;
  assert.notEqual(scene.inspect().objects[0].x,999);
  for (const mesh of [...owned]) assets.releaseMesh(mesh);
  scene.update(state,view);
  assert.notEqual(group.children.find(mesh => mesh.userData.motorId === 7),first);
  assert.equal(scene.draw({},view).delivered,drawn.length);
  for (let i=1;i<drawn.length;i++) assert.ok(drawn[i-1].screen.depth>=drawn[i].screen.depth);
  scene.dispose(); scene.dispose();
  assert.equal(group.children.length,0); assert.equal(owned.size,0); assert.equal(prematureDisposals,0);
  geometry.dispose(); material.dispose();
});

test('Canvas transition keeps one physical placement list without allocating meshes, and depth layers cover it once', () => {
  const group=new THREE.Group(), painted=[];
  let meshRequests=0, meshReleases=0;
  const assets={coreRadius:sourceRadius,
    createMesh(){meshRequests++;return new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial());},
    releaseMesh(mesh){meshReleases++;mesh.geometry.dispose();mesh.material.dispose();mesh.removeFromParent();},
    draw(_ctx,role,screen){painted.push({role,depth:screen.depth});return true;}};
  const presentation=createRocketRoutePresentation(assets,group),state=sample(),view=createRocketViewGeometry(568,260);
  presentation.update(state,view);
  assert.ok(meshRequests>0);
  const initialRequests=meshRequests,physicalBefore=presentation.inspect().objects;
  presentation.update(state,view,[],{createMeshes:false});
  assert.equal(meshRequests,initialRequests);assert.equal(meshReleases,initialRequests);
  assert.equal(group.children.length,0);assert.deepEqual(presentation.inspect().objects,physicalBefore);
  const depth=view.project(0,.54,-1.8).depth;
  const far=presentation.draw({},view,{minDepth:depth,maxDepth:1});
  assert.ok(painted.every(row=>row.depth>=depth));
  const farCount=painted.length;
  const near=presentation.draw({},view,{minDepth:-1,maxDepth:depth});
  assert.ok(painted.slice(farCount).every(row=>row.depth<depth));
  const layered=[...painted];painted.length=0;
  const complete=presentation.draw({},view);
  assert.equal(far.requested+near.requested,complete.requested);
  assert.equal(layered.length,painted.length);
  assert.deepEqual(layered.map(row=>[row.role,row.depth]).sort(),painted.map(row=>[row.role,row.depth]).sort());
  presentation.releaseInstances();presentation.dispose();
});
