export const sourceOfTruthRegistry = {
  hfw: {
    role: "approved workbook only",
    activeRuntimeFiles: [
      "src/data/generated/hfwApprovedQuestionBank.generated.js",
      "src/data/generated/hfwAssessmentQuestions.generated.js",
      "src/data/generated/hfwLevel2Questions.generated.js",
      "src/data/generated/hfwQuestionReviewBlocklist.generated.js"
    ],
    generatorSources: [
      "tools/importApprovedHfwQuestionBank.js",
      "tools/generateHfwAssessmentQuestions.js"
    ],
    allowedQuestionSource: "approved_hfw_workbook"
  },
  grammar: {
    role: "current sentence-fit grammar banks",
    activeRuntimeFiles: [
      "src/data/generated/grammarAssessmentQuestions.generated.js",
      "src/data/generated/languageSkillQuestions.generated.js",
      "src/data/generated/secondBlockSkillTopUpQuestions.generated.js"
    ],
    allowedQuestionSources: [
      "skill_word_bank_workbook",
      "second_block_k3_topup_2026_06"
    ]
  },
  earlyPhonics: {
    role: "current image/audio-backed early phonics banks",
    activeRuntimeFiles: [
      "src/data/initialSoundCoverageQuestions.js",
      "src/data/finalSoundCoverageQuestions.js",
      "src/data/rhymingCoverageQuestions.js",
      "src/data/cvcShortVowelExpansionQuestions.js",
      "src/data/shortVowelDiscriminationPhase2Questions.js",
      "src/data/generated/earlySkillQuestions.generated.js",
      "src/data/generated/finalSounds.generated.js",
      "src/data/generated/cvc.generated.js",
      "src/data/generated/rhyming.generated.js",
      "src/data/generated/shortVowel.generated.js"
    ]
  },
  assessmentReplacements: {
    role: "current replacement/depth banks",
    activeRuntimeFiles: [
      "src/data/assessmentQaReplacementQuestions.js",
      "src/data/highQualityComprehensionReplacements.js",
      "src/data/qbAssess_main_idea.js",
      "src/data/qbAssess_cause_effect.js",
      "src/data/qbAssess_sequencing.js",
      "src/data/generated/skillLevelGapQuestions.generated.js",
      "src/data/generated/firstTenSkillTopUpQuestions.generated.js",
      "src/data/generated/secondBlockSkillTopUpQuestions.generated.js",
      "src/data/generated/blendsAssessmentQuestions.generated.js",
      "src/data/generated/digraphsAssessmentQuestions.generated.js",
      "src/data/generated/longVowelsAssessmentQuestions.generated.js",
      "src/data/generated/vowelTeamsVarietyQuestions.generated.js"
    ]
  },
  media: {
    role: "current registry and QA controls",
    activeRuntimeFiles: [
      "src/data/assessmentMediaRegistry.js",
      "src/data/assessmentMediaPicker.js",
      "src/data/questionMediaResolver.js",
      "src/data/mediaQaManifest.js",
      "src/data/mediaQaReviewStatus.js",
      "src/data/hfwQuestionImageReview.js",
      "src/data/generated/assessmentImageVariants.generated.js",
      "src/data/generated/hfwQuestionImageReview.generated.js"
    ]
  },
  guidedReading: {
    role: "active guided reading source files",
    activeRuntimeFiles: [
      "src/data/guidedReadingBooks.js",
      "src/data/guidedReadingRegenBooks.js",
      "src/data/guidedStoryBooks.js",
      "src/data/firstFactsActualLevelABooks.js"
    ]
  },
  storyQuest: {
    role: "active Story Quest source files",
    activeRuntimeFiles: [
      "src/data/storyQuests.js",
      "src/utils/storyQuestProgress.js"
    ]
  },
  validationOnly: {
    role: "audit output and tooling only",
    pathPatterns: [
      "^docs/validation/",
      "^docs/imports/",
      "^tools/",
      "^src/data/generated/mediaQaReviewItems\\.generated\\.js$"
    ]
  },
  legacyCandidates: {
    role: "not allowed in runtime selection",
    files: [
      "src/data/questionBankExpansion9.js",
      "src/data/qbAssess_hfw1.js",
      "src/data/qbAssess_hfw2.js",
      "src/data/generated/mediaQaReviewItems.generated.js"
    ],
    sourceNames: [
      "questionBankExpansion9",
      "qbAssess_hfw1",
      "qbAssess_hfw2",
      "mediaQaReviewItems"
    ]
  }
};

