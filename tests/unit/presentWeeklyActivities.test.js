import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildCyclePresentation} from '../../src/utils/present/presentationBuilder.js';

const days=['monday','tuesday','wednesday','thursday','friday'];
test('every cycle delivers the six requested activities at least twice on separate days',()=>{
 const constructs=['syllable-counting','rhyme-recognition','high-frequency-word-matching','supported-sentence-picture-comparison','sight-word-retrieval','supported-sentence-ordering'];
 for(let cycle=1;cycle<=27;cycle++){
  const decks=days.map(day=>buildCyclePresentation(`cycle-${cycle}`,{day}));
  for(const construct of constructs){
   const occurrences=decks.flatMap((deck,index)=>deck.manifest.slides.filter(item=>item.construct===construct).map(item=>({day:days[index],item})));
   assert.ok(occurrences.length>=2,`Cycle ${cycle}: ${construct} has ${occurrences.length}`);
   assert.ok(new Set(occurrences.map(item=>item.day)).size>=2,`Cycle ${cycle}: ${construct} needs two different days`);
   if(['syllable-counting','rhyme-recognition'].includes(construct))assert.equal(new Set(occurrences.map(({item})=>item.target)).size,occurrences.length,'Fresh oral target on each day');
  }
  for(const deck of decks)for(const item of deck.manifest.slides.filter(item=>['syllable-counting','rhyme-recognition'].includes(item.construct))){
   assert.equal(item.childReadingClaim,false);
   assert.equal(item.choices.filter(choice=>choice.correct).length,1);
   assert.ok(item.media.filter(media=>media.required&&media.type==='audio').length>=1);
   assert.ok(item.media.filter(media=>media.required&&media.type==='image').length>=1);
   for(const media of item.media)assert.ok(fs.existsSync(`public${media.src}`),media.src);
  }
 }
});
