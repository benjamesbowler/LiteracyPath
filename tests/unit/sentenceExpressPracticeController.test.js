import test from 'node:test';
import assert from 'node:assert/strict';
import { createSentenceExpressPracticeController } from '../../src/components/learn/games/games/sentenceExpressPracticeController.js';
import { sentenceExpressDecision, newSentenceExpressAssembly, applySentenceExpressChoice } from '../../src/components/learn/games/games/sentenceExpressLearning.js';
import { loadSentenceExpressPracticeSession } from '../../src/components/learn/games/games/sentenceExpressPracticeSession.js';

function localState() {
  const values = new Map(); let quota = false;
  const localStorage = {
    getItem: key => values.get(key) || null, removeItem: key => values.delete(key),
    setItem(key, value) { if (quota) throw new DOMException('full', 'QuotaExceededError'); values.set(key, value); }
  };
  return { values, block: value => { quota = value; }, window: { localStorage }, localStorage };
}
function view(owner) {
  const initial = owner.initial, round = owner.rounds.find(row => row.stage === initial.levelIndex && row.train.id === owner.line[initial.levelIndex].trains[0].id);
  return { ...initial, trainId: round.train.id, finished: false,
    queue: initial.queue.map(id => owner.line[initial.levelIndex].trains.find(train => train.id === id)) };
}
function nextChoice(round, assembly) {
  const decision = sentenceExpressDecision(round, assembly);
  return decision.task === 'couple' ? decision.choices.find(id => round.train.words[id] === decision.expected) : decision.expected;
}

test('Express controller preserves one explicit Send and actual in-flight receipts through its existing scoped session', () => {
  const previous = globalThis.window, storage = localState(); globalThis.window = storage.window;
  let clock = 1;
  try {
    const owner = createSentenceExpressPracticeController({ difficulty: 'hard', seed: 0xffffffff, scope: 'express-controller', now: () => clock++ });
    const physical = view(owner), round = owner.rounds[0];
    assert(owner.sync(physical)); assert.equal(owner.persist().localSaved, true);
    assert.deepEqual(owner.inspect({ history: true }).evidence.firstResponses, []);
    while (sentenceExpressDecision(round, owner.inspect().assembly).task !== 'send') {
      const result = owner.choose(nextChoice(round, owner.inspect().assembly)); assert(result);
      Object.assign(physical, result.assembly); assert(owner.sync(physical)); assert.equal(owner.persist().localSaved, true);
    }
    assert.equal(owner.inspect().phase, 'SHUNT'); assert.deepEqual(owner.inspect({ history: true }).evidence.sends, []);
    assert(owner.send()); assert.equal(owner.send(), null); physical.phase = 'depart'; assert(owner.sync(physical));
    const receipt = { ...round.readback[0], status: 'delivered', endedAt: clock++ };
    assert(owner.observeDeparture(1230, [receipt])); assert.equal(owner.persist().localSaved, true);
    const restored = loadSentenceExpressPracticeSession('express-controller', 'hard', 0xffffffff, 0, owner.rounds);
    assert(restored); assert.equal(restored.departure.travelMs, 1230); assert.deepEqual(restored.departure.readback, [receipt]);
    const reopened = createSentenceExpressPracticeController({ difficulty: 'hard', seed: 0xffffffff, scope: 'express-controller', now: () => clock++ });
    assert.equal(reopened.initial.phase, 'depart'); assert.deepEqual(reopened.initial.departure.readback, [receipt]);
    assert.equal(reopened.inspect().metadata.nativeV2DepartureCount, 0, 'an in-flight train never becomes a completed journey');
    owner.dispose(); reopened.dispose();
  } finally { globalThis.window = previous; }
});

test('Express controller quota holds its exact current assembly/evidence and rejects further yard input until the same snapshot saves', () => {
  const previous = globalThis.window, storage = localState(); globalThis.window = storage.window;
  let clock = 10;
  try {
    const owner = createSentenceExpressPracticeController({ difficulty: 'easy', seed: 3, scope: 'express-quota', now: () => clock++ });
    const physical = view(owner), round = owner.rounds[0]; owner.sync(physical);
    const result = owner.choose(nextChoice(round, owner.inspect().assembly)); Object.assign(physical, result.assembly); owner.sync(physical);
    storage.block(true); const failure = owner.persist(); assert.equal(failure.localSaved, false);
    const held = structuredClone(failure.snapshot); assert.equal(owner.isHeld(), true);
    assert.equal(owner.choose(nextChoice(round, owner.inspect().assembly)), null); assert.equal(owner.send(), null);
    clock += 1000; storage.block(false); const retry = owner.persist();
    assert.equal(retry.localSaved, true); assert.deepEqual(retry.snapshot, held, 'retry cannot replace a held native snapshot with newer state/time');
    assert.equal(owner.isHeld(), false); assert.deepEqual(owner.inspect({ history: true }).evidence.firstResponses, result.evidence.firstResponses);
    owner.dispose();
  } finally { globalThis.window = previous; }
});

