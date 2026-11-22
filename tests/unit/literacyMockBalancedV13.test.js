import assert from 'node:assert/strict';
import test from 'node:test';
import { loadLiteracyMockRuntimeBank } from '../../src/data/literacyMockRuntimeBank.js';
import { LITERACY_MOCK_AREA_ORDER } from '../../src/policy/literacyMockAdaptivePolicy.js';
import { literacyMockBoundaryState } from '../../src/policy/literacyMockBoundaryPolicy.js';
import { LITERACY_MOCK_BALANCED_VERSION as version } from '../../src/policy/literacyMockVersions.js';
import { selectLiteracyMockPlan, adaptLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';
import { buildLiteracyExposureIndex, getLiteracyExposure, literacyPrintLetterTarget } from '../../src/utils/literacyEvidence.js';
import { mockOfflineMediaPaths, mockOfflineMediaAssetLimit } from '../../src/utils/literacyMockOfflineMedia.js';

const bank = await loadLiteracyMockRuntimeBank({ contentVersion:version, mixed:true });
const byId = new Map(bank.map(item => [item.id, item]));
const studentId = 'synthetic';
const session = shift => `20000000-0000-4000-8000-00000000000${shift}`;
const answered = (item, isCorrect, supportUsed = false) => ({
  questionId:item.id, domainId:item.domainId, skillId:item.skillId, itemSnapshot:item.itemSnapshot,
  responseStatus:'answered', evidenceType:supportUsed ? 'supported' : 'independent',
  supportUsed, isCorrect
});

function sit(itemCount, sessionId, outcome, exposures = []) {
  let reserveIds;
  let plan = selectLiteracyMockPlan(bank, { sessionId, studentId, itemCount, exposures, onOfflineItems:ids => { reserveIds = ids; } });
  const reserve = bank.filter(item => reserveIds.includes(item.id));
  const rows = [], traces = Object.fromEntries(LITERACY_MOCK_AREA_ORDER.map(area => [area, []]));
  while (rows.length < plan.itemIds.length) {
    const item = byId.get(plan.itemIds[rows.length]), trace = traces[item.domainId];
    const state = literacyMockBoundaryState(rows, { bank:byId, contentVersion:version })[item.domainId];
    assert.equal(item.adaptiveAreaBand, state.nextBand);
    assert.equal(state.complete, false);
    assert.equal(getLiteracyExposure(item, buildLiteracyExposureIndex({ exposures, responses:rows })).knownFamiliar, null);
    if (trace.length) assert.ok(Math.abs(trace.at(-1) - item.adaptiveAreaBand) <= 1);
    rows.push(answered(item, ...outcome(item, trace.length)));
    trace.push(item.adaptiveAreaBand);
    plan = adaptLiteracyMockPlan(reserve, plan, rows, [], [], { sessionId, itemCount, exposures });
    assert.deepEqual(plan.itemIds.slice(0, rows.length), rows.map(row => row.questionId));
    assert.ok(plan.itemIds.length <= itemCount);
  }
  return { reserve, rows, traces };
}

test('V13 short caps rotate the partial pass and distribute perfect answers evenly', () => {
  for (let shift = 0; shift < LITERACY_MOCK_AREA_ORDER.length; shift++) {
    const sessionId = session(shift);
    const plan = selectLiteracyMockPlan(bank, { sessionId, studentId, itemCount:15 });
    const order = [...LITERACY_MOCK_AREA_ORDER.slice(shift), ...LITERACY_MOCK_AREA_ORDER.slice(0, shift)];
    assert.deepEqual(plan.itemIds.map(id => byId.get(id).domainId), [...order, ...order.slice(0, 7)]);
  }
  for (const cap of [15, 25, 40]) {
    const sample = sit(cap, session(1), () => [true]);
    assert.equal(sample.rows.length, cap);
    const counts = Object.values(sample.traces).map(trace => trace.length);
    assert.equal(Math.min(...counts), Math.floor(cap / 8));
    assert.equal(Math.max(...counts), Math.ceil(cap / 8));
    assert.ok(Object.values(sample.traces).every(trace => trace.slice(0,3).every(value => value === 0)));
    if (cap === 25) assert.deepEqual(Object.entries(sample.traces).filter(([, trace]) => trace.includes(1)).map(([area]) => area), ['phonics']);
    if (cap === 40) assert.ok(Object.values(sample.traces).every(trace => trace.slice(-2).every(value => value === 1)));
    assert.ok(mockOfflineMediaPaths(sample.reserve).length < mockOfflineMediaAssetLimit(version), 'Leaves room for tutorial and read-aloud assets');
  }
});

test('V13 15-question setup ignores unrelated exhausted high demands and reserves only entry tasks', () => {
  const exposures = bank.filter(item => item.adaptiveAreaBand === 5 && item.domainId === 'language');
  const { rows, reserve } = sit(15, session(3), () => [true], exposures);
  assert.equal(rows.length, 15);
  assert.ok(reserve.every(item => item.adaptiveAreaBand === 0));
  assert.ok(reserve.length < 80, `Reserved ${reserve.length} items for the entry-only route`);
});

test('V13 evidence can finish early or concentrate remaining slots in an unresolved area', () => {
  const incorrect = sit(40, session(5), () => [false]);
  assert.equal(incorrect.rows.length, 16);
  const concentrated = sit(25, session(5), item => [item.domainId === 'phonics']);
  assert.deepEqual(concentrated.traces.phonics, [0,0,0,1,1,2,2,3,3,4,4]);
  assert.ok(LITERACY_MOCK_AREA_ORDER.filter(area => area !== 'phonics').every(area => concentrated.traces[area].length === 2));
  const assisted = sit(40, session(2), (_item, index) => [true, index % 3 === 2]);
  assert.ok(Object.values(assisted.traces).every(trace => trace.every(band => band === 0)));
});

test('V13 scored bank supports five fresh 40-question retakes after the practice partition', () => {
  const exposures = [];
  const printLetters = new Set();
  for (let sitting = 0; sitting < 5; sitting++) {
    const { rows, traces } = sit(40, session(sitting), () => [true], exposures);
    assert.deepEqual(traces.print, [0,0,0,1,1]);
    for (const row of rows.filter(value => value.domainId === 'print')) {
      const letter = literacyPrintLetterTarget(byId.get(row.questionId));
      assert.ok(letter && !printLetters.has(letter));
      printLetters.add(letter);
    }
    exposures.push(...rows);
  }
  assert.equal(printLetters.size, 25);
});
