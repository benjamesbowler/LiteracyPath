import {
  BLENDS_ALLOWED_FORMATS,
  getBlendsRuntimeEligibilityIssues
} from "./blendsRuntimeEligibility.js";
import {
  DIGRAPHS_ALLOWED_FORMATS,
  getDigraphsRuntimeEligibilityIssues
} from "./digraphsRuntimeEligibility.js";
import {
  LONG_VOWELS_ALLOWED_FORMATS,
  getLongVowelsRuntimeEligibilityIssues
} from "./longVowelsRuntimeEligibility.js";
import { HFW_ALLOWED_FORMATS as HFW_ALLOWED_FORMAT_LIST } from "./hfwAssessmentFormatConfig.js";

const normalize = value =>
  String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const HFW_ALLOWED_FORMATS = new Set(HFW_ALLOWED_FORMAT_LIST);

const GRAMMAR_ALLOWED_FORMATS = new Set([
  "GRAMMAR_IMAGE_CHOICE",
  "GRAMMAR_SENTENCE_FIT"
]);

const GRAMMAR_REPLACEMENT_SOURCES = new Set([
  "grammar_replacement_2026_06",
  "skill_word_bank_workbook"
]);

const COMPREHENSION_SKILLS = new Set([
  "sentence_comprehension",
  "key_details",
  "sequencing",
  "main_idea",
  "inference",
  "cause_effect",
  "context_clues",
  "theme",
  "theme_higher_comprehension"
]);

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
    allowedFormats: new Set(["LISTEN_CHOOSE_VOWEL", "PICTURE_TO_PRINT_MATCH"]),
    singleTemplate: false
  },
  hfw_1_25: {
    allowedFormats: HFW_ALLOWED_FORMATS,
    sightWordsOnly: true,
    singleTemplate: false
  },
  hfw_26_50: {
    allowedFormats: HFW_ALLOWED_FORMATS,
    sightWordsOnly: true,
    singleTemplate: false
  },
  hfw_51_75: {
    allowedFormats: HFW_ALLOWED_FORMATS,
    sightWordsOnly: true,
    singleTemplate: false
  },
  hfw_76_100: {
    allowedFormats: HFW_ALLOWED_FORMATS,
    sightWordsOnly: true,
    singleTemplate: false
  },
  blends: {
    allowedFormats: BLENDS_ALLOWED_FORMATS,
    blendsOnly: true,
    singleTemplate: false
  },
  digraphs: {
    allowedFormats: DIGRAPHS_ALLOWED_FORMATS,
    digraphsOnly: true,
    singleTemplate: false
  },
  long_vowels: {
    allowedFormats: LONG_VOWELS_ALLOWED_FORMATS,
    longVowelsOnly: true,
    singleTemplate: false
  },
  long_vowels_silent_e: {
    allowedFormats: LONG_VOWELS_ALLOWED_FORMATS,
    longVowelsOnly: true,
    singleTemplate: false
  },
  nouns: {
    allowedFormats: GRAMMAR_ALLOWED_FORMATS,
    grammarPart: "noun",
    singleTemplate: false
  },
  verbs: {
    allowedFormats: GRAMMAR_ALLOWED_FORMATS,
    grammarPart: "verb",
    singleTemplate: false
  },
  adjectives: {
    allowedFormats: GRAMMAR_ALLOWED_FORMATS,
    grammarPart: "adjective",
    singleTemplate: false
  },
  sentence_comprehension: {
    allowedFormats: new Set(["COMPREHENSION"]),
    comprehensionSkill: "sentence_comprehension",
    singleTemplate: false
  },
  key_details: {
    allowedFormats: new Set(["COMPREHENSION"]),
    comprehensionSkill: "key_details",
    singleTemplate: false
  },
  sequencing: {
    allowedFormats: new Set(["COMPREHENSION"]),
    comprehensionSkill: "sequencing",
    singleTemplate: false
  },
  main_idea: {
    allowedFormats: new Set(["COMPREHENSION"]),
    comprehensionSkill: "main_idea",
    singleTemplate: false
  },
  inference: {
    allowedFormats: new Set(["COMPREHENSION"]),
    comprehensionSkill: "inference",
    singleTemplate: false
  },
  cause_effect: {
    allowedFormats: new Set(["COMPREHENSION"]),
    comprehensionSkill: "cause_effect",
    singleTemplate: false
  },
  context_clues: {
    allowedFormats: new Set(["COMPREHENSION"]),
    comprehensionSkill: "context_clues",
    singleTemplate: false
  },
  theme: {
    allowedFormats: new Set(["COMPREHENSION"]),
    comprehensionSkill: "theme",
    singleTemplate: false
  }
};

