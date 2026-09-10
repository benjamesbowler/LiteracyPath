import {
  rocketRunLadder,
  wordStartsWithTargetSound,
  wordsStartingWithTargetSound
} from "./rocketRunRounds.js";
import { onsetGrapheme, sharesSound } from "../components/elQuest/elQuestEngine.js";
import { LETTER_EXAMPLES } from "../data/elSkillsBlockCycles.js";
import { CVC_WORDS, SIGHT_WORDS } from "../data/learnGamesData.js";
import { starRubric } from "./starRubric.js";

const SOUND_RACER_EXTRA_WORDS = {
  a: ["ask", "after", "again", "along", "away", "animal", "answer", "angle", "ankle", "apron", "artist", "always"],
  e: ["elf", "elk", "ever", "enter", "empty", "echo", "edge", "even", "early", "equal", "every", "elbow", "engine", "enjoy"],
  g: ["game", "gold", "good", "green", "great", "grow", "grab", "glow", "grape", "grass"],
  i: ["ill", "inside", "index", "item", "image", "invite", "issue", "itchy", "inbox", "invent"],
  j: ["jar", "jig", "job", "jog", "jolt", "jazz", "jade", "jelly", "jacket", "jungle", "jingle"],
  k: ["key", "kid", "kick", "kite", "king", "kiss", "keep", "kitten", "kettle", "kitchen", "kiwi", "koala", "kangaroo"],
  n: ["nut", "nod", "nine", "name", "neck", "nail", "night", "nice", "never", "number"],
  o: ["odd", "odds", "off", "on", "ox", "oxen", "onto", "offer", "often", "office", "option", "orange", "omelet", "oblong"],
  r: ["rain", "rip", "rose", "rope", "read", "river", "rocket", "rabbit", "ribbon", "rescue"],
  v: ["vase", "voice", "visit", "very", "vote", "valley", "velvet", "violet", "vivid", "vowel"],
  y: ["yam", "yard", "yell", "yolk", "yuck", "yawn", "young", "yummy", "yearn", "yield", "yodel", "yoga"],
  z: ["zone", "zest", "zinc", "zero", "zebra", "zigzag", "zesty", "zippy", "zipper", "zombie", "zoom"],
  ch: ["chat", "chill", "chick", "chain", "chase", "chess", "check", "charm", "cheer", "chime"],
  wh: ["wheel", "whale", "white", "wheat", "whip", "while", "where", "whizz", "whisk"]
};

// Sound Racer needs longer laps than Rocket Run, so it uses the Rocket Run
// examples plus existing early-game word banks and a small curated supplement.
const CLEAN = word => /^[a-z]{2,6}$/.test(word);
const ALL_WORDS = [
  ...new Set([
    ...Object.values(LETTER_EXAMPLES).flat(),
    ...Object.values(CVC_WORDS).flat(),
    ...Object.values(SIGHT_WORDS).flat(),
    ...Object.values(SOUND_RACER_EXTRA_WORDS).flat()
  ].map(word => String(word).toLowerCase()).filter(CLEAN))
];

const LEN_RANGE = {
  easy: [2, 4], low: [2, 4],
  medium: [3, 5], mid: [3, 5],
  hard: [4, 6], high: [4, 6]
};

const TRACK_PROFILES = {
  easy: { totalLength: 560, gateCount: 26, correctCount: 10, minGateGap: 14 },
  low: { totalLength: 560, gateCount: 26, correctCount: 10, minGateGap: 14 },
  medium: { totalLength: 650, gateCount: 31, correctCount: 10, minGateGap: 15 },
  mid: { totalLength: 650, gateCount: 31, correctCount: 10, minGateGap: 15 },
  hard: { totalLength: 700, gateCount: 34, correctCount: 10, minGateGap: 16 },
  high: { totalLength: 700, gateCount: 34, correctCount: 10, minGateGap: 16 }
};

const DEFAULT_TRACK_PROFILE = TRACK_PROFILES.easy;
const TRACK_START_BUFFER = 18;
const TRACK_FINISH_BUFFER = 26;

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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function nearestFreeIndex(ideal, taken, limit) {
  if (!taken.has(ideal)) return ideal;
  for (let offset = 1; offset < limit; offset += 1) {
    const left = ideal - offset;
    const right = ideal + offset;
    if (left >= 0 && !taken.has(left)) return left;
    if (right < limit && !taken.has(right)) return right;
  }
  return ideal;
}

