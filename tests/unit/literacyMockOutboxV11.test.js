import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLiteracyMockBank, scoreLiteracyMockResponse } from '../../src/data/literacyMockBank.js';
import { selectLiteracyMockPlan, adaptLiteracyMockPlan, sameLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';
import { createMockOutbox, appendMockOutbox, prepareMockDelivery, acknowledgeMockOutbox, readMockOutbox, writeMockOutbox, projectMockMutation, verifyMockOutboxReceipt } from '../../src/utils/literacyMockOutbox.js';

const disk = () => { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key,value) => values.set(key,String(value)), removeItem: key => values.delete(key) }; };
const identity = row => ({ questionId: row.questionId, responseStatus: row.responseStatus, selected: row.selected ?? null });
const snapshot = row => row.itemSnapshot?.itemSnapshot || row.itemSnapshot;
const bytes = value => Buffer.byteLength(JSON.stringify(value));
const limit = 3 * 1024 * 1024;
const bank = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v11' });
const byId = new Map(bank.map(item => [item.id,item]));
const projection = request => {
  const item = byId.get(request.questionId || request.response?.questionId);
  return { item, isCorrect: request.response ? scoreLiteracyMockResponse(item,request.response.selected) : undefined, occurredAt: '2026-10-20T03:00:00Z' };
};
function queuedSitting(storage) {
  const sessionId = '44000000-0000-4000-8000-000000000111', studentId = '33000000-0000-4000-8000-000000000111';
  let mediaItemIds = [];
  const plan = selectLiteracyMockPlan(bank,{sessionId,studentId,onOfflineItems:ids=>{mediaItemIds=ids;}});
  const offline = bank.filter(item=>mediaItemIds.includes(item.id));
  const run = { schemaVersion:2,studentId,assignmentId:sessionId,contentVersion:'literacy-mock-v11',revision:1,eventRevision:0,
    plan,presentations:[],helpRequests:[],responses:[],mediaFailures:[],status:'running',offlineLeaseId:'lease-v11' };
  let box = createMockOutbox({ studentId,sessionId,run,mediaItemIds,mock:{state:'running'},focusSession:{id:sessionId,status:'active'} });
  while(box.run.responses.length < box.run.plan.itemIds.length) {
    const index=box.run.responses.length,item=byId.get(box.run.plan.itemIds[index]);
    box=appendMockOutbox(box,{type:'event',requestId:`show-${index}`,questionId:item.id,event:'presented'},projection({questionId:item.id}),storage);
    const response={questionId:item.id,selected:item.answer,responseStatus:'answered',supportUsed:false,knownFamiliar:false,
      audioDelivery:Object.fromEntries(item.requiredAudioPaths.map(path=>[path,'completed']))};
    box=appendMockOutbox(box,{requestId:`answer-${index}`,expectedRevision:box.run.revision,plan:null,response},projection({response}),storage);
    const next=adaptLiteracyMockPlan(offline,box.run.plan,box.run.responses,[],box.run.presentations);
    if(!sameLiteracyMockPlan(next,box.run.plan))box=appendMockOutbox(box,{requestId:`adapt-${index}`,expectedRevision:box.run.revision,plan:next,response:null},{},storage);
  }
  assert.equal(box.run.responses.length,108);
  return box;
}
// Simulate canonical receipts from the same public projection contract, then
// retain one full published snapshot per row as the database does. The test
// never treats a compact watermark as the canonical saved run.
function canonicalReceipt(box,sent) {
  let run=structuredClone(box.serverRun);
  for(const request of sent.requests)run=projectMockMutation(run,request,projection(request));
  for(const row of [...run.responses,...(run.presentations || []),...(run.mediaFailures || [])]) {
    row.itemSnapshot=structuredClone(byId.get(row.questionId).itemSnapshot);
    delete row.localOnly;
    row.serverReceivedAt='2026-10-20T03:01:00Z';
  }
  return {ok:true,batchId:sent.batchId,run,mock:box.mock,acknowledged:sent.requests.map(request=>request.requestId)};
}

