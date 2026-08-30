import { APP_RELEASE_ID } from "../utils/errorLog.js";
import { compactAssessmentAttemptForStorage } from "./assessmentHistoryStore.js";

export const STUDENT_FOCUS_CONTENT_VERSION = APP_RELEASE_ID;

function requireClient(client) {
  if (!client) throw new Error("Student sessions are unavailable while the service is offline.");
  return client;
}

async function callFocusRpc(client, name, args = {}) {
  const { data, error } = await requireClient(client).call(name, args);
  if (error) throw error;
  return data;
}

export function startStudentFocusSession({
  client,
  classId,
  target,
  studentIds = [],
  assignments = {},
  durationMinutes = 90,
  contentVersion = STUDENT_FOCUS_CONTENT_VERSION,
  wholeClass = false
}) {
  return callFocusRpc(client, "teacher_start_student_focus_session", {
    p_class_id: classId,
    p_target: target,
    p_student_ids: studentIds,
    p_assignments: assignments,
    p_duration_minutes: durationMinutes,
    p_content_version: contentVersion,
    p_whole_class: Boolean(wholeClass)
  });
}

export function getTeacherStudentFocusSession({ client, sessionId = null }) {
  return callFocusRpc(client, "teacher_get_student_focus_session", {
    p_session_id: sessionId
  });
}

export function endStudentFocusSession({ client, sessionId }) {
  return callFocusRpc(client, "teacher_end_student_focus_session", {
    p_session_id: sessionId
  });
}

export function getStudentFocusSession({
  client,
  token,
  currentView = "",
  contentOk = true
}) {
  return callFocusRpc(client, "student_get_focus_session", {
    p_token: token,
    p_current_view: currentView || null,
    p_content_ok: contentOk
  });
}

export function markStudentFocusSessionComplete({ client, token, sessionId }) {
  return callFocusRpc(client, "student_complete_focus_session", {
    p_token: token,
    p_session_id: sessionId
  });
}

export function saveStudentFocusAssessmentAnswer({
  client,
  token,
  sessionId,
  answer
}) {
  return callFocusRpc(client, "student_save_focus_assessment_answer", {
    p_token: token,
    p_session_id: sessionId,
    p_answer: answer
  });
}

export function saveStudentFocusItemMastery({ client, token, sessionId, itemMastery }) {
  return callFocusRpc(client, "student_save_focus_item_mastery", {
    p_token: token,
    p_session_id: sessionId,
    p_item_mastery: itemMastery
  });
}

export function saveStudentFocusAssessmentAttempt({
  client,
  token,
  sessionId,
  attempt
}) {
  return callFocusRpc(client, "student_complete_focus_assessment", {
    p_token: token,
    p_session_id: sessionId,
    p_attempt: compactAssessmentAttemptForStorage(attempt)
  });
}
