import test from 'node:test';import assert from 'node:assert/strict';
import{CAMPAIGN_TRANSFER_PACKS,CAMPAIGN_TRANSFER_AUDIO}from'../../src/features/soundSeekers/v3/content/campaignTransferPacks.js';
import{CAMPAIGN_LEARNING_PACKS}from'../../src/features/soundSeekers/v3/content/campaignLearningPacks.js';
import{CAMPAIGN_STAGES}from'../../src/features/soundSeekers/v3/content/campaign.js';
import{CAMPAIGN_PROP_ROLES,drawCampaignProp,campaignRelationPlacement}from'../../src/features/soundSeekers/v3/render/campaignProps.js';
test('later main missions receive twelve new unique situations with two different acts',()=>{
 assert.equal(Object.keys(CAMPAIGN_TRANSFER_PACKS).length,73);
 for(const s of CAMPAIGN_STAGES.slice(1))assert.ok(CAMPAIGN_TRANSFER_PACKS[s.finaleMissionId]);
 const all=Object.values(CAMPAIGN_TRANSFER_PACKS).flat();assert.equal(all.length,876);assert.equal(new Set(all.map(x=>x.text)).size,876);
 for(const [id,pack]of Object.entries(CAMPAIGN_TRANSFER_PACKS)){
  assert.equal(pack.filter(x=>x.actId==='retrieve').length,6);assert.equal(pack.filter(x=>x.actId==='apply').length,6);
  assert.equal(new Set(pack.map(x=>x.familyId)).size,2);
  for(const entry of pack)assert.ok(!CAMPAIGN_LEARNING_PACKS[id].some(old=>old.text===entry.text),entry.text);
 }
});
test('every exact prompt names its keyed arrangement and every candidate has supported distinct physical geometry',()=>{
 const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
 for(const entry of Object.values(CAMPAIGN_TRANSFER_PACKS).flat()){
  assert.equal(new Set(entry.options.map(o=>o.id)).size,3);assert.equal(new Set(entry.options.map(o=>JSON.stringify([o.icon,o.appearance]))).size,3);
  const correct=entry.options.find(o=>o.id===entry.correctId);assert.ok(correct);
  assert.equal(entry.text,`${entry.actId==='retrieve'?'Find':'Put'} the ${correct.label}.`);
  for(const option of entry.options){assert.ok(CAMPAIGN_PROP_ROLES.includes(option.icon));assert.ok(CAMPAIGN_PROP_ROLES.includes(option.appearance.landmark.kind));assert.equal(drawCampaignProp(ctx,option.icon,0,0,option.appearance),true);assert.equal(campaignRelationPlacement(option.appearance).supported,true,option.label);}
  if(entry.construct==='oral_conjunctive_description'){
   assert.ok(entry.options.some(o=>o.id!==entry.correctId&&o.appearance.sizeVariant!==correct.appearance.sizeVariant&&o.appearance.relation===correct.appearance.relation));
   assert.ok(entry.options.some(o=>o.id!==entry.correctId&&o.appearance.sizeVariant===correct.appearance.sizeVariant&&o.appearance.relation!==correct.appearance.relation));
  }
 }
});
test('all scenario and option audio references resolve to exact unique generated-script records',()=>{
 const clips=new Map(CAMPAIGN_TRANSFER_AUDIO.map(x=>[x.audio,x]));assert.equal(clips.size,CAMPAIGN_TRANSFER_AUDIO.length);
 assert.equal(new Set(CAMPAIGN_TRANSFER_AUDIO.map(x=>x.id)).size,CAMPAIGN_TRANSFER_AUDIO.length);
 for(const entry of Object.values(CAMPAIGN_TRANSFER_PACKS).flat()){
  assert.equal(clips.get(entry.audio).text,entry.text);
  for(const option of entry.options)assert.equal(clips.get(option.audio).text,option.label);
 }
});

test('all expanded runtime audio references resolve, including legacy media-root word fallbacks',async()=>{
 const {existsSync}=await import('node:fs');
 const {CAMPAIGN_MISSIONS}=await import('../../src/features/soundSeekers/v3/content/campaign.js');
 const {buildCampaignMission}=await import('../../src/features/soundSeekers/v3/engine/campaignChallenges.js');
 const progress={targets:{}},paths=new Set();
 const visit=value=>{if(typeof value==='string'&&/\.(?:mp3|wav|ogg)(?:\?|$)/u.test(value))paths.add(value);else if(value&&typeof value==='object')Object.values(value).forEach(visit);};
 for(const mission of CAMPAIGN_MISSIONS){visit(buildCampaignMission(mission,progress));if(mission.curriculum.mode==='teach')for(const id of mission.curriculum.targetIds)progress.targets[id]={taught:true};}
 assert.ok(paths.size>4000);
 for(const path of paths)assert.ok(existsSync(new URL(`../../public${path}`,import.meta.url)),path);
});
