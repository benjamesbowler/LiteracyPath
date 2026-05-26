import { makePairSelectionQuestion } from "./soundPairAssets.js";
import { getChildWordAsset } from "./childAssets.js";
import {
  rhymingExpectedItemKeys,
  rhymingLevelTwoExpectedItemKeys
} from "./coverageExpectations.js";
import { rhymeGroups } from "./rhymeGroups.js";

const levelOneFamilies = new Set(rhymingExpectedItemKeys);
const levelTwoFamilies = new Set(rhymingLevelTwoExpectedItemKeys);

function hasWordImage(word) {
  const asset = getChildWordAsset(word);
  return Boolean(asset?.image || asset?.fallbackImage);
}

function usableWordsForFamily(family) {
  return (rhymeGroups[family] || []).filter(hasWordImage);
}

function distractorForFamily(family, variantIndex) {
  const otherWords = Object.entries(rhymeGroups)
    .filter(([otherFamily]) => otherFamily !== family)
    .flatMap(([, words]) => words)
    .filter(hasWordImage);
  return otherWords[variantIndex % otherWords.length] || "dog";
}

function pairVariantsForFamily(family) {
  const words = usableWordsForFamily(family);
  const pairs = [];

  for (let left = 0; left < words.length; left += 1) {
    for (let right = left + 1; right < words.length; right += 1) {
      pairs.push([words[left], words[right], distractorForFamily(family, pairs.length)]);
    }
  }

  return pairs.slice(0, levelOneFamilies.has(family) ? 10 : 8);
}

function makeRhymeQuestion(family, words, index, level) {
  return makePairSelectionQuestion({
    id: `coverage_rhyme_l${level}_${family}_${String(index + 1).padStart(3, "0")}`,
    skill: "rhyming",
    skillId: "rhyming",
    itemType: "rhyming_family",
    itemKey: family,
    targetSound: family,
    formatType: "RHYME_PAIR_SELECT",
    questionType: "rhyme_pair",
    prompt: "Listen to each word. Which two words rhyme?",
    words,
    pairVariant: index,
    level,
    difficulty: level
  });
}

export const rhymingCoverageQuestions = [
  ...[...levelOneFamilies].flatMap(family =>
    pairVariantsForFamily(family).map((words, index) =>
      makeRhymeQuestion(family, words, index, 1)
    )
  ),
  ...[...levelTwoFamilies].flatMap(family =>
    pairVariantsForFamily(family).map((words, index) =>
      makeRhymeQuestion(family, words, index, 2)
    )
  )
].filter(question =>
  (question.imageCards || []).length >= 3 &&
  (question.imageCards || []).every(card => card.image)
);
