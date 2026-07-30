import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  getLedaInstructionAudioPath,
  getLedaProductionAudioPath,
  getLedaWordAudioPath,
  isLedaProductionAudioPath
} from "../../src/data/ledaProductionAudio.js";
import { LEDA_PRODUCTION_AUDIO_BY_ROLE } from "../../src/data/generated/ledaProductionAudio.generated.js";
import { wordAudioPath } from "../../src/components/elQuest/elQuestEngine.js";
import { storyQuests } from "../../src/data/storyQuests.js";
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

test("every live story-quest page resolves to its Leda narration", async () => {
  const pages = storyQuests.flatMap(quest =>
    (quest.pages || []).map(page => ({
      id: `${quest.id}:${page.id}`,
      text: Array.isArray(page.text) ? page.text.join(" ") : page.text || ""
    }))
  ).filter(page => page.text);

  assert.equal(pages.length, 313);
  for (const page of pages) {
    const audioPath = getLedaProductionAudioPath(page.text, ["story_page"]);
    assert.match(audioPath, /^\/audio\/production\/en-US\/story_page\//, page.id);
    await access(path.join(repositoryRoot, "public", audioPath));
  }
});

test("approved report read-aloud copy is installed in the Leda bank", () => {
  assert.equal(Object.keys(LEDA_PRODUCTION_AUDIO_BY_ROLE.report || {}).length, 199);
});
