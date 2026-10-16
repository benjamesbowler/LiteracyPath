import test from 'node:test';
import assert from 'node:assert/strict';
import { LITERACY_MOCK_AREA_MAX } from '../../src/policy/literacyMockAdaptivePolicy.js';
import { literacyMockBoundaryStateV9 } from '../../src/policy/literacyMockBoundaryV9.js';
import { selectLiteracyMockBoundaryPlan, adaptLiteracyMockBoundaryPlan, repairLiteracyMockBoundaryPlan } from '../../src/utils/literacyMockBoundaryPlanner.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';

// Routing-only fixtures. Literal V10 content and real retained media have
// separate actual-bank gates; changing a version string is not content proof.
function fixture(contentVersion) {
  return Object.entries(LITERACY_MOCK_AREA_MAX).flatMap(([domainId, maximum]) => Array.from({ length: maximum + 1 }, (_value, adaptiveAreaBand) => {
    const lowerPrint = domainId === 'print' && adaptiveAreaBand <= 1;
    return Array.from({ length: lowerPrint ? 26 : 40 }, (_row, index) => {
      const letter = String.fromCharCode(97 + index), id = `boundary-publication-fixture.${domainId}.${adaptiveAreaBand}.${index}`;
      const item = { id, contentVersion, adaptiveAreaVersion: 'areas-v5', adaptiveAreaBand, adaptiveMixedEligible: true,
        adaptiveDemand: { operation: `fixture-${domainId}-${adaptiveAreaBand}` }, domainId,
        skillId: lowerPrint ? 'letter_knowledge' : `${domainId}-${index % 2}`, level: 1, format: 'choice',
        constructClaim: lowerPrint ? adaptiveAreaBand === 0 ? 'letter_name' : 'letter_case_correspondence' : `fixture-${domainId}-${adaptiveAreaBand}`,
        modality: 'recognition', targetWord: lowerPrint ? letter : '',
        exposureFamilyId: lowerPrint ? `letter-case:${letter}` : id, stimulusKey: lowerPrint ? `letter-case:${letter}` : id,
        choices: [{ id: 'a', label: lowerPrint ? letter : 'A' }, { id: 'b', label: 'B' }], answer: 'a',
        mediaReady: true, requiredAudioPaths: [], requiredImagePaths: [], requiredAudioCues: [] };
      return { ...item, itemSnapshot: { ...item } };
    });
  }).flat());
}
const v9 = fixture('literacy-mock-v9'), v10 = fixture('literacy-mock-v10');
const response = (item, correct, flags = {}) => ({ questionId: item.id, domainId: item.domainId, skillId: item.skillId, level: item.level,
  itemSnapshot: item.itemSnapshot, responseStatus: 'answered', evidenceType: 'independent', isCorrect: correct, ...flags });
const initial = (bank, seed = 'same-boundary-publication-seed') => selectLiteracyMockBoundaryPlan(bank, { sessionId: 'boundary-publication', studentId: 'child', seed });

test('V10 reuses the exact V9 authored-boundary route and minimal plan shape', () => {
  for (const outcome of [() => true, () => false, (_item, areaIndex) => areaIndex > 0, item => item.adaptiveAreaBand <= 2]) {
    let before = initial(v9), after = initial(v10);
    const maps = [v9, v10].map(bank => new Map(bank.map(item => [item.id, item]))), rows = [[], []], counts = {};
    assert.deepEqual(after, before); assert.deepEqual(Object.keys(after).sort(), ['itemIds', 'seed']);
    while (rows[0].length < before.itemIds.length) {
      const item = maps[0].get(before.itemIds[rows[0].length]), areaIndex = counts[item.domainId] || 0;
      counts[item.domainId] = areaIndex + 1; const correct = outcome(item, areaIndex);
      for (let index = 0; index < 2; index++) rows[index].push(response(maps[index].get(item.id), correct));
      before = adaptLiteracyMockBoundaryPlan(v9, before, rows[0]); after = adaptLiteracyMockBoundaryPlan(v10, after, rows[1]);
      assert.deepEqual(after, before);
      assert.deepEqual(literacyMockBoundaryStateV9(rows[1], { bank: maps[1] }), literacyMockBoundaryStateV9(rows[0], { bank: maps[0] }));
    }
    assert.ok(Object.values(literacyMockBoundaryStateV9(rows[1], { bank: maps[1] })).every(state => state.complete));
  }
});

