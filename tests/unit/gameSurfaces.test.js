import test from "node:test";
import assert from "node:assert/strict";
import { GAME_LIST } from "../../src/data/learnGamesData.js";
import { LEARN_GAMES } from "../../src/components/learn/games/games/index.js";
import {
  reelReadExpectedWord,
  reelReadIsCorrectCatch,
  reelReadLadder,
  reelReadMatches,
  reelReadStars
} from "../../src/utils/reelReadLevels.js";
import {
  GRAMMAR_GRIND_LEVELS_PER_DIFFICULTY,
  grammarGrindChoiceFeedback,
  grammarGrindIsCorrect,
  grammarGrindLadder
} from "../../src/utils/grammarGrindLevels.js";

const isArcade = game => (game.surfaces || []).includes("arcade");

test("the arcade shows the flagship playable games", () => {
  const arcade = GAME_LIST.filter(isArcade).map(g => g.id).sort();
  assert.deepEqual(arcade, [
    "grammar-grind",
    "letter-leap",
    "reel-read",
    "rhyme-pop",
    "rocket-run",
    "sentence-express",
    "sound-beat",
    "sound-racer",
    "sound-safari",
    "star-gallery",
    "word-bridge"
  ], `arcade set changed: ${JSON.stringify(arcade)}`);
});

test("Word Climb is hidden (kept, not deleted) and shows nowhere", () => {
  const wc = GAME_LIST.find(g => g.id === "word-climb");
  assert.ok(wc, "word-climb should still exist in GAME_LIST");
  assert.equal(wc.hidden, true, "word-climb should be hidden");
  assert.ok(!isArcade(wc), "hidden word-climb should not be in the arcade");
  // No arcade game is accidentally flagged hidden.
  for (const g of GAME_LIST.filter(isArcade)) assert.ok(!g.hidden, `${g.id} arcade game marked hidden`);
});

test("worksheet games are Daily Challenge games, never arcade; every game is accounted for", () => {
  const daily = GAME_LIST.filter(g => !isArcade(g) && !g.hidden).map(g => g.id);
  assert.ok(daily.includes("cvc-word-builder"), "expected worksheet games in the daily pool");
  for (const g of GAME_LIST.filter(isArcade)) assert.ok(!daily.includes(g.id), `${g.id} is both arcade and daily`);
  const arcade = GAME_LIST.filter(isArcade).length;
  const hidden = GAME_LIST.filter(g => g.hidden && !isArcade(g)).length;
  assert.equal(daily.length + arcade + hidden, GAME_LIST.length, "a game fell through the surface cracks");
});

test("every arcade game has a registered component", () => {
  for (const game of GAME_LIST.filter(isArcade)) {
    assert.ok(LEARN_GAMES[game.id], `arcade game "${game.id}" has no component in LEARN_GAMES`);
  }
});

test("Reel & Read mixes word parts, meaning, and morphology", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    const ladder = reelReadLadder(difficulty);
    assert.equal(ladder.length, 10, `${difficulty} should have ten levels`);
    assert.deepEqual(
      [...new Set(ladder.map(level => level.mode))].sort(),
      ["meaning", "morphology", "wordParts"],
      `${difficulty} should include all three fishing task types`
    );
    for (const level of ladder) {
      assert.ok(level.correctWords.length >= 2, `${difficulty} level ${level.level + 1} should have multiple catches`);
      assert.ok(level.distractors.length >= level.visibleFish, `${difficulty} level ${level.level + 1} needs enough distractors`);
      for (const word of level.correctWords) {
        assert.equal(reelReadMatches(word, level), true, `${word} should match ${level.target}`);
      }
      for (const word of level.distractors) {
        assert.equal(reelReadMatches(word, level), false, `${word} should not match ${level.target}`);
      }
      assert.equal(new Set(level.correctWords).size, level.correctWords.length, `${difficulty} level ${level.level + 1} repeats a target word`);
      assert.equal(new Set(level.distractors).size, level.distractors.length, `${difficulty} level ${level.level + 1} repeats a distractor`);
      assert.notEqual(level.rule, "startsWith", `${difficulty} level ${level.level + 1} should not be an initial-sound task`);
    }
  }
});

test("Reel & Read ordered word-part levels must be caught in order", () => {
  const ordered = reelReadLadder("hard").find(level => level.orderMatters && level.correctWords.length === 3);
  assert.ok(ordered, "expected an ordered three-part word level");
  assert.equal(reelReadExpectedWord(ordered, []), ordered.correctWords[0]);
  assert.equal(reelReadIsCorrectCatch(ordered.correctWords[1], ordered, []), false, "second part should not be accepted first");
  assert.equal(reelReadIsCorrectCatch(ordered.correctWords[0], ordered, []), true, "first part should be accepted first");
  assert.equal(reelReadExpectedWord(ordered, [ordered.correctWords[0]]), ordered.correctWords[1]);
});

test("Reel & Read uses the shared star rubric", () => {
  assert.equal(reelReadStars({ correct: 10, total: 10, mistakes: 0 }), 3);
  assert.equal(reelReadStars({ correct: 8, total: 10, mistakes: 2 }), 2);
  assert.equal(reelReadStars({ correct: 6, total: 10, mistakes: 4 }), 1);
});

test("Grammar Grind has ten unambiguous grammar skate levels per difficulty", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    const ladder = grammarGrindLadder(difficulty);
    const types = new Set(ladder.map(level => level.type));
    assert.equal(ladder.length, GRAMMAR_GRIND_LEVELS_PER_DIFFICULTY, `${difficulty} should have ten levels`);
    assert.ok(types.size >= 6, `${difficulty} should test a varied grammar skill mix`);
    for (const level of ladder) {
      assert.ok(level.prompt, `${difficulty} level ${level.level + 1} needs a prompt`);
      assert.ok(level.sentence.includes("_"), `${difficulty} level ${level.level + 1} should show the missing part`);
      assert.ok(level.cue, `${difficulty} level ${level.level + 1} needs a cue`);
      assert.ok(level.focus, `${difficulty} level ${level.level + 1} needs a skill focus`);
      assert.ok(level.teaching, `${difficulty} level ${level.level + 1} needs a teaching hint`);
      assert.ok(level.success, `${difficulty} level ${level.level + 1} needs success feedback`);
      assert.ok(level.wrongHint, `${difficulty} level ${level.level + 1} needs wrong-answer feedback`);
      assert.equal(new Set(level.options).size, level.options.length, `${difficulty} level ${level.level + 1} repeats an option`);
      assert.ok(level.options.includes(level.correct), `${difficulty} level ${level.level + 1} is missing its correct option`);
      assert.equal(level.options.filter(option => grammarGrindIsCorrect(option, level)).length, 1, `${difficulty} level ${level.level + 1} should have one correct gate`);
      assert.notEqual(level.type, "startsWith", `${difficulty} level ${level.level + 1} should not be an initial-sound task`);
      for (const option of level.options.filter(option => !grammarGrindIsCorrect(option, level))) {
        const firstMiss = grammarGrindChoiceFeedback(option, level);
        assert.ok(firstMiss.includes(String(option)), `${difficulty} level ${level.level + 1} feedback should name the picked option`);
        assert.ok(!firstMiss.includes("Aim for"), `${difficulty} level ${level.level + 1} first miss should hint the rule, not reveal the answer`);
        const repeatMiss = grammarGrindChoiceFeedback(option, level, { reveal: true });
        assert.ok(repeatMiss.includes(String(level.correct)), `${difficulty} level ${level.level + 1} second miss should point back to the right choice`);
      }
    }
  }
});
