export const CVC_WORDS = {
  easy: ["cat", "dog", "sun", "hat", "bat", "car", "pen", "bed", "red", "bus", "cup", "bug", "run", "box", "fox", "map", "lip", "leg", "pig", "top"],
  medium: ["ship", "fish", "frog", "crab", "tree", "star", "flag", "sock", "lamp", "ring"],
  hard: ["brush", "clock", "train", "plant", "shirt", "bread", "dress", "glass", "stamp"]
};

export const SIGHT_WORDS = {
  level1: ["the", "and", "is", "to", "of", "a", "in", "you", "it", "he", "was", "for", "on", "are", "as", "with", "his", "they", "at", "be"],
  level2: ["this", "have", "from", "or", "one", "had", "by", "words", "but", "not", "what", "all", "were", "we", "when", "your", "can", "said", "there", "use"],
  level3: ["each", "which", "she", "do", "how", "their", "if", "will", "up", "other", "about", "out", "many", "then", "them", "these", "so", "some", "her", "would"]
};

export const RHYMING_PAIRS = [
  ["cat", "hat"],
  ["dog", "log"],
  ["sun", "fun"],
  ["bed", "red"],
  ["car", "star"],
  ["pen", "hen"],
  ["bus", "us"],
  ["map", "cap"],
  ["pig", "big"],
  ["top", "hop"]
];

export const SENTENCES = {
  level1: [
    "The cat sat on the mat.",
    "I see a big dog.",
    "We can run and play."
  ],
  level2: [
    "The little bird can fly.",
    "She has a red hat.",
    "They went to the park."
  ],
  level3: [
    "The children played happily outside.",
    "Which book would you like to read?"
  ]
};

export const WORD_FAMILIES = {
  "-AT": ["cat", "hat", "bat", "mat", "rat", "sat"],
  "-AN": ["can", "pan", "man", "fan", "ran"],
  "-IG": ["big", "pig", "dig", "wig", "fig"],
  "-OP": ["hop", "top", "pop", "mop"],
  "-UN": ["sun", "run", "fun", "bun"],
  "-EN": ["pen", "hen", "ten", "men"]
};

const GAME_ACCENTS = {
  coral: { accent: "#E2725B", accentSoft: "#FBEDEA" },
  amber: { accent: "#D97706", accentSoft: "#FEF3C7" },
  violet: { accent: "#7C5CBF", accentSoft: "#F1EDFA" },
  blue: { accent: "#3B82C4", accentSoft: "#EAF2FA" },
  green: { accent: "#2F9E62", accentSoft: "#EAF7F0" }
};

export const GAME_LIST = [
  {
    id: "cvc-word-builder",
    title: "CVC Word Builder",
    skill: "Build short vowel words",
    category: "CVC",
    ...GAME_ACCENTS.coral,
    icon: "/images/learn-games/icon-cvc-builder.png",
    description: "Pick letters in order to build each word."
  },
  {
    id: "sight-word-memory",
    title: "Sight Word Memory",
    skill: "Recognize high-frequency words",
    category: "Sight Words",
    ...GAME_ACCENTS.blue,
    icon: "/images/learn-games/icon-sight-memory.png",
    description: "Flip cards and find matching sight words."
  },
  {
    id: "sound-slide",
    title: "Sound Slide",
    skill: "Blend phonemes",
    category: "Blending",
    ...GAME_ACCENTS.green,
    icon: "/images/learn-games/icon-sound-slide.png",
    description: "Slide sounds together to read a word."
  },
  {
    id: "blend-and-build",
    title: "Blend & Build",
    skill: "Word families",
    category: "Phonics",
    ...GAME_ACCENTS.violet,
    icon: "/images/learn-games/icon-blend-build.png",
    description: "Add beginnings to rimes to make families of words."
  },
  {
    id: "rhyme-time",
    title: "Rhyme Time",
    skill: "Rhyming pairs",
    category: "Rhyming",
    ...GAME_ACCENTS.amber,
    icon: "/images/learn-games/icon-rhyme-time.png",
    description: "Match words that rhyme."
  },
  {
    id: "sight-word-fishing",
    title: "Sight Word Fishing",
    skill: "Sight word fluency",
    category: "Sight Words",
    ...GAME_ACCENTS.coral,
    icon: "/images/learn-games/icon-word-fishing.png",
    description: "Catch the fish carrying the target word."
  },
  {
    id: "cvc-train",
    title: "CVC Train",
    skill: "Sequence letter sounds",
    category: "CVC",
    ...GAME_ACCENTS.blue,
    icon: "/images/learn-games/icon-word-train.png",
    description: "Load the train with letters in the right order."
  },
  {
    id: "pop-the-word",
    title: "Pop the Word",
    skill: "Fast word recognition",
    category: "Fluency",
    ...GAME_ACCENTS.violet,
    icon: "/images/learn-games/icon-pop-word.png",
    description: "Pop the balloon showing the word you hear."
  },
  {
    id: "word-hopscotch",
    title: "Word Hopscotch",
    skill: "Sentence order",
    category: "Sentences",
    ...GAME_ACCENTS.amber,
    icon: "/images/learn-games/icon-word-hopscotch.png",
    description: "Hop through words in sentence order."
  },
  {
    id: "reading-race",
    title: "Reading Race",
    skill: "Sentence comprehension",
    category: "Reading",
    ...GAME_ACCENTS.green,
    icon: "/images/learn-games/icon-reading-race.png",
    description: "Read quickly and choose the matching answer."
  }
];
