import {
  assertOptionalFields,
  validateCommonRow,
  validateVersionedPayload
} from "./schema.js";

export const EVIDENCE_TABLES = new Set([
  "activity_sync_health",
  "answers",
  "assessment_attempts",
  "assessment_sessions",
  "item_mastery",
  "mastery",
  "student_progress",
  "teacher_instructional_group_reviews",
  "teacher_instructional_groups",
  "teacher_intervention_events",
  "teacher_interventions"
]);

export const EVIDENCE_RPCS = new Set([
  "student_get_progress",
  "student_log_activity_v2",
  "student_report_activity_sync_health",
  "student_save_progress",
  "teacher_assign_instructional_group_follow_up",
  "teacher_cancel_intervention",
  "teacher_create_insight_intervention",
  "teacher_create_intervention_follow_up",
  "teacher_create_intervention_plan",
  "teacher_delete_planned_intervention",
  "teacher_mark_intervention_delivered",
  "teacher_record_insight_observation",
  "teacher_record_intervention_outcome",
  "teacher_reset_student_progress",
  "teacher_review_instructional_group",
  "teacher_review_intervention",
  "teacher_save_instructional_group",
  "teacher_update_planned_intervention"
]);

export function validateEvidenceRow(row, label, resource) {
  if (["assessment_attempts", "student_progress"].includes(resource)) {
    validateVersionedPayload(row, label);
  } else {
    validateCommonRow(row, label);
  }
  return assertOptionalFields(row, {
    is_correct: "boolean",
    mastered: "boolean",
    attempts: "number",
    correct: "number",
    version: "number",
    payload: "object",
    criteria: "object",
    evidence_snapshot: "object",
    detail: "object",
    occurred_at: "string"
  }, label);
}
