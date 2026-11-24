import test from 'node:test';
import assert from 'node:assert/strict';
import { fixtureV10 } from '../helpers/literacyMockV10Database.js';
import { query, read, other, teacher, classId, studentId } from '../helpers/literacyMockDatabase.js';
import { V15_SCHEMA_MIGRATION, literacyMockV15SchemaSql } from '../../tools/generateLiteracyMockV15Schema.mjs';
import { V15_CATALOGUE_MIGRATION } from '../../tools/generateLiteracyMockV15Catalogue.mjs';
import { loadLiteracyMockRuntimeBank } from '../../src/data/literacyMockRuntimeBank.js';
import { createWholeClassMockSession, submitWholeClassMockAnswer } from '../../src/components/teacher/wholeClassPracticeModel.js';
import { reviewedLiteracyMockBand, LITERACY_MOCK_DEMAND_ANCHORS } from '../../src/policy/literacyMockReviewedDemand.js';
import { sameLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';
import { LITERACY_MOCK_REVIEWED_VERSION as version, LITERACY_MOCK_CONTINUOUS_ROUTING as routingPolicy } from '../../src/policy/literacyMockVersions.js';

const precedingMigrations = [
  '20261016202515_literacy_mock_v10_quality_lookup.sql','20261020030000_literacy_mock_progression_v11.sql',
  '20261020030001_literacy_mock_catalogue_v11.sql','20261028040000_literacy_mock_beginner_vocabulary.sql',
  '20261028040100_literacy_mock_beginner_v12.sql','20261028040101_literacy_mock_catalogue_v12.sql',
  '20261106055449_literacy_mock_question_limits.sql','20261122032258_literacy_mock_teacher_status.sql',
  '20261122090000_literacy_mock_short_routing_v13.sql','20261122090100_literacy_mock_catalogue_v13.sql',
  '20261124090000_literacy_mock_adaptive_v14.sql','20261124090100_literacy_mock_catalogue_v14.sql',
  '20261124090200_literacy_mock_v14_picture_quarantine.sql','20261124120000_literacy_mock_continuous_routing.sql',
];

const check = result => { assert.equal(result.ok, true, result.error); return result; };
const prepare = (db, cap) => query(db,
  "select teacher_prepare_literacy_mock_session_v15($1,$2,false,20,$3,$4,'untimed') value",
  [classId, [studentId], cap, 'reviewed-'+cap]);
const save = (db, id, key, revision, plan, answer) => query(db,
  "select student_save_literacy_mock_run('synthetic-token',$1,$2,$3,$4,$5) value",
  [id,key,revision,plan,answer]);
const historyDigest = db => query(db, "select md5(string_agg(md5(item::text),'' order by id)) value from literacy_mock_items where content_version='literacy-mock-v14'");

async function compareBands(db, bank) {
  const cases = [];
  const snapshots = new Map(bank.filter(i => i.adaptiveMixedEligible).map(i => [i.domainId + ':' + i.adaptiveAreaBand,i.itemSnapshot]));
  for (const previous of snapshots.values()) for (const area of Object.keys(LITERACY_MOCK_DEMAND_ANCHORS)) {
    for (const evidence of [{isCorrect:true}, {isCorrect:false}, {isCorrect:true,supportUsed:true}, {isCorrect:true,knownFamiliar:true}]) {
      const row = { itemSnapshot:previous, responseStatus:'answered', evidenceType:'independent', ...evidence };
      cases.push({ area, rows:[row,{responseStatus:'media_failed'}], expected:reviewedLiteracyMockBand(row,previous,area) });
    }
  }
  // These are hand-derived from the shared anchor table. A neutral chain must
  // keep its initial 3 even if a shown/frozen task was projected up to 4 or 5.
  const row=(area,band,extra)=>({itemSnapshot:snapshots.get(area+':'+band),responseStatus:'answered',
    evidenceType:'independent',isCorrect:true,...extra});
  const neutral=[row('sound_awareness',3,{supportUsed:true}),row('print',3,{knownFamiliar:true}),
    {responseStatus:'media_failed'},row('sound_awareness',4,{responseStatus:'skipped',isCorrect:null})];
  cases.push({area:'writing',rows:neutral,expected:2},
    {area:'print',rows:neutral,expected:3},
    {area:'sound_awareness',rows:neutral,expected:3},
    {area:'writing',rows:[...neutral,row('sound_awareness',4,{isCorrect:true})],expected:4},
    {area:'writing',rows:[...neutral,row('sound_awareness',4,{isCorrect:false})],expected:3});
  const mismatch = await query(db,`select count(*)::integer value from jsonb_to_recordset($1) c(area text,rows jsonb,expected integer)
    where public.lp_mock_reviewed_next_band(c.rows,c.area) is distinct from c.expected`, [JSON.stringify(cases)]);
  assert.equal(mismatch,0);
  return cases.length;
}

test('reviewed questions and cross-skill demand agree through class presentation, pupil scoring and collection', async t => {
  const db = await fixtureV10({catalogue:true});
  try {
    for (const name of precedingMigrations) await db.exec(read(name));
    const original = await historyDigest(db);
    assert.equal(read(V15_SCHEMA_MIGRATION),literacyMockV15SchemaSql());
    await db.exec(read(V15_SCHEMA_MIGRATION));
    assert.equal(await query(db,'select teacher_literacy_mock_v15_available() value'),false);
    assert.equal((await prepare(db,15)).error,'mock_v15_unavailable');
    await db.exec(read(V15_CATALOGUE_MIGRATION));
    assert.equal(await query(db,'select teacher_literacy_mock_v15_available() value'),true);
    assert.equal(await historyDigest(db),original);
    assert.equal(await query(db,"select has_function_privilege('anon','teacher_prepare_literacy_mock_session_v15(uuid,uuid[],boolean,integer,integer,text,text)','execute') value"),false);
    await db.exec(`set fixture.actor='${other}'`);
    assert.equal((await prepare(db,15)).ok,false);
    await db.exec(`set fixture.actor='${teacher}'`);
    const bank = await loadLiteracyMockRuntimeBank({contentVersion:version,mixed:true});
    t.diagnostic(await compareBands(db,bank) + ' reviewed JS/SQL transitions');
    for (const cap of [15,25,40]) {
      const prepared = check(await prepare(db,cap));
      const id = prepared.session.id;
      assert.equal(prepared.session.content_version,version);
      assert.equal(prepared.session.mock.routing_policy,routingPolicy);
      assert.equal(check(await prepare(db,cap)).duplicate,true);
      const started = check(await query(db,"select teacher_control_literacy_mock_session($1,'start',0,'start') value",[id]));
      let session = createWholeClassMockSession(bank,{sessionId:id,studentId,itemCount:cap,routingPolicy});
      let result = check(await save(db,id,'entry',0,session.run.plan,null));
      while (result.run.status !== 'completed') {
        const index = result.run.responses.length;
        const item = session.rounds[index];
        const correct = index % 10 < 6;
        const incorrectId = item.choices.find(c => c.id !== item.answer)?.id;
        const wrong = item.answerMode === 'set' ? [item.choices[0].id] :
          item.answerMode === 'sequence' ? [...item.answer].reverse() : item.format === 'build_word' ? 'x' : incorrectId;
        const answer = {questionId:item.id, responseStatus:'answered', selected:correct ? item.answer : wrong,
          supportUsed:false, audioDelivery:Object.fromEntries(item.requiredAudioPaths.map(path => [path,'completed']))};
        check(await query(db,"select student_record_literacy_mock_event('synthetic-token',$1,$2,'presented',$3) value",[id,item.id,'show-'+index]));
        result = check(await save(db,id,'answer-'+index,result.run.revision,null,answer));
        assert.equal(result.run.responses.at(-1).isCorrect,correct);
        session = submitWholeClassMockAnswer(session,item,answer);
        if (!sameLiteracyMockPlan(session.run.plan,result.run.plan)) result = check(await save(db,id,'plan-'+index,result.run.revision,session.run.plan,null));
      }
      assert.equal(result.run.responses.length,cap);
      assert.equal(new Set(result.run.responses.map(row=>row.itemSnapshot.domainId)).size,8);
      check(await query(db,"select teacher_control_literacy_mock_session($1,'collect',$2,'collect') value",[id,started.session.mock.revision]));
      const report=check(await query(db,'select teacher_get_literacy_mock_report($1) value',[id]));
      assert.deepEqual(report.members[0].run.responses.map(r=>r.questionId),session.run.responses.map(r=>r.questionId));
      t.diagnostic(cap+' published questions answered and collected with identical Teach and pupil selections');
      await db.query('delete from literacy_mock_events where student_id=$1',[studentId]);
      await db.query('delete from literacy_mock_runs where student_id=$1',[studentId]);
    }
  } finally { await db.close(); }
});
