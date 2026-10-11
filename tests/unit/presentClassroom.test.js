import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildCyclePresentation, PRESENTATION_DAYS, PRESENTATION_FORMATS, presentationDayPlan, presentationReviewContent, shufflePresentationMemoryCards } from '../../src/utils/present/presentationBuilder.js';
import { elSkillsBlockCycles } from '../../src/data/elSkillsBlockCycles.js';

const days = PRESENTATION_DAYS.map(item => item.value);
test('Present has one daily lesson for each of 27 cycles and five weekdays', () => {
  assert.equal(PRESENTATION_FORMATS.length, 1);
  assert.deepEqual(days, ['monday','tuesday','wednesday','thursday','friday']);
  for (let cycle=1;cycle<=27;cycle++) for(const day of days) {
    const deck=buildCyclePresentation(`cycle-${cycle}`,{day});
    assert.ok(deck.slideCount>5 && deck.slideCount<=28, `${cycle} ${day}: ${deck.slideCount}`);
    assert.equal(deck.lessonPlan.minutes,18);
    assert.equal(deck.lessonPlan.blocks.reduce((sum,item)=>sum+item.minutes,0),18);
    assert.equal(deck.manifest.timing.observedMinutes,null);
    assert.doesNotMatch(deck.html,/data-word-chain|Change one part|teaching-sequence|teaching-stage|data-build-mode|data-build-model/);
    assert.doesNotMatch(deck.html,/data-play=""|data-teacher-(?:note|record)|\bonclick=/);
    assert.ok(deck.manifest.slides.every(item=>item.teacher.model));
  }
});

test('Monday introduces the first letter, Tuesday remaining letters, Wednesday and Thursday sight words, Friday nothing new', () => {
  for(const cycle of elSkillsBlockCycles.filter(item=>item.cycleNumber)) {
    const plans=days.map(day=>presentationDayPlan(cycle.id,day));
    assert.equal(plans[0].newWords.length,0);assert.equal(plans[1].newWords.length,0);
    assert.deepEqual([...plans[2].newWords,...plans[3].newWords],cycle.highFrequencyWords);
    assert.deepEqual(plans[2].newGraphemes,[]);assert.deepEqual(plans[3].newGraphemes,[]);
    assert.deepEqual(plans[4].newWords,[]);assert.deepEqual(plans[4].newGraphemes,[]);
    if(cycle.focusLetters?.length)assert.ok(plans[0].newGraphemes.length<=1);
    for(const day of ['monday','tuesday']) {
      const deck=buildCyclePresentation(cycle.id,{day});
      assert.ok(deck.manifest.slides.every(item=>item.construct!=='high-frequency-word'));
    }
    const friday=buildCyclePresentation(cycle.id,{day:'friday'});
    assert.ok(friday.manifest.slides.some(item=>item.construct==='weekly-retrieval'));
    assert.doesNotMatch(friday.html,/Our new sight word|class="slide p-letter-slide"/);
    assert.equal(friday.slideIndex.filter(item=>item.cls==='p-word-build').length,2);
    assert.equal(friday.slideIndex.filter(item=>item.cls==='p-sight-match').length,2);
    assert.equal(friday.slideIndex.filter(item=>item.cls==='p-picture-match').length,2);
  }
});

test('daily recap covers previous cycles and only sight words already introduced this week', () => {
  for(let n=2;n<=27;n++)for(const day of days){
    const review=presentationReviewContent(`cycle-${n}`,day);
    const previous=elSkillsBlockCycles.filter(cycle=>cycle.cycleNumber<n&&cycle.cycleNumber);
    for(const word of new Set(previous.flatMap(cycle=>cycle.highFrequencyWords)))assert.ok(review.words.includes(word));
    const deck=buildCyclePresentation(`cycle-${n}`,{day});
    const recaps=deck.manifest.slides.filter(item=>item.construct==='cumulative-retrieval');
    assert.equal(recaps.length,2);
    const recapWords=recaps.find(item=>item.target==='Earlier sight words').reviewItems.map(item=>item.target);
    for(const word of new Set(previous.flatMap(cycle=>cycle.highFrequencyWords)))assert.ok(recapWords.includes(word));
    const current=elSkillsBlockCycles.find(cycle=>cycle.cycleNumber===n);
    if(day==='monday'||day==='tuesday')for(const word of current.highFrequencyWords.filter(word=>!previous.some(cycle=>cycle.highFrequencyWords.includes(word))))assert.ok(!review.words.includes(word));
  }
});

