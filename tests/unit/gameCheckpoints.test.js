import test from "node:test";
import assert from "node:assert/strict";
import { applyCheckpoint, removeCheckpoint, readCheckpoint } from "../../src/utils/gameCheckpoints.js";

test("apply then read returns the saved level for that difficulty", () => {
  const g = applyCheckpoint({}, "rocket-run", "hard", 3, 5);
  assert.deepEqual(readCheckpoint(g, "rocket-run", "hard"), { level: 3, totalLevels: 5 });
});

test("checkpoints are scoped per difficulty (easy != hard)", () => {
  let g = applyCheckpoint({}, "letter-leap", "easy", 2, 10);
  g = applyCheckpoint(g, "letter-leap", "hard", 7, 10);
  assert.equal(readCheckpoint(g, "letter-leap", "easy").level, 2);
  assert.equal(readCheckpoint(g, "letter-leap", "hard").level, 7);
});

test("level 0 (or missing) is NOT resumable", () => {
  assert.equal(readCheckpoint({}, "rocket-run", "easy"), null);
  const g = applyCheckpoint({}, "rocket-run", "easy", 0, 5);
  assert.equal(readCheckpoint(g, "rocket-run", "easy"), null);
});

test("remove clears only that difficulty's checkpoint", () => {
  let g = applyCheckpoint({}, "letter-leap", "easy", 2, 10);
  g = applyCheckpoint(g, "letter-leap", "hard", 7, 10);
  g = removeCheckpoint(g, "letter-leap", "easy");
  assert.equal(readCheckpoint(g, "letter-leap", "easy"), null);
  assert.equal(readCheckpoint(g, "letter-leap", "hard").level, 7);
});

test("apply is immutable + preserves other game fields (stars/highScore)", () => {
  const start = { "rocket-run": { stars: 3, highScore: 120 } };
  const g = applyCheckpoint(start, "rocket-run", "medium", 4, 5);
  assert.equal(g["rocket-run"].stars, 3);
  assert.equal(g["rocket-run"].highScore, 120);
  assert.equal(start["rocket-run"].checkpoints, undefined); // original untouched
});

test('Bridge checkpoint revision is optional for old saves, whitelisted for fresh runs and isolated from other games', () => {
  for (const contentVersion of ['word-bridge-v2', 'word-bridge-v3']) {
    const games = applyCheckpoint({}, 'word-bridge', 'hard', 4, 10, 0xffffffff, 11, { contentVersion });
    assert.deepEqual(readCheckpoint(games, 'word-bridge', 'hard'), { level: 4, totalLevels: 10, chapter: 11, contentVersion, sessionSeed: 0xffffffff });
  }
  const old = applyCheckpoint({}, 'word-bridge', 'hard', 4, 10, 3, 0);
  assert.equal(readCheckpoint(old, 'word-bridge', 'hard').contentVersion, undefined);
  assert.strictEqual(applyCheckpoint(old, 'word-bridge', 'hard', 5, 10, 3, 0, { contentVersion: 'word-bridge-v4' }), old);
  old['word-bridge'].checkpoints.hard.contentVersion = 'word-bridge-v4';
  assert.equal(readCheckpoint(old, 'word-bridge', 'hard'), null);
  const unrelated = applyCheckpoint({}, 'letter-leap', 'easy', 2, 10, 3, 0, { contentVersion: 'word-bridge-v3' });
  assert.equal(unrelated['letter-leap'].checkpoints.easy.contentVersion, undefined);
});

test('actual host Continue holds its version after clearing the dialog, while Next/Replay/start-over clear it', async () => {
  const { readFileSync } = await import('node:fs');
  const { parse } = await import('@babel/parser');
  const source = readFileSync('src/components/learn/games/GamePlayer.jsx', 'utf8');
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const find = (node, name) => {
    if (!node || typeof node !== 'object') return null;
    if (node.type === 'FunctionDeclaration' && node.id?.name === name) return node;
    for (const value of Object.values(node)) for (const child of Array.isArray(value) ? value : [value]) {
      const match = find(child, name); if (match) return match;
    }
    return null;
  };
  const make = (name, environment) => {
    const node = find(ast, name); assert.ok(node);
    return Function(...Object.keys(environment), source.slice(node.start, node.end) + `; return ${name};`)(...Object.values(environment));
  };
  let held = 'word-bridge-v2', resumePoint = { level: 4, contentVersion: held };
  let level, resumed, seed = 3, chapter = 0;
  const setters = { setCheckpointContentVersion: value => { held = value; }, setResumePoint: value => { resumePoint = value; },
    setStartLevel: value => { level = value; }, setResumedCheckpoint: value => { resumed = value; },
    setSessionSeed: fn => { seed = fn(seed); }, setChapterIndex: value => { chapter = value; },
    setRunIndex() {}, setDifficulty() {}, setMemoryStartBoard() {}, setShowPause() {} };
  const environment = { ...setters, game: { id: 'word-bridge' }, resumePoint, difficulty: 'hard', journey: { label: 'Cup' }, chapterIndex: chapter,
    pendingResultRef: { current: null }, savedResultRef: { current: {} }, engineRef: { current: { pause() {} } },
    cancelSpeech() {}, stopCueAudio() {}, cancelGameSfx() {}, handleSessionStart() {}, clearGameCheckpoint() {}, progressScopeKey: 'unit',
    readPlayerCheckpoint() { throw new Error('same-difficulty Replay must not reuse an old checkpoint'); },
    loadLearnGamesProgress: () => ({ games: {} }), nextArcadeChapter: () => 1, newGameSeed: previous => previous + 1 };
  make('continueGame', environment)(); assert.equal(held, 'word-bridge-v2'); assert.equal(resumePoint, null); assert.equal(level, 4); assert.equal(resumed, true);
  for (const advance of [false, true]) {
    held = 'word-bridge-v2'; make('startAnotherRun', environment)(advance);
    assert.equal(held, undefined); assert.equal(resumed, false); assert.equal(level, 0); assert.equal(resumePoint, null);
  }
  for (const name of ['restartGame', 'restartCurrentRun']) {
    held = 'word-bridge-v3'; make(name, environment)(); assert.equal(held, undefined); assert.equal(level, 0); assert.equal(resumed, false);
  }
  assert.equal(chapter, 1);
});
