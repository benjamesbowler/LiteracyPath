import { getApprovedPhonemeAudioPath } from '../../src/data/approvedPhonemeAudio.js';
import {PRESENT_NARRATION_AUDIO,PRESENT_NARRATION_METADATA} from "../../src/data/generated/presentNarration.generated.js";
import {normalizeLedaAudioText} from "../../src/data/normalizeLedaAudioText.js";
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {elSkillsBlockCycles} from '../../src/data/elSkillsBlockCycles.js';
import {THREE_SYLLABLE_BANK,getPresentOralDeletion,getPresentTeachingSchedule,getPresentHfwTeaching,PRESENT_SOUND_BOX_ITEMS,PRESENT_WORD_CHAINS,getPresentWordChains,getPresentSoundBoxes,PRESENT_SORT_ACTIVITIES,PRESENT_RETELL_STORY} from '../../src/data/presentTeachingContent.js';
import {PRESENT_VOCABULARY,PRESENT_CAPTION_MEANING,getPresentChildReadingSentences} from '../../src/data/presentVocabulary.js';
test('syllable deletion removes one spoken syllable rather than a compound part',()=>{
 assert.deepEqual(THREE_SYLLABLE_BANK.find(x=>x.word==='ladybug').spokenUnits,['la','dy','bug']);
 assert.equal(getPresentOralDeletion('ladybug','first').expectedSpokenResult,'dybug');
 assert.equal(getPresentOralDeletion('strawberry','last').expectedSpokenResult,'strawber');
 for(const item of THREE_SYLLABLE_BANK) for(const position of ['first','last']){
  const deletion=getPresentOralDeletion(item.word,position);
  assert.equal(deletion.removedUnitIndices.length,1);
  assert.equal(deletion.spokenUnits.length,3);
  assert.ok(deletion.expectedIpa);
 }
});
test('weekly oral schedule deliberately alternates both skills and never invents a second',()=>{
 assert.deepEqual(Array.from({length:5},(_,day)=>getPresentTeachingSchedule(20,day).skillIndices[0]),[0,1,0,1,0]);
 for(let cycle=1;cycle<=27;cycle++)for(let day=0;day<5;day++)assert.deepEqual([...getPresentTeachingSchedule(cycle,day).skillIndices].sort(),[0,1]);
 assert.deepEqual(getPresentTeachingSchedule(26,1,1).skillIndices,[0]);
});
test('every scheduled HFW has authored phonology and a meaning application',()=>{
 for(const cycle of elSkillsBlockCycles.filter(c=>c.cycleNumber)) for(const word of cycle.highFrequencyWords){
  const record=getPresentHfwTeaching(word);assert.ok(record,word);assert.ok(record.phonemeIds.length);assert.ok(record.meaning);assert.ok(record.phrase);assert.ok(record.coverWritePrompt.includes(word));assert.equal(record.graphemePhonemeMap.map(part=>part.grapheme).join(''),word);assert.equal(record.graphemePhonemeMap.flatMap(part=>part.phonemeIds).length,record.phonemeIds.length);
 }
 assert.deepEqual(getPresentHfwTeaching('said').exceptionParts,['ai']);
 assert.deepEqual(getPresentHfwTeaching('said').regularParts,['s','d']);
 assert.deepEqual(getPresentHfwTeaching('half').phonemeIds,['h','æ','f']);
});
test('sound boxes count sounds and represent multi-sound spellings explicitly',()=>{
 const ship=PRESENT_SOUND_BOX_ITEMS.find(x=>x.word==='ship'),box=PRESENT_SOUND_BOX_ITEMS.find(x=>x.word==='box');
 assert.equal(ship.boxCount,3);assert.equal(ship.word.length,4);assert.equal(box.boxCount,4);assert.equal(box.word.length,3);assert.deepEqual(box.graphemeToPhonemeIndices,[[0],[1],[2,3]]);
 assert.ok(!getPresentSoundBoxes(['s','i','p']).includes(ship));assert.ok(getPresentSoundBoxes(['sh','i','p']).includes(ship));
 for(const item of PRESENT_SOUND_BOX_ITEMS)assert.deepEqual(item.graphemeToPhonemeIndices.flat(),Array.from({length:item.boxCount},(_,i)=>i));
});
test('every controlled chain has exactly one authored spelling-unit change and is gated',()=>{
 for(const chain of PRESENT_WORD_CHAINS)for(const step of chain.steps){
  if(step.operation==='add'){assert.equal(step.toUnits.length,step.fromUnits.length+1);assert.deepEqual(step.toUnits.filter((_,i)=>i!==step.index),step.fromUnits);continue;}
  const changes=step.fromUnits.map((unit,i)=>unit===step.toUnits[i]?null:i).filter(i=>i!==null);assert.deepEqual(changes,[step.index]);assert.equal(step.fromUnits.join(''),step.from);assert.equal(step.toUnits.join(''),step.to);
 }
 assert.equal(getPresentWordChains(['m','a','t','s']).some(chain=>chain.id==='chain-early'),false);assert.equal(getPresentWordChains(['m','a','t','s','i']).some(chain=>chain.id==='chain-early'),true);assert.equal(getPresentWordChains(['a','m']).length,0);assert.equal(getPresentWordChains(['a','m','t'])[0].id,'chain-first-words');
});
test('captions retain54 shared-reading contracts and truthful media roles',()=>{
 const captions=Object.values(PRESENT_VOCABULARY).flat();assert.equal(captions.length,54);
 for(const card of captions){assert.equal(card.audioTranscript,card.sentence);assert.equal(card.childReadingClaim,false);assert.ok(card.definition&&card.nonExample&&card.gesture&&card.meaningPrompt);assert.ok(card.sceneRequirements);assert.ok(card.audioPath||card.mediaGap);if(card.audioPath)assert.ok(fs.existsSync(`public${card.audioPath}`));}
 for(const card of captions){const key=normalizeLedaAudioText(card.sentence);if(PRESENT_NARRATION_AUDIO[key]){assert.equal(card.audioPath,PRESENT_NARRATION_AUDIO[key]);assert.equal(card.mediaGap,'');assert.equal(card.mediaEvidence.audio.humanListening,PRESENT_NARRATION_METADATA[key]?.humanListening||'unknown');}else if(!card.audioPath){assert.equal(card.audioReviewState,'unavailable');assert.ok(card.mediaGap);}}
 assert.equal(captions.find(x=>x.word==='song').imageRole,'action-support');
 assert.ok(captions.find(x=>x.word==='song').sceneGap);
 assert.equal(captions.find(x=>x.word==='cry').imagePath,'/images/assessment/language/variants/antonyms-synonyms/cry-weep-01.webp');
});
test('child-reading transformations cannot precede required code',()=>{
 assert.equal(getPresentChildReadingSentences(['a','t','s'],['a']).length,0);
 assert.equal(getPresentChildReadingSentences(['a','c','t','s'],['a']).length,1);
 assert.equal(getPresentChildReadingSentences(['a','c','t','s','r','n'],['a']).length,2);
});
test('retell uses three distinct existing event scenes and keeps meaning separate from print',()=>{
 assert.equal(PRESENT_RETELL_STORY.events.length,3);assert.equal(new Set(PRESENT_RETELL_STORY.events.map(e=>e.imagePath)).size,3);
 for(const event of PRESENT_RETELL_STORY.events)assert.ok(fs.existsSync(`public${event.imagePath}`));
 assert.equal(PRESENT_RETELL_STORY.readingPurpose,'teacher-read-aloud');assert.ok(PRESENT_RETELL_STORY.teacherModel.includes('Water helped'));
 for(const sort of PRESENT_SORT_ACTIVITIES){assert.ok(sort.construct);assert.ok(sort.items.every(item=>item.reason&&sort.headings[item.group]));}
});
test('th teaching retains both sound values as stable variant ids',()=>{
 const card=elSkillsBlockCycles.find(c=>c.cycleNumber===15).focusLetters.find(c=>c.spelling==='th');
 assert.deepEqual(card.soundVariants.map(x=>x.id),['th-unvoiced','th-voiced']);
 for(const variant of card.soundVariants)assert.ok(fs.existsSync(`public${getApprovedPhonemeAudioPath(variant.audioKey)}`));
});

