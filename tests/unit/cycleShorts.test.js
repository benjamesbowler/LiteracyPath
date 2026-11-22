import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import {CYCLE_SHORTS,cycleShortFor,cycleShortLearningWords} from '../../src/content/cycle-shorts/passages.js';
import {COMPREHENSION_PASSAGES} from '../../src/content/comprehension/passages.js';
import {resolveComprehensionPassageAudio,resolveComprehensionQuestionAudio} from '../../src/content/comprehension/audio.js';
import {cycleShortPicture} from '../../src/content/cycle-shorts/pictures.js';
import {buildCyclePresentation} from '../../src/utils/present/presentationBuilder.js';

test('all 27 farm weeks have short connected texts and three evidenced four-choice questions',()=>{
 assert.equal(CYCLE_SHORTS.length,27);
 assert.equal(new Set(CYCLE_SHORTS.map(p=>p.text)).size,27);
 for(const [i,p] of CYCLE_SHORTS.entries()){
  assert.equal(p.cycleNumber,i+1);assert.equal(p.world,'Sunny Meadow Farm');
  assert.equal(p.readingMode,'Supported Read-Together');
  assert.ok(p.wordCount<=50);assert.equal(p.text,p.sentences.join(' '));
  assert.equal(p.questions.length,3);
  for(const word of p.targetWords)assert.ok(new RegExp(`\\b${word}\\b`,'i').test(p.text),`${p.id}: target ${word}`);
  for(const q of p.questions){
   assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(q.options.includes(q.answer));
   assert.ok(q.evidence.length);for(const evidence of q.evidence)assert.ok(p.sentences.includes(evidence));
  }
 }
 assert.ok(CYCLE_SHORTS.slice(0,5).every(p=>p.wordCount<=25));
 assert.equal(cycleShortFor(0),null);assert.equal(cycleShortFor(28),null);
});

test('five existing comprehension passages retain every source word, choice and evidence sentence',()=>{
 const reused=CYCLE_SHORTS.filter(p=>p.sourcePassageId);assert.equal(reused.length,5);
 for(const p of reused){const source=COMPREHENSION_PASSAGES.find(s=>s.id===p.sourcePassageId);assert.equal(p.text,source.text);assert.equal(p.title,source.title);assert.deepEqual(p.questions.map(q=>({prompt:q.prompt,answer:q.answer,options:q.options,evidence:q.evidence})),source.questions.map(q=>({prompt:q.prompt,answer:q.answer,options:q.options,evidence:q.evidence})));}
});

test('word emphasis respects daily sight-word introductions and includes each week’s focus examples',()=>{
 assert.ok(!cycleShortLearningWords(CYCLE_SHORTS[0],'monday').includes('i'));
 assert.ok(cycleShortLearningWords(CYCLE_SHORTS[0],'wednesday').includes('am'));
 assert.ok(!cycleShortLearningWords(CYCLE_SHORTS[0],'wednesday').includes('i'));
 assert.ok(cycleShortLearningWords(CYCLE_SHORTS[0],'thursday').includes('i'));
 for(const p of CYCLE_SHORTS)for(const target of p.targetWords)assert.ok(cycleShortLearningWords(p).includes(target.toLowerCase()));
});

test('all 135 daily decks end with the matching complete story and its three unscored questions',()=>{
 for(let i=1;i<=27;i++)for(const day of ['monday','tuesday','wednesday','thursday','friday']){
  const p=cycleShortFor(i),deck=buildCyclePresentation(`cycle-${i}`,{day});
  const ending=deck.manifest.slides.slice(-4);
  assert.equal(ending[0].storyText,p.text);assert.equal(ending[0].passageId,p.id);
  assert.deepEqual(ending.slice(1).map(s=>s.questionId),p.questions.map(q=>q.id));
  assert.ok(ending.every(s=>s.codeStatus==='adult-supported'));
  for(const view of ending){
   assert.equal(view.materials.images.length,1,`${p.id}: each story/question view needs its story picture`);
   assert.match(view.materials.images[0],/\/images\/comprehension\/(?:cycle-shorts|passages)\//);
  }
  for(const [index,q] of p.questions.entries())assert.deepEqual(new Set(ending[index+1].options),new Set(q.options));
 }
});


test('every cycle resolves only its own current story picture, including unchanged reused passages',()=>{
 for(const p of CYCLE_SHORTS){
  const picture=cycleShortPicture(p);assert.ok(picture,p.id);assert.ok(picture.alt.length>30);
  assert.equal(cycleShortPicture({...p,text:p.text+' Changed.'}),null);
  if(p.sourcePassageId)assert.match(picture.src,new RegExp(p.sourcePassageId));
  else assert.match(picture.src,new RegExp(p.id+'\\.webp$'));
 }
 assert.equal(cycleShortPicture(null),null);
 assert.equal(cycleShortPicture({id:'constructor',text:'unknown'}),null);
});

test('cached Cycle Shorts keep the exact historical audio at their released paths',()=>{
 const root=new URL('../../',import.meta.url);
 const manifest=JSON.parse(readFileSync(new URL('src/content/cycle-shorts/audioManifest.generated.json',root),'utf8'));
 const family='/audio/production/en-US/cycle-shorts/';
 const clipPaths=[...manifest.clips,...manifest.compatibilityClips]
  .filter(clip=>clip.audioPath.startsWith(family)).map(clip=>clip.audioPath.slice(family.length));
 assert.deepEqual(readdirSync(new URL(`public${family}`,root)).sort(),clipPaths.sort());
 const firstKitRelease=manifest.compatibilityClips.find(clip=>clip.audioPath===`${family}734b033257c86b35f921.mp3`);
 assert.equal(firstKitRelease?.audioSha256,'6c5216a344145b99cb28221fa7dcbe771f6ec665e2020ba7a4f4321040fcfa7e');
 for(const clip of manifest.compatibilityClips){
  assert.equal(createHash('sha256').update(clip.text).digest('hex'),clip.textSha256);
  const bytes=readFileSync(new URL(`public${clip.audioPath}`,root));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),clip.audioSha256,clip.audioPath);
 }
});

test('all current Cycle Shorts passages and questions resolve exact Leda clips',()=>{
 for(const passage of CYCLE_SHORTS){
  assert.equal(resolveComprehensionPassageAudio(passage).status,'ready',passage.id);
  for(const question of passage.questions){
   const audio=resolveComprehensionQuestionAudio(question);
   assert.equal(audio.status,'ready',question.id);
   assert.equal(audio.parts.length,9,question.id);
  }
 }
});
