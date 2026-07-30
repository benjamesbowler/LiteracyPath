import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  getLedaInstructionAudioPath,
  getLedaWordAudioPath,
  isLedaProductionAudioPath
} from "../../src/data/ledaProductionAudio.js";
import { wordAudioPath } from "../../src/components/elQuest/elQuestEngine.js";
import { getTargetWordAudioPath } from "../../src/utils/assessmentAudioRoles.js";
import { wordSrc } from "../../src/utils/questAudio.js";

const repositoryRoot = process.cwd();

test("core assessment words resolve to installed Leda production audio", async () => {
  for (const word of ["cat", "ant", "queen"]) {
    const audioPath = getLedaWordAudioPath(word);
    assert.match(audioPath, /^\/audio\/production\/en-US\/isolated_word\//);
    await access(path.join(repositoryRoot, "public", audioPath));
  }
});

test("normal language prompts resolve only to the Leda production tree", () => {
  const audioPath = getLedaInstructionAudioPath("Which word matches the picture?");
  assert.equal(isLedaProductionAudioPath(audioPath), true);
});

test("assessment, Sound Seekers and EL Quest cannot bypass Leda word replacements", () => {
  const oldCat = "/audio/child-mode/words/cat.mp3";
  for (const audioPath of [
    getTargetWordAudioPath("cat", oldCat),
    wordSrc("cat"),
    wordAudioPath("cat")
  ]) {
    assert.equal(isLedaProductionAudioPath(audioPath), true);
    assert.notEqual(audioPath, oldCat);
  }
});

test("superseded spoken-audio trees are physically absent", async () => {
  const retiredRoots = [
    "public/audio/assessment",
    "public/audio/child-mode",
    "public/audio/choices",
    "public/audio/guided-reading",
    "public/audio/learn-games",
    "public/audio/letter-names",
    "public/audio/story-quests",
    "public/audio/ui/voice",
    "public/audio/vocabulary",
    "public/guided-reading/audio",
    "public/media/initial-sounds/audio",
    "public/media/final-sounds/audio",
    "public/media/learn/audio",
    "public/media/rhyming/audio",
    "public/media/vocabulary/audio",
    "public/phonics/audio/letters"
  ];

  for (const retiredRoot of retiredRoots) {
    await assert.rejects(access(path.join(repositoryRoot, retiredRoot)), retiredRoot);
  }
});