test('V10 support, late help and shown-prefix freezing retain the shared V9 rules', () => {
  const byId = new Map(v10.map(item => [item.id, item]));
  let plan = initial(v10), rows = [];
  while (rows.filter(row => row.domainId === 'sound_awareness').length < 4) {
    const item = byId.get(plan.itemIds[rows.length]); rows.push(response(item, item.domainId !== 'sound_awareness' || item.adaptiveAreaBand === 0));
    plan = adaptLiteracyMockBoundaryPlan(v10, plan, rows);
  }
  assert.equal(literacyMockBoundaryStateV9(rows, { bank: byId }).sound_awareness.stopReason, 'adjacent_boundary');
  const frozen = plan.itemIds[rows.length], shorter = plan.itemIds.length;
  rows = rows.map((row, index) => index === 0 ? { ...row, supportUsed: true } : row);
  const restored = adaptLiteracyMockBoundaryPlan(v10, plan, rows, [], [{ questionId: frozen }]);
  assert.equal(literacyMockBoundaryStateV9(rows, { bank: byId }).sound_awareness.complete, false);
  assert.ok(restored.itemIds.length > shorter); assert.equal(restored.itemIds[rows.length], frozen);
  assert.deepEqual(restored.itemIds.slice(0, rows.length), rows.map(row => row.questionId));
});

test('V10 exact-task media repair stays in its publication and fails safely without unused matching stock', () => {
  const plan = initial(v10), byId = new Map(v10.map(item => [item.id, item])), first = byId.get(plan.itemIds[0]);
  const failures = [{ questionId: first.id, failedMediaPaths: [] }];
  const repaired = repairLiteracyMockBoundaryPlan(v10, plan, [], failures);
  assert.equal(repaired.unavailable, false);
  const replacement = byId.get(repaired.plan.itemIds[0]);
  assert.notEqual(replacement.id, first.id); assert.equal(replacement.contentVersion, 'literacy-mock-v10');
  assert.equal(replacement.adaptiveAreaBand, first.adaptiveAreaBand); assert.equal(replacement.constructClaim, first.constructClaim); assert.equal(replacement.level, first.level);
  const held = repairLiteracyMockBoundaryPlan(plan.itemIds.map(id => byId.get(id)), plan, [], failures);
  assert.equal(held.unavailable, true); assert.deepEqual(held.plan, plan);
});

test('a mixed V9 and V10 publication cannot be selected, adapted or repaired together', () => {
  const mixed = [...v9, ...v10], plan = initial(v10), snapshot = structuredClone(plan);
  assert.throws(() => initial(mixed), /one frozen content publication/);
  assert.throws(() => adaptLiteracyMockBoundaryPlan(mixed, plan), /one frozen content publication/);
  assert.throws(() => repairLiteracyMockBoundaryPlan(mixed, plan, [], [{ questionId: plan.itemIds[0], failedMediaPaths: [] }]), /one frozen content publication/);
  assert.deepEqual(plan, snapshot);
});

test('a V9 task family remains familiar under a new V10 question ID', () => {
  const oldId = initial(v9).itemIds[0], old = v9.find(item => item.id === oldId);
  const current = v10.find(item => item.id === oldId), id = `${oldId}.new-foils`;
  const alias = { ...current, id, itemSnapshot: { ...current.itemSnapshot, id } };
  const history = buildLiteracyExposureIndex({ exposures: [old] });
  assert.equal(getLiteracyExposure(alias, history).knownFamiliar, true);
  const currentBank = v10.map(item => item.id === oldId ? alias : item);
  let reserved = [];
  const plan = selectLiteracyMockBoundaryPlan(currentBank, { sessionId: 'cross-version-history', studentId: 'child', exposures: [old],
    onOfflineItems: ids => { reserved = ids; } });
  assert.ok(!plan.itemIds.includes(id)); assert.ok(!reserved.includes(id));
});
