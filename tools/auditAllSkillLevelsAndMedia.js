import fs from "node:fs";
import path from "node:path";

import {
  coverageExpectations,
  finalSoundLevelOneForbiddenItemKeys,
  finalSoundLevelTwoExpectedItemKeys
} from "../src/data/coverageExpectations.js";
import {
  buildFinalSoundAvailabilitySummary,
  finalSoundLevelOneTargets
} from "../src/data/finalSoundMasteryDepth.js";
import { isMediaDeleted } from "../src/data/deletedMediaManifest.js";
import {
  getMediaQaId,
  isMediaQaRuntimeAllowed,
  isQuestionBlockedByMediaQa
} from "../src/data/mediaQaManifest.js";
import {
  managedAssessmentSkillDepthConfig,
  SKILL_LEVEL_DEPTH_TARGETS
} from "../src/data/skillLevelDepthConfig.js";
import { getQuestionRoutingFormat } from "../src/data/skillTemplateRouting.js";
import { getQuestionSignature } from "../src/questionRepeatGuards.js";
import {
  getEarlySkillRuntimeEligibilityIssues,
  isListenPrompt,
  normalizeEarlySkillId
} from "../src/utils/earlySkills/isRuntimeEligibleEarlySkillQuestion.js";
import {
  buildRound,
  getDepthLevel,
  getDepthSkillId,
  getQuestionMediaPaths as getDepthQuestionMediaPaths,
  markdownTable,
  uniqueRuntimeQuestions
} from "./skillLevelDepthShared.js";
import {
  getQuestionAudioPaths,
  getQuestionImagePaths,
  getQuestionTargetWord,
  inferPatternForSkill,
  loadCoreQuestionPool,
  publicPathExists,
  questionFilterReason,
  repoRoot
} from "./phonicsRuntimeUtils.js";

const outputDir = path.join(repoRoot, "docs", "validation");
const assetsDir = path.join(repoRoot, "docs", "assets");
const markdownPath = path.join(outputDir, "all_skill_level_media_audit.md");
const jsonPath = path.join(outputDir, "all_skill_level_media_audit.json");
const kimiPath = path.join(assetsDir, "next_kimi_media_request_from_skill_audit.md");

const phaseSize = SKILL_LEVEL_DEPTH_TARGETS.phaseSize || 15;
const minimumPerLevel = SKILL_LEVEL_DEPTH_TARGETS.minimumPerLevel || 30;

const requestedSkills = [
  ["initial_sounds", "Initial Sounds", "Phonics"],
  ["final_sounds", "Final Sounds", "Phonics"],
  ["rhyming", "Rhyming", "Phonological Awareness"],
  ["cvc_short_vowels", "CVC and Short Vowels", "Phonics"],
  ["short_vowel_discrimination", "Short Vowel Discrimination", "Phonics"],
  ["hfw_1_25", "High-Frequency Words 1-25", "Fluency"],
  ["hfw_26_50", "High-Frequency Words 26-50", "Fluency"],
  ["hfw_51_100", "High-Frequency Words 51-100", "Fluency"],
  ["blends", "Blends", "Phonics"],
  ["digraphs", "Digraphs", "Phonics"],
  ["long_vowels_silent_e", "Long Vowels and Silent E", "Phonics"],
  ["vowel_teams", "Vowel Teams", "Phonics"],
  ["r_controlled_vowels", "R-Controlled Vowels", "Phonics"],
  ["nouns", "Nouns", "Grammar"],
  ["verbs", "Verbs", "Grammar"],
  ["adjectives", "Adjectives", "Grammar"],
  ["prepositions_of_place", "Prepositions of Place", "Grammar"],
  ["plurals", "Plurals", "Grammar"],
  ["prefixes_suffixes", "Prefixes and Suffixes", "Morphology"],
  ["antonyms_synonyms", "Antonyms and Synonyms", "Vocabulary"],
  ["homophones_homonyms", "Homophones and Homonyms", "Vocabulary"],
  ["sentence_comprehension", "Sentence Comprehension", "Comprehension"],
  ["key_details", "Key Details", "Comprehension"],
  ["sequencing", "Sequencing", "Comprehension"],
  ["main_idea", "Main Idea", "Comprehension"],
  ["inference", "Inference", "Comprehension"],
  ["cause_effect", "Cause and Effect", "Comprehension"],
  ["context_clues", "Context Clues", "Comprehension"],
  ["theme_higher_comprehension", "Theme and Higher Comprehension", "Comprehension"]
].map(([skillId, skillName, category], index) => ({ skillNumber: index + 1, skillId, skillName, category }));

const earlySkillIds = new Set([
  "initial_sounds",
  "final_sounds",
  "rhyming",
  "cvc_short_vowels",
  "short_vowel_discrimination"
]);

const imageMisusePattern = /(?:speaker|audio-button|volume|question-visual|\/ui\/|\/icons?\/|speaker-icon|placeholder|fallback|missing|unavailable|coming-soon|blank|\.svg$)/i;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function normalize(value = "") {
  return String(value || "").toLowerCase().trim();
}

