import assert from "node:assert/strict";
import test from "node:test";

import { vocabularyMediaLexicon } from "../../src/data/vocabularyMediaLexicon.js";
import {
  vocabularyRuntime
} from "../../src/data/generated/vocabularyRuntime.generated.js";

const SKILL_NAMES = [
  "initialSounds",
  "finalSounds",
  "rhyming",
  "cvcShortVowels",
  "blends",
  "digraphs",
  "longVowelsSilentE",
  "vowelTeams",
  "rControlledVowels",
  "vocabulary"
];

test("compact vocabulary runtime rows preserve every field consumed in the browser", () => {
  assert.equal(vocabularyRuntime.length, vocabularyMediaLexicon.length);
  vocabularyMediaLexicon.forEach((source, index) => {
    const runtime = vocabularyRuntime[index];
    assert.deepEqual(
      {
        word: runtime.word,
        normalizedWord: runtime.normalizedWord,
        displayWord: runtime.displayWord,
        imagePath: runtime.imagePath,
        audioPath: runtime.audioPath,
        status: runtime.status,
        recommendedLevel: runtime.recommendedLevel,
        difficultyBand: runtime.difficultyBand,
        isImageable: runtime.isImageable,
        tags: runtime.tags,
        skills: SKILL_NAMES.filter(name => runtime.skills[name]?.eligible),
        phonics: runtime.phonics,
        notes: runtime.notes
      },
      {
        word: source.word,
        normalizedWord: source.normalizedWord,
        displayWord: source.displayWord,
        imagePath: source.imagePath,
        audioPath: source.audioPath,
        status: source.status,
        recommendedLevel: source.recommendedLevel,
        difficultyBand: source.difficultyBand,
        isImageable: source.isImageable !== false,
        tags: source.tags,
        skills: SKILL_NAMES.filter(name => source.skills[name]?.eligible),
        phonics: {
          initialSound: source.phonics?.initialSound || "",
          finalSound: source.phonics?.finalSound || "",
          medialVowel: source.phonics?.medialVowel || "",
          rimeFamily: source.phonics?.rimeFamily || "",
          syllableCount: source.phonics?.syllableCount || 0,
          onset: source.phonics?.onset || "",
          syllableType: source.phonics?.syllableType || "",
          vowelPattern: source.phonics?.vowelPattern || ""
        },
        notes: source.notes || ""
      },
      source.word
    );
  });
});
