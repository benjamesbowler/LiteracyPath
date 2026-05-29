import { getHfwRuntimeEligibilityIssues } from "./hfwRuntimeEligibility.js";

const normalize = value =>
  String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

export const APPROVED_SIGHT_WORDS = new Set([
  "a", "again", "after", "all", "am", "an", "and", "any", "are", "around", "as", "ask", "asked", "away",
  "be", "before", "big", "blue", "but", "by", "came", "can", "cold", "come", "could", "down", "every",
  "find", "fly", "for", "found", "from", "funny", "give", "go", "going", "had", "has", "have", "he",
  "help", "helps", "her", "here", "him", "his", "how", "i", "in", "into", "is", "it", "jump", "just",
  "know", "let", "like", "little", "live", "look", "made", "make", "may", "me", "must", "my", "new",
  "not", "now", "of", "old", "on", "once", "one", "open", "our", "out", "over", "play", "please",
  "pretty", "put", "read", "red", "round", "run", "said", "saw", "say", "see", "she", "sleep", "some",
  "soon", "stop", "take", "thank", "that", "the", "them", "then", "they", "think", "this", "three",
  "to", "two", "under", "up", "very", "walk", "want", "was", "we", "well", "went", "were", "what",
  "when", "where", "white", "who", "will", "with", "yellow", "yes", "you"
]);

const ROUTING_RULES = {
  initial_sounds: {
    allowedFormats: new Set(["FIRST_SOUND", "INITIAL_SOUND_PAIR_SELECT"]),
    singleTemplate: false
  },
  final_sounds: {
    allowedFormats: new Set(["ENDING_SOUND", "ENDING_SOUND_WORD_MATCH", "FINAL_SOUND_PAIR_SELECT"]),
    singleTemplate: false
  },
  rhyming: {
    allowedFormats: new Set(["RHYME_PAIR_SELECT", "LISTEN_FIND_RHYME", "READ_FIND_RHYME", "RHYMING_PICTURE"]),
    singleTemplate: false
  },
  cvc_short_vowels: {
    allowedFormats: new Set([
      "HEARD_WORD_TO_PRINT_MINIMAL_PAIR",
      "PICTURE_TO_PRINT_MATCH",
      "MISSING_VOWEL_CVC",
      "PUT_SOUNDS_IN_ORDER",
      "COMPLETE_WORD",
      "SHORT_VOWEL_WORD",
      "LISTEN_CHOOSE_VOWEL"
    ]),
    blockedFormats: new Set(["ENDING_SOUND", "FINAL_SOUND_PAIR_SELECT"]),
    singleTemplate: false
  },
  short_vowel_discrimination: {
    allowedFormats: new Set(["LISTEN_CHOOSE_VOWEL", "SHORT_VOWEL_WORD", "PICTURE_TO_PRINT_MATCH"]),
    singleTemplate: false
  },
  hfw_1_25: {
    allowedFormats: new Set(["HFW_AUDIO_FIND_WORD", "LISTEN_FIND_WORD", "HFW_SENTENCE_CLOZE", "CLOZE_CHOICE", "SENTENCE_CLOZE", "HFW_SENTENCE_PLACEMENT", "HFW_IMAGE_CONTEXT_CLOZE"]),
    sightWordsOnly: true,
    singleTemplate: false
  },
  hfw_26_50: {
    allowedFormats: new Set(["HFW_AUDIO_FIND_WORD", "LISTEN_FIND_WORD", "HFW_SENTENCE_CLOZE", "CLOZE_CHOICE", "SENTENCE_CLOZE", "HFW_SENTENCE_PLACEMENT", "HFW_IMAGE_CONTEXT_CLOZE"]),
    sightWordsOnly: true,
    singleTemplate: false
  },
  hfw_51_100: {
    allowedFormats: new Set(["HFW_AUDIO_FIND_WORD", "LISTEN_FIND_WORD", "HFW_SENTENCE_CLOZE", "CLOZE_CHOICE", "SENTENCE_CLOZE", "HFW_SENTENCE_PLACEMENT", "HFW_IMAGE_CONTEXT_CLOZE"]),
    sightWordsOnly: true,
    singleTemplate: false
  },
  blends: {
    allowedFormats: new Set([
      "PICTURE_AUDIO_TO_PATTERN",
      "IMAGE_WORD_PATTERN_MATCH",
      "HEARD_WORD_TO_PRINT_MINIMAL_PAIR",
      "BLEND_SOUNDS",
      "MULTIPLE_CHOICE"
    ]),
    singleTemplate: false
  },
  digraphs: {
    allowedFormats: new Set(["PICTURE_AUDIO_TO_PATTERN", "IMAGE_WORD_PATTERN_MATCH", "HEARD_WORD_TO_PRINT_MINIMAL_PAIR", "MULTIPLE_CHOICE"]),
    singleTemplate: false
  }
};

export function getQuestionRoutingFormat(question = {}) {
  const format = String(question.templateType || question.formatType || question.questionType || "UNKNOWN").toUpperCase();
  if ((format === "UNKNOWN" || format === "MULTIPLE_CHOICE") && promptLooksLikeEndingSound(question)) {
    return "ENDING_SOUND_WORD_MATCH";
  }
  return format;
}

export function getSkillRoutingRule(stageId = "") {
  return ROUTING_RULES[stageId] || null;
}

function promptLooksLikeEndingSound(question = {}) {
  return /\b(end|ends|ending|final)\b/.test(String([question.prompt, question.question].filter(Boolean).join(" ")).toLowerCase());
}

function promptLooksLikeInitialSound(question = {}) {
  return /\b(start|starts|starting|first|beginning|initial)\b/.test(String([question.prompt, question.question, question.spokenPrompt].filter(Boolean).join(" ")).toLowerCase());
}

export function getQuestionRoutingIssue(question = {}, stageId = "") {
  const rule = getSkillRoutingRule(stageId);
  if (!rule) return "";

  const format = getQuestionRoutingFormat(question);
  if (rule.blockedFormats?.has(format)) return `${format} is blocked for ${stageId}`;
  if (rule.allowedFormats && !rule.allowedFormats.has(format)) return `${format} is not allowed for ${stageId}`;
  if (stageId === "final_sounds" && promptLooksLikeInitialSound(question)) return "initial/start-sound prompt is not allowed in Final Sounds";
  if (stageId === "final_sounds" && !promptLooksLikeEndingSound(question)) return "Final Sounds question must use an ending/final-sound prompt";
  if (stageId === "initial_sounds" && promptLooksLikeEndingSound(question)) return "ending/final-sound prompt is not allowed in Initial Sounds";
  if (stageId === "cvc_short_vowels" && promptLooksLikeEndingSound(question)) return "ending-sound prompt is not allowed in CVC/Short Vowels";
  if (stageId === "cvc_short_vowels" && promptLooksLikeInitialSound(question)) return "initial/start-sound prompt is not allowed in CVC/Short Vowels";
  if (stageId === "rhyming" && (promptLooksLikeInitialSound(question) || promptLooksLikeEndingSound(question))) {
    return "initial/final-sound prompt is not allowed in Rhyming";
  }
  if (rule.sightWordsOnly) {
    const hfwIssues = getHfwRuntimeEligibilityIssues(question, stageId);
    if (hfwIssues.length) return `High-Frequency Words routing violation: ${hfwIssues.join("; ")}`;
  }
  return "";
}

export function isQuestionAllowedForSkill(question = {}, stageId = "") {
  return !getQuestionRoutingIssue(question, stageId);
}

export function isSingleTemplateSkill(stageId = "") {
  return Boolean(getSkillRoutingRule(stageId)?.singleTemplate);
}
