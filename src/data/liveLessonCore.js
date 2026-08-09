import { APP_RELEASE_ID } from "../utils/errorLog.js";

export const LIVE_LESSON_RELEASE_VERSION = APP_RELEASE_ID;

function requireClient(client) {
  if (!client) throw new Error("Class Quest Live is unavailable while the service is offline.");
  return client;
}

async function call(client, name, args) {
  const { data, error } = await requireClient(client).call(name, args);
  if (error) throw error;
  return data;
}

export function startLiveLesson({ client, classId, studentIds, content }) {
  return call(client, "teacher_start_live_lesson", {
    p_class_id: classId,
    p_student_ids: studentIds,
    p_cycle_id: content.cycleId,
    p_day_key: content.day,
    p_content: content,
    p_content_version: content.contentVersion
  });
}

export function setLiveLessonSlide({ client, sessionId, slideIndex, clientEventId }) {
  return call(client, "teacher_set_live_lesson_slide", {
    p_session_id: sessionId,
    p_slide_index: slideIndex,
    p_client_event_id: clientEventId
  });
}

export function getLiveLessonSnapshot({ client, sessionId }) {
  return call(client, "teacher_get_live_lesson_snapshot", { p_session_id: sessionId });
}

export function getActiveLiveLesson({ client }) {
  return call(client, "teacher_get_active_live_lesson", {});
}

export function endLiveLesson({ client, sessionId }) {
  return call(client, "teacher_end_live_lesson", { p_session_id: sessionId });
}

export function getStudentLiveLesson({ client, token, slideIndex = null, contentOk = true }) {
  return call(client, "student_get_live_lesson", {
    p_token: token,
    p_slide_index: slideIndex,
    p_content_ok: contentOk
  });
}

export function submitLiveLessonResponse({ client, token, sessionId, promptId, response, clientEventId }) {
  return call(client, "student_submit_live_response", {
    p_token: token,
    p_session_id: sessionId,
    p_prompt_id: promptId,
    p_response: response,
    p_client_event_id: clientEventId
  });
}

export function createLiveLessonEventId(prefix = "live") {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
