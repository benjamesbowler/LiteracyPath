import {
  getApprovedAudioPath,
  getAudioPreferenceStatus
} from "./audioPreferenceManifest.js";
import {
  ALL_HFW_WORD_SET,
  getHfwBandSet,
  isHighFrequencyWordSkill,
  normalizeHfwSkillId
} from "./highFrequencyWordBands.js";

const HFW_ALLOWED_FORMATS = new Set([
  "HFW_AUDIO_FIND_WORD",
  "LISTEN_FIND_WORD",
  "HFW_SENTENCE_CLOZE",
  "CLOZE_CHOICE",
  "SENTENCE_CLOZE",
  "HFW_SENTENCE_PLACEMENT",
  "HFW_IMAGE_CONTEXT_CLOZE"
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
const WEAK_HFW_PROMPT_PATTERN =
  /\b(find the word|which word is|find word)\s*:?\s*["“”']?[a-z]+\b/i;

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

function getVisibleQuestionPromptText(question = {}) {
  return [question.prompt, question.question, question.spokenPrompt]
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

function getRawOptions(question = {}) {
  if (Array.isArray(question.answerOptions) && question.answerOptions.length) return question.answerOptions;
  if (Array.isArray(question.options) && question.options.length) return question.options;
  if (Array.isArray(question.choices) && question.choices.length) return question.choices;
  return [];
}

function getOptionWords(question = {}) {
  return getRawOptions(question)
    .map(option => {
      if (option && typeof option === "object") {
        return option.value || option.word || option.label || option.text || option.answer || "";
      }
      return option;
    })
    .map(normalizeWord)
    .filter(Boolean);
}

function getOptionValues(question = {}) {
  return getRawOptions(question)
    .map(option => {
      if (option && typeof option === "object") {
        return option.value || option.word || option.label || option.text || option.answer || "";
      }
      return option;
    })
    .map(value => String(value || "").trim())
    .filter(Boolean);
}

function getQuestionSkillText(question = {}) {
  return [question.skillId, question.skillName, question.skill, question.stage].filter(Boolean).join(" ");
}

export function getHfwRuntimeEligibilityIssues(question = {}, skillId = "") {
  const options = typeof arguments[2] === "object" ? arguments[2] : {};
  const bandId = normalizeHfwSkillId(skillId || getQuestionSkillText(question));
  if (!bandId) return ["not an HFW skill band"];

  const issues = [];
  const bandSet = getHfwBandSet(bandId);
  const format = getFormat(question);
  const itemType = String(question.itemType || question.type || "").toLowerCase();
  const promptText = getPromptText(question);
  const visiblePromptText = getVisibleQuestionPromptText(question);
  const questionWords = getQuestionWords(question);
  const optionWords = getOptionWords(question);
  const optionValues = getOptionValues(question);
  const primaryWord = questionWords.find(word => bandSet?.has(word)) || questionWords[0] || "";
  const declaredQuestionBand = normalizeHfwSkillId(getQuestionSkillText(question));
  const promptWords = normalizeWord(visiblePromptText).split(/\s+/).filter(Boolean);
  const answer = normalizeWord(question.correctAnswer || question.answer || "");
  const sentence = String(question.sentence || question.passage || question.context || "");
  const pathExists = typeof options.pathExists === "function" ? options.pathExists : null;
  const audioPath = question.audioPath || question.audioUrl || question.audio || "";
  const imagePath = question.imagePath || question.imageUrl || question.image || "";

  if (declaredQuestionBand && declaredQuestionBand !== bandId) {
    issues.push(`belongs to ${declaredQuestionBand}, not ${bandId}`);
  }
  if (HFW_BLOCKED_FORMATS.has(format)) issues.push(`${format} is not an HFW-safe template`);
  if (!HFW_ALLOWED_FORMATS.has(format)) issues.push(`${format} is not in the HFW allowlist`);
  if (PHONICS_PROMPT_PATTERN.test(promptText)) issues.push("prompt is phonics/picture-matching, not HFW recognition");
  if (WEAK_HFW_PROMPT_PATTERN.test(visiblePromptText)) issues.push("weak text-only find-the-word prompt is blocked");
  if (itemType && itemType !== "sight_word") issues.push(`itemType is ${itemType}, not sight_word`);
  if (!primaryWord) {
    issues.push("missing target HFW word");
  } else if (!bandSet?.has(primaryWord)) {
    issues.push(`target word "${primaryWord}" is outside ${bandId}`);
  }
  if (optionValues.length !== 4) {
    issues.push(`HFW live questions require exactly 4 answer options, found ${optionValues.length}`);
  }
  if (["HFW_AUDIO_FIND_WORD", "LISTEN_FIND_WORD", "HFW_SENTENCE_CLOZE", "SENTENCE_CLOZE", "CLOZE_CHOICE", "HFW_IMAGE_CONTEXT_CLOZE"].includes(format)) {
    const nonHfwOptions = optionWords.filter(word => !ALL_HFW_WORD_SET.has(word));
    if (nonHfwOptions.length) {
      issues.push(`non-HFW answer options: ${[...new Set(nonHfwOptions)].join(", ")}`);
    }
  }

  if (["HFW_AUDIO_FIND_WORD", "LISTEN_FIND_WORD"].includes(format)) {
    const approvedAudioPath = getApprovedAudioPath(primaryWord, audioPath);
    if (!audioPath) {
      issues.push("audio-led HFW recognition needs target audio");
    } else if (!approvedAudioPath) {
      issues.push(`audio-led HFW recognition needs approved exact-word audio; status is ${getAudioPreferenceStatus(primaryWord, audioPath)}`);
    } else if (pathExists && !pathExists(approvedAudioPath)) {
      issues.push(`audio file does not exist: ${approvedAudioPath}`);
    }
    if (primaryWord && promptWords.includes(primaryWord)) {
      issues.push("audio-led HFW recognition prints the target word in the prompt");
    }
  }

  if (["HFW_SENTENCE_CLOZE", "SENTENCE_CLOZE", "CLOZE_CHOICE", "HFW_IMAGE_CONTEXT_CLOZE"].includes(format)) {
    const blankCount = (sentence.match(/___/g) || []).length;
    if (blankCount !== 1) issues.push(`sentence cloze needs exactly one blank, found ${blankCount}`);
    if (answer && answer !== primaryWord) issues.push(`correct answer "${answer}" does not match target word "${primaryWord}"`);
  }

  if (format === "HFW_SENTENCE_PLACEMENT") {
    if (!answer) issues.push("sentence placement missing correct sentence");
    const correctMatches = optionValues.filter(option => normalizeWord(option) === answer).length;
    if (correctMatches !== 1) issues.push(`sentence placement needs exactly one correct sentence option, found ${correctMatches}`);
    if (primaryWord && !normalizeWord(answer).split(/\s+/).includes(primaryWord)) {
      issues.push(`sentence placement correct sentence does not use target word "${primaryWord}"`);
    }
  }

  if (format === "HFW_IMAGE_CONTEXT_CLOZE") {
    if (!imagePath) {
      issues.push("image-context HFW question needs a context image");
    } else if (pathExists && !pathExists(imagePath)) {
      issues.push(`image file does not exist: ${imagePath}`);
    }
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
