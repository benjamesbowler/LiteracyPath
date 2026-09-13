import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCycleQuestBlueprint,
  buildStationRounds,
  isCycleQuestEligibleRound,
  stationsForCycle
} from "../../src/components/elQuest/elQuestEngine.js";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { taughtCycleGraphemes, taughtCycleHighFrequencyWords } from "../../src/utils/cyclePracticeVariation.js";

const cycles = elSkillsBlockCycles.filter(cycle => cycle.cycleNumber);
const soundedTargets = rounds => new Set(rounds.flatMap(round => (
  ["soundChoice", "sceneHunt", "pictureSearch"].includes(round.mechanicId) ? [round.targetGrapheme]
    : round.mechanicId === "missingLetter" ? [round.missingGrapheme] : []
)));

test("Cycle Quest covers core constructs, assigned code and required sight words without forcing optional wordplay", () => {
  for (const cycle of cycles) {
    const blueprint = buildCycleQuestBlueprint(cycle);
    const available = new Set(
      stationsForCycle(cycle)
        .filter(station => station.id !== "check")
        .flatMap(station => buildStationRounds(cycle, station.id))
        .filter(isCycleQuestEligibleRound)
        .map(round => round.construct)
    );
    assert.ok(blueprint.rounds.length > 0, `cycle ${cycle.cycleNumber}`);
    assert.ok(blueprint.rounds.length >= Math.max(10, available.size), `cycle ${cycle.cycleNumber}: retain each construct`);
    assert.ok(blueprint.rounds.length <= Math.max(10, available.size + blueprint.requiredGraphemes.length + blueprint.requiredHighFrequencyWords.length), 'extra rounds must serve code and word coverage');
    const targets = soundedTargets(blueprint.rounds);
    for (const target of blueprint.requiredGraphemes) assert.ok(targets.has(target), `${cycle.id}: retain focus and review ${target}`);
    const words = new Set(blueprint.rounds.filter(round => round.mechanicId === "sightWordChoice").map(round => round.targetWord));
    for (const word of blueprint.requiredHighFrequencyWords) assert.ok(words.has(word), `${cycle.id}: retain sight word ${word}`);
    for (const word of cycle.highFrequencyWords) assert.ok(words.has(word), `${cycle.id}: retain assigned sight word ${word}`);
    assert.equal(new Set(blueprint.rounds.map(round => round.roundKey)).size, blueprint.rounds.length);
    assert.ok(blueprint.rounds.every(round => !["rhymePair", "rhymeOdd", "compoundPicture", "wordMemory"].includes(round.mechanicId)));
    assert.ok(
      blueprint.rounds.every(isCycleQuestEligibleRound),
      `cycle ${cycle.cycleNumber} included a support-only round`
    );
    assert.deepEqual(
      blueprint.manifest,
      blueprint.rounds.map(round => round.construct),
      `cycle ${cycle.cycleNumber}`
    );
    assert.deepEqual(
      [...new Set(blueprint.manifest)].sort(),
      [...available].sort(),
      `cycle ${cycle.cycleNumber} omitted a core learning action`
    );
  }
});

test("the public check builder returns the balanced blueprint rounds", () => {
  for (const cycle of cycles) {
    const seed = `public-check:${cycle.id}`;
    assert.deepEqual(buildStationRounds(cycle, "check", { seed }), buildCycleQuestBlueprint(cycle, 10, { seed }).rounds);
  }
});

test("every Cycle 1-4 mix revisits all taught sight words and phonics with interleaved actions", () => {
  for (const cycle of cycles.filter(item => item.cycleNumber <= 4)) {
    for (let pass = 0; pass < 16; pass += 1) {
      const blueprint = buildCycleQuestBlueprint(cycle, 10, { seed: `classroom:${cycle.id}:${pass}` });
      assert.deepEqual(new Set(blueprint.requiredGraphemes), new Set(taughtCycleGraphemes(cycle.cycleNumber)));
      assert.deepEqual(new Set(blueprint.requiredHighFrequencyWords), new Set(taughtCycleHighFrequencyWords(cycle.cycleNumber)));
      const heard = soundedTargets(blueprint.rounds);
      for (const target of taughtCycleGraphemes(cycle.cycleNumber)) assert.ok(heard.has(target), `${cycle.id}: ${target} needs spoken phonics practice, not only a visual case match`);
      assert.ok(blueprint.rounds.filter(round => ["soundChoice", "sceneHunt", "pictureSearch", "missingLetter"].includes(round.mechanicId)).every(round => round.audioRequired && round.audio));
      const words = blueprint.rounds.filter(round => round.mechanicId === "sightWordChoice");
      assert.ok(words.length / blueprint.rounds.length >= 0.3, `${cycle.id}: sight words remain a substantial part of the mix`);
      assert.ok(blueprint.rounds.every((round, index, list) => index < 2 || round.mechanicId !== list[index - 1].mechanicId || round.mechanicId !== list[index - 2].mechanicId), `${cycle.id}: avoid long runs of the same action`);
      if (cycle.cycleNumber >= 2) {
        const ends = blueprint.rounds.filter(round => round.mechanicId === "missingLetter").map(round => round.missingPosition);
        assert.ok(ends.includes("start") && ends.includes("end"));
      }
    }
  }
});

test("a recorded run seed reproduces the same rounds and arrangement", () => {
  for (const cycleNumber of [1, 15, 25, 27]) {
    const cycle = cycles.find(item => item.cycleNumber === cycleNumber);
    const seed = `replay:${cycle.id}:fixed-seed`;
    const first = buildStationRounds(cycle, "check", { seed });
    const replay = buildStationRounds(cycle, "check", { seed });
    assert.deepEqual(replay, first, `cycle ${cycleNumber}`);
  }
});

test("opening the map preserves play randomness and seeded arrangements", () => {
  const originalRandom = Math.random;
  try {
    Math.random = () => { throw new Error("Station listing must not consume play randomness"); };
    for (const cycleNumber of [1, 2, 15, 25, 27]) {
      const cycle = { ...cycles.find(item => item.cycleNumber === cycleNumber) };
      const first = buildStationRounds(cycle, "check", { seed: "menu-independent" });
      const stations = stationsForCycle(cycle);
      stations[0].mechanicIds.length = 0;
      assert.ok(stationsForCycle(cycle)[0].mechanicIds.length, "a caller cannot change cached map eligibility");
      assert.deepEqual(buildStationRounds(cycle, "check", { seed: "menu-independent" }), first);
    }
  } finally {
    Math.random = originalRandom;
  }
});
