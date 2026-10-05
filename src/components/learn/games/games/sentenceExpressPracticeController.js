import { buildLine } from '../../../../utils/sentenceExpressLevels.js';
import { SENTENCE_EXPRESS_CONTENT_VERSION } from '../../../../data/arcadeContentVersions.js';
import { expressSessionKey, loadExpressSnapshot } from './sentenceExpressSession.js';
import { buildSentenceExpressRounds, commitSentenceExpressChoice, commitSentenceExpressSend, commitSentenceExpressDeparture,
  commitSentenceExpressUncouple, newSentenceExpressAssembly, newSentenceExpressEvidence,
  SENTENCE_EXPRESS_CONSTRUCT, validSentenceExpressAssembly } from './sentenceExpressLearning.js';
import { createSentenceExpressPracticeSession, loadSentenceExpressPracticeSession, saveSentenceExpressPracticeSession } from './sentenceExpressPracticeSession.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
const assemblyOf = state => ({ coupled: Array.isArray(state.coupled) ? [...state.coupled] : null, engineChoice: state.engineChoice,
  cabooseChoice: state.cabooseChoice, rustyFixed: state.rustyFixed, gapFilled: state.gapFilled });

// This seam owns receipts and local persistence, not train arrangement or the
// departure clock. The DOM yard supplies only its actual current assembly,
// actual choice input, explicit Send and settled travel/readback observations.
export function createSentenceExpressPracticeController({ difficulty, seed, journeyIndex = 0,
  startLevel = 0, scope = 'default', resumeEligible = false, now = () => Date.now() }) {
  const line = buildLine(difficulty, seed), rounds = buildSentenceExpressRounds(line, difficulty, seed, journeyIndex);
  const held = loadSentenceExpressPracticeSession(scope, difficulty, seed, journeyIndex, rounds);
  const start = clamp(Number(startLevel) || 0, 0, 9), oldKey = expressSessionKey(scope, difficulty);
  let old = !held && resumeEligible ? loadExpressSnapshot(oldKey, start) : null;
  const oldQueue = old?.queue?.map(id => rounds.find(round => round.stage === start && round.train.id === id)?.roundId);
  const oldMain = Number.isSafeInteger(old?.trainIndex) ? old.trainIndex : 0;
  const freshRound = rounds.find(round => round.stage === start && round.trainSlot === 0);
  const firstRound = rounds.find(round => round.stage === start && round.trainSlot === Math.min(oldMain, 2));
  const oldCurrent = oldMain >= 3 && oldQueue?.length ? rounds.find(round => round.roundId === oldQueue[0]) : firstRound;
  if (old && (!oldCurrent || !oldQueue || oldQueue.some(id => !id) || oldQueue.length > 3
    || new Set(oldQueue).size !== oldQueue.length || oldMain < 0 || oldMain > 183
    || !integer(old.trainIndex, 0, 183)
    || !integer(old.delay, 0, 100000) || !integer(old.mistakes, 0, 100000)
    || !integer(old.combo, 1, 3) || !integer(old.express, 0, 183)
    || !['shunt', 'depart'].includes(old.phase) || !validSentenceExpressAssembly(oldCurrent, assemblyOf(old)))) old = null;
  const initialRound = held ? rounds.find(round => round.roundId === held.currentRoundId) : old ? oldCurrent : freshRound;
  const initialAssembly = held?.assembly || (old ? assemblyOf(old) : newSentenceExpressAssembly());
  const oldRunKey = `${oldKey}:run`;
  let oldRun = !held && resumeEligible ? loadExpressSnapshot(oldRunKey, start)?.run : null;
  if (oldRun && (!integer(oldRun.baseStart, 0, start) || !integer(oldRun.levelsDone, 0, 10)
    || oldRun.baseStart + oldRun.levelsDone !== start || !integer(oldRun.starSum, 0, oldRun.levelsDone * 3)
    || !integer(oldRun.score, oldRun.starSum * 10, 100000) || (oldRun.score - oldRun.starSum * 10) % 5
    || !integer(oldRun.words, oldRun.levelsDone ? oldRun.levelsDone : 0, 1000)
    || !oldRun.levelsDone && (oldRun.words || oldRun.score || oldRun.starSum))) oldRun = null;
  const emptyTotals = { score: 0, starSum: 0, levelsDone: 0, words: 0, baseStart: start };
  const origin = held ? {
    difficulty, seed, journeyIndex, originStage: held.originStage, originTrainIndex: held.originTrainIndex,
    originTrainSlot: held.originTrainSlot, originRoundId: held.originRoundId, originAssembly: structuredClone(held.originAssembly),
    legacyResume: held.legacyResume, legacyMainComplete: held.legacyMainComplete, originQueue: [...held.originQueue],
    legacyRunTotals: structuredClone(held.legacyRunTotals || { ...emptyTotals, baseStart: held.originStage })
  } : { difficulty, seed, journeyIndex, originStage: start, originTrainIndex: initialRound.trainSlot,
    originTrainSlot: start * 3 + initialRound.trainSlot, originRoundId: initialRound.roundId,
    originAssembly: structuredClone(initialAssembly), legacyResume: Boolean(old) || start > 0,
    legacyMainComplete: Boolean(old && oldMain >= 3), originQueue: old ? [...oldQueue] : [],
    legacyRunTotals: structuredClone(oldRun || emptyTotals) };
  let evidence = held?.evidence || newSentenceExpressEvidence(), supportReasons = held?.supportReasons || {};
  let view = held ? structuredClone(held) : {
    stage: start, mainTrainIndex: old ? oldMain : 0, queue: old ? [...oldQueue] : [], currentRoundId: initialRound.roundId,
    visitIndex: 0, phase: 'SHUNT', assembly: initialAssembly, departure: null,
    performance: { delay: old?.delay || 0, mistakes: old?.mistakes || 0, combo: old?.combo || 1, express: old?.express || 0 },
    stageAwards: [], savedAt: now()
  };
  let pending = null, disposed = false;
  const current = () => rounds.find(round => round.roundId === view.currentRoundId);
  const snapshot = () => createSentenceExpressPracticeSession({ ...view, evidence, supportReasons, savedAt: now() }, origin);
  const runTotals = () => (view.stageAwards || []).reduce((total, row) => ({ ...total,
    score: total.score + row.score, starSum: total.starSum + row.stars,
    levelsDone: total.levelsDone + 1, words: total.words + row.words }), structuredClone(origin.legacyRunTotals));
  return {
    line, rounds, oldKey, oldRunKey, resumed: Boolean(held || old), migrationPending: Boolean(old || oldRun),
    initial: {
      levelIndex: view.stage, trainIndex: view.mainTrainIndex, queue: view.queue.map(id => rounds.find(round => round.roundId === id).train.id),
      trainId: initialRound.train.id,
      phase: view.phase.toLowerCase(), ...structuredClone(view.assembly), ...view.performance,
      departure: structuredClone(view.departure), stageAwards: structuredClone(view.stageAwards || [])
    },
    sync(state) {
      if (disposed || pending) return false;
      const round = rounds.find(candidate => candidate.stage === state.levelIndex && candidate.train.id === state.trainId);
      if (!round || !validSentenceExpressAssembly(round, assemblyOf(state))) return false;
      const queue = state.queue.map(train => rounds.find(candidate => candidate.stage === state.levelIndex && candidate.train.id === train.id)?.roundId);
      if (queue.some(id => !id)) return false;
      const visitIndex = evidence.sends.some(row => row.roundId === round.roundId) && state.phase === 'shunt'
        ? 1 + evidence.rehearsalSends.filter(row => row.roundId === round.roundId).length
        : view.currentRoundId === round.roundId ? view.visitIndex : 0;
      view = { ...view, stage: state.levelIndex, mainTrainIndex: state.trainIndex, queue,
        currentRoundId: round.roundId, visitIndex, phase: state.finished ? 'FINISHED' : state.phase.toUpperCase(),
        assembly: assemblyOf(state), departure: state.phase === 'depart' ? view.departure : null,
        performance: { delay: state.delay, mistakes: state.mistakes, combo: state.combo, express: state.express } };
      return true;
    },
    choose(selected) {
      if (disposed || pending || view.phase !== 'SHUNT') return null;
      const result = commitSentenceExpressChoice(evidence, current(), view.assembly, selected, { responseAt: now(),
        visitIndex: view.visitIndex, legacyResume: origin.legacyResume, supportReasons: supportReasons[view.currentRoundId] || [] });
      if (!result) return null;
      evidence = result.evidence; view.assembly = result.assembly;
      return result;
    },
    uncouple() {
      if (disposed || pending || view.phase !== 'SHUNT') return null;
      const result = commitSentenceExpressUncouple(evidence, current(), view.assembly, { at: now(), visitIndex: view.visitIndex });
      if (!result) return null;
      evidence = result.evidence; view.assembly = result.assembly; return result;
    },
    send() {
      if (disposed || pending || view.phase !== 'SHUNT') return null;
      const result = commitSentenceExpressSend(evidence, current(), view.assembly, now(), view.visitIndex);
      if (!result) return null;
      evidence = result.evidence; view.phase = 'DEPART'; view.departure = { travelMs: 0, readback: [] }; return result;
    },
    observeDeparture(travelMs, readback) {
      if (disposed || pending || view.phase !== 'DEPART') return false;
      view.departure = { travelMs: clamp(travelMs, 0, 6500), readback: structuredClone(readback) }; return true;
    },
    settleDeparture({ travelComplete, readback }) {
      if (disposed || pending || view.phase !== 'DEPART') return false;
      const existing = (view.visitIndex ? evidence.rehearsalDepartures : evidence.departures)
        .find(row => row.roundId === view.currentRoundId && (!view.visitIndex || row.visitIndex === view.visitIndex));
      // A reload may retain the actual settled journey before its next-train
      // snapshot was written. Continue that same transition without emitting
      // a second departure or treating its existing receipts as new audio.
      if (existing) return Boolean(travelComplete && JSON.stringify(existing.readback) === JSON.stringify(readback));
      const result = commitSentenceExpressDeparture(evidence, current(), { travelComplete, readback,
        completedAt: now(), visitIndex: view.visitIndex });
      if (!result) return false;
      evidence = result; return true;
    },
    awardStage({ stars, mistakes, express }) {
      if (disposed || pending || view.phase !== 'TALLY' || view.stageAwards?.some(row => row.stage === view.stage)) return null;
      const actual = evidence.departures.filter(row => rounds.find(round => round.roundId === row.roundId)?.stage === view.stage);
      if (!actual.length) return null;
      const words = actual.reduce((total, row) => total + rounds.find(round => round.roundId === row.roundId).readback.length, 0);
      const row = { stage: view.stage, stars, mistakes, express, words, score: stars * 10 + express * 5, reportedAt: now() };
      view.stageAwards = [...(view.stageAwards || []), row]; return structuredClone(row);
    },
    markSupported(reason) {
      if (disposed || pending || typeof reason !== 'string' || !reason || reason.length > 80) return;
      supportReasons[view.currentRoundId] = [...new Set([...(supportReasons[view.currentRoundId] || []), reason])].slice(-24);
    },
    persist() {
      if (disposed) return { localSaved: false, snapshot: pending };
      const receipt = saveSentenceExpressPracticeSession(scope, difficulty, pending || snapshot());
      pending = receipt.localSaved ? null : receipt.snapshot;
      return receipt;
    },
    isHeld: () => Boolean(pending),
    inspect({ history = false } = {}) {
      const metadata = { contentVersion: SENTENCE_EXPRESS_CONTENT_VERSION, construct: SENTENCE_EXPRESS_CONSTRUCT,
        practiceOnly: true, sessionSeed: seed, journeyIndex, ...structuredClone(origin),
        nativeV2ChoiceCount: evidence.firstResponses.length + evidence.assistedRetries.length,
        nativeV2DepartureCount: evidence.departures.length };
      return structuredClone({ held: Boolean(pending), disposed, phase: view.phase, stage: view.stage,
        roundId: view.currentRoundId, visitIndex: view.visitIndex, assembly: view.assembly, departure: view.departure,
        stageAwards: view.stageAwards || [], metadata, ...(history ? { evidence } : {}) });
    },
    completionEvidence: () => structuredClone({ contentVersion: SENTENCE_EXPRESS_CONTENT_VERSION, construct: SENTENCE_EXPRESS_CONSTRUCT,
      practiceOnly: true, sessionSeed: seed, journeyIndex, originStage: origin.originStage,
      originTrainIndex: origin.originTrainIndex, originTrainSlot: origin.originTrainSlot, legacyResume: origin.legacyResume,
      legacyMainComplete: origin.legacyMainComplete, originQueue: origin.originQueue,
      legacyRunTotals: origin.legacyRunTotals,
      nativeV2ChoiceCount: evidence.firstResponses.length + evidence.assistedRetries.length,
      nativeV2DepartureCount: evidence.departures.length, ...evidence }),
    currentRound: () => structuredClone(current()),
    runTotals,
    dispose() { disposed = true; }
  };
}
