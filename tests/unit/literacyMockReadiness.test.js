import test from 'node:test';
import assert from 'node:assert/strict';
import { readLiteracyMockReadiness, recordLiteracyMockReadiness, selectLiteracyMockTutorials } from '../../src/utils/literacyMockReadiness.js';
import { clearLearnerAssessmentDrafts } from '../../src/utils/assessmentDraftStorage.js';

function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key), key: index => [...values.keys()][index], get length() { return values.size; } };
}

test('verified controls are learner scoped, expire, and clear with learner drafts', () => {
  const storage = memoryStorage(), now = 100000;
  assert.equal(recordLiteracyMockReadiness('alex', 'order', { storage, now }), true);
  assert.deepEqual(readLiteracyMockReadiness('alex', { storage, now: now + 60000 }), { order: now });
  assert.deepEqual(readLiteracyMockReadiness('bailey', { storage, now }), {});
  assert.deepEqual(readLiteracyMockReadiness('alex', { storage, now: now - 1 }), {});
  assert.deepEqual(readLiteracyMockReadiness('alex', { storage, now: now + 86400000 }), {});
  assert.equal(recordLiteracyMockReadiness('alex', 'answer', { storage, now }), false);
  clearLearnerAssessmentDrafts('alex', storage);
  assert.deepEqual(readLiteracyMockReadiness('alex', { storage, now }), {});
});

test('a fresh check practices only its unverified controls; ordinary mixed forms retain all examples', () => {
  const bank = [{ id: 'order-example', format: 'order', tutorialOnly: true },
    { id: 'match-example', format: 'match', tutorialOnly: true },
    { id: 'build-example', format: 'build_word', tutorialOnly: true },
    { id: 'q1', format: 'order' }, { id: 'q2', format: 'build_word' }, { id: 'q3', format: 'choice' }];
  const ids = { order: 'order-example', match: 'match-example', build_word: 'build-example' };
  const mock = { plan_kind: 'fresh_check', candidate_item_ids: ['q1', 'q2'] };
  assert.deepEqual(selectLiteracyMockTutorials(bank, ids, mock).map(item => item.id), ['order-example', 'build-example']);
  assert.deepEqual(selectLiteracyMockTutorials(bank, ids, mock, { order: 100 }).map(item => item.id), ['build-example']);
  assert.deepEqual(selectLiteracyMockTutorials(bank, ids, { ...mock, candidate_item_ids: ['q3'] }), []);
  assert.equal(selectLiteracyMockTutorials(bank, ids, { plan_kind: 'mixed' }, { order: 100, match: 100, build_word: 100 }).length, 3);
});
