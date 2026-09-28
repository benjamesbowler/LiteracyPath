import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildCyclePresentation, PRESENTATION_DAYS, PRESENTATION_FORMATS } from '../../src/utils/present/presentationBuilder.js';
import { PRESENT_VOCABULARY } from '../../src/data/presentVocabulary.js';
import { getChildWordAsset } from '../../src/data/childAssets.js';
import { wordAudioPath } from '../../src/components/elQuest/elQuestEngine.js';

const days = PRESENTATION_DAYS.filter(d => d.value).map(d => d.value);
test('405 daily choices have honest budgets and substantive distinct content', () => {
  for (let n = 1; n <= 27; n++) for (const day of days) {
    const decks = Object.fromEntries(PRESENTATION_FORMATS.map(format => [format.value, buildCyclePresentation(`cycle-${n}`, {day, format: format.value})]));
    for (const format of PRESENTATION_FORMATS) {
      const deck = decks[format.value];
      assert.equal(deck.lessonPlan.minutes, format.minutes);
      assert.equal(deck.lessonPlan.blocks.reduce((sum,b) => sum + b.minutes,0), format.minutes);
      assert.equal((deck.html.match(/data-block-start="1"/g)||[]).length,5);
      assert.equal(deck.slideIndex.length,deck.slideCount);
      assert.ok(deck.slideIndex.every(s=>s.title && s.teacher && s.block));
      assert.doesNotMatch(deck.html,/data-teacher-note|p-foryou|poem|poetry/i);
      assert.equal(deck.html,buildCyclePresentation(`cycle-${n}`,{day,format:format.value}).html);
    }
    assert.ok(decks.extended.slideCount>decks.core.slideCount);
    assert.ok(decks.review.slideCount<decks.core.slideCount);
    assert.match(decks.extended.html,/data-build-target/);
    assert.match(decks.extended.html,/data-track-sentence/);
    assert.equal(decks.extended.slideIndex.filter(s=>s.cls==='p-vocabulary').length,2);
    assert.equal(decks.core.slideIndex.filter(s=>s.cls==='p-vocabulary').length,1);
    assert.ok(!decks.review.slideIndex.some(s=>s.cls==='p-writing'));
  }
});
test('all 54 oral language cards have meaningful complete teaching content and real media', () => {
  const words = new Set();
  for (let n = 1; n <= 27; n++) {
    assert.equal(PRESENT_VOCABULARY[n].length,2);
    for (const card of PRESENT_VOCABULARY[n]) {
      for (const key of ['word','meaning','prompt','model','stretch']) assert.ok(card[key]?.trim(),`${n} ${key}`);
      assert.notEqual(card.prompt,card.stretch);
      assert.ok(!words.has(card.word),`distinct vocabulary: ${card.word}`); words.add(card.word);
      for (const path of [getChildWordAsset(card.word)?.image,wordAudioPath(card.word)]) {
        assert.ok(path,`${card.word}: media mapped`); assert.ok(fs.existsSync(`public${path}`),`${card.word}: ${path}`);
      }
    }
  }
  assert.equal(words.size,54);
});
test('expanded reading respects the teaching day and excludes misleading short-vowel models',()=>{
  const targetWords=(cycle,day)=>[...buildCyclePresentation(cycle,{day,format:'extended'}).html.matchAll(/data-(?:blend|pattern)-word="([^"]+)"/g)].map(m=>m[1]);
  for(const word of targetWords('cycle-2','monday'))assert.ok([...word].every(c=>'amt'.includes(c)),word);
  for(const day of days)for(let n=1;n<=27;n++)for(const word of targetWords(`cycle-${n}`,day))assert.ok(!['wolf','lamb'].includes(word),`${n}: ${word}`);
  assert.ok(!targetWords('cycle-15','monday').some(w=>w.includes('ch')||w.includes('th')));
  assert.ok(!targetWords('cycle-15','tuesday').some(w=>w.includes('th')));
  assert.ok(targetWords('cycle-15','wednesday').some(w=>w.includes('th')));
  assert.ok(!targetWords('cycle-16','monday').some(w=>w.includes('all')));
  assert.match(buildCyclePresentation('cycle-16',{day:'tuesday',format:'extended'}).html,/data-pattern-word="(?:ball|fall|call)"/);
  for(const day of ['monday','tuesday'])assert.ok(!targetWords('cycle-23',day).some(w=>['song','hung'].includes(w)));
  const wh = buildCyclePresentation('cycle-21',{day:'monday'}).html.match(/<section class="slide p-letter-slide"[\s\S]*?<\/section>/)?.[0];
  assert.doesNotMatch(wh,/alt="who"/);
});
test('projected decks exclude private dictation guidance but retain it in teacher metadata',()=>{
  const deck=buildCyclePresentation('cycle-15',{day:'thursday',format:'extended',startIndex:8});
  const dictation=deck.slideIndex.find(s=>s.cls==='p-application');
  assert.match(dictation.teacher,/Say ship/);
  assert.ok(!deck.html.includes(dictation.teacher));
  assert.match(deck.html,/data-start-index="8"/);
  assert.match(buildCyclePresentation('cycle-2',{startIndex:-2}).html,/data-start-index="0"/);
  assert.throws(()=>buildCyclePresentation('cycle-2',{format:'longish'}),/Unknown presentation format/);
});
test('word changes wait for taught spelling and extended reading does not duplicate its slides',()=>{
  const monday=buildCyclePresentation('cycle-15',{day:'monday',format:'extended'});
  assert.ok(!monday.slideIndex.some(s=>s.cls==='p-word-change'));
  const tuesday=buildCyclePresentation('cycle-15',{day:'tuesday',format:'extended'});
  const change=tuesday.slideIndex.find(s=>s.cls==='p-word-change');
  assert.match(change.teacher,/Read ship, then say chip/);
  for(const day of days)for(let n=1;n<=27;n++){
    const deck=buildCyclePresentation(`cycle-${n}`,{day,format:'extended'});
    const reading=[...deck.html.matchAll(/data-(?:blend|pattern)-word="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(new Set(reading).size,reading.length,`${n} ${day}: repeated reading model`);
    for(const section of deck.html.matchAll(/<section class="slide p-word-change"[\s\S]*?<\/section>/g)){
      assert.equal((section[0].match(/class="p-tile p-changed-part"/g)||[]).length,1);
    }
  }
});
test('assessment and whole-cycle resource decks do not pretend to be timed lesson formats',()=>{
  for(const format of PRESENTATION_FORMATS){
    const assessment=buildCyclePresentation('boy-assessment',{day:'monday',format:format.value});
    assert.equal(assessment.lessonPlan,null); assert.equal(assessment.slideCount,3);
    assert.doesNotMatch(assessment.title,/Monday|25 min|Daily lesson/);
    assert.equal(buildCyclePresentation('cycle-5',{format:format.value}).lessonPlan,null);
  }
});
