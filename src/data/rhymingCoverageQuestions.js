import { getChildWordAsset } from "./childAssets.js";
import {
  rhymingExpectedItemKeys,
  rhymingLevelTwoExpectedItemKeys,
  rhymingPhaseItemKeysByLevel
} from "./coverageExpectations.js";
import { rhymeGroups } from "./rhymeGroups.js";
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

function firstVowel(word = "") {
  return String(word || "").toLowerCase().match(/[aeiou]/)?.[0] || "";
}

function wordRime(word = "") {
  const value = String(word || "").toLowerCase();
  const index = value.search(/[aeiou]/);
  return index === -1 ? value.slice(1) : value.slice(index);
}

function usableWordsForFamily(family) {
  return (rhymeGroups[family] || []).filter(hasWordImage);
}

function distractorsForFamily(family, count, variantIndex) {
  const targetVowel = firstVowel(family);
  const otherFamilies = Object.entries(rhymeGroups)
    .filter(([otherFamily]) => otherFamily !== family)
    .map(([otherFamily, words]) => [
      otherFamily,
      words.filter(hasWordImage)
    ])
    .filter(([, words]) => words.length > 0);
  const start = variantIndex % Math.max(1, otherFamilies.length);
  const rotated = otherFamilies.slice(start).concat(otherFamilies.slice(0, start))
    .sort(([familyA], [familyB]) =>
      Number(firstVowel(familyB) === targetVowel) - Number(firstVowel(familyA) === targetVowel)
    );
  const selected = [];
  const usedInitials = new Set();
  const usedRimes = new Set();
  const usedVowels = new Set();

  for (const [, words] of rotated) {
    const word = words
      .slice()
      .sort((a, b) => {
        const score = item => (
          (usedInitials.has(item[0]) ? 0 : 8) +
          (usedRimes.has(wordRime(item)) ? 0 : 8) +
          (usedVowels.has(firstVowel(item)) ? 0 : 4) +
          (targetVowel && firstVowel(item) === targetVowel ? 16 : 0)
        );
        return score(b) - score(a);
      })[0];
    if (!word || selected.includes(word)) continue;
    selected.push(word);
    usedInitials.add(word[0]);
    usedRimes.add(wordRime(word));
    usedVowels.add(firstVowel(word));
    if (selected.length >= count) break;
  }

  return selected;
}

function pictureVariantsForFamily(family) {
  const words = usableWordsForFamily(family);
  const variants = [];

  for (let targetIndex = 0; targetIndex < words.length; targetIndex += 1) {
    const targetWord = words[targetIndex];
    const rhymingAnswers = words.filter(word => word !== targetWord);

    rhymingAnswers.forEach((answer, answerIndex) => {
      const distractors = distractorsForFamily(family, 3, variants.length + answerIndex);
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
      const distractors = distractorsForFamily(family, 2, variants.length + targetIndex);
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
