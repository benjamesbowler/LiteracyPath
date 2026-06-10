import {
  ALL_BLEND_PATTERNS,
  BEGINNING_BLEND_PATTERNS
} from "./blendPatternData.js";
import { ALL_DIGRAPH_PATTERNS } from "./digraphPatternData.js";
import {
  ALL_LONG_VOWEL_PATTERNS,
  LONG_VOWEL_TEAM_PATTERNS,
  SILENT_E_PATTERNS
} from "./longVowelPatternData.js";
import { hfwApprovedWordsBySkill } from "./hfwApprovedCoverageWords.js";

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

export const finalSoundLevelOneAllowedItemKeys = finalSoundExpectedItemKeys;

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

export const finalSoundLevelOneForbiddenItemKeys = [
  "ch",
  "sh",
  "th",
  "ng",
  "nd",
  "nk",
  "nt",
  "st",
  "sk",
  "ft",
  "lt",
  "ll",
  "ck",
  "ss",
  "ff",
  "zz",
  "mp",
  "rk",
  "lk",
  "f",
  "k",
  "r",
  "s"
];

export const cvcShortVowelExpectedItemKeys = [
  "short_a",
  "short_e",
  "short_i",
  "short_o",
  "short_u"
];

export const cvcShortVowelLevelTwoExpectedItemKeys = cvcShortVowelExpectedItemKeys;

export const shortVowelDiscriminationPhaseItemKeysByLevel = {
  1: {
    1: cvcShortVowelExpectedItemKeys,
    2: cvcShortVowelExpectedItemKeys
  },
  2: {
    1: cvcShortVowelLevelTwoExpectedItemKeys,
    2: cvcShortVowelLevelTwoExpectedItemKeys
  }
};

export const rhymingExpectedItemKeys = [
  "at",
  "an",
  "ap",
  "am",
  "ag",
  "ad",
  "ed",
  "en",
  "et",
  "eg",
  "ig",
  "in",
  "ip",
  "it",
  "og",
  "op",
  "ot",
  "ug",
  "un",
  "up",
  "ut"
];

export const rhymingLevelTwoAllItemKeys = [
  "ing",
  "ang",
  "ong",
  "unk",
  "ink",
  "ank",
  "ock",
  "ack",
  "ick",
  "ill",
  "all",
  "ell",
  "ash",
  "ish",
  "uck",
  "ake",
  "ame",
  "ide",
  "ight",
  "oat",
  "eep",
  "ouse",
  "ird",
  "urn",
  "ar",
  "or"
];

export const rhymingLevelTwoPendingMediaItemKeys = [
  "unk",
  "ank"
];

export const rhymingLevelTwoExpectedItemKeys = rhymingLevelTwoAllItemKeys
  .filter(itemKey => !rhymingLevelTwoPendingMediaItemKeys.includes(itemKey));

export const rhymingPhaseItemKeysByLevel = {
  1: {
    1: rhymingExpectedItemKeys.slice(0, 15),
    2: rhymingExpectedItemKeys.slice(15)
  },
  2: {
    1: rhymingLevelTwoExpectedItemKeys.slice(0, 12),
    2: rhymingLevelTwoExpectedItemKeys.slice(12)
  }
};

