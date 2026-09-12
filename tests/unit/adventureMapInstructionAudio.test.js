import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { AUDIO_QUEST_PATHS } from "../../src/data/generated/audioQuestPaths.generated.js";
import { getLedaWordAudioPath } from "../../src/data/ledaProductionAudio.js";
import { buildStationRounds, stationsForCycle } from "../../src/components/elQuest/elQuestEngine.js";
import {
  ADVENTURE_MAP_AUDIO_TEXTS,
  ADVENTURE_MAP_INSTRUCTIONS,
  resolveAdventureRoundAudio,
  withAdventureAudioEvidence
} from "../../src/components/elQuest/adventureRoundAudio.js";
import { ADVENTURE_MECHANIC_IDS } from "../../src/components/elQuest/adventureRoundModel.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ffmpegAvailable = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status === 0;

function allRounds() {
  return elSkillsBlockCycles.filter(cycle => cycle.cycleNumber).flatMap(cycle => (
    stationsForCycle(cycle).flatMap(station => buildStationRounds(cycle, station.id))
  ));
}

test("every simple Adventure Map game has its own recorded action and playable target cues", () => {
  const seen = new Set();
  for (const round of allRounds()) {
    const resolved = resolveAdventureRoundAudio(round);
    seen.add(round.mechanicId);
    assert.ok(ADVENTURE_MAP_AUDIO_TEXTS.includes(resolved.instructionText), round.mechanicId);
    assert.doesNotMatch(resolved.instructionText, /gate|machine|grapheme|onset|check your|reveal and repair/i);
    assert.notEqual(resolved.instructionAudio, round.audio, round.mechanicId);
    const paths = [resolved.instructionAudio, ...resolved.targetAudio];
    assert.ok(paths[0], `Missing ${round.mechanicId} instruction`);
    for (const src of paths) {
      assert.ok(AUDIO_QUEST_PATHS.has(src), `Missing manifest entry ${src}`);
      assert.ok(fs.existsSync(path.join(root, "public", src)), `Missing recording ${src}`);
    }
    if (round.mechanicId !== "wordMemory") assert.ok(resolved.targetAudio.length, `Missing ${round.mechanicId} target`);
  }
  assert.deepEqual([...seen].sort(), [...ADVENTURE_MECHANIC_IDS].sort());
});

test("directions name the correct case and missing-letter position", () => {
  assert.equal(resolveAdventureRoundAudio({ mechanicId: "letterPair", answer: "a" }).instructionText, "Find the small letter.");
  assert.equal(resolveAdventureRoundAudio({ mechanicId: "letterPair", answer: "A" }).instructionText, "Find the big letter.");
  assert.equal(resolveAdventureRoundAudio({ mechanicId: "missingLetter", missingPosition: "start" }).instructionText, "Choose the first letter.");
  assert.equal(resolveAdventureRoundAudio({ mechanicId: "missingLetter", missingPosition: "end" }).instructionText, "Choose the last letter.");
  assert.equal(resolveAdventureRoundAudio({ mechanicId: "soundChoice", answer: "sh" }).instructionText, "Listen. Choose the letter team for this sound.");
});

test("rhyme directions speak every pictured choice without identifying the answer", () => {
  for (const mechanicId of ["rhymePair", "rhymeOdd"]) {
    const choices = ["cat", "sun", "hat"];
    const audio = resolveAdventureRoundAudio({ mechanicId, choices, answer: "sun" });
    assert.deepEqual(audio.targetAudio, choices.map(getLedaWordAudioPath));
  }
});

test("compound clues name both parts and all choices; memory keeps hidden cards secret", () => {
  const compound = resolveAdventureRoundAudio({
    mechanicId: "compoundPicture",
    parts: [{ word: "sun" }, { word: "flower" }],
    choices: ["sunflower", "football", "rainbow"],
    answer: "sunflower"
  });
  assert.deepEqual(compound.targetAudio, ["sun", "flower", "sunflower", "football", "rainbow"].map(getLedaWordAudioPath));
  const memory = resolveAdventureRoundAudio({ mechanicId: "wordMemory", words: ["the", "my"], audio: "/do-not-speak-hidden-cards.mp3" });
  assert.equal(memory.instructionText, "Turn over two cards. Find the matching words.");
  assert.deepEqual(memory.targetAudio, []);
});

test("retired mechanics fail closed and cannot speak old gate instructions", () => {
  for (const mechanicId of ["soundGate", "wordWindow", "wordMachine", "unknown"]) {
    const audio = resolveAdventureRoundAudio({ mechanicId, type: "sound", audio: "/target.mp3" });
    assert.equal(audio.instructionAudio, "");
    assert.deepEqual(audio.targetAudio, []);
  }
  assert.ok(ADVENTURE_MAP_AUDIO_TEXTS.includes(ADVENTURE_MAP_INSTRUCTIONS.mapEntry));
});

test("early correct choices still complete play without claiming unheard audio evidence", () => {
  const round = { mechanicId: "rhymePair", choices: ["cat", "sun", "hat"], audioRequired: true };
  const response = { correct: true, evidence: { independent: true, supportLevel: 0 } };
  const cues = resolveAdventureRoundAudio(round).targetAudio;
  const early = withAdventureAudioEvidence(round, response, cues.slice(0, 1));
  assert.equal(early.correct, true);
  assert.equal(early.evidence.audioDelivered, false);
  assert.equal(early.evidence.independent, false);
  const heard = withAdventureAudioEvidence(round, response, cues);
  assert.equal(heard.evidence.audioDelivered, true);
  assert.equal(heard.evidence.independent, true);
  assert.equal(response.evidence.independent, true);
  const visual = withAdventureAudioEvidence({ mechanicId: "letterPair", answer: "a" }, response);
  assert.equal(visual.evidence.independent, true);
});

test("recorded directions contain audible decoded sound, including the map entry", { skip: !ffmpegAvailable }, () => {
  const checked = spawnSync(process.execPath, ["tools/generateAdventureMapInstructionAudio.mjs", "--check"], {
    cwd: root,
    encoding: "utf8"
  });
  assert.equal(checked.status, 0, `${checked.stdout}\n${checked.stderr}`);
});
