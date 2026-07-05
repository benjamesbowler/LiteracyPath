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

function pickCycling(list, n) {
  if (!list.length) return [];
  const out = [];
  for (let i = 0; i < n; i += 1) out.push(list[i % list.length]);
  return out;
}

// One round: `count` correct words to catch + `count` sound-distinct distractors,
// interleaved into a fair, shuffled spawn order.
export function buildRocketRunRound(targetGrapheme, { count = 6 } = {}) {
  const g = String(targetGrapheme || "").toLowerCase();
  const correctPool = wordsStartingWith(g);
  const distractorPool = ALL_WORDS.filter(word => !sharesSound(onsetGrapheme(word), g));
  const correct = pickCycling(shuffle(correctPool), count);
  const distractors = pickCycling(shuffle(distractorPool), count);
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
