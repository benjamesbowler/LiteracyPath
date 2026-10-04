import assert from 'node:assert/strict';
import test from 'node:test';
import { drawPhysicalPalFallback, physicalPalFallbackPose } from '../../src/components/learn/games/shared/physicalPalFallback.js';

test('unavailable-art recovery preserves each canonical cast and physical sole baseline', () => {
  for (const [world, character] of [['meadow','bouncy'],['dino','chompy'],['moonwood','pip']]) {
    for (const time of [0,.7,2,4.4]) {
      const right = physicalPalFallbackPose({world,x:80,y:200,height:76,moving:true,time});
      const left = physicalPalFallbackPose({world,x:80,y:200,height:76,moving:true,time,direction:'left'});
      assert.equal(right.character,character);
      assert.equal(right.representation,'procedural-art-unavailable');
      assert.equal(right.soles.length,2);
      assert.equal(Math.max(...right.soles.map(foot=>foot.y)),200);
      for (let i=0;i<2;i++) {
        assert.ok(right.soles[i].y<=200);
        assert.equal(left.soles[i].x,160-right.soles[i].x);
        assert.equal(left.soles[i].y,right.soles[i].y);
      }
    }
  }
});

test('a held simulation clock freezes recovery pose while locomotion and jumps remain distinct', () => {
  const options={world:'meadow',x:20,y:90,moving:true,time:.7};
  assert.deepEqual(physicalPalFallbackPose(options),physicalPalFallbackPose({...options}));
  assert.notDeepEqual(physicalPalFallbackPose(options).soles,physicalPalFallbackPose({...options,time:2}).soles);
  const jump=physicalPalFallbackPose({...options,action:'jump'});
  assert.equal(jump.airborne,true);
  assert.ok(jump.soles.every(sole=>sole.y<90));
});

test('drawing every recovery cast needs no image/network and restores the caller canvas state', () => {
  for (const world of ['meadow','dino','moonwood']) {
    const calls=[];
    const ctx=new Proxy({}, {get:(_,key)=>(...args)=>calls.push([key,...args]),set:()=>true});
    const result=drawPhysicalPalFallback(ctx,{world,x:80,y:200,height:76,moving:true,time:.7});
    assert.equal(calls[0][0],'save');
    assert.equal(calls.at(-1)[0],'restore');
    assert.ok(calls.some(([key])=>key==='fill'));
    assert.ok(calls.every(([key])=>key!=='drawImage'));
    assert.equal(result.representation,'procedural-art-unavailable');
  }
});
