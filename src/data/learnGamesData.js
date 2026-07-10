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
  ["top", "hop"],
  ["net", "jet"],
  ["man", "fan"],
  ["sit", "hit"],
  ["hug", "bug"],
  ["wet", "pet"],
  ["dot", "got"],
  ["win", "fin"],
  ["jug", "rug"]
];

export const SENTENCES = {
  level1: [
    "The cat sat on the mat.",
    "I see a big dog.",
    "We can run and play.",
    "The dog is wet.",
    "I can see the cat.",
    "We sit on the bus.",
    "The pig is big.",
    "Mum has a red cup.",
    "The sun is up.",
    "I run to the top."
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

export const VOWEL_TEAM_WORDS = {
  ai: ["rain", "train", "paint", "snail", "chain"],
  ee: ["see", "tree", "green", "sheep", "sleep"],
  oa: ["boat", "coat", "goat", "road", "toast"],
  igh: ["light", "night", "right", "high", "sight"]
};

export const SYLLABLE_WORDS = {
  two: [
    ["rab", "bit"],
    ["sun", "set"],
    ["pen", "cil"],
    ["mag", "net"],
    ["ro", "bot"],
    ["pic", "nic"],
    ["lem", "on"],
    ["bas", "ket"],
    ["vel", "vet"],
    ["car", "pet"]
  ],
  three: [
    ["but", "ter", "fly"],
    ["di", "no", "saur"],
    ["um", "brel", "la"],
    ["he", "li", "cop"],
    ["to", "ma", "to"],
    ["kan", "ga", "roo"],
    ["oc", "to", "pus"],
    ["vol", "ca", "no"]
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
    { kind: "word", prompt: "Choose the best word.", display: "I ___ a red bus.", say: "I see a red bus.", answer: "see", options: ["see", "sit", "sun"] },
    { kind: "capital", prompt: "Which word starts the sentence?", display: "___ dog can dig.", say: "My dog can dig.", answer: "My", options: ["My", "my", "mY"] },
    { kind: "end", prompt: "Choose the ending mark.", display: "The pig is in the mud___", say: "The pig is in the mud.", answer: ".", options: [".", "?", "!"] },
    { kind: "word", prompt: "Choose the best word.", display: "The fox sat in the ___.", say: "The fox sat in the box.", answer: "box", options: ["box", "bus", "bat"] },
    { kind: "end", prompt: "Choose the ending mark.", display: "Is the bug on the rug___", say: "Is the bug on the rug?", answer: "?", options: [".", "?", "!"] }
  ],
  medium: [
    { kind: "capital", prompt: "Names need a capital. Choose the right one.", display: "My friend ___ has a kite.", say: "My friend Ben has a kite.", answer: "Ben", options: ["Ben", "ben", "bEn"] },
    { kind: "end", prompt: "Choose the ending mark.", display: "Where is my hat___", say: "Where is my hat?", answer: "?", options: [".", "?", "!"] },
    { kind: "word", prompt: "Choose the best word.", display: "The frog can ___ high.", say: "The frog can jump high.", answer: "jump", options: ["jump", "jam", "jug"] },
    { kind: "capital", prompt: "Which word starts the sentence?", display: "___ went to the park.", say: "They went to the park.", answer: "They", options: ["They", "they", "tHey"] },
    { kind: "end", prompt: "Choose the ending mark.", display: "The stars shine at night___", say: "The stars shine at night.", answer: ".", options: [".", "?", "!"] },
    { kind: "word", prompt: "Choose the best word.", display: "She drinks a glass of ___.", say: "She drinks a glass of milk.", answer: "milk", options: ["milk", "mat", "man"] },
    { kind: "word", prompt: "Choose the best word.", display: "I put on my ___ when it rains.", say: "I put on my coat when it rains.", answer: "coat", options: ["coat", "cot", "cat"] },
    { kind: "end", prompt: "Choose the ending mark.", display: "Look out for the wave___", say: "Look out for the wave!", answer: "!", options: [".", "?", "!"] },
    { kind: "word", prompt: "Choose the best word.", display: "The king wears a gold ___.", say: "The king wears a gold ring.", answer: "ring", options: ["ring", "rock", "rug"] },
    { kind: "capital", prompt: "Which word starts the sentence?", display: "___ ship sails on the sea.", say: "The ship sails on the sea.", answer: "The", options: ["The", "the", "tHE"] },
    { kind: "end", prompt: "Choose the ending mark.", display: "Can the crab swim fast___", say: "Can the crab swim fast?", answer: "?", options: [".", "?", "!"] },
    { kind: "word", prompt: "Choose the best word.", display: "I ___ my hands when I am happy.", say: "I clap my hands when I am happy.", answer: "clap", options: ["clap", "clip", "chop"] }
  ],
  hard: [
    { kind: "word", prompt: "Choose the right word.", display: "We went ___ the shop.", say: "We went to the shop.", answer: "to", options: ["to", "two", "too"] },
    { kind: "word", prompt: "Choose the right word.", display: "The knight rode ___ horse to the castle.", say: "The knight rode his horse to the castle.", answer: "his", options: ["his", "him", "he"] },
    { kind: "end", prompt: "Choose the ending mark.", display: "How many planets are in space___", say: "How many planets are in space?", answer: "?", options: [".", "?", "!"] },
    { kind: "word", prompt: "Choose the best word.", display: "The rocket flew ___ than the birds.", say: "The rocket flew higher than the birds.", answer: "higher", options: ["higher", "high", "highest"] },
    { kind: "capital", prompt: "Days need a capital. Choose the right one.", display: "On ___ we read a space book.", say: "On Monday we read a space book.", answer: "Monday", options: ["Monday", "monday", "monDay"] },
    { kind: "word", prompt: "Choose the joining word.", display: "Seeds need water ___ sun to grow.", say: "Seeds need water and sun to grow.", answer: "and", options: ["and", "an", "as"] },
    { kind: "word", prompt: "Choose the right word.", display: "___ dragon sleeps on the gold.", say: "Their dragon sleeps on the gold.", answer: "Their", options: ["Their", "There", "They're"] },
    { kind: "end", prompt: "Choose the ending mark.", display: "The owl hunts when the moon is bright___", say: "The owl hunts when the moon is bright.", answer: ".", options: [".", "?", "!"] },
    { kind: "word", prompt: "Choose the right word.", display: "The wizard kept ___ wand by the door.", say: "The wizard kept his wand by the door.", answer: "his", options: ["his", "him", "her"] },
    { kind: "word", prompt: "Choose the right word.", display: "We saw ___ stars in the night sky.", say: "We saw two stars in the night sky.", answer: "two", options: ["two", "to", "too"] },
    { kind: "capital", prompt: "Names need a capital. Choose the right one.", display: "Our robot ___ beeps when it is happy.", say: "Our robot Max beeps when it is happy.", answer: "Max", options: ["Max", "max", "mAx"] },
    { kind: "end", prompt: "Choose the ending mark.", display: "The rocket is about to blast off___", say: "The rocket is about to blast off!", answer: "!", options: [".", "?", "!"] },
    { kind: "word", prompt: "Choose the right word.", display: "The dragon flew over ___ to the mountain.", say: "The dragon flew over there to the mountain.", answer: "there", options: ["there", "their", "they're"] },
    { kind: "word", prompt: "Choose the right word.", display: "That spell was ___ tricky for the young wizard.", say: "That spell was too tricky for the young wizard.", answer: "too", options: ["too", "to", "two"] },
    { kind: "word", prompt: "Choose the right word.", display: "The astronauts ___ floating in space.", say: "The astronauts were floating in space.", answer: "were", options: ["were", "was", "where"] },
    { kind: "word", prompt: "Choose the best word.", display: "The owl flew ___ of all the birds.", say: "The owl flew highest of all the birds.", answer: "highest", options: ["highest", "high", "higher"] },
    { kind: "capital", prompt: "Places need a capital. Choose the right one.", display: "We sailed our boat down the ___ River.", say: "We sailed our boat down the Silver River.", answer: "Silver", options: ["Silver", "silver", "sIlver"] },
    { kind: "end", prompt: "Choose the ending mark.", display: "Could a robot learn to paint___", say: "Could a robot learn to paint?", answer: "?", options: [".", "?", "!"] }
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

export const MAGIC_E_FAMILIES = {
  "-ake": ["cake", "lake", "make", "bake", "rake", "snake"],
  "-ame": ["game", "name", "came", "same", "flame"],
  "-ine": ["nine", "line", "pine", "vine", "shine"],
  "-ope": ["rope", "hope", "nope", "slope"],
  "-ade": ["made", "fade", "shade", "grade", "trade"]
};

export const VOWEL_TEAM_FAMILIES = {
  "-ain": ["rain", "train", "chain", "brain", "plain"],
  "-ail": ["mail", "tail", "sail", "nail", "rail"],
  "-eep": ["deep", "keep", "sleep", "sheep", "sweep"],
  "-oat": ["boat", "coat", "goat", "float"],
  "-ight": ["light", "night", "right", "bright", "sight"]
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
    id: "rocket-run",
    title: "Rocket Run",
    skill: "Catch beginning sounds",
    category: "Phonics",
    ...GAME_ACCENTS.blue,
    icon: "/images/learn-games/icon-rocket-run.webp",
    description: "Steer your rocket to catch the words that start with the sound.",
    is3D: true,
    fullBleed: true,
    surfaces: ["arcade"]
  },
  {
    id: "letter-leap",
    title: "Letter Leap",
    skill: "Spell words by leaping",
    category: "Phonics",
    ...GAME_ACCENTS.green,
    icon: "/images/learn-games/icon-word-leap.webp",
    description: "Run and jump to grab each word's letters in order — across meadow, dino valley and moonwood.",
    fullBleed: true,
    surfaces: ["arcade"]
  },
  {
    id: "word-climb",
    title: "Word Climb",
    skill: "Read beginning sounds",
    category: "Phonics",
    ...GAME_ACCENTS.green,
    icon: "/images/learn-games/icon-word-climb.webp",
    description: "Leap up the beanstalk by tapping the word that starts with your sound.",
    fullBleed: true,
    hidden: true,
    surfaces: []
  },
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
    id: "word-rescue",
    title: "Word Rescue",
    skill: "Read words with confidence",
    category: "Fluency",
    ...GAME_ACCENTS.coral,
    icon: "/images/learn-games/icon-pop-word.png",
    description: "Read each word to build the bridge and rescue your pal."
  },
  {
    id: "sound-sort-factory",
    title: "Sound Sort Factory",
    skill: "Hear and sort beginning sounds",
    category: "Phonics",
    ...GAME_ACCENTS.blue,
    icon: "/images/learn-games/icon-blend-build.png",
    description: "Sort the factory words into the right sound bins."
  },
  {
    id: "letter-garden",
    title: "Letter Garden",
    skill: "Spell words letter by letter",
    category: "CVC",
    ...GAME_ACCENTS.violet,
    icon: "/images/learn-games/icon-cvc-builder.png",
    description: "Build words to grow a garden full of flowers."
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
  },
  {
    id: "sound-racer",
    title: "Sound Racer",
    skill: "Read beginning sounds at speed",
    category: "Phonics",
    ...GAME_ACCENTS.blue,
    icon: "/images/learn-games/icon-sound-slide.png",
    description: "Race the track — grab the words that start with your sound to boost.",
    fullBleed: true,
    surfaces: ["arcade"]
  },
  {
    id: "word-bridge",
    title: "Word Bridge",
    skill: "Build words and sentences",
    category: "Phonics",
    ...GAME_ACCENTS.green,
    icon: "/images/learn-games/icon-word-leap.webp",
    description: "Build a bridge of letters so your Pals can cross the gap.",
    fullBleed: true,
    surfaces: ["arcade"]
  },
  {
    id: "sound-beat",
    title: "Sound Beat",
    skill: "Tap and blend sounds to the beat",
    category: "Phonics",
    ...GAME_ACCENTS.violet,
    icon: "/images/learn-games/icon-sound-slide.png",
    description: "Tap each sound on the beat, then blend it into the word.",
    fullBleed: true,
    surfaces: ["arcade"]
  },
  {
    id: "rhyme-pop",
    title: "Rhyme Pop",
    skill: "Hear and pop rhyming words",
    category: "Phonics",
    ...GAME_ACCENTS.coral,
    icon: "/images/learn-games/art/rhyme-pop.webp",
    description: "Listen for the word, then pop every balloon that rhymes with it.",
    fullBleed: true,
    surfaces: ["arcade"]
  },
  {
    id: "sound-safari",
    title: "Sound Safari",
    skill: "Find the sounds in a word",
    category: "Phonics",
    ...GAME_ACCENTS.amber,
    icon: "/images/learn-games/art/sound-safari.webp",
    description: "Go on safari and net the sounds that make up each word.",
    fullBleed: true,
    surfaces: ["arcade"]
  },
  {
    id: "star-gallery",
    title: "Sentence Grove",
    skill: "Fix words and sentences",
    category: "Grammar",
    ...GAME_ACCENTS.violet,
    icon: "/images/learn-games/art/star-gallery.webp",
    description: "Roam the grove, read the picture cue, and cut the tree that fixes each sentence.",
    fullBleed: true,
    surfaces: ["arcade"]
  }
];
