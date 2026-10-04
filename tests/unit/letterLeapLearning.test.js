import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLetterLeapRounds, commitLetterLeapChoice, createLetterLeapStageQueue, letterLeapSentenceCue,
  newLetterLeapEvidence, validLetterLeapEvidence } from '../../src/components/learn/games/games/letterLeapLearning.js';
import { phonicsTargetHint } from '../../src/utils/phonicsTargetPresentation.js';
import { difficultyLadder } from '../../src/utils/curriculumLadder.js';

const rounds=buildLetterLeapRounds([{mode:'letters',targets:['sock','letter']}], 'easy', 41, 2);
const round=rounds[0];
const cue = () => ({ delivery:'delivered', pictureDelivery:'delivered', responseAt:300,
  deliveryReceipt:{source:round.audio,endedAt:200},pictureReceipt:{source:round.pictures[0],decodedAt:100} });
const choice=(evidence,slot,selected,context=cue())=>commitLetterLeapChoice(evidence,round,slot,selected,[round.units[slot],round.units[slot]==='A'?'T':'A'],context);

test('whole-word encoding records the actual ended clip and decoded picture without retroactive delivery',()=>{
  const context=cue(), response=choice(newLetterLeapEvidence(),0,'S',context);
  assert.equal(response.response.independentEncodingPractice,true);
  context.deliveryReceipt.endedAt=999;context.pictureReceipt.source='other';
  assert.equal(response.response.deliveryReceipt.endedAt,200);
  assert.equal(response.response.pictureReceipt.source,round.pictures[0]);
  for(const override of [
    {delivery:'pending'}, {delivery:'unavailable'}, {pictureDelivery:'pending'}, {pictureDelivery:'unavailable'},
    {deliveryReceipt:{source:'/audio/other.mp3',endedAt:200}}, {deliveryReceipt:{source:round.audio,endedAt:301}},
    {pictureReceipt:{source:'/images/other.webp',decodedAt:100}}, {pictureReceipt:{source:round.pictures[0],decodedAt:301}},
    {supportReasons:['mission-help']}, {modelUsed:true}
  ]) {
    const supported=choice(newLetterLeapEvidence(),0,'S',{...cue(),...override});
    assert.equal(supported.response.independentEncodingPractice,false,JSON.stringify(override));
  }
  const held=choice(newLetterLeapEvidence(),0,'S',{...cue(),delivery:'pending'});
  const before=structuredClone(held.response);
  choice(held.evidence,1,'O',cue());
  assert.deepEqual(held.response,before);
  assert.equal(held.response.independentEncodingPractice,false);
});

test('wrong responses preserve the initial two choices; only repeated wrong attempts expose a partial hint',()=>{
  const first=choice(newLetterLeapEvidence(),0,'A');
  const second=choice(first.evidence,0,'A',{...cue(),supportReasons:['retry-after-wrong']});
  const correct=choice(second.evidence,0,'S',{...cue(),supportReasons:['retry-after-wrong','partial-spelling-hint'],modelUsed:true});
  assert.deepEqual(first.response.choices,second.response.choices);
  assert.deepEqual(correct.response.choices,first.response.choices);
  assert.equal(correct.evidence.firstResponses.length,1);
  assert.equal(correct.evidence.assistedRetries.length,2);
  assert.equal(correct.response.independentEncodingPractice,false);
  const counterfeit=structuredClone(correct.evidence);
  Object.assign(counterfeit.acceptedResponses[0],{independentEncodingPractice:true,modelUsed:false,supportReasons:[]});
  assert.equal(validLetterLeapEvidence(counterfeit,rounds),false,'a retry cannot be recast as a correct first response');
  assert.equal(phonicsTargetHint('sock',1),'');assert.equal(phonicsTargetHint('sock',2),'**ck');
  assert.equal(first.response.wordVisible,false);assert.equal(second.response.wordVisible,false);
  assert.equal(commitLetterLeapChoice(first.evidence,round,0,'X',['S','A'],cue()),null);
});

test('final ordered contact completes once; repeated graphemes require their distinct physical decisions',()=>{
  const repeated=rounds[1];let evidence=newLetterLeapEvidence();
  for(let slot=0;slot<repeated.units.length;slot++) {
    const expected=repeated.units[slot];
    const result=commitLetterLeapChoice(evidence,repeated,slot,expected,[expected,'A'],{...cue(),delivery:'unavailable',pictureDelivery:'unavailable'});
    evidence=result.evidence;assert.equal(result.finished,slot===repeated.units.length-1);
  }
  assert.equal(evidence.acceptedResponses.length,6);
  assert.equal(evidence.completions.length,1);
  const replay=commitLetterLeapChoice(evidence,repeated,5,'R',['R','A'],{});
  assert.equal(replay.evidence.completions.length,1);
  assert.equal(replay.response.independentEncodingPractice,false);
  const skipped=commitLetterLeapChoice(newLetterLeapEvidence(),repeated,5,'R',['R','A'],{});
  assert.equal(skipped.finished,false);assert.equal(skipped.evidence.completions.length,0);
  assert.equal(validLetterLeapEvidence(evidence,rounds),true);
});

