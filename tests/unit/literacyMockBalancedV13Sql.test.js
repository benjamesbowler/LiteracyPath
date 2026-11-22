import assert from 'node:assert/strict';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { fixtureV10 } from '../helpers/literacyMockV10Database.js';
import { query, teacher, other, classId, studentId, secondStudent, foreignStudent, read } from '../helpers/literacyMockDatabase.js';
import { createLiteracyMockManifest } from '../../tools/generateLiteracyMockManifest.mjs';
import { V13_CATALOGUE_MIGRATION } from '../../tools/generateLiteracyMockV13Catalogue.mjs';
import { literacyMockV13SchemaSql, V13_SCHEMA_MIGRATION } from '../../tools/generateLiteracyMockV13Schema.mjs';
import { loadLiteracyMockRuntimeBank } from '../../src/data/literacyMockRuntimeBank.js';
import { selectLiteracyMockPlan, adaptLiteracyMockPlan, sameLiteracyMockPlan, replaceFailedLiteracyMockMedia } from '../../src/utils/literacyMockPlanner.js';
import { LITERACY_MOCK_BALANCED_VERSION as version } from '../../src/policy/literacyMockVersions.js';
import { createMockOutbox, appendMockOutbox, prepareMockDelivery, readMockOutbox,
  verifyMockOutboxReceipt, acknowledgeMockOutbox, MOCK_V5_DELIVERY_REQUEST_LIMIT } from '../../src/utils/literacyMockOutbox.js';
import { buildLiteracyMockReport } from '../../src/utils/literacyMockReport.js';
import { validateSupabaseResponse } from '../../src/data/boundaries/client.js';

const prepare = (db, versionNumber, cap, requestId, learners = [studentId]) => query(db,
  `select teacher_prepare_literacy_mock_session_v${versionNumber}($1,$2,false,40,$3,$4,'untimed') value`, [classId,learners,cap,requestId]);
const save = (db, id, req, revision, plan, response = null, token = 'synthetic-token') => query(db,
  'select student_save_literacy_mock_run($1,$2,$3,$4,$5,$6) value', [token,id,req,revision,plan,response]);
const present = (db, id, item, req) => query(db, "select student_record_literacy_mock_event('synthetic-token',$1,$2,'presented',$3) value", [id,item.id,req]);
const batch = (db, id, key, lease, requests = [], collection = null, token = 'synthetic-token') => query(db,
  'select student_sync_literacy_mock_batch($1,$2,$3,$4,$5,$6) value', [token,id,key,lease,requests,collection]);
const control = (db, id, action, revision, key = action) => query(db,
  'select teacher_control_literacy_mock_session($1,$2,$3,$4) value', [id,action,revision,key]);
const statusRpc = 'teacher_get_literacy_mock_status';
const status = (db, id) => query(db, 'select teacher_get_literacy_mock_status($1) value', [id]);
const report = (db, id) => query(db, 'select teacher_get_literacy_mock_report($1) value', [id]);
const selected = item => ({
  questionId:item.id, selected:item.answer, responseStatus:'answered', supportUsed:false,
  audioDelivery:Object.fromEntries(item.requiredAudioPaths.map(path=>[path,'completed']))
});

function deviceStorage() {
  const data = new Map();
  return { getItem:key => data.get(key) ?? null, setItem:(key,value) => data.set(key,value), removeItem:key => data.delete(key) };
}

function queueAnswer(box, item, disk) {
  const index = box.run.responses.length;
  const shown = appendMockOutbox(box, { type:'event', requestId:`show-${index}`, questionId:item.id, event:'presented' }, { item }, disk);
  return appendMockOutbox(shown, {
    requestId:`answer-${index}`, expectedRevision:shown.run.revision, plan:null, response:selected(item)
  }, { item, isCorrect:true }, disk);
}

