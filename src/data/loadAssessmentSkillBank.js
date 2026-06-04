import { skillTree } from "../skillTree.js";
import { resolveAssessmentSkillId } from "./assessmentSkillMapping.js";
import { enrichInitialSoundPairQuestion } from "./initialSoundPairAssets.js";
import { enrichListenAndFindWordQuestion } from "./listenAndFindAssets.js";
import { enrichQuestionWithExistingMedia } from "./questionMediaResolver.js";
import { isRuntimeEligibleHfwQuestion } from "./hfwRuntimeEligibility.js";

import { masteryCoreQuestions } from "./masteryCoreQuestions.js";
import { masteryExtraQuestions } from "./masteryExtraQuestions.js";
import { initialSoundCoverageQuestions } from "./initialSoundCoverageQuestions.js";
import { finalSoundCoverageQuestions } from "./finalSoundCoverageQuestions.js";
import { rhymingCoverageQuestions } from "./rhymingCoverageQuestions.js";
import { cvcShortVowelExpansionQuestions } from "./cvcShortVowelExpansionQuestions.js";
import { contentExpansionPass3Questions } from "./contentExpansionPass3Questions.js";
import { targetedContentRecoveryQuestions } from "./targetedContentRecoveryQuestions.js";
import { kimiDataset7RuntimeQuestions } from "./kimiDataset7RuntimeQuestions.js";
import { ixlStyleSeedQuestions } from "./ixlStyleSeedQuestions.js";
import { safeContentExpansionQuestions } from "./safeContentExpansionQuestions.js";
import { templateQuestions } from "./templateQuestions.js";
import { templateExpansion } from "./templateExpansion.js";
import { templateExpansion2 } from "./templateExpansion2.js";
import { templateExpansion3 } from "./templateExpansion3.js";
import { templateExpansion4 } from "./templateExpansion4.js";
import { templateExpansion5 } from "./templateExpansion5.js";
import { templateExpansion6 } from "./templateExpansion6.js";
import { templateExpansion7 } from "./templateExpansion7.js";
import { questionBankExpansion8 } from "./questionBankExpansion8.js";
import { questionBankExpansion9 } from "./questionBankExpansion9.js";
import { questionBankExpansion10 } from "./questionBankExpansion10.js";
import { questionBankExpansion11 } from "./questionBankExpansion11.js";
import { questionBankExpansion12 } from "./questionBankExpansion12.js";
import { questionBankExpansion13 } from "./questionBankExpansion13.js";
import { questionBankExpansion14 } from "./questionBankExpansion14.js";
import { qbAssess_svd } from "./qbAssess_svd.js";
import { qbAssess_hfw1 } from "./qbAssess_hfw1.js";
import { qbAssess_hfw2 } from "./qbAssess_hfw2.js";
import { qbAssess_sc } from "./qbAssess_sc.js";
import { qbAssess_rc } from "./qbAssess_rc.js";
import { qbAssess_inf } from "./qbAssess_inf.js";
import { qbFillGaps } from "./qbFillGaps.js";
import { generatedQuestions } from "./generatedQuestions.js";
import { generatedEarlySkillQuestions } from "./generated/earlySkillQuestions.generated.js";
import { hfwAssessmentQuestions } from "./generated/hfwAssessmentQuestions.generated.js";
import { firstTenSkillTopUpQuestions } from "./generated/firstTenSkillTopUpQuestions.generated.js";
import { secondBlockSkillTopUpQuestions } from "./generated/secondBlockSkillTopUpQuestions.generated.js";
import { blendsAssessmentQuestions } from "./generated/blendsAssessmentQuestions.generated.js";
import { digraphsAssessmentQuestions } from "./generated/digraphsAssessmentQuestions.generated.js";
import { longVowelsAssessmentQuestions } from "./generated/longVowelsAssessmentQuestions.generated.js";
import { vowelTeamsVarietyQuestions } from "./generated/vowelTeamsVarietyQuestions.generated.js";
import { grammarAssessmentQuestions } from "./generated/grammarAssessmentQuestions.generated.js";
import { skillLevelGapQuestions } from "./generated/skillLevelGapQuestions.generated.js";
import { hfwLevel2Questions } from "./generated/hfwLevel2Questions.generated.js";
import { assessmentQaReplacementQuestions } from "./assessmentQaReplacementQuestions.js";
import { highQualityComprehensionReplacementQuestions } from "./highQualityComprehensionReplacements.js";
import { fixSentenceQuestions } from "./fixSentenceQuestions.js";
import { templateComprehensionAdvanced } from "./templateComprehensionAdvanced.js";

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
    label: "Grammar and Language",
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

