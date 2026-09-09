import { starRubric } from "./starRubric.js";

const WORLDS = { easy: "meadow", medium: "dino", hard: "moonwood" };

const LEVELS = {
  easy: [
    {
      mode: "wordParts",
      prompt: "Build the compound word",
      cue: "Target word: rainbow",
      target: "rainbow",
      correctWords: ["rain", "bow"],
      distractors: ["sun", "boat", "road", "star", "cake", "moon", "fish", "tree", "rock", "bell"]
    },
    {
      mode: "wordParts",
      prompt: "Build the compound word",
      cue: "Target word: cupcake",
      target: "cupcake",
      correctWords: ["cup", "cake"],
      distractors: ["cap", "cook", "cat", "bike", "moon", "fish", "sand", "bell", "rain", "hat"]
    },
    {
      mode: "wordParts",
      prompt: "Build the compound word",
      cue: "Target word: football",
      target: "football",
      correctWords: ["foot", "ball"],
      distractors: ["food", "fall", "fish", "bat", "sun", "rock", "cup", "star", "cake", "tree"]
    },
    {
      mode: "wordParts",
      prompt: "Build the compound word",
      cue: "Target word: toothbrush",
      target: "toothbrush",
      correctWords: ["tooth", "brush"],
      distractors: ["tree", "book", "ship", "flash", "moon", "cake", "sock", "bell", "rain", "cup"]
    },
    {
      mode: "meaning",
      prompt: "Catch words that mean happy",
      cue: "Meaning: happy",
      target: "happy",
      correctWords: ["glad", "joyful", "cheerful"],
      distractors: ["sad", "angry", "cold", "quick", "tiny", "dark", "loud", "wet", "rough", "empty"]
    },
    {
      mode: "meaning",
      prompt: "Catch opposites of hot",
      cue: "Opposite: hot",
      target: "hot",
      correctWords: ["cold", "cool", "freezing"],
      distractors: ["warm", "boiling", "sunny", "bright", "fast", "soft", "happy", "tall", "round", "deep"]
    },
    {
      mode: "morphology",
      prompt: "Build the word with a suffix",
      cue: "Target word: helpful",
      target: "helpful",
      correctWords: ["help", "-ful"],
      distractors: ["hope", "-ing", "-less", "play", "kind", "box", "jump", "-er", "sad", "read"]
    },
    {
      mode: "morphology",
      prompt: "Build the word with a suffix",
      cue: "Target word: playing",
      target: "playing",
      correctWords: ["play", "-ing"],
      distractors: ["plan", "-ful", "-less", "read", "hop", "-ed", "cup", "bright", "help", "slow"]
    },
    {
      mode: "meaning",
      prompt: "Catch words that mean small",
      cue: "Meaning: small",
      target: "small",
      correctWords: ["tiny", "little", "mini"],
      distractors: ["big", "wide", "tall", "huge", "fast", "hot", "loud", "round", "heavy", "bright"]
    },
    {
      mode: "morphology",
      prompt: "Build the word with a suffix",
      cue: "Target word: teacher",
      target: "teacher",
      correctWords: ["teach", "-er"],
      distractors: ["team", "read", "-ing", "-ful", "chair", "play", "fast", "kind", "moon", "-less"]
    }
  ],
  medium: [
    {
      mode: "wordParts",
      prompt: "Build the two-part word",
      cue: "Target word: rabbit",
      target: "rabbit",
      correctWords: ["rab", "bit"],
      distractors: ["rib", "bat", "bitten", "sun", "fish", "rock", "table", "cake", "moon", "rain"]
    },
    {
      mode: "wordParts",
      prompt: "Build the two-part word",
      cue: "Target word: picnic",
      target: "picnic",
      correctWords: ["pic", "nic"],
      distractors: ["pick", "nick", "pack", "net", "fish", "table", "river", "cake", "moon", "grass"]
    },
    {
      mode: "wordParts",
      prompt: "Build the two-part word",
      cue: "Target word: sunset",
      target: "sunset",
      correctWords: ["sun", "set"],
      distractors: ["sock", "kit", "red", "fish", "moon", "table", "rain", "cup", "plant", "star"]
    },
    {
      mode: "meaning",
      prompt: "Catch words that mean quick",
      cue: "Meaning: quick",
      target: "quick",
      correctWords: ["fast", "rapid", "speedy"],
      distractors: ["slow", "sleepy", "tiny", "cold", "rough", "quiet", "heavy", "soft", "empty", "round"]
    },
    {
      mode: "meaning",
      prompt: "Catch opposites of noisy",
      cue: "Opposite: noisy",
      target: "noisy",
      correctWords: ["quiet", "silent", "calm"],
      distractors: ["loud", "busy", "shout", "bright", "quick", "hot", "rough", "giant", "wet", "sharp"]
    },
    {
      mode: "morphology",
      prompt: "Build the word with a prefix",
      cue: "Target word: unpack",
      target: "unpack",
      correctWords: ["un-", "pack"],
      distractors: ["re-", "box", "pick", "stack", "-ing", "-ful", "happy", "care", "lock", "-er"]
    },
    {
      mode: "morphology",
      prompt: "Build the word with a suffix",
      cue: "Target word: careless",
      target: "careless",
      correctWords: ["care", "-less"],
      distractors: ["car", "-ful", "kind", "-er", "read", "help", "play", "stone", "soft", "-ing"]
    },
    {
      mode: "wordParts",
      prompt: "Build the two-part word",
      cue: "Target word: basket",
      target: "basket",
      correctWords: ["bas", "ket"],
      distractors: ["map", "nut", "mat", "get", "fish", "sun", "cup", "rock", "plant", "rain"]
    },
    {
      mode: "meaning",
      prompt: "Catch words that mean brave",
      cue: "Meaning: brave",
      target: "brave",
      correctWords: ["bold", "fearless", "courageous"],
      distractors: ["scared", "timid", "small", "cold", "rough", "sleepy", "quiet", "empty", "round", "slow"]
    },
    {
      mode: "morphology",
      prompt: "Build the word with a suffix",
      cue: "Target word: reader",
      target: "reader",
      correctWords: ["read", "-er"],
      distractors: ["red", "-ing", "teach", "-ful", "play", "care", "moon", "fast", "kind", "-less"]
    }
  ],
  hard: [
    {
      mode: "wordParts",
      prompt: "Build the three-part word",
      cue: "Target word: dinosaur",
      target: "dinosaur",
      correctWords: ["di", "no", "saur"],
      distractors: ["do", "sore", "sun", "fish", "rock", "plant", "moon", "rain", "bird", "stone"]
    },
    {
      mode: "wordParts",
      prompt: "Build the three-part word",
      cue: "Target word: kangaroo",
      target: "kangaroo",
      correctWords: ["kan", "ga", "roo"],
      distractors: ["van", "can", "go", "stone", "river", "moon", "cloud", "spark", "bird", "tree"]
    },
    {
      mode: "wordParts",
      prompt: "Build the three-part word",
      cue: "Target word: butterfly",
      target: "butterfly",
      correctWords: ["but", "ter", "fly"],
      distractors: ["bat", "tall", "flat", "fish", "moon", "river", "stone", "cloud", "wing", "bright"]
    },
    {
      mode: "meaning",
      prompt: "Catch words that mean ancient",
      cue: "Meaning: ancient",
      target: "ancient",
      correctWords: ["old", "aged", "historic"],
      distractors: ["new", "young", "fresh", "quick", "soft", "bright", "tiny", "loud", "empty", "sharp"]
    },
    {
      mode: "meaning",
      prompt: "Catch opposites of fragile",
      cue: "Opposite: fragile",
      target: "fragile",
      correctWords: ["strong", "tough", "sturdy"],
      distractors: ["weak", "delicate", "brittle", "quiet", "round", "sleepy", "cold", "tiny", "smooth", "bright"]
    },
    {
      mode: "morphology",
      prompt: "Build the word with a prefix",
      cue: "Target word: unhappy",
      target: "unhappy",
      correctWords: ["un-", "happy"],
      distractors: ["re-", "kind", "sad", "help", "-ful", "-less", "care", "read", "pack", "-ing"]
    },
    {
      mode: "morphology",
      prompt: "Build the word with a prefix",
      cue: "Target word: reread",
      target: "reread",
      correctWords: ["re-", "read"],
      distractors: ["un-", "red", "write", "-er", "teach", "play", "-ful", "care", "pack", "road"]
    },
    {
      mode: "morphology",
      prompt: "Build the word with a suffix",
      cue: "Target word: wonderful",
      target: "wonderful",
      correctWords: ["wonder", "-ful"],
      distractors: ["wander", "-less", "magic", "-er", "read", "care", "kind", "stone", "moon", "-ing"]
    },
    {
      mode: "morphology",
      prompt: "Build the word with a prefix",
      cue: "Target word: disloyal",
      target: "disloyal",
      correctWords: ["dis-", "loyal"],
      distractors: ["un-", "royal", "local", "-ful", "kind", "read", "happy", "care", "-ing", "stone"]
    },
    {
      mode: "morphology",
      prompt: "Build the word with a suffix",
      cue: "Target word: fearless",
      target: "fearless",
      correctWords: ["fear", "-less"],
      distractors: ["fair", "-ful", "bold", "-er", "read", "care", "happy", "pack", "moon", "-ing"]
    }
  ]
};

