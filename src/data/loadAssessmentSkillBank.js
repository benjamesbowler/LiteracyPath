import { skillTree } from "../skillTree.js";
import { enrichInitialSoundPairQuestion } from "./initialSoundPairAssets.js";
import { enrichListenAndFindWordQuestion } from "./listenAndFindAssets.js";
import { enrichQuestionWithExistingMedia } from "./questionMediaResolver.js";
import { normalizeRhymingQuestionChoices } from "./rhymingDistractors.js";
import {
  getV3PublicationStatus,
  getV3RuntimeEligibilityIssues,
  importV3Bank,
  isV3PublishedSkill,
  V3_QUESTION_SOURCE
} from "./v3/v3Registry.js";

// The v3 banks are the only assessment question source. This module deliberately
// preserves the small public loader API used by the app and validation tools,
// but it no longer knows how to discover or fall back to historical banks.
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
    skillIds: ["hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100"]
  },
  {
    id: "replacement_phonics",
    label: "Replacement Phonics",
    skillIds: ["blends", "digraphs", "long_vowels_silent_e", "vowel_teams", "r_controlled_vowels"]
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

const SKILL_ALIASES = Object.freeze({
  long_vowels: "long_vowels_silent_e",
  r_controlled: "r_controlled_vowels",
  prepositions: "prepositions_of_place",
  prefix_suffix: "prefixes_suffixes",
  homophones: "homophones_homonyms",
  theme: "theme_higher_comprehension"
});

const RUNTIME_SKILL_IDS = Object.freeze(Object.fromEntries(
  Object.entries(SKILL_ALIASES).map(([runtimeId, assessmentId]) => [assessmentId, runtimeId])
));

const bankCache = new Map();

function normalizeSkillId(value) {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return SKILL_ALIASES[normalized] || normalized;
}

function runtimeSkillIdFor(assessmentSkillId) {
  return RUNTIME_SKILL_IDS[assessmentSkillId] || assessmentSkillId;
}

function groupForSkill(skillId) {
  const normalized = normalizeSkillId(skillId);
  return ASSESSMENT_SKILL_GROUPS.find(group => group.skillIds.includes(normalized)) || null;
}

function normalizeV3Question(question, assessmentSkillId) {
  const authoredMedia = question.v3AuthoredMedia || {};
  const authoredImage = question.imagePath || question.imageUrl || question.targetImage || question.targetImagePath || "";
  const enriched = enrichQuestionWithExistingMedia(
    enrichInitialSoundPairQuestion(enrichListenAndFindWordQuestion({ ...question }))
  );
  const normalized = normalizeRhymingQuestionChoices({
    ...enriched,
    source: V3_QUESTION_SOURCE,
    skillId: runtimeSkillIdFor(assessmentSkillId),
    assessmentSkillId,
    _source: `v3_${assessmentSkillId}`,
    _sourceFile: `src/data/v3/banks/${assessmentSkillId}.v3.generated.js`
  });

  // The generic media resolver may add useful audio. It may not invent a
  // target image for a v3 item whose authored record explicitly has none.
  if (!authoredMedia.target && !authoredImage) {
    delete normalized.imagePath;
    delete normalized.imageUrl;
    delete normalized.targetImage;
    delete normalized.targetImagePath;
    delete normalized.image;
  }
  return normalized;
}

async function loadCurrentBank(skillId) {
  const assessmentSkillId = normalizeSkillId(skillId);
  if (!isV3PublishedSkill(assessmentSkillId)) return [];
  if (!bankCache.has(assessmentSkillId)) {
    bankCache.set(assessmentSkillId, importV3Bank(assessmentSkillId).then(bank =>
      bank
        .filter(question => !question.retentionOnly)
        .map(question => normalizeV3Question(question, assessmentSkillId))
        .filter(question => getV3RuntimeEligibilityIssues(question, assessmentSkillId).length === 0)
    ));
  }
  return bankCache.get(assessmentSkillId);
}

export function getAssessmentSkillGroup(skillId) {
  return groupForSkill(skillId)?.id || null;
}

export function getAssessmentSkillGroupMetadata() {
  return ASSESSMENT_SKILL_GROUPS.map(group => ({ ...group, skillIds: [...group.skillIds] }));
}

export function getAssessmentSkillIdsForGroup(groupId) {
  return ASSESSMENT_SKILL_GROUPS.find(group => group.id === groupId)?.skillIds.slice() || [];
}

export async function loadAssessmentSkillBankCandidates(skillId) {
  return loadCurrentBank(skillId);
}

export function getAssessmentSkillPublicationStatus(skillId = "") {
  const assessmentSkillId = normalizeSkillId(skillId);
  const status = getV3PublicationStatus(assessmentSkillId);
  if (!status) {
    return {
      skillId: assessmentSkillId,
      standardVersion: null,
      releaseReady: false,
      publicationMode: "v3-bank",
      runtimeSelectableQuestions: 0,
      dimensions: {},
      reasons: ["No current v3 bank has passed every automated release gate."]
    };
  }
  return {
    ...status,
    releaseReady: true,
    publicationMode: "v3-bank",
    runtimeSelectableQuestions: Number(status.counts?.level1 || 0) + Number(status.counts?.level2 || 0),
    dimensions: status.gates || {},
    reasons: []
  };
}

export async function loadAssessmentSkillBank(skillId) {
  return loadCurrentBank(skillId);
}

export function preloadAssessmentSkillBank(skillId) {
  void loadCurrentBank(skillId);
}

export async function loadAssessmentBanksForSkills(skillIds = []) {
  const banks = await Promise.all(skillIds.map(loadCurrentBank));
  const seen = new Set();
  return banks.flat().filter(question => {
    const key = String(question.id || question.questionId || "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function loadHfwAssessmentBankCandidates(skillId) {
  const assessmentSkillId = normalizeSkillId(skillId);
  return getAssessmentSkillGroup(assessmentSkillId) === "hfw" ? loadCurrentBank(assessmentSkillId) : [];
}

export async function loadHfwAssessmentBank(skillId) {
  return loadHfwAssessmentBankCandidates(skillId);
}

export function getActiveAssessmentSkillIds() {
  return skillTree.map(skill => skill.id);
}

export const assessmentSkillGroupDefinitions = ASSESSMENT_SKILL_GROUPS;
