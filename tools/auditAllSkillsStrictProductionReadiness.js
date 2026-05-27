import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  finalSoundExpectedItemKeys,
  finalSoundLevelOneForbiddenItemKeys
} from "../src/data/coverageExpectations.js";
import {
  managedAssessmentSkillDepthConfig,
  SKILL_LEVEL_DEPTH_TARGETS
} from "../src/data/skillLevelDepthConfig.js";
import { getQuestionRoutingFormat } from "../src/data/skillTemplateRouting.js";
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
  docsValidationDir,
  getDepthLevel,
  getDepthSkillId,
  uniqueRuntimeQuestions
} from "./skillLevelDepthShared.js";

const outputMd = path.join(docsValidationDir, "all_skills_strict_production_audit.md");
const outputJson = path.join(docsValidationDir, "all_skills_strict_production_audit.json");
const assetsDir = path.join(repoRoot, "docs", "assets");
const kimiImagesPath = path.join(assetsDir, "kimi_strict_missing_images_request.md");
const kimiAudioPath = path.join(assetsDir, "kimi_strict_missing_audio_request.md");
const kimiCombinedPath = path.join(assetsDir, "kimi_strict_missing_media_combined_request.md");
const wiringPath = path.join(assetsDir, "media_wiring_fix_needed_from_strict_audit.md");
const claudePath = path.join(assetsDir, "claude_question_writing_request_from_strict_audit.md");
const desktopMd = path.join(os.homedir(), "Desktop", "LiteracyPath_Strict_Audit_For_ChatGPT.md");
const desktopJson = path.join(os.homedir(), "Desktop", "LiteracyPath_Strict_Audit_For_ChatGPT.json");

const phaseSize = SKILL_LEVEL_DEPTH_TARGETS.phaseSize || 15;
const minimumPerLevel = SKILL_LEVEL_DEPTH_TARGETS.minimumPerLevel || 30;
const minimumTotal = minimumPerLevel * 2;
const minimumUniqueTargetsPerLevel = 20;
const maxTargetDominance = 0.2;

const skillCategories = {
  initial_sounds: "Phonics",
  final_sounds: "Phonics",
  rhyming: "Phonological Awareness",
  cvc_short_vowels: "Phonics",
  short_vowel_discrimination: "Phonics",
  hfw_1_25: "High-Frequency Words",
  hfw_26_50: "High-Frequency Words",
  hfw_51_100: "High-Frequency Words",
  blends: "Phonics",
  digraphs: "Phonics",
  long_vowels_silent_e: "Phonics",
  vowel_teams: "Phonics",
  r_controlled_vowels: "Phonics",
  nouns: "Grammar",
  verbs: "Grammar",
  adjectives: "Grammar",
  prepositions_of_place: "Grammar",
  plurals: "Grammar",
  prefixes_suffixes: "Morphology",
  antonyms_synonyms: "Vocabulary",
  homophones_homonyms: "Vocabulary",
  sentence_comprehension: "Comprehension",
  key_details: "Comprehension",
  sequencing: "Comprehension",
  main_idea: "Comprehension",
  inference: "Comprehension",
  cause_effect: "Comprehension",
  context_clues: "Comprehension",
  theme_higher_comprehension: "Comprehension"
};

const mediaSearchRoots = [
  "public/media",
  "public/images",
  "public/audio",
  "public/guided-reading",
  "src/content/skillMedia",
  "src/data/audioPreferenceManifest.js",
  "src/data/kimiVocabulary500AudioPreferences.js",
  "src/data/kimiVocabulary500Lexicon.js",
  "src/content/lexicon/masterWordLexicon.js"
];

const earlyMediaSkills = new Set([
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

const hfwSkills = new Set(["hfw_1_25", "hfw_26_50", "hfw_51_100"]);

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, content);
}

function normalizeToken(value = "") {
  return normalizeWord(value)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function display(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
  return String(value);
}

function getTemplate(question = {}) {
  return getQuestionRoutingFormat(question) ||
    String(question.formatType || question.templateType || question.questionType || "UNKNOWN").toUpperCase();
}

function getAnswerOptions(question = {}) {
  const raw = [
    ...(Array.isArray(question.answerOptions) ? question.answerOptions : []),
    ...(Array.isArray(question.choices) ? question.choices : []),
    ...(Array.isArray(question.imageCards) ? question.imageCards : [])
  ];
  return raw.map(option => {
    if (option && typeof option === "object") return option.value || option.word || option.label || option.text || option.answer || "";
    return option;
  }).filter(Boolean).map(value => normalizeWord(value));
}

function getQuestionLevel(question = {}) {
  return getDepthLevel(question);
}

function getQuestionSkill(question = {}) {
  return getDepthSkillId(question);
}

function getItemKey(skillId, question = {}) {
  return normalizeToken(
    question.depthItemKey ||
    question.itemKey ||
    question.rimeFamily ||
    question.rhymeFamily ||
    question.targetPattern ||
    question.targetSound ||
    question.finalSound ||
    question.initialSound ||
    question.medialVowel ||
    inferPatternForSkill(skillId, question) ||
    getQuestionTargetWord(question) ||
    question.id
  );
}

function getTarget(skillId, question = {}) {
  return normalizeToken(getQuestionTargetWord(question) || getItemKey(skillId, question) || question.id);
}

function countBy(items, getKey) {
  const out = new Map();
  for (const item of items) {
    const key = getKey(item) || "(missing)";
    out.set(key, (out.get(key) || 0) + 1);
  }
  return Object.fromEntries([...out.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))));
}

