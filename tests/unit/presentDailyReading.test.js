import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PRESENT_DAILY_READING, dailyPresentReading, presentGameSchedule } from '../../src/data/presentDailyReading.js';
import { PRESENT_NARRATION_AUDIO, PRESENT_NARRATION_METADATA } from '../../src/data/generated/presentNarration.generated.js';
import { normalizeLedaAudioText } from '../../src/data/normalizeLedaAudioText.js';

test('all 135 days have two distinct authored pictured sentences, with varied weekly vocabulary',()=>{
 assert.equal(Object.keys(PRESENT_DAILY_READING).length,27);
 for(let cycle=1;cycle<=27;cycle++){
  const cards=PRESENT_DAILY_READING[cycle];assert.equal(cards.length,10);
  assert.equal(new Set(cards.map(c=>c.sentence)).size,10);
  assert.ok(new Set(cards.map(c=>c.word)).size>=4);
  for(const card of cards){assert.ok(card.sentence.trim().split(/\s+/).length<=9);assert.ok(fs.existsSync('public'+card.imagePath),card.word);assert.equal(card.childReadingClaim,false);}
  const all=['monday','tuesday','wednesday','thursday','friday'].flatMap(day=>dailyPresentReading(cycle,day));
  assert.deepEqual(all,cards);
 }
});
test('daily cards retain literal sentence meaning and exact whole-sentence media',()=>{
 const cards=Object.values(PRESENT_DAILY_READING).flat();
 assert.equal(new Set(cards.map(card=>card.id)).size,270);
 for(const card of cards){
  assert.equal(card.readingPurpose,'supported-shared-reading');
  assert.ok(card.sceneRequirements.includes(card.sentence));
  assert.ok(card.meaningPrompt.length>5);
  assert.ok(card.acceptedResponses.length>0);
  const key=normalizeLedaAudioText(card.sentence);
  assert.ok(PRESENT_NARRATION_AUDIO[key],`Missing exact recording: ${card.sentence}`);
  assert.equal(PRESENT_NARRATION_METADATA[key].transcript,card.sentence);
 }
 assert.equal(PRESENT_DAILY_READING[19][3].sentence,'The cat is under the table.');
 assert.deepEqual(PRESENT_DAILY_READING[19][3].acceptedResponses,['under the table','below the table']);
 assert.equal(PRESENT_DAILY_READING[22][3].sentence,'The paint is pink.');
 assert.equal(PRESENT_DAILY_READING[26][2].sentence,'The child has tears.');
 assert.equal(PRESENT_DAILY_READING[26][3].sentence,'Look at the book.');
 assert.ok(cards.every(card=>!/^The (dog|ball|kite|wheel) (runs|rolls|flies|turns)/.test(card.sentence)));
});
test('detective cards use grounded noun contrasts and every week includes three sentence forms',()=>{
 for(const cards of Object.values(PRESENT_DAILY_READING)){
  for(const index of [0,1,6,7]){
   const card=cards[index];
   assert.notEqual(card.detectiveSource.wrongSentence,card.detectiveSource.correctSentence);
   const correctKey=normalizeLedaAudioText(card.detectiveSource.correctSentence);
   assert.ok(PRESENT_NARRATION_AUDIO[correctKey],`Missing exact detective recording: ${card.detectiveSource.correctSentence}`);
   assert.equal(PRESENT_NARRATION_METADATA[correctKey].transcript,card.detectiveSource.correctSentence);
   assert.ok(!['under','pink','cry','shy','stay','sing','song','long'].includes(card.word));
   assert.ok(card.detectiveSource.contrastKind);
   assert.doesNotMatch(card.detectiveSource.wrongSentence,/\ban dog\b|This is dog\./);
  }
  assert.ok(cards.some(card=>card.sentence.endsWith('?')));
  assert.ok(cards.some(card=>/^(Look|Point|Find|Show)\b/.test(card.sentence)));
  assert.ok(cards.some(card=>/^(This|Here|The)\b/.test(card.sentence)));
 }
 assert.equal(PRESENT_DAILY_READING[12][0].detectiveSource.correctSentence,'An egg has a shell.');
 assert.equal(PRESENT_DAILY_READING[14][0].detectiveSource.wrongSentence,'A van has wings.');
 assert.equal(PRESENT_DAILY_READING[23][0].detectiveSource.contrastKind,'colour');
 assert.throws(()=>dailyPresentReading(0,'monday'),RangeError);
 assert.throws(()=>dailyPresentReading(1,'saturday'),RangeError);
 assert.throws(()=>presentGameSchedule(28,'monday'),RangeError);
});
test('daily game rotation includes only selected games, with pairs once in two cycles',()=>{
 for(let cycle=1;cycle<=27;cycle++){
  const schedule=['monday','tuesday','wednesday','thursday','friday'].map(day=>presentGameSchedule(cycle,day));
  assert.deepEqual(schedule.slice(0,4),[['detective'],['scramble'],['missing'],['detective']]);
  assert.deepEqual(schedule[4],['scramble',cycle%2===0?'pairs':'missing']);
 }
});
