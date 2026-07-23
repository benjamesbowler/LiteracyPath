import { skillTree } from "../skillTree.js";
import { resolveAssessmentSkillId } from "./assessmentSkillMapping.js";
import { enrichInitialSoundPairQuestion } from "./initialSoundPairAssets.js";
import { enrichListenAndFindWordQuestion } from "./listenAndFindAssets.js";
import { enrichQuestionWithExistingMedia } from "./questionMediaResolver.js";
import { normalizeRhymingQuestionChoices } from "./rhymingDistractors.js";
import {
  getRuntimeSourceIssues,
  sourceFileByBankName
} from "./sourceOfTruthRegistry.js";

const ASSESSMENT_SKILL_GROUPS = [
  {
    id: "early_phonics",
    label: "Early Phonics",
    skillIds: [
      "initial_sounds",
      "final_sounds",
      "rhyming",
      "cvc_short_vowels",
      "short_vowel_discrimination"
    ]
  },
  {
    id: "hfw",
    label: "High-Frequency Words",
    skillIds: [
      "hfw_1_25",
      "hfw_26_50",
      "hfw_51_75",
      "hfw_76_100"
    ]
  },
  {
    id: "replacement_phonics",
    label: "Replacement Phonics",
    skillIds: [
      "blends",
      "digraphs",
      "long_vowels_silent_e",
      "vowel_teams",
      "r_controlled_vowels"
    ]
  },
  {
    id: "grammar_language",
    label: "Grammar & Language",
    skillIds: [
      "nouns",
      "verbs",
      "adjectives",
      "prepositions_of_place",
      "plurals",
      "prefixes_suffixes",
      "antonyms_synonyms",
      "homophones_homonyms"
    ]
  },
  {
    id: "comprehension",
    label: "Comprehension",
    skillIds: [
      "sentence_comprehension",
      "key_details",
      "sequencing",
      "main_idea",
      "inference",
      "cause_effect",
      "context_clues",
      "theme_higher_comprehension"
    ]
  }
];

const SKILL_ALIASES = {
  long_vowels: "long_vowels_silent_e",
  r_controlled: "r_controlled_vowels",
  prepositions: "prepositions_of_place",
  prefix_suffix: "prefixes_suffixes",
  homophones: "homophones_homonyms",
  theme: "theme_higher_comprehension"
};

const RUNTIME_SKILL_IDS = {
  long_vowels_silent_e: "long_vowels",
  r_controlled_vowels: "r_controlled",
  prepositions_of_place: "prepositions",
  prefixes_suffixes: "prefix_suffix",
  homophones_homonyms: "homophones",
  theme_higher_comprehension: "theme"
};

const GRAMMAR_SENTENCE_FIT_SKILLS = new Set(["nouns", "verbs", "adjectives", "adverbs"]);
const EARLY_PHONICS_GENERATED_SKILLS = new Set([
  "final_sounds",
  "rhyming",
  "cvc_short_vowels",
  "short_vowel_discrimination"
]);
const HFW_SKILLS = new Set(["hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100"]);
const REPLACEMENT_PHONICS_SKILLS = new Set([
  "blends",
  "digraphs",
  "long_vowels_silent_e",
  "long_vowels",
  "vowel_teams",
  "r_controlled_vowels",
  "r_controlled"
]);
const LANGUAGE_SKILLS = new Set([
  "nouns",
  "verbs",
  "adjectives",
  "prepositions_of_place",
  "prepositions",
  "plurals",
  "prefixes_suffixes",
  "prefix_suffix",
  "antonyms_synonyms",
  "homophones_homonyms",
  "homophones"
]);
const COMPREHENSION_SKILLS = new Set([
  "sentence_comprehension",
  "key_details",
  "sequencing",
  "main_idea",
  "inference",
  "cause_effect",
  "context_clues",
  "theme_higher_comprehension",
  "theme"
]);
const AUTHORED_COMPREHENSION_BANKS = new Set([
  "qbAssess_main_idea",
  "qbAssess_cause_effect",
  "qbAssess_sequencing"
]);

