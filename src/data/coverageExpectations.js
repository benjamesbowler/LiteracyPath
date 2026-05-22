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

export const coverageExpectations = {
  initial_sounds: {
    itemType: "initial_sound",
    itemKeys: initialSoundExpectedItemKeys,
    total: initialSoundExpectedItemKeys.length,
    unit: "sounds",
    note: "Initial Sounds tracks Kindergarten-appropriate initial sound targets. The letter x is intentionally excluded because common x words either begin with /z/ (xylophone) or a letter-name sound (x-ray), which makes it a poor initial-sound mastery target."
  },
  final_sounds: {
    total: 26,
    unit: "sounds"
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
