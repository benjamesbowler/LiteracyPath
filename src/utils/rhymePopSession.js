import { RHYME_POP_CONTENT_VERSION } from '../data/arcadeContentVersions.js';
import { loadLearnGamesProgress, saveLearnGamesProgress } from './learnGamesProgress.js';

export { RHYME_POP_CONTENT_VERSION };
export const RHYME_POP_CONSTRUCT = 'cued-word-rhyme-recognition';
export const rhymeResponseId = (stage, unit) => `rhyme-pop:${stage}:${unit}`;
export const newRhymePopEvidence = () => ({ firstResponses: [], assistedRetries: [], acceptedResponses: [], completions: [], audioReceipts: [] });
const integer = (value, max = 99999) => Number.isInteger(value) && value >= 0 && value <= max;
const support = value => Array.isArray(value) && value.length <= 24 && value.every(reason => typeof reason === 'string' && reason.length > 0 && reason.length <= 100);
const localAudio = src => typeof src === 'string' && /^\/(audio|media|guided-reading)\//.test(src) && src.endsWith('.mp3');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Only a deliberate actual balloon collision calls this. Spent shots, wall
// banks and an intercepted known intended shot are motor outcomes, not errors.
export function rhymePopResponse(evidence, level, { stage, unit, selected, choices, source, at, supportReasons = [], receipt = null, points = 140, cueKind = 'word' }) {
  const responseId = rhymeResponseId(stage, unit), repeated = evidence.firstResponses.some(row => row.responseId === responseId);
  const matched = receipt && receipt.stage === stage && receipt.word === level.targetWord && receipt.kind === 'target'
    && receipt.at <= at && evidence.audioReceipts.some(row => same(row, receipt)) ? receipt : null;
  const reasons = [...new Set([...supportReasons, ...(repeated ? ['repeat-response'] : [])])];
  const correct = level.rhymingWords.includes(selected);
  const row = { responseId, round: stage, stage, unit, word: level.targetWord, selected, expected: [...level.rhymingWords],
    choices: choices.map(({ id, word }) => ({ id, word })), correct, source, at, points: correct ? points : 0,
    supportReasons: reasons, deliveryAtResponse: matched ? 'delivered' : 'pending', deliveryReceipt: matched && structuredClone(matched),
    wordVisible: false, choicesVisible: true, selectedWordVisible: true, cueKind, practiceOnly: true, construct: RHYME_POP_CONSTRUCT,
    independentRhymePractice: correct && !repeated && !reasons.length && Boolean(matched) };
  return { row, evidence: { ...evidence,
    firstResponses: repeated ? evidence.firstResponses : [...evidence.firstResponses, row],
    assistedRetries: repeated ? [...evidence.assistedRetries, row] : evidence.assistedRetries,
    acceptedResponses: correct && !evidence.acceptedResponses.some(value => value.responseId === responseId) ? [...evidence.acceptedResponses, row] : evidence.acceptedResponses } };
}

export function completeRhymePopFamily(evidence, level, stage, supportReasons = []) {
  if (evidence.completions.some(row => row.stage === stage)) return evidence;
  const accepted = level.rhymingWords.map((_, unit) => evidence.acceptedResponses.find(row => row.responseId === rhymeResponseId(stage, unit)));
  if (accepted.some(row => !row) || new Set(accepted.map(row => row.selected)).size !== level.rhymingWords.length) return evidence;
  return { ...evidence, completions: [...evidence.completions, { id: `rhyme-pop:${stage}`, round: stage, stage, word: level.targetWord,
    acceptedWords: accepted.map(row => row.selected), points: accepted.reduce((sum, row) => sum + row.points, 0),
    supportReasons: [...new Set(supportReasons)], supported: supportReasons.length > 0 || accepted.some(row => !row.independentRhymePractice), practiceOnly: true }] };
}

