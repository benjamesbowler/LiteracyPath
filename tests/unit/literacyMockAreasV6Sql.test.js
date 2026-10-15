import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fixture,read,query,teacher,other,classId,studentId,foreignClass,foreignStudent } from '../helpers/literacyMockDatabase.js';
import { loadLiteracyMockBank,LITERACY_MOCK_VERSION } from '../../src/data/literacyMockBank.js';
import { createLiteracyMockManifest } from '../../tools/generateLiteracyMockManifest.mjs';
import { literacyMockV6SchemaSql,literacyMockV6CatalogueSql } from '../../tools/generateLiteracyMockV6.mjs';
import { selectLiteracyMockPlan,adaptLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';
import { createMockOutbox,appendMockOutbox,verifyMockOutboxReceipt } from '../../src/utils/literacyMockOutbox.js';
import { buildLiteracyMockReport } from '../../src/utils/literacyMockReport.js';
import { literacyMockWorkingSummary } from '../../src/utils/literacyMockWorkingSummary.js';
import { buildLiteracyExposureIndex,getLiteracyExposure } from '../../src/utils/literacyEvidence.js';
import { LITERACY_QUARANTINED_ITEM_IDS,literacyItemQualityIssue } from '../../src/policy/literacyItemEligibility.js';
import { literacyMockAreaSchedule,LITERACY_MOCK_AREA_MAX } from '../../src/policy/literacyMockAdaptivePolicy.js';

const bank=await loadLiteracyMockBank({contentVersion:'literacy-mock-v6'});
const v4=await createLiteracyMockManifest({contentVersion:'literacy-mock-v4'});
const v6=await createLiteracyMockManifest({contentVersion:'literacy-mock-v6'});
const schema=read('20261015104114_literacy_mock_demand_v6.sql');
const catalogue=read('20261015104116_literacy_mock_catalogue_v6.sql');



const control=(db,id,action,revision,key=action)=>query(db,'select teacher_control_literacy_mock_session($1,$2,$3,$4) value',[id,action,revision,key]);
const save=(db,id,key,revision,plan,response=null)=>query(db,'select student_save_literacy_mock_run($1,$2,$3,$4,$5,$6) value',['synthetic-token',id,key,revision,plan,response]);
const batch=(db,id,key,lease,requests=[])=>query(db,'select student_sync_literacy_mock_batch($1,$2,$3,$4,$5,null) value',['synthetic-token',id,key,lease,requests]);
const prepare=(db,key,ids=[studentId])=>query(db,'select teacher_prepare_literacy_mock_session_v6($1,$2,false,20,43,$3,$4) value',[classId,ids,key,'untimed']);
async function setup(){
 const db=await fixture();
 await db.exec("alter table student_focus_sessions add constraint student_focus_sessions_expiry_check check(expires_at>started_at and expires_at<=started_at+interval '2 hours')");
 for(const name of ['20261010140000_literacy_mock_evidence_v3.sql','20261010150000_literacy_mock_followup_evidence.sql','20261012041604_literacy_mock_tutorial_lookup_index.sql','20261012083202_literacy_mock_adaptive_v4.sql','20261013053259_literacy_mock_content_quarantine.sql','20261014020000_literacy_mock_device_collection.sql'])await db.exec(read(name));
 await db.query("insert into literacy_mock_items(id,content_version,item)select q->>'id','literacy-mock-v4',q from jsonb_array_elements($1::jsonb)q",[v4.items]);
 await db.query("insert into literacy_mock_publications(content_version,item_count)values('literacy-mock-v4',$1)",[v4.itemCount]);
 if(process.env.LP_MOCK_V6_HOSTED_BASELINE){
  const allowed=new Set(['lp_progress_config_valid','lp_literacy_mock_assignment','lp_prepare_literacy_mock_focus','lp_mock_state_before_delivery','lp_mock_run_before_delivery','lp_mock_support_before_delivery','lp_literacy_mock_state','teacher_control_literacy_mock_session','student_sync_literacy_mock_batch','lp_mock_prepare_before_delivery','teacher_prepare_literacy_mock_session_v4','student_record_literacy_mock_event','student_save_literacy_mock_run']);
  for(const row of JSON.parse(readFileSync(process.env.LP_MOCK_V6_HOSTED_BASELINE,'utf8'))){assert.ok(allowed.has(row.name));assert.ok(row.definition.startsWith(`CREATE OR REPLACE FUNCTION public.${row.name}(`));await db.exec(row.definition);}
 }
 for(const file of ['20261015052954_literacy_mock_areas_v5.sql','20261015053013_literacy_mock_catalogue_v5.sql','20261015054235_literacy_mock_delivery_projection.sql','20261015054802_literacy_mock_incremental_validation.sql','20261015060558_literacy_mock_picture_quarantine.sql'])await db.exec(read(file));
 await db.exec(schema);await db.exec(catalogue);
 return db;
}
function completeRequests(bootstrap,offline,correct){
 const data=new Map(),storage={setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k)??null,removeItem:k=>data.delete(k)};
 let box=createMockOutbox({studentId:bootstrap.run.studentId,sessionId:bootstrap.run.assignmentId,run:bootstrap.run,mock:bootstrap.mock,focusSession:{id:bootstrap.run.assignmentId}});
 const byId=new Map(offline.map(q=>[q.id,q])),states=Object.fromEntries(Object.keys(LITERACY_MOCK_AREA_MAX).map(id=>[id,1])),trace=[];
 for(let index=0;index<43;index++){
  const q=byId.get(box.run.plan.itemIds[index]);assert.ok(q,`Offline item ${index}`);
  assert.equal(q.domainId,literacyMockAreaSchedule()[index]);assert.equal(q.adaptiveAreaBand,states[q.domainId]);
  const ok=correct(index,q);
  let selected=q.answer;
  if(!ok){if(Array.isArray(q.answer)){selected=[...q.answer];selected[0]=q.choices.find(c=>c.id!==q.answer[0]).id;}else selected=q.format==='build_word'?'xxx':q.choices.find(c=>c.id!==q.answer).id;}
  assert.notDeepEqual(ok?null:selected,ok?'not-a-selection':q.answer);
  box=appendMockOutbox(box,{type:'event',requestId:`shown-${index}`,questionId:q.id,event:'presented'},{item:q},storage);
  box=appendMockOutbox(box,{requestId:`answer-${index}`,expectedRevision:box.run.revision,plan:null,response:{questionId:q.id,selected,responseStatus:'answered',knownFamiliar:false,supportUsed:false,audioDelivery:Object.fromEntries(q.requiredAudioPaths.map(path=>[path,'completed']))}},{item:q,isCorrect:ok},storage);
  states[q.domainId]=Math.max(0,Math.min(LITERACY_MOCK_AREA_MAX[q.domainId],q.adaptiveAreaBand+(ok?1:-1)));
  trace.push({domain:q.domainId,band:q.adaptiveAreaBand,correct:ok});
  if(index<42){const next=adaptLiteracyMockPlan(offline,box.run.plan,box.run.responses,[],box.run.presentations,{resetUnsupported:true});
   if(JSON.stringify(next.itemIds)!==JSON.stringify(box.run.plan.itemIds))box=appendMockOutbox(box,{requestId:`adapt-${index}`,expectedRevision:box.run.revision,plan:next,response:null},{},storage);}
 }
 return{box,trace};
}

