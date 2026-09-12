import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { QUEST_STOPS } from '../../src/data/questSequence.js';
import { CAMPAIGN_MISSIONS } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { buildCampaignMission,createCampaignBeatState } from '../../src/features/soundSeekers/v3/engine/campaignChallenges.js';
import { buildSignpost,MECHANICS,DOMAINS } from '../../src/features/soundSeekers/v3/engine/challenges.js';
import { campaignInstructionPlan } from '../../src/features/soundSeekers/v3/engine/campaignInstructions.js';

const progress={targets:Object.fromEntries(QUEST_STOPS.flatMap(stop=>stop.teach.map(target=>[target.id,{taught:true}])))};
const journeys=CAMPAIGN_MISSIONS.map(mission=>({mission,beats:buildCampaignMission(mission,progress).beats}));

test('every campaign plan delivers authored instruction sources with recorded asset files',()=>{
  for(const {beats}of journeys)for(const beat of beats){
    const state=createCampaignBeatState(beat),before=JSON.stringify({beat,state}),plan=campaignInstructionPlan(beat,state);
    assert.equal(JSON.stringify({beat,state}),before);assert.deepEqual(campaignInstructionPlan(beat,state),plan);
    assert.ok(plan.flatMap(step=>step.sources).length,`${beat.id} has no recorded instruction`);
    const authored=new Set([...(beat.prompt.cues||[]).map(c=>c.src),...(beat.view.cards||[]).flatMap(c=>[c.phonemeAudio,...c.unitAudio.map(u=>u.audio),c.baseAudio,c.anchorAudio]),...(beat.view.mode!=='read'?beat.view.items||[]:[]).map(i=>i.audio)].filter(Boolean));
    for(const step of plan){
      assert.ok(['teach','instruction'].includes(step.kind));
      for(const src of step.sources){assert.ok(authored.has(src),beat.id);assert.ok(existsSync(new URL(`../../public${src}`,import.meta.url)),`${beat.id}: ${src}`);}
      if(step.kind==='instruction')assert.equal(Object.hasOwn(step,'targetId'),false);
    }
    if(beat.mechanic===MECHANICS.SIGNPOST)assert.deepEqual(plan.map(step=>step.targetId),beat.view.cards.map(card=>card.targetId));
    else if(beat.mechanic!==MECHANICS.SOUND_SORT)assert.deepEqual(plan.flatMap(step=>step.sources),(beat.prompt.cues||[]).map(c=>c.src).filter(Boolean));
  }
});

test('grouped introductions plan every card in order, including constituent sounds and whole anchors',()=>{
  const beat=buildSignpost({stopId:'s1',targetIds:['a','m']}),state=createCampaignBeatState(beat),plan=campaignInstructionPlan(beat,state);
  assert.equal(plan.length,2);assert.deepEqual(plan.map(step=>step.targetId),['a','m']);
  for(const [index,card]of beat.view.cards.entries())assert.deepEqual(plan[index],{kind:'teach',targetId:card.targetId,sources:[card.phonemeAudio,...card.unitAudio.map(unit=>unit.audio),card.anchorAudio].filter(Boolean)});
  assert.deepEqual(state.cardsHeard,[]);assert.equal(state.heard,false);assert.equal(state.done,false);
});

test('sort autoplay follows the active item; read-mode sorting never supplies the spoken answer',()=>{
  for(const {beats}of journeys)for(const beat of beats.filter(b=>b.mechanic===MECHANICS.SOUND_SORT)){
    for(const [itemIndex,item]of beat.view.items.entries()){
      const sources=campaignInstructionPlan(beat,{itemIndex}).flatMap(step=>step.sources);
      assert.deepEqual(sources,beat.view.mode==='read'?beat.prompt.cues.map(c=>c.src).filter(Boolean):[item.audio]);
    }
    if(beat.view.mode!=='read')assert.deepEqual(campaignInstructionPlan(beat,{itemIndex:beat.view.items.length}),[]);
  }
});

test('grapheme-to-phoneme planning never accesses an answer key, target audio or option audio',()=>{
  const fail=()=>{throw new Error('Answer audio must remain learner selected');};
  const beat={mechanic:MECHANICS.ECHO_HUNT,domain:DOMAINS.G2P,prompt:{cues:[]},view:{direction:'letter-to-sound',get options(){return fail();},get target(){return fail();}},get key(){return fail();}};
  assert.deepEqual(campaignInstructionPlan(beat),[]);
  beat.prompt.cues=[{kind:'instruction',src:'/audio/authored-direction.mp3'}];
  assert.deepEqual(campaignInstructionPlan(beat),[{kind:'instruction',sources:['/audio/authored-direction.mp3']}]);
});

test('missing teaching audio produces an empty target step rather than claiming playback or using an answer',()=>{
  const state={done:false,heard:[],supportUsed:[]},beat={mechanic:MECHANICS.SIGNPOST,view:{cards:[{targetId:'missing',phonemeAudio:'',unitAudio:[],anchorAudio:''}]}};
  assert.deepEqual(campaignInstructionPlan(beat,state),[{kind:'teach',targetId:'missing',sources:[]}]);
  assert.deepEqual(state,{done:false,heard:[],supportUsed:[]});assert.deepEqual(campaignInstructionPlan(null),[]);
});

test('all authored teaching cards have a deliverable recorded sequence',()=>{
  for(const {beats}of journeys)for(const beat of beats.filter(b=>b.mechanic===MECHANICS.SIGNPOST))for(const step of campaignInstructionPlan(beat))assert.ok(step.sources.length,`${beat.id}/${step.targetId} has no teaching audio`);
});

test('morphology teaching speaks the base before its derived word without duplicating the anchor',()=>{
  const card={targetId:'suffix_ing',phonemeAudio:'',unitAudio:[],baseAudio:'/audio/jump.mp3',anchorAudio:'/audio/jumping.mp3'},
    beat={mechanic:MECHANICS.SIGNPOST,view:{cards:[card]}};
  assert.deepEqual(campaignInstructionPlan(beat),[{kind:'teach',targetId:'suffix_ing',sources:['/audio/jump.mp3','/audio/jumping.mp3']}]);
  card.baseAudio=card.anchorAudio;
  assert.deepEqual(campaignInstructionPlan(beat),[{kind:'teach',targetId:'suffix_ing',sources:['/audio/jumping.mp3']}]);
});
