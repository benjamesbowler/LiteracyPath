import test from "node:test";
import assert from "node:assert/strict";
import {
  stationsForCycle,
  isFluencyCycle,
  buildStationRounds
} from "../../src/components/elQuest/elQuestEngine.js";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";

const cycle10 = elSkillsBlockCycles.find(c => c.cycleNumber === 10);
const cycle26 = elSkillsBlockCycles.find(c => c.cycleNumber === 26);
const cycle25 = elSkillsBlockCycles.find(c => c.cycleNumber === 25);
const cycle27 = elSkillsBlockCycles.find(c => c.cycleNumber === 27);

test("cycles 25-27 are fluency cycles; 1-24 are not", () => {
  assert.equal(isFluencyCycle(cycle25), true);
  assert.equal(isFluencyCycle(cycle26), true);
  assert.equal(isFluencyCycle(cycle27), true);
  assert.equal(isFluencyCycle(cycle10), false);
});

test("fluency cycles get the new station set, not the letter-sound set", () => {
  const ids = stationsForCycle(cycle26).map(s => s.id);
  assert.deepEqual(ids, ["pattern", "chain", "speed", "poem", "spell", "check"]);
  // The letter-sound games must be gone for these stops.
  for (const removed of ["letters", "sounds", "hunt", "trace"]) {
    assert.ok(!ids.includes(removed), `${removed} should not appear on fluency cycles`);
  }
  // Standard cycles still have the original set.
  assert.ok(stationsForCycle(cycle10).map(s => s.id).includes("letters"));
});

test("Pattern Power: each round has fit + non-fit words to sort", () => {
  const rounds = buildStationRounds(cycle26, "pattern");
  assert.ok(rounds.length > 0);
  for (const round of rounds) {
    assert.equal(round.type, "pattern");
    assert.ok(round.items.length >= 4);
    assert.ok(round.items.some(i => i.fits === true), "needs at least one matching word");
    assert.ok(round.items.some(i => i.fits === false), "needs at least one decoy");
  }
});

test("Word Chains: answer is a single letter present in the choices, with a blank slot", () => {
  const rounds = buildStationRounds(cycle26, "chain");
  assert.ok(rounds.length > 0);
  for (const round of rounds) {
    assert.equal(round.type, "chain");
    assert.equal(round.answer.length, 1);
    assert.ok(round.choices.includes(round.answer));
    assert.ok(round.display.includes("_"), "shows the word with a blank to fill");
  }
});

test("Speedy Words: a real word target that appears in the choices", () => {
  const rounds = buildStationRounds(cycle26, "speed");
  assert.ok(rounds.length > 0);
  for (const round of rounds) {
    assert.equal(round.type, "speed");
    assert.ok(round.choices.includes(round.answer));
  }
});

test("Spell It: builds 2-6 letter words from the cycle's sight words", () => {
  const rounds = buildStationRounds(cycle27, "spell");
  assert.ok(rounds.length > 0);
  for (const round of rounds) {
    assert.equal(round.type, "build");
    assert.match(round.word, /^[a-z]{2,6}$/);
  }
});

test("Fluency Cycle Check mixes only fluency-appropriate round types", () => {
  const rounds = buildStationRounds(cycle26, "check");
  assert.ok(rounds.length > 0 && rounds.length <= 10);
  const allowed = new Set(["pattern", "chain", "speed", "build", "poem"]);
  for (const round of rounds) {
    assert.ok(allowed.has(round.type), `unexpected round type in fluency check: ${round.type}`);
  }
});
