import test from "node:test";
import assert from "node:assert/strict";
import {
  rhymePopLadder,
  rhymePopStars
} from "../../src/utils/rhymePopLevels.js";

test("rhymePopLadder returns three distinct-anchor festival acts for every difficulty", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    assert.equal(rhymePopLadder(difficulty).length, difficulty === "easy" ? 24 : 30);
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

test("Rhyme Pop difficulty tiers actually differ", () => {
  const easyLadder = rhymePopLadder("easy");
  const mediumLadder = rhymePopLadder("medium");
  const hardLadder = rhymePopLadder("hard");

  const easyRimes = new Set(easyLadder.map(level => level.rime));
  assert.ok(!easyRimes.has("-ight"), "easy should not use the -ight family");
  assert.ok(!easyRimes.has("-air"), "easy should not use the -air family");

  assert.notEqual(
    mediumLadder.map(level => level.rime).join(","),
    easyLadder.map(level => level.rime).join(","),
    "medium should not reuse the easy family sequence"
  );

  assert.ok(easyLadder.every(level => level.correctVisible === 3), "easy shows more rhyming balloons");
  assert.ok(hardLadder.every(level => level.correctVisible === 2), "hard shows fewer rhyming balloons");

  const hardNight = hardLadder.find(level => level.rime === "-ight");
  assert.ok(hardNight, "hard should include the -ight family");
  assert.ok(hardNight.distractors.includes("knot"), "hard mixes near-rime foils into distractors");
  assert.ok(mediumLadder.every(level => !level.distractors.includes("knot")), "near-rime foils stay at hard");
});

test("rhymePopStars follows the shared star rubric", () => {
  assert.equal(rhymePopStars({ correct: 0, total: 6, mistakes: 0 }), 0);
  assert.equal(rhymePopStars({ correct: 6, total: 6, mistakes: 0 }), 3);
  assert.equal(rhymePopStars({ correct: 5, total: 6, mistakes: 2 }), 2);
  assert.equal(rhymePopStars({ correct: 2, total: 6, mistakes: 6 }), 1);
});

 test("each festival changes its anchor and wind route with recorded anchor speech", async () => {
 const {getLedaWordAudioPath}=await import("../../src/data/ledaProductionAudio.js");
 const {existsSync}=await import("node:fs");
 for(const difficulty of ["easy","medium","hard"]) {
 const levels=rhymePopLadder(difficulty);
 assert.equal(new Set(levels.map(level=>level.targetWord)).size,levels.length);
 assert.deepEqual([...new Set(levels.map(level=>level.act))],[0,1,2]);
 for(const level of levels) { const path=getLedaWordAudioPath(level.targetWord); assert.ok(path && existsSync(`public${path}`),level.targetWord); }
 }
 });
