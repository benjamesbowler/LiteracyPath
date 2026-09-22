import assert from "node:assert/strict";
import test from "node:test";
import { checkFreshRetry, checkFreshRetentionRetry, independentLengthShortcuts } from "../../tools/assessmentRebuild/lib.mjs";

const item = (id, fields = {}) => ({
  id, itemKey: id, prompt: `Choose for ${id}.`, level: 1, phase: 1,
  choices: ["one", "two", "three", "four"], answer: "one", ...fields
});

test("a perfect first sitting cannot conceal insufficient fresh retry content", () => {
  const bank = [item("a"), item("b"), item("c")];
  const result = checkFreshRetry(bank, { sitting: 2 });
  assert.deepEqual(result.phases[0].sizes, [2, 1]);
  assert.equal(result.phases[0].pass, false);
  // Retention content must not be counted to fill a formal retry.
  assert.equal(checkFreshRetry([...bank, item("r", { retentionOnly: true })], { sitting: 2 }).phases[0].pass, false);
  assert.equal(checkFreshRetry([...bank, item("d")], { sitting: 2 }).phases[0].pass, true);
});

test("length tells are measured independently with exact tie credit", () => {
  const bank = [
    item("a", { passage: "One two three four.", answer: "a much longer answer", choices: ["one", "two", "three", "a much longer answer"] }),
    item("b", { answer: "red ball", choices: ["red ball", "blue hat", "green bag", "white sock"] })
  ];
  const results = independentLengthShortcuts(bank);
  const longest = results.find(row => row.level === 1 && row.phase === 1 && row.strategy === "longest_words");
  assert.equal(longest.evaluated, 2);
  assert.equal(longest.expectedAccuracy, 0.625);
  const shortest = results.find(row => row.level === 1 && row.phase === 1 && row.strategy === "shortest_words");
  assert.equal(shortest.expectedAccuracy, 0.125);
});

test("hidden spoken choices and retention do not create a printed length shortcut", () => {
  const bank = [item("spoken", { hideWrittenLabels: true }), item("reserve", { retentionOnly: true })];
  assert.equal(independentLengthShortcuts(bank).every(row => row.evaluated === 0), true);
});

test("interior answer lengths are challenged as well as the extremes", () => {
  const bank = [item("a", { answer: "two words", choices: ["one", "two words", "three word choice", "four word answer choice"] })];
  const results = independentLengthShortcuts(bank);
  assert.equal(results.find(row => row.strategy === "second_shortest_words").expectedAccuracy, 1);
  assert.equal(results.find(row => row.strategy === "longest_words").expectedAccuracy, 0);
});

test("retention needs a fresh complete retry and cannot disguise a reused scoring scene", () => {
  const reserve = Array.from({ length: 16 }, (_, index) => item(`r${index}`, {
    retentionOnly: true, formatType: "MISSING_VOWEL_CVC"
  }));
  assert.equal(checkFreshRetentionRetry(reserve.slice(0, 15)).pass, false);
  assert.equal(checkFreshRetentionRetry(reserve).pass, true);
  const scene = { skillId: "prepositions_of_place", imagePath: "/images/assessment/scene.webp", answer: "under", formatType: "PREPOSITION_SENTENCE_FIT" };
  const result = checkFreshRetentionRetry([item("formal", scene), ...reserve.slice(1), item("reworded", { ...scene, retentionOnly: true })]);
  assert.equal(result.pass, false);
  assert.deepEqual(result.repeatedFormalScenes, ["reworded"]);
});