function createMediaIndex() {
  const imageExtensions = new Set([".webp", ".png", ".jpg", ".jpeg", ".gif"]);
  const audioExtensions = new Set([".mp3", ".wav", ".m4a", ".aac", ".ogg"]);
  const images = new Map();
  const audio = new Map();
  const pathText = [];

  const add = (map, key, value) => {
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(value);
  };
  const visit = absolutePath => {
    if (!fs.existsSync(absolutePath)) return;
    const stat = fs.statSync(absolutePath);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(absolutePath)) visit(path.join(absolutePath, entry));
      return;
    }
    const relative = path.relative(repoRoot, absolutePath).replace(/\\/g, "/");
    const ext = path.extname(absolutePath).toLowerCase();
    const base = normalizeToken(path.basename(absolutePath, ext));
    const publicUrl = relative.startsWith("public/") ? `/${relative.replace(/^public\//, "")}` : relative;
    if (imageExtensions.has(ext)) add(images, base, publicUrl);
    if (audioExtensions.has(ext)) add(audio, base, publicUrl);
    if ([".js", ".json", ".md"].includes(ext)) {
      try {
        pathText.push(fs.readFileSync(absolutePath, "utf8"));
      } catch {
        // Ignore unreadable optional media source files.
      }
    }
  };

  for (const root of mediaSearchRoots) visit(path.join(repoRoot, root));

  const pathPattern = /["'`](\/[^"'`]+\.(?:webp|png|jpe?g|gif|mp3|wav|m4a|aac|ogg))["'`]/gi;
  for (const text of pathText) {
    for (const match of text.matchAll(pathPattern)) {
      const mediaPath = match[1];
      const ext = path.extname(mediaPath).toLowerCase();
      const key = normalizeToken(path.basename(mediaPath, ext));
      if (imageExtensions.has(ext)) add(images, key, mediaPath);
      if (audioExtensions.has(ext)) add(audio, key, mediaPath);
    }
  }

  return { images, audio };
}

function existingMediaFor(index, kind, target = "", expectedPath = "") {
  const map = kind === "image" ? index.images : index.audio;
  const candidates = new Set();
  const addCandidate = value => {
    const key = normalizeToken(value);
    if (key) candidates.add(key);
  };
  addCandidate(target);
  if (expectedPath) addCandidate(path.basename(expectedPath, path.extname(expectedPath)));
  for (const key of candidates) {
    const found = map.get(key) || [];
    if (found.length) return found;
  }
  return [];
}

function questionRequiresImage(skillId, question = {}) {
  const template = getTemplate(question).toLowerCase();
  const prompt = `${question.prompt || ""} ${question.question || ""}`.toLowerCase();
  if (["initial_sounds", "final_sounds", "rhyming"].includes(skillId)) return true;
  if (earlyMediaSkills.has(skillId)) {
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
  return Boolean(
    question.image || question.imageUrl || question.imagePath ||
    question.imageCards?.length ||
    question.promptImageCards?.length ||
    Object.keys(question.choiceImages || {}).length ||
    template.includes("picture") ||
    template.includes("image")
  );
}

function questionRequiresAudio(skillId, question = {}) {
  const template = getTemplate(question).toLowerCase();
  const prompt = `${question.prompt || ""} ${question.question || ""} ${question.spokenPrompt || ""}`.toLowerCase();
  if (["initial_sounds", "final_sounds"].includes(skillId)) return true;
  if (template.includes("listen") || template.includes("audio")) return true;
  if (prompt.includes("listen") || prompt.includes("hear") || prompt.includes("sound")) return true;
  return Boolean(question.audio || question.audioUrl || question.audioPath);
}

function textOnlyAcceptable(skillId, question = {}) {
  return comprehensionSkills.has(skillId) ||
    ["nouns", "verbs", "adjectives", "prepositions_of_place", "plurals", "prefixes_suffixes", "antonyms_synonyms", "homophones_homonyms"].includes(skillId) ||
    hfwSkills.has(skillId) ||
    !questionRequiresImage(skillId, question);
}

function mediaNeedsForQuestion(skill, question, mediaIndex) {
  const imagePaths = getQuestionImagePaths(question);
  const audioPaths = getQuestionAudioPaths(question);
  const target = getTarget(skill.skillId, question);
  const targetWord = getQuestionTargetWord(question) || target;
  const needs = [];
  const addNeed = (kind, expectedPath, reason) => {
    const existingElsewhere = existingMediaFor(mediaIndex, kind, targetWord, expectedPath);
    needs.push({
      skillNumber: skill.skillNumber,
      skill: skill.skillName,
      skillId: skill.skillId,
      level: getQuestionLevel(question),
      questionId: question.id || "(missing id)",
      sourceFile: question._source || "(unknown source)",
      targetWord,
      text: question.prompt || question.question || question.sentence || "",
      mediaType: kind,
      expectedFilename: path.basename(expectedPath || `${targetWord}.${kind === "image" ? "webp" : "mp3"}`),
      expectedDestinationPath: expectedPath || `/media/vocabulary/${kind === "image" ? "images" : "audio"}/${normalizeToken(targetWord).replace(/_/g, "-")}.${kind === "image" ? "webp" : "mp3"}`,
      reason,
      matchingFileExistsElsewhere: existingElsewhere.length > 0,
      existingPaths: existingElsewhere,
      finalAction: existingElsewhere.length ? "wire existing asset" : `generate with Kimi`
    });
  };

  if (questionRequiresImage(skill.skillId, question)) {
    if (!imagePaths.length) {
      addNeed("image", "", "required image has no declared path");
    } else {
      for (const assetPath of imagePaths) {
        if (String(assetPath).startsWith("/") && !publicPathExists(assetPath)) {
          addNeed("image", assetPath, "declared image path is missing");
        }
      }
    }
  }

  if (questionRequiresAudio(skill.skillId, question)) {
    if (!audioPaths.length) {
      addNeed("audio", "", "required audio has no declared path");
    } else {
      for (const assetPath of audioPaths) {
        if (String(assetPath).startsWith("/") && !publicPathExists(assetPath)) {
          addNeed("audio", assetPath, "declared audio path is missing");
        }
      }
    }
  }

  return needs;
}

function runtimeReason(question = {}) {
  const skillId = getQuestionSkill(question);
  if (!skillId) return "missing skill id";
  if (question.active === false) return "inactive";
  if (["initial_sounds", "final_sounds", "rhyming", "cvc_short_vowels", "short_vowel_discrimination"].includes(skillId)) {
    return questionFilterReason(question);
  }
  if (!question.correctAnswer && !question.answer && !question.correctAnswers) return "missing correct answer";
  const missingImage = getQuestionImagePaths(question).filter(assetPath => String(assetPath).startsWith("/") && !publicPathExists(assetPath));
  const missingAudio = getQuestionAudioPaths(question).filter(assetPath => String(assetPath).startsWith("/") && !publicPathExists(assetPath));
  if (missingImage.length) return `missing image: ${missingImage.slice(0, 3).join(", ")}`;
  if (missingAudio.length && questionRequiresAudio(skillId, question)) return `missing required audio: ${missingAudio.slice(0, 3).join(", ")}`;
  return "";
}

function isStrictUsable(skill, question, runtimeSafe) {
  if (!runtimeSafe) return false;
  const level = getQuestionLevel(question);
  const levelConfig = skill.config.levels[level];
  if (!levelConfig?.designed) return false;
  const template = getTemplate(question);
  if (levelConfig.allowedFormats?.length && !levelConfig.allowedFormats.includes(template)) return false;
  if (skill.skillId === "final_sounds" && level === 1) {
    const key = getItemKey(skill.skillId, question);
    const options = getAnswerOptions(question);
    if (!finalSoundExpectedItemKeys.includes(key)) return false;
    if (finalSoundLevelOneForbiddenItemKeys.includes(key)) return false;
    if (options.some(option => option.length !== 1 || finalSoundLevelOneForbiddenItemKeys.includes(option))) return false;
  }
  if (questionRequiresImage(skill.skillId, question)) {
    const imagePaths = getQuestionImagePaths(question);
    if (!imagePaths.length || imagePaths.some(assetPath => String(assetPath).startsWith("/") && !publicPathExists(assetPath))) return false;
  }
  if (questionRequiresAudio(skill.skillId, question)) {
    const audioPaths = getQuestionAudioPaths(question);
    if (!audioPaths.length || audioPaths.some(assetPath => String(assetPath).startsWith("/") && !publicPathExists(assetPath))) return false;
  }
  return true;
}

function buildSkillList() {
  return managedAssessmentSkillDepthConfig.map((config, index) => ({
    skillNumber: index + 1,
    skillId: config.skillId,
    skillName: config.skillName,
    category: skillCategories[config.skillId] || "Other",
    appOrder: index + 1,
    config
  }));
}

function summarizeLevel(skill, level, questions) {
  const raw = questions.filter(question => getQuestionLevel(question) === level);
  const runtimeSafe = raw.filter(question => question.runtimeSafe);
  const strictUsable = raw.filter(question => question.strictUsable);
  const targets = countBy(strictUsable, question => getTarget(skill.skillId, question));
  const itemKeys = countBy(strictUsable, question => getItemKey(skill.skillId, question));
  const templates = countBy(strictUsable, getTemplate);
  const uniqueTargets = Object.keys(targets).filter(key => key !== "(missing)");
  const overusedTargets = Object.entries(targets)
    .filter(([, count]) => strictUsable.length && count / strictUsable.length > maxTargetDominance)
    .map(([key, count]) => `${key}:${count}`);
  const phase1 = buildRound(strictUsable, phaseSize, 0);
  const phase2 = buildRound(strictUsable.filter(item => !phase1.includes(item)), phaseSize, 7);
  const designed = Boolean(skill.config.levels[level]?.designed);
  const quantityReady = strictUsable.length >= minimumPerLevel;
  const uniqueReady = uniqueTargets.length >= minimumUniqueTargetsPerLevel || !designed;
  const phaseReady = phase1.length >= phaseSize && phase2.length >= phaseSize;
  return {
    level,
    designed,
    proposedMeaning: skill.config.levels[level]?.proposedMeaning || "",
    rule: skill.config.levels[level]?.rule || "",
    rawCount: raw.length,
    runtimeSafeCount: runtimeSafe.length,
    strictUsableCount: strictUsable.length,
    missingTo30: designed ? Math.max(0, minimumPerLevel - strictUsable.length) : minimumPerLevel,
    uniqueTargetCount: uniqueTargets.length,
    uniqueTargets: uniqueTargets.slice(0, 120),
    uniqueItemKeyCount: Object.keys(itemKeys).filter(key => key !== "(missing)").length,
    overusedTargets,
    repeatedTemplates: Object.entries(templates).filter(([, count]) => count > 1).map(([key, count]) => `${key}:${count}`),
    phase1Ready: phase1.length >= phaseSize,
    phase2Ready: phase2.length >= phaseSize,
    phase1QuestionIds: phase1.map(question => question.id),
    phase2QuestionIds: phase2.map(question => question.id),
    quantityReady,
    uniqueReady,
    phaseReady,
    productionReady: designed && quantityReady && uniqueReady && phaseReady
  };
}

function recommendedQuestionType(skillId, level) {
  if (skillId === "initial_sounds") return level === 1 ? "simple image/audio initial-sound items" : "longer image/audio initial-sound items";
  if (skillId === "final_sounds") return level === 1 ? "Level 1 final b,d,g,l,m,n,p,t listening items" : "advanced final digraph/cluster listening items";
  if (skillId === "rhyming") return level === 1 ? "CVC RHYMING_PICTURE four-card items" : "harder RHYMING_PICTURE families";
  if (skillId === "cvc_short_vowels") return "CVC/CCVC short-vowel image/audio items";
  if (skillId === "short_vowel_discrimination") return "listen-and-choose medial short-vowel items";
  if (hfwSkills.has(skillId)) return level === 1 ? "word recognition/listen-find HFW items" : "sentence cloze and choose-word-in-context HFW items";
  if (comprehensionSkills.has(skillId)) return "short passage or sentence comprehension multiple-choice items";
  return "level-tagged multiple-choice or picture-supported items";
}

function nextActionFor(skill, levelSummary, mediaNeeds) {
  if (!levelSummary.designed) return "Define Level 2 design before generating runtime questions.";
  const levelNeedsMedia = mediaNeeds.some(item => item.level === levelSummary.level);
  if (levelNeedsMedia) {
    const trueMissing = mediaNeeds.some(item => item.level === levelSummary.level && !item.matchingFileExistsElsewhere);
    return trueMissing ? "Generate missing Kimi media, then wire questions." : "Wire existing media paths, then re-run readiness.";
  }
  if (levelSummary.missingTo30 > 0 || !levelSummary.uniqueReady) {
    return comprehensionSkills.has(skill.skillId) || hfwSkills.has(skill.skillId)
      ? "Write new level-aligned question content."
      : "Generate controlled gap-fill questions from approved media/lexicon.";
  }
  if (levelSummary.overusedTargets.length) return "Quantity is present, but rebalance targets before production.";
  return "No immediate content action.";
}

function makeMissingQuestionNeeds(skill, levelSummary, mediaNeeds) {
  const needs = [];
  if (!levelSummary.designed) {
    needs.push({
      skill: skill.skillName,
      skillId: skill.skillId,
      level: levelSummary.level,
      missingCount: minimumPerLevel,
      neededTargetType: recommendedQuestionType(skill.skillId, levelSummary.level),
      existingMediaCanSupport: "unknown until design exists",
      newMediaNeeded: "unknown",
      recommendedSource: hfwSkills.has(skill.skillId) ? "Claude writing" : "Claude writing",
      recommendedAction: levelSummary.proposedMeaning || "Design Level 2 meaning and question templates."
    });
    return needs;
  }
  const countGap = levelSummary.missingTo30;
  const uniqueGap = Math.max(0, minimumUniqueTargetsPerLevel - levelSummary.uniqueTargetCount);
  const missingCount = Math.max(countGap, uniqueGap);
  if (!missingCount) return needs;
  const levelMediaNeeds = mediaNeeds.filter(item => item.level === levelSummary.level);
  const hasTrueMediaGap = levelMediaNeeds.some(item => !item.matchingFileExistsElsewhere);
  const hasWiringGap = levelMediaNeeds.some(item => item.matchingFileExistsElsewhere);
  needs.push({
    skill: skill.skillName,
    skillId: skill.skillId,
    level: levelSummary.level,
    missingCount,
    neededTargetType: recommendedQuestionType(skill.skillId, levelSummary.level),
    existingMediaCanSupport: hasWiringGap ? "yes, some missing paths exist elsewhere" : hasTrueMediaGap ? "partial" : "likely",
    newMediaNeeded: hasTrueMediaGap ? "yes" : "no obvious true media gap",
    recommendedSource: comprehensionSkills.has(skill.skillId) || hfwSkills.has(skill.skillId) ? "Claude writing" : hasTrueMediaGap ? "Kimi image/audio + controlled question generation" : "existing bank or Kimi 500 vocab reserve",
    recommendedAction: nextActionFor(skill, levelSummary, mediaNeeds)
  });
  return needs;
}

function statusForSkill(level1, level2, mediaNeeds) {
  const trueMissingImages = mediaNeeds.filter(item => item.mediaType === "image" && !item.matchingFileExistsElsewhere).length;
  const trueMissingAudio = mediaNeeds.filter(item => item.mediaType === "audio" && !item.matchingFileExistsElsewhere).length;
  const wiring = mediaNeeds.filter(item => item.matchingFileExistsElsewhere).length;
  if (trueMissingImages) return "NEEDS IMAGES";
  if (trueMissingAudio) return "NEEDS AUDIO";
  if (wiring) return "NEEDS MEDIA WIRING";
  if (!level2.designed) return "NEEDS LEVEL 2 DESIGN";
  if (level1.productionReady && level2.productionReady) {
    if (level1.overusedTargets.length || level2.overusedTargets.length) return "QUANTITY READY BUT WEAK";
    return "PRODUCTION READY";
  }
  if (level1.strictUsableCount + level2.strictUsableCount >= minimumTotal && (level1.overusedTargets.length || level2.overusedTargets.length)) {
    return "QUANTITY READY BUT WEAK";
  }
  if (!level1.productionReady || !level2.productionReady) return "NEEDS QUESTIONS";
  return "BLOCKED";
}

function audit() {
  const mediaIndex = createMediaIndex();
  const skills = buildSkillList();
  const rawPool = loadCoreQuestionPool().map((question, index) => ({
    ...question,
    _poolIndex: index,
    depthSkillId: getQuestionSkill(question),
    depthLevel: getQuestionLevel(question),
    depthFormat: getTemplate(question)
  }));

  const perSkill = [];
  const missingQuestionNeeds = [];
  const allMediaNeeds = [];
  const staleWarnings = [];

  for (const skill of skills) {
    const skillQuestions = rawPool
      .filter(question => getQuestionSkill(question) === skill.skillId)
      .map(question => {
        const reason = runtimeReason(question);
        const runtimeSafe = !reason;
        const strictUsable = isStrictUsable(skill, question, runtimeSafe);
        return {
          ...question,
          runtimeReason: reason,
          runtimeSafe,
          strictUsable,
          signature: getQuestionSignature(question) || question.id
        };
      });
    const uniqueQuestions = uniqueRuntimeQuestions(skillQuestions);
    const level1 = summarizeLevel(skill, 1, uniqueQuestions);
    const level2 = summarizeLevel(skill, 2, uniqueQuestions);
    const mediaNeeds = uniqueQuestions.flatMap(question => mediaNeedsForQuestion(skill, question, mediaIndex));
    const exactMediaNeeds = mediaNeeds.filter((item, index, arr) =>
      arr.findIndex(other =>
        other.skillId === item.skillId &&
        other.questionId === item.questionId &&
        other.mediaType === item.mediaType &&
        other.expectedDestinationPath === item.expectedDestinationPath
      ) === index
    );
    allMediaNeeds.push(...exactMediaNeeds);
    staleWarnings.push(...exactMediaNeeds.filter(item => item.matchingFileExistsElsewhere));

    const imageRequired = uniqueQuestions.filter(question => questionRequiresImage(skill.skillId, question));
    const audioRequired = uniqueQuestions.filter(question => questionRequiresAudio(skill.skillId, question));
    const validImageQuestions = imageRequired.filter(question => {
      const paths = getQuestionImagePaths(question);
      return paths.length && paths.every(assetPath => !String(assetPath).startsWith("/") || publicPathExists(assetPath));
    });
    const validAudioQuestions = audioRequired.filter(question => {
      const paths = getQuestionAudioPaths(question);
      return paths.length && paths.every(assetPath => !String(assetPath).startsWith("/") || publicPathExists(assetPath));
    });
    const textOnlyAcceptableCount = uniqueQuestions.filter(question =>
      !getQuestionImagePaths(question).length &&
      !getQuestionAudioPaths(question).length &&
      textOnlyAcceptable(skill.skillId, question)
    ).length;
    const textOnlyProblematicCount = uniqueQuestions.filter(question =>
      !getQuestionImagePaths(question).length &&
      !getQuestionAudioPaths(question).length &&
      !textOnlyAcceptable(skill.skillId, question)
    ).length;

    const status = statusForSkill(level1, level2, exactMediaNeeds);
    const strictUsable = uniqueQuestions.filter(question => question.strictUsable);
    const runtimeSafe = uniqueQuestions.filter(question => question.runtimeSafe);
    const rejectedExamples = uniqueQuestions
      .filter(question => !question.runtimeSafe || !question.strictUsable)
      .slice(0, 30)
      .map(question => ({
        id: question.id,
        source: question._source,
        level: getQuestionLevel(question),
        target: getTarget(skill.skillId, question),
        runtimeReason: question.runtimeReason,
        strictReason: question.runtimeSafe && !question.strictUsable ? "fails strict level/media/template standard" : question.runtimeReason
      }));

    const action = [
      nextActionFor(skill, level1, exactMediaNeeds),
      nextActionFor(skill, level2, exactMediaNeeds)
    ].filter((item, index, arr) => item && arr.indexOf(item) === index).join(" ");

    const row = {
      skillNumber: skill.skillNumber,
      skillName: skill.skillName,
      skillId: skill.skillId,
      category: skill.category,
      appOrder: skill.appOrder,
      status,
      rawQuestionCount: uniqueQuestions.length,
      runtimeSafeQuestionCount: runtimeSafe.length,
      strictUsableQuestionCount: strictUsable.length,
      level1,
      level2,
      level1MissingTo30: level1.missingTo30,
      level2MissingTo30: level2.missingTo30,
      totalMissingTo60: Math.max(0, minimumTotal - strictUsable.length),
      overusedTargets: [...new Set([...level1.overusedTargets, ...level2.overusedTargets])],
      repeatedTemplates: [...new Set([...level1.repeatedTemplates, ...level2.repeatedTemplates])],
      requiredImageCount: imageRequired.length,
      validImageCount: validImageQuestions.length,
      missingImageCount: exactMediaNeeds.filter(item => item.mediaType === "image" && !item.matchingFileExistsElsewhere).length,
      requiredAudioCount: audioRequired.length,
      validAudioCount: validAudioQuestions.length,
      missingAudioCount: exactMediaNeeds.filter(item => item.mediaType === "audio" && !item.matchingFileExistsElsewhere).length,
      mediaWiringFixCount: exactMediaNeeds.filter(item => item.matchingFileExistsElsewhere).length,
      textOnlyAcceptableCount,
      textOnlyProblematicCount,
      exactNextAction: action || "No immediate content action.",
      rejectedExamples,
      finalSoundsSpecial: skill.skillId === "final_sounds" ? buildFinalSoundsSpecial(uniqueQuestions) : null,
      rhymingSpecial: skill.skillId === "rhyming" ? buildRhymingSpecial(uniqueQuestions) : null,
      initialSoundsSpecial: skill.skillId === "initial_sounds" ? buildInitialSoundsSpecial(uniqueQuestions) : null
    };
    perSkill.push(row);
    missingQuestionNeeds.push(...makeMissingQuestionNeeds(skill, level1, exactMediaNeeds));
    missingQuestionNeeds.push(...makeMissingQuestionNeeds(skill, level2, exactMediaNeeds));
  }

  const trueMissingImages = allMediaNeeds.filter(item => item.mediaType === "image" && !item.matchingFileExistsElsewhere);
  const trueMissingAudio = allMediaNeeds.filter(item => item.mediaType === "audio" && !item.matchingFileExistsElsewhere);
  const mediaWiring = allMediaNeeds.filter(item => item.matchingFileExistsElsewhere);
  const totalMissingQuestions = missingQuestionNeeds.reduce((sum, item) => sum + Number(item.missingCount || 0), 0);
  const weakButPassing = perSkill.filter(item => item.status === "QUANTITY READY BUT WEAK");
  const summary = {
    generatedAt: new Date().toISOString(),
    totalSkillsAudited: perSkill.length,
    skillsFullyProductionReady: perSkill.filter(item => item.status === "PRODUCTION READY").length,
    skillsQuantityReadyButWeak: weakButPassing.length,
    skillsMissingLevel1Depth: perSkill.filter(item => item.level1MissingTo30 > 0).length,
    skillsMissingLevel2Depth: perSkill.filter(item => item.level2MissingTo30 > 0).length,
    skillsMissingImages: new Set(trueMissingImages.map(item => item.skillId)).size,
    skillsMissingAudio: new Set(trueMissingAudio.map(item => item.skillId)).size,
    skillsWithStaleMediaWarnings: new Set(staleWarnings.map(item => item.skillId)).size,
    skillsNeedingNewKimiImageGeneration: new Set(trueMissingImages.map(item => item.skillId)).size,
    skillsNeedingNewKimiAudioGeneration: new Set(trueMissingAudio.map(item => item.skillId)).size,
    skillsNeedingClaudeWrittenQuestionContent: new Set(missingQuestionNeeds.filter(item => item.recommendedSource === "Claude writing").map(item => item.skillId)).size,
    skillsNeedingOnlyPathWiringFixes: new Set(mediaWiring.map(item => item.skillId)).size,
    totalExactMissingImages: trueMissingImages.length,
    totalExactMissingAudio: trueMissingAudio.length,
    totalMediaWiringFixes: mediaWiring.length,
    totalExactMissingQuestions: totalMissingQuestions,
    totalWeakButPassingWarnings: weakButPassing.length
  };

  return {
    summary,
    perSkill,
    exactMissingQuestionNeeds: missingQuestionNeeds,
    exactMissingMediaNeeds: {
      missingImages: trueMissingImages,
      missingAudio: trueMissingAudio,
      staleUnwiredMediaWarnings: mediaWiring
    },
    strictStandard: {
      minimumTotal,
      minimumPerLevel,
      phaseSize,
      minimumUniqueTargetsPerLevel,
      maxTargetDominance
    },
    desktopCopies: {
      markdown: desktopMd,
      json: desktopJson
    }
  };
}

function buildInitialSoundsSpecial(questions) {
  const strict = questions.filter(question => question.strictUsable);
  const letters = countBy(strict, question => getItemKey("initial_sounds", question));
  const weakLetters = "abcdefghijklmnopqrstuvwxyz".split("").filter(letter => !letters[letter] || letters[letter] < 2);
  const overusedLetters = Object.entries(letters).filter(([, count]) => strict.length && count / strict.length > maxTargetDominance).map(([letter, count]) => `${letter}:${count}`);
  return { letters, weakLetters, overusedLetters };
}

function buildFinalSoundsSpecial(questions) {
  const level1 = questions.filter(question => getQuestionLevel(question) === 1 && question.strictUsable);
  const wordsBySound = {};
  for (const question of level1) {
    const key = getItemKey("final_sounds", question);
    if (!wordsBySound[key]) wordsBySound[key] = new Set();
    wordsBySound[key].add(getTarget("final_sounds", question));
  }
  return {
    level1AllowedOnly: level1.every(question => finalSoundExpectedItemKeys.includes(getItemKey("final_sounds", question))),
    forbiddenLevel1Leaks: level1.filter(question => finalSoundLevelOneForbiddenItemKeys.includes(getItemKey("final_sounds", question))).map(question => question.id),
    uniqueWordsPerLevel1Sound: Object.fromEntries(Object.entries(wordsBySound).map(([key, set]) => [key, [...set].sort()])),
    bDeepEnough: (wordsBySound.b?.size || 0) >= 10,
    lDeepEnough: (wordsBySound.l?.size || 0) >= 10
  };
}

function buildRhymingSpecial(questions) {
  const strict = questions.filter(question => question.strictUsable);
  const byRime = {};
  for (const question of strict) {
    const key = getItemKey("rhyming", question);
    if (!byRime[key]) byRime[key] = new Set();
    byRime[key].add(getTarget("rhyming", question));
  }
  return {
    rimeFamilies: Object.fromEntries(Object.entries(byRime).map(([key, set]) => [key, [...set].sort()])),
    fewerThanThreeExamples: Object.entries(byRime).filter(([, set]) => set.size < 3).map(([key, set]) => `${key}:${set.size}`)
  };
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(value => String(value ?? "").replace(/\n/g, " ").replace(/\|/g, "/")).join(" | ")} |`)
  ].join("\n");
}

