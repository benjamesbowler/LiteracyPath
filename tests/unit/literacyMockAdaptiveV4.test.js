import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLiteracyMockBank, literacyMockSkillsForVersion } from '../../src/data/literacyMockBank.js';
import { literacyMockMixedTaskGroups, selectLiteracyMockPlan, selectLiteracyMockFreshCheck, adaptLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';
import { literacyMockFocus, sameLiteracyMockTask } from '../../src/utils/literacyMockConditions.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';

const bank = await loadLiteracyMockBank({ includeUnavailable: true, contentVersion: 'literacy-mock-v4' });
const byId = new Map(bank.map(item => [item.id, item]));
const groups = literacyMockMixedTaskGroups(bank);
const response = (item, correct, flags = {}) => ({ questionId: item.id, itemSnapshot: item.itemSnapshot,
  responseStatus: 'answered', evidenceType: 'independent', isCorrect: correct, ...flags });

test('v4 has complete ready adaptive task coverage for every one of the 47 skills', () => {
  assert.ok(bank.every(item => item.contentVersion === 'literacy-mock-v4'));
  assert.deepEqual(bank.filter(item => !item.mediaReady).map(item => item.id), []);
  assert.deepEqual(new Set(groups.map(group => group[0].skillId)), new Set(literacyMockSkillsForVersion('literacy-mock-v4').map(skill => skill.id)));
  for (const group of groups) {
    const reference = group[0];
    for (const level of [1, 2]) {
      const selected = selectLiteracyMockFreshCheck(bank, { sessionId: 'capacity', studentId: reference.id,
        focus: { ...literacyMockFocus(reference), level }, itemCount: 3 });
      assert.equal(selected.unavailable, false, `${reference.skillId}: level ${level}`);
      assert.ok(selected.plan.itemIds.every(id => byId.get(id).adaptiveMixedEligible && byId.get(id).demandCeiling !== 1));
    }
  }
});

test('each eligible exact task moves entry→harder→entry, with task/access and committed answers preserved', () => {
  for (const group of groups) {
    const reference = group[0];
    let plan = selectLiteracyMockFreshCheck(bank, { sessionId: 'route', studentId: reference.id,
      focus: { ...literacyMockFocus(reference), level: 1 }, itemCount: 3 }).plan;
    const original = structuredClone(plan);
    const answers = [];
    for (const [step, correct] of [true, false, true].entries()) {
      const item = byId.get(plan.itemIds[step]);
      assert.equal(item.level, [1, 2, 1][step], `${reference.skillId}:${reference.constructClaim}:${step}`);
      assert.ok(sameLiteracyMockTask(item, reference));
      answers.push(response(item, correct));
      const next = adaptLiteracyMockPlan(bank, plan, answers, [], [], { resetUnsupported: true });
      assert.deepEqual(next.itemIds.slice(0, answers.length), plan.itemIds.slice(0, answers.length));
      assert.equal(next.seed, original.seed);
      assert.ok(next.itemIds.every(id => byId.get(id).adaptiveMixedEligible));
      assert.equal(new Set(next.itemIds.map(id => byId.get(id).exposureFamilyId)).size, 3);
      plan = next;
    }
  }
});

test('supported, familiar and pending answers cannot raise any v4 task', () => {
  for (const group of groups) for (const flags of [{ supportUsed: true }, { knownFamiliar: true }, { supportPending: true }]) {
    const plan = selectLiteracyMockFreshCheck(bank, { sessionId: 'excluded', studentId: group[0].id,
      focus: { ...literacyMockFocus(group[0]), level: 1 }, itemCount: 3 }).plan;
    const next = adaptLiteracyMockPlan(bank, plan, [response(byId.get(plan.itemIds[0]), true, flags)], [], [], { resetUnsupported: true });
    assert.deepEqual(next, plan);
  }
});

test('new 24/43 mixed forms select complete adaptive ladders in all areas and cover all skills across seeds', () => {
  const observed = new Set();
  const tasks = new Set(groups.map(group => JSON.stringify(literacyMockFocus(group[0]))));
  for (const itemCount of [24, 43]) for (let index = 0; index < 128; index++) {
    const options = { sessionId: `v4-${index}`, studentId: 'synthetic', itemCount };
    const plan = selectLiteracyMockPlan(bank, options);
    const items = plan.itemIds.map(id => byId.get(id));
    assert.equal(items.length, itemCount);
    assert.equal(new Set(items.slice(0, 8).map(item => item.domainId)).size, 8);
    assert.equal(new Set(items.map(item => item.exposureFamilyId)).size, itemCount);
    assert.ok(items.every(item => item.level === 1 && item.mediaReady && item.adaptiveMixedEligible
      && item.demandCeiling !== 1 && tasks.has(JSON.stringify(literacyMockFocus(item)))));
    for (const item of items) observed.add(item.skillId);
  }
  assert.deepEqual(observed, new Set(literacyMockSkillsForVersion('literacy-mock-v4').map(skill => skill.id)));
});

test('v4 adaptation and focused checks exclude fixed predecessors even when they share a certified task key', () => {
  const reference = groups[0][0];
  const fixed = { ...reference, id: 'synthetic-fixed', canonicalItemId: 'synthetic-fixed', level: 2,
    canonicalPassageId: 'synthetic-fixed', exposureFamilyId: 'synthetic-fixed', stimulusKey: 'synthetic-fixed', adaptiveMixedEligible: false };
  const augmented = [...bank, fixed];
  const focus = { ...literacyMockFocus(reference), level: 2 };
  const focused = selectLiteracyMockFreshCheck(augmented, { sessionId: 'fixed', studentId: 'synthetic', focus, itemCount: 3, eligibleItemIds: [fixed.id] });
  assert.equal(focused.unavailable, true);
  const initial = selectLiteracyMockPlan(bank, { sessionId: 'fixed', studentId: 'synthetic' });
  const answered = initial.itemIds.slice(0, 8).map(id => response(byId.get(id), true));
  assert.ok(!adaptLiteracyMockPlan(augmented, initial, answered).itemIds.includes(fixed.id));
});

test('known histories reduce v4 eligibility and cannot be offered as unseen questions', () => {
  const initial = selectLiteracyMockPlan(bank, { sessionId: 'history', studentId: 'synthetic' });
  const exposures = initial.itemIds.map(id => byId.get(id));
  const history = buildLiteracyExposureIndex({ exposures });
  const next = selectLiteracyMockPlan(bank, { sessionId: 'new-history', studentId: 'synthetic', exposures });
  assert.ok(next.itemIds.every(id => !getLiteracyExposure(byId.get(id), history).knownFamiliar));
});

test('a second full sitting jointly reserves fresh cross-domain families after an adaptive completed test', () => {
  const exposures = [];
  for (let sitting = 1; sitting <= 2; sitting++) {
    let plan = selectLiteracyMockPlan(bank, { sessionId: `prepared-session-${sitting}`, studentId: 'student-a', itemCount: 43, exposures });
    const prior = buildLiteracyExposureIndex({ exposures });
    const answers = [];
    for (let index = 0; index < 43; index++) {
      const current = byId.get(plan.itemIds[index]);
      assert.notEqual(getLiteracyExposure(current, prior).knownFamiliar, true, current.id);
      answers.push({ ...response(current, true), itemSnapshot: current, skillId: current.skillId, domainId: current.domainId });
      plan = adaptLiteracyMockPlan(bank, plan, answers, [], [], { exposures });
    }
    assert.equal(new Set(answers.map(value => value.questionId)).size, 43);
    assert.equal(new Set(answers.map(value => value.domainId)).size, 8);
    exposures.push(...answers);
  }
});

test('v4 jointly allocates harder follow-ups when one task can consume another task’s only families', async () => {
  const specifications = [['sound_awareness', 'initial_sounds'], ['phonics', 'cvc_short_vowels'],
    ['print', 'letter_case'], ['vocabulary', 'picture_vocabulary'], ['listening', 'listening_details'],
    ['language', 'nouns'], ['reading', 'reading_details'], ['writing', 'capitals']];
  const synthetic = [];
  function add(domainId, skillId, level, index, family) {
    const id = `${skillId}-${level}-${index}`;
    const item = { id, canonicalItemId: id, canonicalPassageId: family, exposureFamilyId: family, stimulusKey: family,
      domainId, skillId, level, constructClaim: skillId, modality: 'recognition', evidenceModality: 'text',
      format: 'choice', answerMode: 'exact', mediaReady: true, adaptiveMixedEligible: true, contentVersion: 'literacy-mock-v4',
      choices: [{ id: 'c0', label: 'x' }, { id: 'c1', label: 'y' }], answer: 'c0' };
    item.itemSnapshot = { ...item };
    synthetic.push(item);
  }
  for (const [domainId, skillId] of specifications) {
    for (let index = 0; index < 3; index++) add(domainId, skillId, 1, index, `${skillId}-entry-${index}`);
    const harder = skillId === 'initial_sounds' ? ['a-own', 'b-own', 'shared-c', 'shared-d', 'shared-e']
      : skillId === 'cvc_short_vowels' ? ['shared-c', 'shared-d', 'shared-e']
        : [0, 1, 2].map(index => `${skillId}-hard-${index}`);
    harder.forEach((family, index) => add(domainId, skillId, 2, index, family));
  }
  const lookup = new Map(synthetic.map(item => [item.id, item]));
  const initial = selectLiteracyMockPlan(synthetic, { sessionId: 's0', studentId: 'p', itemCount: 24 });
  const answers = [response(lookup.get(initial.itemIds[0]), true)];
  const first = adaptLiteracyMockPlan(synthetic, initial, answers);
  answers.push(response(lookup.get(first.itemIds[1]), true));
  const next = adaptLiteracyMockPlan(synthetic, first, answers);
  assert.deepEqual(next.itemIds.slice(0, 2), initial.itemIds.slice(0, 2));
  assert.equal(next.seed, initial.seed);
  assert.equal(new Set(next.itemIds.map(id => lookup.get(id).exposureFamilyId)).size, 24);
  for (const skillId of ['initial_sounds', 'cvc_short_vowels']) {
    const followups = next.itemIds.slice(2).map(id => lookup.get(id)).filter(item => item.skillId === skillId);
    assert.equal(followups.length, 2);
    assert.ok(followups.every(item => item.level === 2), skillId);
  }
  const phonics = next.itemIds.map(id => lookup.get(id)).filter(item => item.skillId === 'cvc_short_vowels' && item.level === 2);
  assert.ok(phonics.every(item => item.exposureFamilyId.startsWith('shared-')));
  const shown = first.itemIds.find(id => lookup.get(id).skillId === 'initial_sounds' && lookup.get(id).level === 2);
  const exposed = synthetic.find(item => ['a-own', 'b-own'].includes(item.exposureFamilyId) && item.id !== shown);
  const frozen = adaptLiteracyMockPlan(synthetic, first, answers, [], [{ questionId: shown }], { exposures: [exposed] });
  assert.equal(frozen.itemIds[first.itemIds.indexOf(shown)], shown);
  assert.ok(!frozen.itemIds.includes(exposed.id));
  assert.ok(frozen.itemIds.slice(2).map(id => lookup.get(id)).filter(item => item.skillId === 'cvc_short_vowels').every(item => item.level === 2));
  const { replaceFailedLiteracyMockMedia } = await import('../../src/utils/literacyMockPlanner.js');
  ['shared-c', 'shared-d', 'shared-e', 'fresh-a'].forEach((family, index) => add('sound_awareness', 'initial_sounds', 1, index + 3, family));
  const repaired = replaceFailedLiteracyMockMedia(synthetic, initial, [], [{ questionId: initial.itemIds[0], failedMediaPaths: [] }], [],
    { exposures: [synthetic.find(item => item.exposureFamilyId === 'shared-d')] });
  assert.equal(repaired.unavailable, false);
  assert.equal(synthetic.find(item => item.id === repaired.plan.itemIds[0]).exposureFamilyId, 'fresh-a');
  assert.deepEqual(repaired.plan.itemIds.slice(1), initial.itemIds.slice(1));
});

test('a 43-question v4 sitting keeps harder families available before a later skill is first offered', () => {
  const specifications = [['sound_awareness', 'initial_sounds'], ['sound_awareness', 'final_sounds'],
    ['phonics', 'cvc_short_vowels'], ['phonics', 'hfw_1_25'], ['print', 'letter_case'],
    ['vocabulary', 'picture_vocabulary'], ['vocabulary', 'word_categories'],
    ['listening', 'listening_details'], ['listening', 'listening_theme'], ['language', 'nouns'], ['language', 'verbs'],
    ['reading', 'reading_details'], ['reading', 'reading_theme'], ['writing', 'capitals'], ['writing', 'punctuation']];
  function build(constrained) {
    return specifications.flatMap(([domainId, skillId]) => [1, 2].flatMap(level => {
      const families = level === 1 ? [0, 1, 2].map(index => `${skillId}-entry-${index}`)
        : skillId === constrained ? ['shared-c', 'shared-d', 'shared-e']
          : ['sound_awareness', 'phonics'].includes(domainId) ? [`${skillId}-own-a`, `${skillId}-own-b`, 'shared-c', 'shared-d', 'shared-e']
            : [`${skillId}-own-a`, `${skillId}-own-b`, `${skillId}-own-c`];
      return families.map((family, index) => {
        const id = `${skillId}-${level}-${index}`;
        const item = { id, canonicalItemId: id, canonicalPassageId: family, exposureFamilyId: family, stimulusKey: family,
          domainId, skillId, level, constructClaim: skillId, modality: 'recognition', evidenceModality: 'text',
          format: 'choice', answerMode: 'exact', mediaReady: true, adaptiveMixedEligible: true, contentVersion: 'literacy-mock-v4',
          choices: [{ id: 'c0', label: 'x' }, { id: 'c1', label: 'y' }], answer: 'c0' };
        item.itemSnapshot = { ...item }; return item;
      });
    }));
  }
  const options = { sessionId: 's2', studentId: 'p', itemCount: 43 };
  const firstBank = build();
  const firstPlan = selectLiteracyMockPlan(firstBank, options);
  const earlyReading = firstBank.find(item => item.id === firstPlan.itemIds[6]).skillId;
  const constrained = earlyReading === 'reading_details' ? 'reading_theme' : 'reading_details';
  const synthetic = build(constrained), lookup = new Map(synthetic.map(item => [item.id, item]));
  let plan = selectLiteracyMockPlan(synthetic, options);
  const answers = [], presentations = [];
  for (let index = 0; index < 22; index++) {
    const item = lookup.get(plan.itemIds[index]);
    presentations.push({ questionId: item.id }); answers.push(response(item, true));
    const next = adaptLiteracyMockPlan(synthetic, plan, answers, [], presentations);
    assert.deepEqual(next.itemIds.slice(0, answers.length), plan.itemIds.slice(0, answers.length));
    plan = next;
    if (item.skillId === constrained) {
      const future = plan.itemIds.slice(index + 1).map(id => lookup.get(id)).filter(candidate => candidate.skillId === constrained);
      assert.equal(future.length, 2); assert.ok(future.every(candidate => candidate.level === 2));
      assert.equal(new Set(plan.itemIds.map(id => lookup.get(id).exposureFamilyId)).size, 43);
      return;
    }
  }
  assert.fail('The later constrained reading task must be offered.');
});
