import { getApprovedAudioPath } from "./data/audioPreferenceManifest.js";
import { validateQuestionTemplate } from "./data/templateValidationRules.js";
import { getEarlyPhonicsAndAudioIssues } from "./data/earlyPhonicsValidation.js";

const BLEND_PATTERNS = ["bl", "cl", "fl", "gl", "pl", "sl", "br", "cr", "dr", "fr", "gr", "pr", "tr", "sc", "sk", "sm", "sn", "sp", "st", "sw"];
const DIGRAPH_PATTERNS = ["sh", "ch", "th", "wh", "ph", "ck"];
const VOWEL_TEAMS = ["ai", "ay", "ee", "ea", "oa", "ow", "igh", "ie", "oo", "ue", "ew", "oi", "oy", "ou", "aw"];
const R_CONTROLLED = ["ar", "er", "ir", "or", "ur"];

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizedWord(value) {
  return normalize(value).replace(/\s+/g, "");
}

function questionText(question) {
  return normalize([question?.question, question?.prompt, question?.spokenPrompt].join(" "));
}

function choices(question) {
  return (question?.choices || []).map(choice => String(choice));
}

function finalUnit(word) {
  const normalized = normalizedWord(word);
  if (normalized.endsWith("sh")) return "sh";
  if (normalized.endsWith("ch")) return "ch";
  if (normalized.endsWith("ck")) return "k";
  if (normalized.endsWith("se")) return "s";
  if (normalized.length > 2 && normalized.endsWith("e")) return normalized.at(-2) || "";
  return normalized.at(-1) || "";
}

function rhymeFamily(word) {
  const normalized = normalizedWord(word);
  return normalized.slice(-2);
}

function shortVowel(word) {
  return normalizedWord(word).match(/[aeiou]/)?.[0] || "";
}

function startsWithPattern(word, pattern) {
  return normalizedWord(word).startsWith(normalizedWord(pattern));
}

function containsPattern(word, pattern) {
  return normalizedWord(word).includes(normalizedWord(pattern));
}

function expectedTarget(question) {
  const formatType = String(question?.formatType || "").toUpperCase();
  const text = questionText(question);
  const itemKey = normalizedWord(question?.itemKey);
  const targetPattern = normalizedWord(question?.targetPattern);

  if (targetPattern) return targetPattern;
  if (question?.itemType === "phonics_pattern" && itemKey) return itemKey;
  if (formatType === "LISTEN_CHOOSE_VOWEL") return shortVowel(question?.targetWord || question?.audioText || question?.answer);

  return (
    text.match(/\bstarts with ([a-z]{1,3})\b/)?.[1] ||
    text.match(/\bwhich (?:blend|letters) starts? this word\b/)?.[1] ||
    itemKey
  );
}

function countMatchingChoices(question, predicate) {
  return choices(question).filter(choice => predicate(choice)).length;
}

function repeatedAnswerIssue(question) {
  const normalizedChoices = choices(question).map(normalizedWord);
  return new Set(normalizedChoices).size === normalizedChoices.length
    ? ""
    : "duplicate or visually identical answer choices";
}

function phonicsAmbiguityIssue(question) {
  const formatType = String(question?.formatType || "").toUpperCase();
  const qType = question?.questionType;
  const text = questionText(question);
  const target = expectedTarget(question);

  if (!choices(question).length) return "";

  if (formatType === "IMAGE_WORD_PATTERN_MATCH" && target) {
    const matchCount = countMatchingChoices(question, choice => startsWithPattern(choice, target));
    return matchCount === 1 ? "" : `expected exactly one ${target} answer, found ${matchCount}`;
  }

  if ((formatType === "LISTEN_FIND_RHYME" || formatType === "READ_FIND_RHYME") && question?.targetWord) {
    const targetFamily = rhymeFamily(question.targetWord);
    const matchCount = countMatchingChoices(question, choice => rhymeFamily(choice) === targetFamily);
    return matchCount === 1 ? "" : `expected exactly one ${targetFamily} rhyme answer, found ${matchCount}`;
  }

  if (formatType === "LISTEN_CHOOSE_VOWEL") {
    const answer = normalizedWord(question.answer);
    const matchCount = choices(question).filter(choice => normalizedWord(choice) === answer).length;
    return matchCount === 1 ? "" : `expected exactly one vowel answer, found ${matchCount}`;
  }

  if (formatType === "PICTURE_AUDIO_TO_PATTERN") {
    const answer = normalizedWord(question.answer);
    const matchCount = choices(question).filter(choice => normalizedWord(choice) === answer).length;
    return matchCount === 1 ? "" : `expected exactly one pattern answer, found ${matchCount}`;
  }

  if (qType === "initial_sound_pair" && target) {
    const matched = choices(question).filter(choice => startsWithPattern(choice, target));
    return matched.length === 2 ? "" : `expected exactly two initial ${target} pair answers, found ${matched.length}`;
  }

  if (qType === "final_sound_pair" && target) {
    const matched = choices(question).filter(choice => finalUnit(choice) === target);
    return matched.length === 2 ? "" : `expected exactly two final ${target} pair answers, found ${matched.length}`;
  }

  if (qType === "rhyme_pair" && target) {
    const matched = choices(question).filter(choice => rhymeFamily(choice) === target);
    return matched.length === 2 ? "" : `expected exactly two ${target} rhyme pair answers, found ${matched.length}`;
  }

  const patternPrompt = text.match(/\b(?:starts with|has the|contains the) ([a-z]{2,3})\b/)?.[1];
  if (patternPrompt && [...BLEND_PATTERNS, ...DIGRAPH_PATTERNS, ...VOWEL_TEAMS, ...R_CONTROLLED].includes(patternPrompt)) {
    const matchCount = countMatchingChoices(question, choice => containsPattern(choice, patternPrompt));
    if (matchCount > 1 && normalizedWord(question.answer) !== patternPrompt) {
      return `multiple choices contain target pattern ${patternPrompt}`;
    }
  }

  return "";
}

