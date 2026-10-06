import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLiteracyMockBank, LITERACY_MOCK_TUTORIAL_IDS } from '../../src/data/literacyMockBank.js';
import { selectLiteracyMockPlan, adaptLiteracyMockPlan, replaceFailedLiteracyMockMedia, mockChoices } from '../../src/utils/literacyMockPlanner.js';

const bank = await loadLiteracyMockBank();
const byId = new Map(bank.map(item => [item.id, item]));
const planFor = (studentId = 'student-one', itemCount = 24) => selectLiteracyMockPlan(bank, { sessionId: 'class-session', studentId, itemCount });

test('24 and 43 item forms have all eight areas, paired skills, fresh stimuli, and stable seeds', () => {
  for (const itemCount of [24, 43]) for (let index = 0; index < 20; index += 1) {
    const options = { sessionId: `session-${index}`, studentId: `student-${index}`, itemCount };
    const plan = selectLiteracyMockPlan(bank, options);
    assert.deepEqual(selectLiteracyMockPlan(bank, options), plan);
    const items = plan.itemIds.map(id => byId.get(id));
    assert.equal(items.length, itemCount);
    assert.equal(new Set(plan.itemIds).size, itemCount);
    assert.equal(new Set(items.map(item => item.stimulusKey)).size, itemCount);
    assert.equal(new Set(items.slice(0, 8).map(item => item.domainId)).size, 8);
    assert.ok(items.every(item => item.level === 1 && item.mediaReady));
    const counts = new Map();
    for (const item of items) counts.set(item.skillId, (counts.get(item.skillId) || 0) + 1);
    assert.ok([...counts.values()].filter(count => count === 1).length <= 1);
  }
});

test('a class shares the skill blueprint while learners receive different question examples', () => {
  const first = planFor('first'); const second = planFor('second');
  assert.deepEqual(first.itemIds.map(id => byId.get(id).skillId), second.itemIds.map(id => byId.get(id).skillId));
  assert.notDeepEqual(first.itemIds, second.itemIds);
  assert.notEqual(first.seed, second.seed);
});

test('worked tutorial examples remain available to render but never enter scored plans or adaptations', async () => {
  const all = await loadLiteracyMockBank({ includeUnavailable: true });
  const tutorialStimuli = new Set(all.filter(item => item.tutorialOnly).map(item => item.stimulusKey));
  for (const [format, id] of Object.entries(LITERACY_MOCK_TUTORIAL_IDS)) {
    const item = all.find(value => value.id === id);
    assert.equal(item.format, format);
    assert.equal(item.tutorialOnly, true);
    assert.equal(item.itemSnapshot.tutorialOnly, true);
  }
  for (let index = 0; index < 20; index += 1) {
    const plan = selectLiteracyMockPlan(bank, { sessionId: `tutorial-${index}`, studentId: 'child', itemCount: 43 });
    const response = { questionId: plan.itemIds[0], skillId: byId.get(plan.itemIds[0]).skillId,
      responseStatus: 'answered', evidenceType: 'independent', isCorrect: true };
    for (const id of adaptLiteracyMockPlan(bank, plan, [response]).itemIds) {
      assert.equal(byId.get(id).tutorialOnly, false);
      assert.equal(tutorialStimuli.has(byId.get(id).stimulusKey), false);
    }
  }
});

test('every supported format is sampled when all authored media is available', async () => {
  // Audio-readiness is deliberately supplied as a fixture here. The real loader
  // and canonical manifest independently fail closed until exact clips exist.
  const all = (await loadLiteracyMockBank({ includeUnavailable: true })).map(item => ({ ...item, mediaReady: true }));
  const lookup = new Map(all.map(item => [item.id, item]));
  for (let index = 0; index < 12; index += 1) {
    const plan = selectLiteracyMockPlan(all, { sessionId: `formats-${index}`, studentId: 'child', itemCount: 24 });
    assert.deepEqual(new Set(plan.itemIds.map(id => lookup.get(id).format)), new Set(['choice', 'build_word', 'multi_select', 'order', 'match', 'select_text']));
  }
});

