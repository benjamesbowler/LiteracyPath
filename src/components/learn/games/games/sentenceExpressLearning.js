import { SENTENCE_EXPRESS_CONTENT_VERSION } from '../../../../data/arcadeContentVersions.js';
import { getLedaWordAudioPath } from '../../../../data/ledaProductionAudio.js';

export const SENTENCE_EXPRESS_CONSTRUCT = 'model-supported-printed-sentence-reconstruction-and-repair';
export const SENTENCE_EXPRESS_RETRY_LIMIT = 1800;
export const SENTENCE_EXPRESS_REHEARSAL_LIMIT = 180;

export function buildSentenceExpressRounds(line, difficulty, seed, journeyIndex) {
  return line.flatMap((level, stage) => level.trains.map((train, trainSlot) => ({
    roundId: `${SENTENCE_EXPRESS_CONTENT_VERSION}:${difficulty}:${seed}:${journeyIndex}:${stage}:${trainSlot}`,
    stage, trainSlot, train: structuredClone(train),
    printedModel: `${train.words.join(' ')}${train.endMark}`,
    readback: train.words.map((word, slot) => ({ word, slot, source: getLedaWordAudioPath(word.toLowerCase()) || '' }))
  })));
}

export const newSentenceExpressAssembly = () => ({ coupled: [], engineChoice: null, cabooseChoice: null, rustyFixed: false, gapFilled: false });
export const newSentenceExpressEvidence = () => ({ firstResponses: [], assistedRetries: [], acceptedResponses: [], sends: [], departures: [], rehearsalSends: [], rehearsalDepartures: [],
  uncouplingReceipts: [], motorEvents: { uncouplings: 0 } });

export function validSentenceExpressAssembly(round, assembly) {
  const train = round?.train;
  return Boolean(train && assembly && Array.isArray(assembly.coupled) && assembly.coupled.length <= train.words.length
    && new Set(assembly.coupled).size === assembly.coupled.length
    && assembly.coupled.every((id, slot) => Number.isInteger(id) && id >= 0 && id < train.words.length && train.words[id] === train.words[slot])
    && typeof assembly.rustyFixed === 'boolean' && typeof assembly.gapFilled === 'boolean'
    && (assembly.engineChoice === null || assembly.engineChoice === train.engine?.correct)
    && (assembly.cabooseChoice === null || assembly.cabooseChoice === train.endMark)
    && (!train.engine || (assembly.coupled.length === 0
      ? assembly.engineChoice === null : assembly.engineChoice === train.engine.correct && assembly.coupled[0] === 0))
    && (assembly.cabooseChoice === null || Boolean(train.caboose) && assembly.coupled.length === train.words.length));
}

// The existing yard chooses the capital engine, repairs, missing crate,
// ordered carriage instances and end mark. Send remains a deliberate action.
export function sentenceExpressDecision(round, assembly) {
  if (!validSentenceExpressAssembly(round, assembly)) return null;
  const train = round.train;
  if (train.engine && assembly.engineChoice === null) return { task: 'engine', slot: 0, choices: [...train.engine.options], expected: train.engine.correct };
  if (train.rusty && !assembly.rustyFixed) return { task: 'repair', slot: train.rusty.index, choices: [...train.rusty.options], expected: train.rusty.correct };
  if (train.gap && !assembly.gapFilled) return { task: 'gap', slot: train.gap.index, choices: [...train.gap.options], expected: train.gap.correct };
  if (assembly.coupled.length < train.words.length) return { task: 'couple', slot: assembly.coupled.length,
    choices: train.sidingOrder.filter(id => !assembly.coupled.includes(id)), expected: train.words[assembly.coupled.length] };
  if (train.caboose && assembly.cabooseChoice !== train.endMark) return { task: 'caboose', slot: train.words.length, choices: [...train.caboose.options], expected: train.endMark };
  return { task: 'send', slot: train.words.length, choices: ['send'], expected: 'send' };
}

