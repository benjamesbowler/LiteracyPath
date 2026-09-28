import { buildLearningEvidenceProfile } from "./learningEvidenceInsights.js";

// Operational Cycle check evidence stays separate from formal assessment.
export function cyclePracticeEvidenceProfile(result) {
  return buildLearningEvidenceProfile(result?.questionRecords, { source: "cycle_practice" });
}

export function cycleResultSummary(result) {
  if (!result) return "";
  const score = result.scoredQuestions > 0
    ? `${result.correctCount} of ${result.scoredQuestions} independent responses correct (${result.accuracy}%)`
    : "No independent score";
  return `${score}. ${result.totalQuestions} items presented; ${result.supportedCount} supported; ${result.mediaFailedCount} unavailable media.`;
}
export function cycleDurationSummary(result) {
  if (result.practiceSeconds == null) return "Activity time not verified for this older check.";
  return `Active practice ${result.practiceSeconds}s · Check ${result.checkSeconds}s · Session ${result.sessionElapsedSeconds}s. Client-reported activity.`;
}
export function exportCycleSessionResultsCsv(members = [], students = []) {
  const names = new Map(students.map(student => [student.id, student.name]));
  const fields = ["attemptId", "cycleId", "receivedAt", "clientCompletedAt", "status", "totalQuestions", "scoredQuestions", "correctCount", "accuracy", "supportedCount", "mediaFailedCount", "practiceSeconds", "checkSeconds", "sessionElapsedSeconds", "evidenceStatus", "receivedAfterSessionEnd"];
  const rows = [["studentId", "studentName", ...fields, "distinctItems", "distinctTargets", "distinctFormats", "repeatPresentations", "questionCoverage", "teachNext", "claimBoundary"]];
  for (const member of members) {
    const result = member.cycle_practice_result;
    if (result) {
      const profile = cyclePracticeEvidenceProfile(result);
      const recorded = profile.totals.presented > 0;
      rows.push([member.student_id, names.get(member.student_id) || "Student", ...fields.map(field => result[field]),
        ...["distinctItems", "distinctTargets", "distinctFormats", "repeatedPresentations"].map(field => recorded ? profile.totals[field] : ""),
        profile.summary, profile.nextSteps.map(row => `${row.label}: ${row.nextAction}`).join(" | "), profile.claimBoundary]);
    }
  }
  return "\uFEFF" + rows.map(row => row.map(value => {
    const text = String(value ?? "");
    // Teacher-entered names cannot become spreadsheet formulas.
    return `"${(/^[=+@\-\t\r]/.test(text) ? "'" + text : text).replace(/"/g, '""')}"`;
  }).join(",")).join("\n");
}

export function cyclePracticeNextRows(result) {
  const labels = { incorrect: "Try this mapping again", supported: "Practise with support, then try independently",
    media_failed: "Replay the required media before checking", legacy_unverified: "Independent evidence not recorded" };
  const profile = cyclePracticeEvidenceProfile(result);
  return (result?.questionRecords || []).filter(row => labels[row.responseStatus]).map(row => ({
    id: row.questionId,
    target: String(row.itemKey || row.construct || "Practice item").replace(/_/g, " "),
    instruction: profile.targets.find(target => target.label === String(row.itemKey || row.targetWord || "")
      && target.construct === String(row.evidenceConstruct || row.construct || row.itemType || row.skillId || ""))?.nextAction || labels[row.responseStatus],
    construct: String(row.evidenceConstruct || row.construct || "").replace(/_/g, " "),
    selected: row.selected == null ? "No scored response recorded" : `Response: ${typeof row.selected === "string" ? row.selected : JSON.stringify(row.selected)}`
  }));
}
