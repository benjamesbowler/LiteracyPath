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

/* Sentence Fix-It: authored rounds. Each shows a sentence with one missing
   piece; the child picks the fix (capital letter, end mark, or best word). */
export const SENTENCE_FIX = {
  easy: [
    { kind: "capital", prompt: "Which word starts the sentence?", display: "___ cat sat on the mat.", say: "The cat sat on the mat.", answer: "The", options: ["The", "the", "tHe"] },
    { kind: "end", prompt: "Choose the ending mark.", display: "I see a big dog___", say: "I see a big dog.", answer: ".", options: [".", "?", "!"] },
    { kind: "capital", prompt: "Which word starts the sentence?", display: "___ can hop and run.", say: "We can hop and run.", answer: "We", options: ["We", "we", "wE"] },
    { kind: "end", prompt: "Choose the ending mark.", display: "Can you see the sun___", say: "Can you see the sun?", answer: "?", options: [".", "?", "!"] },
    { kind: "word", prompt: "Choose the best word.", display: "The sun is ___.", say: "The sun is hot.", answer: "hot", options: ["hot", "hat", "hit"] },
    { kind: "capital", prompt: "Which word starts the sentence?", display: "___ hen is in the pen.", say: "The hen is in the pen.", answer: "The", options: ["The", "the", "THe"] },
    { kind: "end", prompt: "Choose the ending mark.", display: "Watch out___", say: "Watch out!", answer: "!", options: [".", "?", "!"] },
    { kind: "word", prompt: "Choose the best word.", display: "I ___ a red bus.", say: "I see a red bus.", answer: "see", options: ["see", "sit", "sun"] }
  ],
  medium: [
    { kind: "capital", prompt: "Names need a capital. Choose the right one.", display: "My friend ___ has a kite.", say: "My friend Ben has a kite.", answer: "Ben", options: ["Ben", "ben", "bEn"] },
    { kind: "end", prompt: "Choose the ending mark.", display: "Where is my hat___", say: "Where is my hat?", answer: "?", options: [".", "?", "!"] },
    { kind: "word", prompt: "Choose the best word.", display: "The frog can ___ high.", say: "The frog can jump high.", answer: "jump", options: ["jump", "jam", "jug"] },
    { kind: "capital", prompt: "Which word starts the sentence?", display: "___ went to the park.", say: "They went to the park.", answer: "They", options: ["They", "they", "tHey"] },
    { kind: "end", prompt: "Choose the ending mark.", display: "The stars shine at night___", say: "The stars shine at night.", answer: ".", options: [".", "?", "!"] },
    { kind: "word", prompt: "Choose the best word.", display: "She drinks a glass of ___.", say: "She drinks a glass of milk.", answer: "milk", options: ["milk", "mat", "man"] },
    { kind: "word", prompt: "Choose the best word.", display: "I put on my ___ when it rains.", say: "I put on my coat when it rains.", answer: "coat", options: ["coat", "cot", "cat"] },
    { kind: "end", prompt: "Choose the ending mark.", display: "Look out for the wave___", say: "Look out for the wave!", answer: "!", options: [".", "?", "!"] }
  ],
  hard: [
    { kind: "word", prompt: "Choose the right word.", display: "We went ___ the shop.", say: "We went to the shop.", answer: "to", options: ["to", "two", "too"] },
    { kind: "word", prompt: "Choose the right word.", display: "The knight rode ___ horse to the castle.", say: "The knight rode his horse to the castle.", answer: "his", options: ["his", "him", "he"] },
    { kind: "end", prompt: "Choose the ending mark.", display: "How many planets are in space___", say: "How many planets are in space?", answer: "?", options: [".", "?", "!"] },
    { kind: "word", prompt: "Choose the best word.", display: "The rocket flew ___ than the birds.", say: "The rocket flew higher than the birds.", answer: "higher", options: ["higher", "high", "highest"] },
    { kind: "capital", prompt: "Days need a capital. Choose the right one.", display: "On ___ we read a space book.", say: "On Monday we read a space book.", answer: "Monday", options: ["Monday", "monday", "monDay"] },
    { kind: "word", prompt: "Choose the joining word.", display: "Seeds need water ___ sun to grow.", say: "Seeds need water and sun to grow.", answer: "and", options: ["and", "an", "as"] },
    { kind: "word", prompt: "Choose the right word.", display: "___ dragon sleeps on the gold.", say: "Their dragon sleeps on the gold.", answer: "Their", options: ["Their", "There", "They're"] },
    { kind: "end", prompt: "Choose the ending mark.", display: "The owl hunts when the moon is bright___", say: "The owl hunts when the moon is bright.", answer: ".", options: [".", "?", "!"] }
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
    title: "Sentence Fix-It",
    skill: "Capitals, punctuation, best word",
    category: "Grammar",
    ...GAME_ACCENTS.green,
    icon: "/images/learn-games/icon-reading-race.png",
    description: "Find the missing piece and fix the sentence."
  }
];
