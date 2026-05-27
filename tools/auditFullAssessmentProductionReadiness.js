import fs from "node:fs";
import path from "node:path";

import {
  managedAssessmentSkillDepthConfig,
  SKILL_LEVEL_DEPTH_TARGETS
} from "../src/data/skillLevelDepthConfig.js";
import { getQuestionRoutingIssue, getQuestionRoutingFormat } from "../src/data/skillTemplateRouting.js";
import { getQuestionSignature } from "../src/questionRepeatGuards.js";
import {
  getQuestionAudioPaths,
  getQuestionImagePaths,
  getQuestionTargetWord,
  inferPatternForSkill,
  loadCoreQuestionPool,
  publicPathExists,
  questionFilterReason,
  repoRoot,
  normalizeWord
} from "./phonicsRuntimeUtils.js";
import {
  buildRound,
  getDepthLevel,
  getDepthSkillId,
  uniqueRuntimeQuestions
} from "./skillLevelDepthShared.js";

const outputDir = path.join(repoRoot, "docs", "validation");
const assetsDir = path.join(repoRoot, "docs", "assets");
const markdownPath = path.join(outputDir, "full_assessment_production_readiness_audit.md");
const jsonPath = path.join(outputDir, "full_assessment_production_readiness_audit.json");
const kimiImagesPath = path.join(assetsDir, "kimi_assessment_missing_images_request.md");
const kimiAudioPath = path.join(assetsDir, "kimi_assessment_missing_audio_request.md");
const kimiCombinedPath = path.join(assetsDir, "kimi_assessment_missing_media_combined_request.md");

const phaseSize = SKILL_LEVEL_DEPTH_TARGETS.phaseSize || 15;
const minimumPerLevel = SKILL_LEVEL_DEPTH_TARGETS.minimumPerLevel || 30;
const scopeStartSkillId = "cvc_short_vowels";
const scopedSkillConfigs = managedAssessmentSkillDepthConfig.slice(
  Math.max(0, managedAssessmentSkillDepthConfig.findIndex(config => config.skillId === scopeStartSkillId))
);

const phonicsMediaSkills = new Set([
  "cvc_short_vowels",
  "short_vowel_discrimination",
  "blends",
  "digraphs",
  "long_vowels_silent_e",
  "vowel_teams",
  "r_controlled_vowels"
]);

const hfwSkills = new Set(["hfw_1_25", "hfw_26_50", "hfw_51_100"]);
const grammarVocabularySkills = new Set([
  "nouns",
  "verbs",
  "adjectives",
  "prepositions_of_place",
  "plurals",
  "prefixes_suffixes",
  "antonyms_synonyms",
  "homophones_homonyms"
]);
const comprehensionSkills = new Set([
  "sentence_comprehension",
  "key_details",
  "sequencing",
  "main_idea",
  "inference",
  "cause_effect",
  "context_clues",
  "theme_higher_comprehension"
]);

const imageMisusePattern = /(?:speaker|audio|volume|sound-button|listen-button|question-visual|\/ui\/|\/icons?\/|placeholder|fallback|missing|unavailable|blank|\.svg$)/i;
const dragDropFormats = new Set(["PUT_SOUNDS_IN_ORDER", "FIX_SENTENCE", "IMAGE_VOWEL_SORT"]);
const layoutRiskFormats = new Set([
  "PUT_SOUNDS_IN_ORDER",
  "FIX_SENTENCE",
  "IMAGE_VOWEL_SORT",
  "SENTENCE_MATCHES_PICTURE",
  "PICTURE_TO_PRINT_MATCH",
  "IMAGE_WORD_PATTERN_MATCH",
  "SENTENCE_CLOZE"
]);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
}

