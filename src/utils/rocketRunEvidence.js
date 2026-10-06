import { ROCKET_RUN_CONTENT_VERSION } from '../data/arcadeContentVersions.js';
import { rocketV2WordStartsWithTargetSound } from './rocketRunV2Rounds.js';
import { starRubric } from './starRubric.js';

export { ROCKET_RUN_CONTENT_VERSION };
export const ROCKET_RUN_CONSTRUCT = 'heard-onset-print-word-selection';
export const newRocketRunEvidence = () => ({ firstResponses: [], assistedRetries: [], acceptedResponses: [], completions: [], audioReceipts: [], audioStarts: [] });
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const validEnd = (evidence, receipt, at) => receipt && Number.isFinite(receipt.at) && receipt.at >= 0 && receipt.at <= at
  && typeof receipt.src === 'string' && receipt.src.startsWith('/') && evidence.audioReceipts.some(row => same(row, receipt));

/** Only the actual first craft/printed-carrier contact calls this writer.
 * Missed words, meteors, hearts, rings, lane changes and Retry have no response
 * branch. A returning trial preserves its ID and visible-word support context.
 */
export function rocketRunCatchResponse(evidence, plan, { trialId, caughtIds = [], at, source,
  supportReasons = [], targetReceipt = null, wordReceipt = null, wordStarted = null,
  presentedChoices = [], difficulty = 'easy' }) {
  const trial = plan.choices.find(row => row.id === trialId);
  const shown = presentedChoices.map(row => plan.choices.find(choice => choice.id === row.id && choice.word === row.word)).filter(Boolean);
  if (!trial || caughtIds.includes(trialId) || caughtIds.length >= plan.needed) {
    return { kind: 'no-language-response', row: null, caughtIds: [...caughtIds], evidence };
  }
  if (shown.length !== presentedChoices.length || new Set(shown.map(row => row.id)).size !== shown.length
    || !shown.some(row => row.id === trial.id)) {
    return { kind: 'unpresented-contact', row: null, caughtIds: [...caughtIds], evidence };
  }
  const correct = Boolean(trial.correct) && rocketV2WordStartsWithTargetSound(trial.word, plan.target);
  const unit = caughtIds.length, responseId = `rocket-run:${plan.round}:${unit}`;
  const repeated = evidence.firstResponses.some(row => row.responseId === responseId);
  const target = validEnd(evidence, targetReceipt, at) && targetReceipt.round === plan.round
    && targetReceipt.target === plan.target && targetReceipt.kind === 'target-phoneme' ? targetReceipt : null;
  const modelEnd = validEnd(evidence, wordReceipt, at) && wordReceipt.round === plan.round
    && wordReceipt.trialId === trial.id && wordReceipt.word === trial.word && wordReceipt.kind === 'approach-word' ? wordReceipt : null;
  const modelStart = wordStarted && wordStarted.round === plan.round && wordStarted.trialId === trial.id
    && wordStarted.word === trial.word && typeof wordStarted.src === 'string' && wordStarted.src.startsWith('/')
    && Number.isFinite(wordStarted.at) && wordStarted.at >= 0 && wordStarted.at <= at
    && evidence.audioStarts.some(row => same(row, wordStarted)) ? wordStarted : null;
  const reasons = [...new Set([...supportReasons, ...(repeated ? ['repeat-response'] : []),
    ...(modelEnd || modelStart ? ['spoken-word-model'] : [])])];
  const row = {
    responseId, round: plan.round, unit, trialId: trial.id, targetGrapheme: plan.target,
    word: trial.word, selected: trial.word, correct,
    expected: plan.choices.filter(choice => choice.correct && !caughtIds.includes(choice.id)).map(choice => choice.word),
    // The fixed outing bank also includes carriers that have not approached
    // yet. Only actually painted readable faces belong to this response's
    // presented choices; future words must not be described as visible.
    choices: shown.map(({ id, word }) => ({ id, word })), choicesContext: 'readable-current-carriers', source, at,
    points: correct ? difficulty === 'hard' ? 15 : 10 : 0,
    supportReasons: reasons, targetGraphemeVisible: true, wordVisible: true, selectedWordVisible: true, choicesVisible: true,
    deliveryAtResponse: target ? 'delivered' : 'pending', deliveryReceipt: target && structuredClone(target),
    wordAudioModel: modelEnd ? 'delivered' : modelStart ? 'started' : 'none',
    wordAudioReceipt: modelEnd && structuredClone(modelEnd), wordAudioStart: modelStart && structuredClone(modelStart),
    practiceOnly: true, formalAssessment: false, masteryClaim: false, motorCreatesEvidence: false,
    construct: ROCKET_RUN_CONSTRUCT,
    independentOnsetPractice: correct && Boolean(target) && !repeated && reasons.length === 0,
  };
  return {
    kind: correct ? 'accepted-word' : 'wrong-onset', row,
    caughtIds: correct ? [...caughtIds, trial.id] : [...caughtIds],
    evidence: { ...evidence,
      firstResponses: repeated ? evidence.firstResponses : [...evidence.firstResponses, row],
      assistedRetries: repeated ? [...evidence.assistedRetries, row] : evidence.assistedRetries,
      acceptedResponses: correct ? [...evidence.acceptedResponses, row] : evidence.acceptedResponses },
  };
}

/** The true authored word denominator is unchanged by deaths or catch-up.
 * Completion requires each distinct correct trial and its immutable accepted
 * language row. This cannot be satisfied by looping one word or a motor event.
 */
export function completeRocketRunRound(evidence, plan, caughtIds, at, supportReasons = []) {
  if (evidence.completions.some(row => row.round === plan.round)) return evidence;
  const correctIds = plan.choices.filter(choice => choice.correct).map(choice => choice.id);
  if (caughtIds.length !== plan.needed || new Set(caughtIds).size !== plan.needed
    || !caughtIds.every(id => correctIds.includes(id))) return evidence;
  const rows = evidence.acceptedResponses.filter(row => row.round === plan.round).sort((a, b) => a.unit - b.unit);
  if (rows.length !== plan.needed || !same(rows.map(row => row.trialId), caughtIds)) return evidence;
  const mistakes = [...evidence.firstResponses, ...evidence.assistedRetries].filter(row => row.round === plan.round && !row.correct).length;
  return { ...evidence, completions: [...evidence.completions, {
    id: `rocket-run:${plan.round}`, round: plan.round, targetGrapheme: plan.target,
    caughtIds: [...caughtIds], words: rows.map(row => row.selected), needed: plan.needed,
    points: rows.reduce((sum, row) => sum + row.points, 0), mistakes, at,
    stars: starRubric({ correct: caughtIds.length, total: plan.needed, mistakes }),
    supportReasons: [...new Set(supportReasons)], supported: supportReasons.length > 0 || rows.some(row => !row.independentOnsetPractice),
    practiceOnly: true, formalAssessment: false, masteryClaim: false, motorCreatesEvidence: false,
  }] };
}

export function rocketRunLanguageResult(evidence) {
  const rows = [...evidence.firstResponses, ...evidence.assistedRetries];
  const completed = evidence.completions.reduce((sum, row) => sum + row.needed, 0);
  return {
    correct: evidence.acceptedResponses.length,
    total: completed,
    mistakes: rows.filter(row => !row.correct).length,
    stars: starRubric({ correct: evidence.acceptedResponses.length, total: completed,
      mistakes: rows.filter(row => !row.correct).length }),
    literacyScore: evidence.acceptedResponses.reduce((sum, row) => sum + row.points, 0),
  };
}
