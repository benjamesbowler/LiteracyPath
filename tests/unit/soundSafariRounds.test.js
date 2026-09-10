import test from "node:test";
import assert from "node:assert/strict";
import {
  selectSafariCapture,
  soundSafariAudioCoverage,
  soundSafariLadder,
  soundSafariPresentedStars,
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

test("every Sound Safari task has recorded gold-voice word audio", () => {
  const coverage = soundSafariAudioCoverage();
  for (const [difficulty, result] of Object.entries(coverage)) {
    assert.equal(result.total, 30, `${difficulty} bank must keep 30 words`);
    assert.deepEqual(result.missing, [], `${difficulty} has silent words`);
    assert.equal(result.recorded.length, 30);
  }
});

test("ambiguous overlapping Safari hits cannot turn a correct aim into a false miss", () => {
  const correct = { critter: { label: "sh", r: 42, hitRadius: 80 }, distance: 50, inLabel: false };
  const marginallyCloserWrong = { critter: { label: "ch", r: 42, hitRadius: 80 }, distance: 43, inLabel: false };
  assert.equal(selectSafariCapture([marginallyCloserWrong, correct], "sh"), correct);

  const intentionalWrong = { ...marginallyCloserWrong, distance: 8 };
  assert.equal(selectSafariCapture([intentionalWrong, correct], "sh"), intentionalWrong);
  const exactCorrectLabel = { ...correct, inLabel: true };
  assert.equal(selectSafariCapture([exactCorrectLabel, intentionalWrong], "sh"), exactCorrectLabel);
});

test("soundSafariStars follows the shared star rubric", () => {
  assert.equal(soundSafariStars({ correct: 0, total: 8, mistakes: 0 }), 0);
  assert.equal(soundSafariStars({ correct: 8, total: 8, mistakes: 0 }), 3);
  assert.equal(soundSafariStars({ correct: 6, total: 8, mistakes: 4 }), 2);
  assert.equal(soundSafariStars({ correct: 2, total: 8, mistakes: 7 }), 1);
});

test("a flawless resumed Safari run scores only the units presented this session", () => {
  // A child resuming halfway may see 18 units even though the full ladder has
  // many more. Those unseen earlier units must never enter this run's rubric.
  assert.equal(soundSafariPresentedStars({ correct: 18, presentedUnits: 18, mistakes: 0 }), 3);
  assert.equal(soundSafariPresentedStars({ correct: 0, presentedUnits: 0, mistakes: 0 }), 0);
});
