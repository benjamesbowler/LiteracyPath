import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {fixtureV10} from '../helpers/literacyMockV10Database.js';
import {query,teacher,other,classId,studentId} from '../helpers/literacyMockDatabase.js';
import {literacyMockV12SchemaSql,literacyMockV12CatalogueSql,V12_SCHEMA_MIGRATION,V12_CATALOGUE_MIGRATION} from '../../tools/generateLiteracyMockV12.mjs';
import {loadLiteracyMockBank,scoreLiteracyMockResponse} from '../../src/data/literacyMockBank.js';
import {createMockOutbox,appendMockOutbox,prepareMockDelivery,acknowledgeMockOutbox,verifyMockOutboxReceipt} from '../../src/utils/literacyMockOutbox.js';
import {selectLiteracyMockPlan,adaptLiteracyMockPlan,sameLiteracyMockPlan} from '../../src/utils/literacyMockPlanner.js';
import {mockConstructionLength} from '../../src/utils/literacyMockResponse.js';
import {literacyMockBoundaryState} from '../../src/policy/literacyMockBoundaryPolicy.js';
import {buildLiteracyMockReport} from '../../src/utils/literacyMockReport.js';
import {mockOfflineMediaAssetLimit,mockOfflineMediaPaths} from '../../src/utils/literacyMockOfflineMedia.js';
const migration = name => readFileSync(new URL(`../../supabase/migrations/${name}`,import.meta.url),'utf8');
const control = (db, id, action, revision, key = action) => query(db, 'select teacher_control_literacy_mock_session($1,$2,$3,$4) value', [id, action, revision, key]);
const save = (db, id, key, revision, plan, response = null, token = 'synthetic-token') => query(db, 'select student_save_literacy_mock_run($1,$2,$3,$4,$5,$6) value', [token, id, key, revision, plan, response]);
const batch = (db, id, key, lease, requests = [], collection = null, token = 'synthetic-token') => query(db, 'select student_sync_literacy_mock_batch($1,$2,$3,$4,$5,$6) value', [token, id, key, lease, requests, collection]);
const prepare = (db, key, ids = [studentId], classroom = classId) => query(db, 'select teacher_prepare_literacy_mock_session_v12($1,$2,false,20,124,$3,$4) value', [classroom, ids, key, 'untimed']);
const event = (db, id, questionId, name, key, token = 'synthetic-token') => query(db, 'select student_record_literacy_mock_event($1,$2,$3,$4,$5) value', [token, id, questionId, name, key]);
const storage = () => { const data = new Map(); return { setItem: (key, value) => data.set(key, value), getItem: key => data.get(key) ?? null, removeItem: key => data.delete(key) }; };
const answered = (item, selected = item.answer, supported = false) => ({ questionId: item.id, selected, responseStatus: 'answered', knownFamiliar: false, supportUsed: supported,
  audioDelivery: Object.fromEntries(item.requiredAudioPaths.map(path => [path, 'completed'])) });

function selection(item, correct) {
  if (correct) return item.answer;
  let options;
  if (item.format === 'build_word') {
    const length = mockConstructionLength(item), labels = item.choices.map(choice => choice.label);
    options = Array.from({ length: labels.length }, (_, start) => Array.from({ length }, (_value, index) => labels[(start + index) % labels.length]).join(''));
  } else if (Array.isArray(item.answer)) {
    options = [[...item.answer].reverse(), [...item.answer.slice(1), item.answer[0]],
      [item.choices.find(choice => choice.id !== item.answer[0])?.id, ...item.answer.slice(1)]];
  } else options = item.choices.map(choice => choice.id);
  const wrong = options.find(value => !scoreLiteracyMockResponse(item, value));
  assert.notEqual(wrong, undefined, `A valid incorrect response exists for ${item.id}`);
  return wrong;
}