function normalizeToken(value = "") {
  return normalizeWord(value)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function slug(value = "") {
  return normalizeWord(value).replace(/\s+/g, "-").replace(/^-+|-+$/g, "");
}

function display(value) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(value => String(value ?? "").replace(/\n/g, " ").replace(/\|/g, "/")).join(" | ")} |`)
  ].join("\n");
}

function countBy(items, getKey) {
  const counts = {};
  for (const item of items) {
    const key = getKey(item) || "(missing)";
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function getTemplate(question = {}) {
  return getQuestionRoutingFormat(question) ||
    String(question.formatType || question.templateType || question.questionType || "UNKNOWN").toUpperCase();
}

function getAnswerOptions(question = {}) {
  const raw = Array.isArray(question.answerOptions) && question.answerOptions.length
    ? question.answerOptions
    : Array.isArray(question.choices) && question.choices.length
      ? question.choices
      : Array.isArray(question.options) && question.options.length
        ? question.options
        : Array.isArray(question.imageCards) && question.imageCards.length
          ? question.imageCards
          : [];
  return raw.map(option => {
    if (option && typeof option === "object") return option.value || option.word || option.label || option.text || option.answer || "";
    return option;
  }).filter(Boolean).map(String);
}

function getCorrectAnswers(question = {}) {
  return [
    ...(Array.isArray(question.correctAnswers) ? question.correctAnswers : []),
    question.correctAnswer,
    question.answer
  ].filter(Boolean).map(value => normalizeWord(value));
}

function getTarget(skillId, question = {}) {
  return normalizeWord(
    getQuestionTargetWord(question) ||
    question.targetWord ||
    question.word ||
    question.anchorWord ||
    question.correctAnswer ||
    question.answer ||
    inferPatternForSkill(skillId, question) ||
    question.id
  );
}

function getCoverageTarget(skillId, question = {}) {
  return normalizeToken(
    question.coverageTarget ||
    question.depthItemKey ||
    question.itemKey ||
    question.targetPattern ||
    question.phonicsPattern ||
    question.targetSound ||
    question.medialVowel ||
    question.rime ||
    question.rhymeFamily ||
    inferPatternForSkill(skillId, question) ||
    getTarget(skillId, question)
  );
}

function getQuestionText(question = {}) {
  return [
    question.prompt,
    question.question,
    question.sentence,
    question.passage,
    question.text,
    question.spokenPrompt,
    question.audioText,
    question.instructions
  ].filter(Boolean).join(" ");
}

function hasRequiredMediaPath(paths) {
  return paths.length > 0 && paths.every(assetPath => !String(assetPath).startsWith("/") || publicPathExists(assetPath));
}

function hasImageMisuse(paths) {
  return paths.some(assetPath => imageMisusePattern.test(String(assetPath)));
}

function imageRequired(skillId, question = {}) {
  const template = getTemplate(question).toLowerCase();
  const prompt = getQuestionText(question).toLowerCase();
  if (skillId === "cvc_short_vowels" || skillId === "short_vowel_discrimination") {
    return Boolean(
      question.image || question.imageUrl || question.imagePath ||
      question.targetImage || question.targetImageUrl || question.targetImagePath ||
      question.imageCards?.length ||
      question.promptImageCards?.length ||
      template.includes("picture") ||
      template.includes("image") ||
      prompt.includes("picture") ||
      prompt.includes("match the picture")
    );
  }
  if (["blends", "digraphs"].includes(skillId)) return true;
  if (["long_vowels_silent_e", "vowel_teams", "r_controlled_vowels"].includes(skillId)) {
    return Boolean(
      question.image || question.imageUrl || question.imagePath ||
      question.imageCards?.length ||
      template.includes("picture") ||
      template.includes("image")
    );
  }
  return Boolean(
    question.image || question.imageUrl || question.imagePath ||
    question.targetImage || question.targetImageUrl || question.targetImagePath ||
    question.imageCards?.length ||
    question.promptImageCards?.length ||
    Object.keys(question.choiceImages || {}).length ||
    template.includes("picture") ||
    template.includes("image") ||
    prompt.includes("picture")
  );
}

function audioRequired(skillId, question = {}) {
  const template = getTemplate(question).toLowerCase();
  const prompt = getQuestionText(question).toLowerCase();
  if (skillId === "short_vowel_discrimination") return true;
  if (skillId === "cvc_short_vowels") {
    return template.includes("listen") || template.includes("heard") || prompt.includes("listen") || prompt.includes("hear");
  }
  if (hfwSkills.has(skillId)) {
    return template.includes("listen") || prompt.includes("listen") || prompt.includes("hear") || Boolean(question.audio || question.audioPath || question.audioUrl);
  }
  if (["blends", "digraphs"].includes(skillId)) return true;
  return Boolean(
    question.audio || question.audioPath || question.audioUrl ||
    template.includes("listen") ||
    template.includes("audio") ||
    prompt.includes("listen") ||
    prompt.includes("hear")
  );
}

function textOnlyAcceptable(skillId, question = {}) {
  return comprehensionSkills.has(skillId) ||
    grammarVocabularySkills.has(skillId) ||
    hfwSkills.has(skillId) ||
    (!phonicsMediaSkills.has(skillId) && !imageRequired(skillId, question) && !audioRequired(skillId, question));
}

function getRuntimeIssues(config, question = {}) {
  const skillId = config.skillId;
  const issues = [];
  const level = getDepthLevel(question);
  const template = getTemplate(question);
  const levelConfig = config.levels[level];
  const images = getQuestionImagePaths(question);
  const audio = getQuestionAudioPaths(question);
  const options = getAnswerOptions(question).map(option => normalizeWord(option));
  const correctAnswers = getCorrectAnswers(question);

  if (question.active === false) issues.push("inactive");
  if (getDepthSkillId(question) !== skillId) issues.push(`cross-skill contamination: ${getDepthSkillId(question) || "missing"}`);
  if (!correctAnswers.length) issues.push("missing correct answer");

  const routingIssue = getQuestionRoutingIssue(question, skillId);
  if (routingIssue) issues.push(`routing: ${routingIssue}`);

  if (levelConfig?.allowedFormats?.length && !levelConfig.allowedFormats.includes(template)) {
    issues.push(`format ${template} not allowed for ${skillId} level ${level}`);
  }

  if (levelConfig?.allowedItemKeys?.length) {
    const coverage = getCoverageTarget(skillId, question);
    if (!levelConfig.allowedItemKeys.includes(coverage)) {
      issues.push(`coverage target ${coverage || "(missing)"} not allowed for level ${level}`);
    }
  }

  if (imageRequired(skillId, question)) {
    if (!images.length) issues.push("missing required image path");
    const missing = images.filter(assetPath => String(assetPath).startsWith("/") && !publicPathExists(assetPath));
    if (missing.length) issues.push(`missing image file: ${missing.slice(0, 4).join(", ")}`);
    if (hasImageMisuse(images)) issues.push(`speaker/icon/placeholder used as content image: ${images.filter(assetPath => imageMisusePattern.test(String(assetPath))).slice(0, 4).join(", ")}`);
  }

  if (audioRequired(skillId, question)) {
    if (!audio.length) issues.push("missing required audio path");
    const missing = audio.filter(assetPath => String(assetPath).startsWith("/") && !publicPathExists(assetPath));
    if (missing.length) issues.push(`missing audio file: ${missing.slice(0, 4).join(", ")}`);
  }

  if (template === "UNKNOWN" && !["hfw_51_100", ...grammarVocabularySkills, ...comprehensionSkills].includes(skillId)) {
    issues.push("UNKNOWN runtime format on non-text skill");
  }

  if (getQuestionText(question).length > 420 && !comprehensionSkills.has(skillId)) {
    issues.push("long prompt/layout risk for non-comprehension skill");
  }

  if (options.length && new Set(options).size !== options.length) issues.push("duplicate equivalent answer options");
  if (correctAnswers.length && options.length && !correctAnswers.every(answer => options.includes(answer))) {
    issues.push("correct answer is not present in options");
  }

  return unique(issues);
}

function getLayoutWarnings(skillId, question = {}) {
  const warnings = [];
  const template = getTemplate(question);
  const options = getAnswerOptions(question);
  const textLength = getQuestionText(question).length;
  if (layoutRiskFormats.has(template)) warnings.push(`${template} needs mobile/desktop fit check`);
  if (options.some(option => String(option).length > 24)) warnings.push("long answer option may wrap or overflow");
  if (options.length > 4) warnings.push("more than four answer choices may crowd mobile layout");
  if (textLength > 320 && !comprehensionSkills.has(skillId)) warnings.push("long prompt may force scrolling");
  if (getQuestionImagePaths(question).length > 4) warnings.push("many images in one question may crowd mobile layout");
  return warnings;
}

function getDragDropWarnings(question = {}) {
  const template = getTemplate(question);
  if (!dragDropFormats.has(template)) return [];
  const warnings = [];
  const draggableItems = question.draggableItems || question.tiles || question.soundTiles || question.words || question.answerOptions || [];
  let dropTargets = question.dropTargets || question.slots || question.correctOrder || question.correctAnswers;
  if (!Array.isArray(dropTargets) || dropTargets.length === 0) {
    if (Array.isArray(question.soundTiles)) {
      dropTargets = String(question.correctAnswer || question.answer || "").split("");
    } else if (Array.isArray(question.tiles)) {
      dropTargets = String(question.correctSentence || question.answer || "").split(/\s+/).filter(Boolean);
    } else {
      dropTargets = [];
    }
  }
  if (!Array.isArray(draggableItems) || draggableItems.length < 2) warnings.push("drag/order item list missing or too short");
  if (!Array.isArray(dropTargets) || dropTargets.length < 2) warnings.push("drop target/correct order list missing or too short");
  if (!question.correctOrder && !question.correctAnswers && !question.correctAnswer && !question.answer) warnings.push("drag/order validation answer missing");
  return warnings;
}

function getProgressionWarnings(config, level, levelItems = []) {
  const warnings = [];
  if (!config.levels[level]?.designed) return warnings;
  const coverage = countBy(levelItems, item => getCoverageTarget(config.skillId, item));
  const targets = countBy(levelItems, item => getTarget(config.skillId, item));
  const total = levelItems.length || 1;
  const dominantCoverage = Object.entries(coverage).filter(([, count]) => count / total > 0.25).map(([key, count]) => `${key}:${count}`);
  const dominantTargets = Object.entries(targets).filter(([, count]) => count / total > 0.2).map(([key, count]) => `${key}:${count}`);
  if (dominantCoverage.length) warnings.push(`coverage target overuse: ${dominantCoverage.slice(0, 8).join(", ")}`);
  if (dominantTargets.length) warnings.push(`target word overuse: ${dominantTargets.slice(0, 8).join(", ")}`);
  if (level === 2 && levelItems.length) {
    const easyTemplates = levelItems.filter(item => ["MULTIPLE_CHOICE", "UNKNOWN"].includes(getTemplate(item))).length;
    if (phonicsMediaSkills.has(config.skillId) && easyTemplates / levelItems.length > 0.5) warnings.push("Level 2 is dominated by generic/easy template types");
  }
  return warnings;
}

function makeDepthQuestion(question, config) {
  return {
    ...question,
    depthSkillId: config.skillId,
    depthLevel: getDepthLevel(question),
    depthFormat: getTemplate(question),
    depthTargetWord: getTarget(config.skillId, question),
    depthItemKey: getCoverageTarget(config.skillId, question)
  };
}

function phaseSummary(items, seed = 0) {
  const phase1 = buildRound(items, phaseSize, seed);
  const phase2 = buildRound(items.filter(item => !phase1.includes(item)), phaseSize, seed + 7);
  return {
    phase1Ready: phase1.length >= phaseSize,
    phase2Ready: phase2.length >= phaseSize,
    phase1Count: phase1.length,
    phase2Count: phase2.length,
    phase1QuestionIds: phase1.map(item => item.id),
    phase2QuestionIds: phase2.map(item => item.id)
  };
}

function summarizeLevel(config, level, rawQuestions, validQuestions) {
  const designed = Boolean(config.levels[level]?.designed);
  const raw = rawQuestions.filter(question => getDepthLevel(question) === level);
  const valid = validQuestions.filter(question => getDepthLevel(question) === level).map(question => makeDepthQuestion(question, config));
  const phases = phaseSummary(valid);
  const targetWords = unique(valid.map(item => getTarget(config.skillId, item)));
  const coverageItems = unique(valid.map(item => getCoverageTarget(config.skillId, item)));
  return {
    designed,
    rule: config.levels[level]?.rule || "",
    allowedFormats: config.levels[level]?.allowedFormats || [],
    configuredItemKeys: config.levels[level]?.allowedItemKeys || [],
    rawQuestionCount: raw.length,
    validRuntimeQuestionCount: valid.length,
    missingTo30: designed ? Math.max(0, minimumPerLevel - valid.length) : 0,
    uniqueTargetWordCount: targetWords.length,
    uniqueCoverageItemCount: coverageItems.length,
    coverageItems: coverageItems.slice(0, 80),
    targetWords: targetWords.slice(0, 80),
    ...phases,
    canBuild15QuestionRound: phases.phase1Ready,
    productionReady: designed && valid.length >= minimumPerLevel && phases.phase1Ready && phases.phase2Ready,
    progressionWarnings: getProgressionWarnings(config, level, valid)
  };
}

function mediaRequestFor(kind, config, question, reason = "") {
  const target = getTarget(config.skillId, question) || getCoverageTarget(config.skillId, question) || question.id || "missing-target";
  const extension = kind === "image" ? "webp" : "mp3";
  const declared = kind === "image" ? getQuestionImagePaths(question) : getQuestionAudioPaths(question);
  const missingDeclared = declared.find(assetPath => String(assetPath).startsWith("/") && !publicPathExists(assetPath));
  const destination = missingDeclared || `/media/vocabulary/${kind === "image" ? "images" : "audio"}/${slug(target)}.${extension}`;
  return {
    mediaType: kind,
    targetWordOrConcept: target,
    skill: config.skillName,
    skillId: config.skillId,
    level: getDepthLevel(question),
    phase: "Level/phase pool",
    affectedQuestionId: question.id || "(missing id)",
    requiredDestinationPath: destination,
    reason,
    instruction: kind === "image"
      ? `Create one clear K-2 instructional image for "${target}". Single centered object/action, white background, no text, no shadow, no glow, no rainbow/fantasy coloring, no faces on objects, natural colors.`
      : `Record one clean American English MP3 saying only "${target}". Neutral soft light female voice, no music, no effects, no file name, no extra instructions.`
  };
}

function summarizeSkill(config, allQuestions) {
  const raw = allQuestions.filter(question => getDepthSkillId(question) === config.skillId);
  const uniqueRaw = uniqueRuntimeQuestions(raw);
  const enriched = uniqueRaw.map(question => {
    const runtimeIssues = getRuntimeIssues(config, question);
    const layoutWarnings = getLayoutWarnings(config.skillId, question);
    const dragDropWarnings = getDragDropWarnings(question);
    return {
      ...question,
      _productionIssues: runtimeIssues,
      _layoutWarnings: layoutWarnings,
      _dragDropWarnings: dragDropWarnings,
      _productionValid: runtimeIssues.length === 0
    };
  });
  const valid = enriched.filter(question => question._productionValid);
  const level1 = summarizeLevel(config, 1, enriched, valid);
  const level2 = summarizeLevel(config, 2, enriched, valid);
  const missingImageQuestions = enriched.filter(question =>
    imageRequired(config.skillId, question) &&
    (!hasRequiredMediaPath(getQuestionImagePaths(question)) || hasImageMisuse(getQuestionImagePaths(question)))
  );
  const missingAudioQuestions = enriched.filter(question =>
    audioRequired(config.skillId, question) &&
    !hasRequiredMediaPath(getQuestionAudioPaths(question))
  );
  const rejected = enriched.filter(question => question._productionIssues.length);
  const issuesByReason = countBy(rejected.flatMap(question => question._productionIssues), reason => reason);
  const templates = countBy(valid, getTemplate);
  const duplicateSignatures = Object.entries(countBy(valid, question => getQuestionSignature(question) || question.id))
    .filter(([, count]) => count > 1)
    .map(([signature, count]) => `${signature}:${count}`);
  const layoutWarnings = enriched.flatMap(question =>
    question._layoutWarnings.map(warning => ({ questionId: question.id, warning, template: getTemplate(question) }))
  );
  const dragDropWarnings = enriched.flatMap(question =>
    question._dragDropWarnings.map(warning => ({ questionId: question.id, warning, template: getTemplate(question) }))
  );
  const media = {
    imageRequiredCount: enriched.filter(question => imageRequired(config.skillId, question)).length,
    validImageCount: enriched.filter(question => imageRequired(config.skillId, question) && hasRequiredMediaPath(getQuestionImagePaths(question)) && !hasImageMisuse(getQuestionImagePaths(question))).length,
    missingImageCount: missingImageQuestions.length,
    audioRequiredCount: enriched.filter(question => audioRequired(config.skillId, question)).length,
    validAudioCount: enriched.filter(question => audioRequired(config.skillId, question) && hasRequiredMediaPath(getQuestionAudioPaths(question))).length,
    missingAudioCount: missingAudioQuestions.length,
    promptAudioCount: enriched.filter(question => question.audio || question.audioPath || question.audioUrl).length,
    cardOptionAudioCount: enriched.filter(question => getQuestionAudioPaths(question).length > 1).length,
    targetWordAudioCount: enriched.filter(question => question.audio || question.audioPath || question.audioUrl).length,
    objectImageCount: enriched.filter(question => question.image || question.imagePath || question.imageUrl || question.targetImage || question.targetImagePath || question.targetImageUrl).length,
    optionCardImageCount: enriched.filter(question => question.imageCards?.length || question.promptImageCards?.length || Object.keys(question.choiceImages || {}).length).length,
    placeholderSpeakerIconMisuseCount: enriched.filter(question => hasImageMisuse(getQuestionImagePaths(question))).length,
    textOnlyAcceptableCount: enriched.filter(question => !getQuestionImagePaths(question).length && !getQuestionAudioPaths(question).length && textOnlyAcceptable(config.skillId, question)).length,
    textOnlyProblematicCount: enriched.filter(question => !getQuestionImagePaths(question).length && !getQuestionAudioPaths(question).length && !textOnlyAcceptable(config.skillId, question)).length
  };
  const imageRequests = missingImageQuestions.map(question => mediaRequestFor("image", config, question, question._productionIssues.join("; ")));
  const audioRequests = missingAudioQuestions.map(question => mediaRequestFor("audio", config, question, question._productionIssues.join("; ")));
  const status = getSkillStatus(level1, level2, media, layoutWarnings, dragDropWarnings);

  return {
    skillId: config.skillId,
    skillName: config.skillName,
    category: skillCategory(config.skillId),
    status,
    totalRawQuestions: uniqueRaw.length,
    totalRuntimeSafeQuestions: valid.length,
    activeRuntimeQuestions: valid.filter(question => question.active !== false).length,
    configuredCoverageTotal: unique([...(config.levels[1]?.allowedItemKeys || []), ...(config.levels[2]?.allowedItemKeys || [])]).length,
    level1,
    level2,
    templates,
    media,
    rejectedQuestionCount: rejected.length,
    rejectedReasons: issuesByReason,
    rejectedExamples: rejected.slice(0, 25).map(question => ({
      id: question.id,
      source: question._source,
      level: getDepthLevel(question),
      template: getTemplate(question),
      target: getTarget(config.skillId, question),
      reasons: question._productionIssues
    })),
    layoutRiskWarnings: layoutWarnings.slice(0, 40),
    dragDropWarnings: dragDropWarnings.slice(0, 40),
    duplicateEquivalentWarnings: duplicateSignatures.slice(0, 40),
    progressionWarnings: [...level1.progressionWarnings.map(warning => `Level 1: ${warning}`), ...level2.progressionWarnings.map(warning => `Level 2: ${warning}`)],
    missingQuestionDepth: {
      level1: level1.designed ? Math.max(0, minimumPerLevel - level1.validRuntimeQuestionCount) : 0,
      level2: level2.designed ? Math.max(0, minimumPerLevel - level2.validRuntimeQuestionCount) : 0
    },
    mediaRequests: {
      images: imageRequests,
      audio: audioRequests
    }
  };
}

function skillCategory(skillId) {
  if (phonicsMediaSkills.has(skillId)) return "Phonics";
  if (hfwSkills.has(skillId)) return "High-Frequency Words";
  if (grammarVocabularySkills.has(skillId)) return "Grammar/Vocabulary";
  if (comprehensionSkills.has(skillId)) return "Comprehension";
  return "Assessment";
}

function getSkillStatus(level1, level2, media, layoutWarnings, dragDropWarnings) {
  if (media.missingImageCount) return "NEEDS IMAGES";
  if (media.missingAudioCount) return "NEEDS AUDIO";
  if (!level1.productionReady || !level2.productionReady) return "NEEDS QUESTIONS";
  if (dragDropWarnings.length) return "NEEDS DRAG/DROP QA";
  if (layoutWarnings.length) return "READY WITH LAYOUT WARNINGS";
  return "READY";
}

function dedupeRequests(requests) {
  const seen = new Set();
  const out = [];
  for (const request of requests) {
    const key = `${request.mediaType}:${request.requiredDestinationPath}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(request);
  }
  return out;
}

