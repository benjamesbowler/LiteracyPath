import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { fixtureV9, legacyPublicationDigests } from '../helpers/literacyMockV9Database.js';
import { query, read, functionFrom, classId, studentId } from '../helpers/literacyMockDatabase.js';
import { literacyMockV9DeliveryCacheSql, V9_DELIVERY_CACHE_MIGRATION } from '../../tools/generateLiteracyMockV9DeliveryCache.mjs';
import { loadLiteracyMockBank, scoreLiteracyMockResponse } from '../../src/data/literacyMockBank.js';
import { selectLiteracyMockBoundaryPlan, adaptLiteracyMockBoundaryPlan } from '../../src/utils/literacyMockBoundaryPlanner.js';
import { sameLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';
import { literacyMockBoundaryStateV9 } from '../../src/policy/literacyMockBoundaryV9.js';
import { createMockOutbox, appendMockOutbox, prepareMockDelivery, acknowledgeMockOutbox, verifyMockOutboxReceipt } from '../../src/utils/literacyMockOutbox.js';
import { buildLiteracyMockReport } from '../../src/utils/literacyMockReport.js';

const disk = () => { const rows = new Map(); return { setItem: (key, value) => rows.set(key, value), getItem: key => rows.get(key) ?? null, removeItem: key => rows.delete(key) }; };
const rpc = (db, name, args) => query(db, `select public.${name}(${args.map((_value, index) => `$${index + 1}`).join(',')}) value`, args);
const batch = (db, id, delivery) => rpc(db, 'student_sync_literacy_mock_batch', ['synthetic-token', id, delivery.batchId, delivery.leaseId, delivery.sent.requests, delivery.collectionId]);
const projection = byId => request => { const item = byId.get(request.questionId || request.response?.questionId); return { item, isCorrect: item && request.response ? scoreLiteracyMockResponse(item, request.response.selected) : undefined }; };
// Event identity sequences advance even when the baseline transaction rolls
// back. Each actual receipt is checked separately against its sent watermark.
const normalized = value => JSON.parse(JSON.stringify(value, (key, row) => ['eventRevision', 'serverReceivedAt', 'occurredAt', 'changedAt', 'completedAt', 'updatedAt', 'server_now'].includes(key) ? undefined : row));
const counters = ['lp_mock_boundary_rows_v9', 'lp_literacy_mock_help', 'lp_literacy_mock_effective_response', 'lp_mock_boundary_state_v9'];
const signatures = ['uuid,uuid', 'uuid,uuid,text', 'uuid,uuid,jsonb', 'jsonb'];
const argumentsSql = ['p_session_id uuid,p_student_id uuid', 'p_session_id uuid,p_student_id uuid,p_question_id text', 'p_session_id uuid,p_student_id uuid,p_response jsonb', 'p_rows jsonb'];
const calls = ['p_session_id,p_student_id', 'p_session_id,p_student_id,p_question_id', 'p_session_id,p_student_id,p_response', 'p_rows'];

async function countFunctions(db) {
  for (const [index, name] of counters.entries()) await db.exec(`create sequence delivery_count_${index} minvalue 0 start 0;
    alter function public.${name}(${signatures[index]}) rename to delivery_original_${index};
    create function public.${name}(${argumentsSql[index]}) returns jsonb language plpgsql stable security definer set search_path='' as $$begin
     perform nextval('public.delivery_count_${index}'); return public.delivery_original_${index}(${calls[index]});end;$$;`);
}
const resetCounts = db => db.exec(counters.map((_name, index) => `select setval('delivery_count_${index}',0,true);`).join('\n'));
const counts = async db => Object.fromEntries(await Promise.all(counters.map(async (name, index) => [name, await query(db, `select last_value::integer value from delivery_count_${index}`)])));

function correctQueue(bootstrap, offline, byId) {
  let box = createMockOutbox({ studentId, sessionId: bootstrap.run.assignmentId, run: bootstrap.run, mock: bootstrap.mock, focusSession: { id: bootstrap.run.assignmentId } });
  while (box.run.responses.length < box.run.plan.itemIds.length) {
    const index = box.run.responses.length, item = byId.get(box.run.plan.itemIds[index]); assert.ok(item);
    const response = { questionId: item.id, selected: item.answer, responseStatus: 'answered', supportUsed: false, knownFamiliar: false,
      audioDelivery: Object.fromEntries(item.requiredAudioPaths.map(path => [path, 'completed'])) };
    box = appendMockOutbox(box, { type: 'event', requestId: `shown-${index}`, questionId: item.id, event: 'presented' }, { item }, disk());
    box = appendMockOutbox(box, { requestId: `answer-${index}`, expectedRevision: box.run.revision, plan: null, response }, { item, isCorrect: true }, disk());
    const next = adaptLiteracyMockBoundaryPlan(offline, box.run.plan, box.run.responses, [], box.run.presentations);
    if (!sameLiteracyMockPlan(next, box.run.plan)) box = appendMockOutbox(box, { requestId: `adapt-${index}`, expectedRevision: box.run.revision, plan: next, response: null }, {}, disk());
  }
  return box;
}

test('V9 delivery optimization is a reproducible forward migration with exact guarded mutation bodies', () => {
  const sql = literacyMockV9DeliveryCacheSql();
  assert.equal(read(V9_DELIVERY_CACHE_MIGRATION), sql);
  const old = read('20261016141521_literacy_mock_boundary_v9.sql');
  const bodies = source => new Map([...source.matchAll(/create or replace function public\.(\w+)\([\s\S]*?\$\$;/g)].map(match => [match[1], match[0]]));
  const before = bodies(old), after = bodies(sql);
  assert.equal(after.size, 7);
  assert.ok(!after.has('student_save_literacy_mock_run'), 'The complete save/freshness validator remains unchanged.');
  assert.ok(!after.has('student_sync_literacy_mock_batch'), 'Batch ownership, leases, receipt identity and atomicity remain unchanged.');
  assert.equal(after.get('lp_literacy_mock_effective_response'),
    functionFrom('20261013053259_literacy_mock_content_quarantine.sql', 'lp_literacy_mock_effective_response').replace('with support as (', 'with support as materialized ('));
  const oldEvent = before.get('student_record_literacy_mock_event'), newEvent = after.get('student_record_literacy_mock_event');
  for (const guard of ["v_student:=public.student_from_token(p_token);", "if not public.lp_literacy_mock_assignment", "if v_mock->>'state'<>'running'", "question_not_current", "assignment_not_found", "content_item_withdrawn", "blocked_media_item", "presentation_required", "help_not_pending", "event_limit", "v_familiarity:=public.lp_literacy_familiarity", "insert into public.literacy_mock_events"]) {
    assert.ok(oldEvent.includes(guard) && newEvent.includes(guard), guard);
  }
  assert.match(sql, /revoke all on function public\.lp_mock_response_with_help_v9\(jsonb,jsonb\) from public,anon,authenticated/);
});

test('V9 late delivery retains exact scoring and receipts while bounding repeated support and boundary work', async t => {
  const bank = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v9' }), byId = new Map(bank.map(item => [item.id, item]));
  const db = await fixtureV9({ catalogue: true, deliveryCache: false });
  let box, id, expectedLate, baselineCounts, baselineMs;
  try {
    const itemsBefore = (await db.query("select content_version,md5(string_agg(id||':'||md5(item::text),E'\\n' order by id collate \"C\")) digest from literacy_mock_items group by content_version order by content_version")).rows;
    const oldEffective = functionFrom('20261013053259_literacy_mock_content_quarantine.sql', 'lp_literacy_mock_effective_response')
      .replace('public.lp_literacy_mock_effective_response(', 'public.delivery_effective_before(');
    await db.exec(oldEffective);
    const prepared = await rpc(db, 'teacher_prepare_literacy_mock_session_v9', [classId, [studentId], false, 20, 67, 'late-delivery-cache', 'untimed']);
    assert.equal(prepared.ok, true, prepared.error); id = prepared.session.id;
    assert.equal((await rpc(db, 'teacher_control_literacy_mock_session', [id, 'start', 0, 'start'])).ok, true);
    let reserve = [];
    const plan = selectLiteracyMockBoundaryPlan(bank, { sessionId: id, studentId, seed: 'delivery-cache-profile', onOfflineItems: ids => { reserve = ids; } });
    const offline = bank.filter(item => reserve.includes(item.id));
    assert.equal((await rpc(db, 'student_save_literacy_mock_run', ['synthetic-token', id, 'initial', 0, plan, null])).ok, true);
    const bootstrap = await rpc(db, 'student_sync_literacy_mock_batch', ['synthetic-token', id, 'bootstrap', null, [], null]); assert.equal(bootstrap.ok, true);
    box = correctQueue(bootstrap, offline, byId); assert.equal(box.run.responses.length, 58); assert.equal(box.requests.length, 174);
    let number = 0;
    while (box.serverRun.responses.length < 52) {
      box = prepareMockDelivery(box, { batchId: `delivery-${++number}` }, disk());
      const received = await batch(db, id, box.delivery); assert.equal(received.ok, true, received.error);
      box = acknowledgeMockOutbox(box, box.delivery.sent, received, projection(byId), disk());
    }
    assert.equal(box.serverRun.responses.length, 52);
    box = prepareMockDelivery(box, { batchId: 'late-52-to-56' }, disk()); assert.equal(box.delivery.sent.requests.length, 12);
    await countFunctions(db);
    await db.exec('begin'); await resetCounts(db);
    let started = performance.now(); expectedLate = await batch(db, id, box.delivery); baselineMs = performance.now() - started;
    assert.equal(expectedLate.ok, true, expectedLate.error); assert.equal(expectedLate.run.responses.length, 56); baselineCounts = await counts(db);
    await db.exec('rollback');
    assert.equal(baselineCounts.lp_mock_boundary_rows_v9, 16);
    assert.equal(baselineCounts.lp_mock_boundary_state_v9, 20);
    assert.equal(baselineCounts.lp_literacy_mock_effective_response, 920);
    assert.equal(baselineCounts.lp_literacy_mock_help, 8280);

    // Apply the exact generated forward migration to the same 52-answer state.
    await db.exec(read(V9_DELIVERY_CACHE_MIGRATION));
    // The migration replaces two counted functions; put counters around the
    // reviewed replacements again. The help counter remains in place.
    for (const index of [0, 2]) {
      const name = counters[index];
      await db.exec(`drop function public.delivery_original_${index}(${signatures[index]});
        alter function public.${name}(${signatures[index]}) rename to delivery_original_${index};
        create function public.${name}(${argumentsSql[index]}) returns jsonb language plpgsql stable security definer set search_path='' as $$begin
         perform nextval('public.delivery_count_${index}'); return public.delivery_original_${index}(${calls[index]});end;$$;`);
    }
    await resetCounts(db); started = performance.now();
    const received = await batch(db, id, box.delivery), elapsed = performance.now() - started, reduced = await counts(db);
    assert.equal(received.ok, true, received.error); verifyMockOutboxReceipt(received, box.delivery.sent);
    assert.deepEqual(normalized(received.run), normalized(expectedLate.run));
    assert.equal(reduced.lp_mock_boundary_rows_v9, 8);
    assert.equal(reduced.lp_mock_boundary_state_v9, 8);
    assert.equal(reduced.lp_literacy_mock_effective_response, 60);
    assert.equal(reduced.lp_literacy_mock_help, 60);
    t.diagnostic(`Same 52→56 prefix: before=${baselineMs.toFixed(1)} ms, after=${elapsed.toFixed(1)} ms; boundary 16→8, states 20→8, effective responses 920→60, help reads 8280→60. Timings are isolated PGlite, not hosted latency.`);
    await resetCounts(db); const replay = await batch(db, id, box.delivery);
    assert.equal(replay.duplicate, true); assert.deepEqual(replay.run, received.run);
    assert.ok(Object.values(await counts(db)).every(value => value === 0), 'Exact retries return the stored receipt without recomputation.');
    box = acknowledgeMockOutbox(box, box.delivery.sent, received, projection(byId), disk());
    while (box.requests.length) {
      box = prepareMockDelivery(box, { batchId: `final-${++number}` }, disk());
      const final = await batch(db, id, box.delivery); assert.equal(final.ok, true, final.error);
      box = acknowledgeMockOutbox(box, box.delivery.sent, final, projection(byId), disk());
    }
    assert.equal(box.serverRun.status, 'completed'); assert.equal(box.serverRun.responses.length, 58); assert.equal(box.serverRun.plan.itemIds.length, 58);
    assert.ok(box.serverRun.responses.every(response => response.isCorrect === true));
    assert.deepEqual(await query(db, 'select lp_mock_boundary_state_v9(lp_mock_boundary_rows_v9($1,$2)) value', [id, studentId]), literacyMockBoundaryStateV9(box.serverRun.responses, { bank: byId }));

    await t.test('support aggregation exactly matches existing effective evidence through request, cancel, access and answer resolution', async () => {
      const questionId = box.serverRun.responses[0].questionId;
      const compare = async () => {
        const before = await query(db, `select coalesce(jsonb_agg(public.delivery_effective_before($1,$2,r.response)
          ||jsonb_build_object('questionId',i.id,'domainId',i.item->'domainId','skillId',i.item->'skillId','itemSnapshot',i.item->'itemSnapshot') order by r.position),'[]') value
          from literacy_mock_runs run cross join lateral jsonb_array_elements(run.responses) with ordinality r(response,position)
          join literacy_mock_items i on i.content_version='literacy-mock-v9' and i.id=r.response->>'questionId' where run.session_id=$1 and run.student_id=$2`, [id, studentId]);
        const after = await query(db, 'select lp_mock_boundary_rows_v9($1,$2) value', [id, studentId]); assert.deepEqual(after, before);
        return after[0];
      };
      await compare();
      for (const [index, [eventType, assistance]] of [['help_requested', null], ['help_cancelled', null], ['help_requested', null], ['support_resolved', 'access'], ['support_resolved', 'answer'], ['support_resolved', 'access'], ['help_requested', null], ['help_cancelled', null]].entries()) {
        await db.query('insert into literacy_mock_events(session_id,student_id,question_id,actor_key,request_id,event_type,payload) values($1,$2,$3,$4,$5,$6,$7)',
          [id, studentId, questionId, 'fixture-support', `support-${index}`, eventType, assistance ? { assistance } : {}]);
        const effective = await compare();
        if (index >= 4) assert.equal(effective.evidenceType, 'supported', 'Later access/cancellation cannot erase observed answer assistance.');
      }
      const raw = await query(db, 'select responses value from literacy_mock_runs where session_id=$1 and student_id=$2', [id, studentId]);
      for (const flags of [{}, { supportUsed: true }, { responseStatus: 'skipped', isCorrect: null }, { validity: 'invalid' }, { knownFamiliar: true }]) {
        const response = { ...raw[0], ...flags };
        assert.deepEqual(await query(db, 'select lp_literacy_mock_effective_response($1,$2,$3) value', [id, studentId, response]),
          await query(db, 'select delivery_effective_before($1,$2,$3) value', [id, studentId, response]));
      }
    });

    await t.test('teacher report receives all 58 canonical answers without changing raw evidence', async () => {
      await resetCounts(db); const start = performance.now();
      const payload = await rpc(db, 'teacher_get_literacy_mock_report', [id]);
      const report = buildLiteracyMockReport(payload, { students: [{ id: studentId, name: 'Synthetic learner' }] });
      assert.equal(report.pupils[0].answered, 58); assert.equal(report.pupils[0].totals.supported, 1); assert.equal(report.pupils[0].totals.independent, 57);
      assert.ok(report.pupils[0].responses.every(response => response.isCorrect === true));
      t.diagnostic(`Full teacher report after completion: ${(performance.now() - start).toFixed(1)} ms in isolated PGlite.`);
    });
    const afterItems = (await db.query("select content_version,md5(string_agg(id||':'||md5(item::text),E'\\n' order by id collate \"C\")) digest from literacy_mock_items group by content_version order by content_version")).rows;
    assert.deepEqual(afterItems, itemsBefore); assert.deepEqual(await legacyPublicationDigests(db), db.v9LegacyPublicationDigests);
  } finally { await db.close(); }
});

test('forward delivery functions retain private helpers and exact child RPC access', async () => {
  const db = await fixtureV9();
  try {
    for (const signature of ['lp_mock_response_with_help_v9(jsonb,jsonb)', 'lp_mock_boundary_rows_v9(uuid,uuid)', 'lp_mock_boundary_schedule_with_state_v9(jsonb,jsonb)', 'lp_mock_boundary_schedule_v9(jsonb)', 'lp_mock_boundary_plan_error_v9(uuid,uuid,jsonb,jsonb,integer,jsonb)', 'lp_literacy_mock_effective_response(uuid,uuid,jsonb)']) {
      for (const role of ['anon', 'authenticated']) assert.equal(await query(db, 'select has_function_privilege($1,$2,$3) value', [role, signature, 'execute']), false, signature);
    }
    for (const role of ['anon', 'authenticated']) assert.equal(await query(db, 'select has_function_privilege($1,$2,$3) value', [role, 'student_record_literacy_mock_event(text,uuid,text,text,text)', 'execute']), true);
    assert.equal((await rpc(db, 'student_record_literacy_mock_event', [null, '44000000-0000-4000-8000-000000000001', 'q0', 'presented', 'null-token'])).error, 'invalid_session');
    assert.equal((await rpc(db, 'student_record_literacy_mock_event', ['foreign-token', '44000000-0000-4000-8000-000000000001', 'q0', 'presented', 'foreign-token'])).error, 'assignment_not_found');
  } finally { await db.close(); }
});
