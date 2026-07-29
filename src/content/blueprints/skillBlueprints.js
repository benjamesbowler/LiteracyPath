// Skills Assessment Rebuild v3 — per-skill evidence blueprints.
//
// STANDARD (edited in place). Source of truth for: evidence units per level/phase,
// the unit mastery rule each skill uses, allowed formats, sitting sizes, and bank
// minimums. Authored from docs/skills-assessment-rebuild/BLUEPRINTS_*.md.
//
// Data-only module: safe to import from runtime, tools, and tests.
// Unit inventories that already existed in coverageExpectations.js are imported
// so there is exactly one copy of each list.

import {
  initialSoundExpectedItemKeys,
  finalSoundExpectedItemKeys,
  finalSoundLevelTwoExpectedItemKeys,
  cvcShortVowelExpectedItemKeys,
  rhymingExpectedItemKeys,
  rhymingLevelTwoExpectedItemKeys,
  rhymingPhaseItemKeysByLevel
} from "../../data/coverageExpectations.js";
import { hfwApprovedWordsBySkill } from "../../data/hfwApprovedCoverageWords.js";

export const ASSESSMENT_REBUILD_BANK_VERSION = 3;
export const ASSESSMENT_REBUILD_STANDARD_VERSION = "v3-2026.08";
// Every v3 item carries this source tag; runtime eligibility and the
// source-of-truth registry key on it.
export const V3_QUESTION_SOURCE = "skills_rebuild_v3_2026_08";

// Evidence-rule families (docs/skills-assessment-rebuild/MASTERY_SYSTEM.md §3).
// unitRule numbers are read by BOTH the legacy engine adapter
// (nextItemMasteryRow / isMasteryEligible) and skillStatusPolicy.
const D_SMALL = Object.freeze({
  family: "discrete",
  attemptsMin: 4,       // total scored attempts on the unit
  correctMin: 3,        // correct among them
  distinctItemsMin: 2,  // different published items
  sessionsMin: 2,       // distinct session days
  formatsMin: 2,        // distinct formats (per shipped media tier)
  latestMustBeCorrect: true
});
const D_LARGE = Object.freeze({
  family: "discrete",
  attemptsMin: 2,
  correctMin: 2,
  distinctItemsMin: 2,
  sessionsMin: 2,
  formatsMin: 1,
  latestMustBeCorrect: true
});
const C_CELL = Object.freeze({
  family: "cell",
  attemptsMin: 2,
  correctMin: 2,
  distinctItemsMin: 2,
  sessionsMin: 2,
  formatsMin: 1,
  latestMustBeCorrect: true
});

const half = (list) => {
  const mid = Math.ceil(list.length / 2);
  return [list.slice(0, mid), list.slice(mid)];
};
const phases = (list) => {
  const [p1, p2] = half(list);
  return { 1: p1, 2: p2 };
};

// Level-pass thresholds shared by every skill (MASTERY_SYSTEM §3.3).
export const LEVEL_PASS_RULE = Object.freeze({
  accuracyMin: 0.85,
  minScoredDiscrete: 20,
  minScoredCell: 16,
  latestSittingMin: 0.8,
  sessionsMin: 2
});
export const RETENTION_RULE = Object.freeze({
  items: 8, passMin: 7, minDaysAfterPass: 3
});

const bp = (skillId, config) => [skillId, Object.freeze({ skillId, ...config })];

