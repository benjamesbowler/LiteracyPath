import {
  assertOptionalFields,
  assertPlainRecord,
  DomainBoundaryError,
  validateCommonRow,
  validateRows
} from "./schema.js";

export const CLASS_TABLES = new Set([
  "app_admins",
  "classes",
  "pending_teacher_accounts",
  "reading_sessions",
  "schools",
  "students",
  "teacher_account_decision_events"
]);

export const CLASS_RPCS = new Set([
  "admin_set_teacher_account_status",
  "student_class_by_code",
  "student_complete_focus_assessment",
  "student_complete_focus_cycle_practice",
  "student_complete_focus_session",
  "student_get_focus_session",
  "student_get_reading_session",
  "student_login",
  "student_save_focus_assessment_answer",
  "student_save_focus_item_mastery",
  "teacher_class_access_log",
  "teacher_class_access_summary",
  "teacher_create_demo_class",
  "teacher_delete_empty_class",
  "teacher_end_reading_session",
  "teacher_end_student_focus_session",
  "teacher_get_reading_session_presence",
  "teacher_get_student_focus_session",
  "teacher_regenerate_class_code",
  "teacher_set_class_code_expiry",
  "teacher_set_class_leaderboard_scope",
  "teacher_set_reading_session_page",
  "teacher_set_student_archived",
  "teacher_set_student_symbol_password",
  "teacher_save_reading_marks",
  "teacher_start_cycle_practice_session",
  "teacher_start_reading_session",
  "teacher_start_student_focus_session",
  "teacher_transfer_student"
]);

const READING_SESSION_RPCS = new Set([
  "student_get_reading_session",
  "teacher_end_reading_session",
  "teacher_get_reading_session_presence",
  "teacher_save_reading_marks",
  "teacher_set_reading_session_page",
  "teacher_start_reading_session"
]);

const STUDENT_FOCUS_RPCS = new Set([
  "student_complete_focus_assessment",
  "student_complete_focus_cycle_practice",
  "student_complete_focus_session",
  "student_get_focus_session",
  "student_save_focus_assessment_answer",
  "student_save_focus_item_mastery",
  "teacher_end_student_focus_session",
  "teacher_get_student_focus_session",
  "teacher_start_cycle_practice_session",
  "teacher_start_student_focus_session"
]);

function validateReadingSession(value, label) {
  if (value === null || value === undefined) return value;
  assertPlainRecord(value, label);
  assertOptionalFields(value, {
    id: "string",
    class_id: "string",
    book_id: "string",
    page_numbers: "array",
    page_index: "integer",
    student_ids: "array",
    content_version: "string",
    status: "string",
    started_at: "string",
    updated_at: "string"
  }, label);
  if (value.page_numbers && !value.page_numbers.every(Number.isInteger)) {
    throw new DomainBoundaryError(`${label}.page_numbers must contain only integers.`);
  }
  if (value.student_ids && !value.student_ids.every(id => typeof id === "string")) {
    throw new DomainBoundaryError(`${label}.student_ids must contain only strings.`);
  }
  return value;
}

function validateReadingPresence(value, label) {
  assertPlainRecord(value, label);
  return assertOptionalFields(value, {
    student_id: "string",
    page_index: "integer",
    content_ok: "boolean",
    last_seen_at: "string",
    connected: "boolean"
  }, label);
}

function validateStudentFocusSession(value, label) {
  if (value === null || value === undefined) return value;
  assertPlainRecord(value, label);
  assertOptionalFields(value, {
    id: "string",
    teacher_id: "string",
    class_id: "string",
    target: "string",
    content_version: "string",
    status: "string",
    started_at: "string",
    expires_at: "string",
    updated_at: "string",
    resolved_config: "object",
    member_status: "string",
    content_ok: "boolean",
    prior_attempts: "array",
    members: "array"
  }, label);
  if (value.prior_attempts) {
    validateRows(value.prior_attempts, `${label}.prior_attempts`, (attempt, attemptLabel) => {
      assertPlainRecord(attempt, attemptLabel);
      return attempt;
    });
  }
  if (value.members) validateRows(value.members, `${label}.members`, validateStudentFocusMember);
  return value;
}

function validateStudentFocusMember(value, label) {
  assertPlainRecord(value, label);
  return assertOptionalFields(value, {
    student_id: "string",
    status: "string",
    current_view: "string",
    content_ok: "boolean",
    last_seen_at: "string",
    completed_at: "string",
    connected: "boolean",
    resolved_config: "object"
  }, label);
}

export function validateClassRow(row, label) {
  validateCommonRow(row, label);
  assertOptionalFields(row, {
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
    target: "string",
    content_version: "string",
    decided_by: "string",
    decided_at: "string"
  }, label);
  if (row.page_numbers !== undefined) validateReadingSession(row, label);
  return row;
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
  if (STUDENT_FOCUS_RPCS.has(name)) {
    assertPlainRecord(data, `rpc.${name}`);
    assertOptionalFields(data, {
      ok: "boolean",
      error: "string",
      student_id: "string",
      session: "object",
      members: "array",
      status: "string",
      updated_at: "string",
      completed_at: "string",
      ended_at: "string",
      attempt_id: "string",
      duplicate: "boolean"
    }, `rpc.${name}`);
    validateStudentFocusSession(data.session, `rpc.${name}.session`);
    if (data.members) validateRows(data.members, `rpc.${name}.members`, validateStudentFocusMember);
    return data;
  }
  if (READING_SESSION_RPCS.has(name)) {
    assertPlainRecord(data, `rpc.${name}`);
    assertOptionalFields(data, {
      ok: "boolean",
      error: "string",
      student_id: "string",
      teacher_name: "string",
      session: "object",
      presence: "array",
      page_index: "integer",
      updated_at: "string",
      ended_at: "string",
      status: "string",
      duplicate: "boolean"
    }, `rpc.${name}`);
    validateReadingSession(data.session, `rpc.${name}.session`);
    if (data.presence) {
      validateRows(data.presence, `rpc.${name}.presence`, validateReadingPresence);
    }
    return data;
  }
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
