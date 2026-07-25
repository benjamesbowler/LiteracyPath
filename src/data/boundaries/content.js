import { assertOptionalFields, validateCommonRow } from "./schema.js";

export const CONTENT_TABLES = new Set(["app_config", "worksheet_bank"]);

export const CONTENT_RPCS = new Set([
  "admin_error_monitor_summary",
  "admin_get_school_retention_policy",
  "admin_list_deletion_propagation",
  "admin_preview_school_retention",
  "admin_recent_error_events",
  "admin_run_school_retention",
  "admin_save_school_retention_policy",
  "admin_verify_deletion_propagation",
  "get_game_leaderboard",
  "report_app_error",
  "set_app_config"
]);

export function validateContentRow(row, label) {
  validateCommonRow(row, label);
  return assertOptionalFields(row, {
    key: "string",
    name: "string",
    title: "string",
    value: ["string", "number", "boolean", "object", "array"],
    payload: "object"
  }, label);
}
