import { shuffleAnswerPositions } from './answerPositionShuffle.js';
import { learningStimulusSignature } from './learningResponseState.js';
import { isEligibleLiteracyResponse, isKnownLiteracyFamiliar, isValidUnsupportedLiteracyResponse } from './literacyEvidence.js';
import { LITERACY_PRACTICE_TURNS, LITERACY_FOCUSED_TURNS } from '../policy/literacyPracticePolicy.js';
import { LITERACY_PRACTICE_SKILLS } from '../data/literacyPracticeBank.js';
import { excludeFailedAssessmentMediaQuestions } from '../policy/assessmentMediaEvidence.js';
import { literacyQuestionDemand } from '../policy/literacyPracticeRoutingPolicy.js';
import routingInventory from '../data/generated/literacyPracticeRouting.generated.json' with { type: 'json' };

// Authored task demand is local to a strand: a sound error is not reading evidence.
const STRAND_ORDER = ['sound_awareness', 'print', 'phonics', 'vocabulary', 'language', 'writing', 'listening', 'reading'];
const PASSAGE_ENTRY = { reading: ['key_details'], listening: ['listen_key_details', 'listen_sequencing'] };
export const LITERACY_ADAPTIVE_PLAN_VERSION = 'strands-v3';
export const LITERACY_PREPARATION_BANK_LIMIT = 2;
export { literacyQuestionDemand };
const signatureCache = new WeakMap();
function stimulus(item) {
  if (!signatureCache.has(item)) signatureCache.set(item, learningStimulusSignature(item));
  return signatureCache.get(item);
}
const domainOf = item => item.literacyDomainId || item.domainId;
const skillOf = item => item.skillId || item.id;
const descriptorsFor = focus => LITERACY_PRACTICE_SKILLS.filter(skill => focus === 'all' || skill.id === focus || skill.domainId === focus);
const minimumFor = skill => Math.min(literacyQuestionDemand(skill), routingInventory[skill.id]?.minimum ?? Infinity);
function bounds(focus, bank = []) {
  const descriptors = descriptorsFor(focus);
  const items = bank.filter(item => !item.retiredFromNewPractice && item.literacyAudioReady !== false && (focus === 'all' || item.skillId === focus || domainOf(item) === focus));
  const actual = items.map(literacyQuestionDemand);
  // One unusually easy supplemental item must not make a six-turn single-skill
  // plan impossible. Use the smallest authored band with a full distinct set.
  const focusedFloor = [...new Set(actual)].sort((a,b)=>a-b).find(demand => new Set(items.filter(item => literacyQuestionDemand(item) <= demand).map(stimulus)).size >= LITERACY_FOCUSED_TURNS);
  return { minimum: LITERACY_PRACTICE_SKILLS.some(skill => skill.id === focus) ? focusedFloor ?? literacyQuestionDemand(descriptors[0]) : Math.min(...descriptors.map(minimumFor), ...actual),
    maximum: Math.max(...descriptors.map(skill => Math.max(literacyQuestionDemand(skill) + 1, routingInventory[skill.id]?.maximum ?? 0)), ...actual) };
}
function strandState(session, domain, bank = []) {
  const focus = session.skillId || 'all';
  const scopedFocus = descriptorsFor(focus).length === 1 ? focus : domain;
  const range = bounds(scopedFocus, bank);
  const saved = session.adaptiveStrands?.[domain];
  // A legacy global checkpoint belongs only to its active strand. It must not
  // silently raise the unopened strands when an older sitting is resumed.
  const active = session.responseEpisode?.firstQuestion;
  const legacy = !session.adaptiveStrands && session.adaptiveDemand && (focus !== 'all' || domainOf(active || {}) === domain) ? session.adaptiveDemand : null;
  const previous = saved || legacy || {};
  return { tier: Math.max(range.minimum, Math.min(range.maximum, previous.tier ?? range.minimum)),
    successes: previous.successes || 0, canProbe: previous.canProbe === true, ...range };
}
function statesFor(session, bank) {
  return Object.fromEntries([...new Set(descriptorsFor(session.skillId || 'all').map(skill => skill.domainId))]
    .map(domain => [domain, strandState(session, domain, bank)]));
}
function responseStates(session, completed, bank = []) {
  const question = completed?.firstQuestion;
  const states = statesFor({ ...session, responseEpisode: session.responseEpisode || { firstQuestion: question } }, bank);
  const domain = domainOf(question || {});
  if (!states[domain]) return states;
  const previous = states[domain], response = completed?.firstResponse;
  if (response?.conflicted || response?.validity === 'invalid' || response?.mediaReady === false || response?.responseStatus === 'media_failed') {
    states[domain] = { ...previous, successes: 0, canProbe: false };
    return states;
  }
  const incorrect = response?.observedCorrect === false || response?.isCorrect === false || response?.responseStatus === 'no_response';
  if (incorrect) {
    states[domain] = { ...previous, tier: Math.max(previous.minimum, Math.min(previous.tier, literacyQuestionDemand(question)) - 1), successes: 0, canProbe: false };
    return states;
  }
  const familiar = (session.previousQuestionIds || []).includes(question.id) || isKnownLiteracyFamiliar(question) || isKnownLiteracyFamiliar(response);
  const independent = isEligibleLiteracyResponse(response) && response.isCorrect === true && !familiar;
  if (!independent) {
    // Familiar correctness can justify offering a new adjacent probe, not an
    // increase in challenge or a new independent result. Wrong/unsupported work
    // never unlocks a harder task merely because the bank is running short.
    states[domain] = { ...previous, successes: 0, canProbe: familiar && response?.isCorrect === true && isValidUnsupportedLiteracyResponse(response) };
    return states;
  }
  const successes = previous.successes + 1;
  states[domain] = { ...previous, tier: successes >= 2 ? Math.min(previous.maximum, previous.tier + 1) : previous.tier,
    successes: successes >= 2 ? 0 : successes, canProbe: true };
  return states;
}
function counts(prefix) {
  const domains = {}, skills = {}, formats = {};
  for (const item of prefix) {
    const domain = domainOf(item), skill = skillOf(item), format = item.mapInteraction || item.questionType || 'choice';
    domains[domain] = (domains[domain] || 0) + 1; skills[skill] = (skills[skill] || 0) + 1; formats[format] = (formats[format] || 0) + 1;
  }
  return { domains, skills, formats };
}
const words = value => String(value || '').trim().split(/\s+/).filter(Boolean).length;
/** An unopened/struggling passage strand gets concrete short evidence, not a
 * paragraph selected merely because all its authored items share level 1.
 * Explicit single-skill assignments retain that skill's authored entry task. */
