import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';
import * as THREE from 'three';
import {WORD_CLIMB_ATLASES,WORD_CLIMB_MOVEMENT_ATLASES} from '../../src/components/learn/games/games/wordClimbArt.generated.js';
import {createWordClimbRegisteredActor,wordClimbRegisteredAction} from '../../src/components/learn/games/games/wordClimbRegisteredActor.js';
import {createWordClimbVine} from '../../src/components/learn/games/games/wordClimbVine.js';

const atlas=WORD_CLIMB_ATLASES.bouncy,hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
test('Climb pilot preserves exact original/runtime identity and registers actual opaque hands and two boot soles',async()=>{
  const manifest=JSON.parse(await fs.readFile('source-art/arcade/physical-worlds/word-climb/manifest.json','utf8'));
  const asset=manifest.assets[0],source=await fs.readFile(asset.source),runtime=await fs.readFile('public'+asset.runtime);
  assert.equal(hash(source),asset.sourceSha256);assert.equal(hash(runtime),asset.runtimeSha256);
  const{data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.deepEqual([info.width,info.height],asset.sourceSize);assert.equal(data[3],0);assert.equal(asset.frames.length,4);
  for(const frame of asset.frames){
    for(const name of ['bootLeft','bootRight']){
      const point=frame.measurement.contactsSource[name];assert.ok(data[(point[1]*info.width+Math.round(point[0]))*4+3]>=160);
    }
    for(const name of ['grip','lowerHand']){
      const point=frame.measurement.contactsSource[name];if(point)assert.ok(data[(point[1]*info.width+point[0])*4+3]>=160);
      else assert.equal(frame.contacts[name],null,'Hidden hands are not fabricated');
    }
  }
  const[a,b]=atlas.frames.filter(frame=>frame.action.startsWith('climb-'));
  assert.ok(a.sockets.grip[0]-a.cell[0]-a.anchor[0]>0);assert.ok(b.sockets.grip[0]-b.cell[0]-b.anchor[0]<0);
  assert.equal(manifest.review.runtimeAcceptance,'LOCAL_NATIVE_PASS');
  assert.equal(manifest.review.humanApproval,'UNKNOWN','Local native checks do not invent human approval');
  assert.equal(manifest.review.physicalDeviceObservation,'UNKNOWN','Desktop checks do not prove physical-device behaviour');
  const native=JSON.parse(await fs.readFile(manifest.review.nativeEvidence,'utf8'));
  assert.equal(native.localRuntimeAcceptance,'LOCAL_NATIVE_PASS');
  assert.equal(native.reviewedEvidence,'docs/design/WORD_CLIMB_IMPLEMENTATION.md');
  for(const id of native.currentPacedProofIds)assert(native.nativeProofs.some(row=>row.id===id&&['passed','measured'].includes(row.status)&&row.sourceFreezeExact));
});

test('registered climbing mesh and socket use the same measured palm under scale, lean and actual scene translation',async()=>{
  const OldImage=globalThis.Image;
  class DecodedImage{constructor(){this.naturalWidth=atlas.width;this.naturalHeight=atlas.height;}set src(value){if(value)queueMicrotask(()=>this.onload?.());}async decode(){}}
  globalThis.Image=DecodedImage;
  const actor=createWordClimbRegisteredActor(THREE,atlas),scene=new THREE.Group();scene.position.set(31,700,44);scene.scale.setScalar(17);scene.add(actor.root);
  try{
    assert.equal(await actor.ready,true);assert.equal(actor.update({state:'climbing',elapsed:.38},{lean:.17}),true);
    const frame=atlas.frames.find(frame=>frame.action==='climb-b'),geometry=actor.root.children[0].geometry,body=actor.root.children[0];
    const u=(frame.sockets.grip[0]-frame.cell[0])/(frame.cell[2]-frame.cell[0]),v=(frame.sockets.grip[1]-frame.cell[1])/(frame.cell[3]-frame.cell[1]);
    const pixelOnMesh=new THREE.Vector3(u-.5,.5-v,0);scene.updateMatrixWorld(true);body.localToWorld(pixelOnMesh);
    const contact=actor.contactWorld('grip',new THREE.Vector3());assert.ok(contact.distanceTo(pixelOnMesh)<1e-9,'Rendered palm and physical vine endpoint coincide');
    actor.update({state:'gripping',elapsed:100});assert.equal(actor.action,'climb-b','A stopped climber holds its actual last palm pose');
    actor.update({state:'grounded',elapsed:100});assert.equal(actor.contactWorld('grip',new THREE.Vector3()),null,'Rest has no invented grip socket');
    assert.equal(actor.root.children[0].geometry,geometry,'Pose changes retain one owned mesh geometry');
  }finally{actor.dispose();globalThis.Image=OldImage;}
});

test('Climb pose selection follows controller simulation time and preserves a paused grip',()=>{
  assert.equal(wordClimbRegisteredAction({state:'climbing',elapsed:.1}),'climb-a');
  assert.equal(wordClimbRegisteredAction({state:'climbing',elapsed:.4}),'climb-b');
  assert.equal(wordClimbRegisteredAction({state:'gripping',elapsed:100},'climb-b'),'climb-b');
  assert.equal(wordClimbRegisteredAction({state:'recovering',elapsed:100}),'recover-grip');
  assert.equal(wordClimbRegisteredAction({state:'airborne',vy:10,elapsed:100}),'jump-rise');
  assert.equal(wordClimbRegisteredAction({state:'airborne',vy:-10,elapsed:100}),'jump-fall');
  assert.equal(wordClimbRegisteredAction({state:'landed',elapsed:100}),'land');
  assert.equal(wordClimbRegisteredAction({completed:true,elapsed:100},'climb-a',.1),'summit-a');
  assert.equal(wordClimbRegisteredAction({completed:true,elapsed:100},'climb-a',.5),'summit-b');
});

test('all three original Climb casts retain exact sources, two actual boot contacts and the complete mechanical action family',async()=>{
  const manifest=JSON.parse(await fs.readFile('source-art/arcade/physical-worlds/word-climb/manifest.json','utf8'));
  assert.equal(manifest.assets.length,6);assert.equal(manifest.assets.reduce((sum,asset)=>sum+asset.frames.length,0),30);
  for(const asset of manifest.assets){
    const source=await fs.readFile(asset.source),runtime=await fs.readFile('public'+asset.runtime);
    assert.equal(hash(source),asset.sourceSha256);assert.equal(hash(runtime),asset.runtimeSha256);
    const{data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true}),runtimeInfo=await sharp(runtime).metadata();
    assert.deepEqual([info.width,info.height],asset.sourceSize);assert.deepEqual([runtimeInfo.width,runtimeInfo.height],asset.runtimeSize);assert.equal(data[3],0);
    const compiled=(asset.family==='climbing'?WORD_CLIMB_ATLASES:WORD_CLIMB_MOVEMENT_ATLASES)[asset.hero];
    assert.equal(compiled.frames.length,asset.frames.length);assert.equal(compiled.runtime,asset.runtime);
    for(const frame of asset.frames){
      for(const name of ['bootLeft','bootRight']){const[x,y]=frame.measurement.contactsSource[name];assert.ok(data[(y*info.width+x)*4+3]>=160,`${frame.id}: ${name} is a real opaque sole`);}
      const[x,y,w,h]=frame.rect;assert.ok(x>=0&&y>=0&&x+w<=info.width&&y+h<=info.height);
      for(const point of Object.values(frame.contacts).filter(Boolean))assert.ok(point[0]>=0&&point[0]<w&&point[1]>=0&&point[1]<h,'No measured contact is clipped by its own crop');
    }
  }
  for(const hero of ['bouncy','chompy','pip']){
    const actions=[...WORD_CLIMB_ATLASES[hero].frames,...WORD_CLIMB_MOVEMENT_ATLASES[hero].frames].map(frame=>frame.action);
    for(const action of ['rest','climb-a','climb-b','recover-grip','jump-rise','jump-fall','land','summit-a','summit-b'])assert.ok(actions.includes(action),`${hero} has ${action}`);
    const[a,b]=WORD_CLIMB_ATLASES[hero].frames.filter(frame=>frame.action.startsWith('climb-'));
    assert.ok(a.sockets.grip[0]-a.cell[0]-a.anchor[0]>0);assert.ok(b.sockets.grip[0]-b.cell[0]-b.anchor[0]<0,'Alternating palms occupy actual opposite sides');
  }
});

