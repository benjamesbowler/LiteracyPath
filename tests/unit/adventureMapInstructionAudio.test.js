import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { AUDIO_QUEST_PATHS } from "../../src/data/generated/audioQuestPaths.generated.js";
import {
  buildStationRounds,
  stationsForCycle
} from "../../src/components/elQuest/elQuestEngine.js";
import { resolveAdventureRoundAudio } from "../../src/components/elQuest/adventureRoundAudio.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("every Adventure Map round has separate recorded instructions", () => {
  const missing = [];
  const reusedTarget = [];

  for (const cycle of elSkillsBlockCycles.filter(item => item.cycleNumber)) {
    for (const station of stationsForCycle(cycle)) {
      for (const round of buildStationRounds(cycle, station.id)) {
        const resolved = resolveAdventureRoundAudio(round);
        const label = `cycle ${cycle.cycleNumber} ${station.id} ${round.type}: ${round.prompt}`;
        if (!resolved.instructionText || !resolved.instructionAudio) {
          missing.push(label);
          continue;
        }
        const absoluteAudioPath = path.join(root, "public", resolved.instructionAudio.replace(/^\//, ""));
        if (!fs.existsSync(absoluteAudioPath)) missing.push(`${label} -> ${resolved.instructionAudio}`);
        if (!AUDIO_QUEST_PATHS.has(resolved.instructionAudio)) {
          missing.push(`${label} -> not in the quest audio manifest`);
        }
        if (round.audio && resolved.instructionAudio === round.audio) reusedTarget.push(label);
      }
    }
  }

  assert.deepEqual(missing, []);
  assert.deepEqual(reusedTarget, []);
});

test("instruction sequencing never reveals the answer for reading-only rounds", () => {
  const fluencyCycle = elSkillsBlockCycles.find(item => item.cycleNumber === 25);
  for (const stationId of ["pattern", "speed"]) {
    for (const round of buildStationRounds(fluencyCycle, stationId)) {
      const resolved = resolveAdventureRoundAudio(round);
      assert.deepEqual(resolved.targetAudio, []);
    }
  }
});
