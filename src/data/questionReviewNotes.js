export function questionReportTypeLabel(flagType = "") {
  return flagType === "question" ? "Question report" : "Image report";
}

export function questionReportDecisionLabel(decision = "") {
  if (decision === "image_needs_checking") return "Image needs checking";
  if (decision === "question_needs_checking") return "Question needs checking";
  if (decision === "no_change_needed") return "No change needed";
  return "Not reviewed";
}

export function buildQuestionReviewNotes(flags = []) {
  const reviewed = flags.filter(flag => flag.decision);
  return [
    "# Reported assessment questions",
    "",
    `Downloaded: ${new Date().toISOString()}`,
    "",
    reviewed.length ? reviewed.map(flag => [
      `## ${flag.questionId || flag.id}`,
      "",
      `- Skill: ${flag.skillName || flag.skillId || "Not recorded"}`,
      `- Report: ${questionReportTypeLabel(flag.flagType)}`,
      `- Prompt: ${flag.prompt || flag.questionText || "Not recorded"}`,
      `- Sentence or context: ${flag.sentence || "Not recorded"}`,
      `- Target: ${flag.targetWord || "Not recorded"}`,
      `- Correct answer: ${flag.correctAnswer || "Not recorded"}`,
      `- Choices: ${(flag.answerChoices || []).map(choice => choice.label || choice.value).filter(Boolean).join(", ") || "None recorded"}`,
      `- Images: ${(flag.images || []).map(image => `${image.label}: ${image.path}`).join(" | ") || "None recorded"}`,
      `- Review decision: ${questionReportDecisionLabel(flag.decision)}`,
      `- Review note: ${flag.decisionNotes || "No note"}`,
      ""
    ].join("\n")).join("\n") : "No review decisions have been recorded yet.",
    ""
  ].join("\n");
}
