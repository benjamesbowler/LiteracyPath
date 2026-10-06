import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createSpellSkater,SPELL_SKATER_STATES} from '../../src/components/learn/games/games/spellSkaterAsset.js';
import {createSkateAuthoredWorld,createSkateOriginalMaterials} from '../../src/components/learn/games/games/spellSkateAuthoredWorld.js';

function parsedModel({venue=false}={}){
  const scene=new THREE.Group(),calls={closed:0,texture:0};
  const bitmap={width:768,height:768,close(){calls.closed++;}},texture=new THREE.Texture(bitmap);
  texture.addEventListener('dispose',()=>calls.texture++);
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(1,2.2,1),new THREE.MeshStandardMaterial({map:texture}));
  mesh.name=venue?'clubhouse':'body';scene.add(mesh);
  return{scene,animations:SPELL_SKATER_STATES.map(name=>new THREE.AnimationClip(name,1,[])),calls,texture};
}

test('independent Canvas can retire the complete skater while controller-native push, jump and grind phases remain usable',async()=>{
  const original=GLTFLoader.prototype.loadAsync,parsed=parsedModel();GLTFLoader.prototype.loadAsync=async()=>parsed;
  try{
    const skater=createSpellSkater({world:'meadow'});assert.equal(await skater.ready,true);
    skater.update(1/60,{onGround:true,speed:12},{push:true});
    const before=skater.snapshot();assert.equal(before.liveClipCount,10);assert.equal(before.state,'push');assert.ok(Math.abs(before.height-2.2)<1e-6);
    const receipt=skater.releasePrimary();assert.equal(receipt.bitmaps,1);assert.equal(parsed.texture.source.data,null);assert.equal(parsed.scene.children.length,0);
    const after=skater.snapshot();assert.equal(after.primaryReleased,true);assert.equal(after.liveClipCount,0);assert.deepEqual(after.clips,SPELL_SKATER_STATES);assert.equal(after.height,before.height);
    skater.update(1/60,{onGround:false,speed:12},{});assert.equal(skater.presentationPose().state,'jump');assert.ok(skater.presentationPose().phase>0);
    skater.update(1/60,{onGround:true,grind:1,speed:7},{});assert.equal(skater.presentationPose().state,'grind');assert.ok(skater.presentationPose().phase>0);
    skater.releasePrimary();skater.dispose();skater.dispose();assert.deepEqual(parsed.calls,{closed:1,texture:1});
  }finally{GLTFLoader.prototype.loadAsync=original;}
});

test('a late parsed skater is released once without reviving the primary or taking another live instance',async()=>{
  const original=GLTFLoader.prototype.loadAsync,late=parsedModel(),live=parsedModel();let deliver,calls=0;
  GLTFLoader.prototype.loadAsync=()=>++calls===1?new Promise(resolve=>deliver=()=>resolve(late)):Promise.resolve(live);
  try{
    const retired=createSpellSkater({world:'dino'}),other=createSpellSkater({world:'dino'});retired.releasePrimary();assert.equal(await other.ready,true);
    deliver();assert.equal(await retired.ready,true);assert.equal(retired.root.children.length,0);assert.equal(retired.snapshot().liveClipCount,0);assert.equal(late.calls.closed,1);assert.equal(live.calls.closed,0);
    other.update(1/60,{onGround:true,speed:4},{left:true});assert.equal(other.snapshot().state,'turn_left');assert.equal(other.snapshot().liveClipCount,10);
    retired.dispose();retired.dispose();assert.equal(late.calls.closed,1);other.dispose();assert.equal(live.calls.closed,1);
  }finally{GLTFLoader.prototype.loadAsync=original;}
});

function mockImages({deferred=false}={}){
  const original=THREE.TextureLoader.prototype.load,images=[];
  THREE.TextureLoader.prototype.load=function(url,onLoad){
    const texture=new THREE.Texture(),record={url,closed:0,texture};images.push(record);
    record.deliver=()=>{texture.source.data={width:1024,height:1024,close(){record.closed++;}};onLoad();};
    if(!deferred)queueMicrotask(record.deliver);return texture;
  };
  return{images,restore(){THREE.TextureLoader.prototype.load=original;}};
}

test('park retirement drops its parsed venue, instancing and decoded original scenery while keeping independent Canvas scene declarations',async()=>{
  const original=GLTFLoader.prototype.loadAsync,parsed=parsedModel({venue:true}),mock=mockImages();GLTFLoader.prototype.loadAsync=async()=>parsed;
  try{
    const park=createSkateAuthoredWorld('moonwood','low',{islands:[{x:3,z:4,radius:5.4}]});assert.equal(await park.ready,true);
    const declaration=park.canvasScene();assert.ok(park.root.children.length>0);park.dispose();park.dispose();
    assert.equal(park.root.children.length,0);assert.equal(park.root.userData.primaryReleased,true);assert.equal(parsed.calls.closed,1);
    for(const image of mock.images){assert.equal(image.closed,1);assert.equal(image.texture.source.data,null);}
    assert.deepEqual(park.canvasScene(),declaration,'Canvas declarations contain source coordinates and URLs, not disposed primary objects');
    park.setQuality('high');park.update(1,{camera:{x:3,z:8}});assert.equal(park.root.children.length,0);
  }finally{mock.restore();GLTFLoader.prototype.loadAsync=original;}
});

test('late material and scene images after retirement are closed once and cannot reattach a retired park',async()=>{
  const original=GLTFLoader.prototype.loadAsync,mock=mockImages({deferred:true}),parsed=parsedModel({venue:true});let deliver;
  GLTFLoader.prototype.loadAsync=()=>new Promise(resolve=>deliver=()=>resolve(parsed));
  try{
    const park=createSkateAuthoredWorld('meadow','low'),materials=createSkateOriginalMaterials('meadow');
    park.dispose();materials.dispose();
    for(const image of mock.images)image.deliver();deliver();
    assert.equal(await park.ready,false);assert.deepEqual(await materials.ready,[false,false]);
    assert.equal(park.root.children.length,0);assert.equal(parsed.calls.closed,1);assert.equal(materials.snapshot().liveTextures,0);
    for(const image of mock.images){assert.equal(image.closed,1);assert.equal(image.texture.source.data,null);}
    park.dispose();materials.dispose();assert.equal(parsed.calls.closed,1);for(const image of mock.images)assert.equal(image.closed,1);
  }finally{mock.restore();GLTFLoader.prototype.loadAsync=original;}
});