// The racer is authored around a world-space centreline, rather than a
// straight strip with a moving backdrop.  The points are deliberately broad
// and forgiving for early readers, but they include real left/right bends and
// a hairpin that the vehicle and collision surfaces can share.
export function buildCircuitPath(totalLength, rng) {
  const samples = Math.max(24, Math.ceil(totalLength / 5));
  const points = [];
  const variation = (rng() - 0.5) * 2.4;
  for (let index = 0; index <= samples; index += 1) {
    const distance = (index / samples) * totalLength;
    const theta = (index / samples) * Math.PI * 2 + Math.PI / 2;
    const x = Math.sin(theta) * (26 + variation) + Math.sin(theta * 3) * 2.2;
    const y = Math.sin(theta * 2 + variation) * 0.82 + Math.sin(theta * 5) * 0.2;
    const z = -38 + Math.cos(theta) * 29 + Math.sin(theta * 2) * 3.2;
    points.push({ distance, x, y, z, heading: 0 });
  }
  for (let index = 0; index < points.length; index += 1) {
    const previous = points[(index - 1 + samples) % samples];
    const next = points[(index + 1) % samples];
    points[index].heading = Math.atan2(next.x - previous.x, -(next.z - previous.z));
  }
  return points;
}

function spacedGatePositions(profile, rng) {
  const { gateCount, minGateGap, totalLength } = profile;
  const start = TRACK_START_BUFFER;
  const end = totalLength - TRACK_FINISH_BUFFER;
  const usable = Math.max(minGateGap * Math.max(1, gateCount - 1), end - start);
  const spacing = usable / Math.max(1, gateCount - 1);
  let previous = start - minGateGap;

  return Array.from({ length: gateCount }, (_, index) => {
    const slotsLeft = gateCount - index - 1;
    const maxAllowed = end - slotsLeft * minGateGap;
    const base = start + spacing * index;
    const jitter = (rng() - 0.5) * Math.min(spacing * 0.32, 7);
    const z = Math.round(clamp(base + jitter, previous + minGateGap, maxAllowed));
    previous = z;
    return z;
  });
}

