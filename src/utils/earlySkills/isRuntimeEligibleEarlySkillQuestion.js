import { getAnswerOptionLabel } from "../answerOptions.js";
import {
  getFinalSoundsLevel1QuestionIssues,
  isFinalSoundsLevel1Question
} from "../../data/earlyPhonicsValidation.js";
import {
  hasCompletePairSelectionAssets,
  isPairSelectionQuestion
} from "../../data/soundPairAssets.js";
import {
  hasCompleteVisualQuestionAssets,
  isVisualCardChoiceQuestion
} from "../../data/visualQuestionAssets.js";
import {
  getListenAndFindAssetDiagnostics,
  isListenAndFindWordQuestion
} from "../../data/listenAndFindAssets.js";
import {
  getQuestionMediaPaths,
  isMediaQaRuntimeAllowed,
  isQuestionBlockedByMediaQa
} from "../../data/mediaQaManifest.js";
import { getQuestionRoutingIssue } from "../../data/skillTemplateRouting.js";

export const EARLY_SKILL_IDS = new Set([
  "initial_sounds",
  "final_sounds",
  "cvc_short_vowels",
  "rhyming",
  "rhyming_words",
  "short_vowel_discrimination"
]);

const FINAL_SOUNDS_LEVEL_ONE_ALLOWED = new Set(["b", "d", "g", "l", "m", "n", "p", "t"]);
const FINAL_SOUNDS_LEVEL_ONE_FORBIDDEN = [
  "sh", "ch", "th", "ng", "nd", "nk", "nt", "st", "sk", "ft", "lt",
  "ll", "ck", "ss", "ff", "zz", "mp", "rk", "lk"
];
const PLACEHOLDER_PATTERN = /(?:placeholder|fallback|missing|unavailable|coming-soon|blank)/i;
const UI_IMAGE_PATH_PATTERN = /(?:speaker|audio-button|volume|question-visual|\/ui\/|\/icons?\/|speaker-icon|\.svg$)/i;

function normalize(value = "") {
  return String(value || "").toLowerCase().trim();
}

function normalizeToken(value = "") {
  return normalize(value).replace(/^\/|\/$/g, "").replace(/[^a-z0-9-]+/g, "");
}

export function normalizeEarlySkillId(value = "") {
  const normalized = normalize(value).replace(/[\s-]+/g, "_");
  if (normalized === "rhyming_words") return "rhyming";
  if (normalized.includes("initial")) return "initial_sounds";
  if (normalized.includes("final") || normalized.includes("ending")) return "final_sounds";
  if (normalized.includes("short_vowel_discrimination")) return "short_vowel_discrimination";
  if (normalized.includes("cvc") || normalized.includes("short_vowel")) return "cvc_short_vowels";
  if (normalized.includes("rhyme") || normalized.includes("rhyming")) return "rhyming";
  return normalized;
}

function getQuestionSkillId(question = {}) {
  return normalizeEarlySkillId(question.skillId || question.skillName || question.skill || question.stage || "");
}

