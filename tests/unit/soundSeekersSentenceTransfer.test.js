import test from 'node:test';
import assert from 'node:assert/strict';
import {CAMPAIGN_SENTENCE_TRANSFER_PACKS as PACKS,CAMPAIGN_SENTENCE_TRANSFER_AUDIO as AUDIO} from '../../src/features/soundSeekers/v3/content/campaignSentenceTransfer.js';
import {CAMPAIGN_LEARNING_PACKS} from '../../src/features/soundSeekers/v3/content/campaignLearningPacks.js';
test('fifteen sentence extensions contain twelve new explicit requests and complete exact audio declarations',()=>{
 assert.equal(Object.keys(PACKS).length,15);assert.equal(AUDIO.length,216);assert.equal(new Set(AUDIO.map(a=>a.id)).size,AUDIO.length);
 const byPath=new Map(AUDIO.map(a=>[a.audio,a.text]));
 for(const [id,pack]of Object.entries(PACKS)){
  assert.equal(pack.length,12);const old=CAMPAIGN_LEARNING_PACKS[id];
  assert.equal(new Set([...old,...pack].map(item=>item.text)).size,old.length+pack.length,id);
  assert.deepEqual([...new Set(pack.map(i=>i.actId))],['retrieve','apply']);
  for(const item of pack){assert.equal(byPath.get(item.audio),item.text);assert.equal(item.familyId,'sentence-express');if(item.sentence)assert.ok(item.text.includes(item.sentence));}
 }
});
test('tense extension gives temporal context without speaking the correct inflected form',()=>{
 for(const item of PACKS['moonwood-29-3']){
  assert.equal(item.options.length,3);assert.equal(item.options.filter(o=>o.label===item.form).length,1);
  assert.ok(!item.text.toLowerCase().includes(item.form.toLowerCase()),item.id);
  assert.ok(/^(Yesterday|Every|Tomorrow|Last|Next)/.test(item.prefix));
  for(const option of item.options)assert.equal(AUDIO.find(a=>a.audio===option.audio).text,option.label);
 }
});
