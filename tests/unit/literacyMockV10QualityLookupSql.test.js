import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { PGlite } from '@electric-sql/pglite';
import { read, query, teacher, classId, studentId } from '../helpers/literacyMockDatabase.js';
import { fixtureV10, historicalPublicationDigests } from '../helpers/literacyMockV10Database.js';
import { literacyMockV10QualityLookupSql, V10_QUALITY_LOOKUP_MIGRATION } from '../../tools/generateLiteracyMockV10QualityLookup.mjs';
import { loadLiteracyMockBank, scoreLiteracyMockResponse } from '../../src/data/literacyMockBank.js';
import { LITERACY_QUARANTINED_ITEM_IDS, LITERACY_CONTEXTUAL_ITEM_QUALITY_ISSUES, literacyItemQualityIssue, isLiteracyItemEligible } from '../../src/policy/literacyItemEligibility.js';
import { literacyMockBoundaryStateV9 } from '../../src/policy/literacyMockBoundaryV9.js';
import { selectLiteracyMockBoundaryPlan, adaptLiteracyMockBoundaryPlan } from '../../src/utils/literacyMockBoundaryPlanner.js';
import { createMockOutbox, appendMockOutbox, prepareMockDelivery, acknowledgeMockOutbox, verifyMockOutboxReceipt } from '../../src/utils/literacyMockOutbox.js';
import { sameLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';
import { mockConstructionLength } from '../../src/utils/literacyMockResponse.js';
import { buildLiteracyMockReport } from '../../src/utils/literacyMockReport.js';

const applied = read('20261016184804_literacy_mock_boundary_v10.sql');
const oldFunction = applied.match(/create or replace function public\.lp_literacy_item_quality_issue\([\s\S]*?\$\$;/)[0];
const oldName = 'lp_quality_before_lookup';
const qualityMetadata = db => query(db, "select to_jsonb(p)-'prosrc' value from pg_proc p where oid='public.lp_literacy_item_quality_issue(jsonb)'::regprocedure");
const bank = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v10' });

function qualityCases() {
  const ordinary = [null, {}, [], false, 0, 'literal', { itemSnapshot: false }, { itemSnapshot: 0 }, { itemSnapshot: [] }];
  ordinary.push(...LITERACY_QUARANTINED_ITEM_IDS.flatMap(id => [{ id }, { questionId: id }, { itemSnapshot: { sourceItemId: id } }]));
  const sources = LITERACY_CONTEXTUAL_ITEM_QUALITY_ISSUES.map(rule => ({ id: rule.id, sourceItemId: rule.id,
    contentVersion: rule.contentVersion || 'literacy-mock-v9', adaptiveAreaVersion: rule.adaptiveAreaVersion, adaptiveAreaBand: rule.adaptiveAreaBand }));
  for (const source of sources) {
    const missingBand = { ...source }; delete missingBand.adaptiveAreaBand;
    const missingVersion = { ...source }; delete missingVersion.contentVersion;
    ordinary.push(source, { questionId: source.id, itemSnapshot: source }, { questionSnapshot: source }, { question: source },
      { itemSnapshot: null, questionSnapshot: source }, { questionSnapshot: null, question: source },
      { ...source, itemSnapshot: null, questionSnapshot: null, question: null },
      { ...source, adaptiveAreaBand: String(source.adaptiveAreaBand) }, { ...source, adaptiveAreaBand: null }, missingBand,
      { ...source, adaptiveAreaVersion: 'areas-v4' }, { ...source, contentVersion: 'literacy-mock-v8' }, missingVersion,
      { ...source, id: `repaired-${source.id}`, sourceItemId: `repaired-${source.id}`, canonicalItemId: source.id });
  }
  const aliases = [];
  const global = LITERACY_QUARANTINED_ITEM_IDS;
  for (const id of global) for (const competitor of [global[0], global.at(-1)]) {
    aliases.push({ questionId: competitor, id }, { questionId: id, id: competitor },
      { sourceItemId: competitor, itemSnapshot: { id } }, { id, itemSnapshot: { sourceItemId: competitor } });
  }
  for (const [index, source] of sources.entries()) {
    for (const id of [global[0], global.at(-1)]) aliases.push({ questionId: id, itemSnapshot: source },
      { id: source.id, itemSnapshot: { ...source, sourceItemId: id } });
    const competitor = sources.find((candidate, other) => other !== index && candidate.adaptiveAreaBand === source.adaptiveAreaBand
      && candidate.contentVersion === source.contentVersion);
    if (competitor) aliases.push({ questionId: competitor.id, itemSnapshot: source }, { questionId: source.id, itemSnapshot: { ...source, id: competitor.id } });
  }
  return { ordinary, aliases };
}
const evaluate = (db, name, values) => query(db, `select jsonb_agg(public.${name}(q) order by n) value from jsonb_array_elements($1) with ordinality e(q,n)`, [values]);

test('the forward migration contains only the existing private immutable lookup and matches its pinned generator', () => {
  const sql = literacyMockV10QualityLookupSql();
  assert.equal(read(V10_QUALITY_LOOKUP_MIGRATION), sql);
  assert.equal((sql.match(/create or replace function /g) || []).length, 1);
  assert.doesNotMatch(sql, /\bas \(values\b/i);
  assert.match(sql, /source as materialized/); assert.match(sql, /candidates as materialized/);
  assert.match(sql, /order by \(rule->>'priority'\)::integer/);
  assert.doesNotMatch(sql, /security definer|alter table|insert into|update public|delete from/i);
});

test('indexed lookup exactly matches applied quality, alias priority and metadata; actual 5000-row benchmark', async t => {
  const db = await PGlite.create();
  try {
    await db.exec('create role anon; create role authenticated;');
    await db.exec(oldFunction);
    await db.exec('revoke all on function public.lp_literacy_item_quality_issue(jsonb) from public,anon,authenticated;');
    await db.exec(oldFunction.replace('public.lp_literacy_item_quality_issue(', `public.${oldName}(`));
    const beforeMetadata = await qualityMetadata(db);
    await db.exec(literacyMockV10QualityLookupSql());
    assert.deepEqual(await qualityMetadata(db), beforeMetadata, 'OID/owner/language/volatility/security/config/defaults/ACL stay exact.');
    const { ordinary, aliases } = qualityCases(), values = [...ordinary, ...aliases];
    const before = await evaluate(db, oldName, values), after = await evaluate(db, 'lp_literacy_item_quality_issue', values);
    assert.deepEqual(after, before, 'All applied context, wrapper, missing/null/string and conflicting-alias results stay exact.');
    assert.deepEqual(after.slice(0, ordinary.length), ordinary.map(value => literacyItemQualityIssue(value)));
    for (const role of ['anon', 'authenticated']) assert.equal(await query(db, 'select has_function_privilege($1,$2,$3) value',
      [role, 'public.lp_literacy_item_quality_issue(jsonb)', 'execute']), false);
    const deliverable = bank.filter(item => item.adaptiveMixedEligible && !item.tutorialOnly && isLiteracyItemEligible(item));
    const responses = Array.from({ length: 5000 }, (_row, index) => {
      const item = deliverable[index % deliverable.length];
      return { questionId: item.id, itemSnapshot: item.itemSnapshot, selected: item.answer, isCorrect: true, evidenceType: 'independent' };
    });
    await db.exec('create temporary table quality_benchmark(position integer,input jsonb);');
    await db.query('insert into quality_benchmark select n::integer,q from jsonb_array_elements($1) with ordinality e(q,n)', [responses]);
    const benchmark = async name => {
      const started = performance.now();
      const digest = await query(db, `select md5(string_agg(coalesce(public.${name}(input)::text,'null'),E'\\n' order by position)) value from quality_benchmark`);
      return { digest, milliseconds: performance.now() - started };
    };
    await evaluate(db, oldName, responses.slice(0, 10)); await evaluate(db, 'lp_literacy_item_quality_issue', responses.slice(0, 10));
    const previous = await benchmark(oldName), indexed = await benchmark('lp_literacy_item_quality_issue');
    assert.equal(indexed.digest, previous.digest);
    t.diagnostic(JSON.stringify({ parityCases: values.length, actualResponseRows: responses.length, beforeMs: previous.milliseconds,
      afterMs: indexed.milliseconds, speedup: previous.milliseconds / indexed.milliseconds,
      scope: 'Local PGlite function benchmark; production batch timing requires live proof.' }));
  } finally { await db.close(); }
});

const storage = () => { const data = new Map(); return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) }; };
function selectedValue(item, correct) {
  if (correct) return item.answer;
  const choices = item.choices.map(choice => choice.id);
  const values = item.format === 'build_word' ? item.choices.map((_choice, start) => Array.from({ length: mockConstructionLength(item) }, (_value, index) => item.choices[(start + index) % item.choices.length].label).join(''))
    : Array.isArray(item.answer) ? [[...item.answer].reverse(), [...item.answer.slice(1), item.answer[0]], [choices.find(id => id !== item.answer[0]), ...item.answer.slice(1)]] : choices;
  const wrong = values.find(value => !scoreLiteracyMockResponse(item, value)); assert.notEqual(wrong, undefined, item.id); return wrong;
}
function completeOutbox(bootstrap, offline, outcome) {
  const disk = storage(), byId = new Map(offline.map(item => [item.id, item]));
  let box = createMockOutbox({ studentId: bootstrap.run.studentId, sessionId: bootstrap.run.assignmentId, run: bootstrap.run, mock: bootstrap.mock, focusSession: { id: bootstrap.run.assignmentId } });
  const trace = [];
  while (box.run.responses.length < box.run.plan.itemIds.length) {
    const index = box.run.responses.length, item = byId.get(box.run.plan.itemIds[index]), correct = outcome(index), selected = selectedValue(item, correct);
    assert.equal(scoreLiteracyMockResponse(item, selected), correct);
    box = appendMockOutbox(box, { type: 'event', requestId: `show-${index}`, questionId: item.id, event: 'presented' }, { item }, disk);
    box = appendMockOutbox(box, { requestId: `answer-${index}`, expectedRevision: box.run.revision, plan: null,
      response: { questionId: item.id, selected, responseStatus: 'answered', knownFamiliar: false, supportUsed: false,
        audioDelivery: Object.fromEntries(item.requiredAudioPaths.map(path => [path, 'completed'])) } }, { item, isCorrect: correct }, disk);
    trace.push({ questionId: item.id, selected, isCorrect: correct, band: item.adaptiveAreaBand });
    const adapted = adaptLiteracyMockBoundaryPlan(offline, box.run.plan, box.run.responses, [], box.run.presentations);
    if (!sameLiteracyMockPlan(adapted, box.run.plan)) box = appendMockOutbox(box, { requestId: `adapt-${index}`, expectedRevision: box.run.revision, plan: adapted, response: null }, {}, disk);
  }
  return { box, trace };
}

test('lookup-only migration preserves full canonical 58 correct, 16 incorrect and 48 reversal runs with reports', async t => {
  const db = await fixtureV10({ catalogue: true }), byId = new Map(bank.map(item => [item.id, item]));
  try {
    const metadata = await qualityMetadata(db), historical = await historicalPublicationDigests(db);
    const currentDigest = await query(db, "select md5(string_agg(id||':'||md5(item::text),E'\\n' order by id collate \"C\")) value from literacy_mock_items where content_version='literacy-mock-v10'");
    await db.exec(literacyMockV10QualityLookupSql()); assert.deepEqual(await qualityMetadata(db), metadata);
    for (const [index, [name, length, outcome]] of [['correct', 58, () => true], ['incorrect', 16, () => false], ['reversal', 48, index => index < 16]].entries()) {
      const learner = index === 0 ? studentId : `33000000-0000-4000-8000-${String(990 + index).padStart(12, '0')}`;
      if (index) await db.query('insert into students values($1,$2,$3,$4,null)', [learner, classId, teacher, `Lookup ${name}`]);
      await db.exec(`create or replace function student_from_token(token text) returns public.students language sql stable as $$select s.* from public.students s where id=case when token='synthetic-token' then '${learner}'::uuid else null end and archived_at is null$$`);
      const prepared = await query(db, 'select teacher_prepare_literacy_mock_session_v10($1,$2,false,20,67,$3,$4) value', [classId, [learner], `lookup-${name}`, 'untimed']);
      assert.equal(prepared.ok, true, prepared.error); const id = prepared.session.id;
      assert.equal((await query(db, 'select teacher_control_literacy_mock_session($1,$2,0,$3) value', [id, 'start', 'start'])).ok, true);
      let offlineIds = [];
      const plan = selectLiteracyMockBoundaryPlan(bank, { sessionId: id, studentId: learner, onOfflineItems: ids => { offlineIds = ids; } });
      const offline = bank.filter(item => offlineIds.includes(item.id));
      const registered = await query(db, 'select student_save_literacy_mock_run($1,$2,$3,0,$4,null) value', ['synthetic-token', id, 'initial', plan]); assert.equal(registered.ok, true, registered.error);
      const sync = (key, lease, requests = []) => query(db, 'select student_sync_literacy_mock_batch($1,$2,$3,$4,$5,null) value', ['synthetic-token', id, key, lease, requests]);
      const bootstrap = await sync('bootstrap', null); assert.equal(bootstrap.ok, true, bootstrap.error);
      let { box, trace } = completeOutbox(bootstrap, offline, outcome), result, delivery = 0; const batchMs = [];
      while (box.requests.length) {
        box = prepareMockDelivery(box, { batchId: `lookup-batch-${++delivery}` }, storage()); const sent = box.delivery.sent;
        assert.ok(sent.requests.length <= 12);
        const started = performance.now(); result = await sync(sent.batchId, box.delivery.leaseId, sent.requests); batchMs.push(performance.now() - started);
        assert.equal(result.ok, true, `${name}: ${JSON.stringify(result)}`); verifyMockOutboxReceipt(result, sent);
        const retried = await sync(sent.batchId, box.delivery.leaseId, sent.requests); assert.equal(retried.duplicate, true);
        assert.deepEqual(retried.run.responses, result.run.responses);
        box = acknowledgeMockOutbox(box, sent, result, request => { const item = byId.get(request.questionId || request.response?.questionId);
          return { item, isCorrect: item && request.response ? scoreLiteracyMockResponse(item, request.response.selected) : undefined }; }, storage());
      }
      assert.equal(trace.length, length); assert.equal(result.run.status, 'completed'); assert.equal(result.run.plan.itemIds.length, length);
      assert.deepEqual(result.run.responses.map(row => ({ questionId: row.questionId, selected: row.selected, isCorrect: row.isCorrect, band: row.itemSnapshot.adaptiveAreaBand })), trace);
      assert.deepEqual(await query(db, 'select lp_mock_boundary_state_v9(lp_mock_boundary_rows_v9($1,$2)) value', [id, learner]), literacyMockBoundaryStateV9(result.run.responses, { bank: byId }));
      const collected = await query(db, 'select teacher_control_literacy_mock_session($1,$2,$3,$4) value', [id, 'collect', result.mock.revision, 'collect']); assert.equal(collected.ok, true, collected.error);
      const payload = await query(db, 'select teacher_get_literacy_mock_report($1) value', [id]);
      const pupil = buildLiteracyMockReport(payload, { students: [{ id: learner, name }] }).pupils[0];
      assert.equal(pupil.planned, length); assert.equal(pupil.answered, length); assert.equal(pupil.totals.independent, length);
      assert.deepEqual(pupil.responses.map(row => ({ questionId: row.questionId, selected: row.selected, isCorrect: row.isCorrect, band: row.itemSnapshot.adaptiveAreaBand })), trace);
      t.diagnostic(JSON.stringify({ pattern: name, answers: length, deliveries: batchMs.length, maximumLocalBatchMs: Math.max(...batchMs), localBatchMs: batchMs }));
    }
    assert.deepEqual(await historicalPublicationDigests(db), historical);
    assert.equal(await query(db, "select md5(string_agg(id||':'||md5(item::text),E'\\n' order by id collate \"C\")) value from literacy_mock_items where content_version='literacy-mock-v10'"), currentDigest);
    assert.equal(await query(db, 'select count(*)::integer value from student_progress'), 0);
  } finally { await db.close(); }
});
