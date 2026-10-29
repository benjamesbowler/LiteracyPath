import test from "node:test";
import assert from "node:assert/strict";
import { auditDecodableBook } from "../../src/utils/guidedReading/decodableScope.js";
import { requiredNextStepsLessons } from "../../src/data/nextStepsPhonicsLessons.js";

const words = {
  hat: { graphemes: ["h", "a", "t"], sounds: ["h", "æ", "t"], firstCycle: 6 },
  hand: { graphemes: ["h", "a", "n", "d"], sounds: ["h", "æ", "n", "d"], firstCycle: 6 },
  stop: { graphemes: ["s", "t", "o", "p"], sounds: ["s", "t", "ɑ", "p"], firstCycle: 11 },
  stamp: { graphemes: ["s", "t", "a", "m", "p"], sounds: ["s", "t", "æ", "m", "p"], firstCycle: 11 },
  sniffs: { graphemes: ["s", "n", "i", "ff", "s"], sounds: ["s", "n", "ɪ", "f", "s"], firstCycle: 24 }
};
function sample(id, afterCycle, word) {
  const b = { id, title: word, pages: [{ text: word }] };
  b.decodableScope = { afterCycle, exceptions: [],
    additionalPrerequisites: requiredNextStepsLessons(b).map(lesson => lesson.id),
    wordRecords: [{word, type: "regular", ...structuredClone(words[word])}] };
  return b;
}
test("earlier cycle floor is restricted to the reviewed Next Steps opening positions", () => {
  assert.equal(auditDecodableBook(sample("next-steps-01", 6, "hat")).valid, true);
  assert.equal(auditDecodableBook(sample("scope-test", 6, "hat")).valid, false);
  assert.equal(auditDecodableBook(sample("next-steps-03", 6, "hat")).valid, false);
  const earlier = sample("next-steps-01", 6, "stop");
  assert.ok(auditDecodableBook(earlier).failures.some(s => s.includes("p has not been taught")));
});
test("adjacent consonants require cumulative explicit instruction at each boundary", () => {
  for (const [id, cycle, word, valid] of [
    ["next-steps-15",15,"hand",false], ["next-steps-16",15,"hand",true],
    ["next-steps-17",16,"stop",false], ["next-steps-18",16,"stop",true],
    ["next-steps-20",18,"stamp",false], ["next-steps-21",18,"stamp",true]
  ]) assert.equal(auditDecodableBook(sample(id, cycle, word)).valid, valid, `${id}: ${word}`);
  const missing = sample("next-steps-21", 18, "stamp");
  missing.decodableScope.additionalPrerequisites.splice(1, 1);
  assert.equal(auditDecodableBook(missing).valid, false);
  const premature = sample("next-steps-16", 15, "hand");
  premature.decodableScope.additionalPrerequisites.push("next-steps-initial-blends");
  assert.equal(auditDecodableBook(premature).valid, false);
  const oldBook = sample("small-steps-16", 24, "hand");
  oldBook.decodableScope.additionalPrerequisites = ["next-steps-final-blends"];
  assert.equal(auditDecodableBook(oldBook).valid, false);
});
test("a taught ff can retain /f/ before final /s/ without licensing an untaught pronunciation", () => {
  const b = sample("next-steps-30", 24, "sniffs");
  assert.equal(auditDecodableBook(b).valid, true);
  b.decodableScope.afterCycle = 23;
  assert.equal(auditDecodableBook(b).valid, false);
  b.decodableScope.afterCycle = 24;
  b.decodableScope.wordRecords[0].sounds[4] = "z";
  assert.equal(auditDecodableBook(b).valid, false);
});
