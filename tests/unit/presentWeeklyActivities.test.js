import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildCyclePresentation} from '../../src/utils/present/presentationBuilder.js';

const days=['monday','tuesday','wednesday','thursday','friday'];
test('each oral activity has three distinct rounds, with genuine last-week and older retrieval',()=>{
 for(const construct of ['syllable-counting','rhyme-recognition']){
  const history=new Map();
  for(let cycle=1;cycle<=27;cycle++){
   const activityDays=construct==='syllable-counting'?['monday','wednesday']:['tuesday','friday'];
   const rounds=activityDays.flatMap(day=>{
    const items=buildCyclePresentation(`cycle-${cycle}`,{day}).manifest.slides.filter(item=>item.construct===construct);
    assert.equal(items.length,3,`${cycle} ${day}: three oral rounds`);
    assert.deepEqual(items.map(item=>item.oralRound),[1,2,3]);
    assert.ok(items.every(item=>item.oralRoundCount===3));
    if(construct==='syllable-counting')assert.ok(new Set(items.map(item=>item.syllableCount)).size>=2,'Each session contrasts different beat counts');
    return items;
   });
   assert.equal(new Set(rounds.map(item=>item.target)).size,6,`Cycle ${cycle}: six different spoken targets`);
   const reviews=rounds.filter(item=>item.reviewCycle);
   assert.equal(reviews.length,cycle===1?0:2);
   for(const review of reviews){
    assert.ok(review.reviewCycle<cycle);
    assert.ok(history.get(review.reviewCycle).some(item=>item.target===review.target&&!item.reviewCycle),'Review retrieves actual earlier practice rather than repeatedly recycling a review round');
   }
   if(cycle>1)assert.ok(reviews.some(item=>item.reviewCycle===cycle-1),'Last week is revisited');
   if(cycle>2)assert.ok(reviews.some(item=>item.reviewCycle<cycle-1),'Older weeks rotate into review');
   assert.equal(new Set(rounds.map(item=>item.oralActivityId)).size,2,'Two activities, each containing three rounds');
   history.set(cycle,rounds);
  }
 }
});
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
