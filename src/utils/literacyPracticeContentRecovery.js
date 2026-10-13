import { literacyItemQualityIssue } from '../policy/literacyItemEligibility.js';
import { selectLiteracyPracticeReplacement } from './literacyPracticePlanner.js';

// Repair only unanswered work. Historical responses and their published keys
// remain intact; the reporting boundary decides whether they are usable.
export function repairLiteracyPracticeContent({ session, plan, bank }) {
  const nextPlan = [...plan];
  const repairs = [];
  const committed = Boolean(session.responseEpisode?.firstResponse);
  const firstPending = session.index + (committed ? 1 : 0);
  for (let index = firstPending; index < nextPlan.length; index++) {
    const question = index === session.index ? session.responseEpisode?.question || nextPlan[index] : nextPlan[index];
    const issue = literacyItemQualityIssue(question);
    if (!issue) continue;
    const replacement = selectLiteracyPracticeReplacement(bank, {
      question, session, plan: nextPlan, seed: `${session.id}:${question.id}:content-repair`,
    });
    if (!replacement) throw new Error('This question needs an update. Your earlier answers are saved. Choose another adventure.');
    nextPlan[index] = { ...replacement, literacyRouting: { ...replacement.literacyRouting, reason: 'content_replacement' } };
    repairs.push({ index, questionId: question.id, replacementQuestionId: replacement.id, reason: issue.code });
  }
  if (!repairs.length) return { session, plan };
  return { session: { ...session, questionIds: nextPlan.map(question => question.id),
    questionSkills: Object.fromEntries(nextPlan.map(question => [question.id, question.skillId])),
    contentRepairs: [...(session.contentRepairs || []), ...repairs],
    ...(repairs.some(repair => repair.index === session.index) ? { responseEpisode: null } : {}),
  }, plan: nextPlan };
}