test('each cast switches its owned movement/climbing textures while retaining one registered mesh and actual state contacts',async()=>{
  const OldImage=globalThis.Image;
  class DecodedImage{constructor(){this.naturalWidth=1254;this.naturalHeight=1254;}set src(value){if(value)queueMicrotask(()=>this.onload?.());}async decode(){}}
  globalThis.Image=DecodedImage;
  try{
    for(const hero of ['bouncy','chompy','pip']){
      const actor=createWordClimbRegisteredActor(THREE,WORD_CLIMB_ATLASES[hero],{movementAtlas:WORD_CLIMB_MOVEMENT_ATLASES[hero]});
      try{
        assert.equal(await actor.ready,true);const mesh=actor.root.children[0],geometry=mesh.geometry;
        actor.update({state:'climbing',elapsed:.4});const climbingMap=mesh.material.map;assert(actor.contactWorld('grip',new THREE.Vector3()));
        actor.update({state:'airborne',vy:100,elapsed:1});assert.equal(actor.action,'jump-rise');assert.notEqual(mesh.material.map,climbingMap);assert.equal(actor.contactWorld('grip',new THREE.Vector3()),null);
        const movementMap=mesh.material.map;actor.update({state:'airborne',vy:-100,elapsed:2});assert.equal(actor.action,'jump-fall');assert.equal(mesh.material.map,movementMap);
        actor.update({state:'landed',elapsed:3});assert.equal(actor.action,'land');
        actor.update({completed:true,elapsed:3},{celebrationTime:.1});assert.equal(actor.action,'summit-a');
        actor.update({completed:true,elapsed:3},{celebrationTime:.5});assert.equal(actor.action,'summit-b');
        actor.update({state:'recovering',elapsed:4});assert.equal(actor.action,'recover-grip');assert.equal(mesh.material.map,climbingMap);assert(actor.contactWorld('grip',new THREE.Vector3()));
        assert.equal(mesh.geometry,geometry);assert.deepEqual(actor.inspect().assets,{climber:'delivered',movement:'delivered'});
      }finally{actor.dispose();}
    }
  }finally{globalThis.Image=OldImage;}
});

test('the safety vine retains its buffers and exact anchor/hand centers across recovery updates and disposes once',()=>{
  const vine=createWordClimbVine(THREE),geometry=vine.mesh.geometry,buffer=geometry.attributes.position.array;
  let disposal=0;geometry.addEventListener('dispose',()=>disposal++);
  for(let i=0;i<100;i++){
    const start=new THREE.Vector3(-10,1200,-25),end=new THREE.Vector3(15+i,850-i,50);vine.update(start,end);
    assert.equal(vine.mesh.geometry,geometry);assert.equal(geometry.attributes.position.array,buffer);
    for(const[offset,point]of[[0,start],[buffer.length-6,end]])for(let axis=0;axis<3;axis++)assert.ok(Math.abs((buffer[offset+axis]+buffer[offset+axis+3])/2-point.getComponent(axis))<1e-4);
  }
  vine.dispose();vine.dispose();assert.equal(disposal,1);
});