export function literacyAccessibleEntry(question, focus, state) {
  if (descriptorsFor(focus).length === 1 || state.tier > state.minimum) return true;
  const domain = domainOf(question);
  if (!PASSAGE_ENTRY[domain]) return true;
  return PASSAGE_ENTRY[domain].includes(question.skillId) && Number(question.level || 1) === 1
    && words(question.passage || question.story || question.sentence) <= (domain === 'reading' ? 12 : 40);
}
function available(bank, { focus, prefix = [], excludedIds = [], excludedStimuli = [] }) {
  const used = new Set([...excludedIds, ...prefix.map(item => item.id)]);
  const signatures = new Set([...excludedStimuli, ...prefix.map(stimulus)]);
  return bank.filter(item => !item.retentionOnly && !item.retiredFromNewPractice && item.literacyAudioReady !== false && !used.has(item.id)
    && !signatures.has(stimulus(item)) && (focus === 'all' || item.skillId === focus || domainOf(item) === focus));
}
function candidateRows(bank, options, states) {
  const seen = new Set(options.previousIds || []);
  const familiar = item => seen.has(item.id) || isKnownLiteracyFamiliar(item);
  const pool = available(bank, options), rows = [];
  for (const [domain, state] of Object.entries(states)) {
    const inStrand = pool.filter(item => domainOf(item) === domain);
    const ordinary = inStrand.filter(item => literacyQuestionDemand(item) <= state.tier && literacyAccessibleEntry(item, options.focus, state));
    const fresh = ordinary.filter(item => !familiar(item));
    // Only consider an adjacent fresh probe after an actual successful response
    // in this strand. Never equate exhaustion, familiarity or age with ability.
    const probe = !fresh.length && state.canProbe ? inStrand.filter(item => !familiar(item)
      && literacyQuestionDemand(item) === state.tier + 1 && literacyQuestionDemand(item) <= state.maximum) : [];
    for (const item of probe.length ? probe : ordinary) {
      rows.push({ item, state, familiar: familiar(item), freshCount: fresh.length, eligibleCount: ordinary.length,
        reason: probe.length ? 'fresh_stock_probe' : !fresh.length ? 'familiar_review' : literacyQuestionDemand(item) < state.tier ? 'lower_demand_fallback' : 'strand_balance' });
    }
  }
  return rows;
}
function compareRows(a, b, tally) {
  const ad = domainOf(a.item), bd = domainOf(b.item);
  return (tally.domains[ad] || 0) - (tally.domains[bd] || 0)
    || STRAND_ORDER.indexOf(ad) - STRAND_ORDER.indexOf(bd)
    || Number(a.familiar) - Number(b.familiar)
    || (tally.skills[skillOf(a.item)] || 0) - (tally.skills[skillOf(b.item)] || 0)
    || Math.abs(a.state.tier - literacyQuestionDemand(a.item)) - Math.abs(b.state.tier - literacyQuestionDemand(b.item))
    || (a.state.tier === a.state.minimum ? words(a.item.passage || a.item.sentence) - words(b.item.passage || b.item.sentence) : 0)
    || (tally.formats[a.item.mapInteraction || a.item.questionType || 'choice'] || 0) - (tally.formats[b.item.mapInteraction || b.item.questionType || 'choice'] || 0);
}
function selectAtDemand(bank, { seed, focus, count, states, previousIds = [], prefix = [], excludedIds = [], excludedStimuli = [], starter = false }) {
  const selected = [], shuffled = shuffleAnswerPositions(bank, `${seed}:strands`);
  while (selected.length < count) {
    const currentPrefix = [...prefix, ...selected], tally = counts(currentPrefix);
    const candidates = candidateRows(shuffled, { focus, previousIds, prefix: currentPrefix, excludedIds, excludedStimuli }, states)
      .filter(({ item }) => !starter || selected.length || (item.skillId === 'initial_sounds' && item.formatType === 'FIRST_SOUND' && (item.imagePath || item.imageUrl || item.targetImage)));
    candidates.sort((a, b) => compareRows(a, b, tally));
    const chosen = candidates[0];
    if (!chosen) throw new Error('There are no more suitable examples at this challenge. Your answers are kept. Choose another area or return for review.');
    const { item, state, reason, freshCount, eligibleCount, familiar } = chosen;
    selected.push({ ...item, literacyRouting: { version: LITERACY_ADAPTIVE_PLAN_VERSION, strand: domainOf(item),
      strandDemand: state.tier, itemDemand: literacyQuestionDemand(item), reason: starter && !selected.length ? 'comfortable_entry' : reason,
      freshEligibleCount: freshCount, eligibleCount, familiar } });
  }
  return selected;
}
export function selectLiteracyPracticeQuestions(bank, { seed, focus = 'all', previousIds = [], count = focus === 'all' ? LITERACY_PRACTICE_TURNS : LITERACY_FOCUSED_TURNS } = {}) {
  return selectAtDemand(bank, { seed, focus, states: statesFor({ skillId: focus }, bank), count, previousIds, starter: focus === 'all' });
}
function preparationCandidates({ session, plan, bank = [], correct, excludedSkillIds = [] }) {
  const focus = session.skillId || 'all';
  const question = session.responseEpisode?.firstQuestion || plan[session.index];
  if (focus !== 'all' || !question || session.index + 1 >= plan.length) return [];
  const prefix = plan.slice(0, session.index + 1), tally = counts(prefix);
  const states = responseStates(session, { firstQuestion: question, firstResponse: { evidenceUse: 'independent_practice_response', isCorrect: correct, observedCorrect: correct } }, bank);
  const options = { focus, previousIds: session.previousQuestionIds, prefix, excludedIds: [...(session.usedQuestionIds || []), ...(session.failedQuestionIds || [])], excludedStimuli: session.taughtStimuli || [] };
  const usableBank = excludeFailedAssessmentMediaQuestions(bank, { failedQuestionIds: session.failedQuestionIds || [], failedSources: session.failedMediaSources || [] });
  const rows = candidateRows(usableBank, options, states);
  return descriptorsFor(focus).flatMap(skill => {
    if (excludedSkillIds.includes(skill.id)) return [];
    const state = states[skill.domainId];
    if (minimumFor(skill) > state.tier + Number(state.canProbe)) return [];
    if (PASSAGE_ENTRY[skill.domainId] && state.tier === state.minimum && !PASSAGE_ENTRY[skill.domainId].includes(skill.id)) return [];
    const loaded = bank.some(item => item.skillId === skill.id);
    const candidates = rows.filter(row => row.item.skillId === skill.id);
    if (loaded && !candidates.some(row => !row.familiar)) return [];
    return [{ skill, loaded, fresh: !loaded || candidates.some(row => !row.familiar) }];
  }).sort((a, b) => (tally.domains[a.skill.domainId] || 0) - (tally.domains[b.skill.domainId] || 0)
    || STRAND_ORDER.indexOf(a.skill.domainId) - STRAND_ORDER.indexOf(b.skill.domainId)
    || (tally.skills[a.skill.id] || 0) - (tally.skills[b.skill.id] || 0)
    || minimumFor(a.skill) - minimumFor(b.skill));
}
/** Prediction is stock-aware when supplied the accumulated bank. Unknown banks
 * are inspected one at a time; an exhausted loaded skill never wins repeatedly. */