export const skillBlueprints = Object.freeze(Object.fromEntries([
  // ---------------- Phonological (BLUEPRINTS_PHONOLOGICAL.md) ----------------
  bp("initial_sounds", {
    itemType: "initial_sound",
    unitRule: D_LARGE,
    sitting: 10,
    unitsByLevel: {
      1: initialSoundExpectedItemKeys,
      2: initialSoundExpectedItemKeys
    },
    phaseUnitsByLevel: {
      1: phases(initialSoundExpectedItemKeys),
      2: phases(initialSoundExpectedItemKeys)
    },
    formatsByLevel: {
      1: ["FIRST_SOUND", "INITIAL_SOUND_PAIR_SELECT"],
      2: ["FIRST_SOUND", "INITIAL_SOUND_PAIR_SELECT"]
    },
    variantsPerUnit: { 1: 3, 2: 3 },
    passBudgetSittings: 5
  }),
  bp("final_sounds", {
    itemType: "final_sound",
    unitRule: D_SMALL,
    sitting: 10,
    unitsByLevel: {
      1: finalSoundExpectedItemKeys,
      2: finalSoundLevelTwoExpectedItemKeys
    },
    phaseUnitsByLevel: {
      1: phases(finalSoundExpectedItemKeys),
      2: phases(finalSoundLevelTwoExpectedItemKeys)
    },
    formatsByLevel: {
      1: ["ENDING_SOUND", "FINAL_SOUND_PAIR_SELECT", "ENDING_SOUND_WORD_MATCH"],
      2: ["ENDING_SOUND", "FINAL_SOUND_PAIR_SELECT"]
    },
    // 4 variants (not 3): D-small demands 4 attempts on 2+ distinct items with
    // no repeats inside the pass budget — 3-item pools force a repeat (the same
    // arithmetic that sized digraphs at 4). Doc updated in the same change.
    variantsPerUnit: { 1: 4, 2: 4 },
    passBudgetSittings: 4
  }),
  bp("rhyming", {
    itemType: "rhyming_family",
    unitRule: D_LARGE,
    sitting: 8,
    unitsByLevel: {
      1: rhymingExpectedItemKeys,
      2: rhymingLevelTwoExpectedItemKeys
    },
    // Phase membership for rhyming is read by assessmentRuntime from
    // rhymingPhaseItemKeysByLevel — reuse it verbatim so they can never drift.
    phaseUnitsByLevel: rhymingPhaseItemKeysByLevel,
    formatsByLevel: {
      1: ["RHYME_MATCH_PICTURE"],
      2: ["READ_FIND_RHYME", "RHYME_ODD_ONE_OUT"]
    },
    variantsPerUnit: { 1: 3, 2: 3 },
    passBudgetSittings: 7,
    mediaTierNote: "print-pattern evidence until recorded audio ships"
  }),
  bp("cvc_short_vowels", {
    itemType: "short_vowel",
    unitRule: D_SMALL,
    sitting: 10,
    unitsByLevel: { 1: cvcShortVowelExpectedItemKeys, 2: cvcShortVowelExpectedItemKeys },
    phaseUnitsByLevel: {
      1: { 1: cvcShortVowelExpectedItemKeys, 2: cvcShortVowelExpectedItemKeys },
      2: { 1: cvcShortVowelExpectedItemKeys, 2: cvcShortVowelExpectedItemKeys }
    },
    formatsByLevel: {
      1: ["MISSING_VOWEL_CVC", "PICTURE_TO_PRINT_MATCH", "SHORT_VOWEL_WORD"],
      2: ["MISSING_VOWEL_CVC", "PICTURE_TO_PRINT_MATCH", "PUT_SOUNDS_IN_ORDER"]
    },
    variantsPerUnit: { 1: 6, 2: 6 },
    passBudgetSittings: 4
  }),
  bp("short_vowel_discrimination", {
    itemType: "short_vowel",
    unitRule: D_SMALL,
    sitting: 10,
    unitsByLevel: { 1: cvcShortVowelExpectedItemKeys, 2: cvcShortVowelExpectedItemKeys },
    phaseUnitsByLevel: {
      1: { 1: cvcShortVowelExpectedItemKeys, 2: cvcShortVowelExpectedItemKeys },
      2: { 1: cvcShortVowelExpectedItemKeys, 2: cvcShortVowelExpectedItemKeys }
    },
    formatsByLevel: {
      1: ["LISTEN_CHOOSE_VOWEL", "PICTURE_TO_PRINT_MATCH"],
      2: ["LISTEN_CHOOSE_VOWEL", "PICTURE_TO_PRINT_MATCH", "SHORT_VOWEL_IMAGE_GROUP_SELECT"]
    },
    variantsPerUnit: { 1: 6, 2: 6 },
    passBudgetSittings: 4
  }),

  // ---------------- HFW (BLUEPRINTS_HFW.md) ----------------
  ...["hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100"].map(skillId => bp(skillId, {
    itemType: "sight_word",
    unitRule: D_LARGE,
    sitting: 12,
    unitsByLevel: {
      1: hfwApprovedWordsBySkill[skillId],
      2: hfwApprovedWordsBySkill[skillId]
    },
    phaseUnitsByLevel: {
      1: phases(hfwApprovedWordsBySkill[skillId]),
      2: phases(hfwApprovedWordsBySkill[skillId])
    },
    formatsByLevel: {
      1: ["HFW_SENTENCE_CLOZE", "HFW_READ_FIND_WORD"],
      2: ["HFW_SENTENCE_SPELL_CONTEXT", "HFW_LETTER_BUILD"]
    },
    variantsPerUnit: { 1: 3, 2: 2 },
    passBudgetSittings: 5
  })),

  // ---------------- Phonics (BLUEPRINTS_PHONICS.md) ----------------
  bp("blends", {
    itemType: "phonics_pattern",
    unitRule: D_SMALL,
    sitting: 10,
    unitsByLevel: {
      1: ["bl", "cl", "fl", "pl", "sl", "br", "cr", "dr", "fr", "gr", "st", "sw"],
      2: ["sc", "sk", "sm", "sn", "sp", "tr", "nd", "nt", "mp", "nk", "lt", "ft"]
    },
    phaseUnitsByLevel: {
      1: phases(["bl", "cl", "fl", "pl", "sl", "br", "cr", "dr", "fr", "gr", "st", "sw"]),
      2: phases(["sc", "sk", "sm", "sn", "sp", "tr", "nd", "nt", "mp", "nk", "lt", "ft"])
    },
    formatsByLevel: {
      1: ["BLEND_IMAGE_CHOICE", "BLEND_COMPLETE_WORD", "MPD"],
      2: ["BLEND_COMPLETE_WORD", "MPD"]
    },
    variantsPerUnit: { 1: 3, 2: 3 },
    passBudgetSittings: 5
  }),
  bp("digraphs", {
    itemType: "phonics_pattern",
    unitRule: D_SMALL,
    sitting: 10,
    unitsByLevel: {
      1: ["ch", "sh", "th", "wh", "ph", "ck"],
      2: ["ch", "sh", "th", "wh", "ph", "ck"]
    },
    phaseUnitsByLevel: {
      1: { 1: ["ch", "sh", "th"], 2: ["wh", "ph", "ck"] },
      2: { 1: ["ch", "sh", "th"], 2: ["wh", "ph", "ck"] }
    },
    formatsByLevel: {
      1: ["DIGRAPH_IMAGE_CHOICE", "DIGRAPH_COMPLETE_WORD"],
      2: ["DIGRAPH_COMPLETE_WORD", "DIGRAPH_IMAGE_CHOICE"]
    },
    variantsPerUnit: { 1: 4, 2: 4 },
    // wh/ph have no child-appropriate final-position words; ck is final-only.
    positionExemptUnits: ["wh", "ph"],
    finalOnlyUnits: ["ck"],
    passBudgetSittings: 4
  }),
  bp("long_vowels_silent_e", {
    itemType: "phonics_pattern",
    unitRule: D_SMALL,
    sitting: 12,
    unitsByLevel: {
      1: ["a_e", "i_e", "o_e", "u_e"],
      2: ["a_e", "i_e", "o_e", "u_e"]
    },
    phaseUnitsByLevel: {
      1: { 1: ["a_e", "i_e"], 2: ["o_e", "u_e"] },
      2: { 1: ["a_e", "i_e"], 2: ["o_e", "u_e"] }
    },
    nonGatingUnits: ["e_e"],
    formatsByLevel: {
      1: ["LONG_VOWEL_SILENT_E_PATTERN", "SILENT_E_TRANSFORM"],
      2: ["CPS", "SILENT_E_TRANSFORM", "LONG_VOWEL_SILENT_E_PATTERN"]
    },
    variantsPerUnit: { 1: 6, 2: 6 },
    passBudgetSittings: 4
  }),
  bp("vowel_teams", {
    itemType: "phonics_pattern",
    unitRule: D_SMALL,
    sitting: 12,
    unitsByLevel: {
      1: ["ai", "ay", "ee", "ea", "oa", "igh"],
      2: ["oo", "ow", "ou", "oi", "oy", "ew", "aw"]
    },
    phaseUnitsByLevel: {
      1: { 1: ["ai", "ay", "ee"], 2: ["ea", "oa", "igh"] },
      2: { 1: ["oo", "ow", "ou"], 2: ["oi", "oy", "ew", "aw"] }
    },
    formatsByLevel: {
      1: ["LONG_VOWEL_TEAM_COMPLETE", "CPS", "PTD"],
      2: ["LONG_VOWEL_TEAM_COMPLETE", "CPS", "PTD"]
    },
    variantsPerUnit: { 1: 6, 2: 6 },
    passBudgetSittings: 4
  }),
  bp("r_controlled_vowels", {
    itemType: "phonics_pattern",
    unitRule: D_SMALL,
    sitting: 12,
    unitsByLevel: {
      1: ["ar", "or", "er", "ir", "ur"],
      2: ["ar", "or", "er", "ir", "ur"]
    },
    phaseUnitsByLevel: {
      1: { 1: ["ar", "or"], 2: ["er", "ir", "ur"] },
      2: { 1: ["ar", "or"], 2: ["er", "ir", "ur"] }
    },
    formatsByLevel: {
      1: ["R_CONTROLLED_PATTERN", "PICTURE_AUDIO_TO_PATTERN"],
      2: ["R_CONTROLLED_PATTERN", "CPS"]
    },
    variantsPerUnit: { 1: 6, 2: 6 },
    passBudgetSittings: 4
  }),

  // ---------------- Grammar & language (BLUEPRINTS_LANGUAGE.md) ----------------
  bp("nouns", {
    itemType: "grammar_concept",
    unitRule: D_SMALL,
    sitting: 8,
    unitsByLevel: {
      1: ["noun_person", "noun_animal", "noun_place", "noun_thing"],
      2: ["noun_in_sentence", "noun_vs_verb", "noun_two_step"]
    },
    phaseUnitsByLevel: {
      1: { 1: ["noun_person", "noun_animal"], 2: ["noun_place", "noun_thing"] },
      2: { 1: ["noun_in_sentence", "noun_vs_verb"], 2: ["noun_two_step"] }
    },
    formatsByLevel: {
      1: ["GRAMMAR_IMAGE_CHOICE", "GRAMMAR_WORD_CHOICE"],
      2: ["GRAMMAR_SENTENCE_FIT", "GRAMMAR_CONTRAST"]
    },
    variantsPerUnit: { 1: 6, 2: 8 },
    passBudgetSittings: 4
  }),
  bp("verbs", {
    itemType: "grammar_concept",
    unitRule: D_SMALL,
    sitting: 8,
    unitsByLevel: {
      1: ["verb_action_body", "verb_action_object", "verb_everyday"],
      2: ["verb_in_sentence", "verb_vs_noun", "verb_precision"]
    },
    phaseUnitsByLevel: {
      1: { 1: ["verb_action_body", "verb_action_object"], 2: ["verb_everyday"] },
      2: { 1: ["verb_in_sentence", "verb_vs_noun"], 2: ["verb_precision"] }
    },
    formatsByLevel: {
      1: ["GRAMMAR_IMAGE_CHOICE", "GRAMMAR_WORD_CHOICE"],
      2: ["GRAMMAR_SENTENCE_FIT", "GRAMMAR_CONTRAST"]
    },
    variantsPerUnit: { 1: 8, 2: 8 },
    passBudgetSittings: 4
  }),
  bp("adjectives", {
    itemType: "grammar_concept",
    unitRule: D_SMALL,
    sitting: 8,
    unitsByLevel: {
      1: ["adj_size", "adj_color", "adj_texture_state", "adj_feeling"],
      2: ["adj_in_sentence", "adj_precision", "adj_vs_noun_verb"]
    },
    phaseUnitsByLevel: {
      1: { 1: ["adj_size", "adj_color"], 2: ["adj_texture_state", "adj_feeling"] },
      2: { 1: ["adj_in_sentence", "adj_precision"], 2: ["adj_vs_noun_verb"] }
    },
    formatsByLevel: {
      1: ["GRAMMAR_IMAGE_CHOICE", "GRAMMAR_WORD_CHOICE"],
      2: ["GRAMMAR_SENTENCE_FIT", "GRAMMAR_CONTRAST"]
    },
    variantsPerUnit: { 1: 6, 2: 8 },
    passBudgetSittings: 4
  }),
  bp("prepositions_of_place", {
    itemType: "grammar_concept",
    unitRule: D_SMALL,
    sitting: 8,
    unitsByLevel: {
      1: ["in", "on", "under", "behind", "next_to", "between", "in_front_of", "above", "below"],
      2: ["over", "through", "near", "opposite", "among", "around", "inside_outside"]
    },
    phaseUnitsByLevel: {
      1: { 1: ["in", "on", "under", "behind", "next_to"], 2: ["between", "in_front_of", "above", "below"] },
      2: { 1: ["over", "through", "near", "opposite"], 2: ["among", "around", "inside_outside"] }
    },
    formatsByLevel: {
      1: ["PREPOSITION_SCENE_CHOICE", "PREPOSITION_TEXT_CHOICE"],
      2: ["PREPOSITION_SENTENCE_FIT", "PREPOSITION_PRECISION"]
    },
    variantsPerUnit: { 1: 3, 2: 4 },
    passBudgetSittings: 5
  }),
  bp("plurals", {
    itemType: "grammar_concept",
    unitRule: D_SMALL,
    sitting: 8,
    unitsByLevel: {
      1: ["plural_add_s", "plural_add_es", "plural_concept"],
      2: ["plural_y_to_ies", "plural_irregular", "plural_f_to_ves", "plural_in_sentence"]
    },
    phaseUnitsByLevel: {
      1: { 1: ["plural_add_s", "plural_concept"], 2: ["plural_add_es"] },
      2: { 1: ["plural_y_to_ies", "plural_irregular"], 2: ["plural_f_to_ves", "plural_in_sentence"] }
    },
    formatsByLevel: {
      1: ["PLURAL_IMAGE_SPELLING", "PLURAL_SPELLING_CONTEXT"],
      2: ["PLURAL_SPELLING_CONTEXT", "PLURAL_ERROR_SPOT", "PLURAL_TEXT_CHOICE"]
    },
    variantsPerUnit: { 1: 8, 2: 6 },
    passBudgetSittings: 4
  }),
  bp("prefixes_suffixes", {
    itemType: "morpheme",
    unitRule: D_SMALL,
    sitting: 10,
    unitsByLevel: {
      1: ["suffix_s_es", "suffix_ing", "suffix_ed", "suffix_er_person", "suffix_ful"],
      2: ["prefix_un", "prefix_re", "suffix_less", "suffix_er_est", "suffix_ly", "prefix_pre"]
    },
    phaseUnitsByLevel: {
      1: { 1: ["suffix_s_es", "suffix_ing", "suffix_ed"], 2: ["suffix_er_person", "suffix_ful"] },
      2: { 1: ["prefix_un", "prefix_re", "suffix_less"], 2: ["suffix_er_est", "suffix_ly", "prefix_pre"] }
    },
    formatsByLevel: {
      1: ["MORPHEME_BUILD", "MORPHEME_MEANING_CONTEXT"],
      2: ["MORPHEME_BUILD", "MORPHEME_MEANING_CONTEXT", "MORPHEME_TRANSFER"]
    },
    variantsPerUnit: { 1: 6, 2: 6 },
    passBudgetSittings: 4
  }),
  bp("antonyms_synonyms", {
    itemType: "word_relation",
    unitRule: D_SMALL,
    sitting: 8,
    unitsByLevel: {
      1: ["antonym_concrete", "synonym_concrete", "antonym_picture", "synonym_picture"],
      2: ["antonym_precise", "synonym_shade", "antonym_in_context", "synonym_in_context"]
    },
    phaseUnitsByLevel: {
      1: { 1: ["antonym_concrete", "synonym_concrete"], 2: ["antonym_picture", "synonym_picture"] },
      2: { 1: ["antonym_precise", "synonym_shade"], 2: ["antonym_in_context", "synonym_in_context"] }
    },
    formatsByLevel: {
      1: ["LANGUAGE_PAIR_TEXT_CHOICE", "GRAMMAR_IMAGE_CHOICE"],
      2: ["LANGUAGE_PAIR_TEXT_CHOICE", "WORD_IN_SENTENCE_SWAP"]
    },
    variantsPerUnit: { 1: 6, 2: 6 },
    passBudgetSittings: 4
  }),
  bp("homophones_homonyms", {
    itemType: "homophone_set",
    unitRule: D_SMALL,
    sitting: 8,
    unitsByLevel: {
      1: ["sea_see", "sun_son", "be_bee", "no_know", "one_won", "ate_eight", "hear_here", "blue_blew"],
      2: ["to_two_too", "there_their", "right_write", "new_knew", "hour_our", "flower_flour", "would_wood", "made_maid"]
    },
    phaseUnitsByLevel: {
      1: { 1: ["sea_see", "sun_son", "be_bee", "no_know"], 2: ["one_won", "ate_eight", "hear_here", "blue_blew"] },
      2: { 1: ["to_two_too", "there_their", "right_write", "new_knew"], 2: ["hour_our", "flower_flour", "would_wood", "made_maid"] }
    },
    nonGatingUnits: ["homonym_bat", "homonym_ring"],
    formatsByLevel: {
      1: ["HOMOPHONE_MEANING"],
      2: ["HOMOPHONE_CONTEXT_CLOZE"]
    },
    variantsPerUnit: { 1: 3, 2: 3 },
    passBudgetSittings: 4
  }),

  // ---------------- Comprehension (BLUEPRINTS_COMPREHENSION.md) ----------------
  ...[
    ["sentence_comprehension", {
      1: ["literal_who_what", "literal_where_when", "picture_match", "literal_action"],
      2: ["two_clause", "pronoun_reference", "best_restatement"]
    }],
    ["key_details", {
      1: ["who", "what_happened", "where", "number_detail"],
      2: ["detail_across_sentences", "which_is_not", "precise_detail"]
    }],
    ["sequencing", {
      1: ["first_event", "last_event", "middle_event"],
      2: ["before_after_relation", "implied_order", "process_order"]
    }],
    ["main_idea", {
      1: ["mostly_about_fiction", "mostly_about_info", "mostly_about_everyday"],
      2: ["best_title", "main_idea_vs_detail", "summary_choice"]
    }],
    ["inference", {
      1: ["feeling_from_evidence", "where_am_i", "what_happens_next"],
      2: ["why_did_they", "what_went_unsaid", "evidence_pick"]
    }],
    ["cause_effect", {
      1: ["find_effect", "find_cause", "because_sentence"],
      2: ["chain", "multiple_causes", "reversal_trap"]
    }],
    ["context_clues", {
      1: ["definition_clue", "example_clue", "action_clue"],
      2: ["synonym_clue", "antonym_contrast_clue", "inference_clue"]
    }],
    ["theme_higher_comprehension", {
      1: ["lesson_mistake_fixed", "lesson_kindness_returned", "lesson_effort_pays"],
      2: ["theme_among_rivals", "theme_vs_plot", "apply_theme"]
    }]
  ].map(([skillId, units]) => bp(skillId, {
    itemType: `${skillId}_cell`,
    unitRule: C_CELL,
    sitting: 8,
    unitsByLevel: { 1: units[1], 2: units[2] },
    // Comprehension cells are all live in both phases: items split across the
    // two phase pools by variant so every path step has a full-size pool, and
    // cell coverage is driven by the selector's least-evidence ordering.
    phaseUnitsByLevel: {
      1: { 1: units[1], 2: units[1] },
      2: { 1: units[2], 2: units[2] }
    },
    formatsByLevel: { 1: ["COMPREHENSION"], 2: ["COMPREHENSION"] },
    variantsPerUnit: { 1: 8, 2: 8 },
    passBudgetSittings: 4
  }))
]));

