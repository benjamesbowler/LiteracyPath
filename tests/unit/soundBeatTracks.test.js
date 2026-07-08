import test from "node:test";
import assert from "node:assert/strict";
import {
  soundBeatLadder,
  soundBeatStars
} from "../../src/utils/soundBeatTracks.js";

test("soundBeatLadder returns 10 levels for every difficulty", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    assert.equal(soundBeatLadder(difficulty).length, 10);
  }
});

test("Sound Beat does not repeat words inside a difficulty", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    const seen = new Set();
    for (const level of soundBeatLadder(difficulty)) {
      for (const item of level.items) {
        const key = item.say;
        assert.ok(!seen.has(key), `${difficulty} repeated ${key}`);
        seen.add(key);
      }
    }
  }
});

test("Sound Beat beat plans are complete and deterministic", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    const first = soundBeatLadder(difficulty);
    const second = soundBeatLadder(difficulty);
    assert.deepEqual(first, second);
    for (const level of first) {
      assert.ok(level.items.length >= 1, `${difficulty}/${level.level} has no items`);
      for (const item of level.items) assert.ok(item.beats.length >= 1, `${item.say} has no beats`);
    }
  }
});

test("Sound Beat ramps timing and enters sentence mode on hard late levels", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    const ladder = soundBeatLadder(difficulty);
    for (let index = 1; index < ladder.length; index += 1) {
      assert.ok(ladder[index].hitWindowMs <= ladder[index - 1].hitWindowMs, `${difficulty} window widened`);
      assert.ok(ladder[index].bpm >= ladder[index - 1].bpm, `${difficulty} bpm slowed`);
    }
  }
  for (const level of soundBeatLadder("hard").slice(6)) {
    assert.equal(level.mode, "sentence");
  }
});

test("soundBeatStars follows the shared star rubric", () => {
  assert.equal(soundBeatStars({ correct: 0, total: 8, mistakes: 0 }), 0);
  assert.equal(soundBeatStars({ correct: 8, total: 8, mistakes: 0 }), 3);
  assert.equal(soundBeatStars({ correct: 6, total: 8, mistakes: 4 }), 2);
  assert.equal(soundBeatStars({ correct: 2, total: 8, mistakes: 7 }), 1);
});
