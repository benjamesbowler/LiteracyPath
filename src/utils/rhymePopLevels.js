import { starRubric } from "./starRubric.js";

const WORLDS = { easy: "meadow", medium: "dino", hard: "moonwood" };

const RHYME_GROUPS = [
  {
    targetWord: "top",
    rime: "-op",
    rhymingWords: ["hop", "mop", "pop", "shop", "stop", "drop"],
    distractors: ["cat", "sun", "bed", "fish", "cake", "moon", "bell", "ship", "green", "star", "light", "chair"],
    nearRimes: ["tip", "cup", "tape", "toe"]
  },
  {
    targetWord: "cat",
    rime: "-at",
    rhymingWords: ["bat", "hat", "mat", "rat", "sat", "flat"],
    distractors: ["hop", "run", "dog", "bell", "cake", "fish", "moon", "ship", "coat", "green", "snow", "chair"],
    nearRimes: ["cut", "cup", "kit", "kite"]
  },
  {
    targetWord: "sun",
    rime: "-un",
    rhymingWords: ["bun", "fun", "run", "nun", "spun", "shun"],
    distractors: ["cat", "top", "wig", "bell", "rock", "cake", "moon", "fish", "tree", "chair", "light", "snow"],
    nearRimes: ["soon", "sand", "song", "sign"]
  },
  {
    targetWord: "big",
    rime: "-ig",
    rhymingWords: ["dig", "fig", "pig", "wig", "twig", "jig"],
    distractors: ["cat", "hop", "run", "bell", "cake", "ship", "moon", "chair", "snow", "light", "green", "rock"],
    nearRimes: ["bag", "bug", "beg", "bike"]
  },
  {
    targetWord: "bell",
    rime: "-ell",
    rhymingWords: ["fell", "sell", "tell", "well", "shell", "smell"],
    distractors: ["cat", "top", "sun", "pig", "cake", "moon", "fish", "chair", "light", "snow", "green", "rock"],
    nearRimes: ["ball", "bill", "bull", "belt"]
  },
  {
    targetWord: "rock",
    rime: "-ock",
    rhymingWords: ["dock", "lock", "sock", "clock", "block", "flock"],
    distractors: ["cat", "top", "sun", "big", "bell", "cake", "moon", "ship", "light", "chair", "green", "snow"],
    nearRimes: ["rake", "rack", "rook", "road"]
  },
  {
    targetWord: "cake",
    rime: "-ake",
    rhymingWords: ["bake", "lake", "make", "rake", "shake", "snake"],
    distractors: ["cat", "top", "sun", "big", "bell", "rock", "moon", "fish", "chair", "green", "light", "snow"],
    nearRimes: ["cook", "kick", "cube", "kite"]
  },
  {
    targetWord: "night",
    rime: "-ight",
    rhymingWords: ["bright", "knight", "light", "might", "sight", "flight"],
    distractors: ["cat", "top", "sun", "big", "bell", "rock", "cake", "moon", "chair", "green", "snow", "fish"],
    nearRimes: ["knot", "neat", "note", "knit"],
    // Harder spelling pattern (digraph + silent letters): medium/hard only.
    harder: true
  },
  {
    targetWord: "snow",
    rime: "-ow",
    rhymingWords: ["blow", "flow", "glow", "grow", "show", "throw"],
    distractors: ["cat", "top", "sun", "big", "bell", "rock", "cake", "night", "chair", "green", "fish", "ship"],
    nearRimes: ["now", "cow", "how", "saw"]
  },
  {
    targetWord: "chair",
    rime: "-air",
    rhymingWords: ["fair", "hair", "pair", "stair", "share", "square"],
    distractors: ["cat", "top", "sun", "big", "bell", "rock", "cake", "night", "snow", "green", "fish", "ship"],
    nearRimes: ["cheer", "chore", "chain", "chalk"],
    // Harder spelling pattern (r-controlled vowel team): medium/hard only.
    harder: true
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
  // Easy stays on simple CVC families; the harder -ight/-air families are
  // gated to medium/hard, and each tier walks the families in a different
  // order so difficulty is more than a speed bump.
  const pool = RHYME_GROUPS.filter(group => safeDifficulty !== "easy" || !group.harder);
  const offset = safeDifficulty === "hard" ? 7 : safeDifficulty === "medium" ? 4 : 0;
  const group = pool[(level + offset) % pool.length];
  // Hard mixes near-rime foils into the distractor pool (same onset, same
  // final consonant, or spelling look-alikes) so kids must really listen.
  const nearRimes = safeDifficulty === "hard" ? group.nearRimes || [] : [];
  const distractors = nearRimes.length
    ? [...nearRimes, ...group.distractors.slice(0, group.distractors.length - nearRimes.length)]
    : group.distractors;

  return {
    difficulty: safeDifficulty,
    level,
    world: WORLDS[safeDifficulty],
    targetWord: group.targetWord,
    rime: group.rime,
    rhymingWords: rotate(group.rhymingWords, level),
    distractors: rotate(distractors, level * 3),
    visibleBalloons: safeDifficulty === "easy" ? 5 : safeDifficulty === "medium" ? 6 : 7,
    correctVisible: safeDifficulty === "easy" ? 3 : 2,
    dropRate: 0.16 + level * 0.03 + (safeDifficulty === "hard" ? 0.1 : safeDifficulty === "medium" ? 0.05 : 0),
    // Minimum seconds before a stop/countdown; the engine groups levels into
    // one continuous round until this floor is met.
    minPlaySeconds: 60
  };
}

export function rhymePopLadder(difficulty = "easy") {
  return Array.from({ length: 10 }, (_, index) => rhymePopLevel(difficulty, index));
}

export function rhymePopStars({ correct, total, mistakes } = {}) {
  return starRubric({ correct, total, mistakes, deaths: 0 });
}
