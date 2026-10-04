import { LETTER_LEAP_CONTENT_VERSION } from '../../../../data/arcadeContentVersions.js';
import { getLedaWordAudioPath } from '../../../../data/ledaProductionAudio.js';
import { getChildWordAsset } from '../../../../data/childAssets.js';

export const LETTER_LEAP_CONSTRUCT = 'heard-word-grapheme-encoding';
export const LETTER_LEAP_RESPONSE_LIMIT = 6000;
const unique = values => [...new Set(values)];

export function buildLetterLeapRounds(ladder, difficulty, seed, journeyIndex, { pictureCue } = {}) {
  return ladder.flatMap((plan, stage) => {
    const legs = plan.mode === 'sentence' ? plan.targets : [plan.targets];
    return legs.flatMap((words, leg) => words.map((word, index) => {
      const target=String(word).toUpperCase(),asset=getChildWordAsset(target.toLowerCase());
      const cue = pictureCue?.({ word: target, sentence: plan.mode === 'sentence' ? [...words] : null });
      const pictureKind = cue?.pictureKind === 'sentence-context' ? 'sentence-context' : 'word';
      return {
        roundId: `${LETTER_LEAP_CONTENT_VERSION}:${difficulty}:${seed}:${journeyIndex}:${stage}:${leg}:${index}`,
        key: `${stage}:${leg}:${index}`, stage, leg, index, word: target, units: [...target],
        audio: getLedaWordAudioPath(target.toLowerCase()) || '', pictureKind,
        pictures: unique((cue?.pictures || [asset?.image,asset?.fallbackImage]).filter(Boolean))
      };
    }));
  });
}

export function newLetterLeapEvidence() {
  return { firstResponses: [], assistedRetries: [], acceptedResponses: [], completions: [],
    motorEvents: { falls: 0, foeHits: 0, stomps: 0, brickBumps: 0, springs: 0, coins: 0, routeRetries: 0 } };
}

export function letterLeapSentenceCue(sentence, currentWord) {
  // A future spelling target must not be printed in a previous word's cue.
  // Only words the child has already constructed remain visible.
  const target = String(sentence[currentWord] || '').trim().toUpperCase();
  return sentence.map((part, index) => index < currentWord && String(part).trim().toUpperCase() !== target
    ? String(part) : '_'.repeat(Math.max(2, String(part).length))).join(' ');
}

export function commitLetterLeapChoice(evidence, round, slot, selected, choices, context = {}) {
  if (!round || !Number.isInteger(slot) || slot < 0 || slot >= round.units.length || !choices.includes(selected)) return null;
  const responseId = `${round.roundId}:${slot}`;
  const first = !evidence.firstResponses.some(row => row.responseId === responseId);
  const correct = selected === round.units[slot];
  const supportReasons = unique(context.supportReasons || []);
  const pictureKind = round.pictureKind || 'word';
  if (pictureKind === 'sentence-context') supportReasons.push('sentence-context-picture');
  const delivery = context.delivery || 'pending', pictureDelivery = context.pictureDelivery || 'pending';
  const responseAt = context.responseAt ?? Date.now();
  const deliveryReceipt = context.deliveryReceipt ? { ...context.deliveryReceipt } : null;
  const pictureReceipt = context.pictureReceipt ? { ...context.pictureReceipt } : null;
  const heard = delivery==='delivered' && deliveryReceipt?.source===round.audio && Number.isFinite(deliveryReceipt.endedAt) && deliveryReceipt.endedAt>=0 && deliveryReceipt.endedAt<=responseAt;
  const seen = pictureDelivery==='delivered' && round.pictures.includes(pictureReceipt?.source) && Number.isFinite(pictureReceipt.decodedAt) && pictureReceipt.decodedAt>=0 && pictureReceipt.decodedAt<=responseAt;
  if (delivery !== 'delivered') supportReasons.push(delivery === 'pending' ? 'audio-pending' : 'audio-unavailable');
  if (pictureDelivery !== 'delivered') supportReasons.push(pictureDelivery === 'pending' ? 'picture-pending' : 'picture-unavailable');
  if (delivery==='delivered'&&!heard) supportReasons.push('audio-receipt-unavailable');
  if (pictureDelivery==='delivered'&&!seen) supportReasons.push('picture-receipt-unavailable');
  const row = { responseId, roundId: round.roundId, slot, selected, expected: round.units[slot], correct,
    choices: [...choices], deliveryAtResponse: delivery, pictureDelivery, pictureKind, supportReasons: unique(supportReasons),
    responseAt, deliveryReceipt, pictureReceipt,
    wordVisible: false, modelUsed: Boolean(context.modelUsed), construct: LETTER_LEAP_CONSTRUCT, practiceOnly: true,
    independentEncodingPractice: first && correct && heard && seen
      && !supportReasons.length && !context.modelUsed };
  const acceptedResponses = correct && !evidence.acceptedResponses.some(item => item.responseId === responseId)
    ? [...evidence.acceptedResponses, row] : evidence.acceptedResponses;
  const finished = correct && slot === round.units.length - 1
    && round.units.every((_, i) => acceptedResponses.some(item => item.responseId === `${round.roundId}:${i}`));
  return { correct, first, finished, response: row, evidence: { ...evidence,
    firstResponses: first ? [...evidence.firstResponses, row] : evidence.firstResponses,
    assistedRetries: first ? evidence.assistedRetries : [...evidence.assistedRetries, { ...row, independentEncodingPractice: false }].slice(-LETTER_LEAP_RESPONSE_LIMIT),
    acceptedResponses,
    completions: finished && !evidence.completions.includes(round.roundId) ? [...evidence.completions, round.roundId] : evidence.completions
  } };
}

