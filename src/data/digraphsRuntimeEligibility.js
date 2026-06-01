import {
  isAllowedDigraphPattern,
  normalizeDigraphPattern
} from "./digraphPatternData.js";

export const DIGRAPHS_ALLOWED_FORMATS = new Set([
  "DIGRAPH_IMAGE_CHOICE",
  "DIGRAPH_COMPLETE_WORD"
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

export function getDigraphsRuntimeEligibilityIssues(question = {}, skillId = "") {
  const skillText = skillId || getQuestionSkillText(question);
  if (!String(skillText || "").toLowerCase().includes("digraph")) return ["not a Digraphs skill"];

  const issues = [];
  const format = getFormat(question);
  const pattern = normalizeDigraphPattern(question.targetPattern || question.phonicsPattern || question.itemKey || "");
  const level = Number(question.level || question.difficulty || 1);
  const answer = String(question.correctAnswer || question.answer || "").trim();
  const targetWord = normalizeWord(question.targetWord || question.word || "");
  const options = getAnswerOptions(question).map(getOptionValue).map(value => String(value || "").trim()).filter(Boolean);
  const normalizedOptions = options.map(value => value.toLowerCase());
  const imageCards = getImageCards(question);
  const imagePath = question.imagePath || question.imageUrl || question.image || question.targetImage || question.targetImagePath || "";

  if (question.source !== "digraphs_replacement_2026_06") issues.push("Digraphs must use the replacement bank");
  if (!DIGRAPHS_ALLOWED_FORMATS.has(format)) issues.push(`${format} is not allowed for Digraphs`);
  if (!pattern) {
    issues.push("missing target digraph pattern");
  } else if (!isAllowedDigraphPattern(pattern)) {
    issues.push(`unsupported digraph pattern: ${pattern}`);
  }
  if (![1, 2].includes(level)) issues.push(`unexpected level: ${level}`);

  if (format === "DIGRAPH_IMAGE_CHOICE") {
    if (level !== 1) issues.push("DIGRAPH_IMAGE_CHOICE is Level 1 only");
    if (imageCards.length !== 4) issues.push(`Level 1 needs exactly 4 image choices, found ${imageCards.length}`);
    if (!imageCards.every(card => card.image || card.imagePath || card.imageUrl)) issues.push("Level 1 image choices need images");
    if (options.length !== 4) issues.push(`Level 1 needs exactly 4 answer options, found ${options.length}`);
    if (!options.map(normalizeWord).includes(normalizeWord(answer))) issues.push("Level 1 correct word is missing from choices");
  }

  if (format === "DIGRAPH_COMPLETE_WORD") {
    if (level !== 2) issues.push("DIGRAPH_COMPLETE_WORD is Level 2 only");
    if (!imagePath) issues.push("Level 2 needs a target image");
    if (options.length !== 4) issues.push(`Level 2 needs exactly 4 digraph options, found ${options.length}`);
    if (!normalizedOptions.includes(pattern)) issues.push("Level 2 correct digraph is missing from options");
    if (normalizeDigraphPattern(answer) !== pattern) issues.push(`Level 2 answer "${answer}" does not match target pattern "${pattern}"`);
    if (!targetWord) issues.push("Level 2 missing target word");
    if (!String(question.partialWord || "").includes("__")) issues.push("Level 2 partialWord must include __");
  }

  if (normalizedOptions.length && new Set(normalizedOptions).size !== normalizedOptions.length) {
    issues.push("duplicate answer options");
  }

  return [...new Set(issues)];
}

export function isRuntimeEligibleDigraphsQuestion(question = {}, skillId = "") {
  return getDigraphsRuntimeEligibilityIssues(question, skillId).length === 0;
}
