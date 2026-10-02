import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { QUEST_STOPS } from '../../src/data/questSequence.js';
import { CAMPAIGN_MISSIONS } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { buildCampaignMission, campaignUnitTarget, createCampaignBeatState, refreshCampaignTeaching, resolveCampaignAction } from '../../src/features/soundSeekers/v3/engine/campaignChallenges.js';
import { DOMAINS, MECHANICS, publicBeat } from '../../src/features/soundSeekers/v3/engine/challenges.js';
import { isSoundDistinct, soundClass, targetAudio, targetInfo, unitsFor } from '../../src/features/soundSeekers/v3/engine/lexicon.js';
import { ROUND_CAMPAIGN, currentCampaignCheckpoint, judgeRoundedAction, startRoundedMission } from '../../src/features/soundSeekers/rounded/campaignController.js';
import { normalizeCampaignProgress, beginCampaignMission, recordCampaignEvidence } from '../../src/features/soundSeekers/v3/engine/campaignProgress.js';
import { createCampaignStorage, validateCampaignSavedProgress } from '../../src/features/soundSeekers/v3/campaignStorage.js';

const mission=id=>CAMPAIGN_MISSIONS.find(item=>item.id===id);
const taught=ids=>({targets:Object.fromEntries(ids.map(id=>[id,{taught:true}]))});
const phoneme=key=>soundClass(String(key).replace(/^short_/,''));
const audioHashes=new Map();
function recording(src){
 assert.ok(src.startsWith('/audio/'),src);
 if(!audioHashes.has(src))audioHashes.set(src,createHash('sha256').update(readFileSync(new URL(`../../public${src}`,import.meta.url))).digest('hex'));
 return audioHashes.get(src);
}
function correctActions(beat){
 if([MECHANICS.WORD_FORGE,'sentence_build'].includes(beat.mechanic))return beat.key.sequence.map(tileId=>({type:'PLACE_TILE',tileId}));
 if(beat.mechanic===MECHANICS.SOUND_SORT)return beat.view.items.map(item=>({type:'PLACE',itemId:item.id,binId:beat.key.bins[item.id]}));
 return [{type:'CHOOSE',optionId:beat.key.optionId,choiceId:beat.key.choiceId}];
}
function wrongActions(beat,state){
 if([MECHANICS.WORD_FORGE,'sentence_build'].includes(beat.mechanic)){
  const expected=beat.view.tiles.find(tile=>tile.id===beat.key.sequence[state.placed.length]);
  return beat.view.tiles.filter(tile=>!state.placed.includes(tile.id)&&tile.grapheme!==expected.grapheme).map(tile=>({type:'PLACE_TILE',tileId:tile.id}));
 }
 if(beat.mechanic===MECHANICS.SOUND_SORT){
  const item=beat.view.items[state.itemIndex];
  return beat.view.bins.filter(bin=>bin.id!==beat.key.bins[item.id]).map(bin=>({type:'PLACE',itemId:item.id,binId:bin.id}));
 }
 const choices=beat.view.options||beat.view.choices;
 return choices.filter(choice=>choice.id!==(beat.key.optionId||beat.key.choiceId)).map(choice=>({type:'CHOOSE',optionId:choice.id,choiceId:choice.id}));
}

test('Bubble clearing offers four recorded oral contrasts, and only genuinely introduced printed code',()=>{
 const m=mission('meadow-01-2');
 for(const [progress,printedCount] of [[{},2],[taught(['a','m']),3],[taught(['a']),3]]){
  for(const beat of buildCampaignMission(m,progress).beats.filter(beat=>beat.key)){
   const ids=Object.values(beat.key.optionTargets);
   if(beat.domain===DOMAINS.G2P){
    assert.equal(ids.length,4);assert.deepEqual(new Set(ids),new Set(['a','m','t','s']));
    assert.ok(beat.view.options.every(option=>option.grapheme===''&&option.soundLabel===''));
    assert.equal(beat.view.target.audio,'');
    assert.equal(new Set(beat.view.options.map(option=>recording(option.audio))).size,4);
    for(const option of beat.view.options)assert.equal(option.audio,targetAudio(beat.key.optionTargets[option.id]));
   }else{
    assert.equal(ids.length,printedCount);
    assert.ok(ids.every(id=>['t','s'].includes(id)||progress.targets?.[id]?.taught));
    assert.ok(!beat.prompt.cues.some(cue=>cue.text));
   }
   assert.equal(Object.hasOwn(publicBeat(beat),'key'),false);
   for(const a of ids)for(const b of ids)if(a!==b)assert.ok(isSoundDistinct(a,b));
  }
 }
});

