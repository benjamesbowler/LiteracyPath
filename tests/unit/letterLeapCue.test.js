import test from 'node:test';
import assert from 'node:assert/strict';
import { createLetterLeapCue } from '../../src/components/learn/games/games/letterLeapCue.js';
function fixture() {
  let sound=true,time=100,change=0;const voices=[],tasks=new Map();
  const picture={style:{},naturalWidth:72,naturalHeight:72,src:'',decode:async()=>{},getAttribute:()=>picture.src,removeAttribute:()=>{picture.src='';}};
  const cue=createLetterLeapCue({picture,getSound:()=>sound,now:()=>time,onChange:()=>{change++;},
    speak:(word,options)=>new Promise(resolve=>voices.push({word,options,resolve})),schedule:fn=>{const id=tasks.size+1;tasks.set(id,fn);return id;},clear:id=>tasks.delete(id)});
  const round={word:'SOCK',audio:'/audio/sock.mp3',pictures:['/images/sock.webp','/images/sock-fallback.webp']};
  return {cue,picture,voices,tasks,round,setSound:value=>{sound=value;},setTime:value=>{time=value;},change:()=>change};
}

test('decoded displayed image and the real matching end are separately measured',async()=>{
  const f=fixture();f.cue.reset(f.round);assert.equal(f.cue.snapshot().pictureDelivery,'pending');
  await f.picture.onload();assert.equal(f.cue.snapshot().pictureDelivery,'delivered');
  const play=f.cue.play();assert.equal(f.cue.snapshot().delivery,'pending');
  f.voices[0].options.onEnd('/audio/other.mp3');assert.equal(f.cue.snapshot().delivery,'pending');
  f.setTime(200);f.voices[0].options.onEnd(f.round.audio);f.voices[0].resolve();await play;
  assert.deepEqual(f.cue.snapshot().deliveryReceipt,{source:f.round.audio,endedAt:200});
  const copy=f.cue.snapshot();copy.deliveryReceipt.source='mutated';
  assert.equal(f.cue.snapshot().deliveryReceipt.source,f.round.audio);f.cue.dispose();
});

test('load/error/timeout and fulfilled speech promises cannot counterfeit delivery',async()=>{
  const f=fixture();f.cue.reset(f.round);f.picture.onerror();
  assert.equal(f.picture.src,f.round.pictures[1]);f.picture.onerror();
  assert.equal(f.cue.snapshot().pictureDelivery,'unavailable');assert.equal(f.picture.style.display,'none');
  const play=f.cue.play();f.voices[0].resolve();await play;
  assert.equal(f.cue.snapshot().delivery,'unavailable');assert.equal(f.cue.snapshot().deliveryReceipt,null);
  f.cue.reset(f.round);f.picture.naturalWidth=0;await f.picture.onload();f.picture.onerror();
  assert.equal(f.cue.snapshot().pictureDelivery,'unavailable');f.cue.dispose();
});

test('replay, pause, sound-off and disposal invalidate old media callbacks',async()=>{
  const f=fixture();f.cue.reset(f.round);const originalImage=f.picture.onload;
  const old=f.cue.play();const replacement=f.cue.play();
  assert.equal(f.voices[0].options.signal.aborted,true);
  f.voices[0].options.onEnd(f.round.audio);f.voices[0].resolve();await old;
  assert.equal(f.cue.snapshot().delivery,'pending');
  f.cue.stop();f.voices[1].options.onEnd(f.round.audio);f.voices[1].resolve();await replacement;
  assert.equal(f.cue.snapshot().deliveryReceipt,null);
  f.cue.reset({...f.round,audio:'/audio/hat.mp3',word:'HAT',pictures:['/images/hat.webp']});
  await originalImage();assert.equal(f.cue.snapshot().pictureDelivery,'pending');
  f.setSound(false);f.cue.soundChanged();assert.equal(f.cue.snapshot().delivery,'unavailable');
  f.cue.dispose();const changes=f.change();await f.cue.play();assert.equal(f.change(),changes);assert.equal(f.tasks.size,0);
});
