import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture,read,query,teacher,other,classId,studentId,secondStudent } from '../helpers/literacyMockDatabase.js';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { selectLiteracyMockPlan,adaptLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';
import { createLiteracyMockManifest } from '../../tools/generateLiteracyMockManifest.mjs';
import { createMockOutbox,appendMockOutbox,verifyMockOutboxReceipt } from '../../src/utils/literacyMockOutbox.js';

const bank = await loadLiteracyMockBank({contentVersion:'literacy-mock-v4'});
let pool=[];
const plan=selectLiteracyMockPlan(bank,{sessionId:'device-fixture',studentId,itemCount:43,seed:'device-test',onOfflineItems:ids=>{pool=ids;}});
const offlineBank=bank.filter(item=>pool.includes(item.id));
const manifest=await createLiteracyMockManifest({contentVersion:'literacy-mock-v4'});
const values=manifest.items.filter(item=>pool.includes(item.id));
const save=(db,id,key,revision,nextPlan,response=null)=>query(db,'select student_save_literacy_mock_run($1,$2,$3,$4,$5,$6) value',['synthetic-token',id,key,revision,nextPlan,response]);
const control=(db,id,action,revision,key=action)=>query(db,'select teacher_control_literacy_mock_session($1,$2,$3,$4) value',[id,action,revision,key]);
const batch=(db,id,key,lease,requests=[],collection=null,token='synthetic-token')=>query(db,'select student_sync_literacy_mock_batch($1,$2,$3,$4,$5,$6) value',[token,id,key,lease,requests,collection]);
async function setup({two=false,warm=false}={}) {
 const db=await fixture();
 await db.exec("alter table student_focus_sessions add constraint student_focus_sessions_expiry_check check(expires_at>started_at and expires_at<=started_at+interval '2 hours')");
 for(const file of ['20261010140000_literacy_mock_evidence_v3.sql','20261010150000_literacy_mock_followup_evidence.sql','20261012041604_literacy_mock_tutorial_lookup_index.sql','20261012083202_literacy_mock_adaptive_v4.sql','20261013053259_literacy_mock_content_quarantine.sql']) await db.exec(read(file));
 await db.query("insert into literacy_mock_items(id,content_version,item) select i->>'id','literacy-mock-v4',i from jsonb_array_elements($1::jsonb)i",[values]);
 await db.query("insert into literacy_mock_publications(content_version,item_count)values('literacy-mock-v4',$1)",[values.length]);
 await db.exec(`create or replace function student_from_token(token text) returns public.students language sql stable as $$select s.* from public.students s where id=case when token='synthetic-token' then '${studentId}'::uuid when token='second-token' then '${secondStudent}'::uuid else null end and archived_at is null$$`);
 if (warm) {
  const earlier=await query(db,'select teacher_prepare_literacy_mock_session_v4($1,$2,false,20,43,$3,$4) value',[classId,[studentId],'warm-legacy-functions','pause_at_window_end']);
  assert.equal(earlier.ok,true,earlier.error);
  const started=await control(db,earlier.session.id,'start',earlier.session.mock.revision,'warm-start');assert.equal(started.ok,true);
  const legacyRun=await save(db,earlier.session.id,'warm-plan',0,plan);assert.equal(legacyRun.ok,true);
  await query(db,'select teacher_get_literacy_mock_report($1) value',[earlier.session.id]);
  await query(db,'select student_get_literacy_mock_run($1,$2) value',['synthetic-token',earlier.session.id]);
  const ended=await control(db,earlier.session.id,'finish',started.session.mock.revision,'warm-finish');assert.equal(ended.ok,true);
 }
 await db.exec(read('20261014020000_literacy_mock_device_collection.sql'));
 await db.exec(read('20261015054235_literacy_mock_delivery_projection.sql'));
 const prepared=await query(db,'select teacher_prepare_literacy_mock_session_v4($1,$2,false,20,43,$3,$4) value',[classId,two?[studentId,secondStudent]:[studentId],'device-preparation','untimed']);
 assert.equal(prepared.ok,true,prepared.error); assert.equal(prepared.session.mock.window_mode,'untimed');
 const id=prepared.session.id; const started=await control(db,id,'start',0); assert.equal(started.ok,true,started.error);
 const registered=await save(db,id,'initial-plan',0,plan); assert.equal(registered.ok,true,registered.error);
 const bootstrap=await batch(db,id,'bootstrap',null); assert.equal(bootstrap.ok,true,bootstrap.error); assert.ok(bootstrap.run.offlineLeaseId);
 return {db,id,bootstrap,prepared};
}
const targetStorage=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};};
function deviceRequests(run,mock,count=43) {
 let box=createMockOutbox({studentId,sessionId:run.assignmentId,run,mock,focusSession:{id:run.assignmentId}});const storage=targetStorage();
 for(let n=0;n<count;n++) {
  const item=offlineBank.find(item=>item.id===box.run.plan.itemIds[n]); assert.ok(item);
  box=appendMockOutbox(box,{type:'event',requestId:`shown-${n}`,questionId:item.id,event:'presented'},{item},storage);
  box=appendMockOutbox(box,{requestId:`answer-${n}`,expectedRevision:box.run.revision,plan:null,response:{questionId:item.id,selected:item.answer,responseStatus:'answered',knownFamiliar:false,supportUsed:false,audioDelivery:Object.fromEntries(item.requiredAudioPaths.map(path=>[path,'completed']))}},{item,isCorrect:true},storage);
  if(n<count-1 && n<42) {
   const next=adaptLiteracyMockPlan(offlineBank,box.run.plan,box.run.responses,[],box.run.presentations,{resetUnsupported:true});
   if(JSON.stringify(next.itemIds)!==JSON.stringify(box.run.plan.itemIds)) box=appendMockOutbox(box,{requestId:`adapt-${n}`,expectedRevision:box.run.revision,plan:next,response:null},{},storage);
  }
 }
 return box;
}

