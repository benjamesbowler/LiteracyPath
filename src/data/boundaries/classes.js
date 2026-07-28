import {
  assertOptionalFields,
  assertPlainRecord,
  validateCommonRow,
  validateRows
} from "./schema.js";

export const CLASS_TABLES = new Set([
  "app_admins",
  "classes",
  "pending_teacher_accounts",
  "schools",
  "students",
  "teacher_account_decision_events"
]);

export const CLASS_RPCS = new Set([
  "admin_set_teacher_account_status",
  "student_class_by_code",
  "student_login",
  "teacher_class_access_log",
  "teacher_class_access_summary",
  "teacher_create_demo_class",
  "teacher_delete_empty_class",
  "teacher_regenerate_class_code",
  "teacher_set_class_code_expiry",
  "teacher_set_class_leaderboard_scope",
  "teacher_set_student_archived",
  "teacher_set_student_symbol_password",
  "teacher_transfer_student"
]);

export function validateClassRow(row, label) {
  validateCommonRow(row, label);
  return assertOptionalFields(row, {
    name: "string",
    email: "string",
    status: "string",
    access_code: "string",
    leaderboard_scope: "string",
    symbol_password: ["array", "string"],
    approved: "boolean",
    ok: "boolean",
    account_id: "string",
    teacher_user_id: "string",
    previous_status: "string",
    decision_status: "string",
    reason: "string",
    school_name: "string",
    decided_by: "string",
    decided_at: "string"
  }, label);
}

function validateNamedIdentity(value, label) {
  if (value === null || value === undefined) return value;
  assertOptionalFields(value, {
    id: "string",
    name: "string"
  }, label);
  return value;
}

/**
 * Validate the class-access and student-login payloads that cross the public
 * unauthenticated boundary. These responses are deliberately stricter than
 * general teacher RPC responses because they establish learner identity.
 *
 * @param {string} name
 * @param {unknown} data
 * @returns {unknown}
 */
export function validateClassRpcData(name, data) {
  if (data === null || data === undefined) return data;
  if (name === "student_class_by_code") {
    assertPlainRecord(data, `rpc.${name}`);
    assertOptionalFields(data, {
      ok: "boolean",
      error: "string",
      retry_seconds: "integer",
      class: "object",
      school: "object",
      students: "array"
    }, `rpc.${name}`);
    validateNamedIdentity(data.class, `rpc.${name}.class`);
    validateNamedIdentity(data.school, `rpc.${name}.school`);
    if (data.students) {
      validateRows(data.students, `rpc.${name}.students`, (student, label) => {
        assertOptionalFields(student, {
          id: "string",
          name: "string",
          has_password: "boolean"
        }, label);
      });
    }
    return data;
  }
  if (name === "student_login") {
    assertOptionalFields(data, {
      ok: "boolean",
      error: "string",
      retry_seconds: "integer",
      token: "string",
      student_id: "string",
      student_name: "string",
      class_id: "string",
      teacher_id: "string",
      school_id: "string"
    }, `rpc.${name}`);
    return data;
  }
  return null;
}
