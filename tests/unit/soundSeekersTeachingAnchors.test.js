import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SOUND_SEEKERS_TEACH_TARGETS,INITIAL_SOUND_TARGET_IDS } from '../../src/features/soundSeekers/content/teachTargetMetadata.js';
import { getPronunciation } from '../../src/features/soundSeekers/content/pronunciationLexicon.js';
import { buildSignpost } from '../../src/features/soundSeekers/v3/engine/challenges.js';
import { refreshCampaignTeaching } from '../../src/features/soundSeekers/v3/engine/campaignChallenges.js';
import { adventureStickVector } from '../../src/features/soundSeekers/v3/engine/adventureControls.js';

test('initial teaching examples start with the taught sound and have real pictures and spoken words',()=>{
 for(const id of INITIAL_SOUND_TARGET_IDS){
  const target=SOUND_SEEKERS_TEACH_TARGETS[id],record=getPronunciation(target.word),first=record.units[0];
  assert.equal(first.grapheme,target.units[0].grapheme,id);assert.equal(first.soundKey,target.units[0].soundKey,id);assert.equal(first.letterIndices[0],0,id);
  const beat=buildSignpost({stopId:'s1',targetIds:[id]}),card=beat.view.cards[0];
  for(const path of [card.anchorImage,card.anchorAudio,card.phonemeAudio])assert.ok(path&&fs.existsSync(new URL(`../../public${path}`,import.meta.url)),`${id}: ${path}`);
  assert.match(beat.prompt.text,/starts with/);
 }
 assert.equal(SOUND_SEEKERS_TEACH_TARGETS.m.word,'map');assert.equal(SOUND_SEEKERS_TEACH_TARGETS.x.word,'box');assert.ok(!INITIAL_SOUND_TARGET_IDS.includes('x'));
});

test('old saved teaching scenes refresh ham to map without rebuilding any scored challenge',()=>{
 const old=buildSignpost({stopId:'s1',targetIds:['m']});old.view.cards[0].anchorWord='ham';old.view.cards[0].anchorImage='/old-ham.png';old.prompt.cues=[{kind:'word',src:'/old-ham.mp3'}];old.id='saved-beat-id';
 const scored={id:'saved-choice',mechanic:'echo_hunt',key:{optionId:'original'},view:{options:[]}},before=structuredClone(old);
 const [fresh,same]=refreshCampaignTeaching([old,scored]);assert.equal(fresh.id,old.id);assert.equal(fresh.view.cards[0].anchorWord,'map');assert.match(fresh.view.cards[0].anchorImage,/map/);assert.ok(fresh.prompt.cues.every(c=>!c.src.includes('ham')));assert.strictEqual(same,scored);assert.deepEqual(old,before);
});

test('teaching-only anchor additions cannot claim decodable-bank status',()=>{
 for(const word of ['map','top','sun','dog','insect','ox','umbrella','egg','web','queen','yak']){
  const r=getPronunciation(word);assert.ok(r.tags.includes('oral-teaching-anchor'));assert.ok(!r.tags.includes('decodable'));
 }
});

test('touch stick has a dead zone, proportional motion and a bounded diagonal',()=>{
 assert.deepEqual(adventureStickVector(3,0),{x:0,y:0});assert.equal(adventureStickVector(48,0).x,1);assert.ok(adventureStickVector(24,0).x<.5);
 const d=adventureStickVector(80,80);assert.ok(Math.abs(Math.hypot(d.x,d.y)-1)<1e-8);assert.ok(d.x===d.y);assert.deepEqual(adventureStickVector(NaN,2),{x:0,y:0});
});
