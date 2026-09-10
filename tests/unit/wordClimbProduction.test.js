import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createClimbJourney } from "../../src/components/learn/games/games/wordClimbJourney.js";
import { createClimbSceneKit } from "../../src/components/learn/games/games/wordClimbSceneKit.js";
import { createClimbWorld, jumpToClimbPlatform, advanceClimbWorld } from "../../src/components/learn/games/games/wordClimbWorld.js";
import { createWordClimbSession } from "../../src/utils/wordClimbLevels.js";
import { climbSessionKey, readClimbSession, writeClimbSession, clearClimbSession } from "../../src/components/learn/games/games/wordClimbSession.js";
import { CLIMBER_GLB_BASE64 } from "../../src/components/learn/games/games/wordClimbAssetFallback.js";
import { climbViewportMetrics } from "../../src/components/learn/games/games/wordClimbView.js";

function memory(){const values=new Map();return{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};}
test("short-screen projection separates Pip from the next physical shelf without shrinking touch targets",()=>{
  for(const [width,height] of [[568,140],[390,652],[1024,576]]){
    const metrics=climbViewportMetrics(width,height),camera=-115+metrics.cameraOffset;
    const upper=(1-(210-camera)/metrics.viewHeight)*height;
    const feet=(1-(-camera)/metrics.viewHeight)*height;
    assert.ok(upper>=0);assert.ok(upper+56<=height);
    assert.ok(feet-metrics.heroPixels>upper+metrics.shelfPixels,"the upper stone must not hide Pip's head");
  }
});
test("an airborne reload retains word identity, physical work and errors; Start over rejects the sidecar",()=>{
  const session=createWordClimbSession("hard"),world=createClimbWorld(session,3),storage=memory(),key=climbSessionKey("pupil-a","hard");
  world.wrong=2;world.motorFalls=1;jumpToClimbPlatform(world,world.platforms.find(p=>p.row===4&&p.correct).id);advanceClimbWorld(world,.1);
  writeClimbSession(storage,key,session,world);
  const restored=readClimbSession(storage,key,3,true);
  assert.deepEqual(restored.session,session);assert.deepEqual(restored.world,{...world,event:null,paused:false});
  assert.equal(restored.world.state,"airborne");assert.equal(restored.world.wrong,2);
  assert.equal(readClimbSession(storage,key,3,false),null);
  assert.equal(readClimbSession(storage,key,4,true),null);
  assert.equal(readClimbSession(storage,climbSessionKey("pupil-b","hard"),3,true),null);
  clearClimbSession(storage,key);assert.equal(readClimbSession(storage,key,3,true),null);
});
test("completed but unreported summit restores once at the parent final checkpoint",()=>{
  const session=createWordClimbSession("easy"),world=createClimbWorld(session,session.summit-1),storage=memory();
  jumpToClimbPlatform(world,world.platforms.find(p=>p.row===session.summit&&p.correct).id);
  for(let i=0;i<180&&!world.completed;i++)advanceClimbWorld(world,1/60);
  assert.equal(world.completed,true);writeClimbSession(storage,"pending",session,world);
  assert.equal(readClimbSession(storage,"pending",session.summit-1,true).world.completed,true);
  assert.equal(readClimbSession(storage,"pending",session.summit-1,false),null);
});
test("authored Moonwood kit has finite geometry at portrait and short-screen proportions",()=>{
  const session=createWordClimbSession("hard"),world=createClimbJourney(session);
  for(const [width,height] of [[230,30],[1500,120]]){
    const scene=createClimbSceneKit(world.platforms,world.summit,width,height,world.journey);let meshes=0;
    scene.traverse(m=>{if(!m.isMesh)return;meshes++;m.geometry.computeBoundingBox();assert.ok(Number.isFinite(m.geometry.boundingBox.min.x));assert.ok(Number.isFinite(m.geometry.boundingBox.max.y));});
    assert.ok(meshes>0);scene.updateMatrixWorld(true);
    const camera=new THREE.OrthographicCamera(-width/2,width/2,350,0,1,1400);camera.position.z=450;
    for(const y of [0,world.summitHeight/2,world.summitHeight-250]){
      camera.position.y=y;camera.updateMatrixWorld();
      const frustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
      let draws=0;scene.traverse(m=>{if(m.isMesh&&frustum.intersectsObject(m))draws+=Array.isArray(m.material)?m.geometry.groups.length:1;});
      assert.ok(draws<100,`visible scenery must stay bounded while distant chunks cull (${draws})`);
    }
    for(const p of world.platforms){const ledge=scene.getObjectByName(`moss-capped-branch-shelf-${p.row}`);assert.ok(ledge);}
    assert.ok(scene.getObjectByName("summit-lantern-landmark"));
  }
});
test("canonical Pip asset has seven independent climbing clips and grounded boot contacts",async()=>{
  const bytes=fs.readFileSync(new URL("../../public/game-assets/word-climb/pip-climber.glb",import.meta.url));
  assert.ok(Buffer.from(CLIMBER_GLB_BASE64,"base64").equals(bytes),"recovery bytes must be the exact authored character, not a second design");
  const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),"");
  assert.deepEqual(gltf.animations.map(a=>a.name).sort(),["climb","grip","jump","land","recover","rest","summit"]);
  const mixer=new THREE.AnimationMixer(gltf.scene);
  const climb=mixer.clipAction(gltf.animations.find(a=>a.name==='climb')).play();
  const hands=[];
  for(const time of [.25,.75].map(t=>t*climb.getClip().duration)){
    mixer.setTime(time);gltf.scene.updateMatrixWorld(true);
    const left=gltf.scene.getObjectByName('handL').getWorldPosition(new THREE.Vector3());
    const right=gltf.scene.getObjectByName('handR').getWorldPosition(new THREE.Vector3());
    const head=gltf.scene.getObjectByName('head').getWorldPosition(new THREE.Vector3());
    assert.ok(left.y>head.y+.35&&right.y>head.y+.35,'hands clear the face while reaching');hands.push(left.y-right.y);
  }
  assert.ok(hands[0]*hands[1]<0,'opposite hands take turns reaching');climb.stop();

  for(const name of ["rest","land","summit"]){
    mixer.stopAllAction();mixer.clipAction(gltf.animations.find(a=>a.name===name)).play();mixer.update(.14);gltf.scene.updateMatrixWorld(true);
    const feet=new THREE.Box3();let vertices=0;
    gltf.scene.traverse(m=>{if(!m.isSkinnedMesh)return;assert.ok(!m.skeleton.bones.some(b=>/wheel|steer|chassis|suspension/i.test(b.name)));
      for(let i=0;i<m.geometry.attributes.position.count;i++){
        const bone=m.skeleton.bones[m.geometry.attributes.skinIndex.getX(i)];if(!bone.name.startsWith("foot"))continue;
        const point=m.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(m.matrixWorld);feet.expandByPoint(point);vertices++;
      }
    });
    assert.ok(vertices>300);assert.ok(Math.abs(feet.min.y)<.025,`${name} boot sole remains within 2.5cm of the actual ledge`);
  }
});

test("partial route reload retains lanterns, recovery and the exact next word station",()=>{
 const session=createWordClimbSession("medium"),world=createClimbJourney(session,1),storage=memory();
 world.journey.collected.push(world.journey.lights[0].id);world.y=315;world.x=540;world.state="gripping";
 world.journey.safeRest={id:world.safeId,x:500,y:0};
 writeClimbSession(storage,"route",session,world);const loaded=readClimbSession(storage,"route",0,true);
 assert.deepEqual(loaded.world, {...world,paused:false,event:null});
 assert.deepEqual(loaded.session,session);assert.equal(readClimbSession(storage,"route",0,false),null);
});
