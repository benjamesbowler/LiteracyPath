import assert from 'node:assert/strict';
import test from 'node:test';
import { fixtureV10 } from '../helpers/literacyMockV10Database.js';
import { query, teacher, other, classId, studentId, read } from '../helpers/literacyMockDatabase.js';
import { literacyMockV14SchemaSql, V14_SCHEMA_MIGRATION } from '../../tools/generateLiteracyMockV14Schema.mjs';
import { CONTINUOUS_ROUTING_MIGRATION, literacyMockContinuousRoutingSql } from '../../tools/generateLiteracyMockContinuousRouting.mjs';
import { continuousLiteracyMockBand, LITERACY_MOCK_CONTINUOUS_EXCLUDED_IDS } from '../../src/policy/literacyMockContinuousRouting.js';
import { LITERACY_MOCK_AREA_MAX } from '../../src/policy/literacyMockAdaptivePolicy.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';
import { loadLiteracyMockRuntimeBank } from '../../src/data/literacyMockRuntimeBank.js';
import { createWholeClassMockSession, submitWholeClassMockAnswer } from '../../src/components/teacher/wholeClassPracticeModel.js';
import { replaceFailedLiteracyMockMedia, sameLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';
import { LITERACY_MOCK_ADAPTIVE_VERSION as version, LITERACY_MOCK_CONTINUOUS_ROUTING as continuous } from '../../src/policy/literacyMockVersions.js';

const prepare = (db, cap, policy = null, key = 'fixture-' + policy + '-' + cap) => {
  const rpc = policy === continuous ? 'teacher_prepare_literacy_mock_continuous_session' : 'teacher_prepare_literacy_mock_session_v14';
  return query(db, `select ${rpc}($1,$2,false,40,$3,$4,'untimed') value`, [classId, [studentId], cap, key]);
};
const save = (db, id, key, revision, plan, answer) => query(db,
  "select student_save_literacy_mock_run('synthetic-token',$1,$2,$3,$4,$5) value", [id, key, revision, plan, answer]);
const control = (db, id, action, revision) => query(db,
  'select teacher_control_literacy_mock_session($1,$2,$3,$4) value', [id, action, revision, action]);
const batch = (db, id, key, lease, requests) => query(db,
  "select student_sync_literacy_mock_batch('synthetic-token',$1,$2,$3,$4,null) value",
  [id,key,lease,JSON.stringify(requests)]);
const check = result => { assert.equal(result.ok, true, result.error); return result; };

async function checkBandParity(db) {
  const cases = [];
  for (const [domainId, maximum] of Object.entries(LITERACY_MOCK_AREA_MAX)) {
    for (let band = 0; band <= maximum; band++) {
      const previous = { domainId, adaptiveAreaBand:band, adaptiveAreaVersion:'areas-v6' };
      for (const target of Object.keys(LITERACY_MOCK_AREA_MAX)) {
        for (const evidence of [
          { isCorrect:true }, { isCorrect:false }, { isCorrect:true,supportUsed:true },
          { isCorrect:true,knownFamiliar:true }, { isCorrect:true,classification:'supported' },
          { isCorrect:null,responseStatus:'skipped',evidenceType:'unscored' },
        ]) {
          const row = { responseStatus:'answered',evidenceType:'independent',itemSnapshot:previous,...evidence };
          cases.push({ target, history:[row,{responseStatus:'media_failed'}], expected:continuousLiteracyMockBand(row,previous,target) });
        }
      }
    }
  }
  cases.push({ target:'reading',history:[],expected:1 }, { target:'print',history:[{responseStatus:'media_failed'}],expected:1 });
  const mismatches = await query(db,`select coalesce(jsonb_agg(to_jsonb(c)), '[]') value
    from jsonb_to_recordset($1::jsonb) c(target text,history jsonb,expected integer)
    where lp_mock_continuous_next_band(c.history,c.target) is distinct from c.expected`,[JSON.stringify(cases)]);
  assert.deepEqual(mismatches,[]);
  return cases.length;
}

function incorrectAnswer(item) {
  if (item.format === 'build_word') return item.answer + 'x';
  if (!Array.isArray(item.answer)) return item.choices.find(choice => choice.id !== item.answer).id;
  if (item.answer.length > 1) return item.answer.slice(1);
  return [item.choices.find(choice => choice.id !== item.answer[0]).id];
}

test('V14 accepts the same lower and higher routes as the shared classroom test and preserves V13', async t => {
  const db = await fixtureV10({ catalogue: true });
  try {
    for (const name of ['20261016202515_literacy_mock_v10_quality_lookup.sql','20261020030000_literacy_mock_progression_v11.sql',
      '20261020030001_literacy_mock_catalogue_v11.sql','20261028040000_literacy_mock_beginner_vocabulary.sql',
      '20261028040100_literacy_mock_beginner_v12.sql','20261028040101_literacy_mock_catalogue_v12.sql',
      '20261106055449_literacy_mock_question_limits.sql','20261122032258_literacy_mock_teacher_status.sql',
      '20261122090000_literacy_mock_short_routing_v13.sql','20261122090100_literacy_mock_catalogue_v13.sql']) await db.exec(read(name));
    assert.equal(read(V14_SCHEMA_MIGRATION), literacyMockV14SchemaSql());
    await db.exec(read(V14_SCHEMA_MIGRATION));
    assert.equal(await query(db, 'select teacher_literacy_mock_v14_available() value'), false);
    assert.equal((await prepare(db, 15)).error, 'mock_v14_unavailable');
    await db.exec(read('20261124090100_literacy_mock_catalogue_v14.sql'));
    await db.exec(read('20261124090200_literacy_mock_v14_picture_quarantine.sql'));
    const existingId = check(await prepare(db,15)).session.id;
    assert.equal(read(CONTINUOUS_ROUTING_MIGRATION), literacyMockContinuousRoutingSql());
    await db.exec(read(CONTINUOUS_ROUTING_MIGRATION));
    const oldReceipt = check(await prepare(db,15));
    assert.equal(oldReceipt.duplicate,true);
    assert.equal(oldReceipt.session.id,existingId);
    assert.equal(oldReceipt.session.mock.routing_policy,null);
    t.diagnostic(await checkBandParity(db) + ' SQL/JavaScript band comparisons including every direction, ceiling, floor and neutral result');
    const excluded = await query(db, `select array_agg(id order by id) value from literacy_mock_items
      where content_version=$1 and lp_mock_continuous_item_excluded(id)`,[version]);
    assert.deepEqual(excluded,LITERACY_MOCK_CONTINUOUS_EXCLUDED_IDS.slice().sort());
    assert.equal(await query(db, 'select teacher_literacy_mock_v14_available() value'), true);
    const ambiguous = ['mock.v8.reading.0.mat.v11','mock.v8.reading.1.pup.v11','mock.v12.beginner-reading.1.run'];
    for (const published of ['literacy-mock-v13',version]) {
      for (const id of ambiguous) {
        // Use literal snapshots even for IDs reserved outside the old scored catalogue.
        const quarantined = await query(db, 'select lp_literacy_item_quarantined($1::jsonb) value',
          [{itemSnapshot:{ id, contentVersion:published }}]);
        assert.equal(quarantined,published===version,published+' '+id);
      }
    }
    assert.equal(await query(db, "select (lp_mock_boundary_state_for_version('[]','literacy-mock-v13')#>>'{phonics,nextBand}')::integer value"), 0);
    assert.equal(await query(db, "select has_function_privilege('anon','public.teacher_literacy_mock_v14_available()','execute') value"), false);
    assert.equal(await query(db, "select has_function_privilege('authenticated','public.lp_mock_boundary_state_v14(jsonb)','execute') value"), false);
    for (const role of ['anon','authenticated']) {
      const preparePrivilege = await query(db,"select has_function_privilege($1,'teacher_prepare_literacy_mock_continuous_session(uuid,uuid[],boolean,integer,integer,text,text)','execute') value",[role]);
      assert.equal(preparePrivilege,role==='authenticated');
      assert.equal(await query(db,"select has_function_privilege($1,'lp_mock_continuous_next_band(jsonb,text)','execute') value",[role]),false);
      assert.equal(await query(db,"select has_function_privilege($1,'lp_mock_continuous_item_excluded(text)','execute') value",[role]),false);
    }
    await db.exec(`set fixture.actor='${other}'`);
    assert.equal((await prepare(db, 15)).ok, false);
    assert.equal((await prepare(db, 15, continuous)).ok, false);
    await db.exec(`set fixture.actor='${teacher}'`);
    assert.equal((await prepare(db, 124)).error, 'invalid_mock_options');
    const bank = await loadLiteracyMockRuntimeBank({ contentVersion: version, mixed: true });
    for (const { routingPolicy, itemCount } of [null, continuous].flatMap(routingPolicy => [15,25,40].map(itemCount => ({routingPolicy,itemCount})))) {
      const prepared = check(await prepare(db, itemCount, routingPolicy)), id = prepared.session.id;
      assert.equal(prepared.session.content_version, version);
      assert.equal(prepared.session.mock.routing_policy,routingPolicy);
      assert.equal(check(await prepare(db,itemCount,routingPolicy)).duplicate,true);
      const originalKey = 'fixture-' + routingPolicy + '-' + itemCount;
      assert.equal((await prepare(db,itemCount,routingPolicy === continuous ? null : continuous,originalKey)).error,'request_conflict');
      const pupil = check(await query(db, "select student_get_literacy_mock_run('synthetic-token',$1) value",[id]));
      assert.equal(pupil.mock.routing_policy,routingPolicy);
      assert.equal(pupil.mock.capabilities.offlineDelivery,true);
      const started = check(await control(db,id,'start',0));
      let session = createWholeClassMockSession(bank, { sessionId:id, studentId, itemCount, routingPolicy });
      if (routingPolicy === continuous) {
        const invalid = { ...session.run.plan, itemIds:session.run.plan.itemIds.slice() };
        invalid.itemIds[0] = LITERACY_MOCK_CONTINUOUS_EXCLUDED_IDS[0];
        const planError = await query(db,'select lp_mock_boundary_plan_error_v9($1,$2,$3,null,0,$4) value',[id,studentId,invalid,'[]']);
        assert.equal(planError,'content_item_withdrawn');
        const repairError = await query(db,'select lp_mock_boundary_plan_error_v9($1,$2,$3,$4,0,$5) value',
          [id,studentId,invalid,session.run.plan,JSON.stringify([{questionId:session.run.plan.itemIds[0]}])]);
        assert.equal(repairError,'content_item_withdrawn');
      }
      let entryPlan = session.run.plan;
      if (itemCount === 40) {
        const elsewhere = session.rounds.filter((_,index) => index !== 1);
        const history = buildLiteracyExposureIndex({exposures:elsewhere});
        const nextArea = session.rounds[1].domainId;
        const alternate = bank.find(item => item.domainId === nextArea && item.adaptiveAreaBand === 0
          && !LITERACY_MOCK_CONTINUOUS_EXCLUDED_IDS.includes(item.id)
          && !elsewhere.some(otherItem => otherItem.stimulusKey === item.stimulusKey)
          && !getLiteracyExposure(item,history).knownFamiliar);
        assert.ok(alternate);
        const future = {...entryPlan,itemIds:entryPlan.itemIds.map((id,index) => index === 1 ? alternate.id : id)};
        if (routingPolicy === continuous) entryPlan = future;
        else assert.equal((await save(db,id,'wrong-historical-placeholder',0,future,null)).error,'invalid_entry_level');
      }
      let result = check(await save(db,id,'entry',0,entryPlan,null));
      const offline = routingPolicy === continuous && itemCount === 15;
      const lease = offline ? check(await batch(db,id,'bootstrap',null,[])) : null;
      if (lease) {
        assert.equal(lease.mock.routing_policy,continuous);
        assert.ok(lease.run.offlineLeaseId);
      }
      let mediaRepaired = false;
      let stalePresentationRejected = false;
      while (result.run.status !== 'completed') {
        const index = result.run.responses.length;
        const item = session.rounds[index];
        if (offline && !mediaRepaired) {
          const path = [...item.requiredAudioPaths,...item.requiredImagePaths].find(path => {
            const failed = {questionId:item.id,failedMediaPaths:[path]};
            const repair = replaceFailedLiteracyMockMedia(bank,session.run.plan,session.run.responses,
              [failed],session.run.presentations,session.options);
            return !repair.unavailable;
          });
          if (path) {
            const failure = {questionId:item.id,selected:null,responseStatus:'media_failed',supportUsed:false,
              failedMediaPaths:[path],audioDelivery:{}};
            result = check(await save(db,id,'media-before-render',result.run.revision,null,failure));
            session = submitWholeClassMockAnswer(session,item,failure);
            assert.equal(result.run.responses.length,index);
            assert.equal(result.run.mediaFailures.length,1);
            assert.equal(session.rounds[index].adaptiveAreaBand,item.adaptiveAreaBand);
            assert.equal(session.rounds[index].skillId,item.skillId);
            result = check(await save(db,id,'media-repair',result.run.revision,session.run.plan,null));
            mediaRepaired = true;
            continue;
          }
        }
        const wrong = routingPolicy === continuous ? (index % 9) >= 5 : item.format === 'choice' && (index % 4 === 0);
        const skip = routingPolicy === continuous && index % 13 === 8;
        const response = { questionId:item.id, responseStatus:skip ? 'skipped' : 'answered', supportUsed:routingPolicy === continuous && index % 12 === 7,
          selected:skip ? null : wrong ? incorrectAnswer(item) : item.answer,
          audioDelivery:Object.fromEntries(item.requiredAudioPaths.map(path => [path,'completed'])) };
        if (!index) assert.equal((await save(db,id,'unseen',result.run.revision,null,response)).error,'presentation_required');
        check(await query(db, "select student_record_literacy_mock_event('synthetic-token',$1,$2,'presented',$3) value", [id,item.id,'shown-'+index]));
        if (routingPolicy === continuous && itemCount === 25 && index === 1) {
          const previousId = result.run.responses[0].questionId;
          const helped = check(await query(db,"select teacher_resolve_literacy_mock_support($1,$2,$3,'answer',$4) value",
            [id,studentId,previousId,'late-answer-assistance']));
          assert.equal(helped.run.responses[0].supportUsed,true);
          assert.equal(helped.run.plan.itemIds[index],item.id);
          const held = check(await query(db,"select student_record_literacy_mock_event('synthetic-token',$1,$2,'presented',$3) value",
            [id,item.id,'rerender-after-assistance']));
          assert.equal(held.duplicate,true);
          const expectedNow = continuousLiteracyMockBand(helped.run.responses[0],session.byId.get(previousId),item.domainId);
          assert.notEqual(item.adaptiveAreaBand,expectedNow);
          session = {...session,run:{...session.run,responses:helped.run.responses}};
        }
        if (offline && index === 0) {
          const alternate = bank.find(candidate => candidate.domainId === item.domainId
            && candidate.adaptiveAreaBand === item.adaptiveAreaBand && !session.run.plan.itemIds.includes(candidate.id)
            && !LITERACY_MOCK_CONTINUOUS_EXCLUDED_IDS.includes(candidate.id));
          const swapped = {...session.run.plan,itemIds:[alternate.id,...session.run.plan.itemIds.slice(1)]};
          assert.equal(await query(db,'select lp_mock_boundary_plan_error_v9($1,$2,$3,$4,0,$5) value',
            [id,studentId,swapped,session.run.plan,JSON.stringify(result.run.mediaFailures)]),'presented_item_frozen');
        }
        const revision = result.run.revision;
        if (offline && index === 2) {
          const mutations = [{type:'save',requestId:'answer-'+index,expectedRevision:revision,plan:null,response}];
          result = check(await batch(db,id,'device-answer',lease.run.offlineLeaseId,mutations));
          const repeat = check(await batch(db,id,'device-answer',lease.run.offlineLeaseId,mutations));
          assert.deepEqual(repeat,{...result,duplicate:true});
          assert.equal(result.mock.routing_policy,routingPolicy);
        } else result = check(await save(db,id,'answer-'+index,revision,null,response));
        assert.equal(result.run.responses.at(-1).isCorrect,skip ? null : !wrong);
        if (!index) assert.equal(check(await save(db,id,'answer-'+index,revision,null,response)).duplicate,true);
        session = submitWholeClassMockAnswer(session,item,response);
        if (routingPolicy === continuous && session.rounds[index+1]) {
          const next = session.rounds[index+1], previous = result.run.responses.at(-1);
          assert.equal(next.adaptiveAreaBand,continuousLiteracyMockBand(previous,item,next.domainId),
            `${item.id} after ${previous.evidenceType} ${previous.isCorrect} -> ${next.id}`);
          const placeholder = session.byId.get(result.run.plan.itemIds[index+1]);
          if (!stalePresentationRejected && placeholder.domainId === next.domainId
            && placeholder.adaptiveAreaBand !== next.adaptiveAreaBand) {
            const stale = await query(db,"select student_record_literacy_mock_event('synthetic-token',$1,$2,'presented',$3) value",
              [id,placeholder.id,'stale-level-on-domain-switch']);
            assert.equal(stale.error,'invalid_adaptation');
            const bypassed = {questionId:placeholder.id,responseStatus:'answered',selected:placeholder.answer,
              supportUsed:false,audioDelivery:Object.fromEntries(placeholder.requiredAudioPaths.map(path => [path,'completed']))};
            assert.equal((await save(db,id,'answer-stale-placeholder',result.run.revision,null,bypassed)).error,'presentation_required');
            stalePresentationRejected = true;
          }
        }
        if (!sameLiteracyMockPlan(session.run.plan,result.run.plan)) {
          result = check(await save(db,id,'plan-'+index,result.run.revision,session.run.plan,null));
        }
        assert.deepEqual(session.run.responses.map(row=>row.questionId),result.run.responses.map(row=>row.questionId));
      }
      assert.equal(result.run.responses.length,itemCount);
      if (offline) assert.equal(mediaRepaired,true);
      if (routingPolicy === continuous) assert.equal(stalePresentationRejected,true);
      check(await control(db,id,'collect',started.session.mock.revision));
      const report = check(await query(db,'select teacher_get_literacy_mock_report($1) value',[id]));
      assert.equal(report.members[0].run.responses.length,itemCount);
      assert.deepEqual(report.members[0].run.responses.map(row => row.isCorrect),result.run.responses.map(row => row.isCorrect));
      t.diagnostic(itemCount + ' canonical answers with client/SQL route parity for ' + (routingPolicy || 'historical V14'));
      // Independent caps get clean history inside this isolated database.
      await db.query('delete from literacy_mock_events where student_id=$1',[studentId]);
      await db.query('delete from literacy_mock_runs where student_id=$1',[studentId]);
    }
  } finally { await db.close(); }
});