export function applySentenceExpressChoice(round, assembly, selected) {
  const decision = sentenceExpressDecision(round, assembly);
  if (!decision || decision.task === 'send' || !decision.choices.includes(selected)) return null;
  const selectedWord = decision.task === 'couple' ? round.train.words[selected] : selected;
  const correct = selectedWord === decision.expected;
  const next = structuredClone(assembly);
  if (correct) {
    if (decision.task === 'engine') { next.engineChoice = selected; next.coupled = [0, ...next.coupled]; }
    else if (decision.task === 'repair') next.rustyFixed = true;
    else if (decision.task === 'gap') next.gapFilled = true;
    else if (decision.task === 'caboose') next.cabooseChoice = selected;
    else next.coupled.push(selected);
  }
  return { correct, selectedWord, assembly: next };
}

export function commitSentenceExpressChoice(evidence, round, assembly, selected, context = {}) {
  const decision = sentenceExpressDecision(round, assembly);
  const visitIndex = context.visitIndex ?? 0;
  if (!decision || decision.task === 'send' || !decision.choices.includes(selected)
    || !Number.isSafeInteger(visitIndex) || visitIndex < 0
    || (visitIndex > 0 && !evidence.departures.some(row => row.roundId === round.roundId))) return null;
  const responseId = `${round.roundId}:${decision.task}:${decision.slot}`;
  const first = !evidence.firstResponses.some(row => row.responseId === responseId);
  // Preserve every retained native event needed to replay the construction.
  // Dropping the oldest retry would silently break the saved assembly chain.
  if (!first && evidence.assistedRetries.length >= SENTENCE_EXPRESS_RETRY_LIMIT) return null;
  const applied = applySentenceExpressChoice(round, assembly, selected);
  const { selectedWord, correct } = applied;
  const supportReasons = [...new Set(['printed-sentence-model-visible', ...(context.supportReasons || []),
    ...(!first ? ['repeat-after-response'] : []), ...(context.legacyResume ? ['legacy-resume-response-history-unavailable'] : [])])];
  if (visitIndex > 0 && !supportReasons.includes('catch-up-rehearsal')) supportReasons.push('catch-up-rehearsal');
  const row = { responseId, roundId: round.roundId, stage: round.stage, trainSlot: round.trainSlot,
    task: decision.task, slot: decision.slot, visitIndex, selected, selectedWord, expected: decision.expected,
    choices: [...decision.choices], assembly: structuredClone(assembly), printedModel: round.printedModel,
    correct, responseAt: context.responseAt ?? Date.now(), supportReasons,
    construct: SENTENCE_EXPRESS_CONSTRUCT, practiceOnly: true, modelUsed: true, independentSentencePractice: false };
  return { correct, first, response: row, assembly: applied.assembly, evidence: { ...evidence,
    firstResponses: first ? [...evidence.firstResponses, row] : evidence.firstResponses,
    assistedRetries: first ? evidence.assistedRetries : [...evidence.assistedRetries, row],
    acceptedResponses: correct && !evidence.acceptedResponses.some(accepted => accepted.responseId === responseId)
      ? [...evidence.acceptedResponses, row] : evidence.acceptedResponses } };
}

