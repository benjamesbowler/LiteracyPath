import assert from 'node:assert/strict';
import test from 'node:test';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { LITERACY_V9_REVIEWED_TRANSFORMATIONS, LITERACY_V9_TRANSFORMATION_QUARANTINE,
  LITERACY_V9_TRANSFORMATION_QUARANTINED_ITEM_IDS, LITERACY_V9_REVIEWED_LOWER_SOUND_SHORTCUTS,
  LITERACY_V9_LOWER_SOUND_QUARANTINE } from '../../src/policy/literacyMockTransformationDemandReview.js';
import { literacyMockDemandV10 } from '../../src/policy/literacyMockDemandV10.js';
import { LITERACY_CONTEXTUAL_ITEM_QUALITY_ISSUES, literacyItemQualityIssue, isLiteracyItemEligible } from '../../src/policy/literacyItemEligibility.js';
import { isEligibleLiteracyResponse } from '../../src/utils/literacyEvidence.js';
import { buildLiteracyMockReport } from '../../src/utils/literacyMockReport.js';
import { selectLiteracyMockFreshCheck } from '../../src/utils/literacyMockPlanner.js';
import { literacyMockFocus } from '../../src/utils/literacyMockConditions.js';

const bank = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v9', includeUnavailable: true });
const byId = new Map(bank.map(q => [q.id, q]));
const response = (item, correct) => ({ questionId: item.id, skillId: item.skillId, domainId: item.domainId, level: item.level,
  itemSnapshot: item.itemSnapshot, responseStatus: 'answered', evidenceType: 'independent', isCorrect: correct,
  supportUsed: false, knownFamiliar: false, serverReceivedAt: '2026-10-17T01:00:00.000Z' });

test('all 40 literal legacy tasks are covered; exactly 35 demand defects withdraw and five source-dependent additions remain valid', () => {
  const all = bank.filter(q => q.domainId === 'sound_awareness' && q.adaptiveAreaBand === 5 && q.adaptiveMixedEligible && !q.tutorialOnly && q.mediaReady !== false);
  assert.equal(all.length, 40);
  assert.deepEqual(all.map(q => q.id).sort(), LITERACY_V9_REVIEWED_TRANSFORMATIONS.map(q => q.id).sort());
  assert.equal(LITERACY_V9_TRANSFORMATION_QUARANTINE.length, 35);
  assert.equal(LITERACY_CONTEXTUAL_ITEM_QUALITY_ISSUES.length, 101);
  const counts = {};
  for (const proof of LITERACY_V9_REVIEWED_TRANSFORMATIONS) {
    const item = byId.get(proof.id);
    assert.deepEqual(item.choices.map(c => c.label).sort(), [proof.answer, ...proof.foils].map(c => c.word).sort());
    assert.equal(item.choices.find(c => c.id === item.answer).label, proof.answer.word);
    assert.ok(item.requiredAudioCues.find(c => c.role === 'instruction').text.startsWith(`Say ${proof.source.word}.`));
    assert.equal(isLiteracyItemEligible(item), proof.defect === null);
    if (proof.defect) counts[proof.defect] = (counts[proof.defect] || 0) + 1;
    const choices = [proof.answer, ...proof.foils];
    if (proof.defect === 'replacement_edge') {
      const index = proof.operation === 'substitute_final' ? -1 : 0;
      assert.equal(choices.filter(c => c.phonemes.at(index) === proof.anchor.phonemes.at(index)).length, 1);
    } else if (proof.defect === 'deleted_edge') assert.equal(choices.filter(c => c.phonemes[0] !== proof.source.phonemes[0]).length, 1);
    else if (proof.defect === 'phoneme_count') assert.ok(proof.foils.every(c => c.phonemes.length < proof.answer.phonemes.length));
    else if (proof.defect === 'source_isolation') {
      assert.ok(choices.every(c => c.phonemes.slice(1).join(' ') === 'IH NG'));
      assert.equal(choices.filter(c => c.phonemes[0] === proof.source.phonemes[1]).length, 1);
    }
  }
  assert.deepEqual(counts, { replacement_edge: 20, deleted_edge: 9, source_isolation: 1, phoneme_count: 5 });
  assert.deepEqual(all.filter(isLiteracyItemEligible).map(q => q.id).sort(), [
    'literacy.sound_manipulation.add-s-top', 'mock.capacity.foundation.oral.add_phoneme.lip.cat',
    'mock.capacity.foundation.oral.add_phoneme.lock.cat', 'mock.capacity.foundation.oral.add_phoneme.pot.sun',
    'mock.capacity.foundation.oral.add_phoneme.mile.sun',
  ].sort());
});