export function getQuestionRoutingFormat(question = {}) {
  // formatType is the canonical runtime contract. Some imported banks retain a
  // source-specific templateType (for example PREPOSITION_IMAGE_SENTENCE_FIT)
  // while exposing the supported runtime route in formatType
  // (PREPOSITION_TEXT_CHOICE). Routing and release audits must agree with the
  // renderer and use the canonical field first.
  const format = String(question.formatType || question.templateType || question.questionType || "UNKNOWN").toUpperCase();
  const skillId = normalize(question.assessmentSkillId || question.skillId || question.skill || "");
  if (
    (format === "UNKNOWN" || format === "MULTIPLE_CHOICE") &&
    COMPREHENSION_SKILLS.has(skillId) &&
    question.passage
  ) {
    return "COMPREHENSION";
  }
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

function optionValue(option = {}) {
  if (option && typeof option === "object") return option.value || option.word || option.label || option.text || "";
  return option || "";
}

function optionPart(option = {}) {
  return String(option?.partOfSpeech || "").toLowerCase();
}

function hasOptionAudio(option = {}) {
  return Boolean(option?.audio || option?.audioPath || option?.audioUrl);
}

function getGrammarRuntimeEligibilityIssues(question = {}, expectedPart = "") {
  const issues = [];
  const format = getQuestionRoutingFormat(question);
  const choices = Array.isArray(question.choices) ? question.choices : [];
  const answer = String(question.answer || question.correctAnswer || "").toLowerCase();

  if (!GRAMMAR_REPLACEMENT_SOURCES.has(question.source)) issues.push("Grammar skills must use the replacement bank");
  if (!GRAMMAR_ALLOWED_FORMATS.has(format)) issues.push(`${format} is not an allowed grammar replacement format`);
  if (question.partOfSpeech !== expectedPart) issues.push(`expected ${expectedPart} question`);
  if (!answer || !choices.map(choice => String(choice).toLowerCase()).includes(answer)) issues.push("correct answer is missing from choices");

  if (format === "GRAMMAR_IMAGE_CHOICE") {
    const cards = question.imageCards || [];
    const matchingCards = cards.filter(card => optionPart(card) === expectedPart);
    if (question.questionType !== "visual_card_choice") issues.push("Level 1 grammar questions must use visual cards");
    if (cards.length !== 4) issues.push("Level 1 grammar questions need exactly four image cards");
    if (!cards.every(card => card.image || card.imagePath || card.imageUrl)) issues.push("Level 1 grammar image cards need images");
    if (matchingCards.length !== 1) issues.push(`Level 1 grammar questions need exactly one ${expectedPart} card`);
    if (matchingCards[0] && String(optionValue(matchingCards[0])).toLowerCase() !== answer) {
      issues.push(`the only ${expectedPart} card must be the correct answer`);
    }
  }

  if (format === "GRAMMAR_SENTENCE_FIT") {
    const options = question.answerOptions || [];
    if (question.questionType !== "ixl_template") issues.push("Level 2 grammar questions must use the word-tile template");
    if (!question.sentence || !String(question.sentence).includes("___")) issues.push("Level 2 grammar questions need a sentence with a blank");
    if (!(question.imagePath || question.imageUrl || question.targetImage)) issues.push("Level 2 grammar questions need a sentence image");
    if (options.length !== 4) issues.push("Level 2 grammar questions need exactly four word choices");
    if (!options.every(option => optionPart(option) === expectedPart)) issues.push(`Level 2 grammar choices must all be ${expectedPart}s`);
    if (!options.every(hasOptionAudio)) issues.push("Level 2 grammar choices must all include audio");
  }

  return [...new Set(issues)];
}

function countSentences(text = "") {
  return String(text || "")
    .split(/[.!?]+/)
    .map(sentence => sentence.trim())
    .filter(Boolean)
    .length;
}

function countWords(text = "") {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

function getComprehensionRuntimeEligibilityIssues(question = {}, stageId = "") {
  const issues = [];
  const passage = String(question.passage || "");
  const prompt = String(question.question || question.prompt || "");
  const choices = Array.isArray(question.choices) ? question.choices : [];
  const answer = String(question.answer || question.correctAnswer || "");
  const allText = `${passage} ${prompt}`.toLowerCase();
  const idLevelMatch = String(question.id || "").match(/_l([123])_/i);
  const passageLevel = idLevelMatch
    ? Number(idLevelMatch[1])
    : Number(question.level || question.assessmentLevel || question.difficulty || 1) >= 5
      ? 3
      : Number(question.level || question.assessmentLevel || question.difficulty || 1) >= 4
        ? 2
        : 1;
  const minSentences = passageLevel >= 3 ? 3 : passageLevel === 2 ? 2 : 1;
  const minWords = passageLevel >= 3 ? 28 : passageLevel === 2 ? 18 : 6;

  if (!passage) issues.push("comprehension questions need a passage");
  if (countSentences(passage) < minSentences) issues.push(`comprehension passage must have at least ${minSentences} sentence${minSentences === 1 ? "" : "s"}`);
  if (countWords(passage) < minWords) issues.push("comprehension passage is too short");
  if (/\bchoose the word that completes\b/i.test(prompt)) issues.push("cloze prompt is not comprehension");
  if (allText.includes("___")) issues.push("blank-fill cloze text is not comprehension");
  if (choices.length !== 4) issues.push("comprehension questions need exactly four answer choices");
  if (!answer || !choices.map(choice => String(choice)).includes(answer)) issues.push("correct answer is missing from choices");
  if (stageId === "key_details") {
    if (String(question.id || "").startsWith("gap_key_details_")) {
      issues.push("generated key-details template bank is blocked");
    }
    if (/where did they place the \d+ items/i.test(prompt) || /\bthey counted \d+ items\b/i.test(passage)) {
      issues.push("repeated counted-items key-details template is blocked");
    }
  }

  return [...new Set(issues)];
}

export function getQuestionRoutingIssue(question = {}, stageId = "", options = {}) {
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
  if (rule.sightWordsOnly && options.getHfwRuntimeEligibilityIssues) {
    const hfwIssues = options.getHfwRuntimeEligibilityIssues(question, stageId);
    if (hfwIssues.length) return `High-Frequency Words routing violation: ${hfwIssues.join("; ")}`;
  }
  if (rule.blendsOnly) {
    const blendIssues = getBlendsRuntimeEligibilityIssues(question, stageId);
    if (blendIssues.length) return `Blends routing violation: ${blendIssues.join("; ")}`;
  }
  if (rule.digraphsOnly) {
    const digraphIssues = getDigraphsRuntimeEligibilityIssues(question, stageId);
    if (digraphIssues.length) return `Digraphs routing violation: ${digraphIssues.join("; ")}`;
  }
  if (rule.longVowelsOnly) {
    const longVowelIssues = getLongVowelsRuntimeEligibilityIssues(question, stageId);
    if (longVowelIssues.length) return `Long Vowels routing violation: ${longVowelIssues.join("; ")}`;
  }
  if (rule.grammarPart) {
    const grammarIssues = getGrammarRuntimeEligibilityIssues(question, rule.grammarPart);
    if (grammarIssues.length) return `Grammar routing violation: ${grammarIssues.join("; ")}`;
  }
  if (rule.comprehensionSkill) {
    const comprehensionIssues = getComprehensionRuntimeEligibilityIssues(question, rule.comprehensionSkill);
    if (comprehensionIssues.length) return `Comprehension routing violation: ${comprehensionIssues.join("; ")}`;
  }
  return "";
}

export function isQuestionAllowedForSkill(question = {}, stageId = "", options = {}) {
  return !getQuestionRoutingIssue(question, stageId, options);
}

export function isSingleTemplateSkill(stageId = "") {
  return Boolean(getSkillRoutingRule(stageId)?.singleTemplate);
}
