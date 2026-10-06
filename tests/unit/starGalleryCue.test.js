import test from 'node:test';
import assert from 'node:assert/strict';
import {createSentenceGroveCue} from '../../src/components/learn/games/games/starGalleryCue.js';
import { getLedaInstructionAudioPath } from '../../src/data/ledaProductionAudio.js';
const round={roundId:'grove:2:1',prompt:'Choose the capital letter',display:'the dog ran.',optionalStimulusAudio:'/audio/full-broken-sentence.mp3'};

test('Grove optional stimulus requires its literal matching ended clip and returns a detached receipt',async()=>{
  let called;
  const cue=createSentenceGroveCue({speak:async(value,options)=>{called=value;options.onEnd('/audio/unrelated-word.mp3');options.onEnd(round.optionalStimulusAudio);},now:()=>125});
  await cue.play(round);assert.equal(called,'Choose the capital letter. the dog ran.');
  assert.deepEqual(cue.snapshot(),{roundId:round.roundId,delivery:'delivered',deliveryReceipt:{source:round.optionalStimulusAudio,endedAt:125}});
  const snapshot=cue.snapshot();snapshot.deliveryReceipt.endedAt=0;assert.equal(cue.snapshot().deliveryReceipt.endedAt,125);cue.dispose();
});
test('Absent combined stimulus, muted output and fulfilled speech promise never fabricate an audio receipt',async()=>{
  let calls=0;const cue=createSentenceGroveCue({speak:async()=>{calls++;}});
  await cue.play({...round,optionalStimulusAudio:''});assert.equal(calls,0);assert.equal(cue.snapshot().delivery,'unavailable');
  await cue.play(round);assert.equal(calls,1);assert.equal(cue.snapshot().delivery,'unavailable');assert.equal(cue.snapshot().deliveryReceipt,null);
  const muted=createSentenceGroveCue({speak:async()=>{throw Error('Must remain silent');},getSound:()=>false});await muted.play(round);assert.equal(muted.snapshot().delivery,'unavailable');cue.dispose();muted.dispose();
});
test('Grove pause/changed repair/disposal reject stale real ends while the printed task remains available',async()=>{
  const pending=[];const cue=createSentenceGroveCue({speak:(value,options)=>new Promise(resolve=>pending.push({options,resolve})),now:()=>200});
  const first=cue.play(round);cue.stop();pending[0].options.onEnd(round.optionalStimulusAudio);pending[0].resolve();await first;assert.equal(cue.snapshot().delivery,'unavailable');
  const second=cue.play(round);const changed={...round,roundId:'grove:2:2',optionalStimulusAudio:'/audio/new-broken-sentence.mp3'};const third=cue.play(changed);
  pending[1].options.onEnd(round.optionalStimulusAudio);pending[1].resolve();await second;assert.equal(cue.snapshot().delivery,'pending');assert.equal(cue.snapshot().deliveryReceipt,null);
  cue.dispose();pending[2].options.onEnd(changed.optionalStimulusAudio);pending[2].resolve();await third;assert.equal(cue.snapshot().delivery,'unavailable');assert.equal(cue.snapshot().deliveryReceipt,null);
});

test('an actual recorded repaired sentence owns its music mix without changing the broken-stimulus receipt',async()=>{
  const clips=[],mix=[],value='The cat sat on the mat.',source=getLedaInstructionAudioPath(value);assert(source);
  const cue=createSentenceGroveCue({speak:(value,options)=>new Promise(resolve=>clips.push({value,options,resolve})),now:()=>250,
    duckMusic:owner=>mix.push({action:'duck',owner}),restoreMusic:owner=>mix.push({action:'restore',owner})});
  assert.equal(cue.hasReadback(value),true);assert.equal(cue.readbackSnapshot().delivery,'unavailable','Availability is not delivery');
  await cue.play({...round,optionalStimulusAudio:''});
  const voice=cue.playReadback(value);assert.deepEqual(mix,[]);assert.equal(clips[0].value,value);
  clips[0].options.onStart();assert.equal(cue.mixSnapshot().ducked,true);
  clips[0].options.onEnd('/isolated-word/cat.mp3');assert.equal(cue.readbackSnapshot().delivery,'pending');
  clips[0].options.onEnd(source);assert.equal(mix.at(-1).action,'restore');
  const terminalCount=mix.length;clips[0].options.onStart();assert.equal(mix.length,terminalCount);
  clips[0].resolve();await voice;
  assert.deepEqual(cue.readbackSnapshot().deliveryReceipt,{source,endedAt:250});
  assert.equal(cue.snapshot().delivery,'unavailable','A readback cannot fabricate optional broken-sentence speech');
  const detached=cue.readbackSnapshot();detached.deliveryReceipt.source='/forged';assert.equal(cue.readbackSnapshot().deliveryReceipt.source,source);
  cue.dispose();assert.equal(cue.hasReadback(value),false);
});

test('unrecorded, failed or cancelled repaired-sentence speech cannot duck a replacement or fabricate a receipt',async()=>{
  const clips=[],mix=[];let sound=true;
  const cue=createSentenceGroveCue({speak:(value,options)=>new Promise((resolve,reject)=>clips.push({value,options,resolve,reject})),getSound:()=>sound,
    duckMusic:owner=>mix.push({action:'duck',owner}),restoreMusic:owner=>mix.push({action:'restore',owner})});
  assert.equal(cue.hasReadback('Unrecorded specimen qzxvio.'),false);
  await cue.playReadback('Unrecorded specimen qzxvio.');assert.equal(clips.length,0);assert.equal(cue.readbackSnapshot().delivery,'unavailable');
  const first=cue.playReadback('The cat sat on the mat.');clips[0].options.onStart();cue.stop();assert(clips[0].options.signal.aborted);
  const replacement=cue.play(round);clips[1].options.onStart();const currentCount=mix.length;
  clips[0].options.onStart();clips[0].options.onEnd(getLedaInstructionAudioPath('The cat sat on the mat.'));clips[0].resolve();await first;
  assert.equal(mix.length,currentCount);assert.equal(cue.readbackSnapshot().deliveryReceipt,null);
  clips[1].reject(Error('actual speech failed'));await replacement;assert.equal(mix.at(-1).action,'restore');
  assert.equal(cue.snapshot().deliveryReceipt,null);
  sound=false;await cue.playReadback('The cat sat on the mat.');assert.equal(clips.length,2);cue.dispose();
});