function normalizeToken(value = "") {
  return normalize(value)
    .replace(/^\/|\/$/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function display(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value === true) return "yes";
  if (value === false) return "no";
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function getQuestionSkillId(question = {}) {
  return getDepthSkillId(question);
}

function getQuestionLevel(question = {}) {
  return getDepthLevel(question);
}

function getAnswerOptions(question = {}) {
  const raw = [
    ...(Array.isArray(question.answerOptions) ? question.answerOptions : []),
    ...(Array.isArray(question.choices) ? question.choices : [])
  ];
  return raw.map(option => {
    if (option && typeof option === "object") return option.label || option.value || option.word || option.text || option.answer || "";
    return option;
  }).filter(Boolean);
}

function inferCoverageTarget(skillId, question = {}) {
  const explicit = question.coverageTarget ||
    question.itemKey ||
    question.targetFinalSound ||
    question.targetSound ||
    question.phonicsPattern ||
    question.targetPattern ||
    question.rime ||
    question.rhymeFamily ||
    question.medialVowel ||
    question.initialSound ||
    question.correctAnswer ||
    question.answer;
  const inferred = inferPatternForSkill(skillId, question);
  return normalizeToken(inferred || explicit);
}

function getQuestionTemplate(question = {}) {
  return getQuestionRoutingFormat(question) ||
    String(question.formatType || question.templateType || question.questionType || "UNKNOWN").toUpperCase();
}

function getQuestionPromptText(question = {}) {
  return [
    question.prompt,
    question.question,
    question.spokenPrompt,
    question.audioText,
    question.instructions
  ].filter(Boolean).join(" ");
}

function requiresImage(skillId, question = {}) {
  const template = getQuestionTemplate(question).toLowerCase();
  const prompt = getQuestionPromptText(question).toLowerCase();
  if (["initial_sounds", "final_sounds", "rhyming"].includes(skillId)) return true;
  if (skillId === "cvc_short_vowels" || skillId === "short_vowel_discrimination") {
    return Boolean(
      question.imageUrl ||
      question.imagePath ||
      question.image ||
      question.imageCards?.length ||
      question.promptImageCards?.length ||
      template.includes("picture") ||
      template.includes("image") ||
      prompt.includes("picture") ||
      prompt.includes("image")
    );
  }
  return Boolean(
    question.imageUrl ||
    question.imagePath ||
    question.image ||
    question.imageCards?.length ||
    question.promptImageCards?.length ||
    Object.keys(question.choiceImages || {}).length ||
    template.includes("picture") ||
    template.includes("image") ||
    prompt.includes("picture") ||
    prompt.includes("image")
  );
}

function requiresAudio(skillId, question = {}) {
  const template = getQuestionTemplate(question).toLowerCase();
  const prompt = getQuestionPromptText(question).toLowerCase();
  if (skillId === "initial_sounds" || skillId === "final_sounds") return true;
  if (skillId.startsWith("hfw_")) {
    return template.includes("listen") || prompt.includes("listen") || prompt.includes("hear");
  }
  return Boolean(
    isListenPrompt(question) ||
    template.includes("listen") ||
    template.includes("audio") ||
    prompt.includes("listen") ||
    prompt.includes("hear") ||
    prompt.includes("sound button")
  );
}

function mediaBreakdown(question = {}) {
  const images = getQuestionImagePaths(question);
  const audio = getQuestionAudioPaths(question);
  const targetImagePaths = [
    question.imagePath,
    question.imageUrl,
    question.image,
    question.targetImage,
    question.targetImagePath,
    question.targetImageUrl
  ].filter(Boolean);
  const optionImagePaths = [
    ...(Array.isArray(question.imageCards) ? question.imageCards.flatMap(card => [card.image, card.imageUrl, card.imagePath]) : []),
    ...(Array.isArray(question.promptImageCards) ? question.promptImageCards.flatMap(card => [card.image, card.imageUrl, card.imagePath]) : []),
    ...(Array.isArray(question.answerOptions) ? question.answerOptions.flatMap(option => [option?.image, option?.imageUrl, option?.imagePath]) : []),
    ...Object.values(question.choiceImages || {}).flatMap(asset => [asset?.image, asset?.imageUrl, asset?.imagePath])
  ].filter(Boolean);
  const targetAudioPaths = [question.audioPath, question.audioUrl, question.audio].filter(Boolean);
  const optionAudioPaths = [
    ...(Array.isArray(question.imageCards) ? question.imageCards.flatMap(card => [card.audio, card.audioUrl, card.audioPath]) : []),
    ...(Array.isArray(question.answerOptions) ? question.answerOptions.flatMap(option => [option?.audio, option?.audioUrl, option?.audioPath]) : [])
  ].filter(Boolean);

  return {
    images: [...new Set(images)],
    audio: [...new Set(audio)],
    targetImagePaths: [...new Set(targetImagePaths)],
    optionImagePaths: [...new Set(optionImagePaths)],
    targetAudioPaths: [...new Set(targetAudioPaths)],
    optionAudioPaths: [...new Set(optionAudioPaths)]
  };
}

function getRawQuestionFilterReason(question = {}, skillId = getQuestionSkillId(question)) {
  if (question.active === false) return "inactive";
  if (!question.correctAnswer && !question.answer && !question.correctAnswers) return "missing correct answer";

  const images = getQuestionImagePaths(question);
  const audio = getQuestionAudioPaths(question);
  const missingImages = images.filter(assetPath => String(assetPath).startsWith("/") && !publicPathExists(assetPath));
  const missingAudio = audio.filter(assetPath => String(assetPath).startsWith("/") && !publicPathExists(assetPath));
  if (missingImages.length) return `missing image: ${missingImages.slice(0, 4).join(", ")}`;
  if (missingAudio.length && requiresAudio(skillId, question)) return `missing required audio: ${missingAudio.slice(0, 4).join(", ")}`;
  if (isQuestionBlockedByMediaQa(question)) return "blocked/rejected/needs-Kimi media";
  return "";
}

function getRuntimeIssues(question = {}, skillId = getQuestionSkillId(question), level = getQuestionLevel(question)) {
  if (earlySkillIds.has(skillId)) {
    return getEarlySkillRuntimeEligibilityIssues(question, {
      skillId: normalizeEarlySkillId(skillId),
      level,
      pathExists: publicPathExists
    });
  }
  const broad = getRawQuestionFilterReason(question, skillId);
  return broad ? [broad] : [];
}

function isRuntimeSafe(question = {}, skillId = getQuestionSkillId(question), level = getQuestionLevel(question)) {
  return question.active !== false && getRuntimeIssues(question, skillId, level).length === 0;
}

function countBy(items, getKey) {
  const map = new Map();
  for (const item of items) {
    const key = getKey(item) || "(missing)";
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Object.fromEntries([...map.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
}

function topEntries(counts, limit = 8) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
    .slice(0, limit)
    .map(([key, count]) => `${key}:${count}`);
}

function assessPhaseReadiness(items = []) {
  const phaseOne = buildRound(items, phaseSize, 0);
  const phaseTwo = buildRound(items.filter(item => !phaseOne.includes(item)), phaseSize, 7);
  return {
    phase1Ready: phaseOne.length >= phaseSize,
    phase2Ready: phaseTwo.length >= phaseSize,
    phase1Count: phaseOne.length,
    phase2Count: phaseTwo.length,
    phase1SampleIds: phaseOne.map(item => item.id).slice(0, phaseSize),
    phase2SampleIds: phaseTwo.map(item => item.id).slice(0, phaseSize)
  };
}

function statusForSkill(audit) {
  const level1 = audit.levels["1"];
  const level2 = audit.levels["2"];
  if (!level1?.designed && !level2?.designed) return "BLOCKED";
  if (audit.media.missingRequiredImageCount > 0) return "NEEDS IMAGES";
  if (audit.media.missingRequiredAudioCount > 0) return "NEEDS AUDIO";
  if (level1?.designed && !level1.depthReady) return "NEEDS QUESTIONS";
  if (level2?.designed && !level2.depthReady) return "NEEDS QUESTIONS";
  if (level1?.depthReady && !level2?.designed) return "READY L1 ONLY";
  if (level1?.depthReady && level2?.depthReady) return "READY";
  if (level1?.depthReady && level2?.designed && !level2.depthReady) return "NEEDS LEVEL 2 DESIGN";
  return "NEEDS QUESTIONS";
}

function questionWithDepthFields(question = {}, skillId = getQuestionSkillId(question)) {
  const level = getQuestionLevel(question);
  return {
    ...question,
    depthSkillId: skillId,
    depthLevel: level,
    depthFormat: getQuestionTemplate(question),
    depthTargetWord: getQuestionTargetWord(question),
    depthItemKey: inferCoverageTarget(skillId, question)
  };
}

function summarizeMedia(skillId, rawQuestions, runtimeSafeQuestions) {
  const summary = {
    imageRequiredCount: 0,
    optionalImageCount: 0,
    validImageCount: 0,
    missingRequiredImageCount: 0,
    audioRequiredCount: 0,
    optionalAudioCount: 0,
    validAudioCount: 0,
    missingRequiredAudioCount: 0,
    promptAudioCount: 0,
    cardOptionAudioCount: 0,
    targetWordAudioCount: 0,
    objectImageCount: 0,
    optionCardImageCount: 0,
    placeholderSpeakerIconMisuseCount: 0,
    deletedMediaReferencedCount: 0,
    blockedMediaReferencedCount: 0,
    textOnlyAcceptableCount: 0,
    textOnlyProblematicCount: 0,
    missingMediaExamples: []
  };

  for (const question of rawQuestions) {
    const breakdown = mediaBreakdown(question);
    const imageRequired = requiresImage(skillId, question);
    const audioRequired = requiresAudio(skillId, question);
    const validImages = breakdown.images.filter(assetPath => String(assetPath).startsWith("/") && publicPathExists(assetPath));
    const validAudio = breakdown.audio.filter(assetPath => String(assetPath).startsWith("/") && publicPathExists(assetPath));
    const missingImages = breakdown.images.filter(assetPath => String(assetPath).startsWith("/") && !publicPathExists(assetPath));
    const missingAudio = breakdown.audio.filter(assetPath => String(assetPath).startsWith("/") && !publicPathExists(assetPath));
    const blockedPaths = [
      ...breakdown.images.filter(assetPath => !isMediaQaRuntimeAllowed(assetPath, "image")),
      ...breakdown.audio.filter(assetPath => !isMediaQaRuntimeAllowed(assetPath, "audio"))
    ];
    const deletedPaths = [...breakdown.images, ...breakdown.audio].filter(isMediaDeleted);

    if (imageRequired) summary.imageRequiredCount += 1;
    else if (breakdown.images.length) summary.optionalImageCount += 1;
    if (audioRequired) summary.audioRequiredCount += 1;
    else if (breakdown.audio.length) summary.optionalAudioCount += 1;

    if (validImages.length) summary.validImageCount += 1;
    if (validAudio.length) summary.validAudioCount += 1;
    if (imageRequired && (!breakdown.images.length || missingImages.length)) {
      summary.missingRequiredImageCount += 1;
      summary.missingMediaExamples.push({
        id: question.id,
        targetWord: getQuestionTargetWord(question),
        type: "image",
        missing: missingImages.length ? missingImages : ["no image path declared"]
      });
    }
    if (audioRequired && (!breakdown.audio.length || missingAudio.length)) {
      summary.missingRequiredAudioCount += 1;
      summary.missingMediaExamples.push({
        id: question.id,
        targetWord: getQuestionTargetWord(question),
        type: "audio",
        missing: missingAudio.length ? missingAudio : ["no audio path declared"]
      });
    }

    if (isListenPrompt(question) && breakdown.audio.length) summary.promptAudioCount += 1;
    if (breakdown.optionAudioPaths.length) summary.cardOptionAudioCount += 1;
    if (breakdown.targetAudioPaths.length) summary.targetWordAudioCount += 1;
    if (breakdown.targetImagePaths.length) summary.objectImageCount += 1;
    if (breakdown.optionImagePaths.length) summary.optionCardImageCount += 1;
    if (breakdown.images.some(assetPath => imageMisusePattern.test(assetPath))) summary.placeholderSpeakerIconMisuseCount += 1;
    if (deletedPaths.length) summary.deletedMediaReferencedCount += 1;
    if (blockedPaths.length) summary.blockedMediaReferencedCount += 1;
    if (!breakdown.images.length && !breakdown.audio.length) {
      if (imageRequired || audioRequired) summary.textOnlyProblematicCount += 1;
      else summary.textOnlyAcceptableCount += 1;
    }
  }

  summary.missingMediaExamples = summary.missingMediaExamples.slice(0, 30);
  summary.runtimeImageBackedCount = runtimeSafeQuestions.filter(question => mediaBreakdown(question).images.length).length;
  summary.runtimeAudioBackedCount = runtimeSafeQuestions.filter(question => mediaBreakdown(question).audio.length).length;
  return summary;
}

function summarizeSkill(skillConfig, rawPool) {
  const config = managedAssessmentSkillDepthConfig.find(item => item.skillId === skillConfig.skillId) || {
    skillId: skillConfig.skillId,
    skillName: skillConfig.skillName,
    levels: {}
  };
  const rawQuestions = rawPool
    .filter(question => getQuestionSkillId(question) === skillConfig.skillId)
    .map(question => questionWithDepthFields(question, skillConfig.skillId));
  const activeQuestions = rawQuestions.filter(question => question.active !== false);
  const rawByLevel = countBy(rawQuestions, question => String(getQuestionLevel(question) || "unknown"));
  const runtimeCandidates = rawQuestions.map(question => {
    const level = getQuestionLevel(question);
    const issues = getRuntimeIssues(question, skillConfig.skillId, level);
    return {
      ...question,
      runtimeIssues: issues,
      runtimeSafe: question.active !== false && issues.length === 0
    };
  });
  const runtimeSafeQuestions = uniqueRuntimeQuestions(runtimeCandidates.filter(question => question.runtimeSafe));
  const rejected = runtimeCandidates
    .filter(question => !question.runtimeSafe)
    .map(question => ({
      id: question.id,
      source: question._source,
      level: getQuestionLevel(question),
      targetWord: getQuestionTargetWord(question),
      coverageTarget: inferCoverageTarget(skillConfig.skillId, question),
      reasons: question.runtimeIssues?.length ? question.runtimeIssues : [getRawQuestionFilterReason(question, skillConfig.skillId)].filter(Boolean)
    }));

  const levels = {};
  for (const levelNumber of [1, 2]) {
    const levelKey = String(levelNumber);
    const levelConfig = config.levels?.[levelNumber] || {};
    const designed = Boolean(levelConfig.designed);
    const levelRaw = rawQuestions.filter(question => getQuestionLevel(question) === levelNumber);
    const levelRuntimeSafe = runtimeSafeQuestions.filter(question => getQuestionLevel(question) === levelNumber);
    const uniqueTargetWords = [...new Set(levelRuntimeSafe.map(getQuestionTargetWord).filter(Boolean))].sort();
    const uniqueItemKeys = [...new Set(levelRuntimeSafe.map(question => inferCoverageTarget(skillConfig.skillId, question)).filter(Boolean))].sort();
    const templateCounts = countBy(levelRuntimeSafe, getQuestionTemplate);
    const targetCounts = countBy(levelRuntimeSafe, getQuestionTargetWord);
    const itemCounts = countBy(levelRuntimeSafe, question => inferCoverageTarget(skillConfig.skillId, question));
    const phase = assessPhaseReadiness(levelRuntimeSafe);
    const missingCount = designed ? Math.max(0, minimumPerLevel - levelRuntimeSafe.length) : 0;
    const diversityCount = Math.max(uniqueTargetWords.length, uniqueItemKeys.length);
    levels[levelKey] = {
      designed,
      rule: levelConfig.rule || levelConfig.proposedMeaning || "",
      configuredItemKeys: levelConfig.allowedItemKeys || coverageExpectations[skillConfig.skillId]?.levels?.[levelNumber] || coverageExpectations[skillConfig.skillId]?.itemKeys || [],
      allowedFormats: levelConfig.allowedFormats || [],
      rawQuestionCount: levelRaw.length,
      runtimeSafeQuestionCount: levelRuntimeSafe.length,
      activeRuntimeQuestionCount: levelRuntimeSafe.filter(question => question.active !== false).length,
      uniqueTargetWordCount: uniqueTargetWords.length,
      uniqueTargetWords: uniqueTargetWords.slice(0, 80),
      uniqueCoverageItemCount: uniqueItemKeys.length,
      uniqueCoverageItems: uniqueItemKeys,
      phase1Ready: phase.phase1Ready,
      phase2Ready: phase.phase2Ready,
      canBuildPhase1Round: phase.phase1Ready,
      canBuildPhase2Round: phase.phase2Ready,
      phase1SampleIds: phase.phase1SampleIds,
      phase2SampleIds: phase.phase2SampleIds,
      missingQuestionCountFor30: missingCount,
      depthReady: designed && levelRuntimeSafe.length >= minimumPerLevel && phase.phase1Ready && phase.phase2Ready && diversityCount >= Math.min(phaseSize, levelRuntimeSafe.length),
      templateCounts,
      repeatedTemplates: topEntries(templateCounts, 6),
      overusedTargetWords: topEntries(targetCounts, 8).filter(entry => Number(entry.split(":").pop()) > 3),
      overusedCoverageItems: topEntries(itemCounts, 8).filter(entry => Number(entry.split(":").pop()) > 5),
      examples: levelRuntimeSafe.slice(0, 10).map(question => ({
        id: question.id,
        source: question._source,
        targetWord: getQuestionTargetWord(question),
        coverageTarget: inferCoverageTarget(skillConfig.skillId, question),
        template: getQuestionTemplate(question)
      }))
    };
  }

  const unclassified = runtimeSafeQuestions.filter(question => ![1, 2].includes(getQuestionLevel(question)));
  const media = summarizeMedia(skillConfig.skillId, rawQuestions, runtimeSafeQuestions);
  const configured = coverageExpectations[skillConfig.skillId] || {};
  const configuredCoverageItems = [
    ...(configured.itemKeys || []),
    ...Object.values(configured.levels || {}).flat()
  ];
  const audit = {
    ...skillConfig,
    configuredCoverageTotal: new Set(configuredCoverageItems).size || 0,
    coverageItemNames: [...new Set(configuredCoverageItems)],
    level1ConfiguredItemKeys: levels["1"].configuredItemKeys,
    level2ConfiguredItemKeys: levels["2"].configuredItemKeys,
    totalRawQuestions: rawQuestions.length,
    totalActiveQuestions: activeQuestions.length,
    totalRuntimeSafeQuestions: runtimeSafeQuestions.length,
    activeRuntimeQuestions: runtimeSafeQuestions.filter(question => question.active !== false).length,
    levelUnknownUnclassifiedCount: unclassified.length,
    levels,
    media,
    rejectedExcludedQuestions: rejected.slice(0, 80),
    rejectedReasonCounts: countBy(rejected.flatMap(item => item.reasons || []), reason => reason),
    uniqueRuntimeCoverageItems: [...new Set(runtimeSafeQuestions.map(question => inferCoverageTarget(skillConfig.skillId, question)).filter(Boolean))].sort(),
    needs: {
      level1QuestionCount: Math.max(0, minimumPerLevel - levels["1"].runtimeSafeQuestionCount),
      level2QuestionCount: levels["2"].designed ? Math.max(0, minimumPerLevel - levels["2"].runtimeSafeQuestionCount) : 0,
      missingImageCount: media.missingRequiredImageCount,
      missingAudioCount: media.missingRequiredAudioCount,
      generatedQuestionType: suggestQuestionType(skillConfig.skillId),
      needsClaudeWriting: needsWriting(skillConfig.skillId, levels),
      needsKimiMedia: media.missingRequiredImageCount > 0 || media.missingRequiredAudioCount > 0,
      noActionNeeded: false
    }
  };
  audit.status = statusForSkill(audit);
  audit.needs.noActionNeeded = audit.status === "READY" || audit.status === "READY L1 ONLY";
  return audit;
}

function suggestQuestionType(skillId) {
  if (skillId === "initial_sounds") return "image/audio initial-sound pair-select and letter-choice items";
  if (skillId === "final_sounds") return "object-image + word-audio final-sound listening items";
  if (skillId === "rhyming") return "image-backed rhyme choice cards grouped by rime family";
  if (skillId === "cvc_short_vowels" || skillId === "short_vowel_discrimination") return "CVC picture/audio short-vowel and missing-vowel items";
  if (skillId.startsWith("hfw_")) return "listen/find word cards and sentence cloze items";
  if (["key_details", "sequencing", "main_idea", "inference", "cause_effect", "context_clues", "theme_higher_comprehension"].includes(skillId)) {
    return "short passage comprehension items";
  }
  return "level-tagged multiple-choice/image-card items";
}

function needsWriting(skillId, levels) {
  const comprehension = new Set(["key_details", "sequencing", "main_idea", "inference", "cause_effect", "context_clues", "theme_higher_comprehension"]);
  return comprehension.has(skillId) && (levels["1"].missingQuestionCountFor30 > 0 || levels["2"].missingQuestionCountFor30 > 0);
}

function buildFinalSoundsSpecialAudit(audit) {
  const allQuestions = loadCoreQuestionPool()
    .filter(question => getQuestionSkillId(question) === "final_sounds")
    .map(question => questionWithDepthFields(question, "final_sounds"));
  const runtimeLevelOne = allQuestions.filter(question =>
    getQuestionLevel(question) === 1 &&
    isRuntimeSafe(question, "final_sounds", 1)
  );
  const levelOneSummary = buildFinalSoundAvailabilitySummary(runtimeLevelOne);
  const leaks = runtimeLevelOne.filter(question => {
    const target = inferCoverageTarget("final_sounds", question);
    const options = getAnswerOptions(question).map(normalizeToken);
    return finalSoundLevelOneForbiddenItemKeys.includes(target) ||
      finalSoundLevelTwoExpectedItemKeys.includes(target) ||
      options.some(option => option.length !== 1 || finalSoundLevelOneForbiddenItemKeys.includes(option));
  });
  const levelTwoQuestions = allQuestions.filter(question =>
    getQuestionLevel(question) === 2 &&
    isRuntimeSafe(question, "final_sounds", 2)
  );
  return {
    allowedLevel1Endings: finalSoundLevelOneTargets,
    level1RuntimeSafeCountPerEnding: Object.fromEntries(Object.entries(levelOneSummary).map(([key, row]) => [key, row.runtimeVariantCount])),
    level1UniqueTargetWordsPerEnding: Object.fromEntries(Object.entries(levelOneSummary).map(([key, row]) => [key, row.distinctTargetWords])),
    level1MasteryDepthReadiness: Object.fromEntries(Object.entries(levelOneSummary).map(([key, row]) => [key, {
      distinctTargetWordCount: row.distinctTargetWordCount,
      requiredContentWords: row.requiredContentWords,
      ready: !row.contentGap
    }])),
    bDeepEnough: !levelOneSummary.b?.contentGap,
    lDeepEnough: !levelOneSummary.l?.contentGap,
    level2RuntimeSafeCount: levelTwoQuestions.length,
    level2EndingsCount: new Set(levelTwoQuestions.map(question => inferCoverageTarget("final_sounds", question)).filter(Boolean)).size,
    advancedLevel1Leaks: leaks.map(question => ({
      id: question.id,
      targetWord: getQuestionTargetWord(question),
      coverageTarget: inferCoverageTarget("final_sounds", question),
      answerOptions: getAnswerOptions(question)
    }))
  };
}

function buildKimiRequests(skillAudits) {
  const seen = new Set();
  const requests = [];
  for (const skill of skillAudits) {
    for (const example of skill.media.missingMediaExamples || []) {
      const key = `${skill.skillId}:${example.type}:${example.targetWord}:${example.missing.join(",")}`;
      if (seen.has(key)) continue;
      seen.add(key);
      requests.push({
        skillId: skill.skillId,
        skillName: skill.skillName,
        targetWord: example.targetWord || "(unknown)",
        mediaType: example.type,
        questionId: example.id,
        missing: example.missing,
        prompt: example.type === "image"
          ? `Create one clean, natural-coloured educational cartoon flashcard image for ${example.targetWord || "the target word"}. White background, one clear object/action, no text, no shadows, no sparkle, no rainbow/fantasy colours, no face on objects.`
          : `Record clear American English spoken word audio for ${example.targetWord || "the target word"}. Spoken word only, neutral adult female voice preferred, no music or sound effects, normalized volume, short silence before and after, mp3.`
      });
    }
  }
  return requests;
}

function buildMarkdown(report) {
  const summaryRows = [
    ["Total skills audited", report.summary.totalSkillsAudited],
    ["Skills fully ready Level 1 + Level 2", report.summary.skillsFullyReady],
    ["Skills Level 1 ready only", report.summary.skillsLevel1ReadyOnly],
    ["Skills needing Level 2 design/questions", report.summary.skillsNeedingLevel2Design],
    ["Skills missing media", report.summary.skillsMissingMedia],
    ["Skills missing audio", report.summary.skillsMissingAudio],
    ["Skills missing images", report.summary.skillsMissingImages],
    ["Total runtime-safe questions", report.summary.totalRuntimeSafeQuestions],
    ["Total image-backed runtime questions", report.summary.totalImageBackedRuntimeQuestions],
    ["Total audio-backed runtime questions", report.summary.totalAudioBackedRuntimeQuestions],
    ["Total text-only acceptable questions", report.summary.totalTextOnlyAcceptableQuestions],
    ["Total text-only problematic questions", report.summary.totalTextOnlyProblematicQuestions]
  ];

  const overviewRows = report.skills.map(skill => [
    skill.skillNumber,
    skill.skillName,
    skill.status,
    skill.totalRawQuestions,
    skill.totalRuntimeSafeQuestions,
    skill.levels["1"].runtimeSafeQuestionCount,
    `${skill.levels["1"].phase1Ready ? "yes" : "no"}/${skill.levels["1"].phase2Ready ? "yes" : "no"}`,
    skill.levels["2"].designed ? skill.levels["2"].runtimeSafeQuestionCount : "not designed",
    skill.levels["2"].designed ? `${skill.levels["2"].phase1Ready ? "yes" : "no"}/${skill.levels["2"].phase2Ready ? "yes" : "no"}` : "n/a",
    skill.media.missingRequiredImageCount,
    skill.media.missingRequiredAudioCount
  ]);

  const needRows = report.skills.map(skill => [
    skill.skillName,
    skill.status,
    skill.needs.level1QuestionCount,
    skill.needs.level2QuestionCount,
    skill.needs.missingImageCount,
    skill.needs.missingAudioCount,
    skill.needs.generatedQuestionType,
    skill.needs.needsClaudeWriting ? "yes" : "no",
    skill.needs.needsKimiMedia ? "yes" : "no"
  ]);

  const finalRows = Object.entries(report.finalSoundsSpecial.level1MasteryDepthReadiness).map(([target, row]) => [
    target,
    report.finalSoundsSpecial.level1RuntimeSafeCountPerEnding[target] || 0,
    report.finalSoundsSpecial.level1UniqueTargetWordsPerEnding[target]?.length || 0,
    row.requiredContentWords,
    row.ready ? "yes" : "no",
    (report.finalSoundsSpecial.level1UniqueTargetWordsPerEnding[target] || []).join(", ")
  ]);

  const lines = [
    "# All Skill Level and Media Audit",
    "",
    `Generated by \`node tools/auditAllSkillLevelsAndMedia.js\`.`,
    "",
    "This report inspects the assessment question banks and runtime-safe selection pools. Student dashboard coverage numbers are not used here.",
    "",
    "## Summary Dashboard",
    "",
    markdownTable(["Metric", "Value"], summaryRows),
    "",
    "## Skill Readiness Overview",
    "",
    markdownTable([
      "#",
      "Skill",
      "Status",
      "Raw",
      "Runtime-safe",
      "L1 safe",
      "L1 P1/P2",
      "L2 safe",
      "L2 P1/P2",
      "Missing images",
      "Missing audio"
    ], overviewRows),
    "",
    "## Needed Next Media / Questions",
    "",
    markdownTable([
      "Skill",
      "Status",
      "Missing L1 questions",
      "Missing L2 questions",
      "Missing images",
      "Missing audio",
      "Recommended question type",
      "Claude writing",
      "Kimi media"
    ], needRows),
    "",
    "## Final Sounds Special Check",
    "",
    `- Level 1 allowed endings: ${report.finalSoundsSpecial.allowedLevel1Endings.join(", ")}`,
    `- Level 2 runtime-safe count: ${report.finalSoundsSpecial.level2RuntimeSafeCount}`,
    `- Level 2 endings represented: ${report.finalSoundsSpecial.level2EndingsCount}`,
    `- Level 1 advanced ending leaks: ${report.finalSoundsSpecial.advancedLevel1Leaks.length}`,
    `- /b/ depth ready: ${report.finalSoundsSpecial.bDeepEnough ? "yes" : "no"}`,
    `- /l/ depth ready: ${report.finalSoundsSpecial.lDeepEnough ? "yes" : "no"}`,
    "",
    markdownTable(["Ending", "Runtime variants", "Distinct words", "Required words", "Depth ready", "Words"], finalRows),
    ""
  ];

  for (const skill of report.skills) {
    lines.push(`## ${skill.skillNumber}. ${skill.skillName}`);
    lines.push("");
    lines.push(`- Status: **${skill.status}**`);
    lines.push(`- Category: ${skill.category}`);
    lines.push(`- Skill id: \`${skill.skillId}\``);
    lines.push(`- Configured coverage total: ${skill.configuredCoverageTotal}`);
    lines.push(`- Coverage items: ${skill.coverageItemNames.join(", ") || "-"}`);
    lines.push(`- Raw questions: ${skill.totalRawQuestions}`);
    lines.push(`- Runtime-safe questions: ${skill.totalRuntimeSafeQuestions}`);
    lines.push(`- Active runtime questions: ${skill.activeRuntimeQuestions}`);
    lines.push(`- Unknown/unclassified level runtime-safe count: ${skill.levelUnknownUnclassifiedCount}`);
    lines.push("");
    lines.push(markdownTable([
      "Level",
      "Designed",
      "Raw",
      "Runtime-safe",
      "Unique words",
      "Unique coverage",
      "Phase 1",
      "Phase 2",
      "Missing for 30",
      "Depth ready"
    ], [1, 2].map(level => {
      const row = skill.levels[String(level)];
      return [
        level,
        row.designed ? "yes" : "no",
        row.rawQuestionCount,
        row.runtimeSafeQuestionCount,
        row.uniqueTargetWordCount,
        row.uniqueCoverageItemCount,
        `${row.phase1Ready ? "yes" : "no"} (${row.phase1SampleIds.length}/15)`,
        `${row.phase2Ready ? "yes" : "no"} (${row.phase2SampleIds.length}/15)`,
        row.missingQuestionCountFor30,
        row.depthReady ? "yes" : "no"
      ];
    })));
    lines.push("");
    lines.push("### Media");
    lines.push("");
    lines.push(markdownTable(["Metric", "Count"], [
      ["Questions requiring images", skill.media.imageRequiredCount],
      ["Questions with valid image", skill.media.validImageCount],
      ["Questions missing required image", skill.media.missingRequiredImageCount],
      ["Questions requiring audio", skill.media.audioRequiredCount],
      ["Questions with valid audio", skill.media.validAudioCount],
      ["Questions missing required audio", skill.media.missingRequiredAudioCount],
      ["Prompt audio count", skill.media.promptAudioCount],
      ["Card/option audio count", skill.media.cardOptionAudioCount],
      ["Target-word audio count", skill.media.targetWordAudioCount],
      ["Object image count", skill.media.objectImageCount],
      ["Option/card image count", skill.media.optionCardImageCount],
      ["Placeholder/speaker-icon misuse count", skill.media.placeholderSpeakerIconMisuseCount],
      ["Deleted media referenced count", skill.media.deletedMediaReferencedCount],
      ["Blocked media referenced count", skill.media.blockedMediaReferencedCount],
      ["Text-only acceptable count", skill.media.textOnlyAcceptableCount],
      ["Text-only problematic count", skill.media.textOnlyProblematicCount]
    ]));
    lines.push("");
    lines.push("### Level Details");
    lines.push("");
    for (const level of [1, 2]) {
      const row = skill.levels[String(level)];
      lines.push(`- Level ${level} configured item keys: ${row.configuredItemKeys.join(", ") || "-"}`);
      lines.push(`- Level ${level} runtime coverage items: ${row.uniqueCoverageItems.join(", ") || "-"}`);
      lines.push(`- Level ${level} repeated templates: ${row.repeatedTemplates.join(", ") || "-"}`);
      lines.push(`- Level ${level} overused target words: ${row.overusedTargetWords.join(", ") || "-"}`);
      lines.push(`- Level ${level} overused coverage items: ${row.overusedCoverageItems.join(", ") || "-"}`);
    }
    lines.push("");
    if (skill.rejectedExcludedQuestions.length) {
      lines.push("### Rejected / Excluded Examples");
      lines.push("");
      lines.push(markdownTable(["Question id", "Source", "Level", "Target", "Coverage", "Reason"], skill.rejectedExcludedQuestions.slice(0, 16).map(item => [
        item.id,
        item.source,
        item.level,
        item.targetWord,
        item.coverageTarget,
        (item.reasons || []).join("; ")
      ])));
      lines.push("");
    }
  }

  return lines.join("\n");
}

function buildKimiMarkdown(requests) {
  const lines = [
    "# Next Kimi Media Request From Skill Audit",
    "",
    "This request includes only media that the audit found missing from active/question-bank items that otherwise need image or audio support. Do not generate replacements for already covered items.",
    "",
    "## Global Image Rules",
    "",
    "Create a clean educational flashcard-style cartoon illustration of a single target object/action. Plain pure white background. Centered. No shadow, glow, aura, sparkles, rainbow/fantasy colours, text, labels, watermark, or face on non-living objects. Natural colours only.",
    "",
    "## Global Audio Rules",
    "",
    "Neutral adult female voice preferred, American English, spoken word only, no music, no sound effects, normalized volume, short silence before and after, mp3.",
    ""
  ];
  if (!requests.length) {
    lines.push("No missing required Kimi media was found by this audit.");
    return lines.join("\n");
  }
  const grouped = Map.groupBy ? Map.groupBy(requests, request => `${request.mediaType}:${request.skillName}`) : null;
  const entries = grouped
    ? [...grouped.entries()]
    : Object.entries(requests.reduce((acc, request) => {
      const key = `${request.mediaType}:${request.skillName}`;
      acc[key] ||= [];
      acc[key].push(request);
      return acc;
    }, {}));
  for (const [key, rows] of entries) {
    const [mediaType, skillName] = key.split(":");
    lines.push(`## ${skillName} - ${mediaType}`);
    lines.push("");
    for (const request of rows) {
      lines.push(`### ${request.targetWord}`);
      lines.push(`- Skill: ${request.skillName} (\`${request.skillId}\`)`);
      lines.push(`- Question id: \`${request.questionId}\``);
      lines.push(`- Missing: ${request.missing.join(", ")}`);
      lines.push(`- Prompt/instruction: ${request.prompt}`);
      lines.push("");
    }
  }
  return lines.join("\n");
}

const rawPool = loadCoreQuestionPool();
const skills = requestedSkills.map(skill => summarizeSkill(skill, rawPool));
const finalSoundsSpecial = buildFinalSoundsSpecialAudit(skills.find(skill => skill.skillId === "final_sounds"));
const kimiRequests = buildKimiRequests(skills);
const summary = {
  totalSkillsAudited: skills.length,
  skillsFullyReady: skills.filter(skill => skill.status === "READY").length,
  skillsLevel1ReadyOnly: skills.filter(skill => skill.status === "READY L1 ONLY").length,
  skillsNeedingLevel2Design: skills.filter(skill => skill.status === "NEEDS LEVEL 2 DESIGN").length,
  skillsMissingMedia: skills.filter(skill => skill.media.missingRequiredImageCount || skill.media.missingRequiredAudioCount).length,
  skillsMissingAudio: skills.filter(skill => skill.media.missingRequiredAudioCount).length,
  skillsMissingImages: skills.filter(skill => skill.media.missingRequiredImageCount).length,
  totalRuntimeSafeQuestions: skills.reduce((sum, skill) => sum + skill.totalRuntimeSafeQuestions, 0),
  totalImageBackedRuntimeQuestions: skills.reduce((sum, skill) => sum + skill.media.runtimeImageBackedCount, 0),
  totalAudioBackedRuntimeQuestions: skills.reduce((sum, skill) => sum + skill.media.runtimeAudioBackedCount, 0),
  totalTextOnlyAcceptableQuestions: skills.reduce((sum, skill) => sum + skill.media.textOnlyAcceptableCount, 0),
  totalTextOnlyProblematicQuestions: skills.reduce((sum, skill) => sum + skill.media.textOnlyProblematicCount, 0),
  statuses: countBy(skills, skill => skill.status)
};

const report = {
  generatedAt: new Date().toISOString(),
  phaseSize,
  minimumPerLevel,
  summary,
  skills,
  finalSoundsSpecial,
  kimiRequests,
  notes: [
    "This audit reads the app question banks and current runtime gates. It does not use student progress/dashboard coverage.",
    "Level readiness requires two 15-question phases where the configured level is designed.",
    "Runtime-safe means active and passing the current media/template/early-phonics gates."
  ]
};

ensureDir(outputDir);
ensureDir(assetsDir);
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
fs.writeFileSync(markdownPath, buildMarkdown(report));
fs.writeFileSync(kimiPath, buildKimiMarkdown(kimiRequests));

console.log(`Skills audited: ${skills.length}`);
console.log(`Runtime-safe questions: ${summary.totalRuntimeSafeQuestions}`);
console.log(`Status counts: ${JSON.stringify(summary.statuses)}`);
console.log(`Missing media requests: ${kimiRequests.length}`);
console.log(`Wrote ${path.relative(repoRoot, markdownPath)}`);
console.log(`Wrote ${path.relative(repoRoot, jsonPath)}`);
console.log(`Wrote ${path.relative(repoRoot, kimiPath)}`);
