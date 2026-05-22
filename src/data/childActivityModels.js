import { childWordAssets, getChildWordAsset } from "./childAssets";

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

const formatTwoChoiceSets = {
  catEarly: ["cat", "dog", "fish", "book"],
  batEarly: ["bat", "dog", "fish", "book"],
  hatPractice: ["hat", "hot", "hut", "hit"],
  mapPractice: ["map", "mop", "cap", "nap"],
  capLater: ["cap", "cat", "cot", "cut"],
  panLater: ["pan", "pin", "pen", "pun"],
  manLater: ["man", "men", "map", "mop"],
  napLater: ["nap", "nip", "cap", "cup"]
};

// TODO(child-mode-adaptive): Replace fixed mission ordering with adaptive progression once Child Mode connects to mastery state.
// TODO(child-mode-mastery): Add a mastery-mode variant with reduced scaffolding after introduction/practice evidence exists.
export const shortAEchoCavesQuestions = [
  {
    id: "picture-cat",
    formatType: "PICTURE_TO_PRINT_MATCH",
    formatLevel: "early",
    targetWord: "cat",
    prompt: "Which word matches the picture?",
    spokenPrompt: "Which word matches the picture?",
    audioText: "cat",
    answer: "cat",
    choices: formatTwoChoiceSets.catEarly
  },
  {
    id: "picture-bat",
    formatType: "PICTURE_TO_PRINT_MATCH",
    formatLevel: "early",
    targetWord: "bat",
    prompt: "Which word matches the picture?",
    spokenPrompt: "Which word matches the picture?",
    audioText: "bat",
    answer: "bat",
    choices: formatTwoChoiceSets.batEarly
  },
  {
    id: "picture-hat",
    formatType: "PICTURE_TO_PRINT_MATCH",
    formatLevel: "practice",
    targetWord: "hat",
    prompt: "Which word matches the picture?",
    spokenPrompt: "Which word matches the picture?",
    audioText: "hat",
    answer: "hat",
    choices: formatTwoChoiceSets.hatPractice
  },
  {
    id: "picture-map",
    formatType: "PICTURE_TO_PRINT_MATCH",
    formatLevel: "practice",
    targetWord: "map",
    prompt: "Which word matches the picture?",
    spokenPrompt: "Which word matches the picture?",
    audioText: "map",
    answer: "map",
    choices: formatTwoChoiceSets.mapPractice
  },
  {
    id: "picture-cap",
    formatType: "PICTURE_TO_PRINT_MATCH",
    formatLevel: "later",
    targetWord: "cap",
    prompt: "Which word matches the picture?",
    spokenPrompt: "Which word matches the picture?",
    audioText: "cap",
    answer: "cap",
    choices: formatTwoChoiceSets.capLater
  },
  {
    id: "picture-pan",
    formatType: "PICTURE_TO_PRINT_MATCH",
    formatLevel: "later",
    targetWord: "pan",
    prompt: "Which word matches the picture?",
    spokenPrompt: "Which word matches the picture?",
    audioText: "pan",
    answer: "pan",
    choices: formatTwoChoiceSets.panLater
  },
  {
    id: "picture-man",
    formatType: "PICTURE_TO_PRINT_MATCH",
    formatLevel: "later",
    targetWord: "man",
    prompt: "Which word matches the picture?",
    spokenPrompt: "Which word matches the picture?",
    audioText: "man",
    answer: "man",
    choices: formatTwoChoiceSets.manLater
  },
  {
    id: "picture-nap",
    formatType: "PICTURE_TO_PRINT_MATCH",
    formatLevel: "later",
    targetWord: "nap",
    prompt: "Which word matches the picture?",
    spokenPrompt: "Which word matches the picture?",
    audioText: "nap",
    answer: "nap",
    choices: formatTwoChoiceSets.napLater
  }
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
