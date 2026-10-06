import test from 'node:test';
import assert from 'node:assert/strict';
import {newSoundRacerPractice,recordRacerWordChoice,SOUND_RACER_CONSTRUCT} from '../../src/utils/soundRacerPractice.js';
import {SOUND_RACER_CONTENT_VERSION} from '../../src/data/arcadeContentVersions.js';
const gate={kind:'word',word:'bear',correct:true,audioDelivery:'delivered'};
const context={hasLaneIntent:true,levelIndex:0,target:'b',targetDelivery:'delivered',
  targetReceipt:{source:'/audio/phonemes/b.mp3',deliveredAt:'2026-10-04T06:00:00.000Z',playTimeMs:980},supportReasons:[],motorAssist:true};

test('default travel is neither a first response nor a completion; an intentional loaded recorded-cue response is bounded practice',()=>{
  const initial=newSoundRacerPractice({sessionSeed:27,journeyIndex:3,difficulty:'easy'});
  assert.equal(recordRacerWordChoice(initial,gate,{...context,hasLaneIntent:false}),initial);
  const next=recordRacerWordChoice(initial,gate,context);
  assert.equal(next.contentVersion,SOUND_RACER_CONTENT_VERSION);assert.equal(next.sessionSeed,27);assert.equal(next.journeyIndex,3);
  assert.equal(next.construct,SOUND_RACER_CONSTRUCT);assert.equal(next.practiceOnly,true);
  assert.equal(initial.firstResponses.length,0);assert.equal(next.firstResponses.length,1);assert.equal(next.completions.length,1);
  assert.equal(next.firstResponses[0].independentPractice,true);
  assert.equal(recordRacerWordChoice(next,gate,context),next,'a completed word cannot manufacture duplicate evidence');
});
test('support is measured at the response; incomplete audio and explicit help/replay/hint cannot become independent',()=>{
  for(const overrides of [{targetDelivery:'pending'},{targetDelivery:'unavailable'},{targetReceipt:null},{soundEnabled:false},{supportReasons:['mission-help']},{supportReasons:['target-audio-replay']}]){
    const result=recordRacerWordChoice(newSoundRacerPractice(),gate,{...context,...overrides});
    assert.equal(result.firstResponses[0].independentPractice,false);assert.ok(result.firstResponses[0].supportReasons.length>0);
  }
  const delivered=recordRacerWordChoice(newSoundRacerPractice(),gate,context);
  assert.deepEqual(delivered.firstResponses[0].targetAudioReceipt,context.targetReceipt);
  const hint=recordRacerWordChoice(newSoundRacerPractice(),{...gate,hintShown:true},context);
  assert.deepEqual(hint.firstResponses[0].supportReasons,['lane-hint']);
});
test('graphics recovery and non-answering road assistance stay separate from literacy support',()=>{
  for(const graphicsRecovery of ['gzip-recovery','authored-driving-art']){
    const result=recordRacerWordChoice(newSoundRacerPractice(),gate,{...context,graphicsRecovery});
    const row=result.firstResponses[0];assert.equal(row.graphicsRecovery,graphicsRecovery);
    assert.equal(row.motorAssist,true);assert.deepEqual(row.supportReasons,[]);assert.equal(row.independentPractice,true);
  }
});
