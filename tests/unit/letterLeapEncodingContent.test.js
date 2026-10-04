import test from "node:test";
import assert from "node:assert/strict";
import { getLetterLeapEncodingPlans, getLetterLeapPictureCue } from "../../src/data/letterLeapEncodingContent.js";
import { difficultyLadder } from "../../src/utils/curriculumLadder.js";
import { getChildAudioPath } from "../../src/data/childAssets.js";
import { existsSync } from "node:fs";

test("Letter Leap v2 repairs exactly two missing-recording targets without changing global banks or curriculum slots", () => {
  const original = difficultyLadder("letter-leap", "hard", 3);
  const plans = getLetterLeapEncodingPlans("hard", 3);
  assert.equal(plans.length, 10);
  assert.ok(original.some(p => p.targets.flat().includes("grump")));
  assert.ok(original.some(p => p.targets.flat().includes("robot")));
  for (let i = 0; i < plans.length; i++) {
    assert.equal(plans[i].mode, original[i].mode);
    assert.equal(plans[i].targets.flat().length, original[i].targets.flat().length);
    assert.deepEqual(plans[i].targets.flat(), original[i].targets.flat().map(w => w === "grump" ? "stump" : w === "robot" ? "rocket" : w));
  }
  plans[0].targets[0] = "mutated";
  assert.notEqual(getLetterLeapEncodingPlans("hard", 3)[0].targets[0], "mutated");
  for (const word of ["stump", "rocket"]) assert.ok(existsSync("public" + getChildAudioPath(word)));
  for (const d of ["easy", "medium"]) assert.deepEqual(getLetterLeapEncodingPlans(d, 3), difficultyLadder("letter-leap", d, 3));
});

test("every literal sentence owns context imagery without pretending to uniquely depict its function words", () => {
  const sentences = getLetterLeapEncodingPlans("hard", 3).filter(p => p.mode === "sentence").flatMap(p => p.targets);
  assert.equal(sentences.length, 8);
  const paths = new Set();
  for (const sentence of sentences) {
    for (const word of sentence) {
      const cue = getLetterLeapPictureCue({ word, sentence });
      assert.equal(cue.pictureKind, "sentence-context");
      assert.equal(cue.pictures.length, 1);
      paths.add(cue.pictures[0]);
    }
  }
  assert.equal(paths.size, 8);
  assert.deepEqual(getLetterLeapPictureCue({ word: "the", sentence: "an unknown sentence" }), { pictures: [], pictureKind: "sentence-context" });
  assert.deepEqual(getLetterLeapPictureCue({ word: "bid" }), { pictures: [], pictureKind: "word" });
  assert.deepEqual(getLetterLeapPictureCue({ word: "stump" }), { pictures: ["/images/child-mode/reviewed/letter-leap/stump.webp"], pictureKind: "word" });
});