test('V13 publishes the reviewed picture metadata independently of the frozen V12 record', async () => {
  const v12 = 'literacy-mock-v12';
  const id = 'mock.capacity.foundation.cluster-build.short_o.picture.cross';
  const historicDigest = 'd08a7b6f94713f673f481c12f6925d1324ba480912e2c0e8f81f2e39bd5e8de5';
  const [previous, current] = await Promise.all([v12, version].map(contentVersion => createLiteracyMockManifest({ contentVersion })));
  const expected = JSON.parse(JSON.stringify(current.items.find(item => item.id === id)));
  const currentDigest = expected.itemSnapshot.mediaDecision.reviewedAssets[0].sha256;
  assert.notEqual(currentDigest, historicDigest);

  const db = await PGlite.create();
  const item = contentVersion => query(db,
    'select item value from public.literacy_mock_items where content_version=$1 and id=$2', [contentVersion, id]);
  try {
    await db.exec(`create table public.literacy_mock_items (id text, content_version text, item jsonb, primary key(content_version,id));
      create table public.literacy_mock_publications (content_version text primary key, item_count integer not null);`);
    for (let i = 0; i < previous.items.length; i += 350) {
      await db.query(`insert into public.literacy_mock_items
        select item->>'id', $1, item from jsonb_array_elements($2::jsonb) item`,
      [v12, JSON.stringify(previous.items.slice(i, i + 350))]);
    }
    const migration = read(V13_CATALOGUE_MIGRATION);
    await db.exec(migration);
    assert.deepEqual(await item(version), expected);

    // Reproduce the single historical review digest observed on production.
    await db.query(`update public.literacy_mock_items
      set item=jsonb_set(item,'{itemSnapshot,mediaDecision,reviewedAssets,0,sha256}',to_jsonb($1::text),false)
      where content_version=$2 and id=$3`, [historicDigest, v12, id]);
    const frozen = await item(v12);
    assert.equal(frozen.itemSnapshot.mediaDecision.reviewedAssets[0].sha256, historicDigest);
    await db.exec(migration);
    assert.deepEqual(await item(version), expected);
    assert.deepEqual(await item(v12), frozen);
  } finally {
    await db.close();
  }
});

