import { SOUND_SAFARI_CONTENT_VERSION } from '../../../../data/arcadeContentVersions.js';
import { getLedaWordAudioPath } from '../../../../data/ledaProductionAudio.js';
import { getArcadeCuePicture } from '../../../../data/arcadeCuePictures.js';
import { safariChoiceLabels } from '../../../../utils/soundSafariRounds.js';
import { getPreferredPhonemeAudioPath } from '../../../../data/phonemeAudioBank.js';

export const SOUND_SAFARI_CONSTRUCT = 'heard-word-ordered-phoneme-grapheme-selection';
export const SOUND_SAFARI_RETRY_LIMIT = 1800;
const unique = values => [...new Set(values)];
const deliveryStates = ['pending', 'delivered', 'unavailable'];
const pictureKinds = ['word', 'meaning-context'];

// Native Hear is support for the current word, even when the first cue was
// delivered. Save that provenance before replay; a quota hold may stop play.
export function requestSoundSafariWordReplay({ round, supportReasons, canReplay, persist, play }) {
  if (!round || !canReplay()) return null;
  supportReasons[round.roundId] = unique([...(supportReasons[round.roundId] || []), 'word-audio-replay']).slice(-24);
  persist();
  return canReplay() ? play() : null;
}

// A caught printed label may use an authored alternate pronunciation. Read
// that source sound rather than reducing a digraph or vowel team to its first
// letter. If another label has multiple different sounds in this word, do not
// invent a single pronunciation for corrective speech.
export function soundSafariChoiceSoundKey(round, slot, label) {
  if (!Number.isInteger(slot) || !round?.choicesBySlot?.[slot]?.includes(label)) return '';
  if (label === round.units[slot]) return round.soundKeys[slot] || '';
  const keys = round.units.flatMap((unit, index) => unit === label ? [round.soundKeys[index]] : []);
  if (!keys.length) return label;
  const sources = unique(keys.map(key => getPreferredPhonemeAudioPath(key)));
  return sources.length === 1 && sources[0] ? keys[0] : '';
}

// The existing authored bank retains both grapheme labels and their exact
// recorded sound keys. The renderer never derives phonemes from spelling.
export function buildSoundSafariRounds(ladder, difficulty, seed, journeyIndex, { pictureCue = getArcadeCuePicture } = {}) {
  const rank = { easy: 0, medium: 1, hard: 2 }[difficulty] ?? 0;
  return ladder.flatMap((level, stage) => level.words.map((item, wordSlot) => {
    const cue = pictureCue(item.word);
    const count = Math.min(8, 4 + rank + Math.floor((stage + 1) / 3));
    const pictures = cue?.pictures || [cue?.image, cue?.fallbackImage];
    return {
      roundId: `${SOUND_SAFARI_CONTENT_VERSION}:${difficulty}:${seed}:${journeyIndex}:${stage}:${wordSlot}`,
      key: `${stage}:${wordSlot}`, stage, wordSlot, word: item.word,
      units: [...item.graphemes], soundKeys: [...item.soundKeys],
      audio: getLedaWordAudioPath(item.word) || '',
      pictures: unique(pictures.filter(Boolean)),
      pictureKind: cue?.kind === 'meaning-context' ? 'meaning-context' : 'word',
      choicesBySlot: item.graphemes.map((_, slot) => safariChoiceLabels(item, slot, count, `safari:${seed}:${stage}:${wordSlot}:${slot}`))
    };
  }));
}

export function newSoundSafariEvidence() {
  return { firstResponses: [], assistedRetries: [], acceptedResponses: [], completions: [],
    motorEvents: { emptySwings: 0, catches: 0 } };
}

