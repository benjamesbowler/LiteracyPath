import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { elSkillsBlockCycles } from '../../src/data/elSkillsBlockCycles.js';
import { worldForCycle } from '../../src/utils/palWorlds.js';
import { bookCharacterAsset } from '../../src/components/quest/bookCharacterAvatar.js';
import {
  presentationCycleOptions, presentationCycleDisplayTitle, presentationCycleSummary,
  buildCyclePresentation, presentationSlideIndex, presentationDayPlan,
  presentationReviewContent, PRESENTATION_DAYS, PRESENTATION_SECTIONS
} from '../../src/utils/present/presentationBuilder.js';

const cycles=elSkillsBlockCycles.filter(c=>c.cycleNumber);
const days=PRESENTATION_DAYS.map(d=>d.value);
const letterSlideFor=(html,letter)=>new RegExp(`class="p-letter"[^>]*>${letter}</span>`).test(html);
const focusSpellings=cycle=>(cycle.focusLetters||[]).flatMap(card=>String(card.spelling||'').toLowerCase().split(/[\s/,+]+/).filter(part=>/^[a-z]{1,3}$/.test(part)));

test('cycle catalogue retains 27 teaching cycles and separate assessment routines',()=>{
  const options=presentationCycleOptions();assert.equal(options.filter(o=>o.cycleNumber).length,27);
  assert.deepEqual(options.filter(o=>o.type==='assessment').map(o=>o.label),['Beginning of year assessment','Middle of year assessment','End of year assessment']);
  assert.ok(options.every(o=>o.id&&o.title&&o.label));assert.ok(options.every(o=>!/\b(?:BOY|MOY|EOY)\b/.test(o.label)));
});

test('assessment titles remain readable and assessment weeks never become daily teaching plans',()=>{
  for(const id of ['boy-assessment','moy-assessment','eoy-assessment']){
    const cycle=elSkillsBlockCycles.find(c=>c.id===id),deck=buildCyclePresentation(id);
    assert.match(presentationCycleDisplayTitle(cycle),/year assessment$/);assert.doesNotMatch(deck.title+'\n'+deck.html,/\b(?:BOY|MOY|EOY)\b/);
    assert.ok(deck.slideCount>=3);assert.match(deck.html,/class="slide p-routines-slide"/);assert.equal(deck.lessonPlan,null);
    assert.equal(presentationDayPlan(id,'friday'),null);
  }
});