test('all54 caption questions use authored aligned meaning responses, distinct from label retrieval',()=>{
 const cards=Object.values(PRESENT_VOCABULARY).flat();assert.equal(Object.keys(PRESENT_CAPTION_MEANING).length,54);
 for(const card of cards){assert.equal(card.meaningPrompt,PRESENT_CAPTION_MEANING[card.word].question);assert.deepEqual(card.acceptedResponses,PRESENT_CAPTION_MEANING[card.word].acceptedResponses);assert.ok(card.vocabularyAcceptedResponses.includes(card.word));}
 const find=word=>cards.find(card=>card.word===word);
 assert.equal(find('igloo').meaningPrompt,'What is an igloo made of?');assert.deepEqual(find('igloo').acceptedResponses,['snow','blocks of snow']);assert.deepEqual(find('ink').acceptedResponses,['ink']);assert.deepEqual(find('ring').acceptedResponses,['on a finger','a finger','finger']);assert.equal(find('lamp').meaningPrompt,'What does a lamp give us?');assert.deepEqual(find('lamp').acceptedResponses,['light']);
});
test('format-aware oral selection is declared before assembly rather than sliced by array position',()=>{
 assert.deepEqual(Array.from({length:5},(_,day)=>getPresentTeachingSchedule(20,day,2,'review').skillIndices),[[0],[1],[0],[1],[0]]);
 for(const format of ['core','extended'])for(let day=0;day<5;day++)assert.equal(getPresentTeachingSchedule(20,day,2,format).skillIndices.length,2);
 assert.deepEqual(getPresentTeachingSchedule(26,3,1,'review').skillIndices,[0]);
});
