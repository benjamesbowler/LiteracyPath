export const ASSESSMENT_RELEASE_STANDARD_VERSION = "2026.07.24-a1.4";

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

const INITIAL_SOUNDS_BALANCE_STANDARD = Object.freeze({
  ...DEFAULT_STANDARD.balance,
  maximumPhonemeSharePerLevel: 0.2,
  maximumPromptFamilySharePerLevel: 0.625,
  maximumResponseFormatSharePerLevel: 0.625,
  maximumListenAndFindSharePerLevel: 0.625
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
      balance: skillId === "initial_sounds"
        ? INITIAL_SOUNDS_BALANCE_STANDARD
        : DEFAULT_STANDARD.balance,
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

function normalizeToken(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/gu, "_")
    .replace(/^_+|_+$/gu, "");
}

function defaultQuestionId(question = {}) {
  return String(question.id || question.questionId || "");
}

function defaultQuestionLevel(question = {}) {
  const level = Number(
    question.releaseLevel ||
    question.level ||
    question.assessmentLevel ||
    question.depthLevel ||
    question.difficultyLevel ||
    question.difficulty ||
    1
  );
  return Number.isFinite(level) && level >= 2 ? 2 : 1;
}

function defaultQuestionFormat(question = {}) {
  return String(
    question.depthFormat ||
    question.formatType ||
    question.templateType ||
    question.questionType ||
    "UNKNOWN"
  ).toUpperCase();
}

function defaultInitialSoundPhoneme(question = {}) {
  const explicit = normalizeToken(
    question.depthItemKey ||
    question.itemKey ||
    question.targetSound ||
    question.initialSound ||
    question.letter ||
    ""
  );
  if (explicit) return explicit;
  const target = normalizeToken(
    question.targetWord ||
    question.word ||
    question.correctAnswer ||
    question.answer ||
    ""
  );
  return target.charAt(0) || "(missing)";
}

export function getAssessmentPromptFamily(skillId = "", question = {}, options = {}) {
  const format = String(options.format || defaultQuestionFormat(question)).toUpperCase();
  if (skillId === "initial_sounds") {
    if (format === "INITIAL_SOUND_PAIR_SELECT") return "compare_spoken_onsets";
    if (format === "FIRST_SOUND") return "identify_initial_phoneme";
    return "initial_sound_other";
  }
  return normalizeToken(format) || "unknown";
}

function initialSoundComplexity(question = {}) {
  const choices = [
    ...(Array.isArray(question.imageCards) ? question.imageCards : []),
    ...(Array.isArray(question.answerOptions) ? question.answerOptions : []),
    ...(Array.isArray(question.choices) ? question.choices : [])
  ].map(choice => normalizeToken(
    typeof choice === "string"
      ? choice
      : choice?.word || choice?.label || choice?.text || choice?.value || ""
  )).filter(Boolean);
  const words = choices.length
    ? choices
    : String(question.correctAnswer || question.answer || "").split("|").map(normalizeToken).filter(Boolean);
  const longWordCount = words.filter(word => word.length >= 6).length;
  const totalLength = words.reduce((sum, word) => sum + word.length, 0);
  return (longWordCount * 100) + totalLength;
}

function selectBalancedQuestions(candidates = [], count = 0, options = {}) {
  const remaining = [...candidates];
  const selected = [];
  const phonemeCounts = new Map(options.initialPhonemeCounts || []);
  const maximumPerPhoneme = Number(options.maximumPerPhoneme || Number.POSITIVE_INFINITY);
  while (selected.length < count && remaining.length) {
    const eligible = remaining.filter(candidate => {
      const phoneme = options.getPhoneme(candidate);
      return (phonemeCounts.get(phoneme) || 0) < maximumPerPhoneme;
    });
    if (!eligible.length) break;
    eligible.sort((left, right) => {
      const leftPhonemeCount = phonemeCounts.get(options.getPhoneme(left)) || 0;
      const rightPhonemeCount = phonemeCounts.get(options.getPhoneme(right)) || 0;
      if (leftPhonemeCount !== rightPhonemeCount) return leftPhonemeCount - rightPhonemeCount;
      const complexityDelta = initialSoundComplexity(left) - initialSoundComplexity(right);
      if (complexityDelta) return options.preferHarder ? -complexityDelta : complexityDelta;
      return options.getId(left).localeCompare(options.getId(right));
    });
    const chosen = eligible[0];
    selected.push(chosen);
    const phoneme = options.getPhoneme(chosen);
    phonemeCounts.set(phoneme, (phonemeCounts.get(phoneme) || 0) + 1);
    remaining.splice(remaining.indexOf(chosen), 1);
  }
  return { selected, phonemeCounts };
}

export function selectAssessmentReleaseQuestions(skillId = "", questions = [], accessors = {}) {
  const getId = accessors.getId || defaultQuestionId;
  const getLevel = accessors.getLevel || defaultQuestionLevel;
  const getFormat = accessors.getFormat || defaultQuestionFormat;
  const getPhoneme = accessors.getPhoneme || defaultInitialSoundPhoneme;
  if (skillId !== "initial_sounds") {
    return questions.map(question => ({
      question,
      questionId: getId(question),
      releaseLevel: getLevel(question)
    }));
  }

  const standard = getAssessmentReleaseStandard(skillId);
  const targetPerLevel = standard.questionCount.minimumPerLevel;
  const maximumPerFormat = Math.floor(
    targetPerLevel * standard.balance.maximumResponseFormatSharePerLevel
  );
  const maximumPerPhoneme = Math.floor(
    targetPerLevel * standard.balance.maximumPhonemeSharePerLevel
  );
  const pairQuestions = questions.filter(question => getFormat(question) === "INITIAL_SOUND_PAIR_SELECT");
  const directByLevel = level => questions.filter(question => (
    getFormat(question) !== "INITIAL_SOUND_PAIR_SELECT" &&
    getLevel(question) === level
  ));

  const levelTwoDirect = selectBalancedQuestions(
    directByLevel(2),
    Math.min(maximumPerFormat, targetPerLevel),
    { getId, getPhoneme, maximumPerPhoneme }
  );
  const levelTwoPair = selectBalancedQuestions(
    pairQuestions,
    targetPerLevel - levelTwoDirect.selected.length,
    {
      getId,
      getPhoneme,
      maximumPerPhoneme,
      initialPhonemeCounts: levelTwoDirect.phonemeCounts,
      preferHarder: true
    }
  );
  const levelTwoPairIds = new Set(levelTwoPair.selected.map(getId));

  const levelOneDirect = selectBalancedQuestions(
    directByLevel(1),
    Math.min(maximumPerFormat, targetPerLevel),
    { getId, getPhoneme, maximumPerPhoneme }
  );
  const levelOnePair = selectBalancedQuestions(
    pairQuestions.filter(question => !levelTwoPairIds.has(getId(question))),
    targetPerLevel - levelOneDirect.selected.length,
    {
      getId,
      getPhoneme,
      maximumPerPhoneme,
      initialPhonemeCounts: levelOneDirect.phonemeCounts
    }
  );

  return [
    ...levelOneDirect.selected,
    ...levelOnePair.selected
  ].map(question => ({ question, questionId: getId(question), releaseLevel: 1 })).concat([
    ...levelTwoDirect.selected,
    ...levelTwoPair.selected
  ].map(question => ({ question, questionId: getId(question), releaseLevel: 2 })));
}

function countBy(items = [], getKey = () => "") {
  const counts = {};
  for (const item of items) {
    const key = getKey(item) || "(missing)";
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(
    Object.entries(counts).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
  );
}

function maximumShare(counts = {}, total = 0) {
  return total ? Math.max(0, ...Object.values(counts)) / total : 0;
}

export function buildAssessmentReleaseBalanceReport(skillId = "", questions = [], accessors = {}) {
  const standard = getAssessmentReleaseStandard(skillId);
  if (!standard || skillId !== "initial_sounds") return null;
  const getLevel = accessors.getLevel || defaultQuestionLevel;
  const getFormat = accessors.getFormat || defaultQuestionFormat;
  const getPhoneme = accessors.getPhoneme || defaultInitialSoundPhoneme;
  const getPromptFamily = accessors.getPromptFamily || ((question) => (
    getAssessmentPromptFamily(skillId, question, { format: getFormat(question) })
  ));
  const levels = {};
  for (const level of standard.questionCount.requiredLevels) {
    const scoped = questions.filter(question => getLevel(question) === level);
    const phonemeCounts = countBy(scoped, getPhoneme);
    const promptFamilyCounts = countBy(scoped, getPromptFamily);
    const responseFormatCounts = countBy(scoped, getFormat);
    const listenAndFindCount = scoped.filter(question => (
      getFormat(question) === "INITIAL_SOUND_PAIR_SELECT"
    )).length;
    const maximumPhonemeShare = maximumShare(phonemeCounts, scoped.length);
    const maximumPromptFamilyShare = maximumShare(promptFamilyCounts, scoped.length);
    const maximumResponseFormatShare = maximumShare(responseFormatCounts, scoped.length);
    const listenAndFindShare = scoped.length ? listenAndFindCount / scoped.length : 0;
    const pass =
      maximumPhonemeShare <= standard.balance.maximumPhonemeSharePerLevel &&
      maximumPromptFamilyShare <= standard.balance.maximumPromptFamilySharePerLevel &&
      maximumResponseFormatShare <= standard.balance.maximumResponseFormatSharePerLevel &&
      listenAndFindShare < standard.balance.maximumListenAndFindSharePerLevel;
    levels[level] = {
      questionCount: scoped.length,
      phonemeCounts,
      promptFamilyCounts,
      responseFormatCounts,
      listenAndFindCount,
      maximumPhonemeShare,
      maximumPromptFamilyShare,
      maximumResponseFormatShare,
      listenAndFindShare,
      caps: {
        maximumPhonemeShare: standard.balance.maximumPhonemeSharePerLevel,
        maximumPromptFamilyShare: standard.balance.maximumPromptFamilySharePerLevel,
        maximumResponseFormatShare: standard.balance.maximumResponseFormatSharePerLevel,
        maximumListenAndFindShare: standard.balance.maximumListenAndFindSharePerLevel
      },
      pass
    };
  }
  return {
    levels,
    pass: Object.values(levels).every(level => level.pass)
  };
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
  const additionalBalancePass = levelSummary.additionalBalancePass !== false;
  return {
    eligibleQuestionCount,
    uniqueTargetCount,
    maximumTargetShare,
    additionalBalancePass,
    questionCountPass: eligibleQuestionCount >= standard.questionCount.minimumPerLevel,
    balancePass:
      uniqueTargetCount >= standard.balance.minimumUniqueTargetsPerLevel &&
      maximumTargetShare <= standard.balance.maximumTargetSharePerLevel &&
      additionalBalancePass
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
  if (!balancePass) reasons.push("Target, phoneme, prompt-family, or response-format concentration is outside the release balance standard.");
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
