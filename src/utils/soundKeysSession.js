import { SOUNDKEYS_CONTENT_VERSION } from '../data/arcadeContentVersions.js';
import { loadLearnGamesProgress, saveLearnGamesProgress } from './learnGamesProgress.js';

export { SOUNDKEYS_CONTENT_VERSION };
export const SOUNDKEYS_CONSTRUCT = 'heard-word-ordered-grapheme-encoding';
export function soundKeysResponseId(round, unit) { return `soundkeys:${round}:${unit}`; }
export function newSoundKeysEvidence() {
  return { firstResponses: [], assistedRetries: [], acceptedResponses: [], completions: [], audioReceipts: [] };
}

const validSupport = value => Array.isArray(value) && value.length <= 24
  && value.every(reason => typeof reason === 'string' && reason.length > 0 && reason.length <= 100);
const integer = (value, max = 99999) => Number.isInteger(value) && value >= 0 && value <= max;
const localAudio = src => typeof src === 'string' && /^\/(audio|media|guided-reading)\//.test(src) && src.endsWith('.mp3');

// A committed key is a spelling decision. Musical holds, free play, cancelled
// pointers, undo and MIDI status never call this function.
export function soundKeysResponse(evidence, item, { round, unit, selected, source, at = 0, supportReasons = [], receipt = null }) {
  const responseId = soundKeysResponseId(round, unit);
  const prior = evidence.firstResponses.some(row => row.responseId === responseId);
  const actualReceipt = receipt && receipt.round === round && receipt.word === item.id && receipt.kind === 'target'
    && receipt.at <= at && evidence.audioReceipts.some(value => JSON.stringify(value) === JSON.stringify(receipt)) ? receipt : null;
  const reasons = [...new Set([...supportReasons, ...(prior ? ['repeat-response'] : [])])];
  const row = { responseId, round, unit, word: item.id, expected: item.tokens[unit], selected,
    correct: selected === item.tokens[unit], source, at, supportReasons: reasons,
    deliveryAtResponse: actualReceipt ? 'delivered' : 'pending', deliveryReceipt: actualReceipt && structuredClone(actualReceipt),
    wordVisible: false, choicesVisible: true, practiceOnly: true, construct: SOUNDKEYS_CONSTRUCT,
    independentEncodingPractice: !prior && !reasons.length && Boolean(actualReceipt) && selected === item.tokens[unit] };
  return { row, evidence: { ...evidence,
    firstResponses: prior ? evidence.firstResponses : [...evidence.firstResponses, row],
    assistedRetries: prior ? [...evidence.assistedRetries, row] : evidence.assistedRetries,
    acceptedResponses: row.correct && !evidence.acceptedResponses.some(value => value.responseId === responseId)
      ? [...evidence.acceptedResponses, row] : evidence.acceptedResponses } };
}

export function completeSoundKeysWord(evidence, item, round, supportReasons = []) {
  if (evidence.completions.some(row => row.round === round)) return evidence;
  const accepted = item.tokens.map((_, unit) => evidence.acceptedResponses.find(row => row.responseId === soundKeysResponseId(round, unit)));
  if (accepted.some(row => !row)) return evidence;
  const mistakes = [...evidence.firstResponses, ...evidence.assistedRetries].filter(row => row.round === round && !row.correct).length;
  const reasons = [...new Set(supportReasons)];
  return { ...evidence, completions: [...evidence.completions, { id: `soundkeys:${round}`, round, word: item.id,
    points: Math.max(20, 100 - mistakes * 20), supportReasons: reasons,
    supported: reasons.length > 0 || accepted.some(row => !row.independentEncodingPractice), practiceOnly: true }] };
}

