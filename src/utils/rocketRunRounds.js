// Pure round builder for Rocket Run (the 3D catch-the-sound game). Kept free of
// DOM/Three.js so every round can be play-tested: the child steers into words
// that START with the target sound and dodges the rest, so a round is only fair
// if the "correct" words truly begin with the target grapheme and the distractors
// begin with a DIFFERENT sound (c/k and w/wh are homophones and must be kept apart).
import { LETTER_EXAMPLES } from "../data/elSkillsBlockCycles.js";
import { onsetGrapheme, sharesSound } from "../components/elQuest/elQuestEngine.js";

const CLEAN = word => /^[a-z]{2,6}$/.test(word);
const ALL_WORDS = [...new Set(Object.values(LETTER_EXAMPLES).flat())].filter(CLEAN);

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Example words that TRULY start with the grapheme (drops "six"/"teeth"/"ball"
// style entries where the grapheme is not the onset - see elQuestEngine onset fix).
export function wordsStartingWith(grapheme) {
  const g = String(grapheme || "").toLowerCase();
  return (LETTER_EXAMPLES[g] || []).filter(CLEAN).filter(word => onsetGrapheme(word) === g);
}

// Graphemes that make a valid "which starts with this sound?" target: at least a
// few decodable words genuinely begin with them. Naturally excludes final-only
// graphemes (x, all, ng, nk) and multi-letter pattern rows.
export function rocketRunTargets(minCorrect = 3) {
  return Object.keys(LETTER_EXAMPLES)
    .filter(g => /^[a-z]{1,2}$/.test(g) && g !== "qu")
    .filter(g => wordsStartingWith(g).length >= minCorrect);
}

function uniqueSample(pool, n) {
  return shuffle([...new Set(pool)]).slice(0, Math.max(0, n));
}

// Word length band per difficulty, so the words a round shows suit the level.
const LEN_RANGE = { easy: [2, 4], low: [2, 4], medium: [3, 5], mid: [3, 5], hard: [4, 6], high: [4, 6] };

// One round: DISTINCT correct words to catch (never "vest, vest, vest") + MORE,
// also-distinct, sound-distinct distractors, interleaved into a fair spawn order.
export function buildRocketRunRound(targetGrapheme, { count = 6, difficulty } = {}) {
  const g = String(targetGrapheme || "").toLowerCase();
  const range = LEN_RANGE[String(difficulty || "").toLowerCase()];
  const inRange = w => !range || (w.length >= range[0] && w.length <= range[1]);

  const correctPool = wordsStartingWith(g);
  let cp = correctPool.filter(inRange);
  if (cp.length < 3) cp = correctPool;                 // never starve a small sound
  const correct = uniqueSample(cp, count);             // distinct, no cycling/repeats

  const correctSet = new Set(correct);
  const distractorPool = ALL_WORDS.filter(w => !sharesSound(onsetGrapheme(w), g) && !correctSet.has(w));
  let dp = distractorPool.filter(inRange);
  if (dp.length < count) dp = distractorPool;
  const distractors = uniqueSample(dp, count + Math.ceil(count / 2)); // more, all distinct

  const sequence = shuffle([
    ...correct.map(word => ({ word, correct: true })),
    ...distractors.map(word => ({ word, correct: false }))
  ]);
  return { targetGrapheme: g, correct, distractors, sequence, needed: correct.length };
}

export function rocketRunStars(caught, needed, wrongHits) {
  if (!needed) return 0;
  if (caught >= needed && wrongHits === 0) return 3;
  if (caught >= Math.ceil(needed * 0.7)) return 2;
  return caught > 0 ? 1 : 0;
}

export const ROCKET_RUN_LEVELS = 10;

// Order sound targets easiest -> hardest: single consonants < short vowels < digraphs.
export function targetHardness(g) {
  if (/^(sh|ch|th|ng|ck|qu)$/.test(g)) return 30;
  if (/^[aeiou]$/.test(g)) return 20;
  return 10;
}

// A ramped, no-repeat ladder of sound targets for a difficulty (mirrors the
// curriculum framework): easy = easiest sounds, medium = middle, hard = hardest
// incl. digraphs. Returns up to ROCKET_RUN_LEVELS distinct targets, ramped.
export function rocketRunLadder(difficulty) {
  const all = rocketRunTargets().slice().sort((a, b) => targetHardness(a) - targetHardness(b) || a.localeCompare(b));
  const n = all.length;
  const d = String(difficulty || "").toLowerCase();
  const start = (d === "hard" || d === "high") ? Math.max(0, n - ROCKET_RUN_LEVELS)
    : (d === "medium" || d === "mid") ? Math.max(0, Math.min(Math.floor(n * 0.25), n - ROCKET_RUN_LEVELS))
      : 0;
  const out = all.slice(start, start + ROCKET_RUN_LEVELS);
  let lo = start - 1, hi = start + ROCKET_RUN_LEVELS;
  while (out.length < ROCKET_RUN_LEVELS && (lo >= 0 || hi < n)) {
    if (hi < n) { out.push(all[hi]); hi += 1; }
    else if (lo >= 0) { out.unshift(all[lo]); lo -= 1; }
  }
  return out.slice(0, ROCKET_RUN_LEVELS);
}
