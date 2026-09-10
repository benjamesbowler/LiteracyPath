import {
  CVC_WORDS,
  SENTENCES,
  SYLLABLE_WORDS,
  VOWEL_TEAM_WORDS
} from "../data/learnGamesData.js";
import { segmentWord } from "./graphemeSegments.js";
import { starRubric } from "./starRubric.js";

const WORLDS = { easy: "meadow", medium: "dino", hard: "moonwood" };
const BASE_BPM = { easy: 82, medium: 94, hard: 108 };
// Tap-acceptance window (± ms around the beat). Deliberately generous so young
// children can actually land the taps; shrinks only a little as levels rise.
const BASE_WINDOW = { easy: 460, medium: 410, hard: 360 };

function rotate(values, amount) {
  if (!values.length) return [];
  const offset = ((amount % values.length) + values.length) % values.length;
  return [...values.slice(offset), ...values.slice(0, offset)];
}

function syllableItems(parts) {
  return parts.map(beats => ({
    word: beats.join(""),
    beats,
    say: beats.join("")
  }));
}

function wordItem(word) {
  return { word, beats: segmentWord(word), say: word };
}

function sentenceItem(sentence) {
  const clean = String(sentence || "").replace(/[.!?]/g, "");
  const words = clean.split(/\s+/).filter(Boolean);
  return {
    word: clean,
    beats: words,
    say: sentence
  };
}

function levelItems(difficulty, levelIndex) {
  if (difficulty === "hard" && levelIndex >= 6) {
    return [sentenceItem(SENTENCES.level3[levelIndex - 6])];
  }

  if (difficulty === "easy") {
    return rotate(CVC_WORDS.easy, levelIndex * 3).slice(0, 3).map(wordItem);
  }

  if (difficulty === "medium") {
    const words = rotate(CVC_WORDS.medium, levelIndex * 2).slice(0, 2).map(wordItem);
    const syllables = syllableItems(SYLLABLE_WORDS.two);
    return [...words, syllables[levelIndex % syllables.length]];
  }

  const vowelTeamWords = Object.values(VOWEL_TEAM_WORDS).flat();
  const words = rotate(vowelTeamWords, levelIndex * 2).slice(0, 2).map(wordItem);
  const syllables = syllableItems(SYLLABLE_WORDS.three);
  return [...words, syllables[levelIndex % syllables.length]];
}

export function soundBeatLevel(difficulty = "easy", levelIndex = 0) {
  const safeDifficulty = WORLDS[difficulty] ? difficulty : "easy";
  const level = Math.max(0, Math.min(9, Number(levelIndex) || 0));
  return {
    difficulty: safeDifficulty,
    level,
    world: WORLDS[safeDifficulty],
    bpm: BASE_BPM[safeDifficulty] + level * 3,
    mode: safeDifficulty === "hard" && level >= 6 ? "sentence" : (safeDifficulty === "medium" || safeDifficulty === "hard" ? "mixed" : "sounds"),
    hitWindowMs: Math.max(300, BASE_WINDOW[safeDifficulty] - level * 6),
    // Minimum seconds of play before a stop/countdown: the engine groups
    // consecutive levels into one continuous round until this floor is met.
    minPlaySeconds: 60,
    items: levelItems(safeDifficulty, level)
  };
}

export function soundBeatLadder(difficulty = "easy") {
  return Array.from({ length: 10 }, (_, index) => soundBeatLevel(difficulty, index));
}

export function soundBeatStars({ correct, total, mistakes } = {}) {
  return starRubric({ correct, total, mistakes, deaths: 0 });
}

// Graduated motor-access mercy for a single word. The first miss still
// rehearses the whole blend; later misses keep the child on the current beat
// with a wider window, and four misses advance without credit so nobody can be
// trapped indefinitely on one word.
export function soundBeatMercyPolicy(attempts = 0) {
  const count = Math.max(0, Number(attempts) || 0);
  return {
    windowScale: 1 + Math.min(count, 3) * 0.3,
    replayFromStart: count < 2,
    advanceWithoutCredit: count >= 4
  };
}