test('V13 availability, balanced offline delivery, teacher receipts and immutable legacy schedules', async t => {
  const db = await fixtureV10({ catalogue:true });
  try {
    const dependencies = ['20261016202515_literacy_mock_v10_quality_lookup.sql',
      '20261020030000_literacy_mock_progression_v11.sql', '20261020030001_literacy_mock_catalogue_v11.sql',
      '20261028040000_literacy_mock_beginner_vocabulary.sql', '20261028040100_literacy_mock_beginner_v12.sql',
      '20261028040101_literacy_mock_catalogue_v12.sql', '20261106055449_literacy_mock_question_limits.sql'];
    for (const name of dependencies) await db.exec(read(name));
    const digest = async () => (await db.query(`select content_version,count(*)::integer item_count,
      md5(string_agg(id||':'||md5(item::text),E'\\n' order by id collate "C")) digest
      from literacy_mock_items where content_version<>'literacy-mock-v13' group by content_version order by content_version`)).rows;
    const before = await digest();
    const beforeV12 = await prepare(db,12,15,'legacy-before-v13');
    assert.equal(beforeV12.ok,true,beforeV12.error);
    const oldId = beforeV12.session.id;
    const schedule = (id, contentVersion) => query(db, 'select lp_mock_session_boundary_schedule($1,\'[]\',lp_mock_boundary_state_for_version(\'[]\',$2),$2) value', [id,contentVersion]);
    const oldSchedule = await schedule(oldId, 'literacy-mock-v12');

    assert.equal(read(V13_SCHEMA_MIGRATION), literacyMockV13SchemaSql());
    await db.exec(read(V13_SCHEMA_MIGRATION));
    assert.equal(await query(db, 'select teacher_literacy_mock_v13_available() value'), false);
    assert.equal((await prepare(db,13,15,'unavailable')).error,'mock_v13_unavailable');
    await db.exec(read('20261122032258_literacy_mock_teacher_status.sql'));
    assert.equal(await query(db, 'select teacher_literacy_mock_v13_available() value'), false);
    await db.exec(read('20261122090100_literacy_mock_catalogue_v13.sql'));
    assert.equal(await query(db, 'select teacher_literacy_mock_v13_available() value'), true);
    assert.equal(await query(db, "select has_function_privilege('anon','public.teacher_literacy_mock_v13_available()','execute') value"), false);
    assert.equal(await query(db, "select has_function_privilege('anon','public.teacher_get_literacy_mock_status(uuid)','execute') value"), false);
    assert.equal(await query(db, "select has_function_privilege('authenticated','public.lp_mock_balanced_schedule_v13(jsonb,jsonb,uuid)','execute') value"), false);
    assert.deepEqual(await digest(),before);
    assert.deepEqual(await schedule(oldId,'literacy-mock-v12'),oldSchedule);
    const oldReceipt = await prepare(db,12,15,'legacy-before-v13');
    assert.equal(oldReceipt.duplicate,true);
    assert.equal(oldReceipt.session.id,oldId);
    const finishLegacy = await control(db,oldId,'collect',0,'collect-legacy');
    assert.equal(finishLegacy.ok,true,finishLegacy.error);

    await db.exec(`set fixture.actor='${other}'`);
    assert.equal((await prepare(db,13,15,'wrong-teacher')).ok, false);
    await db.exec(`set fixture.actor='${teacher}'`);
    assert.equal((await prepare(db,13,124,'wrong-count')).error, 'invalid_mock_options');

    const bank = await loadLiteracyMockRuntimeBank({ contentVersion:version, mixed:true });
    const byId = new Map(bank.map(item=>[item.id,item]));
    for (const itemCount of [15,25,40]) {
      // History remains isolated from production and from the other cap samples.
      await db.query('delete from literacy_mock_events where student_id=$1',[studentId]);
      await db.query('delete from literacy_mock_runs where student_id=$1',[studentId]);
      const prepared = await prepare(db,13,itemCount,`cap-${itemCount}`);
      assert.equal(prepared.ok,true,prepared.error);
      const id = prepared.session.id;
      assert.equal(prepared.session.mock.capabilities.preRenderMediaFailure,true);
      const options = { sessionId:id, studentId, itemCount };
      const offlineIds = new Set();
      let plan = selectLiteracyMockPlan(bank, { ...options,onOfflineItems:ids => ids.forEach(itemId => offlineIds.add(itemId)) });
      assert.deepEqual(await schedule(id,version),plan.itemIds.map(itemId=>byId.get(itemId).domainId));
      const started = await control(db,id,'start',0);
      assert.equal(started.ok,true,started.error);
      let result = await save(db,id,'initial',0,plan);
      assert.equal(result.ok,true,result.error);
      if (itemCount === 15) {
        const item = byId.get(plan.itemIds[0]);
        const missingPresentation = await save(db,id,'no-presentation',result.run.revision,null,selected(item));
        assert.equal(missingPresentation.error, 'presentation_required');
        const repair = [...item.requiredAudioPaths,...item.requiredImagePaths].map(path => {
          const failed = { questionId:item.id, failedMediaPaths:[path] };
          return { failed, ...replaceFailedLiteracyMockMedia(bank,plan,[],[failed],[],{ exposures:[item] }) };
        }).find(candidate => !candidate.unavailable);
        assert.ok(repair, `No exact media repair exists for fixture question ${item.id}`);
        const response = {...repair.failed, responseStatus:'media_failed', selected:null, supportUsed:false, audioDelivery:{}};
        result = await save(db,id,'missing-media',result.run.revision,null,response);
        assert.equal(result.ok,true,result.error);
        assert.deepEqual(result.run.responses,[]);
        assert.equal(result.run.mediaFailures[0].questionId,item.id);
        assert.deepEqual(result.run.presentations,[]);
        result = await save(db,id,'same-task-media-repair',result.run.revision,repair.plan);
        assert.equal(result.ok,true,result.error);
        plan = repair.plan;
        plan.itemIds.forEach(itemId => offlineIds.add(itemId));
      }
      const lease = await batch(db,id,'bootstrap',null);
      assert.equal(lease.ok,true,lease.error);
      assert.ok(lease.run.offlineLeaseId);
      result = lease;
      const offlineBank = bank.filter(item => offlineIds.has(item.id));
      const onlinePrefix = 2;
      while (result.run.responses.length < onlinePrefix) {
        const index = result.run.responses.length;
        const item = byId.get(plan.itemIds[index]);
        const presented = await present(db,id,item,`show-${index}`);
        assert.equal(presented.ok,true,`cap ${itemCount} shown ${index}: ${presented.error}`);
        result = await save(db,id,`answer-${index}`,result.run.revision,null,selected(item));
        assert.equal(result.ok,true,`cap ${itemCount} answer ${index}: ${result.error}`);
        const next = adaptLiteracyMockPlan(offlineBank,plan,result.run.responses,result.run.mediaFailures,result.run.presentations,options);
        if (!sameLiteracyMockPlan(plan,next)) {
          result = await save(db,id,`adapt-${index}`,result.run.revision,next);
          assert.equal(result.ok,true,`cap ${itemCount} after ${index}: ${result.error}`);
        }
        plan = next;
      }
      const disk = deviceStorage();
      let box = createMockOutbox({
        studentId, sessionId:id, run:result.run, mock:result.mock,
        focusSession:{ ...started.session, expires_at:lease.run.offlineLeaseExpiresAt }, mediaItemIds:[...offlineIds]
      });
      while (box.run.status !== 'completed') {
        const index = box.run.responses.length;
        const itemId = box.run.plan.itemIds[index];
        assert.ok(offlineIds.has(itemId), `cap ${itemCount} uses the retained device reserve`);
        box = queueAnswer(box,byId.get(itemId),disk);
        if (box.run.status === 'completed') break;
        const next = adaptLiteracyMockPlan(offlineBank,box.run.plan,box.run.responses,box.run.mediaFailures,box.run.presentations,options);
        if (!sameLiteracyMockPlan(box.run.plan,next)) {
          box = appendMockOutbox(box,{ requestId:`adapt-${index}`, expectedRevision:box.run.revision, plan:next, response:null },{},disk);
        }
      }
      assert.equal(box.run.responses.length,itemCount);
      const offlineStatus = await status(db,id);
      assert.equal(offlineStatus.members[0].receipt_state,'device_open');
      assert.equal(offlineStatus.members[0].answered,onlinePrefix);
      const plannedAnswers = box.run.responses.map(row => [row.questionId,row.selected]);
      let chunk = 0;
      while (box.requests.length) {
        box = prepareMockDelivery(box,{ batchId:`delivery-${++chunk}` },disk);
        const { collectionId, leaseId, sent } = box.delivery;
        assert.ok(sent.requests.length <= MOCK_V5_DELIVERY_REQUEST_LIMIT);
        result = await batch(db,id,sent.batchId,leaseId,sent.requests,collectionId);
        assert.equal(result.ok,true,`cap ${itemCount} batch ${chunk}: ${result.error}`);
        verifyMockOutboxReceipt(result,sent);
        const restored = readMockOutbox(studentId,id,disk);
        assert.deepEqual(prepareMockDelivery(restored,{ batchId:'after-reload' },disk).delivery,box.delivery);
        const repeat = await batch(db,id,sent.batchId,leaseId,sent.requests,collectionId);
        assert.deepEqual(repeat,{ ...result,duplicate:true });
        box = acknowledgeMockOutbox(restored,restored.delivery.sent,repeat,request => ({
          item:byId.get(request.questionId || request.response?.questionId),
          isCorrect:request.response ? true : undefined
        }),disk);
      }
      assert.ok(chunk > 1);
      assert.equal(box.serverRun.status,'completed');
      assert.deepEqual(box.serverRun.responses.map(row => [row.questionId,row.selected]),plannedAnswers);
      assert.ok(box.serverRun.responses.every(row => row.isCorrect === true && row.serverReceivedAt));
      const collected = await control(db,id,'collect',result.mock.revision);
      assert.equal(collected.ok,true,collected.error);
      const teacherStatus = await status(db,id);
      validateSupabaseResponse('rpc',statusRpc,{ data:teacherStatus,error:null });
      assert.equal(teacherStatus.session.mock.state,'completed');
      assert.equal(teacherStatus.session.mock.collection_received_count,1);
      const member = teacherStatus.members[0];
      assert.equal(member.student_id,studentId);
      assert.equal(member.receipt_state,'received');
      assert.equal(member.answered,itemCount);
      assert.equal(member.planned,itemCount);
      assert.equal(member.media_failures,itemCount === 15 ? 1 : 0);
      assert.equal(Object.hasOwn(member,'run'),false);
      const fullReport = await report(db,id);
      assert.equal(fullReport.ok,true);
      const pupil = buildLiteracyMockReport(fullReport,{ students:[{ id:studentId,name:'Synthetic learner' }] }).pupils[0];
      assert.equal(pupil.run.status,'completed');
      assert.equal(pupil.maximumPlanned,itemCount);
      assert.equal(pupil.totals.independent,itemCount);
      assert.deepEqual(pupil.responses.map(row => [row.questionId,row.selected]),plannedAnswers);
      t.diagnostic(`${itemCount} answers verified after ${chunk} offline batches and exact duplicate receipts`);
    }

    // Separate transport evidence from the number of finished questions.
    await db.query('delete from literacy_mock_events where student_id=$1',[studentId]);
    await db.query('delete from literacy_mock_runs where student_id=$1',[studentId]);
    await db.exec(`create or replace function student_from_token(token text) returns public.students language sql stable as $$
      select s.* from public.students s where s.id=case token
        when 'synthetic-token' then '${studentId}'::uuid when 'second-token' then '${secondStudent}'::uuid
        when 'foreign-token' then '${foreignStudent}'::uuid end and s.archived_at is null $$`);
    const partial = await prepare(db,13,15,'partial-receipts',[studentId,secondStudent]);
    assert.equal(partial.ok,true,partial.error);
    const sessionId = partial.session.id;
    const started = await control(db,sessionId,'start',0);
    assert.equal(started.ok,true,started.error);
    const devices = new Map();
    for (const [id,token] of [[studentId,'synthetic-token'],[secondStudent,'second-token']]) {
      const plan = selectLiteracyMockPlan(bank,{ sessionId,studentId:id,itemCount:15 });
      const initial = await save(db,sessionId,'initial',0,plan,null,token);
      assert.equal(initial.ok,true,initial.error);
      const lease = await batch(db,sessionId,'bootstrap',null,[],null,token);
      assert.equal(lease.ok,true,lease.error);
      const box = createMockOutbox({ studentId:id,sessionId,run:lease.run,mock:lease.mock,
        focusSession:{ ...started.session, expires_at:lease.run.offlineLeaseExpiresAt } });
      const disk = deviceStorage();
      const queued = queueAnswer(box,byId.get(plan.itemIds[0]),disk);
      devices.set(id,{ token,disk,queued });
    }
    const collection = await control(db,sessionId,'collect',started.session.mock.revision,'collect-partial');
    assert.equal(collection.ok,true,collection.error);
    assert.equal(collection.session.mock.collection_id,'collect-partial');
    const firstDevice = devices.get(studentId);
    const first = prepareMockDelivery(firstDevice.queued,{ batchId:'partial-first',collectionId:'collect-partial' },firstDevice.disk);
    const firstDelivery = first.delivery;
    const wrongLearner = await batch(db,sessionId,'foreign-request',firstDelivery.leaseId,firstDelivery.sent.requests,
      firstDelivery.collectionId,'foreign-token');
    assert.equal(wrongLearner.error,'assignment_not_found');
    const firstReceipt = await batch(db,sessionId,firstDelivery.batchId,firstDelivery.leaseId,firstDelivery.sent.requests,firstDelivery.collectionId);
    verifyMockOutboxReceipt(firstReceipt,firstDelivery.sent);
    assert.equal(firstReceipt.run.collectionAckId,'collect-partial');
    assert.equal(firstReceipt.run.responses.length,1);
    assert.equal(firstReceipt.run.status,'running');
    const interrupted = await status(db,sessionId);
    const interruptedMembers = new Map(interrupted.members.map(member => [member.student_id,member]));
    assert.equal(interruptedMembers.get(studentId).receipt_state,'received');
    assert.equal(interruptedMembers.get(secondStudent).receipt_state,'awaiting_connection');
    assert.equal(interrupted.session.mock.collection_pending_count,1);
    await db.query("update literacy_mock_runs set offline_lease_expires_at=clock_timestamp()-interval '1 second' where session_id=$1 and student_id=$2",
      [sessionId,secondStudent]);
    const secondDevice = devices.get(secondStudent);
    const second = prepareMockDelivery(secondDevice.queued,{ batchId:'partial-second',collectionId:'collect-partial' },secondDevice.disk);
    const late = await batch(db,sessionId,second.delivery.batchId,second.delivery.leaseId,second.delivery.sent.requests,
      second.delivery.collectionId,secondDevice.token);
    assert.equal(late.error,'invalid_device_lease');
    await db.query(`update student_focus_sessions set started_at=clock_timestamp()-interval '12 hours',
      expires_at=clock_timestamp()-interval '1 second' where id=$1`,[sessionId]);
    const ended = await status(db,sessionId);
    validateSupabaseResponse('rpc',statusRpc,{ data:ended,error:null });
    assert.equal(ended.session.mock.end_reason,'session_expired');
    assert.equal(ended.session.mock.collection_received_count,1);
    assert.equal(ended.session.mock.collection_pending_count,0);
    assert.equal(ended.session.mock.collection_expired_count,1);
    assert.deepEqual(ended.members.map(member => [member.student_id,member.receipt_state,member.answered]),[
      [studentId,'received',1],[secondStudent,'expired',0]
    ]);
    const detailed = await report(db,sessionId);
    assert.equal(detailed.ok,true);
    assert.deepEqual(new Map(detailed.members.map(member => [member.student_id,member.run.responses.length])),
      new Map([[studentId,1],[secondStudent,0]]));
    await db.exec(`set fixture.actor='${other}'`);
    assert.equal((await status(db,sessionId)).error,'session_not_found');
    assert.equal((await report(db,sessionId)).ok,false);
  } finally {
    await db.close();
  }
});
