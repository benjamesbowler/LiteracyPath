import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { buildCyclePresentation, buildPresentationManifest, buildPresentationPrintHtml, buildPresentationCoverageDashboard, shufflePresentationChoices, presentationReviewContent } from '../../src/utils/present/presentationBuilder.js';

const days=['monday','tuesday','wednesday','thursday','friday'];
test('all405 choices expose correct oral units, explicit media states, both th values and real response routines',()=>{
  const oddPositions=new Set(),targetPositions=new Set();
  for(let n=1;n<=27;n++)for(const day of days)for(const format of ['core','extended','review']){
    const deck=buildCyclePresentation(`cycle-${n}`,{day,format});
    assert.doesNotMatch(deck.html,/data-play=""|data-teacher-(?:note|record)/);
    assert.doesNotMatch(deck.html,/<(?:span|div)[^>]*data-play=/);
    const review=presentationReviewContent(`cycle-${n}`,day);
    if(review.cards.some(card=>card.spelling==='th'))for(const variant of ['th-voiced','th-unvoiced'])assert.match(deck.html,new RegExp(`data-sound-variant="${variant}"`));
    for(const item of deck.manifest.slides){
      assert.ok(item.responseCue && item.teacher.model);
      for(const media of item.media.filter(record=>record.required&&record.type==='audio')){
        assert.ok(media.src,`${deck.manifest.deckKey}: required recording absent for ${media.transcript}`);
        assert.ok(fs.existsSync(`public${media.src}`),`${deck.manifest.deckKey}: required recording file absent for ${media.transcript}`);
      }
      if(item.oral){
        const oral=item.oral;
        assert.equal(oral.removedUnitIndices.length,1);
        if(oral.spokenUnits.length===3)assert.equal(oral.expectedSpokenResult,oral.removedUnitIndices[0]===0?oral.firstResult:oral.lastResult);
      }
    }
    assert.ok(deck.manifest.slides.some(item=>item.construct==='vocabulary-meaning'));
    assert.ok(deck.manifest.slides.some(item=>item.construct==='oral-narrative'));
    assert.ok(deck.manifest.slides.some(item=>item.construct.includes('reading')));
    assert.match(deck.html,/data-retell-check|data-sort-bin|data-cooperate-choice/);
    for(const game of deck.html.matchAll(/<div class="p-rhyme">([\s\S]*?)<\/div>\s*<button class="p-reveal/g)){
      const labels=[...game[1].matchAll(/<span class="p-answer [^"]+">([^<]+)</g)].map(match=>match[1]);
      oddPositions.add(labels.indexOf('odd one out'));
    }
    for(const spelling of deck.html.matchAll(/<div class="p-build" data-build-target="([^"]+)"[\s\S]*?<div class="p-build-bank"[^>]*>([\s\S]*?)<\/div>/g)){
      const parts=JSON.parse(spelling[1].replaceAll('&quot;','"'));
      const bank=[...spelling[2].matchAll(/data-build-part="([^"]+)"/g)].map(match=>match[1]);
      targetPositions.add(bank.indexOf(parts[0]));
      assert.equal(bank.filter(part=>parts.includes(part)).length,parts.length);
    }
  }
  assert.deepEqual([...oddPositions].sort(),[0,1,2]);
  assert.ok(targetPositions.size>=3,'No fixed first spelling position');
});
test('full review stays default and explicitly focused review retains an accurate omitted ledger',()=>{
  const full=buildPresentationManifest('cycle-27',{day:'friday',format:'review'});
  assert.equal(full.reviewCoverage.mode,'full-cumulative');
  assert.deepEqual(full.reviewCoverage.omitted,{graphemes:[],words:[]});
  assert.ok(full.timing.estimatedMinutes>full.timing.budgetMinutes);
  assert.equal(full.timing.observedMinutes,null);
  const focused=buildPresentationManifest('cycle-27',{day:'friday',reviewPolicy:{mode:'focused-review',graphemes:['th'],words:['said']}});
  assert.deepEqual(focused.reviewCoverage.included,{graphemes:['th'],words:['said']});
  assert.ok(focused.reviewCoverage.omitted.graphemes.includes('a'));
  assert.ok(focused.reviewCoverage.omitted.words.includes('I'));
});
test('sentence transformations state support before code is taught; late child reading has hidden scenes and exact required roles',()=>{
  const early=buildPresentationManifest('cycle-1',{day:'monday'});
  const shared=early.slides.find(item=>item.construct==='supported-shared-reading-change');
  assert.ok(shared);assert.equal(shared.readingPurpose,'read-together');
  const late=buildPresentationManifest('cycle-19',{day:'thursday'});
  const child=late.slides.find(item=>item.construct==='code-controlled-child-reading');
  assert.ok(child);assert.equal(child.requiredAudio.length,2);
  for(const role of child.requiredAudio)assert.equal(role.required,true);
  for(const scene of child.sentences){const media=child.media.find(item=>item.src===scene.imagePath);assert.equal(media.role,'proposition-scene');assert.equal(media.meaning,scene.sentence);assert.equal(media.sceneRequirements,scene.sceneRequirements);assert.match(media.sourceAuthority,/sentence-studio\/manifest/);}
  assert.deepEqual(child.media.filter(role=>role.role==='sentence').map(role=>role.transcript).sort(),['A cat ran.','A cat sat.']);
  const story=early.slides.find(item=>item.construct==='oral-narrative');
  assert.equal(story.story.events.length,3);assert.equal(story.requiredAudio.length,3);assert.deepEqual(story.media.filter(role=>role.role==='story-event').map(role=>role.transcript).sort(),story.story.events.map(event=>event.text).sort());
  assert.equal(new Set(story.story.events.map(event=>event.imagePath)).size,3);
  for(const path of story.story.events.map(event=>event.imagePath))assert.ok(fs.existsSync(`public${path}`));
});
test('print materials use the exact selected shuffled tiles and keep spelling models in the teacher portion',()=>{
  const options={day:'wednesday',format:'extended'};
  const manifest=buildPresentationManifest('cycle-15',options),html=buildPresentationPrintHtml('cycle-15',options);
  const pages=html.split('<section class="teacher">')[0];
  for(const item of manifest.print){
    assert.match(pages,new RegExp(`data-activity-id="${item.id}"`));
    for(const tile of item.tileBank)assert.ok(pages.includes(`<span>${tile}</span>`));
  }
  assert.match(html,/Teacher key and preparation/);
  assert.match(html,/Model: ship|Model: chip/);
});
test('curriculum dashboard counts actual generated choices and oral weighting, not a label-only coverage claim',()=>{
  const dashboard=buildPresentationCoverageDashboard();
  assert.equal(dashboard.choiceCount,405);
  for(const row of dashboard.rows){for(const target of [...row.teachingOccurrences.graphemes,...row.teachingOccurrences.highFrequencyWords]){assert.ok(target.count>0,`${row.cycleId} ${row.day} ${row.format} missing ${target.target}`);assert.equal(target.count,target.occurrences.length);assert.ok(target.occurrences.every(item=>item.slideId.startsWith(`${row.cycleId}:${row.day}:${row.format}:`)));}assert.ok(row.languageObjectives.some(item=>item.construct==='vocabulary-meaning'));for(const objective of row.languageObjectives){assert.ok(objective.target);assert.equal(objective.count,objective.occurrences.length);}}
  for(const n of [1,15,27]){
    const rows=dashboard.rows.filter(row=>row.cycleId===`cycle-${n}`&&row.format==='core');
    assert.equal(rows.length,5);
    for(const row of rows)assert.ok(row.oral.every(item=>item.count===1));
  }
});
test('choice shuffle is a seeded permutation and retries can reproduce it without a fixed traversal',()=>{
  const items=['a','b','c','d'];
  assert.deepEqual(shufflePresentationChoices(items,'lesson-1'),shufflePresentationChoices(items,'lesson-1'));
  const arrangements=new Set(Array.from({length:30},(_,i)=>shufflePresentationChoices(items,`lesson-${i}`).join('')));
  assert.ok(arrangements.size>12);
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

test('under vocabulary contrast uses the same cat/table and a different no-label fresh dog scene in screen, manifest and print',()=>{const options={day:'tuesday',format:'core'},deck=buildCyclePresentation('cycle-19',options),activity=deck.manifest.slides.find(item=>item.vocabularyScenes?.length===3);assert.ok(activity);assert.equal(activity.target,'under');assert.deepEqual(activity.vocabularyScenes.slice(0,2).map(scene=>scene.id).sort(),['on','under']);assert.equal(activity.freshScene.id,'dog-under');for(const scene of activity.vocabularyScenes){assert.ok(fs.existsSync(`public${scene.imagePath}`));const media=activity.media.find(item=>item.src===scene.imagePath);assert.equal(media.meaning,scene.meaning);assert.equal(media.role,'proposition-scene');assert.ok(media.sourceAuthority);}assert.match(deck.html,/data-vocabulary-compare-reveal hidden disabled/);assert.match(deck.html,/aria-label="Scene [12]"/);assert.doesNotMatch(deck.html,/aria-label="(?:under|on)"/);const print=buildPresentationPrintHtml('cycle-19',options).split('<section class="teacher">')[0];for(const scene of activity.vocabularyScenes)assert.ok(print.includes(scene.imagePath));assert.match(print,/Use the dog scene later with the model hidden/);});