export function commitSoundSafariCapture(evidence, round, slot, selected, visibleChoices, context = {}) {
  const canonical = round?.choicesBySlot?.[slot];
  if (!Number.isInteger(slot) || !canonical || !Array.isArray(visibleChoices) || visibleChoices.length < 2
    || new Set(visibleChoices).size !== visibleChoices.length || !visibleChoices.includes(selected)
    || !visibleChoices.includes(round.units[slot]) || visibleChoices.some(label => !canonical.includes(label))) return null;
  const responseId = `${round.roundId}:${slot}`, first = !evidence.firstResponses.some(row => row.responseId === responseId);
  if (!first && evidence.assistedRetries.length >= SOUND_SAFARI_RETRY_LIMIT) return null;
  // A capture can only answer the next unbuilt unit. A saved prefix is useful
  // practice state, never permission to skip or credit a later sound.
  if (evidence.acceptedResponses.some(row => row.responseId === responseId)
    || round.units.slice(0, slot).some((_, index) => !evidence.acceptedResponses.some(row => row.responseId === `${round.roundId}:${index}`))) return null;
  const responseAt = context.responseAt ?? Date.now(), correct = selected === round.units[slot];
  const delivery = context.delivery || 'pending', pictureDelivery = context.pictureDelivery || 'pending';
  const deliveryReceipt = context.deliveryReceipt ? { ...context.deliveryReceipt } : null;
  const pictureReceipt = context.pictureReceipt ? { ...context.pictureReceipt } : null;
  const heard = delivery === 'delivered' && deliveryReceipt?.source === round.audio
    && Number.isFinite(deliveryReceipt.endedAt) && deliveryReceipt.endedAt >= 0 && deliveryReceipt.endedAt <= responseAt;
  const seen = pictureDelivery === 'delivered' && round.pictures.includes(pictureReceipt?.source)
    && Number.isFinite(pictureReceipt.decodedAt) && pictureReceipt.decodedAt >= 0 && pictureReceipt.decodedAt <= responseAt;
  const supportReasons = unique(context.supportReasons || []);
  if (round.pictureKind === 'meaning-context') supportReasons.push('recorded-word-meaning-context-picture');
  if (context.modelUsed) supportReasons.push('needed-unit-model-visible');
  if (context.soundEnabled === false) supportReasons.push('sound-off-at-response');
  if (context.legacyResume) supportReasons.push('legacy-resume-response-history-unavailable');
  if (!first) supportReasons.push('repeat-after-response');
  if (delivery !== 'delivered') supportReasons.push(delivery === 'pending' ? 'audio-pending' : 'audio-unavailable');
  if (pictureDelivery !== 'delivered') supportReasons.push(pictureDelivery === 'pending' ? 'picture-pending' : 'picture-unavailable');
  if (delivery === 'delivered' && !heard) supportReasons.push('audio-receipt-unavailable');
  if (pictureDelivery === 'delivered' && !seen) supportReasons.push('picture-receipt-unavailable');
  const row = { responseId, roundId: round.roundId, stage: round.stage, wordSlot: round.wordSlot, slot,
    eventIndex: evidence.firstResponses.length + evidence.assistedRetries.length,
    selected, expected: round.units[slot], expectedSoundKey: round.soundKeys[slot], correct,
    choices: [...visibleChoices], responseAt, deliveryAtResponse: delivery, pictureDelivery,
    deliveryReceipt, pictureReceipt, pictureKind: round.pictureKind, supportReasons: unique(supportReasons),
    soundEnabled: context.soundEnabled !== false, wordVisible: false, modelUsed: Boolean(context.modelUsed),
    construct: SOUND_SAFARI_CONSTRUCT, practiceOnly: true,
    independentOrderedSoundPractice: first && correct && heard && seen && !supportReasons.length && !context.modelUsed };
  const acceptedResponses = correct && !evidence.acceptedResponses.some(item => item.responseId === responseId)
    ? [...evidence.acceptedResponses, row] : evidence.acceptedResponses;
  const finished = correct && slot === round.units.length - 1
    && round.units.every((_, index) => acceptedResponses.some(item => item.responseId === `${round.roundId}:${index}`));
  return { correct, first, finished, response: row, evidence: { ...evidence,
    firstResponses: first ? [...evidence.firstResponses, row] : evidence.firstResponses,
    assistedRetries: first ? evidence.assistedRetries : [...evidence.assistedRetries, row],
    acceptedResponses,
    completions: finished && !evidence.completions.includes(round.roundId) ? [...evidence.completions, round.roundId] : evidence.completions } };
}

