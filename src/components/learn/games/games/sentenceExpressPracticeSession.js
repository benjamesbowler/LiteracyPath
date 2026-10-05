import { SENTENCE_EXPRESS_CONTENT_VERSION } from '../../../../data/arcadeContentVersions.js';
import { loadLearnGamesProgress, saveLearnGamesProgress } from '../../../../utils/learnGamesProgress.js';
import { applySentenceExpressChoice, newSentenceExpressAssembly, sentenceExpressDecision,
  validSentenceExpressAssembly, validSentenceExpressEvidence, SENTENCE_EXPRESS_REHEARSAL_LIMIT } from './sentenceExpressLearning.js';

const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
const finite = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const ordinal = round => round.stage * 3 + round.trainSlot;
const phases = ['SHUNT', 'DEPART', 'TALLY', 'FINISHED'];

// Replay only actual native decisions. A valid carriage ID or a full saved
// assembly cannot, by itself, stand in for earlier v2 literacy responses.
function histories(value, rounds) {
  const chains = new Map(), all = [...value.evidence.firstResponses, ...value.evidence.assistedRetries, ...value.evidence.uncouplingReceipts];
  for (const round of rounds) {
    const visits = new Set(all.filter(row => row.roundId === round.roundId).map(row => row.visitIndex));
    visits.add(value.currentRoundId === round.roundId ? value.visitIndex : 0);
    for (const visitIndex of visits) {
      const legacyOrigin = value.legacyResume && visitIndex === 0 && round.roundId === value.originRoundId;
      let assembly = legacyOrigin ? structuredClone(value.originAssembly) : newSentenceExpressAssembly();
      const rows = all.filter(row => row.roundId === round.roundId && row.visitIndex === visitIndex)
        .sort((left, right) => (left.responseAt ?? left.at) - (right.responseAt ?? right.at));
      let previousAt = 0;
      while (rows.length) {
        const index = rows.findIndex(row => same(row.assembly, assembly) && (row.responseAt ?? row.at) >= previousAt);
        if (index < 0) return null;
        const [row] = rows.splice(index, 1); previousAt = row.responseAt ?? row.at;
        if (row.literacyCredit === false) { assembly = structuredClone(row.after); continue; }
        const applied = applySentenceExpressChoice(round, assembly, row.selected);
        if (!applied || applied.correct !== row.correct) return null;
        assembly = applied.assembly;
      }
      chains.set(`${round.roundId}:${visitIndex}`, assembly);
    }
  }
  return chains;
}

function departureReceiptFits(round, send, receipt, savedAt) {
  const expected = round.readback[receipt?.slot];
  return Boolean(expected && receipt.word === expected.word && receipt.source === expected.source
    && ['delivered', 'unavailable', 'sound-off', 'aborted', 'timeout'].includes(receipt.status)
    && (receipt.status === 'delivered' ? Boolean(expected.source) && finite(receipt.endedAt, send.sentAt, savedAt) : receipt.endedAt === null));
}

