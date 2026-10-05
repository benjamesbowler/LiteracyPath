import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLine } from '../../src/utils/sentenceExpressLevels.js';
import { buildSentenceExpressRounds, commitSentenceExpressChoice, commitSentenceExpressSend, commitSentenceExpressUncouple, newSentenceExpressAssembly,
  newSentenceExpressEvidence, sentenceExpressDecision } from '../../src/components/learn/games/games/sentenceExpressLearning.js';
import { createSentenceExpressPracticeSession, validateSentenceExpressPracticeSession,
  loadSentenceExpressPracticeSession, saveSentenceExpressPracticeSession } from '../../src/components/learn/games/games/sentenceExpressPracticeSession.js';

const seed = 0xffffffff;
const rounds = buildSentenceExpressRounds(buildLine('hard', seed), 'hard', seed, 0);
function state(round = rounds[0], legacy = false) {
  return createSentenceExpressPracticeSession({ stage: round.stage, mainTrainIndex: round.trainSlot, queue: [],
    currentRoundId: round.roundId, visitIndex: 0, phase: 'SHUNT', assembly: newSentenceExpressAssembly(), departure: null,
    evidence: newSentenceExpressEvidence(), supportReasons: {}, performance: { delay: 0, mistakes: 0, combo: 1, express: 0 }, savedAt: 100 },
  { difficulty: 'hard', seed, journeyIndex: 0, originStage: round.stage, originTrainIndex: round.trainSlot,
    originTrainSlot: round.stage * 3 + round.trainSlot, originRoundId: round.roundId, originAssembly: newSentenceExpressAssembly(),
    legacyResume: legacy, legacyMainComplete: false, originQueue: [] });
}
function choose(source, round, selected, responseAt) {
  const result = commitSentenceExpressChoice(source.evidence, round, source.assembly, selected, { responseAt, visitIndex: source.visitIndex, legacyResume: source.legacyResume });
  assert(result); source.assembly = result.assembly; source.evidence = result.evidence; return result;
}
const correctChoice = (round, assembly) => {
  const decision = sentenceExpressDecision(round, assembly);
  return decision.task === 'couple' ? decision.choices.find(id => round.train.words[id] === decision.expected) : decision.expected;
};

test('Express scoped zero cursor accepts the canonical full uint32 seed and retains real partial coupling and wrong/retry history', () => {
  const source = state(), round = rounds[0];
  assert(validateSentenceExpressPracticeSession(source, 'hard', seed, 0, rounds));
  choose(source, round, correctChoice(round, source.assembly), 10);
  const decision = sentenceExpressDecision(round, source.assembly);
  const wrong = decision.choices.find(selected => decision.task === 'couple' ? round.train.words[selected] !== decision.expected : selected !== decision.expected);
  if (wrong !== undefined) {
    const first = choose(source, round, wrong, 20); assert.equal(first.correct, false);
    const immutable = structuredClone(first.evidence.firstResponses);
    choose(source, round, correctChoice(round, source.assembly), 30);
    assert.deepEqual(source.evidence.firstResponses, immutable);
  }
  const restored = validateSentenceExpressPracticeSession(source, 'hard', seed, 0, rounds);
  assert(restored); assert.deepEqual(restored.assembly, source.assembly); assert.deepEqual(restored.evidence, source.evidence);
  restored.assembly.coupled.push(999); assert.notDeepEqual(restored.assembly, source.assembly);
  assert.equal(validateSentenceExpressPracticeSession(source, 'hard', seed - 1, 0, rounds), null);
});

test('Express actual Send and in-flight readback survive validation, while a forged full train or invented audio end cannot award a departure', () => {
  const source = state(), round = rounds[0]; let time = 1;
  while (sentenceExpressDecision(round, source.assembly).task !== 'send') choose(source, round, correctChoice(round, source.assembly), time++);
  const sent = commitSentenceExpressSend(source.evidence, round, source.assembly, 50);
  source.evidence = sent.evidence; source.phase = 'DEPART'; source.departure = { travelMs: 240, readback: [{ ...round.readback[0], status: 'delivered', endedAt: 70 }] };
  assert(validateSentenceExpressPracticeSession(source, 'hard', seed, 0, rounds));
  const fake = structuredClone(source); fake.evidence.firstResponses = []; fake.evidence.acceptedResponses = [];
  assert.equal(validateSentenceExpressPracticeSession(fake, 'hard', seed, 0, rounds), null, 'assembly is replayed from genuine native decisions');
  const future = structuredClone(source); future.departure.readback[0].endedAt = 101;
  assert.equal(validateSentenceExpressPracticeSession(future, 'hard', seed, 0, rounds), null);
  const missing = structuredClone(source); missing.departure.readback[0].source = '/invented.mp3';
  assert.equal(validateSentenceExpressPracticeSession(missing, 'hard', seed, 0, rounds), null);
});