test('v6 is an exact immutable publication; complete offline runs adapt and teacher reports match canonical scoring',async()=>{
 assert.equal(LITERACY_MOCK_VERSION,'literacy-mock-v6');assert.equal(schema,literacyMockV6SchemaSql());assert.equal(catalogue,await literacyMockV6CatalogueSql());
 const db=await setup();if(process.env.LP_MOCK_TRACE_TIMING)console.info('SETUP COMPLETE');try{
  for(const id of LITERACY_QUARANTINED_ITEM_IDS)for(const value of [{id},{questionId:id},{itemSnapshot:{id}},{question:{id}}])assert.deepEqual(await query(db,'select lp_literacy_item_quality_issue($1) value',[value]),literacyItemQualityIssue(value));
  const stored=(await db.query("select item from literacy_mock_items where content_version='literacy-mock-v6' order by id collate \"C\"")).rows.map(r=>r.item);
  assert.deepEqual(stored,[...v6.items].sort((a,b)=>a.id<b.id?-1:1));
  const old=(await db.query("select item from literacy_mock_items where content_version='literacy-mock-v4' order by id collate \"C\"")).rows.map(r=>r.item);
  assert.deepEqual(old,[...v4.items].sort((a,b)=>a.id<b.id?-1:1));
  await db.exec(catalogue); // Exact publication retries cannot rewrite content.
  const patterns={wrong:()=>false,right:()=>true,reversal:i=>i<16,alternating:i=>i%2===0,uneven:(_,q)=>['vocabulary','reading','listening','print'].includes(q.domainId)};
  let n=0;
  for(const [name,correct]of Object.entries(patterns)){
   if(process.env.LP_MOCK_TRACE_TIMING)console.info('PATTERN',name,Date.now());
   const learner=`33000000-0000-4000-8000-${String(++n+100).padStart(12,'0')}`;
   await db.query('insert into students values($1,$2,$3,$4,null)',[learner,classId,teacher,`Synthetic ${name}`]);
   await db.exec(`create or replace function student_from_token(token text) returns public.students language sql stable as $$select s.* from public.students s where id=case when token='synthetic-token' then '${learner}'::uuid else null end and archived_at is null$$`);
   const prepared=await prepare(db,name,[learner]);assert.equal(prepared.ok,true,prepared.error);const id=prepared.session.id;
   const started=await control(db,id,'start',0);assert.equal(started.ok,true,started.error);
   let pool=[];const plan=selectLiteracyMockPlan(bank,{sessionId:id,studentId:learner,onOfflineItems:ids=>{pool=ids;}}),offline=bank.filter(q=>pool.includes(q.id));
   const registered=await save(db,id,'initial',0,plan);assert.equal(registered.ok,true,registered.error);
   const boot=await batch(db,id,'bootstrap',null);assert.equal(boot.ok,true,boot.error);assert.equal(boot.mock.capabilities.offlineDelivery,true);
   const {box,trace}=completeRequests(boot,offline,correct);
   if(process.env.LP_MOCK_TRACE_TIMING)console.info('DELIVERY',name,Date.now());
   const result=await batch(db,id,'complete-sitting',boot.run.offlineLeaseId,box.requests);assert.equal(result.ok,true,`${name}: ${JSON.stringify(result)}`);
   assert.notEqual(await query(db,"select current_setting('literacy_mock.batch_receipt_only',true) value"),'on');
   if(process.env.LP_MOCK_TRACE_TIMING)console.info('RECEIVED',name,Date.now());
   assert.equal(verifyMockOutboxReceipt(result,box),result);assert.equal(result.run.responses.length,43);
   assert.deepEqual(result.run.responses.map(r=>r.isCorrect),trace.map(r=>r.correct));
   assert.deepEqual(result.run.responses.map(r=>r.itemSnapshot.adaptiveAreaBand),trace.map(r=>r.band));
   assert.equal((await batch(db,id,'complete-sitting',boot.run.offlineLeaseId,box.requests)).duplicate,true);
   const collected=await control(db,id,'collect',result.mock.revision,'collect');assert.equal(collected.ok,true,collected.error);
   const payload=await query(db,'select teacher_get_literacy_mock_report($1) value',[id]);
   const report=buildLiteracyMockReport(payload,{students:[{id:learner,name:`Synthetic ${name}`}]}),pupil=report.pupils[0];
   assert.equal(pupil.responses.length,43);assert.equal(pupil.totals.independent,43);assert.equal(pupil.totals.correct,trace.filter(r=>r.correct).length);
   assert.equal(pupil.areas.length,8);assert.equal(report.totalSkills,50);assert.equal(pupil.areas.reduce((sum,a)=>sum+a.independent,0),43);
   const summary=literacyMockWorkingSummary(pupil);assert.equal(summary.accuracy.correct,pupil.totals.correct);assert.equal(summary.stage.ready,false);
   for(const area of pupil.areas){const view=literacyMockWorkingSummary(pupil,{domains:area.domains});assert.equal(view.accuracy.answered,trace.filter(r=>r.domain===area.id).length);assert.equal(view.stage.ready,false);}
   assert.equal(await query(db,'select count(*)::integer value from student_progress'),0);
  }
 }finally{await db.close();}
});

