import { makePairSelectionQuestion } from "./soundPairAssets.js";

const rhymePairs = {
  at: [["cat", "hat", "dog"], ["bat", "rat", "sun"], ["mat", "cat", "fish"], ["hat", "bat", "cup"]],
  ap: [["cap", "nap", "dog"], ["map", "cap", "sun"], ["clap", "nap", "fish"]],
  an: [["fan", "pan", "dog"], ["man", "van", "sun"], ["pan", "can", "fish"]],
  ed: [["bed", "red", "dog"], ["red", "bed", "sun"]],
  en: [["pen", "hen", "dog"], ["ten", "pen", "sun"], ["hen", "ten", "map"]],
  ig: [["pig", "wig", "dog"], ["big", "dig", "sun"], ["wig", "dig", "map"]],
  in: [["fin", "pin", "dog"], ["bin", "pin", "sun"], ["fin", "bin", "map"]],
  it: [["sit", "hit", "dog"], ["hit", "sit", "sun"]],
  og: [["dog", "log", "sun"], ["frog", "dog", "cat"], ["log", "frog", "map"]],
  op: [["mop", "top", "dog"], ["shop", "mop", "sun"], ["stop", "top", "fish"]],
  ot: [["pot", "cot", "dog"], ["hot", "pot", "sun"], ["cot", "hot", "map"]],
  ug: [["bug", "rug", "dog"], ["mug", "bug", "sun"], ["rug", "mug", "fish"]],
  un: [["sun", "pun", "dog"], ["pun", "sun", "map"]]
};

export const rhymingCoverageQuestions = Object.entries(rhymePairs).flatMap(([itemKey, variants]) =>
  variants.map((words, index) =>
    makePairSelectionQuestion({
      id: `coverage_rhyme_${itemKey}_${String(index + 1).padStart(3, "0")}`,
      skill: "rhyming",
      skillId: "rhyming",
      itemType: "rhyming_family",
      itemKey,
      targetSound: itemKey,
      formatType: "RHYME_PAIR_SELECT",
      questionType: "rhyme_pair",
      prompt: "Listen to each word. Which two words rhyme?",
      words,
      pairVariant: index
    })
  )
);

