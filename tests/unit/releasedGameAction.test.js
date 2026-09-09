import test from 'node:test';
import assert from 'node:assert/strict';
import { attachReleasedGameAction } from '../../src/components/learn/games/shared/releasedGameAction.js';
function fixture() {
  const input={epoch:0,owner:null,cancels:new Set()}, calls=[];
  const button=()=>Object.assign(new EventTarget(),{disabled:false,dataset:{},setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,right:100,bottom:70})});
  const a=button(),b=button(),clean=[attachReleasedGameAction(a,()=>calls.push('a'),input),attachReleasedGameAction(b,()=>calls.push('b'),input)];
  const fire=(target,type,id=1,extra={})=>target.dispatchEvent(Object.assign(new Event(type),{pointerId:id,button:0,clientX:50,clientY:35,...extra}));
  return {a,b,input,calls,clean,fire};
}
test('release belongs to one control and one pointer across the whole game',()=>{
  const {a,b,input,calls,fire}=fixture();
  fire(a,'pointerdown',1);fire(b,'pointerdown',2);fire(b,'pointerup',2);assert.deepEqual(calls,[]);
  fire(a,'pointercancel',2);fire(a,'pointerup',1);assert.deepEqual(calls,['a']);assert.equal(input.owner,null);
  fire(a,'click',1,{detail:1});assert.deepEqual(calls,['a']);
});
test('outside, cancelled, lost and stale releases do not activate or retain a hold',()=>{
  for(const type of ['outside','pointercancel','lostpointercapture','stale','disabled']){
    const {a,input,calls,fire}=fixture();fire(a,'pointerdown');
    if(type==='stale')input.epoch++;
    else if(type==='disabled')a.disabled=true;
    else if(type!=='outside')fire(a,type);
    fire(a,'pointerup',1,type==='outside'?{clientX:101}:{});
    assert.deepEqual(calls,[]);assert.equal(input.owner,null);assert.equal(a.dataset.pressed,undefined);
  }
});
test('native keyboard activation is allowed, but not during another pointer hold or after cleanup',()=>{
  const {a,b,input,calls,fire,clean}=fixture();fire(a,'click',1,{detail:0});assert.deepEqual(calls,['a']);
  fire(a,'pointerdown');fire(b,'click',2,{detail:0});assert.deepEqual(calls,['a']);
  input.cancels.forEach(cancel=>cancel());fire(b,'click',2,{detail:0});assert.deepEqual(calls,['a','b']);
  clean.forEach(fn=>fn());assert.equal(input.cancels.size,0);fire(a,'click',1,{detail:0});assert.deepEqual(calls,['a','b']);
});
