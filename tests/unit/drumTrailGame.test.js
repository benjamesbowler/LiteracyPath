import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { DRUM_TRAIL_WORDS } from '../../src/data/drumTrailContent.js';
import { buildDrumTrailRounds, commitDrumTrailAnswer, drumTrailActor, drumTrailFeedback, newDrumTrailEvidence } from '../../src/utils/drumTrailRules.js';
import { loadDrumTrailSession, saveDrumTrailSession } from '../../src/utils/drumTrailSession.js';
import { createDrumTrailVoice } from '../../src/utils/drumTrailVoice.js';

test('Drum bank has substantial authored, unambiguous oral content and actual production media', () => {
  assert.equal(DRUM_TRAIL_WORDS.length, 72);
  assert.equal(new Set(DRUM_TRAIL_WORDS.map(row => row.word)).size, 72);
  for (const row of DRUM_TRAIL_WORDS) {
    assert.equal(row.syllables, row.parts.length);
    assert.ok(row.parts.every(part => part.length > 0));
    assert.ok(fs.existsSync(`public${row.image}`), row.word + ' image');
    assert.ok(fs.existsSync(`public${row.audio}`), row.word + ' audio');
    assert.match(row.audio, /^\/audio\/production\/en-US\//);
    assert.equal(row.construct, 'oral-whole-word-syllable-count');
  }
  for (const word of ['fire', 'flower', 'camera', 'chocolate', 'crayon', 'squirrel', 'every']) assert.ok(!DRUM_TRAIL_WORDS.some(row => row.word === word));
  for (const word of ['helicopter', 'alligator', 'caterpillar', 'watermelon', 'macaroni']) assert.equal(DRUM_TRAIL_WORDS.find(row => row.word === word).syllables, 4);
});

for (const [difficulty, counts] of [['easy',[1,2]], ['medium',[1,2,3]], ['hard',[2,3,4]]]) {
  test(`${difficulty} varies real words and reachable, equal-size route positions while preserving the oral contrast`, () => {
    const rounds = buildDrumTrailRounds(difficulty, 123);
    assert.equal(rounds.length, 16);
    assert.equal(new Set(rounds.map(row => row.word)).size, 16);
    assert.deepEqual(rounds, buildDrumTrailRounds(difficulty,123));
    assert.notDeepEqual(rounds.map(row => row.word), buildDrumTrailRounds(difficulty,456).map(row => row.word));
    assert.ok(rounds.every(row => counts.includes(row.syllables)));
    for (const round of rounds) {
      assert.deepEqual(round.routes.map(route => route.drums).sort(), counts);
      assert.equal(round.routes.filter(route => route.drums === round.syllables).length, 1);
      assert.equal(new Set(round.routes.map(route => route.x)).size, counts.length);
      for (const route of round.routes) { assert.ok(route.x > 0 && route.x < 100); assert.ok(route.y > 0 && route.y < 100); }
    }
    const correctSlots = new Set(Array.from({length:30},(_,seed) => buildDrumTrailRounds(difficulty,seed)[0].routes.findIndex(route => route.drums === buildDrumTrailRounds(difficulty,seed)[0].syllables)));
    assert.equal(correctSlots.size, counts.length);
    assert.notDeepEqual(rounds.map(row => row.word), buildDrumTrailRounds(difficulty,123,16,1).map(row => row.word));
  });
}
test('invalid/large round requests terminate and never manufacture duplicate questions', () => {
  assert.equal(buildDrumTrailRounds('easy',0,0).length,1);
  assert.equal(buildDrumTrailRounds('hard',0,9999).length,50);
  assert.ok(buildDrumTrailRounds('medium',0).length > 0);
});
test('first oral response freezes incomplete delivery even when subsequent feedback is fully heard', () => {
  const round = buildDrumTrailRounds('medium',99)[0];
  const initial = commitDrumTrailAnswer(newDrumTrailEvidence(),round,round.syllables,{delivery:'pending'});
  assert.equal(initial.response.correct,true); assert.equal(initial.awarded,10);
  assert.equal(initial.response.stimulusDelivered,false); assert.equal(initial.response.independentOralPractice,false);
  const duplicate = commitDrumTrailAnswer(initial.evidence,round,round.syllables,{delivery:'delivered'});
  assert.equal(duplicate.awarded,0); assert.equal(duplicate.first,false);
  assert.equal(duplicate.evidence.firstResponses.length,1);
  assert.equal(duplicate.evidence.firstResponses[0].deliveryAtResponse,'pending');
  assert.equal(duplicate.evidence.assistedRetries[0].independentOralPractice,false);
});
test('only a delivered, unmodelled first answer can be independent oral practice, never mastery', () => {
  const round = buildDrumTrailRounds()[0];
  const independent = commitDrumTrailAnswer(newDrumTrailEvidence(),round,round.syllables,{delivery:'delivered'});
  assert.equal(independent.response.independentOralPractice,true); assert.equal(independent.response.practiceOnly,true);
  for (const context of [{delivery:'unavailable'}, {delivery:'delivered',modelUsed:true}, {delivery:'delivered',supportReasons:['mission-help']}]) {
    const answer = commitDrumTrailAnswer(newDrumTrailEvidence(),round,round.syllables,context);
    assert.equal(answer.response.independentOralPractice,false);
    assert.equal(answer.awarded,10,'engagement points remain playable in supported mode');
  }
});
test('a visible word changes the response modality and freezes actual picture delivery', () => {
  const round = buildDrumTrailRounds()[0];
  const first = commitDrumTrailAnswer(newDrumTrailEvidence(), round, round.syllables, {
    delivery: 'delivered', wordVisible: true, pictureDelivery: 'pending',
  });
  assert.equal(first.response.independentOralPractice, false);
  assert.equal(first.response.construct, 'multimodal-whole-word-syllable-count');
  assert.equal(first.response.presentationVersion, 2);
  assert.equal(first.response.wordVisible, true);
  const later = commitDrumTrailAnswer(first.evidence, round, round.syllables, {
    delivery: 'delivered', wordVisible: true, pictureDelivery: 'delivered',
  });
  assert.equal(later.evidence.firstResponses[0].pictureDelivery, 'pending');
  assert.equal(later.awarded, 0);
});
test('wrong response is specific but reveals neither expected count nor chunks on first retry', () => {
  const round = DRUM_TRAIL_WORDS.find(row => row.word === 'watermelon');
  const answer = commitDrumTrailAnswer(newDrumTrailEvidence(),round,2,{delivery:'delivered'});
  assert.equal(answer.awarded,0); assert.equal(answer.evidence.completions.length,0);
  const feedback = drumTrailFeedback(round,2,{});
  assert.match(feedback,/chose 2 drums/); assert.ok(!feedback.includes('4')); assert.ok(!feedback.includes('wa · ter'));
  assert.match(drumTrailFeedback(round,2,{modelUsed:true}),/Hear 4 parts/);
  assert.ok(!drumTrailFeedback(round,2,{modelUsed:true}).includes(round.word));
});
test('retries preserve the first response and bounded evidence across prolonged supported practice', () => {
  const round = buildDrumTrailRounds()[0];
  let state = newDrumTrailEvidence();
  for (let i=0;i<150;i++) state = commitDrumTrailAnswer(state,round,99,{delivery:'unavailable'}).evidence;
  assert.equal(state.firstResponses.length,1); assert.equal(state.assistedRetries.length,96); assert.equal(state.retryCount,149);
  const success = commitDrumTrailAnswer(state,round,round.syllables,{delivery:'delivered',modelUsed:true});
  assert.equal(success.evidence.firstResponses[0].correct,false);
  assert.equal(success.awarded,10); assert.equal(success.evidence.completions.length,1);
});
test('Bouncy reaches the selected physical island and safely returns after the wrong route', () => {
  const route = buildDrumTrailRounds('hard',1)[0].routes[1];
  const pose = drumTrailActor(route,1,true); assert.equal(pose.x,route.x); assert.ok(Math.abs(pose.y-(route.y-8))<0.001); assert.equal(pose.landed,true);
  const wrong = drumTrailActor(route,1,false); assert.ok(Math.abs(wrong.x-10)<0.001); assert.ok(Math.abs(wrong.y-85)<0.001);
  const reduce = drumTrailActor(route,.5,true,true); assert.equal(reduce.x,10); assert.equal(reduce.y,85); assert.equal(reduce.frame,0);
  assert.equal(drumTrailActor(route,1,true,true).x,route.x);
});
test('runtime derivatives match retained original provenance and stay within source hygiene limit', () => {
  const manifest = JSON.parse(fs.readFileSync('public/images/arcade/drum-trail/manifest.json'));
  assert.equal(manifest.character.canonId,'MEADOW-BOUNCY');
  let runtimeBytes=0;
  for (const asset of manifest.assets) {
    const bytes=fs.readFileSync(`public${asset.path}`); const source=fs.readFileSync(asset.retainedOriginal);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),asset.sha256);
    assert.equal(crypto.createHash('sha256').update(source).digest('hex'),asset.sourceSha256);
    assert.ok(source.length<5*1024*1024); runtimeBytes+=bytes.length;
  }
  assert.ok(runtimeBytes<400000);
});

