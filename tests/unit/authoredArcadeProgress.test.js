import test from 'node:test';
import assert from 'node:assert/strict';
import { SOUND_BEAT_CONTENT_VERSION, LETTER_LEAP_CONTENT_VERSION, SOUND_RACER_CONTENT_VERSION, SPELL_SKATE_CONTENT_VERSION, SOUNDKEYS_CONTENT_VERSION, RHYME_POP_CONTENT_VERSION, REEL_READ_CONTENT_VERSION } from '../../src/data/arcadeContentVersions.js';
import { readPlayerCheckpoint } from '../../src/components/learn/games/arcadeLearningContext.js';
import { applyCheckpoint, readCheckpoint } from '../../src/utils/gameCheckpoints.js';
import { saveLearnGameResult } from '../../src/utils/learnGamesProgress.js';
import { sanitizeCloudProgressPayload, computeHydratedValue } from '../../src/utils/progressMerge.js';
import { clearProgressSyncSession, configureProgressSync } from '../../src/utils/progressSync.js';
import { readProgressQueueRecords } from '../../src/utils/progressQueue.js';

test('held upgraded Arcade tasks resume at zero with a safe seed and outing', () => {
  for (const id of ['sound-beat', 'letter-leap', 'sound-racer', 'grammar-grind', 'soundkeys', 'rhyme-pop', 'reel-read']) {
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
