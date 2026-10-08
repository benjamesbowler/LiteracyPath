import { shuffleAnswerPositions } from './answerPositionShuffle.js';
import { learningStimulusSignature, selectFreshLearningTransfer } from './learningResponseState.js';
import { LITERACY_PRACTICE_TURNS, LITERACY_FOCUSED_TURNS, LITERACY_PRACTICE_STARTERS, LITERACY_DOMAINS } from '../policy/literacyPracticePolicy.js';

import { buildLiteracyPracticeReport } from './literacyPracticeReport.js';

const firstResponses = record => buildLiteracyPracticeReport({ practiceRecord: record }).responses
  .filter(step => step.countedIndependent && step.recency === 'recent');
export function literacyStartingLevel(skillId, record) {
  const seen = new Set();
  const rows = firstResponses(record).filter(step => step.skillId === skillId && !seen.has(step.questionId) && seen.add(step.questionId));
  let level = 1, successes = 0;
  for (const row of rows) {
    if (row.isCorrect) { successes++; if (successes >= 2) { level = 2; successes = 0; } }
    else { level = 1; successes = 0; }
  }
  return level;
}
export function selectLiteracyPracticeQuestions(bank, { seed, focus = 'all', previousIds = [], record, count = focus === 'all' ? LITERACY_PRACTICE_TURNS : LITERACY_FOCUSED_TURNS } = {}) {
  const seen = new Set(previousIds), used = new Set(), signatures = new Set();
  const eligible = bank.filter(item => !item.retentionOnly && item.literacyAudioReady !== false && (focus === 'all' || item.skillId === focus || item.literacyDomainId === focus));
  const shuffled = shuffleAnswerPositions(eligible, `${seed}:literacy`);
  const domainCounts = {}, skillCounts = {}, plan = [], reservedTransfers = new Set();
  const startingLevels = Object.fromEntries([...new Set(eligible.map(item => item.skillId))].map(id => [id, literacyStartingLevel(id, record)]));
  const historyCounts = {};
  for (const row of firstResponses(record)) historyCounts[row.skillId] = (historyCounts[row.skillId] || 0) + 1;
  while (plan.length < count) {
    const starter = focus === 'all' ? LITERACY_PRACTICE_STARTERS[plan.length] : null;
    const followup = focus === 'all' && plan.length >= LITERACY_DOMAINS.length && plan.length < LITERACY_DOMAINS.length + LITERACY_PRACTICE_STARTERS.length
      ? LITERACY_PRACTICE_STARTERS[plan.length - LITERACY_DOMAINS.length] : null;
    const candidates = shuffled.filter(item => !used.has(item.id) && !reservedTransfers.has(item.id) && !signatures.has(learningStimulusSignature(item))
      && (!starter || (item.skillId === starter.skillId && Number(item.level) === 1 && item.formatType === starter.formatType && (!starter.itemKey || item.itemKey === starter.itemKey)
        && (!starter.requiresPicture || Boolean(item.imagePath || item.imageUrl || item.targetImage))))
      && (!followup || item.skillId === followup.skillId));
    candidates.sort((a, b) => (domainCounts[a.literacyDomainId] || 0) - (domainCounts[b.literacyDomainId] || 0)
      || (skillCounts[a.skillId] || 0) - (skillCounts[b.skillId] || 0)
      || Math.abs(Number(a.level) - startingLevels[a.skillId]) - Math.abs(Number(b.level) - startingLevels[b.skillId])
      || Number(seen.has(a.id)) - Number(seen.has(b.id))
      || (historyCounts[a.skillId] || 0) - (historyCounts[b.skillId] || 0));
    let choice;
    const transferPool = eligible.filter(candidate => !signatures.has(learningStimulusSignature(candidate)));
    for (const item of candidates) {
      const transfer = selectFreshLearningTransfer(item, transferPool, { excludedIds: [...used, ...reservedTransfers, ...seen] });
      if (transfer) { choice = { item, transfer }; break; }
    }
    if (!choice) break;
    const { item, transfer } = choice;
    reservedTransfers.add(transfer.id); signatures.add(learningStimulusSignature(transfer));
    plan.push(item); used.add(item.id); signatures.add(learningStimulusSignature(item));
    domainCounts[item.literacyDomainId] = (domainCounts[item.literacyDomainId] || 0) + 1;
    skillCounts[item.skillId] = (skillCounts[item.skillId] || 0) + 1;
  }
  if (plan.length !== count) throw new Error('This area needs more available questions. Your saved practice is kept. Choose another area.');
  return plan;
}
export function adaptLiteracyPracticePlan({ completed, session, plan, bank }) {
  const response = completed.firstResponse;
  if ((session.previousQuestionIds || []).includes(completed.firstQuestion?.id) || !response || response.evidenceUse !== 'independent_practice_response' || typeof response.isCorrect !== 'boolean') return { session, plan };
  const skillId = completed.firstQuestion.skillId;
  const previous = session.adaptiveSkills?.[skillId] || { level: Number(completed.firstQuestion.level || 1), successes: 0 };
  const state = response.isCorrect ? { level: 2, successes: previous.successes + 1 } : { level: 1, successes: 0 };
  const nextSession = { ...session, adaptiveSkills: { ...session.adaptiveSkills, [skillId]: state } };
  const nextPlan = [...plan];
  const reserved = new Set([...session.questionIds, ...(session.previousQuestionIds || []), ...(session.usedQuestionIds || []), ...(session.failedQuestionIds || []), ...completed.responses.map(row => row.question.id)]);
  const stimuli = new Set([...plan.map(learningStimulusSignature), ...(session.taughtStimuli || []), ...completed.responses.map(row => learningStimulusSignature(row.question))]);
  for (let index = session.index; index < nextPlan.length; index++) {
    if (nextPlan[index].skillId !== skillId || Number(nextPlan[index].level) === state.level) continue;
    const available = bank.filter(item => !item.retentionOnly && item.literacyAudioReady !== false && !reserved.has(item.id) && !stimuli.has(learningStimulusSignature(item)));
    const replacement = shuffleAnswerPositions(available.filter(item => item.skillId === skillId && Number(item.level) === state.level), `${session.id}:adapt:${index}`)
      .map(item => ({ item, transfer: selectFreshLearningTransfer(item, available, { excludedIds: [...reserved] }) })).find(value => value.transfer);
    if (replacement) {
      nextPlan[index] = replacement.item;
      for (const item of [replacement.item, replacement.transfer]) { reserved.add(item.id); stimuli.add(learningStimulusSignature(item)); }
    }
  }
  nextSession.questionIds = nextPlan.map(item => item.id);
  return { session: nextSession, plan: nextPlan };
}