test('oral and eligible printed key positions vary for each taught target while replay seeds remain deterministic',()=>{
 const positions=new Map(['a','m','t','s'].map(id=>[id,new Set()]));
 const printed=new Map(['a','m','t','s'].map(id=>[id,new Set()]));
 for(let replayOrdinal=0;replayOrdinal<32;replayOrdinal++)for(const id of ['meadow-01-1','meadow-01-2']){
  const m=mission(id),pack=buildCampaignMission(m,{}, {replayOrdinal});
  assert.deepEqual(pack,buildCampaignMission(m,{}, {replayOrdinal}));
  for(const beat of pack.beats.filter(beat=>beat.domain===DOMAINS.G2P))positions.get(beat.key.optionTargets[beat.key.optionId]).add(beat.view.options.findIndex(option=>option.id===beat.key.optionId));
  const eligible=buildCampaignMission(m,id==='meadow-01-2'?taught(['a','m']):{}, {replayOrdinal});
  for(const beat of eligible.beats.filter(beat=>beat.domain===DOMAINS.P2G))printed.get(beat.key.optionTargets[beat.key.optionId]).add(beat.view.options.findIndex(option=>option.id===beat.key.optionId));
 }
 for(const [id,found]of positions)assert.deepEqual(found,new Set([0,1,2,3]),id);
 for(const [id,found]of printed)assert.deepEqual(found,new Set(['a','m'].includes(id)?[0,1]:[0,1,2]),id);
});

test('later word banks use three distinct recorded taught contrasts without inventing split-vowel tiles',()=>{
 const p=taught(['a','m','t','s','n','i','f','d','h','o','l','r']);
 const beats=buildCampaignMission(mission('meadow-03-2'),p).beats.filter(beat=>beat.mechanic===MECHANICS.WORD_FORGE);
 assert.ok(beats.length);
 for(const beat of beats){
  const foils=beat.view.tiles.filter(tile=>!beat.key.sequence.includes(tile.id));
  assert.equal(foils.length,3,beat.key.word);
  assert.equal(new Set(foils.map(tile=>phoneme(beat.key.tileSounds[tile.id]))).size,3);
  assert.ok(foils.every(tile=>p.targets[tile.grapheme]?.taught));
  for(const tile of foils){recording(tile.audio);assert.ok(!unitsFor(beat.key.word).some(unit=>phoneme(unit.soundKey)===phoneme(beat.key.tileSounds[tile.id])));}
 }
 const first=buildCampaignMission(mission('meadow-01-3'),taught(['a','m','t','s']));
 assert.ok(first.beats.every(beat=>beat.view.tiles.length===4),'three required pieces and the only valid taught foil');
});