test('each writing frame contains one case only and requires a separate deliberate start',()=>{
  for(let n=1;n<=27;n++)for(const day of days.slice(0,4)){
    const deck=buildCyclePresentation(`cycle-${n}`,{day});
    const writing=[...deck.html.matchAll(/<section class="slide p-writing"[\s\S]*?<\/section>/g)].map(match=>match[0]);
    assert.ok(writing.length>=2);
    for(let i=0;i<writing.length;i+=2){
      assert.match(writing[i],/data-letter-case="upper"/);assert.match(writing[i+1],/data-letter-case="lower"/);
      const upper=/aria-label="Finger trace ([^"]+)"/.exec(writing[i])[1];
      const lower=/aria-label="Finger trace ([^"]+)"/.exec(writing[i+1])[1];
      assert.equal(upper,lower.toUpperCase());assert.equal(lower,lower.toLowerCase());
      assert.equal((writing[i].match(/data-replay/g)||[]).length,1);
    }
  }
});

test('blending varies by cycle and every CVC spelling uses available code without a printed copying model',()=>{
  const pairs=new Set();
  for(let n=2;n<=27;n++){
    const deck=buildCyclePresentation(`cycle-${n}`,{day:'thursday'});
    const targets=deck.manifest.slides.filter(item=>item.construct==='encoding').map(item=>item.target);
    pairs.add(targets.join(','));
    for(const html of deck.html.matchAll(/<section class="slide p-word-build"[\s\S]*?<\/section>/g)){
      const target=JSON.parse(/data-build-target="([^"]+)"/.exec(html[0])[1].replaceAll('&quot;','"')).join('');
      assert.ok(!html[0].includes(`>${target}<`),'The target is hidden during the attempt');
    }
  }
  assert.ok(pairs.size>=20,`${pairs.size} varied weekly spelling targets`);
  assert.match(buildCyclePresentation('cycle-2',{day:'tuesday'}).html,/data-spelling-kind="cvc"/);
  assert.equal(buildCyclePresentation('cycle-1',{day:'monday'}).slideIndex.filter(item=>item.cls==='p-word-build').length,0,'No untaught m or sight word on first Monday');
});

test('the rejected teaching stage is removed from the runtime and home has only its two selectors and launch',()=>{
  const runtime=fs.readFileSync('public/present/deck.js','utf8');
  assert.doesNotMatch(runtime,/teaching-sequence|teaching-stage|setTeachingStage|data-chain-/);
  const page=fs.readFileSync('src/components/PresentPage.jsx','utf8');
  assert.equal((page.match(/<select /g)||[]).length,2);
  assert.doesNotMatch(page,/iframe|coverageDashboard|workspaceMode|Presenter console|printHtml|PRESENTATION_FORMATS/);
});

test('every memory game has exactly eight cards with four playable pairs inside taught content',()=>{
  for(let cycle=1;cycle<=27;cycle++)for(const day of days){
    const deck=buildCyclePresentation(`cycle-${cycle}`,{day});
    for(const match of deck.html.matchAll(/<section class="slide p-(?:sight|letter)-match"[\s\S]*?<\/section>/g)){
      const values=[...match[0].matchAll(/data-match-word="([^"]+)"/g)].map(item=>item[1]);
      assert.equal(values.length,8,`${cycle} ${day}: eight memory cards`);
      const counts=new Map();for(const value of values)counts.set(value,(counts.get(value)||0)+1);
      assert.ok([...counts.values()].every(count=>count%2===0),'Every card has a valid pair');
      if(match[0].includes('p-sight-match'))for(const value of values)assert.ok(presentationReviewContent(`cycle-${cycle}`,day).words.includes(value),'Memory uses only introduced sight words');
    }
  }
});

test('weekday memory layouts are distinct even when the same taught word bank is reused',()=>{
  for(const bank of [['am','I','am','I'],['he','she','is','on'],['a','the','a','it']]){
    for(let cycle=1;cycle<=27;cycle++){
      const layouts=days.map((_,i)=>shufflePresentationMemoryCards([...bank,...bank],`cycle-${cycle}:memory`,i).join('|'));
      assert.equal(new Set(layouts).size,5,`cycle ${cycle}: no fixed weekday word positions`);
    }
  }
  for(let cycle=2;cycle<=27;cycle++){
    const banks=days.map(day=>{const html=buildCyclePresentation(`cycle-${cycle}`,{day}).html;const section=/<section class="slide p-sight-match"[\s\S]*?<\/section>/.exec(html)[0];return [...section.matchAll(/data-match-word="([^"]+)"/g)].map(m=>m[1]);});
    assert.equal(new Set(banks.map(bank=>bank.join('|'))).size,5,`cycle ${cycle}: distinct daily boards`);
    if(cycle>=3)assert.ok(new Set(banks.map(bank=>[...new Set(bank)].sort().join('|'))).size>1,'Daily rounds also vary eligible word selections');
  }
});