function buildKimiMarkdown(title, requests, kindLabel) {
  const lines = [
    `# ${title}`,
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "This file includes only media gaps found by the production-readiness audit. Do not replace working approved media from this list alone.",
    ""
  ];
  if (!requests.length) {
    lines.push(`No missing ${kindLabel} requests were found.`);
    return lines.join("\n");
  }
  lines.push(markdownTable([
    "Target/concept",
    "Skill",
    "Level",
    "Phase",
    "Question id",
    "Destination",
    "Instruction"
  ], requests.map(request => [
    request.targetWordOrConcept,
    request.skill,
    request.level,
    request.phase,
    request.affectedQuestionId,
    request.requiredDestinationPath,
    request.instruction
  ])));
  return lines.join("\n");
}

function buildMarkdown(report) {
  const summaryRows = [
    ["Skills audited", report.summary.totalSkillsAudited],
    ["Skills ready", report.summary.skillsReady],
    ["Skills ready with layout warnings", report.summary.skillsReadyWithLayoutWarnings],
    ["Skills needing questions", report.summary.skillsNeedingQuestions],
    ["Skills needing images", report.summary.skillsNeedingImages],
    ["Skills needing audio", report.summary.skillsNeedingAudio],
    ["Skills needing drag/drop QA", report.summary.skillsNeedingDragDropQa],
    ["Total valid runtime questions", report.summary.totalValidRuntimeQuestions],
    ["Total rejected questions", report.summary.totalRejectedQuestions],
    ["Missing image requests", report.summary.missingImageRequests],
    ["Missing audio requests", report.summary.missingAudioRequests]
  ];

  const overviewRows = report.skills.map((skill, index) => [
    index + 4,
    skill.skillName,
    skill.status,
    skill.totalRawQuestions,
    skill.totalRuntimeSafeQuestions,
    skill.level1.validRuntimeQuestionCount,
    `${skill.level1.phase1Ready ? "yes" : "no"}/${skill.level1.phase2Ready ? "yes" : "no"}`,
    skill.level2.validRuntimeQuestionCount,
    `${skill.level2.phase1Ready ? "yes" : "no"}/${skill.level2.phase2Ready ? "yes" : "no"}`,
    skill.media.missingImageCount,
    skill.media.missingAudioCount,
    skill.layoutRiskWarnings.length,
    skill.dragDropWarnings.length
  ]);

  const lines = [
    "# Full Assessment Production Readiness Audit",
    "",
    `Generated by \`node tools/auditFullAssessmentProductionReadiness.js\` on ${report.generatedAt}.`,
    "",
    "Scope starts at **CVC and Short Vowels** and continues through the later/top skills. Initial Sounds, Final Sounds, and Rhyming are intentionally excluded from this report because they have separate hard-gate audits.",
    "",
    "A skill is production-ready only when both designed levels can build two 15-question phases from valid runtime questions, media requirements are satisfied, and no drag/drop blockers are detected.",
    "",
    "## Summary",
    "",
    markdownTable(["Metric", "Value"], summaryRows),
    "",
    "## Skill Overview",
    "",
    markdownTable([
      "#",
      "Skill",
      "Status",
      "Raw",
      "Runtime-safe",
      "L1 valid",
      "L1 P1/P2",
      "L2 valid",
      "L2 P1/P2",
      "Missing images",
      "Missing audio",
      "Layout warnings",
      "Drag/drop warnings"
    ], overviewRows),
    ""
  ];

  for (const skill of report.skills) {
    lines.push(`## ${skill.skillName}`);
    lines.push("");
    lines.push(`- Skill id: \`${skill.skillId}\``);
    lines.push(`- Category: ${skill.category}`);
    lines.push(`- Status: **${skill.status}**`);
    lines.push(`- Raw questions: ${skill.totalRawQuestions}`);
    lines.push(`- Valid runtime questions: ${skill.totalRuntimeSafeQuestions}`);
    lines.push(`- Rejected questions: ${skill.rejectedQuestionCount}`);
    lines.push("");
    lines.push(markdownTable([
      "Level",
      "Designed",
      "Rule",
      "Valid questions",
      "Unique targets",
      "Unique coverage",
      "Phase 1",
      "Phase 2",
      "Missing to 30",
      "Progression warnings"
    ], [skill.level1, skill.level2].map((level, index) => [
      index + 1,
      level.designed ? "yes" : "no",
      level.rule,
      level.validRuntimeQuestionCount,
      level.uniqueTargetWordCount,
      level.uniqueCoverageItemCount,
      `${level.phase1Ready ? "yes" : "no"} (${level.phase1Count}/15)`,
      `${level.phase2Ready ? "yes" : "no"} (${level.phase2Count}/15)`,
      level.missingTo30,
      level.progressionWarnings.join("; ") || "-"
    ])));
    lines.push("");
    lines.push("### Media");
    lines.push("");
    lines.push(markdownTable(["Metric", "Count"], [
      ["Questions requiring images", skill.media.imageRequiredCount],
      ["Questions with valid images", skill.media.validImageCount],
      ["Questions missing images", skill.media.missingImageCount],
      ["Questions requiring audio", skill.media.audioRequiredCount],
      ["Questions with valid audio", skill.media.validAudioCount],
      ["Questions missing audio", skill.media.missingAudioCount],
      ["Prompt/target audio count", skill.media.targetWordAudioCount],
      ["Card/option audio count", skill.media.cardOptionAudioCount],
      ["Object image count", skill.media.objectImageCount],
      ["Option/card image count", skill.media.optionCardImageCount],
      ["Speaker/icon/placeholder misuse", skill.media.placeholderSpeakerIconMisuseCount],
      ["Text-only acceptable", skill.media.textOnlyAcceptableCount],
      ["Text-only problematic", skill.media.textOnlyProblematicCount]
    ]));
    lines.push("");
    if (Object.keys(skill.rejectedReasons).length) {
      lines.push("### Rejection Reasons");
      lines.push("");
      lines.push(markdownTable(["Reason", "Count"], Object.entries(skill.rejectedReasons)));
      lines.push("");
    }
    if (skill.rejectedExamples.length) {
      lines.push("### Rejected Examples");
      lines.push("");
      lines.push(markdownTable(["Question id", "Source", "Level", "Template", "Target", "Reasons"], skill.rejectedExamples.slice(0, 12).map(item => [
        item.id,
        item.source,
        item.level,
        item.template,
        item.target,
        item.reasons.join("; ")
      ])));
      lines.push("");
    }
    if (skill.layoutRiskWarnings.length) {
      lines.push("### Layout Risk Warnings");
      lines.push("");
      lines.push(markdownTable(["Question id", "Template", "Warning"], skill.layoutRiskWarnings.slice(0, 12).map(item => [item.questionId, item.template, item.warning])));
      lines.push("");
    }
    if (skill.dragDropWarnings.length) {
      lines.push("### Drag/Drop Warnings");
      lines.push("");
      lines.push(markdownTable(["Question id", "Template", "Warning"], skill.dragDropWarnings.slice(0, 12).map(item => [item.questionId, item.template, item.warning])));
      lines.push("");
    }
  }

  return lines.join("\n");
}

