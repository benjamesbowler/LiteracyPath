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

test("Pattern Power supplies labelled bins and a novel transfer word", () => {
  const rounds = buildStationRounds(cycle26, "pattern");
  assert.ok(rounds.length > 0);
  for (const round of rounds) {
    assert.equal(round.mechanicId, "patternSort");
    assert.ok(round.items.length >= 4);
    assert.ok(round.items.some(i => i.fits === true), "needs at least one matching word");
    assert.ok(round.items.some(i => i.fits === false), "needs at least one decoy");
    assert.equal(round.bins.length, 2);
    assert.ok(round.bins.every(bin => bin.id && bin.label));
    assert.ok(round.transferWord);
    assert.ok(!round.items.some(item => item.word === round.transferWord));
  }
});

test("Word Chains declare one grapheme position change without printing the target", () => {
  const rounds = buildStationRounds(cycle26, "chain");
  assert.ok(rounds.length > 0);
  for (const round of rounds) {
    assert.equal(round.mechanicId, "wordChain");
    assert.equal(round.fromGraphemes.length, round.toGraphemes.length);
    assert.equal(
      round.fromGraphemes.filter((unit, index) => unit !== round.toGraphemes[index]).length,
      1
    );
    assert.equal(round.toGraphemes[round.changeIndex], round.answer);
    assert.ok(!round.prompt.toLowerCase().includes(round.toWord.toLowerCase()));
  }
});

test("Phrase Flow uses authored chunks and has no timing or rate score", () => {
  const rounds = buildStationRounds(cycle26, "speed");
  assert.ok(rounds.length > 0);
  for (const round of rounds) {
    assert.equal(round.mechanicId, "phraseFlow");
    assert.ok(round.phraseChunks.length >= 2);
    assert.ok(Number.isInteger(round.correctBoundary));
    assert.ok(round.boundaryChoices.length >= 2, "needs a real pause-point choice");
    assert.equal(
      round.boundaryChoices.filter(choice => choice.position === round.correctBoundary).length,
      1,
      "the authored line break must appear exactly once"
    );
    assert.ok(
      round.boundaryChoices.some(choice => choice.position !== round.correctBoundary),
      "needs at least one plausible alternative pause point"
    );
    assert.equal("timerMs" in round, false);
    assert.equal("timeLimit" in round, false);
    assert.ok(!/fast|speed|timer|countdown/i.test(round.prompt));
  }
});

test("Heart Word Studio supplies the exact spelling as grapheme units", () => {
  const rounds = buildStationRounds(cycle27, "spell");
  assert.ok(rounds.length > 0);
  for (const round of rounds) {
    assert.equal(round.mechanicId, "heartWord");
    assert.equal(round.graphemes.join(""), round.word);
    assert.equal(round.construct, "orthographic_memory");
  }
});

test("Fluency Cycle Check mixes only fluency-appropriate round types", () => {
  const rounds = buildStationRounds(cycle26, "check");
  assert.ok(rounds.length > 0 && rounds.length <= 10);
  const allowed = new Set(["patternSort", "wordChain", "phraseFlow", "heartWord", "poemSpotlight"]);
  for (const round of rounds) {
    assert.ok(allowed.has(round.mechanicId), `unexpected mechanic in fluency check: ${round.mechanicId}`);
  }
});