// Deterministic round builder using the SAME fairness criteria as
// buildRocketRunRound but with a seeded shuffle so tracks are reproducible.
function buildDeterministicRound(target, { count, difficulty, rng }) {
  const g = String(target || "").toLowerCase();
  const range = LEN_RANGE[String(difficulty || "").toLowerCase()];
  const inRange = w => !range || (w.length >= range[0] && w.length <= range[1]);

  // Correct pool: words that match the exact production phoneme cue. Spelling
  // alone is insufficient for short vowels, hard c/g and voiced/unvoiced th.
  const correctPool = wordsStartingWithTargetSound(g);
  let cp = correctPool.filter(inRange);
  if (cp.length < count) cp = correctPool;
  const correct = shuffleSeeded([...new Set(cp)], rng).slice(0, Math.max(0, count));

  const correctSet = new Set(correct);

  // Distractor pool: sound-distinct from target and not already a correct word
  const distractorPool = ALL_WORDS.filter(
    w => !sharesSound(onsetGrapheme(w), g) && !correctSet.has(w)
  );
  let dp = distractorPool.filter(inRange);
  if (dp.length < count) dp = distractorPool;
  const distractorCount = count * 2;
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

export function buildSoundRacerTutorial(track, { hasRecordedAudio = () => true } = {}) {
  const target = String(track?.target || "").trim().toLowerCase();
  if (!target) throw new Error("Sound Racer tutorial requires the current track target.");
  const matchingGates = (track?.gates || []).filter(gate => (
    gate?.kind === "word"
    && gate.correct === true
    && wordStartsWithTargetSound(gate.word, target)
  ));
  const exampleGate = matchingGates.find(gate => hasRecordedAudio(gate.word));
  if (!exampleGate?.word) {
    throw new Error(`Sound Racer tutorial has no recorded correct example for "${target}".`);
  }
  const exampleWord = String(exampleGate.word).toLowerCase();
  return Object.freeze({
    target,
    targetLabel: target.toUpperCase(),
    exampleWord,
    phonicsInstruction: `Listen: ${target.toUpperCase()} starts ${exampleWord}.`,
    motorInstruction: "Steer left or right to catch matching words. Dodge everything else."
  });
}

/**
 * Build the learning result separately from the race-pressure telemetry.
 * Steering past a correct gate queues another opportunity and hitting scenery
 * affects the ship, but neither action demonstrates an incorrect sound choice.
 */
export function buildSoundRacerEvidenceResult({
  wordsCorrect = 0,
  wordsWrong = 0,
  missedCorrect = 0,
  obstaclesHit = 0,
  score = 0,
  timeMs = 0
} = {}) {
  const correct = Math.max(0, Number(wordsCorrect) || 0);
  const mistakes = Math.max(0, Number(wordsWrong) || 0);
  const total = correct + mistakes;
  const stars = starRubric({ correct, total, mistakes, deaths: 0 });
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return Object.freeze({
    correct,
    total,
    mistakes,
    stars,
    accuracy,
    score: Math.max(0, Number(score) || 0),
    timeMs: Math.max(0, Number(timeMs) || 0),
    raceEvents: Object.freeze({
      missedTargetEvents: Math.max(0, Number(missedCorrect) || 0),
      obstacleHits: Math.max(0, Number(obstaclesHit) || 0)
    })
  });
}

export function buildTrack(target, { difficulty, seed } = {}) {
  const g = String(target || "").toLowerCase();
  const d = String(difficulty || "").toLowerCase();
  const rng = makeRng(seed, g, d);
  const profile = TRACK_PROFILES[d] || DEFAULT_TRACK_PROFILE;
  const { totalLength, gateCount } = profile;

  // Build enough target words for a long lap without making the route cluttered.
  const count = profile.correctCount;
  const round = buildDeterministicRound(g, { count, difficulty: d, rng });
  const needed = round.needed;

  // Obstacles: ~18% of gates (fixed within the 15–20% spec for determinism).
  const obstacleCount = Math.max(1, Math.floor(gateCount * 0.18));
  const wordGateCount = gateCount - obstacleCount;

  // Build correct gates
  const correctGates = round.correct.slice(0, needed).map(word => ({
    kind: "word",
    word,
    correct: true
  }));

  // Build distractor gates. These stay distinct on the starting track; catch-up
  // gates are the only intentional repeats, and only after a player misses.
  const distractorGates = [];
  for (let i = 0; i < wordGateCount - needed; i += 1) {
    const word = round.distractors[i];
    if (!word) break;
    distractorGates.push({ kind: "word", word, correct: false });
  }

  // Build obstacle gates
  const obstacleGates = Array.from({ length: obstacleCount }, () => ({
    kind: "obstacle"
  }));

  // Place all gates on a sparse rhythm, then reserve evenly spread slots for
  // correct words so the lesson stays fair across the full-length lap.
  const positions = spacedGatePositions(profile, rng);
  const allGates = new Array(gateCount);
  const taken = new Set();

  for (let i = 0; i < needed; i += 1) {
    const ideal = Math.round(((i + 0.5) / needed) * gateCount - 0.5);
    const index = nearestFreeIndex(clamp(ideal, 0, gateCount - 1), taken, gateCount);
    allGates[index] = correctGates[i];
    taken.add(index);
  }

  // Fill remaining slots with a shuffled mix of distractors and obstacles
  const remaining = shuffleSeeded([...distractorGates, ...obstacleGates], rng);
  let remIdx = 0;
  for (let i = 0; i < gateCount; i += 1) {
    if (allGates[i] === undefined) {
      allGates[i] = remaining[remIdx] || { kind: "obstacle" };
      remIdx += 1;
    }
  }

  // Assign each gate to a lane (0, 1, 2)
  const gates = allGates.map((gate, index) => ({
    z: positions[index],
    lane: Math.floor(rng() * 3),
    ...gate
  }));

  const path = buildCircuitPath(totalLength, rng);
  return {
    target: g,
    gates,
    needed,
    totalLength,
    path,
    closedCircuit: true,
    laps: 1,
    checkpoints: [0, Math.round(totalLength / 3), Math.round((totalLength * 2) / 3), totalLength]
  };
}
