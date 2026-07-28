import { assertOptionalFields, validateVersionedPayload } from "./schema.js";

export const REPORT_TABLES = new Set([
  "assessment_question_reports",
  "el_assessment_reports"
]);

export const REPORT_RPCS = new Set([
  "admin_review_assessment_question_report",
  "report_assessment_question",
  "teacher_complete_learner_deletion",
  "teacher_delete_learner_data_staged",
  "teacher_delete_saved_assessment_report",
  "teacher_export_learner_data",
  "teacher_get_learner_deletion_status",
  "teacher_list_learner_data_rights",
  "teacher_prepare_learner_deletion"
]);

export function validateReportRow(row, label) {
  validateVersionedPayload(row, label);
  return assertOptionalFields(row, {
    answer_choices: "array",
    correct_answer: "string",
    decision: "string",
    decision_notes: "string",
    flag_type: "string",
    images: "array",
    prompt: "string",
    question_id: "string",
    question_snapshot: "object",
    question_text: "string",
    report_id: "string",
    report_status: "string",
    report_type: "string",
    reported_at: "string",
    reporter_kind: "string",
    reviewed_at: "string",
    reviewed_by: "string",
    sentence: "string",
    skill_id: "string",
    skill_name: "string",
    status: "string",
    target_word: "string",
    filename: "string",
    summary: "object"
  }, label);
}
