import { V3_QUESTION_SOURCE } from "../content/blueprints/skillBlueprints.js";

const ASSESSMENT_SKILL_IDS = new Set([
  "initial_sounds", "final_sounds", "rhyming", "cvc_short_vowels", "short_vowel_discrimination",
  "hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100",
  "blends", "digraphs", "long_vowels_silent_e", "long_vowels", "vowel_teams",
  "r_controlled_vowels", "r_controlled", "nouns", "verbs", "adjectives",
  "prepositions_of_place", "prepositions", "plurals", "prefixes_suffixes", "prefix_suffix",
  "antonyms_synonyms", "homophones_homonyms", "homophones", "sentence_comprehension",
  "key_details", "sequencing", "main_idea", "inference", "cause_effect", "context_clues",
  "theme_higher_comprehension", "theme"
]);

const V3_ASSESSMENT_SKILL_IDS = [
  "initial_sounds", "final_sounds", "rhyming", "cvc_short_vowels", "short_vowel_discrimination",
  "hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100",
  "blends", "digraphs", "long_vowels_silent_e", "vowel_teams", "r_controlled_vowels",
  "nouns", "verbs", "adjectives", "prepositions_of_place", "plurals", "prefixes_suffixes",
  "antonyms_synonyms", "homophones_homonyms", "sentence_comprehension", "key_details",
  "sequencing", "main_idea", "inference", "cause_effect", "context_clues",
  "theme_higher_comprehension"
];

const V3_BANK_FILES = V3_ASSESSMENT_SKILL_IDS.map(
  skillId => `src/data/v3/banks/${skillId}.v3.generated.js`
);

export const sourceOfTruthRegistry = Object.freeze({
  assessment: {
    role: "only published Skills assessment source",
    activeRuntimeFiles: [
      "src/data/loadAssessmentSkillBank.js",
      "src/data/v3/v3Registry.js",
      "src/content/blueprints/skillBlueprints.js",
      ...V3_BANK_FILES
    ],
    allowedQuestionSource: V3_QUESTION_SOURCE
  },
  media: {
    role: "current media registry and QA controls",
    activeRuntimeFiles: [
      "src/data/assessmentMediaRegistry.js",
      "src/data/assessmentMediaPicker.js",
      "src/data/questionMediaResolver.js",
      "src/data/mediaQaManifest.js",
      "src/data/mediaQaReviewStatus.js"
    ]
  },
  guidedReading: {
    role: "current guided-reading sources",
    activeRuntimeFiles: [
      "src/data/guidedReadingBooks.js",
      "src/data/guidedReadingBookMetadata.js",
      "src/data/guidedReadingDiscussionPrompts.js",
      "src/data/guidedReadingDiscussionPrompts.core.js",
      "src/data/guidedReadingDiscussionPrompts.series.js",
      "src/data/guidedReadingDiscussionPrompts.world.js",
      "src/data/guidedReadingDiscussionPrompts.willow.js",
      "src/data/guidedReadingBridgeBooks.js",
      "src/data/guidedReadingBridgeBooks.manifest.js",
      "src/data/guidedReadingRegenBooks.js",
      "src/data/guidedStoryBooks.js",
      "src/data/firstFactsActualLevelABooks.js",
      "src/data/knowledgeJourneys.js",
      "src/policy/literacyExperiencePolicy.js"
    ]
  },
  storyQuest: {
    role: "current Story Quest sources",
    activeRuntimeFiles: ["src/data/storyQuests.js", "src/utils/storyQuestProgress.js"]
  },
  validationOnly: {
    role: "tool output, never a runtime source",
    pathPatterns: ["^docs/validation/", "^tools/"]
  },
  legacyCandidates: {
    role: "retired runtime sources; list intentionally empty after v3 cutover",
    files: [],
    sourceNames: []
  }
});

export const sourceFileByBankName = Object.freeze(Object.fromEntries(
  V3_ASSESSMENT_SKILL_IDS.map(skillId => [
    `v3_${skillId}`,
    `src/data/v3/banks/${skillId}.v3.generated.js`
  ])
));

export const activeRuntimeSourceFiles = new Set(
  Object.values(sourceOfTruthRegistry).flatMap(entry => entry.activeRuntimeFiles || [])
);
export const legacyCandidateFiles = new Set();
export const legacyCandidateSourceNames = new Set();

const BLOCKED_QA_STATUSES = new Set(["blocked", "rejected", "deprecated", "legacy", "deleted"]);

function normalizeSkillId(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function questionSkillId(question = {}) {
  return normalizeSkillId(question.assessmentSkillId || question.skillId || question.skill_id || question.skill || "");
}

function questionImageValues(question = {}) {
  return [
    question.imagePath,
    question.imageUrl,
    question.image,
    question.targetImage,
    question.targetImagePath,
    ...(Array.isArray(question.imageCards)
      ? question.imageCards.flatMap(card => [card.image, card.imagePath, card.imageUrl])
      : []),
    ...(Array.isArray(question.sequenceCards)
      ? question.sequenceCards.flatMap(card => [card.image, card.imagePath, card.imageUrl])
      : [])
  ].filter(Boolean);
}

export function isHighFrequencyRuntimeSkill(skillId = "") {
  return /^hfw_(?:1_25|26_50|51_75|76_100)$/.test(normalizeSkillId(skillId));
}

export function isFakeTextCardImage(value = "") {
  const text = String(value || "");
  return text.startsWith("data:image/svg")
    || /<svg|%3Csvg/i.test(text)
    || /text-card|fake[_-]?image|placeholder[_-]?card/i.test(text);
}

export const bannedRuntimePhrases = [];

export function getRuntimeSourceIssues(question = {}, context = {}) {
  const issues = [];
  const skillId = questionSkillId(question);
  const sourceName = context.sourceName || question._source || "";
  const sourceFile = context.sourceFile || question._sourceFile || sourceFileByBankName[sourceName] || "";

  if (ASSESSMENT_SKILL_IDS.has(skillId)) {
    if (question.source !== V3_QUESTION_SOURCE) {
      issues.push(`assessment question is not from ${V3_QUESTION_SOURCE}`);
    }
    if (!sourceName.startsWith("v3_") || !V3_BANK_FILES.includes(sourceFile)) {
      issues.push("assessment question is not attached to a current v3 bank");
    }
  }
  if (/\/(?:archive|legacy)\//i.test(sourceFile)) {
    issues.push(`archive/legacy path is not runtime-approved: ${sourceFile}`);
  }
  for (const image of questionImageValues(question)) {
    if (isFakeTextCardImage(image)) issues.push("fake SVG/text-card image is blocked");
  }
  const qaStatus = String(question.qaStatus || question.mediaQaStatus || question.reviewStatus || "").toLowerCase();
  if (BLOCKED_QA_STATUSES.has(qaStatus)) issues.push(`blocked media/content QA status: ${qaStatus}`);
  if (question.active === false) issues.push("inactive question is not runtime-approved");

  return [...new Set(issues)];
}

export function isRuntimeSourceApproved(question = {}, context = {}) {
  return getRuntimeSourceIssues(question, context).length === 0;
}

export function sourceRegistrySummary() {
  return Object.fromEntries(Object.entries(sourceOfTruthRegistry).map(([key, value]) => [
    key,
    {
      role: value.role,
      activeRuntimeFiles: value.activeRuntimeFiles?.length || 0,
      generatorSources: value.generatorSources?.length || 0,
      legacyFiles: value.files?.length || 0
    }
  ]));
}
