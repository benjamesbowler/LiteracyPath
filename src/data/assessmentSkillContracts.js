import {
  cvcShortVowelExpectedItemKeys,
  finalSoundExpectedItemKeys,
  finalSoundLevelTwoExpectedItemKeys,
  initialSoundExpectedItemKeys,
  rhymingLevelTwoPendingMediaItemKeys,
  rhymingPhaseItemKeysByLevel,
  shortVowelDiscriminationPhaseItemKeysByLevel
} from "./coverageExpectations.js";
import {
  HFW_WORDS_1_25,
  HFW_WORDS_26_50,
  HFW_WORDS_51_75,
  HFW_WORDS_76_100
} from "./highFrequencyWordBands.js";
import { BEGINNING_BLEND_PATTERNS, ALL_BLEND_PATTERNS } from "./blendPatternData.js";
import { ALL_DIGRAPH_PATTERNS } from "./digraphPatternData.js";
import { SILENT_E_PATTERNS, LONG_VOWEL_TEAM_PATTERNS } from "./longVowelPatternData.js";

export const CONTRACT_INCOMPLETE_NEEDS_FORMAL_PHASE_MAP = "contract_incomplete_needs_formal_phase_map";

export const ASSESSMENT_CONTRACT_ROUND_SIZE = 15;

function normalizeList(values = []) {
  return [...new Set(values.map(value => String(value || "").toLowerCase().trim()).filter(Boolean))];
}

function phaseKey(level, phase) {
  return `L${level}P${phase}`;
}

function makePhase({
  level,
  phase,
  requiredTargets = [],
  requiredTargetType = "itemKey",
  allowedFormats = [],
  promptAudioRequired = false,
  answerImagesRequired = false,
  answerAudioRequired = false,
  minimumSelectableCount = ASSESSMENT_CONTRACT_ROUND_SIZE,
  roundSize = ASSESSMENT_CONTRACT_ROUND_SIZE,
  notes = ""
}) {
  return {
    level,
    phase,
    requiredTargets: normalizeList(requiredTargets),
    requiredTargetType,
    allowedFormats,
    promptAudioRequired,
    answerImagesRequired,
    answerAudioRequired,
    minimumSelectableCount,
    roundSize,
    notes
  };
}

function phaseMapToRequirements(phaseMap, config = {}) {
  const out = {};
  for (const [levelValue, phases] of Object.entries(phaseMap || {})) {
    const level = Number(levelValue);
    for (const [phaseValue, targets] of Object.entries(phases || {})) {
      const phase = Number(phaseValue);
      out[phaseKey(level, phase)] = makePhase({
        level,
        phase,
        requiredTargets: targets,
        ...config
      });
    }
  }
  return out;
}

function hfwPhaseRequirements(words) {
  const normalizedWords = normalizeList(words);
  return {
    L1P1: makePhase({
      level: 1,
      phase: 1,
      requiredTargets: normalizedWords,
      requiredTargetType: "sight_word",
      allowedFormats: ["HFW_IMAGE_CONTEXT_CLOZE"],
      notes: "Primary no-audio image-context cloze variant for every word in the band."
    }),
    L1P2: makePhase({
      level: 1,
      phase: 2,
      requiredTargets: normalizedWords,
      requiredTargetType: "sight_word",
      allowedFormats: ["HFW_IMAGE_CONTEXT_CLOZE"],
      notes: "Second no-audio image-context cloze variant for every word in the band."
    }),
    L2P1: makePhase({
      level: 2,
      phase: 1,
      requiredTargets: normalizedWords,
      requiredTargetType: "sight_word",
      allowedFormats: ["HFW_LETTER_BUILD"],
      notes: "Primary letter-build spelling variant for every word in the band."
    }),
    L2P2: makePhase({
      level: 2,
      phase: 2,
      requiredTargets: normalizedWords,
      requiredTargetType: "sight_word",
      allowedFormats: ["HFW_LETTER_BUILD"],
      notes: "Second letter-build spelling variant for every word in the band."
    })
  };
}

