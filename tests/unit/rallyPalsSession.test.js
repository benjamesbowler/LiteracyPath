import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRallyPalsRounds,commitRallyPalsAim,newRallyPalsEvidence } from '../../src/utils/rallyPalsRules.js';
import { loadRallyPalsSession,saveRallyPalsSession } from '../../src/utils/rallyPalsSession.js';

test('same seed/profile/cursor preserves first attempt and aim through reload; tampering cannot invent learning points',()=>{
  const original=globalThis.window,store=new Map();
  globalThis.window={localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)}};
  try{
    const rounds=buildRallyPalsRounds('medium',123),round=rounds[0];
    const result=commitRallyPalsAim(newRallyPalsEvidence(),round,round.expected,{delivery:'pending',pictureDelivery:'delivered'});
    const state={seed:123,cursor:0,index:0,roundId:round.roundId,phase:'rally',aim:round.choices.indexOf(round.expected),wrong:0,
      score:10,delivery:'pending',evidence:result.evidence,supportReasons:['answered-before-audio-ended'],court:'moonwood',matchPoints:0,bestRally:2};
    assert.equal(saveRallyPalsSession('learner-a','medium',state).localSaved,true);
    const restored=loadRallyPalsSession('learner-a','medium',123,0,rounds);
    assert.equal(restored.court,'moonwood');assert.equal(restored.aim,state.aim);assert.equal(restored.evidence.firstResponses[0].independentPractice,false);
    assert.equal(loadRallyPalsSession('learner-b','medium',123,0,rounds),null);
    assert.equal(loadRallyPalsSession('learner-a','hard',123,0,rounds),null);
    assert.equal(loadRallyPalsSession('learner-a','medium',124,0,rounds),null);
    assert.equal(loadRallyPalsSession('learner-a','medium',123,1,rounds),null);
    const key='literacy-guide-learn-games:learner-a',corrupt=JSON.parse(store.get(key));corrupt.games['rally-pals'].practiceSession.medium.evidence.firstResponses[0].independentPractice=true;store.set(key,JSON.stringify(corrupt));
    assert.equal(loadRallyPalsSession('learner-a','medium',123,0,rounds),null);
    globalThis.window.localStorage.setItem=()=>{throw new Error('quota');};assert.equal(saveRallyPalsSession('learner-a','medium',state).localSaved,false);
  }finally{globalThis.window=original;}
});


test('tennis modes and suspended independent aiming restore without admitting invalid physics or support',()=>{
  const original=globalThis.window,store=new Map();globalThis.window={localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)}};
  try{
    const rounds=buildRallyPalsRounds('easy',82),round=rounds[0],state={seed:82,cursor:0,index:0,roundId:round.roundId,phase:'serve',mode:'targets',targetShots:4,targetHits:2,aim:1,aimX:.4,aimZ:-6.2,learningAim:2,learningAimX:3.9,learningAimZ:-7.8,wrong:0,score:0,delivery:'delivered',pictureDelivery:'delivered',visualModel:false,assisted:true,rallyPause:false,motorMisses:0,evidence:newRallyPalsEvidence(),supportReasons:[],court:'rooftop',matchPoints:0,bestRally:3};
    assert.equal(saveRallyPalsSession('mode-child','easy',state).localSaved,true);const restored=loadRallyPalsSession('mode-child','easy',82,0,rounds);assert.equal(restored.mode,'targets');assert.equal(restored.learningAimX,3.9);assert.equal(restored.targetHits,2);assert.equal(restored.evidence.firstResponses.length,0);
    for(const corrupt of [{targetHits:5},{aimX:500},{learningAimZ:1},{assisted:'yes'},{pictureDelivery:'imagined'},{mode:'auto-answer'},{supportReasons:[{}]}]){saveRallyPalsSession('mode-child','easy',{...state,...corrupt});assert.equal(loadRallyPalsSession('mode-child','easy',82,0,rounds),null);}
  }finally{globalThis.window=original;}
});
