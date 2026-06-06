const HFW_SPELLING_TYPES = new Set([
  "HFW_SENTENCE_SPELL",
  "HFW_LISTEN_SPELL",
  "HFW_LETTER_BUILD",
  "LISTEN_AND_SPELL"
]);

function normalizeToken(value = "") {
  return String(value || "")
    .trim()
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function normalizeWord(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, "");
}

function getFormatTokens(question = {}) {
  return [
    question.formatType,
    question.templateType,
    question.templateKey,
    question.runtimeTemplateKey,
    question.questionType
  ].map(normalizeToken).filter(Boolean);
}

export function getHfwSpellingTiles(question = {}) {
  if (Array.isArray(question.letterTiles) && question.letterTiles.length) return question.letterTiles;
  if (Array.isArray(question.soundTiles) && question.soundTiles.length) return question.soundTiles;
  return [];
}

export function isHfwSpellingQuestionCandidate(question = {}) {
  const skillId = String(question?.skillId || question?.assessmentSkillId || "").toLowerCase();
  if (!skillId.startsWith("hfw_")) return false;

  const questionType = normalizeToken(question.questionType);
  const prompt = String(question.prompt || question.question || "").toLowerCase();
  return (
    HFW_SPELLING_TYPES.has(questionType) ||
    getFormatTokens(question).some(format =>
      format === "HFW_LETTER_BUILD" ||
      format === "HFW_SENTENCE_SPELL" ||
      format.startsWith("HFW_SENTENCE_SPELL_") ||
      format.startsWith("HFW_LISTEN_SPELL")
    ) ||
    prompt.includes("spell the missing word")
  );
}

export function isHfwSpellingQuestion(question = {}) {
  if (!isHfwSpellingQuestionCandidate(question)) return false;
  const hasTiles = getHfwSpellingTiles(question).length > 0;
  const hasSpellingAnswer = Boolean(question.correctLetterSequence?.length || question.correctAnswer || question.answer || question.targetWord);
  return hasTiles && hasSpellingAnswer;
}

export function getHfwSpellingQuestionIssues(question = {}) {
  if (!isHfwSpellingQuestionCandidate(question)) return [];

  const issues = [];
  const answer = normalizeWord(question.correctAnswer || question.answer || question.targetWord || question.itemKey || "");
  const sequence = Array.isArray(question.correctLetterSequence)
    ? question.correctLetterSequence.map(value => String(value || "").toLowerCase()).join("")
    : "";
  const tiles = getHfwSpellingTiles(question).map(value => String(value || "").toLowerCase());
  const visibleSentence = String(question.visibleSentenceWithBlank || question.sentence || question.passage || question.context || "");
  const audioText = String(question.sentenceAudio || question.sentenceText || question.fullSentence || question.spokenPrompt || question.audioText || "");
  const options = [
    ...(Array.isArray(question.choices) ? question.choices : []),
    ...(Array.isArray(question.answerOptions) ? question.answerOptions : []),
    ...(Array.isArray(question.options) ? question.options : [])
  ];

  if (!isHfwSpellingQuestion(question)) issues.push("not recognized as HFW spelling panel question");
  if (!answer) issues.push("missing spelling answer");
  if ((visibleSentence.match(/___/g) || []).length !== 1) issues.push("needs exactly one visible blank");
  if (sequence && sequence !== answer) issues.push(`correctLetterSequence does not spell "${answer}"`);
  if (!sequence) issues.push("missing correctLetterSequence");
  if (!tiles.length) issues.push("missing letter tiles");
  if (tiles.length < answer.length) issues.push(`not enough letter tiles for "${answer}"`);
  if (!audioText || !normalizeWord(audioText).includes(answer)) issues.push(`sentence audio text missing "${answer}" in context`);
  if (options.length) issues.push("must render as spelling panel, not answer choices");

  const available = tiles.reduce((counts, letter) => {
    counts[letter] = (counts[letter] || 0) + 1;
    return counts;
  }, {});
  for (const letter of answer.split("")) {
    if (!available[letter]) {
      issues.push(`letter tiles are missing "${letter}" for "${answer}"`);
      break;
    }
    available[letter] -= 1;
  }

  return [...new Set(issues)];
}
