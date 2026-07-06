import test from "node:test";
import assert from "node:assert/strict";
import {
  levelPlan,
  difficultyLadder,
  worldForGameDifficulty,
  LEVELS_PER_DIFFICULTY,
  SENTENCE_START_LEVEL
} from "../../src/utils/curriculumLadder.js";
import { makeCatchUp } from "../../src/utils/catchUpQueue.js";

const avgLen = words => words.reduce((s, w) => s + w.length, 0) / (words.length || 1);

test("difficulty maps to the right world/cast band", () => {
  assert.equal(worldForGameDifficulty("low"), "meadow");
  assert.equal(worldForGameDifficulty("easy"), "meadow");
  assert.equal(worldForGameDifficulty("medium"), "dino");
  assert.equal(worldForGameDifficulty("hard"), "moonwood");
  assert.equal(worldForGameDifficulty("high"), "moonwood");
});

test("every difficulty has 10 ramped, non-empty levels", () => {
  for (const diff of ["low", "mid", "high"]) {
    const ladder = difficultyLadder("letter-leap", diff);
    assert.equal(ladder.length, LEVELS_PER_DIFFICULTY);
    for (const lvl of ladder) assert.ok(lvl.targets.length > 0, `${diff} L${lvl.level} empty`);
  }
});

test("nothing repeats within a difficulty (words)", () => {
  for (const diff of ["low", "mid"]) {
    const words = difficultyLadder("letter-leap", diff).flatMap(l => l.targets);
    assert.equal(new Set(words).size, words.length, `${diff} repeated a word`);
  }
});

test("word levels get harder (longer/blends) as you climb", () => {
  for (const diff of ["low", "mid"]) {
    const levels = difficultyLadder("letter-leap", diff).filter(l => l.mode === "letters");
    for (let i = 1; i < levels.length; i += 1) {
      assert.ok(
        avgLen(levels[i].targets) >= avgLen(levels[i - 1].targets) - 0.001,
        `${diff} L${i} is not >= L${i - 1} in length`
      );
    }
  }
});

test("Moonwood/hard graduates to sentence-building on the top levels", () => {
  const ladder = difficultyLadder("letter-leap", "high");
  const seen = [];
  for (const lvl of ladder) {
    if (lvl.level >= SENTENCE_START_LEVEL) {
      assert.equal(lvl.mode, "sentence", `hard L${lvl.level} should be sentence mode`);
      for (const s of lvl.targets) {
        assert.ok(Array.isArray(s) && s.length >= 3, "a sentence needs >= 3 orderable words");
        seen.push(s.join(" "));
      }
    } else {
      assert.equal(lvl.mode, "letters");
    }
  }
  assert.equal(new Set(seen).size, seen.length, "a sentence repeated");
});

test("plans are deterministic (same inputs -> same plan)", () => {
  assert.deepEqual(levelPlan("letter-leap", "mid", 4), levelPlan("letter-leap", "mid", 4));
});

test("catch-up: a missed target comes back and the level only ends when all are caught", () => {
  const q = makeCatchUp(["cat", "dog", "sun"]);
  assert.equal(q.total, 3);
  assert.equal(q.peek(), "cat");

  q.miss();                         // miss "cat" -> requeued
  assert.notEqual(q.peek(), "cat"); // something else is now first
  assert.equal(q.isDone, false);

  // Work the rest, and "cat" must resurface before we can finish.
  const caught = [];
  let guard = 0;
  while (!q.isDone && guard < 50) {
    caught.push(q.peek());
    q.complete();
    guard += 1;
  }
  assert.ok(q.isDone, "level never completed");
  assert.ok(caught.includes("cat"), "missed target never came back");
  assert.equal(q.completed, 3);
});

test("catch-up with no misses finishes in order", () => {
  const q = makeCatchUp(["a", "b"]);
  assert.equal(q.peek(), "a");
  assert.equal(q.complete(), false);
  assert.equal(q.peek(), "b");
  assert.equal(q.complete(), true);
  assert.equal(q.isDone, true);
});
