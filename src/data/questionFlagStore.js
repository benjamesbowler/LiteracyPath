export const QUESTION_FLAG_STORAGE_KEY = "lpAssessmentQuestionFlags";
export const RETIRED_MEDIA_QA_STORAGE_KEY = "lpUnifiedMediaQaReviewDecisions";

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function normalizeText(value = "") {
  return String(value || "").trim();
}

function optionValue(option) {
  if (option && typeof option === "object") {
    return option.value || option.word || option.label || option.text || option.answer || "";
  }
  return option || "";
}

function optionLabel(option) {
  if (option && typeof option === "object") {
    return option.label || option.text || option.word || option.value || option.answer || "";
  }
  return option || "";
}

function optionImage(option) {
  if (!option || typeof option !== "object") return "";
  return option.image || option.imagePath || option.imageUrl || option.targetImage || option.targetImagePath || "";
}

function uniqueByPath(items = []) {
  const seen = new Set();
  return items.filter(item => {
    const path = normalizeText(item.path);
    if (!path || seen.has(path)) return false;
    seen.add(path);
    return true;
  });
}

export function questionFlagId(question = {}, flagType = "") {
  return [
    question.id || question.questionId || question.approvedQuestionId || "unknown_question",
    question.skillId || question.assessmentSkillId || "unknown_skill",
    flagType,
    Date.now()
  ].join("::");
}

export function getQuestionImageContexts(question = {}) {
  const directImages = [
    ["Question image", question.imagePath || question.imageUrl || question.image],
    ["Target image", question.targetImage || question.targetImagePath || question.targetImageUrl]
  ].map(([label, path]) => ({ label, path: normalizeText(path) }));

  const cardImages = [
    ...(Array.isArray(question.imageCards) ? question.imageCards : []),
    ...(Array.isArray(question.promptImageCards) ? question.promptImageCards : []),
    ...(Array.isArray(question.answerOptions) ? question.answerOptions : []),
    ...(Array.isArray(question.options) ? question.options : []),
    ...(Array.isArray(question.choices) ? question.choices : [])
  ].map(option => ({
    label: optionLabel(option) || optionValue(option) || "Answer image",
    path: normalizeText(optionImage(option))
  }));

  const choiceImageMap = question.choiceImages && typeof question.choiceImages === "object"
    ? Object.entries(question.choiceImages).map(([label, image]) => ({
        label,
        path: normalizeText(image?.image || image?.imagePath || image?.imageUrl || "")
      }))
    : [];

  return uniqueByPath([...directImages, ...cardImages, ...choiceImageMap]);
}

export function getQuestionAnswerChoices(question = {}) {
  const choices = Array.isArray(question.answerOptions) && question.answerOptions.length
    ? question.answerOptions
    : Array.isArray(question.options) && question.options.length
    ? question.options
    : Array.isArray(question.choices)
    ? question.choices
    : [];

  return choices.map(option => ({
    label: normalizeText(optionLabel(option)),
    value: normalizeText(optionValue(option)),
    image: normalizeText(optionImage(option))
  }));
}

export function readQuestionFlags() {
  if (!canUseLocalStorage()) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(QUESTION_FLAG_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeQuestionFlags(flags = []) {
  if (!canUseLocalStorage()) return flags;
  window.localStorage.setItem(QUESTION_FLAG_STORAGE_KEY, JSON.stringify(flags));
  return flags;
}

export function addQuestionFlag({ flagType, question = {}, stage = {}, visiblePrompt = "" } = {}) {
  const normalizedFlagType = flagType === "question" ? "question" : "image";
  const flag = {
    id: questionFlagId(question, normalizedFlagType),
    flagType: normalizedFlagType,
    status: "flagged",
    createdAt: new Date().toISOString(),
    skillId: question.skillId || question.assessmentSkillId || stage.id || "",
    skillName: question.skillName || question.skill || stage.label || "",
    questionId: question.id || question.questionId || question.approvedQuestionId || "",
    prompt: normalizeText(visiblePrompt || question.prompt || question.question),
    questionText: normalizeText(question.question || question.prompt),
    sentence: normalizeText(question.visibleSentenceWithBlank || question.sentence || question.passage || question.context),
    targetWord: normalizeText(question.targetWord || question.itemKey || question.audioText),
    correctAnswer: normalizeText(question.correctAnswer || question.answer),
    answerChoices: getQuestionAnswerChoices(question),
    images: getQuestionImageContexts(question),
    rawQuestion: question
  };
  const next = [flag, ...readQuestionFlags()].slice(0, 500);
  return writeQuestionFlags(next);
}

export function updateQuestionFlagAction(flagId, action, notes = "") {
  const next = readQuestionFlags().map(flag =>
    flag.id === flagId
      ? {
          ...flag,
          status: action,
          action,
          actionNotes: normalizeText(notes),
          actionAt: new Date().toISOString()
        }
      : flag
  );
  return writeQuestionFlags(next);
}

export function deleteQuestionFlag(flagId) {
  return writeQuestionFlags(readQuestionFlags().filter(flag => flag.id !== flagId));
}

export function clearQuestionFlags() {
  return writeQuestionFlags([]);
}

export function resetRetiredMediaQaReviewStorage() {
  if (!canUseLocalStorage()) return;
  window.localStorage.removeItem(RETIRED_MEDIA_QA_STORAGE_KEY);
}
