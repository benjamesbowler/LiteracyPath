import { WORD_CLIMB_CONTENT_VERSION } from '../../../../data/arcadeContentVersions.js';
import { phonemeAudioCandidates } from '../../../../data/phonemeAudioBank.js';
import { AUDIO_QUEST_PATHS } from '../../../../data/generated/audioQuestPaths.generated.js';
import { isKnownBadAudioPath } from '../../../../data/knownBadWordAudio.js';

export const WORD_CLIMB_CONSTRUCT = 'printed-word-initial-phoneme-identification';
export const WORD_CLIMB_RETRY_LIMIT = 1800;
const unique = values => [...new Set(values)];

export function wordClimbRounds(world, session, { difficulty, seed, journeyIndex, originStep = 0 }) {
  const audio = phonemeAudioCandidates(session.target).filter(source => AUDIO_QUEST_PATHS.has(source) && !isKnownBadAudioPath(source));
  return Array.from({ length: world.summit - originStep }, (_, index) => {
    const row = originStep + index + 1;
    return { roundId: `${WORD_CLIMB_CONTENT_VERSION}:${difficulty}:${seed}:${journeyIndex}:${world.journey.stageIndex}:${row}`,
      row, targetPhoneme: session.target, audio: [...audio], choices: world.platforms.filter(platform => platform.kind === 'word' && platform.row === row)
        .map(({ id, word, correct }) => ({ id, word, correct })) };
  });
}

export function newWordClimbEvidence() {
  return { firstResponses: [], assistedRetries: [], acceptedResponses: [], completions: [], motorEvents: { falls: 0, lights: 0, jumps: 0 } };
}

// UI adapters call these imperative-state boundaries; rendering observes the
// state, while the controller retains ownership of evidence/support mutation.
export function applyWordClimbEvidence(practice, evidence) { practice.evidence=evidence; }
export function addWordClimbMotorEvent(practice, kind) {
  if (['falls','lights','jumps'].includes(kind)) practice.evidence.motorEvents[kind]++;
}
export function supportWordClimbRound(practice, roundId, reason) {
  if (typeof reason==='string'&&reason.length>0&&reason.length<=80) practice.supportReasons[roundId]=unique([...(practice.supportReasons[roundId]||[]),reason]).slice(-24);
}

export function commitWordClimbLanding(evidence, round, platformId, context = {}) {
  const choice = round?.choices.find(item => item.id === platformId);
  if (!choice || evidence.completions.includes(round.roundId)) return null;
  const responseId = `${round.roundId}:landing`, first = !evidence.firstResponses.some(item => item.responseId === responseId);
  const responseAt = context.responseAt ?? Date.now(), delivery = context.delivery || 'pending';
  const deliveryReceipt = context.deliveryReceipt ? { ...context.deliveryReceipt } : null;
  const heard = delivery === 'delivered' && round.audio.includes(deliveryReceipt?.source)
    && Number.isFinite(deliveryReceipt.endedAt) && deliveryReceipt.endedAt >= 0 && deliveryReceipt.endedAt <= responseAt;
  const supportReasons = unique(context.supportReasons || []);
  if (context.soundEnabled === false) supportReasons.push('sound-off-at-response');
  if (context.legacyResume) supportReasons.push('legacy-resume-response-history-unavailable');
  if (!first) supportReasons.push('repeat-after-response');
  if (delivery !== 'delivered') supportReasons.push(delivery === 'pending' ? 'audio-pending' : 'audio-unavailable');
  if (delivery === 'delivered' && !heard) supportReasons.push('audio-receipt-unavailable');
  const row = { responseId, roundId: round.roundId, row: round.row, selected: choice.word, selectedId: choice.id,
    choices: round.choices.map(item => ({ id: item.id, word: item.word })), targetPhoneme: round.targetPhoneme,
    correct: choice.correct, responseAt, soundEnabled: context.soundEnabled !== false, deliveryAtResponse: delivery, deliveryReceipt,
    supportReasons: unique(supportReasons), printedWordsVisible: true, printedCriterionVisible: true,
    modelUsed: Boolean(context.modelUsed), practiceOnly: true, construct: WORD_CLIMB_CONSTRUCT,
    independentInitialPhonemePractice: first && choice.correct && heard && !supportReasons.length && !context.modelUsed };
  const finished = choice.correct && !evidence.completions.includes(round.roundId);
  return { correct: choice.correct, first, finished, response: row, evidence: { ...evidence,
    firstResponses: first ? [...evidence.firstResponses, row] : evidence.firstResponses,
    assistedRetries: first ? evidence.assistedRetries : [...evidence.assistedRetries, row].slice(-WORD_CLIMB_RETRY_LIMIT),
    acceptedResponses: finished ? [...evidence.acceptedResponses, row] : evidence.acceptedResponses,
    completions: finished ? [...evidence.completions, round.roundId] : evidence.completions } };
}

