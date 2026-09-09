import assert from "node:assert/strict";
import test from "node:test";
import {
  reelReadAssembledWord,
  reelReadCanAcceptWord,
  reelReadLadder,
  reelReadResponseEvidence
} from "../../src/utils/reelReadLevels.js";

test("every Reel & Read authored ladder has a valid, non-duplicating learning sequence", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    for (const level of reelReadLadder(difficulty)) {
      assert.ok(level.target, `${difficulty} level ${level.level} needs a target`);
      assert.ok(level.correctWords.length >= 2, `${level.target} needs at least two accepted responses`);
      const caught = [];

      if (level.orderMatters) {
        for (const [index, word] of level.correctWords.entries()) {
          assert.equal(reelReadCanAcceptWord(word, level, caught), true, `${level.target} accepts ${word} at ${index}`);
          if (index > 0) assert.equal(reelReadCanAcceptWord(level.correctWords[0], level, caught), false, `${level.target} rejects a repeated first part`);
          caught.push(word);
        }
        assert.equal(reelReadAssembledWord(level, caught), level.target, `${level.target} assembles from its authored parts`);
      } else {
        for (const word of level.correctWords) {
          assert.equal(reelReadCanAcceptWord(word, level, caught), true, `${level.target} accepts alternative ${word}`);
          caught.push(word);
        }
        assert.equal(reelReadAssembledWord(level, caught), level.target);
      }

      for (const word of level.distractors) {
        assert.equal(reelReadCanAcceptWord(word, level, []), false, `${level.target} rejects distractor ${word}`);
      }
    }
  }
});

test("the authored longest response remains a readable accepted target", () => {
  const brave = reelReadLadder("medium").find(level => level.target === "brave");
  assert.ok(brave);
  assert.equal(reelReadCanAcceptWord("courageous", brave, []), true);
});

test("response evidence separates delivered audio from printed support and retries", () => {
  const evidence = reelReadResponseEvidence({
    difficulty: "hard",
    levelIndex: 8,
    target: "wonderful",
    response: "wonder",
    correct: true,
    attempts: 2,
    learningSlot: "8:0",
    expectedResponse: "wonderful",
    fishId: "wonder-8",
    audioDelivery: "failed",
    cueHistory: ["pending", "loading", "started", "failed"],
    supportUsed: ["printed_target", "named_fish_label"],
    soundEnabled: true
  });

  assert.deepEqual(evidence, {
    game: "reel-read",
    levelId: "reel-read-hard-8",
    target: "wonderful",
    response: "wonder",
    correct: true,
    attempts: 2,
    learningSlot: "8:0",
    expectedResponse: "wonderful",
    fishId: "wonder-8",
    practiceOnly: true,
    independent: false,
    supportUsed: ["printed_target", "named_fish_label", "audio_failed"],
    audioDelivery: "failed",
    cueHistory: ["pending", "loading", "started", "failed"],
    soundEnabled: true
  });
  assert.equal(Object.isFrozen(evidence), true);
  assert.equal(Object.isFrozen(evidence.supportUsed), true);
  assert.equal(Object.isFrozen(evidence.cueHistory), true);
});