const rawPool = loadCoreQuestionPool();
const skills = scopedSkillConfigs.map(config => summarizeSkill(config, rawPool));
const imageRequests = dedupeRequests(skills.flatMap(skill => skill.mediaRequests.images));
const audioRequests = dedupeRequests(skills.flatMap(skill => skill.mediaRequests.audio));
const summary = {
  totalSkillsAudited: skills.length,
  skillsReady: skills.filter(skill => skill.status === "READY").length,
  skillsReadyWithLayoutWarnings: skills.filter(skill => skill.status === "READY WITH LAYOUT WARNINGS").length,
  skillsNeedingQuestions: skills.filter(skill => skill.status === "NEEDS QUESTIONS").length,
  skillsNeedingImages: skills.filter(skill => skill.status === "NEEDS IMAGES").length,
  skillsNeedingAudio: skills.filter(skill => skill.status === "NEEDS AUDIO").length,
  skillsNeedingDragDropQa: skills.filter(skill => skill.status === "NEEDS DRAG/DROP QA").length,
  totalValidRuntimeQuestions: skills.reduce((sum, skill) => sum + skill.totalRuntimeSafeQuestions, 0),
  totalRejectedQuestions: skills.reduce((sum, skill) => sum + skill.rejectedQuestionCount, 0),
  missingImageRequests: imageRequests.length,
  missingAudioRequests: audioRequests.length,
  statusCounts: countBy(skills, skill => skill.status)
};