test('sentence cues hide future spelling and any earlier instance of the active target',()=>{
  const sentence=['THE','CAT','AND','THE','DOG'];
  assert.equal(letterLeapSentenceCue(sentence,0),'___ ___ ___ ___ ___');
  assert.equal(letterLeapSentenceCue(sentence,1),'THE ___ ___ ___ ___');
  assert.equal(letterLeapSentenceCue(sentence,3),'___ CAT AND ___ ___');
  assert.equal(letterLeapSentenceCue(['The','cat','the'],2),'___ cat ___');
});

test('sentence context pictures retain exact active-word audio and remain explicitly supported encoding',()=>{
  const seen=[];
  const contextRounds=buildLetterLeapRounds([{mode:'sentence',targets:[['THE','CAT','AND','THE','DOG']]}], 'hard', 9, 0, {
    pictureCue: input=>{seen.push(structuredClone(input));return{pictures:['/images/owned-cat-dog-context.webp'],pictureKind:'sentence-context'};}
  });
  const active=contextRounds[0];
  assert.deepEqual(seen[0],{word:'THE',sentence:['THE','CAT','AND','THE','DOG']});
  assert.equal(contextRounds[3].word,'THE');
  assert.equal(active.audio,contextRounds[3].audio);
  const result=commitLetterLeapChoice(newLetterLeapEvidence(),active,0,'T',['T','B'],{
    delivery:'delivered',pictureDelivery:'delivered',responseAt:300,
    deliveryReceipt:{source:active.audio,endedAt:200},pictureReceipt:{source:active.pictures[0],decodedAt:100}
  });
  assert.equal(result.response.deliveryAtResponse,'delivered');
  assert.equal(result.response.pictureKind,'sentence-context');
  assert.deepEqual(result.response.supportReasons,['sentence-context-picture']);
  assert.equal(result.response.independentEncodingPractice,false);
  assert.equal(validLetterLeapEvidence(result.evidence,contextRounds),true);
  for(const mutate of [row=>{row.pictureKind='word';},row=>{row.supportReasons=[];},row=>{row.independentEncodingPractice=true;}]){
    const forged=structuredClone(result.evidence);mutate(forged.firstResponses[0]);
    assert.equal(validLetterLeapEvidence(forged,contextRounds),false);
  }
});

test('counterfeit supported or independent records and completion counts fail closed',()=>{
  const result=choice(newLetterLeapEvidence(),0,'S');
  assert.equal(validLetterLeapEvidence(result.evidence,rounds),true);
  for(const change of [e=>{e.firstResponses[0].deliveryReceipt.source='wrong';},e=>{e.firstResponses[0].supportReasons=['hint'];},
    e=>{e.firstResponses[0].wordVisible=true;},e=>{e.firstResponses[0].choices=['S','S'];},
    e=>{e.firstResponses[0].correct=false;},e=>{e.completions=[round.roundId];},e=>{e.firstResponses=[];}]) {
    const value=structuredClone(result.evidence);change(value);assert.equal(validLetterLeapEvidence(value,rounds),false);
  }
  const motor=newLetterLeapEvidence();motor.motorEvents.stomps=6;motor.motorEvents.coins=10;
  assert.equal(validLetterLeapEvidence(motor,rounds),true);assert.deepEqual(motor.completions,[]);
});

test('all ten original courses remain per difficulty; a catch-up replay serializes without duplicating stages',()=>{
  for(const difficulty of ['easy','medium','hard']) {
    const bank=buildLetterLeapRounds(difficultyLadder('letter-leap',difficulty,12),difficulty,12,0);
    assert.equal(new Set(bank.map(item=>item.stage)).size,10);
    assert.equal(new Set(bank.map(item=>item.roundId)).size,bank.length);
  }
  const queue=createLetterLeapStageQueue(0);queue.miss();
  assert.deepEqual(queue.snapshot().order.slice(0,4),[1,2,3,0]);queue.complete();
  const restored=createLetterLeapStageQueue(0,queue.snapshot());
  while(!restored.isDone)restored.complete();
  assert.equal(restored.snapshot().completed.length,10);assert.equal(restored.peek(),null);
});
