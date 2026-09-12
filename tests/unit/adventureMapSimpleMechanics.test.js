import test from "node:test";
import assert from "node:assert/strict";
import { collectTarget, createCollection, flipMemoryCard, createMemory, resetMemoryMiss, chooseSimpleAnswer } from "../../src/components/elQuest/mechanics/simpleMechanicState.js";

test("a picture or letter search retains finds through a wrong tap and completes only with every match", () => {
  const round = { construct: "visual_letter_search", targetLetters: ["a", "m"], cells: [{ id: "1", letter: "A", matches: true }, { id: "2", letter: "s", matches: false }, { id: "3", letter: "m", matches: true }] };
  const first = collectTarget(createCollection(), round, "1");
  assert.equal(first.outcome, null);
  assert.deepEqual(first.state.found, ["1"]);
  const miss = collectTarget(first.state, round, "2");
  assert.equal(miss.outcome.correct, false);
  assert.deepEqual(miss.state.found, ["1"]);
  assert.equal(collectTarget(miss.state, round, "1").outcome, null);
  const complete = collectTarget(miss.state, round, "3", 1);
  assert.equal(complete.outcome.correct, true);
  assert.equal(complete.outcome.evidence.supportLevel, 1);
  assert.equal(collectTarget(complete.state, round, "2").outcome, null);
});

test("hidden word pairs cannot match one card with itself and a miss resets automatically without losing pairs", () => {
  const round = { construct: "high_frequency_word_matching", words: ["the", "and"], cards: [{ id: "a", word: "the" }, { id: "b", word: "and" }, { id: "c", word: "the" }, { id: "d", word: "and" }] };
  const first = flipMemoryCard(createMemory(), round, "a");
  assert.equal(first.outcome, null);
  assert.deepEqual(flipMemoryCard(first.state, round, "a").state.open, ["a"]);
  const miss = flipMemoryCard(first.state, round, "b");
  assert.equal(miss.outcome.correct, false);
  assert.equal(flipMemoryCard(miss.state, round, "c").outcome, null);
  const reset = resetMemoryMiss(miss.state);
  assert.deepEqual(reset.open, []);
  const pair = flipMemoryCard(flipMemoryCard(reset, round, "c").state, round, "a");
  assert.equal(pair.outcome, null);
  assert.equal(pair.state.matched.length, 2);
  const win = flipMemoryCard(flipMemoryCard(pair.state, round, "b").state, round, "d", 1);
  assert.equal(win.outcome.correct, true);
  assert.equal(win.outcome.evidence.supportLevel, 1);
  assert.equal(win.state.matched.length, 4);
});

test("missing letters score the requested sound position and accept a correct retry", () => {
  const round = { mechanicId: "missingLetter", construct: "final_phoneme_completion", word: "map", answer: "map", missingIndex: 2, missingGrapheme: "p", choices: ["m", "p", "t"] };
  assert.equal(chooseSimpleAnswer(round, "m").correct, false);
  assert.equal(chooseSimpleAnswer(round, "p", 1).correct, true);
  assert.equal(chooseSimpleAnswer(round, "p", 1).evidence.supportLevel, 1);
  assert.equal(chooseSimpleAnswer(round, "z").correct, false);
});

test("rhyming pairs require exactly two distinct correct words in either order", () => {
  const round = { mechanicId: "rhymePair", construct: "rhyme_matching", choices: ["cat", "hat", "dog"], answer: ["cat", "hat"] };
  assert.equal(chooseSimpleAnswer(round, ["hat", "cat"]).correct, true);
  for (const choice of [["cat"], ["cat", "cat"], ["cat", "dog"], ["cat", "hat", "dog"]]) assert.equal(chooseSimpleAnswer(round, choice).correct, false);
});
