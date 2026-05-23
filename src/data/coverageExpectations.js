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
    total: finalSoundExpectedItemKeys.length,
    unit: "sounds",
    note: "Final Sounds is configured for simple early final phonemes only. Digraphs, ck endings, consonant clusters, silent-e words, r-controlled endings, x, and final s/z variants are intentionally excluded from this early checkpoint because they belong in later phonics pattern skills."
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
