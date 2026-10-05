import test from 'node:test';
import assert from 'node:assert/strict';
import { reelReadV2Ladder } from '../../src/utils/reelReadV2Levels.js';
import { newReelReadEvidence, reelReadHookResponse, reelReadEvidenceScore, completeReelReadTrip, REEL_READ_CONTENT_VERSION } from '../../src/utils/reelReadEvidence.js';
import { validateReelReadSession } from '../../src/utils/reelReadSession.js';
import { createFishingFight } from '../../src/utils/reelReadFishing.js';
import { getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';
import { newGameSeed } from '../../src/utils/gameReplay.js';

const context={seed:913,stage:0,journeyIndex:1,ladder:reelReadV2Ladder('easy',913)};
function fixture(activeContext=context) {
  const level=activeContext.ladder[0];
  const fish=[...level.correctWords,...level.distractors].slice(0,level.visibleFish).map((word,index)=>({id:index+1,word,slot:index,phase:index*31,direction:1}));
  const evidence=newReelReadEvidence();
  evidence.audioReceipts.push({stage:0,round:0,word:level.target,kind:'target',src:getLedaWordAudioPath(level.target),at:.5});
  return {version:REEL_READ_CONTENT_VERSION,seed:activeContext.seed,stage:0,originStage:0,journeyIndex:activeContext.journeyIndex,elapsed:1,
    boatPosition:.35,facing:'right',nextId:100,acceptedWords:[],landedWords:[],fish,evidence,score:0,
    mistakes:0,hintMistakes:0,supportReasons:[],celebrating:false,motorMisses:0,motorEscapes:0,motorInterceptions:0,fight:null};
}
function answer(state,word,at,activeContext=context) {
  state.foregroundElapsed=Math.max(state.foregroundElapsed||state.elapsed,at);
  const result=reelReadHookResponse(state.evidence,activeContext.ladder[0],{stage:0,selected:word,acceptedWords:state.acceptedWords,
    landedWords:state.landedWords,choices:state.fish,source:'keyboard',at,receipt:state.evidence.audioReceipts[0]});
  state.evidence=result.evidence;state.acceptedWords=result.decision.acceptedWords;state.score=reelReadEvidenceScore(state.evidence);
  if(result.row&&!result.row.correct){state.mistakes++;state.hintMistakes++;}
  return result;
}

test('accepted ordered hook, same escaped fish and live motor fight survive without re-awarding language points',()=>{
  const state=fixture(),word=context.ladder[0].correctWords[0];answer(state,word,1);
  state.fight={...createFishingFight({encounter:0,depth:.4,seed:913}),fishId:state.fish.find(f=>f.word===word).id};
  assert.ok(validateReelReadSession(state,context));
  state.fight=null;state.motorEscapes++;state.supportReasons=['motor-escape'];
  const saved=validateReelReadSession(state,context);assert.ok(saved);assert.equal(saved.score,120);
  assert.deepEqual(saved.acceptedWords,[word]);assert.deepEqual(saved.landedWords,[]);
  const recovery=answer(saved,word,2);assert.equal(recovery.row,null);assert.equal(saved.score,120);
  assert.equal(saved.evidence.firstResponses.length,1);assert.equal(saved.evidence.assistedRetries.length,0);
  saved.acceptedWords.push('forged');assert.deepEqual(state.acceptedWords,[word]);
});

test('first wrong ordered fish and supported correct retry keep immutable prefix/history after save validation',()=>{
  const state=fixture(),level=context.ladder[0];answer(state,level.correctWords[1],1);
  const first=structuredClone(state.evidence.firstResponses[0]);answer(state,level.correctWords[0],2);
  const saved=validateReelReadSession(state,context);assert.ok(saved);
  assert.deepEqual(saved.evidence.firstResponses[0],first);assert.equal(saved.evidence.assistedRetries[0].correct,true);
  assert.equal(saved.evidence.assistedRetries[0].independentPartOrMeaningPractice,false);assert.equal(saved.hintMistakes,1);
  for(const change of [s=>s.score++,s=>s.fish[0].slot=8,s=>s.acceptedWords.reverse().push('bow'),
    s=>s.evidence.assistedRetries[0].deliveryReceipt.at=9000,s=>s.evidence.acceptedResponses[0].choices[0].word='invented']) {
    const forged=structuredClone(saved);change(forged);assert.equal(validateReelReadSession(forged,context),null);
  }
});

test('a fabricated second successful response or changed pond cannot turn motor recovery into another scored answer',()=>{
  const state=fixture();answer(state,context.ladder[0].correctWords[0],1);
  const duplicate={...state.evidence.firstResponses[0],at:1,supportReasons:['repeat-response'],independentPartOrMeaningPractice:false};
  state.evidence.assistedRetries.push(duplicate);state.score=240;assert.equal(validateReelReadSession(state,context),null);
  const normal=fixture();answer(normal,context.ladder[0].correctWords[0],1);
  normal.fight={...createFishingFight({encounter:0}),fishId:normal.fish[0].id};normal.fight.pond={...normal.fight.pond,reelRate:999};
  assert.equal(validateReelReadSession(normal,context),null);
});

test('saved completion requires the real landed basket, retained rubric and non-future cue/response clocks',()=>{
  const state=fixture(),level=context.ladder[0];
  answer(state,level.correctWords[0],1);answer(state,level.correctWords[1],2);
  state.landedWords=[...state.acceptedWords];state.celebrating=true;state.foregroundElapsed=2.2;
  state.fish=state.fish.filter(f=>!state.landedWords.includes(f.word));
  state.evidence=completeReelReadTrip(state.evidence,level,0,state.acceptedWords,state.landedWords,[],2.1);
  state.score=reelReadEvidenceScore(state.evidence);
  assert.ok(validateReelReadSession(state,context));
  for(const change of [s=>s.evidence.completions[0].stars=1,s=>s.evidence.completions[0].operation='invented',
    s=>s.evidence.completions[0].landedWords.pop(),s=>s.foregroundElapsed=.4]) {
    const forged=structuredClone(state);change(forged);assert.equal(validateReelReadSession(forged,context),null);
  }
});

test('resumed motor anchors and school retain a reachable accepted part without permitting invalid line states',()=>{
  const state=fixture(),word=context.ladder[0].correctWords[0];answer(state,word,1);
  state.fight={...createFishingFight({encounter:0,depth:.4,seed:913}),fishId:state.fish.find(f=>f.word===word).id,
    anchorX:144,anchorY:290,anchorXNormalized:.45,anchorDepth:.6};
  const saved=validateReelReadSession(state,context);assert.ok(saved);
  assert.equal(saved.fight.anchorXNormalized,.45);assert.equal(saved.fight.anchorDepth,.6);
  for(const change of [s=>s.fight.anchorDepth=2,s=>s.fight.anchorXNormalized=NaN,s=>s.fight.initialLength=0,
    s=>s.fight.remaining=40,s=>s.fight.escaped=true,s=>s.fight.elapsed=20,s=>s.foregroundElapsed=.8,
    s=>s.fight.sway=Infinity,s=>s.fight.anchorY=-1,s=>s.fight=false,
    s=>{s.fight=null;s.fish=s.fish.filter(f=>f.word!==word);},
    s=>{s.fight=null;s.fish=s.fish.filter(f=>!context.ladder[0].correctWords.includes(f.word));}]) {
    const forged=structuredClone(saved);change(forged);assert.equal(validateReelReadSession(forged,context),null);
  }
});

test('canonical unsigned fresh seeds preserve the exact wrong response, accepted prefix and live fight on resume',()=>{
  const actualFreshSeed=newGameSeed(0,()=>.75);
  assert.ok(actualFreshSeed>0x7fffffff);
  for(const seed of [actualFreshSeed,0x80000000,0xffffffff]) {
    const activeContext={...context,seed,ladder:reelReadV2Ladder('easy',seed)};
    const state=fixture(activeContext),level=activeContext.ladder[0];
    answer(state,level.correctWords[1],1,activeContext);
    const firstWrong=structuredClone(state.evidence.firstResponses[0]);
    answer(state,level.correctWords[0],2,activeContext);
    state.fight={...createFishingFight({encounter:0,depth:.4,seed}),
      fishId:state.fish.find(row=>row.word===level.correctWords[0]).id};
    const saved=validateReelReadSession(state,activeContext);
    assert.ok(saved,`unsigned seed ${seed} remains resumable`);
    assert.deepEqual(saved.fish,state.fish);
    assert.deepEqual(saved.acceptedWords,[level.correctWords[0]]);
    assert.deepEqual(saved.evidence.firstResponses[0],firstWrong);
    assert.deepEqual(saved.evidence.assistedRetries,state.evidence.assistedRetries);
    assert.deepEqual(saved.fight,state.fight);
    for(const invalid of [-1,0x100000000,seed+.5,NaN]) {
      assert.equal(validateReelReadSession({...state,seed:invalid},{...activeContext,seed:invalid}),null);
    }
  }
});