export function commitSentenceExpressSend(evidence, round, assembly, sentAt = Date.now(), visitIndex = 0) {
  if (sentenceExpressDecision(round, assembly)?.task !== 'send' || !Number.isSafeInteger(visitIndex) || visitIndex < 0
    || !Number.isFinite(sentAt) || sentAt < 0) return null;
  const previous = evidence.sends.find(row => row.roundId === round.roundId);
  const rehearsal = Boolean(previous);
  // A catch-up train can depart again after its earlier real journey. It
  // remains supported rehearsal and cannot create another original stamp.
  if (rehearsal && (visitIndex === 0 || sentAt < previous.sentAt
    || !evidence.departures.some(row => row.roundId === round.roundId)
    || evidence.rehearsalSends.length >= SENTENCE_EXPRESS_REHEARSAL_LIMIT
    || evidence.rehearsalSends.some(row => row.roundId === round.roundId && row.visitIndex === visitIndex))) return null;
  const row = { roundId: round.roundId, stage: round.stage, trainSlot: round.trainSlot, sentAt,
    explicitSend: true, assembly: structuredClone(assembly), printedModel: round.printedModel,
    construct: SENTENCE_EXPRESS_CONSTRUCT, practiceOnly: true, modelUsed: true, independentSentencePractice: false,
    ...(rehearsal ? {visitIndex, supportReasons: ['printed-sentence-model-visible','catch-up-rehearsal']} : {}) };
  return { response: row, rehearsal, evidence: rehearsal ? { ...evidence, rehearsalSends: [...evidence.rehearsalSends, row] }
    : { ...evidence, sends: [...evidence.sends, row] } };
}

// Last-car uncoupling is a real reversible yard action. It cannot create a
// literacy response, but its physical assembly change must survive a reload.
export function commitSentenceExpressUncouple(evidence, round, assembly, { at = Date.now(), visitIndex = 0 } = {}) {
  if (!validSentenceExpressAssembly(round, assembly) || !assembly.coupled.length
    || !Number.isFinite(at) || at < 0 || !Number.isSafeInteger(visitIndex) || visitIndex < 0
    || (visitIndex > 0 && !evidence.departures.some(row => row.roundId === round.roundId && row.completedAt <= at))
    || evidence.sends.some(row => row.roundId === round.roundId) && visitIndex === 0
    || evidence.uncouplingReceipts.length >= SENTENCE_EXPRESS_RETRY_LIMIT) return null;
  const after = structuredClone(assembly), removedId = after.coupled.pop();
  after.cabooseChoice = null;
  if (!after.coupled.length && round.train.engine) after.engineChoice = null;
  const receipt = { roundId: round.roundId, stage: round.stage, trainSlot: round.trainSlot, visitIndex, at,
    removedId, assembly: structuredClone(assembly), after: structuredClone(after), literacyCredit: false };
  return { assembly: after, evidence: { ...evidence, uncouplingReceipts: [...evidence.uncouplingReceipts, receipt],
    motorEvents: { ...evidence.motorEvents, uncouplings: evidence.motorEvents.uncouplings + 1 } } };
}

const readbackStates = ['delivered', 'unavailable', 'sound-off', 'aborted', 'timeout'];
function validReadback(round, send, row, completedAt) {
  const expected = round.readback[row?.slot];
  return Boolean(expected && Number.isInteger(row.slot) && row.word === expected.word && row.source === expected.source
    && readbackStates.includes(row.status)
    && (row.status === 'delivered' ? Number.isFinite(row.endedAt) && row.endedAt >= send.sentAt && row.endedAt <= completedAt && Boolean(expected.source)
      : row.endedAt === null));
}

// Result settlement follows actual travel and every sequential readback
// outcome. Error/abort/timeout may settle pacing, but never become audio ends.
export function commitSentenceExpressDeparture(evidence, round, { readback, travelComplete, completedAt = Date.now(), visitIndex = 0 }) {
  if (!Number.isSafeInteger(visitIndex) || visitIndex < 0) return null;
  const rehearsal = visitIndex > 0;
  const sends = rehearsal ? evidence.rehearsalSends : evidence.sends;
  const departures = rehearsal ? evidence.rehearsalDepartures : evidence.departures;
  const send = sends.find(row => row.roundId === round.roundId && (!rehearsal || row.visitIndex === visitIndex));
  if (!send || !travelComplete || departures.some(row => row.roundId === round.roundId && (!rehearsal || row.visitIndex === visitIndex))
    || !Array.isArray(readback) || readback.length !== round.readback.length || !Number.isFinite(completedAt) || completedAt < send.sentAt
    || !readback.every((row, slot) => row.slot === slot && validReadback(round, send, row, completedAt))) return null;
  const row = { roundId: round.roundId, explicitSend: true, travelComplete: true,
    completedAt, readback: structuredClone(readback), audioComplete: readback.every(receipt => receipt.status === 'delivered'),
    practiceOnly: true, modelUsed: true, independentSentencePractice: false,
    ...(rehearsal ? {visitIndex, supportReasons:['printed-sentence-model-visible','catch-up-rehearsal']} : {}) };
  return rehearsal ? {...evidence,rehearsalDepartures:[...departures,row]} : {...evidence,departures:[...departures,row]};
}

