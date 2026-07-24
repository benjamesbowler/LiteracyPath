function hasQuestionImage(question = {}) {
  return Boolean(
    question.imagePath ||
    question.imageUrl ||
    question.targetImage ||
    question.targetImagePath ||
    question.targetImageUrl ||
    question.image
  );
}

export function isGrammarSentenceFitRuntimeQuestion(question = {}) {
  const format = String(question.formatType || question.templateType || "").toUpperCase();
  const answerOptions = Array.isArray(question.answerOptions) ? question.answerOptions : [];
  return format === "GRAMMAR_SENTENCE_FIT"
    && question.questionType === "ixl_template"
    && hasQuestionImage(question)
    && answerOptions.length === 4;
}
