export const initialSoundExpectedItemKeys = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "y",
  "z"
];

export const finalSoundExpectedItemKeys = [
  "b",
  "d",
  "g",
  "l",
  "m",
  "n",
  "p",
  "t"
];

export const finalSoundLevelTwoExpectedItemKeys = [
  "sh",
  "th",
  "ll",
  "ng",
  "nd",
  "nk",
  "st",
  "sk",
  "ft",
  "lt"
];

export const cvcShortVowelExpectedItemKeys = [
  "short_a",
  "short_e",
  "short_i",
  "short_o",
  "short_u"
];

export const rhymingExpectedItemKeys = [
  "at",
  "an",
  "ap",
  "ed",
  "en",
  "et",
  "ig",
  "in",
  "og",
  "op",
  "ug",
  "un"
];

export const coverageExpectations = {
  initial_sounds: {
    itemType: "initial_sound",
    itemKeys: initialSoundExpectedItemKeys,
    total: initialSoundExpectedItemKeys.length,
    unit: "sounds",
    note: "Initial Sounds expects 25 alphabetic targets. The letter x is intentionally excluded because common x words either begin with /z/ (xylophone) or a letter-name sound (x-ray), which makes it a poor Kindergarten initial-sound mastery target. Live assessment only serves itemKeys with complete static image and human-word audio pairs."
  },
  final_sounds: {
    itemType: "final_sound",
    itemKeys: finalSoundExpectedItemKeys,
    levels: {
      1: finalSoundExpectedItemKeys,
      2: finalSoundLevelTwoExpectedItemKeys
    },
    total: finalSoundExpectedItemKeys.length,
    unit: "sounds",
    note: "Final Sounds Level 1 requires simple one-letter final sounds. Level 2 adds harder final digraphs, double letters, and consonant clusters."
  },
  cvc_short_vowels: {
    itemType: "short_vowel",
    itemKeys: cvcShortVowelExpectedItemKeys,
    total: cvcShortVowelExpectedItemKeys.length,
    unit: "vowels",
    note: "CVC Short Vowels must cover all five medial short-vowel targets and must not cross-fill Initial Sounds questions."
  },
  rhyming: {
    itemType: "rhyming_family",
    itemKeys: rhymingExpectedItemKeys,
    total: rhymingExpectedItemKeys.length,
    unit: "rime families",
    note: "Rhyming coverage is tracked by rime/rhyme family, never by starting letter."
  },
  hfw_1_25: {
    total: 25,
    unit: "words"
  },
  hfw_26_50: {
    total: 25,
    unit: "words"
  },
  hfw_51_100: {
    total: 50,
    unit: "words"
  }
};
