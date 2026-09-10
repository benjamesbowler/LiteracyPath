import { campaignDeltaFromAck } from '../../src/utils/campaignDelta.js';
import { updateCampaignCheckpoint } from '../../src/features/soundSeekers/v3/engine/campaignProgress.js';
import { encodeCampaignTransport, decodeCampaignTransport } from '../../src/utils/campaignTransport.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeProgressStorage, decodeProgressStorage } from '../../src/utils/progressStorageCodec.js';
import { enqueueProgressQueueEntry, readProgressQueueRecords } from '../../src/utils/progressQueue.js';
import { createCampaignStorage, campaignStorageKey } from '../../src/features/soundSeekers/v3/campaignStorage.js';
import { normalizeCampaignProgress } from '../../src/features/soundSeekers/v3/engine/campaignProgress.js';
import { CAMPAIGN_VERSION, CAMPAIGN_MISSIONS, CAMPAIGN_STAGES } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { buildCampaignMission, createCampaignBeatState } from '../../src/features/soundSeekers/v3/engine/campaignChallenges.js';

function fullCampaign(copies = 1) {
  const catalog={version:CAMPAIGN_VERSION,stages:CAMPAIGN_STAGES,missions:CAMPAIGN_MISSIONS};
  const p=normalizeCampaignProgress(null,catalog);
  p.targets=Object.fromEntries(CAMPAIGN_MISSIONS.flatMap(m=>[...m.curriculum.targetIds,...(m.curriculum.minimumTaughtTargetIds||[])].map(id=>[id,{taught:true}])));
  const authoredBeatCount=CAMPAIGN_MISSIONS.reduce((n,m)=>n+buildCampaignMission(m,p).beats.length,0);
  let extraBudget=copies===1?0:Math.max(0,6000-authoredBeatCount);
  let count=0;
  for(const mission of CAMPAIGN_MISSIONS) {
    const beats=buildCampaignMission(mission,p).beats;
    for(let act=1;act<copies&&extraBudget>0;act++){const extra=buildCampaignMission(mission,p,{replayOrdinal:act}).beats.slice(0,extraBudget).map(beat=>({...beat,id:`${beat.id}:capacity-act-${act}`}));beats.push(...extra);extraBudget-=extra.length;}
    const attemptId=`capacity-${mission.id}`;
    p.campaign.checkpoints[mission.id]={missionId:mission.id,attemptId,contentVersion:1,challenges:beats,beatIndex:beats.length,
      beatState:{...createCampaignBeatState(beats.at(-1)),done:true},completed:true,replayOrdinal:0,startedAt:count,updatedAt:count+1000};
    p.campaign.completedMissions[mission.id]={attemptId,contentVersion:1,at:count+1000};
    p.campaign.startedAttemptIds[JSON.stringify([mission.id,attemptId])]=true;
    for(const beat of beats) {
      count++;
      if(!beat.key)continue;
      for(let i=0;i<(beat.view.items?.length||1);i++) {
        const id=`${beat.id}:${i}`;
        p.evidence.push({id,missionId:mission.id,attemptId,beatId:beat.id,mechanic:beat.mechanic,domain:beat.domain,targetIds:beat.targetIds,
          independent:false,supportUsed:['instructional-model'],kind:'practice',evidenceType:'formative',errors:1,at:count,journeyStep:count});
        p.campaign.attemptIds[JSON.stringify([mission.id,attemptId,id])]=true;
      }
    }
  }
  p.campaign.visitedStageIds=CAMPAIGN_STAGES.map(s=>s.id);p.campaign.activeMissionId=null;p.journeyStep=CAMPAIGN_MISSIONS.length;
  return {progress:JSON.parse(JSON.stringify(p)),beatCount:count};
}
function quotaStorage(limit=5*1024*1024) {
  const data=new Map();let peak=0;
  return {data,get peak(){return peak;},get length(){return data.size;},key:i=>[...data.keys()][i]??null,getItem:key=>data.get(key)??null,removeItem:key=>data.delete(key),
    setItem(key,value){const next=new Map(data);next.set(key,String(value));const bytes=[...next].reduce((n,[k,v])=>n+2*(k.length+v.length),0);if(bytes>limit)throw new Error('QuotaExceededError');data.set(key,String(value));peak=Math.max(peak,bytes);}};
}