function hasQuestionImage(question = {}) {
  return Boolean(
    question.imagePath ||
    question.imageUrl ||
    question.targetImage ||
    question.targetImagePath ||
    question.targetImageUrl ||
    question.image
  );
}

function isGrammarSentenceFitRuntimeQuestion(question = {}) {
  const format = String(question.formatType || question.templateType || "").toUpperCase();
  const answerOptions = Array.isArray(question.answerOptions) ? question.answerOptions : [];
  return (
    format === "GRAMMAR_SENTENCE_FIT" &&
    question.questionType === "ixl_template" &&
    hasQuestionImage(question) &&
    answerOptions.length === 4
  );
}

// Hand-written expansion banks, imported lazily per assessment skill family so
// the first question of a skill only downloads that family's banks (~kB scale)
// instead of the full ~1.5MB static set.
//
// IMPORTANT invariants (per-skill pool contents must stay byte-identical):
// - Entries stay in the exact order of the old static QUESTION_BANKS list.
//   dedupeQuestions keeps the FIRST occurrence of a duplicate key, so
//   reordering entries can change which duplicate record survives.
// - `families` lists every assessment skill group a bank contains questions
//   for (derived from bank contents, 2026-07-10). Duplicate keys always share
//   a skill id, so skipping banks with no questions for the requested family
//   cannot change dedupe results for that family.
// - If a bank gains questions for a new family, add that family here, then
//   run `npm run audit:checkpoints` and compare per-skill pool counts.
const EXPANSION_BANK_LOADERS = [
  {
    source: "masteryCoreQuestions",
    families: ["early_phonics"],
    load: () => import("./masteryCoreQuestions.js").then(module => module.masteryCoreQuestions)
  },
  {
    source: "masteryExtraQuestions",
    families: ["early_phonics"],
    load: () => import("./masteryExtraQuestions.js").then(module => module.masteryExtraQuestions)
  },
  {
    source: "initialSoundCoverageQuestions",
    families: ["early_phonics"],
    load: () => import("./initialSoundCoverageQuestions.js").then(module => module.initialSoundCoverageQuestions)
  },
  {
    source: "finalSoundCoverageQuestions",
    families: ["early_phonics"],
    load: () => import("./finalSoundCoverageQuestions.js").then(module => module.finalSoundCoverageQuestions)
  },
  {
    source: "rhymingCoverageQuestions",
    families: ["early_phonics"],
    load: () => import("./rhymingCoverageQuestions.js").then(module => module.rhymingCoverageQuestions)
  },
  {
    source: "cvcShortVowelExpansionQuestions",
    families: ["early_phonics"],
    load: () => import("./cvcShortVowelExpansionQuestions.js").then(module => module.cvcShortVowelExpansionQuestions)
  },
  {
    source: "contentExpansionPass3Questions",
    families: ["early_phonics", "hfw", "replacement_phonics", "grammar_language", "comprehension"],
    load: () => import("./contentExpansionPass3Questions.js").then(module => module.contentExpansionPass3Questions)
  },
  {
    source: "targetedContentRecoveryQuestions",
    families: ["early_phonics", "replacement_phonics"],
    load: () => import("./targetedContentRecoveryQuestions.js").then(module => module.targetedContentRecoveryQuestions)
  },
  {
    source: "kimiDataset7RuntimeQuestions",
    families: ["early_phonics"],
    load: () => import("./kimiDataset7RuntimeQuestions.js").then(module => module.kimiDataset7RuntimeQuestions)
  },
  {
    source: "ixlStyleSeedQuestions",
    families: ["early_phonics", "replacement_phonics", "grammar_language", "comprehension"],
    load: () => import("./ixlStyleSeedQuestions.js").then(module => module.ixlStyleSeedQuestions)
  },
  {
    source: "safeContentExpansionQuestions",
    families: ["replacement_phonics", "grammar_language"],
    load: () => import("./safeContentExpansionQuestions.js").then(module => module.safeContentExpansionQuestions)
  },
  {
    source: "templateQuestions",
    families: ["early_phonics", "grammar_language"],
    load: () => import("./templateQuestions.js").then(module => module.templateQuestions)
  },
  {
    source: "templateExpansion",
    families: ["hfw", "replacement_phonics", "grammar_language", "comprehension"],
    load: () => import("./templateExpansion.js").then(module => module.templateExpansion)
  },
  {
    source: "templateExpansion2",
    families: ["early_phonics", "replacement_phonics", "grammar_language", "comprehension"],
    load: () => import("./templateExpansion2.js").then(module => module.templateExpansion2)
  },
  {
    source: "templateExpansion3",
    families: ["replacement_phonics", "grammar_language", "comprehension"],
    load: () => import("./templateExpansion3.js").then(module => module.templateExpansion3)
  },
  {
    source: "templateExpansion4",
    families: ["early_phonics", "grammar_language", "comprehension"],
    load: () => import("./templateExpansion4.js").then(module => module.templateExpansion4)
  },
  {
    source: "templateExpansion5",
    families: ["early_phonics", "replacement_phonics", "comprehension"],
    load: () => import("./templateExpansion5.js").then(module => module.templateExpansion5)
  },
  {
    source: "templateExpansion6",
    families: ["early_phonics", "replacement_phonics", "grammar_language", "comprehension"],
    load: () => import("./templateExpansion6.js").then(module => module.templateExpansion6)
  },
  {
    source: "templateExpansion7",
    families: ["early_phonics", "hfw", "replacement_phonics", "grammar_language", "comprehension"],
    load: () => import("./templateExpansion7.js").then(module => module.templateExpansion7)
  },
  {
    source: "questionBankExpansion8",
    families: ["early_phonics", "replacement_phonics", "grammar_language", "comprehension"],
    load: () => import("./questionBankExpansion8.js").then(module => module.questionBankExpansion8)
  },
  {
    source: "questionBankExpansion10",
    families: ["replacement_phonics", "grammar_language"],
    load: () => import("./questionBankExpansion10.js").then(module => module.questionBankExpansion10)
  },
  {
    source: "questionBankExpansion11",
    families: ["grammar_language"],
    load: () => import("./questionBankExpansion11.js").then(module => module.questionBankExpansion11)
  },
  {
    source: "questionBankExpansion12",
    families: ["early_phonics", "replacement_phonics"],
    load: () => import("./questionBankExpansion12.js").then(module => module.questionBankExpansion12)
  },
  {
    source: "questionBankExpansion13",
    families: ["comprehension"],
    load: () => import("./questionBankExpansion13.js").then(module => module.questionBankExpansion13)
  },
  {
    source: "questionBankExpansion14",
    families: ["comprehension"],
    load: () => import("./questionBankExpansion14.js").then(module => module.questionBankExpansion14)
  },
  {
    source: "qbAssess_svd",
    families: ["early_phonics"],
    load: () => import("./qbAssess_svd.js").then(module => module.qbAssess_svd)
  },
  {
    source: "qbAssess_sc",
    families: ["comprehension"],
    load: () => import("./qbAssess_sc.js").then(module => module.qbAssess_sc)
  },
  {
    source: "qbAssess_rc",
    families: ["comprehension"],
    load: () => import("./qbAssess_rc.js").then(module => module.qbAssess_rc)
  },
  {
    source: "qbAssess_inf",
    families: ["comprehension"],
    load: () => import("./qbAssess_inf.js").then(module => module.qbAssess_inf)
  },
  {
    source: "qbAssess_main_idea",
    families: ["comprehension"],
    load: () => import("./qbAssess_main_idea.js").then(module => module.qbAssess_main_idea)
  },
  {
    source: "qbAssess_cause_effect",
    families: ["comprehension"],
    load: () => import("./qbAssess_cause_effect.js").then(module => module.qbAssess_cause_effect)
  },
  {
    source: "qbAssess_sequencing",
    families: ["comprehension"],
    load: () => import("./qbAssess_sequencing.js").then(module => module.qbAssess_sequencing)
  },
  {
    source: "qbFillGaps",
    families: ["replacement_phonics", "grammar_language"],
    load: () => import("./qbFillGaps.js").then(module => module.qbFillGaps)
  },
  {
    source: "assessmentQaReplacementQuestions",
    families: ["replacement_phonics", "grammar_language"],
    load: () => import("./assessmentQaReplacementQuestions.js").then(module => module.assessmentQaReplacementQuestions)
  },
  {
    source: "highQualityComprehensionReplacementQuestions",
    families: ["comprehension"],
    load: () => import("./highQualityComprehensionReplacements.js").then(module => module.highQualityComprehensionReplacementQuestions)
  },
  {
    source: "generatedQuestions",
    families: ["early_phonics", "replacement_phonics", "grammar_language", "comprehension"],
    load: () => import("./generatedQuestions.js").then(module => module.generatedQuestions)
  },
  {
    source: "fixSentenceQuestions",
    families: ["comprehension"],
    load: () => import("./fixSentenceQuestions.js").then(module => module.fixSentenceQuestions)
  },
  {
    source: "templateComprehensionAdvanced",
    families: ["comprehension"],
    load: () => import("./templateComprehensionAdvanced.js").then(module => module.templateComprehensionAdvanced)
  }
];

