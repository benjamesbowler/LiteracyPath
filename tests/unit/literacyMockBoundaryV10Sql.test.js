import test from 'node:test';
import assert from 'node:assert/strict';
import { fixtureV10, historicalPublicationDigests } from '../helpers/literacyMockV10Database.js';
import { query, read, teacher, other, classId, studentId, foreignClass, foreignStudent } from '../helpers/literacyMockDatabase.js';
import { literacyMockBoundaryStateV9, literacyMockBoundaryScheduleV9 } from '../../src/policy/literacyMockBoundaryV9.js';
import { literacyMockV10SchemaSql, literacyMockV10CatalogueSql, V10_SCHEMA_MIGRATION, V10_CATALOGUE_MIGRATION } from '../../tools/generateLiteracyMockV10.mjs';
import { loadLiteracyMockBank, scoreLiteracyMockResponse } from '../../src/data/literacyMockBank.js';
import { createLiteracyMockManifest } from '../../tools/generateLiteracyMockManifest.mjs';
import { selectLiteracyMockBoundaryPlan, adaptLiteracyMockBoundaryPlan, repairLiteracyMockBoundaryPlan } from '../../src/utils/literacyMockBoundaryPlanner.js';
import { createMockOutbox, appendMockOutbox, prepareMockDelivery, acknowledgeMockOutbox, verifyMockOutboxReceipt } from '../../src/utils/literacyMockOutbox.js';
import { mockConstructionLength } from '../../src/utils/literacyMockResponse.js';
import { sameLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';
import { buildLiteracyMockReport } from '../../src/utils/literacyMockReport.js';
import { literacyMockWorkingSummary } from '../../src/utils/literacyMockWorkingSummary.js';
import { LITERACY_QUARANTINED_ITEM_IDS, LITERACY_CONTEXTUAL_ITEM_QUALITY_ISSUES, literacyItemQualityIssue } from '../../src/policy/literacyItemEligibility.js';

const row = (index, band, isCorrect = true, flags = {}) => ({ questionId: `v10-sql-${index}`, domainId: 'vocabulary', skillId: 'context_clues', level: 1,
  responseStatus: 'answered', evidenceType: 'independent', supportUsed: false, knownFamiliar: null, isCorrect,
  itemSnapshot: { id: `v10-sql-${index}`, domainId: 'vocabulary', skillId: 'context_clues', level: 1,
    adaptiveAreaVersion: 'areas-v5', adaptiveAreaBand: band, adaptiveDemand: { operation: 'synthetic_task' } }, ...flags });
const correctRows = maximum => [...Array.from({ length: maximum + 1 }, (_, band) => row(band, band)), row(maximum + 1, maximum)];

test('V10 schema applies above all nine publications and retains exact shared state/schedule semantics', async () => {
  const db = await fixtureV10();
  try {
    const cases = [[], [row(0, 0, false), row(1, 0, false)], correctRows(5),
      [row(0, 0), row(1, 1, false), row(2, 0), row(3, 1, false)],
      [row(0, 0, false), ...[0, 1, 2, 3, 4, 5, 5].map((band, index) => row(index + 1, band))],
      [0, 1, 2, 3, 4, 5, 4, 5].map((band, index) => row(index, band, index !== 5)),
      [row(0, 0, true, { supportUsed: true }), row(1, 0, false, { supportUsed: true })],
      [row(0, 0, true, { knownFamiliar: true }), row(1, 0, false, { knownFamiliar: true })],
      [row(0, 0, null, { responseStatus: 'skipped', evidenceType: 'unscored' }), row(1, 0, null, { responseStatus: 'skipped', evidenceType: 'unscored' })],
      [row(0, 0, true, { supportUsed: true }), row(1, 0, null, { responseStatus: 'media_failed', evidenceType: 'unscored' }), row(2, 0, true, { supportUsed: true })],
      [row(0, 0, true, { supportUsed: true }), row(1, 1, true, { supportUsed: true })],
      [row(0, 0, false), row(1, 0, true, { classification: 'supported' }), row(2, 0), row(3, 1, true, { classification: 'familiar' }), row(4, 1, false)],
    ];
    const printRows = [false, null, true, null, false].map((correct, index) => ({
      ...row(index, index < 3 ? 0 : 1, correct === true, correct === null ? { supportUsed: true, evidenceType: 'supported' } : {}), domainId: 'print', skillId: 'letter_knowledge',
      itemSnapshot: { id: `print-${index}`, domainId: 'print', skillId: 'letter_knowledge', level: 1, targetWord: 'abcde'[index],
        constructClaim: index < 3 ? 'letter_name' : 'letter_case_correspondence', adaptiveAreaVersion: 'areas-v5', adaptiveAreaBand: index < 3 ? 0 : 1, adaptiveDemand: { operation: 'letter_task' } },
    }));
    cases.push(printRows);
    for (const [index, rows] of cases.entries()) {
      assert.deepEqual(await query(db, 'select lp_mock_boundary_state_v9($1) value', [rows]), literacyMockBoundaryStateV9(rows), `state case ${index}`);
      assert.deepEqual(await query(db, 'select lp_mock_boundary_schedule_v9($1) value', [rows]), literacyMockBoundaryScheduleV9(rows), `schedule case ${index}`);
    }
    const qualityValues = LITERACY_QUARANTINED_ITEM_IDS.flatMap(id => [{ id }, { questionId: id }]);
    assert.equal(LITERACY_QUARANTINED_ITEM_IDS.length, 25);
    assert.equal(LITERACY_CONTEXTUAL_ITEM_QUALITY_ISSUES.length, 101);
    for (const rule of LITERACY_CONTEXTUAL_ITEM_QUALITY_ISSUES) {
      const source = { id: rule.id, sourceItemId: rule.id, contentVersion: rule.contentVersion || 'literacy-mock-v9',
        adaptiveAreaVersion: rule.adaptiveAreaVersion, adaptiveAreaBand: rule.adaptiveAreaBand };
      const missingBand = { ...source }; delete missingBand.adaptiveAreaBand;
      const missingVersion = { ...source }; delete missingVersion.contentVersion;
      qualityValues.push(source, { questionId: rule.id, itemSnapshot: source }, { questionSnapshot: source }, { question: source },
        { questionId: rule.id, itemSnapshot: null, questionSnapshot: source }, { questionSnapshot: null, question: source },
        { ...source, itemSnapshot: null, questionSnapshot: null, question: null },
        { ...source, adaptiveAreaBand: String(rule.adaptiveAreaBand) }, { ...source, adaptiveAreaBand: null }, missingBand,
        { ...source, adaptiveAreaVersion: 'areas-v4' }, { ...source, contentVersion: 'literacy-mock-v8' }, missingVersion,
        // A repaired question retains semantic identity but receives its own
        // reviewed choices. canonicalItemId is never a quarantine alias.
        { ...source, id: `repaired-${rule.id}`, sourceItemId: `repaired-${rule.id}`, canonicalItemId: rule.id });
    }
    assert.deepEqual(await query(db, `select jsonb_agg(public.lp_literacy_item_quality_issue(q) order by n) value
      from jsonb_array_elements($1) with ordinality e(q,n)`, [qualityValues]), qualityValues.map(value => literacyItemQualityIssue(value)),
    'All exact contextual numeric/null/string/missing cases match current JavaScript quality authority.');
    const rowsDefinition = await query(db, "select pg_get_functiondef('public.lp_mock_boundary_rows_v9(uuid,uuid)'::regprocedure) value");
    const eventDefinition = await query(db, "select pg_get_functiondef('public.student_record_literacy_mock_event(text,uuid,text,text,text)'::regprocedure) value");
    const planDefinition = await query(db, "select pg_get_functiondef('public.lp_mock_boundary_plan_error_v9(uuid,uuid,jsonb,jsonb,integer,jsonb)'::regprocedure) value");
    assert.match(rowsDefinition, /support as materialized/i, 'V10 retains one current grouped support read.');
    assert.equal((rowsDefinition.match(/from public\.literacy_mock_events/gi) || []).length, 1);
    assert.equal((eventDefinition.match(/public\.lp_mock_boundary_rows_v9\(/g) || []).length, 1, 'Presentation guards reuse their single current row projection.');
    assert.match(eventDefinition, /public\.lp_mock_boundary_schedule_with_state_v9\(/);
    assert.match(planDefinition, /public\.lp_mock_boundary_schedule_with_state_v9\(/);
    for (const definition of [rowsDefinition, planDefinition]) assert.doesNotMatch(definition, /i\.content_version\s*=\s*'literacy-mock-v9'/,
      'The shared boundary route must join the session publication rather than old V9 choices.');
    for (const role of ['anon', 'authenticated']) for (const signature of [
      'lp_mock_boundary_state_v9(jsonb)', 'lp_mock_boundary_schedule_v9(jsonb)',
      'lp_mock_boundary_schedule_with_state_v9(jsonb,jsonb)', 'lp_mock_response_with_help_v9(jsonb,jsonb)',
      'lp_literacy_item_quality_issue(jsonb)',
      'lp_mock_boundary_rows_v9(uuid,uuid)', 'lp_mock_boundary_plan_error_v9(uuid,uuid,jsonb,jsonb,integer,jsonb)',
      'lp_mock_area_next_band_before_v9(uuid,uuid,text)', 'lp_mock_area_plan_error_before_v9(uuid,uuid,jsonb,jsonb,integer,jsonb)',
      'lp_mock_prepare_v9_before_delivery(uuid,uuid[],boolean,integer,integer,text,text)',
      'lp_mock_prepare_v10_before_delivery(uuid,uuid[],boolean,integer,integer,text,text)',
    ]) assert.equal(await query(db, 'select has_function_privilege($1,$2,$3) value', [role, signature, 'execute']), false, signature);
    assert.equal(await query(db, 'select has_function_privilege($1,$2,$3) value', ['anon', 'teacher_prepare_literacy_mock_session_v10(uuid,uuid[],boolean,integer,integer,text,text)', 'execute']), false);
    assert.equal(await query(db, 'select has_function_privilege($1,$2,$3) value', ['authenticated', 'teacher_prepare_literacy_mock_session_v10(uuid,uuid[],boolean,integer,integer,text,text)', 'execute']), true);
    // A schema-only fixture intentionally has no new publication to prepare.
    assert.equal(await query(db, "select count(*)::integer value from literacy_mock_publications where content_version='literacy-mock-v10'"), 0);
    assert.equal(await query(db, "select count(*)::integer value from literacy_mock_publications where content_version='literacy-mock-v9'"), 1);
    const legacy = await query(db, 'select teacher_prepare_literacy_mock_session_v8($1,$2,false,20,43,$3,$4) value', [classId, [studentId], 'legacy-after-v10', 'untimed']);
    assert.equal(legacy.ok, true, legacy.error); assert.equal(legacy.session.content_version, 'literacy-mock-v8'); assert.equal(legacy.session.mock.item_count, 43);
    assert.equal(await query(db, 'select lp_mock_area_next_band($1,$2,$3) value', [legacy.session.id, studentId, 'phonics']), 1);
    const legacyPlan = { seed: 'legacy-fixed-length', itemIds: Array.from({ length: 43 }, (_value, index) => `legacy-trigger-${index}`) };
    await db.query('insert into literacy_mock_runs(session_id,student_id,plan) values($1,$2,$3)', [legacy.session.id, studentId, legacyPlan]);
    await assert.rejects(() => db.query('update literacy_mock_runs set responses=$1 where session_id=$2 and student_id=$3',
      [Array.from({ length: 51 }, (_value, index) => ({ questionId: `legacy-overflow-${index}` })), legacy.session.id, studentId]), /Legacy mock response limit/);
    await assert.rejects(() => db.query('update literacy_mock_runs set plan=$1 where session_id=$2 and student_id=$3',
      [{ ...legacyPlan, itemIds: legacyPlan.itemIds.slice(0, 42) }, legacy.session.id, studentId]), /Mock answered plan prefix is immutable/);
    await db.query("update literacy_mock_sessions set plan_kind='fresh_check',item_count=3 where session_id=$1", [legacy.session.id]);
    assert.equal(await query(db, 'select item_count value from literacy_mock_sessions where session_id=$1', [legacy.session.id]), 3);
    await assert.rejects(() => db.query("update literacy_mock_sessions set plan_kind='mixed',item_count=3 where session_id=$1", [legacy.session.id]), /check constraint/);
    await db.query("update literacy_mock_sessions set plan_kind='mixed',item_count=43 where session_id=$1", [legacy.session.id]);
    assert.deepEqual(await historicalPublicationDigests(db), db.v10HistoricalPublicationDigests);
  } finally { await db.close(); }
});

test('the saved V10 schema is the exact current generator output', () => {
  assert.equal(read(V10_SCHEMA_MIGRATION), literacyMockV10SchemaSql());
});

const control = (db, id, action, revision, key = action) => query(db, 'select teacher_control_literacy_mock_session($1,$2,$3,$4) value', [id, action, revision, key]);
const save = (db, id, key, revision, plan, response = null, token = 'synthetic-token') => query(db, 'select student_save_literacy_mock_run($1,$2,$3,$4,$5,$6) value', [token, id, key, revision, plan, response]);
const batch = (db, id, key, lease, requests = [], collection = null, token = 'synthetic-token') => query(db, 'select student_sync_literacy_mock_batch($1,$2,$3,$4,$5,$6) value', [token, id, key, lease, requests, collection]);
const prepare = (db, key, ids = [studentId], classroom = classId) => query(db, 'select teacher_prepare_literacy_mock_session_v10($1,$2,false,20,67,$3,$4) value', [classroom, ids, key, 'untimed']);
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
    const next = adaptLiteracyMockBoundaryPlan(offline, box.run.plan, box.run.responses, [], box.run.presentations);
    if (!sameLiteracyMockPlan(next, box.run.plan)) box = appendMockOutbox(box, { requestId: `adapt-${index}`, expectedRevision: box.run.revision, plan: next, response: null }, {}, disk);
  }
  assert.equal(box.run.status, 'completed');
  return { box, trace };
}

test('V10 full canonical publication, thirty-five fresh sittings, receipts and teacher reports agree', async t => {
  const bank = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v10' }), byId = new Map(bank.map(item => [item.id, item]));
  const manifest = await createLiteracyMockManifest({ contentVersion: 'literacy-mock-v10' });
  assert.equal(read(V10_CATALOGUE_MIGRATION), await literacyMockV10CatalogueSql());
  const db = await fixtureV10({ catalogue: true });
  try {
    const stored = (await db.query("select item from literacy_mock_items where content_version='literacy-mock-v10' order by id collate \"C\"")).rows.map(value => value.item);
    assert.deepEqual(stored, JSON.parse(JSON.stringify([...manifest.items].sort((left, right) => left.id < right.id ? -1 : 1))));
    assert.deepEqual(await historicalPublicationDigests(db), db.v10HistoricalPublicationDigests);
    await db.exec(read(V10_CATALOGUE_MIGRATION));
    assert.deepEqual(await historicalPublicationDigests(db), db.v10HistoricalPublicationDigests);
    const patterns = { correct: () => true, incorrect: () => false, early_slip: (_index, _item, areaIndex) => areaIndex > 0,
      reversal: index => index < 16, alternating: index => index % 2 === 0, uneven: (_index, item) => ['reading', 'listening', 'vocabulary'].includes(item.domainId), supported: () => null };
    let learnerNumber = 100, completedCorrect = null;
    for (const [name, outcome] of Object.entries(patterns)) {
      const learner = `33000000-0000-4000-8000-${String(++learnerNumber).padStart(12, '0')}`;
      await db.query('insert into students values($1,$2,$3,$4,null)', [learner, classId, teacher, `Synthetic ${name}`]);
      await db.exec(`create or replace function student_from_token(token text) returns public.students language sql stable as $$select s.* from public.students s where id=case when token='synthetic-token' then '${learner}'::uuid else null end and archived_at is null$$`);
      const sittingCount = 5;
      for (let sitting = 1; sitting <= sittingCount; sitting++) {
        const context = `${name}, sitting ${sitting}`;
        const prepared = await prepare(db, context, [learner]); assert.equal(prepared.ok, true, `${context}: ${prepared.error}`);
        const id = prepared.session.id, started = await control(db, id, 'start', 0); assert.equal(started.ok, true, started.error);
        const exposures = await query(db, 'select lp_literacy_exposures($1) value', [learner]);
        let ids = [];
        const plan = selectLiteracyMockBoundaryPlan(bank, { sessionId: id, studentId: learner, exposures, onOfflineItems: value => { ids = value; } });
        const offline = bank.filter(item => ids.includes(item.id));
        for (const questionId of plan.itemIds) assert.equal(getLiteracyExposure(byId.get(questionId), buildLiteracyExposureIndex({ exposures })).knownFamiliar, null);
        const registered = await save(db, id, 'initial', 0, plan); assert.equal(registered.ok, true, `${context}: ${registered.error}`);
        const bootstrap = await batch(db, id, 'bootstrap', null); assert.equal(bootstrap.ok, true, bootstrap.error); assert.ok(bootstrap.run.offlineLeaseId);
        let { box, trace } = completeRequests(bootstrap, offline, outcome);
        let received, deliveryNumber = 0;
        while (box.requests.length) {
          box = prepareMockDelivery(box, { batchId: `complete-${++deliveryNumber}` }, storage());
          const sent = box.delivery.sent;
          received = await batch(db, id, sent.batchId, box.delivery.leaseId, sent.requests);
          assert.equal(received.ok, true, `${context}, delivery ${deliveryNumber}: ${JSON.stringify(received)}`);
          verifyMockOutboxReceipt(received, sent);
          const retried = await batch(db, id, sent.batchId, box.delivery.leaseId, sent.requests);
          assert.equal(retried.duplicate, true); assert.deepEqual(retried.run.responses, received.run.responses);
          if (name === 'correct' && sitting === 1 && deliveryNumber === 1) {
            const changedRequests = structuredClone(sent.requests); changedRequests[0].requestId += '-forged-retry';
            const changedRetry = await batch(db, id, sent.batchId, box.delivery.leaseId, changedRequests);
            assert.equal(changedRetry.ok, false); assert.equal(changedRetry.error, 'request_conflict');
            assert.deepEqual(await query(db, 'select responses value from literacy_mock_runs where session_id=$1 and student_id=$2', [id, learner]), received.run.responses);
          }
          box = acknowledgeMockOutbox(box, sent, received, request => {
            const item = byId.get(request.questionId || request.response?.questionId);
            return { item, isCorrect: item && request.response ? scoreLiteracyMockResponse(item, request.response.selected) : undefined };
          }, storage());
        }
        assert.deepEqual(received.run.responses.map(value => value.questionId), trace.map(value => value.questionId), context);
        assert.deepEqual(received.run.responses.map(value => value.selected), trace.map(value => value.selected), context);
        assert.deepEqual(received.run.responses.map(value => value.isCorrect), trace.map(value => value.correct), context);
        assert.deepEqual(received.run.responses.map(value => value.itemSnapshot.adaptiveAreaBand), trace.map(value => value.band), context);
        assert.equal(received.run.status, 'completed'); assert.equal(received.run.plan.itemIds.length, trace.length);
        if (name === 'correct') assert.equal(trace.length, 58); if (name === 'incorrect' || name === 'supported') assert.equal(trace.length, 16);
        assert.deepEqual(await query(db, 'select lp_mock_boundary_state_v9(lp_mock_boundary_rows_v9($1,$2)) value', [id, learner]), literacyMockBoundaryStateV9(received.run.responses, { bank: byId }));
        const collected = await control(db, id, 'collect', received.mock.revision, 'collect'); assert.equal(collected.ok, true, collected.error); assert.equal(collected.session.mock.state, 'completed');
        const payload = await query(db, 'select teacher_get_literacy_mock_report($1) value', [id]);
        const report = buildLiteracyMockReport(payload, { students: [{ id: learner, name: `Synthetic ${name}` }] }), pupil = report.pupils[0];
        assert.equal(pupil.responses.length, trace.length); assert.equal(pupil.planned, trace.length); assert.equal(pupil.answered, trace.length);
        assert.equal(pupil.totals.independent, name === 'supported' ? 0 : trace.length); assert.equal(pupil.areas.length, 8);
        const view = literacyMockWorkingSummary(pupil); assert.equal(view.stage.ready, false); assert.equal(view.accuracy.answered, pupil.totals.independent);
        assert.equal(await query(db, 'select count(*)::integer value from student_progress'), 0);
        if (name === 'correct') completedCorrect = { id, learner, questionId: trace.find(value => value.domainId === 'sound_awareness' && value.band === 5).questionId };
      }
      t.diagnostic(`Five canonical V10 ${name} same-child sittings passed.`);
    }
    await t.test('post-completion assistance downgrades the observed boundary without reopening saved work', async () => {
      const { id, learner, questionId } = completedCorrect;
      const helped = await query(db, 'select teacher_resolve_literacy_mock_support($1,$2,$3,$4,$5) value', [id, learner, questionId, 'answer', 'post-completion-help']);
      assert.equal(helped.ok, true, helped.error); assert.equal(helped.run.status, 'completed');
      assert.equal(helped.run.responses.find(value => value.questionId === questionId).isCorrect, true);
      assert.equal(helped.run.responses.find(value => value.questionId === questionId).supportUsed, true);
      const payload = await query(db, 'select teacher_get_literacy_mock_report($1) value', [id]);
      const pupil = buildLiteracyMockReport(payload, { students: [{ id: learner, name: 'Synthetic correct' }] }).pupils[0];
      assert.equal(pupil.answered, 58); assert.equal(pupil.totals.independent, 57); assert.equal(pupil.totals.supported, 1);
      assert.equal(literacyMockWorkingSummary(pupil, { domains: ['sound_awareness'] }).boundaryObservation.complete, false);
      const possibleContinuation = adaptLiteracyMockBoundaryPlan(bank, helped.run.plan, helped.run.responses, [], helped.run.presentations);
      assert.ok(possibleContinuation.itemIds.length > helped.run.plan.itemIds.length);
      await assert.rejects(() => db.query('update literacy_mock_runs set plan=$1 where session_id=$2 and student_id=$3', [possibleContinuation, id, learner]), /Mock first-response evidence is immutable/);
      const closedBox = createMockOutbox({ studentId: learner, sessionId: id, run: helped.run, mock: helped.mock, focusSession: { id } });
      assert.throws(() => appendMockOutbox(closedBox, { requestId: 'reopen-local', expectedRevision: helped.run.revision, plan: possibleContinuation, response: null }, {}, storage()), /Invalid local plan prefix/);
      await db.exec(`create or replace function student_from_token(token text) returns public.students language sql stable as $$select s.* from public.students s where id=case when token='synthetic-token' then '${learner}'::uuid else null end and archived_at is null$$`);
      assert.equal((await save(db, id, 'reopen-canonical', helped.run.revision, possibleContinuation)).ok, false);
      assert.equal(await query(db, 'select status value from literacy_mock_runs where session_id=$1 and student_id=$2', [id, learner]), 'completed');
    });
    assert.deepEqual(await historicalPublicationDigests(db), db.v10HistoricalPublicationDigests);
  } finally { await db.close(); }
});

test('V10 canonical boundaries deny forged plans and authority, permit exact failed-task repair, and re-expand after active late help', async t => {
  const bank = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v10' }), byId = new Map(bank.map(item => [item.id, item]));
  const db = await fixtureV10({ catalogue: true });
  try {
    await t.test('teacher, class and token boundaries remain intact', async () => {
      await db.exec(`set fixture.actor='${other}'`); assert.equal((await prepare(db, 'foreign-teacher')).ok, false);
      await db.exec(`set fixture.actor='${teacher}'`);
      assert.equal((await prepare(db, 'foreign-student', [foreignStudent])).ok, false);
      assert.equal((await prepare(db, 'foreign-class', [studentId], foreignClass)).ok, false);
      await db.exec("set fixture.actor=''"); await assert.rejects(() => prepare(db, 'missing-teacher'), /Teacher required/);
      await db.exec(`set fixture.actor='${teacher}'`);
    });
    const prepared = await prepare(db, 'security'), id = prepared.session.id;
    assert.equal(prepared.ok, true, prepared.error); assert.equal((await control(db, id, 'start', 0)).ok, true);
    // This sequence specifically exercises a successful exact-task media
    // repair. The bounded reserve has an extra example per area/band, so a
    // random task can legitimately have no unused exact-task replacement.
    // Select a real initial form whose next phonics task after two sound
    // errors demonstrates both repairable and fail-closed media conditions.
    let repairFixture;
    for (let seed = 1; seed <= 16 && !repairFixture; seed++) {
      let offlineIds = [];
      const candidate = selectLiteracyMockBoundaryPlan(bank, { sessionId: id, studentId, seed: `canonical-v10-security-${seed}`, onOfflineItems: ids => { offlineIds = ids; } });
      const reserve = bank.filter(item => offlineIds.includes(item.id));
      const responses = candidate.itemIds.slice(0, 2).map(questionId => {
        const item = byId.get(questionId);
        return { ...answered(item, selection(item, false)), domainId: item.domainId, skillId: item.skillId,
          itemSnapshot: item, isCorrect: false, evidenceType: 'independent' };
      });
      const presentations = responses.map(response => ({ questionId: response.questionId }));
      const shortened = adaptLiteracyMockBoundaryPlan(reserve, candidate, responses, [], presentations);
      const item = byId.get(shortened.itemIds[responses.length]);
      // Contextual withdrawals change shared assets and therefore which
      // alternatives the bounded reserve contains. The contract below checks
      // both outcomes on the actual reserve, without a fixed item/seed claim.
      const repairable = item.requiredAudioPaths.filter(path => !repairLiteracyMockBoundaryPlan(reserve, shortened, responses,
        [{ questionId: item.id, failedMediaPaths: [path] }], presentations).unavailable);
      if (repairable.length && repairable.length < item.requiredAudioPaths.length) repairFixture = { plan: candidate, offline: reserve, itemId: item.id };
    }
    assert.ok(repairFixture, 'A valid initial form must retain a repairable exact-task recording and a fail-closed shared recording.');
    const { plan, offline } = repairFixture;
    const occupied = buildLiteracyExposureIndex({ exposures: plan.itemIds.map(questionId => byId.get(questionId)) });
    const replacement = (domain, demand) => bank.find(item => item.domainId === domain && item.adaptiveAreaBand === demand
      && item.adaptiveMixedEligible && !getLiteracyExposure(item, occupied).knownFamiliar && !plan.itemIds.includes(item.id));
    await t.test('entry, complete schedule and shown-prefix validation reject forged forms', async () => {
      const badEntry = { ...plan, itemIds: [...plan.itemIds] }; badEntry.itemIds[0] = replacement('sound_awareness', 3).id;
      assert.equal((await save(db, id, 'bad-entry', 0, badEntry)).ok, false);
      assert.equal((await save(db, id, 'short-plan', 0, { ...plan, itemIds: plan.itemIds.slice(0, 16) })).ok, false);
      assert.equal((await save(db, id, 'null-token', 0, plan, null, null)).ok, false);
      assert.equal((await save(db, id, 'foreign-token', 0, plan, null, 'foreign-token')).ok, false);
      assert.equal((await save(db, id, 'initial', 0, plan)).ok, true);
      const first = byId.get(plan.itemIds[0]); assert.equal((await event(db, id, first.id, 'presented', 'shown')).ok, true);
      const changed = { ...plan, itemIds: [...plan.itemIds] }; changed.itemIds[0] = replacement('sound_awareness', 0).id;
      assert.equal((await save(db, id, 'replace-shown', 1, changed)).ok, false);
      assert.equal((await event(db, id, first.id, 'support_resolved', 'child-support-authority')).ok, false);
      assert.equal((await save(db, id, 'client-score', 1, null, { ...answered(first), isCorrect: true })).ok, false);
      assert.equal((await event(db, id, first.id, 'presented', 'null-token-event', null)).ok, false);
      assert.equal((await batch(db, id, 'null-token-batch', null, [], null, null)).ok, false);
      await db.exec(`set fixture.actor='${other}'`);
      assert.equal((await query(db, 'select teacher_resolve_literacy_mock_support($1,$2,$3,$4,$5) value', [id, studentId, first.id, 'answer', 'foreign-help'])).ok, false);
      await db.exec(`set fixture.actor='${teacher}'`);
    });
    let result = await save(db, id, 'first-wrong', 1, null, answered(byId.get(plan.itemIds[0]), selection(byId.get(plan.itemIds[0]), false)));
    assert.equal(result.ok, true, result.error);
    await t.test('the table trigger preserves answers, answered plan prefix and plan history', async () => {
      await assert.rejects(() => db.query("update literacy_mock_runs set responses='[]' where session_id=$1 and student_id=$2", [id, studentId]), /Mock first-response evidence is immutable/);
      await assert.rejects(() => db.query("update literacy_mock_runs set responses=jsonb_set(responses,'{0,isCorrect}','true') where session_id=$1 and student_id=$2", [id, studentId]), /Mock first-response evidence is immutable/);
      await assert.rejects(() => db.query("update literacy_mock_runs set plan=jsonb_set(plan,'{itemIds,0}','\"forged-answer-id\"') where session_id=$1 and student_id=$2", [id, studentId]), /Mock answered plan prefix is immutable/);
      await assert.rejects(() => db.query("update literacy_mock_runs set plan_history='[{}]' where session_id=$1 and student_id=$2", [id, studentId]), /Mock first-response evidence is immutable/);
      await assert.rejects(() => db.query('update literacy_mock_runs set responses=$1 where session_id=$2 and student_id=$3',
        [[...result.run.responses, ...Array.from({ length: 67 }, (_value, index) => ({ questionId: `v10-overflow-${index}` }))], id, studentId]), /check constraint/);
    });
    await t.test('wrong demand, premature stop and completed-area offers are rejected', async () => {
      const forged = { ...plan, itemIds: [...plan.itemIds] }; forged.itemIds[1] = replacement('sound_awareness', 1).id;
      assert.equal((await save(db, id, 'wrong-next-demand', result.run.revision, forged)).ok, false);
      const second = byId.get(result.run.plan.itemIds[1]); assert.equal((await event(db, id, second.id, 'presented', 'show-second')).ok, true);
      result = await save(db, id, 'second-wrong', result.run.revision, null, answered(second, selection(second, false))); assert.equal(result.ok, true, result.error);
      const shortened = adaptLiteracyMockBoundaryPlan(offline, result.run.plan, result.run.responses, [], result.run.presentations);
      assert.equal((await save(db, id, 'premature-stop', result.run.revision, { ...shortened, itemIds: shortened.itemIds.slice(0, 2) })).ok, false);
      const extra = { ...shortened, itemIds: [...shortened.itemIds] }; extra.itemIds[2] = replacement('sound_awareness', 0).id;
      assert.equal((await save(db, id, 'completed-area-extra', result.run.revision, extra)).ok, false);
      const stoppedFuture = plan.itemIds.slice(2).find(questionId => byId.get(questionId).domainId === 'sound_awareness');
      assert.equal((await event(db, id, stoppedFuture, 'presented', 'stopped-area-show')).ok, false);
      result = await save(db, id, 'shorten', result.run.revision, shortened); assert.equal(result.ok, true, result.error);
    });
    await t.test('shown failed media can be repaired and its old presentation does not block later outbox adaptation', async () => {
      const item = byId.get(result.run.plan.itemIds[result.run.responses.length]);
      assert.equal(item.id, repairFixture.itemId, 'The canonical wrong-answer route reaches the task selected for media-repair coverage.');
      assert.equal((await event(db, id, item.id, 'presented', 'shown-before-media-fail')).ok, true);
      const sharedFailure = item.requiredAudioPaths.map(path => repairLiteracyMockBoundaryPlan(offline, result.run.plan, result.run.responses,
        [{ questionId: item.id, failedMediaPaths: [path] }], result.run.presentations)).find(repair => repair.unavailable);
      assert.ok(sharedFailure, 'A shared recording without a complete exact-task allocation must safely hold.');
      assert.deepEqual(sharedFailure.plan, result.run.plan, 'An unavailable repair preserves the original form.');
      assert.deepEqual(await query(db, 'select responses value from literacy_mock_runs where session_id=$1 and student_id=$2', [id, studentId]), result.run.responses,
        'The canonical first-response evidence remains intact during the safe hold.');
      const failedPath = item.requiredAudioPaths.find(path => !repairLiteracyMockBoundaryPlan(offline, result.run.plan, result.run.responses,
        [{ questionId: item.id, failedMediaPaths: [path] }], result.run.presentations).unavailable);
      assert.ok(failedPath, 'This fixture retains an exact-task media repair alternative. Shared instruction failures safely hold instead.');
      const failed = { questionId: item.id, responseStatus: 'media_failed', selected: null, supportUsed: false, knownFamiliar: false,
        failedMediaPaths: [failedPath], audioDelivery: Object.fromEntries(item.requiredAudioPaths.map(path => [path, path === failedPath ? 'failed' : 'completed'])) };
      result = await save(db, id, 'media-failed', result.run.revision, null, failed); assert.equal(result.ok, true, result.error);
      await assert.rejects(() => db.query("update literacy_mock_runs set media_failures='[]' where session_id=$1 and student_id=$2", [id, studentId]), /Mock first-response evidence is immutable/);
      const exposures = await query(db, 'select lp_literacy_exposures($1) value', [studentId]);
      const repaired = repairLiteracyMockBoundaryPlan(offline, result.run.plan, result.run.responses, result.run.mediaFailures, result.run.presentations, { exposures });
      assert.equal(repaired.unavailable, false); const next = byId.get(repaired.plan.itemIds[result.run.responses.length]);
      assert.notEqual(next.id, item.id); assert.equal(next.adaptiveAreaBand, item.adaptiveAreaBand); assert.equal(next.constructClaim, item.constructClaim);
      let box = createMockOutbox({ studentId, sessionId: id, run: result.run, mock: result.mock, focusSession: { id } });
      const disk = storage();
      box = appendMockOutbox(box, { requestId: 'local-repair', expectedRevision: box.run.revision, plan: repaired.plan, response: null }, {}, disk);
      box = appendMockOutbox(box, { type: 'event', requestId: 'local-show-repaired', questionId: next.id, event: 'presented' }, { item: next }, disk);
      box = appendMockOutbox(box, { requestId: 'local-answer-repaired', expectedRevision: box.run.revision, plan: null, response: answered(next) }, { item: next, isCorrect: true }, disk);
      const adapted = adaptLiteracyMockBoundaryPlan(offline, box.run.plan, box.run.responses, box.run.mediaFailures, box.run.presentations, { exposures });
      assert.doesNotThrow(() => { box = appendMockOutbox(box, { requestId: 'local-adapt-after-repair', expectedRevision: box.run.revision, plan: adapted, response: null }, {}, disk); });
      assert.equal(box.run.responses[2].questionId, next.id);
      result = await save(db, id, 'canonical-repair', result.run.revision, repaired.plan); assert.equal(result.ok, true, result.error);
      assert.equal((await event(db, id, next.id, 'presented', 'canonical-show-repaired')).ok, true);
      result = await save(db, id, 'canonical-answer-repaired', result.run.revision, null, answered(next)); assert.equal(result.ok, true, result.error);
      const canonicalNext = adaptLiteracyMockBoundaryPlan(offline, result.run.plan, result.run.responses, result.run.mediaFailures, result.run.presentations, { exposures });
      result = await save(db, id, 'canonical-adapt-after-repair', result.run.revision, canonicalNext); assert.equal(result.ok, true, result.error);
    });
    const closed = await control(db, id, 'collect', result.mock.revision, 'close-security'); assert.equal(closed.ok, true, closed.error);

    await t.test('late answer assistance can remove an active stopping pattern and restore only unshown bounded slots', async () => {
      const preparedLate = await prepare(db, 'active-late-help'), lateId = preparedLate.session.id;
      assert.equal(preparedLate.ok, true, preparedLate.error); assert.equal((await control(db, lateId, 'start', 0)).ok, true);
      const exposures = await query(db, 'select lp_literacy_exposures($1) value', [studentId]);
      let lateOfflineIds = [];
      const initial = selectLiteracyMockBoundaryPlan(bank, { sessionId: lateId, studentId, exposures, onOfflineItems: ids => { lateOfflineIds = ids; } });
      const lateOffline = bank.filter(item => lateOfflineIds.includes(item.id));
      let state = await save(db, lateId, 'late-initial', 0, initial); assert.equal(state.ok, true, state.error);
      while (state.run.responses.filter(value => value.domainId === 'sound_awareness').length < 4) {
        const item = byId.get(state.run.plan.itemIds[state.run.responses.length]);
        const correct = item.domainId !== 'sound_awareness' || item.adaptiveAreaBand === 0;
        assert.equal((await event(db, lateId, item.id, 'presented', `late-show-${state.run.responses.length}`)).ok, true);
        state = await save(db, lateId, `late-answer-${state.run.responses.length}`, state.run.revision, null, answered(item, selection(item, correct))); assert.equal(state.ok, true, state.error);
        const next = adaptLiteracyMockBoundaryPlan(lateOffline, state.run.plan, state.run.responses, [], state.run.presentations, { exposures });
        state = await save(db, lateId, `late-adapt-${state.run.responses.length}`, state.run.revision, next); assert.equal(state.ok, true, state.error);
      }
      assert.equal(literacyMockBoundaryStateV9(state.run.responses, { bank }).sound_awareness.stopReason, 'adjacent_boundary');
      const shorter = state.run.plan.itemIds.length, currentId = state.run.plan.itemIds[state.run.responses.length];
      assert.equal((await event(db, lateId, currentId, 'presented', 'late-current-shown')).ok, true);
      const helped = await query(db, 'select teacher_resolve_literacy_mock_support($1,$2,$3,$4,$5) value', [lateId, studentId, state.run.responses[0].questionId, 'answer', 'remove-first-success']);
      assert.equal(helped.ok, true, helped.error); assert.equal(helped.run.responses[0].supportUsed, true);
      const restored = adaptLiteracyMockBoundaryPlan(lateOffline, helped.run.plan, helped.run.responses, [], helped.run.presentations, { exposures });
      assert.ok(restored.itemIds.length > shorter); assert.equal(restored.itemIds[helped.run.responses.length], currentId);
      const saved = await save(db, lateId, 'restore-after-help', helped.run.revision, restored); assert.equal(saved.ok, true, saved.error);
      assert.deepEqual(await query(db, 'select lp_mock_boundary_state_v9(lp_mock_boundary_rows_v9($1,$2)) value', [lateId, studentId]), literacyMockBoundaryStateV9(saved.run.responses, { bank }));
      const stillHelped = await query(db, 'select teacher_resolve_literacy_mock_support($1,$2,$3,$4,$5) value', [lateId, studentId, saved.run.responses[0].questionId, 'access', 'later-access-only']);
      assert.equal(stillHelped.run.responses[0].evidenceType, 'supported', 'Access-only help cannot erase earlier answer assistance.');
    });
    assert.deepEqual(await historicalPublicationDigests(db), db.v10HistoricalPublicationDigests);
  } finally { await db.close(); }
});
