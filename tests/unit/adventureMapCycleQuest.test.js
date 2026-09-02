import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCycleQuestBlueprint,
  buildStationRounds,
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
        .map(round => round.construct)
    );
    const firstRepeat = blueprint.manifest.findIndex((construct, index, list) => (
      list.indexOf(construct) !== index
    ));
    const uniquePrefix = firstRepeat < 0
      ? new Set(blueprint.manifest)
      : new Set(blueprint.manifest.slice(0, firstRepeat));

    assert.ok(blueprint.rounds.length > 0, `cycle ${cycle.cycleNumber}`);
    assert.ok(blueprint.rounds.length <= 10, `cycle ${cycle.cycleNumber}`);
    assert.deepEqual(
      blueprint.manifest,
      blueprint.rounds.map(round => round.construct),
      `cycle ${cycle.cycleNumber}`
    );
    assert.deepEqual(
      [...uniquePrefix].sort(),
      [...available].slice(0, Math.min(available.size, 10)).sort(),
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
        .map(round => round.construct)
    ).size;
    assert.equal(uniquePrefixLength, Math.min(availableCount, 10));
  }
});
