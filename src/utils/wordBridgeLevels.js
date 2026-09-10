// Pure level builder for Word Bridge (Mode A: Bridge).
// DOM-free so every level is provably winnable and every distractor is sound-distinct
// under node --test.
import { difficultyLadder } from "./curriculumLadder.js";
import { SENTENCES } from "../data/learnGamesData.js";
import { sharesSound } from "../components/elQuest/elQuestEngine.js";

export const WORD_BRIDGE_LEVELS = 10;

// ── helpers ───────────────────────────────────────────────────────────────

function seededShuffle(items, seed) {
  const copy = [...items];
  let s = Math.abs(seed || 0) + 1;
  for (let i = copy.length - 1; i > 0; i -= 1) {
    s = ((s * 1103515245) + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Only these taught, contiguous graphemes are grouped; repeated units remain
// separate physical pieces. Split digraphs are not silently fused.
export function wordBridgeUnits(word) {
  return String(word).toUpperCase().match(/SH|CH|TH|NG|CK|QU|AI|EE|OA|OO|AR|OR|[A-Z]|[^A-Z]/g) || [];
}

// Build correct letter tiles for a word target.
function buildLetterTiles(word) {
  const upper = String(word).toUpperCase();
  return wordBridgeUnits(upper).map((glyph, i) => ({
    glyph,
    correct: true,
    order: i
  }));
}

// Build correct word tiles for a sentence target.
function buildWordTiles(words) {
  return words.map((word, i) => ({
    glyph: String(word),
    correct: true,
    order: i
  }));
}

// All consonants that may be used as decoys.
const ALL_CONSONANTS = "BCDFGHJKLMNPQRSTVWXYZ".split("");

// Letter decoys: never a needed letter, never a sound-homophone of a needed letter.
function getLetterDecoys(targetWord, world, seed) {
  const needed = new Set(String(targetWord).toUpperCase().split(""));

  // Seeded shuffle keeps picks deterministic but no longer alphabetically
  // predictable (previously always the first N consonants of the pool).
  const pool = seededShuffle(ALL_CONSONANTS.filter((c) => {
    if (needed.has(c)) return false;
    for (const n of needed) {
      if (sharesSound(c, n)) return false;
    }
    return true;
  }), seed);

  const baseCount = { meadow: 2, dino: 3, moonwood: 4 }[world] || 2;
  const count = Math.min(baseCount + Math.floor(targetWord.length / 4), pool.length);
  return pool.slice(0, count);
}

// Word decoys for sentence mode: words drawn from other sentences in the same bank,
// never a word that appears in the target sentence.
function getWordDecoys(targetWords, world, seed) {
  const targetSet = new Set(targetWords.map((w) => String(w).toLowerCase()));
  const bank = (world === "moonwood"
    ? SENTENCES.level3
    : world === "dino"
      ? SENTENCES.level2
      : SENTENCES.level1) || [];

  const pool = bank
    .map((s) => String(s).replace(/[.?!]$/, "").split(/\s+/))
    .flat()
    .map((w) => w.toLowerCase())
    .filter((w) => w.length >= 2 && !targetSet.has(w))
    .filter((w, i, arr) => arr.indexOf(w) === i);

  const baseCount = { meadow: 2, dino: 3, moonwood: 3 }[world] || 2;
  return seededShuffle(pool, seed).slice(0, Math.min(baseCount, pool.length));
}

// ── public API ────────────────────────────────────────────────────────────

/**
 * Build a single Word Bridge level.
 * @param {Object} opts
 * @param {string} opts.world   - "meadow" | "dino" | "moonwood"
 * @param {number} opts.cycle   - level index (used for seeding)
 * @param {string} opts.mode    - "bridge" | "ladder" | "shelter"
 * @param {string|string[]} opts.target - word ("frog") or sentence (["The","cat","sat"])
 * @returns {Object} level descriptor
 */
export function buildLevel({ world, cycle, mode, target }) {
  const isSentence = Array.isArray(target);
  const units = isSentence ? target.map(String).flatMap(word => word.match(/[^.?!]+|[.?!]/g) || []) : wordBridgeUnits(target);
  if (isSentence && !/[.?!]$/.test(units.at(-1) || "")) units.push(".");
  const targetStr = isSentence ? target.join(" ") : String(target);
  const seed = hashString(targetStr + (cycle || 0));

  const correctTiles = isSentence
    ? buildWordTiles(units)
    : buildLetterTiles(target);

  const decoyValues = isSentence
    ? getWordDecoys(units, world, seed)
    : getLetterDecoys(target, world, seed);

  // Sentence decoys keep their natural (bank) casing so they blend in with
  // the correct word tiles; letter tiles are uppercase by design.
  const decoyTiles = decoyValues.map((glyph) => ({
    glyph: isSentence ? String(glyph) : String(glyph).toUpperCase(),
    correct: false,
    order: -1
  }));

  const allTiles = seededShuffle([...correctTiles, ...decoyTiles], seed);

  const pals = { meadow: 3, dino: 4, moonwood: 5 }[world] || 3;
  const patience = { meadow: 25, dino: 20, moonwood: 15 }[world] || 20;
  const hazard = { meadow: "river", dino: "lava", moonwood: "chasm" }[world] || "river";

  return {
    mode: mode || "bridge",
    target,
    units,
    evidenceType: "supported-reconstruction",
    slots: correctTiles.length,
    tiles: allTiles,
    decoys: decoyValues,
    pals,
    patience,
    hazard
  };
}

/**
 * Build the full 10-level ramp for a difficulty.
 * @param {string} difficulty - "easy" | "medium" | "hard"
 * @returns {Object[]} 10 levels
 */
export function wordBridgeLadder(difficulty) {
  const plans = difficultyLadder("word-bridge", difficulty);
  return plans.map((plan, i) => {
    const target = plan.mode === "sentence"
      ? (plan.targets[0] || ["the", "cat"])
      : (plan.targets[0] || "cat");
    return buildLevel({
      world: plan.world,
      cycle: i,
      mode: "bridge",
      target
    });
  });
}
