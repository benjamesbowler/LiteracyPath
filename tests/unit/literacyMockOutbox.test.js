import test from 'node:test';
import assert from 'node:assert/strict';
import { createMockOutbox, readMockOutbox, writeMockOutbox, appendMockOutbox, verifyMockOutboxReceipt, acknowledgeMockOutbox, readCachedMockFocus } from '../../src/utils/literacyMockOutbox.js';
import { clearLearnerAssessmentDrafts } from '../../src/utils/assessmentDraftStorage.js';
const storage = () => { const data = new Map(); return { get length(){return data.size;}, key:index=>[...data.keys()][index], getItem:key=>data.get(key)??null, setItem:(key,value)=>data.set(key,String(value)), removeItem:key=>data.delete(key) }; };
const item = { id:'q1',skillId:'rhyming',domainId:'sound_awareness',level:1,prompt:'Choose.' };
const initial = () => createMockOutbox({ studentId:'outbox-child',sessionId:'assignment',run:{studentId:'outbox-child',assignmentId:'assignment',contentVersion:'literacy-mock-v4',revision:1,eventRevision:0,plan:{seed:'seed',itemIds:['q1','q2']},responses:[],status:'running'}, mock:{state:'running',capabilities:{offlineDelivery:true}}, focusSession:{id:'assignment',status:'active',expires_at:'2026-10-14T06:00:00Z',target:'progress_check',token:'must-not-be-cached'} });
const response = { requestId:'answer-1',expectedRevision:1,response:{questionId:'q1',selected:'c1',responseStatus:'answered',audioDelivery:{'/audio/cue.mp3':'completed'}},plan:null };
const options = { item,isCorrect:true,occurredAt:'2026-10-14T02:00:00Z' };
const receipt = sent => ({ok:true,run:{...structuredClone(sent.run),responses:sent.run.responses.map(row=>({...row,localOnly:undefined,serverReceivedAt:'2026-10-14T03:00:00Z'}))},mock:sent.mock,acknowledged:sent.requests.map(row=>row.requestId)});

