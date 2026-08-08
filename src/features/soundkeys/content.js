import { getChildWordAsset } from "../../data/childAssets.js";

export const SOUNDKEY_PROFILES = Object.freeze({
  cvc: Object.freeze(["s", "a", "t", "p", "i", "n", "m", "d", "g", "o", "c", "k", "e", "u", "r", "h", "b", "f", "l"]),
  digraphs: Object.freeze(["sh", "ch", "th", "ng", "ck", "qu", "ai", "ee", "oa", "oo", "ar", "or"])
});

const WORD_LIST = [
  "cat", "bat", "hat", "sat", "map", "cap", "nap", "pig", "dig", "wig",
  "pin", "fin", "bin", "pot", "hot", "dot", "bug", "mug", "dug", "sun", "bun", "nut", "cut", "hut"
];

export const SOUNDKEY_WORDS = Object.freeze(WORD_LIST.map(word => {
  const asset = getChildWordAsset(word) || {};
  return Object.freeze({
    id: word,
    display: word,
    tokens: word.split(""),
    image: asset.image || asset.fallbackImage || "",
    audio: asset.audio || "",
    alt: asset.alt || `A picture of a ${word}`
  });
}));

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

