import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { isLiteracyItemEligible, literacyItemQualityIssue, LITERACY_QUARANTINED_ITEM_IDS } from '../../src/policy/literacyItemEligibility.js';
import { LITERACY_V9_REVIEWED_RHYME_DEMAND, LITERACY_V9_RHYME_QUARANTINE, LITERACY_V9_RHYME_FINAL_ONLY_QUARANTINE, LITERACY_V9_RHYME_QUARANTINED_ITEM_IDS,
  reviewedRhymeHasFinalOnlyShortcut } from '../../src/policy/literacyMockRhymeDemandReview.js';
import { isEligibleLiteracyResponse } from '../../src/utils/literacyEvidence.js';
import { buildLiteracyMockReport } from '../../src/utils/literacyMockReport.js';
import { literacyMockBoundaryStateV9 } from '../../src/policy/literacyMockBoundaryV9.js';
import { literacyMockV9RhymeQuarantineSql, V9_RHYME_QUARANTINE_MIGRATION } from '../../tools/generateLiteracyMockV9RhymeQuarantine.mjs';

const bank = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v9' });
const byId = new Map(bank.map(q => [q.id, q]));
const chinId = 'lp3.rhyming.l1.C.in.v3';
const readMigration = name => readFileSync(new URL(`../../supabase/migrations/${name}`, import.meta.url), 'utf8');
const functionFrom = (source, name) => source.match(new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\$\\$;`))[0];
const response = (item, correct) => ({ questionId: item.id, skillId: item.skillId, domainId: item.domainId, level: item.level,
  itemSnapshot: item.itemSnapshot, responseStatus: 'answered', isCorrect: correct, evidenceType: 'independent',
  supportUsed: false, knownFamiliar: false, serverReceivedAt: '2026-10-17T01:00:00.000Z' });

test('literal review covers the full V9 rhyme family, 20 final-only shortcuts and one reachable accent-sensitive rhyme', () => {
  const all = bank.filter(q => q.adaptiveMixedEligible && q.mediaReady !== false && !q.tutorialOnly
    && q.domainId === 'sound_awareness' && q.adaptiveAreaBand === 2);
  assert.equal(all.length, 71);
  assert.deepEqual(all.map(q => q.id).sort(), LITERACY_V9_REVIEWED_RHYME_DEMAND.map(q => q.id).sort());
  assert.equal(LITERACY_V9_RHYME_FINAL_ONLY_QUARANTINE.length, 20);
  assert.equal(LITERACY_V9_RHYME_QUARANTINED_ITEM_IDS.length, 21);
  for (const proof of LITERACY_V9_REVIEWED_RHYME_DEMAND) {
    const item = byId.get(proof.id);
    assert.equal(item.targetWord, proof.target.word, item.id);
    assert.equal(item.choices.find(c => c.id === item.answer).label, proof.answer.word, item.id);
    assert.deepEqual(item.choices.map(c => c.label).sort(), [proof.answer, ...proof.foils].map(c => c.word).sort(), item.id);
    assert.equal(isLiteracyItemEligible(item), !reviewedRhymeHasFinalOnlyShortcut(proof) && item.id !== 'lp3.rhyming.l1.B.og.v2', item.id);
    if (isLiteracyItemEligible(item)) assert.ok(proof.foils.some(c => c.rime.at(-1) === proof.target.rime.at(-1)), item.id);
  }
  const chin = LITERACY_V9_REVIEWED_RHYME_DEMAND.find(q => q.id === chinId);
  assert.deepEqual(chin.target.rime, ['IH', 'N']);
  assert.equal(chin.answer.word, 'pin');
  assert.deepEqual(chin.foils.map(c => c.word).sort(), ['chick', 'lid', 'map']);
  assert.equal(reviewedRhymeHasFinalOnlyShortcut(chin), true);
  const coat = LITERACY_V9_REVIEWED_RHYME_DEMAND.find(q => q.target.word === 'coat');
  assert.equal(coat.answer.word, 'boat');
  assert.deepEqual(coat.foils.find(c => c.word === 'cat').rime, ['AE', 'T']);
  assert.deepEqual(coat.foils.find(c => c.word === 'cake').rime, ['EY', 'K']);
  assert.equal(reviewedRhymeHasFinalOnlyShortcut(coat), false, 'cat defeats final-only matching; cake defeats vowel-only matching');
  const jog = LITERACY_V9_REVIEWED_RHYME_DEMAND.find(q => q.target.word === 'jog');
  assert.deepEqual(jog.target.rime, ['AA', 'G']);
  assert.deepEqual(jog.answer.rime, ['AO', 'G']);
  assert.equal(reviewedRhymeHasFinalOnlyShortcut(jog), false);
  assert.equal(literacyItemQualityIssue(byId.get(jog.id)).code, 'accent_sensitive_rhyme');
  assert.equal(isLiteracyItemEligible(byId.get('lp3.rhyming.l1.A.og.v1')), true,
    'fog/dog is outside the current route by reading ownership; this focused overlay does not add a broader accent rule');
});

test('withdrawal requires both the reviewed identity and V9 areas-v5 band-2 context', async () => {
  for (const row of LITERACY_V9_RHYME_QUARANTINE) {
    const item = byId.get(row.id), snapshot = item.itemSnapshot;
    for (const value of [item, { questionId: row.id, itemSnapshot: snapshot }, { questionSnapshot: snapshot }, { question: snapshot },
      { id: 'alias', sourceItemId: row.id, adaptiveAreaVersion: 'areas-v5', adaptiveAreaBand: 2 }]) {
      assert.deepEqual(literacyItemQualityIssue(value), row.issue);
    }
    for (const value of [{ id: row.id }, { questionId: row.id }, { ...snapshot, adaptiveAreaVersion: 'areas-v4' },
      { ...snapshot, adaptiveAreaBand: 1 }, { ...snapshot, id: 'unreviewed-id', sourceItemId: undefined }]) {
      assert.equal(literacyItemQualityIssue(value), null);
    }
  }
  for (let v = 1; v <= 8; v++) {
    const historic = await loadLiteracyMockBank({ contentVersion: `literacy-mock-v${v}` });
    for (const item of historic.filter(q => LITERACY_V9_RHYME_QUARANTINED_ITEM_IDS.includes(q.id))) {
      assert.equal(literacyItemQualityIssue(item), null, `${item.contentVersion}:${item.id}`);
      assert.equal(isEligibleLiteracyResponse(response(item, false)), true);
    }
  }
});

test('historical V9 answers become unscored content defects, with raw answers and published snapshots retained', () => {
  const item = byId.get(chinId), rows = [response(item, true), response(item, false)];
  const before = JSON.stringify({ item, rows });
  for (const row of rows) assert.equal(isEligibleLiteracyResponse(row), false);
  const report = buildLiteracyMockReport({ ok: true, session: { id: 'review', content_version: 'literacy-mock-v9', mock: { item_count: 67 } },
    members: [{ student_id: 'child', run: { contentVersion: 'literacy-mock-v9', plan: { itemIds: [item.id, item.id] }, responses: rows } }] },
  { students: [{ id: 'child', name: 'Synthetic learner' }], now: '2026-10-17T02:00:00.000Z' });
  const pupil = report.pupils[0];
  assert.equal(pupil.totals.independent, 0);
  assert.equal(pupil.totals.correct, 0);
  assert.equal(pupil.totals.incorrect, 0);
  assert.equal(pupil.totals.unscored, 2);
  assert.deepEqual(pupil.responses.map(q => q.originalIsCorrect), [true, false]);
  assert.ok(pupil.responses.every(q => q.classification === 'content_invalid' && q.isCorrect === null && q.evidenceType === 'unscored'));
  const state = literacyMockBoundaryStateV9(rows, { bank: byId }).sound_awareness;
  assert.equal(state.nextBand, 0, 'invalid content must not move the learner up or down a demand');
  assert.equal(state.eligible, 0);
  assert.deepEqual(state.correctByBand, [0, 0, 0, 0, 0, 0]);
  assert.deepEqual(state.incorrectByBand, [0, 0, 0, 0, 0, 0]);
  assert.equal(state.boundary, null);
  assert.equal(JSON.stringify({ item, rows }), before);
});

test('forward SQL matches the context-gated JS overlay and existing historical content-response contract', async () => {
  const migration = readMigration(V9_RHYME_QUARANTINE_MIGRATION);
  assert.equal(migration, literacyMockV9RhymeQuarantineSql());
  const db = await PGlite.create();
  try {
    await db.exec('create role anon; create role authenticated;');
    await db.exec(readMigration('20261015060558_literacy_mock_picture_quarantine.sql'));
    const previous = readMigration('20261013053259_literacy_mock_content_quarantine.sql');
    for (const name of ['lp_literacy_item_quarantined', 'lp_literacy_content_response', 'lp_literacy_response_eligible']) await db.exec(functionFrom(previous, name));
    const query = async (sql, value) => (await db.query(sql, [value])).rows[0].value;
    const old = response({ ...byId.get(chinId), itemSnapshot: { ...byId.get(chinId).itemSnapshot, contentVersion: 'literacy-mock-v8', adaptiveAreaVersion: 'areas-v4' } }, false);
    const raw = response(byId.get(chinId), false);
    await db.exec('create table published(item jsonb); create table learner_answers(response jsonb);');
    await db.query('insert into published values($1)', [byId.get(chinId)]);
    await db.query('insert into learner_answers values($1)', [raw]);
    const saved = await db.query('select (select jsonb_agg(item) from published) publications,(select jsonb_agg(response) from learner_answers) answers');
    await db.exec(migration);
    await db.exec(migration);
    for (const id of LITERACY_QUARANTINED_ITEM_IDS) assert.deepEqual(await query('select lp_literacy_item_quality_issue($1) value', { id }), literacyItemQualityIssue({ id }));
    for (const { id, issue } of LITERACY_V9_RHYME_QUARANTINE) {
      const item = byId.get(id);
      for (const value of [item, { questionId: id, itemSnapshot: item.itemSnapshot }, { questionSnapshot: item.itemSnapshot }, { question: item.itemSnapshot },
        { id: 'alias', sourceItemId: id, adaptiveAreaVersion: 'areas-v5', adaptiveAreaBand: 2 },
        { id, adaptiveAreaVersion: 'areas-v5', adaptiveAreaBand: '2' }, { questionId: id },
        { ...item, adaptiveAreaVersion: 'areas-v4', itemSnapshot: { ...item.itemSnapshot, adaptiveAreaVersion: 'areas-v4' } }]) {
        assert.deepEqual(await query('select lp_literacy_item_quality_issue($1) value', value), literacyItemQualityIssue(value));
      }
      assert.deepEqual(await query('select lp_literacy_item_quality_issue($1) value', item), issue);
    }
    assert.deepEqual(await query('select lp_literacy_content_response($1) value', old), old);
    assert.equal(await query('select lp_literacy_response_eligible($1) value', old), true);
    for (const correct of [true, false]) {
      const row = { ...raw, isCorrect: correct }, projected = await query('select lp_literacy_content_response($1) value', row);
      assert.equal(projected.originalIsCorrect, correct);
      assert.equal(projected.isCorrect, null);
      assert.equal(projected.evidenceType, 'unscored');
      assert.equal(projected.validity, 'invalid');
      assert.deepEqual(projected.itemSnapshot, row.itemSnapshot);
      assert.equal(await query('select lp_literacy_response_eligible($1) value', row), false);
    }
    assert.deepEqual(await db.query('select (select jsonb_agg(item) from published) publications,(select jsonb_agg(response) from learner_answers) answers'), saved);
    for (const role of ['anon', 'authenticated']) assert.equal((await db.query(`select has_function_privilege($1,'public.lp_literacy_item_quality_issue(jsonb)','execute') value`, [role])).rows[0].value, false);
  } finally { await db.close(); }
});