test('Express legacy origin keeps the real already-coupled train as support, with no invented earlier native rows', () => {
  const previous = globalThis.window, previousLocal = globalThis.localStorage, storage = localState();
  globalThis.window = storage.window; globalThis.localStorage = storage.localStorage;
  try {
    const preview = createSentenceExpressPracticeController({ difficulty: 'easy', seed: 3, startLevel: 3, scope: 'express-legacy' });
    const original = preview.initial;
    storage.values.set(preview.oldKey, JSON.stringify({ v: 1, levelIndex: 3, trainIndex: 0, phase: 'shunt', queue: [],
      ...original, coupled: [0], engineChoice: preview.rounds[9].train.engine.correct,
      cabooseChoice: null, rustyFixed: false, gapFilled: false }));
    preview.dispose();
    const owner = createSentenceExpressPracticeController({ difficulty: 'easy', seed: 3, startLevel: 3, scope: 'express-legacy', resumeEligible: true });
    const result = owner.inspect({ history: true }); assert.equal(result.metadata.legacyResume, true);
    assert.equal(result.metadata.originStage, 3); assert.equal(result.metadata.originTrainSlot, 9);
    assert.deepEqual(result.evidence.firstResponses, []); assert.deepEqual(result.evidence.departures, []);
    assert.deepEqual(owner.initial.coupled, [0]); assert.equal(owner.persist().localSaved, true);
    assert(loadSentenceExpressPracticeSession('express-legacy', 'easy', 3, 0, owner.rounds));
    owner.dispose();
  } finally { globalThis.window = previous; globalThis.localStorage = previousLocal; }
});

test('Express rejects a corrupt legacy performance snapshot rather than carrying it into a fresh train', () => {
  const previous = globalThis.window, previousLocal = globalThis.localStorage, storage = localState();
  globalThis.window = storage.window; globalThis.localStorage = storage.localStorage;
  try {
    const preview = createSentenceExpressPracticeController({ difficulty: 'easy', seed: 3, scope: 'express-bad-old' });
    const original = preview.initial;
    storage.values.set(preview.oldKey, JSON.stringify({ ...original, v: 1, delay: -1 }));
    preview.dispose();
    const owner = createSentenceExpressPracticeController({ difficulty: 'easy', seed: 3, scope: 'express-bad-old', resumeEligible: true });
    assert.equal(owner.resumed, false); assert.equal(owner.initial.delay, 0);
    assert.deepEqual(owner.initial.coupled, []); assert.equal(owner.inspect().metadata.legacyResume, false);
    owner.dispose();
  } finally { globalThis.window = previous; globalThis.localStorage = previousLocal; }
});

test('Express migrates actual earlier sidecar totals as labelled legacy aggregates without manufacturing old Send or response rows', () => {
  const previous = globalThis.window, previousLocal = globalThis.localStorage, storage = localState();
  globalThis.window = storage.window; globalThis.localStorage = storage.localStorage;
  try {
    const preview = createSentenceExpressPracticeController({ difficulty: 'easy', seed: 3, startLevel: 3, scope: 'express-old-totals' });
    const words = preview.line.slice(0, 3).reduce((sum, level) => sum + level.trains.reduce((count, train) => count + train.words.length, 0), 0);
    const oldTotals = { score: 75, starSum: 6, levelsDone: 3, words, baseStart: 0 };
    storage.values.set(preview.oldKey, JSON.stringify({ ...preview.initial, v: 1 }));
    storage.values.set(preview.oldRunKey, JSON.stringify({ v: 1, levelIndex: 3, run: oldTotals })); preview.dispose();
    const owner = createSentenceExpressPracticeController({ difficulty: 'easy', seed: 3, startLevel: 3,
      scope: 'express-old-totals', resumeEligible: true });
    assert.deepEqual(owner.runTotals(), oldTotals); assert.equal(owner.persist().localSaved, true);
    assert.deepEqual(owner.completionEvidence().legacyRunTotals, oldTotals);
    assert.equal(owner.completionEvidence().legacyResume, true);
    assert.equal(owner.completionEvidence().nativeV2ChoiceCount, 0); assert.equal(owner.completionEvidence().nativeV2DepartureCount, 0);
    assert.deepEqual(owner.completionEvidence().firstResponses, []); assert.deepEqual(owner.completionEvidence().sends, []);
    assert.deepEqual(loadSentenceExpressPracticeSession('express-old-totals', 'easy', 3, 0, owner.rounds).legacyRunTotals, oldTotals);
    owner.dispose();
  } finally { globalThis.window = previous; globalThis.localStorage = previousLocal; }
});