function normalizeDifficulty(difficulty) {
  return WORLDS[difficulty] ? difficulty : "easy";
}

function normalizeToken(token) {
  return String(token || "").trim().toLowerCase();
}

function uniqueTokens(tokens) {
  return [...new Set(tokens.map(normalizeToken).filter(Boolean))];
}

export function reelReadMatches(word, level) {
  const text = normalizeToken(word);
  return uniqueTokens(level?.correctWords || []).includes(text);
}

export function reelReadExpectedWord(level, caughtWords = []) {
  if (!level?.orderMatters) return null;
  const index = Array.isArray(caughtWords) ? caughtWords.length : Number(caughtWords?.size) || 0;
  return level.correctWords?.[index] || null;
}

export function reelReadIsCorrectCatch(word, level, caughtWords = []) {
  if (level?.orderMatters) return normalizeToken(word) === normalizeToken(reelReadExpectedWord(level, caughtWords));
  return reelReadMatches(word, level);
}

export function reelReadCanAcceptWord(word, level, caughtWords = []) {
  const token = normalizeToken(word);
  if (!token || (Array.isArray(caughtWords) && caughtWords.map(normalizeToken).includes(token))) return false;
  return reelReadIsCorrectCatch(token, level, caughtWords);
}

export function reelReadAssembledWord(level, caughtWords = []) {
  if (!level?.orderMatters) return level?.target || "";
  const parts = Array.isArray(caughtWords) ? caughtWords : [];
  return parts.join("").replaceAll("-", "") || "";
}