function imageIssue(question, assetExists) {
  const formatType = String(question?.formatType || "").toUpperCase();
  const requiresMainImage =
    formatType === "PICTURE_TO_PRINT_MATCH" ||
    formatType === "PLURAL_IMAGE_SPELLING" ||
    questionText(question).includes("matches the picture");

  if (requiresMainImage && !question?.imagePath) return "missing required main image";
  if (requiresMainImage && (question?.imageCards || []).length > 0) return "picture-to-print choices must be text-only";

  const requiredCards = ["initial_sound_pair", "final_sound_pair", "rhyme_pair"].includes(question?.questionType) ||
    question?.questionType === "visual_card_choice";

  if (requiredCards) {
    const missing = (question?.imageCards || []).filter(card => !card.image);
    if (missing.length) return `missing card images: ${missing.map(card => card.word).join(", ")}`;
  }

  if (assetExists) {
    const paths = [
      question?.imagePath,
      ...(question?.imageCards || []).map(card => card.image),
      ...(question?.promptImageCards || []).map(card => card.image),
      ...Object.values(question?.choiceImages || {}).map(asset => asset?.image)
    ].filter(Boolean);

    const missingFile = paths.find(path => !assetExists(path));
    if (missingFile) return `image file does not exist: ${missingFile}`;
  }

  return "";
}

function audioIssue(question, assetExists) {
  const formatType = String(question?.formatType || "").toUpperCase();
  const requiresPromptAudio = new Set([
    "LISTEN_CHOOSE_VOWEL",
    "LISTEN_FIND_WORD",
    "LISTEN_FIND_RHYME",
    "HEARD_WORD_TO_PRINT_MINIMAL_PAIR",
    "PICTURE_AUDIO_TO_PATTERN"
  ]).has(formatType) || question?.questionType === "listen_and_find_word";
  const requiresCardAudio = ["initial_sound_pair", "final_sound_pair", "rhyme_pair"].includes(question?.questionType) ||
    question?.requireOptionAudio === true;

  if (requiresPromptAudio && !getApprovedAudioPath(question?.audioText || question?.targetWord || question?.answer, question?.audioPath || "")) {
    return "missing approved prompt/target audio";
  }

  if (requiresCardAudio) {
    const cards = question?.imageCards || [];
    const missing = cards.filter(card => !getApprovedAudioPath(card.word, card.audio || ""));
    if (missing.length) return `missing approved card audio: ${missing.map(card => card.word).join(", ")}`;
  }

  const cards = question?.imageCards || [];
  const cardAudioCount = cards.filter(card => getApprovedAudioPath(card.word, card.audio || "")).length;
  if (cardAudioCount > 0 && cardAudioCount < cards.length) {
    return "mixed answer-card speaker availability";
  }

  if (assetExists) {
    const paths = [
      question?.audioPath,
      ...(question?.imageCards || []).map(card => card.audio)
    ].filter(Boolean);
    const missingFile = paths.find(path => !assetExists(path));
    if (missingFile) return `audio file does not exist: ${missingFile}`;
  }

  return "";
}

export function getAssessmentContentIssues(question, options = {}) {
  const issues = [
    ...validateQuestionTemplate(question, options),
    ...getEarlyPhonicsAndAudioIssues(question),
    repeatedAnswerIssue(question),
    imageIssue(question, options.assetExists),
    audioIssue(question, options.assetExists),
    phonicsAmbiguityIssue(question)
  ].filter(Boolean);

  return issues;
}

export function isAssessmentContentValid(question, options = {}) {
  return getAssessmentContentIssues(question, options).length === 0;
}

export function getApprovedCardAudioPath(card) {
  return getApprovedAudioPath(card?.word, card?.audio || "");
}

export function shouldShowUniformCardAudio(cards = []) {
  if (!cards.length) return false;
  return cards.every(card => Boolean(getApprovedCardAudioPath(card)));
}