test('A real assembled legacy final train can finish with zero new choices and one actual canonical Send and departure', () => {
  const previous = globalThis.window, previousLocal = globalThis.localStorage, storage = localState();
  globalThis.window = storage.window; globalThis.localStorage = storage.localStorage;
  let clock = 100;
  try {
    const preview = createSentenceExpressPracticeController({ difficulty: 'hard', seed: 0xffffffff, startLevel: 9,
      scope: 'express-final-legacy', now: () => clock++ });
    const round = preview.rounds.find(row => row.stage === 9 && row.trainSlot === 2);
    let assembly = newSentenceExpressAssembly();
    while (sentenceExpressDecision(round, assembly).task !== 'send') {
      assembly = applySentenceExpressChoice(round, assembly, nextChoice(round, assembly)).assembly;
    }
    storage.values.set(preview.oldKey, JSON.stringify({ ...preview.initial, v: 1, levelIndex: 9,
      trainIndex: 2, phase: 'shunt', queue: [], ...assembly }));
    preview.dispose();
    const owner = createSentenceExpressPracticeController({ difficulty: 'hard', seed: 0xffffffff, startLevel: 9,
      scope: 'express-final-legacy', resumeEligible: true, now: () => clock++ });
    const physical = { ...owner.initial, queue: [], finished: false };
    assert.equal(owner.currentRound().roundId, round.roundId);
    assert.equal(owner.inspect().metadata.originTrainSlot, 29); assert.equal(owner.inspect().metadata.legacyResume, true);
    assert.equal(owner.persist().localSaved, true);
    assert.equal(owner.completionEvidence().nativeV2ChoiceCount, 0);
    assert.equal(owner.completionEvidence().nativeV2DepartureCount, 0, 'Unfinished checkpoints preserve a true zero count');
    assert(owner.send()); physical.phase = 'depart'; assert(owner.sync(physical));
    const readback = round.readback.map(row => ({ ...row, status: 'sound-off', endedAt: null }));
    assert(owner.observeDeparture(6500, readback)); assert(owner.settleDeparture({ travelComplete: true, readback }));
    Object.assign(physical, { trainIndex: 3, phase: 'tally' }); assert(owner.sync(physical));
    assert(owner.awardStage({ stars: 3, mistakes: 0, express: 0 }));
    physical.phase = 'finished'; physical.finished = true; assert(owner.sync(physical));
    assert.equal(owner.persist().localSaved, true);
    const final = loadSentenceExpressPracticeSession('express-final-legacy', 'hard', 0xffffffff, 0, owner.rounds);
    assert(final); assert.equal(final.phase, 'FINISHED');
    const evidence = owner.completionEvidence();
    assert.equal(evidence.nativeV2ChoiceCount, 0); assert.equal(evidence.nativeV2DepartureCount, 1);
    assert.equal(evidence.sends.length, 1); assert.deepEqual(evidence.firstResponses, []); assert.deepEqual(evidence.assistedRetries, []);
    assert.equal(evidence.departures[0].roundId, round.roundId); assert.equal(evidence.legacyResume, true);
    const unfinished = structuredClone(final); unfinished.evidence.departures = []; unfinished.stageAwards = [];
    storage.values.set('literacy-guide-learn-games:express-final-legacy', JSON.stringify({ games: {
      'sentence-express': { practiceSession: { hard: unfinished } } } }));
    assert.equal(loadSentenceExpressPracticeSession('express-final-legacy', 'hard', 0xffffffff, 0, owner.rounds), null,
      'A finished save cannot manufacture completion without the actual native departure');
    owner.dispose();
  } finally { globalThis.window = previous; globalThis.localStorage = previousLocal; }
});

