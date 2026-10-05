import { REEL_READ_CONTENT_VERSION } from '../data/arcadeContentVersions.js';
import { reelReadHookDecision, reelReadTaskDescription, reelReadTripPartsComplete } from './reelReadHookDecision.js';
import { reelReadStars } from './reelReadLevels.js';

export { REEL_READ_CONTENT_VERSION };
export const REEL_READ_CONSTRUCT = 'cued-word-parts-and-meaning';
export const reelReadResponseId = (stage, unit) => `reel-read:${stage}:${unit}`;
export const newReelReadEvidence = () => ({ firstResponses: [], assistedRetries: [], acceptedResponses: [], completions: [], audioReceipts: [] });
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Called at the actual hook contact, before the independent line/tension
// fight. An accepted fish that escapes retains this language decision;
// hooking it again is motor recovery and cannot mint another response.
export function reelReadHookResponse(evidence, level, { stage, selected, acceptedWords = [], landedWords = [], choices,
  source, at, supportReasons = [], receipt = null, cueKind = 'word' }) {
  const decision = reelReadHookDecision(level, selected, acceptedWords, landedWords);
  if (!decision.literacyResponse) return { decision, row: null, evidence };
  const unit = decision.unit, responseId = reelReadResponseId(stage, unit);
  const repeated = evidence.firstResponses.some(row => row.responseId === responseId);
  const matched = receipt && receipt.stage === stage && receipt.round === stage && receipt.word === level.target && receipt.kind === 'target'
    && Number.isFinite(receipt.at) && receipt.at <= at && evidence.audioReceipts.some(row => same(row, receipt)) ? receipt : null;
  const reasons = [...new Set([...supportReasons, ...(repeated ? ['repeat-response'] : [])])];
  const task = reelReadTaskDescription(level);
  const row = { responseId, stage, round: stage, unit, word: level.target, selected, expected: decision.expected,
    choices: choices.map(({ id, word }) => ({ id, word })), correct: decision.correct, source, at,
    points: decision.correct ? 120 : 0, supportReasons: reasons,
    deliveryAtResponse: matched ? 'delivered' : 'pending', deliveryReceipt: matched && structuredClone(matched),
    wordVisible: false, choicesVisible: true, selectedWordVisible: true, cueKind,
    taskMode: task.mode, operation: task.operation, partCategory: task.partCategory,
    practiceOnly: true, construct: REEL_READ_CONSTRUCT,
    independentPartOrMeaningPractice: decision.correct && !repeated && !reasons.length && Boolean(matched) };
  return { decision, row, evidence: { ...evidence,
    firstResponses: repeated ? evidence.firstResponses : [...evidence.firstResponses, row],
    assistedRetries: repeated ? [...evidence.assistedRetries, row] : evidence.assistedRetries,
    acceptedResponses: decision.correct && !evidence.acceptedResponses.some(value => value.responseId === responseId)
      ? [...evidence.acceptedResponses, row] : evidence.acceptedResponses } };
}

export function completeReelReadTrip(evidence, level, stage, acceptedWords, landedWords, supportReasons = [], at = 0) {
  if (evidence.completions.some(row => row.stage === stage) || !reelReadTripPartsComplete(level, acceptedWords, landedWords)) return evidence;
  const rows = evidence.acceptedResponses.filter(row => row.stage === stage).sort((a, b) => a.unit-b.unit);
  if (rows.length !== level.correctWords.length || !same(rows.map(row => row.selected), acceptedWords)) return evidence;
  const task = reelReadTaskDescription(level);
  const mistakes = [...evidence.firstResponses, ...evidence.assistedRetries].filter(row => row.stage === stage && !row.correct).length;
  const gradedMistakes = level.correctWords.length <= 3 ? Math.max(0, mistakes-1) : mistakes;
  const stars = reelReadStars({ correct: acceptedWords.length, total: acceptedWords.length+gradedMistakes, mistakes: gradedMistakes });
  return { ...evidence, completions: [...evidence.completions, { id: `reel-read:${stage}`, stage, round: stage, word: level.target,
    taskMode: task.mode, operation: task.operation, partCategory: task.partCategory,
    acceptedWords: [...acceptedWords], landedWords: [...landedWords], points: rows.reduce((sum, row) => sum+row.points, 0),
    at, stars, bonusPoints: 80+stars*60,
    supportReasons: [...new Set(supportReasons)], supported: supportReasons.length > 0 || rows.some(row => !row.independentPartOrMeaningPractice),
    practiceOnly: true }] };
}

/** Preserve the retained literacy score and small-family first-slip mercy.
 * Landing/re-hooking a previously accepted fish cannot award another 120.
 */
export function reelReadEvidenceScore(evidence) {
  let score = 0;
  const stages = [...new Set([...evidence.firstResponses, ...evidence.assistedRetries].map(row => row.stage))].sort((a,b) => a-b);
  for (const stage of stages) {
    const rows = [...evidence.firstResponses, ...evidence.assistedRetries].filter(row => row.stage === stage).sort((a,b) => a.at-b.at);
    for (const row of rows) score = row.correct ? score+120 : Math.max(0,score-25);
    score += evidence.completions.find(row => row.stage === stage)?.bonusPoints || 0;
  }
  return score;
}
