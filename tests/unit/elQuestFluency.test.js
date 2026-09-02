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

function matchesPattern(label, word) {
  const value = String(word || "").toLowerCase();
  if (label === "start with sh") return value.startsWith("sh");
  if (label === "have -ng") return value.includes("ng");
  if (label === "end with -ll") return value.endsWith("ll");
  throw new Error(`Missing independent pattern check for ${label}`);
}

function withFixedRandom(value, callback) {
  const originalRandom = Math.random;
  Math.random = () => value;
  try {
    return callback();
  } finally {
    Math.random = originalRandom;
  }
}

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

test("Pattern Power varies the transfer class and correct-bin position without reusing a sort word", () => {
  for (const cycle of [cycle25, cycle26, cycle27]) {
    const transferClasses = new Set();
    const correctBinPositions = new Set();
    for (let pass = 0; pass < 80; pass += 1) {
      const rounds = buildStationRounds(cycle, "pattern");
      assert.ok(rounds.length > 0);
      for (const round of rounds) {
        assert.equal(round.mechanicId, "patternSort");
        assert.match(round.prompt, /put each word.*bin/i);
        assert.doesNotMatch(round.prompt, /tap all/i);
        assert.ok(round.items.length >= 4);
        assert.ok(round.items.some(i => i.fits === true), "needs at least one matching word");
        assert.ok(round.items.some(i => i.fits === false), "needs at least one decoy");
        assert.equal(round.bins.length, 2);
        assert.ok(round.bins.every(bin => bin.id && bin.label));
        assert.equal(typeof round.transferFits, "boolean");
        assert.equal(round.transferBinId, round.transferFits ? "fits" : "not");
        assert.ok(round.bins.some(bin => bin.id === round.transferBinId));
        assert.ok(round.transferWord);
        assert.ok(!round.items.some(item => item.word === round.transferWord));
        assert.equal(
          round.transferFits,
          matchesPattern(round.patternLabel, round.transferWord),
          `${round.transferWord} has an incorrect explicit transfer class`
        );
        transferClasses.add(round.transferFits);
        correctBinPositions.add(round.bins.findIndex(bin => bin.id === round.transferBinId));
      }
    }
    assert.deepEqual(transferClasses, new Set([true, false]));
    assert.deepEqual(correctBinPositions, new Set([0, 1]));
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

test("Phrase Flow flattens source lines into one trail and offers one defensible boundary", () => {
  for (const cycle of [cycle25, cycle26, cycle27]) {
    const rounds = buildStationRounds(cycle, "speed");
    assert.ok(rounds.length > 0);
    for (const round of rounds) {
      assert.equal(round.mechanicId, "phraseFlow");
      assert.ok(round.phraseChunks.length >= 2);
      assert.deepEqual(round.trailWords, round.phraseChunks.join(" ").split(/\s+/u));
      assert.ok(round.trailWords.length <= 12, "the trail must fit a short-height play surface");
      assert.ok(Number.isInteger(round.correctBoundary));
      assert.ok(round.boundaryChoices.length >= 2, "needs a real pause-point choice");
      assert.equal(
        round.boundaryChoices.filter(choice => choice.position === round.correctBoundary).length,
        1,
        "the authored line break must appear exactly once"
      );
      for (const choice of round.boundaryChoices) {
        assert.equal(choice.afterWord, round.trailWords[choice.position - 1]);
        if (choice.position !== round.correctBoundary) {
          assert.doesNotMatch(
            choice.afterWord,
            /[.!?,;:]["'’”)]*$/u,
            "an alternate punctuation boundary would also be defensible"
          );
        }
      }
      assert.equal("timerMs" in round, false);
      assert.equal("timeLimit" in round, false);
      assert.ok(!/fast|speed|timer|countdown/i.test(round.prompt));
    }
  }
});

test("Phrase Flow uses a fixed authored boundary set and only shuffles its presentation order", () => {
  for (const cycle of [cycle25, cycle26, cycle27]) {
    const first = withFixedRandom(0, () => buildStationRounds(cycle, "speed"));
    const second = withFixedRandom(0.999999, () => buildStationRounds(cycle, "speed"));
    const firstByTrail = new Map(first.map(round => [
      round.trailWords.join(" "),
      round.boundaryChoices.map(choice => choice.position).sort((a, b) => a - b)
    ]));
    const secondByTrail = new Map(second.map(round => [
      round.trailWords.join(" "),
      round.boundaryChoices.map(choice => choice.position).sort((a, b) => a - b)
    ]));
    assert.deepEqual(secondByTrail, firstByTrail);
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