test('untimed device collection bootstraps a bounded lease without creating scores or learner access for another pupil',async()=>{
 const {db,id,bootstrap}=await setup();try {
  assert.equal(bootstrap.run.responses.length,0);assert.equal(bootstrap.mock.delivery_mode,'collect');
  assert.equal(bootstrap.mock.deadline_at,null);assert.equal(bootstrap.mock.capabilities.offlineDelivery,true);
  assert.equal((await batch(db,id,'foreign',bootstrap.run.offlineLeaseId,[],null,'bad-token')).error,'invalid_session');
  assert.equal((await query(db,"select expires_at<=started_at+interval '12 hours' value from student_focus_sessions where id=$1",[id])),true);
  for(const role of ['anon','authenticated']) {
   assert.equal(await query(db,"select has_table_privilege($1,'public.literacy_mock_delivery_receipts','select') value",[role]),false);
   assert.equal(await query(db,"select has_function_privilege($1,'public.lp_finish_mock_collection(uuid)','execute') value",[role]),false);
  }
 }finally{await db.close();}
});
test('43 locally completed adaptive answers arrive in one verified batch and remain separate from practice/mastery',async()=>{
 const {db,id,bootstrap}=await setup();try {
  const box=deviceRequests(bootstrap.run,bootstrap.mock);
  assert.equal(box.run.responses.length,43);assert.ok(box.run.responses.some(response=>response.level===2));
  const result=await batch(db,id,'whole-sitting',bootstrap.run.offlineLeaseId,box.requests);assert.equal(result.ok,true,result.error);
  assert.equal(verifyMockOutboxReceipt(result,box),result); assert.equal(result.run.responses.length,43);
  const teacherReport=await query(db,'select teacher_get_literacy_mock_report($1) value',[id]);assert.equal(teacherReport.members[0].run.responses.length,43);
  assert.equal(await query(db,'select count(*)::integer value from student_progress'),0);
  const duplicate=await batch(db,id,'whole-sitting',bootstrap.run.offlineLeaseId,box.requests);assert.equal(duplicate.duplicate,true);
  assert.equal(duplicate.run.responses.length,43);
  const finished=await control(db,id,'collect',result.mock.revision,'finish-after-receipt');assert.equal(finished.session.mock.state,'completed');
  const afterEnd=await batch(db,id,'whole-sitting',bootstrap.run.offlineLeaseId,box.requests);assert.equal(afterEnd.duplicate,true);
  assert.equal((await batch(db,id,'new-after-end',bootstrap.run.offlineLeaseId,[])).error,'assessment_finished');
 }finally{await db.close();}
});
test('an invalid later request rolls back earlier answers in the batch and retains the original immutable prefix',async()=>{
 const {db,id,bootstrap}=await setup();try {
  const box=deviceRequests(bootstrap.run,bootstrap.mock,1);
  const result=await batch(db,id,'broken',bootstrap.run.offlineLeaseId,[...box.requests,{requestId:'bad-next',expectedRevision:2,response:{questionId:'not-published',responseStatus:'answered',selected:'c1'}}]);
  assert.equal(result.ok,false);assert.notEqual(await query(db,"select current_setting('literacy_mock.batch_receipt_only',true) value"),'on');assert.equal(await query(db,'select jsonb_array_length(responses) value from literacy_mock_runs where session_id=$1',[id]),0);
  assert.equal(await query(db,'select count(*)::integer value from literacy_mock_delivery_receipts where batch_id=\'broken\''),0);
 }finally{await db.close();}
});
test('early collection waits for a disconnected started iPad, accepts its exact queued partial answers, then closes without reopening',async()=>{
 const {db,id,bootstrap}=await setup({two:true});try {
  const secondRun=await query(db,'select student_save_literacy_mock_run($1,$2,$3,0,$4,null) value',['second-token',id,'second-plan',plan]);assert.equal(secondRun.ok,true,secondRun.error);
  const secondLease=await batch(db,id,'second-bootstrap',null,[],null,'second-token');assert.equal(secondLease.ok,true,secondLease.error);
  const collecting=await control(db,id,'collect',bootstrap.mock.revision,'collect-now');assert.equal(collecting.ok,true,collecting.error);
  assert.equal(collecting.session.mock.state,'running');assert.equal(collecting.session.mock.collection_pending_count,2);
  const box=deviceRequests(bootstrap.run,bootstrap.mock,3);
  const first=await batch(db,id,'first-device',bootstrap.run.offlineLeaseId,box.requests,'collect-now');assert.equal(first.ok,true,first.error);
  assert.equal(first.mock.collection_pending_count,1);assert.equal(first.mock.state,'running');
  const second=await batch(db,id,'second-device',secondLease.run.offlineLeaseId,[],'collect-now','second-token');assert.equal(second.ok,true,second.error);
  assert.equal(second.mock.state,'completed');assert.equal(second.mock.collection_pending_count,0);
  assert.equal(await query(db,'select status value from student_focus_sessions where id=$1',[id]),'ended');
  assert.equal((await batch(db,id,'first-device',bootstrap.run.offlineLeaseId,box.requests,'collect-now')).duplicate,true);
  assert.equal((await batch(db,id,'late-new-work',bootstrap.run.offlineLeaseId,[],'collect-now')).error,'assessment_finished');
 }finally{await db.close();}
});
test('a teacher pause keeps its visible state while already authorized device answers drain',async()=>{
 const {db,id,bootstrap}=await setup();try {
  const paused=await control(db,id,'pause',bootstrap.mock.revision,'pause-now');assert.equal(paused.session.mock.state,'paused');
  const box=deviceRequests(bootstrap.run,bootstrap.mock,1);const drained=await batch(db,id,'paused-delivery',bootstrap.run.offlineLeaseId,box.requests);
  assert.equal(drained.ok,true,drained.error);assert.equal(drained.mock.state,'paused');assert.equal(drained.run.responses.length,1);
 }finally{await db.close();}
});
test('collection controls stay teacher-owned and another workflow cannot end an uncollected leased sitting',async()=>{
 const {db,id,bootstrap}=await setup();try {
  await db.exec(`set fixture.actor='${other}'`);assert.equal((await control(db,id,'collect',bootstrap.mock.revision,'foreign-collect')).error,'session_not_found');
  await db.exec(`set fixture.actor='${teacher}'`);
  await assert.rejects(()=>query(db,'select teacher_end_student_focus_session($1,$2) value',[id,'return_home']),/offline_collection_required/);
  assert.equal(await query(db,'select status value from student_focus_sessions where id=$1',[id]),'active');
  const live=await control(db,id,'live_on',bootstrap.mock.revision,'enable-live');assert.equal(live.session.mock.delivery_mode,'live');
 }finally{await db.close();}
});