test('all 210 packs across three sequential replays have valid recorded contrasts, hidden keys and correct/wrong authority',t=>{
 const progress=taught([]),counts={packs:0,beats:0,decisions:0,wordFoils:0,oralFour:0,rejectedChoices:0};
 for(const m of CAMPAIGN_MISSIONS){
  const introduced=new Set([...Object.keys(progress.targets),...(m.curriculum.mode==='teach'?m.curriculum.targetIds:[])]);
  for(const replayOrdinal of [0,1,2]){
   const pack=buildCampaignMission(m,progress,{replayOrdinal});counts.packs++;
   assert.equal(new Set(pack.beats.map(beat=>beat.id)).size,pack.beats.length,m.id);
   for(const beat of pack.beats){
    counts.beats++;assert.equal(Object.hasOwn(publicBeat(beat),'key'),false,beat.id);
    if(!beat.key)continue;
    const before=structuredClone(beat);
    if(beat.mechanic===MECHANICS.ECHO_HUNT){
     const ids=Object.values(beat.key.optionTargets);
     assert.equal(ids.length,beat.view.options.length);
     assert.equal(new Set(beat.view.options.map(option=>recording(option.audio))).size,ids.length,beat.id);
     for(const a of ids)for(const b of ids)if(a!==b)assert.ok(isSoundDistinct(a,b),beat.id);
     if(beat.domain===DOMAINS.G2P){counts.oralFour++;assert.equal(ids.length,4);assert.ok(beat.view.options.every(option=>!option.grapheme&&!option.soundLabel));}
     else assert.ok(ids.every(id=>introduced.has(id)),beat.id);
    }
    if(beat.mechanic===MECHANICS.WORD_FORGE){
     const required=new Set(beat.key.sequence),foils=beat.view.tiles.filter(tile=>!required.has(tile.id));
     assert.ok(foils.length<=3,beat.id);counts.wordFoils+=foils.length;
     assert.ok(unitsFor(beat.key.word).every(unit=>introduced.has(campaignUnitTarget(unit))),beat.id);
     const units=unitsFor(beat.key.word);
     const used=new Set((beat.view.workshop?.mode==='replace'?[units[beat.view.workshop.slotIndex]]:units).map(unit=>phoneme(unit.soundKey)));
     for(const tile of beat.view.tiles)recording(tile.audio);
     for(const tile of foils){
      const original=beat.view.workshop?.mode==='replace'?unitsFor(beat.view.workshop.baseWord)[beat.view.workshop.slotIndex]:null;
      const originalIsTaught=original&&original.grapheme===tile.grapheme&&phoneme(original.soundKey)===phoneme(beat.key.tileSounds[tile.id])&&introduced.has(campaignUnitTarget(original));
      assert.ok(originalIsTaught||[...introduced].some(id=>{const info=targetInfo(id);return info?.grapheme===tile.grapheme&&phoneme(info.soundKey)===phoneme(beat.key.tileSounds[tile.id]);}),`${beat.id}: ${tile.grapheme}`);
      assert.ok(originalIsTaught||!tile.grapheme.includes('_'),beat.id);
      assert.ok(!used.has(phoneme(beat.key.tileSounds[tile.id])),beat.id);
     }
     assert.equal(new Set(foils.map(tile=>phoneme(beat.key.tileSounds[tile.id]))).size,foils.length,beat.id);
     if(beat.view.workshop?.mode==='replace')assert.ok(beat.view.tiles.length<=4,beat.id);
    }
    if(beat.domain==='auditory_word_recognition'){
     const signatures=beat.view.choices.map(choice=>unitsFor(choice.label).map(unit=>phoneme(unit.soundKey)).join('|'));
     assert.equal(new Set(signatures).size,signatures.length,beat.id);
     assert.ok(beat.view.choices.length>=2&&beat.view.choices.length<=3,beat.id);
     for(const choice of beat.view.choices)assert.ok(unitsFor(choice.label).every(unit=>introduced.has(campaignUnitTarget(unit))),beat.id);
    }
    let fresh=createCampaignBeatState(beat),last;
    for(const action of correctActions(beat)){const result=resolveCampaignAction(beat,fresh,action);assert.notEqual(result.outcome.type,'incorrect',beat.id);fresh=result.state;last=result.outcome;counts.decisions++;}
    assert.equal(fresh.done,true,beat.id);assert.ok(last.evidence,beat.id);
    let retry=createCampaignBeatState(beat);
    const wrong=wrongActions(beat,retry);
    for(const action of wrong){
     const result=resolveCampaignAction(beat,createCampaignBeatState(beat),action);
     assert.equal(result.outcome.type,'incorrect',beat.id);assert.equal(result.state.done,false,beat.id);counts.rejectedChoices++;
    }
    if(wrong.length){
     retry=resolveCampaignAction(beat,retry,wrong[0]).state;
     for(const action of correctActions(beat)){const result=resolveCampaignAction(beat,retry,action);retry=result.state;last=result.outcome;}
     assert.equal(retry.done,true,beat.id);
     if(beat.mechanic!==MECHANICS.SOUND_SORT)assert.equal(last.evidence.independent,false,beat.id);
     else assert.equal(retry.events[0].independent,false,beat.id);
    }
    assert.deepEqual(beat,before,'judging never mutates authored questions');
   }
  }
  if(m.curriculum.mode==='teach')for(const id of m.curriculum.targetIds)progress.targets[id]={taught:true};
 }
 assert.equal(counts.packs,630);assert.equal(counts.oralFour,12);assert.ok(counts.wordFoils>1000);assert.ok(counts.decisions>9000);
 assert.deepEqual(new Set(Object.keys(progress.targets)),new Set(QUEST_STOPS.flatMap(stop=>stop.teach.map(target=>target.id))),'more options never introduce extra taught targets');
 t.diagnostic(JSON.stringify({...counts,distinctCommittedRecordings:audioHashes.size}));
});

