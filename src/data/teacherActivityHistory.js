import { sessionActivityLabel } from "../utils/teacherSessionModel.js";
import { isProgressTest } from "../policy/progressTestPolicy.js";

const ASSESSMENT_LABELS = Object.freeze({
  skill_checkpoint: "Skills assessment", el_letter_assessment: "Letters and sounds",
  advanced_phonics_patterns: "Phonics patterns", el_phonological_awareness: "Phonological awareness",
  el_encoding: "Spelling assessment", el_decoding: "Word reading assessment",
  el_oral_reading_fluency: "Oral reading fluency", cycle_practice_check: "Cycle practice",
  "literacy-practice": "Literacy practice", "skills-trail": "Skills practice"
});
const STATES = Object.freeze({
  completed: "Recorded · Complete", partial: "Recorded · Partial", in_progress: "Recorded · In progress",
  discontinued: "Recorded · Stopped early", not_administered: "Recorded · Not administered",
  not_scorable: "Recorded · Not scored", prepared: "Prepared · Not started", running: "Running",
  paused: "Paused", finished: "Finished", expired: "Access ended", cancelled: "Cancelled"
});
const PRACTICE_TYPES = new Set(["cycle_practice_check", "literacy-practice", "skills-trail"]);
const validDate = value => Number.isFinite(new Date(value || "").getTime()) ? value : "";

export function assessmentReportView(record) {
  if (record.assessmentType?.startsWith("el_") || record.assessmentType === "advanced_phonics_patterns") return "el-assessments";
  if (PRACTICE_TYPES.has(record.assessmentType)) return "other-learning";
  return "skills-check";
}

// Discovery only. Keep each original saved object; never recalculate scores,
// combine sources or feed historical rows into a current learning judgement.
export function buildTeacherActivityHistory({ records = [], sessions = [], classId, studentId = "" }) {
  if (!classId) return [];
  const rows = new Map();
  for (const record of records) {
    if (!record.attemptId || record.classId !== classId || (studentId && record.studentId !== studentId)) continue;
    const practice = PRACTICE_TYPES.has(record.assessmentType);
    const progress = isProgressTest(record);
    const row = {
      id: `assessment:${record.attemptId}`, kind: "assessment", classId, studentId: record.studentId,
      studentName: record.studentName || "Student name not recorded", original: record,
      category: practice ? "practice" : "assessment",
      label: progress ? sessionActivityLabel("progress_check", { plan_kind: record.metadata?.planKind || "broad_profile" }) : ASSESSMENT_LABELS[record.assessmentType] || record.skillName || "Saved assessment",
      target: record.skillName || "", date: validDate(record.completedAt) || validDate(record.startedAt),
      state: STATES[record.administrationStatus] || "Recorded · Completion not recorded",
      reportView: assessmentReportView(record)
    };
    const previous = rows.get(row.id);
    if (!previous || new Date(record.updatedAt || row.date).getTime() > new Date(previous.original.updatedAt || previous.date).getTime()) rows.set(row.id, row);
  }
  for (const session of sessions) {
    if (!session.id || session.class_id !== classId || (studentId && !session.member_student_ids?.includes(studentId))) continue;
    rows.set(`mock:${session.id}`, {
      id: `mock:${session.id}`, kind: "mock", category: "mock", classId, studentId,
      sessionId: session.id, original: session, label: "Mixed literacy mock",
      studentName: studentId ? "Selected student" : `${session.member_student_ids?.length ?? "Unconfirmed"} ${session.member_student_ids?.length === 1 ? "student" : "students"}`,
      date: validDate(session.mock?.started_at) || validDate(session.started_at),
      state: session.mock?.snapshot_only ? `Last saved: ${(STATES[session.mock?.state] || "Status not recorded").replace("Recorded · ", "")}` : STATES[session.mock?.state] || "Session status not recorded"
    });
  }
  return [...rows.values()].sort((a, b) => (
    (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0) || a.id.localeCompare(b.id)
  ));
}

export function filterTeacherActivityHistory(rows, { category = "", studentId = "", after = "", before = "" } = {}) {
  return rows.filter(row => {
    if (category && row.category !== category) return false;
    if (studentId && (row.kind === "mock" ? !row.original.member_student_ids?.includes(studentId) : row.studentId !== studentId)) return false;
    // Date inputs describe local calendar days, matching the displayed date.
    if (after || before) {
      if (!row.date) return false;
      const date = new Date(row.date);
      const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      if ((after && day < after) || (before && day > before)) return false;
    }
    return true;
  });
}

export function teacherActivityHref(activity, { reportStudentId = "" } = {}) {
  const params = new URLSearchParams({ class: activity.classId });
  if (activity.kind === "mock") {
    params.set("mockSession", activity.sessionId);
    params.set("mockPhase", "results");
    if (activity.studentId) params.set("mockStudent", activity.studentId);
    return `#teacher/assessments?${params}`;
  }
  // The attempt owns its student identity. It must not change the report's
  // audience: archived learners can have class history without an active roster
  // entry, and forcing their ID into the student chooser would hide that record.
  if (reportStudentId) params.set("learner", reportStudentId);
  params.set("activity", activity.id);
  return `#teacher/reports?${params}`;
}
