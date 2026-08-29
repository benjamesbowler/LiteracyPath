import test from "node:test";
import assert from "node:assert/strict";
import {
  wordsStartingWith,
  wordsStartingWithTargetSound,
  wordStartsWithTargetSound,
  rocketRunTargets,
  buildRocketRunRound,
  rocketRunStars,
  rocketRunLadder
} from "../../src/utils/rocketRunRounds.js";
import { onsetGrapheme, sharesSound } from "../../src/components/elQuest/elQuestEngine.js";

test("rocketRunTargets are all onset-able and exclude final-only graphemes", () => {
  const targets = rocketRunTargets();
  assert.ok(targets.length >= 15, `expected a healthy set of targets, got ${targets.length}`);
  for (const g of ["x", "all", "ng", "nk"]) {
    assert.ok(!targets.includes(g), `"${g}" is final-only and must not be a target`);
  }
  for (const g of ["s", "m", "t", "sh", "ch"]) {
    assert.ok(targets.includes(g), `expected "${g}" to be a valid target`);
  }
});

test("every spelling pool starts with the target grapheme", () => {
  for (const g of rocketRunTargets()) {
    for (const word of wordsStartingWith(g)) {
      assert.equal(onsetGrapheme(word), g, `"${word}" listed for "${g}" but its onset is "${onsetGrapheme(word)}"`);
    }
  }
});

test("every listening pool matches the exact production target sound", () => {
  for (const g of rocketRunTargets()) {
    for (const word of wordsStartingWithTargetSound(g)) {
      assert.equal(wordStartsWithTargetSound(word, g), true, `${word} does not model the ${g} cue`);
    }
  }
  for (const [target, word] of [["c", "city"], ["g", "gem"], ["a", "apron"], ["i", "item"], ["th", "them"]]) {
    assert.equal(wordStartsWithTargetSound(word, target), false, `${word} must not earn ${target} sound credit`);
  }
});

test("every target has a deep word pool (12+) so rounds don't recycle the same words", () => {
  for (const g of rocketRunTargets()) {
    const pool = wordsStartingWithTargetSound(g);
    assert.ok(pool.length >= 12, `${g}: only ${pool.length} onset words — rounds would recycle`);
  }
});

test("hard short-vowel and z rounds keep six words inside the 4-6 letter band", () => {
  for (const target of ["a", "e", "i", "o", "z"]) {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const round = buildRocketRunRound(target, { count: 6, difficulty: "hard" });
      assert.equal(round.correct.length, 6, `${target} hard round starved`);
      assert.ok(
        round.correct.every(word => word.length >= 4 && word.length <= 6),
        `${target} hard round left its length band: ${round.correct.join(", ")}`
      );
    }
  }
});

test("every round is winnable and every distractor is sound-distinct from the target", () => {
  for (const g of rocketRunTargets()) {
    for (let i = 0; i < 12; i += 1) {
      const round = buildRocketRunRound(g, { count: 6 });
      // Winnable: there are correct words to catch, and the target is reachable.
      assert.ok(round.needed > 0, `${g}: round has nothing to catch`);
      assert.equal(round.sequence.filter(s => s.correct).length, round.needed, `${g}: needed mismatch`);
      // Fair: no distractor shares the target's onset sound (would be a false miss).
      for (const item of round.sequence) {
        if (item.correct) {
          assert.equal(wordStartsWithTargetSound(item.word, g), true,
            `${g}: correct word "${item.word}" does not match the production cue`);
        } else {
          assert.ok(!sharesSound(onsetGrapheme(item.word), g),
            `${g}: distractor "${item.word}" shares the target sound`);
        }
      }
      // Correct and distractor sets never overlap.
      const correctSet = new Set(round.correct);
      assert.ok(round.distractors.every(w => !correctSet.has(w)), `${g}: a word is both correct and distractor`);
    }
  }
});

test("a round never repeats a word (no 'vest, vest, vest') and brings more distractors", () => {
  for (const g of rocketRunTargets()) {
    for (let i = 0; i < 12; i += 1) {
      const round = buildRocketRunRound(g, { count: 6, difficulty: "easy" });
      const words = round.sequence.map(s => s.word);
      assert.equal(new Set(words).size, words.length, `${g}: a word repeated in the round`);
      assert.ok(round.distractors.length >= round.correct.length, `${g}: expected at least as many distractors as correct`);
    }
  }
});

test("rocketRunLadder: 10 distinct ramped targets; hard has digraphs, easy doesn't", () => {
  const isDigraph = g => /^(sh|ch|th|ng|ck|qu)$/.test(g);
  for (const d of ["easy", "medium", "hard"]) {
    const L = rocketRunLadder(d);
    assert.equal(L.length, 10, `${d} not 10 levels`);
    assert.equal(new Set(L).size, 10, `${d} repeated a target`);
  }
  assert.ok(rocketRunLadder("hard").some(isDigraph), "hard ladder should include a digraph");
  assert.ok(!rocketRunLadder("easy").some(isDigraph), "easy ladder should avoid digraphs");
});

test("rocketRunStars follow the 3/2/1/0 rule", () => {
  assert.equal(rocketRunStars(6, 6, 0), 3);
  assert.equal(rocketRunStars(6, 6, 1), 2);
  assert.equal(rocketRunStars(5, 6, 3), 2);
  assert.equal(rocketRunStars(2, 6, 4), 1);
  assert.equal(rocketRunStars(0, 6, 5), 0);
  assert.equal(rocketRunStars(0, 0, 0), 0);
});