test('same seed/cursor reload recovers the held first response, with strict scope and version isolation', () => {
  const original = globalThis.window;
  const store = new Map();
  globalThis.window={localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)}};
  try {
    const rounds=buildDrumTrailRounds('easy',123), result=commitDrumTrailAnswer(newDrumTrailEvidence(),rounds[0],rounds[0].syllables,{delivery:'pending'});
    const snapshot={seed:123,cursor:0,index:0,roundId:rounds[0].roundId,phase:'correct',score:10,delivery:'pending',selected:rounds[0].syllables,evidence:result.evidence,supportReasons:['answered-before-whole-word-ended']};
    assert.equal(saveDrumTrailSession('learner-a','easy',snapshot).localSaved,true);
    assert.equal(loadDrumTrailSession('learner-a','easy',123,0,rounds).index,0,'held item survives active index commit');
    assert.equal(loadDrumTrailSession('learner-a','easy',123,0,rounds).evidence.firstResponses[0].stimulusDelivered,false);
    assert.equal(loadDrumTrailSession('learner-b','easy',123,0,rounds),null);
    assert.equal(loadDrumTrailSession('learner-a','easy',124,0,rounds),null);
    assert.equal(loadDrumTrailSession('learner-a','easy',123,1,rounds),null);
    assert.equal(loadDrumTrailSession('learner-a','hard',123,0,rounds),null);
    const key='literacy-guide-learn-games:learner-a',corrupt=JSON.parse(store.get(key));
    corrupt.games['drum-trail'].practiceSession.easy.score=999;store.set(key,JSON.stringify(corrupt));
    assert.equal(loadDrumTrailSession('learner-a','easy',123,0,rounds),null,'corrupt history cannot invent points or independent evidence');
    globalThis.window.localStorage.setItem=()=>{throw new Error('quota');};
    assert.equal(saveDrumTrailSession('learner-a','easy',snapshot).localSaved,false);
  } finally { globalThis.window=original; }
});

