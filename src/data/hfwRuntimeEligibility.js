import {
  ALL_HFW_WORD_SET,
  getHfwBandSet,
  isHighFrequencyWordSkill,
  normalizeHfwSkillId
} from "./highFrequencyWordBands.js";

const HFW_ALLOWED_FORMATS = new Set([
  "READ_FIND_WORD",
  "LISTEN_FIND_WORD",
  "SENTENCE_CLOZE",
  "CLOZE_CHOICE",
  "COMPREHENSION",
  "MULTIPLE_CHOICE",
  "UNKNOWN"
]);

const HFW_BLOCKED_FORMATS = new Set([
  "SHORT_VOWEL_WORD",
  "LISTEN_CHOOSE_VOWEL",
  "PICTURE_TO_PRINT_MATCH",
  "HEARD_WORD_TO_PRINT_MINIMAL_PAIR",
  "MISSING_VOWEL_CVC",
  "COMPLETE_WORD",
  "FIRST_SOUND",
  "ENDING_SOUND",
  "INITIAL_SOUND_PAIR_SELECT",
  "FINAL_SOUND_PAIR_SELECT",
  "RHYMING_PICTURE",
  "READ_FIND_RHYME",
  "LISTEN_FIND_RHYME",
  "PICTURE_AUDIO_TO_PATTERN",
  "IMAGE_WORD_PATTERN_MATCH",
  "BLEND_SOUNDS",
  "DECODING",
  "VOCABULARY_CATEGORY",
  "PLURAL_IMAGE_SPELLING"
]);

const PHONICS_PROMPT_PATTERN =
  /\b(short [aeiou]|short vowel|cvc|rhym|rime|beginning sound|initial sound|first sound|starts? with|ending sound|final sound|ends? with|blend|digraph|silent e|vowel team|r-controlled|matches the picture|which word has the short)\b/i;

function normalizeWord(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getFormat(question = {}) {
  return String(question.formatType || question.templateType || question.questionType || "UNKNOWN").toUpperCase();
}

function getPromptText(question = {}) {
  return [question.prompt, question.question, question.spokenPrompt, question.passage, question.sentence, question.context]
    .filter(Boolean)
    .join(" ");
}

function getQuestionWords(question = {}) {
  return [
    question.itemKey,
    question.targetWord,
    question.audioText,
    question.answer,
    question.correctAnswer,
    ...(Array.isArray(question.correctAnswers) ? question.correctAnswers : [])
  ].map(normalizeWord).filter(Boolean);
}

function getOptionWords(question = {}) {
  return [
    ...(Array.isArray(question.answerOptions) ? question.answerOptions : []),
    ...(Array.isArray(question.options) ? question.options : []),
    ...(Array.isArray(question.choices) ? question.choices : [])
  ]
    .map(option => {
      if (option && typeof option === "object") {
        return option.value || option.word || option.label || option.text || option.answer || "";
      }
      return option;
    })
    .map(normalizeWord)
    .filter(Boolean);
}

function getQuestionSkillText(question = {}) {
  return [question.skillId, question.skillName, question.skill, question.stage].filter(Boolean).join(" ");
}

export function getHfwRuntimeEligibilityIssues(question = {}, skillId = "") {
  const bandId = normalizeHfwSkillId(skillId || getQuestionSkillText(question));
  if (!bandId) return ["not an HFW skill band"];

  const issues = [];
  const bandSet = getHfwBandSet(bandId);
  const format = getFormat(question);
  const itemType = String(question.itemType || question.type || "").toLowerCase();
  const promptText = getPromptText(question);
  const questionWords = getQuestionWords(question);
  const optionWords = getOptionWords(question);
  const primaryWord = questionWords.find(word => bandSet?.has(word)) || questionWords[0] || "";
  const declaredQuestionBand = normalizeHfwSkillId(getQuestionSkillText(question));

  if (declaredQuestionBand && declaredQuestionBand !== bandId) {
    issues.push(`belongs to ${declaredQuestionBand}, not ${bandId}`);
  }
  if (HFW_BLOCKED_FORMATS.has(format)) issues.push(`${format} is not an HFW-safe template`);
  if (!HFW_ALLOWED_FORMATS.has(format)) issues.push(`${format} is not in the HFW allowlist`);
  if (PHONICS_PROMPT_PATTERN.test(promptText)) issues.push("prompt is phonics/picture-matching, not HFW recognition");
  if (itemType && itemType !== "sight_word") issues.push(`itemType is ${itemType}, not sight_word`);
  if (!primaryWord) {
    issues.push("missing target HFW word");
  } else if (!bandSet?.has(primaryWord)) {
    issues.push(`target word "${primaryWord}" is outside ${bandId}`);
  }
  const nonHfwOptions = optionWords.filter(word => !ALL_HFW_WORD_SET.has(word));
  if (nonHfwOptions.length) {
    issues.push(`non-HFW answer options: ${[...new Set(nonHfwOptions)].join(", ")}`);
  }
  if (format === "PICTURE_TO_PRINT_MATCH" && !question.hfwRecognition) {
    issues.push("picture-match format is not allowed for HFW unless explicitly marked hfwRecognition");
  }

  return [...new Set(issues)];
}

export function isRuntimeEligibleHfwQuestion(question = {}, skillId = "") {
  return isHighFrequencyWordSkill(skillId || getQuestionSkillText(question)) &&
    getHfwRuntimeEligibilityIssues(question, skillId).length === 0;
}

export { HFW_ALLOWED_FORMATS, HFW_BLOCKED_FORMATS };
