import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { QUEST_STOPS } from '../../src/data/questSequence.js';
import { getChildWordAsset } from '../../src/data/childAssets.js';
import { CAMPAIGN_MISSIONS } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { buildCampaignMission,createCampaignBeatState,resolveCampaignAction } from '../../src/features/soundSeekers/v3/engine/campaignChallenges.js';
import { buildSignpost,DOMAINS,MECHANICS,publicBeat } from '../../src/features/soundSeekers/v3/engine/challenges.js';
import { targetInfo,wordImage } from '../../src/features/soundSeekers/v3/engine/lexicon.js';
import { soundPictureCue } from '../../src/features/soundSeekers/v3/engine/campaignSoundPictures.js';

const progress={targets:Object.fromEntries(QUEST_STOPS.flatMap(stop=>stop.teach.map(target=>[target.id,{taught:true}])))};
const journeys=CAMPAIGN_MISSIONS.map(mission=>buildCampaignMission(mission,progress));
const opening=journeys[0].beats;

test('every campaign sound picture uses its exact canonical target and existing clean media',()=>{
  for(const {beats}of journeys)for(const beat of beats){
    const before=structuredClone(beat),cue=soundPictureCue(beat);
    assert.deepEqual(beat,before);
    const eligible=beat.mechanic===MECHANICS.SIGNPOST||beat.mechanic===MECHANICS.ECHO_HUNT&&[DOMAINS.P2G,DOMAINS.G2P].includes(beat.domain);
    if(!eligible){assert.equal(cue,null,beat.id);continue;}
    const targetId=beat.mechanic===MECHANICS.SIGNPOST?beat.targetIds[0]:beat.key.optionTargets[beat.key.optionId],info=targetInfo(targetId),image=wordImage(info.anchorWord);
    if(!image){assert.equal(cue,null,`${beat.id}: unsuitable anchor must be omitted`);continue;}
    assert.deepEqual(cue,{targetId,grapheme:info.grapheme,word:info.anchorWord,image,audio:getChildWordAsset(info.anchorWord).audio});
    for(const src of [cue.image,cue.audio])assert.ok(src&&existsSync(new URL(`../../public${src}`,import.meta.url)),`${beat.id}: ${src}`);
    assert.equal(Object.hasOwn(cue,'optionId'),false);assert.equal(publicBeat(beat).key,undefined);
  }
});

test('map remains visible through every m sound round in both directions, including stale saved views',()=>{
  const beats=opening.filter(beat=>beat.targetIds.includes('m'));
  assert.equal(beats.filter(beat=>beat.domain===DOMAINS.G2P).length,1);
  for(const beat of beats){
    const old=structuredClone(beat);old.view.target={...old.view.target,anchorWord:'ham',anchorImage:'/wrong-ham.png'};
    if(old.view.cards)old.view.cards[0].anchorWord='ham';
    const cue=soundPictureCue(old);assert.equal(cue.targetId,'m');assert.equal(cue.word,'map');assert.match(cue.image,/map/);
  }
});

test('variants and morphology retain their canonical meaning; missing pictures get no guessed substitute',()=>{
  for(const [id,word]of [['oo','moon'],['oo_short','book'],['x','box'],['suffix_s','cats']]){
    const cue=soundPictureCue(buildSignpost({stopId:'s1',targetIds:[id]}));assert.equal(cue.word,word);assert.equal(cue.targetId,id);
  }
  for(const id of ['suffix_ing','suffix_ed','c_s','y_ie'])assert.equal(soundPictureCue(buildSignpost({stopId:'s1',targetIds:[id]})),null,id);
  const grouped=buildSignpost({stopId:'s1',targetIds:['a','m']});
  assert.equal(soundPictureCue(grouped,{targetId:'m'}).word,'map');assert.equal(soundPictureCue(grouped,{targetId:'s'}),null);
  assert.equal(soundPictureCue(null),null);
  const echo=opening.find(beat=>beat.domain===DOMAINS.G2P);
  assert.equal(soundPictureCue(publicBeat(echo)),null);assert.equal(soundPictureCue({...echo,key:{optionId:'missing',optionTargets:{}}}),null);
});

test('a loaded picture marks only current sound practice as supported without revealing or answering',()=>{
  for(const beat of opening.filter(beat=>beat.mechanic===MECHANICS.ECHO_HUNT&&beat.supportContext.mode==='independent-check')){
    const initial=createCampaignBeatState(beat),before=structuredClone(initial),shown=resolveCampaignAction(beat,initial,{type:'PICTURE_CUE_SHOWN'});
    assert.deepEqual(initial,before);assert.equal(shown.state.done,false);assert.equal(shown.state.errors,0);assert.equal(shown.state.modelShown,true);
    assert.deepEqual(shown.state.supportUsed,['picture-cue']);assert.deepEqual(shown.outcome,{type:'support',pictureCue:true});
    assert.deepEqual(resolveCampaignAction(beat,shown.state,{type:'PICTURE_CUE_SHOWN'}),{state:shown.state,outcome:{type:'ignored'}});
    const resumed=JSON.parse(JSON.stringify({...shown.state,modelShown:false}));
    const done=resolveCampaignAction(beat,resumed,{type:'CHOOSE',optionId:beat.key.optionId});
    assert.equal(done.outcome.evidence.independent,false);assert.deepEqual(done.outcome.evidence.supportUsed,['picture-cue']);
    const evidence=structuredClone(done.outcome.evidence),late=resolveCampaignAction(beat,done.state,{type:'PICTURE_CUE_SHOWN'});
    assert.equal(late.outcome.type,'ignored');assert.deepEqual(done.outcome.evidence,evidence);
    const independent=resolveCampaignAction(beat,initial,{type:'CHOOSE',optionId:beat.key.optionId});assert.equal(independent.outcome.evidence.independent,true);
  }
});

test('picture visibility does not teach a signpost, affect other activities or rewrite completed evidence',()=>{
  const noPicture={...opening.find(beat=>beat.domain===DOMAINS.G2P),targetIds:['c_s'],key:{optionId:'c',optionTargets:{c:'c_s'}}};
  for(const beat of [opening[0],noPicture,journeys.flatMap(j=>j.beats).find(beat=>beat.mechanic===MECHANICS.WORD_FORGE)]){
    const state=createCampaignBeatState(beat),result=resolveCampaignAction(beat,state,{type:'PICTURE_CUE_SHOWN'});
    assert.deepEqual(result,{state,outcome:{type:'ignored'}});
  }
  const beat=opening.find(beat=>beat.domain===DOMAINS.G2P),done=resolveCampaignAction(beat,null,{type:'CHOOSE',optionId:beat.key.optionId}),before=structuredClone(done);
  assert.deepEqual(resolveCampaignAction(beat,done.state,{type:'PICTURE_CUE_SHOWN'}),{state:done.state,outcome:{type:'ignored'}});assert.deepEqual(done,before);
});
