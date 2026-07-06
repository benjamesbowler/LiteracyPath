// Shared curriculum ladder for EVERY LiteracyPath game.
//
// Given a difficulty and a 0-based level index (0..9), returns a ramped,
// no-repeat plan of targets for that level. Difficulty maps to a world (and
// therefore a playable cast + backdrop the game swaps in):
//   low/easy   -> meadow   (Meadow Pals)
//   mid/medium -> dino      (Dino Pals, Sunny Hollow)
//   high/hard  -> moonwood  (Moonwood characters)
//
// Curriculum ramp: within a difficulty, level 1 is the easiest slice of that
// world's word band and level 10 the hardest. High/Moonwood levels past a
// threshold switch to sentence-building. Nothing repeats within a difficulty.
//
// DOM-free on purpose: every level is unit-testable (see curriculumLadder.test.js).
import { CVC_WORDS, SENTENCES } from "../data/learnGamesData.js";

export const LEVELS_PER_DIFFICULTY = 10;
// Moonwood: first 6 levels spell hard words, last 4 build sentences.
export const SENTENCE_START_LEVEL = 6;

const WORLD_BY_DIFFICULTY = {
  low: "meadow", easy: "meadow",
  mid: "dino", medium: "dino",
  high: "moonwood", hard: "moonwood"
};

const BANK_BY_WORLD = { meadow: "easy", dino: "medium", moonwood: "hard" };

export function worldForGameDifficulty(difficulty) {
  return WORLD_BY_DIFFICULTY[String(difficulty || "").toLowerCase()] || "meadow";
}

// How hard is a single word? Longer words and words with blends/digraphs rank
// higher, so sorting ascending gives a smooth ramp.
function wordHardness(word) {
  const w = String(word);
  let score = w.length * 10;
  if (/(sh|ch|th|ng|ck|qu|ph|wh)/.test(w)) score += 9;   // digraphs
  if (/[bcdfghjklmnpqrstvwxyz]{2}/.test(w)) score += 5;   // consonant blends
  return score;
}

function chunk(list, parts) {
  const size = Math.max(1, Math.ceil(list.length / parts));
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

// Words for a world, hardest-last, split into ramped no-repeat level buckets.
function wordLevels(world, levelCount) {
  const bank = (CVC_WORDS[BANK_BY_WORLD[world]] || []).slice();
  const ordered = bank
    .map(w => String(w).toLowerCase())
    .sort((a, b) => wordHardness(a) - wordHardness(b) || a.localeCompare(b));
  return chunk(ordered, levelCount);
}

// Sentences for Moonwood's hard levels, split so no sentence repeats.
function sentenceLevels(levelCount) {
  const bank = (SENTENCES.level3 || []).slice();
  return chunk(bank, levelCount);
}

// The plan for one level. `mode` tells the game HOW to present the targets:
//   "letters"  -> targets are words the child spells letter-by-letter
//   "sentence" -> targets are sentences (arrays of words) the child orders
export function levelPlan(gameId, difficulty, levelIndex) {
  const world = worldForGameDifficulty(difficulty);
  const level = Math.max(0, Math.min(LEVELS_PER_DIFFICULTY - 1, Number(levelIndex) || 0));

  if (world === "moonwood" && level >= SENTENCE_START_LEVEL) {
    const sLevels = sentenceLevels(LEVELS_PER_DIFFICULTY - SENTENCE_START_LEVEL);
    const bucket = sLevels[level - SENTENCE_START_LEVEL] || sLevels[sLevels.length - 1] || [];
    return {
      gameId,
      world,
      difficulty: String(difficulty || "").toLowerCase(),
      level,
      mode: "sentence",
      minPlaySeconds: 180,
      targets: bucket.map(s => String(s).replace(/[.?!]$/, "").split(/\s+/))
    };
  }

  const wordCount = world === "moonwood" ? SENTENCE_START_LEVEL : LEVELS_PER_DIFFICULTY;
  const wLevels = wordLevels(world, wordCount);
  const bucket = wLevels[level] || wLevels[wLevels.length - 1] || [];
  return {
    gameId,
    world,
    difficulty: String(difficulty || "").toLowerCase(),
    level,
    mode: "letters",
    minPlaySeconds: 180,
    targets: bucket.slice()
  };
}

// Convenience: the whole ramp for a difficulty (all 10 levels).
export function difficultyLadder(gameId, difficulty) {
  return Array.from({ length: LEVELS_PER_DIFFICULTY }, (_, i) => levelPlan(gameId, difficulty, i));
}
