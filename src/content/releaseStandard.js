export const ASSESSMENT_RELEASE_STANDARD_VERSION = "2026.07.24";

export const ASSESSMENT_RELEASE_MANAGED_SKILL_IDS = Object.freeze([
  "initial_sounds",
  "final_sounds",
  "rhyming",
  "cvc_short_vowels",
  "short_vowel_discrimination",
  "hfw_1_25",
  "hfw_26_50",
  "hfw_51_75",
  "hfw_76_100",
  "blends",
  "digraphs",
  "long_vowels_silent_e",
  "vowel_teams",
  "r_controlled_vowels",
  "nouns",
  "verbs",
  "adjectives",
  "prepositions_of_place",
  "plurals",
  "prefixes_suffixes",
  "antonyms_synonyms",
  "homophones_homonyms",
  "sentence_comprehension",
  "key_details",
  "sequencing",
  "main_idea",
  "inference",
  "cause_effect",
  "context_clues",
  "theme_higher_comprehension"
]);

const EARLY_MEDIA_SKILLS = new Set([
  "initial_sounds",
  "final_sounds",
  "rhyming",
  "cvc_short_vowels",
  "short_vowel_discrimination",
  "blends",
  "digraphs",
  "long_vowels_silent_e",
  "vowel_teams",
  "r_controlled_vowels"
]);

const DEFAULT_STANDARD = Object.freeze({
  questionCount: Object.freeze({
    requiredLevels: Object.freeze([1, 2]),
    minimumPerLevel: 46,
    minimumTotal: 92,
    phaseSize: 15
  }),
  balance: Object.freeze({
    minimumUniqueTargetsPerLevel: 20,
    maximumTargetSharePerLevel: 0.2
  }),
  media: Object.freeze({
    maximumMissingRequiredImages: 0,
    maximumMissingRequiredAudio: 0,
    maximumWiringDefects: 0
  }),
  accessibility: Object.freeze({
    maximumQuestionIssues: 0,
    minimumChoiceCount: 2,
    requireVisiblePrompt: true,
    requireLabeledChoices: true,
    requireSemanticMediaAlternative: true
  })
});

const MEDIA_PROFILES = Object.freeze({
  initial_sounds: "image-and-audio",
  final_sounds: "audio",
  rhyming: "prompt-dependent",
  cvc_short_vowels: "prompt-dependent",
  short_vowel_discrimination: "prompt-dependent",
  blends: "prompt-dependent",
  digraphs: "prompt-dependent",
  long_vowels_silent_e: "prompt-dependent",
  vowel_teams: "prompt-dependent",
  r_controlled_vowels: "prompt-dependent"
});

export const assessmentReleaseStandardsBySkillId = Object.freeze(Object.fromEntries(
  ASSESSMENT_RELEASE_MANAGED_SKILL_IDS.map(skillId => [
    skillId,
    Object.freeze({
      skillId,
      version: ASSESSMENT_RELEASE_STANDARD_VERSION,
      questionCount: DEFAULT_STANDARD.questionCount,
      balance: DEFAULT_STANDARD.balance,
      media: DEFAULT_STANDARD.media,
      accessibility: DEFAULT_STANDARD.accessibility,
      mediaProfile: MEDIA_PROFILES[skillId] || "text-first"
    })
  ])
));

export const assessmentReleaseStandard = Object.freeze({
  version: ASSESSMENT_RELEASE_STANDARD_VERSION,
  managedSkillIds: ASSESSMENT_RELEASE_MANAGED_SKILL_IDS,
  defaults: DEFAULT_STANDARD,
  skills: assessmentReleaseStandardsBySkillId
});

export function getAssessmentReleaseStandard(skillId = "") {
  return assessmentReleaseStandardsBySkillId[String(skillId || "")] || null;
}

function answerValues(question = {}) {
  const choices = question.answerOptions || question.imageCards || question.choices || question.options || [];
  return Array.isArray(choices) ? choices : [];
}

function answerLabel(answer) {
  if (typeof answer === "string" || typeof answer === "number") return String(answer).trim();
  if (!answer || typeof answer !== "object") return "";
  return String(
    answer.label ||
    answer.text ||
    answer.word ||
    answer.value ||
    answer.answer ||
    answer.alt ||
    answer.altText ||
    ""
  ).trim();
}

function semanticMediaLabel(question = {}) {
  return String(
    question.alt ||
    question.altText ||
    question.imageAlt ||
    question.targetWord ||
    question.audioText ||
    question.word ||
    question.correctAnswer ||
    question.answer ||
    question.prompt ||
    question.question ||
    ""
  ).trim();
}

