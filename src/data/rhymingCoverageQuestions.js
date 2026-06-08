import { getChildWordAsset } from "./childAssets.js";
import {
  rhymingExpectedItemKeys,
  rhymingLevelTwoExpectedItemKeys,
  rhymingPhaseItemKeysByLevel
} from "./coverageExpectations.js";
import { rhymeGroups } from "./rhymeGroups.js";
import { buildRhymingDistractors } from "./rhymingDistractors.js";
import { makeVisualCardChoiceQuestion } from "./visualQuestionAssets.js";

const levelOneFamilies = new Set(rhymingExpectedItemKeys);
const levelTwoFamilies = new Set(rhymingLevelTwoExpectedItemKeys);
const phaseLookupByLevel = Object.fromEntries(
  Object.entries(rhymingPhaseItemKeysByLevel).map(([level, phases]) => [
    Number(level),
    Object.fromEntries(
      Object.entries(phases).flatMap(([phase, families]) =>
        families.map(family => [family, Number(phase)])
      )
    )
  ])
);

function hasWordImage(word) {
  const asset = getChildWordAsset(word);
  return Boolean(asset?.image || asset?.fallbackImage);
}

function usableWordsForFamily(family) {
  return (rhymeGroups[family] || []).filter(hasWordImage);
}

function pictureVariantsForFamily(family) {
  const words = usableWordsForFamily(family);
  const variants = [];

  for (let targetIndex = 0; targetIndex < words.length; targetIndex += 1) {
    const targetWord = words[targetIndex];
    const rhymingAnswers = words.filter(word => word !== targetWord);

    rhymingAnswers.forEach((answer, answerIndex) => {
      const distractors = buildRhymingDistractors({
        targetWord,
        answer,
        family,
        count: 3,
        variantIndex: variants.length + answerIndex,
        requireImages: true
      });
      if (distractors.length < 3) return;
      variants.push({
        targetWord,
        answers: [answer],
        choices: [answer, ...distractors],
        requiredSelections: 1
      });
    });

    if (rhymingAnswers.length >= 2) {
      const answers = rhymingAnswers.slice(0, 2);
      const distractors = buildRhymingDistractors({
        targetWord,
        answer: answers[0],
        family,
        count: 2,
        variantIndex: variants.length + targetIndex,
        requireImages: true,
        exclude: answers
      });
      if (distractors.length >= 2) {
        variants.push({
          targetWord,
          answers,
          choices: [...answers, ...distractors],
          requiredSelections: 2
        });
      }
    }
  }

  return variants.slice(0, levelOneFamilies.has(family) ? 24 : 16);
}

function makeRhymeQuestion(family, variant, index, level) {
  const correctAnswers = variant.answers || [variant.answer].filter(Boolean);
  const requiredSelections = correctAnswers.length === 2 ? 2 : 1;
  const phase = phaseLookupByLevel[level]?.[family] || 1;
  const prompt = requiredSelections === 2
    ? `Which two words rhyme with ${variant.targetWord}?`
    : `Which word rhymes with ${variant.targetWord}?`;

  const question = makeVisualCardChoiceQuestion({
    id: `coverage_rhyme_l${level}_${family}_${String(index + 1).padStart(3, "0")}`,
    skill: "rhyming",
    skillId: "rhyming",
    itemType: "rhyming_family",
    itemKey: family,
    level,
    assessmentLevel: level,
    depthLevel: level,
    difficulty: level,
    phase,
    assessmentPhase: phase,
    levelPhase: phase,
    phaseTarget: `level_${level}_phase_${phase}`,
    formatType: "RHYMING_PICTURE",
    prompt,
    choices: variant.choices,
    answer: correctAnswers[0],
    targetWord: variant.targetWord,
    imageWord: variant.targetWord,
    requireOptionImages: true,
    requireOptionAudio: false,
    hideWrittenLabels: false,
    extra: {
      question: prompt,
      templateType: "RHYMING_PICTURE",
      correctAnswer: correctAnswers[0],
      correctAnswers,
      requiredSelections,
      maxSelectable: requiredSelections,
      rimeFamily: family,
      rhymeGroup: family,
      targetSound: family,
      level,
      phase,
      difficulty: level,
      tags: ["rhyming", `level-${level}`, `phase-${phase}`, family],
      active: true
    }
  });

  return {
    ...question,
    correctAnswers,
    requiredSelections,
    maxSelectable: requiredSelections,
    answerOptions: (question.imageCards || []).map(card => ({
      ...card,
      label: card.label || card.word,
      value: card.value || card.word,
      imageUrl: card.image,
      isCorrect: correctAnswers.includes(card.word)
    })),
    audioText: "",
    audioPath: "",
    spokenPrompt: prompt,
    imageCards: (question.imageCards || []).map(card => ({
      ...card,
      audio: ""
    }))
  };
}

export const rhymingCoverageQuestions = [
  ...[...levelOneFamilies].flatMap(family =>
    pictureVariantsForFamily(family).map((variant, index) =>
      makeRhymeQuestion(family, variant, index, 1)
    )
  ),
  ...[...levelTwoFamilies].flatMap(family =>
    pictureVariantsForFamily(family).map((variant, index) =>
      makeRhymeQuestion(family, variant, index, 2)
    )
  )
].filter(question =>
  question.imagePath &&
  (question.imageCards || []).length === 4 &&
  (question.imageCards || []).every(card => card.image) &&
  question.choices.includes(question.answer) &&
  question.correctAnswers.every(answer => question.choices.includes(answer))
);
