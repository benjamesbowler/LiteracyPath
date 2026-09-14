import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ACTS, PROJECTS, CHAPTER_WORDS, PHONEMES, CHAPTER_AUDIO, NARRATION, activityDeck, pictureFor, retryFor } from '../src/chapter/content.js';
import { freshChapter, available, selectProject, currentRound, judgeChoice, settleChapter, claimReward, parseChapter, finishedRounds, lights } from '../src/chapter/progress.js';
import { guideRoute, clearSegment } from '../src/chapter/paths.js';
import { movePlayer, START } from '../src/rules.js';

const root=fileURLToPath(new URL('../',import.meta.url));
function answer(p){const round=currentRound(p),job=p.jobs[p.active];return round.choices.find(c=>round.kind==='build'?c.label===round.word[job.built.length]&&!job.used.includes(c.id):c.id===round.answer);}
function finishRound(p){while(!p.jobs[p.active].pending){const result=judgeChoice(p,answer(p).id);assert.equal(result.correct,true);p=result.progress;}return settleChapter(p);}

test('five projects have 120 distinct contextual rounds in five interaction families',()=>{
  assert.equal(PROJECTS.length,5);assert.equal(ACTS.length,15);assert.equal(new Set(ACTS.map(a=>a.kind)).size,5);assert.equal(CHAPTER_WORDS.length,28);
  for(let seed=1;seed<=50;seed++){
    const rounds=ACTS.flatMap(a=>activityDeck(a,seed));assert.equal(rounds.length,120);assert.equal(new Set(rounds.map(r=>r.id)).size,120);
    for(const act of ACTS){const deck=activityDeck(act,seed);assert.equal(new Set(deck.map(r=>r.word)).size,8);assert.deepEqual(deck,activityDeck(act,seed));}
  }
});
test('every word and every corrective cue has intact local recorded media',()=>{
  const cue=id=>assert.ok(CHAPTER_AUDIO[id]&&existsSync(path.join(root,CHAPTER_AUDIO[id])),id);
  Object.keys(NARRATION).forEach(cue);PHONEMES.forEach(l=>cue('phoneme:'+l));
  CHAPTER_WORDS.forEach(w=>{cue('word:'+w);assert.ok(existsSync(path.join(root,pictureFor(w))));});
  for(let seed=1;seed<20;seed++)for(const act of ACTS)for(const r of activityDeck(act,seed)){
    [...r.promptAudio,...r.correctAudio,...r.choices.map(c=>c.audio)].forEach(cue);
    for(const c of r.choices)for(let i=0;i<3;i++)retryFor(r,c,i).audio.forEach(cue);
  }
  const manifest=JSON.parse(readFileSync(path.join(root,'source/chapter-media-provenance.json')));
  assert.equal(manifest.assets.length,CHAPTER_WORDS.length*2+Object.keys(NARRATION).length);
  for(const asset of manifest.assets){const bytes=readFileSync(path.join(root,asset.path));assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,asset.id);assert.equal(bytes.length,asset.bytes);if(asset.signal)assert.ok(asset.signal.durationSeconds>.05);}
});
test('questions have one correct meaning, homogeneous gap choices and distinct repeated-letter pieces',()=>{
  for(let seed=1;seed<=80;seed++)for(const act of ACTS)for(const r of activityDeck(act,seed)){
    assert.equal(new Set(r.choices.map(c=>c.id)).size,r.choices.length);
    if(r.kind==='onset'){assert.equal(r.choices.filter(c=>c.label[0]===r.target).length,1);for(const pair of [['tin','can'],['dog','pup'],['cup','mug']])if(pair.includes(r.word))assert.equal(r.choices.filter(c=>pair.includes(c.label)).length,1);}
    if(r.kind==='gap'){assert.equal(r.word[r.gap],r.answer);assert.equal(new Set(r.choices.map(c=>'aeiou'.includes(c.id))).size,1);}
    if(r.kind==='sort')assert.equal(r.choices.filter(c=>c.id===r.word[0]).length,1);
    if(r.kind==='place')assert.equal(r.instruction,'Put the '+r.word+' '+r.relation.phrase+'.');
    if(r.kind==='build')assert.deepEqual(r.choices.map(c=>c.label).sort(),[...r.word].sort());
  }
});
test('replay changes targets, order and sound-basket sides',()=>{
  for(const act of ACTS){const orders=new Set(Array.from({length:40},(_,i)=>activityDeck(act,i+1).map(r=>r.id).join('|')));assert.ok(orders.size>15,act.id);if(act.kind==='sort')assert.equal(new Set(Array.from({length:40},(_,i)=>activityDeck(act,i+1)[0].choices[0].id)).size,2);}
});
test('a complete journey requires all 120 solved rounds and all four community projects before the tree',()=>{
  for(const order of [['picnic','brook','garden','parcels','tree'],['brook','parcels','picnic','garden','tree']]){
    let p=freshChapter(94723);assert.equal(available(p,'picnic'),true);assert.equal(available(p,'brook'),true);assert.equal(available(p,'tree'),false);
    assert.deepEqual(selectProject(p,'tree'),p);
    for(const id of order){p=selectProject(p,id);assert.equal(p.active,id);for(let act=0;act<3;act++){p={...p,mode:'activity'};for(let i=0;i<8;i++){p=finishRound(p);assert.equal(p.mode,i===7?'reward':'activity');const restored=parseChapter(JSON.stringify(p));assert.deepEqual(restored,p);}
      const before=finishedRounds(p);p=claimReward(p);assert.equal(finishedRounds(p),before);}}
    assert.equal(p.complete,true);assert.equal(p.mode,'complete');assert.equal(finishedRounds(p),120);assert.equal(lights(p),3);
    assert.deepEqual(parseChapter(JSON.stringify(p)),p);
  }
});
test('wrong answers and navigation never award repairs, and switching jobs preserves exact partial words',()=>{
  let p=freshChapter(137);const r=currentRound(p);const wrong=r.choices.find(c=>c.id!==r.answer);const result=judgeChoice(p,wrong.id);assert.equal(result.correct,false);assert.equal(finishedRounds(result.progress),0);assert.deepEqual(result.progress.jobs,p.jobs);
  p=selectProject(p,'brook');p.jobs.brook.act=1;p.mode='activity';const choice=answer(p);p=judgeChoice(p,choice.id).progress;const before=currentRound(p),built=p.jobs.brook.built,used=p.jobs.brook.used;
  p=selectProject(p,'picnic');p=parseChapter(JSON.stringify(p));p=selectProject(p,'brook');assert.deepEqual(currentRound(p),before);assert.equal(p.jobs.brook.built,built);assert.deepEqual(p.jobs.brook.used,used);assert.equal(judgeChoice(p,used[0]).accepted,false);
});
test('the two p pieces in pup remain independently usable after reload',()=>{
  let found;
  for(let seed=1;seed<100&&!found;seed++){const act=ACTS.find(a=>a.id==='brook-build'),deck=activityDeck(act,seed),index=deck.findIndex(r=>r.word==='pup');if(index>=0){found=freshChapter(seed);found.active='brook';found.mode='activity';found.jobs.brook.act=1;found.jobs.brook.round=index;}}
  assert.ok(found);let p=judgeChoice(found,answer(found).id).progress;p=parseChapter(JSON.stringify(p));assert.equal(p.jobs.brook.built,'p');p=judgeChoice(p,answer(p).id).progress;p=judgeChoice(p,answer(p).id).progress;assert.equal(p.jobs.brook.pending,true);assert.equal(p.jobs.brook.built,'pup');assert.equal(p.jobs.brook.used.length,3);
  const restored=parseChapter(JSON.stringify(p));assert.deepEqual(parseChapter(JSON.stringify(restored)),restored);assert.equal(finishedRounds(restored),finishedRounds(p));
});
test('invalid saves are rejected or cleaned without opening unearned locations',()=>{
  for(const raw of ['null','{}','bad','[]'])assert.equal(parseChapter(raw),null);
  const bad=freshChapter(42);bad.jobs.tree.act=3;assert.equal(parseChapter(JSON.stringify(bad)),null);
  const clean=freshChapter(42);clean.jobs.brook.built='script';clean.jobs.brook.used=['missing'];clean.fireflies=[1,1,-1,7];clean.position={x:99,z:99};clean.complete=true;
  const restored=parseChapter(JSON.stringify(clean));assert.equal(restored.complete,false);assert.deepEqual(restored.position,START);assert.deepEqual(restored.fireflies,[1]);assert.equal(restored.jobs.brook.built,'');
});
test('every landmark has a collision-safe guided route and frame-by-frame arrival',()=>{
  // Read the same authored tree/rock coordinates, including the chapter relocation.
  const source=readFileSync(path.join(root,'src/world.js'),'utf8');
  const trees=JSON.parse(source.match(/const TREE_SPOTS=(\[.*?\]);/)[1].replace(/([,[])\./g,'$10.'));
  const obstacles=trees.map(([x,z,s])=>({x:x===15&&z===-20?18:x,z:x===15&&z===-20?-18:z,r:.65*s})).filter(o=>o.x>-26&&o.x<26&&o.z>-35&&o.z<24);
  obstacles.push({x:-14,z:2.3,r:2.3},{x:1,z:-34,r:1.8},...[[-23,17,1],[-20,-1,1],[20,0,.6],[20,-18,1.3],[-18,-28,.9],[11,-30,.7],[-4,6,.65]].map(([x,z,s])=>({x,z,r:.7*s})));
  let start=START;
  for(const act of ACTS){const stage=act.projectIndex>=2?2:0,route=guideRoute(start,act,stage,obstacles);assert.ok(route.length,act.id);let from=start;for(const next of route){assert.ok(clearSegment(from,next,stage,obstacles),act.id);from=next;}
    const player={...start,vx:0,vz:0};let target=0;for(let frame=0;frame<20000&&target<route.length;frame++){const point=route[target],len=Math.hypot(point.x-player.x,point.z-player.z);if(len<.25){target++;continue;}movePlayer(player,{x:(point.x-player.x)/len,z:(point.z-player.z)/len},1/60,stage,obstacles);}assert.equal(target,route.length,act.id+' guide stuck');assert.ok(Math.hypot(player.x-act.x,player.z-act.z)<.4,act.id);start=act;
  }
  assert.deepEqual(guideRoute(START,ACTS.find(a=>a.id==='garden-grow'),0,obstacles),[]);
});
