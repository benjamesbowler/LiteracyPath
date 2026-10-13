import assert from 'node:assert/strict';
import test from 'node:test';
import { loadLiteracyMockBank, LITERACY_MOCK_SKILLS } from '../../src/data/literacyMockBank.js';
import { loadLiteracyPracticeBank } from '../../src/data/literacyPracticeBank.js';
import { LITERACY_QUARANTINED_ITEM_IDS, literacyItemQualityIssue, isLiteracyItemEligible } from '../../src/policy/literacyItemEligibility.js';
import { literacyMockMixedTaskGroups, selectLiteracyMockFreshCheck, replaceInvalidLiteracyMockContent } from '../../src/utils/literacyMockPlanner.js';
import { literacyMockFocus, sameLiteracyMockTask } from '../../src/utils/literacyMockConditions.js';
import { selectLiteracyPracticeQuestions } from '../../src/utils/literacyPracticePlanner.js';

const bank = await loadLiteracyMockBank();

test('missing legacy item metadata does not invent a content issue or interrupt recovery', () => {
  for (const value of [undefined, null, '', false, 0, {}]) {
    assert.equal(literacyItemQualityIssue(value), null);
    assert.equal(isLiteracyItemEligible(value), true);
  }
});

test('all quarantined spellings reproduce two valid words, with snapshots retained for history', async () => {
  assert.equal(LITERACY_QUARANTINED_ITEM_IDS.length, 20);
  for (const id of LITERACY_QUARANTINED_ITEM_IDS) {
    const item = bank.find(item => item.id === id);
    assert.ok(item, id);
    const before = JSON.stringify(item);
    const issue = literacyItemQualityIssue(item);
    assert.equal(issue.code, 'ambiguous_spelling');
    const blank = item.prompt.match(/([a-z]*_+[a-z_]*)[?.]?$/i)?.[1];
    assert.ok(blank, id);
    const words = item.choices.map(choice => blank.replace(/_+/, choice.label));
    assert.ok(words.includes(issue.target) && words.includes(issue.alternative), id);
    assert.ok(!item.image && !item.passage && !item.renderTargetText, id);
    assert.equal(literacyItemQualityIssue({ questionId: id }).code, issue.code);
    assert.equal(literacyItemQualityIssue({ itemSnapshot: item.itemSnapshot }).code, issue.code);
    assert.equal(JSON.stringify(item), before);
  }
  const practice = await loadLiteracyPracticeBank();
  assert.deepEqual(practice.filter(item => !isLiteracyItemEligible(item)).map(item => item.id).sort(),
    ['lp3.r_controlled_vowels.l1.C.ur.v9', 'lp3.vowel_teams.l1.A.ea.v104'].sort());
  for (const focus of ['r_controlled', 'vowel_teams']) {
    const selected = selectLiteracyPracticeQuestions(practice, { focus, seed: 'quarantine' });
    assert.equal(selected.length, 6);
    assert.ok(selected.every(isLiteracyItemEligible));
  }
});

test('quarantine retains a complete real adaptive ladder for all 47 skills and blocks fresh-check aliases', () => {
  const groups = literacyMockMixedTaskGroups(bank);
  assert.equal(groups.length, 155);
  assert.deepEqual(new Set(groups.map(group => group[0].skillId)), new Set(LITERACY_MOCK_SKILLS.map(skill => skill.id)));
  for (const group of groups) for (const level of [1, 2]) {
    const selected = selectLiteracyMockFreshCheck(bank, { sessionId: 'quality-capacity', studentId: group[0].id,
      focus: { ...literacyMockFocus(group[0]), level }, itemCount: 3 });
    assert.equal(selected.unavailable, false, `${group[0].id}:${level}`);
    assert.ok(selected.plan.itemIds.every(id => isLiteracyItemEligible({ id })));
  }
  const failed = bank.find(item => item.id === 'lp3.r_controlled_vowels.l1.C.ur.v9');
  const blocked = selectLiteracyMockFreshCheck(bank, { sessionId: 'bad-only', studentId: 'child',
    focus: literacyMockFocus(failed), itemCount: 1, eligibleItemIds: [failed.id] });
  assert.equal(blocked.unavailable, true);
});

test('an already presented withdrawn question is replaced at the same demand without creating an answer', () => {
  const failed = bank.find(item => item.id === 'lp3.r_controlled_vowels.l1.C.ur.v9');
  const plan = { seed: 'saved-before-quarantine', itemIds: [failed.id] };
  const presentations = [{ questionId: failed.id, itemSnapshot: failed.itemSnapshot }];
  const saved = JSON.stringify({ plan, presentations });
  const repaired = replaceInvalidLiteracyMockContent(bank, plan, [], [], presentations);
  assert.equal(repaired.unavailable, false);
  const replacement = bank.find(item => item.id === repaired.plan.itemIds[0]);
  assert.ok(isLiteracyItemEligible(replacement));
  assert.ok(sameLiteracyMockTask(replacement, failed, { includeLevel: true }));
  assert.equal(repaired.plan.seed, plan.seed);
  assert.equal(JSON.stringify({ plan, presentations }), saved);
  const committed = [{ questionId: failed.id, itemSnapshot: failed.itemSnapshot, responseStatus: 'answered', isCorrect: false }];
  assert.deepEqual(replaceInvalidLiteracyMockContent(bank, plan, committed, [], presentations).plan, plan,
    'already committed evidence is retained; the reporting overlay owns invalidation');
  const unavailable = replaceInvalidLiteracyMockContent([failed], plan, [], [], presentations);
  assert.equal(unavailable.unavailable, true);
  assert.deepEqual(unavailable.plan, plan);
});
