import test from "node:test";
import assert from "node:assert/strict";
import { WORD_FAMILIES } from "../../src/data/learnGamesData.js";
import { familyPracticeOptions, nextFamilyTarget } from "../../src/utils/wordFamilyPractice.js";

function familyWords(familyIds) {
  return familyIds.flatMap(familyId => WORD_FAMILIES[familyId].map(word => ({
    familyId,
    word,
    onset: word.replace(familyId.slice(1).toLowerCase(), "")
  })));
}

test("family practice uses only the reviewed authored options", () => {
  const words = familyWords(["-OP", "-OT", "-AN"]);
  const opOptions = familyPracticeOptions(words, "-OP");
  const anOptions = familyPracticeOptions(words, "-AN");

  assert.deepEqual(new Set(opOptions.map(option => option.onset)), new Set(["h", "t", "p", "m", "c"]));
  assert.deepEqual(new Set(anOptions.map(option => option.onset)), new Set(["c", "p", "m", "f", "r", "t"]));
  assert.equal(opOptions.some(option => option.onset === "l"), false, "-OP must not invent a decoy that could make lop");
  assert.equal(anOptions.some(option => option.onset === "b"), false, "-AN must not invent a decoy that could make ban");
});

test("family practice names one authored target for each turn", () => {
  const words = familyWords(["-OP"]);
  assert.equal(nextFamilyTarget(words, "-OP"), "hop");
  assert.equal(nextFamilyTarget(words, "-OP", ["hop"]), "top");
  assert.equal(nextFamilyTarget(words, "-OP", new Set(WORD_FAMILIES["-OP"])), "");
});
