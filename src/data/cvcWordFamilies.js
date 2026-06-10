const VOWELS = new Set(["a", "e", "i", "o", "u"]);

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
  const target = normalizedVowel || normalizedLetter;

  if (VOWELS.has(normalizedLetter) || VOWELS.has(target)) {
    return `/audio/child-mode/clean-human/graphemes/short_vowels/short_${target}.mp3`;
  }

  return `/audio/child-mode/clean-human/graphemes/consonants/${normalizedLetter}.mp3`;
}

export function getCvcWordParts(word, rime) {
  const normalizedWord = String(word || "").toLowerCase();
  const normalizedRime = String(rime || "").toLowerCase();
  const onset = normalizedWord.endsWith(normalizedRime)
    ? normalizedWord.slice(0, normalizedWord.length - normalizedRime.length)
    : normalizedWord.slice(0, 1);

  return {
    onset,
    rimeLetters: normalizedRime.split("")
  };
}
