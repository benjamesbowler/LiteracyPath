export function shouldShowGuidedReadingScoreSummary({ mode, studentId } = {}) {
  return mode === "teacher" && Boolean(String(studentId || "").trim());
}