for (const copies of [1,3]) test(`complete campaign ${copies === 1 ? 'current authored size' : '6000-beat capacity stress'} fits a 5MiB canonical/cache/atomic queue budget`, async t=>{
  const {progress,beatCount}=fullCampaign(copies),storage=quotaStorage();
  const raw=JSON.stringify(progress),encoded=encodeProgressStorage(progress);
  const transport=await encodeCampaignTransport(progress);assert.deepEqual(decodeCampaignTransport(transport),progress);
  const transportBytes=new TextEncoder().encode(JSON.stringify(transport)).length;
  assert.deepEqual(decodeProgressStorage(encoded),progress);
  assert.ok(encoded.startsWith('lp-progress-gzip-'));
  storage.setItem(campaignStorageKey('A'),encoded);
  const rows=[{area:'phonics_quest',key:'sound_seekers_v3',payload:progress}];
  storage.setItem('lp-cloud-progress-rows-v1',encodeProgressStorage({A:rows}));
  storage.setItem(campaignStorageKey('B'),JSON.stringify({v:3,campaign:{untouched:true}}));
  const incoming={studentId:'A',area:'phonics_quest',key:'sound_seekers_v3',payload:progress};
  assert.equal(enqueueProgressQueueEntry(storage,incoming,{revision:'first'}).stored,true);
  assert.equal(enqueueProgressQueueEntry(storage,incoming,{revision:'second'}).stored,true);
  const queued=readProgressQueueRecords(storage).filter(r=>r.entry.studentId==='A');assert.equal(queued.length,1);
  const ordered = events => [...events].sort((a,b)=>JSON.stringify([a.missionId,a.id]).localeCompare(JSON.stringify([b.missionId,b.id])));
  assert.deepEqual(ordered(queued[0].entry.payload.evidence),ordered(progress.evidence));
  assert.deepEqual(queued[0].entry.payload.campaign.checkpoints,progress.campaign.checkpoints);
  const adapter=createCampaignStorage({storage});
  const loadStart=performance.now();
  const loaded=adapter.loadCampaignProgress('A');const loadMs=performance.now()-loadStart;assert.equal(loaded.ok,true);
  assert.deepEqual(loaded.progress.evidence,progress.evidence);
  const saveStart=performance.now();
  assert.equal(adapter.saveCampaignProgress('A',loaded.progress).ok,true);
  const saveMs=performance.now()-saveStart;
  const current=adapter.loadCampaignProgress('A').progress;
  const positionStart=performance.now();
  assert.equal(adapter.saveCampaignProgress('A',current,{positionOnly:true}).ok,true);
  const positionSaveMs=performance.now()-positionStart;
  await adapter.disposeCampaignStorage('A');
  assert.equal(storage.getItem(campaignStorageKey('B')),JSON.stringify({v:3,campaign:{untouched:true}}));
  t.diagnostic(JSON.stringify({copies,loadMs,saveMs,positionSaveMs,missions:CAMPAIGN_MISSIONS.length,beatCount,evidenceCount:progress.evidence.length,rawUtf16Bytes:raw.length*2,compressedUtf16Bytes:encoded.length*2,transportBytes,peakCanonicalCacheAndAtomicQueueBytes:storage.peak}));
});

test('plain saves remain readable and corrupt compressed bytes never replace the original',async()=>{
  assert.deepEqual(decodeProgressStorage('{"v":3}'),{v:3});
  const p={v:3,campaign:{evidence:'word '.repeat(20000)}};
  const encoded=encodeProgressStorage(p,{force:true});
  assert.deepEqual(decodeProgressStorage(encoded),p);
  assert.equal(encodeProgressStorage(p,{force:true}),encoded);
  const offset=encoded.lastIndexOf(':')+1,bytes=Uint8Array.from(atob(encoded.slice(offset)),c=>c.charCodeAt(0));
  bytes[bytes.length-8]^=1;
  assert.throws(()=>decodeProgressStorage(encoded.slice(0,offset)+btoa(String.fromCharCode(...bytes))),/checksum/);
  assert.throws(()=>decodeProgressStorage(encoded.slice(0,-8)));
  assert.throws(()=>decodeProgressStorage('lp-progress-gzip-v1:9999999999:AAAA'));
  const storage=quotaStorage();storage.setItem(campaignStorageKey('A'),encoded.slice(0,-8));
  const adapter=createCampaignStorage({storage});assert.equal(adapter.loadCampaignProgress('A').status,'unreadable');
  assert.equal(adapter.saveCampaignProgress('A',normalizeCampaignProgress(null)).ok,false);
  assert.equal(storage.getItem(campaignStorageKey('A')),encoded.slice(0,-8));await adapter.disposeCampaignStorage('A');
});