export function nextLiteracyPracticeSkills({ session, plan, bank = [], excludedSkillIds = [] }) {
  return [...new Set([true, false].flatMap(correct => preparationCandidates({ session, plan, bank, correct, excludedSkillIds }).slice(0, 1).map(value => value.skill.id)))];
}
export async function prepareLiteracyPracticeBank({ session, plan, bank = [], loadSkill }) {
  const collected = new Map(bank.map(item => [item.id, item]));
  const tried = new Set(), failed = [];
  for (let attempt = 0; attempt < LITERACY_PREPARATION_BANK_LIMIT; attempt++) {
    const current = [...collected.values()];
    const predicted = nextLiteracyPracticeSkills({ session, plan, bank: current, excludedSkillIds: failed });
    const next = predicted.find(id => !tried.has(id) && !current.some(item => item.skillId === id));
    if (!next) break;
    tried.add(next);
    try { for (const item of await loadSkill(next)) collected.set(item.id, item); }
    catch { failed.push(next); /* Required-media/retry flow remains authoritative; preparation is speculative. */ }
  }
  return [...collected.values()];
}
export function adaptLiteracyPracticePlan({ completed, session, plan, bank }) {
  const focus = session.skillId || 'all', states = responseStates(session, completed, bank);
  const prefix = plan.slice(0, session.index);
  const nextPlan = [...prefix, ...selectAtDemand(bank, { seed: `${session.id}:next:${session.index}`, focus, states,
    count: plan.length - session.index, previousIds: session.previousQuestionIds, prefix,
    excludedIds: [...(session.usedQuestionIds || []), ...(session.failedQuestionIds || []), ...(completed.responses || []).map(row => row.question.id)],
    excludedStimuli: [...(session.taughtStimuli || []), ...(completed.responses || []).map(row => stimulus(row.question))] })];
  const activeState = states[domainOf(completed.firstQuestion)] || Object.values(states)[0];
  const routing = nextPlan[session.index]?.literacyRouting;
  const nextSession = { ...session, adaptivePlanVersion: LITERACY_ADAPTIVE_PLAN_VERSION, adaptiveStrands: states,
    // Compatibility for older checkpoints/inspectors; routing uses strands only.
    adaptiveDemand: { tier: activeState.tier, successes: activeState.successes },
    routingNotice: routing?.reason === 'fresh_stock_probe' ? 'A new example checks this area; earlier familiar answers stay separate.'
      : routing?.reason === 'familiar_review' ? 'Reviewing a familiar example. It will stay separate from new evidence.' : '',
    routingTrace: [...(session.routingTrace || []), { index: session.index - 1, questionId: completed.firstQuestion.id,
      ...(completed.firstQuestion.literacyRouting || {}), nextQuestionId: nextPlan[session.index]?.id || null, next: routing || null }],
    questionIds: nextPlan.map(item => item.id), questionSkills: Object.fromEntries(nextPlan.map(item => [item.id, item.skillId])) };
  return { session: nextSession, plan: nextPlan };
}
