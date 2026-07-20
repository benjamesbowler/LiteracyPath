import test from "node:test";
import assert from "node:assert/strict";
import {
  buildInitialSoundsProgressFromAnswerHistory,
  getInitialSoundRoundPlan
} from "../../src/content/initialSounds/initialSoundSelector.js";
import {
  INITIAL_SOUND_LETTERS,
  initialSoundCoreWords,
  initialSoundPhonemeMismatchTargets,
  initialSoundWordBank
} from "../../src/content/initialSounds/initialSoundWordBank.js";
import { isInitialSoundRuntimeEligible } from "../../src/content/initialSounds/initialSoundMediaEligibility.js";

const answer = (letter, isCorrect, index = 0) => ({
  skillId: "initial_sounds",
  itemKey: letter,
  itemLevel: 1,
  targetWord: letter === "m" ? "map" : `${letter}-word`,
  questionId: `${letter}-${index}`,
  isCorrect
});

test("Initial Sounds mastery requires two consecutive correct answers", () => {
  const one = buildInitialSoundsProgressFromAnswerHistory([answer("m", true, 1)]).level1;
  assert.deepEqual(one.coveredLetters, ["m"]);
  assert.deepEqual(one.masteredLetters, [], "one 4-option guess is coverage, not mastery");

  const interrupted = buildInitialSoundsProgressFromAnswerHistory([
    answer("m", true, 1),
    answer("m", false, 2)
  ]).level1;
  assert.deepEqual(interrupted.masteredLetters, []);
  assert.deepEqual(interrupted.incorrectLetters, ["m"]);

  const corroborated = buildInitialSoundsProgressFromAnswerHistory([
    answer("m", false, 1),
    answer("m", true, 2),
    answer("m", true, 3)
  ]).level1;
  assert.deepEqual(corroborated.masteredLetters, ["m"]);
  assert.deepEqual(corroborated.incorrectLetters, []);
});

test("Initial Sounds never offers two graphemes for the same /k/ onset", () => {
  for (const item of initialSoundWordBank) {
    assert.equal(item.answerOptions.length, 4, item.id);
    assert.equal(new Set(item.answerOptions).size, 4, item.id);
    assert.ok(item.answerOptions.includes(item.letter), item.id);
    assert.equal(
      item.answerOptions.includes("c") && item.answerOptions.includes("k"),
      false,
      `${item.id} offers both c and k for one spoken /k/ answer`
    );
  }
});

test("phoneme-mismatched and mixed-vowel targets cannot enter scored rounds", () => {
  for (const [targetWord] of Object.entries(initialSoundPhonemeMismatchTargets)) {
    const item = initialSoundWordBank.find(candidate => candidate.targetWord === targetWord);
    assert.ok(item, targetWord);
    assert.equal(item.active, false, targetWord);
    assert.equal(item.qaStatus, "excluded_initial_phoneme_mismatch", targetWord);
    assert.equal(isInitialSoundRuntimeEligible(item), false, targetWord);
  }

  const shortVowelCores = {
    a: "astronaut",
    e: "elevator",
    i: "instructor",
    o: "octagon",
    u: "underground"
  };
  for (const [letter, targetWord] of Object.entries(shortVowelCores)) {
    assert.equal(initialSoundCoreWords[2][letter], targetWord);
    const item = initialSoundWordBank.find(candidate => (
      candidate.level === 2 && candidate.letter === letter && candidate.targetWord === targetWord
    ));
    assert.ok(item, `${letter}: ${targetWord}`);
    assert.equal(isInitialSoundRuntimeEligible(item), true, targetWord);
  }
});

test("item scoring makes repeated mistakes adaptive and avoids a recently answered word", () => {
  const usedTargetWordsByLetter = Object.fromEntries(INITIAL_SOUND_LETTERS.map(letter => [
    letter,
    initialSoundWordBank
      .filter(item => item.level === 1 && item.letter === letter)
      .map(item => item.targetWord)
  ]));
  const plan = getInitialSoundRoundPlan({
    studentProgress: {
      initialSoundsProgress: {
        level1: {
          coveredLetters: INITIAL_SOUND_LETTERS,
          masteredLetters: INITIAL_SOUND_LETTERS,
          usedTargetWordsByLetter,
          repeatedMistakes: { z: 50 },
          recentlySeenWords: ["zoo"],
          answeredCorrectWords: ["zoo"]
        }
      }
    },
    level: 1,
    roundNumber: 3,
    seed: 42
  });

  assert.equal(plan.meta.selectedLetters[0], "z", "the repeated-mistake signal did not affect selection");
  assert.notEqual(plan.meta.selectedTargetWords[0], "zoo", "recency/correct penalties did not affect item selection");
});