test('device answers persist before advancing, retain their exact selection and never cache a token or manufacture a server timestamp', () => {
 const target=storage(), before=initial(), saved=appendMockOutbox(before,response,options,target);
 assert.equal(before.run.responses.length,0); assert.equal(saved.run.responses.length,1);
 assert.equal(saved.run.responses[0].localOnly,true); assert.equal(saved.run.responses[0].serverReceivedAt,undefined);
 assert.equal(saved.run.responses[0].clientOccurredAt,options.occurredAt);
 assert.deepEqual(readMockOutbox('outbox-child','assignment',target),saved);
 assert.equal(JSON.stringify(saved).includes('must-not-be-cached'),false);
 assert.equal(readMockOutbox('different-child','assignment',target),null);
 assert.equal(readCachedMockFocus('outbox-child',target,Date.parse('2026-10-14T04:00:00Z')).focusSession.id,'assignment');
 assert.equal(readCachedMockFocus('outbox-child',target,Date.parse('2026-10-14T07:00:00Z')),null);
});
test('storage denial or failed readback keeps the current question and the original queue unchanged', () => {
 const before=initial(), bad={getItem:()=>null,setItem:()=>{throw Error('quota');},removeItem:()=>{}};
 assert.throws(()=>appendMockOutbox(before,response,options,bad),/could not save/);
 assert.equal(before.requests.length,0); assert.equal(before.run.responses.length,0);
 const unreadable={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
 assert.equal(writeMockOutbox(before,unreadable),false);
});
test('receipt loss, wrong pupil, truncated acknowledgement and changed answers never authorize deleting queued work', () => {
 const sent=appendMockOutbox(initial(),response,options,storage()), good=receipt(sent);
 for(const changed of [{}, {...good,acknowledged:[]}, {...good,run:{...good.run,studentId:'other'}}, {...good,run:{...good.run,responses:[{...good.run.responses[0],selected:'different'}]}}, {...good,run:{...good.run,revision:1}}]) assert.throws(()=>verifyMockOutboxReceipt(changed,sent),/receipt is incomplete/);
 assert.equal(sent.requests.length,1); assert.equal(sent.run.responses[0].selected,'c1');
});
test('a verified receipt removes only the sent prefix and preserves answers added during delivery', () => {
 const target=storage(), sent=appendMockOutbox(initial(),response,options,target);
 const nextRequest={requestId:'answer-2',expectedRevision:2,response:{questionId:'q2',selected:'c2',responseStatus:'answered'},plan:null};
 const nextOptions={...options,item:{...item,id:'q2'},isCorrect:false};
 const current=appendMockOutbox(sent,nextRequest,nextOptions,target);
 const after=acknowledgeMockOutbox(current,sent,receipt(sent),()=>nextOptions,target);
 assert.equal(after.serverRun.responses.length,1); assert.equal(after.run.responses.length,2);
 assert.equal(after.run.status,'completed'); assert.deepEqual(after.requests.map(row=>row.requestId),['answer-2']);
 assert.equal(after.run.responses[1].isCorrect,false);
});
test('presentation and media-failure requests retain distinct evidence and require corresponding server records', () => {
 const target=storage(), presented=appendMockOutbox(initial(),{type:'event',requestId:'shown',questionId:'q1',event:'presented'},options,target);
 const failed=appendMockOutbox(presented,{requestId:'media',expectedRevision:1,response:{questionId:'q1',responseStatus:'media_failed',selected:null,failedMediaPaths:['/image/missing.png']}},options,target);
 assert.equal(failed.run.responses.length,0); assert.equal(failed.run.mediaFailures.length,1);
 assert.equal(failed.run.eventRevision,1); assert.equal(failed.run.revision,2);
 const good=receipt(failed); assert.equal(verifyMockOutboxReceipt(good,failed),good);
 assert.throws(()=>verifyMockOutboxReceipt({...good,run:{...good.run,mediaFailures:[]}},failed),/receipt is incomplete/);
});
test('assistance requests do not silently convert a helped or unresolved response into independent evidence', () => {
 const target=storage(), help=appendMockOutbox(initial(),{type:'event',requestId:'help',questionId:'q1',event:'help_requested'},options,target);
 assert.throws(()=>appendMockOutbox(help,response,options,target),/not been resolved/);
 const resolved={...help,run:{...help.run,helpRequests:[{questionId:'q1',status:'resolved',assistanceType:'answer'}]}};
 const saved=appendMockOutbox(resolved,response,options,target);
 assert.equal(saved.run.responses[0].evidenceType,'supported');
});
test('learner privacy cleanup removes durable assessment queues while preserving another pupil’s record', () => {
 const target=storage(); writeMockOutbox(initial(),target);
 const other=createMockOutbox({...initial(),studentId:'other',sessionId:'assignment',run:{...initial().run,studentId:'other'},mock:initial().mock,focusSession:initial().focusSession});
 writeMockOutbox(other,target); clearLearnerAssessmentDrafts('outbox-child',target);
 assert.equal(readMockOutbox('outbox-child','assignment',target),null); assert.ok(readMockOutbox('other','assignment',target));
});

test('a timed-out batch survives reload byte-for-byte while later answers remain outside its receipt',async()=>{
 const {prepareMockDelivery}=await import('../../src/utils/literacyMockOutbox.js');
 const target=storage(), first=appendMockOutbox(initial(),response,options,target);
 const sent=prepareMockDelivery(first,{batchId:'stable-batch'},target);
 const newer=appendMockOutbox(sent,{requestId:'answer-2',expectedRevision:2,response:{questionId:'q2',selected:'c2',responseStatus:'answered'}},{item:{...item,id:'q2'},isCorrect:false},target);
 const restored=readMockOutbox('outbox-child','assignment',target);
 assert.deepEqual(restored.delivery,sent.delivery);assert.deepEqual(prepareMockDelivery(restored,{batchId:'wrong-new-id'},target),newer);
 const good={...receipt(sent.delivery.sent),batchId:'stable-batch'};
 assert.throws(()=>verifyMockOutboxReceipt({...good,batchId:'wrong'},sent.delivery.sent),/incomplete/);
 const ack=acknowledgeMockOutbox(restored,sent.delivery.sent,good,()=>({item:{...item,id:'q2'},isCorrect:false}),target);
 assert.equal(ack.requests.length,1);assert.equal(ack.run.responses.length,2);assert.equal(ack.delivery,null);
});
test('help request receipts require actual server assistance records before queued work is removed',()=>{
 const sent=appendMockOutbox(initial(),{type:'event',requestId:'help-proof',questionId:'q1',event:'help_requested'},options,storage());
 assert.throws(()=>verifyMockOutboxReceipt({...receipt(sent),run:{...sent.run,helpRequests:[]}},sent),/incomplete/);
});

test('completed received replicas retire for a new sitting while pending answers and the active child remain intact',async()=>{
 const {pruneReceivedMockOutboxes}=await import('../../src/utils/literacyMockOutbox.js');const target=storage();
 const queued=appendMockOutbox(initial(),response,options,target);writeMockOutbox(queued,target);
 const completed={...queued,studentId:'finished',run:{...receipt(queued).run,studentId:'finished',status:'completed'},serverRun:{...receipt(queued).run,studentId:'finished',status:'completed'},requests:[]};
 writeMockOutbox(completed,target);
 assert.equal(pruneReceivedMockOutboxes({exceptStudentId:'finished',exceptSessionId:'assignment',storage:target}),0);
 assert.equal(pruneReceivedMockOutboxes({exceptStudentId:'new-child',exceptSessionId:'new-sitting',storage:target}),1);
 assert.equal(readMockOutbox('finished','assignment',target),null);assert.equal(readMockOutbox('outbox-child','assignment',target).requests.length,1);
});
