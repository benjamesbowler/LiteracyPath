import test from 'node:test';
import assert from 'node:assert/strict';
import { BrowserWorker } from '../helpers/campaignBrowserWorker.js';
import { runCampaignPersistenceWork, disposeCampaignPersistenceWorker } from '../../src/utils/campaignPersistenceWorker.js';
import { createCampaignAckTracker } from '../../src/utils/campaignDelta.js';
import { decodeProgressStorage } from '../../src/utils/progressStorageCodec.js';
import { normalizeCampaignProgress,beginCampaignMission,recordCampaignEvidence } from '../../src/features/soundSeekers/v3/engine/campaignProgress.js';

test('actual worker preserves independent retry revisions while the caller keeps running',async t=>{
  const previous=globalThis.Worker;globalThis.Worker=BrowserWorker;t.after(()=>{disposeCampaignPersistenceWorker();globalThis.Worker=previous;});
  const catalog={stages:[{id:'stage'}],missions:[{id:'mission',stageId:'stage'}]};
  const base=beginCampaignMission(normalizeCampaignProgress(null),'mission',{attemptId:'attempt',challenges:Array.from({length:4000},(_,i)=>({id:`beat-${i}`,view:{text:'A retained exact educational challenge',choices:['cat','cap','can']},key:{word:'cat'}})),beatState:{}},catalog,1);
  const answer=id=>recordCampaignEvidence(base,'mission',{id,attemptId:'attempt',targetIds:['gpc-a'],independent:true},catalog,2);
  const entry=payload=>({studentId:'A',area:'phonics_quest',key:'sound_seekers_v3',payload});
  let ticks=0;const timer=setInterval(()=>ticks++,1);t.after(()=>clearInterval(timer));
  const first=await runCampaignPersistenceWork({operation:'enqueue',records:[],incoming:entry(answer('left')),revision:'left'});
  const second=await runCampaignPersistenceWork({operation:'enqueue',records:first.writes,incoming:entry(answer('right')),revision:'right'});
  assert.ok(ticks>2,'worker jobs must allow caller event-loop progress');
  assert.equal(first.stored,true);assert.equal(second.stored,true);
  assert.equal(second.removed.length,1);
  const stored=decodeProgressStorage(second.writes[0][1]);assert.deepEqual(stored.payload.evidence.map(e=>e.id).sort(),['left','right']);assert.equal(stored.payload.campaign.checkpoints.mission.challenges.length,4000);
  const read=await runCampaignPersistenceWork({operation:'read',records:second.writes,identity:'A:phonics_quest:sound_seekers_v3'});
  assert.equal(read.current.payload.evidence.length,2);assert.equal(read.records.length,1);
  assert.equal(read.records[0].entry.payload,undefined,'deletion receipts need no second history clone');
});

test('ACK tracking only changes after explicit confirmed success and never crosses scope',()=>{
  const tracker=createCampaignAckTracker(),a=normalizeCampaignProgress(null),b={...a,updatedAt:2};
  assert.equal(tracker.prepare('A',a),a);assert.equal(tracker.prepare('A',b),b);
  tracker.acknowledge('A',a);assert.equal(tracker.prepare('A',b)._campaignDelta.v,1);
  assert.equal(tracker.prepare('B',b),b);tracker.forget('A');assert.equal(tracker.prepare('A',b),b);
  tracker.acknowledge('A',a);tracker.clear();assert.equal(tracker.prepare('A',b),b);
});
