import { segmentWord } from "./graphemeSegments.js";
import { starRubric } from "./starRubric.js";
import { hasWordAudio } from "./questAudio.js";

const WORLDS = { easy: "meadow", medium: "dino", hard: "moonwood" };
export const SOUND_SAFARI_WORDS = {
  easy: [
    "cat", "sun", "mop", "big", "hat", "log", "pen", "cup", "dog", "jam",
    "red", "wet", "run", "bug", "pig", "web", "hen", "fox", "zip", "van",
    "top", "net", "mud", "duck", "bed", "ten", "cap", "bus", "pot", "leg"
  ],
  medium: [
    "frog", "plant", "crisp", "drum", "stone", "flame", "brush", "green", "splash", "track",
    "clock", "snail", "train", "clap", "brain", "sleep", "float", "smile", "chair", "thread",
    "crash", "string", "spring", "bright", "twist", "storm", "shark", "three", "slide", "prize"
  ],
  hard: [
    "sunlight", "rainbow", "moon", "star", "meadow", "forest", "river", "rabbit", "silver", "night",
    "dark", "owl", "glow", "badger", "thunder", "glimmer", "squirrel", "acorn", "mist", "fern",
    "oak", "butterfly", "moss", "woodland", "dream", "mushroom", "glowing", "stream", "shining", "sunset"
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
  // Sound Safari is an audio-led segmentation game. Missing recordings are
  // never allowed to fall through to a silent, text-only task; the coverage
  // test also requires every curated bank to retain all 30 recorded words.
  const source = SOUND_SAFARI_WORDS[safeDifficulty].filter(hasWordAudio);
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

export function soundSafariPresentedStars({ correct, presentedUnits, mistakes } = {}) {
  return soundSafariStars({
    correct,
    total: Math.max(1, Number(presentedUnits) || 0),
    mistakes
  });
}

export function soundSafariAudioCoverage() {
  return Object.fromEntries(Object.entries(SOUND_SAFARI_WORDS).map(([difficulty, words]) => [
    difficulty,
    {
      total: words.length,
      recorded: words.filter(hasWordAudio),
      missing: words.filter(word => !hasWordAudio(word))
    }
  ]));
}

// Resolve deliberately ambiguous, overlapping touch zones fairly. An exact
// label hit always wins. For circular overlap, prefer the required critter only
// when the two candidates are close enough to make the tap genuinely
// ambiguous; an intentional tap near a wrong critter remains a wrong answer.
export function selectSafariCapture(entries = [], needed = "") {
  const eligible = entries.filter(entry => {
    if (!entry?.critter) return false;
    const radius = entry.critter.hitRadius || entry.critter.r + 38;
    return entry.inLabel || entry.distance <= radius;
  });
  if (!eligible.length) return null;

  const labelHits = eligible.filter(entry => entry.inLabel);
  if (labelHits.length) {
    return labelHits.find(entry => entry.critter.label === needed)
      || labelHits.sort((a, b) => a.distance - b.distance)[0];
  }

  const ordered = [...eligible].sort((a, b) => a.distance - b.distance);
  const nearest = ordered[0];
  const correct = ordered.find(entry => entry.critter.label === needed);
  if (!correct || correct === nearest) return nearest;

  const correctRadius = correct.critter.hitRadius || correct.critter.r + 38;
  const ambiguous = correct.distance <= correctRadius * 0.72
    && correct.distance <= nearest.distance + Math.max(18, correct.critter.r * 0.45);
  return ambiguous ? correct : nearest;
}
