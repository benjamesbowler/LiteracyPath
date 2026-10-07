import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildCyclePresentation, PRESENTATION_DAYS, PRESENTATION_FORMATS, presentationReviewContent } from '../../src/utils/present/presentationBuilder.js';
import { elSkillsBlockCycles } from '../../src/data/elSkillsBlockCycles.js';
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
    assert.equal(decks.extended.slideIndex.filter(s=>s.cls==='p-sentence-track').length,2);
    assert.equal(decks.extended.slideIndex.filter(s=>s.cls==='p-word-build').length,2);
    assert.equal(decks.core.slideIndex.filter(s=>s.cls==='p-vocabulary').length,1);
    for (const deck of Object.values(decks)) {
      assert.match(deck.html, /data-match-game/);
      assert.match(deck.html, /data-choice-target/);
      assert.match(deck.html, /data-build-target/);
      assert.match(deck.html, /data-track-sentence/);
      assert.doesNotMatch(deck.html, /Write the word you just read|Say the word\. Stretch it|Say it\. Write it\. Use it|Tell your partner|Show an example/);
    }
  }
});
test('all 54 picture-reading captions are short, complete and have real media', () => {
  const words = new Set();
  for (let n = 1; n <= 27; n++) {
    assert.equal(PRESENT_VOCABULARY[n].length,2);
    for (const card of PRESENT_VOCABULARY[n]) {
      assert.ok(card.word?.trim());
      assert.match(card.sentence, /^[A-Z].*[.!]$/);
      assert.ok(card.sentence.split(/\s+/).length <= 9);
      assert.ok(card.sentence.toLowerCase().includes(card.word));
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
test('projected spelling keeps teaching guidance private and preserves the requested starting slide',()=>{
  const deck=buildCyclePresentation('cycle-15',{day:'thursday',format:'extended',startIndex:8});
  const spelling=deck.slideIndex.find(s=>s.cls==='p-word-build');
  const parts=JSON.parse(deck.html.match(/data-build-target="([^"]+)"/)[1].replaceAll('&quot;','"'));
  assert.ok(spelling.teacher.startsWith(`Say ${parts.join('')}.`));
  assert.ok(!deck.html.includes(spelling.teacher));
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


test('every daily and whole-cycle deck reviews all prior words and spellings with no future-day letter', () => {
  const numbered = elSkillsBlockCycles.filter(c => c.cycleNumber);
  for (const cycle of numbered) for (const day of ['', ...days]) {
    const previous = numbered.filter(c => c.cycleNumber < cycle.cycleNumber);
    const expectedWords = [...new Set([...previous, cycle].flatMap(c => c.highFrequencyWords))];
    for (const format of PRESENTATION_FORMATS) {
      const deck = buildCyclePresentation(cycle.id, {day, format: format.value});
      const words = [...deck.html.matchAll(/data-review-word="([^"]+)"/g)].map(m => m[1]);
      assert.deepEqual(words, expectedWords, `${cycle.id} ${day} ${format.value}: every HFW`);
      const actualLetters = new Set([...deck.html.matchAll(/data-review-spelling="([^"]+)"/g)].map(m => m[1]));
      for (const c of previous) for (const card of c.focusLetters) {
        for (const spelling of card.spelling.split(/[\s/,+]+/).filter(s=>/^[a-z]{1,3}$/.test(s))) assert.ok(actualLetters.has(spelling), `${cycle.id}: missing prior ${spelling}`);
      }
      for (const card of cycle.focusLetters) {
        const introduced = !day || days.indexOf(card.day.toLowerCase()) <= days.indexOf(day);
        for (const spelling of card.spelling.split(/[\s/,+]+/).filter(s=>/^[a-z]{1,3}$/.test(s))) {
          if (introduced) {
            assert.ok(actualLetters.has(spelling));
            const text = spelling.length === 1 ? spelling.toUpperCase() + spelling : spelling;
            assert.ok(deck.html.includes(`aria-label="Finger trace ${text}"`), `${cycle.id} ${day}: trace ${text}`);
          } else if (!previous.some(c => c.focusLetters.some(x => x.spelling === spelling))) assert.ok(!actualLetters.has(spelling));
        }
      }
      assert.deepEqual(presentationReviewContent(cycle.id,day).words, expectedWords);
      assert.doesNotMatch(deck.html, /(?:data-match-word|data-choice-value|src)="undefined"/);
      for (const game of deck.html.matchAll(/<div class="p-picture-game" data-choice-target="([^"]+)"[\s\S]*?<p class="p-game-feedback"/g)) {
        const choices = [...game[0].matchAll(/data-choice-value="([^"]+)"/g)].map(m=>m[1]);
        assert.equal(choices.length,3); assert.equal(new Set(choices).size,3); assert.ok(choices.includes(game[1]));
      }
    }
  }
});

test('all image and audio references in every daily deck exist; CVC targets use introduced code', () => {
  for (let n=1;n<=27;n++) for (const day of days) {
    const deck = buildCyclePresentation(`cycle-${n}`,{day,format:'extended'});
    const taught = new Set(presentationReviewContent(`cycle-${n}`,day).cards.map(c=>c.spelling));
    for (const path of [...deck.html.matchAll(/(?:src|data-play)="(\/[^"?#]+)"/g)].map(m=>m[1])) assert.ok(fs.existsSync(`public${path}`), `${n} ${day}: ${path}`);
    for (const game of deck.html.matchAll(/<section class="slide p-word-build"[^>]*data-spelling-kind="cvc"[\s\S]*?<\/section>/g)) {
      const parts = JSON.parse(game[0].match(/data-build-target="([^"]+)"/)[1].replaceAll('&quot;','"'));
      assert.equal(parts.length,3); for (const part of parts) assert.ok(taught.has(part));
      assert.match(game[0],/class="p-spelling-picture"/);
      assert.doesNotMatch(game[0],new RegExp(`>${parts.join('')}<`),'spelling target is not printed for copying');
    }
  }
  assert.match(buildCyclePresentation('cycle-2',{day:'monday'}).html,/data-spelling-kind="cvc"/);
});


test('an ambiguous thickness image is excluded from picture cues while its word remains in decoding', () => {
  const deck=buildCyclePresentation('cycle-15',{day:'wednesday',format:'extended'});
  assert.match(deck.html,/data-pattern-word="thin"/);
  assert.doesNotMatch(deck.html,/<img[^>]*alt="thin"/);
  for(const gallery of deck.html.matchAll(/<button class="p-picture-card"[\s\S]*?<\/button>/g))assert.doesNotMatch(gallery[0],/<span>thin<\/span>/);
});
