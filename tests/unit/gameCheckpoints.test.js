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
