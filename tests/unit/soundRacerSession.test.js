import test from 'node:test';
import assert from 'node:assert/strict';
import {validateSoundRacerSession,soundRacerSignature} from '../../src/utils/soundRacerSession.js';
import {newSoundRacerPractice,recordRacerWordChoice} from '../../src/utils/soundRacerPractice.js';
import {buildSoundRacerRace} from '../../src/utils/soundRacerRace.js';
import {soundRacerLadder} from '../../src/utils/soundRacerTracks.js';
import {createKart,stepKart} from '../../src/utils/soundRacerPhysics.js';
import {SOUND_RACER_CONTENT_VERSION} from '../../src/data/arcadeContentVersions.js';
const sessionSeed=41,journeyIndex=3,difficulty='easy',index=0;
const races=soundRacerLadder(difficulty).map((target,i)=>buildSoundRacerRace(target,{difficulty,seed:`${sessionSeed}:${i}`}));
const context={sessionSeed,journeyIndex,difficulty,index,races};
function fixture(forSeed=sessionSeed){
  const races=forSeed===sessionSeed?context.races:soundRacerLadder(difficulty).map((target,i)=>buildSoundRacerRace(target,{difficulty,seed:forSeed?`${forSeed}:${i}`:i}));
  const race=races[index];let kart=createKart(race.path);
  for(let frame=0;frame<180;frame++)kart=stepKart(race.path,kart,{steer:.2,speed:10,roadAssist:true},1/60);
  const choice=race.gates.find(gate=>gate.correct);
  const evidence=recordRacerWordChoice(newSoundRacerPractice({sessionSeed:forSeed,journeyIndex,difficulty}),choice,{
    levelIndex:index,target:race.target,hasLaneIntent:true,targetDelivery:'delivered',motorAssist:true,
    targetReceipt:{source:'/audio/phonemes/b.mp3',deliveredAt:'2026-10-04T07:00:00.000Z',playTimeMs:850}});
  return {version:SOUND_RACER_CONTENT_VERSION,checkpointSemantics:'active-track-index',sessionSeed:forSeed,journeyIndex,difficulty,index,
    signature:soundRacerSignature(race),kart,timeMs:3000,score:130,levelStartScore:0,shield:3,wordsCorrect:1,wordsWrong:0,
    missedCorrect:0,obstaclesHit:0,caughtCorrectWords:[choice.word],supportReasons:['mission-help'],evidence,
    levelResults:races.map(()=>null),gates:race.gates.map(gate=>({...gate,resolved:gate===choice,hintShown:false,tries:0}))};
}
test('genuine uint32 seed boundaries preserve their generated circuit, earned receipt and held-zero local JSON recovery',()=>{
  for(const seed of [0,0x7fffffff,0x80000000,0xffffffff]){
    const races=soundRacerLadder(difficulty).map((target,i)=>buildSoundRacerRace(target,{difficulty,seed:seed?`${seed}:${i}`:i}));
    const raw=JSON.parse(JSON.stringify(fixture(seed))),restored=validateSoundRacerSession(raw,{...context,sessionSeed:seed,races});
    assert.ok(restored,`Generated uint32 seed ${seed} must survive local recovery`);assert.equal(restored.sessionSeed,seed);assert.equal(restored.index,0);assert.equal(restored.signature,soundRacerSignature(races[0]));assert.deepEqual(restored.evidence,raw.evidence);
  }
});
test('bounded index-zero recovery retains real physical state and response receipts as an owned copy',()=>{
  const raw=fixture(),restored=validateSoundRacerSession(raw,context);
  assert.ok(restored);assert.equal(restored.kart.progress,raw.kart.progress);
  assert.deepEqual(restored.evidence.firstResponses[0].targetAudioReceipt,raw.evidence.firstResponses[0].targetAudioReceipt);
  restored.kart.progress=1000;restored.supportReasons.push('changed');
  assert.notEqual(restored.kart.progress,raw.kart.progress);assert.equal(raw.supportReasons.length,1);
});
test('wrong scope, bank/lane edits, invented word credit, receipt omission and runaway physical data cannot resume',()=>{
  for(const change of [
    s=>s.sessionSeed++,s=>s.journeyIndex++,s=>s.signature+='x',s=>s.gates[0].lane=(s.gates[0].lane+1)%3,
    s=>s.caughtCorrectWords.push('invented'),s=>s.wordsCorrect++,s=>s.kart.progress=Infinity,
    s=>s.kart.safeProgress='bad',s=>s.evidence.firstResponses[0].targetAudioReceipt=null,
    s=>s.evidence.completions.push('track-0:invented'),s=>s.evidence.firstResponses[0].expected='wrong',
    s=>s.unbounded='x'.repeat(500001),
  ]){const raw=fixture();change(raw);assert.equal(validateSoundRacerSession(raw,context),null);}
});
test('saved independent responses cannot contradict delivered audio, sound state, construct or response-time context',()=>{
  for(const change of [
    row=>row.stimulusDelivered=false,row=>row.soundEnabledAtResponse=false,row=>row.soundEnabledAtResponse='true',
    row=>row.construct='supported-written-onset-matching',row=>row.motorAssist='true',
    row=>row.graphicsRecovery='invented',row=>row.gateAudioDelivery='invented',
    row=>row.targetAudioReceipt.playTimeMs=3001,
    row=>{row.deliveryAtResponse='pending';row.stimulusDelivered=false;row.independentPractice=false;row.construct='supported-written-onset-matching';},
  ]){const raw=fixture();change(raw.evidence.firstResponses[0]);assert.equal(validateSoundRacerSession(raw,context),null);}
});
test('valid visual matching and graphics recovery retain conservative practice context instead of manufacturing audio delivery',()=>{
  for(const overrides of [{soundEnabled:false},{targetDelivery:'unavailable',targetReceipt:null},{graphicsRecovery:'gzip-recovery'},{graphicsRecovery:'authored-driving-art'}]){
    const raw=fixture(),race=races[index],choice=race.gates.find(gate=>gate.correct);
    raw.evidence=recordRacerWordChoice(newSoundRacerPractice({sessionSeed,journeyIndex,difficulty}),choice,{
      levelIndex:index,target:race.target,hasLaneIntent:true,targetDelivery:'delivered',motorAssist:true,
      targetReceipt:{source:'/audio/phonemes/b.mp3',deliveredAt:'2026-10-04T07:00:00.000Z',playTimeMs:850},...overrides});
    assert.ok(validateSoundRacerSession(raw,context));
  }
});
