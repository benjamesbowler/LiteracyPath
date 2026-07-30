import test from "node:test";
import assert from "node:assert/strict";
import { hasKnownBadWordAudio, KNOWN_BAD_WORD_AUDIO, isKnownBadAudioPath } from "../../src/data/knownBadWordAudio.js";
import { wordAudioPath, buildStationRounds } from "../../src/components/elQuest/elQuestEngine.js";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { stationsForCycle } from "../../src/components/elQuest/elQuestEngine.js";

test("blocklisted words resolve to NO audio, everywhere", () => {
  for (const word of KNOWN_BAD_WORD_AUDIO) {
    assert.equal(wordAudioPath(word), "", `${word} must not resolve to a recording`);
  }
  assert.equal(KNOWN_BAD_WORD_AUDIO.size, 0, "all formerly blocked words now have Leda replacements");
  assert.equal(hasKnownBadWordAudio("cat"), false);
});

test("good words still resolve to real recordings", () => {
  for (const word of ["at", "in", "it", "is", "up", "cat", "sun"]) {
    assert.ok(wordAudioPath(word), `${word} should have a recording`);
  }
});

test("no quest round of ANY type ever plays a blocklisted audio clip", () => {
  // Stronger than the per-resolver checks: whatever a station puts in
  // round.audio (grapheme cue, word cue, letter name, poem narration) must
  // never be a clip the ear-check has rejected. A wrong sound teaches a wrong
  // sound - worse than silence, so "" is allowed but a blocklisted path is not.
  const cycles = elSkillsBlockCycles.filter(c => c.cycleNumber);
  for (const cycle of cycles) {
    for (const station of stationsForCycle(cycle)) {
      if (!station.build) continue;
      for (let i = 0; i < 4; i += 1) {
        for (const round of buildStationRounds(cycle, station.id)) {
          assert.ok(!isKnownBadAudioPath(round.audio || ""),
            `cycle ${cycle.cycleNumber} station ${station.id} would play blocklisted clip ${round.audio}`);
        }
      }
    }
  }
});

test("no voice-led quest round ever TARGETS a blocklisted word", () => {
  const cycles = elSkillsBlockCycles.filter(c => c.cycleNumber);
  for (const cycle of cycles) {
    for (const station of stationsForCycle(cycle)) {
      if (!station.build) continue;
      // Rounds are randomised - sample a few builds per station.
      for (let i = 0; i < 3; i += 1) {
        for (const round of station.build(cycle)) {
          const target = round.answer || round.word || "";
          if (!round.audio && round.type !== "quick" && round.type !== "build") continue;
          if (round.type === "quick" || round.type === "build") {
            assert.ok(!hasKnownBadWordAudio(target),
              `cycle ${cycle.cycleNumber} station ${station.id} targets unvoiced word "${target}"`);
          }
        }
      }
    }
  }
});
