import {
  finalSoundExpectedItemKeys,
  finalSoundLevelTwoExpectedItemKeys,
  rhymingExpectedItemKeys,
  rhymingLevelTwoExpectedItemKeys
} from "./coverageExpectations.js";

export const SKILL_LEVEL_DEPTH_TARGETS = {
  phaseSize: 15,
  minimumPerLevel: 30,
  simulationRounds: 100
};

export const managedAssessmentSkillDepthConfig = [
  {
    skillId: "initial_sounds",
    skillName: "Initial Sounds",
    aliases: ["initial sounds"],
    levels: {
      1: {
        designed: true,
        rule: "Simple one-syllable concrete words with clear initial letters; no blends/digraphs.",
        allowedFormats: ["FIRST_SOUND", "INITIAL_SOUND_PAIR_SELECT"]
      },
      2: {
        designed: true,
        rule: "Longer or multisyllable imageable words while keeping the task focused only on initial sound.",
        allowedFormats: ["FIRST_SOUND", "INITIAL_SOUND_PAIR_SELECT"]
      }
    }
  },
  {
    skillId: "final_sounds",
    skillName: "Final Sounds",
    aliases: ["final sounds", "ending sounds"],
    levels: {
      1: {
        designed: true,
        rule: "Only b,d,g,l,m,n,p,t; single consonant answer options only.",
        allowedItemKeys: finalSoundExpectedItemKeys,
        allowedFormats: ["ENDING_SOUND", "ENDING_SOUND_WORD_MATCH", "FINAL_SOUND_PAIR_SELECT"]
      },
      2: {
        designed: true,
        rule: "Harder final digraphs, double letters, and consonant clusters such as sh,ch,th,ng,nd,nk,nt,st,sk,ft,lt,ll,ck.",
        allowedItemKeys: finalSoundLevelTwoExpectedItemKeys,
        allowedFormats: ["ENDING_SOUND", "FINAL_SOUND_PAIR_SELECT"]
      }
    }
  },
  {
    skillId: "rhyming",
    skillName: "Rhyming",
    aliases: ["rhyming", "rhyming words"],
    levels: {
      1: {
        designed: true,
        rule: "Short-vowel CVC rime families with image-card choices.",
        allowedItemKeys: rhymingExpectedItemKeys,
        allowedFormats: ["RHYMING_PICTURE"]
      },
      2: {
        designed: true,
        rule: "Blends, digraphs, vowel teams, r-controlled, and harder rime families.",
        allowedItemKeys: rhymingLevelTwoExpectedItemKeys,
        allowedFormats: ["RHYMING_PICTURE"]
      }
    }
  },
  {
    skillId: "cvc_short_vowels",
    skillName: "CVC Short Vowels",
    aliases: ["cvc and short vowels", "cvc short vowels"],
    levels: {
      1: {
        designed: true,
        rule: "Simple CVC words with clear medial short vowels.",
        allowedFormats: ["HEARD_WORD_TO_PRINT_MINIMAL_PAIR", "PICTURE_TO_PRINT_MATCH", "MISSING_VOWEL_CVC", "PUT_SOUNDS_IN_ORDER", "COMPLETE_WORD", "SHORT_VOWEL_WORD", "LISTEN_CHOOSE_VOWEL"]
      },
      2: {
        designed: true,
        rule: "Harder CVC/CCVC/CVCC short-vowel items and closer distractors while preserving short-vowel focus.",
        allowedFormats: ["HEARD_WORD_TO_PRINT_MINIMAL_PAIR", "PICTURE_TO_PRINT_MATCH", "MISSING_VOWEL_CVC", "PUT_SOUNDS_IN_ORDER", "COMPLETE_WORD", "SHORT_VOWEL_WORD", "LISTEN_CHOOSE_VOWEL"]
      }
    }
  },
  {
    skillId: "short_vowel_discrimination",
    skillName: "Short Vowel Discrimination",
    aliases: ["short vowel discrimination"],
    levels: {
      1: { designed: true, rule: "Choose the medial vowel from simple CVC image/audio words.", allowedFormats: ["LISTEN_CHOOSE_VOWEL", "SHORT_VOWEL_WORD", "PICTURE_TO_PRINT_MATCH"] },
      2: { designed: true, rule: "Closer short-vowel contrasts and harder distractors.", allowedFormats: ["LISTEN_CHOOSE_VOWEL", "SHORT_VOWEL_WORD", "PICTURE_TO_PRINT_MATCH"] }
    }
  },
  {
    skillId: "hfw_1_25",
    skillName: "High-Frequency Words 1-25",
    aliases: ["high-frequency words 1-25"],
    levels: {
      1: { designed: true, rule: "Recognition, listening, and simple cloze tasks for the first 25 high-frequency words.", allowedFormats: ["LISTEN_FIND_WORD", "READ_FIND_WORD", "CLOZE_CHOICE", "SENTENCE_CLOZE", "COMPREHENSION", "MULTIPLE_CHOICE"] },
      2: { designed: true, rule: "Sentence-level cloze tasks using the same 1-25 band.", allowedFormats: ["SENTENCE_CLOZE", "CLOZE_CHOICE", "MULTIPLE_CHOICE"] }
    }
  },
  {
    skillId: "hfw_26_50",
    skillName: "High-Frequency Words 26-50",
    aliases: ["high-frequency words 26-50"],
    levels: {
      1: { designed: true, rule: "Recognition, listening, and simple cloze tasks for high-frequency words 26-50.", allowedFormats: ["LISTEN_FIND_WORD", "READ_FIND_WORD", "CLOZE_CHOICE", "SENTENCE_CLOZE", "COMPREHENSION", "MULTIPLE_CHOICE"] },
      2: { designed: true, rule: "Sentence-level cloze tasks using the 26-50 band.", allowedFormats: ["SENTENCE_CLOZE", "CLOZE_CHOICE", "MULTIPLE_CHOICE"] }
    }
  },
  {
    skillId: "hfw_51_100",
    skillName: "High-Frequency Words 51-100",
    aliases: ["high-frequency words 51-100", "high-frequency words 51-75", "high-frequency words 76-100"],
    levels: {
      1: { designed: true, rule: "Recognition and sentence-context tasks for high-frequency words 51-100.", allowedFormats: ["LISTEN_FIND_WORD", "READ_FIND_WORD", "CLOZE_CHOICE", "SENTENCE_CLOZE", "COMPREHENSION", "UNKNOWN", "MULTIPLE_CHOICE"] },
      2: { designed: true, rule: "Sentence-level cloze tasks using the 51-100 band.", allowedFormats: ["SENTENCE_CLOZE", "CLOZE_CHOICE", "MULTIPLE_CHOICE"] }
    }
  },
  {
    skillId: "blends",
    skillName: "Blends",
    aliases: ["blends"],
    levels: {
      1: { designed: true, rule: "Common initial blends.", allowedFormats: ["PICTURE_AUDIO_TO_PATTERN", "IMAGE_WORD_PATTERN_MATCH", "HEARD_WORD_TO_PRINT_MINIMAL_PAIR", "BLEND_SOUNDS", "MULTIPLE_CHOICE"] },
      2: { designed: true, rule: "Final blends and mixed blend discrimination.", allowedFormats: ["PICTURE_AUDIO_TO_PATTERN", "IMAGE_WORD_PATTERN_MATCH", "HEARD_WORD_TO_PRINT_MINIMAL_PAIR", "BLEND_SOUNDS", "MULTIPLE_CHOICE"] }
    }
  },
  {
    skillId: "digraphs",
    skillName: "Digraphs",
    aliases: ["digraphs"],
    levels: {
      1: { designed: true, rule: "sh,ch,th,wh recognition.", allowedFormats: ["PICTURE_AUDIO_TO_PATTERN", "IMAGE_WORD_PATTERN_MATCH", "HEARD_WORD_TO_PRINT_MINIMAL_PAIR", "MULTIPLE_CHOICE"] },
      2: { designed: true, rule: "Harder digraph discrimination and word matching.", allowedFormats: ["PICTURE_AUDIO_TO_PATTERN", "IMAGE_WORD_PATTERN_MATCH", "HEARD_WORD_TO_PRINT_MINIMAL_PAIR", "MULTIPLE_CHOICE"] }
    }
  },
  {
    skillId: "long_vowels_silent_e",
    skillName: "Long Vowels and Silent E",
    aliases: ["long vowels and silent e", "long vowels", "silent e"],
    levels: {
      1: { designed: true, rule: "Simple a_e, i_e, o_e, u_e, e_e.", allowedFormats: ["DECODING", "MULTIPLE_CHOICE"] },
      2: { designed: true, rule: "Short/long minimal-pair contrasts.", allowedFormats: ["DECODING", "MULTIPLE_CHOICE"] }
    }
  },
  {
    skillId: "vowel_teams",
    skillName: "Vowel Teams",
    aliases: ["vowel teams"],
    levels: {
      1: { designed: true, rule: "Common ai, ay, ee, ea, oa.", allowedFormats: ["DECODING", "MULTIPLE_CHOICE"] },
      2: { designed: true, rule: "oi, oy, ow, ou and ambiguous pairs.", allowedFormats: ["DECODING", "MULTIPLE_CHOICE"] }
    }
  },
  {
    skillId: "r_controlled_vowels",
    skillName: "R-Controlled Vowels",
    aliases: ["r-controlled vowels", "r controlled vowels"],
    levels: {
      1: { designed: true, rule: "ar, or, er/ir/ur basics.", allowedFormats: ["DECODING", "MULTIPLE_CHOICE"] },
      2: { designed: true, rule: "Mixed r-controlled word discrimination.", allowedFormats: ["DECODING", "MULTIPLE_CHOICE"] }
    }
  },
  ...[
    ["nouns", "Nouns"],
    ["verbs", "Verbs"],
    ["adjectives", "Adjectives"],
    ["prepositions_of_place", "Prepositions of Place"],
    ["plurals", "Plurals"],
    ["prefixes_suffixes", "Prefixes and Suffixes"],
    ["antonyms_synonyms", "Antonyms and Synonyms"],
    ["homophones_homonyms", "Homophones and Homonyms"],
    ["sentence_comprehension", "Sentence Comprehension"],
    ["key_details", "Key Details"],
    ["sequencing", "Sequencing"],
    ["main_idea", "Main Idea"],
    ["inference", "Inference"],
    ["cause_effect", "Cause and Effect"],
    ["context_clues", "Context Clues"],
    ["theme_higher_comprehension", "Theme and Higher Comprehension"]
  ].map(([skillId, skillName]) => ({
    skillId,
    skillName,
    aliases: [skillName.toLowerCase()],
    levels: {
      1: {
        designed: true,
        rule: "Concrete simple picture/sentence tasks with level-appropriate distractors.",
        allowedFormats: ["COMPREHENSION", "GRAMMAR_BASICS", "VOCABULARY_CATEGORY", "IMAGE_CHOICE", "PLURAL_IMAGE_SPELLING", "PLURAL_SPELLING_CONTEXT", "MORPHEME_MEANING_CONTEXT", "HOMOPHONE_MEANING", "SENTENCE_MATCHES_PICTURE", "FIX_SENTENCE", "UNKNOWN", "MULTIPLE_CHOICE"]
      },
      2: {
        designed: true,
        rule: "Harder distractors, multi-sentence context, inference/context, and more precise language use.",
        allowedFormats: ["COMPREHENSION", "GRAMMAR_BASICS", "VOCABULARY_CATEGORY", "IMAGE_CHOICE", "PLURAL_IMAGE_SPELLING", "PLURAL_SPELLING_CONTEXT", "MORPHEME_MEANING_CONTEXT", "HOMOPHONE_MEANING", "SENTENCE_MATCHES_PICTURE", "FIX_SENTENCE", "UNKNOWN", "MULTIPLE_CHOICE"]
      }
    }
  }))
];

export const managedAssessmentSkillDepthById = Object.fromEntries(
  managedAssessmentSkillDepthConfig.map(config => [config.skillId, config])
);
