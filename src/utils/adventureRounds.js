// Pure round builders for the three adventure games (Word Rescue,
// Sound Sort Factory, Letter Garden). Kept free of DOM/React so every
// round can be play-tested by unit tests.
import { CVC_WORDS, SIGHT_WORDS } from "../data/learnGamesData.js";
import { LETTER_EXAMPLES } from "../data/elSkillsBlockCycles.js";
import { hasKnownBadWordAudio } from "../data/knownBadWordAudio.js";

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function cleanPool(words) {
  return [...new Set(words)].filter(w => /^[a-z]{2,6}$/.test(w) && !hasKnownBadWordAudio(w));
}

// ── Word Rescue: each word read correctly lays a bridge plank ─────────────
export function buildRescueRounds(difficulty = "easy") {
  const pool = cleanPool(
    difficulty === "hard"
      ? [...SIGHT_WORDS.level3, ...CVC_WORDS.hard]
      : difficulty === "medium"
        ? [...SIGHT_WORDS.level2, ...CVC_WORDS.medium]
        : [...SIGHT_WORDS.level1, ...CVC_WORDS.easy]
  );
  const words = shuffle(pool).slice(0, 6);
  return words.map(word => ({
    word,
    choices: shuffle([word, ...shuffle(pool.filter(w => w !== word)).slice(0, 2)])
  }));
}

// ── Sound Sort Factory: two bins, words ride the conveyor ─────────────────
// Contrast pairs are chosen so membership is decidable from SPELLING alone
// (starts-with the bin's grapheme), so every item has exactly one right bin.
const SORT_PAIRS = {
  easy: [["s", "m"], ["t", "b"], ["c", "f"]],
  medium: [["sh", "ch"], ["s", "sh"], ["t", "th"]],
  hard: [["ch", "th"], ["sh", "th"], ["b", "d"]]
};

export function buildSortRounds(difficulty = "easy") {
  const pairs = SORT_PAIRS[difficulty] || SORT_PAIRS.easy;
  const [keyA, keyB] = shuffle(pairs)[0];
  const wordsFor = key => cleanPool(LETTER_EXAMPLES[key] || []).filter(w => w.startsWith(key));
  let a = wordsFor(keyA);
  let b = wordsFor(keyB);
  // In s-vs-sh style rounds (one grapheme is a prefix of the other) membership
  // is decided by the LONGEST matching bin: "ship" -> sh, "sun" -> s. So only
  // the SHORTER bin must drop words that also start with the longer grapheme -
  // the longer bin (sh/th) keeps its words instead of being emptied out.
  const longer = keyA.length >= keyB.length ? keyA : keyB;
  const shorter = keyA.length >= keyB.length ? keyB : keyA;
  if (longer !== shorter && longer.startsWith(shorter)) {
    const strip = list => list.filter(w => !w.startsWith(longer));
    if (shorter === keyA) a = strip(a); else b = strip(b);
  }
  const items = shuffle([
    ...shuffle(a).slice(0, 4).map(word => ({ word, bin: keyA })),
    ...shuffle(b).slice(0, 4).map(word => ({ word, bin: keyB }))
  ]);
  return { binA: keyA, binB: keyB, items };
}

// ── Letter Garden: build the word, grow a flower ──────────────────────────
export const GARDEN_FLOWERS = ["daisy", "tulip", "sunflower", "blossom", "hibiscus", "rose"];

export function buildGardenRounds(difficulty = "easy") {
  const pool = cleanPool(CVC_WORDS[difficulty] || CVC_WORDS.easy)
    .filter(w => w.length >= 3 && w.length <= 5);
  const words = shuffle(pool).slice(0, 5);
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  return words.map((word, index) => {
    const decoys = shuffle([...alphabet].filter(l => !word.includes(l))).slice(0, 3);
    return {
      word,
      flower: GARDEN_FLOWERS[index % GARDEN_FLOWERS.length],
      bank: shuffle([...new Set([...word, ...decoys])])
    };
  });
}

export function adventureStars(correct, total, wrongs) {
  if (correct >= total && wrongs === 0) return 3;
  if (correct >= Math.ceil(total * 0.7)) return 2;
  return correct > 0 ? 1 : 0;
}
