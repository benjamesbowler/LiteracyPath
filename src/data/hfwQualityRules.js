export const HFW_FILLER_PHRASES = [
  "before snack",
  "after snack",
  "with a smile",
  "at school",
  "in the classroom",
  "with my friend",
  "every day",
  "today",
  "outside",
  "in the morning",
  "at the park"
];

export const HFW_ZERO_TOLERANCE_FILLER_PHRASES = new Set([
  "before snack",
  "with a smile"
]);

export const HFW_FILLER_REUSE_THRESHOLD = 2;

const WEAK_GENERIC_HFW_FRAMES = [
  /\bcan you ___ with me\b/i,
  /\bi will ___ with a smile\b/i,
  /\bwe can ___ before snack\b/i,
  /\bcan you ___ with me (?:before snack|with a smile)\b/i
];

const AMBIGUOUS_HFW_GROUPS = [
  ["come", "go"],
  ["look", "see"],
  ["make", "do"],
  ["said", "say"],
  ["has", "have"],
  ["is", "was", "are", "were"],
  ["a", "the", "an"],
  ["my", "your", "this", "that", "his", "her", "our", "their"]
];

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeHfwText(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[_]{3,}/g, " ___ ")
    .replace(/[^a-z0-9_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function optionValue(option) {
  if (option && typeof option === "object") {
    return option.value || option.word || option.label || option.text || option.answer || "";
  }
  return option || "";
}

export function getHfwQuestionSentence(question = {}) {
  return String(
    question.visibleSentenceWithBlank ||
    question.sentence ||
    question.passage ||
    question.context ||
    ""
  );
}

export function getHfwQuestionOptions(question = {}) {
  const raw = Array.isArray(question.answerOptions) && question.answerOptions.length
    ? question.answerOptions
    : Array.isArray(question.options) && question.options.length
      ? question.options
      : Array.isArray(question.choices)
        ? question.choices
        : [];
  return raw.map(optionValue).map(normalizeHfwText).filter(Boolean);
}

export function getHfwQuestionAnswer(question = {}) {
  return normalizeHfwText(question.answer || question.correctAnswer || question.targetWord || question.itemKey || "");
}

export function getHfwFillerPhraseHits(value = "") {
  const text = normalizeHfwText(typeof value === "string" ? value : getHfwQuestionSentence(value));
  return HFW_FILLER_PHRASES.filter(phrase => {
    const normalizedPhrase = normalizeHfwText(phrase);
    return new RegExp(`(?:^|\\s)${escapeRegex(normalizedPhrase)}(?:\\s|$)`).test(text);
  });
}

export function hasHfwFillerPhrase(value = "") {
  return getHfwFillerPhraseHits(value).length > 0;
}

export function normalizeHfwSentenceFrame(sentence = "") {
  return normalizeHfwText(sentence)
    .replace(/\b___\b/g, "___")
    .replace(/\s+/g, " ")
    .trim();
}

export function getWeakGenericHfwPromptIssues(question = {}) {
  const sentence = getHfwQuestionSentence(question);
  const normalizedSentence = normalizeHfwText(sentence);
  const issues = [];
  const fillerHits = getHfwFillerPhraseHits(sentence);
  if (fillerHits.length) issues.push(`filler_phrase_reuse:${fillerHits.join(",")}`);
  if (WEAK_GENERIC_HFW_FRAMES.some(pattern => pattern.test(normalizedSentence))) {
    issues.push("weak_generic_prompt");
  }
  return issues;
}

function sentenceAcceptsWord(sentence, word) {
  const normalizedSentence = normalizeHfwText(sentence);
  const normalizedWord = normalizeHfwText(word);
  const filled = normalizeHfwText(normalizedSentence.replace(/\b___\b/g, normalizedWord));

  if (!normalizedSentence.includes("___") || !normalizedWord) return false;
  if (/\bcan you ___ with me\b/.test(normalizedSentence)) {
    return ["come", "go"].includes(normalizedWord);
  }
  if (/\b___ with me\b/.test(normalizedSentence)) {
    return ["come", "go", "play"].includes(normalizedWord);
  }
  if (/\b___ at\b/.test(normalizedSentence)) return normalizedWord === "look";
  if (/\b___ for\b/.test(normalizedSentence)) return ["look", "ask"].includes(normalizedWord);
  if (/\bdo you ___\b/.test(normalizedSentence)) return ["like", "see", "know"].includes(normalizedWord);
  if (/\bi ___ this\b/.test(normalizedSentence)) return ["like", "see", "know"].includes(normalizedWord);
  if (/\bi ___ a\b/.test(normalizedSentence)) return ["see", "have", "found"].includes(normalizedWord);
  if (/\bwe will ___ to\b/.test(normalizedSentence)) return ["go", "come"].includes(normalizedWord);
  if (/\bplease ___ to\b/.test(normalizedSentence)) return ["come", "go"].includes(normalizedWord);
  if (/\b___ to the rug\b/.test(normalizedSentence)) return ["come", "go"].includes(normalizedWord);
  if (/\bthe .* ___\b/.test(normalizedSentence) && /\bspots?\b/.test(filled)) return ["has", "have"].includes(normalizedWord);

  return false;
}

export function getMultiplePlausibleHfwAnswerIssues(question = {}) {
  const sentence = getHfwQuestionSentence(question);
  const answer = getHfwQuestionAnswer(question);
  const options = [...new Set(getHfwQuestionOptions(question))];
  if (!sentence || !answer || !options.length || !sentence.includes("___")) return [];

  const plausible = options.filter(option => {
    if (option === answer) return true;
    const answerGroup = AMBIGUOUS_HFW_GROUPS.find(words => words.includes(answer));
    if (answerGroup?.includes(option)) return true;
    return sentenceAcceptsWord(sentence, option) && sentenceAcceptsWord(sentence, answer);
  });

  return plausible.length > 1
    ? [`multiple_plausible_hfw_answers:${plausible.join(",")}`]
    : [];
}