export const coverageExpectations = {
  initial_sounds: {
    itemType: "initial_sound",
    itemKeys: initialSoundExpectedItemKeys,
    levels: {
      1: initialSoundExpectedItemKeys,
      2: initialSoundExpectedItemKeys
    },
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
    levels: {
      1: cvcShortVowelExpectedItemKeys,
      2: cvcShortVowelLevelTwoExpectedItemKeys
    },
    total: cvcShortVowelExpectedItemKeys.length,
    unit: "vowels",
    note: "CVC Short Vowels must cover all five medial short-vowel targets at each level and must not cross-fill Initial Sounds questions."
  },
  short_vowel_discrimination: {
    itemType: "short_vowel",
    itemKeys: cvcShortVowelExpectedItemKeys,
    levels: {
      1: cvcShortVowelExpectedItemKeys,
      2: cvcShortVowelLevelTwoExpectedItemKeys
    },
    phases: shortVowelDiscriminationPhaseItemKeysByLevel,
    total: cvcShortVowelExpectedItemKeys.length,
    unit: "short vowel sounds",
    note: "Short Vowel Discrimination covers the five medial short-vowel sounds at each level with image-backed word and listening questions only."
  },
  rhyming: {
    itemType: "rhyming_family",
    itemKeys: rhymingExpectedItemKeys,
    levels: {
      1: rhymingExpectedItemKeys,
      2: rhymingLevelTwoExpectedItemKeys
    },
    phases: rhymingPhaseItemKeysByLevel,
    pendingMediaItemKeys: {
      2: rhymingLevelTwoPendingMediaItemKeys
    },
    total: rhymingExpectedItemKeys.length,
    unit: "rime families",
    note: "Rhyming Level 1 uses simple short-vowel CVC rime families. Level 2 adds harder rimes, blends, digraphs, vowel teams, and r-controlled families. Level 2 ank/unk are held out until two image-backed rhyme words exist for each family."
  },
  hfw_1_25: {
    itemType: "sight_word",
    itemKeys: hfwApprovedWordsBySkill.hfw_1_25,
    levels: {
      1: hfwApprovedWordsBySkill.hfw_1_25,
      2: hfwApprovedWordsBySkill.hfw_1_25
    },
    total: 25,
    unit: "words"
  },
  hfw_26_50: {
    itemType: "sight_word",
    itemKeys: hfwApprovedWordsBySkill.hfw_26_50,
    levels: {
      1: hfwApprovedWordsBySkill.hfw_26_50,
      2: hfwApprovedWordsBySkill.hfw_26_50
    },
    total: 25,
    unit: "words"
  },
  hfw_51_75: {
    itemType: "sight_word",
    itemKeys: hfwApprovedWordsBySkill.hfw_51_75,
    levels: {
      1: hfwApprovedWordsBySkill.hfw_51_75,
      2: hfwApprovedWordsBySkill.hfw_51_75
    },
    total: 25,
    unit: "words"
  },
  hfw_76_100: {
    itemType: "sight_word",
    itemKeys: hfwApprovedWordsBySkill.hfw_76_100,
    levels: {
      1: hfwApprovedWordsBySkill.hfw_76_100,
      2: hfwApprovedWordsBySkill.hfw_76_100
    },
    total: 25,
    unit: "words"
  },
  blends: {
    itemType: "phonics_pattern",
    itemKeys: ALL_BLEND_PATTERNS,
    levels: {
      1: BEGINNING_BLEND_PATTERNS,
      2: ALL_BLEND_PATTERNS
    },
    total: ALL_BLEND_PATTERNS.length,
    unit: "blend patterns",
    note: "Blends uses replacement-only content: Level 1 covers beginning blends with image-card choices; Level 2 mixes beginning and ending blends with picture-backed word completion."
  },
  digraphs: {
    itemType: "phonics_pattern",
    itemKeys: ALL_DIGRAPH_PATTERNS,
    levels: {
      1: ALL_DIGRAPH_PATTERNS,
      2: ALL_DIGRAPH_PATTERNS
    },
    total: ALL_DIGRAPH_PATTERNS.length,
    unit: "digraph patterns",
    note: "Digraphs uses replacement-only content: Level 1 selects image-backed words that use the target digraph; Level 2 completes image-backed words with the correct digraph."
  },
  long_vowels: {
    itemType: "phonics_pattern",
    itemKeys: ALL_LONG_VOWEL_PATTERNS,
    levels: {
      1: SILENT_E_PATTERNS,
      2: LONG_VOWEL_TEAM_PATTERNS
    },
    total: ALL_LONG_VOWEL_PATTERNS.length,
    unit: "long-vowel patterns",
    note: "Long Vowels and Silent E uses replacement-only content: Level 1 selects silent-e spelling patterns; Level 2 completes image-backed words with long-vowel teams and related long-vowel spellings."
  }
};