test('only the 40 reviewed defective V10 null-band aliases are blocked from focused checks', async () => {
  const current = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v10', includeUnavailable: true });
  const byCurrentId = new Map(current.map(q => [q.id, q]));
  const reviews = [...LITERACY_V9_TRANSFORMATION_QUARANTINE, ...LITERACY_V9_LOWER_SOUND_QUARANTINE];
  for (const { id, issue } of reviews) {
    const item = byCurrentId.get(id);
    assert.equal(item.adaptiveAreaBand, null);
    assert.deepEqual(literacyItemQualityIssue(item), issue);
    assert.equal(isEligibleLiteracyResponse(response(item, false)), false);
    assert.equal(literacyItemQualityIssue({ ...item.itemSnapshot, contentVersion: 'literacy-mock-v9' }), null);
    assert.equal(literacyItemQualityIssue({ ...item.itemSnapshot, adaptiveAreaBand: undefined }), null);
    const blocked = selectLiteracyMockFreshCheck(current, { sessionId: 'retired-v10', studentId: id,
      focus: literacyMockFocus(item), itemCount: 1, eligibleItemIds: [id] });
    assert.equal(blocked.unavailable, true, id);
  }
  const good = byCurrentId.get('literacy.sound_manipulation.add-s-top');
  assert.equal(good.adaptiveAreaBand, null);
  assert.equal(isLiteracyItemEligible(good), true);
  const available = selectLiteracyMockFreshCheck(current, { sessionId: 'valid-v10', studentId: 'valid-null',
    focus: literacyMockFocus(good), itemCount: 1, eligibleItemIds: [good.id] });
  assert.equal(available.unavailable, false);
  assert.deepEqual(available.plan.itemIds, [good.id]);
});

test('five exact lower-rung single-phoneme shortcuts are contextually unscored and excluded from the new V10 route', () => {
  assert.equal(LITERACY_V9_LOWER_SOUND_QUARANTINE.length, 5);
  for (const proof of LITERACY_V9_REVIEWED_LOWER_SOUND_SHORTCUTS) {
    const item = byId.get(proof.id);
    assert.equal(item.adaptiveAreaBand, proof.band);
    assert.deepEqual(item.choices.map(c => c.label).sort(), [...proof.words].sort());
    const index = proof.position === 'initial' ? 0 : proof.position === 'medial' ? 1 : -1;
    assert.deepEqual(proof.words.filter((_word, i) => proof.phones[i].at(index) === proof.targetPhonemes.at(index)), [proof.answer]);
    assert.equal(literacyItemQualityIssue(item).code, 'single_phoneme_demand_shortcut');
    assert.equal(isEligibleLiteracyResponse(response(item, false)), false);
    assert.equal(literacyMockDemandV10(item), null);
    for (const snapshot of [{ ...item.itemSnapshot, adaptiveAreaVersion: 'areas-v4' },
      { ...item.itemSnapshot, adaptiveAreaBand: String(proof.band) }, { ...item.itemSnapshot, adaptiveAreaBand: proof.band - 1 }]) {
      assert.equal(literacyItemQualityIssue({ questionId: item.id, itemSnapshot: snapshot }), null);
    }
  }
});

test('exact identities require areas-v5 numeric band 5; old V1–V8 classifications and compact IDs stay unchanged', async () => {
  for (const { id, issue } of LITERACY_V9_TRANSFORMATION_QUARANTINE) {
    const item = byId.get(id);
    for (const value of [item, response(item, false), { questionSnapshot: item.itemSnapshot }, { question: item.itemSnapshot }]) assert.deepEqual(literacyItemQualityIssue(value), issue);
    for (const value of [{ id }, { questionId: id }, { ...item.itemSnapshot, adaptiveAreaVersion: 'areas-v4' },
      { ...item.itemSnapshot, adaptiveAreaBand: null }, { ...item.itemSnapshot, adaptiveAreaBand: '5' },
      { ...item.itemSnapshot, id: 'new-v10-corrected-identity', sourceItemId: 'new-v10-corrected-identity' }]) assert.equal(literacyItemQualityIssue(value), null);
  }
  for (let v = 1; v <= 8; v++) {
    const historical = await loadLiteracyMockBank({ contentVersion: `literacy-mock-v${v}`, includeUnavailable: true });
    for (const item of historical.filter(q => LITERACY_V9_TRANSFORMATION_QUARANTINED_ITEM_IDS.includes(q.id))) {
      assert.equal(literacyItemQualityIssue(item), null, `${v}:${item.id}`);
      assert.equal(isEligibleLiteracyResponse(response(item, false)), true);
    }
  }
});

test('affected historical V9 correct and wrong answers become content-invalid/unscored without rewriting the first answer', () => {
  const rows = LITERACY_V9_TRANSFORMATION_QUARANTINE.flatMap(({ id }) => [response(byId.get(id), true), response(byId.get(id), false)]);
  const before = JSON.stringify(rows);
  const report = buildLiteracyMockReport({ ok: true, session: { id: 'quality-review', content_version: 'literacy-mock-v9', mock: { item_count: 67 } },
    members: [{ student_id: 'synthetic', run: { contentVersion: 'literacy-mock-v9', responses: rows, plan: { itemIds: rows.map(q => q.questionId) } } }] },
  { students: [{ id: 'synthetic', name: 'Synthetic learner' }], now: '2026-10-17T02:00:00.000Z' });
  const pupil = report.pupils[0];
  assert.equal(pupil.totals.independent, 0);
  assert.equal(pupil.totals.correct, 0);
  assert.equal(pupil.totals.incorrect, 0);
  assert.equal(pupil.totals.unscored, 70);
  assert.equal(pupil.withdrawnQuestionCount, 35);
  assert.ok(pupil.responses.every(q => q.classification === 'content_invalid' && q.isCorrect === null && q.evidenceType === 'unscored'));
  assert.deepEqual(pupil.responses.map(q => q.originalIsCorrect), rows.map(q => q.isCorrect));
  assert.equal(JSON.stringify(rows), before);
});
