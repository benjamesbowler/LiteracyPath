import {
  hasCompletePairSelectionAssets,
  makePairSelectionQuestion
} from "./soundPairAssets.js";

function valid(question) {
  return hasCompletePairSelectionAssets(question);
}

const finalSoundItems = [
  ["b", ["crab", "web", "fan"], ["thumb", "web", "cat"]],
  ["ng", ["king", "ring", "cat"], ["ring", "king", "dog"]],
  ["x", ["fox", "ox", "cat"], ["axe", "fox", "dog"]]
];

export const kimiDataset7RuntimeQuestions = finalSoundItems.flatMap(([itemKey, ...wordSets]) =>
  wordSets.map((words, index) =>
    makePairSelectionQuestion({
      id: `kimi7_final_${itemKey}_${index + 1}`,
      skill: "final sounds",
      skillId: "final_sounds",
      itemType: "final_sound",
      itemKey,
      targetSound: itemKey,
      formatType: "FINAL_SOUND_PAIR_SELECT",
      questionType: "final_sound_pair",
      prompt: "Listen to each word. Which two words end with the same sound?",
      words,
      pairVariant: index + 1
    })
  )
).filter(valid).map(question => ({
  ...question,
  source: "kimi_dataset7",
  activationStatus: "active",
  validationStatus: "passed_literacypath_runtime_gate"
}));
