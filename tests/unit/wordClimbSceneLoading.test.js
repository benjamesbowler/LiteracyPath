import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createClimbSceneKit } from '../../src/components/learn/games/games/wordClimbSceneKit.js';
import { disposeObject } from '../../src/components/learn/games/shared/threeShell.js';

test('Climb scene readiness waits for real texture settlement and disposal releases pending loads',async()=>{
  const original=THREE.TextureLoader.prototype.load,calls=[];
  THREE.TextureLoader.prototype.load=function(url,onLoad,_progress,onError){const texture=new THREE.Texture();calls.push({url,onLoad,onError,texture});return texture;};
  let kit;
  try {
    kit=createClimbSceneKit([],1,400,12);
    let settled=false;kit.userData.ready.then(()=>{settled=true;});await Promise.resolve();assert.equal(settled,false);
    assert.equal(calls.length,2);
    calls[0].onLoad();calls[1].onError();assert.deepEqual(await kit.userData.ready,[true,false]);
    disposeObject(kit);kit=null;calls.length=0;
    kit=createClimbSceneKit([],1,400,12);disposeObject(kit);
    assert.deepEqual(await kit.userData.ready,[false,false]);kit=null;
  } finally { if(kit)disposeObject(kit);THREE.TextureLoader.prototype.load=original; }
});
