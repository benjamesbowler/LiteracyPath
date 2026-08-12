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
  "student_book_project_learners",
  "student_book_projects",
  "student_book_reviews",
  "student_book_revisions",
  "student_books",
  "teacher_instructional_group_reviews",
  "teacher_instructional_groups",
  "teacher_intervention_events",
  "teacher_interventions",
  "teacher_lesson_delivery_students",
  "teacher_lesson_plan_deliveries",
  "teacher_lesson_plan_students",
  "teacher_lesson_plans",
  "worksheet_instance_students",
  "worksheet_instances",
  "worksheet_observation_batches",
  "worksheet_observation_marks"
]);

export const EVIDENCE_RPCS = new Set([
  "student_get_live_lesson",
  "student_get_progress",
  "student_list_maths_assignments",
  "student_complete_maths_assignment",
  "student_report_maths_evidence_sync_health",
  "student_report_maths_media_issue",
  "student_list_press_projects",
  "student_log_activity_v2",
  "student_report_activity_sync_health",
  "student_save_progress",
  "student_save_book_revision",
  "student_submit_book_revision",
  "student_read_class_press_library",
  "student_record_maths_evidence",
  "student_submit_live_response",
  "teacher_assign_instructional_group_follow_up",
  "teacher_archive_maths_assignment",
  "teacher_cancel_intervention",
  "teacher_create_insight_intervention",
  "teacher_create_intervention_follow_up",
  "teacher_create_intervention_plan",
  "teacher_create_lesson_plan",
  "teacher_create_maths_assignment",
  "teacher_create_press_project",
  "teacher_create_worksheet_instance",
  "teacher_delete_planned_intervention",
  "teacher_mark_intervention_delivered",
  "teacher_record_insight_observation",
  "teacher_read_lesson_plan",
  "teacher_list_maths_assignments",
  "teacher_read_maths_evidence",
  "teacher_read_maths_evidence_page",
  "teacher_read_maths_sync_health",
  "teacher_list_press_work",
  "teacher_read_worksheet_history",
  "teacher_record_intervention_outcome",
  "teacher_record_lesson_delivery",
  "teacher_record_maths_evidence",
  "teacher_report_maths_media_issue",
  "teacher_record_worksheet_observation",
  "teacher_resolve_worksheet_code",
  "teacher_close_worksheet_instance",
  "teacher_reset_student_progress",
  "teacher_review_instructional_group",
  "teacher_review_book_revision",
  "teacher_review_intervention",
  "teacher_save_instructional_group",
  "teacher_start_live_lesson",
  "teacher_set_live_lesson_slide",
  "teacher_get_live_lesson_snapshot",
  "teacher_get_active_live_lesson",
  "teacher_end_live_lesson",
  "teacher_update_planned_intervention",
  "teacher_update_draft_lesson_plan"
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
