import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createRacerKart,RACER_DRIVER_CLIPS} from '../../src/components/learn/games/games/soundRacerKartAsset.js';

function parsedKart(){
 const scene=new THREE.Group(),calls={closed:0,texture:0};
 const bitmap={width:768,height:768,close(){calls.closed++;}},texture=new THREE.Texture(bitmap);texture.addEventListener('dispose',()=>calls.texture++);
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial({map:texture}));mesh.name='chassis';scene.add(mesh);
 for(const name of ['rollfrontL','rollfrontR','rollrearL','rollrearR']){const node=new THREE.Bone();node.name=name;scene.add(node);}
 return{scene,animations:RACER_DRIVER_CLIPS.map(name=>new THREE.AnimationClip(name,name==='drive'?2:1.2,[])),calls,texture};
}

test('successful independent Canvas delivery can release the actual primary while preserving controller-native steering/brake/action phases',async()=>{
 const original=GLTFLoader.prototype.loadAsync,parsed=parsedKart();GLTFLoader.prototype.loadAsync=async()=>parsed;
 try{
  const kart=createRacerKart({world:'meadow'});assert.equal(await kart.ready,true);kart.update(.15,{steering:-1,speed:10});
  const before=kart.snapshot();assert.equal(before.liveWheelCount,4);assert.equal(before.liveClipCount,6);assert.equal(before.state,'turn_left');
  const release=kart.releasePrimary();assert.equal(release.bitmaps,1);assert.equal(parsed.calls.closed,1);assert.equal(parsed.texture.source.data,null);assert.equal(parsed.scene.children.length,0);
  const after=kart.snapshot();assert.equal(after.primaryReleased,true);assert.equal(after.liveWheelCount,0);assert.equal(after.liveClipCount,0);assert.equal(after.wheelCount,4,'The independently parsed source inventory is distinct from released live rigs');assert.deepEqual(after.clips,RACER_DRIVER_CLIPS);
  kart.update(.15,{braking:true,speed:2});assert.equal(kart.presentationPose().state,'brake');assert.ok(kart.presentationPose().phase>0);
  kart.update(.15,{steering:1,speed:7});assert.equal(kart.presentationPose().state,'turn_right');assert.ok(kart.presentationPose().phase>0);
  kart.releasePrimary();kart.dispose();kart.dispose();assert.deepEqual(parsed.calls,{closed:1,texture:1});
 }finally{GLTFLoader.prototype.loadAsync=original;}
});

test('a real late primary parse cannot revive a Canvas owner or close another independently parsed live driver',async()=>{
 const original=GLTFLoader.prototype.loadAsync,first=parsedKart(),second=parsedKart();let deliver;let calls=0;
 GLTFLoader.prototype.loadAsync=()=>++calls===1?new Promise(resolve=>deliver=()=>resolve(first)):Promise.resolve(second);
 try{
  const retired=createRacerKart({world:'meadow'}),live=createRacerKart({world:'meadow'});retired.releasePrimary();assert.equal(await live.ready,true);
  deliver();assert.equal(await retired.ready,true);assert.equal(first.calls.closed,1);assert.equal(second.calls.closed,0);assert.equal(retired.root.children.length,0);assert.equal(retired.snapshot().liveWheelCount,0);
  live.update(.15,{steering:-1});assert.equal(live.snapshot().liveWheelCount,4);assert.equal(live.snapshot().state,'turn_left');
  retired.dispose();assert.equal(first.calls.closed,1);assert.equal(second.calls.closed,0);live.dispose();assert.equal(second.calls.closed,1);
 }finally{GLTFLoader.prototype.loadAsync=original;}
});