export function validSoundSafariEvidence(evidence, rounds) {
  const maxResponses = rounds.reduce((sum, round) => sum + round.units.length, 0);
  if (!evidence || !Array.isArray(evidence.firstResponses) || !Array.isArray(evidence.assistedRetries)
    || !Array.isArray(evidence.acceptedResponses) || !Array.isArray(evidence.completions)
    || evidence.firstResponses.length > maxResponses || evidence.assistedRetries.length > SOUND_SAFARI_RETRY_LIMIT
    || evidence.acceptedResponses.length > maxResponses || evidence.completions.length > rounds.length
    || !evidence.motorEvents || !['emptySwings', 'catches'].every(key => Number.isInteger(evidence.motorEvents[key])
      && evidence.motorEvents[key] >= 0 && evidence.motorEvents[key] <= 100000)) return false;
  const byId = new Map(rounds.map(round => [round.roundId, round]));
  const valid = row => {
    const round = byId.get(row?.roundId), canonical = round?.choicesBySlot?.[row?.slot];
    if (!Number.isInteger(row?.slot) || !canonical || row.responseId !== `${round.roundId}:${row.slot}` || row.stage !== round.stage || row.wordSlot !== round.wordSlot
      || row.expected !== round.units[row.slot] || row.expectedSoundKey !== round.soundKeys[row.slot]
      || !Array.isArray(row.choices) || row.choices.length < 2 || new Set(row.choices).size !== row.choices.length
      || row.choices.some(label => !canonical.includes(label)) || !row.choices.includes(row.selected) || !row.choices.includes(row.expected)
      || row.correct !== (row.selected === row.expected) || row.wordVisible !== false || row.practiceOnly !== true
      || row.construct !== SOUND_SAFARI_CONSTRUCT || typeof row.modelUsed !== 'boolean' || typeof row.soundEnabled !== 'boolean'
      || !Number.isSafeInteger(row.eventIndex) || row.eventIndex < 0
      || row.pictureKind !== round.pictureKind || !pictureKinds.includes(row.pictureKind)
      || !Number.isFinite(row.responseAt) || row.responseAt < 0
      || !deliveryStates.includes(row.deliveryAtResponse) || !deliveryStates.includes(row.pictureDelivery)
      || typeof row.independentOrderedSoundPractice !== 'boolean'
      || !Array.isArray(row.supportReasons) || row.supportReasons.length > 24
      || row.supportReasons.some(reason => typeof reason !== 'string' || reason.length > 80)
      || (row.deliveryReceipt && (typeof row.deliveryReceipt.source !== 'string' || row.deliveryReceipt.source.length > 512
        || !Number.isFinite(row.deliveryReceipt.endedAt) || row.deliveryReceipt.endedAt < 0))
      || (row.pictureReceipt && (typeof row.pictureReceipt.source !== 'string' || row.pictureReceipt.source.length > 512
        || !Number.isFinite(row.pictureReceipt.decodedAt) || row.pictureReceipt.decodedAt < 0))) return false;
    if (round.pictureKind === 'meaning-context'
      && !row.supportReasons.includes('recorded-word-meaning-context-picture')) return false;
    if (row.modelUsed && !row.supportReasons.includes('needed-unit-model-visible')) return false;
    return !row.independentOrderedSoundPractice || (row.correct && row.soundEnabled && !row.modelUsed && !row.supportReasons.length
      && row.pictureKind === 'word' && row.deliveryAtResponse === 'delivered' && row.pictureDelivery === 'delivered'
      && row.deliveryReceipt?.source === round.audio && Number.isFinite(row.deliveryReceipt.endedAt) && row.deliveryReceipt.endedAt <= row.responseAt
      && round.pictures.includes(row.pictureReceipt?.source) && Number.isFinite(row.pictureReceipt.decodedAt) && row.pictureReceipt.decodedAt <= row.responseAt);
  };
  const uniqueRows = rows => new Set(rows.map(row => row.responseId)).size === rows.length;
  const recordedRows = [...evidence.firstResponses, ...evidence.assistedRetries];
  if (new Set(recordedRows.map(row => row.eventIndex)).size !== recordedRows.length
    || recordedRows.some(row => row.eventIndex >= recordedRows.length)) return false;
  if (!uniqueRows(evidence.firstResponses) || !uniqueRows(evidence.acceptedResponses)
    || !evidence.firstResponses.every(valid) || !evidence.assistedRetries.every(row => valid(row) && !row.independentOrderedSoundPractice
      && row.supportReasons.includes('repeat-after-response') && evidence.firstResponses.some(first => first.responseId === row.responseId && first.responseAt <= row.responseAt))
    || !evidence.acceptedResponses.every(row => valid(row) && row.correct
      && recordedRows.some(recorded => JSON.stringify(recorded) === JSON.stringify(row)))
    || new Set(evidence.completions).size !== evidence.completions.length) return false;
  if (evidence.completions.some(id => !byId.has(id))) return false;
  return rounds.every(round => {
    const accepted = round.units.map((_, slot) => evidence.acceptedResponses.some(row => row.responseId === `${round.roundId}:${slot}`));
    const gap = accepted.indexOf(false);
    return (gap < 0 || !accepted.slice(gap + 1).some(Boolean))
      && evidence.completions.includes(round.roundId) === accepted.every(Boolean);
  });
}
