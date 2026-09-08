import { getPreferredPhonemeAudioPath } from "./phonemeAudioBank.js";

export const cvcWordFamilies = [
  {
    id: "at",
    rime: "at",
    vowel: "a",
    buildWords: ["cat", "bat", "hat"],
    magicSwaps: ["cat", "bat", "hat"],
    distractorLetters: ["d", "p"]
  },
  {
    id: "ap",
    rime: "ap",
    vowel: "a",
    buildWords: ["map", "cap", "nap"],
    magicSwaps: ["map", "cap", "nap"],
    distractorLetters: ["b", "d"]
  },
  {
    id: "ig",
    rime: "ig",
    vowel: "i",
    buildWords: ["pig", "dig", "wig"],
    magicSwaps: ["pig", "dig", "wig"],
    distractorLetters: ["s", "m"]
  },
  {
    id: "in",
    rime: "in",
    vowel: "i",
    buildWords: ["pin", "fin", "bin"],
    magicSwaps: ["pin", "fin", "bin"],
    distractorLetters: ["s", "m"]
  },
  {
    id: "ot",
    rime: "ot",
    vowel: "o",
    buildWords: ["pot", "hot", "dot"],
    magicSwaps: ["pot", "hot", "dot"],
    distractorLetters: ["m", "s"]
  },
  {
    id: "ug",
    rime: "ug",
    vowel: "u",
    buildWords: ["bug", "mug", "dug"],
    magicSwaps: ["bug", "mug", "dug"],
    distractorLetters: ["s", "t"]
  },
  {
    id: "un",
    rime: "un",
    vowel: "u",
    buildWords: ["sun", "bun"],
    magicSwaps: ["sun", "bun"],
    distractorLetters: ["m", "d"]
  },
  {
    id: "ut",
    rime: "ut",
    vowel: "u",
    buildWords: ["nut", "cut", "hut"],
    magicSwaps: ["nut", "cut", "hut"],
    distractorLetters: ["b", "d"]
  }
];

export function getGraphemeAudioPath(letter, vowel = "") {
  const normalizedLetter = String(letter || "").toLowerCase();
  const normalizedVowel = String(vowel || "").toLowerCase();
  return getPreferredPhonemeAudioPath(normalizedVowel || normalizedLetter);
}

// Reviewed grapheme boundaries for the current Word Workshop curriculum.
// A new word must author its units here before it can become a playable model.
const CVC_WORD_GRAPHEMES = {
  cat: ['c', 'a', 't'], bat: ['b', 'a', 't'], hat: ['h', 'a', 't'],
  map: ['m', 'a', 'p'], cap: ['c', 'a', 'p'], nap: ['n', 'a', 'p'],
  pig: ['p', 'i', 'g'], dig: ['d', 'i', 'g'], wig: ['w', 'i', 'g'],
  pin: ['p', 'i', 'n'], fin: ['f', 'i', 'n'], bin: ['b', 'i', 'n'],
  pot: ['p', 'o', 't'], hot: ['h', 'o', 't'], dot: ['d', 'o', 't'],
  bug: ['b', 'u', 'g'], mug: ['m', 'u', 'g'], dug: ['d', 'u', 'g'],
  sun: ['s', 'u', 'n'], bun: ['b', 'u', 'n'],
  nut: ['n', 'u', 't'], cut: ['c', 'u', 't'], hut: ['h', 'u', 't']
};

export function getCvcWordGraphemes(word) {
  const normalized = String(word || '').toLowerCase();
  const units = CVC_WORD_GRAPHEMES[normalized];
  if (!units || units.join('') !== normalized) throw new Error(`Missing authored Word Workshop graphemes: ${normalized}`);
  return [...units];
}