function buildMarkdown(report) {
  const s = report.summary;
  const topSummary = [
    ["Total skills audited", s.totalSkillsAudited],
    ["Skills fully production-ready", s.skillsFullyProductionReady],
    ["Skills with enough quantity but weak balance", s.skillsQuantityReadyButWeak],
    ["Skills missing Level 1 depth", s.skillsMissingLevel1Depth],
    ["Skills missing Level 2 depth", s.skillsMissingLevel2Depth],
    ["Skills missing images", s.skillsMissingImages],
    ["Skills missing audio", s.skillsMissingAudio],
    ["Skills with stale media warnings", s.skillsWithStaleMediaWarnings],
    ["Skills needing new Kimi image generation", s.skillsNeedingNewKimiImageGeneration],
    ["Skills needing new Kimi audio generation", s.skillsNeedingNewKimiAudioGeneration],
    ["Skills needing Claude-written question content", s.skillsNeedingClaudeWrittenQuestionContent],
    ["Skills needing only path/wiring fixes", s.skillsNeedingOnlyPathWiringFixes],
    ["Total exact missing images", s.totalExactMissingImages],
    ["Total exact missing audio", s.totalExactMissingAudio],
    ["Total exact missing questions", s.totalExactMissingQuestions],
    ["Total weak but passing warnings", s.totalWeakButPassingWarnings]
  ];

  const perSkillRows = report.perSkill.map(skill => [
    skill.skillNumber,
    skill.skillName,
    skill.skillId,
    skill.category,
    skill.appOrder,
    skill.status,
    skill.rawQuestionCount,
    skill.runtimeSafeQuestionCount,
    skill.strictUsableQuestionCount,
    skill.level1.rawCount,
    skill.level1.runtimeSafeCount,
    skill.level1.strictUsableCount,
    skill.level2.rawCount,
    skill.level2.runtimeSafeCount,
    skill.level2.strictUsableCount,
    skill.level1MissingTo30,
    skill.level2MissingTo30,
    skill.totalMissingTo60,
    skill.level1.uniqueTargetCount,
    skill.level2.uniqueTargetCount,
    skill.overusedTargets.slice(0, 8).join(", ") || "-",
    skill.repeatedTemplates.slice(0, 6).join(", ") || "-",
    skill.requiredImageCount,
    skill.validImageCount,
    skill.missingImageCount,
    skill.requiredAudioCount,
    skill.validAudioCount,
    skill.missingAudioCount,
    skill.textOnlyAcceptableCount,
    skill.textOnlyProblematicCount,
    skill.exactNextAction
  ]);

  const questionRows = report.exactMissingQuestionNeeds.map(item => [
    item.skill,
    item.level,
    item.missingCount,
    item.neededTargetType,
    item.existingMediaCanSupport,
    item.newMediaNeeded,
    item.recommendedSource,
    item.recommendedAction
  ]);

  const mediaRows = list => list.map(item => [
    item.skill,
    item.level,
    item.questionId,
    item.sourceFile,
    item.targetWord,
    item.expectedFilename,
    item.expectedDestinationPath,
    item.matchingFileExistsElsewhere ? "yes" : "no",
    item.existingPaths.slice(0, 3).join(", ") || "-",
    item.finalAction
  ]);

  const hfwSection = report.perSkill
    .filter(skill => hfwSkills.has(skill.skillId))
    .map(skill => `- **${skill.skillName}**: Level 2 designed? ${skill.level2.designed ? "yes" : "no"}. Proposed Level 2: ${skill.level2.proposedMeaning || "sentence cloze, choose correct word in context, read sentence and find HFW, and audio-supported word recognition"}. Missing Level 2 count: ${skill.level2MissingTo30}.`)
    .join("\n");

  const specialSections = report.perSkill
    .filter(skill => skill.initialSoundsSpecial || skill.finalSoundsSpecial || skill.rhymingSpecial)
    .map(skill => {
      if (skill.initialSoundsSpecial) {
        return `### Initial Sounds\n\n- Weak/missing letters: ${display(skill.initialSoundsSpecial.weakLetters)}\n- Overused letters: ${display(skill.initialSoundsSpecial.overusedLetters)}`;
      }
      if (skill.finalSoundsSpecial) {
        return `### Final Sounds\n\n- Level 1 allowed endings only: ${skill.finalSoundsSpecial.level1AllowedOnly ? "yes" : "no"}\n- Forbidden Level 1 leaks: ${display(skill.finalSoundsSpecial.forbiddenLevel1Leaks)}\n- /b/ deep enough: ${skill.finalSoundsSpecial.bDeepEnough ? "yes" : "no"}\n- /l/ deep enough: ${skill.finalSoundsSpecial.lDeepEnough ? "yes" : "no"}\n- Unique Level 1 words per sound: ${JSON.stringify(skill.finalSoundsSpecial.uniqueWordsPerLevel1Sound)}`;
      }
      return `### Rhyming\n\n- Rime families with fewer than 3 examples: ${display(skill.rhymingSpecial.fewerThanThreeExamples)}`;
    }).join("\n\n");

  return `# LiteracyPath Strict Production Assessment Audit\n\nGenerated: ${report.summary.generatedAt}\n\n## Strict Standard\n\nEach designed skill is checked against 60 total strict-usable questions, 30 Level 1, 30 Level 2, 15 questions per phase, at least 20 unique targets per designed level, complete required media, and no target dominating more than 20% of a level unless flagged.\n\n## Top-Level Summary\n\n${markdownTable(["Metric", "Value"], topSummary)}\n\n## Status Labels\n\n- PRODUCTION READY\n- QUANTITY READY BUT WEAK\n- NEEDS QUESTIONS\n- NEEDS LEVEL 2 DESIGN\n- NEEDS IMAGES\n- NEEDS AUDIO\n- NEEDS MEDIA WIRING\n- BLOCKED\n\n## Per-Skill Strict Table\n\n${markdownTable(["#", "Skill", "Skill ID", "Category", "Order", "Status", "Raw", "Runtime-safe", "Strict usable", "L1 raw", "L1 runtime", "L1 strict", "L2 raw", "L2 runtime", "L2 strict", "L1 missing", "L2 missing", "Total missing", "L1 unique", "L2 unique", "Overused targets", "Repeated templates", "Req images", "Valid images", "Missing images", "Req audio", "Valid audio", "Missing audio", "Text-only OK", "Text-only problem", "Exact next action"], perSkillRows)}\n\n## Exact Missing Question Needs\n\n${markdownTable(["Skill", "Level", "Missing count", "Needed target/type", "Existing media?", "New media needed?", "Recommended source", "Recommended action"], questionRows)}\n\n## Exact Missing Media Needs\n\n### Missing Images\n\n${markdownTable(["Skill", "Level", "Question ID", "Source file", "Target word/sentence", "Expected filename", "Expected path", "Exists elsewhere?", "Existing path", "Final action"], mediaRows(report.exactMissingMediaNeeds.missingImages))}\n\n### Missing Audio\n\n${markdownTable(["Skill", "Level", "Question ID", "Source file", "Target word/sentence", "Expected filename", "Expected path", "Exists elsewhere?", "Existing path", "Final action"], mediaRows(report.exactMissingMediaNeeds.missingAudio))}\n\n### Stale/Unwired Media Warnings\n\n${markdownTable(["Skill", "Level", "Question ID", "Source file", "Target word/sentence", "Expected filename", "Expected path", "Exists elsewhere?", "Existing path", "Final action"], mediaRows(report.exactMissingMediaNeeds.staleUnwiredMediaWarnings))}\n\n## Early Phonics Special Checks\n\n${specialSections || "No early phonics special rows found."}\n\n## HFW Level 2 Decision\n\nThe strict audit treats HFW Level 2 as required for production readiness. Recommended Level 2 design: sentence cloze, choose correct word in context, read sentence and find HFW, and audio-supported word recognition.\n\n${hfwSection}\n`;
}

