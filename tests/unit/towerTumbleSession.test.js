import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildTowerTumbleRounds, commitTowerTumbleStrike, newTowerTumbleEvidence } from '../../src/utils/towerTumbleRules.js';
import { loadTowerTumbleSession, saveTowerTumbleSession } from '../../src/utils/towerTumbleSession.js';
import { getLedaInstructionAudioPath } from '../../src/data/ledaProductionAudio.js';

test('all authored bank media actually exist in the production recording and clean picture catalogue',()=>{
  const retry=getLedaInstructionAudioPath('Try again');assert.match(retry,/^\/audio\/production\/en-US\/instruction\//);assert.ok(fs.existsSync(`public${retry}`));
  for(const difficulty of ['easy','medium','hard'])for(let journey=0;journey<12;journey++)for(const round of buildTowerTumbleRounds(difficulty,832,journey)){
    assert.ok(fs.existsSync(`public${round.image}`),`${round.word} image`);
    assert.ok(fs.existsSync(`public${round.audio}`),`${round.word} audio`);
    assert.match(round.audio,/^\/audio\/production\/en-US\//);
  }
});

test('scoped resume retains first mistakes, accepted chunk, choice seed and physical world; tampering cannot invent accepted work',()=>{
  const storage=new Map(),previous=globalThis.window;
  globalThis.window={localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)}};
  try{
    const rounds=buildTowerTumbleRounds('medium',444,2),round=rounds[0];
    let evidence=newTowerTumbleEvidence();const wrong=round.choices.find(chunk=>chunk!==round.chunks[0]);
    evidence=commitTowerTumbleStrike(evidence,round,0,wrong,{delivery:'delivered',pictureDelivery:'delivered'}).evidence;
    evidence=commitTowerTumbleStrike(evidence,round,0,round.chunks[0],{delivery:'delivered',pictureDelivery:'delivered',supportReasons:['contrast-after-wrong-response']}).evidence;
    const state={seed:444,journeyIndex:2,index:0,roundId:round.roundId,unitIndex:1,phase:'playing',mistakes:1,supportReasons:['contrast-after-wrong-response'],delivery:'delivered',score:0,evidence,lives:2,immunity:1.3,
      actor:{x:4,y:3,vy:0,safe:{x:4,y:3}},broken:['wall-low'],collected:['acorn-high']};
    assert.equal(saveTowerTumbleSession('child-a','medium',state).localSaved,true);
    const loaded=loadTowerTumbleSession('child-a','medium',444,0,rounds,2);
    assert.equal(loaded.unitIndex,1);assert.equal(loaded.mistakes,1);assert.equal(loaded.evidence.firstResponses[0].correct,false);assert.deepEqual(loaded.actor,state.actor);assert.equal(loaded.lives,2);assert.equal(loaded.immunity,1.3);assert.ok(loaded.mapLayoutId);
    assert.equal(loadTowerTumbleSession('child-b','medium',444,0,rounds,2),null);
    assert.equal(loadTowerTumbleSession('child-a','hard',444,0,rounds,2),null);
    assert.equal(loadTowerTumbleSession('child-a','medium',445,0,rounds,2),null);
    assert.equal(loadTowerTumbleSession('child-a','medium',444,0,rounds,3),null);
    saveTowerTumbleSession('child-a','medium',{...state,unitIndex:2});assert.equal(loadTowerTumbleSession('child-a','medium',444,0,rounds,2),null);
    saveTowerTumbleSession('child-a','medium',{...state,actor:{...state.actor,y:999}});assert.equal(loadTowerTumbleSession('child-a','medium',444,0,rounds,2),null);
    for(const invalid of[{lives:4},{lives:-1},{lives:.5},{immunity:9},{mapLayoutId:'different-route'},{lives:0,phase:'playing'}]){saveTowerTumbleSession('child-a','medium',{...state,...invalid});assert.equal(loadTowerTumbleSession('child-a','medium',444,0,rounds,2),null);}
    saveTowerTumbleSession('child-a','medium',{...state,lives:0,phase:'retry'});const retry=loadTowerTumbleSession('child-a','medium',444,0,rounds,2);assert.equal(retry.lives,0);assert.equal(retry.unitIndex,1);assert.equal(retry.mistakes,1);
    globalThis.window.localStorage.setItem=()=>{throw Error('storage full');};assert.equal(saveTowerTumbleSession('child-a','medium',state).localSaved,false);
  }finally{if(previous===undefined)delete globalThis.window;else globalThis.window=previous;}
});
