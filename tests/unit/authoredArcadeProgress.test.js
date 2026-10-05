import test from 'node:test';
import assert from 'node:assert/strict';
import { SOUND_BEAT_CONTENT_VERSION, LETTER_LEAP_CONTENT_VERSION, SOUND_RACER_CONTENT_VERSION, SPELL_SKATE_CONTENT_VERSION, SOUNDKEYS_CONTENT_VERSION, RHYME_POP_CONTENT_VERSION, REEL_READ_CONTENT_VERSION, WORD_CLIMB_CONTENT_VERSION, SENTENCE_EXPRESS_CONTENT_VERSION } from '../../src/data/arcadeContentVersions.js';
import { readPlayerCheckpoint } from '../../src/components/learn/games/arcadeLearningContext.js';
import { applyCheckpoint, readCheckpoint } from '../../src/utils/gameCheckpoints.js';
import { saveLearnGameResult } from '../../src/utils/learnGamesProgress.js';
import { sanitizeCloudProgressPayload, computeHydratedValue } from '../../src/utils/progressMerge.js';
import { clearProgressSyncSession, configureProgressSync } from '../../src/utils/progressSync.js';
import { readProgressQueueRecords } from '../../src/utils/progressQueue.js';

test('held upgraded Arcade tasks resume at zero with a safe seed and outing', () => {
  for (const id of ['sound-beat', 'letter-leap', 'sound-racer', 'grammar-grind', 'soundkeys', 'rhyme-pop', 'reel-read', 'word-climb', 'sentence-express']) {
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
  assert.equal(readPlayerCheckpoint(applyCheckpoint({}, 'word-bridge', 'easy', 0, 10, 913, 2), 'word-bridge', 'easy'), null);
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
