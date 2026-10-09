import { shuffleAnswerPositions } from './answerPositionShuffle.js';
import { learningStimulusSignature } from './learningResponseState.js';
import { LITERACY_PRACTICE_TURNS, LITERACY_FOCUSED_TURNS } from '../policy/literacyPracticePolicy.js';

import { LITERACY_PRACTICE_SKILLS } from '../data/literacyPracticeBank.js';
import referenceDemand from '../content/literacy-reference/routing.generated.json' with { type: 'json' };
// Local task-demand bands route practice; these are not calibrated ability scores.
const ENTRY_SKILLS = new Set(['initial_sounds', 'letter_knowledge']);
const WORD_SKILLS = new Set(['cvc_short_vowels', 'antonyms_synonyms', 'final_sounds', 'rhyming', 'short_vowel_discrimination', 'syllable_awareness']);
export const LITERACY_ADAPTIVE_PLAN_VERSION = 'demand-v2';
export function literacyQuestionDemand(question) {
  if (question.practiceOnly && Number.isInteger(question.practiceDemand) && question.practiceDemand >= 0 && question.practiceDemand <= 4) return question.practiceDemand;
  const domain = question.literacyDomainId || question.domainId;
  const basicSound = (question.skillId || question.id) !== 'initial_sounds' || !question.formatType || question.formatType === 'FIRST_SOUND';
  const base = ENTRY_SKILLS.has(question.skillId || question.id) ? (basicSound ? 0 : 1) : WORD_SKILLS.has(question.skillId || question.id) ? 1
    : ['reading', 'listening'].includes(domain) ? 3 : 2;
  return base + (Number(question.level || 1) === 2 ? 1 : 0);
}
const descriptorsFor = focus => LITERACY_PRACTICE_SKILLS.filter(skill => focus === 'all' || skill.id === focus || skill.domainId === focus);
function bounds(focus, bank = []) {
  const values = descriptorsFor(focus).map(skill => literacyQuestionDemand(skill));
  const authored = bank.filter(item => item.literacyAudioReady !== false && (focus === 'all' || item.skillId === focus || item.literacyDomainId === focus)).map(literacyQuestionDemand);
  return { minimum: Math.min(...values), maximum: Math.max(Math.max(...values) + 1, ...authored) };
}
function responseDemand(session, completed, bank) {
  const { minimum, maximum } = bounds(session.skillId || 'all', bank);
  const previous = session.adaptiveDemand || { tier: minimum, successes: 0 };
  const response = completed?.firstResponse;
  const incorrect = response?.observedCorrect === false || response?.isCorrect === false || response?.responseStatus === 'no_response';
  if (incorrect) return { tier: Math.max(minimum, Math.min(previous.tier, literacyQuestionDemand(completed.firstQuestion)) - 1), successes: 0 };
  const independent = response?.evidenceUse === 'independent_practice_response' && response.isCorrect === true
    && !(session.previousQuestionIds || []).includes(completed.firstQuestion.id);
  if (!independent) return { ...previous, successes: 0 };
  const successes = previous.successes + 1;
  return successes >= 2 ? { tier: Math.min(maximum, previous.tier + 1), successes: 0 } : { ...previous, successes };
}
function counts(prefix) {
  const domains = {}, skills = {};
  for (const item of prefix) {
    const domain = item.literacyDomainId || item.domainId;
    domains[domain] = (domains[domain] || 0) + 1; skills[item.skillId || item.id] = (skills[item.skillId || item.id] || 0) + 1;
  }
  return { domains, skills };
}
function selectAtDemand(bank, { seed, focus, tier, count, previousIds = [], prefix = [], excludedIds = [], excludedStimuli = [], starter = false }) {
  const seen = new Set(previousIds), used = new Set([...excludedIds, ...prefix.map(item => item.id)]);
  const signatures = new Set([...excludedStimuli, ...prefix.map(learningStimulusSignature)]);
  const pool = bank.filter(item => !item.retentionOnly && item.literacyAudioReady !== false && literacyQuestionDemand(item) <= tier
    && (focus === 'all' || item.skillId === focus || item.literacyDomainId === focus));
  const shuffled = shuffleAnswerPositions(pool, `${seed}:demand:${tier}`), selected = [];
  const tally = counts(prefix);
  while (selected.length < count) {
    const candidates = shuffled.filter(item => !used.has(item.id) && !signatures.has(learningStimulusSignature(item))
      && (!starter || selected.length || (item.skillId === 'initial_sounds' && item.formatType === 'FIRST_SOUND' && (item.imagePath || item.imageUrl || item.targetImage))));
    candidates.sort((a,b) => Number(seen.has(a.id)) - Number(seen.has(b.id))
      || Math.abs(tier - literacyQuestionDemand(a)) - Math.abs(tier - literacyQuestionDemand(b))
      || (tally.domains[a.literacyDomainId] || 0) - (tally.domains[b.literacyDomainId] || 0)
      || (tally.skills[a.skillId] || 0) - (tally.skills[b.skillId] || 0));
    const item = candidates[0];
    if (!item) throw new Error('This difficulty needs more available questions. Your answers are kept. Try another area.');
    selected.push(item); used.add(item.id); signatures.add(learningStimulusSignature(item));
    tally.domains[item.literacyDomainId] = (tally.domains[item.literacyDomainId] || 0) + 1;
    tally.skills[item.skillId] = (tally.skills[item.skillId] || 0) + 1;
  }
  return selected;
}
export function selectLiteracyPracticeQuestions(bank, { seed, focus = 'all', previousIds = [], count = focus === 'all' ? LITERACY_PRACTICE_TURNS : LITERACY_FOCUSED_TURNS } = {}) {
  return selectAtDemand(bank, { seed, focus, tier: bounds(focus).minimum, count, previousIds, starter: focus === 'all' });
}
// Fetch only the next skill needed on either response branch, while the current
// question is on screen. The canonical full catalogue remains available to mocks.
export function nextLiteracyPracticeSkills({ session, plan }) {
  const focus = session.skillId || 'all';
  if (focus !== 'all') return [];
  const question = session.responseEpisode?.firstQuestion || plan[session.index];
  if (!question || session.index + 1 >= plan.length) return [];
  const tally = counts(plan.slice(0, session.index + 1));
  return [...new Set([true, false].map(correct => {
    const state = responseDemand(session, { firstQuestion: question, firstResponse: { evidenceUse: 'independent_practice_response', isCorrect: correct, observedCorrect: correct } });
    const candidates = descriptorsFor(focus).map(skill => ({ ...skill,
      minimum: Math.min(literacyQuestionDemand(skill), referenceDemand[skill.id]?.minimum ?? Infinity),
      demand: Math.min(state.tier, Math.max(literacyQuestionDemand(skill) + 1, referenceDemand[skill.id]?.maximum ?? 0)) }))
      .filter(skill => skill.minimum <= state.tier);
    candidates.sort((a,b) => Math.abs(state.tier - a.demand) - Math.abs(state.tier - b.demand)
      || (tally.domains[a.domainId] || 0) - (tally.domains[b.domainId] || 0)
      || (tally.skills[a.id] || 0) - (tally.skills[b.id] || 0));
    return candidates[0]?.id;
  }).filter(Boolean))];
}
export function adaptLiteracyPracticePlan({ completed, session, plan, bank }) {
  const focus = session.skillId || 'all', state = responseDemand(session, completed, bank);
  const prefix = plan.slice(0, session.index);
  const nextPlan = [...prefix, ...selectAtDemand(bank, { seed: `${session.id}:next:${session.index}`, focus, tier: state.tier,
    count: plan.length - session.index, previousIds: session.previousQuestionIds, prefix,
    excludedIds: [...(session.usedQuestionIds || []), ...(session.failedQuestionIds || []), ...(completed.responses || []).map(row => row.question.id)],
    excludedStimuli: [...(session.taughtStimuli || []), ...(completed.responses || []).map(row => learningStimulusSignature(row.question))] })];
  const nextSession = { ...session, adaptivePlanVersion: LITERACY_ADAPTIVE_PLAN_VERSION, adaptiveDemand: state,
    questionIds: nextPlan.map(item => item.id), questionSkills: Object.fromEntries(nextPlan.map(item => [item.id, item.skillId])) };
  return { session: nextSession, plan: nextPlan };
}
