import { SENTENCE_GROVE_CONTENT_VERSION } from '../../../../data/arcadeContentVersions.js';
import { getLedaInstructionAudioPath } from '../../../../data/ledaProductionAudio.js';
import { shuffleAnswerPositions } from '../../../../utils/answerPositionShuffle.js';
import { acceptedRepairAnswers } from '../../../../utils/starGalleryRounds.js';

export const SENTENCE_GROVE_CONSTRUCT = 'mixed-printed-language-repair';
export const SENTENCE_GROVE_RETRY_LIMIT = 1800;
const unique = values => [...new Set(values)];

export function buildSentenceGroveRounds(ladder, difficulty, seed, journeyIndex) {
  return ladder.flatMap((level, stage) => level.items.map((item, itemSlot) => {
    const repair = item.repairs[0];
    return { roundId: `${SENTENCE_GROVE_CONTENT_VERSION}:${difficulty}:${seed}:${journeyIndex}:${stage}:${itemSlot}:${repair.id}`,
      stage, itemSlot, repairId: repair.id, subtype: repair.category, prompt: repair.prompt,
      display: repair.display, acceptedAnswers: [...acceptedRepairAnswers(repair)],
      choices: shuffleAnswerPositions(repair.options, `sentence-grove:${seed}:${stage}:${itemSlot}`),
      optionalStimulusAudio: getLedaInstructionAudioPath(`${repair.prompt}. ${repair.display}`) || '' };
  }));
}

export function newSentenceGroveEvidence() {
  return { firstResponses: [], assistedRetries: [], acceptedResponses: [], completions: [],
    motorEvents: { hazardHits: 0, emptyCuts: 0 } };
}

// A real reachable tree cut supplies the chosen printed repair. Driving,
// hazards and empty cuts never enter this response writer. Audio availability
// is observed separately because this task's necessary stimulus is printed.
export function commitSentenceGroveRepair(evidence, round, selected, context = {}) {
  if (!round?.choices.includes(selected)) return null;
  const responseId = `${round.roundId}:repair`, first = !evidence.firstResponses.some(row => row.responseId === responseId);
  if (evidence.completions.includes(round.roundId)) return null;
  const responseAt = context.responseAt ?? Date.now(), correct = round.acceptedAnswers.includes(selected);
  const delivery = context.delivery || 'unavailable';
  const deliveryReceipt = context.deliveryReceipt ? { ...context.deliveryReceipt } : null;
  const heard = delivery === 'delivered' && Boolean(round.optionalStimulusAudio)
    && deliveryReceipt?.source === round.optionalStimulusAudio && Number.isFinite(deliveryReceipt.endedAt)
    && deliveryReceipt.endedAt >= 0 && deliveryReceipt.endedAt <= responseAt;
  const supportReasons = unique(context.supportReasons || []);
  if (heard) supportReasons.push('spoken-broken-stimulus');
  if (context.legacyResume) supportReasons.push('legacy-resume-response-history-unavailable');
  if (!first) supportReasons.push('repeat-after-response');
  if (context.modelUsed) supportReasons.push('repair-model-visible');
  if (delivery === 'delivered' && !heard) supportReasons.push('audio-receipt-unavailable');
  const row = { responseId, roundId: round.roundId, stage: round.stage, itemSlot: round.itemSlot,
    repairId: round.repairId, subtype: round.subtype, prompt: round.prompt, printedBrokenStimulus: round.display,
    selected, choices: [...round.choices], acceptedAnswers: [...round.acceptedAnswers], correct,
    responseAt, deliveryAtResponse: delivery, deliveryReceipt, optionalAudioRequired: false,
    spokenStimulusDelivered: heard, modelUsed: Boolean(context.modelUsed), supportReasons: unique(supportReasons),
    construct: SENTENCE_GROVE_CONSTRUCT, practiceOnly: true,
    independentPrintedRepairPractice: first && correct && !supportReasons.length && !context.modelUsed };
  const finished = correct && !evidence.completions.includes(round.roundId);
  return { correct, first, finished, response: row, evidence: { ...evidence,
    firstResponses: first ? [...evidence.firstResponses, row] : evidence.firstResponses,
    assistedRetries: first ? evidence.assistedRetries : [...evidence.assistedRetries, row].slice(-SENTENCE_GROVE_RETRY_LIMIT),
    acceptedResponses: finished ? [...evidence.acceptedResponses, row] : evidence.acceptedResponses,
    completions: finished ? [...evidence.completions, round.roundId] : evidence.completions } };
}