test('a real 108-answer V11 queue retains full evidence while compact deliveries survive every prefix, reload and receipt',t=>{
  const storage=disk();let box=queuedSitting(storage),deliveries=0,largestBox=bytes(box),largestDelivery=0;
  const expected=box.run.responses.map(identity);
  while(box.requests.length) {
    const evidence=JSON.stringify(box.run);
    box=prepareMockDelivery(box,{batchId:`long-v11-${++deliveries}`,collectionId:'collect-v11'},storage);
    assert.equal(JSON.stringify(box.run),evidence,'Preparing a delivery must not compact or mutate the durable live evidence');
    const restored=readMockOutbox(box.studentId,box.sessionId,storage);
    assert.equal(JSON.stringify(restored),JSON.stringify(box),'The exact pending delivery and all evidence survive a reload');
    assert.deepEqual(prepareMockDelivery(restored,{batchId:'new-id-must-not-replace-old'},storage),restored,'An uncertain delivery keeps its original owner and request ID');
    const sent=restored.delivery.sent;
    assert.deepEqual(Object.keys(sent.run).sort(),['contentVersion','eventRevision','plan','responses','revision'].sort());
    assert.deepEqual(Object.keys(sent.run.plan),['seed']);
    assert.ok(sent.run.responses.every(row=>Object.keys(row).every(key=>['questionId','responseStatus','selected'].includes(key))));
    largestDelivery=Math.max(largestDelivery,bytes(sent));largestBox=Math.max(largestBox,bytes(restored));
    assert.ok(bytes(restored)<=limit,'The unchanged 3 MiB admission bound accommodates the delivery');
    const result=canonicalReceipt(restored,sent);
    verifyMockOutboxReceipt(result,sent);
    for(const mutate of [
      value=>{value.run.studentId='another-child';},
      value=>{value.run.assignmentId='another-session';},
      value=>{value.run.contentVersion='literacy-mock-v10';},
      value=>{value.run.plan.seed='different-seed';},
      value=>{value.acknowledged.pop();},
      value=>{value.run.responses[0].selected='changed-answer';},
      value=>{value.run.responses[0].questionId='changed-question';},
      value=>{value.run.responses[0].responseStatus='skipped';},
      value=>{value.run.responses.pop();},
      value=>{value.run.revision=sent.run.revision-1;},
      value=>{value.run.eventRevision=sent.run.eventRevision-1;},
      value=>{value.run.presentations=[];},
    ]) {
      const bad=structuredClone(result);mutate(bad);
      assert.throws(()=>acknowledgeMockOutbox(restored,sent,bad,projection,storage),/receipt is incomplete/);
      assert.deepEqual(readMockOutbox(box.studentId,box.sessionId,storage),restored,'An invalid receipt cannot discard any queued work');
    }
    const arrayAnswer=sent.run.responses.findIndex(row=>Array.isArray(row.selected));
    if(arrayAnswer>=0) {
      const bad=structuredClone(result);bad.run.responses[arrayAnswer].selected.pop();
      assert.throws(()=>acknowledgeMockOutbox(restored,sent,bad,projection,storage),/receipt is incomplete/);
      assert.deepEqual(readMockOutbox(box.studentId,box.sessionId,storage),restored);
    }
    box=acknowledgeMockOutbox(restored,sent,result,projection,storage);
    assert.deepEqual(box.run.responses.map(identity),expected);
    for(const row of [...box.run.responses,...box.run.presentations])assert.equal(JSON.stringify(snapshot(row)),JSON.stringify(byId.get(row.questionId).itemSnapshot),'Every local or confirmed event retains its full immutable published evidence');
    box=readMockOutbox(box.studentId,box.sessionId,storage);
    assert.ok(box);largestBox=Math.max(largestBox,bytes(box));
  }
  assert.equal(box.run.status,'completed');assert.equal(box.serverRun.status,'completed');
  assert.equal(box.run.responses.length,108);assert.equal(box.serverRun.responses.length,108);
  assert.deepEqual(box.serverRun.responses.map(identity),expected);
  assert.ok(largestBox<=limit);assert.ok(largestDelivery<32*1024);
  t.diagnostic(JSON.stringify({answers:108,deliveries,largestOutboxBytes:largestBox,largestSentBytes:largestDelivery,unchangedAdmissionLimit:limit}));
});


test('delivery compaction retains the existing 3 MiB storage refusal and leaves the prior durable record intact',()=>{
  const storage=disk();
  const run={studentId:'bounded-child',assignmentId:'bounded-session',contentVersion:'literacy-mock-v11',revision:1,eventRevision:0,
    plan:{seed:'bounded',itemIds:['q']},responses:[],presentations:[],status:'running'};
  const box=createMockOutbox({studentId:run.studentId,sessionId:run.assignmentId,run,mock:{state:'running'},focusSession:{id:run.assignmentId}});
  assert.equal(writeMockOutbox(box,storage),true);
  const oversized=structuredClone(box);
  oversized.run.presentations.push({questionId:'q',itemSnapshot:{id:'q',passage:'x'.repeat(limit)}});
  assert.ok(bytes(oversized)>limit);
  assert.equal(writeMockOutbox(oversized,storage),false);
  assert.deepEqual(readMockOutbox(box.studentId,box.sessionId,storage),box,'A refused oversized record cannot overwrite the last saved sitting');
});