export const sourceFileByBankName = {
  masteryCoreQuestions: "src/data/masteryCoreQuestions.js",
  masteryExtraQuestions: "src/data/masteryExtraQuestions.js",
  initialSoundCoverageQuestions: "src/data/initialSoundCoverageQuestions.js",
  finalSoundCoverageQuestions: "src/data/finalSoundCoverageQuestions.js",
  rhymingCoverageQuestions: "src/data/rhymingCoverageQuestions.js",
  cvcShortVowelExpansionQuestions: "src/data/cvcShortVowelExpansionQuestions.js",
  shortVowelDiscriminationPhase2Questions: "src/data/shortVowelDiscriminationPhase2Questions.js",
  contentExpansionPass3Questions: "src/data/contentExpansionPass3Questions.js",
  targetedContentRecoveryQuestions: "src/data/targetedContentRecoveryQuestions.js",
  kimiDataset7RuntimeQuestions: "src/data/kimiDataset7RuntimeQuestions.js",
  ixlStyleSeedQuestions: "src/data/ixlStyleSeedQuestions.js",
  safeContentExpansionQuestions: "src/data/safeContentExpansionQuestions.js",
  templateQuestions: "src/data/templateQuestions.js",
  templateExpansion: "src/data/templateExpansion.js",
  templateExpansion2: "src/data/templateExpansion2.js",
  templateExpansion3: "src/data/templateExpansion3.js",
  templateExpansion4: "src/data/templateExpansion4.js",
  templateExpansion5: "src/data/templateExpansion5.js",
  templateExpansion6: "src/data/templateExpansion6.js",
  templateExpansion7: "src/data/templateExpansion7.js",
  questionBankExpansion8: "src/data/questionBankExpansion8.js",
  questionBankExpansion9: "src/data/questionBankExpansion9.js",
  questionBankExpansion10: "src/data/questionBankExpansion10.js",
  questionBankExpansion11: "src/data/questionBankExpansion11.js",
  questionBankExpansion12: "src/data/questionBankExpansion12.js",
  questionBankExpansion13: "src/data/questionBankExpansion13.js",
  questionBankExpansion14: "src/data/questionBankExpansion14.js",
  qbAssess_svd: "src/data/qbAssess_svd.js",
  qbAssess_hfw1: "src/data/qbAssess_hfw1.js",
  qbAssess_hfw2: "src/data/qbAssess_hfw2.js",
  qbAssess_sc: "src/data/qbAssess_sc.js",
  qbAssess_rc: "src/data/qbAssess_rc.js",
  qbAssess_inf: "src/data/qbAssess_inf.js",
  qbAssess_main_idea: "src/data/qbAssess_main_idea.js",
  qbAssess_cause_effect: "src/data/qbAssess_cause_effect.js",
  qbAssess_sequencing: "src/data/qbAssess_sequencing.js",
  qbFillGaps: "src/data/qbFillGaps.js",
  generatedQuestions: "src/data/generatedQuestions.js",
  generatedEarlySkillQuestions: "src/data/generated/earlySkillQuestions.generated.js",
  hfwAssessmentQuestions: "src/data/generated/hfwAssessmentQuestions.generated.js",
  hfwLevel2Questions: "src/data/generated/hfwLevel2Questions.generated.js",
  firstTenSkillTopUpQuestions: "src/data/generated/firstTenSkillTopUpQuestions.generated.js",
  secondBlockSkillTopUpQuestions: "src/data/generated/secondBlockSkillTopUpQuestions.generated.js",
  blendsAssessmentQuestions: "src/data/generated/blendsAssessmentQuestions.generated.js",
  digraphsAssessmentQuestions: "src/data/generated/digraphsAssessmentQuestions.generated.js",
  longVowelsAssessmentQuestions: "src/data/generated/longVowelsAssessmentQuestions.generated.js",
  vowelTeamsVarietyQuestions: "src/data/generated/vowelTeamsVarietyQuestions.generated.js",
  grammarAssessmentQuestions: "src/data/generated/grammarAssessmentQuestions.generated.js",
  languageSkillQuestions: "src/data/generated/languageSkillQuestions.generated.js",
  skillLevelGapQuestions: "src/data/generated/skillLevelGapQuestions.generated.js",
  assessmentQaReplacementQuestions: "src/data/assessmentQaReplacementQuestions.js",
  highQualityComprehensionReplacementQuestions: "src/data/highQualityComprehensionReplacements.js",
  fixSentenceQuestions: "src/data/fixSentenceQuestions.js",
  templateComprehensionAdvanced: "src/data/templateComprehensionAdvanced.js",
  // Skills Assessment Rebuild v3 — generated from tools/assessmentRebuild/authoring/*
  v3_long_vowels_silent_e: "src/data/v3/banks/long_vowels_silent_e.v3.generated.js",
  v3_digraphs: "src/data/v3/banks/digraphs.v3.generated.js",
  v3_main_idea: "src/data/v3/banks/main_idea.v3.generated.js",
  v3_inference: "src/data/v3/banks/inference.v3.generated.js",
  v3_cause_effect: "src/data/v3/banks/cause_effect.v3.generated.js",
  v3_context_clues: "src/data/v3/banks/context_clues.v3.generated.js",
  v3_theme_higher_comprehension: "src/data/v3/banks/theme_higher_comprehension.v3.generated.js",
  v3_sequencing: "src/data/v3/banks/sequencing.v3.generated.js",
  v3_key_details: "src/data/v3/banks/key_details.v3.generated.js",
  v3_sentence_comprehension: "src/data/v3/banks/sentence_comprehension.v3.generated.js",
  v3_initial_sounds: "src/data/v3/banks/initial_sounds.v3.generated.js",
  v3_final_sounds: "src/data/v3/banks/final_sounds.v3.generated.js",
  v3_rhyming: "src/data/v3/banks/rhyming.v3.generated.js",
  v3_cvc_short_vowels: "src/data/v3/banks/cvc_short_vowels.v3.generated.js",
  v3_short_vowel_discrimination: "src/data/v3/banks/short_vowel_discrimination.v3.generated.js",
  v3_blends: "src/data/v3/banks/blends.v3.generated.js"
};