function baseContract(overrides) {
  return {
    status: "complete",
    incompleteReason: "",
    roundSize: ASSESSMENT_CONTRACT_ROUND_SIZE,
    minimumSelectableCountPerPhase: ASSESSMENT_CONTRACT_ROUND_SIZE,
    promptAudioRequired: false,
    answerImagesRequired: false,
    answerAudioRequired: false,
    allowedWordPatterns: [],
    forbiddenPatterns: [],
    duplicateTargetTemplatePairsForbidden: true,
    qaBlockedMediaMustFail: true,
    fakeCompoundsNonWordsMustFail: true,
    obscureWordsMustFail: true,
    forbidCoverageTargetsOutsideAssignedPhase: false,
    pendingMediaItems: [],
    phases: {},
    notes: "",
    ...overrides
  };
}

function incompleteContract({
  skillId,
  displayName,
  aliases = [],
  knownLevelTargets = {},
  allowedWordPatterns = [],
  forbiddenPatterns = [],
  notes = ""
}) {
  return baseContract({
    skillId,
    displayName,
    aliases,
    status: "incomplete",
    incompleteReason: CONTRACT_INCOMPLETE_NEEDS_FORMAL_PHASE_MAP,
    knownLevelTargets,
    allowedWordPatterns,
    forbiddenPatterns,
    phases: {
      L1P1: makePhase({ level: 1, phase: 1, notes: CONTRACT_INCOMPLETE_NEEDS_FORMAL_PHASE_MAP }),
      L1P2: makePhase({ level: 1, phase: 2, notes: CONTRACT_INCOMPLETE_NEEDS_FORMAL_PHASE_MAP }),
      L2P1: makePhase({ level: 2, phase: 1, notes: CONTRACT_INCOMPLETE_NEEDS_FORMAL_PHASE_MAP }),
      L2P2: makePhase({ level: 2, phase: 2, notes: CONTRACT_INCOMPLETE_NEEDS_FORMAL_PHASE_MAP })
    },
    notes
  });
}

function hfwContract(skillId, displayName, words) {
  return baseContract({
    skillId,
    displayName,
    aliases: [displayName.toLowerCase(), skillId.replace(/_/g, "-")],
    allowedWordPatterns: ["high_frequency_word_band_member"],
    forbiddenPatterns: ["phonics_template", "audio_prompted_hfw", "ambiguous_article_cloze"],
    duplicateTargetTemplatePairsForbidden: true,
    qaBlockedMediaMustFail: true,
    fakeCompoundsNonWordsMustFail: true,
    obscureWordsMustFail: true,
    phases: hfwPhaseRequirements(words),
    notes: "HFW live assessment is deliberately no-audio: Level 1 uses image-context cloze; Level 2 uses letter-build spelling."
  });
}