test('Express preserves a real three-train stage with wrong choices, uncoupling and catch-up without duplicating canonical Send or words', () => {
  const previous = globalThis.window, storage = localState(); globalThis.window = storage.window;
  let clock = 100;
  try {
    const owner = createSentenceExpressPracticeController({ difficulty: 'easy', seed: 3, scope: 'express-rehearsal', now: () => clock++ });
    const physical = view(owner), stageRounds = owner.rounds.filter(round => round.stage === 0);
    let mainIndex = 0, queue = [], round = stageRounds[0], uncoupled = false;
    const durable = () => {
      assert(owner.sync(physical)); assert.equal(owner.persist().localSaved, true);
      assert(loadSentenceExpressPracticeSession('express-rehearsal', 'easy', 3, 0, owner.rounds));
    };
    durable();
    for (let visit = 0; visit < 4; visit++) {
      if (visit === 0) {
        const decision = sentenceExpressDecision(round, owner.inspect().assembly);
        const wrong = decision.choices.find(id => round.train.words[id] !== decision.expected);
        assert.notEqual(wrong, undefined);
        for (let attempt = 0; attempt < 3; attempt++) {
          assert.equal(owner.choose(wrong).correct, false); physical.delay++; physical.mistakes++; physical.combo = 1; durable();
        }
      }
      while (sentenceExpressDecision(round, owner.inspect().assembly).task !== 'send') {
        const result = owner.choose(nextChoice(round, owner.inspect().assembly)); assert(result?.correct);
        Object.assign(physical, result.assembly); durable();
        if (!uncoupled && result.assembly.coupled.length === 2) {
          const firstRows = structuredClone(owner.inspect({ history: true }).evidence.firstResponses);
          const popped = owner.uncouple(); assert(popped); Object.assign(physical, popped.assembly); durable();
          assert.deepEqual(owner.inspect({ history: true }).evidence.firstResponses, firstRows); uncoupled = true;
        }
      }
      assert(owner.send()); physical.phase = 'depart';
      if (!physical.delay) { physical.express++; physical.combo = Math.min(3, physical.combo + 1); }
      durable();
      const receipts = round.readback.map(row => ({ ...row, status: 'sound-off', endedAt: null }));
      assert(owner.observeDeparture(6500, receipts)); assert(owner.settleDeparture({ travelComplete: true, readback: receipts }));
      assert(owner.settleDeparture({ travelComplete: true, readback: receipts }), 'a settled actual journey is idempotent at a reload boundary');
      durable();
      queue = physical.delay >= 3 && !queue.includes(round) ? [...queue, round] : queue.filter(item => item !== round);
      mainIndex++;
      if (mainIndex < 3 || queue.length) {
        round = mainIndex < 3 ? stageRounds[mainIndex] : queue[0];
        Object.assign(physical, { trainIndex: mainIndex, queue: queue.map(item => item.train), trainId: round.train.id,
          phase: 'shunt', coupled: [], engineChoice: null, cabooseChoice: null, rustyFixed: false, gapFilled: false, delay: 0 });
      } else Object.assign(physical, { trainIndex: mainIndex, queue: [], phase: 'tally' });
      durable();
    }
    const evidence = owner.inspect({ history: true }).evidence;
    assert.equal(evidence.sends.length, 3); assert.equal(evidence.departures.length, 3);
    assert.equal(evidence.rehearsalSends.length, 1); assert.equal(evidence.rehearsalDepartures.length, 1);
    assert.equal(evidence.motorEvents.uncouplings, 1);
    assert(evidence.assistedRetries.some(row => row.supportReasons.includes('catch-up-rehearsal')));
    const award = owner.awardStage({ stars: 2, mistakes: physical.mistakes, express: physical.express }); assert(award);
    assert.equal(award.words, stageRounds.reduce((sum, item) => sum + item.readback.length, 0));
    assert.equal(owner.awardStage({ stars: 2, mistakes: physical.mistakes, express: physical.express }), null);
    assert.equal(owner.persist().localSaved, true);
    const restored = createSentenceExpressPracticeController({ difficulty: 'easy', seed: 3, scope: 'express-rehearsal', now: () => clock++ });
    assert.deepEqual(restored.runTotals(), owner.runTotals()); assert.equal(restored.initial.phase, 'tally');
    assert.deepEqual(restored.inspect({ history: true }).evidence, evidence);
    owner.dispose(); restored.dispose();
  } finally { globalThis.window = previous; }
});
