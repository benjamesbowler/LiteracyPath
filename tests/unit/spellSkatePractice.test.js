import test from 'node:test';
import assert from 'node:assert/strict';
import {newSpellSkatePractice,recordSpellSkateChoice,completeSpellSkateWord,spellSkateWrongCounts} from '../../src/utils/spellSkatePractice.js';
const item={levelIndex:0,word:'cat',segments:['c','a','t'],step:0,selected:'c',choices:['p','c','s']};
const cue={deliberate:true,inputAuthority:'selected-skate-destination',motorAssist:true,wordDelivery:'delivered',
  wordReceipt:{source:'/game-assets/audio/words/cat.mp3',deliveredAt:'2026-10-04T05:00:00Z',playTimeMs:1200},soundEnabled:true};
test('only deliberate valid spelling choices carry response evidence; navigation/graphics do not invent learning support',()=>{
  const evidence=newSpellSkatePractice({sessionSeed:42,journeyIndex:11,difficulty:'easy'});
  assert.equal(recordSpellSkateChoice(evidence,item,{...cue,deliberate:false}),evidence);
  assert.equal(recordSpellSkateChoice(evidence,{...item,selected:'z'},cue),evidence);
  const next=recordSpellSkateChoice(evidence,item,{...cue,graphicsRecovery:'gzip-recovery'});
  assert.equal(next.firstResponses.length,1);assert.equal(evidence.firstResponses.length,0);
  assert.equal(next.firstResponses[0].wordVisible,false);
  assert.equal(next.firstResponses[0].independentPractice,true);
  assert.deepEqual(next.firstResponses[0].supportReasons,[]);
  assert.equal(next.firstResponses[0].graphicsRecovery,'gzip-recovery');
  assert.equal(next.firstResponses[0].motorAssist,true);
});
test('actual word end receipt, replay/help/partial hint and retries remain support-aware at the response',()=>{
  for(const support of [{wordReceipt:null},{wordDelivery:'pending'},{soundEnabled:false},{partialHint:true},{supportReasons:['word-audio-replay']}]) {
    const evidence=recordSpellSkateChoice(newSpellSkatePractice(),item,{...cue,...support});
    assert.equal(evidence.firstResponses[0].independentPractice,false);
    assert.ok(evidence.firstResponses[0].supportReasons.length>0);
  }
  const wrong=recordSpellSkateChoice(newSpellSkatePractice(),{...item,selected:'p'},cue);
  const retry=recordSpellSkateChoice(wrong,item,cue);
  assert.equal(retry.firstResponses[0].selected,'p');assert.equal(retry.assistedRetries[0].independentPractice,false);
  assert.equal(retry.firstResponses[0].wordAudioReceipt.source,cue.wordReceipt.source);
});
test('a skating trick or partial build cannot complete a word; every part needs an accepted language response',()=>{
  let evidence=recordSpellSkateChoice(newSpellSkatePractice(),item,cue);
  assert.equal(completeSpellSkateWord(evidence,0,'cat',item.segments),evidence);
  evidence=recordSpellSkateChoice(evidence,{...item,step:1,selected:'a',choices:['a','o','i']},cue);
  evidence=recordSpellSkateChoice(evidence,{...item,step:2,selected:'t',choices:['p','s','t']},cue);
  evidence=completeSpellSkateWord(evidence,0,'cat',item.segments);
  assert.deepEqual(evidence.completions,['word-0:cat']);
  assert.equal(completeSpellSkateWord(evidence,0,'cat',item.segments),evidence);
});
test('a deliberate wrong destination is counted before travel; its real arrival cannot charge a second language error',()=>{
  const first=spellSkateWrongCounts({mistakes:0,wordMistakes:0},{selected:'p',expected:'c'});
  assert.deepEqual(first,{mistakes:1,wordMistakes:1});
  assert.equal(spellSkateWrongCounts(first,{selected:'p',expected:'c',responseCounted:true}),first);
  assert.deepEqual(spellSkateWrongCounts(first,{selected:'s',expected:'c'}),{mistakes:2,wordMistakes:2});
  assert.equal(spellSkateWrongCounts(first,{selected:'c',expected:'c'}),first);
});
