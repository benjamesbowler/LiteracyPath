import test from 'node:test';
import assert from 'node:assert/strict';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createRacerKart} from '../../src/components/learn/games/games/soundRacerKartAsset.js';
import {createSpellSkater} from '../../src/components/learn/games/games/spellSkaterAsset.js';

test('double model failure retains actual fixed-clock driving and skating poses for authored recovery',async()=>{
 const originalLoad=GLTFLoader.prototype.loadAsync,originalFetch=globalThis.fetch;
 GLTFLoader.prototype.loadAsync=async()=>{throw new Error('Primary model unavailable');};
 globalThis.fetch=async()=>{throw new Error('Exact-byte model recovery unavailable');};
 const kart=createRacerKart({world:'dino'}),skater=createSpellSkater({world:'moonwood'});
 try{
  assert.equal(await kart.ready,false);assert.equal(await skater.ready,false);
  kart.update(.12,{speed:10});assert.deepEqual(kart.presentationPose(),{state:'drive',phase:.06});
  kart.update(.12,{steering:1,speed:10});assert.equal(kart.presentationPose().state,'turn_right');assert.ok(Math.abs(kart.presentationPose().phase-.1)<1e-10);
  kart.update(0,{steering:1,speed:10});assert.ok(Math.abs(kart.presentationPose().phase-.1)<1e-10,'a render without a collision step cannot advance its native pose');
  kart.update(.12,{braking:true});assert.equal(kart.presentationPose().state,'brake');assert.equal(kart.presentationPose().phase,.12);
  const player={onGround:true,speed:8,stun:0,grind:0,recoverTime:0,landTime:0};
  for(let step=0;step<6;step++)skater.update(1/60,player,{push:true});
  assert.equal(skater.presentationPose().state,'push');assert.ok(Math.abs(skater.presentationPose().phase-.10636363636363637)<1e-10);
  skater.update(1/60,{...player,onGround:false},{});assert.equal(skater.presentationPose().state,'jump');assert.ok(Math.abs(skater.presentationPose().phase-.025)<1e-10);
  skater.update(0,{...player,onGround:false},{});assert.ok(Math.abs(skater.presentationPose().phase-.025)<1e-10);
 }finally{kart.dispose();skater.dispose();GLTFLoader.prototype.loadAsync=originalLoad;globalThis.fetch=originalFetch;}
});
