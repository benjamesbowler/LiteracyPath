// Pure round builders for the three adventure games (Word Rescue,
// Sound Sort Factory, Letter Garden). Kept free of DOM/React so every
// round can be play-tested by unit tests.
import { CVC_WORDS, SIGHT_WORDS } from "../data/learnGamesData.js";
import { LETTER_EXAMPLES } from "../data/elSkillsBlockCycles.js";
import { hasWordAudio } from "./questAudio.js";
import { hasKnownBadWordAudio } from "../data/knownBadWordAudio.js";
import { buildGrowingGardenRounds } from "./buildingGrowingRounds.js";
export { GARDEN_FLOWERS } from "./buildingGrowingRounds.js";

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
// Foils must force a real read: random pool words can be eliminated by length
// or first letter, so prefer lookalikes - minimal pairs (cat/cap, ship/shop),
// then same-length same-initial words, then same length, then same initial -
// falling back to any pool word only so the choice set is always full.
function foilRank(candidate, word) {
  if (candidate.length === word.length) {
    const differences = [...word].reduce((count, letter, i) => count + (candidate[i] === letter ? 0 : 1), 0);
    if (differences === 1) return 0; // minimal pair
    if (candidate[0] === word[0]) return 1;
    return 2;
  }
  return candidate[0] === word[0] ? 3 : 4;
}

export function pickRescueFoils(word, pool, count = 2) {
  return shuffle(pool.filter(w => w !== word))
    .sort((a, b) => foilRank(a, word) - foilRank(b, word))
    .slice(0, count);
}

export function buildRescueRounds(difficulty = "easy") {
  const pool = cleanPool(
    difficulty === "hard"
      ? [...SIGHT_WORDS.level3, ...CVC_WORDS.hard]
      : difficulty === "medium"
        ? [...SIGHT_WORDS.level2, ...CVC_WORDS.medium]
        : [...SIGHT_WORDS.level1, ...CVC_WORDS.easy]
  );
  // A complete rescue trail keeps movement speed unchanged and crosses 36
  // distinct word bridges before reaching the friend.
  const words = shuffle(pool.filter(hasWordAudio)).slice(0, 36);
  return words.map(word => ({
    word,
    choices: shuffle([word, ...pickRescueFoils(word, pool)])
  }));
}

// ── Sound Sort Factory: two bins, words ride the conveyor ─────────────────
// Contrast pairs are chosen so membership is decidable from SPELLING alone
// (starts-with the bin's grapheme), so every item has exactly one right bin.
// One shift per contrast covers the reviewed single-letter bank. Later tiers
// add initial digraph contrasts before revisiting single letters in fresh pairs.
// x is excluded because its usual /ks/ model is not a word-initial sound.
const SINGLE_LETTER_PAIRS = [["a", "e"], ["i", "o"], ["u", "y"], ["s", "m"], ["t", "b"], ["c", "f"], ["p", "n"], ["g", "h"], ["r", "l"], ["d", "w"], ["v", "z"], ["j", "k"]];
const SORT_PAIRS = {
  easy: SINGLE_LETTER_PAIRS,
  medium: [["sh", "ch"], ["s", "sh"], ["t", "th"], ["c", "ch"], ["w", "wh"], ...SINGLE_LETTER_PAIRS],
  hard: [["sh", "th"], ["ch", "th"], ["b", "d"], ["wh", "w"], ["ch", "c"], ["sh", "s"], ["th", "t"], ...SINGLE_LETTER_PAIRS]
};

export function buildSortRounds(difficulty = "easy") {
  const pairs = SORT_PAIRS[difficulty] || SORT_PAIRS.easy;
  const shifts = shuffle(pairs).map(([keyA, keyB], shift) => {
    const wordsFor = key => cleanPool(LETTER_EXAMPLES[key] || []).filter(w => w.startsWith(key) && hasWordAudio(w));
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
    return { binA: keyA, binB: keyB, items: items.map(item => ({ ...item, binA: keyA, binB: keyB, shift })) };
  });
  return { binA: shifts[0].binA, binB: shifts[0].binB, items: shifts.flatMap(shift => shift.items), shifts: shifts.length };
}

// ── Letter Garden: change one known word, grow a labeled plant ─────────────
export function buildGardenRounds(difficulty = "easy") {
  return buildGrowingGardenRounds(difficulty);
}

export function buildAdventureRoundSet(mode, difficulty = "easy", version = 0) {
  return {
    version,
    rescue: mode === "rescue" ? buildRescueRounds(difficulty) : [],
    sort: mode === "sort" ? buildSortRounds(difficulty) : null,
    garden: mode === "garden" ? buildGardenRounds(difficulty) : []
  };
}

export function adventureStars(correct, total, wrongs) {
  if (correct >= total && wrongs === 0) return 3;
  if (correct >= Math.ceil(total * 0.7)) return 2;
  return correct > 0 ? 1 : 0;
}