test('only independent same-skill evidence adapts the unanswered suffix', () => {
  const plan = planFor();
  const first = byId.get(plan.itemIds[0]);
  const response = { questionId: first.id, skillId: first.skillId, responseStatus: 'answered', evidenceType: 'independent', isCorrect: true };
  const adapted = adaptLiteracyMockPlan(bank, plan, [response]);
  assert.equal(adapted.seed, plan.seed);
  assert.equal(adapted.itemIds[0], plan.itemIds[0]);
  let changed = 0;
  for (let index = 1; index < plan.itemIds.length; index += 1) {
    const previous = byId.get(plan.itemIds[index]); const next = byId.get(adapted.itemIds[index]);
    assert.equal(next.skillId, previous.skillId);
    assert.equal(next.domainId, previous.domainId);
    if (next.id !== previous.id) { changed += 1; assert.equal(next.skillId, first.skillId); assert.equal(next.level, 2); }
  }
  assert.ok(changed > 0);
  assert.equal(new Set(adapted.itemIds).size, adapted.itemIds.length);
  assert.equal(new Set(adapted.itemIds.map(id => byId.get(id).stimulusKey)).size, adapted.itemIds.length);
  assert.deepEqual(adaptLiteracyMockPlan(bank, plan, [{ ...response, evidenceType: 'supported' }]), plan);
  assert.deepEqual(adaptLiteracyMockPlan(bank, plan, [{ ...response, responseStatus: 'media_failed' }]), plan);
  assert.deepEqual(adaptLiteracyMockPlan(bank, plan, [{ ...response, isCorrect: false }]), plan);
});

test('adaptation freezes the committed prefix, rejects foreign responses and retains the original plan object', () => {
  const plan = planFor(); const original = JSON.stringify(plan);
  const responses = plan.itemIds.slice(0, 8).map(id => {
    const item = byId.get(id);
    return { questionId: id, skillId: item.skillId, responseStatus: 'answered', evidenceType: 'independent', isCorrect: true };
  });
  const next = adaptLiteracyMockPlan(bank, plan, responses);
  assert.deepEqual(next.itemIds.slice(0, 8), plan.itemIds.slice(0, 8));
  assert.equal(JSON.stringify(plan), original);
  assert.throws(() => adaptLiteracyMockPlan(bank, plan, [{ ...responses[0], questionId: 'foreign-item' }]), /history/);
});

test('choice shuffling preserves all IDs and the reading order of selectable text', () => {
  for (const format of ['choice', 'build_word', 'select_text']) {
    const item = bank.find(value => value.format === format);
    const before = JSON.stringify(item.choices);
    const shuffled = mockChoices(item, 'session-child');
    assert.deepEqual(mockChoices(item, 'session-child'), shuffled);
    assert.deepEqual(new Set(shuffled.map(choice => choice.id)), new Set(item.choices.map(choice => choice.id)));
    assert.equal(JSON.stringify(item.choices), before);
    if (format === 'select_text') assert.deepEqual(shuffled, item.choices);
  }
});

test('invalid lengths and missing areas fail visibly without an incomplete mixed form', () => {
  assert.throws(() => selectLiteracyMockPlan(bank, { sessionId: 's', studentId: 'c', itemCount: 6 }), /24 or 43/);
  assert.throws(() => selectLiteracyMockPlan(bank.filter(item => item.domainId !== 'listening'), { sessionId: 's', studentId: 'c' }), /listening/);
});

test('one failed atlas cell replaces every affected unanswered item without consuming a question', () => {
  const plan = planFor('failed-picture', 43);
  const index = plan.itemIds.findIndex(id => byId.get(id).requiredImagePaths.some(path => path.includes('#mock-cell=')));
  assert.ok(index >= 0);
  const responses = plan.itemIds.slice(0, index).map(questionId => ({ questionId }));
  const current = byId.get(plan.itemIds[index]);
  const path = current.requiredImagePaths.find(value => value.includes('#mock-cell='));
  const base = path.split('#')[0];
  const failures = [{ questionId: current.id, failedMediaPaths: [path] }];
  const before = JSON.stringify({ plan, responses, failures });
  const repaired = replaceFailedLiteracyMockMedia(bank, plan, responses, failures);
  assert.equal(repaired.unavailable, false);
  assert.deepEqual(repaired.plan.itemIds.slice(0, index), plan.itemIds.slice(0, index));
  assert.equal(repaired.plan.itemIds.length, 43);
  assert.equal(repaired.plan.seed, plan.seed);
  assert.equal(responses.length, index);
  assert.notEqual(repaired.plan.itemIds[index], current.id);
  assert.equal(new Set(repaired.plan.itemIds).size, 43);
  assert.equal(new Set(repaired.plan.itemIds.map(id => byId.get(id).stimulusKey)).size, 43);
  for (let slot = index; slot < 43; slot += 1) {
    const old = byId.get(plan.itemIds[slot]); const replacement = byId.get(repaired.plan.itemIds[slot]);
    assert.equal(replacement.skillId, old.skillId);
    assert.equal(replacement.domainId, old.domainId);
    assert.equal(replacement.level, old.level);
    assert.equal(replacement.tutorialOnly, false);
    assert.equal(replacement.requiredImagePaths.some(value => value.split('#')[0] === base), false);
    if (!old.requiredImagePaths.some(value => value.split('#')[0] === base)) assert.equal(replacement.id, old.id);
  }
  assert.deepEqual(replaceFailedLiteracyMockMedia(bank, plan, responses, failures), repaired);
  assert.equal(JSON.stringify({ plan, responses, failures }), before);
});

