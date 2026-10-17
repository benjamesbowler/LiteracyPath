import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {buildCyclePresentation, buildPresentationCoverageDashboard, shufflePresentationChoices} from '../../src/utils/present/presentationBuilder.js';
import {dailyPresentReading, presentGameSchedule} from '../../src/data/presentDailyReading.js';
const days=['monday','tuesday','wednesday','thursday','friday'];

test('all 135 daily lessons resolve every required recording and picture',()=>{
 for(let n=1;n<=27;n++)for(const day of days){
  const deck=buildCyclePresentation(`cycle-${n}`,{day});
  for(const slide of deck.manifest.slides){
   for(const media of slide.media.filter(item=>item.required))assert.ok(media.src&&fs.existsSync(`public${media.src}`),`${n} ${day}: ${media.transcript}`);
   for(const image of slide.media.filter(item=>item.type==='image'))assert.ok(fs.existsSync(`public${image.src}`),image.src);
  }
  const reading=deck.manifest.slides.filter(item=>item.construct==='supported-shared-reading');
  assert.equal(reading.length,2);
  assert.deepEqual(reading.map(item=>item.target),dailyPresentReading(n,day).map(item=>item.sentence));
  for(const item of reading){
   assert.equal(item.readingPurpose,'supported-shared-reading');
   assert.equal(item.childReadingClaim,false);
   assert.equal(item.requiredAudio[0].transcript,item.target);
  }
  const sorts=deck.manifest.slides.filter(item=>item.sort);
  assert.equal(sorts.length,['tuesday','thursday'].includes(day)?1:0);
  for(const sort of sorts){
   assert.equal(sort.construct,'initial-phoneme');
   assert.equal(sort.sort.headings.length,2);assert.ok(sort.sort.items.length>=2);
   assert.ok(sort.sort.items.every(item=>[0,1].includes(item.group)));
  }
 }
});

test('daily lessons use the selected whole-class game schedule and retire repeated cat and seed activities',()=>{
 const classes={detective:'p-sentence-detective',scramble:'p-sentence-scramble',missing:'p-whats-missing',pairs:'p-sight-match'};
 for(let n=1;n<=27;n++)for(const day of days){
  const deck=buildCyclePresentation(`cycle-${n}`,{day});
  for(const [game,cls] of Object.entries(classes))assert.equal(deck.slideIndex.filter(item=>item.cls===cls).length,presentGameSchedule(n,day).includes(game)?1:0,`${n} ${day}: ${game}`);
  assert.ok(!deck.slideIndex.some(item=>['p-sentence-studio','p-retell-story','p-robot','p-read-act'].includes(item.cls)));
  assert.doesNotMatch(deck.html,/<(?:button|div)[^>]*\sdata-(?:studio-change|story-next|retell-game)(?:[=>\s])/);
  if(day==='friday'){
   assert.equal(deck.slideIndex.filter(item=>item.cls==='p-word-build').length,2);
   assert.equal(deck.slideIndex.filter(item=>item.cls==='p-picture-match').length,1);
  }
 }
});

test('each presentation opens with the full taught letter recap and meaningful recorded picture anchors',()=>{
 for(let n=1;n<=27;n++)for(const day of days){
  const deck=buildCyclePresentation(`cycle-${n}`,{day}),recap=deck.manifest.slides.find(item=>item.target==='Earlier sounds');
  if(!recap)continue;
  assert.equal(recap.index,0,'The cumulative recap opens the presentation');
  assert.equal(deck.slideIndex.filter(item=>item.cls==='p-letter-review').length,1);
  for(const card of recap.reviewItems){
   if(card.target.length===1||card.target==='qu')assert.ok(card.imagePath&&card.anchorAudio,`${n} ${day}: ${card.target}`);
   if(card.imagePath){assert.ok(recap.media.some(item=>item.src===card.imagePath&&item.required&&item.meaning===card.anchorWord));assert.ok(fs.existsSync(`public${card.imagePath}`));}
   if(card.anchorAudio)assert.ok(recap.audioRoles.some(item=>item.src===card.anchorAudio&&item.transcript===card.anchorWord));
  }
 }
 const cards=buildCyclePresentation('cycle-9').manifest.slides[0].reviewItems;
 assert.equal(cards.find(card=>card.target==='a').anchorWord,'apple');
 assert.equal(cards.find(card=>card.target==='t').anchorWord,'turtle');
 assert.equal(cards.find(card=>card.target==='x'),undefined,'Do not add a future letter to fill the recap');
});

