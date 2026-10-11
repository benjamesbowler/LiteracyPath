import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLiteracyMockBank, LITERACY_MOCK_TUTORIAL_IDS } from '../../src/data/literacyMockBank.js';
import { selectLiteracyMockPlan, selectLiteracyMockFreshCheck, adaptLiteracyMockPlan, replaceFailedLiteracyMockMedia, mockChoices } from '../../src/utils/literacyMockPlanner.js';
import { literacyMockFocus, sameLiteracyMockTask } from '../../src/utils/literacyMockConditions.js';
import { LITERACY_MOCK_ENTRY_SKILLS } from '../../src/policy/literacyMockBlueprint.js';
import { buildLiteracyExposureIndex, getLiteracyExposure, canonicalLiteracyIdentity } from '../../src/utils/literacyEvidence.js';

const bank = await loadLiteracyMockBank();
const byId = new Map(bank.map(item => [item.id, item]));
const planFor = (studentId = 'student-one', itemCount = 24) => selectLiteracyMockPlan(bank, { sessionId: 'class-session', studentId, itemCount });

test('24 and 43 item forms have all eight areas, confirmation samples, fresh stimuli, and stable seeds', () => {
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
    assert.ok([...counts.values()].every(count => count === 3 || (itemCount === 43 && count === 1)));
    for (const skillId of counts.keys()) {
      const pair = items.filter(item => item.skillId === skillId);
      assert.ok(pair.every(item => sameLiteracyMockTask(pair[0], item, { includeLevel: true })), `${skillId} must retain one exact paired task and access mode.`);
    }
  }
});

test('a class with the same available skills shares the blueprint while learners receive different examples', () => {
  const first = planFor('first'); const second = planFor('second');
  assert.deepEqual(first.itemIds.map(id => byId.get(id).skillId), second.itemIds.map(id => byId.get(id).skillId));
  assert.notDeepEqual(first.itemIds, second.itemIds);
  assert.notEqual(first.seed, second.seed);
});

test('mixed sittings exclude prior canonical items, passages and families and stop at exhaustion', () => {
  const domains = ['sound_awareness', 'phonics', 'print', 'vocabulary', 'listening', 'language', 'reading', 'writing'];
  const items = domains.flatMap(domainId => Array.from({ length: 6 }, (_, index) => ({
    id: `${domainId}-${index}`, domainId, skillId: domainId, level: 1, format: 'choice',
    constructClaim: domainId, modality: 'recognition', mediaReady: true,
    stimulusKey: `${domainId}-stimulus-${index}`, exposureFamilyId: `${domainId}-family-${index}`,
  })));
  const lookup = new Map(items.map(item => [item.id, item]));
  const first = selectLiteracyMockPlan(items, { sessionId: 'first', studentId: 'same-child' });
  const exposures = first.itemIds.map(id => lookup.get(id));
  const second = selectLiteracyMockPlan(items, { sessionId: 'second', studentId: 'same-child', exposures });
  const known = buildLiteracyExposureIndex({ exposures });
  assert.ok(second.itemIds.every(id => !getLiteracyExposure(lookup.get(id), known).knownFamiliar));
  const all = [...exposures, ...second.itemIds.map(id => lookup.get(id))];
  assert.throws(() => selectLiteracyMockPlan(items, { sessionId: 'third', studentId: 'same-child', exposures: all }), /No mock questions cover/);
  const alias = { ...items[0], id: 'new-id', stimulusKey: 'new-stimulus' };
  assert.equal(getLiteracyExposure(alias, buildLiteracyExposureIndex({ exposures: [items[0]] })).knownFamiliar, true);
  assert.equal(new Set(all.map(item => canonicalLiteracyIdentity(item).familyId)).size, 48);
});

