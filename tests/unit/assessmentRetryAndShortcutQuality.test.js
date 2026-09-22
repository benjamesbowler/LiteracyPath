import assert from "node:assert/strict";
import test from "node:test";
import { checkFreshRetry, independentLengthShortcuts } from "../../tools/assessmentRebuild/lib.mjs";

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
