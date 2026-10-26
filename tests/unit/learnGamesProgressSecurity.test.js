import test from "node:test";
import assert from "node:assert/strict";
import { normalizeLearnGamesProgress } from "../../src/utils/learnGamesProgressContract.js";
import { computeHydratedValue, sanitizeCloudProgressPayload } from "../../src/utils/progressMerge.js";
import { mergeProgressQueueEntries } from "../../src/utils/progressQueue.js";
import { loadLearnGamesProgress, saveLearnGameResult, saveLearnGamesSettings } from "../../src/utils/learnGamesProgress.js";
import { clearProgressSyncSession } from "../../src/utils/progressSync.js";

const legacy = () => ({ difficulty: "hard", soundEnabled: false, games: {
  broken: { highScore: "bad", stars: 99, plays: -1, wordsCompleted: null, checkpoints: [], bestSplits: false },
  scalar: null,
  valid: { highScore: 42, stars: 2, plays: 3, wordsCompleted: 7,
    checkpoints: { practice: null, easy: { level: 2 } },
    bestSplits: { hard: { 3: { time: 1500 } } },
    practiceRecord: { v: 3, completions: [] } }
} });

test("legacy recovery removes only malformed fields and preserves genuine state without mutating its input", () => {
  const input = legacy(), copy = structuredClone(input);
  const normalized = normalizeLearnGamesProgress(input);
  assert.deepEqual(normalized.games.broken, {});
  assert.equal(normalized.games.scalar, undefined);
  assert.deepEqual(normalized.games.valid, input.games.valid);
  assert.equal(normalized.difficulty, "hard");
  assert.equal(normalized.soundEnabled, false);
  assert.deepEqual(input, copy);
  for (const games of [null, [], "bad", 8]) assert.deepEqual(normalizeLearnGamesProgress({ difficulty: "easy", games }), { difficulty: "easy" });
  for (const input of [null, [], "bad", 8]) assert.deepEqual(normalizeLearnGamesProgress(input), {});
});

test("actual hydration repairs both sources before a poisoned cloud counter can overwrite healthy local progress", () => {
  const local = { games: { broken: { highScore: 30, stars: 1, checkpoints: { easy: { level: 4 } } }, localPoison: { highScore: NaN } } };
  const hydrated = computeHydratedValue("learn_games", "__all__", local, legacy());
  assert.equal(hydrated.games.broken.highScore, 30);
  assert.deepEqual(hydrated.games.broken.checkpoints, local.games.broken.checkpoints);
  assert.deepEqual(hydrated.games.localPoison, {});
  const outgoing = sanitizeCloudProgressPayload("learn_games", { ...hydrated, musicEnabled: false });
  assert.equal(outgoing.games.broken.highScore, 30);
  assert.deepEqual(outgoing.games.valid, legacy().games.valid);
});

test("queued legacy full-map writes are repaired while local-only practice sessions stay local", () => {
  const old = { studentId: "synthetic", area: "learn_games", key: "__all__", payload: legacy() };
  const next = { ...old, payload: { games: { broken: { highScore: 10 }, resumed: {
    checkpoints: { practice: { id: "new", index: 0 } }, practiceSession: { deviceOnly: true }
  } } } };
  const merged = mergeProgressQueueEntries(old, next).payload;
  assert.equal(merged.games.broken.highScore, 10);
  assert.equal(merged.games.resumed.practiceSession, undefined);
  assert.deepEqual(merged.games.resumed.checkpoints.practice, { id: "new", index: 0 });
  assert.deepEqual(sanitizeCloudProgressPayload("learn_games", { games: [] }), {});
});

test("local legacy caches recover before game arithmetic and ordinary settings saves", t => {
  const values = new Map(), before = globalThis.window;
  globalThis.window = { localStorage: {
    get length() { return values.size; }, key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key)
  }, addEventListener() {}, removeEventListener() {}, dispatchEvent() {}, setTimeout() { return 1; }, clearTimeout() {} };
  t.after(() => { clearProgressSyncSession(); globalThis.window = before; });
  values.set("literacy-guide-learn-games:legacy-recovery", JSON.stringify(legacy()));
  assert.deepEqual(loadLearnGamesProgress("legacy-recovery").games.broken, {});
  const result = saveLearnGameResult("legacy-recovery", "broken", 2, 50, 4);
  assert.equal(result.games.broken.highScore, 50);
  assert.equal(result.games.broken.plays, 1);
  saveLearnGamesSettings("legacy-recovery", { difficulty: "easy" });
  const saved = loadLearnGamesProgress("legacy-recovery");
  assert.equal(saved.games.broken.highScore, 50);
  assert.equal(saved.difficulty, "easy");
  assert.deepEqual(saved.games.valid, legacy().games.valid);
});
