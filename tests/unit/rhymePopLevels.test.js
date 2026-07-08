import test from "node:test";
import assert from "node:assert/strict";
import {
  rhymePopLadder,
  rhymePopStars
} from "../../src/utils/rhymePopLevels.js";

test("rhymePopLadder returns 10 levels for every difficulty", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    assert.equal(rhymePopLadder(difficulty).length, 10);
  }
});

test("Rhyme Pop levels use finite unique rhyme targets", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    for (const level of rhymePopLadder(difficulty)) {
      assert.equal(new Set(level.rhymingWords).size, level.rhymingWords.length, `${difficulty}/${level.level} repeats a rhyme`);
      assert.ok(!level.rhymingWords.includes(level.targetWord), `${difficulty}/${level.level} repeats the target word`);
      assert.ok(level.rhymingWords.length >= 6, `${difficulty}/${level.level} needs enough rhyming balloons`);
    }
  }
});

test("Rhyme Pop distractors stay separate and outnumber visible rhymes", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    for (const level of rhymePopLadder(difficulty)) {
      const rhymes = new Set(level.rhymingWords);
      assert.equal(new Set(level.distractors).size, level.distractors.length, `${difficulty}/${level.level} repeats a distractor`);
      for (const word of level.distractors) {
        assert.ok(!rhymes.has(word), `${difficulty}/${level.level} distractor overlaps rhyme: ${word}`);
      }
      assert.ok(level.visibleBalloons > level.correctVisible, `${difficulty}/${level.level} should show mostly distractors`);
    }
  }
});

test("rhymePopStars follows the shared star rubric", () => {
  assert.equal(rhymePopStars({ correct: 0, total: 6, mistakes: 0 }), 0);
  assert.equal(rhymePopStars({ correct: 6, total: 6, mistakes: 0 }), 3);
  assert.equal(rhymePopStars({ correct: 5, total: 6, mistakes: 2 }), 2);
  assert.equal(rhymePopStars({ correct: 2, total: 6, mistakes: 6 }), 1);
});