export function validSentenceExpressEvidence(evidence, rounds) {
  const maximum = rounds.reduce((count, round) => count + round.train.words.length + round.train.faults.length, 0);
  if (!evidence || !['firstResponses', 'assistedRetries', 'acceptedResponses', 'sends', 'departures', 'rehearsalSends', 'rehearsalDepartures', 'uncouplingReceipts'].every(key => Array.isArray(evidence[key]))
    || evidence.firstResponses.length > maximum || evidence.acceptedResponses.length > maximum || evidence.assistedRetries.length > SENTENCE_EXPRESS_RETRY_LIMIT
    || evidence.sends.length > rounds.length || evidence.departures.length > rounds.length
    || evidence.rehearsalSends.length > SENTENCE_EXPRESS_REHEARSAL_LIMIT || evidence.rehearsalDepartures.length > SENTENCE_EXPRESS_REHEARSAL_LIMIT
    || evidence.uncouplingReceipts.length > SENTENCE_EXPRESS_RETRY_LIMIT
    || evidence.motorEvents?.uncouplings !== evidence.uncouplingReceipts.length) return false;
  const byId = new Map(rounds.map(round => [round.roundId, round]));
  const validRow = row => {
    const round = byId.get(row?.roundId), decision = sentenceExpressDecision(round, row?.assembly);
    return Boolean(decision && decision.task !== 'send' && row.responseId === `${round.roundId}:${decision.task}:${decision.slot}`
      && row.stage === round.stage && row.trainSlot === round.trainSlot && row.task === decision.task && row.slot === decision.slot
      && Number.isSafeInteger(row.visitIndex) && row.visitIndex >= 0
      && (row.visitIndex === 0 || Array.isArray(row.supportReasons) && row.supportReasons.includes('catch-up-rehearsal')
        && evidence.departures.some(departure => departure.roundId === row.roundId && departure.completedAt <= row.responseAt))
      && decision.choices.includes(row.selected) && JSON.stringify(row.choices) === JSON.stringify(decision.choices)
      && row.selectedWord === (decision.task === 'couple' ? round.train.words[row.selected] : row.selected)
      && row.expected === decision.expected && row.correct === (row.selectedWord === decision.expected)
      && row.printedModel === round.printedModel && row.construct === SENTENCE_EXPRESS_CONSTRUCT
      && row.practiceOnly === true && row.modelUsed === true && row.independentSentencePractice === false
      && Number.isFinite(row.responseAt) && row.responseAt >= 0 && Array.isArray(row.supportReasons) && row.supportReasons.length <= 24
      && row.supportReasons.every(reason => typeof reason === 'string' && reason.length <= 80)
      && row.supportReasons.includes('printed-sentence-model-visible'));
  };
  const unique = (rows, key) => new Set(rows.map(row => row[key])).size === rows.length;
  const recorded = [...evidence.firstResponses, ...evidence.assistedRetries];
  const validUncouple = row => {
    const round = byId.get(row?.roundId);
    if (!round || row.stage !== round.stage || row.trainSlot !== round.trainSlot || row.literacyCredit !== false
      || !Number.isSafeInteger(row.visitIndex) || row.visitIndex < 0 || !Number.isFinite(row.at) || row.at < 0
      || row.visitIndex > 0 && !evidence.departures.some(departure => departure.roundId === row.roundId && departure.completedAt <= row.at)
      || row.visitIndex === 0 && evidence.sends.some(send => send.roundId === row.roundId && send.sentAt <= row.at)
      || !validSentenceExpressAssembly(round, row.assembly) || !row.assembly.coupled.length) return false;
    const after = structuredClone(row.assembly), removedId = after.coupled.pop();
    after.cabooseChoice = null;
    if (!after.coupled.length && round.train.engine) after.engineChoice = null;
    return row.removedId === removedId && JSON.stringify(row.after) === JSON.stringify(after);
  };
  if (!unique(evidence.firstResponses, 'responseId') || !unique(evidence.acceptedResponses, 'responseId')
    || !unique(evidence.sends, 'roundId') || !unique(evidence.departures, 'roundId') || !evidence.firstResponses.every(validRow)
    || !evidence.assistedRetries.every(row => validRow(row) && row.supportReasons.includes('repeat-after-response')
      && evidence.firstResponses.some(first => first.responseId === row.responseId && first.responseAt <= row.responseAt))
    || !evidence.acceptedResponses.every(row => validRow(row) && row.correct && recorded.some(actual => JSON.stringify(actual) === JSON.stringify(row)))
    || !evidence.uncouplingReceipts.every(validUncouple)) return false;
  const validSend = row => {
    const round = byId.get(row.roundId);
    return round && row.stage === round.stage && row.trainSlot === round.trainSlot && Number.isFinite(row.sentAt) && row.sentAt >= 0
      && row.explicitSend === true && row.printedModel === round.printedModel && row.construct === SENTENCE_EXPRESS_CONSTRUCT
      && row.practiceOnly === true && row.modelUsed === true && row.independentSentencePractice === false
      && sentenceExpressDecision(round, row.assembly)?.task === 'send';
  };
  if(!evidence.sends.every(validSend))return false;
  const rehearsalKey = row => `${row.roundId}:${row.visitIndex}`;
  const validRehearsal = row => Number.isSafeInteger(row.visitIndex) && row.visitIndex > 0
    && Array.isArray(row.supportReasons) && row.supportReasons.length === 2
    && row.supportReasons.includes('printed-sentence-model-visible') && row.supportReasons.includes('catch-up-rehearsal');
  if(new Set(evidence.rehearsalSends.map(rehearsalKey)).size!==evidence.rehearsalSends.length
    || new Set(evidence.rehearsalDepartures.map(rehearsalKey)).size!==evidence.rehearsalDepartures.length
    || !evidence.rehearsalSends.every(row=>validSend(row)&&validRehearsal(row)
      && evidence.departures.some(departure=>departure.roundId===row.roundId&&departure.completedAt<=row.sentAt)))return false;
  const validDeparture = (row, send) => {
    const round = byId.get(row.roundId);
    return round && send && row.explicitSend === true && row.travelComplete === true && Number.isFinite(row.completedAt) && row.completedAt >= send.sentAt
      && row.practiceOnly === true && row.modelUsed === true && row.independentSentencePractice === false
      && Array.isArray(row.readback) && row.readback.length === round.readback.length
      && row.readback.every((receipt, slot) => receipt.slot === slot && validReadback(round, send, receipt, row.completedAt))
      && row.audioComplete === row.readback.every(receipt => receipt.status === 'delivered');
  };
  return evidence.departures.every(row=>validDeparture(row,evidence.sends.find(sent=>sent.roundId===row.roundId)))
    && evidence.rehearsalDepartures.every(row=>validRehearsal(row)&&validDeparture(row,
      evidence.rehearsalSends.find(sent=>sent.roundId===row.roundId&&sent.visitIndex===row.visitIndex)));
}