export function validateSentenceExpressPracticeSession(value, difficulty, seed, journeyIndex, rounds) {
  try {
    if (JSON.stringify(value).length > 2000000 || !value || value.version !== SENTENCE_EXPRESS_CONTENT_VERSION
      || value.difficulty !== difficulty || value.seed !== seed || value.journeyIndex !== journeyIndex
      || !integer(seed, 0, Number.MAX_SAFE_INTEGER) || !integer(journeyIndex, 0, 11)
      || !integer(value.originStage, 0, 9) || !integer(value.originTrainIndex, 0, 2)
      || value.originTrainSlot !== 3 * value.originStage + value.originTrainIndex
      || typeof value.legacyResume !== 'boolean' || typeof value.legacyMainComplete !== 'boolean'
      || (!value.legacyResume && (value.originTrainSlot !== 0 || value.legacyMainComplete))
      || !integer(value.stage, value.originStage, 9) || !integer(value.mainTrainIndex, 0, 3 + SENTENCE_EXPRESS_REHEARSAL_LIMIT)
      || !integer(value.visitIndex, 0, SENTENCE_EXPRESS_REHEARSAL_LIMIT) || !phases.includes(value.phase)
      || !finite(value.savedAt, 0, Number.MAX_SAFE_INTEGER) || !validSentenceExpressEvidence(value.evidence, rounds)
      || !value.performance || !integer(value.performance.delay, 0, 100000) || !integer(value.performance.mistakes, 0, 100000)
      || !integer(value.performance.combo, 1, 3) || !integer(value.performance.express, 0, 3 + SENTENCE_EXPRESS_REHEARSAL_LIMIT)
      || !value.supportReasons || Array.isArray(value.supportReasons)) return null;
    const byId = new Map(rounds.map(round => [round.roundId, round])), current = byId.get(value.currentRoundId);
    const oldRun = value.legacyRunTotals;
    if (oldRun && (!integer(oldRun.baseStart, 0, value.originStage) || !integer(oldRun.levelsDone, 0, 10)
      || oldRun.baseStart + oldRun.levelsDone !== value.originStage || !integer(oldRun.starSum, 0, oldRun.levelsDone * 3)
      || !integer(oldRun.score, oldRun.starSum * 10, 100000) || (oldRun.score - oldRun.starSum * 10) % 5
      || !integer(oldRun.words, oldRun.levelsDone ? oldRun.levelsDone : 0, 1000)
      || !oldRun.levelsDone && (oldRun.words || oldRun.score || oldRun.starSum)
      || !value.legacyResume && oldRun.levelsDone > 0)) return null;
    const origin = rounds.find(round => ordinal(round) === value.originTrainSlot);
    if (!origin || value.originRoundId !== origin.roundId || !validSentenceExpressAssembly(origin, value.originAssembly)
      || (!value.legacyResume && !same(value.originAssembly, newSentenceExpressAssembly()))
      || !current || current.stage !== value.stage || !validSentenceExpressAssembly(current, value.assembly)
      || !Array.isArray(value.queue) || value.queue.length > 3 || new Set(value.queue).size !== value.queue.length
      || value.queue.some(id => byId.get(id)?.stage !== value.stage)
      || !Array.isArray(value.originQueue) || value.originQueue.length > 3 || new Set(value.originQueue).size !== value.originQueue.length
      || value.originQueue.some(id => byId.get(id)?.stage !== value.originStage)
      || (!value.legacyResume && value.originQueue.length)
      || (value.legacyMainComplete && !value.originQueue.includes(value.originRoundId))) return null;
    for (const [id, reasons] of Object.entries(value.supportReasons)) {
      if (!byId.has(id) || !Array.isArray(reasons) || reasons.length > 24
        || reasons.some(reason => typeof reason !== 'string' || !reason || reason.length > 80)) return null;
    }
    const allowed = round => ordinal(round) >= value.originTrainSlot
      || value.legacyResume && value.originQueue.includes(round.roundId);
    const rows = [...value.evidence.firstResponses, ...value.evidence.assistedRetries, ...value.evidence.sends, ...value.evidence.departures,
      ...value.evidence.rehearsalSends, ...value.evidence.rehearsalDepartures, ...value.evidence.uncouplingReceipts];
    if (rows.some(row => !allowed(byId.get(row.roundId)) || byId.get(row.roundId).stage > value.stage
      || row.visitIndex !== undefined && !integer(row.visitIndex, 0, SENTENCE_EXPRESS_REHEARSAL_LIMIT))) return null;
    const departed = new Set(value.evidence.departures.map(row => row.roundId));
    if (value.stageAwards !== undefined && (!Array.isArray(value.stageAwards) || value.stageAwards.length > 10
      || new Set(value.stageAwards.map(row => row.stage)).size !== value.stageAwards.length
      || value.stageAwards.some(row => !integer(row.stage, value.originStage, value.stage) || !integer(row.stars, 0, 3)
        || !integer(row.mistakes, 0, 100000) || !integer(row.express, 0, 183)
        || !integer(row.words, 1, 1000) || row.score !== row.stars * 10 + row.express * 5
        || !finite(row.reportedAt, 0, value.savedAt)
        || row.words !== value.evidence.departures.filter(receipt => byId.get(receipt.roundId).stage === row.stage)
          .reduce((total, receipt) => total + byId.get(receipt.roundId).readback.length, 0)))) return null;
    const required = rounds.filter(round => round.stage <= value.stage && allowed(round)
      && (value.legacyMainComplete && round.stage === value.originStage
        ? value.originQueue.includes(round.roundId) && !value.queue.includes(round.roundId)
        : round.stage < value.stage || round.trainSlot < Math.min(3, value.mainTrainIndex)));
    if (required.some(round => !departed.has(round.roundId))
      || value.queue.some(id => !departed.has(id) && !value.originQueue.includes(id))) return null;
    if (value.phase === 'SHUNT' || value.phase === 'DEPART') {
      const expected = value.mainTrainIndex < 3 ? rounds.find(round => round.stage === value.stage && round.trainSlot === value.mainTrainIndex)?.roundId : value.queue[0];
      if (value.currentRoundId !== expected) return null;
    } else if (value.queue.length || rounds.filter(round => round.stage === value.stage && allowed(round)
      && !(value.legacyMainComplete && round.stage === value.originStage && !value.originQueue.includes(round.roundId)))
      .some(round => !departed.has(round.roundId)) || value.phase === 'FINISHED' && value.stage !== 9) return null;
    const chains = histories(value, rounds);
    if (!chains || !same(chains.get(`${current.roundId}:${value.visitIndex}`), value.assembly)) return null;
    for (const send of [...value.evidence.sends, ...value.evidence.rehearsalSends]) {
      if (!same(chains.get(`${send.roundId}:${send.visitIndex || 0}`), send.assembly)) return null;
    }
    if (value.phase === 'DEPART') {
      const send = value.visitIndex ? value.evidence.rehearsalSends.find(row => row.roundId === current.roundId && row.visitIndex === value.visitIndex)
        : value.evidence.sends.find(row => row.roundId === current.roundId);
      if (!send || sentenceExpressDecision(current, value.assembly)?.task !== 'send'
        || !value.departure || !finite(value.departure.travelMs, 0, 6500) || !Array.isArray(value.departure.readback)
        || value.departure.readback.length > current.readback.length
        || !value.departure.readback.every((receipt, slot) => receipt.slot === slot && departureReceiptFits(current, send, receipt, value.savedAt))) return null;
    } else if (value.departure !== null) return null;
    return structuredClone(value);
  } catch { return null; }
}

export function createSentenceExpressPracticeSession(state, context) {
  return structuredClone({ ...context, ...state, version: SENTENCE_EXPRESS_CONTENT_VERSION });
}

export function loadSentenceExpressPracticeSession(scope, difficulty, seed, journeyIndex, rounds) {
  return validateSentenceExpressPracticeSession(loadLearnGamesProgress(scope).games['sentence-express']?.practiceSession?.[difficulty],
    difficulty, seed, journeyIndex, rounds);
}

export function saveSentenceExpressPracticeSession(scope, difficulty, value) {
  const snapshot = structuredClone({ ...value, version: SENTENCE_EXPRESS_CONTENT_VERSION, difficulty });
  const current = loadLearnGamesProgress(scope), game = current.games['sentence-express'] || {};
  const next = { ...current, games: { ...current.games, 'sentence-express': { ...game,
    practiceSession: { ...(game.practiceSession || {}), [difficulty]: snapshot } } } };
  try { saveLearnGamesProgress(scope, next); return { localSaved: true, syncPending: false, snapshot }; }
  catch (error) { return { localSaved: Boolean(error.savedProgress), syncPending: Boolean(error.savedProgress), snapshot }; }
}
