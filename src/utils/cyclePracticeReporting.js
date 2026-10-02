import { learningResponseEpisodes } from "./learningResponseState.js";
import { learningModelLabel } from "./learningResponseAdapters.js";
import { buildLearningEvidenceProfile } from "./learningEvidenceInsights.js";
import { cyclePracticeDisplayTitle } from "./cycleTitles.js";

export function memberCyclePracticeTitle(member) {
  const config = member?.resolved_config || {};
  return config.cycle_id || config.cycle_number
    ? cyclePracticeDisplayTitle({ cycleNumber: config.cycle_number || Number(config.cycle_id?.replace("cycle-", "")) }, config.cycle_title || `Cycle ${config.cycle_number || Number(config.cycle_id?.replace("cycle-", ""))}`)
    : "Cycle not recorded";
}

export function sessionCyclePracticeTitle(members = []) {
  if (!members.length) return "Assignments loading";
  const keys = members.map(member => member?.resolved_config?.cycle_id || (member?.resolved_config?.cycle_number ? `cycle-${member.resolved_config.cycle_number}` : ""));
  return keys.every(key => key && key === keys[0])
    ? memberCyclePracticeTitle(members[0])
    : "Individual cycles";
}

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
  if (result.practiceSeconds == null) return "Activity time not verified for this older assessment.";
  return `Active practice ${humanActivityDuration(result.practiceSeconds)} · Assessment ${humanActivityDuration(result.checkSeconds)} · Session ${humanActivityDuration(result.sessionElapsedSeconds)}. Client-reported activity.`;
}
export function exportCycleSessionResultsCsv(members = [], students = []) {
  const names = new Map(students.map(student => [student.id, student.name]));
  const fields = ["attemptId", "cycleId", "receivedAt", "clientCompletedAt", "status", "totalQuestions", "scoredQuestions", "correctCount", "accuracy", "supportedCount", "mediaFailedCount", "practiceSeconds", "checkSeconds", "sessionElapsedSeconds", "evidenceStatus", "receivedAfterSessionEnd"];
  const rows = [["studentId", "studentName", ...fields, "distinctItems", "distinctTargets", "distinctFormats", "repeatPresentations", "questionCoverage", "teachNext", "claimBoundary", "practiceEpisodeId", "presentationRole", "responseId", "selected", "expected", "observedMatch", "evidenceUse", "responseStatus", "responseTimeMs"]];
  for (const member of members) {
    const result = member.cycle_practice_result;
    if (result) {
      const profile = cyclePracticeEvidenceProfile(result);
      const recorded = profile.totals.presented > 0;
      rows.push([member.student_id, names.get(member.student_id) || "Student", ...fields.map(field => result[field]),
        ...["distinctItems", "distinctTargets", "distinctFormats", "repeatedPresentations"].map(field => recorded ? profile.totals[field] : ""),
        profile.summary, profile.nextSteps.map(row => `${row.label}: ${row.nextAction}`).join(" | "), profile.claimBoundary]);
      for (const detail of cycleLearningResponseRows(result)) rows.push([member.student_id,names.get(member.student_id)||"Student",
        ...fields.map(field => field === "attemptId" ? result.attemptId : ""), "", "", "", "", "", "", detail.claimBoundary,
        detail.episodeId,detail.role,detail.id,detail.selected,detail.expected,detail.observedCorrect ?? "",detail.evidenceUse,detail.responseStatus,detail.responseTimeMs ?? ""]);
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
    media_failed: "Replay the required media before assessing", legacy_unverified: "Independent results not recorded" };
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

export function humanActivityDuration(seconds) {
  if (seconds == null || !Number.isFinite(Number(seconds)) || Number(seconds) < 0) return "Not recorded";
  const whole = Math.floor(Number(seconds));
  const minutes = Math.floor(whole / 60);
  return minutes ? `${minutes} min${whole % 60 ? ` ${whole % 60} sec` : ""}` : `${whole} sec`;
}
export function studentSessionOperationalState(member) {
  if (member.content_ok === false) return "Content unavailable";
  if (Number(member.cycle_practice_result?.mediaFailedCount) > 0) return "Media unavailable";
  if (member.status === "completed") return "Finished";
  if (!member.connected) return "Waiting for connection";
  if (member.status === "needs_attention") return "Assessment incomplete";
  return "Working";
}


// Saved client practice snapshots are descriptive, separate from Cycle Check scores.
export function cycleLearningResponseRows(result) {
  if (result?.learningResponsePolicyVersion !== "learning-response-v1") return [];
  const episodes = learningResponseEpisodes(result.learningResponses);
  return episodes.flatMap(episode => [
    ...episode.responses.map(response => ({ episodeId: episode.id,id:response.id,role:response.presentationRole,
      selected:learningModelLabel(response.selected,response.question),expected:learningModelLabel(response.expected,response.question),
      observedCorrect:response.observedCorrect,evidenceUse:response.evidenceUse,responseStatus:response.responseStatus,responseTimeMs:response.responseTimeMs,
      label:response.presentationRole === "transfer" ? "Fresh practice after teaching" : "Original first response",
      claimBoundary: "Client-reported practice; original first response unchanged; no formal score or mastery claim" })),
    ...episode.guidedActions.map(action => ({ episodeId:episode.id,id:action.id,role:"guided",
      selected:learningModelLabel(action.selected,action.question),expected:learningModelLabel(action.expected,action.question),
      observedCorrect:null,evidenceUse:"supported_practice",responseStatus:"supported",responseTimeMs:null,label:"Modeled action",
      claimBoundary:"Worked learning action; excluded from independent accuracy and mastery" }))
  ]);
}
