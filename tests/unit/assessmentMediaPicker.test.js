import test from "node:test";
import assert from "node:assert/strict";

import {
  markQuestionMediaUsage,
  resolveQuestionMediaDynamically,
  validateResolvedQuestionMedia
} from "../../src/data/assessmentMediaPicker.js";
import { getAssessmentMediaByPath } from "../../src/data/assessmentMediaRegistry.js";
import { loadAssessmentSkillBank } from "../../src/data/loadAssessmentSkillBank.js";
import { rhymingAssessmentImageVariants } from "../../src/data/generated/assessmentImageVariants.generated.js";
import { getLedaWordAudioPath } from "../../src/data/ledaProductionAudio.js";

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
        audio: getLedaWordAudioPath("nap")
      },
      {
        word: "nose",
        image: "/images/child-mode/initial-sounds/nose.png",
        audio: getLedaWordAudioPath("nose")
      },
      {
        word: "dog",
        image: "/images/child-mode/cvc/dog.png",
        audio: getLedaWordAudioPath("dog")
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
        audio: getLedaWordAudioPath("nap")
      }
    ]
  };

  assert.match(
    validateResolvedQuestionMedia(question).join("\n"),
    /media option "nap" image is not approved exact-target media/
  );
});

test("rhyming picture options resolve to approved exact-word assessment images", () => {
  const question = {
    id: "rhyming-option-media-contract",
    skillId: "rhyming",
    questionType: "visual_card_choice",
    formatType: "RHYMING_PICTURE",
    targetWord: "sun",
    imagePath: "/images/child-mode/cvc/sun.png",
    choices: ["fun", "top", "lip", "jeep"],
    answer: "fun",
    imageCards: [
      {
        word: "fun",
        image: "/media/vocabulary/images/fun.webp"
      },
      {
        word: "top",
        image: "/images/child-mode/initial-sounds/top.png"
      },
      {
        word: "lip",
        image: "/media/vocabulary/images/lip.webp"
      },
      {
        word: "jeep",
        image: "/media/initial-sounds/images/j/jeep.webp"
      }
    ],
    answerOptions: [
      { word: "fun", value: "fun" },
      { word: "top", value: "top" },
      { word: "lip", value: "lip" },
      { word: "jeep", value: "jeep" }
    ]
  };

  const resolved = resolveQuestionMediaDynamically(question, {
    skillId: "rhyming",
    level: 1,
    phase: 2
  });

  assert.equal(resolved.imageCards.length, 4);
  assert.match(resolved.imageCards[0].image, /^\/images\/assessment\/rhyming\/variants\/fun\/fun-/);
  assert.match(resolved.imageCards[1].image, /^\/images\/assessment\/rhyming\/variants\/op\/top-/);
  assert.match(resolved.imageCards[2].image, /^\/images\/assessment\/rhyming\/variants\/ip\/lip-/);
  assert.equal(
    resolved.answerOptions.every(option =>
      option.image === resolved.imageCards.find(card => card.word === option.word)?.image
    ),
    true
  );
  assert.deepEqual(validateResolvedQuestionMedia(resolved), []);
});

test("rhyming option images are recorded in assessment session usage", () => {
  const usage = {
    imagePaths: new Set(),
    audioPaths: new Set(),
    targetWords: new Set(),
    contentKeys: new Set(),
    templateKeys: new Set(),
    promptKeys: new Set(),
    correctQuestionIds: new Set()
  };
  const question = {
    id: "rhyming-option-usage-contract",
    skillId: "rhyming",
    questionType: "visual_card_choice",
    formatType: "RHYMING_PICTURE",
    targetWord: "sun",
    imagePath: "/images/child-mode/cvc/sun.png",
    choices: ["fun", "top"],
    answer: "fun",
    imageCards: [
      { word: "fun", image: "/media/vocabulary/images/fun.webp" },
      { word: "top", image: "/images/child-mode/initial-sounds/top.png" }
    ]
  };
  const resolved = resolveQuestionMediaDynamically(question, {
    skillId: "rhyming",
    level: 1,
    phase: 2,
    sessionUsage: usage
  });

  markQuestionMediaUsage(usage, resolved);

  assert.equal(
    resolved.imageCards.every(card => usage.imagePaths.has(card.image)),
    true
  );
});

test("every published picture-choice rhyming option resolves to exact-word image media", async () => {
  const assessmentVariantPathsByWord = new Map();
  Object.values(rhymingAssessmentImageVariants).forEach(words => {
    Object.entries(words).forEach(([word, paths]) => {
      assessmentVariantPathsByWord.set(word, new Set(paths));
    });
  });
  const questions = await loadAssessmentSkillBank("rhyming");

  assert.ok(questions.length > 0);
  questions.forEach(question => {
    const resolved = resolveQuestionMediaDynamically(question, {
      skillId: "rhyming",
      level: question.level || question.difficulty || 1,
      phase: question.phase || question.assessmentPhase || 1
    });

    const isPictureChoiceItem = question.formatType === "RHYME_MATCH_PICTURE";
    const resolvedCards = resolved.imageCards || [];
    assert.equal(
      resolvedCards.length,
      isPictureChoiceItem ? resolved.choices.length : 0,
      `${question.id} should ${isPictureChoiceItem ? "have one image card per option" : "use its main supporting image"}`
    );
    if (!isPictureChoiceItem && question.mediaTier === "image-required") {
      assert.ok(
        resolved.imagePath || resolved.imageUrl || resolved.targetImage,
        `${question.id} should retain at least one supporting image`
      );
    }
    resolvedCards.forEach(card => {
      const path = card.image || card.imagePath || card.imageUrl || "";
      const record = getAssessmentMediaByPath(path, "image");
      assert.equal(record?.available, true, `${question.id}:${card.word} should use approved image media`);
      assert.equal(record?.normalizedWord, card.word, `${question.id}:${card.word} image should match the option word`);
      const variants = assessmentVariantPathsByWord.get(card.word);
      if (variants?.size) {
        assert.equal(
          variants.has(path),
          true,
          `${question.id}:${card.word} should use its purpose-built assessment variant`
        );
      }
    });
  });
});

test("current vocabulary and packed assessment images are indexed", () => {
  const vocabularyImage = getAssessmentMediaByPath("/media/vocabulary/images/den.webp", "image");
  const packedImage = getAssessmentMediaByPath("/images/child-mode/vowel-teams/bee.png", "image");

  assert.equal(vocabularyImage?.available, true);
  assert.equal(vocabularyImage?.normalizedWord, "den");
  assert.equal(packedImage?.available, true);
  assert.equal(packedImage?.normalizedWord, "bee");
});

test("current production audio assets are indexed for assessment use", () => {
  const finalSoundAudio = getAssessmentMediaByPath(
    getLedaWordAudioPath("bang"),
    "audio"
  );
  const shortVowelAudio = getAssessmentMediaByPath(
    getLedaWordAudioPath("melt"),
    "audio"
  );
  const hfwAudio = getAssessmentMediaByPath(
    getLedaWordAudioPath("oil"),
    "audio"
  );

  assert.equal(finalSoundAudio?.available, true);
  assert.equal(finalSoundAudio?.normalizedWord, "bang");
  assert.equal(shortVowelAudio?.available, true);
  assert.equal(shortVowelAudio?.normalizedWord, "melt");
  assert.equal(hfwAudio?.available, true);
  assert.equal(hfwAudio?.normalizedWord, "oil");
});
