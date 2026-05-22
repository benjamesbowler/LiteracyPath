import { childWordAssets, getChildWordAsset } from "./childAssets.js";

export const CHILD_ACTIVITY_FORMATS = {
  PICTURE_TO_PRINT_MATCH: {
    label: "Picture to Print Match",
    evidence: "meaning-print-decoding",
    supportsImages: true,
    supportsChoiceAudio: false,
    supportsMultiSelect: false
  },
  IMAGE_INITIAL_SOUND: {
    label: "Image Initial Sound",
    evidence: "meaning-sound-phonological-awareness",
    supportsImages: true,
    supportsChoiceAudio: true,
    supportsMultiSelect: false
  },
  PICTURE_TO_PRINT_CVC: {
    label: "Picture to Print CVC",
    evidence: "meaning-sound-print-vowel-discrimination",
    supportsImages: true,
    supportsChoiceAudio: false,
    supportsMultiSelect: false
  },
  IMAGE_VOWEL_SORT: {
    label: "Image Vowel Sort",
    evidence: "meaning-sound-vowel-sorting",
    supportsImages: true,
    supportsChoiceAudio: true,
    supportsMultiSelect: true
  }
};

export const childImageAssets = Object.fromEntries(
  Object.entries(childWordAssets).map(([word, asset]) => [
    word,
    {
      word,
      image: asset.image || asset.fallbackImage,
      fallbackImage: asset.fallbackImage,
      alt: asset.alt
    }
  ])
);

const introQuestions = [
  ["intro-cat", "cat", ["cat", "dog", "fish", "book"]],
  ["intro-bat", "bat", ["bat", "fish", "book", "bed"]],
  ["intro-hat", "hat", ["hat", "dog", "fish", "bed"]],
  ["intro-map", "map", ["map", "dog", "book", "fish"]],
  ["intro-cap", "cap", ["cap", "bed", "dog", "book"]],
  ["intro-pan", "pan", ["pan", "fish", "bed", "dog"]],
  ["intro-man", "man", ["man", "book", "fish", "bed"]],
  ["intro-nap", "nap", ["nap", "dog", "book", "bed"]]
];

const practiceQuestions = [
  ["practice-cat", "cat", ["cat", "cap", "bat", "map"]],
  ["practice-bat", "bat", ["bat", "bag", "hat", "cat"]],
  ["practice-hat", "hat", ["hat", "bat", "cat", "cap"]],
  ["practice-map", "map", ["map", "man", "nap", "cap"]],
  ["practice-cap", "cap", ["cap", "cat", "map", "nap"]],
  ["practice-pan", "pan", ["pan", "man", "nap", "bag"]],
  ["practice-man", "man", ["man", "map", "pan", "bag"]],
  ["practice-bag", "bag", ["bag", "bat", "cap", "man"]]
];

const mixedPracticeQuestions = [
  ["mixed-cat", "cat", ["cat", "hat", "bag", "pan"]],
  ["mixed-bat", "bat", ["bat", "cap", "map", "nap"]],
  ["mixed-hat", "hat", ["hat", "bag", "man", "cat"]],
  ["mixed-map", "map", ["map", "bat", "pan", "cap"]],
  ["mixed-cap", "cap", ["cap", "hat", "nap", "bag"]],
  ["mixed-pan", "pan", ["pan", "cat", "map", "man"]],
  ["mixed-man", "man", ["man", "nap", "bat", "cap"]],
  ["mixed-nap", "nap", ["nap", "bag", "pan", "hat"]]
];

const masteryPrepQuestions = [
  ["mastery-cat", "cat", ["cat", "cap", "cot", "cut"]],
  ["mastery-bat", "bat", ["bat", "bit", "but", "bet"]],
  ["mastery-hat", "hat", ["hat", "hot", "hit", "hut"]],
  ["mastery-map", "map", ["map", "mop", "cap", "nap"]],
  ["mastery-cap", "cap", ["cap", "cup", "cop", "cat"]],
  ["mastery-pan", "pan", ["pan", "pin", "pen", "pun"]],
  ["mastery-man", "man", ["man", "men", "map", "mop"]],
  ["mastery-nap", "nap", ["nap", "nip", "cap", "cup"]]
];

function buildPictureToPrintQuestion([id, targetWord, choices], formatLevel) {
  return {
    id: `picture-${id}`,
    formatType: "PICTURE_TO_PRINT_MATCH",
    formatLevel,
    targetWord,
    prompt: "Which word matches the picture?",
    spokenPrompt: "Which word matches the picture?",
    audioText: targetWord,
    answer: targetWord,
    choices
  };
}

// TODO(child-mode-adaptive): Replace fixed mission ordering with adaptive progression once Child Mode connects to mastery state.
// TODO(child-mode-mastery): Add a mastery-mode variant with reduced scaffolding after introduction/practice evidence exists.
// TODO(child-mode-assets): Add final Kimi assets for jam/ham/ram before using them as targets.
export const shortAEchoCavesQuestions = [
  ...introQuestions.map(question => buildPictureToPrintQuestion(question, "introduction")),
  ...practiceQuestions.map(question => buildPictureToPrintQuestion(question, "practice")),
  ...mixedPracticeQuestions.map(question => buildPictureToPrintQuestion(question, "mixed-practice")),
  ...masteryPrepQuestions.map(question => buildPictureToPrintQuestion(question, "mastery-prep"))
].map(question => ({
  ...question,
  // TODO(child-mode-assets): Replace any fallback placeholders with final Kimi/generated assets as the pool expands.
  targetAsset: getChildWordAsset(question.targetWord) || childImageAssets[question.targetWord],
  choices: question.choices.map(word => ({
    id: word,
    word,
    label: word,
    audioText: word
  }))
}));
