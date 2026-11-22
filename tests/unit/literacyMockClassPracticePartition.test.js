import assert from 'node:assert/strict';
import test from 'node:test';
import { LITERACY_MOCK_CLASS_PRACTICE as practice } from '../../src/data/generated/literacyMockClassPractice.generated.js';
import { LITERACY_MOCK_RUNTIME_V13 as runtime } from '../../src/data/generated/literacyMockRuntimeV13.generated.js';
import { loadLiteracyMockBank, loadLiteracyMockV13Candidates } from '../../src/data/literacyMockBank.js';
import { partitionLiteracyMockV13 } from '../../src/data/literacyMockPracticePartition.js';
import { buildLiteracyExposureIndex, getLiteracyExposure, literacyExposureIdentities } from '../../src/utils/literacyEvidence.js';
import { advanceWholeClassMockSession, createWholeClassMockSession, recordWholeClassMockAttempt, wholeClassMockPool } from '../../src/components/teacher/wholeClassPracticeModel.js';
import { selectLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';

const aliasKeys = item => new Set(literacyExposureIdentities(item).flatMap(identity =>
  Object.entries(identity).filter(([, value]) => value).map(([kind, value]) => `${kind}:${value}`)));

test('class-practice assets and the V13 catalogue are disjoint under every published exposure alias', async () => {
  const [candidates, scored] = await Promise.all([
    loadLiteracyMockV13Candidates(), loadLiteracyMockBank({ contentVersion: 'literacy-mock-v13' }),
  ]);
  const expected = partitionLiteracyMockV13(candidates).practice;
  assert.deepEqual(practice.map(item => item.itemSnapshot), JSON.parse(JSON.stringify(expected.map(item => item.itemSnapshot))));
  const reserved = new Set();
  for (const item of practice) {
    for (const key of aliasKeys(item)) {
      assert.ok(!reserved.has(key), `${item.id} repeats practice alias ${key}`);
      reserved.add(key);
    }
  }
  for (const item of scored.filter(item => !item.tutorialOnly)) {
    for (const key of aliasKeys(item)) assert.ok(!reserved.has(key), `${item.id} repeats practice alias ${key}`);
  }

  // Show the worst case: every class-practice question has already been seen.
  const seen = buildLiteracyExposureIndex({ exposures: practice });
  const byId = new Map(runtime.map(item => [item.id, item]));
  for (const itemCount of [15, 25, 40]) {
    const plan = selectLiteracyMockPlan(runtime, { itemCount, sessionId: `all-practice-seen-${itemCount}`,
      studentId: 'synthetic', exposures: practice });
    assert.equal(plan.itemIds.length, itemCount);
    for (const id of plan.itemIds) assert.equal(getLiteracyExposure(byId.get(id), seen).knownFamiliar, null, id);
  }
});

test('mixed class practice supports each length under correct, incorrect and revealed answers', () => {
  const outcomes = [{ correct: true }, { correct: false }, { revealed: true }];
  for (const count of [15, 25, 40]) for (const [index, outcome] of outcomes.entries()) {
    let session = createWholeClassMockSession(practice, { count, seed: `practice-${count}-${index}` });
    while (!session.exhausted && session.rounds.length < count) {
      session = recordWholeClassMockAttempt(session, session.rounds.length - 1, outcome);
      session = advanceWholeClassMockSession(practice, session);
    }
    assert.equal(session.targetCount, count);
    assert.equal(session.rounds.length, count);
    assert.equal(new Set(session.rounds.map(item => item.id)).size, count);
    assert.equal(new Set(session.rounds.slice(0, 8).map(item => item.domainId)).size, 8);
  }
});

test('a short fixed practice pool returns only the available questions', () => {
  const area = 'vocabulary';
  const band = '4';
  const available = wholeClassMockPool(practice, area, band);
  assert.ok(available.length > 0 && available.length < 15);
  for (const count of [15, 25, 40]) {
    const session = createWholeClassMockSession(practice, { area, band, count, seed: 'fixed-short-pool' });
    assert.equal(session.adaptive, false);
    assert.deepEqual(new Set(session.rounds.map(item => item.id)), new Set(available.map(item => item.id)));
  }
});
