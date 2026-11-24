import assert from 'node:assert/strict';
import test from 'node:test';
import { fixtureV10 } from '../helpers/literacyMockV10Database.js';
import { query, teacher, other, classId, studentId, read } from '../helpers/literacyMockDatabase.js';
import { literacyMockV14SchemaSql, V14_SCHEMA_MIGRATION } from '../../tools/generateLiteracyMockV14Schema.mjs';
import { loadLiteracyMockRuntimeBank } from '../../src/data/literacyMockRuntimeBank.js';
import { createWholeClassMockSession, submitWholeClassMockAnswer } from '../../src/components/teacher/wholeClassPracticeModel.js';
import { sameLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';
import { LITERACY_MOCK_ADAPTIVE_VERSION as version } from '../../src/policy/literacyMockVersions.js';

const prepare = (db, cap) => query(db, "select teacher_prepare_literacy_mock_session_v14($1,$2,false,40,$3,$4,'untimed') value",
  [classId, [studentId], cap, 'fixture-cap-' + cap]);
const save = (db, id, key, revision, plan, answer) => query(db,
  "select student_save_literacy_mock_run('synthetic-token',$1,$2,$3,$4,$5) value", [id, key, revision, plan, answer]);
const control = (db, id, action, revision) => query(db,
  'select teacher_control_literacy_mock_session($1,$2,$3,$4) value', [id, action, revision, action]);
const check = result => { assert.equal(result.ok, true, result.error); return result; };

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
    await db.exec(`set fixture.actor='${other}'`);
    assert.equal((await prepare(db, 15)).ok, false);
    await db.exec(`set fixture.actor='${teacher}'`);
    assert.equal((await prepare(db, 124)).error, 'invalid_mock_options');
    const bank = await loadLiteracyMockRuntimeBank({ contentVersion: version, mixed: true });
    for (const itemCount of [15,25,40]) {
      const prepared = check(await prepare(db, itemCount)), id = prepared.session.id;
      assert.equal(prepared.session.content_version, version);
      const started = check(await control(db,id,'start',0));
      let session = createWholeClassMockSession(bank, { sessionId:id, studentId, itemCount });
      let result = check(await save(db,id,'entry',0,session.run.plan,null));
      while (result.run.status !== 'completed') {
        const index = result.run.responses.length;
        const item = session.rounds[index];
        const wrong = item.format === 'choice' && (index % 4 === 0);
        const response = { questionId:item.id, responseStatus:'answered', supportUsed:false,
          selected:wrong ? item.choices.find(choice => choice.id !== item.answer).id : item.answer,
          audioDelivery:Object.fromEntries(item.requiredAudioPaths.map(path => [path,'completed'])) };
        if (!index) assert.equal((await save(db,id,'unseen',result.run.revision,null,response)).error,'presentation_required');
        check(await query(db, "select student_record_literacy_mock_event('synthetic-token',$1,$2,'presented',$3) value", [id,item.id,'shown-'+index]));
        const revision = result.run.revision;
        result = check(await save(db,id,'answer-'+index,revision,null,response));
        assert.equal(result.run.responses.at(-1).isCorrect,!wrong);
        if (!index) assert.equal(check(await save(db,id,'answer-'+index,revision,null,response)).duplicate,true);
        session = submitWholeClassMockAnswer(session,item,response);
        if (!sameLiteracyMockPlan(session.run.plan,result.run.plan)) {
          result = check(await save(db,id,'plan-'+index,result.run.revision,session.run.plan,null));
        }
        assert.deepEqual(session.run.responses.map(row=>row.questionId),result.run.responses.map(row=>row.questionId));
      }
      assert.equal(result.run.responses.length,itemCount);
      check(await control(db,id,'collect',started.session.mock.revision));
      const report = check(await query(db,'select teacher_get_literacy_mock_report($1) value',[id]));
      assert.equal(report.members[0].run.responses.length,itemCount);
      t.diagnostic(itemCount + ' canonical answers with client/SQL route parity');
      // Independent caps get clean history inside this isolated database.
      await db.query('delete from literacy_mock_events where student_id=$1',[studentId]);
      await db.query('delete from literacy_mock_runs where student_id=$1',[studentId]);
    }
  } finally { await db.close(); }
});
