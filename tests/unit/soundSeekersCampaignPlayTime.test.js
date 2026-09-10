import test from 'node:test';
import assert from 'node:assert/strict';
import { createCampaignPlayClock, advanceCampaignPlayClock, campaignPlayTimeSnapshot, summarizeCampaignPlayTime } from '../../src/features/soundSeekers/v3/engine/campaignPlayTime.js';
import { normalizeCampaignProgress, beginCampaignMission, updateCampaignCheckpoint, completeCampaignMission, restartCampaignMission, mergeCampaignProgress } from '../../src/features/soundSeekers/v3/engine/campaignProgress.js';
const catalog = { version: 1, stages: [{id:'stage'}], missions:[{id:'mission',stageId:'stage',outcome:{repairId:'repair'}}] };
const tick = (clock, nowMs, flags = {}) => advanceCampaignPlayClock(clock, {nowMs,...flags});

test('estimated timer excludes paused, hidden, loading, idle and unobserved time without retroactive catchup', () => {
  let c = createCampaignPlayClock({},0);
  c=tick(c,0,{activity:true});
  for(let t=1000;t<=31000;t+=1000)c=tick(c,t);
  assert.equal(c.estimatedActiveMs,30000);
  c=tick(c,32000,{activity:true});assert.equal(c.estimatedActiveMs,30000);
  c=tick(c,33000);assert.equal(c.estimatedActiveMs,31000);
  for(const flag of ['paused','hidden','loading']) {
    c=tick(c,c.lastTickMs+1000,{[flag]:true});
    c=tick(c,c.lastTickMs+1000,{activity:true});
  }
  assert.equal(c.estimatedActiveMs,31000);
  c=tick(c,c.lastTickMs+5000,{activity:true});assert.equal(c.estimatedActiveMs,31000);
  assert.deepEqual(tick(c,c.lastTickMs-1),c);
  assert.deepEqual(tick(c,NaN),c);
  assert.deepEqual(Object.keys(campaignPlayTimeSnapshot(c)),['v','estimatedActiveMs','estimatedHelpMs']);
});

test('help use is a subset of active play and hidden help never counts', () => {
  let c=createCampaignPlayClock({},0);
  c=tick(c,0,{helpOpen:true,paused:true,activity:true});
  c=tick(c,500,{helpOpen:true,paused:true});
  c=tick(c,1000,{helpOpen:true,hidden:true});
  assert.deepEqual(campaignPlayTimeSnapshot(c),{v:1,estimatedActiveMs:500,estimatedHelpMs:500});
});

test('same attempt duration merges by maximum and first completion stays separate from replay', () => {
  let p=beginCampaignMission(normalizeCampaignProgress(null,catalog),'mission',{attemptId:'first',challenges:[{id:'beat'}],beatState:{}},catalog,0);
  p=updateCampaignCheckpoint(p,'mission',{attemptId:'first',playTime:{v:1,estimatedActiveMs:800,estimatedHelpMs:200}},1);
  const stale=updateCampaignCheckpoint(p,'mission',{attemptId:'first',playTime:{v:1,estimatedActiveMs:400,estimatedHelpMs:0}},2);
  const merged=mergeCampaignProgress({scopeKey:'A',progress:p},{scopeKey:'A',progress:stale},catalog).progress;
  assert.equal(merged.campaign.checkpoints.mission.playTime.estimatedActiveMs,800);
  p=completeCampaignMission(updateCampaignCheckpoint(merged,'mission',{attemptId:'first',beatIndex:1,beatState:{done:true}},3),'mission',catalog,4);
  const completion=structuredClone(p.campaign.completedMissions.mission);
  p=restartCampaignMission(p,'mission',{attemptId:'replay',challenges:[{id:'replay-beat'}],beatState:{}},catalog,5);
  assert.equal(p.campaign.checkpoints.mission.playTime.estimatedActiveMs,0);
  p=updateCampaignCheckpoint(p,'mission',{attemptId:'replay',playTime:{v:1,estimatedActiveMs:300,estimatedHelpMs:0}},6);
  assert.deepEqual(p.campaign.completedMissions.mission,completion);
  assert.deepEqual(summarizeCampaignPlayTime(p),{metric:'estimated-active-play',completedFirstPlayMs:800,unfinishedFirstPlayMs:0,retainedReplayActiveMs:300,estimatedHelpMs:200,completedMissionsWithoutTiming:0});
  const resumed=createCampaignPlayClock(p.campaign.checkpoints.mission.playTime,100000);
  assert.equal(tick(resumed,100500).estimatedActiveMs,300);
});

