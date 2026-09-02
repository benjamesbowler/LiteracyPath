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
import * as adventureRoundAudio from "../../src/components/elQuest/adventureRoundAudio.js";
import { ADVENTURE_MECHANIC_IDS } from "../../src/components/elQuest/adventureRoundModel.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const { resolveAdventureRoundAudio } = adventureRoundAudio;

const EXPECTED_INSTRUCTIONS = Object.freeze({
  letterPair: "Press the big or small letter that pairs with the model.",
  soundGate: "Listen to the sound. Load its spelling into the sound gate, then open it.",
  sceneHunt: "Listen to each picture name. Tag every word that starts with the target sound, then check your tags.",
  sceneHuntEnding: "Listen to each picture name. Tag every word that ends with the target pattern, then check your tags.",
  wordWindow: "Study the whole word. Close the window, choose it from memory, then reveal it to check.",
  soundBoxes: "Listen to the word. Put one grapheme in each sound box, then blend and check.",
  wordMachineSubstitute: "Listen to the new word. Choose an onset to replace the first sound, then run the word machine.",
  wordMachineRemove: "Listen to the word. Choose the first sound to remove, then run the word machine.",
  wordMachineJoin: "Select both word parts in order, then join them in the word machine.",
  poemSpotlight: "Follow the line and word numbers. Tap that exact word in the poem.",
  coverClue: "Pick up the title strip. Read it, then place it on the matching book cover.",
  letterTrace: "Watch the letter path. Trace it, then trace it again with a faded model.",
  graphemeTrace: "Watch the letter team path. Trace it, then trace it again with a faded model.",
  patternSort: "Pick up one word at a time. Put it in the matching pattern bin, then sort the new word.",
  wordChain: "Listen to the next word. Choose which grapheme changes, then choose its replacement.",
  phraseFlow: "Read the continuous word trail. Choose where the first poetry line ends, follow the model, then echo-read it.",
  heartWord: "Study the heart word. Hide it, spell it from memory, then reveal and repair any difference."
});

function expectedInstruction(round) {
  if (round.mechanicId === "sceneHunt" && round.variant === "soundSort") {
    return EXPECTED_INSTRUCTIONS.sceneHuntEnding;
  }
  if (round.mechanicId === "wordMachine") {
    if (round.operation === "substituteOnset") return EXPECTED_INSTRUCTIONS.wordMachineSubstitute;
    if (round.operation === "removeOnset") return EXPECTED_INSTRUCTIONS.wordMachineRemove;
    if (round.operation === "joinCompound") return EXPECTED_INSTRUCTIONS.wordMachineJoin;
  }
  if (round.mechanicId === "letterTrace" && round.construct === "grapheme_pattern_formation_practice") {
    return EXPECTED_INSTRUCTIONS.graphemeTrace;
  }
  return EXPECTED_INSTRUCTIONS[round.mechanicId];
}

test("every typed Adventure Map mechanic resolves its exact recorded instruction", () => {
  const missing = [];
  const reusedTarget = [];
  const seenMechanics = new Set();

  for (const cycle of elSkillsBlockCycles.filter(item => item.cycleNumber)) {
    for (const station of stationsForCycle(cycle)) {
      for (const round of buildStationRounds(cycle, station.id)) {
        const resolved = resolveAdventureRoundAudio(round);
        const label = `cycle ${cycle.cycleNumber} ${station.id} ${round.mechanicId}: ${round.prompt}`;
        seenMechanics.add(round.mechanicId);
        assert.equal(resolved.instructionText, expectedInstruction(round), label);
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
  assert.deepEqual([...seenMechanics].sort(), [...ADVENTURE_MECHANIC_IDS].sort());
});

test("reading-only mechanics keep answers out of automatic target audio", () => {
  for (const cycle of elSkillsBlockCycles.filter(item => item.cycleNumber)) {
    for (const station of stationsForCycle(cycle)) {
      for (const round of buildStationRounds(cycle, station.id)) {
        if (!["patternSort", "phraseFlow", "poemSpotlight", "coverClue"].includes(round.mechanicId)) continue;
        const resolved = resolveAdventureRoundAudio(round);
        assert.deepEqual(resolved.targetAudio, []);
        if (round.mechanicId === "poemSpotlight") {
          assert.match(resolved.contentAudio, /\/audio\/production\/en-US\/(?:poem|instruction)\//);
        }
        if (round.mechanicId === "phraseFlow") {
          assert.match(resolved.contentAudio, /\/audio\/production\/en-US\/instruction\//);
        }
      }
    }
  }
});

test("typed dispatch ignores legacy round.type and fails closed for unknown mechanics", () => {
  const typedRound = {
    mechanicId: "soundGate",
    type: "legacy-wrong-type",
    audio: "/audio/target.mp3",
    prompt: "Current visible prompt"
  };
  const resolved = resolveAdventureRoundAudio(typedRound);
  assert.equal(resolved.instructionText, EXPECTED_INSTRUCTIONS.soundGate);
  assert.deepEqual(resolved.targetAudio, ["/audio/target.mp3"]);

  const unknown = resolveAdventureRoundAudio({
    mechanicId: "unknown-mechanic",
    type: "sound",
    audio: "/audio/target.mp3"
  });
  assert.equal(unknown.instructionText, "");
  assert.equal(unknown.instructionAudio, "");
  assert.deepEqual(unknown.targetAudio, []);
});

test("the generated audio source covers every instruction and live phrase model", () => {
  const audioTexts = adventureRoundAudio.ADVENTURE_MAP_AUDIO_TEXTS;
  assert.ok(Array.isArray(audioTexts));
  const instructionSet = new Set(Object.values(EXPECTED_INSTRUCTIONS));
  for (const text of instructionSet) assert.equal(audioTexts.includes(text), true, text);

  const expectedPhraseModels = new Set();
  for (const cycle of elSkillsBlockCycles.filter(item => item.cycleNumber)) {
    for (const station of stationsForCycle(cycle)) {
      for (const round of buildStationRounds(cycle, station.id)) {
        if (round.mechanicId === "phraseFlow") expectedPhraseModels.add(round.phraseChunks.join(" "));
        if (round.mechanicId === "poemSpotlight") expectedPhraseModels.add(round.lines.join("\n"));
      }
    }
  }
  assert.ok(expectedPhraseModels.size > 0);
  for (const text of expectedPhraseModels) assert.equal(audioTexts.includes(text), true, text);
});