export function validWordClimbEvidence(evidence, rounds) {
  if (!evidence || !Array.isArray(evidence.firstResponses) || !Array.isArray(evidence.assistedRetries)
    || !Array.isArray(evidence.acceptedResponses) || !Array.isArray(evidence.completions)
    || evidence.firstResponses.length > rounds.length || evidence.assistedRetries.length > WORD_CLIMB_RETRY_LIMIT
    || evidence.acceptedResponses.length > rounds.length || evidence.completions.length > rounds.length
    || !evidence.motorEvents || !['falls', 'lights', 'jumps'].every(key => Number.isInteger(evidence.motorEvents[key]) && evidence.motorEvents[key] >= 0 && evidence.motorEvents[key] <= 100000)) return false;
  const byId = new Map(rounds.map(round => [round.roundId, round]));
  const valid = row => {
    const round = byId.get(row?.roundId), choice = round?.choices.find(item => item.id === row.selectedId);
    if (!choice || row.responseId !== `${round.roundId}:landing` || row.row !== round.row
      || row.selected !== choice.word || row.correct !== choice.correct || row.targetPhoneme !== round.targetPhoneme
      || JSON.stringify(row.choices) !== JSON.stringify(round.choices.map(item => ({ id: item.id, word: item.word })))
      || row.construct !== WORD_CLIMB_CONSTRUCT || row.practiceOnly !== true || row.printedWordsVisible !== true || row.printedCriterionVisible !== true
      || typeof row.modelUsed !== 'boolean' || typeof row.soundEnabled !== 'boolean' || typeof row.independentInitialPhonemePractice !== 'boolean'
      || !Number.isFinite(row.responseAt) || row.responseAt < 0 || !['pending', 'delivered', 'unavailable'].includes(row.deliveryAtResponse)
      || !Array.isArray(row.supportReasons) || row.supportReasons.length > 24 || row.supportReasons.some(reason => typeof reason !== 'string' || reason.length > 80)
      || (row.deliveryReceipt && (typeof row.deliveryReceipt.source !== 'string' || row.deliveryReceipt.source.length > 512
        || !Number.isFinite(row.deliveryReceipt.endedAt) || row.deliveryReceipt.endedAt < 0))) return false;
    return !row.independentInitialPhonemePractice || (row.correct && row.soundEnabled && !row.modelUsed && !row.supportReasons.length
      && row.deliveryAtResponse === 'delivered' && round.audio.includes(row.deliveryReceipt?.source)
      && Number.isFinite(row.deliveryReceipt.endedAt) && row.deliveryReceipt.endedAt <= row.responseAt);
  };
  const uniqueRows = rows => new Set(rows.map(row => row.responseId)).size === rows.length;
  const recorded = [...evidence.firstResponses, ...evidence.assistedRetries];
  if (!uniqueRows(evidence.firstResponses) || !uniqueRows(evidence.acceptedResponses)
    || !evidence.firstResponses.every(valid) || !evidence.assistedRetries.every(row => valid(row) && !row.independentInitialPhonemePractice
      && row.supportReasons.includes('repeat-after-response') && evidence.firstResponses.some(first => first.responseId === row.responseId && first.responseAt <= row.responseAt))
    || !evidence.acceptedResponses.every(row => valid(row) && row.correct && recorded.some(actual => JSON.stringify(actual) === JSON.stringify(row)))
    || new Set(evidence.completions).size !== evidence.completions.length) return false;
  return evidence.completions.every(id => byId.has(id) && evidence.acceptedResponses.some(row => row.roundId === id))
    && evidence.acceptedResponses.every(row => evidence.completions.includes(row.roundId));
}