class FakeHowl {
  listeners=new Map(); id=7; resumes=[]; pauses=[];
  state(){return 'loaded';} duration(){return 1;}
  on(name,fn){this.listeners.set(name,[...(this.listeners.get(name)||[]),fn]);return this;}
  once(name,fn){const once=(...args)=>{this.off(name,once);fn(...args);};return this.on(name,once);}
  off(name,fn){this.listeners.set(name,(this.listeners.get(name)||[]).filter(f=>f!==fn));return this;}
  emit(name){for(const fn of [...(this.listeners.get(name)||[])])fn(this.id);}
  play(id){if(id!=null)this.resumes.push(id);queueMicrotask(()=>this.emit('play'));return this.id;}
  pause(id){this.pauses.push(id);}stop(){this.emit('stop');}unload(){this.stop();}
}
test('voice delivery resolves on real end, and pause/resume uses the same sound id',async()=>{
  const howl=new FakeHowl(),voice=createDrumTrailVoice({makeHowl:()=>howl});
  const pending=voice.play('/real-word.mp3');await Promise.resolve();
  let resolved=false;pending.then(()=>{resolved=true;});await Promise.resolve();assert.equal(resolved,false);
  voice.pause();assert.deepEqual(howl.pauses,[7]);voice.resume();assert.deepEqual(howl.resumes,[7]);
  howl.emit('end');assert.equal((await pending).status,'delivered');voice.dispose();
});
test('stopped/missing/sound-off clips never count as delivered',async()=>{
  const howl=new FakeHowl(),voice=createDrumTrailVoice({makeHowl:()=>howl});
  const pending=voice.play('/real-word.mp3');await Promise.resolve();voice.cancel();assert.equal((await pending).status,'interrupted');
  assert.equal((await voice.play('')).status,'unavailable');voice.dispose();
  const silent=createDrumTrailVoice({enabled:()=>false,makeHowl:()=>{throw new Error('must not request silent audio');}});
  assert.equal((await silent.play('/real-word.mp3')).status,'unavailable');silent.dispose();
});

