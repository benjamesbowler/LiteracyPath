import {
  isLongVowelTeamPattern,
  isSilentEPattern,
  normalizeLongVowelPattern
} from "./longVowelPatternData.js";

export const LONG_VOWELS_ALLOWED_FORMATS = new Set([
  "LONG_VOWEL_SILENT_E_PATTERN",
  "LONG_VOWEL_TEAM_COMPLETE"
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

function isLongVowelsSkill(skillId = "", question = {}) {
  const text = String(skillId || getQuestionSkillText(question) || "").toLowerCase();
  return text.includes("long_vowels") ||
    text.includes("long vowels") ||
    text.includes("silent e") ||
    text.includes("magic e");
}

export function getLongVowelsRuntimeEligibilityIssues(question = {}, skillId = "") {
  if (!isLongVowelsSkill(skillId, question)) return ["not a Long Vowels and Silent E skill"];

  const issues = [];
  const format = getFormat(question);
  const pattern = normalizeLongVowelPattern(question.targetPattern || question.phonicsPattern || question.itemKey || "");
  const level = Number(question.level || question.difficulty || 1);
  const answer = normalizeLongVowelPattern(question.correctAnswer || question.answer || "");
  const targetWord = normalizeWord(question.targetWord || question.word || question.audioText || "");
  const options = getAnswerOptions(question).map(getOptionValue).map(value => String(value || "").trim()).filter(Boolean);
  const normalizedOptions = options.map(normalizeLongVowelPattern);
  const imagePath = question.imagePath || question.imageUrl || question.image || question.targetImage || question.targetImagePath || "";

  if (question.source !== "long_vowels_replacement_2026_06") issues.push("Long Vowels must use the replacement bank");
  if (!LONG_VOWELS_ALLOWED_FORMATS.has(format)) issues.push(`${format} is not allowed for Long Vowels`);
  if (!pattern) issues.push("missing target long-vowel pattern");
  if (pattern && !normalizedOptions.includes(pattern)) issues.push("correct pattern is missing from answer options");
  if (answer !== pattern) issues.push(`answer "${answer || "(missing)"}" does not match target pattern "${pattern || "(missing)"}`);
  if (![1, 2].includes(level)) issues.push(`unexpected level: ${level}`);
  if (!targetWord) issues.push("missing target word");
  if (!imagePath) issues.push("missing target image");
  if (options.length !== 4) issues.push(`needs exactly 4 answer options, found ${options.length}`);
  if (normalizedOptions.length && new Set(normalizedOptions).size !== normalizedOptions.length) issues.push("duplicate answer options");

  if (format === "LONG_VOWEL_SILENT_E_PATTERN") {
    if (level !== 1) issues.push("LONG_VOWEL_SILENT_E_PATTERN is Level 1 only");
    if (!isSilentEPattern(pattern)) issues.push(`Level 1 needs a silent-e pattern, found ${pattern || "(missing)"}`);
  }

  if (format === "LONG_VOWEL_TEAM_COMPLETE") {
    if (level !== 2) issues.push("LONG_VOWEL_TEAM_COMPLETE is Level 2 only");
    if (!isLongVowelTeamPattern(pattern)) issues.push(`Level 2 needs a long-vowel team pattern, found ${pattern || "(missing)"}`);
    if (!String(question.partialWord || "").includes("_")) issues.push("Level 2 partialWord must include a blank");
  }

  const answerOptionsWithAudio = (question.answerOptions || []).filter(option => option?.audio || option?.audioPath || option?.audioUrl);
  if (answerOptionsWithAudio.length) issues.push("answer options must not include audio");

  return [...new Set(issues)];
}

export function isRuntimeEligibleLongVowelsQuestion(question = {}, skillId = "") {
  return getLongVowelsRuntimeEligibilityIssues(question, skillId).length === 0;
}
