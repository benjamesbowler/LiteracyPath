import { APPROVED_FOUNDATION_SKILL_IDS, mathsSkillById } from "../curriculum/mathsSkillTree.js";

const DAY = 86_400_000;

function evidenceOutcome(event) {
  const evidence = event?.evidence || {};
  if (typeof evidence.correct === "boolean") return evidence.correct;
  if (["demonstrated", "independent", "correct"].includes(evidence.outcome)) return true;
  if (["not_yet", "incorrect"].includes(evidence.outcome)) return false;
  return null;
}
export function mathsSkillReport(events = [], skillId, { now = new Date() } = {}) {
  const relevant = events.filter(event => event.skillId === skillId);
  const scored = relevant.map(evidenceOutcome).filter(value => value !== null);
  const correct = scored.filter(Boolean).length;
  const representations = new Set(relevant.map(event => event.evidence?.representation || event.evidence?.manipulativeId).filter(Boolean));
  const sources = new Set(relevant.map(event => event.evidence?.source || event.eventType).filter(Boolean));
  const newest = relevant.reduce((latest, event) => Math.max(latest, new Date(event.occurredAt || 0).getTime() || 0), 0);
  const ageDays = newest ? Math.floor((now.getTime() - newest) / DAY) : null;
  const possiblePatterns = [...new Set(relevant.flatMap(event => event.evidence?.misconceptionCodes || []))];
  let status = "Not checked";
  if (scored.length) {
    const accuracy = correct / scored.length;
    if (scored.length >= 4 && representations.size >= 2 && accuracy >= 0.8) status = "Consolidating";
    else if (accuracy >= 0.6) status = "Developing";
    else status = "Emerging";
  } else if (relevant.length) status = "Observed";
  return Object.freeze({
    skillId,
    label: mathsSkillById[skillId]?.childLabel || skillId,
    status,
    eventCount: relevant.length,
    scoredCount: scored.length,
    correctCount: correct,
    sources: [...sources],
    representations: [...representations],
    newestAt: newest ? new Date(newest).toISOString() : null,
    freshness: ageDays === null ? "No evidence" : ageDays === 0 ? "Today" : ageDays === 1 ? "Yesterday" : `${ageDays} days ago`,
    possiblePatterns,
    nextAction: mathsSkillById[skillId]?.nextActions?.[possiblePatterns.length ? 0 : Math.min(1, mathsSkillById[skillId]?.nextActions?.length - 1)] || "Gather a fresh observation in another representation.",
    secureEnabled: false,
    evidenceNote: relevant.length ? `${relevant.length} formative event${relevant.length === 1 ? "" : "s"}; ${representations.size || 0} representation${representations.size === 1 ? "" : "s"}.` : "No Maths evidence has been collected for this skill."
  });
}

export function buildMathsLearnerReport(events = [], studentId) {
  const learnerEvents = events.filter(event => !studentId || event.studentId === studentId);
  return Object.freeze(APPROVED_FOUNDATION_SKILL_IDS.map(skillId => mathsSkillReport(learnerEvents, skillId)));
}

export function buildMathsClassGroups(events = [], students = []) {
  const rows = students.map(student => {
    const reports = buildMathsLearnerReport(events, student.id);
    const priority = reports.find(report => ["Emerging", "Developing"].includes(report.status)) || reports.find(report => report.status === "Not checked") || reports[0];
    return { student, priority };
  });
  return Object.freeze({
    reconnect: rows.filter(row => ["Emerging", "Not checked"].includes(row.priority.status)),
    build: rows.filter(row => row.priority.status === "Developing"),
    extend: rows.filter(row => ["Observed", "Consolidating"].includes(row.priority.status))
  });
}