const fixtureItem = (id, overrides = {}) => ({ id, skillId: 'one', domainId: 'phonics', level: 1,
  format: 'choice', mediaReady: true, stimulusKey: id, requiredAudioPaths: [], requiredImagePaths: [], ...overrides });

test('replacement excludes failed IDs and shared audio sources while preserving a completed prefix', () => {
  const items = [
    fixtureItem('done', { requiredAudioPaths: ['/audio/shared.mp3'] }),
    fixtureItem('failed', { requiredAudioPaths: ['/audio/shared.mp3#cue=one'] }),
    fixtureItem('future', { requiredAudioPaths: ['/audio/shared.mp3#cue=two'] }),
    fixtureItem('also-failed'), fixtureItem('safe-one'), fixtureItem('safe-two'),
    fixtureItem('tutorial', { tutorialOnly: true }), fixtureItem('tutorial-copy', { stimulusKey: 'tutorial' }),
  ];
  const plan = { itemIds: ['done', 'failed', 'future'], seed: 'stable' };
  const failures = [{ questionId: 'failed', failedMediaPaths: ['/audio/shared.mp3#another-fragment'] },
    { questionId: 'also-failed', failedMediaPaths: [] }];
  const result = replaceFailedLiteracyMockMedia(items, plan, [{ questionId: 'done' }], failures);
  assert.equal(result.unavailable, false);
  assert.equal(result.plan.itemIds[0], 'done');
  assert.deepEqual(new Set(result.plan.itemIds.slice(1)), new Set(['safe-one', 'safe-two']));
});

test('media replacement solves overlapping stimulus choices instead of stopping at a greedy conflict', () => {
  const items = [fixtureItem('bad-a', { skillId: 'a' }), fixtureItem('bad-b', { skillId: 'b' }),
    fixtureItem('a-shared', { skillId: 'a', stimulusKey: 'shared' }), fixtureItem('a-extra', { skillId: 'a' }),
    fixtureItem('b-shared', { skillId: 'b', stimulusKey: 'shared' })];
  const result = replaceFailedLiteracyMockMedia(items, { itemIds: ['bad-a', 'bad-b'], seed: 'overlap' }, [],
    [{ questionId: 'bad-a', failedMediaPaths: [] }, { questionId: 'bad-b', failedMediaPaths: [] }]);
  assert.equal(result.unavailable, false);
  assert.deepEqual(result.plan.itemIds, ['a-extra', 'b-shared']);
});

test('exhaustion keeps the original full plan and requests an availability state, never a partial refill', () => {
  const items = [fixtureItem('bad-one'), fixtureItem('bad-two'), fixtureItem('only-safe'),
    fixtureItem('wrong-level', { level: 2 }), fixtureItem('wrong-skill', { skillId: 'other' })];
  const plan = { itemIds: ['bad-one', 'bad-two'], seed: 'exhausted' };
  const result = replaceFailedLiteracyMockMedia(items, plan, [],
    [{ questionId: 'bad-one', failedMediaPaths: [] }, { questionId: 'bad-two', failedMediaPaths: [] }]);
  assert.equal(result.unavailable, true);
  assert.equal(result.plan, plan);
  assert.deepEqual(result.plan.itemIds, ['bad-one', 'bad-two']);
  assert.deepEqual(replaceFailedLiteracyMockMedia(items, plan, [], []), { plan, unavailable: false });
  assert.throws(() => replaceFailedLiteracyMockMedia(items, plan, [{ questionId: 'foreign' }], []), /history/);
});

test('adaptive routing cannot reintroduce failed IDs, shared media, or change a blocked slot difficulty', () => {
  const items = [fixtureItem('answered'), fixtureItem('planned'),
    fixtureItem('bad-hard', { level: 2 }), fixtureItem('shared-hard', { level: 2, requiredImagePaths: ['/bad.webp#mock-cell=4'] }),
    fixtureItem('safe-hard', { level: 2 }), fixtureItem('safe-entry')];
  const plan = { itemIds: ['answered', 'planned'], seed: 'adaptive-failure' };
  const responses = [{ questionId: 'answered', skillId: 'one', responseStatus: 'answered', evidenceType: 'independent', isCorrect: true }];
  const failures = [{ questionId: 'bad-hard', failedMediaPaths: ['/bad.webp#mock-cell=0'] }];
  assert.equal(adaptLiteracyMockPlan(items, plan, responses, failures).itemIds[1], 'safe-hard');
  const blocked = [...failures, { questionId: 'planned', failedMediaPaths: [] }];
  assert.deepEqual(adaptLiteracyMockPlan(items, plan, responses, blocked), plan);
  const repaired = replaceFailedLiteracyMockMedia(items, plan, responses, blocked);
  assert.equal(repaired.unavailable, false);
  assert.equal(repaired.plan.itemIds[1], 'safe-entry');
});