const dynamicBankCache = new Map();
const skillBankCache = new Map();

function normalizeSkillId(value = "") {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return SKILL_ALIASES[normalized] || normalized;
}

function runtimeSkillIdFor(skillId = "") {
  const normalized = normalizeSkillId(skillId);
  return RUNTIME_SKILL_IDS[normalized] || normalized;
}

function groupForSkill(skillId = "") {
  const normalized = normalizeSkillId(skillId);
  return ASSESSMENT_SKILL_GROUPS.find(group => group.skillIds.includes(normalized)) || null;
}

function getQuestionSkillId(question = {}) {
  const direct = normalizeSkillId(question.assessmentSkillId || question.skillId || question.skill_id || "");
  if (groupForSkill(direct)) return direct;
  const resolved = resolveAssessmentSkillId(question);
  return normalizeSkillId(resolved);
}

function normalizeQuestion(question = {}, source = "", sourceIndex = 0) {
  const enriched = enrichQuestionWithExistingMedia(
    enrichInitialSoundPairQuestion(enrichListenAndFindWordQuestion(question))
  );
  const skillId = getQuestionSkillId(enriched);
  const approvedSource = AUTHORED_COMPREHENSION_BANKS.has(source)
    ? "high_quality_comprehension_replacement_2026_06"
    : enriched.source;
  return normalizeRhymingQuestionChoices({
    ...enriched,
    source: approvedSource || enriched.source,
    skillId: runtimeSkillIdFor(skillId) || enriched.skillId || enriched.skill_id || "",
    assessmentSkillId: skillId,
    _source: source,
    _sourceFile: sourceFileByBankName[source] || "",
    _sourceIndex: sourceIndex
  });
}