function buildMediaRequest(title, items) {
  const rows = items.map(item => [
    item.targetWord,
    item.skill,
    item.level,
    item.questionId,
    item.expectedDestinationPath,
    item.mediaType === "image"
      ? `Create a clean K-2 exact-word image for "${item.targetWord}" with natural colours, pale background, no text, no labels, no watermark, no object face.`
      : `Record clear American English MP3 saying only "${item.targetWord}", no sentence, no spelling, no music, no effects.`
  ]);
  return `# ${title}\n\nGenerated: ${new Date().toISOString()}\n\nOnly true missing media is included. Existing-but-unwired assets are excluded and listed separately.\n\n${markdownTable(["Target", "Skill", "Level", "Question", "Destination", "Request"], rows)}\n`;
}

function buildWiringRequest(items) {
  const rows = items.map(item => [
    item.skill,
    item.level,
    item.questionId,
    item.targetWord,
    item.expectedDestinationPath,
    item.existingPaths.slice(0, 5).join(", "),
    "wire existing asset"
  ]);
  return `# Media Wiring Fixes Needed From Strict Audit\n\nGenerated: ${new Date().toISOString()}\n\nThese are stale path or unwired-media warnings. Do not send these to Kimi unless human review rejects the existing asset.\n\n${markdownTable(["Skill", "Level", "Question", "Target", "Expected path", "Existing asset path", "Action"], rows)}\n`;
}