function completeRequests(bootstrap, offline, outcome) {
  const disk = storage(), byId = new Map(offline.map(item => [item.id, item]));
  let box = createMockOutbox({ studentId: bootstrap.run.studentId, sessionId: bootstrap.run.assignmentId, run: bootstrap.run, mock: bootstrap.mock, focusSession: { id: bootstrap.run.assignmentId } });
  const trace = [], areaCounts = {};
  while (box.run.responses.length < box.run.plan.itemIds.length) {
    const index = box.run.responses.length, item = byId.get(box.run.plan.itemIds[index]);
    assert.ok(item, `Reserved item ${index + 1}`);
    const areaIndex = areaCounts[item.domainId] || 0; areaCounts[item.domainId] = areaIndex + 1;
    const value = outcome(index, item, areaIndex), supported = value === null, correct = value !== false;
    const selected = selection(item, correct);
    assert.equal(scoreLiteracyMockResponse(item, selected), correct);
    box = appendMockOutbox(box, { type: 'event', requestId: `shown-${index}`, questionId: item.id, event: 'presented' }, { item }, disk);
    box = appendMockOutbox(box, { requestId: `answer-${index}`, expectedRevision: box.run.revision, plan: null, response: answered(item, selected, supported) }, { item, isCorrect: correct }, disk);
    trace.push({ questionId: item.id, domainId: item.domainId, band: item.adaptiveAreaBand, selected, correct, supported });
    const next = adaptLiteracyMockPlan(offline, box.run.plan, box.run.responses, [], box.run.presentations);
    if (!sameLiteracyMockPlan(next, box.run.plan)) box = appendMockOutbox(box, { requestId: `adapt-${index}`, expectedRevision: box.run.revision, plan: next, response: null }, {}, disk);
  }
  assert.equal(box.run.status, 'completed');
  return { box, trace };
}

