import test from "node:test";
import assert from "node:assert/strict";
import {
  soundSafariLadder,
  soundSafariStars
} from "../../src/utils/soundSafariRounds.js";

test("soundSafariLadder returns 10 levels for every difficulty", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    assert.equal(soundSafariLadder(difficulty).length, 10);
  }
});

test("Sound Safari uses finite unique words inside each difficulty", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    const seen = new Set();
    for (const level of soundSafariLadder(difficulty)) {
      assert.equal(level.words.length, 3);
      for (const item of level.words) {
        assert.ok(!seen.has(item.word), `${difficulty} repeated ${item.word}`);
        seen.add(item.word);
      }
    }
    assert.equal(seen.size, 30);
  }
});

test("Sound Safari words are segmented and decoys never duplicate needed sounds", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    for (const level of soundSafariLadder(difficulty)) {
      for (const item of level.words) {
        assert.ok(item.graphemes.length >= 2, `${item.word} has too few sounds`);
        assert.ok(item.decoys.length >= 4, `${item.word} has too few decoys`);
        for (const decoy of item.decoys) {
          assert.ok(!item.graphemes.includes(decoy), `${item.word} decoy ${decoy} is a needed grapheme`);
        }
      }
    }
  }
});

test("Sound Safari worlds map to the three arcade themes", () => {
  assert.equal(soundSafariLadder("easy")[0].world, "meadow");
  assert.equal(soundSafariLadder("medium")[0].world, "dino");
  assert.equal(soundSafariLadder("hard")[0].world, "moonwood");
});

test("soundSafariStars follows the shared star rubric", () => {
  assert.equal(soundSafariStars({ correct: 0, total: 8, mistakes: 0 }), 0);
  assert.equal(soundSafariStars({ correct: 8, total: 8, mistakes: 0 }), 3);
  assert.equal(soundSafariStars({ correct: 6, total: 8, mistakes: 4 }), 2);
  assert.equal(soundSafariStars({ correct: 2, total: 8, mistakes: 7 }), 1);
});
