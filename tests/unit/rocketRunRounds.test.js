import test from "node:test";
import assert from "node:assert/strict";
import {
  wordsStartingWith,
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

test("every correct word truly starts with the target sound", () => {
  for (const g of rocketRunTargets()) {
    for (const word of wordsStartingWith(g)) {
      assert.equal(onsetGrapheme(word), g, `"${word}" listed for "${g}" but its onset is "${onsetGrapheme(word)}"`);
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
          assert.equal(onsetGrapheme(item.word), g, `${g}: correct word "${item.word}" is not onset-${g}`);
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
