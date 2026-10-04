import { SOUND_BEAT_CONTENT_VERSION } from '../data/arcadeContentVersions.js';
import { loadLearnGamesProgress, saveLearnGamesProgress } from './learnGamesProgress.js';

export { SOUND_BEAT_CONTENT_VERSION };

export function soundBeatPhraseId(stage, task) { return `sound-beat:${stage}:${task}`; }
export function soundBeatResponseId(stage, task, beat) { return `${soundBeatPhraseId(stage, task)}:${beat}`; }

export function newSoundBeatEvidence() {
  return { firstResponses: [], assistedRetries: [], acceptedResponses: [], completions: [], audioReceipts: [],
    motorEvents: { wrongPads: 0, eagerTaps: 0, timingMisses: 0, mercyAdvances: 0 } };
}

// A supplied note on a coloured highway is rhythmic segmentation practice.
// Following it cannot establish independent decoding or spelling mastery.
export function soundBeatResponse(evidence, item, { stage, task, beat, lane, deltaMs, quality, at = 0, supportReasons = [], delivery = 'pending', deliveryReceipt = null }) {
  const id = soundBeatResponseId(stage, task, beat);
  const prior = evidence.firstResponses.some(row => row.responseId === id);
  const confirmedDelivery = delivery === 'delivered' && !deliveryReceipt ? 'pending' : delivery;
  const row = { responseId: id, stage, task, beat, expected: item.beats[beat], selectedLane: lane, expectedLane: item.lanes[beat],
    correct: lane === item.lanes[beat] && quality !== 'MISS', deltaMs: Math.round(deltaMs), quality, at,
    supportReasons: [...new Set([...supportReasons, ...(prior ? ['repeat-response'] : [])])],
    deliveryAtResponse: confirmedDelivery, deliveryReceipt: deliveryReceipt && structuredClone(deliveryReceipt), wordVisible: false, noteVisible: true, practiceOnly: true,
    construct: 'recorded-unit-rhythmic-segmentation', independentEncodingPractice: false,
    independentRhythmPractice: !prior && !supportReasons.length && confirmedDelivery === 'delivered' && lane === item.lanes[beat] && quality !== 'MISS' };
  const next = { ...evidence,
    firstResponses: prior ? evidence.firstResponses : [...evidence.firstResponses, row],
    assistedRetries: prior ? [...evidence.assistedRetries, row] : evidence.assistedRetries,
    acceptedResponses: row.correct && !evidence.acceptedResponses.some(value => value.responseId === id)
      ? [...evidence.acceptedResponses, row] : evidence.acceptedResponses };
  return { evidence: next, row };
}

