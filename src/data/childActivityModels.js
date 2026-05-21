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

export const childImageAssets = {
  dog: {
    word: "dog",
    image: "/images/objects/dog.svg",
    category: "objects",
    alt: "A friendly dog"
  },
  cat: {
    word: "cat",
    image: "/images/cvc/cat.svg",
    category: "cvc",
    alt: "A friendly cat"
  },
  fish: {
    word: "fish",
    image: "/images/objects/fish.svg",
    category: "objects",
    alt: "A colorful fish"
  },
  book: {
    word: "book",
    image: "/images/objects/book.svg",
    category: "objects",
    alt: "A picture book"
  },
  bed: {
    word: "bed",
    image: "/images/vowels/bed.svg",
    category: "vowels",
    alt: "A cozy bed"
  },
  bat: {
    word: "bat",
    image: "/images/cvc/bat.svg",
    category: "cvc",
    alt: "A baseball bat"
  },
  hat: {
    word: "hat",
    image: "/images/cvc/hat.svg",
    category: "cvc",
    alt: "A soft hat"
  },
  map: {
    word: "map",
    image: "/images/cvc/map.svg",
    category: "cvc",
    alt: "A folded map"
  },
  cap: {
    word: "cap",
    image: "/images/cvc/cap.svg",
    category: "cvc",
    alt: "A baseball cap"
  },
  pan: {
    word: "pan",
    image: "/images/cvc/pan.svg",
    category: "cvc",
    alt: "A cooking pan"
  },
  man: {
    word: "man",
    image: "/images/cvc/man.svg",
    category: "cvc",
    alt: "A smiling man"
  },
  nap: {
    word: "nap",
    image: "/images/cvc/nap.svg",
    category: "cvc",
    alt: "A child taking a nap"
  },
  boat: {
    word: "boat",
    image: "/images/vowels/boat.svg",
    category: "vowels",
    alt: "A small boat"
  },
  coat: {
    word: "coat",
    image: "/images/vowels/coat.svg",
    category: "vowels",
    alt: "A warm coat"
  },
  goat: {
    word: "goat",
    image: "/images/vowels/goat.svg",
    category: "vowels",
    alt: "A gentle goat"
  }
};

const shortAWordSets = {
  cat: ["cat", "bat", "hat", "cap"],
  bat: ["bat", "cat", "hat", "map"],
  hat: ["hat", "bat", "cat", "cap"],
  map: ["map", "cap", "nap", "man"],
  cap: ["cap", "cat", "map", "nap"],
  pan: ["pan", "man", "nap", "cap"],
  man: ["man", "pan", "map", "nap"],
  nap: ["nap", "cap", "map", "pan"]
};

export const shortAEchoCavesQuestions = [
  {
    id: "picture-cat",
    formatType: "PICTURE_TO_PRINT_CVC",
    targetWord: "cat",
    prompt: "Which word matches the picture?",
    spokenPrompt: "Which word matches the picture?",
    audioText: "cat",
    answer: "cat",
    choices: shortAWordSets.cat
  },
  {
    id: "picture-bat",
    formatType: "PICTURE_TO_PRINT_CVC",
    targetWord: "bat",
    prompt: "Which word matches the picture?",
    spokenPrompt: "Which word matches the picture?",
    audioText: "bat",
    answer: "bat",
    choices: shortAWordSets.bat
  },
  {
    id: "picture-hat",
    formatType: "PICTURE_TO_PRINT_CVC",
    targetWord: "hat",
    prompt: "Which word matches the picture?",
    spokenPrompt: "Which word matches the picture?",
    audioText: "hat",
    answer: "hat",
    choices: shortAWordSets.hat
  },
  {
    id: "picture-map",
    formatType: "PICTURE_TO_PRINT_CVC",
    targetWord: "map",
    prompt: "Which word matches the picture?",
    spokenPrompt: "Which word matches the picture?",
    audioText: "map",
    answer: "map",
    choices: shortAWordSets.map
  },
  {
    id: "picture-cap",
    formatType: "PICTURE_TO_PRINT_CVC",
    targetWord: "cap",
    prompt: "Which word matches the picture?",
    spokenPrompt: "Which word matches the picture?",
    audioText: "cap",
    answer: "cap",
    choices: shortAWordSets.cap
  },
  {
    id: "picture-pan",
    formatType: "PICTURE_TO_PRINT_CVC",
    targetWord: "pan",
    prompt: "Which word matches the picture?",
    spokenPrompt: "Which word matches the picture?",
    audioText: "pan",
    answer: "pan",
    choices: shortAWordSets.pan
  },
  {
    id: "picture-man",
    formatType: "PICTURE_TO_PRINT_CVC",
    targetWord: "man",
    prompt: "Which word matches the picture?",
    spokenPrompt: "Which word matches the picture?",
    audioText: "man",
    answer: "man",
    choices: shortAWordSets.man
  },
  {
    id: "picture-nap",
    formatType: "PICTURE_TO_PRINT_CVC",
    targetWord: "nap",
    prompt: "Which word matches the picture?",
    spokenPrompt: "Which word matches the picture?",
    audioText: "nap",
    answer: "nap",
    choices: shortAWordSets.nap
  }
].map(question => ({
  ...question,
  targetAsset: childImageAssets[question.targetWord],
  choices: question.choices.map(word => ({
    id: word,
    word,
    label: word,
    audioText: word
  }))
}));