export function validSentenceGroveEvidence(evidence, rounds) {
  if (!evidence || !Array.isArray(evidence.firstResponses) || !Array.isArray(evidence.assistedRetries)
    || !Array.isArray(evidence.acceptedResponses) || !Array.isArray(evidence.completions)
    || evidence.firstResponses.length > rounds.length || evidence.assistedRetries.length > SENTENCE_GROVE_RETRY_LIMIT
    || evidence.acceptedResponses.length > rounds.length || evidence.completions.length > rounds.length
    || !evidence.motorEvents || !['hazardHits', 'emptyCuts'].every(key => Number.isInteger(evidence.motorEvents[key])
      && evidence.motorEvents[key] >= 0 && evidence.motorEvents[key] <= 100000)) return false;
  const byId = new Map(rounds.map(round => [round.roundId, round]));
  const valid = row => {
    const round = byId.get(row?.roundId);
    if (!round || row.responseId !== `${round.roundId}:repair` || row.stage !== round.stage || row.itemSlot !== round.itemSlot
      || row.repairId !== round.repairId || row.subtype !== round.subtype || row.prompt !== round.prompt
      || row.printedBrokenStimulus !== round.display || !round.choices.includes(row.selected)
      || JSON.stringify(row.choices) !== JSON.stringify(round.choices) || JSON.stringify(row.acceptedAnswers) !== JSON.stringify(round.acceptedAnswers)
      || row.correct !== round.acceptedAnswers.includes(row.selected) || row.construct !== SENTENCE_GROVE_CONSTRUCT
      || row.practiceOnly !== true || row.optionalAudioRequired !== false || typeof row.modelUsed !== 'boolean'
      || typeof row.spokenStimulusDelivered !== 'boolean' || typeof row.independentPrintedRepairPractice !== 'boolean'
      || !Number.isFinite(row.responseAt) || row.responseAt < 0 || !['pending', 'delivered', 'unavailable'].includes(row.deliveryAtResponse)
      || !Array.isArray(row.supportReasons) || row.supportReasons.length > 24
      || row.supportReasons.some(reason => typeof reason !== 'string' || reason.length > 80)
      || (row.deliveryReceipt && (typeof row.deliveryReceipt.source !== 'string' || row.deliveryReceipt.source.length > 512
        || !Number.isFinite(row.deliveryReceipt.endedAt) || row.deliveryReceipt.endedAt < 0))) return false;
    const heard = row.deliveryAtResponse === 'delivered' && Boolean(round.optionalStimulusAudio)
      && row.deliveryReceipt?.source === round.optionalStimulusAudio && Number.isFinite(row.deliveryReceipt.endedAt)
      && row.deliveryReceipt.endedAt <= row.responseAt;
    if (row.spokenStimulusDelivered !== heard || (heard && !row.supportReasons.includes('spoken-broken-stimulus'))) return false;
    if (row.modelUsed && !row.supportReasons.includes('repair-model-visible')) return false;
    if (row.deliveryAtResponse === 'delivered' && !heard && !row.supportReasons.includes('audio-receipt-unavailable')) return false;
    return !row.independentPrintedRepairPractice || (row.correct && !row.modelUsed && !row.spokenStimulusDelivered && !row.supportReasons.length);
  };
  const uniqueRows = rows => new Set(rows.map(row => row.responseId)).size === rows.length;
  const recordedRows = [...evidence.firstResponses, ...evidence.assistedRetries];
  if (!uniqueRows(evidence.firstResponses) || !uniqueRows(evidence.acceptedResponses)
    || !evidence.firstResponses.every(valid) || !evidence.assistedRetries.every(row => valid(row) && !row.independentPrintedRepairPractice
      && row.supportReasons.includes('repeat-after-response') && evidence.firstResponses.some(first => first.responseId === row.responseId && first.responseAt <= row.responseAt))
    || !evidence.acceptedResponses.every(row => valid(row) && row.correct
      && recordedRows.some(recorded => JSON.stringify(recorded) === JSON.stringify(row)))
    || new Set(evidence.completions).size !== evidence.completions.length) return false;
  return evidence.completions.every(id => byId.has(id) && evidence.acceptedResponses.some(row => row.roundId === id))
    && evidence.acceptedResponses.every(row => evidence.completions.includes(row.roundId));
}