export const assessmentSkillContracts = [
  incompleteContract({
    skillId: "initial_sounds",
    displayName: "Initial Sounds",
    aliases: ["initial sounds"],
    knownLevelTargets: { 1: initialSoundExpectedItemKeys, 2: initialSoundExpectedItemKeys },
    allowedWordPatterns: ["clear_initial_sound", "imageable_word"],
    forbiddenPatterns: ["x_as_z_initial", "blend_as_single_initial", "digraph_as_single_initial"],
    notes: "Runtime has level depth rules, but no committed 2x2 phase target map yet."
  }),
  incompleteContract({
    skillId: "final_sounds",
    displayName: "Final Sounds",
    aliases: ["final sounds", "ending sounds"],
    knownLevelTargets: { 1: finalSoundExpectedItemKeys, 2: finalSoundLevelTwoExpectedItemKeys },
    allowedWordPatterns: ["single_final_consonant_level_1", "advanced_final_pattern_level_2"],
    forbiddenPatterns: ["level_2_final_pattern_in_level_1"],
    notes: "Level targets are known, but the formal Level 1/2 phase split is not centrally declared."
  }),
  baseContract({
    skillId: "rhyming",
    displayName: "Rhyming",
    aliases: ["rhyming", "rhyming words"],
    answerImagesRequired: true,
    allowedWordPatterns: ["image_backed_rime_family"],
    forbiddenPatterns: ["text_only_rhyme", "non_word_rhyme", "single_answer_image_gap"],
    duplicateTargetTemplatePairsForbidden: false,
    forbidCoverageTargetsOutsideAssignedPhase: true,
    pendingMediaItems: rhymingLevelTwoPendingMediaItemKeys.map(itemKey => ({ level: 2, itemKey, reason: "pending_media" })),
    phases: phaseMapToRequirements(rhymingPhaseItemKeysByLevel, {
      requiredTargetType: "rhyming_family",
      allowedFormats: ["RHYMING_PICTURE"],
      answerImagesRequired: true,
      notes: "Formal rhyming phase map from coverageExpectations. ank/unk are documented as pending media and excluded from active Level 2 requirements."
    }),
    notes: "Formal 2x2 rhyming contract is active. Level 2 ank/unk remain honest pending-media items, not padded."
  }),
  incompleteContract({
    skillId: "cvc_short_vowels",
    displayName: "CVC and Short Vowels",
    aliases: ["cvc short vowels", "cvc and short vowels"],
    knownLevelTargets: { 1: cvcShortVowelExpectedItemKeys, 2: cvcShortVowelExpectedItemKeys },
    allowedWordPatterns: ["cvc_short_vowel", "ccvc_short_vowel", "cvcc_short_vowel"],
    forbiddenPatterns: ["long_vowel", "r_controlled", "vowel_team", "fake_cvc"],
    notes: "Coverage targets are known, but a formal 2x2 phase map has not been declared."
  }),
  baseContract({
    skillId: "short_vowel_discrimination",
    displayName: "Short Vowel Discrimination",
    aliases: ["short vowel discrimination"],
    promptAudioRequired: false,
    answerImagesRequired: false,
    answerAudioRequired: false,
    allowedWordPatterns: ["short_vowel_word", "image_backed_target_word"],
    forbiddenPatterns: ["long_vowel", "r_controlled", "vowel_team", "non_word"],
    duplicateTargetTemplatePairsForbidden: true,
    phases: phaseMapToRequirements(shortVowelDiscriminationPhaseItemKeysByLevel, {
      requiredTargetType: "short_vowel",
      allowedFormats: ["LISTEN_CHOOSE_VOWEL", "PICTURE_TO_PRINT_MATCH"],
      notes: "Each phase must cover all five short-vowel targets with runtime-selectable media-backed questions."
    }),
    notes: "Formal SVD 2x2 contract is active."
  }),
  hfwContract("hfw_1_25", "High-Frequency Words 1-25", HFW_WORDS_1_25),
  hfwContract("hfw_26_50", "High-Frequency Words 26-50", HFW_WORDS_26_50),
  hfwContract("hfw_51_75", "High-Frequency Words 51-75", HFW_WORDS_51_75),
  hfwContract("hfw_76_100", "High-Frequency Words 76-100", HFW_WORDS_76_100),
  incompleteContract({
    skillId: "blends",
    displayName: "Blends",
    aliases: ["blends"],
    knownLevelTargets: { 1: BEGINNING_BLEND_PATTERNS, 2: ALL_BLEND_PATTERNS },
    allowedWordPatterns: ["beginning_blend", "ending_blend"],
    forbiddenPatterns: ["digraph_only", "fake_blend_word"],
    notes: "Blend level targets exist, but no formal 2x2 phase map has been committed."
  }),
  incompleteContract({
    skillId: "digraphs",
    displayName: "Digraphs",
    aliases: ["digraphs"],
    knownLevelTargets: { 1: ALL_DIGRAPH_PATTERNS, 2: ALL_DIGRAPH_PATTERNS },
    allowedWordPatterns: ["digraph_word"],
    forbiddenPatterns: ["blend_only", "fake_digraph_word"],
    notes: "Digraph targets exist, but no formal 2x2 phase map has been committed."
  }),
  incompleteContract({
    skillId: "long_vowels_silent_e",
    displayName: "Long Vowels / Silent E",
    aliases: ["long vowels", "silent e", "long vowels and silent e", "long_vowels"],
    knownLevelTargets: { 1: SILENT_E_PATTERNS, 2: LONG_VOWEL_TEAM_PATTERNS },
    allowedWordPatterns: ["silent_e", "long_vowel_team"],
    forbiddenPatterns: ["short_vowel_only", "r_controlled_only"],
    notes: "Runtime uses skill id long_vowels_silent_e; formal 2x2 phase map is still missing."
  }),
  incompleteContract({
    skillId: "vowel_teams",
    displayName: "Vowel Teams",
    aliases: ["vowel teams"],
    allowedWordPatterns: ["vowel_team"],
    forbiddenPatterns: ["silent_e_only", "short_vowel_only"],
    notes: "No central formal 2x2 vowel-team phase map exists yet."
  }),
  incompleteContract({
    skillId: "r_controlled",
    displayName: "R-Controlled Vowels",
    aliases: ["r-controlled vowels", "r controlled vowels"],
    knownLevelTargets: { 1: ["ar", "or", "er", "ir", "ur"], 2: ["ar", "or", "er", "ir", "ur"] },
    allowedWordPatterns: ["r_controlled_vowel"],
    forbiddenPatterns: ["plain_short_vowel_only"],
    notes: "Runtime uses skill id r_controlled; formal 2x2 phase map is still missing."
  }),
  incompleteContract({
    skillId: "nouns",
    displayName: "Nouns",
    aliases: ["nouns"],
    allowedWordPatterns: ["concrete_noun", "imageable_noun"],
    forbiddenPatterns: ["verb_as_noun_answer", "adjective_as_noun_answer"],
    notes: "Grammar contracts need a formal category/phase map before this can pass."
  }),
  incompleteContract({
    skillId: "verbs",
    displayName: "Verbs",
    aliases: ["verbs"],
    allowedWordPatterns: ["action_verb", "imageable_verb"],
    forbiddenPatterns: ["noun_as_verb_answer", "adjective_as_verb_answer"],
    notes: "Grammar contracts need a formal category/phase map before this can pass."
  }),
  incompleteContract({
    skillId: "adjectives",
    displayName: "Adjectives",
    aliases: ["adjectives"],
    allowedWordPatterns: ["imageable_adjective"],
    forbiddenPatterns: ["noun_as_adjective_answer", "verb_as_adjective_answer"],
    notes: "Grammar contracts need a formal category/phase map before this can pass."
  }),
  incompleteContract({
    skillId: "prepositions",
    displayName: "Prepositions of Place",
    aliases: ["prepositions", "prepositions of place", "prepositions_of_place"],
    allowedWordPatterns: ["spatial_preposition"],
    forbiddenPatterns: ["non_spatial_preposition"],
    notes: "Runtime uses skill id prepositions; formal 2x2 phase map is still missing."
  }),
  incompleteContract({
    skillId: "plurals",
    displayName: "Plurals",
    aliases: ["plurals"],
    allowedWordPatterns: ["regular_plural", "common_irregular_plural"],
    forbiddenPatterns: ["fake_plural", "unimageable_plural"],
    notes: "Plural contracts need a formal phase map of plural patterns before this can pass."
  }),
  incompleteContract({
    skillId: "antonyms_synonyms",
    displayName: "Antonyms / Synonyms",
    aliases: ["antonyms", "synonyms", "antonyms and synonyms"],
    allowedWordPatterns: ["grade_appropriate_antonym", "grade_appropriate_synonym"],
    forbiddenPatterns: ["obscure_word_pair", "ambiguous_word_pair"],
    notes: "Antonym/synonym contracts need formal category and phase targets before this can pass."
  })
];

export const assessmentSkillContractsById = Object.fromEntries(
  assessmentSkillContracts.map(contract => [contract.skillId, contract])
);
