/** Token-scoped mock evidence uses its own RPC store, never practice/mastery. */
export const LITERACY_MOCK_CONTENT_VERSION = "literacy-mock-v1";

async function callMockRpc(client, name, args, signal) {
  if (!client) throw new Error("Mock sessions are unavailable while the service is offline.");
  let request = client.call(name, args);
  if (signal && typeof request?.abortSignal === "function") request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;
  return data;
}

export function prepareLiteracyMockSession({ client, classId, studentIds = [], wholeClass = false, durationMinutes = 20, itemCount = 43, requestId = null }) {
  return callMockRpc(client, "teacher_prepare_literacy_mock_session", {
    p_class_id: classId, p_student_ids: studentIds, p_whole_class: Boolean(wholeClass),
    p_duration_minutes: durationMinutes, p_item_count: itemCount, p_request_id: requestId
  });
}

export function controlLiteracyMockSession({ client, sessionId, action, expectedRevision, requestId }) {
  return callMockRpc(client, "teacher_control_literacy_mock_session", {
    p_session_id: sessionId, p_action: action, p_expected_revision: expectedRevision, p_request_id: requestId
  });
}

export function listLiteracyMockSessions({ client, classId, limit = 20, signal }) {
  return callMockRpc(client, "teacher_list_literacy_mock_sessions", { p_class_id: classId, p_limit: limit }, signal);
}

export function getLiteracyMockReport({ client, sessionId, signal }) {
  return callMockRpc(client, "teacher_get_literacy_mock_report", { p_session_id: sessionId }, signal);
}

export function getStudentLiteracyMockRun({ client, token, sessionId, signal }) {
  return callMockRpc(client, "student_get_literacy_mock_run", { p_token: token, p_session_id: sessionId }, signal);
}

// Reuse the same requestId and exact mutation after an uncertain network result.
// A new answer must wait for the server receipt and use its returned revision.
export function saveStudentLiteracyMockRun({ client, token, sessionId, requestId, expectedRevision, plan = null, response = null }) {
  return callMockRpc(client, "student_save_literacy_mock_run", {
    p_token: token, p_session_id: sessionId, p_request_id: requestId,
    p_expected_revision: expectedRevision, p_plan: plan, p_response: response
  });
}