test('the default opens Monday and all 135 choices are complete daily documents',()=>{
  assert.deepEqual(days,['monday','tuesday','wednesday','thursday','friday']);
  assert.equal(buildCyclePresentation('cycle-2').html,buildCyclePresentation('cycle-2',{day:'monday'}).html);
  for(const cycle of cycles)for(const day of days){
    const deck=buildCyclePresentation(cycle.id,{day});assert.ok(deck.html.startsWith('<!doctype html>'));
    assert.ok(deck.slideCount>=8);assert.equal((deck.html.match(/<section class="slide /g)||[]).length,deck.slideCount);
    assert.equal(deck.lessonPlan.minimumMinutes,day==='friday'?30:15);assert.equal(deck.lessonPlan.maximumMinutes,day==='friday'?30:20);
    assert.equal(deck.lessonPlan.blocks.length,5);assert.equal(deck.lessonPlan.blocks.reduce((sum,b)=>sum+b.minutes,0),day==='friday'?30:20);
    assert.equal(deck.manifest.timing.observedMinutes,null);
    assert.match(deck.html,/class="slide p-(?:picture-match|cooperative-sort)"/);
    assert.ok(deck.slideIndex.some(s=>["p-sentence-detective","p-sentence-scramble","p-whats-missing"].includes(s.cls)));
    // The first Monday has no earlier learning and no decodable word yet;
    // later days retain every applicable planning block.
    const blockIds=new Set(deck.slideIndex.map(s=>s.block));
    for(const id of ['teach','games','reading'])assert.ok(blockIds.has(id));
    if(cycle.cycleNumber>1)assert.equal(blockIds.size,5);
  }
});

test('every new grapheme is introduced once across Monday and Tuesday, including grouped patterns',()=>{
  for(const cycle of cycles){
    const monday=buildCyclePresentation(cycle.id,{day:'monday'}),tuesday=buildCyclePresentation(cycle.id,{day:'tuesday'});
    const sounds=deck=>deck.manifest.slides.filter(s=>s.construct==='grapheme-phoneme').map(s=>s.target);
    const expected=focusSpellings(cycle);assert.deepEqual([...sounds(monday),...sounds(tuesday)],expected,cycle.id);
    assert.equal(sounds(monday).length,Math.min(1,expected.length));
    for(const day of ['wednesday','thursday','friday'])assert.ok(buildCyclePresentation(cycle.id,{day}).manifest.slides.every(s=>s.construct!=='grapheme-phoneme'));
    for(const deck of [monday,tuesday])for(const sound of sounds(deck)){
      const forms=deck.manifest.slides.filter(s=>s.construct==='letter-formation'&&s.target.toLowerCase()===sound);
      assert.deepEqual(forms.map(s=>s.letterCase),['upper','lower'],`${cycle.id} ${sound}`);
    }
  }
  const patterns=buildCyclePresentation('cycle-23',{day:'tuesday'}).html;
  for(const value of ['ang','ing','ong','ung'])assert.ok(letterSlideFor(patterns,value));
});

test('wide uppercase/lowercase sound glyphs fit their circle',()=>{
  const sizeFor=(html,glyph)=>Number(new RegExp(`font-size:(\\d+)px">${glyph}</span>`).exec(html)?.[1]||0);
  const narrow=sizeFor(buildCyclePresentation('cycle-8',{day:'monday'}).html,'Bb');
  const wide=sizeFor(buildCyclePresentation('cycle-8',{day:'tuesday'}).html,'Ww');
  assert.ok(wide>0&&narrow>0);assert.ok(wide<narrow);
});

test('doubled spellings wait for their actual introduction instead of passing as consonant clusters',()=>{
 const monday=buildCyclePresentation('cycle-24',{day:'monday'});
 const printed=monday.manifest.slides.filter(item=>['decoding','encoding'].includes(item.construct)).map(item=>item.target);
 assert.ok(printed.includes('puff'));
 assert.ok(printed.every(word=>!['miss','buzz','will'].includes(word)),printed.join(', '));
 const tuesday=buildCyclePresentation('cycle-24',{day:'tuesday'});
 assert.ok(tuesday.manifest.slides.some(item=>item.construct==='decoding'&&['miss','buzz','will'].includes(item.target)));
});

test('review cycles retrieve real spellings one at a time without reteaching doubled letters',()=>{
  for(const id of ['cycle-7','cycle-14']){
    const deck=buildCyclePresentation(id);assert.ok(deck.slideIndex.some(s=>s.cls==='p-letter-review'));
    assert.ok(deck.slideIndex.every(s=>s.cls!=='p-letter-slide'));
    assert.doesNotMatch(deck.html,/>aa<|class="slide p-sound-review"/);
    assert.ok(deck.manifest.slides.find(s=>s.target==='Earlier sounds').reviewItems.length>0);
  }
});

test('all sight words are introduced on Wednesday and Thursday with authored case intact',()=>{
  for(const cycle of cycles){
    const targets=[];
    for(const day of days){
      const deck=buildCyclePresentation(cycle.id,{day});const words=deck.manifest.slides.filter(s=>s.construct==='high-frequency-word').map(s=>s.target);
      if(day==='wednesday'||day==='thursday')targets.push(...words);else assert.deepEqual(words,[]);
    }
    assert.deepEqual(targets,cycle.highFrequencyWords);
  }
  assert.match(buildCyclePresentation('cycle-1',{day:'thursday'}).html,/class="p-sight p-memory-model">I</);
});

test('blending and pattern reading respect the actual introduction day',()=>{
  for(const cycle of cycles)for(const day of days){
    const deck=buildCyclePresentation(cycle.id,{day});
    const taught=new Set(presentationReviewContent(cycle.id,day).cards.map(c=>c.spelling));
    for(const match of deck.html.matchAll(/data-blend-word="([a-z]+)"/g))assert.ok([...match[1]].every(letter=>taught.has(letter)),`${cycle.id} ${day} ${match[1]}`);
    for(const item of deck.manifest.slides.filter(s=>s.construct==='decoding'))for(const part of item.parts||[]){
      assert.ok(taught.has(part.text)||(/^[bcdfghjklmnpqrstvwxyz]+$/.test(part.text)&&[...part.text].every(letter=>taught.has(letter))),`${cycle.id} ${day} ${part.text}`);
    }
  }
});

test('spelling targets vary across cycles and remain hidden while children build',()=>{
  const targets=[];
  for(const cycle of cycles){
    const deck=buildCyclePresentation(cycle.id,{day:'thursday'});
    targets.push(deck.manifest.slides.filter(s=>s.construct==='encoding').map(s=>s.target).join(','));
    for(const match of deck.html.matchAll(/<section class="slide p-word-build"[\s\S]*?<\/section>/g)){
      const parts=JSON.parse(/data-build-target="([^"]+)"/.exec(match[0])[1].replaceAll('&quot;','"'));
      assert.ok(parts.length>=2);assert.ok(!match[0].includes(`>${parts.join('')}<`));assert.match(match[0],/data-build-check/);assert.match(match[0],/data-build-undo/);
    }
  }
  assert.ok(new Set(targets).size>=20);
});

test('every generated character uses its own world source and an existing canonical pose',()=>{
  const bodies={meadow:'tuft',dino:'pebble',moonwood:'moth'};
  for(const cycle of [...cycles,...elSkillsBlockCycles.filter(c=>c.type==='assessment')]){
    const html=buildCyclePresentation(cycle.id,{day:'monday'}).html;
    const preceding=elSkillsBlockCycles.slice(0,elSkillsBlockCycles.indexOf(cycle)).filter(c=>c.cycleNumber).at(-1);
    const world=worldForCycle(cycle.cycleNumber||preceding?.cycleNumber||1);
    const poses=[...html.matchAll(/class="p-pal [^"]*" src="([^"]+)"/g)].map(m=>m[1]);
    assert.ok(poses.length>0,cycle.id);
    for(const src of poses){assert.ok(src.startsWith(path.posix.dirname(bookCharacterAsset({body:bodies[world.id]}))+'/'));assert.ok(fs.existsSync(path.join('public',src)));}
    assert.doesNotMatch(html,/\/images\/pals\/poses\//);
    for(const token of ['--bg: #F7F8FA','--ink: #18263E','--surface: #FFFFFF','--accent: #3454C8','--ink-muted: #5C677A'])assert.ok(html.includes(token));
    assert.doesNotMatch(html,/#f5ead8|#fff8ef|#713b18|#5d3013/i);
  }
});

test('the slide index mirrors the exact assembly and current section vocabulary',()=>{
  for(const id of ['cycle-2','cycle-15','cycle-26','boy-assessment'])for(const day of days){
    const deck=buildCyclePresentation(id,{day});const index=presentationSlideIndex(id,{day});assert.equal(index.length,deck.slideCount);
    index.forEach((entry,i)=>{assert.equal(entry.index,i);assert.ok(entry.cls);assert.ok(entry.section===''||PRESENTATION_SECTIONS.includes(entry.section));});
  }
});

test('busy teaching options and obsolete slide types are absent from the projected lesson',()=>{
  const retired=new Set(['p-word-chain','p-word-change','p-together','p-books','p-goals','p-sound-review']);
  for(const cycle of cycles)for(const day of days){
    const deck=buildCyclePresentation(cycle.id,{day});assert.ok(deck.slideIndex.every(s=>!retired.has(s.cls)));
    assert.doesNotMatch(deck.html,/data-chain-|data-teaching-stage|teaching-sequence|data-build-mode|data-build-model/);
  }
});

test('the selected day has the requested first/second letter and daily review games',()=>{
  const monday=buildCyclePresentation('cycle-4',{day:'monday'}),tuesday=buildCyclePresentation('cycle-4',{day:'tuesday'});
  assert.ok(letterSlideFor(monday.html,'Ff'));assert.ok(!letterSlideFor(monday.html,'Dd'));
  assert.ok(letterSlideFor(tuesday.html,'Dd'));assert.ok(!letterSlideFor(tuesday.html,'Ff'));
  for(const day of ['wednesday','thursday']){const deck=buildCyclePresentation('cycle-4',{day});assert.ok(deck.slideIndex.some(s=>s.cls==='p-sight-slide'));assert.ok(deck.slideIndex.some(s=>s.cls==='p-blend'));}
});

test('Friday is a weekly round-up with more games and no new targets',()=>{
  for(const cycle of cycles){
    const friday=buildCyclePresentation(cycle.id,{day:'friday'}),thursday=buildCyclePresentation(cycle.id,{day:'thursday'});
    const games=deck=>deck.slideIndex.filter(s=>['p-sight-match','p-letter-match','p-word-build','p-picture-match','p-cooperative-sort','p-sentence-detective','p-sentence-scramble','p-whats-missing'].includes(s.cls)).length;
    assert.ok(games(friday)>games(thursday));assert.deepEqual(friday.lessonPlan.newWords,[]);assert.deepEqual(friday.lessonPlan.newGraphemes,[]);
    const roundup=friday.manifest.slides.find(s=>s.construct==='weekly-retrieval');
    for(const word of cycle.highFrequencyWords)assert.ok(roundup.reviewItems.some(i=>i.target===word));
    for(const spelling of focusSpellings(cycle))assert.ok(roundup.reviewItems.some(i=>i.target===spelling));
  }
});

test('late cycles retain their taught pattern words without the retired word-chain activity',()=>{
  for(const [number,word] of [[15,'ship'],[16,'ball'],[21,'when'],[22,'sink'],[23,'bang'],[24,'will']]){
    const weekly=days.map(day=>buildCyclePresentation(`cycle-${number}`,{day}).html).join('\n');assert.ok(weekly.includes(`data-pattern-word="${word}"`));
  }
  for(const number of [25,26,27]){
    const deck=buildCyclePresentation(`cycle-${number}`,{day:'thursday'});assert.ok(deck.slideIndex.every(s=>s.cls!=='p-letter-slide'));
    assert.ok(deck.manifest.slides.some(s=>s.construct==='encoding'));assert.ok(deck.slideIndex.some(s=>s.cls==='p-sentence-track'));
  }
});

test('decks are deterministic, world isolated, emoji free and use offline teaching fonts',()=>{
  const before=buildCyclePresentation('cycle-2').html;buildCyclePresentation('cycle-20');assert.equal(buildCyclePresentation('cycle-2').html,before);
  for(const id of ['cycle-2','cycle-15','cycle-25','boy-assessment']){
    const html=buildCyclePresentation(id).html;assert.doesNotMatch(html,/[\u{1F000}-\u{1FAFF}]|\u{FE0F}/u);
    assert.match(html,/\/fonts\/present\/andika-latin-700-normal.woff2/);assert.match(html,/'Arial Rounded MT Bold'/);assert.doesNotMatch(html,/fonts\.googleapis\.com|fonts\.gstatic\.com/);
  }
});

test('unknown choices fail clearly and the cycle summary comes from current teaching data',()=>{
  assert.throws(()=>buildCyclePresentation('nope'));assert.throws(()=>buildCyclePresentation('cycle-2',{day:'someday'}),/Unknown presentation day/);
  const summary=presentationCycleSummary('cycle-4');assert.match(summary,/Cycle 4/);assert.match(summary,/Ff/);assert.match(summary,/Dd/);assert.match(summary,/2 sight words/);assert.doesNotMatch(summary,/poem|poetry/i);
});