test('real paused scene motion cannot renew activity forever; completion timing survives local save and reload', async () => {
  const { CAMPAIGN_MISSIONS, CAMPAIGN_STAGES, CAMPAIGN_VERSION, getCampaignStage } = await import('../../src/features/soundSeekers/v3/content/campaign.js');
  const { buildCampaignMission, createCampaignBeatState } = await import('../../src/features/soundSeekers/v3/engine/campaignChallenges.js');
  const { publicBeat } = await import('../../src/features/soundSeekers/v3/engine/challenges.js');
  const { createCampaignWorldScene } = await import('../../src/features/soundSeekers/v3/render/campaignWorldScene.js');
  const { createCampaignStorage } = await import('../../src/features/soundSeekers/v3/campaignStorage.js');
  const mission = CAMPAIGN_MISSIONS.find(item => item.familyId === 'fix-it-workshop');
  const taught = {targets:Object.fromEntries(CAMPAIGN_MISSIONS.flatMap(item=>[...item.curriculum.targetIds,...(item.curriculum.minimumTaughtTargetIds||[])].map(id=>[id,{taught:true}])))};
  const beat = buildCampaignMission(mission,taught).beats.find(item=>item.mechanic==='word_forge');
  const actualCatalog={version:CAMPAIGN_VERSION,stages:CAMPAIGN_STAGES,missions:CAMPAIGN_MISSIONS};
  const base={stage:getCampaignStage(mission.stageId),mission,beats:[publicBeat(beat)],heroId:'speedy',progress:{campaign:{completedMissions:{}}},beatState:createCampaignBeatState(beat)};
  const preview=createCampaignWorldScene(base),object=preview.getObjects()[0];preview.dispose();
  const scene=createCampaignWorldScene({...base,position:{v:1,x:object.x,y:object.y,vx:0,vy:0,facing:1,recoveries:0,lastCheckpointId:null}});
  scene.activate(object.id);for(let i=0;i<600&&!scene.debug().motion;i++)scene.update(1/60);assert.ok(scene.debug().motion);scene.release();
  let clock=createCampaignPlayClock({},0);
  clock=tick(clock,0,{paused:true,helpOpen:true,activity:scene.consumeActivity({includeMotion:false})});
  for(let now=1000;now<=45000;now+=1000)clock=tick(clock,now,{paused:true,helpOpen:true,activity:scene.consumeActivity({includeMotion:false})});
  assert.deepEqual(campaignPlayTimeSnapshot(clock),{v:1,estimatedActiveMs:30000,estimatedHelpMs:30000});
  scene.dispose();
  let p=normalizeCampaignProgress(null,actualCatalog);
  // Fixture starts after this mission's real prerequisite repairs.
  for(const id of mission.prerequisiteMissionIds)p.campaign.completedMissions[id]={at:0,attemptId:`prerequisite-${id}`};
  for(const id of getCampaignStage(mission.stageId).prerequisiteMissionIds)p.campaign.completedMissions[id]={at:0,attemptId:`prerequisite-${id}`};
  p=beginCampaignMission(p,mission.id,{attemptId:'timed',challenges:[beat],beatState:createCampaignBeatState(beat)},actualCatalog,1);
  assert.ok(p.campaign.checkpoints[mission.id]);
  p=updateCampaignCheckpoint(p,mission.id,{attemptId:'timed',beatIndex:1,beatState:{...createCampaignBeatState(beat),done:true},playTime:campaignPlayTimeSnapshot(clock)},2);
  p=completeCampaignMission(p,mission.id,actualCatalog,3);
  const data=new Map(),adapter=createCampaignStorage({storage:{getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)}});
  assert.equal(adapter.saveCampaignProgress('default',p).ok,true);await adapter.disposeCampaignStorage('default');
  const restored=adapter.loadCampaignProgress('default').progress;
  assert.deepEqual(restored.campaign.completedMissions[mission.id].playTime,campaignPlayTimeSnapshot(clock));
  await adapter.disposeCampaignStorage('default');
});