export const activeRuntimeSourceFiles = new Set(
  Object.values(sourceOfTruthRegistry)
    .flatMap(entry => entry.activeRuntimeFiles || [])
);

export const legacyCandidateFiles = new Set(sourceOfTruthRegistry.legacyCandidates.files);
export const legacyCandidateSourceNames = new Set(sourceOfTruthRegistry.legacyCandidates.sourceNames);

const HFW_SKILL_IDS = new Set(["hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100"]);
const HFW_ALLOWED_FORMAT_PREFIX = /^HFW_SENTENCE_(?:CLOZE|SPELL)_L[12]P[12]_\d{2}$/;
const BLOCKED_QA_STATUSES = new Set(["blocked", "rejected", "deprecated", "legacy"]);
const BAD_HFW_PROMPT_PATTERNS = [
  /\btap the word\b/i,
  /\bfind the word\b/i,
  /\bwhich word says\b/i,
  /\bwhich word is\b/i,
  /\bwhich word shows\b/i,
  /\btarget word\b/i
];
export const bannedRuntimePhrases = [
  "before snack",
  "with a smile",
  "When the train slowed",
  "When the ball bounced",
  "may choose a book",
  "truck stopped by the gate"
];

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

function questionText(question = {}) {
  return [
    question.prompt,
    question.question,
    question.spokenPrompt,
    question.visiblePrompt,
    question.visibleSentenceWithBlank,
    question.sentence,
    question.passage,
    question.context
  ].filter(Boolean).join(" ");
}

