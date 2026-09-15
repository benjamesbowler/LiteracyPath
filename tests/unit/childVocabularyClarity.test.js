import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { childWordAssets, getChildWordAsset, getChildAudioPath } from "../../src/data/childAssets.js";
import { curatedChildWordImageOverrides } from "../../src/data/childWordImageOverrides.js";
import { CHILD_WORD_AUDIO_OVERRIDES } from "../../src/data/childWordAudioOverrides.js";
import { getLedaWordAudioPath } from "../../src/data/ledaProductionAudio.js";
import { LEDA_WORD_AUDIO } from "../../src/data/generated/ledaWordAudio.generated.js";
import { findAssessmentMediaCandidates, getAssessmentMediaByPath } from "../../src/data/assessmentMediaRegistry.js";
import { resolveQuestionMediaDynamically, validateResolvedQuestionMedia } from "../../src/data/assessmentMediaPicker.js";
import { adventureWordImage, wordAudioPath, buildStationRounds } from "../../src/components/elQuest/elQuestEngine.js";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";

test("reviewed vocabulary pictures outrank legacy sources and unrelated fallbacks", () => {
  for (const [word, image] of Object.entries(curatedChildWordImageOverrides)) {
    assert.ok(fs.existsSync(new URL(`../../public${image}`, import.meta.url)), word);
    const asset = getChildWordAsset(word);
    assert.equal(asset.image, image, word);
    assert.equal(asset.fallbackImage, image, word);
    assert.equal(adventureWordImage(word), image, word);
  }
  for (const word of ["bag", "ham", "jam", "ram"]) {
    const asset = getChildWordAsset(word);
    assert.equal(asset.fallbackImage, asset.image, `${word} must not fall back to another object`);
    assert.ok(fs.existsSync(new URL(`../../public${childWordAssets[word].fallbackImage}`, import.meta.url)), word);
  }
});

test("corrected simple vocabulary cannot rotate back to the reported scenes", () => {
  for (const word of Object.keys(curatedChildWordImageOverrides)) {
    const candidates = findAssessmentMediaCandidates({ word, mediaType: "image", role: "target_object" });
    assert.ok(candidates.length, word);
    assert.ok(candidates.every(record => record.path === curatedChildWordImageOverrides[word]), word);
    assert.ok(candidates.every(record => record.normalizedWord === word), word);
    assert.equal(getAssessmentMediaByPath(curatedChildWordImageOverrides[word], "image", word)?.normalizedWord, word);
  }
  assert.equal(getAssessmentMediaByPath(curatedChildWordImageOverrides.foot, "image", "girl"), null);
});

test("authored picture choices replace an old foot scene and keep exact-word validation", () => {
  const question = {
    id: "clarity-initial-sound-pair",
    skillId: "initial_sounds",
    questionType: "initial_sound_pair",
    formatType: "INITIAL_SOUND_PAIR_SELECT",
    targetWord: "listen and find",
    audioPath: "/audio/child-mode/clean-human/phrases/listen-and-find.mp3",
    imageCards: ["foot", "fish", "rain"].map(word => ({
      word,
      image: word === "foot" ? "/media/vocabulary/images/foot.webp" : getChildWordAsset(word).image,
      audio: getChildAudioPath(word)
    }))
  };
  const resolved = resolveQuestionMediaDynamically(question);
  assert.equal(resolved.imageCards[0].image, curatedChildWordImageOverrides.foot);
  assert.deepEqual(validateResolvedQuestionMedia(resolved), []);
});

test("every word-audio resolver and compound part uses the corrected ribbon bow", () => {
  const corrected = CHILD_WORD_AUDIO_OVERRIDES.bow;
  assert.ok(fs.existsSync(new URL(`../../public${corrected}`, import.meta.url)));
  for (const resolve of [getLedaWordAudioPath, getChildAudioPath, wordAudioPath]) {
    assert.equal(resolve("bow"), corrected);
  }
  assert.equal(LEDA_WORD_AUDIO.bow, corrected);
  const cycle = elSkillsBlockCycles.find(item => item.id === "cycle-1");
  let rainbows = 0;
  for (let seed = 0; seed < 12; seed += 1) {
    for (const round of buildStationRounds(cycle, "compound", { seed: `clarity:${seed}` })) {
      if (round.answer !== "rainbow") continue;
      rainbows += 1;
      assert.equal(round.parts.find(part => part.word === "bow").audio, corrected);
      assert.equal(round.parts.find(part => part.word === "rain").image, curatedChildWordImageOverrides.rain);
    }
  }
  assert.ok(rainbows > 0);
});