export function getAssessmentReleaseMediaRequirement(skillId = "", question = {}, options = {}) {
  const template = String(options.template || "").toLowerCase();
  const prompt = `${question.prompt || ""} ${question.question || ""} ${question.spokenPrompt || ""}`.toLowerCase();
  const hasImage = Boolean(
    question.image ||
    question.imageUrl ||
    question.imagePath ||
    question.targetImage ||
    question.targetImageUrl ||
    question.targetImagePath ||
    answerValues(question).some(answer => answer && typeof answer === "object" && (
      answer.image || answer.imageUrl || answer.imagePath
    ))
  );
  const hasAudio = Boolean(
    question.audio ||
    question.audioUrl ||
    question.audioPath ||
    answerValues(question).some(answer => answer && typeof answer === "object" && (
      answer.audio || answer.audioUrl || answer.audioPath
    ))
  );
  const earlyMediaSkill = EARLY_MEDIA_SKILLS.has(skillId);
  const requiresImage = skillId === "initial_sounds" || Boolean(
    earlyMediaSkill && (
      hasImage ||
      question.imageRequired === true ||
      template.includes("picture") ||
      template.includes("image") ||
      /\b(?:picture|image)\b/u.test(prompt)
    )
  );
  const requiresAudio = ["initial_sounds", "final_sounds"].includes(skillId) || Boolean(
    template.includes("listen") ||
    template.includes("audio") ||
    /\b(?:listen|hear|sound|sounds)\b/u.test(prompt) ||
    hasAudio
  );
  return { requiresImage, requiresAudio };
}

export function getAssessmentQuestionAccessibilityIssues(question = {}, options = {}) {
  const standard = getAssessmentReleaseStandard(options.skillId)?.accessibility || DEFAULT_STANDARD.accessibility;
  const media = options.mediaRequirement || getAssessmentReleaseMediaRequirement(
    options.skillId,
    question,
    options
  );
  const issues = [];
  const visiblePrompt = String(
    question.prompt ||
    question.question ||
    question.instruction ||
    question.spokenPrompt ||
    ""
  ).trim();
  if (standard.requireVisiblePrompt && !visiblePrompt) issues.push("missing visible prompt");

  const choices = answerValues(question);
  const constructedResponse = Boolean(
    question.soundTiles?.length ||
    question.letterTiles?.length ||
    question.wordTiles?.length ||
    question.segments?.length
  );
  if (!constructedResponse && choices.length > 0 && choices.length < standard.minimumChoiceCount) {
    issues.push(`fewer than ${standard.minimumChoiceCount} answer choices`);
  }
  if (standard.requireLabeledChoices && choices.some(choice => !answerLabel(choice))) {
    issues.push("unlabeled answer choice");
  }
  if (
    standard.requireSemanticMediaAlternative &&
    (media.requiresImage || media.requiresAudio) &&
    !semanticMediaLabel(question)
  ) {
    issues.push("missing semantic media alternative");
  }
  return issues;
}

function levelResult(levelSummary = {}, standard = DEFAULT_STANDARD) {
  const eligibleQuestionCount = Number(levelSummary.eligibleQuestionCount || 0);
  const uniqueTargetCount = Number(levelSummary.uniqueTargetCount || 0);
  const maximumTargetShare = Number(levelSummary.maximumTargetShare || 0);
  return {
    eligibleQuestionCount,
    uniqueTargetCount,
    maximumTargetShare,
    questionCountPass: eligibleQuestionCount >= standard.questionCount.minimumPerLevel,
    balancePass:
      uniqueTargetCount >= standard.balance.minimumUniqueTargetsPerLevel &&
      maximumTargetShare <= standard.balance.maximumTargetSharePerLevel
  };
}

export function evaluateAssessmentSkillReleaseSummary(summary = {}) {
  const standard = getAssessmentReleaseStandard(summary.skillId);
  if (!standard) {
    return {
      skillId: summary.skillId || "",
      standardVersion: ASSESSMENT_RELEASE_STANDARD_VERSION,
      releaseReady: false,
      dimensions: {
        questionCount: "fail",
        balance: "fail",
        media: "fail",
        accessibility: "fail"
      },
      reasons: ["Skill is not release-managed."]
    };
  }

  const levels = Object.fromEntries(standard.questionCount.requiredLevels.map(level => [
    level,
    levelResult(summary.levels?.[level], standard)
  ]));
  const totalEligible = Object.values(levels).reduce((sum, level) => sum + level.eligibleQuestionCount, 0);
  const questionCountPass =
    totalEligible >= standard.questionCount.minimumTotal &&
    Object.values(levels).every(level => level.questionCountPass);
  const balancePass = Object.values(levels).every(level => level.balancePass);
  const mediaPass =
    Number(summary.media?.missingRequiredImages || 0) <= standard.media.maximumMissingRequiredImages &&
    Number(summary.media?.missingRequiredAudio || 0) <= standard.media.maximumMissingRequiredAudio &&
    Number(summary.media?.wiringDefects || 0) <= standard.media.maximumWiringDefects;
  const accessibilityPass =
    Number(summary.accessibility?.issueCount || 0) <= standard.accessibility.maximumQuestionIssues;
  const dimensions = {
    questionCount: questionCountPass ? "pass" : "fail",
    balance: balancePass ? "pass" : "fail",
    media: mediaPass ? "pass" : "fail",
    accessibility: accessibilityPass ? "pass" : "fail"
  };
  const reasons = [];
  if (!questionCountPass) reasons.push("Question-count floor is not met at both levels.");
  if (!balancePass) reasons.push("Target diversity or concentration is outside the release balance standard.");
  if (!mediaPass) reasons.push("Required media is missing or incorrectly wired.");
  if (!accessibilityPass) reasons.push("One or more selectable questions fails the accessibility content standard.");
  return {
    skillId: summary.skillId,
    standardVersion: standard.version,
    levels,
    totalEligible,
    dimensions,
    releaseReady: Object.values(dimensions).every(status => status === "pass"),
    reasons
  };
}
