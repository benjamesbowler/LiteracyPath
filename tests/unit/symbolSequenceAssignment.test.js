import assert from "node:assert/strict";
import test from "node:test";

import {
  SYMBOL_SEQUENCE_SPACE,
  assignUniqueSymbolSequences,
  randomSymbolSequence
} from "../../src/data/symbolPasswordIcons.js";

function roster(size) {
  return Array.from({ length: size }, (_unused, index) => ({
    id: `student-${index}`,
    name: `Student ${index}`
  }));
}

test("a class-sized batch gets a valid, unique sequence each", () => {
  const assignments = assignUniqueSymbolSequences(roster(25), []);
  assert.equal(assignments.length, 25);
  assert.equal(new Set(assignments.map(row => row.sequence)).size, 25);
  assignments.forEach(row => assert.match(row.sequence, /^[1-9]{3}$/));
});

test("sequences already in use in the class are never handed out again", () => {
  const taken = ["123", "456", "789"];
  const assignments = assignUniqueSymbolSequences(roster(40), taken);
  assert.equal(assignments.length, 40);
  assignments.forEach(row => assert.ok(!taken.includes(row.sequence)));
  assert.equal(new Set([...taken, ...assignments.map(row => row.sequence)]).size, 43);
});

test("the exhaustive fallback still finds the last free sequence", () => {
  const everySequence = [];
  for (let first = 1; first <= 9; first += 1) {
    for (let second = 1; second <= 9; second += 1) {
      for (let third = 1; third <= 9; third += 1) {
        everySequence.push(`${first}${second}${third}`);
      }
    }
  }
  const taken = everySequence.slice(0, SYMBOL_SEQUENCE_SPACE - 1);
  const assignments = assignUniqueSymbolSequences(roster(1), taken);
  assert.equal(assignments.length, 1);
  assert.equal(assignments[0].sequence, "999");
});

test("a request larger than the sequence space stops instead of repeating", () => {
  const assignments = assignUniqueSymbolSequences(roster(SYMBOL_SEQUENCE_SPACE + 5), []);
  assert.equal(assignments.length, SYMBOL_SEQUENCE_SPACE);
  assert.equal(new Set(assignments.map(row => row.sequence)).size, SYMBOL_SEQUENCE_SPACE);
});

test("an empty roster produces no writes", () => {
  assert.deepEqual(assignUniqueSymbolSequences([], ["123"]), []);
});

test("a random sequence only ever uses the nine picture digits", () => {
  for (let run = 0; run < 200; run += 1) {
    assert.match(randomSymbolSequence(), /^[1-9]{3}$/);
  }
  assert.equal(randomSymbolSequence(() => 0.999999), "999");
  assert.equal(randomSymbolSequence(() => 0), "111");
});
