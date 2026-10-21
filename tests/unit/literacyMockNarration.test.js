import test from 'node:test';
import assert from 'node:assert/strict';
import { literacyMockNarrationCues, wholeClassMockQuestionPrompt } from '../../src/utils/literacyMockNarration.js';
import { LITERACY_MOCK_RUNTIME_V11 as bank } from '../../src/data/generated/literacyMockRuntimeV11.generated.js';
import { wholeClassMockPool } from '../../src/components/teacher/wholeClassPracticeModel.js';

test('recorded narration follows displayed choice numbers and includes the exact spoken target before options',()=>{
 const item={requiredAudioCues:[
  {role:'instruction',text:'Which word has the same starting sound?',path:'/instruction.mp3'},
  {role:'target_word',text:'boat',path:'/boat.mp3'},
  {role:'choice',text:'bike',choiceId:'a',path:'/bike.mp3'},
  {role:'choice',text:'duck',choiceId:'b',path:'/duck.mp3'},
  {role:'choice',text:'pig',choiceId:'c',path:'/pig.mp3'}]};
 assert.deepEqual(literacyMockNarrationCues(item,[{id:'c'},{id:'a'},{id:'b'}]).map(cue=>[cue.text,cue.choiceNumber]),[
  ['Which word has the same starting sound?',undefined],['boat',undefined],['pig',1],['bike',2],['duck',3]]);
});

test('silent reading content is never turned into an oral answer clue',()=>{
 const item={modality:'reading',passage:'The red hen sat on a log.',displayPassageDuringResponse:true,
  requiredAudioCues:[{role:'instruction',text:'Where did the hen sit?',path:'/instruction.mp3'}]};
 assert.deepEqual(literacyMockNarrationCues(item,[{id:'a',label:'on a log',audioPath:'/unapproved-choice.mp3'}]).map(cue=>cue.text),[
  'Read the passage in the box. Then answer this question.','Where did the hen sit?']);
});

test('every available class question has a complete authored narration including phonemes',()=>{
 const active=wholeClassMockPool(bank,'all','all');
 let phonemes=0;
 for(const item of active) {
  const cues=literacyMockNarrationCues(item,item.choices);
  assert.ok(cues.length,item.id);
  assert.ok(cues.every(cue=>typeof cue.text==='string'&&cue.text.trim()),item.id);
  assert.equal(cues.filter(cue=>cue.role!=='layout_instruction').length,item.requiredAudioCues.length,item.id);
  for(const cue of cues.filter(cue=>cue.role==='choice')) assert.equal(cue.text,item.requiredAudioCues.find(source=>source.path===cue.path&&source.role==='choice').text,item.id);
  phonemes+=cues.filter(cue=>cue.role==='phoneme').length;
 }
 assert.ok(phonemes>0,'Blending tasks retain their individual sounds');
});

test('class sound comparison text retains the exact reference word alongside its unchanged recording',()=>{
 for(const target of ['cat','web']) {
 for(const [prompt,expected] of [
  ['Which word has the same starting sound?','Which word has the same starting sound as cat?'],
  ['Which word has the same last sound?','Which word has the same last sound as cat?'],
  ['Which word has the same middle vowel sound?','Which word has the same middle vowel sound as cat?'],
  ['Which word rhymes with the word you hear?','Which word rhymes with cat?']]) {
  const item={prompt,targetWord:target,requiredAudioCues:[{role:'instruction',text:`${target}. ${prompt}`,path:'/question.mp3'},
   {role:'target_word',text:target,path:'/target.mp3'},{role:'choice',text:'hat',choiceId:'a',path:'/hat.mp3'}]};
  const original=structuredClone(item);
  assert.equal(wholeClassMockQuestionPrompt(item),expected.replace('cat',target));
  assert.deepEqual(item,original,'A class display must never mutate the scored bank or its recordings');
 }
 }
});
