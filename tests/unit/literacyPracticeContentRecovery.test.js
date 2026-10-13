import assert from 'node:assert/strict';
import test from 'node:test';
import { loadLiteracyPracticeBank, presentLiteracyPracticeQuestion } from '../../src/data/literacyPracticeBank.js';
import { repairLiteracyPracticeContent } from '../../src/utils/literacyPracticeContentRecovery.js';
import { literacyQuestionDemand } from '../../src/utils/literacyPracticePlanner.js';
import { isLiteracyItemEligible } from '../../src/policy/literacyItemEligibility.js';

test('saved public cloze tasks are replaced at the same demand before a new response', async () => {
  const bank = (await loadLiteracyPracticeBank()).map(presentLiteracyPracticeQuestion);
  const affected = bank.filter(question => !isLiteracyItemEligible(question));
  assert.equal(affected.length, 2);
  const session = { id: 'saved-ambiguous', skillId: 'all', index: 0, answers: [], questionIds: affected.map(question => question.id),
    responseEpisode: { question: affected[0], phase: 'answer', firstResponse: null } };
  const before = JSON.stringify(session);
  const repaired = repairLiteracyPracticeContent({ session, plan: affected, bank });
  assert.equal(repaired.session.responseEpisode, null);
  assert.equal(repaired.session.contentRepairs.length, 2);
  assert.deepEqual(repaired.session.answers, []);
  for (const [index, question] of repaired.plan.entries()) {
    assert.equal(isLiteracyItemEligible(question), true);
    assert.equal(question.skillId, affected[index].skillId);
    assert.equal(literacyQuestionDemand(question), literacyQuestionDemand(affected[index]));
    assert.equal(question.literacyRouting.reason, 'content_replacement');
  }
  assert.equal(JSON.stringify(session), before);
});

test('committed public responses stay frozen while only future questions are repaired', async () => {
  const bank = (await loadLiteracyPracticeBank()).map(presentLiteracyPracticeQuestion);
  const affected = bank.filter(question => !isLiteracyItemEligible(question));
  const episode = { question: affected[0], phase: 'receipt', firstResponse: { isCorrect: false, question: affected[0] } };
  const session = { id: 'answered-ambiguous', skillId: 'all', index: 0, answers: [false], questionIds: affected.map(question => question.id), responseEpisode: episode };
  const repaired = repairLiteracyPracticeContent({ session, plan: affected, bank });
  assert.equal(repaired.session.responseEpisode, episode);
  assert.equal(repaired.plan[0], affected[0]);
  assert.deepEqual(repaired.session.answers, [false]);
  assert.equal(isLiteracyItemEligible(repaired.plan[1]), true);
  assert.deepEqual(repaired.session.contentRepairs.map(repair => repair.index), [1]);
});