test('a teacher can finish a prepared unsent assessment without waiting for a device that could not record an answer',async()=>{
 const {db}=await setup();try {
  const prepared=await query(db,'select teacher_prepare_literacy_mock_session_v4($1,$2,false,20,43,$3,$4) value',[classId,[secondStudent],'unsent-draft','untimed']);
  assert.equal(prepared.ok,true,prepared.error);
  const result=await control(db,prepared.session.id,'collect',prepared.session.mock.revision,'collect-unsent');
  assert.equal(result.ok,true,result.error);assert.equal(result.session.mock.state,'completed');assert.equal(result.session.status,'ended');
 }finally{await db.close();}
});

test('late unsolicited answer assistance waits for device collection instead of invalidating queued adaptive work',async()=>{
 const {db,id,bootstrap}=await setup();try {
  const box=deviceRequests(bootstrap.run,bootstrap.mock,1), q=box.run.responses[0].questionId;
  const received=await batch(db,id,'first-response',bootstrap.run.offlineLeaseId,box.requests);assert.equal(received.ok,true,received.error);
  const blocked=await query(db,'select teacher_resolve_literacy_mock_support($1,$2,$3,$4,$5) value',[id,studentId,q,'answer','late-help']);
  assert.equal(blocked.error,'device_data_required_for_answer_assistance');
  const collecting=await control(db,id,'collect',received.mock.revision,'collect-before-help');assert.equal(collecting.ok,true);
  const final=await batch(db,id,'collect-ack',bootstrap.run.offlineLeaseId,[],'collect-before-help');assert.equal(final.ok,true,final.error);
  const helped=await query(db,'select teacher_resolve_literacy_mock_support($1,$2,$3,$4,$5) value',[id,studentId,q,'answer','late-help']);
  assert.equal(helped.ok,true,helped.error);assert.equal(helped.run.responses[0].evidenceType,'supported');
  assert.equal(helped.run.responses[0].selected,box.run.responses[0].selected);
 }finally{await db.close();}
});
test('a child requested-help event still permits immediate answer assistance on the current leased question',async()=>{
 const {db,id,bootstrap}=await setup();try {
  const item=offlineBank.find(row=>row.id===bootstrap.run.plan.itemIds[0]);
  const result=await batch(db,id,'help-request',bootstrap.run.offlineLeaseId,[{type:'event',requestId:'shown-help',questionId:item.id,event:'presented'},{type:'event',requestId:'needs-help',questionId:item.id,event:'help_requested'}]);assert.equal(result.ok,true,result.error);
  const helped=await query(db,'select teacher_resolve_literacy_mock_support($1,$2,$3,$4,$5) value',[id,studentId,item.id,'answer','resolve-current-help']);
  assert.equal(helped.ok,true,helped.error);assert.equal(helped.run.helpRequests[0].assistanceType,'answer');
  assert.equal(helped.run.responses.length,0);
 }finally{await db.close();}
});

test('the forward wrappers remain visible after previously cached legacy function calls and preserve old session history',async()=>{
 const {db,bootstrap,prepared}=await setup({warm:true});try {
  assert.equal(prepared.session.mock.capabilities.offlineDelivery,true);
  assert.ok(bootstrap.run.offlineLeaseId);
  const legacy=await query(db,"select teacher_get_literacy_mock_report((select session_id from literacy_mock_sessions where window_mode='pause_at_window_end' limit 1)) value");
  assert.equal(legacy.session.mock.window_mode,'pause_at_window_end');assert.equal(legacy.session.mock.state,'completed');
  assert.equal(legacy.session.mock.capabilities.offlineDelivery,false);
  assert.equal(Object.hasOwn(legacy.members[0].run,'offlineLeaseId'),true);
 }finally{await db.close();}
});
