import { assertOptionalFields, validateVersionedPayload } from "./schema.js";

export const REPORT_TABLES = new Set(["el_assessment_reports"]);

export const REPORT_RPCS = new Set([
  "teacher_delete_learner_data",
  "teacher_export_learner_data",
  "teacher_list_learner_data_rights",
  "teacher_prepare_learner_deletion"
]);

export function validateReportRow(row, label) {
  validateVersionedPayload(row, label);
  return assertOptionalFields(row, {
    report_type: "string",
    filename: "string",
    summary: "object"
  }, label);
}