const QUESTION_BANKS = [
  ["masteryCoreQuestions", masteryCoreQuestions],
  ["masteryExtraQuestions", masteryExtraQuestions],
  ["initialSoundCoverageQuestions", initialSoundCoverageQuestions],
  ["finalSoundCoverageQuestions", finalSoundCoverageQuestions],
  ["rhymingCoverageQuestions", rhymingCoverageQuestions],
  ["cvcShortVowelExpansionQuestions", cvcShortVowelExpansionQuestions],
  ["contentExpansionPass3Questions", contentExpansionPass3Questions],
  ["targetedContentRecoveryQuestions", targetedContentRecoveryQuestions],
  ["kimiDataset7RuntimeQuestions", kimiDataset7RuntimeQuestions],
  ["ixlStyleSeedQuestions", ixlStyleSeedQuestions],
  ["safeContentExpansionQuestions", safeContentExpansionQuestions],
  ["hfwAssessmentQuestions", hfwAssessmentQuestions],
  ["firstTenSkillTopUpQuestions", firstTenSkillTopUpQuestions],
  ["secondBlockSkillTopUpQuestions", secondBlockSkillTopUpQuestions],
  ["blendsAssessmentQuestions", blendsAssessmentQuestions],
  ["digraphsAssessmentQuestions", digraphsAssessmentQuestions],
  ["longVowelsAssessmentQuestions", longVowelsAssessmentQuestions],
  ["vowelTeamsVarietyQuestions", vowelTeamsVarietyQuestions],
  ["grammarAssessmentQuestions", grammarAssessmentQuestions],
  ["templateQuestions", templateQuestions],
  ["templateExpansion", templateExpansion],
  ["templateExpansion2", templateExpansion2],
  ["templateExpansion3", templateExpansion3],
  ["templateExpansion4", templateExpansion4],
  ["templateExpansion5", templateExpansion5],
  ["templateExpansion6", templateExpansion6],
  ["templateExpansion7", templateExpansion7],
  ["questionBankExpansion8", questionBankExpansion8],
  ["questionBankExpansion9", questionBankExpansion9],
  ["questionBankExpansion10", questionBankExpansion10],
  ["questionBankExpansion11", questionBankExpansion11],
  ["questionBankExpansion12", questionBankExpansion12],
  ["questionBankExpansion13", questionBankExpansion13],
  ["questionBankExpansion14", questionBankExpansion14],
  ["qbAssess_svd", qbAssess_svd],
  ["qbAssess_hfw1", qbAssess_hfw1],
  ["qbAssess_hfw2", qbAssess_hfw2],
  ["qbAssess_sc", qbAssess_sc],
  ["qbAssess_rc", qbAssess_rc],
  ["qbAssess_inf", qbAssess_inf],
  ["qbFillGaps", qbFillGaps],
  ["generatedEarlySkillQuestions", generatedEarlySkillQuestions],
  ["skillLevelGapQuestions", skillLevelGapQuestions],
  ["hfwLevel2Questions", hfwLevel2Questions],
  ["assessmentQaReplacementQuestions", assessmentQaReplacementQuestions],
  ["highQualityComprehensionReplacementQuestions", highQualityComprehensionReplacementQuestions],
  ["generatedQuestions", generatedQuestions],
  ["fixSentenceQuestions", fixSentenceQuestions],
  ["templateComprehensionAdvanced", templateComprehensionAdvanced]
];

let allAssessmentQuestions = null;

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
  return {
    ...enriched,
    skillId: runtimeSkillIdFor(skillId) || enriched.skillId || enriched.skill_id || "",
    assessmentSkillId: skillId,
    _source: source,
    _sourceIndex: sourceIndex
  };
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
  if (!allAssessmentQuestions) {
    allAssessmentQuestions = dedupeQuestions(
      QUESTION_BANKS.flatMap(([source, bank]) =>
        bank.map((question, index) => normalizeQuestion(question, source, index))
      )
    );
  }

  const normalizedSkillId = normalizeSkillId(skillId);
  const runtimeSkillId = runtimeSkillIdFor(normalizedSkillId);
  return allAssessmentQuestions.filter(question =>
    question.assessmentSkillId === normalizedSkillId ||
    normalizeSkillId(question.skillId) === normalizedSkillId ||
    normalizeSkillId(question.skillId) === runtimeSkillId
  );
}

export async function loadHfwAssessmentBank(skillId = "") {
  const normalizedSkillId = normalizeSkillId(skillId);
  if (getAssessmentSkillGroup(normalizedSkillId) !== "hfw") return [];
  const questions = await loadAssessmentSkillBank(normalizedSkillId);
  return questions.filter(question => isRuntimeEligibleHfwQuestion(question, normalizedSkillId));
}

export function getActiveAssessmentSkillIds() {
  return skillTree.map(skill => skill.id);
}

export const assessmentSkillGroupDefinitions = ASSESSMENT_SKILL_GROUPS;