test('a legacy two-choice unfinished round retains its exact order, key, mistakes and evidence through refresh/storage/resume',async()=>{
 const m=mission('meadow-01-2');
 const beat=structuredClone(buildCampaignMission(m).beats.find(beat=>beat.domain===DOMAINS.G2P&&beat.view.target.grapheme==='s'));
 // A historical checkpoint owns its two original option IDs, not a new pool.
 const retained=['t','s'].map((targetId,i)=>({id:`opt${i}`,grapheme:'',audio:targetAudio(targetId),soundLabel:''}));
 beat.view.options=retained;beat.key={optionId:'opt1',optionTargets:{opt0:'t',opt1:'s'}};
 const bad=retained.find(option=>option.id!==beat.key.optionId);
 const state=resolveCampaignAction(beat,null,{type:'CHOOSE',optionId:bad.id}).state;
 let p=normalizeCampaignProgress(null,ROUND_CAMPAIGN);
 p=beginCampaignMission(p,m.id,{attemptId:'legacy-two',challenges:[beat],beatState:state},ROUND_CAMPAIGN,1);
 p=recordCampaignEvidence(p,m.id,{id:'earlier',attemptId:'legacy-two',targetIds:['t'],independent:false,errors:1},ROUND_CAMPAIGN,2);
 const before=structuredClone(p);
 const data=new Map(),storage={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};
 const service=createCampaignStorage({storage,localOnly:true});
 const saved=service.saveCampaignProgress('legacy-choice',p);assert.equal(saved.ok,true);
 const restored=service.loadCampaignProgress('legacy-choice').progress;validateCampaignSavedProgress(restored);
 const resumed=startRoundedMission(restored,m.id,{attemptId:'would-reroll',now:3});
 const cp=currentCampaignCheckpoint(resumed);
 assert.equal(cp.attemptId,'legacy-two');assert.deepEqual(cp.challenges,before.campaign.checkpoints[m.id].challenges);
 assert.deepEqual(cp.beatState,state);assert.deepEqual(resumed.evidence,before.evidence);
 const refreshed=refreshCampaignTeaching(cp.challenges)[0];assert.deepEqual(refreshed.view,beat.view);assert.deepEqual(refreshed.key,beat.key);
 const result=judgeRoundedAction(resumed,{type:'CHOOSE',optionId:beat.key.optionId},4);
 assert.equal(result.outcome.type,'correct');assert.equal(result.outcome.evidence.independent,false);
 assert.equal(result.progress.evidence.length,before.evidence.length+1);assert.deepEqual(result.progress.evidence[0],before.evidence[0]);
 assert.equal(result.progress.campaign.checkpoints[m.id].challenges[0].view.options.length,2);
 await service.disposeCampaignStorage('legacy-choice');
});
