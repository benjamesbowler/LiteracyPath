import { getChildWordAsset } from "../../data/childAssets.js";

export const SOUNDKEY_PROFILES = Object.freeze({
  cvc: Object.freeze(["s", "a", "t", "p", "i", "n", "m", "d", "g", "o", "c", "k", "e", "u", "r", "h", "b", "f", "l", "w"]),
  digraphs: Object.freeze(["sh", "ch", "th", "ng", "ck", "qu", "ai", "ee", "oa", "oo", "ar", "or"])
});

const WORD_DEFINITIONS = [
  ["cat", ["c", "a", "t"]], ["bat", ["b", "a", "t"]], ["hat", ["h", "a", "t"]],
  ["sat", ["s", "a", "t"]], ["map", ["m", "a", "p"]], ["cap", ["c", "a", "p"]],
  ["nap", ["n", "a", "p"]], ["pig", ["p", "i", "g"]], ["dig", ["d", "i", "g"]],
  ["wig", ["w", "i", "g"]], ["pin", ["p", "i", "n"]], ["fin", ["f", "i", "n"]],
  ["bin", ["b", "i", "n"]], ["pot", ["p", "o", "t"]], ["hot", ["h", "o", "t"]],
  ["dot", ["d", "o", "t"]], ["bug", ["b", "u", "g"]], ["mug", ["m", "u", "g"]],
  ["dug", ["d", "u", "g"]], ["sun", ["s", "u", "n"]], ["bun", ["b", "u", "n"]],
  ["nut", ["n", "u", "t"]], ["cut", ["c", "u", "t"]], ["hut", ["h", "u", "t"]],
  ["ship", ["sh", "i", "p"]], ["fish", ["f", "i", "sh"]], ["chin", ["ch", "i", "n"]],
  ["chop", ["ch", "o", "p"]], ["shut", ["sh", "u", "t"]], ["shed", ["sh", "e", "d"]],
  ["thin", ["th", "i", "n"]], ["moth", ["m", "o", "th"]], ["bath", ["b", "a", "th"]],
  ["duck", ["d", "u", "ck"]], ["kick", ["k", "i", "ck"]], ["sing", ["s", "i", "ng"]],
  ["king", ["k", "i", "ng"]], ["long", ["l", "o", "ng"]], ["tree", ["t", "r", "ee"]],
  ["star", ["s", "t", "ar"]], ["train", ["t", "r", "ai", "n"]], ["rain", ["r", "ai", "n"]],
  ["boat", ["b", "oa", "t"]], ["coat", ["c", "oa", "t"]], ["goat", ["g", "oa", "t"]],
  ["toast", ["t", "oa", "s", "t"]], ["moon", ["m", "oo", "n"]], ["book", ["b", "oo", "k"]],
  ["food", ["f", "oo", "d"]], ["cook", ["c", "oo", "k"]], ["farm", ["f", "ar", "m"]],
  ["fork", ["f", "or", "k"]], ["corn", ["c", "or", "n"]]
];

const DIFFICULTY_WORD_IDS = Object.freeze({
  easy: Object.freeze(["cat", "bat", "hat", "sat", "map", "cap", "nap", "pig", "dig", "wig", "pin", "fin"]),
  medium: Object.freeze(["ship", "fish", "chin", "chop", "shut", "shed", "thin", "moth", "bath", "duck", "kick", "sing", "king", "long", "tree", "star"]),
  hard: Object.freeze(["train", "rain", "boat", "coat", "goat", "toast", "moon", "book", "food", "cook", "farm", "fork", "corn"])
});

export const SOUNDKEY_WORDS = Object.freeze(WORD_DEFINITIONS.map(([word, tokens]) => {
  const asset = getChildWordAsset(word) || {};
  return Object.freeze({
    id: word,
    display: word,
    tokens: Object.freeze(tokens),
    profile: tokens.some(token => token.length > 1) ? "digraphs" : "cvc",
    image: asset.image || asset.fallbackImage || "",
    audio: asset.audio || "",
    alt: asset.alt || `A picture of a ${word}`
  });
}));

const SOUNDKEY_WORD_BY_ID = new Map(SOUNDKEY_WORDS.map(word => [word.id, word]));

function seedNumber(seed) {
  let value = 2166136261;
  for (const character of String(seed ?? 0)) {
    value ^= character.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function shuffleWithSeed(values, seed) {
  const result = [...values];
  let state = seedNumber(seed) || 1;
  const random = () => {
    state = Math.imul(state ^ state >>> 15, 1 | state);
    state ^= state + Math.imul(state ^ state >>> 7, 61 | state);
    return ((state ^ state >>> 14) >>> 0) / 4294967296;
  };
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function buildSoundKeySession(difficulty = "easy", seed = 0, count = 10) {
  const band = DIFFICULTY_WORD_IDS[difficulty] || DIFFICULTY_WORD_IDS.easy;
  const pool = band.map(id => SOUNDKEY_WORD_BY_ID.get(id)).filter(Boolean);
  return Object.freeze(shuffleWithSeed(pool, `${difficulty}:${seed}`).slice(0, Math.max(0, count)));
}

export function soundKeyTokensForWord(word) {
  if (word?.profile !== "digraphs") return SOUNDKEY_PROFILES.cvc;
  return Object.freeze([...new Set([...SOUNDKEY_PROFILES.cvc, ...SOUNDKEY_PROFILES.digraphs])]);
}

export function findSoundKeyWord(tokens, words = SOUNDKEY_WORDS) {
  const key = tokens.map(token => String(token || "").toLowerCase()).join("");
  return words.find(word => word.id === key) || null;
}

export function wordForMode(mode, words = SOUNDKEY_WORDS) {
  const index = Math.floor(Math.random() * words.length);
  const word = words[index] || words[0];
  if (mode === "missing") return { ...word, missingIndex: Math.min(1, word.tokens.length - 1) };
  return word;
}
