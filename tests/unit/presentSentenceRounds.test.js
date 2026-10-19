import test from 'node:test';
import assert from 'node:assert/strict';
import {presentSentenceRounds} from '../../src/utils/present/presentationSentenceRounds.js';
import {buildCyclePresentation,presentationReviewContent} from '../../src/utils/present/presentationBuilder.js';
import {PRESENT_SENTENCE_CONTRASTS} from '../../src/data/presentSentenceContrasts.js';
const days={detective:['monday','thursday','friday'],scramble:['tuesday','friday']};

test('every sentence game has three rounds, distinct weekly sentences and actual previous practice',()=>{
 for(const kind of Object.keys(days)){
  const history=new Map();
  for(let week=1;week<=27;week++){
   const weekly=[];
   for(const day of days[kind]){
    const rounds=presentSentenceRounds(week,day,kind);assert.equal(rounds.length,3);
    assert.deepEqual(rounds.map(r=>r.activityRound),[1,2,3]);
    assert.ok(new Set(rounds.map(r=>r.word)).size>=2);
    if(week>1)assert.ok(rounds.some(r=>r.reviewCycle));
    for(const card of rounds){
     assert.equal(card.childReadingClaim,false);
     if(card.reviewCycle){
      assert.ok(card.reviewCycle<week);
      assert.ok(history.get(card.reviewCycle).some(old=>!old.reviewCycle&&old.sentence===card.sentence&&old.imagePath===card.imagePath),card.sentence);
     }
     if(kind==='detective'){assert.equal(card.detectiveSource.correctSentence,card.sentence);assert.equal(card.detectiveSource.wrongSentence,card.wrongSentence);assert.notEqual(card.wrongSentence,card.sentence);assert.ok(card.sentence.endsWith('.'));assert.ok(card.wrongSentence.endsWith('.'));}
    }
    weekly.push(...rounds);
   }
   assert.equal(new Set(weekly.map(r=>r.sentence)).size,weekly.length);
   if(week>2)assert.ok(weekly.some(r=>r.reviewCycle&&r.reviewCycle<week-1));
   history.set(week,weekly);
  }
 }
});

test('authored false drafts keep grammatical quantities and avoid ambiguous multicolour substitutions',()=>{
 assert.equal(PRESENT_SENTENCE_CONTRASTS.get('The apple has one leaf.'),'The apple has two leaves.');
 assert.equal(PRESENT_SENTENCE_CONTRASTS.get('The cup has one handle.'),'The cup has two handles.');
 assert.equal(PRESENT_SENTENCE_CONTRASTS.get('The tent has an open door.'),'The tent has a closed door.');
 assert.equal(PRESENT_SENTENCE_CONTRASTS.get('The quilt has green squares.'),undefined);
 for(const wrong of PRESENT_SENTENCE_CONTRASTS.values())assert.doesNotMatch(wrong,/two (?:leaf|handle|horn)\.|an closed|blue and blue/);
});

test('all projected multi-round metadata includes exact required audio and taught missing words',()=>{
 for(let week=1;week<=27;week++){
  const targets=[];
  for(const day of ['monday','tuesday','wednesday','thursday','friday']){
   const deck=buildCyclePresentation(`cycle-${week}`,{day});
   for(const item of deck.manifest.slides.filter(s=>['supported-sentence-picture-comparison','supported-sentence-ordering','sight-word-retrieval','letter-retrieval'].includes(s.construct))){
    assert.equal(item.rounds.length,3);
    assert.ok(item.requiredAudio.every(a=>a.required&&a.src));
    if(item.construct==='supported-sentence-picture-comparison'){
     assert.equal(new Set(item.rounds.map(r=>r.matches)).size,2);
     for(const r of item.rounds){assert.equal(Boolean(r.audioPath),r.matches);assert.ok(item.requiredAudio.some(a=>a.transcript===r.correctSentence&&a.src===r.correctAudioPath));}
    }else if(item.construct==='supported-sentence-ordering'){
     for(const r of item.rounds)assert.ok(item.requiredAudio.some(a=>a.transcript===r.sentence&&a.src===r.audioPath));
    }else if(item.construct==='sight-word-retrieval'){
     const introduced=presentationReviewContent(`cycle-${week}`,day).words;
     for(const r of item.rounds){
      assert.ok(introduced.includes(r.target));assert.equal(r.items[r.targetIndex].text,r.target);
      assert.equal(new Set(r.items.map(i=>i.text)).size,r.items.length);
      assert.ok(r.items.every(i=>introduced.includes(i.text)));
      targets.push(r.target);
     }
    }
   }
  }
  if(week>=3)assert.equal(new Set(targets).size,6,`Cycle ${week}: distinct hidden targets`);
 }
});

// Balance the actual generated decks, including review rounds, rather than
// checking a helper that might differ from the projected question.
test('Detective answers are varied, mixed within every session and balanced within every week',()=>{
 const patterns=new Set();let trueCount=0,falseCount=0;
 for(let week=1;week<=27;week++){
  let weeklyTrue=0;
  for(const day of days.detective){
   const slide=buildCyclePresentation(`cycle-${week}`,{day}).manifest.slides.find(s=>s.construct==='supported-sentence-picture-comparison');
   const outcomes=slide.rounds.map(r=>r.matches);
   patterns.add(outcomes.map(value=>value?'T':'F').join(''));
   const count=outcomes.filter(Boolean).length;assert.ok(count===1||count===2);weeklyTrue+=count;
   for(const round of slide.rounds){
    assert.equal(round.sentence,round.matches?round.correctSentence:round.wrongSentence);
    assert.notEqual(round.correctSentence,round.wrongSentence);
    assert.ok(round.correctSentence.split(/\s+/).length<=9);
    assert.ok(round.wrongSentence.split(/\s+/).length<=9);
   }
  }
  assert.ok(weeklyTrue===4||weeklyTrue===5,`Cycle ${week} has ${weeklyTrue} true answers`);
  trueCount+=weeklyTrue;falseCount+=9-weeklyTrue;
 }
 assert.equal(patterns.size,6,'Use all mixed three-round patterns instead of an alternating answer key');
 assert.ok(Math.abs(trueCount-falseCount)<=1);
});