export function validLetterLeapEvidence(evidence, rounds) {
  if (!evidence || !Array.isArray(evidence.firstResponses) || !Array.isArray(evidence.assistedRetries)
    || !Array.isArray(evidence.acceptedResponses) || !Array.isArray(evidence.completions)
    || evidence.firstResponses.length > rounds.reduce((sum, round) => sum + round.units.length, 0)
    || evidence.assistedRetries.length > LETTER_LEAP_RESPONSE_LIMIT
    || evidence.acceptedResponses.length > rounds.reduce((sum, round) => sum + round.units.length, 0)
    || evidence.completions.length > rounds.length || !evidence.motorEvents
    || Object.values(evidence.motorEvents).some(value => !Number.isInteger(value) || value < 0 || value > 100000)) return false;
  const byId = new Map(rounds.map(round => [round.roundId, round]));
  const valid = row => {
    const round = byId.get(row?.roundId);
    if (!round || !Number.isInteger(row.slot) || row.slot < 0 || row.slot >= round.units.length
      || row.responseId !== `${round.roundId}:${row.slot}` || row.expected !== round.units[row.slot]
      || !Array.isArray(row.choices) || row.choices.length !== 2 || new Set(row.choices).size !== 2
      || !row.choices.includes(row.expected) || !row.choices.includes(row.selected)
      || row.choices.some(choice => typeof choice !== 'string' || !/^[A-Z]$/.test(choice))
      || row.correct !== (row.selected === row.expected) || row.wordVisible !== false || row.practiceOnly !== true
      || row.construct !== LETTER_LEAP_CONSTRUCT || typeof row.modelUsed !== 'boolean'
      || (row.pictureKind || 'word') !== (round.pictureKind || 'word')
      || !Number.isFinite(row.responseAt) || row.responseAt<0
      || !['pending','delivered','unavailable'].includes(row.deliveryAtResponse) || !['pending','delivered','unavailable'].includes(row.pictureDelivery)
      || typeof row.independentEncodingPractice !== 'boolean'
      || (row.deliveryReceipt && (typeof row.deliveryReceipt.source !== 'string' || row.deliveryReceipt.source.length>512
        || !Number.isFinite(row.deliveryReceipt.endedAt) || row.deliveryReceipt.endedAt<0))
      || (row.pictureReceipt && (typeof row.pictureReceipt.source !== 'string' || row.pictureReceipt.source.length>512
        || !Number.isFinite(row.pictureReceipt.decodedAt) || row.pictureReceipt.decodedAt<0))
      || !Array.isArray(row.supportReasons) || row.supportReasons.length > 24
      || row.supportReasons.some(reason => typeof reason !== 'string' || reason.length > 80)) return false;
    if (round.pictureKind === 'sentence-context' && !row.supportReasons.includes('sentence-context-picture')) return false;
    return !row.independentEncodingPractice || (row.correct && !row.modelUsed && !row.supportReasons.length
      && (row.pictureKind || 'word') === 'word'
      && row.deliveryAtResponse === 'delivered' && row.pictureDelivery === 'delivered'
      && row.deliveryReceipt?.source===round.audio && Number.isFinite(row.deliveryReceipt.endedAt) && row.deliveryReceipt.endedAt<=row.responseAt
      && round.pictures.includes(row.pictureReceipt?.source) && Number.isFinite(row.pictureReceipt.decodedAt) && row.pictureReceipt.decodedAt<=row.responseAt);
  };
  const uniqueResponses = rows => new Set(rows.map(row => row.responseId)).size === rows.length;
  if (!uniqueResponses(evidence.firstResponses) || !uniqueResponses(evidence.acceptedResponses)
    || evidence.acceptedResponses.some(row=>!evidence.firstResponses.some(first=>first.responseId===row.responseId
      && (!row.independentEncodingPractice || (first.independentEncodingPractice && JSON.stringify(first)===JSON.stringify(row)))))
    || !evidence.firstResponses.every(valid) || !evidence.assistedRetries.every(row => valid(row) && !row.independentEncodingPractice)
    || !evidence.acceptedResponses.every(row => valid(row) && row.correct)
    || new Set(evidence.completions).size !== evidence.completions.length) return false;
  return evidence.completions.every(id => {
    const round = byId.get(id);
    return round && round.units.every((_, slot) => evidence.acceptedResponses.some(row => row.responseId === `${id}:${slot}`));
  });
}

export function createLetterLeapStageQueue(startLevel = 0, saved = null) {
  const allowed = Array.from({ length: 10 - startLevel }, (_, index) => index + startLevel);
  let order = saved?.order ? [...saved.order] : [...allowed];
  const completed = new Set(saved?.completed || []);
  return {
    peek: () => order[0] ?? null,
    get isDone() { return completed.size === allowed.length; },
    complete() { const stage = order.shift(); if (stage !== undefined) completed.add(stage); },
    miss() { const stage = order.shift(); if (stage !== undefined) order.splice(Math.min(3, order.length), 0, stage); },
    snapshot: () => ({ startLevel, order: [...order], completed: [...completed] })
  };
}