export function reelReadResponseEvidence({
  difficulty = "easy",
  levelIndex = 0,
  target = "",
  response = "",
  correct = false,
  attempts = 1,
  fishId = "",
  audioDelivery = "pending",
  cueHistory = [],
  supportUsed = [],
  soundEnabled = false
} = {}) {
  const safeDifficulty = normalizeDifficulty(difficulty);
  const audioSupport = audioDelivery !== "completed" ? [`audio_${audioDelivery}`] : [];
  const supports = [...new Set([...supportUsed, ...audioSupport].map(String).filter(Boolean))];
  return Object.freeze({
    game: "reel-read",
    levelId: `reel-read-${safeDifficulty}-${Math.max(0, Number(levelIndex) || 0)}`,
    target: String(target || ""),
    response: String(response || ""),
    correct: Boolean(correct),
    attempts: Math.max(1, Number(attempts) || 1),
    fishId: String(fishId || ""),
    practiceOnly: true,
    independent: false,
    supportUsed: Object.freeze(supports),
    audioDelivery: String(audioDelivery || "pending"),
    cueHistory: Object.freeze([...new Set(cueHistory.map(String).filter(Boolean))]),
    soundEnabled: Boolean(soundEnabled)
  });
}

export function reelReadLevel(difficulty = "easy", levelIndex = 0) {
  const safeDifficulty = normalizeDifficulty(difficulty);
  const level = Math.max(0, Math.min(9, Number(levelIndex) || 0));
  const source = LEVELS[safeDifficulty][level];
  const correctWords = uniqueTokens(source.correctWords);
  const distractors = uniqueTokens(source.distractors).filter(word => !correctWords.includes(word));
  const orderMatters = source.mode === "wordParts" || source.mode === "morphology";
  return {
    ...source,
    difficulty: safeDifficulty,
    level,
    world: WORLDS[safeDifficulty],
    orderMatters,
    correctWords,
    distractors,
    visibleFish: safeDifficulty === "hard" ? 6 : 5,
    correctVisible: source.mode === "meaning" ? 3 : 2,
    fishSpeed: 58 + level * 5 + (safeDifficulty === "hard" ? 24 : safeDifficulty === "medium" ? 12 : 0),
    hookSpeed: 430 + level * 10,
    minPlaySeconds: 80
  };
}

export function reelReadLadder(difficulty = "easy") {
  return Array.from({ length: 10 }, (_, index) => reelReadLevel(difficulty, index));
}

export function reelReadStars({ correct, total, mistakes } = {}) {
  return starRubric({ correct, total, mistakes, deaths: 0 });
}