function getQuestionLevel(question = {}) {
  const value = Number(question.level || question.difficultyLevel || question.difficulty || 1);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function isPublicRuntimePath(path = "") {
  const value = String(path || "").trim();
  return Boolean(
    value &&
    value.startsWith("/") &&
    !PLACEHOLDER_PATTERN.test(value) &&
    !UI_IMAGE_PATH_PATTERN.test(value)
  );
}

function pathAllowed(path = "", mediaType = "image", options = {}) {
  if (!isPublicRuntimePath(path)) return false;
  if (typeof options.pathExists === "function" && !options.pathExists(path)) return false;
  return isMediaQaRuntimeAllowed(path, mediaType, options);
}

function getCardImage(card = {}) {
  return card.image || card.imageUrl || card.imagePath || "";
}

function getCardAudio(card = {}) {
  return card.audio || card.audioUrl || card.audioPath || "";
}

function getAnswerOptions(question = {}) {
  return [
    ...(Array.isArray(question.choices) ? question.choices : []),
    ...(Array.isArray(question.answerOptions) ? question.answerOptions : [])
  ];
}

function getAnswerOptionTokens(question = {}) {
  return getAnswerOptions(question)
    .map(getAnswerOptionLabel)
    .map(normalizeToken)
    .filter(Boolean);
}

function getQuestionText(question = {}) {
  return [
    question.question,
    question.prompt,
    question.spokenPrompt,
    question.audioText,
    question.formatType,
    question.templateType,
    question.questionType
  ].filter(Boolean).join(" ").toLowerCase();
}

function getTargetWord(question = {}) {
  return normalizeToken(
    question.targetWord ||
    question.anchorWord ||
    question.audioText ||
    question.diagnosticTarget ||
    question.word ||
    ""
  );
}

function slugText(value = "") {
  return normalize(value)
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getDirectTargetImagePaths(question = {}) {
  return [
    question.imagePath,
    question.imageUrl,
    question.targetImage,
    question.targetImagePath,
    question.targetImageUrl,
    question.image
  ].filter(Boolean);
}

export function isListenPrompt(question = {}) {
  const text = getQuestionText(question);
  return Boolean(
    isListenAndFindWordQuestion(question) ||
    /\b(listen|hear|heard|sound button|click the button|play the word)\b/.test(text) ||
    ["ENDING_SOUND", "FIRST_SOUND", "SHORT_VOWEL_WORD", "BLEND_SOUNDS", "PICTURE_AUDIO_TO_PATTERN"].includes(String(question.formatType || question.templateType || "").toUpperCase())
  );
}

export function hasRuntimeImage(question = {}, options = {}) {
  const paths = getQuestionMediaPaths(question).image;
  return paths.some(path => pathAllowed(path, "image", options));
}

export function hasRuntimeTargetImage(question = {}, options = {}) {
  const paths = getDirectTargetImagePaths(question);
  if (!paths.some(path => pathAllowed(path, "image", options))) return false;

  const target = slugText(getTargetWord(question));
  if (!target || target.length < 2) return true;

  return paths.some(path => {
    if (!pathAllowed(path, "image", options)) return false;
    const normalizedPath = slugText(String(path).split("/").pop()?.replace(/\.[a-z0-9]+$/i, "") || path);
    return normalizedPath === target ||
      normalizedPath.includes(target) ||
      String(path).toLowerCase().includes(`/${target}.`) ||
      String(path).toLowerCase().includes(`/${target}/`) ||
      String(path).toLowerCase().includes(`-${target}.`) ||
      String(path).toLowerCase().includes(`${target}-`);
  });
}

export function hasRuntimeAudio(question = {}, options = {}) {
  const paths = getQuestionMediaPaths(question).audio;
  return paths.some(path => pathAllowed(path, "audio", options));
}

export function hasCompleteRuntimeCards(question = {}, options = {}) {
  if (isPairSelectionQuestion(question)) {
    if (!hasCompletePairSelectionAssets(question)) return false;
    return (question.imageCards || []).every(card =>
      pathAllowed(getCardImage(card), "image", options) &&
      pathAllowed(getCardAudio(card), "audio", options)
    );
  }

  if (isVisualCardChoiceQuestion(question)) {
    if (!hasCompleteVisualQuestionAssets(question)) return false;
    const requireImages = question.requireOptionImages !== false;
    const requireAudio = question.requireOptionAudio === true;
    const cards = question.imageCards || [];
    if (requireImages && !cards.every(card => pathAllowed(getCardImage(card), "image", options))) return false;
    if (requireAudio && !cards.every(card => pathAllowed(getCardAudio(card), "audio", options))) return false;
    return (question.promptImageCards || []).every(card => pathAllowed(getCardImage(card), "image", options));
  }

  if (isListenAndFindWordQuestion(question)) {
    const diagnostics = getListenAndFindAssetDiagnostics(question);
    if (!diagnostics || diagnostics.missingImages.length || diagnostics.missingChoiceAssets.length || diagnostics.missingAudio || !diagnostics.usesSingleWordAudioText) return false;
    const imagePaths = Object.values(diagnostics.question.choiceImages || {}).map(asset => asset?.image).filter(Boolean);
    return imagePaths.length >= 2 && imagePaths.every(path => pathAllowed(path, "image", options));
  }

  return true;
}

function hasBlankQuestionVisual(question = {}, options = {}) {
  if (isPairSelectionQuestion(question) || isVisualCardChoiceQuestion(question) || isListenAndFindWordQuestion(question)) {
    return !hasCompleteRuntimeCards(question, options);
  }
  return !hasRuntimeImage(question, options);
}

function getFinalSoundTarget(question = {}) {
  return normalizeToken(
    question.coverageTarget ||
    question.targetFinalSound ||
    question.targetSound ||
    question.itemKey ||
    question.phonicsPattern ||
    question.targetPattern ||
    question.correctAnswer ||
    question.answer ||
    ""
  );
}

function hasForbiddenLevelOneFinalEnding(question = {}) {
  const targetWord = getTargetWord(question);
  return Boolean(targetWord && FINAL_SOUNDS_LEVEL_ONE_FORBIDDEN.some(pattern => targetWord.endsWith(pattern)));
}

function addFinalSoundsLevelOneIssues(question = {}, issues = []) {
  getFinalSoundsLevel1QuestionIssues(question).forEach(issue => issues.push(issue));

  const target = getFinalSoundTarget(question);
  if (!FINAL_SOUNDS_LEVEL_ONE_ALLOWED.has(target)) {
    issues.push(`Final Sounds Level 1 target "${target || "(missing)"}" is not one of b,d,g,l,m,n,p,t`);
  }

  getAnswerOptionTokens(question).forEach(option => {
    if (option.length !== 1 || !FINAL_SOUNDS_LEVEL_ONE_ALLOWED.has(option)) {
      issues.push(`Final Sounds Level 1 answer option "${option}" is not an allowed single letter`);
    }
  });

  if (hasForbiddenLevelOneFinalEnding(question)) {
    issues.push(`target word "${getTargetWord(question)}" ends with an advanced Level 2 final pattern`);
  }

  if (isPairSelectionQuestion(question)) {
    issues.push("pair-selection questions are not allowed in Final Sounds Level 1 runtime");
  }

  if (!isFinalSoundsLevel1Question(question)) {
    issues.push("question failed canonical Final Sounds Level 1 purity check");
  }
}

export function getEarlySkillRuntimeEligibilityIssues(question = {}, context = {}) {
  const issues = [];
  const skillId = normalizeEarlySkillId(context.skillId || getQuestionSkillId(question));
  const questionSkillId = getQuestionSkillId(question);
  const level = Number(context.level || getQuestionLevel(question) || 1);

  if (!question || typeof question !== "object") return ["question is missing"];
  if (!EARLY_SKILL_IDS.has(skillId)) return [];

  if (!question.id) issues.push("missing question id");
  if (question.active === false) issues.push("question is inactive");

  if (questionSkillId && questionSkillId !== skillId) {
    issues.push(`cross-skill contamination: question skill "${questionSkillId}" cannot serve "${skillId}"`);
  }

  const routingIssue = getQuestionRoutingIssue(question, skillId);
  if (routingIssue) issues.push(`routing/template mismatch: ${routingIssue}`);

  if (isQuestionBlockedByMediaQa(question, context)) {
    issues.push("question uses blocked/rejected/needs-Kimi media");
  }

  if (skillId === "final_sounds" && level === 1) {
    addFinalSoundsLevelOneIssues(question, issues);
  }

  if (skillId === "final_sounds") {
    if (!getTargetWord(question)) {
      issues.push("Final Sounds question is missing targetWord");
    }
    if (!hasRuntimeTargetImage(question, context)) {
      issues.push("Final Sounds question is missing a real target-word object image");
    }
  }

  if (question.hideWrittenLabels === true && !hasRuntimeImage(question, context)) {
    issues.push("written labels are hidden while image support is incomplete");
  }

  if (!hasRuntimeImage(question, context)) {
    issues.push("missing required runtime image");
  }

  if (isListenPrompt(question) && !hasRuntimeAudio(question, context)) {
    issues.push("listen prompt is missing required runtime audio");
  }

  if (!hasCompleteRuntimeCards(question, context)) {
    issues.push("runtime card set is incomplete");
  }

  if (hasBlankQuestionVisual(question, context)) {
    issues.push("question would render with an empty or broken visual area");
  }

  return [...new Set(issues)];
}

export function isRuntimeEligibleEarlySkillQuestion(question = {}, context = {}) {
  return getEarlySkillRuntimeEligibilityIssues(question, context).length === 0;
}