test('Express actual last-car uncoupling and recoupling replay the saved assembly without rewriting first responses or adding a departure', () => {
  const source = state(), round = rounds[0];
  let time = 1;
  while (source.assembly.coupled.length < Math.min(2, round.train.words.length)) {
    choose(source, round, correctChoice(round, source.assembly), time++);
  }
  const before = structuredClone(source.evidence.firstResponses), full = structuredClone(source.assembly);
  const uncoupled = commitSentenceExpressUncouple(source.evidence, round, source.assembly, { at: 30 });
  assert(uncoupled); source.evidence = uncoupled.evidence; source.assembly = uncoupled.assembly;
  assert.equal(source.assembly.coupled.length, full.coupled.length - 1);
  assert.equal(source.evidence.motorEvents.uncouplings, 1);
  assert.deepEqual(source.evidence.firstResponses, before);
  assert.deepEqual(source.evidence.sends, []); assert.deepEqual(source.evidence.departures, []);
  assert(validateSentenceExpressPracticeSession(source, 'hard', seed, 0, rounds), 'a real uncoupled train is recoverable');
  choose(source, round, correctChoice(round, source.assembly), 40);
  assert.deepEqual(source.evidence.firstResponses, before);
  assert.deepEqual(source.assembly, full);
  assert(validateSentenceExpressPracticeSession(source, 'hard', seed, 0, rounds), 'recoupling uses an actual supported retry');
  const fabricated = structuredClone(source);
  fabricated.evidence.uncouplingReceipts[0].after.coupled = [];
  assert.equal(validateSentenceExpressPracticeSession(fabricated, 'hard', seed, 0, rounds), null);
  const inventedPop = structuredClone(source);
  inventedPop.evidence.uncouplingReceipts = []; inventedPop.evidence.motorEvents.uncouplings = 0;
  assert.equal(validateSentenceExpressPracticeSession(inventedPop, 'hard', seed, 0, rounds), null, 'recoupling cannot invent an earlier physical pop');
});

test('Express positive legacy partial-train origin keeps old mechanics explicitly without fabricating earlier canonical responses', () => {
  const source = state(rounds[10], true), round = rounds[10];
  let legacyAssembly = newSentenceExpressAssembly(), emptyEvidence = newSentenceExpressEvidence();
  for (let index = 0; index < 2; index++) {
    const choice = commitSentenceExpressChoice(emptyEvidence, round, legacyAssembly, correctChoice(round, legacyAssembly), { responseAt: index });
    legacyAssembly = choice.assembly;
  }
  source.assembly = structuredClone(legacyAssembly); source.originAssembly = structuredClone(legacyAssembly);
  assert(validateSentenceExpressPracticeSession(source, 'hard', seed, 0, rounds));
  assert.deepEqual(source.evidence.firstResponses, []); assert.equal(source.originTrainSlot, 10);
  choose(source, round, correctChoice(round, source.assembly), 20);
  assert(validateSentenceExpressPracticeSession(source, 'hard', seed, 0, rounds));
  assert(source.evidence.firstResponses[0].supportReasons.includes('legacy-resume-response-history-unavailable'));
  const fabricated = structuredClone(source); fabricated.legacyResume = false;
  assert.equal(validateSentenceExpressPracticeSession(fabricated, 'hard', seed, 0, rounds), null);
});

test('Express quota failure holds the exact practice snapshot in its existing scope, with another child and game unchanged', () => {
  const previous = globalThis.window, values = new Map(); let blocked = true;
  globalThis.window = { localStorage: { getItem: key => values.get(key) || null, setItem: (key, value) => {
    if (blocked) throw new Error('QuotaExceededError'); values.set(key, value);
  } } };
  try {
    values.set('literacy-guide-learn-games:express-a', JSON.stringify({ games: { 'letter-leap': { score: 25 } } }));
    values.set('literacy-guide-learn-games:express-b', JSON.stringify({ games: { 'sentence-express': { score: 42 } } }));
    const other = values.get('literacy-guide-learn-games:express-b'), source = state();
    const failure = saveSentenceExpressPracticeSession('express-a', 'hard', source);
    assert.equal(failure.localSaved, false); assert.deepEqual(failure.snapshot, source);
    blocked = false;
    assert.equal(saveSentenceExpressPracticeSession('express-a', 'hard', failure.snapshot).localSaved, true);
    assert.deepEqual(loadSentenceExpressPracticeSession('express-a', 'hard', seed, 0, rounds), source);
    assert.equal(JSON.parse(values.get('literacy-guide-learn-games:express-a')).games['letter-leap'].score, 25);
    assert.equal(values.get('literacy-guide-learn-games:express-b'), other);
  } finally { globalThis.window = previous; }
});
