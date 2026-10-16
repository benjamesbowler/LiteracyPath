import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { fixtureV8 } from '../helpers/literacyMockV8Database.js';
import { read, query, classId, studentId } from '../helpers/literacyMockDatabase.js';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { selectLiteracyMockPlan, adaptLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';
import { sameLiteracyMockTask } from '../../src/utils/literacyMockConditions.js';
import { literacyMockFreshnessCacheSql } from '../../tools/generateLiteracyMockFreshnessCache.mjs';
import { auditSecurityBoundarySource, unrevokedSecurityDefiners } from '../../tools/databasePolicyContract.mjs';

const migration = '20261016080840_literacy_mock_plan_freshness_cache.sql';
const bank = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v8' });
const byId = new Map(bank.map(item => [item.id, item]));
const save = (db, sessionId, key, revision, plan, token = 'synthetic-token') => query(db,
  'select student_save_literacy_mock_run($1,$2,$3,$4,$5,null) value', [token, sessionId, key, revision, plan]);

test('source audit permits only the exact reviewed replacement signature', () => {
  assert.deepEqual(auditSecurityBoundarySource().failures, []);
  const inherited = ['student_save_literacy_mock_run(p_token text,p_session_id uuid,p_request_id text,p_expected_revision integer,p_plan jsonb default null,p_response jsonb default null)'];
  const source = read(migration);
  assert.deepEqual(unrevokedSecurityDefiners(source, inherited), []);
  assert.deepEqual(unrevokedSecurityDefiners(source.replace('p_expected_revision integer', 'p_expected_revision bigint'), inherited),
    ['student_save_literacy_mock_run']);
  assert.deepEqual(unrevokedSecurityDefiners(source.replace('create or replace function public.student_save_literacy_mock_run',
    'create or replace function public.unreviewed_mock_save'), inherited), ['unreviewed_mock_save']);
  assert.deepEqual(unrevokedSecurityDefiners(source.replace('create or replace function public.student_save_literacy_mock_run',
    'create function public.student_save_literacy_mock_run'), inherited), ['student_save_literacy_mock_run']);
});

function sitting(exposures, number) {
  let plan = selectLiteracyMockPlan(bank, { sessionId: `history-${number}`, studentId, seed: `cache-history-${number}`, exposures });
  const initialPlan = plan, responses = [];
  for (let index = 0; index < 43; index++) {
    const item = byId.get(plan.itemIds[index]);
    responses.push({ questionId: item.id, skillId: item.skillId, domainId: item.domainId, level: item.level,
      itemSnapshot: item.itemSnapshot, responseStatus: 'answered', evidenceType: 'independent', supportUsed: false,
      knownFamiliar: false, isCorrect: number === 1, serverReceivedAt: new Date().toISOString() });
    plan = adaptLiteracyMockPlan(bank, plan, responses, [], [], { exposures });
  }
  return { initialPlan, plan, responses };
}

async function seedHistory(db) {
  const exposures = [];
  for (let number = 1; number <= 2; number++) {
    const history = sitting(exposures, number);
    const id = `44000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
    await db.query(`insert into student_focus_sessions(id,teacher_id,class_id,target,content_version,selection_scope,status,expires_at)
      select $1,teacher_id,class_id,'progress_check','literacy-mock-v8','selected','ended',now()+interval '1 hour'
      from students where id=$2`, [id, studentId]);
    await db.query(`insert into literacy_mock_sessions(session_id,state,item_count,duration_seconds,remaining_seconds,window_mode)
      values($1,'completed',43,1200,1200,'untimed')`, [id]);
    await db.query(`insert into student_focus_session_members(session_id,student_id,active) values($1,$2,false)`, [id, studentId]);
    await db.query(`insert into literacy_mock_runs(session_id,student_id,plan,responses,status,completed_at)
      values($1,$2,$3,$4,'completed',now())`, [id, studentId, history.plan, history.responses]);
    await db.query(`insert into literacy_mock_events(session_id,student_id,question_id,actor_key,request_id,event_type,payload)
      select $1,$2,r->>'questionId','student','shown-'||n,'presented',r-'isCorrect'-'responseStatus'-'evidenceType'
      from jsonb_array_elements($3::jsonb) with ordinality rows(r,n)`, [id, studentId, history.responses]);
    exposures.push(...history.responses);
  }
  return exposures;
}

async function countHistoryReads(db) {
  const definition = await query(db, "select pg_get_functiondef('public.lp_literacy_exposures(uuid)'::regprocedure) value");
  await db.exec(definition.replace('public.lp_literacy_exposures(', 'public.fixture_uncounted_literacy_exposures('));
  await db.exec(`create sequence public.fixture_history_reads minvalue 0 start 0;
    create or replace function public.lp_literacy_exposures(p_student_id uuid)
    returns jsonb language plpgsql stable security definer set search_path='' as $$begin
      perform nextval('public.fixture_history_reads');
      return public.fixture_uncounted_literacy_exposures(p_student_id);
    end; $$;`);
}

test('43-question registration expands 86-answer history once and leaves unchanged slots cheap', async t => {
  const db = await fixtureV8();
  try {
    const exposures = await seedHistory(db);
    assert.equal(exposures.length, 86);
    assert.equal(new Set(exposures.map(row => row.domainId)).size, 8);
    const prepared = await query(db, "select teacher_prepare_literacy_mock_session_v8($1,$2,false,20,43,'cache-third','untimed') value", [classId, [studentId]]);
    assert.equal(prepared.ok, true, prepared.error);
    const sessionId = prepared.session.id;
    assert.equal((await query(db, "select teacher_control_literacy_mock_session($1,'start',0,'start') value", [sessionId])).ok, true);
    const plan = selectLiteracyMockPlan(bank, { sessionId, studentId, exposures });
    const rpcAcl = await query(db, "select proacl::text value from pg_proc where oid='public.student_save_literacy_mock_run(text,uuid,text,integer,jsonb,jsonb)'::regprocedure");
    const historicalBytes = await db.query('select session_id,md5(responses::text) digest from literacy_mock_runs order by session_id');
    await countHistoryReads(db);
    await query(db, "select setval('fixture_history_reads',0,true) value");
    await db.exec('begin');
    const beforeStart = performance.now();
    const before = await save(db, sessionId, 'initial', 0, plan);
    const beforeElapsed = performance.now() - beforeStart;
    assert.equal(before.ok, true, before.error);
    assert.equal(await query(db, 'select last_value::integer value from fixture_history_reads'), 43);
    await db.exec('rollback');
    assert.equal(read(migration), literacyMockFreshnessCacheSql());
    await db.exec(read(migration));
    await query(db, "select setval('fixture_history_reads',0,true) value");
    const started = performance.now();
    const registered = await save(db, sessionId, 'initial', 0, plan);
    const elapsed = performance.now() - started;
    assert.equal(registered.ok, true, registered.error);
    assert.equal(await query(db, 'select last_value::integer value from fixture_history_reads'), 1,
      'candidate matching must reuse one canonical history snapshot for all 43 slots');
    t.diagnostic(`86-answer/86-presentation registration before=${beforeElapsed.toFixed(1)} ms / 43 history reads; after=${elapsed.toFixed(1)} ms / 1 history read`);
    await query(db, "select setval('fixture_history_reads',0,true) value");
    const unchanged = await save(db, sessionId, 'unchanged', registered.run.revision, plan);
    assert.equal(unchanged.ok, true, unchanged.error);
    assert.equal(unchanged.duplicate, true);
    assert.equal(await query(db, 'select last_value::integer value from fixture_history_reads'), 0);

    await t.test('the pure matcher preserves all reason sets and canonical aliases', async () => {
      const records = [
        { exposureItemId: 'familiar-item' },
        { exposurePassageKey: 'familiar passage' },
        { exposureFamilyId: 'familiar-family' },
        { exposureItemId: 'literacy.letter_knowledge.name-z' },
        { exposureFamilyId: 'hfw-word:from' },
        { exposureFamilyId: 'v6-phonics-team:rain' },
        { exposureFamilyId: 'v4-context-word-senses:glass' },
        { exposureFamilyId: 'v8-context-word-senses:wave' },
        { exposureItemId: 'mock.letters.round' },
        { exposureItemId: 'lp3.long_vowels_silent_e.l2.A.a_e.v1' },
      ];
      await db.query(`insert into student_progress(student_id,area,key,payload) values($1,'literacy-practice','alias-fixture',$2)`,
        [studentId, { completions: [{ gameId: 'literacy-practice', steps: records }] }]);
      const targets = [...exposures.filter((_, index) => index % 7 === 0).map(row => row.itemSnapshot),
        ...records, ...plan.itemIds.slice(0, 3).map(id => byId.get(id)),
        { exposureItemId: 'mock.capacity.foundation.letter-case.l2.z' },
        { exposureFamilyId: 'mock-foundation-word:from' },
        { exposureFamilyId: 'mock-foundation-word:rain' },
        { exposureFamilyId: 'v8-context-word-senses:glass' },
        { exposureFamilyId: 'v4-context-word-senses:wave' },
        { exposureFamilyId: 'letter-case:a' },
        { exposureFamilyId: 'mock-foundation-word:gate' },
        { exposureItemId: 'never-seen', exposurePassageKey: 'unseen passage', exposureFamilyId: 'unseen-family' }];
      const rows = (await db.query(`with prior as materialized (select public.lp_literacy_exposures($1) identities)
        select n::integer index,public.lp_literacy_familiarity($1,target) original,
          public.lp_literacy_familiarity_from_exposures(prior.identities,target) cached
        from prior cross join jsonb_array_elements($2::jsonb) with ordinality targets(target,n) order by n`, [studentId, targets])).rows;
      for (const row of rows) assert.deepEqual(row.cached, row.original, JSON.stringify(targets[row.index - 1]));
      const reasons = new Set(rows.flatMap(row => row.cached));
      assert.deepEqual([...reasons].sort(), ['family', 'item', 'passage']);
      assert.deepEqual(rows.at(-1).cached, []);
      assert.ok(rows.find(row => targets[row.index - 1].exposureItemId === 'mock.capacity.foundation.letter-case.l2.z').cached.includes('family'));
      assert.deepEqual(await query(db, 'select lp_literacy_familiarity_from_exposures(null,$1) value', [{}]), []);
    });

    await t.test('every invocation reads current history and a newly exposed replacement is rejected', async () => {
      const first = byId.get(plan.itemIds[0]);
      const history = buildLiteracyExposureIndex({ exposures: [...exposures, ...plan.itemIds.map(id => byId.get(id))] });
      const replacement = bank.find(item => item.adaptiveMixedEligible && item.adaptiveAreaBand === 1
        && sameLiteracyMockTask(item, first, { includeLevel: true }) && !getLiteracyExposure(item, history).knownFamiliar);
      assert.ok(replacement);
      await db.query(`insert into student_progress(student_id,area,key,payload) values($1,'literacy-practice','new-exposure',$2)`,
        [studentId, { completions: [{ gameId: 'literacy-practice', steps: [replacement.itemSnapshot] }] }]);
      const changed = { ...plan, itemIds: plan.itemIds.map((id, index) => index === 0 ? replacement.id : id) };
      await query(db, "select setval('fixture_history_reads',0,true) value");
      const denied = await save(db, sessionId, 'new-exposed-word', registered.run.revision, changed);
      assert.equal(denied.error, 'fresh_item_exposed');
      assert.equal(await query(db, 'select last_value::integer value from fixture_history_reads'), 1);
      assert.deepEqual(await query(db, 'select plan value from literacy_mock_runs where session_id=$1 and student_id=$2', [sessionId, studentId]), plan);
    });

    await t.test('a worked tutorial still fails before freshness matching', async () => {
      const tutorial = bank.find(item => item.tutorialOnly && item.domainId === byId.get(plan.itemIds[0]).domainId);
      assert.ok(tutorial);
      const changed = { ...plan, itemIds: plan.itemIds.map((id, index) => index === 0 ? tutorial.id : id) };
      await query(db, "select setval('fixture_history_reads',0,true) value");
      assert.equal((await save(db, sessionId, 'tutorial', registered.run.revision, changed)).error, 'tutorial_item_not_scored');
      assert.equal(await query(db, 'select last_value::integer value from fixture_history_reads'), 0);
    });

    await t.test('same-save plan and answer preserve first-presentation freshness and current history', async () => {
      const first = byId.get(plan.itemIds[0]);
      const shown = await query(db, 'select student_record_literacy_mock_event($1,$2,$3,\'presented\',\'show-current\') value',
        ['synthetic-token', sessionId, first.id]);
      assert.equal(shown.ok, true, shown.error);
      assert.deepEqual(shown.run.presentations.find(row => row.questionId === first.id).familiarityReasons, []);
      const prior = await query(db, 'select lp_literacy_exposures($1) value', [studentId]);
      const frozen = plan.itemIds.map(id => byId.get(id));
      const history = buildLiteracyExposureIndex({ exposures: [...prior, ...frozen] });
      const presented = new Set(shown.run.presentations.map(row => row.questionId));
      const target = frozen.flatMap((old, index) => {
        if (index < 1 || presented.has(old.id)) return [];
        const replacement = bank.find(item => item.adaptiveMixedEligible && item.adaptiveAreaBand === 1
          && sameLiteracyMockTask(item, old, { includeLevel: true }) && !getLiteracyExposure(item, history).knownFamiliar);
        return replacement ? [{ old, replacement, index }] : [];
      })[0];
      assert.ok(target, 'The fixture needs an unpresented slot with a fresh replacement of the same task and level at band 1.');
      const { old, replacement, index: replacementIndex } = target;
      const changed = { ...plan, itemIds: plan.itemIds.map((id, index) => index === replacementIndex ? replacement.id : id) };
      const response = { questionId: first.id, selected: first.answer, responseStatus: 'answered', supportUsed: false,
        knownFamiliar: false, audioDelivery: Object.fromEntries(first.requiredAudioPaths.map(path => [path, 'completed'])) };
      const familiar = exposures.find(row => row.domainId === old.domainId && row.itemSnapshot.adaptiveAreaBand === 1);
      assert.ok(familiar);
      const blocked = { ...plan, itemIds: plan.itemIds.map((id, index) => index === replacementIndex ? familiar.questionId : id) };
      const denied = await query(db, 'select student_save_literacy_mock_run($1,$2,$3,$4,$5,$6) value',
        ['synthetic-token', sessionId, 'same-save-familiar', registered.run.revision, blocked, response]);
      assert.equal(denied.error, 'fresh_item_exposed');
      assert.equal(await query(db, 'select jsonb_array_length(responses) value from literacy_mock_runs where session_id=$1 and student_id=$2', [sessionId, studentId]), 0);
      await query(db, "select setval('fixture_history_reads',0,true) value");
      const answered = await query(db, 'select student_save_literacy_mock_run($1,$2,$3,$4,$5,$6) value',
        ['synthetic-token', sessionId, 'same-save', registered.run.revision, changed, response]);
      assert.equal(answered.ok, true, answered.error);
      assert.deepEqual(answered.run.plan, changed);
      assert.equal(await query(db, 'select last_value::integer value from fixture_history_reads'), 1);
      assert.equal(answered.run.responses.length, 1);
      assert.equal(answered.run.responses[0].questionId, first.id);
      assert.equal(answered.run.responses[0].isCorrect, true);
      assert.equal(answered.run.responses[0].evidenceType, 'independent');
      assert.equal(answered.run.responses[0].knownFamiliar, false);
      assert.deepEqual(answered.run.responses[0].familiarityReasons, []);
      assert.deepEqual(answered.run.responses[0].itemSnapshot, first.itemSnapshot);
      assert.deepEqual(answered.run.presentations, shown.run.presentations);
    });

    await t.test('ownership and invalid requests fail before history is read', async () => {
      await query(db, "select setval('fixture_history_reads',0,true) value");
      assert.equal((await save(db, sessionId, 'foreign', registered.run.revision, plan, 'foreign-token')).error, 'assignment_not_found');
      assert.equal((await save(db, sessionId, 'null-token', registered.run.revision, plan, null)).error, 'invalid_session');
      assert.equal((await save(db, sessionId, 'no-payload', registered.run.revision, null)).error, 'invalid_payload');
      assert.equal((await save(db, sessionId, 'stale', 0, plan)).error, 'stale_revision');
      assert.equal(await query(db, 'select last_value::integer value from fixture_history_reads'), 0);
    });

    await t.test('the pure helper is private and the RPC retains its exact grants and metadata', async () => {
      const signature = 'public.lp_literacy_familiarity_from_exposures(jsonb,jsonb)';
      for (const role of ['anon', 'authenticated']) {
        assert.equal(await query(db, 'select has_function_privilege($1,$2,\'execute\') value', [role, signature]), false);
        await db.exec(`set role ${role}`);
        try { await assert.rejects(db.query('select public.lp_literacy_familiarity_from_exposures($1,$2)', [[], {}]), /permission denied/); }
        finally { await db.exec('reset role'); }
      }
      const meta = (await db.query(`select provolatile,prosecdef,proconfig,
        (select count(*)::integer from aclexplode(coalesce(proacl,acldefault('f',proowner))) acl where acl.grantee<>proowner) foreign_grants
        from pg_proc where oid=$1::regprocedure`, [signature])).rows[0];
      assert.equal(meta.provolatile, 'i'); assert.equal(meta.prosecdef, false);
      assert.deepEqual(meta.proconfig, ['search_path=""']); assert.equal(meta.foreign_grants, 0);
      assert.equal(await query(db, "select proacl::text value from pg_proc where oid='public.student_save_literacy_mock_run(text,uuid,text,integer,jsonb,jsonb)'::regprocedure"), rpcAcl);
      assert.deepEqual((await db.query('select session_id,md5(responses::text) digest from literacy_mock_runs where session_id<>$1 order by session_id', [sessionId])).rows,
        historicalBytes.rows);
      await db.exec(read(migration));
      assert.equal(await query(db, "select proacl::text value from pg_proc where oid='public.student_save_literacy_mock_run(text,uuid,text,integer,jsonb,jsonb)'::regprocedure"), rpcAcl);
    });
  } finally { await db.close(); }
});

test('forward cache preserves authorized legacy slots while new aliases stay strict', async () => {
  const db = await fixtureV8({ upgrade: false });
  try {
    const legacyBank = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v7' });
    const legacyById = new Map(legacyBank.map(item => [item.id, item]));
    const prepared = await query(db, "select teacher_prepare_literacy_mock_session_v7($1,$2,false,20,43,'cache-legacy','untimed') value", [classId, [studentId]]);
    assert.equal(prepared.ok, true, prepared.error);
    const sessionId = prepared.session.id;
    assert.equal((await query(db, "select teacher_control_literacy_mock_session($1,'start',0,'start') value", [sessionId])).ok, true);
    const plan = selectLiteracyMockPlan(legacyBank, { sessionId, studentId });
    const slots = plan.itemIds.flatMap((id, index) => legacyById.get(id).domainId === 'print' ? [index] : []);
    const letters = ['literacy.letter_knowledge.case-a', 'mock.capacity.foundation.letter-case.l1.a',
      'literacy.letter_knowledge.case-b', 'literacy.letter_knowledge.case-c', 'literacy.letter_knowledge.case-d'];
    slots.forEach((slot, index) => { plan.itemIds[slot] = letters[index]; });
    const registered = await save(db, sessionId, 'legacy-initial', 0, plan);
    assert.equal(registered.ok, true, registered.error);
    await db.exec(read('20261016062452_literacy_mock_retake_v8.sql'));
    await db.exec(read(migration));
    const first = legacyById.get(plan.itemIds[0]);
    const history = buildLiteracyExposureIndex({ exposures: plan.itemIds.map(id => legacyById.get(id)) });
    const fresh = legacyBank.find(item => item.adaptiveMixedEligible && item.adaptiveAreaBand === 1
      && sameLiteracyMockTask(item, first, { includeLevel: true }) && !getLiteracyExposure(item, history).knownFamiliar);
    assert.ok(fresh);
    const changed = { ...plan, itemIds: plan.itemIds.map((id, index) => index === 0 ? fresh.id : id) };
    const accepted = await save(db, sessionId, 'legacy-unchanged-aliases', registered.run.revision, changed);
    assert.equal(accepted.ok, true, accepted.error);
    for (const slot of slots) assert.equal(accepted.run.plan.itemIds[slot], plan.itemIds[slot]);
    const invalid = { ...changed, itemIds: [...changed.itemIds] };
    invalid.itemIds[slots[1]] = 'mock.capacity.foundation.letter-case.l2.a';
    assert.equal((await save(db, sessionId, 'legacy-new-alias', accepted.run.revision, invalid)).error, 'repeated_exposure_identity');
  } finally { await db.close(); }
});