export function validateSoundBeatSession(value, { seed, stage, journeyIndex = 0, ladder }) {
  const current = ladder[stage]?.items[value?.taskIndex];
  const integer = (number, max = 99999) => Number.isInteger(number) && number >= 0 && number <= max;
  if (!value || value.version !== SOUND_BEAT_CONTENT_VERSION || value.seed !== seed || value.journeyIndex !== journeyIndex
    || value.stage !== stage || !current || value.word !== current.word || !['playing', 'blend'].includes(value.phase)
    || !integer(value.beatIndex, current.beats.length) || (value.phase === 'blend') !== (value.beatIndex === current.beats.length)
    || !integer(value.attempts, 4) || !integer(value.mistakes) || !integer(value.correct) || !integer(value.wordsEnded)
    || !integer(value.score) || !integer(value.combo, 999) || typeof value.currentWordClean !== 'boolean'
    || !Number.isFinite(value.roundElapsed) || value.roundElapsed < 0 || value.roundElapsed > 7200
    || !Number.isFinite(value.roundBpm) || value.roundBpm < 82 || value.roundBpm > 135
    || !Number.isFinite(value.roundWindow) || value.roundWindow < 300 || value.roundWindow > 460
    || !Number.isFinite(value.remainingDelay) || value.remainingDelay < 0 || value.remainingDelay > 40
    || !Array.isArray(value.supportReasons) || value.supportReasons.length > 20
    || value.supportReasons.some(reason => typeof reason !== 'string' || reason.length > 100)) return null;
  const evidence = value.evidence;
  if (!evidence || ['firstResponses', 'assistedRetries', 'acceptedResponses', 'completions', 'audioReceipts'].some(key => !Array.isArray(evidence[key]) || evidence[key].length > 5000)) return null;
  const itemFor = row => ladder[row?.stage]?.items[row?.task];
  const notFuture = row => row.stage < stage || (row.stage === stage && row.task <= value.taskIndex);
  const validRow = row => {
    const item = itemFor(row);
    return item && notFuture(row) && integer(row.stage, stage) && integer(row.task, ladder[row.stage].items.length - 1) && integer(row.beat, item.beats.length - 1)
      && row.responseId === soundBeatResponseId(row.stage, row.task, row.beat) && row.expected === item.beats[row.beat]
      && row.expectedLane === item.lanes[row.beat] && integer(row.selectedLane, 3) && Number.isFinite(row.deltaMs) && Number.isFinite(row.at)
      && ['PERFECT', 'GREAT', 'GOOD', 'MISS'].includes(row.quality) && row.correct === (row.selectedLane === row.expectedLane && row.quality !== 'MISS')
      && row.wordVisible === false && row.noteVisible === true && row.practiceOnly === true && row.independentEncodingPractice === false
      && Array.isArray(row.supportReasons) && (!row.independentRhythmPractice || (row.correct && row.deliveryAtResponse === 'delivered' && !row.supportReasons.length))
      && ['pending', 'delivered', 'unavailable'].includes(row.deliveryAtResponse);
  };
  if (!evidence.firstResponses.every(validRow) || !evidence.assistedRetries.every(row => validRow(row) && !row.independentRhythmPractice)
    || !evidence.acceptedResponses.every(row => validRow(row) && row.correct)
    || new Set(evidence.firstResponses.map(row => row.responseId)).size !== evidence.firstResponses.length
    || new Set(evidence.acceptedResponses.map(row => row.responseId)).size !== evidence.acceptedResponses.length) return null;
  const validCompletion = row => {
    const item = itemFor(row);
    return item && row.id === soundBeatPhraseId(row.stage, row.task) && row.word === item.word && typeof row.clean === 'boolean'
      && integer(row.points, 320) && (!row.clean ? row.points === 0 : item.beats.every((_, beat) => evidence.acceptedResponses.some(response => response.responseId === soundBeatResponseId(row.stage, row.task, beat))))
      && (row.stage < stage || (row.stage === stage && row.task < value.taskIndex));
  };
  if (!evidence.completions.every(validCompletion) || new Set(evidence.completions.map(row => row.id)).size !== evidence.completions.length
    || value.wordsEnded !== evidence.completions.length || value.correct !== evidence.completions.filter(row => row.clean).length
    || value.score !== evidence.completions.reduce((sum, row) => sum + row.points, 0)) return null;
  if (Array.from({ length: value.beatIndex }, (_, beat) => beat).some(beat => !evidence.acceptedResponses.some(row => row.responseId === soundBeatResponseId(stage, value.taskIndex, beat)))) return null;
  if (['wrongPads', 'eagerTaps', 'timingMisses', 'mercyAdvances'].some(key => !integer(evidence.motorEvents?.[key]))
    || value.mistakes !== evidence.motorEvents.timingMisses || (value.attempts && value.currentWordClean)) return null;
  if (!evidence.audioReceipts.every(row => itemFor(row) && notFuture(row) && integer(row.stage, stage) && ['unit', 'phrase'].includes(row.kind)
    && integer(row.beat, itemFor(row).beats.length) && typeof row.src === 'string' && row.src.startsWith('/audio/') && Number.isFinite(row.at))) return null;
  if ([...evidence.firstResponses, ...evidence.assistedRetries, ...evidence.acceptedResponses].some(row => row.deliveryAtResponse === 'delivered'
    && !evidence.audioReceipts.some(cue => cue.stage === row.stage && cue.task === row.task && cue.at <= row.at
      && row.deliveryReceipt?.src === cue.src && row.deliveryReceipt?.at === cue.at && row.deliveryReceipt?.kind === cue.kind
      && row.deliveryReceipt?.stage === cue.stage && row.deliveryReceipt?.task === cue.task && row.deliveryReceipt?.beat === cue.beat
      && (cue.beat === row.beat || (cue.kind === 'phrase' && itemFor(row).unit === 'syllables'))))) return null;
  return structuredClone(value);
}

export function loadSoundBeatSession(scope, difficulty, context) {
  return validateSoundBeatSession(loadLearnGamesProgress(scope).games['sound-beat']?.practiceSession?.[difficulty], context);
}

export function saveSoundBeatSession(scope, difficulty, state) {
  const current = loadLearnGamesProgress(scope), previous = current.games['sound-beat'] || {};
  const next = { ...current, games: { ...current.games, 'sound-beat': { ...previous,
    practiceSession: { ...(previous.practiceSession || {}), [difficulty]: { ...state, version: SOUND_BEAT_CONTENT_VERSION, checkpointSemantics: 'active-question-index' } } } } };
  try { saveLearnGamesProgress(scope, next); return { localSaved: true }; }
  catch (error) { return { localSaved: Boolean(error.savedProgress) }; }
}