test('late-game actual moving checkpoint uses a durable small write and sparse ACK upload',async t=>{
  const {progress}=fullCampaign(),id=CAMPAIGN_MISSIONS.at(-1).id;
  const cp=progress.campaign.checkpoints[id];cp.completed=false;cp.beatIndex=0;cp.beatState=createCampaignBeatState(cp.challenges[0]);progress.campaign.activeMissionId=id;
  const storage=quotaStorage();storage.setItem(campaignStorageKey('A'),encodeProgressStorage(progress));
  const adapter=createCampaignStorage({storage}),loaded=adapter.loadCampaignProgress('A').progress,base=storage.getItem(campaignStorageKey('A'));
  const start=performance.now();
  const next=updateCampaignCheckpoint(loaded,id,{attemptId:cp.attemptId,position:{v:1,x:100,y:80,vx:1,vy:0,facing:1,recoveries:0,lastCheckpointId:null},playTime:{v:1,estimatedActiveMs:1000,estimatedHelpMs:0}},100000);
  const saved=adapter.saveCampaignProgress('A',next,{positionOnly:true});const movementMs=performance.now()-start;
  assert.equal(saved.ok,true);assert.equal(storage.getItem(campaignStorageKey('A')),base);
  const reload=createCampaignStorage({storage}).loadCampaignProgress('A');assert.equal(reload.progress.campaign.checkpoints[id].position.x,100);assert.equal(reload.progress.campaign.checkpoints[id].playTime.estimatedActiveMs,1000);
  const actionStart=performance.now();
  const action=updateCampaignCheckpoint(saved.progress,id,{attemptId:cp.attemptId,beatState:{...saved.progress.campaign.checkpoints[id].beatState,errors:1,supportUsed:['text-help'],modelShown:true}},100001);
  const actionSaved=adapter.saveCampaignProgress('A',action);const actionSaveMs=performance.now()-actionStart;
  assert.equal(actionSaved.ok,true);assert.equal(storage.getItem(campaignStorageKey('A')),base);
  const restored=createCampaignStorage({storage}).loadCampaignProgress('A');assert.equal(restored.ok,true);assert.equal(restored.progress.campaign.checkpoints[id].beatState.errors,1);
  const deltaStart=performance.now(),delta=await encodeCampaignTransport(campaignDeltaFromAck(saved.progress,loaded)),deltaMs=performance.now()-deltaStart;
  const deltaBytes=new TextEncoder().encode(JSON.stringify(delta)).length;
  assert.equal(delta.evidence.length,0);assert.equal(Object.keys(delta.campaign.checkpoints).length,1);assert.ok(deltaBytes<50000);
  const queueStart=performance.now();enqueueProgressQueueEntry(storage,{studentId:'A',area:'phonics_quest',key:'sound_seekers_v3',payload:actionSaved.progress},{revision:'measured'});const queueMs=performance.now()-queueStart;
  const secondQueueStart=performance.now();enqueueProgressQueueEntry(storage,{studentId:'A',area:'phonics_quest',key:'sound_seekers_v3',payload:actionSaved.progress},{revision:'measured-2'});const secondQueueMs=performance.now()-secondQueueStart;
  t.diagnostic(JSON.stringify({movementMs,actionSaveMs,queueMs,secondQueueMs,deltaMs,deltaBytes,positionHourlyBytesAt30Seconds:deltaBytes*120,positionJournalBytes:(storage.getItem(campaignStorageKey('A')+':position-v1')||'').length*2,liveJournalBytes:(storage.getItem(campaignStorageKey('A')+':live-v1')||'').length*2}));
  await adapter.disposeCampaignStorage('A');
});
