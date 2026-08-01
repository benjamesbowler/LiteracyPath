// Current answer-position protections: deterministic presentation shuffling
// plus a bank-level balance assertion for every published v3 bank.

import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { shuffleAnswerPositions } from "../../src/utils/answerPositionShuffle.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("the shuffle is stable for a given question id", () => {
  const options = ["a", "b", "c", "d"];
  const first = shuffleAnswerPositions(options, "lp3.rhyming.l1.A.cat.v1");
  const second = shuffleAnswerPositions(options, "lp3.rhyming.l1.A.cat.v1");
  assert.deepEqual(first, second, "same id must give the same order on every render");
});

test("the shuffle returns a true permutation and never mutates the input", () => {
  const options = ["bat", "big", "cup", "dog"];
  const frozen = [...options];
  const shuffled = shuffleAnswerPositions(options, "some.item.id");
  assert.deepEqual(options, frozen, "input array must not be mutated");
  assert.equal(shuffled.length, options.length);
  assert.deepEqual([...shuffled].sort(), [...options].sort(), "no option may be dropped or duplicated");
});

test("different question ids produce different orders", () => {
  const options = ["a", "b", "c", "d"];
  const orders = new Set();
  for (let index = 0; index < 40; index += 1) {
    orders.add(shuffleAnswerPositions(options, `item-${index}`).join("|"));
  }
  assert.ok(orders.size >= 8, `expected varied orders across ids, saw ${orders.size}`);
});

test("a fully answer-first bank is flattened to roughly even positions", () => {
  // The real failure case: 1,000 items, correct answer stored at index 0 every
  // time — the exact shape of rhyming/finalSounds/shortVowel/skillLevelGap.
  const positions = [0, 0, 0, 0];
  for (let item = 0; item < 1000; item += 1) {
    const stored = ["CORRECT", "d1", "d2", "d3"];
    const shown = shuffleAnswerPositions(stored, `bank.item.${item}`);
    positions[shown.indexOf("CORRECT")] += 1;
  }
  const worst = Math.max(...positions) / 1000;
  assert.ok(
    worst <= 0.4,
    `after shuffling, no position may hold more than 40% of correct answers; saw ${(worst * 100).toFixed(1)}% (${positions})`
  );
});

test("edge cases degrade safely rather than throwing", () => {
  assert.deepEqual(shuffleAnswerPositions([], "id"), []);
  assert.deepEqual(shuffleAnswerPositions(["only"], "id"), ["only"]);
  assert.deepEqual(shuffleAnswerPositions(null, "id"), []);
  // No id: stored order, not a wobbling one.
  assert.deepEqual(shuffleAnswerPositions(["a", "b"], ""), ["a", "b"]);
});

test("options that are objects survive the shuffle intact", () => {
  const options = [{ value: "a", isCorrect: true }, { value: "b" }, { value: "c" }];
  const shown = shuffleAnswerPositions(options, "obj.item");
  assert.equal(shown.length, 3);
  assert.equal(shown.filter(option => option.isCorrect).length, 1);
  assert.ok(shown.every(option => options.includes(option)), "objects must be passed through by reference");
});

test("published banks must not ship fully answer-first", async () => {
  const banksDir = path.join(ROOT, "src/data/v3/banks");
  if (!fs.existsSync(banksDir)) return;

  const offenders = [];
  for (const name of fs.readdirSync(banksDir).filter(file => file.endsWith(".js"))) {
    const module = await import(path.join(banksDir, name));
    const items = Object.values(module).find(value => Array.isArray(value) && value.length > 0);
    if (!items) continue;

    let scored = 0;
    let atZero = 0;
    for (const item of items) {
      const choices = item?.choices || item?.options;
      const answer = item?.correctAnswer ?? item?.answer;
      if (!Array.isArray(choices) || choices.length < 2 || answer === undefined) continue;
      scored += 1;
      if (choices[0] === answer) atZero += 1;
    }
    if (scored >= 30 && atZero / scored > 0.5) {
      offenders.push(`${name}: ${((atZero / scored) * 100).toFixed(1)}% of ${scored} items`);
    }
  }
  assert.deepEqual(offenders, [], `v3 banks with the correct answer stored first on >50% of items:\n${offenders.join("\n")}`);
});
