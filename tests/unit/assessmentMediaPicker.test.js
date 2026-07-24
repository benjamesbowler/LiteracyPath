import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveQuestionMediaDynamically,
  validateResolvedQuestionMedia
} from "../../src/data/assessmentMediaPicker.js";
import { getAssessmentMediaByPath } from "../../src/data/assessmentMediaRegistry.js";
import { grammarAssessmentQuestions } from "../../src/data/generated/grammarAssessmentQuestions.generated.js";
import { secondBlockSkillTopUpQuestions } from "../../src/data/generated/secondBlockSkillTopUpQuestions.generated.js";

const instructionAudio = "/audio/child-mode/clean-human/phrases/listen-and-find.mp3";

test("pair-selection instruction audio is not misclassified as target-word audio", () => {
  const question = {
    id: "pair-media-contract",
    skillId: "initial_sounds",
    questionType: "initial_sound_pair",
    formatType: "INITIAL_SOUND_PAIR_SELECT",
    prompt: "Listen to each word. Which two words start with the same sound?",
    targetWord: "listen and find",
    audioText: "listen and find",
    audioPath: instructionAudio,
    imageCards: [
      {
        word: "nap",
        image: "/images/child-mode/cvc/nap.png",
        audio: "/audio/child-mode/clean-human/words/nap.mp3"
      },
      {
        word: "nose",
        image: "/images/child-mode/initial-sounds/nose.png",
        audio: "/audio/child-mode/words/nose.mp3"
      },
      {
        word: "dog",
        image: "/images/child-mode/cvc/dog.png",
        audio: "/audio/child-mode/clean-human/words/dog.mp3"
      }
    ]
  };

  const resolved = resolveQuestionMediaDynamically(question);

  assert.equal(resolved.assessmentMediaResolution.requiredAudioType, "instruction");
  assert.equal(resolved.assessmentMediaResolution.audioPath, instructionAudio);
  assert.deepEqual(validateResolvedQuestionMedia(resolved), []);
});

test("pair-selection validation still rejects a mismatched option image", () => {
  const question = {
    skillId: "initial_sounds",
    questionType: "initial_sound_pair",
    formatType: "INITIAL_SOUND_PAIR_SELECT",
    audioPath: instructionAudio,
    imageCards: [
      {
        word: "nap",
        image: "/images/child-mode/cvc/dog.png",
        audio: "/audio/child-mode/clean-human/words/nap.mp3"
      }
    ]
  };

  assert.match(
    validateResolvedQuestionMedia(question).join("\n"),
    /media option "nap" image is not approved exact-target media/
  );
});

test("approved Kimi vocabulary and Final Sounds override images are indexed", () => {
  const kimiImage = getAssessmentMediaByPath("/media/vocabulary/images/den.webp", "image");
  const finalSoundImage = getAssessmentMediaByPath("/media/final-sounds/images/b/lab.webp", "image");
  const packedImage = getAssessmentMediaByPath("/images/child-mode/vowel-teams/bee.png", "image");

  assert.equal(kimiImage?.available, true);
  assert.equal(kimiImage?.normalizedWord, "den");
  assert.equal(finalSoundImage?.available, true);
  assert.equal(finalSoundImage?.normalizedWord, "lab");
  assert.equal(packedImage?.available, true);
  assert.equal(packedImage?.normalizedWord, "bee");
});

test("question banks exclude targets whose assessment images are blocked", () => {
  assert.equal(
    grammarAssessmentQuestions.some(question => question.targetWord === "white"),
    false
  );
  assert.equal(
    secondBlockSkillTopUpQuestions.some(question => question.skillId === "nouns" && question.targetWord === "nut"),
    false
  );
});