function buildClaudeRequest(items) {
  const rows = items
    .filter(item => item.recommendedSource === "Claude writing")
    .map(item => [
      item.skill,
      item.level,
      item.missingCount,
      item.neededTargetType,
      item.recommendedAction
    ]);
  return `# Claude Question Writing Request From Strict Audit\n\nGenerated: ${new Date().toISOString()}\n\nUse this for written question content only. It excludes media generation requests.\n\n${markdownTable(["Skill", "Level", "Question count needed", "Question type", "Writing brief"], rows)}\n`;
}

function writeDesktopCopies(markdown, jsonText) {
  const results = [];
  for (const [filePath, content] of [[desktopMd, markdown], [desktopJson, jsonText]]) {
    try {
      fs.writeFileSync(filePath, content);
      results.push({ path: filePath, written: true });
    } catch (error) {
      results.push({ path: filePath, written: false, error: error.message });
    }
  }
  return results;
}

const report = audit();
const markdown = buildMarkdown(report);
const jsonText = JSON.stringify(report, null, 2);

writeFile(outputMd, markdown);
writeFile(outputJson, jsonText);
writeFile(kimiImagesPath, buildMediaRequest("Kimi Strict Missing Images Request", report.exactMissingMediaNeeds.missingImages));
writeFile(kimiAudioPath, buildMediaRequest("Kimi Strict Missing Audio Request", report.exactMissingMediaNeeds.missingAudio));
writeFile(kimiCombinedPath, buildMediaRequest("Kimi Strict Missing Media Combined Request", [
  ...report.exactMissingMediaNeeds.missingImages,
  ...report.exactMissingMediaNeeds.missingAudio
]));
writeFile(wiringPath, buildWiringRequest(report.exactMissingMediaNeeds.staleUnwiredMediaWarnings));
writeFile(claudePath, buildClaudeRequest(report.exactMissingQuestionNeeds));
report.desktopCopyResults = writeDesktopCopies(markdown, jsonText);
writeFile(outputJson, JSON.stringify(report, null, 2));

console.log(`Strict assessment skills audited: ${report.summary.totalSkillsAudited}`);
console.log(`Production-ready skills: ${report.summary.skillsFullyProductionReady}`);
console.log(`True missing images: ${report.summary.totalExactMissingImages}`);
console.log(`True missing audio: ${report.summary.totalExactMissingAudio}`);
console.log(`Media wiring fixes: ${report.summary.totalMediaWiringFixes}`);
console.log(`New questions needed: ${report.summary.totalExactMissingQuestions}`);
console.log(`Wrote ${path.relative(repoRoot, outputMd)}`);
console.log(`Wrote ${path.relative(repoRoot, outputJson)}`);
for (const result of report.desktopCopyResults) {
  console.log(`${result.written ? "Wrote" : "Could not write"} ${result.path}${result.error ? ` (${result.error})` : ""}`);
}