test('owned spoken/beat mix follows actual play, pause and same-id resume, then restores once at terminal',async()=>{
  const howl=new FakeHowl(),mix=[],owners=[],voice=createDrumTrailVoice({makeHowl:()=>howl,duck:owner=>{mix.push('duck');owners.push(owner);},restore:owner=>{mix.push('restore');owners.push(owner);}});
  const cue=voice.play('/audio/ui/tap.mp3');assert.deepEqual(mix,[],'loading is not actual audible delivery');
  await Promise.resolve();assert.deepEqual(mix,['duck']);
  voice.pause();assert.deepEqual(mix,['duck'],'pause retains quiet mix and never resumes player music');
  voice.resume();await Promise.resolve();assert.deepEqual(howl.resumes,[7]);
  assert.ok(mix.slice(1).every(event=>event==='duck'),'resumed recording re-ducks player music');
  howl.emit('end');assert.equal((await cue).status,'delivered');
  assert.equal(mix.at(-1),'restore');assert.equal(mix.filter(event=>event==='restore').length,1);
  assert.ok(owners[0]);assert.ok(owners.every(owner=>owner===owners[0]),'actual play/resume/terminal share one stable scoped mix owner');
  voice.dispose();assert.equal(mix.filter(event=>event==='restore').length,1);
});

test('cancel/replay and actual audio error release only the old owned duck, without a stale finalizer restoring new speech',async()=>{
  const howls=new Map(),mix=[],owners=[],voice=createDrumTrailVoice({makeHowl:src=>{const howl=new FakeHowl();howls.set(src,howl);return howl;},duck:owner=>{mix.push('duck');owners.push(owner);},restore:owner=>{mix.push('restore');owners.push(owner);}});
  const old=voice.play('/old.mp3');await Promise.resolve();
  const replay=voice.play('/replay.mp3');await Promise.resolve();
  assert.equal((await old).status,'interrupted');
  assert.deepEqual(mix,['duck','restore','duck'],'old finalizer must not restore current recording');
  assert.equal(owners[0],owners[1]);assert.notEqual(owners[1],owners[2],'replay replaces the scoped mix owner');
  howls.get('/replay.mp3').emit('playerror');assert.equal((await replay).status,'unavailable');assert.deepEqual(mix,['duck','restore','duck','restore']);
  const pending=voice.play('/late.mp3');voice.pause();await Promise.resolve();
  assert.equal(mix.filter(event=>event==='duck').length,2,'late actual start while paused cannot duck or become delivered');
  voice.cancel();assert.equal((await pending).status,'interrupted');voice.dispose();
  assert.equal(mix.filter(event=>event==='restore').length,2,'never-started owner has no mix lease to release');
});