function questionImageValues(question = {}) {
  return [
    question.imagePath,
    question.imageUrl,
    question.image,
    question.targetImage,
    question.targetImagePath,
    question.targetImageUrl,
    ...(Array.isArray(question.imageCards) ? question.imageCards.flatMap(card => [card.image, card.imagePath, card.imageUrl]) : []),
    ...(Array.isArray(question.promptImageCards) ? question.promptImageCards.flatMap(card => [card.image, card.imagePath, card.imageUrl]) : []),
    ...(Array.isArray(question.answerOptions) ? question.answerOptions.flatMap(option => [option?.image, option?.imagePath, option?.imageUrl]) : []),
    ...Object.values(question.choiceImages || {}).flatMap(asset => [asset?.image, asset?.imagePath, asset?.imageUrl])
  ].filter(Boolean);
}

export function isHighFrequencyRuntimeSkill(skillId = "") {
  return HFW_SKILL_IDS.has(normalizeSkillId(skillId));
}

export function isFakeTextCardImage(value = "") {
  const text = String(value || "");
  return text.startsWith("data:image/svg") ||
    /<svg|%3Csvg/i.test(text) ||
    /text-card|fake[_-]?image|placeholder[_-]?card/i.test(text);
}

export function getRuntimeSourceIssues(question = {}, context = {}) {
  const issues = [];
  const sourceName = context.sourceName || question._source || "";
  const sourceFile = context.sourceFile || question._sourceFile || sourceFileByBankName[sourceName] || "";
  const skillId = questionSkillId(question);
  const format = String(question.formatType || question.templateType || question.questionType || "").toUpperCase();
  const text = questionText(question);

  if (legacyCandidateSourceNames.has(sourceName) || legacyCandidateFiles.has(sourceFile)) {
    issues.push(`legacy source is not runtime-approved: ${sourceName || sourceFile}`);
  }
  if (/\/(?:archive|legacy)\//i.test(sourceFile)) {
    issues.push(`archive/legacy path is not runtime-approved: ${sourceFile}`);
  }
  if (isHighFrequencyRuntimeSkill(skillId)) {
    if (question.source !== sourceOfTruthRegistry.hfw.allowedQuestionSource) {
      issues.push("HFW runtime questions must come from approved_hfw_workbook");
    }
    if (!HFW_ALLOWED_FORMAT_PREFIX.test(format)) {
      issues.push(`HFW format is not in the approved sentence cloze/spell set: ${format || "UNKNOWN"}`);
    }
    if (BAD_HFW_PROMPT_PATTERNS.some(pattern => pattern.test(text))) {
      issues.push("direct-recognition HFW prompt is blocked");
    }
  }
  for (const phrase of bannedRuntimePhrases) {
    if (text.toLowerCase().includes(phrase.toLowerCase())) {
      issues.push(`banned runtime phrase: ${phrase}`);
    }
  }
  for (const image of questionImageValues(question)) {
    if (isFakeTextCardImage(image)) issues.push("fake SVG/text-card image is blocked");
  }
  const qaStatus = String(question.qaStatus || question.mediaQaStatus || question.reviewStatus || "").toLowerCase();
  if (BLOCKED_QA_STATUSES.has(qaStatus)) {
    issues.push(`blocked media/content QA status: ${qaStatus}`);
  }
  if (question.active === false) issues.push("inactive question is not runtime-approved");

  return [...new Set(issues)];
}

export function isRuntimeSourceApproved(question = {}, context = {}) {
  return getRuntimeSourceIssues(question, context).length === 0;
}

export function sourceRegistrySummary() {
  return Object.fromEntries(
    Object.entries(sourceOfTruthRegistry).map(([key, value]) => [
      key,
      {
        role: value.role,
        activeRuntimeFiles: value.activeRuntimeFiles?.length || 0,
        generatorSources: value.generatorSources?.length || 0,
        legacyFiles: value.files?.length || 0
      }
    ])
  );
}
