import {
  isAllowedBlendPattern,
  isBeginningBlendPattern,
  normalizeBlendPattern
} from "./blendPatternData.js";

export const BLENDS_ALLOWED_FORMATS = new Set([
  "BLEND_IMAGE_CHOICE",
  "BLEND_COMPLETE_WORD"
]);

function normalizeWord(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z]+/g, "")
    .trim();
}

function getFormat(question = {}) {
  return String(question.formatType || question.templateType || question.questionType || "UNKNOWN").toUpperCase();
}

function getQuestionSkillText(question = {}) {
  return [question.skillId, question.skillName, question.skill, question.stage].filter(Boolean).join(" ").toLowerCase();
}

function getAnswerOptions(question = {}) {
  if (Array.isArray(question.choices) && question.choices.length) return question.choices;
  if (Array.isArray(question.answerOptions) && question.answerOptions.length) return question.answerOptions;
  return [];
}

function getOptionValue(option = "") {
  if (option && typeof option === "object") {
    return option.value || option.word || option.label || option.text || option.answer || "";
  }
  return option;
}

function getImageCards(question = {}) {
  return Array.isArray(question.imageCards) ? question.imageCards : [];
}

function hasAudio(question = {}) {
  return Boolean(question.audioPath || question.audioUrl || question.audio || question.audioText || question.spokenPrompt);
}

export function getBlendsRuntimeEligibilityIssues(question = {}, skillId = "") {
  const skillText = skillId || getQuestionSkillText(question);
  if (!String(skillText || "").toLowerCase().includes("blend")) return ["not a Blends skill"];

  const issues = [];
  const format = getFormat(question);
  const pattern = normalizeBlendPattern(question.targetPattern || question.phonicsPattern || question.itemKey || "");
  const level = Number(question.level || question.difficulty || 1);
  const position = String(question.phonicsPosition || "").toLowerCase();
  const answer = String(question.correctAnswer || question.answer || "").trim();
  const targetWord = normalizeWord(question.targetWord || question.word || "");
  const options = getAnswerOptions(question).map(getOptionValue).map(value => String(value || "").trim()).filter(Boolean);
  const normalizedOptions = options.map(value => value.toLowerCase());
  const imageCards = getImageCards(question);
  const imagePath = question.imagePath || question.imageUrl || question.image || question.targetImage || question.targetImagePath || "";

  if (!BLENDS_ALLOWED_FORMATS.has(format)) issues.push(`${format} is not allowed for Blends`);
  if (!pattern) {
    issues.push("missing target blend pattern");
  } else if (!isAllowedBlendPattern(pattern)) {
    issues.push(`unsupported blend pattern: ${pattern}`);
  }
  if (hasAudio(question)) issues.push("Blends replacement questions must not include audio");
  if (![1, 2].includes(level)) issues.push(`unexpected level: ${level}`);

  if (format === "BLEND_IMAGE_CHOICE") {
    if (level !== 1) issues.push("BLEND_IMAGE_CHOICE is Level 1 only");
    if (!isBeginningBlendPattern(pattern)) issues.push("Level 1 Blends must use beginning blends only");
    if (position && position !== "initial") issues.push(`Level 1 position must be initial, found ${position}`);
    if (imageCards.length !== 4) issues.push(`Level 1 needs exactly 4 image choices, found ${imageCards.length}`);
    if (!imageCards.every(card => card.image || card.imagePath || card.imageUrl)) issues.push("Level 1 image choices need images");
    if (options.length !== 4) issues.push(`Level 1 needs exactly 4 answer options, found ${options.length}`);
    if (!options.map(normalizeWord).includes(normalizeWord(answer))) issues.push("Level 1 correct word is missing from choices");
  }

  if (format === "BLEND_COMPLETE_WORD") {
    if (level !== 2) issues.push("BLEND_COMPLETE_WORD is Level 2 only");
    if (!imagePath) issues.push("Level 2 needs a target image");
    if (options.length !== 4) issues.push(`Level 2 needs exactly 4 blend options, found ${options.length}`);
    if (!normalizedOptions.includes(pattern)) issues.push("Level 2 correct blend is missing from options");
    if (normalizeBlendPattern(answer) !== pattern) issues.push(`Level 2 answer "${answer}" does not match target pattern "${pattern}"`);
    if (!targetWord) issues.push("Level 2 missing target word");
    if (!String(question.partialWord || "").includes("__")) issues.push("Level 2 partialWord must include __");
  }

  if (normalizedOptions.length && new Set(normalizedOptions).size !== normalizedOptions.length) {
    issues.push("duplicate answer options");
  }

  return [...new Set(issues)];
}

export function isRuntimeEligibleBlendsQuestion(question = {}, skillId = "") {
  return getBlendsRuntimeEligibilityIssues(question, skillId).length === 0;
}