test('v6 rejects forged entry, stale demand, changed shown questions, unsupported authority and cross-class access',async()=>{
 const db=await setup();if(process.env.LP_MOCK_TRACE_TIMING)console.info('SETUP COMPLETE');try{
  const prepared=await prepare(db,'security');const id=prepared.session.id;await control(db,id,'start',0);
  const plan=selectLiteracyMockPlan(bank,{sessionId:id,studentId});
  const bad={...plan,itemIds:[...plan.itemIds]};const history=buildLiteracyExposureIndex({exposures:plan.itemIds.map(id=>bank.find(q=>q.id===id))});bad.itemIds[0]=bank.find(q=>q.domainId==='sound_awareness'&&q.adaptiveAreaBand===4&&!getLiteracyExposure(q,history).knownFamiliar&&!plan.itemIds.some(id=>bank.find(other=>other.id===id).stimulusKey===q.stimulusKey)).id;
  assert.equal((await save(db,id,'bad-entry',0,bad)).error,'invalid_entry_level');
  assert.equal((await save(db,id,'initial',0,plan)).ok,true);
  const first=bank.find(q=>q.id===plan.itemIds[0]);
  assert.equal((await query(db,'select student_record_literacy_mock_event($1,$2,$3,$4,$5) value',['synthetic-token',id,first.id,'presented','show'])).ok,true);
  const answered=await save(db,id,'wrong',1,null,{questionId:first.id,selected:first.choices.find(c=>c.id!==first.answer).id,responseStatus:'answered',supportUsed:false,knownFamiliar:false,audioDelivery:Object.fromEntries(first.requiredAudioPaths.map(p=>[p,'completed']))});assert.equal(answered.ok,true,answered.error);
  const nextId=plan.itemIds[1];assert.equal((await query(db,'select student_record_literacy_mock_event($1,$2,$3,$4,$5) value',['synthetic-token',id,nextId,'presented','stale-show'])).error,'invalid_adaptation');
  const next=adaptLiteracyMockPlan(bank,plan,answered.run.responses);assert.equal(bank.find(q=>q.id===next.itemIds[1]).adaptiveAreaBand,0);
  assert.equal((await save(db,id,'adapt',answered.run.revision,next)).ok,true);
  for(const role of ['anon','authenticated'])for(const signature of ['lp_mock_area_next_band(uuid,uuid,text)','lp_mock_area_plan_error(uuid,uuid,jsonb,jsonb,integer,jsonb)','lp_mock_prepare_v6_before_delivery(uuid,uuid[],boolean,integer,integer,text,text)'])assert.equal(await query(db,'select has_function_privilege($1,$2,$3) value',[role,signature,'execute']),false);
  assert.equal(await query(db,"select has_function_privilege('anon','teacher_prepare_literacy_mock_session_v6(uuid,uuid[],boolean,integer,integer,text,text)','execute') value"),false);
  await db.exec(`set fixture.actor='${other}'`);assert.equal((await prepare(db,'foreign')).error,'class_not_found');
  await db.exec(`set fixture.actor='${teacher}'`);
  assert.equal((await prepare(db,'foreign-student',[foreignStudent])).error,'student_not_in_class');
  assert.equal((await query(db,'select teacher_prepare_literacy_mock_session_v6($1,$2,false,20,43,$3,$4) value',[foreignClass,[studentId],'foreign-class','untimed'])).error,'class_not_found');
 }finally{await db.close();}
});