function normalizeQuestionBank(source, bank = []) {
  return bank.map((question, index) => normalizeQuestion(question, source, index));
}

function expansionBankAppliesToSkill(families = [], skillId = "") {
  const group = groupForSkill(skillId);
  // Unknown or legacy skill ids (e.g. hfw_51_100, "") load every hand-written
  // bank, matching the previous behavior where all of them were always loaded.
  if (!group) return true;
  return families.includes(group.id);
}

function shouldLoadForSkill(skillId, aliases = []) {
  return aliases.some(alias => normalizeSkillId(alias) === skillId || runtimeSkillIdFor(alias) === skillId);
}

const DYNAMIC_BANK_LOADERS = [
  // The four generated early-skill banks are loaded per skill instead of via
  // the earlySkillQuestions.generated.js barrel, so e.g. rhyming does not pull
  // the CVC/final-sound/short-vowel megabanks. `bankName` keeps `_source` /
  // `_sourceFile` identical to the old barrel import (sourceOfTruthRegistry
  // keys on that name), and entry order matches the barrel's spread order.
  {
    source: "finalSoundsGeneratedQuestions",
    bankName: "generatedEarlySkillQuestions",
    shouldLoad: skillId => skillId === "final_sounds",
    load: () => import("./generated/finalSounds.generated.js").then(module => module.finalSoundsGeneratedQuestions)
  },
  {
    source: "cvcGeneratedQuestions",
    bankName: "generatedEarlySkillQuestions",
    shouldLoad: skillId => skillId === "cvc_short_vowels",
    load: () => import("./generated/cvc.generated.js").then(module => module.cvcGeneratedQuestions)
  },
  {
    source: "shortVowelGeneratedQuestions",
    bankName: "generatedEarlySkillQuestions",
    shouldLoad: skillId => skillId === "short_vowel_discrimination",
    load: () => import("./generated/shortVowel.generated.js").then(module => module.shortVowelGeneratedQuestions)
  },
  {
    source: "rhymingGeneratedQuestions",
    bankName: "generatedEarlySkillQuestions",
    shouldLoad: skillId => skillId === "rhyming",
    load: () => import("./generated/rhyming.generated.js").then(module => module.rhymingGeneratedQuestions)
  },
  {
    source: "hfwAssessmentQuestions",
    shouldLoad: skillId => HFW_SKILLS.has(skillId),
    load: () => import("./generated/hfwAssessmentQuestions.generated.js").then(module => module.hfwAssessmentQuestions)
  },
  {
    source: "hfwLevel2Questions",
    shouldLoad: skillId => HFW_SKILLS.has(skillId),
    load: () => import("./generated/hfwLevel2Questions.generated.js").then(module => module.hfwLevel2Questions)
  },
  {
    source: "firstTenSkillTopUpQuestions",
    shouldLoad: skillId => skillId === "blends",
    load: () => import("./generated/firstTenSkillTopUpQuestions.generated.js").then(module => module.firstTenSkillTopUpQuestions)
  },
  {
    source: "secondBlockSkillTopUpQuestions",
    shouldLoad: skillId => LANGUAGE_SKILLS.has(skillId) || REPLACEMENT_PHONICS_SKILLS.has(skillId),
    load: () => import("./generated/secondBlockSkillTopUpQuestions.generated.js").then(module => module.secondBlockSkillTopUpQuestions)
  },
  {
    source: "blendsAssessmentQuestions",
    shouldLoad: skillId => skillId === "blends",
    load: () => import("./generated/blendsAssessmentQuestions.generated.js").then(module => module.blendsAssessmentQuestions)
  },
  {
    source: "digraphsAssessmentQuestions",
    shouldLoad: skillId => skillId === "digraphs",
    load: () => import("./generated/digraphsAssessmentQuestions.generated.js").then(module => module.digraphsAssessmentQuestions)
  },
  {
    source: "longVowelsAssessmentQuestions",
    shouldLoad: skillId => shouldLoadForSkill(skillId, ["long_vowels", "long_vowels_silent_e"]),
    load: () => import("./generated/longVowelsAssessmentQuestions.generated.js").then(module => module.longVowelsAssessmentQuestions)
  },
  {
    source: "vowelTeamsVarietyQuestions",
    shouldLoad: skillId => skillId === "vowel_teams",
    load: () => import("./generated/vowelTeamsVarietyQuestions.generated.js").then(module => module.vowelTeamsVarietyQuestions)
  },
  {
    source: "grammarAssessmentQuestions",
    shouldLoad: skillId => ["nouns", "verbs", "adjectives"].includes(skillId),
    load: () => import("./generated/grammarAssessmentQuestions.generated.js").then(module => module.grammarAssessmentQuestions)
  },
  {
    source: "languageSkillQuestions",
    shouldLoad: skillId => LANGUAGE_SKILLS.has(skillId),
    load: () => import("./generated/languageSkillQuestions.generated.js").then(module => module.languageSkillQuestions)
  },
  {
    source: "skillLevelGapQuestions",
    shouldLoad: skillId =>
      EARLY_PHONICS_GENERATED_SKILLS.has(skillId) ||
      HFW_SKILLS.has(skillId) ||
      REPLACEMENT_PHONICS_SKILLS.has(skillId) ||
      LANGUAGE_SKILLS.has(skillId) ||
      COMPREHENSION_SKILLS.has(skillId),
    load: () => import("./generated/skillLevelGapQuestions.generated.js").then(module => module.skillLevelGapQuestions)
  }
];