export function validateSoundKeysSession(value, { seed, round, journeyIndex = 0, rounds }) {
  const item = rounds[round];
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff || !integer(journeyIndex, 11)
    || !value || value.version !== SOUNDKEYS_CONTENT_VERSION || value.seed !== seed || value.journeyIndex !== journeyIndex
    || value.round !== round || !item || value.word !== item.id || !Array.isArray(value.prefix)
    || !integer(value.originRound, round)
    || value.prefix.length > item.tokens.length || value.prefix.some((token, unit) => token !== item.tokens[unit])
    || !integer(value.bank, 3) || !['bells', 'reeds'].includes(value.voice) || typeof value.freePlay !== 'boolean'
    || typeof value.celebrating !== 'boolean' || value.celebrating !== (value.prefix.length === item.tokens.length)
    || !integer(value.score, rounds.length * 100) || !integer(value.mistakes) || !integer(value.roundMistakes)
    || !Number.isFinite(value.elapsed) || value.elapsed < 0 || value.elapsed > 86400 || !validSupport(value.supportReasons)) return null;
  const evidence = value.evidence;
  if (!evidence || ['firstResponses', 'assistedRetries', 'acceptedResponses', 'completions', 'audioReceipts']
    .some(key => !Array.isArray(evidence[key]) || evidence[key].length > 5000)) return null;
  const validReceipt = receipt => receipt && integer(receipt.round, round) && receipt.round >= value.originRound && rounds[receipt.round]?.id === receipt.word
    && ['target', 'unit', 'blend'].includes(receipt.kind) && localAudio(receipt.src) && Number.isFinite(receipt.at) && receipt.at >= 0 && receipt.at <= value.elapsed;
  if (!evidence.audioReceipts.every(validReceipt)) return null;
  const validRow = row => {
    const target = rounds[row?.round];
    const receipt = row?.deliveryReceipt;
    return target && integer(row.round, round) && row.round >= value.originRound && integer(row.unit, target.tokens.length - 1)
      && row.responseId === soundKeysResponseId(row.round, row.unit) && row.word === target.id && row.expected === target.tokens[row.unit]
      && typeof row.selected === 'string' && row.selected.length > 0 && row.selected.length <= 4
      && ['computer', 'pointer', 'assistive', 'midi'].includes(row.source) && row.correct === (row.selected === row.expected)
      && Number.isFinite(row.at) && row.at >= 0 && row.at <= value.elapsed && validSupport(row.supportReasons)
      && row.wordVisible === false && row.choicesVisible === true && row.practiceOnly === true && row.construct === SOUNDKEYS_CONSTRUCT
      && typeof row.independentEncodingPractice === 'boolean'
      && ['pending', 'delivered'].includes(row.deliveryAtResponse)
      && (row.deliveryAtResponse !== 'delivered' || (validReceipt(receipt) && receipt.kind === 'target' && receipt.round === row.round
        && receipt.word === row.word && receipt.at <= row.at && evidence.audioReceipts.some(value => JSON.stringify(value) === JSON.stringify(receipt))))
      && (!row.independentEncodingPractice || (row.correct && row.deliveryAtResponse === 'delivered' && row.supportReasons.length === 0));
  };
  if (!evidence.firstResponses.every(validRow) || !evidence.assistedRetries.every(row => validRow(row) && !row.independentEncodingPractice)
    || !evidence.acceptedResponses.every(row => validRow(row) && row.correct)
    || new Set(evidence.firstResponses.map(row => row.responseId)).size !== evidence.firstResponses.length
    || new Set(evidence.acceptedResponses.map(row => row.responseId)).size !== evidence.acceptedResponses.length
    || evidence.assistedRetries.some(row => !evidence.firstResponses.some(first => first.responseId === row.responseId))
    || evidence.acceptedResponses.some(row => ![...evidence.firstResponses, ...evidence.assistedRetries].some(response => JSON.stringify(response) === JSON.stringify(row)))) return null;
  const validCompletion = row => {
    const target = rounds[row?.round];
    const mistakes = [...evidence.firstResponses, ...evidence.assistedRetries].filter(response => response.round === row.round && !response.correct).length;
    return target && integer(row.round, round) && row.round >= value.originRound && row.id === `soundkeys:${row.round}` && row.word === target.id
      && row.points === Math.max(20, 100 - mistakes * 20) && validSupport(row.supportReasons) && typeof row.supported === 'boolean' && row.practiceOnly === true
      && (row.round < round || value.celebrating)
      && target.tokens.every((_, unit) => evidence.acceptedResponses.some(response => response.responseId === soundKeysResponseId(row.round, unit)))
      && row.supported === (row.supportReasons.length > 0 || target.tokens.some((_, unit) => !evidence.acceptedResponses.find(response => response.responseId === soundKeysResponseId(row.round, unit)).independentEncodingPractice));
  };
  if (!evidence.completions.every(validCompletion) || new Set(evidence.completions.map(row => row.id)).size !== evidence.completions.length
    || evidence.completions.length !== round - value.originRound + Number(value.celebrating)
    || evidence.completions.some((row, index) => row.round !== value.originRound + index)
    || value.score !== evidence.completions.reduce((sum, row) => sum + row.points, 0)
    || value.prefix.some((_, unit) => !evidence.acceptedResponses.some(row => row.responseId === soundKeysResponseId(round, unit)))
    || value.mistakes !== [...evidence.firstResponses, ...evidence.assistedRetries].filter(row => !row.correct).length
    || value.roundMistakes !== [...evidence.firstResponses, ...evidence.assistedRetries].filter(row => row.round === round && !row.correct).length) return null;
  return structuredClone(value);
}

export function loadSoundKeysSession(scope, difficulty, context) {
  return validateSoundKeysSession(loadLearnGamesProgress(scope).games.soundkeys?.practiceSession?.[difficulty], context);
}

export function saveSoundKeysSession(scope, difficulty, state) {
  const current = loadLearnGamesProgress(scope), previous = current.games.soundkeys || {};
  const next = { ...current, games: { ...current.games, soundkeys: { ...previous, practiceSession: {
    ...(previous.practiceSession || {}), [difficulty]: { ...state, version: SOUNDKEYS_CONTENT_VERSION, checkpointSemantics: 'active-question-index' }
  } } } };
  try { saveLearnGamesProgress(scope, next); return { localSaved: true }; }
  catch (error) { return { localSaved: Boolean(error.savedProgress) }; }
}