test('th review offers its voiced and unvoiced recordings, with truthful child-reading support',()=>{
 const early=buildCyclePresentation('cycle-1',{day:'monday'}).manifest.slides.find(item=>item.construct==='supported-shared-reading');
 assert.equal(early.readingPurpose,'supported-shared-reading');
 const late=buildCyclePresentation('cycle-19',{day:'thursday'});
 assert.equal(late.manifest.slides.find(item=>item.construct==='supported-shared-reading').readingPurpose,'supported-shared-reading');
 for(const value of ['th-voiced','th-unvoiced'])assert.match(late.html,new RegExp(`data-sound-variant="${value}"`));
 assert.ok(late.manifest.slides.every(item=>item.media.filter(media=>media.required).every(media=>media.src)));
});

test('coverage dashboard counts the one daily format across all 135 choices',()=>{
 const dashboard=buildPresentationCoverageDashboard();assert.equal(dashboard.choiceCount,135);
 for(const row of dashboard.rows)assert.equal(row.format,'core');
});

test('choice shuffle is deterministic and varies across lesson seeds',()=>{
 const items=['a','b','c','d'];assert.deepEqual(shufflePresentationChoices(items,'same'),shufflePresentationChoices(items,'same'));
 assert.ok(new Set(Array.from({length:30},(_,i)=>shufflePresentationChoices(items,`lesson-${i}`).join(''))).size>12);
});

function audioHarness(){
  const instances=[],timers=new Map();let serial=0;
  class FakeAudio{
    constructor(src){this.src=src;this.duration=2;this.currentTime=0;this.listeners=new Map();this.plays=0;instances.push(this);}
    addEventListener(name,fn){this.listeners.set(name,fn);}
    removeEventListener(name,fn){if(this.listeners.get(name)===fn)this.listeners.delete(name);}
    play(){this.plays++;this.emit('playing');return Promise.resolve();}
    pause(){}
    emit(name){this.listeners.get(name)?.();}
  }
  const context={Audio:FakeAudio,setTimeout(fn,ms){const id=++serial;timers.set(id,{fn,ms});return id;},clearTimeout(id){timers.delete(id);}};
  vm.createContext(context);vm.runInContext(fs.readFileSync('public/present/audio.js','utf8'),context);
  return {controller:context.createPresentAudioController(),instances,timers};
}
test('audio owner cancels superseded requests and stale end events cannot settle a new voice',async()=>{
  const h=audioHarness();const first=h.controller.play('/one.mp3'),old=h.instances[0];
  const second=h.controller.play('/two.mp3');assert.equal((await first).status,'cancelled');
  old.emit('ended');assert.equal(h.controller.getState().active,true);
  h.instances[1].emit('ended');assert.equal((await second).status,'ended');
  assert.equal(h.timers.size,0);
});
test('audio pause preserves delivery until deliberate resume; errors and watchdogs report failed delivery',async()=>{
  const h=audioHarness();const request=h.controller.play('/one.mp3');
  h.instances[0].currentTime=1;h.controller.pause();assert.equal(h.timers.size,0);assert.equal(h.controller.getState().paused,true);
  h.controller.resume();assert.equal(h.instances[0].plays,2);assert.equal(h.instances[0].currentTime,1);
  h.instances[0].emit('error');assert.equal((await request).status,'unavailable');
  const hung=h.controller.play('/hung.mp3');[...h.timers.values()][0].fn();assert.equal((await hung).status,'interrupted');
  assert.equal((await h.controller.play('')).status,'unavailable');
});

test('available speech can be muted without falsely reporting missing media',async()=>{const h=audioHarness();h.controller.setSpeechEnabled(false);assert.equal((await h.controller.play('/available.mp3')).status,'muted');assert.equal(h.instances.length,0);assert.equal((await h.controller.play('')).status,'unavailable');});