test('the reserved third probe returns to entry after a harder error and avoids known replacements', () => {
  const items = [fixtureItem('entry'), fixtureItem('follow-up'), fixtureItem('confirmation'),
    fixtureItem('hard-one', { level: 2 }), fixtureItem('hard-two', { level: 2 }), fixtureItem('new-entry')];
  const plan = { itemIds: ['entry', 'follow-up', 'confirmation'], seed: 'confirmation' };
  const success = { questionId: 'entry', skillId: 'one', responseStatus: 'answered', evidenceType: 'independent', isCorrect: true };
  const harder = adaptLiteracyMockPlan(items, plan, [success]);
  assert.equal(items.find(item => item.id === harder.itemIds[1]).level, 2);
  const error = { ...success, questionId: harder.itemIds[1], isCorrect: false };
  const down = adaptLiteracyMockPlan(items, harder, [success, error], [], [], { exposures: [items[1]] });
  assert.deepEqual(down.itemIds.slice(0, 2), harder.itemIds.slice(0, 2));
  assert.equal(items.find(item => item.id === down.itemIds[2]).level, 1);
  assert.notEqual(down.itemIds[2], items[1].id);
  assert.equal(new Set(down.itemIds).size, 3);
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

test('mechanics diversify valid task choices without selecting the skill blueprint or replacing its coverage', async () => {
  const all = (await loadLiteracyMockBank({ includeUnavailable: true })).map(item => ({ ...item, mediaReady: true }));
  const lookup = new Map(all.map(item => [item.id, item]));
  const observed = new Set();
  for (let index = 0; index < 80; index += 1) {
    const options = { sessionId: `formats-${index}`, studentId: 'child', itemCount: 24 };
    const plan = selectLiteracyMockPlan(all, options);
    const differentMechanics = selectLiteracyMockPlan(all.map(item => ({ ...item, format: 'choice' })), options);
    assert.deepEqual(plan.itemIds.map(id => lookup.get(id).skillId), differentMechanics.itemIds.map(id => lookup.get(id).skillId));
    assert.ok(new Set(plan.itemIds.map(id => lookup.get(id).format)).size >= 2, 'The complete current bank can vary interactions within every sampled skill blueprint.');
    plan.itemIds.forEach(id => observed.add(lookup.get(id).format));
  }
  assert.deepEqual(observed, new Set(['choice', 'build_word', 'multi_select', 'order', 'match', 'select_text']));
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

test('shared atlas failure uses fresh standalone pictures under the same task and access conditions', () => {
  const plan = Array.from({ length: 100 }, (_, index) => selectLiteracyMockPlan(bank, { sessionId: `media-${index}`, studentId: 'failed-picture', itemCount: 43 }))
    .find(candidate => candidate.itemIds.some(id => byId.get(id).requiredImagePaths.some(path => path.includes('#mock-cell='))));
  assert.ok(plan, 'actual bank must offer the scored picture interaction');
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
  assert.notEqual(repaired.plan, plan);
  assert.notEqual(repaired.plan.itemIds[index], current.id);
  assert.deepEqual(repaired.plan.itemIds.slice(0, index), plan.itemIds.slice(0, index));
  assert.equal(repaired.plan.itemIds.length, 43);
  assert.equal(repaired.plan.seed, plan.seed);
  assert.equal(responses.length, index);
  assert.equal(new Set(repaired.plan.itemIds).size, 43);
  assert.equal(new Set(repaired.plan.itemIds.map(id => byId.get(id).stimulusKey)).size, 43);
  for (let slot = index; slot < 43; slot += 1) {
    const old = byId.get(plan.itemIds[slot]); const replacement = byId.get(repaired.plan.itemIds[slot]);
    assert.equal(replacement.skillId, old.skillId);
    assert.equal(replacement.domainId, old.domainId);
    assert.equal(replacement.level, old.level);
    assert.equal(replacement.tutorialOnly, false);
    assert.equal(sameLiteracyMockTask(replacement, old, { includeLevel: true }), true);
    assert.ok(replacement.requiredImagePaths.every(value => value.split('#')[0] !== base), replacement.id);
    if (!old.requiredImagePaths.some(value => value.split('#')[0] === base)) assert.equal(replacement.id, old.id);
  }
  assert.deepEqual(replaceFailedLiteracyMockMedia(bank, plan, responses, failures), repaired);
  assert.equal(JSON.stringify({ plan, responses, failures }), before);
});

test('content blueprint begins with accessible sounds and words, revisits at Q9 and samples every skill across seeds', () => {
  const sampled = new Set();
  for (const itemCount of [24, 43]) for (let seed = 0; seed < 160; seed++) {
    const plan = selectLiteracyMockPlan(bank, { sessionId: `coverage-${seed}`, studentId: 'child', itemCount });
    const items = plan.itemIds.map(id => byId.get(id));
    assert.ok(LITERACY_MOCK_ENTRY_SKILLS.sound_awareness.includes(items[0].skillId));
    assert.ok(LITERACY_MOCK_ENTRY_SKILLS.phonics.includes(items[1].skillId));
    assert.equal(sameLiteracyMockTask(items[0], items[8], { includeLevel: true }), true);
    assert.notEqual(items[0].stimulusKey, items[8].stimulusKey);
    assert.equal(new Set(items.map(item => item.skillId)).size, Math.ceil(itemCount / 3));
    for (const item of items) sampled.add(item.skillId);
  }
  assert.equal(sampled.size, 47);
});

test('difficulty changes preserve exact construct and access and leave unrelated broad-skill tasks alone', () => {
  const items = [fixtureItem('agreement', { constructClaim: 'agreement', modality: 'recognition' }),
    fixtureItem('same-task', { constructClaim: 'agreement', modality: 'recognition' }),
    fixtureItem('detail', { constructClaim: 'detail', modality: 'recognition' }),
    fixtureItem('hard-agreement', { constructClaim: 'agreement', modality: 'recognition', level: 2 }),
    fixtureItem('hard-detail', { constructClaim: 'detail', modality: 'recognition', level: 2 }),
    fixtureItem('spoken-agreement', { constructClaim: 'agreement', modality: 'listening', level: 2 })];
  const plan = { itemIds: ['agreement', 'same-task', 'detail'], seed: 'safe-construct' };
  const response = { questionId: 'agreement', skillId: 'one', evidenceType: 'independent', responseStatus: 'answered', isCorrect: true };
  const adapted = adaptLiteracyMockPlan(items, plan, [response]);
  assert.deepEqual(adapted.itemIds, ['agreement', 'hard-agreement', 'detail']);
  const noLadder = items.filter(item => item.id !== 'hard-agreement');
  assert.deepEqual(adaptLiteracyMockPlan(noLadder, plan, [response]), plan);
});

test('late assistance returns unoffered harder slots to entry while a displayed question stays frozen', () => {
  const items = [fixtureItem('answered'), fixtureItem('hard-current', { level: 2 }), fixtureItem('hard-later', { level: 2 }), fixtureItem('entry-current'), fixtureItem('entry-later')];
  const plan = { itemIds: ['answered', 'hard-current', 'hard-later'], seed: 'late-help' };
  const responses = [{ questionId: 'answered', skillId: 'one', isCorrect: true, evidenceType: 'supported', responseStatus: 'answered', supportUsed: true }];
  const adapted = adaptLiteracyMockPlan(items, plan, responses, [], [{ questionId: 'hard-current' }], { resetUnsupported: true });
  assert.equal(adapted.itemIds[1], 'hard-current');
  assert.equal(items.find(item => item.id === adapted.itemIds[2]).level, 1);
  assert.deepEqual(adaptLiteracyMockPlan(items, plan, responses), plan, 'Legacy contracts retain their previous adaptation semantics.');
});

test('weak, strong and uneven profiles route independently without changing task identity or repeating stimuli', () => {
  for (const profile of ['weak', 'strong', 'uneven']) for (let seed = 0; seed < 12; seed++) {
    let plan = selectLiteracyMockPlan(bank, { sessionId: `profiles-${seed}`, studentId: profile, itemCount: 43 });
    const responses = [];
    for (let index = 0; index < 43; index++) {
      const item = byId.get(plan.itemIds[index]);
      if (profile === 'weak' || (profile === 'uneven' && !['sound_awareness', 'phonics'].includes(item.domainId))) assert.equal(item.level, 1);
      responses.push({ questionId: item.id, skillId: item.skillId, responseStatus: 'answered', evidenceType: 'independent',
        isCorrect: profile === 'strong' || (profile === 'uneven' && ['sound_awareness', 'phonics'].includes(item.domainId)) });
      const next = adaptLiteracyMockPlan(bank, plan, responses);
      for (let slot = 0; slot < next.itemIds.length; slot++) {
        assert.equal(sameLiteracyMockTask(byId.get(plan.itemIds[slot]), byId.get(next.itemIds[slot])), true);
        if (slot <= index) assert.equal(next.itemIds[slot], plan.itemIds[slot]);
      }
      assert.equal(new Set(next.itemIds.map(id => byId.get(id).stimulusKey)).size, 43);
      plan = next;
    }
  }
});

test('fresh check excludes seen items, passages and families and cannot substitute another task, level or access mode', () => {
  const items = [fixtureItem('reference', { constructClaim: 'agreement', modality: 'recognition' }),
    fixtureItem('seen-id', { constructClaim: 'agreement', modality: 'recognition' }),
    fixtureItem('seen-passage', { constructClaim: 'agreement', modality: 'recognition', passage: 'Already read.' }),
    fixtureItem('seen-family', { constructClaim: 'agreement', modality: 'recognition', exposureFamilyId: 'familiar-family' }),
    fixtureItem('other-construct', { constructClaim: 'detail', modality: 'recognition' }),
    fixtureItem('other-level', { constructClaim: 'agreement', modality: 'recognition', level: 2 }),
    fixtureItem('other-access', { constructClaim: 'agreement', modality: 'listening' }),
    fixtureItem('fresh-a', { constructClaim: 'agreement', modality: 'recognition', exposureFamilyId: 'new-family' }),
    fixtureItem('fresh-alias', { constructClaim: 'agreement', modality: 'recognition', exposureFamilyId: 'new-family' }),
    fixtureItem('fresh-b', { constructClaim: 'agreement', modality: 'recognition' })];
  const options = { sessionId: 'fresh', studentId: 'child', reference: items[0], itemCount: 2,
    exposures: [items[1], { exposurePassageKey: 'Already read.' }, { exposureFamilyId: 'familiar-family' }] };
  const result = selectLiteracyMockFreshCheck(items, options);
  assert.equal(result.unavailable, false);
  assert.equal(result.availableCount, 2);
  assert.equal(result.plan.itemIds.length, 2);
  assert.ok(result.plan.itemIds.includes('fresh-b'));
  assert.ok(result.plan.itemIds.some(id => ['fresh-a', 'fresh-alias'].includes(id)));
  assert.deepEqual(selectLiteracyMockFreshCheck(items, options), result);
  assert.equal(selectLiteracyMockFreshCheck(items, { ...options, itemCount: 3 }).plan, null);
  const serverScoped = selectLiteracyMockFreshCheck(items, { sessionId: 'fresh', studentId: 'child', focus: literacyMockFocus(items[0]), itemCount: 1, eligibleItemIds: ['fresh-b'] });
  assert.deepEqual(serverScoped.plan.itemIds, ['fresh-b']);
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


test('crossing passage and family identities retain a viable fresh triple', () => {
  const domains = ['sound_awareness', 'phonics', 'print', 'vocabulary', 'listening', 'language', 'reading', 'writing'];
  const items = domains.flatMap(domainId => [['a','p1','f1'], ['b','p2','f1'], ['c','p1','f2'], ['d','p3','f3']].map(([id, passage, family]) =>
    fixtureItem(`${domainId}-${id}`, { domainId, skillId: domainId, constructClaim: domainId,
      passage: `${domainId}-${passage}`, exposureFamilyId: `${domainId}-${family}` })));
  const plan = selectLiteracyMockPlan(items, { sessionId: 'crossing', studentId: 'child' });
  assert.equal(plan.itemIds.length, 24);
  assert.ok(plan.itemIds.every(id => !id.endsWith('-a')));
  const fresh = selectLiteracyMockFreshCheck(items, { sessionId: 'fresh', studentId: 'child',
    focus: literacyMockFocus(items[0]), itemCount: 3 });
  assert.deepEqual(new Set(fresh.plan.itemIds), new Set(['sound_awareness-b', 'sound_awareness-c', 'sound_awareness-d']));
  const bad = ['bad1', 'bad2', 'bad3'].map(id => fixtureItem(id, { skillId: 'sound_awareness', domainId: 'sound_awareness', constructClaim: 'sound_awareness' }));
  const repair = replaceFailedLiteracyMockMedia([...bad, ...items], { itemIds: bad.map(item => item.id), seed: 'crossing' }, [], bad.map(item => ({ questionId: item.id })));
  assert.deepEqual(new Set(repair.plan.itemIds), new Set(fresh.plan.itemIds));
});

test('impossible late repair groups stop before factorial permutations of earlier groups', () => {
  const bad = Array.from({ length: 24 }, (_, index) => fixtureItem(`bad-${index}`, { skillId: `task-${Math.floor(index / 3)}` }));
  const good = Array.from({ length: 8 }, (_, task) => Array.from({ length: task === 7 ? 20 : 3 }, (_, index) =>
    fixtureItem(`good-${task}-${index}`, { skillId: `task-${task}`, exposureFamilyId: `family-${task}-${task === 7 ? index % 2 : index}` }))).flat();
  const plan = { itemIds: bad.map(item => item.id), seed: 'bounded-repair' };
  const started = performance.now();
  const result = replaceFailedLiteracyMockMedia([...bad, ...good], plan, [], bad.map(item => ({ questionId: item.id })));
  assert.equal(result.unavailable, true);
  assert.equal(result.plan, plan);
  assert.ok(performance.now() - started < 1000, 'bounded repair must not freeze the child screen');
});