export function validateRhymePopSession(value, { seed, stage, journeyIndex = 0, ladder }) {
  const level = ladder[stage];
  if (!level || !Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff || !integer(journeyIndex, 11)
    || !value || value.version !== RHYME_POP_CONTENT_VERSION || value.seed !== seed || value.stage !== stage || value.journeyIndex !== journeyIndex
    || value.word !== level.targetWord || !integer(value.originStage, stage) || !integer(value.score, 60000) || !integer(value.mistakes)
    || !integer(value.hintMistakes) || !support(value.supportReasons) || !Number.isFinite(value.elapsed) || value.elapsed < 0 || value.elapsed > 86400
    || typeof value.celebrating !== 'boolean' || !integer(value.nextId) || value.nextId < 1
    || !Array.isArray(value.acceptedWords) || value.acceptedWords.length > level.rhymingWords.length
    || new Set(value.acceptedWords).size !== value.acceptedWords.length || value.acceptedWords.some(word => !level.rhymingWords.includes(word))
    || value.celebrating !== (value.acceptedWords.length === level.rhymingWords.length)) return null;
  const evidence = value.evidence;
  if (!evidence || ['firstResponses', 'assistedRetries', 'acceptedResponses', 'completions', 'audioReceipts'].some(key => !Array.isArray(evidence[key]) || evidence[key].length > 5000)) return null;
  const validReceipt = row => row && integer(row.stage, stage) && row.stage >= value.originStage && ['target', 'candidate'].includes(row.kind)
    && (row.kind !== 'target' || ladder[row.stage]?.targetWord === row.word) && localAudio(row.src) && Number.isFinite(row.at) && row.at >= 0 && row.at <= value.elapsed;
  if (!evidence.audioReceipts.every(validReceipt)) return null;
  const validRow = row => {
    const target = ladder[row?.stage], receipt = row?.deliveryReceipt;
    return target && integer(row.stage, stage) && row.stage >= value.originStage && row.round === row.stage
      && integer(row.unit, target.rhymingWords.length - 1) && row.responseId === rhymeResponseId(row.stage, row.unit)
      && row.word === target.targetWord && same(row.expected, target.rhymingWords) && [...target.rhymingWords, ...target.distractors].includes(row.selected)
      && row.correct === target.rhymingWords.includes(row.selected) && Number.isFinite(row.at) && row.at >= 0 && row.at <= value.elapsed
      && support(row.supportReasons) && ['pointer', 'keyboard', 'assistive'].includes(row.source)
      && row.wordVisible === false && row.choicesVisible === true && row.selectedWordVisible === true && row.practiceOnly === true && row.construct === RHYME_POP_CONSTRUCT
      && ['word', 'meaning-context'].includes(row.cueKind)
      && Array.isArray(row.choices) && row.choices.length <= target.visibleBalloons && row.choices.some(choice => choice.word === row.selected)
      && row.choices.every(choice => integer(choice.id) && choice.id < value.nextId && [...target.rhymingWords, ...target.distractors].includes(choice.word))
      && typeof row.independentRhymePractice === 'boolean' && ['pending', 'delivered'].includes(row.deliveryAtResponse)
      && (row.correct ? integer(row.points, 260) && row.points >= 140 : row.points === 0)
      && (row.deliveryAtResponse !== 'delivered' || (validReceipt(receipt) && receipt.kind === 'target' && receipt.stage === row.stage && receipt.word === row.word
        && receipt.at <= row.at && evidence.audioReceipts.some(value => same(value, receipt))))
      && (!row.independentRhymePractice || row.correct && row.deliveryAtResponse === 'delivered' && row.supportReasons.length === 0);
  };
  if (!evidence.firstResponses.every(validRow) || !evidence.assistedRetries.every(row => validRow(row) && !row.independentRhymePractice)
    || !evidence.acceptedResponses.every(row => validRow(row) && row.correct)
    || new Set(evidence.firstResponses.map(row => row.responseId)).size !== evidence.firstResponses.length
    || new Set(evidence.acceptedResponses.map(row => row.responseId)).size !== evidence.acceptedResponses.length
    || evidence.assistedRetries.some(row => !evidence.firstResponses.some(first => first.responseId === row.responseId))
    || evidence.acceptedResponses.some(row => ![...evidence.firstResponses, ...evidence.assistedRetries].some(response => same(response, row)))) return null;
  const accepted = evidence.acceptedResponses.filter(row => row.stage === stage).sort((a, b) => a.unit - b.unit);
  if (!same(accepted.map(row => row.selected), value.acceptedWords)
    || accepted.some((row, unit) => row.unit !== unit)
    || evidence.firstResponses.some(row => row.unit > evidence.acceptedResponses.filter(accepted => accepted.stage === row.stage).length)
    || evidence.acceptedResponses.some(row => evidence.acceptedResponses.some(other => other.stage === row.stage && other.unit !== row.unit && other.selected === row.selected))
    || value.score !== evidence.acceptedResponses.reduce((sum, row) => sum + row.points, 0)
    || value.mistakes !== [...evidence.firstResponses, ...evidence.assistedRetries].filter(row => !row.correct).length
    || value.hintMistakes !== [...evidence.firstResponses, ...evidence.assistedRetries].filter(row => row.stage === stage && !row.correct).length) return null;
  const validCompletion = row => {
    const target = ladder[row?.stage], rows = evidence.acceptedResponses.filter(response => response.stage === row.stage).sort((a, b) => a.unit - b.unit);
    return target && row.id === `rhyme-pop:${row.stage}` && row.round === row.stage && row.word === target.targetWord
      && integer(row.stage, stage) && row.stage >= value.originStage && (row.stage < stage || value.celebrating)
      && rows.length === target.rhymingWords.length && same(row.acceptedWords, rows.map(response => response.selected))
      && row.points === rows.reduce((sum, response) => sum + response.points, 0) && support(row.supportReasons) && row.practiceOnly === true
      && row.supported === (row.supportReasons.length > 0 || rows.some(response => !response.independentRhymePractice));
  };
  if (!evidence.completions.every(validCompletion) || evidence.completions.length !== stage - value.originStage + Number(value.celebrating)
    || evidence.completions.some((row, index) => row.stage !== value.originStage + index)) return null;
  if (!Array.isArray(value.balloons) || value.balloons.length > level.visibleBalloons || new Set(value.balloons.map(row => row.id)).size !== value.balloons.length
    || new Set(value.balloons.map(row => row.word)).size !== value.balloons.length || value.balloons.some(row => !integer(row.id) || row.id >= value.nextId
      || ![...level.rhymingWords, ...level.distractors].includes(row.word) || value.acceptedWords.includes(row.word)
      || row.kind !== (level.rhymingWords.includes(row.word) ? 'rhyme' : 'distractor') || !integer(row.slot, level.visibleBalloons - 1)
      || !Number.isFinite(row.phase) || !Number.isFinite(row.travel) || row.travel < 0 || ![-1, 1].includes(row.direction))) return null;
  return structuredClone(value);
}

export function loadRhymePopSession(scope, difficulty, context) {
  return validateRhymePopSession(loadLearnGamesProgress(scope).games['rhyme-pop']?.practiceSession?.[difficulty], context);
}
export function saveRhymePopSession(scope, difficulty, state) {
  const current = loadLearnGamesProgress(scope), prior = current.games['rhyme-pop'] || {};
  const next = { ...current, games: { ...current.games, 'rhyme-pop': { ...prior, practiceSession: { ...(prior.practiceSession || {}),
    [difficulty]: { ...state, version: RHYME_POP_CONTENT_VERSION, checkpointSemantics: 'active-question-index' } } } } };
  try { saveLearnGamesProgress(scope, next); return { localSaved: true }; }
  catch (error) { return { localSaved: Boolean(error.savedProgress) }; }
}