export function getSkillBlueprint(skillId = "") {
  return skillBlueprints[String(skillId || "").trim()] || null;
}

export function getBlueprintUnitRule(skillId = "", itemType = "") {
  const blueprint = getSkillBlueprint(skillId);
  if (!blueprint) return null;
  if (itemType && blueprint.itemType !== itemType) return null;
  return blueprint.unitRule;
}

// Resolve the blueprint that owns an evidence unit from (itemType, itemKey)
// alone — the shape the legacy mastery engine has at update time. Unit keys are
// disjoint within an itemType across blueprints (verified by the v3 gate), so
// this lookup is unambiguous.
export function getBlueprintByItem(itemType = "", itemKey = "") {
  const normalizedType = String(itemType || "").trim();
  const normalizedKey = String(itemKey || "").toLowerCase().trim();
  if (!normalizedType || !normalizedKey) return null;
  for (const blueprint of Object.values(skillBlueprints)) {
    if (blueprint.itemType !== normalizedType) continue;
    const inLevel1 = blueprint.unitsByLevel?.[1]?.includes(normalizedKey);
    const inLevel2 = blueprint.unitsByLevel?.[2]?.includes(normalizedKey);
    const nonGating = blueprint.nonGatingUnits?.includes(normalizedKey);
    if (inLevel1 || inLevel2 || nonGating) return blueprint;
  }
  return null;
}

export function getBlueprintUnitRuleByItem(itemType = "", itemKey = "") {
  return getBlueprintByItem(itemType, itemKey)?.unitRule || null;
}

export function isNonGatingUnit(skillId = "", itemKey = "") {
  const blueprint = getSkillBlueprint(skillId);
  return Boolean(blueprint?.nonGatingUnits?.includes(String(itemKey || "")));
}

export function getBlueprintSkillIds() {
  return Object.keys(skillBlueprints);
}
