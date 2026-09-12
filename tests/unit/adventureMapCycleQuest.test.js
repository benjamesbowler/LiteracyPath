import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCycleQuestBlueprint,
  buildStationRounds,
  isCycleQuestEligibleRound,
  stationsForCycle
} from "../../src/components/elQuest/elQuestEngine.js";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";

const cycles = elSkillsBlockCycles.filter(cycle => cycle.cycleNumber);

test("Cycle Quest samples every eligible construct before any repeat", () => {
  for (const cycle of cycles) {
    const blueprint = buildCycleQuestBlueprint(cycle);
    const available = new Set(
      stationsForCycle(cycle)
        .filter(station => station.id !== "check")
        .flatMap(station => buildStationRounds(cycle, station.id))
        .filter(isCycleQuestEligibleRound)
        .map(round => round.construct)
    );
    const firstRepeat = blueprint.manifest.findIndex((construct, index, list) => (
      list.indexOf(construct) !== index
    ));
    const uniquePrefix = firstRepeat < 0
      ? new Set(blueprint.manifest)
      : new Set(blueprint.manifest.slice(0, firstRepeat));

    assert.ok(blueprint.rounds.length > 0, `cycle ${cycle.cycleNumber}`);
    assert.equal(
      blueprint.rounds.length,
      Math.max(10, available.size),
      `cycle ${cycle.cycleNumber}`
    );
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
      [...uniquePrefix].sort(),
      [...available].sort(),
      `cycle ${cycle.cycleNumber} repeated a construct before covering the eligible set`
    );
  }
});

test("the public check builder returns the balanced blueprint rounds", () => {
  for (const cycle of cycles) {
    const checkRounds = buildStationRounds(cycle, "check");
    const firstRepeat = checkRounds.findIndex((round, index) => (
      checkRounds.findIndex(other => other.construct === round.construct) !== index
    ));
    const uniquePrefixLength = new Set(
      checkRounds.slice(0, firstRepeat < 0 ? checkRounds.length : firstRepeat)
        .map(round => round.construct)
    ).size;
    const availableCount = new Set(
      stationsForCycle(cycle)
        .filter(station => station.id !== "check")
        .flatMap(station => buildStationRounds(cycle, station.id))
        .filter(isCycleQuestEligibleRound)
        .map(round => round.construct)
    ).size;
    assert.equal(uniquePrefixLength, availableCount);
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
