import test from 'node:test';
import assert from 'node:assert/strict';
import { SOUND_BEAT_CONTENT_VERSION, LETTER_LEAP_CONTENT_VERSION, SOUND_RACER_CONTENT_VERSION, SPELL_SKATE_CONTENT_VERSION, SOUNDKEYS_CONTENT_VERSION, RHYME_POP_CONTENT_VERSION, REEL_READ_CONTENT_VERSION, WORD_CLIMB_CONTENT_VERSION, SENTENCE_EXPRESS_CONTENT_VERSION, WORD_BRIDGE_CONTENT_VERSION, WORD_BRIDGE_LEGACY_CONTENT_VERSION, ROCKET_RUN_CONTENT_VERSION } from '../../src/data/arcadeContentVersions.js';
import { readPlayerCheckpoint } from '../../src/components/learn/games/arcadeLearningContext.js';
import { applyCheckpoint, readCheckpoint } from '../../src/utils/gameCheckpoints.js';
import { saveLearnGameResult, saveGameCheckpoint } from '../../src/utils/learnGamesProgress.js';
import { sanitizeCloudProgressPayload, computeHydratedValue } from '../../src/utils/progressMerge.js';
import { clearProgressSyncSession, configureProgressSync } from '../../src/utils/progressSync.js';
import { readProgressQueueRecords } from '../../src/utils/progressQueue.js';
import { rocketRunV2Outing } from '../../src/utils/rocketRunV2Rounds.js';
import { newRocketRunEvidence, rocketRunCatchResponse, completeRocketRunRound, rocketRunLanguageResult } from '../../src/utils/rocketRunEvidence.js';
import { getPreferredPhonemeAudioPath } from '../../src/data/phonemeAudioBank.js';
import { getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';

function rocketBrowser(t, scope) {
  const values = new Map(), previousWindow = globalThis.window;
  const storage = { get length() { return values.size; }, key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const window = new EventTarget();
  Object.assign(window, { localStorage: storage, setTimeout: () => 1, clearTimeout() {} });
  globalThis.window = window;
  t.after(() => { clearProgressSyncSession(); globalThis.window = previousWindow; });
  configureProgressSync({ mode: 'student', studentId: scope, token: 'unit-only', client: { call: async () => ({ data: { ok: true } }) } });
  return storage;
}

// These are real producer rows built by the current seeded response writer.
// The unit receipts model its real onEnd shape; this test does not claim that
// a browser/device recording was played or heard.
function rocketCompletion(seed, difficulty, originRound, journeyIndex = 2) {
  const plans = rocketRunV2Outing(difficulty, seed);
  let evidence = newRocketRunEvidence(), at = 1;
  for (const plan of plans.slice(originRound)) {
    const receipt = { round: plan.round, target: plan.target, kind: 'target-phoneme',
      src: getPreferredPhonemeAudioPath(plan.target), at: at++ };
    evidence.audioReceipts.push(receipt);
    let caughtIds = [];
    const respond = trial => {
      const wordStarted = trial.correct && !caughtIds.length ? { round: plan.round, trialId: trial.id,
        flightId: 1, word: trial.word, kind: 'approach-word', src: getLedaWordAudioPath(trial.word), at: at++ } : null;
      const wordReceipt = wordStarted && { ...wordStarted, at: at++ };
      if (wordStarted) evidence.audioStarts.push(wordStarted);
      if (wordReceipt) evidence.audioReceipts.push(wordReceipt);
      const response = rocketRunCatchResponse(evidence, plan, { trialId: trial.id, caughtIds, at: at++,
        source: 'pointer', targetReceipt: receipt, wordReceipt, wordStarted, presentedChoices: [trial], difficulty });
      assert.ok(response.row); evidence = response.evidence; caughtIds = response.caughtIds;
    };
    respond(plan.choices.find(choice => !choice.correct));
    for (const trial of plan.choices.filter(choice => choice.correct)) respond(trial);
    evidence = completeRocketRunRound(evidence, plan, caughtIds, at++);
  }
  const result = rocketRunLanguageResult(evidence);
  return { result, payload: { contentVersion: ROCKET_RUN_CONTENT_VERSION, construct: 'heard-onset-print-word-selection',
    sessionSeed: seed, journeyIndex, originRound, practiceOnly: true,
    formalAssessment: false, masteryClaim: false, motorCreatesEvidence: false,
    firstResponses: evidence.firstResponses, assistedRetries: evidence.assistedRetries, completions: evidence.completions,
    wordsCompleted: result.correct, totalRequired: plans.slice(originRound).reduce((sum, plan) => sum + plan.needed, 0),
    audioReceipts: evidence.audioReceipts, motor: { hits: 3, misses: 7, retries: 2, passages: 4 } } };
}

test('Rocket saves the actual unsigned host seed, held-zero history and chapter without replacing other checkpoints', async t => {
  const scope = 'rocket-host-checkpoint-unit', storage = rocketBrowser(t, scope);
  const { readFileSync } = await import('node:fs');
  const { parse } = await import('@babel/parser');
  const source = readFileSync('src/components/learn/games/GamePlayer.jsx', 'utf8');
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const find = (node, predicate) => {
    if (!node || typeof node !== 'object') return null;
    if (predicate(node)) return node;
    for (const value of Object.values(node)) for (const child of Array.isArray(value) ? value : [value]) {
      const match = find(child, predicate); if (match) return match;
    }
    return null;
  };
  const seedInitializer = find(ast, node => node.type === 'VariableDeclarator'
    && node.id?.type === 'ArrayPattern' && node.id.elements[0]?.name === 'sessionSeed').init.arguments[0];
  const checkpointHandler = find(ast, node => node.type === 'VariableDeclarator' && node.id?.name === 'handleCheckpoint').init.arguments[0];
  for (const seed of [0, 0xffffffff]) {
    const held = { seed, caughtIds: ['actual-prefix'], wrong: ['original-wrong'], privateLocal: true };
    storage.setItem(`literacy-guide-learn-games:${scope}`, JSON.stringify({ games: {
      'rocket-run': { practiceSession: { hard: held }, checkpoints: { hard: { level: 0, totalLevels: 10, sessionSeed: seed, chapter: 11 } } },
      'word-climb': { checkpoints: { hard: { level: 4, totalLevels: 10, sessionSeed: 17, chapter: 2 } } }
    } }));
    const loadLearnGamesProgress = () => JSON.parse(storage.getItem(`literacy-guide-learn-games:${scope}`));
    const hostSeed = Function('loadLearnGamesProgress', 'progressScopeKey', 'game', 'initialDifficulty', 'newGameSeed',
      `return (${source.slice(seedInitializer.start, seedInitializer.end)})();`)(loadLearnGamesProgress, scope, { id: 'rocket-run' }, 'hard',
      () => { throw new Error('Continue must retain the actual seeded bank'); });
    assert.equal(hostSeed, seed);
    const makeHandle = Function('pendingResultRef', 'savedResultRef', 'saveGameCheckpoint', 'progressScopeKey', 'game', 'difficulty', 'sessionSeed', 'journey',
      `return (${source.slice(checkpointHandler.start, checkpointHandler.end)});`);
    const handle = makeHandle({ current: null }, { current: null }, saveGameCheckpoint, scope, { id: 'rocket-run' }, 'hard', hostSeed, { index: 11 });
    handle(0, 10);
    const saved = loadLearnGamesProgress();
    assert.deepEqual(readPlayerCheckpoint(saved.games, 'rocket-run', 'hard'), { level: 0, totalLevels: 10, sessionSeed: seed, chapter: 11 });
    assert.deepEqual(saved.games['rocket-run'].practiceSession.hard, held);
    assert.equal(saved.games['word-climb'].checkpoints.hard.sessionSeed, 17);
    for (const [level, total, invalidSeed, chapter] of [[0, 10, 0x100000000, 11], [0, 10, -1, 11],
      [10, 10, seed, 11], [0, 9, seed, 11], [0, 10, seed, 12], [0, 10, '3', 11]]) {
      const before = storage.getItem(`literacy-guide-learn-games:${scope}`);
      saveGameCheckpoint(scope, 'rocket-run', 'hard', level, total, invalidSeed, chapter);
      assert.equal(storage.getItem(`literacy-guide-learn-games:${scope}`), before, 'invalid Rocket checkpoint never replaces the real bank');
    }
  }
  const legacy = { 'rocket-run': { checkpoints: { hard: { level: 4, totalLevels: 10, chapter: 2 } } } };
  assert.deepEqual(readPlayerCheckpoint(legacy, 'rocket-run', 'hard'), { level: 4, totalLevels: 10, chapter: 2 });
  assert.equal(readPlayerCheckpoint({ 'rocket-run': { checkpoints: { hard: { level: 0, totalLevels: 10, chapter: 2 } } } }, 'rocket-run', 'hard'), null);
});

test('Rocket completion preserves genuine first wrong, retries, receipts and resumed word denominator through queue/hydration', t => {
  const scope = 'rocket-completion-origin-unit', storage = rocketBrowser(t, scope);
  for (const [seed, difficulty, origin] of [[0, 'easy', 0], [0xffffffff, 'hard', 9]]) {
    const { payload, result } = rocketCompletion(seed, difficulty, origin);
    const local = { seed, originRound: origin, motorMisses: 7, audioReceipts: payload.audioReceipts, privateLocal: 'not-cloud' };
    storage.setItem(`literacy-guide-learn-games:${scope}`, JSON.stringify({ games: { 'rocket-run': {
      practiceSession: { [difficulty]: local }, checkpoints: { [difficulty]: { level: origin, totalLevels: 10, sessionSeed: seed, chapter: 2 } }
    } } }));
    const saved = saveLearnGameResult(scope, 'rocket-run', result.stars, result.literacyScore, result.correct, payload, difficulty, 2);
    const completion = saved.games['rocket-run'].practiceRecord.completions[0];
    assert.equal(completion.contentVersion, ROCKET_RUN_CONTENT_VERSION);
    assert.equal(completion.practiceContext.construct, payload.construct);
    assert.equal(completion.practiceContext.sessionSeed, seed); assert.equal(completion.practiceContext.originRound, origin);
    assert.equal(completion.practiceContext.totalRequired, payload.totalRequired); assert.equal(completion.practiceContext.wordsCompleted, result.correct);
    assert.deepEqual(completion.roundCompletions, payload.completions);
    assert.deepEqual(completion.steps, payload.firstResponses); assert.deepEqual(completion.assistedRetries, payload.assistedRetries);
    assert.equal(completion.steps[0].correct, false); assert.equal(completion.assistedRetries[0].correct, true);
    assert.deepEqual(completion.steps[0].deliveryReceipt, payload.audioReceipts[0]);
    assert.equal(completion.assistedRetries[0].wordAudioModel, 'delivered');
    assert.equal(completion.assistedRetries[0].wordAudioReceipt.kind, 'approach-word');
    assert.ok(completion.assistedRetries[0].supportReasons.includes('spoken-word-model'));
    assert.equal(completion.practiceOnly, true); assert.equal(completion.independent, false);
    assert.equal(completion.practiceContext.formalAssessment, false); assert.equal(completion.practiceContext.masteryClaim, false);
    assert.equal(completion.practiceContext.motorCreatesEvidence, false);
    assert.equal(completion.motor, undefined); assert.equal(completion.audioReceipts, undefined);
    assert.equal(saved.games['rocket-run'].checkpoints[difficulty], undefined);
    const queued = readProgressQueueRecords(storage).find(row => row.entry.payload.games['rocket-run']?.practiceRecord);
    assert.ok(queued); assert.deepEqual(queued.entry.payload.games['rocket-run'].practiceRecord.completions.at(-1), completion);
    assert.equal(queued.entry.payload.games['rocket-run'].practiceSession, undefined);
    const hydrated = computeHydratedValue('learn_games', '__all__', saved, sanitizeCloudProgressPayload('learn_games', queued.entry.payload));
    assert.deepEqual(hydrated.games['rocket-run'].practiceSession[difficulty], local);
    assert.deepEqual(hydrated.games['rocket-run'].practiceRecord.completions.find(row => row.id === completion.id), completion);
    assert.ok(completion.steps.every(row => row.round >= origin), 'a positive origin never invents earlier responses');
    payload.firstResponses[0].correct = true; payload.completions[0].caughtIds[0] = 'mutated';
    assert.equal(completion.steps[0].correct, false); assert.notEqual(completion.roundCompletions[0].caughtIds[0], 'mutated');
  }
});

test('Rocket rejects corrupted origin, receipt, denominator and motor-only completion context', t => {
  const scope = 'rocket-invalid-completion-unit'; rocketBrowser(t, scope);
  const { payload, result } = rocketCompletion(0xffffffff, 'hard', 9);
  const patches = [{ originRound: -1 }, { originRound: 10 }, { originRound: '9' }, { sessionSeed: 0x100000000 },
    { version: 'rocket-run-v1' },
    { journeyIndex: 3 }, { contentVersion: 'rocket-run-v3' }, { construct: 'independent-encoding' },
    { masteryClaim: true }, { formalAssessment: true }, { motorCreatesEvidence: true }, { totalRequired: payload.totalRequired + 1 },
    { firstResponses: [], assistedRetries: [] }, { completions: [] }];
  const wrongTarget = structuredClone(payload.firstResponses); wrongTarget[0].deliveryReceipt.target = 'wrong';
  const lateEnd = structuredClone(payload.firstResponses); lateEnd[0].deliveryReceipt.at = lateEnd[0].at + 1;
  const duplicate = structuredClone(payload.completions); duplicate[0].caughtIds[1] = duplicate[0].caughtIds[0];
  patches.push({ firstResponses: wrongTarget }, { firstResponses: lateEnd }, { completions: duplicate });
  for (const patch of patches) {
    const saved = saveLearnGameResult(scope, 'rocket-run', result.stars, result.literacyScore, result.correct, { ...payload, ...patch }, 'hard', 2);
    const fallback = saved.games['rocket-run'].practiceRecord?.completions.at(-1);
    if (fallback) { assert.equal(fallback.contentVersion, 'learn-game-practice-v1', JSON.stringify(patch)); assert.equal(fallback.practiceContext, undefined); }
  }
  const mismatched = saveLearnGameResult(scope, 'rocket-run', 1, 1, result.correct + 1, payload, 'hard', 2);
  assert.equal(mismatched.games['rocket-run'].practiceRecord.completions.at(-1).practiceContext, undefined);
});

test('held upgraded Arcade tasks resume at zero with a safe seed and outing', () => {
  for (const id of ['sound-beat', 'letter-leap', 'sound-racer', 'grammar-grind', 'soundkeys', 'rhyme-pop', 'reel-read', 'word-climb', 'sentence-express', 'word-bridge']) {
    const games = applyCheckpoint({}, id, 'easy', 0, 10, 913, 2);
    assert.deepEqual(readPlayerCheckpoint(games, id, 'easy'), { level: 0, totalLevels: 10, sessionSeed: 913, chapter: 2 });
    assert.equal(readCheckpoint(games, id, 'easy'), null);
    assert.equal(readPlayerCheckpoint(games, id, 'medium'), null);
    for (const patch of [{ level: -1 }, { level: .5 }, { level: 10 }, { totalLevels: '10' },
      { totalLevels: 0 }, { totalLevels: Number.MAX_SAFE_INTEGER + 1 }, { sessionSeed: undefined }, { sessionSeed: '913' },
      { sessionSeed: Number.MAX_SAFE_INTEGER + 1 }, { chapter: 12 }]) {
      const invalid = { [id]: { checkpoints: { easy: { ...games[id].checkpoints.easy, ...patch } } } };
      assert.equal(readPlayerCheckpoint(invalid, id, 'easy'), null, JSON.stringify(patch));
    }
    const legacy = { [id]: { checkpoints: { easy: { level: 4, totalLevels: 10, chapter: 2 } } } };
    assert.deepEqual(readPlayerCheckpoint(legacy, id, 'easy'), { level: 4, totalLevels: 10, chapter: 2 }, 'old unseeded completed stages survive the upgrade');
    const corrupt = structuredClone(legacy); corrupt[id].checkpoints.easy.sessionSeed = '913';
    assert.equal(readPlayerCheckpoint(corrupt, id, 'easy'), null, 'an explicitly corrupt seed cannot masquerade as an older save');
  }
  assert.equal(readPlayerCheckpoint(applyCheckpoint({}, 'sentence-grove', 'easy', 0, 10, 913, 2), 'sentence-grove', 'easy'), null);
  for (const seed of [0, 0xffffffff]) assert.equal(readPlayerCheckpoint(applyCheckpoint({}, 'word-bridge', 'easy', 0, 10, seed, 0), 'word-bridge', 'easy').sessionSeed, seed);
  assert.equal(readPlayerCheckpoint(applyCheckpoint({}, 'word-bridge', 'easy', 0, 10, 0x100000000, 0), 'word-bridge', 'easy'), null);
  for (const level of [0, 4]) for (const contentVersion of ['word-bridge-v4', null, 3]) {
    const games = applyCheckpoint({}, 'word-bridge', 'easy', level, 10, 3, 0);
    games['word-bridge'].checkpoints.easy.contentVersion = contentVersion;
    assert.equal(readPlayerCheckpoint(games, 'word-bridge', 'easy'), null, 'an unknown revision cannot become an untagged legacy resume');
  }
});

test('Express preserves actual departure evidence after a legacy assembly without inventing choices', t => {
  const values = new Map(), previousWindow = globalThis.window;
  const storage = { get length() { return values.size; }, key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const window = new EventTarget();
  Object.assign(window, { localStorage: storage, setTimeout: () => 1, clearTimeout() {} });
  globalThis.window = window;
  t.after(() => { clearProgressSyncSession(); globalThis.window = previousWindow; });
  const scope = 'authored-express-unit', id = 'sentence-express';
  configureProgressSync({ mode: 'student', studentId: scope, token: 'unit-only', client: { call: async () => ({ data: { ok: true } }) } });
  const held = { legacyAssembly: ['The', 'sun'], localOnly: true };
  storage.setItem(`literacy-guide-learn-games:${scope}`, JSON.stringify({ games: { [id]: {
    practiceSession: { hard: held }, checkpoints: { hard: { level: 9, totalLevels: 10, sessionSeed: 913, chapter: 2 } }
  } } }));
  const send = { roundId: 'actual-final-train', explicitSend: true, sentAt: 100,
    practiceOnly: true, modelUsed: true, independentSentencePractice: false };
  const departure = { roundId: send.roundId, explicitSend: true, travelComplete: true, completedAt: 300,
    practiceOnly: true, modelUsed: true, independentSentencePractice: false, audioComplete: false,
    readback: [{ slot: 0, word: 'The', source: '/audio/the.mp3', status: 'delivered', endedAt: 200 },
      { slot: 1, word: 'sun', source: null, status: 'unavailable', endedAt: null }] };
  const evidence = { contentVersion: SENTENCE_EXPRESS_CONTENT_VERSION,
    construct: 'model-supported-printed-sentence-reconstruction-and-repair', practiceOnly: true,
    sessionSeed: 913, journeyIndex: 2, originStage: 9, originTrainIndex: 2, originTrainSlot: 29,
    legacyResume: true, legacyMainComplete: false, originQueue: ['retained-round-id'],
    legacyRunTotals: { baseStart: 0, levelsDone: 9, starSum: 18, score: 180, words: 45 },
    nativeV2ChoiceCount: 0, nativeV2DepartureCount: 1, firstResponses: [], assistedRetries: [],
    sends: [send], departures: [departure], rehearsalDepartures: [{ ...departure, visitIndex: 1 }],
    motorEvents: { uncouplings: 2 }, privateExtra: 'not-uploaded' };
  const saved = saveLearnGameResult(scope, id, 2, 190, 47, evidence, 'hard', 2);
  const completion = saved.games[id].practiceRecord.completions[0];
  assert.equal(completion.contentVersion, SENTENCE_EXPRESS_CONTENT_VERSION);
  assert.deepEqual(completion.steps, []); assert.deepEqual(completion.assistedRetries, []);
  assert.deepEqual(completion.departures, [departure]); assert.deepEqual(completion.sends, [send]);
  assert.equal(completion.practiceContext.nativeV2ChoiceCount, 0);
  assert.equal(completion.practiceContext.nativeV2DepartureCount, 1);
  assert.equal(completion.practiceContext.originTrainSlot, 29);
  assert.equal(completion.practiceContext.independentSentencePractice, false);
  assert.equal(completion.practiceContext.masteryClaim, false);
  assert.deepEqual(completion.practiceContext.legacyRunTotals, evidence.legacyRunTotals);
  assert.deepEqual(completion.practiceContext.originQueue, ['retained-round-id']);
  assert.equal(completion.rehearsalDepartures, undefined); assert.equal(completion.motorEvents, undefined);
  assert.equal(completion.privateExtra, undefined); assert.equal(saved.games[id].checkpoints.hard, undefined);
  const queued = readProgressQueueRecords(storage).find(row => row.entry.payload.games[id]?.practiceRecord);
  assert.ok(queued); assert.deepEqual(queued.entry.payload.games[id].practiceRecord.completions[0], completion);
  assert.equal(queued.entry.payload.games[id].practiceSession, undefined);
  const hydrated = computeHydratedValue('learn_games', '__all__', saved, queued.entry.payload);
  assert.deepEqual(hydrated.games[id].practiceSession.hard, held);
  assert.deepEqual(hydrated.games[id].practiceRecord.completions[0], completion);
  for (const patch of [{ originTrainSlot: 28 }, { originTrainIndex: 3 }, { originStage: 10 }, { legacyResume: false },
    { nativeV2ChoiceCount: 1 }, { nativeV2DepartureCount: 0 }, { nativeV2DepartureCount: 2 },
    { originQueue: ['duplicate', 'duplicate'] }, { departures: [] }, { sends: [] },
    { departures: [{ ...departure, travelComplete: false }] },
    { departures: [{ ...departure, readback: [{ ...departure.readback[0], endedAt: 99 }] }] }]) {
    const invalid = saveLearnGameResult(scope, id, 1, 1, 1, { ...evidence, ...patch }, 'hard', 2);
    assert.equal(invalid.games[id].practiceRecord.completions.length, 1, JSON.stringify(patch));
  }
  const first = { responseId: 'express-first', correct: false, printedModel: 'The sun', supportReasons: ['printed-sentence-model-visible'] };
  const retry = { ...first, correct: true, supportReasons: ['printed-sentence-model-visible', 'hint'] };
  const native = saveLearnGameResult(scope, id, 2, 200, 48, { ...evidence, originStage: 0, originTrainIndex: 0,
    originTrainSlot: 0, originQueue: [], legacyResume: false, legacyRunTotals: { baseStart: 0, levelsDone: 0, starSum: 0, score: 0, words: 0 },
    nativeV2ChoiceCount: 2, firstResponses: [first], assistedRetries: [retry] }, 'easy', 2);
  const latest = native.games[id].practiceRecord.completions.at(-1);
  assert.deepEqual(latest.steps, [first]); assert.deepEqual(latest.assistedRetries, [retry]);
  first.correct = true; departure.readback[0].endedAt = 1;
  assert.equal(latest.steps[0].correct, false);
  assert.equal(completion.departures[0].readback[0].endedAt, 200);
});

test('Leap, Racer, Skate and Keys retain their real cue receipt shapes and distinct learning constructs in completion', t => {
  const values = new Map(), previousWindow = globalThis.window;
  const storage = { get length() { return values.size; }, key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const window = new EventTarget();
  Object.assign(window, { localStorage: storage, setTimeout: () => 1, clearTimeout() {} });
  globalThis.window = window;
  t.after(() => { clearProgressSyncSession(); globalThis.window = previousWindow; });
  const scope = 'authored-race-leap-unit';
  configureProgressSync({ mode: 'student', studentId: scope, token: 'unit-only', client: { call: async () => ({ data: { ok: true } }) } });
  for (const [id, version, construct, cue] of [
    ['letter-leap', LETTER_LEAP_CONTENT_VERSION, 'heard-word-grapheme-encoding', {
      wordVisible: false, deliveryReceipt: { source: '/audio/word.mp3', endedAt: 1 },
      pictureReceipt: { source: '/images/word.webp', decodedAt: .5 }
    }],
    ['sound-racer', SOUND_RACER_CONTENT_VERSION, 'grapheme-phoneme-onset-recognition', {
      wordVisible: true, inputAuthority: 'deliberate-lane-aim', targetAudioReceipt: {
        source: '/audio/phonemes/b.mp3', deliveredAt: '2026-10-04T06:00:00.000Z', playTimeMs: 980
      }
    }],
    ['grammar-grind', SPELL_SKATE_CONTENT_VERSION, 'picture-audio-ordered-grapheme-encoding', {
      wordVisible: false, inputAuthority: 'selected-skate-destination', wordAudioReceipt: {
        source: '/audio/child-mode/words/cat.mp3', deliveredAt: '2026-10-04T06:00:00.000Z', playTimeMs: 980
      }
    }],
    ['reel-read', REEL_READ_CONTENT_VERSION, 'cued-word-parts-and-meaning', {
      wordVisible: false, choicesVisible: true, taskMode: 'compound', operation: 'ordered-parts',
      deliveryReceipt: { stage: 9, kind: 'target', src: '/audio/rainbow.mp3', at: 4 }
    }],
    ['rhyme-pop', RHYME_POP_CONTENT_VERSION, 'cued-word-rhyme-recognition', {
      targetWordVisible: false, choicesVisible: true, cueKind: 'meaning-context', deliveryReceipt: {
        stage: 23, round: 23, word: 'ton', kind: 'target', src: '/audio/ton.mp3', at: 4
      }
    }],
    ['soundkeys', SOUNDKEYS_CONTENT_VERSION, 'heard-word-ordered-grapheme-encoding', {
      wordVisible: false, choicesVisible: true, source: 'midi', deliveryReceipt: {
        round: 23, word: 'cat', kind: 'target', src: '/audio/child-mode/words/cat.mp3', at: 4
      }
    }]
  ]) {
    const first = { responseId: `${id}:first`, correct: false, practiceOnly: true, deliveryAtResponse: 'delivered', supportReasons: [], ...cue };
    const retry = { ...first, correct: true, supportReasons: ['hint'] };
    const held = { seed: 913, supportReasons: ['hint'], localWorld: 'device-only' };
    const previous = JSON.parse(storage.getItem(`literacy-guide-learn-games:${scope}`) || '{"games":{}}');
    previous.games[id] = { practiceSession: { easy: held } };
    storage.setItem(`literacy-guide-learn-games:${scope}`, JSON.stringify(previous));
    const evidence = { contentVersion: version, construct, practiceOnly: true, sessionSeed: 913, journeyIndex: 2,
      firstResponses: [first], assistedRetries: [retry], ...(id === 'soundkeys' ? { originRound: 23 } : {}), ...(id === 'rhyme-pop' ? { originStage: 23 } : {}), ...(id === 'reel-read' ? { originStage: 9 } : {}) };
    const saved = saveLearnGameResult(scope, id, 2, 90, 10, evidence, 'easy', 2);
    const completion = saved.games[id].practiceRecord.completions[0];
    assert.equal(completion.contentVersion, version); assert.equal(completion.practiceContext.construct, construct);
    assert.equal(completion.practiceContext.masteryClaim, false); assert.equal(completion.practiceContext.motorCreatesEvidence, false);
    if (id === 'soundkeys') assert.equal(completion.practiceContext.originRound, 23, 'a positive legacy resume cannot invent earlier practiced words');
    if (id === 'rhyme-pop') {
      assert.equal(completion.practiceContext.originStage, 23);
      for (const patch of [{ originStage: -1 }, { originStage: 24 }, { originStage: .5 }, { originStage: '23' }]) {
        const rejected = saveLearnGameResult(scope, id, 1, 1, 1, { ...evidence, ...patch }, 'easy', 2);
        assert.equal(rejected.games[id].practiceRecord.completions.at(-1).practiceContext, undefined, JSON.stringify(patch));
      }
      for (const difficulty of ['medium', 'hard']) {
        const valid = saveLearnGameResult(scope, id, 1, 1, 1, { ...evidence, originStage: 29 }, difficulty, 2);
        assert.equal(valid.games[id].practiceRecord.completions.at(-1).practiceContext.originStage, 29);
        const rejected = saveLearnGameResult(scope, id, 1, 1, 1, { ...evidence, originStage: 30 }, difficulty, 2);
        assert.equal(rejected.games[id].practiceRecord.completions.at(-1).practiceContext, undefined);
      }
    }
    if (id === 'reel-read') {
      assert.equal(completion.practiceContext.originStage, 9);
      assert.equal(completion.practiceContext.legacyResume, undefined);
      assert.equal(completion.practiceContext.nativeV2CaptureCount, undefined);
      for (const patch of [{ originStage: -1 }, { originStage: 10 }, { originStage: .5 }, { originStage: '9' }]) {
        const rejected = saveLearnGameResult(scope, id, 1, 1, 1, { ...evidence, ...patch }, 'easy', 2);
        assert.equal(rejected.games[id].practiceRecord.completions.at(-1).practiceContext, undefined);
      }
    }
    assert.deepEqual(completion.steps, [first]); assert.deepEqual(completion.assistedRetries, [retry]);
    const queued = readProgressQueueRecords(storage).find(row => row.entry.payload.games[id]?.practiceRecord);
    assert.ok(queued); assert.deepEqual(queued.entry.payload.games[id].practiceRecord.completions[0], completion);
    assert.equal(queued.entry.payload.games[id].practiceSession, undefined);
    assert.deepEqual(computeHydratedValue('learn_games', '__all__', saved, queued.entry.payload).games[id].practiceSession.easy, held);
    const mismatched = saveLearnGameResult(scope, id, 1, 1, 1, { ...evidence, construct: 'independent-spelling' }, 'easy', 2);
    assert.equal(mismatched.games[id].practiceRecord.completions.at(-1).practiceContext, undefined);
  }
});

test('Climb keeps a resumed summit origin and genuine wrong landing immutable through queue and hydration', t => {
  const values = new Map(), previousWindow = globalThis.window;
  const storage = { get length() { return values.size; }, key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const window = new EventTarget();
  Object.assign(window, { localStorage: storage, setTimeout: () => 1, clearTimeout() {} });
  globalThis.window = window;
  t.after(() => { clearProgressSyncSession(); globalThis.window = previousWindow; });
  const scope = 'climb-parent-origin-unit';
  configureProgressSync({ mode: 'student', studentId: scope, token: 'unit-only', client: { call: async () => ({ data: { ok: true } }) } });
  const first = { responseId: 'saved-climb:landing:first', correct: false, practiceOnly: true,
    wordVisible: true, supportReasons: [], deliveryAtResponse: 'delivered',
    deliveryReceipt: { src: '/audio/phonemes/f.mp3', endedAt: 10 }, motorLanding: { platformId: '4-2', at: 15 } };
  const retry = { ...first, correct: true, supportReasons: ['contrast-feedback'], motorLanding: { platformId: '4-1', at: 19 } };
  const local = { safeRest: { x: 50, y: 3210 }, collected: ['fish'], privateMutable: 'local-climb-only' };
  storage.setItem(`literacy-guide-learn-games:${scope}`, JSON.stringify({ games: { 'word-climb': {
    practiceSession: { hard: local }, checkpoints: { hard: { level: 9, totalLevels: 10, sessionSeed: 0xffffffff, chapter: 2 } }
  } } }));
  const evidence = { contentVersion: WORD_CLIMB_CONTENT_VERSION, construct: 'printed-word-initial-phoneme-identification',
    practiceOnly: true, sessionSeed: 0xffffffff, journeyIndex: 2, originStep: 9, stageIndex: 8,
    legacyResume: false, nativeV2LandingCount: 2, firstResponses: [first], assistedRetries: [retry], motorEvents: { falls: 1 } };
  const saved = saveLearnGameResult(scope, 'word-climb', 2, 10, 1, evidence, 'hard', 2);
  const completion = saved.games['word-climb'].practiceRecord.completions[0];
  assert.equal(completion.contentVersion, WORD_CLIMB_CONTENT_VERSION);
  assert.deepEqual(completion.steps, [first]); assert.deepEqual(completion.assistedRetries, [retry]);
  assert.equal(completion.practiceContext.originStep, 9); assert.equal(completion.practiceContext.stageIndex, 8);
  assert.equal(completion.practiceContext.nativeV2LandingCount, 2);
  assert.equal(completion.practiceContext.formalAssessment, false); assert.equal(completion.practiceContext.masteryClaim, false);
  assert.equal(completion.practiceOnly, true); assert.equal(completion.independent, false);
  assert.deepEqual(saved.games['word-climb'].practiceSession.hard, local);
  const queued = readProgressQueueRecords(storage).find(row => row.entry.payload.games['word-climb']?.practiceRecord);
  assert(queued); assert.equal(queued.entry.payload.games['word-climb'].practiceSession, undefined);
  assert(!JSON.stringify(queued).includes('local-climb-only'));
  const hydrated = computeHydratedValue('learn_games', '__all__', saved, sanitizeCloudProgressPayload('learn_games', saved));
  assert.deepEqual(hydrated.games['word-climb'].practiceSession.hard, local);
  assert.deepEqual(hydrated.games['word-climb'].practiceRecord.completions[0], completion);
  evidence.firstResponses[0].correct = true;
  assert.equal(completion.steps[0].correct, false, 'Supported retry must not overwrite the first wrong landing');
  for (const patch of [{ originStep: 10 }, { stageIndex: 9 }, { nativeV2LandingCount: 1 }, { legacyResume: 'yes' }]) {
    const invalid = saveLearnGameResult(scope, 'word-climb', 1, 1, 1, { ...evidence, ...patch }, 'hard', 2);
    const fallback = invalid.games['word-climb'].practiceRecord.completions.at(-1);
    assert.equal(fallback.contentVersion, 'learn-game-practice-v1'); assert.equal(fallback.practiceContext, undefined);
  }
  const legacy = saveLearnGameResult(scope, 'word-climb', 1, 1, 1, { ...evidence, legacyResume: true, stageIndex: 3 }, 'hard', 2);
  assert.equal(legacy.games['word-climb'].practiceRecord.completions.at(-1).practiceContext.stageIndex, 3,
    'Explicit old-world origin remains labelled instead of pretending it was the new chapter map');
});

test('Sound Beat completion keeps first attempts and assisted retries through queue and hydration', t => {
  const values = new Map(), previousWindow = globalThis.window;
  const storage = { get length() { return values.size; }, key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const window = new EventTarget();
  Object.assign(window, { localStorage: storage, setTimeout: () => 1, clearTimeout() {} });
  globalThis.window = window;
  t.after(() => { clearProgressSyncSession(); globalThis.window = previousWindow; });
  const scope = 'authored-beat-unit';
  configureProgressSync({ mode: 'student', studentId: scope, token: 'unit-only', client: { call: async () => ({ data: { ok: true } }) } });
  const localPhrase = { beatIndex: 2, supportReasons: ['timing-mercy'], scratch: 'mutable-phrase-history' };
  const initial = { games: { 'sound-beat': { practiceSession: { easy: localPhrase }, checkpoints: {
    easy: { level: 0, totalLevels: 10, sessionSeed: 913, chapter: 2 },
    hard: { level: 4, totalLevels: 10, sessionSeed: 99, chapter: 1 }
  } } } };
  storage.setItem(`literacy-guide-learn-games:${scope}`, JSON.stringify(initial));
  const first = { responseId: 'sound-beat:0:0:0', correct: false, wordVisible: false, noteVisible: true,
    practiceOnly: true, independentEncodingPractice: false, independentRhythmPractice: false,
    deliveryAtResponse: 'delivered', supportReasons: [], deliveryReceipt: {
      stage: 0, task: 0, beat: 0, kind: 'unit', src: '/audio/phonemes/s.mp3', at: 1
    } };
  const retry = { ...first, correct: true, supportReasons: ['timing-mercy', 'repeat-response'] };
  const evidence = { contentVersion: SOUND_BEAT_CONTENT_VERSION, sessionSeed: 913, journeyIndex: 2,
    construct: 'recorded-unit-rhythmic-segmentation', practiceOnly: true,
    firstResponses: [first], assistedRetries: [retry], motorEvents: { timingMisses: 1 },
    supportEvents: ['mutable-event-never-upload'], privateExtra: 'not-completion-context' };
  const saved = saveLearnGameResult(scope, 'sound-beat', 3, 90, 10, evidence, 'easy', 2);
  const completion = saved.games['sound-beat'].practiceRecord.completions[0];
  assert.equal(completion.contentVersion, SOUND_BEAT_CONTENT_VERSION);
  assert.deepEqual(completion.practiceContext, { sessionSeed: 913, journeyIndex: 2, formalAssessment: false,
    masteryClaim: false, construct: 'recorded-unit-rhythmic-segmentation', motorCreatesEvidence: false });
  assert.equal(completion.practiceOnly, true); assert.equal(completion.independent, false);
  assert.deepEqual(completion.steps, [first]); assert.deepEqual(completion.assistedRetries, [retry]);
  assert.equal(saved.games['sound-beat'].checkpoints.easy, undefined);
  assert.deepEqual(saved.games['sound-beat'].checkpoints.hard, initial.games['sound-beat'].checkpoints.hard);
  assert.deepEqual(saved.games['sound-beat'].practiceSession.easy, localPhrase);
  assert.deepEqual(saved.games['sound-beat'].journeys.easy.completed, [2]);
  assert.equal(completion.motorEvents, undefined); assert.equal(completion.privateExtra, undefined);
  const queued = readProgressQueueRecords(storage).find(row => row.entry.payload.games['sound-beat']?.practiceRecord);
  assert.ok(queued);
  assert.deepEqual(queued.entry.payload.games['sound-beat'].practiceRecord.completions[0], completion);
  assert.equal(queued.entry.payload.games['sound-beat'].practiceSession, undefined);
  assert.ok(!JSON.stringify(queued).includes('mutable-event-never-upload'));
  const cloud = sanitizeCloudProgressPayload('learn_games', saved);
  const hydrated = computeHydratedValue('learn_games', '__all__', saved, cloud);
  assert.deepEqual(hydrated.games['sound-beat'].practiceSession.easy, localPhrase);
  assert.deepEqual(hydrated.games['sound-beat'].practiceRecord.completions[0], completion);
  evidence.firstResponses[0].correct = true;
  assert.equal(completion.steps[0].correct, false, 'completed first response is an immutable snapshot');

  for (const patch of [{ contentVersion: 'sound-beat-v1' }, { sessionSeed: Number.MAX_SAFE_INTEGER + 1 },
    { journeyIndex: 3 }, { construct: 'independent-spelling' }, { practiceOnly: false }]) {
    const invalid = saveLearnGameResult(scope, 'sound-beat', 1, 1, 1, { ...evidence, ...patch }, 'easy', 2);
    const fallback = invalid.games['sound-beat'].practiceRecord.completions.at(-1);
    assert.equal(fallback.contentVersion, 'learn-game-practice-v1', JSON.stringify(patch));
    assert.equal(fallback.practiceContext, undefined);
    assert.equal(fallback.practiceOnly, true); assert.equal(fallback.independent, false);
  }
});


test('Bridge preserves real wrong placement, supported reconstruction and local carried pieces through queue and hydration', t => {
  const values = new Map(), previousWindow = globalThis.window;
  const storage = { get length() { return values.size; }, key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const window = new EventTarget();
  Object.assign(window, { localStorage: storage, setTimeout: () => 1, clearTimeout() {} });
  globalThis.window = window;
  t.after(() => { clearProgressSyncSession(); globalThis.window = previousWindow; });
  const scope = 'bridge-parent-placement-unit', id = 'word-bridge';
  configureProgressSync({ mode: 'student', studentId: scope, token: 'unit-only', client: { call: async () => ({ data: { ok: true } }) } });
  const first = { responseId: `${WORD_BRIDGE_CONTENT_VERSION}:easy:0:0:0:0`, roundId: `${WORD_BRIDGE_CONTENT_VERSION}:easy:0:0:0`, correct: false, practiceOnly: true, modelUsed: true,
    construct: 'model-supported-grapheme-matching-ordered-reconstruction', independentEncodingPractice: false,
    deliveryAtResponse: 'delivered', deliveryReceipt: { src: '/audio/phonemes/sh.mp3', endedAt: 10 },
    supportReasons: [], tileId: 2, slotOrder: 0 };
  const retry = { ...first, correct: true, supportReasons: ['contrast-feedback'], tileId: 1 };
  const local = { world: { builder: { carryingId: 2 } }, scratch: 'private-carried-piece' };
  storage.setItem(`literacy-guide-learn-games:${scope}`, JSON.stringify({ games: { [id]: {
    practiceSession: { easy: local }, checkpoints: { easy: { level: 0, totalLevels: 10, sessionSeed: 0, chapter: 0 } }
  } } }));
  const evidence = { contentVersion: WORD_BRIDGE_CONTENT_VERSION, construct: first.construct,
    practiceOnly: true, sessionSeed: 0, journeyIndex: 0, originStage: 0, legacyResume: false,
    nativeV2PlacementCount: 2, firstResponses: [first], assistedRetries: [retry] };
  const saved = saveLearnGameResult(scope, id, 1, 20, 1, evidence, 'easy', 0);
  const completion = saved.games[id].practiceRecord.completions[0];
  assert.equal(completion.contentVersion, WORD_BRIDGE_CONTENT_VERSION);
  assert.deepEqual(completion.steps, [first]); assert.deepEqual(completion.assistedRetries, [retry]);
  assert.equal(completion.practiceContext.originStage, 0); assert.equal(completion.practiceContext.sessionSeed, 0);
  assert.equal(completion.practiceContext.nativeV2PlacementCount, 2); assert.equal(completion.practiceContext.modelUsed, true);
  assert.equal(completion.practiceContext.independentEncodingPractice, false);
  assert.equal(completion.practiceContext.formalAssessment, false); assert.equal(completion.practiceContext.masteryClaim, false);
  assert.equal(completion.practiceOnly, true); assert.equal(completion.independent, false);
  const queued = readProgressQueueRecords(storage).find(row => row.entry.payload.games[id]?.practiceRecord);
  assert(queued); assert.equal(queued.entry.payload.games[id].practiceSession, undefined);
  assert(!JSON.stringify(queued).includes('private-carried-piece'));
  const hydrated = computeHydratedValue('learn_games', '__all__', saved, sanitizeCloudProgressPayload('learn_games', saved));
  assert.deepEqual(hydrated.games[id].practiceSession.easy, local);
  assert.deepEqual(hydrated.games[id].practiceRecord.completions[0], completion);
  evidence.firstResponses[0].correct = true;
  assert.equal(completion.steps[0].correct, false, 'A supported matching retry cannot overwrite the first physical placement');
  for (const patch of [{ originStage: 10 }, { originStage: -1 }, { originStage: .5 }, { legacyResume: true },
    { nativeV2PlacementCount: 1 }, { nativeV2PlacementCount: 0 }, { sessionSeed: 0x100000000 },
    { construct: 'heard-word-grapheme-encoding' }, { practiceOnly: false }, { journeyIndex: 12 }]) {
    const invalid = saveLearnGameResult(scope, id, 1, 1, 1, { ...evidence, ...patch }, 'easy', 0);
    const fallback = invalid.games[id].practiceRecord.completions.at(-1);
    assert.equal(fallback.contentVersion, 'learn-game-practice-v1'); assert.equal(fallback.practiceContext, undefined);
  }
  const legacy = saveLearnGameResult(scope, id, 1, 1, 1, { ...evidence, originStage: 9, legacyResume: true,
    sessionSeed: 0xffffffff, journeyIndex: 11 }, 'hard', 11);
  assert.equal(legacy.games[id].practiceRecord.completions.at(-1).practiceContext.originStage, 9);
  assert.equal(legacy.games[id].practiceRecord.completions.at(-1).practiceContext.sessionSeed, 0xffffffff);
});

test('Bridge v2/v3 actual revisions survive checkpoints, stripped-sidecar cloud queues and immutable completions without mixing', t => {
  const values = new Map(), previousWindow = globalThis.window;
  const storage = { get length() { return values.size; }, key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const ownedWindow = new EventTarget();
  Object.assign(ownedWindow, { localStorage: storage, setTimeout: () => 1, clearTimeout() {} });
  globalThis.window = ownedWindow;
  t.after(() => { clearProgressSyncSession(); globalThis.window = previousWindow; });
  const scope = 'bridge-version-unit', id = 'word-bridge';
  configureProgressSync({ mode: 'student', studentId: scope, token: 'unit-only', client: { call: async () => ({ data: { ok: true } }) } });
  for (const version of [WORD_BRIDGE_LEGACY_CONTENT_VERSION, WORD_BRIDGE_CONTENT_VERSION]) {
    for (const [level, seed] of [[0, 0], [4, 0xffffffff]]) {
      const local = { version, world: { privatePiece: 3 } };
      storage.setItem(`literacy-guide-learn-games:${scope}`, JSON.stringify({ games: { [id]: { practiceSession: { hard: local } } } }));
      const saved = saveGameCheckpoint(scope, id, 'hard', level, 10, seed, 11, { contentVersion: version });
      assert.deepEqual(readPlayerCheckpoint(saved.games, id, 'hard'), { level, totalLevels: 10, sessionSeed: seed, chapter: 11, contentVersion: version });
      const cloud = sanitizeCloudProgressPayload('learn_games', saved);
      assert.equal(cloud.games[id].practiceSession, undefined);
      assert.equal(readPlayerCheckpoint(cloud.games, id, 'hard').contentVersion, version, 'cloud-only resume retains its real bank revision');
      const hydrated = computeHydratedValue('learn_games', '__all__', saved, cloud);
      assert.deepEqual(hydrated.games[id].practiceSession.hard, local);
      assert.equal(hydrated.games[id].checkpoints.hard.contentVersion, version);
    }
    const roundId = `${version}:hard:0:0:4`;
    const first = { roundId, responseId: `${roundId}:0`, correct: false, modelUsed: true, practiceOnly: true };
    const retry = { ...first, correct: true, supportReasons: ['visible-slot-model', 'repeat-after-response'] };
    const evidence = { contentVersion: version, construct: 'model-supported-grapheme-matching-ordered-reconstruction',
      sessionSeed: 0, journeyIndex: 0, originStage: 4, legacyResume: true, practiceOnly: true,
      nativeV2PlacementCount: 2, firstResponses: [first], assistedRetries: [retry] };
    const result = saveLearnGameResult(scope, id, 1, 20, 1, evidence, 'hard', 0);
    const completion = result.games[id].practiceRecord.completions.at(-1);
    assert.equal(completion.contentVersion, version, 'an old v2 completion never acquires the current v3 label');
    assert.deepEqual(completion.steps, [first]); assert.deepEqual(completion.assistedRetries, [retry]);
    assert.equal(completion.practiceContext.nativeV2PlacementCount, 2);
    const queued = readProgressQueueRecords(storage).find(row => row.entry.payload.games[id]?.practiceRecord);
    assert.ok(queued); assert.equal(queued.entry.payload.games[id].practiceSession, undefined);
    const hydrated = computeHydratedValue('learn_games', '__all__', result, queued.entry.payload);
    assert.deepEqual(hydrated.games[id].practiceRecord.completions.find(row => row.id === completion.id), completion);
    for (const patch of [{ contentVersion: 'word-bridge-v4' }, { version: version === WORD_BRIDGE_CONTENT_VERSION ? WORD_BRIDGE_LEGACY_CONTENT_VERSION : WORD_BRIDGE_CONTENT_VERSION },
      { firstResponses: [{ ...first, roundId: `word-bridge-v4:hard:0:0:4` }] },
      { assistedRetries: [{ ...retry, roundId: `${version === WORD_BRIDGE_CONTENT_VERSION ? WORD_BRIDGE_LEGACY_CONTENT_VERSION : WORD_BRIDGE_CONTENT_VERSION}:hard:0:0:4` }] }]) {
      const invalid = saveLearnGameResult(scope, id, 1, 1, 1, { ...evidence, ...patch }, 'hard', 0);
      const generic = invalid.games[id].practiceRecord.completions.at(-1);
      assert.equal(generic.contentVersion, 'learn-game-practice-v1'); assert.equal(generic.practiceContext, undefined);
    }
  }
});

// The following rows come from the actual owner-side pure response writers.
// Mock end timestamps here verify persistence shape only; native recordings
// and physical contacts are proved by the separate browser outings.
// Exact unit producer fixtures are embedded so shared persistence tests do
// not import unfinished lazy engines or acquire their artwork dependencies.
const safariGroveParentFixtures = {"sound-safari:hard:4294967295:11:0":{"firstResponses":[{"responseId":"sound-safari-v2:hard:4294967295:11:0:0:0","roundId":"sound-safari-v2:hard:4294967295:11:0:0","stage":0,"wordSlot":0,"slot":0,"eventIndex":0,"selected":"n","expected":"s","expectedSoundKey":"s","correct":false,"choices":["n","s","p","e","t","m"],"responseAt":100,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/sunset-19dd87efe0.mp3","endedAt":98},"pictureReceipt":{"source":"/media/vocabulary/images/sunset.webp","decodedAt":97},"pictureKind":"word","supportReasons":[],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":false},{"responseId":"sound-safari-v2:hard:4294967295:11:0:0:1","roundId":"sound-safari-v2:hard:4294967295:11:0:0","stage":0,"wordSlot":0,"slot":1,"eventIndex":2,"selected":"u","expected":"u","expectedSoundKey":"u","correct":true,"choices":["j","g","e","f","u","m"],"responseAt":102,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/sunset-19dd87efe0.mp3","endedAt":100},"pictureReceipt":{"source":"/media/vocabulary/images/sunset.webp","decodedAt":99},"pictureKind":"word","supportReasons":[],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":true},{"responseId":"sound-safari-v2:hard:4294967295:11:0:0:2","roundId":"sound-safari-v2:hard:4294967295:11:0:0","stage":0,"wordSlot":0,"slot":2,"eventIndex":3,"selected":"n","expected":"n","expectedSoundKey":"n","correct":true,"choices":["s","j","n","g","d","h"],"responseAt":103,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/sunset-19dd87efe0.mp3","endedAt":101},"pictureReceipt":{"source":"/media/vocabulary/images/sunset.webp","decodedAt":100},"pictureKind":"word","supportReasons":[],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":true},{"responseId":"sound-safari-v2:hard:4294967295:11:0:0:3","roundId":"sound-safari-v2:hard:4294967295:11:0:0","stage":0,"wordSlot":0,"slot":3,"eventIndex":4,"selected":"s","expected":"s","expectedSoundKey":"s","correct":true,"choices":["p","s","n","t","j","f"],"responseAt":104,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/sunset-19dd87efe0.mp3","endedAt":102},"pictureReceipt":{"source":"/media/vocabulary/images/sunset.webp","decodedAt":101},"pictureKind":"word","supportReasons":[],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":true},{"responseId":"sound-safari-v2:hard:4294967295:11:0:0:4","roundId":"sound-safari-v2:hard:4294967295:11:0:0","stage":0,"wordSlot":0,"slot":4,"eventIndex":5,"selected":"e","expected":"e","expectedSoundKey":"e","correct":true,"choices":["d","p","f","e","s","m"],"responseAt":105,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/sunset-19dd87efe0.mp3","endedAt":103},"pictureReceipt":{"source":"/media/vocabulary/images/sunset.webp","decodedAt":102},"pictureKind":"word","supportReasons":[],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":true},{"responseId":"sound-safari-v2:hard:4294967295:11:0:0:5","roundId":"sound-safari-v2:hard:4294967295:11:0:0","stage":0,"wordSlot":0,"slot":5,"eventIndex":6,"selected":"t","expected":"t","expectedSoundKey":"t","correct":true,"choices":["l","d","e","t","u","f"],"responseAt":106,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/sunset-19dd87efe0.mp3","endedAt":104},"pictureReceipt":{"source":"/media/vocabulary/images/sunset.webp","decodedAt":103},"pictureKind":"word","supportReasons":[],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":true}],"assistedRetries":[{"responseId":"sound-safari-v2:hard:4294967295:11:0:0:0","roundId":"sound-safari-v2:hard:4294967295:11:0:0","stage":0,"wordSlot":0,"slot":0,"eventIndex":1,"selected":"s","expected":"s","expectedSoundKey":"s","correct":true,"choices":["n","s","p","e","t","m"],"responseAt":101,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/sunset-19dd87efe0.mp3","endedAt":98},"pictureReceipt":{"source":"/media/vocabulary/images/sunset.webp","decodedAt":97},"pictureKind":"word","supportReasons":["repeat-after-response"],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":false}],"acceptedResponses":[{"responseId":"sound-safari-v2:hard:4294967295:11:0:0:0","roundId":"sound-safari-v2:hard:4294967295:11:0:0","stage":0,"wordSlot":0,"slot":0,"eventIndex":1,"selected":"s","expected":"s","expectedSoundKey":"s","correct":true,"choices":["n","s","p","e","t","m"],"responseAt":101,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/sunset-19dd87efe0.mp3","endedAt":98},"pictureReceipt":{"source":"/media/vocabulary/images/sunset.webp","decodedAt":97},"pictureKind":"word","supportReasons":["repeat-after-response"],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":false},{"responseId":"sound-safari-v2:hard:4294967295:11:0:0:1","roundId":"sound-safari-v2:hard:4294967295:11:0:0","stage":0,"wordSlot":0,"slot":1,"eventIndex":2,"selected":"u","expected":"u","expectedSoundKey":"u","correct":true,"choices":["j","g","e","f","u","m"],"responseAt":102,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/sunset-19dd87efe0.mp3","endedAt":100},"pictureReceipt":{"source":"/media/vocabulary/images/sunset.webp","decodedAt":99},"pictureKind":"word","supportReasons":[],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":true},{"responseId":"sound-safari-v2:hard:4294967295:11:0:0:2","roundId":"sound-safari-v2:hard:4294967295:11:0:0","stage":0,"wordSlot":0,"slot":2,"eventIndex":3,"selected":"n","expected":"n","expectedSoundKey":"n","correct":true,"choices":["s","j","n","g","d","h"],"responseAt":103,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/sunset-19dd87efe0.mp3","endedAt":101},"pictureReceipt":{"source":"/media/vocabulary/images/sunset.webp","decodedAt":100},"pictureKind":"word","supportReasons":[],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":true},{"responseId":"sound-safari-v2:hard:4294967295:11:0:0:3","roundId":"sound-safari-v2:hard:4294967295:11:0:0","stage":0,"wordSlot":0,"slot":3,"eventIndex":4,"selected":"s","expected":"s","expectedSoundKey":"s","correct":true,"choices":["p","s","n","t","j","f"],"responseAt":104,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/sunset-19dd87efe0.mp3","endedAt":102},"pictureReceipt":{"source":"/media/vocabulary/images/sunset.webp","decodedAt":101},"pictureKind":"word","supportReasons":[],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":true},{"responseId":"sound-safari-v2:hard:4294967295:11:0:0:4","roundId":"sound-safari-v2:hard:4294967295:11:0:0","stage":0,"wordSlot":0,"slot":4,"eventIndex":5,"selected":"e","expected":"e","expectedSoundKey":"e","correct":true,"choices":["d","p","f","e","s","m"],"responseAt":105,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/sunset-19dd87efe0.mp3","endedAt":103},"pictureReceipt":{"source":"/media/vocabulary/images/sunset.webp","decodedAt":102},"pictureKind":"word","supportReasons":[],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":true},{"responseId":"sound-safari-v2:hard:4294967295:11:0:0:5","roundId":"sound-safari-v2:hard:4294967295:11:0:0","stage":0,"wordSlot":0,"slot":5,"eventIndex":6,"selected":"t","expected":"t","expectedSoundKey":"t","correct":true,"choices":["l","d","e","t","u","f"],"responseAt":106,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/sunset-19dd87efe0.mp3","endedAt":104},"pictureReceipt":{"source":"/media/vocabulary/images/sunset.webp","decodedAt":103},"pictureKind":"word","supportReasons":[],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":true}],"completions":["sound-safari-v2:hard:4294967295:11:0:0"],"motorEvents":{"emptySwings":0,"catches":0},"contentVersion":"sound-safari-v2","construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"sessionSeed":4294967295,"journeyIndex":11,"originStage":0,"legacyResume":false,"nativeV2CaptureCount":7},"sound-safari:hard:4294967295:11:9":{"firstResponses":[{"responseId":"sound-safari-v2:hard:4294967295:11:9:0:0","roundId":"sound-safari-v2:hard:4294967295:11:9:0","stage":9,"wordSlot":0,"slot":0,"eventIndex":0,"selected":"s","expected":"f","expectedSoundKey":"f","correct":false,"choices":["s","o","f","a","e","r","i","w"],"responseAt":100,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/frost-3c87160f3c.mp3","endedAt":98},"pictureReceipt":{"source":"/media/vocabulary/images/frost.webp","decodedAt":97},"pictureKind":"word","supportReasons":["legacy-resume-response-history-unavailable"],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":false},{"responseId":"sound-safari-v2:hard:4294967295:11:9:0:1","roundId":"sound-safari-v2:hard:4294967295:11:9:0","stage":9,"wordSlot":0,"slot":1,"eventIndex":2,"selected":"r","expected":"r","expectedSoundKey":"r","correct":true,"choices":["s","sh","v","t","z","r","e","w"],"responseAt":102,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/frost-3c87160f3c.mp3","endedAt":100},"pictureReceipt":{"source":"/media/vocabulary/images/frost.webp","decodedAt":99},"pictureKind":"word","supportReasons":["legacy-resume-response-history-unavailable"],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":false},{"responseId":"sound-safari-v2:hard:4294967295:11:9:0:2","roundId":"sound-safari-v2:hard:4294967295:11:9:0","stage":9,"wordSlot":0,"slot":2,"eventIndex":3,"selected":"o","expected":"o","expectedSoundKey":"o","correct":true,"choices":["t","o","v","s","e","w","a","i"],"responseAt":103,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/frost-3c87160f3c.mp3","endedAt":101},"pictureReceipt":{"source":"/media/vocabulary/images/frost.webp","decodedAt":100},"pictureKind":"word","supportReasons":["legacy-resume-response-history-unavailable"],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":false},{"responseId":"sound-safari-v2:hard:4294967295:11:9:0:3","roundId":"sound-safari-v2:hard:4294967295:11:9:0","stage":9,"wordSlot":0,"slot":3,"eventIndex":4,"selected":"s","expected":"s","expectedSoundKey":"s","correct":true,"choices":["i","f","a","v","s","r","t","e"],"responseAt":104,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/frost-3c87160f3c.mp3","endedAt":102},"pictureReceipt":{"source":"/media/vocabulary/images/frost.webp","decodedAt":101},"pictureKind":"word","supportReasons":["legacy-resume-response-history-unavailable"],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":false},{"responseId":"sound-safari-v2:hard:4294967295:11:9:0:4","roundId":"sound-safari-v2:hard:4294967295:11:9:0","stage":9,"wordSlot":0,"slot":4,"eventIndex":5,"selected":"t","expected":"t","expectedSoundKey":"t","correct":true,"choices":["sh","a","z","e","s","r","t","o"],"responseAt":105,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/frost-3c87160f3c.mp3","endedAt":103},"pictureReceipt":{"source":"/media/vocabulary/images/frost.webp","decodedAt":102},"pictureKind":"word","supportReasons":["legacy-resume-response-history-unavailable"],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":false}],"assistedRetries":[{"responseId":"sound-safari-v2:hard:4294967295:11:9:0:0","roundId":"sound-safari-v2:hard:4294967295:11:9:0","stage":9,"wordSlot":0,"slot":0,"eventIndex":1,"selected":"f","expected":"f","expectedSoundKey":"f","correct":true,"choices":["s","o","f","a","e","r","i","w"],"responseAt":101,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/frost-3c87160f3c.mp3","endedAt":98},"pictureReceipt":{"source":"/media/vocabulary/images/frost.webp","decodedAt":97},"pictureKind":"word","supportReasons":["legacy-resume-response-history-unavailable","repeat-after-response"],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":false}],"acceptedResponses":[{"responseId":"sound-safari-v2:hard:4294967295:11:9:0:0","roundId":"sound-safari-v2:hard:4294967295:11:9:0","stage":9,"wordSlot":0,"slot":0,"eventIndex":1,"selected":"f","expected":"f","expectedSoundKey":"f","correct":true,"choices":["s","o","f","a","e","r","i","w"],"responseAt":101,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/frost-3c87160f3c.mp3","endedAt":98},"pictureReceipt":{"source":"/media/vocabulary/images/frost.webp","decodedAt":97},"pictureKind":"word","supportReasons":["legacy-resume-response-history-unavailable","repeat-after-response"],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":false},{"responseId":"sound-safari-v2:hard:4294967295:11:9:0:1","roundId":"sound-safari-v2:hard:4294967295:11:9:0","stage":9,"wordSlot":0,"slot":1,"eventIndex":2,"selected":"r","expected":"r","expectedSoundKey":"r","correct":true,"choices":["s","sh","v","t","z","r","e","w"],"responseAt":102,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/frost-3c87160f3c.mp3","endedAt":100},"pictureReceipt":{"source":"/media/vocabulary/images/frost.webp","decodedAt":99},"pictureKind":"word","supportReasons":["legacy-resume-response-history-unavailable"],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":false},{"responseId":"sound-safari-v2:hard:4294967295:11:9:0:2","roundId":"sound-safari-v2:hard:4294967295:11:9:0","stage":9,"wordSlot":0,"slot":2,"eventIndex":3,"selected":"o","expected":"o","expectedSoundKey":"o","correct":true,"choices":["t","o","v","s","e","w","a","i"],"responseAt":103,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/frost-3c87160f3c.mp3","endedAt":101},"pictureReceipt":{"source":"/media/vocabulary/images/frost.webp","decodedAt":100},"pictureKind":"word","supportReasons":["legacy-resume-response-history-unavailable"],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":false},{"responseId":"sound-safari-v2:hard:4294967295:11:9:0:3","roundId":"sound-safari-v2:hard:4294967295:11:9:0","stage":9,"wordSlot":0,"slot":3,"eventIndex":4,"selected":"s","expected":"s","expectedSoundKey":"s","correct":true,"choices":["i","f","a","v","s","r","t","e"],"responseAt":104,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/frost-3c87160f3c.mp3","endedAt":102},"pictureReceipt":{"source":"/media/vocabulary/images/frost.webp","decodedAt":101},"pictureKind":"word","supportReasons":["legacy-resume-response-history-unavailable"],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":false},{"responseId":"sound-safari-v2:hard:4294967295:11:9:0:4","roundId":"sound-safari-v2:hard:4294967295:11:9:0","stage":9,"wordSlot":0,"slot":4,"eventIndex":5,"selected":"t","expected":"t","expectedSoundKey":"t","correct":true,"choices":["sh","a","z","e","s","r","t","o"],"responseAt":105,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/frost-3c87160f3c.mp3","endedAt":103},"pictureReceipt":{"source":"/media/vocabulary/images/frost.webp","decodedAt":102},"pictureKind":"word","supportReasons":["legacy-resume-response-history-unavailable"],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":false}],"completions":["sound-safari-v2:hard:4294967295:11:9:0"],"motorEvents":{"emptySwings":0,"catches":0},"contentVersion":"sound-safari-v2","construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"sessionSeed":4294967295,"journeyIndex":11,"originStage":9,"legacyResume":true,"nativeV2CaptureCount":6},"sound-safari:easy:3:0:0":{"firstResponses":[{"responseId":"sound-safari-v2:easy:3:0:0:0:0","roundId":"sound-safari-v2:easy:3:0:0:0","stage":0,"wordSlot":0,"slot":0,"eventIndex":0,"selected":"ch","expected":"d","expectedSoundKey":"d","correct":false,"choices":["ch","ai","sh","d"],"responseAt":100,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/dog-22c13fd222.mp3","endedAt":98},"pictureReceipt":{"source":"/images/child-mode/cvc/dog.webp","decodedAt":97},"pictureKind":"word","supportReasons":[],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":false},{"responseId":"sound-safari-v2:easy:3:0:0:0:1","roundId":"sound-safari-v2:easy:3:0:0:0","stage":0,"wordSlot":0,"slot":1,"eventIndex":2,"selected":"o","expected":"o","expectedSoundKey":"o","correct":true,"choices":["oa","ch","oo","o"],"responseAt":102,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/dog-22c13fd222.mp3","endedAt":100},"pictureReceipt":{"source":"/images/child-mode/cvc/dog.webp","decodedAt":99},"pictureKind":"word","supportReasons":[],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":true},{"responseId":"sound-safari-v2:easy:3:0:0:0:2","roundId":"sound-safari-v2:easy:3:0:0:0","stage":0,"wordSlot":0,"slot":2,"eventIndex":3,"selected":"g","expected":"g","expectedSoundKey":"g","correct":true,"choices":["sh","g","d","oa"],"responseAt":103,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/dog-22c13fd222.mp3","endedAt":101},"pictureReceipt":{"source":"/images/child-mode/cvc/dog.webp","decodedAt":100},"pictureKind":"word","supportReasons":[],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":true}],"assistedRetries":[{"responseId":"sound-safari-v2:easy:3:0:0:0:0","roundId":"sound-safari-v2:easy:3:0:0:0","stage":0,"wordSlot":0,"slot":0,"eventIndex":1,"selected":"d","expected":"d","expectedSoundKey":"d","correct":true,"choices":["ch","ai","sh","d"],"responseAt":101,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/dog-22c13fd222.mp3","endedAt":98},"pictureReceipt":{"source":"/images/child-mode/cvc/dog.webp","decodedAt":97},"pictureKind":"word","supportReasons":["repeat-after-response"],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":false}],"acceptedResponses":[{"responseId":"sound-safari-v2:easy:3:0:0:0:0","roundId":"sound-safari-v2:easy:3:0:0:0","stage":0,"wordSlot":0,"slot":0,"eventIndex":1,"selected":"d","expected":"d","expectedSoundKey":"d","correct":true,"choices":["ch","ai","sh","d"],"responseAt":101,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/dog-22c13fd222.mp3","endedAt":98},"pictureReceipt":{"source":"/images/child-mode/cvc/dog.webp","decodedAt":97},"pictureKind":"word","supportReasons":["repeat-after-response"],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":false},{"responseId":"sound-safari-v2:easy:3:0:0:0:1","roundId":"sound-safari-v2:easy:3:0:0:0","stage":0,"wordSlot":0,"slot":1,"eventIndex":2,"selected":"o","expected":"o","expectedSoundKey":"o","correct":true,"choices":["oa","ch","oo","o"],"responseAt":102,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/dog-22c13fd222.mp3","endedAt":100},"pictureReceipt":{"source":"/images/child-mode/cvc/dog.webp","decodedAt":99},"pictureKind":"word","supportReasons":[],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":true},{"responseId":"sound-safari-v2:easy:3:0:0:0:2","roundId":"sound-safari-v2:easy:3:0:0:0","stage":0,"wordSlot":0,"slot":2,"eventIndex":3,"selected":"g","expected":"g","expectedSoundKey":"g","correct":true,"choices":["sh","g","d","oa"],"responseAt":103,"deliveryAtResponse":"delivered","pictureDelivery":"delivered","deliveryReceipt":{"source":"/audio/production/en-US/isolated_word/dog-22c13fd222.mp3","endedAt":101},"pictureReceipt":{"source":"/images/child-mode/cvc/dog.webp","decodedAt":100},"pictureKind":"word","supportReasons":[],"soundEnabled":true,"wordVisible":false,"modelUsed":false,"construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"independentOrderedSoundPractice":true}],"completions":["sound-safari-v2:easy:3:0:0:0"],"motorEvents":{"emptySwings":0,"catches":0},"contentVersion":"sound-safari-v2","construct":"heard-word-ordered-phoneme-grapheme-selection","practiceOnly":true,"sessionSeed":3,"journeyIndex":0,"originStage":0,"legacyResume":false,"nativeV2CaptureCount":4},"star-gallery:hard:4294967295:11:0":{"firstResponses":[{"responseId":"star-gallery-v2:hard:4294967295:11:0:0:their-there:repair","roundId":"star-gallery-v2:hard:4294967295:11:0:0:their-there","stage":0,"itemSlot":0,"repairId":"their-there","subtype":"usage","prompt":"Choose the right word","printedBrokenStimulus":"__ are two moons","selected":"They're","choices":["They're","Their","There"],"acceptedAnswers":["There"],"correct":false,"responseAt":100,"deliveryAtResponse":"unavailable","deliveryReceipt":null,"optionalAudioRequired":false,"spokenStimulusDelivered":false,"modelUsed":false,"supportReasons":[],"construct":"mixed-printed-language-repair","practiceOnly":true,"independentPrintedRepairPractice":false}],"assistedRetries":[{"responseId":"star-gallery-v2:hard:4294967295:11:0:0:their-there:repair","roundId":"star-gallery-v2:hard:4294967295:11:0:0:their-there","stage":0,"itemSlot":0,"repairId":"their-there","subtype":"usage","prompt":"Choose the right word","printedBrokenStimulus":"__ are two moons","selected":"There","choices":["They're","Their","There"],"acceptedAnswers":["There"],"correct":true,"responseAt":101,"deliveryAtResponse":"unavailable","deliveryReceipt":null,"optionalAudioRequired":false,"spokenStimulusDelivered":false,"modelUsed":false,"supportReasons":["repeat-after-response"],"construct":"mixed-printed-language-repair","practiceOnly":true,"independentPrintedRepairPractice":false}],"acceptedResponses":[{"responseId":"star-gallery-v2:hard:4294967295:11:0:0:their-there:repair","roundId":"star-gallery-v2:hard:4294967295:11:0:0:their-there","stage":0,"itemSlot":0,"repairId":"their-there","subtype":"usage","prompt":"Choose the right word","printedBrokenStimulus":"__ are two moons","selected":"There","choices":["They're","Their","There"],"acceptedAnswers":["There"],"correct":true,"responseAt":101,"deliveryAtResponse":"unavailable","deliveryReceipt":null,"optionalAudioRequired":false,"spokenStimulusDelivered":false,"modelUsed":false,"supportReasons":["repeat-after-response"],"construct":"mixed-printed-language-repair","practiceOnly":true,"independentPrintedRepairPractice":false}],"completions":["star-gallery-v2:hard:4294967295:11:0:0:their-there"],"motorEvents":{"hazardHits":0,"emptyCuts":0},"contentVersion":"star-gallery-v2","construct":"mixed-printed-language-repair","practiceOnly":true,"sessionSeed":4294967295,"journeyIndex":11,"originStage":0,"originRepairSlot":0,"legacyResume":false,"nativeV2RepairCount":2},"star-gallery:hard:4294967295:11:9":{"firstResponses":[{"responseId":"star-gallery-v2:hard:4294967295:11:9:0:to-too:repair","roundId":"star-gallery-v2:hard:4294967295:11:9:0:to-too","stage":9,"itemSlot":0,"repairId":"to-too","subtype":"usage","prompt":"Choose the right word","printedBrokenStimulus":"It is __ bright","selected":"two","choices":["two","to","too"],"acceptedAnswers":["too"],"correct":false,"responseAt":100,"deliveryAtResponse":"unavailable","deliveryReceipt":null,"optionalAudioRequired":false,"spokenStimulusDelivered":false,"modelUsed":false,"supportReasons":["legacy-resume-response-history-unavailable"],"construct":"mixed-printed-language-repair","practiceOnly":true,"independentPrintedRepairPractice":false}],"assistedRetries":[{"responseId":"star-gallery-v2:hard:4294967295:11:9:0:to-too:repair","roundId":"star-gallery-v2:hard:4294967295:11:9:0:to-too","stage":9,"itemSlot":0,"repairId":"to-too","subtype":"usage","prompt":"Choose the right word","printedBrokenStimulus":"It is __ bright","selected":"too","choices":["two","to","too"],"acceptedAnswers":["too"],"correct":true,"responseAt":101,"deliveryAtResponse":"unavailable","deliveryReceipt":null,"optionalAudioRequired":false,"spokenStimulusDelivered":false,"modelUsed":false,"supportReasons":["legacy-resume-response-history-unavailable","repeat-after-response"],"construct":"mixed-printed-language-repair","practiceOnly":true,"independentPrintedRepairPractice":false}],"acceptedResponses":[{"responseId":"star-gallery-v2:hard:4294967295:11:9:0:to-too:repair","roundId":"star-gallery-v2:hard:4294967295:11:9:0:to-too","stage":9,"itemSlot":0,"repairId":"to-too","subtype":"usage","prompt":"Choose the right word","printedBrokenStimulus":"It is __ bright","selected":"too","choices":["two","to","too"],"acceptedAnswers":["too"],"correct":true,"responseAt":101,"deliveryAtResponse":"unavailable","deliveryReceipt":null,"optionalAudioRequired":false,"spokenStimulusDelivered":false,"modelUsed":false,"supportReasons":["legacy-resume-response-history-unavailable","repeat-after-response"],"construct":"mixed-printed-language-repair","practiceOnly":true,"independentPrintedRepairPractice":false}],"completions":["star-gallery-v2:hard:4294967295:11:9:0:to-too"],"motorEvents":{"hazardHits":0,"emptyCuts":0},"contentVersion":"star-gallery-v2","construct":"mixed-printed-language-repair","practiceOnly":true,"sessionSeed":4294967295,"journeyIndex":11,"originStage":9,"originRepairSlot":36,"legacyResume":true,"nativeV2RepairCount":2},"star-gallery:easy:3:0:0":{"firstResponses":[{"responseId":"star-gallery-v2:easy:3:0:0:0:word-see:repair","roundId":"star-gallery-v2:easy:3:0:0:0:word-see","stage":0,"itemSlot":0,"repairId":"word-see","subtype":"sight word","prompt":"Fix the tricky word","printedBrokenStimulus":"I can __ the sun","selected":"she","choices":["see","she","sea"],"acceptedAnswers":["see"],"correct":false,"responseAt":100,"deliveryAtResponse":"unavailable","deliveryReceipt":null,"optionalAudioRequired":false,"spokenStimulusDelivered":false,"modelUsed":false,"supportReasons":[],"construct":"mixed-printed-language-repair","practiceOnly":true,"independentPrintedRepairPractice":false}],"assistedRetries":[{"responseId":"star-gallery-v2:easy:3:0:0:0:word-see:repair","roundId":"star-gallery-v2:easy:3:0:0:0:word-see","stage":0,"itemSlot":0,"repairId":"word-see","subtype":"sight word","prompt":"Fix the tricky word","printedBrokenStimulus":"I can __ the sun","selected":"see","choices":["see","she","sea"],"acceptedAnswers":["see"],"correct":true,"responseAt":101,"deliveryAtResponse":"unavailable","deliveryReceipt":null,"optionalAudioRequired":false,"spokenStimulusDelivered":false,"modelUsed":false,"supportReasons":["repeat-after-response"],"construct":"mixed-printed-language-repair","practiceOnly":true,"independentPrintedRepairPractice":false}],"acceptedResponses":[{"responseId":"star-gallery-v2:easy:3:0:0:0:word-see:repair","roundId":"star-gallery-v2:easy:3:0:0:0:word-see","stage":0,"itemSlot":0,"repairId":"word-see","subtype":"sight word","prompt":"Fix the tricky word","printedBrokenStimulus":"I can __ the sun","selected":"see","choices":["see","she","sea"],"acceptedAnswers":["see"],"correct":true,"responseAt":101,"deliveryAtResponse":"unavailable","deliveryReceipt":null,"optionalAudioRequired":false,"spokenStimulusDelivered":false,"modelUsed":false,"supportReasons":["repeat-after-response"],"construct":"mixed-printed-language-repair","practiceOnly":true,"independentPrintedRepairPractice":false}],"completions":["star-gallery-v2:easy:3:0:0:0:word-see"],"motorEvents":{"hazardHits":0,"emptyCuts":0},"contentVersion":"star-gallery-v2","construct":"mixed-printed-language-repair","practiceOnly":true,"sessionSeed":3,"journeyIndex":0,"originStage":0,"originRepairSlot":0,"legacyResume":false,"nativeV2RepairCount":2}};
async function safariGroveCompletion(id, difficulty, seed, chapter, originStage) {
  const key = `${id}:${difficulty}:${seed}:${chapter}:${originStage}`;
  assert(safariGroveParentFixtures[key], 'The recorded producer fixture must match this seed/origin exactly');
  return structuredClone(safariGroveParentFixtures[key]);
}

test('Safari and Grove preserve held zero, uint32 seed, chapter and positive legacy without borrowing Bridge revision tags', () => {
  for (const id of ['sound-safari', 'star-gallery']) {
    for (const seed of [0, 0xffffffff]) for (const chapter of [0, 11]) for (const level of [0, 7]) {
      const held = applyCheckpoint({}, id, 'hard', level, 10, seed, chapter);
      assert.deepEqual(readPlayerCheckpoint(held, id, 'hard'), { level, totalLevels: 10, sessionSeed: seed, chapter });
    }
    const legacy = { [id]: { checkpoints: { easy: { level: 3, totalLevels: 10, chapter: 2 } } } };
    assert.deepEqual(readPlayerCheckpoint(legacy, id, 'easy'), { level: 3, totalLevels: 10, chapter: 2 });
    for (const [level, total, seed, chapter] of [[0, 10, undefined, 0], [0, 10, -1, 0], [0, 10, 0x100000000, 0], [0, 9, 3, 0], [0, 10, 3, 12]]) {
      assert.equal(readPlayerCheckpoint({ [id]: { checkpoints: { easy: { level, totalLevels: total, sessionSeed: seed, chapter } } } }, id, 'easy'), null);
    }
  }
  assert.equal(readPlayerCheckpoint(applyCheckpoint({}, 'sound-sort-factory', 'easy', 0, 10), 'sound-sort-factory', 'easy'), null);
});

test('Safari heard-capture and Grove mixed printed repairs retain actual source rows through local save, queue and hydration', async t => {
  for (const id of ['sound-safari', 'star-gallery']) for (const originStage of [0, 9]) {
    const scope = `${id}-parent-${originStage}`, storage = rocketBrowser(t, scope);
    const evidence = await safariGroveCompletion(id, 'hard', 0xffffffff, 11, originStage), original = structuredClone(evidence);
    const local = { privateMutable: `${id}-local-only`, evidence: structuredClone(evidence) };
    storage.setItem(`literacy-guide-learn-games:${scope}`, JSON.stringify({ games: { [id]: { practiceSession: { hard: local } } } }));
    const saved = saveLearnGameResult(scope, id, 2, 10, evidence.completions.length, evidence, 'hard', 11);
    const completion = saved.games[id].practiceRecord.completions[0], context = completion.practiceContext;
    assert.equal(completion.contentVersion, evidence.contentVersion); assert.equal(context.construct, evidence.construct);
    assert.equal(context.originStage, originStage); assert.equal(context.legacyResume, originStage > 0);
    assert.equal(context.sessionSeed, 0xffffffff); assert.equal(context.journeyIndex, 11);
    assert.equal(context.formalAssessment, false); assert.equal(context.masteryClaim, false); assert.equal(context.motorCreatesEvidence, false);
    assert.equal(context[id === 'sound-safari' ? 'nativeV2CaptureCount' : 'nativeV2RepairCount'], evidence.firstResponses.length + 1);
    assert.deepEqual(completion.steps, evidence.firstResponses); assert.deepEqual(completion.assistedRetries, evidence.assistedRetries);
    assert.equal(completion.steps[0].correct, false); assert.equal(completion.assistedRetries[0].correct, true);
    assert.equal(completion.independent, false); assert.equal(completion.practiceOnly, true);
    if (id === 'star-gallery') {
      assert.equal(context.originRepairSlot, originStage * 4);
      assert.deepEqual(context.taskKinds, [...new Set(evidence.firstResponses.map(row => row.subtype))]);
      assert(completion.steps.every(row => row.optionalAudioRequired === false && row.spokenStimulusDelivered === false));
    } else assert(completion.steps.every(row => row.deliveryReceipt.source.startsWith('/') && row.deliveryReceipt.endedAt <= row.responseAt));
    const queued = readProgressQueueRecords(storage).find(row => row.entry.payload.games[id]?.practiceRecord);
    assert(queued); assert.deepEqual(queued.entry.payload.games[id].practiceRecord.completions[0], completion);
    assert.equal(queued.entry.payload.games[id].practiceSession, undefined); assert(!JSON.stringify(queued).includes(`${id}-local-only`));
    const hydrated = computeHydratedValue('learn_games', '__all__', saved, queued.entry.payload);
    assert.deepEqual(hydrated.games[id].practiceSession.hard, local); assert.deepEqual(hydrated.games[id].practiceRecord.completions[0], completion);
    evidence.firstResponses[0].correct = true;
    assert.deepEqual(completion.steps, original.firstResponses, 'Retry or caller mutation cannot replace the first native wrong response');
    clearProgressSyncSession();
  }
});

test('Safari and Grove reject forged origin, count, construct and unsupported cue or mixed-row provenance', async t => {
  for (const id of ['sound-safari', 'star-gallery']) {
    const scope = `${id}-invalid-parent`, storage = rocketBrowser(t, scope);
    const evidence = await safariGroveCompletion(id, 'easy', 3, 0, 0), countName = id === 'sound-safari' ? 'nativeV2CaptureCount' : 'nativeV2RepairCount';
    const patches = [{ originStage: -1 }, { originStage: 10 }, { originStage: 2 }, { legacyResume: 'yes' },
      { sessionSeed: 0x100000000 }, { journeyIndex: 1 }, { construct: 'independent-grammar-assessment' },
      { contentVersion: 'wrong-v99' }, { practiceOnly: false }, { [countName]: 0 }, { [countName]: evidence[countName] - 1 }];
    if (id === 'star-gallery') patches.push({ originRepairSlot: 4 });
    for (const mutate of [row => { row.construct = 'foreign-task'; }, row => { row.stage = 3; },
      row => { row.deliveryAtResponse = 'delivered'; row.deliveryReceipt = { source: '/actual.mp3', endedAt: row.responseAt + 1 }; },
      row => { row.modelUsed = true; row[id === 'sound-safari' ? 'independentOrderedSoundPractice' : 'independentPrintedRepairPractice'] = true; }]) {
      const forged = structuredClone(evidence.firstResponses); mutate(forged[0]); patches.push({ firstResponses: forged });
    }
    for (const patch of patches) {
      const result = saveLearnGameResult(scope, id, 1, 1, 1, { ...evidence, ...patch }, 'easy', 0);
      const fallback = result.games[id].practiceRecord.completions.at(-1);
      assert.equal(fallback.contentVersion, 'learn-game-practice-v1', JSON.stringify(patch)); assert.equal(fallback.practiceContext, undefined);
    }
    assert(storage.length > 0); clearProgressSyncSession();
  }
});
