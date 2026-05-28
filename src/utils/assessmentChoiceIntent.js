import { getAnswerOptionLabel } from "./answerOptions.js";

const TEXT_TILE_FORMATS = new Set([
  "COMPLETE_WORD",
  "MISSING_VOWEL_CVC",
  "LISTEN_CHOOSE_VOWEL",
  "ENDING_SOUND",
  "FIRST_SOUND"
]);

const CONDITIONAL_TEXT_TILE_FORMATS = new Set([
  "SHORT_VOWEL_WORD",
  "BLEND_SOUNDS",
  "PICTURE_AUDIO_TO_PATTERN",
  "IMAGE_WORD_PATTERN_MATCH"
]);

const IMAGE_CHOICE_FORMATS = new Set([
  "FINAL_SOUND_PAIR_SELECT",
  "INITIAL_SOUND_PAIR_SELECT",
  "RHYME_PAIR_SELECT",
  "RHYMING_PICTURE",
  "PICTURE_TO_PRINT_MATCH",
  "HEARD_WORD_TO_PRINT_MINIMAL_PAIR",
  "VOCABULARY_CATEGORY",
  "SENTENCE_MATCHES_PICTURE"
]);

const GRAPHEME_PATTERN = /^(?:[a-z]|[bcdfghjklmnpqrstvwxyz]{2,3}|[aeiou]_[e]|short [aeiou]|short_[aeiou])$/i;

function normalizeFormat(question = {}) {
  return String(question.formatType || question.templateType || "").toUpperCase();
}

function normalizePrompt(question = {}) {
  return String([question.prompt, question.question, question.spokenPrompt].filter(Boolean).join(" ")).toLowerCase();
}

export function getAssessmentChoiceLabels(question = {}) {
  const options = Array.isArray(question.answerOptions) && question.answerOptions.length
    ? question.answerOptions
    : Array.isArray(question.options) && question.options.length
      ? question.options
      : Array.isArray(question.choices)
        ? question.choices
        : [];

  return options
    .map(option => getAnswerOptionLabel(option))
    .map(label => String(label || "").trim())
    .filter(Boolean);
}

export function isShortGraphemeLabel(value = "") {
  const label = String(value || "").trim();
  if (!label) return false;
  return GRAPHEME_PATTERN.test(label);
}

export function hasOptionImageChoiceLeak(question = {}) {
  const optionGroups = [
    ...(Array.isArray(question.answerOptions) ? question.answerOptions : []),
    ...(Array.isArray(question.options) ? question.options : []),
    ...(Array.isArray(question.choices) ? question.choices : [])
  ];

  return optionGroups.some(option =>
    option &&
    typeof option === "object" &&
    Boolean(option.image || option.imageUrl || option.imagePath)
  );
}

export function isGraphemeChoiceQuestion(question = {}) {
  const format = normalizeFormat(question);
  const prompt = normalizePrompt(question);
  const labels = getAssessmentChoiceLabels(question);
  const allShortLabels = labels.length > 0 && labels.every(isShortGraphemeLabel);
  const hasBlank =
    Boolean(question.partialWord || question.blankWord || question.wordWithBlank) ||
    /_{1,}/.test(prompt) ||
    /\bblank\b/.test(prompt);

  if (TEXT_TILE_FORMATS.has(format)) return true;
  if (CONDITIONAL_TEXT_TILE_FORMATS.has(format) && allShortLabels) return true;
  if (hasBlank && allShortLabels) return true;
  if (/\bcomplete the word\b/.test(prompt)) return true;
  if (/\b(?:which|what) sound\b/.test(prompt) && allShortLabels) return true;
  if (/\bmissing (?:sound|vowel|letter)\b/.test(prompt) && allShortLabels) return true;
  if (allShortLabels && labels.length <= 6 && !IMAGE_CHOICE_FORMATS.has(format)) return true;

  return false;
}

export function isImageChoiceQuestion(question = {}) {
  if (isGraphemeChoiceQuestion(question)) return false;
  const format = normalizeFormat(question);
  if (IMAGE_CHOICE_FORMATS.has(format)) return true;
  if (question.questionType === "visual_card_choice") return true;
  return Boolean(
    question.imageCards?.length ||
    question.answerOptions?.some(option => option?.image || option?.imageUrl || option?.imagePath)
  );
}
