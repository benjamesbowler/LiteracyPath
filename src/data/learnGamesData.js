export const CVC_WORDS = {
  easy: [
    "cat", "dog", "sun", "hat", "bat", "pen", "bed", "red", "bus", "cup",
    "bug", "run", "box", "fox", "map", "lip", "leg", "pig", "top", "mat",
    "rat", "sat", "can", "pan", "man", "fan", "ran", "big", "dig", "wig",
    "hop", "pop", "mop", "fun", "bun", "hen", "ten", "net", "wet", "jet",
    "sit", "hit", "bit", "pot", "hot", "dot", "mud", "hug", "jam", "van"
  ],
  medium: [
    "ship", "fish", "frog", "crab", "tree", "star", "flag", "sock", "lamp", "ring",
    "chin", "chop", "shut", "shed", "thin", "moth", "bath", "duck", "rock", "kick",
    "sing", "king", "long", "hand", "tent", "milk", "jump", "nest", "fast", "soft",
    "drum", "grin", "spot", "stop", "swim", "clap", "plan", "slip", "snap", "trip"
  ],
  hard: [
    "brush", "clock", "train", "plant", "shirt", "bread", "dress", "glass", "stamp",
    "crunch", "splash", "string", "spring", "branch", "shrimp", "thrill", "stretch",
    "blink", "drink", "thank", "munch", "lunch", "bench", "crisp", "twist", "blend",
    "frost", "grump", "slept", "swift"
  ]
};

export const SIGHT_WORDS = {
  level1: [
    "the", "and", "is", "to", "of", "a", "in", "you", "it", "he",
    "was", "for", "on", "are", "as", "with", "his", "they", "at", "be",
    "I", "me", "my", "we", "she", "see", "go", "no", "so", "up"
  ],
  level2: [
    "this", "have", "from", "or", "one", "had", "by", "but", "not", "what",
    "all", "were", "when", "your", "can", "said", "there", "use", "like", "him",
    "into", "time", "has", "look", "two", "more", "her", "make", "than", "come"
  ],
  level3: [
    "each", "which", "do", "how", "their", "if", "will", "other", "about", "out",
    "many", "then", "them", "these", "some", "would", "could", "should", "people",
    "down", "day", "did", "get", "made", "may", "part", "over", "new", "sound", "take"
  ]
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
    "They went to the park.",
    "The frog sat on a log.",
    "We like to swim fast.",
    "He put the cup on the box.",
    "The duck is in the pond.",
    "Mum and I bake a cake.",
    "The king has a gold ring.",
    "A crab hid under a rock."
  ],
  level3: [
    "The children played happily outside.",
    "Which book would you like to read?",
    "The brave knight rode to the castle.",
    "A robot landed on the red planet.",
    "The dragon slept on a pile of gold.",
    "We watched the rocket blast into space.",
    "The owl hunts when the moon is bright.",
    "Seeds need water and sun to grow."
  ]
};

export const WORD_FAMILIES = {
  "-AT": ["cat", "hat", "bat", "mat", "rat", "sat"],
  "-AN": ["can", "pan", "man", "fan", "ran", "tan"],
  "-IG": ["big", "pig", "dig", "wig", "fig", "jig"],
  "-OP": ["hop", "top", "pop", "mop", "cop"],
  "-UN": ["sun", "run", "fun", "bun"],
  "-EN": ["pen", "hen", "ten", "men", "den"],
  "-ET": ["net", "wet", "jet", "pet", "get", "vet"],
  "-OT": ["pot", "hot", "dot", "got", "not", "lot"],
  "-UG": ["bug", "hug", "mug", "rug", "dug", "jug"],
  "-IN": ["pin", "win", "fin", "bin", "tin", "chin"]
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
    id: "blend-and-build",
    title: "Blend & Build",
    skill: "Word families",
    category: "Phonics",
    ...GAME_ACCENTS.violet,
    icon: "/images/learn-games/icon-blend-build.png",
    description: "Add beginnings to rimes to make families of words."
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
