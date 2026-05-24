export function normalizeRepeatValue(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeRepeatValue).filter(Boolean).sort().join("|");
  }

  if (value && typeof value === "object") {
    return normalizeRepeatValue(
      value.value ||
      value.word ||
      value.label ||
      value.text ||
      value.answer ||
      value.id ||
      ""
    );
  }

  return String(value || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9/._-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function getRepeatPrompt(question = {}) {
  return question.prompt || question.question || question.spokenPrompt || "";
}

export function getRepeatCorrectAnswer(question = {}) {
  const answer =
    question.correctAnswers ||
    question.correctAnswer ||
    question.answer ||
    question.correctSentence ||
    "";

  return normalizeRepeatValue(answer);
}

export function getRepeatTargetWord(question = {}) {
  const format = normalizeRepeatValue(
    question.templateType ||
    question.formatType ||
    question.questionType ||
    ""
  );
  const hasExplicitTarget =
    question.targetWord ||
    question.audioText ||
    question.imageKey ||
    question.audioKey ||
    question.anchorWord;

  if (hasExplicitTarget) {
    return normalizeRepeatValue(
      question.targetWord ||
      question.audioText ||
      question.imageKey ||
      question.audioKey ||
      question.anchorWord
    );
  }

  const pairAnswer =
    question.correctAnswers ||
    (Array.isArray(question.answer) ? question.answer : null) ||
    (Array.isArray(question.correctAnswer) ? question.correctAnswer : null);

  if (pairAnswer) {
    return normalizeRepeatValue(pairAnswer);
  }

  const answerValue = question.answer || question.correctAnswer || "";
  const answerText = normalizeRepeatValue(answerValue);
  const canUseAnswerAsTarget =
    format.includes("listen_find_word") ||
    format.includes("read_find_word") ||
    format.includes("heard_word") ||
    format.includes("picture_to_print") ||
    format.includes("minimal_pair") ||
    format.includes("cvc") ||
    format.includes("sight_word");

  if (canUseAnswerAsTarget && answerText.length > 1) {
    return answerText;
  }

  return "";
}

export function getRepeatOptionSetSignature(question = {}) {
  const options = [
    ...(question.choices || []),
    ...(question.answerOptions || []),
    ...(question.imageCards || []).map(card => card.word || card.label || card.id),
    ...(question.promptImageCards || []).map(card => card.word || card.label || card.id),
    ...(question.soundTiles || []).map(tile => tile.tile || tile.value || tile)
  ]
    .map(normalizeRepeatValue)
    .filter(Boolean)
    .sort();

  return options.join("|");
}

export function getQuestionPromptAnswerSignature(question = {}) {
  return [
    normalizeRepeatValue(getRepeatPrompt(question)),
    getRepeatCorrectAnswer(question)
  ].filter(Boolean).join("::");
}

export function getQuestionSignature(question = {}, metadata = null) {
  const itemType = metadata?.itemType || question.itemType || "";
  const itemKey = metadata?.itemKey || question.itemKey || "";
  const format =
    question.templateType ||
    question.formatType ||
    question.questionType ||
    question.distractorType ||
    "";
  const mediaTarget =
    question.imagePath ||
    question.imageUrl ||
    question.imageKey ||
    question.audioPath ||
    question.audioUrl ||
    question.audioKey ||
    "";

  return [
    question.skillId || question.skill || question.skillName || "",
    format,
    itemType,
    itemKey,
    getRepeatTargetWord(question),
    getQuestionPromptAnswerSignature(question),
    getRepeatOptionSetSignature(question),
    mediaTarget
  ]
    .map(normalizeRepeatValue)
    .filter(Boolean)
    .join("||");
}

export function getAnswerRecordSignature(record = {}) {
  return [
    record.stage || record.skill || "",
    record.question || record.prompt || "",
    record.correct || record.correctAnswer || "",
    record.diagnosticTarget || "",
    record.targetWord || "",
    record.itemType || "",
    record.itemKey || ""
  ]
    .map(normalizeRepeatValue)
    .filter(Boolean)
    .join("||");
}

export function getAnswerRecordPromptAnswerSignature(record = {}) {
  return [
    record.question || record.prompt || "",
    record.correct || record.correctAnswer || ""
  ]
    .map(normalizeRepeatValue)
    .filter(Boolean)
    .join("::");
}
