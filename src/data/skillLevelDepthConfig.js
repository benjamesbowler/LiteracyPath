import {
  finalSoundExpectedItemKeys,
  finalSoundLevelTwoExpectedItemKeys,
  rhymingExpectedItemKeys,
  rhymingLevelTwoExpectedItemKeys
} from "./coverageExpectations.js";

export const SKILL_LEVEL_DEPTH_TARGETS = {
  phaseSize: 15,
  phaseBufferSize: 23,
  minimumPerLevel: 46,
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
      1: { designed: true, rule: "Image-context sentence cloze tasks for the first 25 high-frequency words.", allowedFormats: ["HFW_IMAGE_CONTEXT_CLOZE"] },
      2: { designed: true, rule: "Letter-build spelling tasks using the same 1-25 band.", allowedFormats: ["HFW_LETTER_BUILD"] }
    }
  },
  {
    skillId: "hfw_26_50",
    skillName: "High-Frequency Words 26-50",
    aliases: ["high-frequency words 26-50"],
    levels: {
      1: { designed: true, rule: "Image-context sentence cloze tasks for high-frequency words 26-50.", allowedFormats: ["HFW_IMAGE_CONTEXT_CLOZE"] },
      2: { designed: true, rule: "Letter-build spelling tasks using the 26-50 band.", allowedFormats: ["HFW_LETTER_BUILD"] }
    }
  },
  {
    skillId: "hfw_51_75",
    skillName: "High-Frequency Words 51-75",
    aliases: ["high-frequency words 51-75"],
    levels: {
      1: { designed: true, rule: "Image-context sentence cloze tasks for high-frequency words 51-75.", allowedFormats: ["HFW_IMAGE_CONTEXT_CLOZE"] },
      2: { designed: true, rule: "Letter-build spelling tasks using the 51-75 band.", allowedFormats: ["HFW_LETTER_BUILD"] }
    }
  },
  {
    skillId: "hfw_76_100",
    skillName: "High-Frequency Words 76-100",
    aliases: ["high-frequency words 76-100"],
    levels: {
      1: { designed: true, rule: "Image-context sentence cloze tasks for high-frequency words 76-100.", allowedFormats: ["HFW_IMAGE_CONTEXT_CLOZE"] },
      2: { designed: true, rule: "Letter-build spelling tasks using the 76-100 band.", allowedFormats: ["HFW_LETTER_BUILD"] }
    }
  },
  {
    skillId: "blends",
    skillName: "Blends",
    aliases: ["blends"],
    levels: {
      1: { designed: true, rule: "Beginning blend image-card word recognition only.", allowedFormats: ["BLEND_IMAGE_CHOICE"] },
      2: { designed: true, rule: "Beginning and ending blend completion from a picture and partial word.", allowedFormats: ["BLEND_COMPLETE_WORD"] }
    }
  },
  {
    skillId: "digraphs",
    skillName: "Digraphs",
    aliases: ["digraphs"],
    levels: {
      1: { designed: true, rule: "Image-card word recognition for the target digraph.", allowedFormats: ["DIGRAPH_IMAGE_CHOICE"] },
      2: { designed: true, rule: "Picture-backed word completion with the correct digraph.", allowedFormats: ["DIGRAPH_COMPLETE_WORD"] }
    }
  },
  {
    skillId: "long_vowels_silent_e",
    skillName: "Long Vowels and Silent E",
    aliases: ["long vowels and silent e", "long vowels", "silent e"],
    levels: {
      1: { designed: true, rule: "Image-backed silent-e pattern choice using a_e, e_e, i_e, o_e, and u_e.", allowedFormats: ["LONG_VOWEL_SILENT_E_PATTERN"] },
      2: { designed: true, rule: "Image-backed long-vowel spelling completion using vowel teams and related long-vowel spellings.", allowedFormats: ["LONG_VOWEL_TEAM_COMPLETE"] }
    }
  },
  {
    skillId: "vowel_teams",
    skillName: "Vowel Teams",
    aliases: ["vowel teams"],
    levels: {
      1: { designed: true, rule: "Image-backed vowel-team completion using common ai, ay, ee, ea, oa patterns.", allowedFormats: ["LONG_VOWEL_TEAM_COMPLETE"] },
      2: { designed: true, rule: "Image-backed vowel-team completion using oi, oy, ow, ou and ambiguous pairs; no silent-e items.", allowedFormats: ["LONG_VOWEL_TEAM_COMPLETE"] }
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
  {
    skillId: "nouns",
    skillName: "Nouns",
    aliases: ["nouns"],
    levels: {
      1: { designed: true, rule: "Choose the noun from four image cards with three non-noun distractors.", allowedFormats: ["GRAMMAR_IMAGE_CHOICE"] },
      2: { designed: true, rule: "Choose the noun that best completes an image-backed sentence from four audio-supported noun word tiles.", allowedFormats: ["GRAMMAR_SENTENCE_FIT"] }
    }
  },
  {
    skillId: "verbs",
    skillName: "Verbs",
    aliases: ["verbs"],
    levels: {
      1: { designed: true, rule: "Choose the verb from four image cards with three non-verb distractors.", allowedFormats: ["GRAMMAR_IMAGE_CHOICE"] },
      2: { designed: true, rule: "Choose the verb that best completes an image-backed sentence from four audio-supported verb word tiles.", allowedFormats: ["GRAMMAR_SENTENCE_FIT"] }
    }
  },
  {
    skillId: "adjectives",
    skillName: "Adjectives",
    aliases: ["adjectives"],
    levels: {
      1: { designed: true, rule: "Choose the adjective from four image cards with three non-adjective distractors.", allowedFormats: ["GRAMMAR_IMAGE_CHOICE"] },
      2: { designed: true, rule: "Choose the adjective that best completes an image-backed sentence from four audio-supported adjective word tiles.", allowedFormats: ["GRAMMAR_SENTENCE_FIT"] }
    }
  },
  ...[
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