const report = {
  generatedAt: new Date().toISOString(),
  scope: "CVC and Short Vowels upward",
  phaseSize,
  minimumPerLevel,
  summary,
  skills,
  missingMediaRequests: {
    images: imageRequests,
    audio: audioRequests,
    combined: [...imageRequests, ...audioRequests]
  }
};

writeFile(jsonPath, JSON.stringify(report, null, 2));
writeFile(markdownPath, buildMarkdown(report));
writeFile(kimiImagesPath, buildKimiMarkdown("Kimi Assessment Missing Images Request", imageRequests, "image"));
writeFile(kimiAudioPath, buildKimiMarkdown("Kimi Assessment Missing Audio Request", audioRequests, "audio"));
writeFile(kimiCombinedPath, buildKimiMarkdown("Kimi Assessment Missing Media Combined Request", [...imageRequests, ...audioRequests], "media"));

console.log(`Full production readiness skills audited: ${summary.totalSkillsAudited}`);
console.log(`Status counts: ${JSON.stringify(summary.statusCounts)}`);
console.log(`Valid runtime questions: ${summary.totalValidRuntimeQuestions}`);
console.log(`Rejected questions: ${summary.totalRejectedQuestions}`);
console.log(`Missing image requests: ${summary.missingImageRequests}`);
console.log(`Missing audio requests: ${summary.missingAudioRequests}`);
console.log(`Wrote ${path.relative(repoRoot, markdownPath)}`);
console.log(`Wrote ${path.relative(repoRoot, jsonPath)}`);
