import test from "node:test";
import assert from "node:assert/strict";
import { stationsForCycle, isFluencyCycle, buildStationRounds } from "../../src/components/elQuest/elQuestEngine.js";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";

const cycles = [25, 26, 27].map(number => elSkillsBlockCycles.find(cycle => cycle.cycleNumber === number));

test("later review cycles preserve their teacher station IDs with simple games", () => {
  for (const cycle of cycles) {
    assert.equal(isFluencyCycle(cycle), true);
    const stations = stationsForCycle(cycle);
    assert.deepEqual(stations.map(station => station.id), ["pattern", "chain", "speed", "poem", "spell", "search", "check"]);
    assert.deepEqual(stations.filter(station => station.id !== "check").map(station => station.title), [
      "Sound and Letter Match", "Missing Letters", "Rhyme Time", "Picture Words", "Word Match", "Picture Search"
    ]);
  }
  assert.equal(isFluencyCycle(elSkillsBlockCycles.find(cycle => cycle.cycleNumber === 24)), false);
});

test("every later route offers a direct learning action with a recoverable answer", () => {
  const expected = { pattern: ["soundChoice", "letterGrid"], chain: ["missingLetter"], speed: ["rhymePair"], poem: ["compoundPicture"], spell: ["sightWordChoice", "wordMemory"], search: ["pictureSearch"] };
  for (const cycle of cycles) {
    for (const [station, mechanics] of Object.entries(expected)) {
      const rounds = buildStationRounds(cycle, station, { seed: `review:${cycle.id}:${station}` });
      assert.ok(rounds.length);
      assert.deepEqual(new Set(rounds.map(round => round.mechanicId)), new Set(mechanics));
      assert.ok(rounds.every(round => round.recoverable));
      assert.ok(rounds.every(round => !/gate|poetry line|study.*hide|grapheme|onset|repair/iu.test(round.prompt)));
    }
  }
});

test("later Cycle Quest covers the current simple games, including both word ends", () => {
  for (const cycle of cycles) {
    const rounds = buildStationRounds(cycle, "check", { seed: `review-check:${cycle.id}` });
    const constructs = new Set(rounds.map(round => round.construct));
    for (const construct of ["initial_phoneme_completion", "final_phoneme_completion", "visual_letter_search", "heard_phoneme_grapheme_mapping", "heard_ending_sound_family_mapping", "auditory_word_recognition", "initial_phoneme_picture_search"]) {
      assert.ok(constructs.has(construct), `${cycle.id} missing ${construct}`);
    }
    assert.ok(rounds.every(round => !["rhymePair", "rhymeOdd", "compoundPicture", "wordMemory"].includes(round.mechanicId)));
  }
});

test("later review stations retain taught sound teams and endings beyond single-letter grids", () => {
  for (const cycle of cycles) {
    const rounds = buildStationRounds(cycle, "pattern", { seed: `pattern-review:${cycle.id}` });
    const targets = rounds.filter(round => round.mechanicId === "soundChoice").map(round => round.targetGrapheme);
    for (const target of ["sh", "ch", "th", "wh", "nk", "ng", "ang", "ing", "ong", "ung", "ff", "ss", "zz", "ll"]) {
      assert.equal(targets.filter(value => value === target).length, 1, `${cycle.id}: ${target} should have one clear sound-matching task`);
    }
  }
});
