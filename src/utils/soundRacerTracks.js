import {
  rocketRunLadder,
  wordsStartingWith
} from "./rocketRunRounds.js";
import { onsetGrapheme, sharesSound } from "../components/elQuest/elQuestEngine.js";
import { LETTER_EXAMPLES } from "../data/elSkillsBlockCycles.js";

// Reconstruct the same ALL_WORDS pool used by rocketRunRounds.js
// (DOM-free, no new curriculum logic — just the same data plumbing).
const CLEAN = word => /^[a-z]{2,6}$/.test(word);
const ALL_WORDS = [...new Set(Object.values(LETTER_EXAMPLES).flat())].filter(CLEAN);

const LEN_RANGE = {
  easy: [2, 4], low: [2, 4],
  medium: [3, 5], mid: [3, 5],
  hard: [4, 6], high: [4, 6]
};

// Seeded random: mulberry32 (deterministic, fast, good distribution for games).
function mulberry32(a) {
  return function () {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return h >>> 0;
}

function shuffleSeeded(items, rng) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeRng(seed, target, difficulty) {
  const seedNum = hashString(String(seed) + String(target) + String(difficulty));
  return mulberry32(seedNum);
}

// Deterministic round builder using the SAME fairness criteria as
// buildRocketRunRound but with a seeded shuffle so tracks are reproducible.
function buildDeterministicRound(target, { count, difficulty, rng }) {
  const g = String(target || "").toLowerCase();
  const range = LEN_RANGE[String(difficulty || "").toLowerCase()];
  const inRange = w => !range || (w.length >= range[0] && w.length <= range[1]);

  // Correct pool: words that truly start with the target grapheme
  const correctPool = wordsStartingWith(g);
  let cp = correctPool.filter(inRange);
  if (cp.length < 3) cp = correctPool;
  const correct = shuffleSeeded([...new Set(cp)], rng).slice(0, Math.max(0, count));

  const correctSet = new Set(correct);

  // Distractor pool: sound-distinct from target and not already a correct word
  const distractorPool = ALL_WORDS.filter(
    w => !sharesSound(onsetGrapheme(w), g) && !correctSet.has(w)
  );
  let dp = distractorPool.filter(inRange);
  if (dp.length < count) dp = distractorPool;
  const distractorCount = count + Math.ceil(count / 2);
  const distractors = shuffleSeeded([...new Set(dp)], rng).slice(0, Math.max(0, distractorCount));

  return { correct, distractors, needed: correct.length };
}

export function soundRacerLadder(difficulty) {
  return rocketRunLadder(difficulty);
}

export function worldObstacles(world) {
  const w = String(world || "").toLowerCase();
  if (w === "meadow") return "haybale";
  if (w === "dino") return "rock";
  if (w === "moonwood") return "cloudbank";
  return "rock";
}

export function buildTrack(target, { difficulty, seed } = {}) {
  const g = String(target || "").toLowerCase();
  const d = String(difficulty || "").toLowerCase();
  const rng = makeRng(seed, g, d);

  const totalLength = d === "hard" || d === "high"
    ? 100
    : d === "medium" || d === "mid"
      ? 80
      : 60;

  // Build a round with enough words for the track length
  const count = Math.max(3, Math.min(10, Math.floor(totalLength / 8)));
  const round = buildDeterministicRound(g, { count, difficulty: d, rng });
  const needed = round.needed;

  // Obstacles: ~18% of gates (fixed within the 15–20% spec for determinism)
  const obstacleCount = Math.max(1, Math.floor(totalLength * 0.18));
  const wordGateCount = totalLength - obstacleCount;

  // Build correct gates
  const correctGates = round.correct.slice(0, needed).map(word => ({
    kind: "word",
    word,
    correct: true
  }));

  // Build distractor gates (cycle through the round's distractors if needed)
  const distractorGates = [];
  for (let i = 0; i < wordGateCount - needed; i += 1) {
    const word = round.distractors[i % round.distractors.length];
    distractorGates.push({ kind: "word", word, correct: false });
  }

  // Build obstacle gates
  const obstacleGates = Array.from({ length: obstacleCount }, () => ({
    kind: "obstacle"
  }));

  // Place correct gates at evenly spread positions with a small jitter
  const allGates = new Array(totalLength);
  const segment = totalLength / needed;
  const maxJitter = Math.max(0, Math.floor(segment) - 2);

  for (let i = 0; i < needed; i += 1) {
    const base = Math.floor(i * segment);
    const jitter = maxJitter > 0 ? Math.floor(rng() * maxJitter) : 0;
    const pos = base + jitter;
    allGates[pos] = correctGates[i];
  }

  // Fill remaining slots with a shuffled mix of distractors and obstacles
  const remaining = shuffleSeeded([...distractorGates, ...obstacleGates], rng);
  let remIdx = 0;
  for (let i = 0; i < totalLength; i += 1) {
    if (allGates[i] === undefined) {
      allGates[i] = remaining[remIdx];
      remIdx += 1;
    }
  }

  // Assign each gate to a lane (0, 1, 2)
  const gates = allGates.map((gate, z) => ({
    z,
    lane: Math.floor(rng() * 3),
    ...gate
  }));

  return { target: g, gates, needed, totalLength };
}
