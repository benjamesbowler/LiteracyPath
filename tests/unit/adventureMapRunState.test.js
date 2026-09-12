import test from "node:test";
import assert from "node:assert/strict";
import { correctionModelForOutcome, createAdventureRun, recordAdventureOutcome, feedbackForCommittedOutcome, feedbackForOutcome, cycleQuestResult } from "../../src/components/elQuest/adventureRunState.js";
import { buildStationRounds, stationsForCycle } from "../../src/components/elQuest/elQuestEngine.js";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";

const cycles = elSkillsBlockCycles.filter(cycle => cycle.cycleNumber);
function representativeRounds() {
  const found = new Map();
  for (const number of [1, 2, 24, 25]) {
    const cycle = cycles.find(item => item.cycleNumber === number);
    for (const station of stationsForCycle(cycle).filter(item => item.id !== "check")) {
      for (const round of buildStationRounds(cycle, station.id, { seed: "coaching" })) {
        if (!found.has(round.construct)) found.set(round.construct, round);
      }
    }
  }
  return [...found.values()];
}
function wrongResponse(round) {
  if (round.cells) return round.cells.find(item => !item.matches).letter;
  if (round.mechanicId === "wordMemory") return round.words.slice(0, 2);
  if (round.mechanicId === "rhymePair") return [round.rhymingWords[0], round.choices.find(word => !round.rhymingWords.includes(word))];
  if (round.objects) return round.objects.find(item => !item.matches).word;
  return round.choices.find(choice => choice !== (round.missingGrapheme || round.answer));
}

test("a recovered item keeps its failed first attempt and completion credit", () => {
  let state = createAdventureRun(2);
  state = recordAdventureOutcome(state, { roundIndex: 0, correct: false, selected: "m" });
  state = recordAdventureOutcome(state, { roundIndex: 0, correct: true, selected: "s", evidence: { supportLevel: 1 } });
  assert.equal(state.firstAttempts[0], false);
  assert.equal(state.completed, 1);
  assert.equal(state.recoveries, 1);
  assert.equal(cycleQuestResult(state).stars, 1);
});

test("supported and undelivered-audio successes do not become independent evidence", () => {
  for (const evidence of [{ independent: false, measure: "support_only" }, { supportLevel: 1 }, { independent: false, audioDelivery: "failed" }]) {
    const result = recordAdventureOutcome(createAdventureRun(1), { roundIndex: 0, correct: true, selected: "m", evidence });
    assert.deepEqual(result.firstAttempts, [false]);
    assert.deepEqual(result.completedRounds, [true]);
    assert.deepEqual(cycleQuestResult(result), { stars: 1, independentPercent: 0 });
  }
});

test("incomplete collection feedback cannot complete an activity or overwrite its first attempt", () => {
  const state = createAdventureRun(1);
  assert.equal(recordAdventureOutcome(state, { roundIndex: 0, correct: true, partial: true, selected: ["ant"] }), state);
  assert.equal(state.completed, 0);
  assert.deepEqual(state.firstAttempts, [null]);
});

test("duplicate and late outcomes cannot count a completed round twice", () => {
  const first = recordAdventureOutcome(createAdventureRun(1), { roundIndex: 0, correct: true });
  assert.equal(recordAdventureOutcome(first, { roundIndex: 0, correct: true }), first);
  assert.equal(recordAdventureOutcome(first, { roundIndex: 0, correct: false }), first);
  assert.equal(first.completed, 1);
  assert.deepEqual(first.attempts, [1]);
});

test("recording an outcome preserves the prior run and rejects unknown indices", () => {
  const state = createAdventureRun(1);
  const next = recordAdventureOutcome(state, { roundIndex: 0, correct: true, selected: "s" });
  assert.notEqual(next, state);
  assert.deepEqual(state.firstAttempts, [null]);
  assert.equal(state.completed, 0);
  assert.deepEqual(next.firstAttempts, [true]);
  for (const roundIndex of [-1, 1, 1.5, undefined]) assert.equal(recordAdventureOutcome(state, { roundIndex, correct: true }), state);
});

test("seven independent first attempts still earn two practice stars", () => {
  assert.deepEqual(cycleQuestResult({ total: 10, completed: 10, firstAttempts: [true, true, true, true, true, true, true, false, false, false] }), { stars: 2, independentPercent: 70 });
});

test("every current learning construct has short, specific correction and a visible model", () => {
  const rounds = representativeRounds();
  assert.equal(new Set(rounds.map(round => round.mechanicId)).size, 10);
  for (const round of rounds) {
    const selected = wrongResponse(round);
    const first = feedbackForOutcome(round, { correct: false, selected }, 1);
    const second = feedbackForOutcome(round, { correct: false, selected }, 2);
    const model = correctionModelForOutcome(round, { selected });
    const third = feedbackForCommittedOutcome(round, { correct: false, selected, feedback: "generic old instruction" }, 3);
    assert.ok(first && second && model?.instruction && model.units.length, round.mechanicId);
    assert.equal(third, model.instruction);
    for (const message of [first, second, third]) {
      assert.doesNotMatch(message, /sound gate|magnet|study.*hide|choose.*confirm|grapheme|onset|poetry line|tag/iu);
      assert.ok(message.split(/\s+/u).length <= 35, `${round.mechanicId}: ${message}`);
    }
  }
});

test("picture-search mistakes identify the chosen word and actual first sound target", () => {
  const round = { mechanicId: "pictureSearch", targetGrapheme: "a", objects: [{ word: "ant", matches: true }, { word: "apple", matches: true }, { word: "map", matches: false }] };
  assert.match(feedbackForOutcome(round, { correct: false, selected: "map" }), /map does not start with \/a\//u);
  assert.deepEqual(correctionModelForOutcome(round).units, ["ant", "apple"]);
});

test("missing-letter coaching names the actual position and whole target word", () => {
  for (const [missingPosition, missingGrapheme, position] of [["start", "m", "first"], ["end", "t", "last"]]) {
    const round = { mechanicId: "missingLetter", word: "mat", answer: "mat", missingPosition, missingGrapheme, graphemes: ["m", "a", "t"] };
    const feedback = feedbackForOutcome(round, { correct: false, selected: "s" });
    assert.match(feedback, new RegExp(position));
    assert.match(feedback, /mat/u);
    assert.ok(correctionModelForOutcome(round).instruction.includes(missingGrapheme));
  }
});

test("word-pair completion reports matching practice without claiming decoding", () => {
  const round = { mechanicId: "wordMemory", words: ["am", "i"] };
  assert.equal(feedbackForOutcome(round, { correct: true, selected: ["am", "i"] }), "You found the matching words.");
  assert.match(feedbackForOutcome(round, { correct: false, selected: ["am", "i"] }), /different words/u);
});
