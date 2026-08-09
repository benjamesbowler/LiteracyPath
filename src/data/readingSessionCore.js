import { APP_RELEASE_ID } from "../utils/errorLog.js";

export const READING_SESSION_CONTENT_VERSION = APP_RELEASE_ID;

function requireClient(client) {
  if (!client) throw new Error("Shared reading is unavailable while the service is offline.");
  return client;
}

async function callReadingRpc(client, name, args) {
  const { data, error } = await requireClient(client).call(name, args);
  if (error) throw error;
  return data;
}

export function startReadingSession({
  client,
  classId,
  bookId,
  pageNumbers,
  studentIds,
  contentVersion = READING_SESSION_CONTENT_VERSION
}) {
  return callReadingRpc(client, "teacher_start_reading_session", {
    p_class_id: classId,
    p_book_id: bookId,
    p_page_numbers: pageNumbers,
    p_student_ids: studentIds,
    p_content_version: contentVersion
  });
}

export function setReadingSessionPage({ client, sessionId, pageIndex }) {
  return callReadingRpc(client, "teacher_set_reading_session_page", {
    p_session_id: sessionId,
    p_page_index: pageIndex
  });
}

export function endReadingSession({ client, sessionId }) {
  return callReadingRpc(client, "teacher_end_reading_session", {
    p_session_id: sessionId
  });
}

export function getReadingSessionPresence({ client, sessionId }) {
  return callReadingRpc(client, "teacher_get_reading_session_presence", {
    p_session_id: sessionId
  });
}

export function saveReadingMarks({
  client,
  sessionId,
  studentId,
  pageIndex,
  marks,
  clientEventId
}) {
  return callReadingRpc(client, "teacher_save_reading_marks", {
    p_session_id: sessionId,
    p_student_id: studentId,
    p_page_index: pageIndex,
    p_marks: marks,
    p_client_event_id: clientEventId
  });
}

export function getStudentReadingSession({
  client,
  token,
  pageIndex = null,
  contentOk = true
}) {
  return callReadingRpc(client, "student_get_reading_session", {
    p_token: token,
    p_page_index: pageIndex,
    p_content_ok: contentOk
  });
}