async function loadDynamicBank(loader) {
  if (!dynamicBankCache.has(loader.source)) {
    dynamicBankCache.set(
      loader.source,
      loader.load().then(bank => normalizeQuestionBank(loader.bankName || loader.source, bank || []))
    );
  }
  return dynamicBankCache.get(loader.source);
}

async function loadQuestionBanksForSkill(normalizedSkillId = "") {
  // Hand-written banks first, generated banks second — the exact order the old
  // static QUESTION_BANKS + dynamic loader concatenation produced, so
  // dedupeQuestions keeps the same record when keys collide.
  const loaders = [
    ...EXPANSION_BANK_LOADERS.filter(loader => expansionBankAppliesToSkill(loader.families, normalizedSkillId)),
    ...DYNAMIC_BANK_LOADERS.filter(loader => loader.shouldLoad(normalizedSkillId))
  ];
  const banks = await Promise.all(loaders.map(loadDynamicBank));
  return banks.flat();
}

function dedupeQuestions(questions = []) {
  const seen = new Set();
  return questions.filter(question => {
    const key = [
      question.id || question.questionId || "",
      question.assessmentSkillId || question.skillId || "",
      question.prompt || question.question || "",
      question.answer || question.correctAnswer || ""
    ].join("::");
    if (!key.trim() || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getAssessmentSkillGroup(skillId = "") {
  const group = groupForSkill(skillId);
  return group?.id || null;
}

export function getAssessmentSkillGroupMetadata() {
  return ASSESSMENT_SKILL_GROUPS.map(group => ({
    ...group,
    skillIds: [...group.skillIds]
  }));
}

export function getAssessmentSkillIdsForGroup(groupId = "") {
  return ASSESSMENT_SKILL_GROUPS.find(group => group.id === groupId)?.skillIds.slice() || [];
}

export async function loadAssessmentSkillBank(skillId = "") {
  const normalizedSkillId = normalizeSkillId(skillId);
  if (skillBankCache.has(normalizedSkillId)) return skillBankCache.get(normalizedSkillId);

  const allAssessmentQuestions = dedupeQuestions(await loadQuestionBanksForSkill(normalizedSkillId));
  const runtimeSkillId = runtimeSkillIdFor(normalizedSkillId);
  const questions = allAssessmentQuestions.filter(question =>
    (
      question.assessmentSkillId === normalizedSkillId ||
      normalizeSkillId(question.skillId) === normalizedSkillId ||
      normalizeSkillId(question.skillId) === runtimeSkillId
    ) &&
    getRuntimeSourceIssues(question).length === 0
  );
  if (GRAMMAR_SENTENCE_FIT_SKILLS.has(normalizedSkillId)) {
    const filtered = questions.filter(isGrammarSentenceFitRuntimeQuestion);
    skillBankCache.set(normalizedSkillId, filtered);
    return filtered;
  }
  skillBankCache.set(normalizedSkillId, questions);
  return questions;
}

export function preloadAssessmentSkillBank(skillId = "") {
  void loadAssessmentSkillBank(skillId);
}

export async function loadAssessmentBanksForSkills(skillIds = []) {
  const banks = await Promise.all(skillIds.map(skillId => loadAssessmentSkillBank(skillId)));
  return dedupeQuestions(banks.flat());
}

export async function loadHfwAssessmentBank(skillId = "") {
  const normalizedSkillId = normalizeSkillId(skillId);
  if (getAssessmentSkillGroup(normalizedSkillId) !== "hfw") return [];
  const questions = await loadAssessmentSkillBank(normalizedSkillId);
  const { isRuntimeEligibleHfwQuestion } = await import("./hfwRuntimeEligibility.js");
  return questions.filter(question => isRuntimeEligibleHfwQuestion(question, normalizedSkillId));
}

export function getActiveAssessmentSkillIds() {
  return skillTree.map(skill => skill.id);
}

export const assessmentSkillGroupDefinitions = ASSESSMENT_SKILL_GROUPS;