test('V12 canonical publication, complete delivery, retry receipts and teacher evidence agree',async()=>{
 const db=await fixtureV10({catalogue:true});
 const digest=async()=> (await db.query("select content_version,count(*)::integer item_count,md5(string_agg(id||':'||md5(item::text),E'\\n' order by id collate \"C\")) digest from literacy_mock_items where content_version<>'literacy-mock-v12' group by content_version order by content_version")).rows;
 try{
  // Establish all eleven exact published catalogues before applying any new
  // migration. V11 must come from its frozen SQL, not today's authoring code.
  await db.exec(migration('20261020030000_literacy_mock_progression_v11.sql'));
  await db.exec(migration('20261016202515_literacy_mock_v10_quality_lookup.sql'));
  await db.exec(migration('20261020030001_literacy_mock_catalogue_v11.sql'));
  const before=await digest();assert.equal(before.length,11);
  assert.deepEqual(new Set(before.map(row=>row.content_version)),new Set(Array.from({length:11},(_,i)=>`literacy-mock-v${i+1}`)));
  const schema=migration(V12_SCHEMA_MIGRATION),catalogue=migration(V12_CATALOGUE_MIGRATION);
  assert.equal(schema,literacyMockV12SchemaSql(),'The checked-in schema is current.');
  assert.equal(catalogue,await literacyMockV12CatalogueSql(),'The checked-in catalogue is current.');
  await db.exec(migration('20261028040000_literacy_mock_beginner_vocabulary.sql'));
  assert.deepEqual(await digest(),before,'Quarantine cannot mutate old publications.');
  await db.exec(schema);await db.exec(catalogue);assert.deepEqual(await digest(),before);
  const helperNames=[...schema.matchAll(/create or replace function public\.(lp_\w+)\(/g)].map(match=>match[1]);
  assert.ok(helperNames.length>0);
  const helpers=await db.query("select p.proname,has_function_privilege('anon',p.oid,'EXECUTE') anon,has_function_privilege('authenticated',p.oid,'EXECUTE') authenticated from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=any($1::text[])",[helperNames]);
  assert.equal(helpers.rows.length,helperNames.length);
  for(const row of helpers.rows){assert.equal(row.anon,false,`${row.proname} is private to the server`);assert.equal(row.authenticated,false,`${row.proname} is private to the server`);}
  assert.equal((await db.query("select has_function_privilege('anon','public.teacher_prepare_literacy_mock_session_v12(uuid,uuid[],boolean,integer,integer,text,text)','EXECUTE') allowed")).rows[0].allowed,false);
  assert.equal(mockOfflineMediaAssetLimit('literacy-mock-v12'),1024);
  const bank=await loadLiteracyMockBank({contentVersion:'literacy-mock-v12'}),byId=new Map(bank.map(q=>[q.id,q]));
  for(const [name,outcome]of Object.entries({correct:()=>true,incorrect:()=>false,reversal:(_index,_item,areaIndex)=>areaIndex<5})){
   await db.exec(`set fixture.actor='${teacher}'`);
   // A separate isolated learner per pattern prevents previous patterns from
   // preteaching the next one. Retake history is covered by the real-bank gate.
   const learner=`33000000-0000-4000-8000-${name==='correct'?'000000000111':name==='incorrect'?'000000000112':'000000000113'}`;
   await db.query('insert into students values($1,$2,$3,$4,null)',[learner,classId,teacher,`V12 ${name}`]);
   await db.exec(`create or replace function student_from_token(token text) returns public.students language sql stable as $$ select s.* from public.students s where id=case when token='synthetic-token' then '${learner}'::uuid else null end and archived_at is null $$;`);
   const prepared=await prepare(db,`v12-${name}`,[learner]);assert.equal(prepared.ok,true,prepared.error);const id=prepared.session.id;
   assert.equal((await control(db,id,'start',0)).ok,true);
   let offlineIds=[];const plan=selectLiteracyMockPlan(bank,{sessionId:id,studentId:learner,onOfflineItems:ids=>{offlineIds=ids;}});
   assert.equal(plan.itemIds.length,124,'V12 retains the complete V11 planning budget.');
   assert.ok(mockOfflineMediaPaths(bank.filter(q=>offlineIds.includes(q.id))).length<=1024,'The complete branch reserve fits the unchanged device asset budget.');
   const registered=await save(db,id,'initial',0,plan);assert.equal(registered.ok,true,registered.error);
   // A forged jump after zero independent successes must fail server-side.
   const harder=bank.find(q=>q.domainId==='sound_awareness'&&q.adaptiveAreaBand===1&&q.adaptiveMixedEligible);
   const forged={...plan,itemIds:[harder.id,...plan.itemIds.slice(1)]};
   const rejected=await save(db,id,'forged-jump',registered.run.revision,forged);assert.equal(rejected.ok,false);
   const bootstrap=await batch(db,id,'bootstrap',null);assert.equal(bootstrap.ok,true,bootstrap.error);
   let {box,trace}=completeRequests(bootstrap,bank.filter(q=>offlineIds.includes(q.id)),outcome),received,n=0;
   while(box.requests.length){
    box=prepareMockDelivery(box,{batchId:`v12-delivery-${++n}`},storage());const sent=box.delivery.sent;
    received=await batch(db,id,sent.batchId,box.delivery.leaseId,sent.requests);assert.equal(received.ok,true,`${name} batch${n}: ${received.error}`);
    verifyMockOutboxReceipt(received,sent);
    const repeat=await batch(db,id,sent.batchId,box.delivery.leaseId,sent.requests);assert.equal(repeat.duplicate,true);
    box=acknowledgeMockOutbox(box,sent,received,request=>{const item=byId.get(request.response?.questionId||request.questionId);return {item,isCorrect:request.response?scoreLiteracyMockResponse(item,request.response.selected):undefined};},storage());
   }
   assert.equal(received.run.status,'completed');assert.equal(received.run.responses.length,trace.length);
   if(name==='correct')assert.equal(trace.length,108);if(name==='incorrect')assert.equal(trace.length,16);
   assert.deepEqual(await query(db,"select lp_mock_boundary_state_for_version(lp_mock_boundary_rows_v9($1,$2),'literacy-mock-v12') value",[id,learner]),literacyMockBoundaryState(received.run.responses,{bank:byId}));
   const collected=await control(db,id,'collect',received.mock.revision,'collect');assert.equal(collected.ok,true,collected.error);
   const report=buildLiteracyMockReport(await query(db,'select teacher_get_literacy_mock_report($1) value',[id]),{students:[{id:learner,name}]});const pupil=report.pupils[0];
   assert.equal(pupil.responses.length,trace.length);assert.equal(pupil.totals.independent,trace.length);assert.equal(pupil.areas.length,8);assert.equal(pupil.maximumPlanned,124);
   await db.exec(`set fixture.actor='${other}'`);assert.equal((await prepare(db,`${name}-foreign`,[learner])).ok,false);
  }
  await db.exec(`set fixture.actor='${teacher}'`);
  await db.exec(`create or replace function student_from_token(token text) returns public.students language sql stable as $$ select s.* from public.students s where id=case when token='synthetic-token' then '${studentId}'::uuid else null end and archived_at is null $$;`);
  const late=await prepare(db,'v12-late-help'),lateId=late.session.id;
  assert.equal(late.ok,true,late.error);assert.equal((await control(db,lateId,'start',0)).ok,true);
  let reserve=[];const initial=selectLiteracyMockPlan(bank,{sessionId:lateId,studentId,onOfflineItems:ids=>{reserve=ids;}}),pool=bank.filter(q=>reserve.includes(q.id));
  let state=await save(db,lateId,'late-initial',0,initial);
  while(true){
   const item=byId.get(state.run.plan.itemIds[state.run.responses.length]);
   if(item.domainId==='sound_awareness'&&item.adaptiveAreaBand===1)break;
   assert.equal((await event(db,lateId,item.id,'presented',`late-shown-${state.run.responses.length}`)).ok,true);
   state=await save(db,lateId,`late-answer-${state.run.responses.length}`,state.run.revision,null,answered(item));assert.equal(state.ok,true,state.error);
   const next=adaptLiteracyMockPlan(pool,state.run.plan,state.run.responses,[],state.run.presentations);
   state=await save(db,lateId,`late-adapt-${state.run.responses.length}`,state.run.revision,next);assert.equal(state.ok,true,state.error);
  }
  const higher=state.run.plan.itemIds[state.run.responses.length],first=state.run.responses.find(r=>r.domainId==='sound_awareness');
  const helped=await query(db,'select teacher_resolve_literacy_mock_support($1,$2,$3,$4,$5) value',[lateId,studentId,first.questionId,'answer','late-remove-entry-success']);
  assert.equal(helped.ok,true,helped.error);assert.equal(helped.run.responses.find(r=>r.questionId===first.questionId).evidenceType,'supported');
  assert.equal(literacyMockBoundaryState(helped.run.responses,{bank:byId}).sound_awareness.nextBand,0);
  assert.equal((await event(db,lateId,higher,'presented','stale-higher-after-help')).ok,false,'A formerly justified unseen harder question is rejected after late answer help.');
  const lower=adaptLiteracyMockPlan(pool,helped.run.plan,helped.run.responses,[],helped.run.presentations);
  assert.notEqual(lower.itemIds[helped.run.responses.length],higher);
  const restored=await save(db,lateId,'late-lower-plan',helped.run.revision,lower);assert.equal(restored.ok,true,restored.error);
  const shown=lower.itemIds[restored.run.responses.length];assert.equal(byId.get(shown).adaptiveAreaBand,0);
  assert.equal((await event(db,lateId,shown,'presented','late-lower-shown')).ok,true);
  const again=await query(db,'select teacher_resolve_literacy_mock_support($1,$2,$3,$4,$5) value',[lateId,studentId,first.questionId,'access','late-access-cannot-erase-answer']);
  assert.equal(again.run.responses.find(r=>r.questionId===first.questionId).evidenceType,'supported');
  const frozen=adaptLiteracyMockPlan(pool,again.run.plan,again.run.responses,[],again.run.presentations);
  assert.equal(frozen.itemIds[again.run.responses.length],shown,'An already shown easier question remains frozen.');
  assert.deepEqual(await digest(),before);
 }finally{await db.close();}
});
