import { segmentWord } from "./graphemeSegments.js";
import { starRubric } from "./starRubric.js";

const WORLDS = { easy: "meadow", medium: "dino", hard: "moonwood" };
const WORDS = {
  easy: [
    "cat", "sun", "mop", "big", "hat", "log", "pen", "cup", "dog", "jam",
    "red", "wet", "run", "bug", "pig", "web", "hen", "fox", "zip", "van",
    "fish", "ship", "shop", "duck", "chip", "thin", "bath", "wing", "ring", "king"
  ],
  medium: [
    "frog", "plant", "crisp", "drum", "stone", "flame", "brush", "green", "splash", "track",
    "clock", "snack", "train", "plain", "brain", "sweep", "float", "groan", "chair", "thorn",
    "crash", "string", "spring", "bright", "twist", "storm", "shark", "three", "glide", "prize"
  ],
  hard: [
    "moonlight", "starlight", "spellbook", "broomstick", "shadow", "forest", "whisper", "lantern", "silver", "crystal",
    "dragonfly", "starshine", "nightfall", "sparkle", "thunder", "glimmer", "firelight", "moonbeam", "storybook", "witchcraft",
    "brightest", "floating", "branching", "shimmer", "evergreen", "mushroom", "twilight", "whistling", "moonstone", "firefly"
  ]
};
const DECOYS = ["a", "e", "i", "o", "u", "sh", "ch", "th", "ai", "ee", "oa", "oo", "ar", "or"];

function rotate(values, amount) {
  if (!values.length) return [];
  const offset = ((amount % values.length) + values.length) % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
}

function safariWord(word, seed) {
  const graphemes = segmentWord(word);
  const decoys = rotate(DECOYS, seed).filter(label => !graphemes.includes(label)).slice(0, 5);
  return { word, graphemes, decoys };
}

export function soundSafariLevel(difficulty = "easy", levelIndex = 0) {
  const safeDifficulty = WORLDS[difficulty] ? difficulty : "easy";
  const level = Math.max(0, Math.min(9, Number(levelIndex) || 0));
  const source = WORDS[safeDifficulty];
  const start = level * 3;
  return {
    difficulty: safeDifficulty,
    level,
    world: WORLDS[safeDifficulty],
    minPlaySeconds: 90,
    words: source.slice(start, start + 3).map((word, index) => safariWord(word, level + index))
  };
}

export function soundSafariLadder(difficulty = "easy") {
  return Array.from({ length: 10 }, (_, index) => soundSafariLevel(difficulty, index));
}

export function soundSafariStars({ correct, total, mistakes } = {}) {
  return starRubric({ correct, total, mistakes, deaths: 0 });
}
