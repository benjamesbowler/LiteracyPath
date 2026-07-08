import { starRubric } from "./starRubric.js";

const WORLDS = { easy: "meadow", medium: "dino", hard: "moonwood" };

const RHYME_GROUPS = [
  {
    targetWord: "top",
    rime: "-op",
    rhymingWords: ["hop", "mop", "pop", "shop", "stop", "drop"],
    distractors: ["cat", "sun", "bed", "fish", "cake", "moon", "bell", "ship", "green", "star", "light", "chair"]
  },
  {
    targetWord: "cat",
    rime: "-at",
    rhymingWords: ["bat", "hat", "mat", "rat", "sat", "flat"],
    distractors: ["hop", "run", "dog", "bell", "cake", "fish", "moon", "ship", "coat", "green", "snow", "chair"]
  },
  {
    targetWord: "sun",
    rime: "-un",
    rhymingWords: ["bun", "fun", "run", "gun", "spun", "stun"],
    distractors: ["cat", "top", "wig", "bell", "rock", "cake", "moon", "fish", "tree", "chair", "light", "snow"]
  },
  {
    targetWord: "big",
    rime: "-ig",
    rhymingWords: ["dig", "fig", "pig", "wig", "twig", "jig"],
    distractors: ["cat", "hop", "run", "bell", "cake", "ship", "moon", "chair", "snow", "light", "green", "rock"]
  },
  {
    targetWord: "bell",
    rime: "-ell",
    rhymingWords: ["fell", "sell", "tell", "well", "shell", "smell"],
    distractors: ["cat", "top", "sun", "pig", "cake", "moon", "fish", "chair", "light", "snow", "green", "rock"]
  },
  {
    targetWord: "rock",
    rime: "-ock",
    rhymingWords: ["dock", "lock", "sock", "clock", "block", "flock"],
    distractors: ["cat", "top", "sun", "big", "bell", "cake", "moon", "ship", "light", "chair", "green", "snow"]
  },
  {
    targetWord: "cake",
    rime: "-ake",
    rhymingWords: ["bake", "lake", "make", "rake", "shake", "snake"],
    distractors: ["cat", "top", "sun", "big", "bell", "rock", "moon", "fish", "chair", "green", "light", "snow"]
  },
  {
    targetWord: "night",
    rime: "-ight",
    rhymingWords: ["bright", "fight", "light", "might", "sight", "flight"],
    distractors: ["cat", "top", "sun", "big", "bell", "rock", "cake", "moon", "chair", "green", "snow", "fish"]
  },
  {
    targetWord: "snow",
    rime: "-ow",
    rhymingWords: ["blow", "flow", "glow", "grow", "show", "throw"],
    distractors: ["cat", "top", "sun", "big", "bell", "rock", "cake", "night", "chair", "green", "fish", "ship"]
  },
  {
    targetWord: "chair",
    rime: "-air",
    rhymingWords: ["fair", "hair", "pair", "stair", "share", "square"],
    distractors: ["cat", "top", "sun", "big", "bell", "rock", "cake", "night", "snow", "green", "fish", "ship"]
  }
];

function rotate(values, amount) {
  if (!values.length) return [];
  const offset = ((amount % values.length) + values.length) % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
}

export function rhymePopLevel(difficulty = "easy", levelIndex = 0) {
  const safeDifficulty = WORLDS[difficulty] ? difficulty : "easy";
  const level = Math.max(0, Math.min(9, Number(levelIndex) || 0));
  const offset = safeDifficulty === "hard" ? 2 : safeDifficulty === "medium" ? 0 : 0;
  const group = RHYME_GROUPS[(level + offset) % RHYME_GROUPS.length];

  return {
    difficulty: safeDifficulty,
    level,
    world: WORLDS[safeDifficulty],
    targetWord: group.targetWord,
    rime: group.rime,
    rhymingWords: rotate(group.rhymingWords, level),
    distractors: rotate(group.distractors, level * 3),
    visibleBalloons: safeDifficulty === "easy" ? 5 : safeDifficulty === "medium" ? 6 : 7,
    correctVisible: safeDifficulty === "easy" ? 2 : 2,
    dropRate: 0.16 + level * 0.03 + (safeDifficulty === "hard" ? 0.1 : safeDifficulty === "medium" ? 0.05 : 0),
    minPlaySeconds: 180
  };
}

export function rhymePopLadder(difficulty = "easy") {
  return Array.from({ length: 10 }, (_, index) => rhymePopLevel(difficulty, index));
}

export function rhymePopStars({ correct, total, mistakes } = {}) {
  return starRubric({ correct, total, mistakes, deaths: 0 });
}
