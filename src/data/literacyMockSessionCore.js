/** Token-scoped mock evidence uses its own RPC store, never practice/mastery. */
// The server chooses a fully published version; existing sessions keep theirs.
import { LITERACY_MOCK_VERSION, LITERACY_MOCK_VERSIONS } from '../policy/literacyMockVersions.js';
export const LITERACY_MOCK_CONTENT_VERSION = LITERACY_MOCK_VERSION;
export const LITERACY_MOCK_SUPPORTED_VERSIONS = LITERACY_MOCK_VERSIONS;

async function callMockRpc(client, name, args, signal) {
  if (!client) throw new Error("Mock sessions are unavailable while the service is offline.");
  let request = client.call(name, args);
  if (signal && typeof request?.abortSignal === "function") request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;
  return data;
}

export function prepareLiteracyMockSession({ client, classId, studentIds = [], wholeClass = false, durationMinutes = 20, itemCount = 43, requestId = null, windowMode = "pause_at_window_end", contentVersion, legacyPending = false }) {
  const version = contentVersion || (legacyPending ? 'literacy-mock-v3' : LITERACY_MOCK_CONTENT_VERSION);
  if (!['literacy-mock-v3', 'literacy-mock-v4', 'literacy-mock-v5', 'literacy-mock-v6', 'literacy-mock-v7'].includes(version)) throw new Error('Unsupported mock preparation version.');
  return callMockRpc(client, `teacher_prepare_literacy_mock_session_${version.slice(-2)}`, {
    p_class_id: classId, p_student_ids: studentIds, p_whole_class: Boolean(wholeClass),
    p_duration_minutes: durationMinutes, p_item_count: itemCount, p_request_id: requestId, p_window_mode: windowMode
  });
}

/** An incomplete envelope is uncertain, not an explicit server rejection. */
export function requireLiteracyMockSuccess(result) {
  if (result?.ok !== true) throw Object.assign(new Error(result?.error || 'invalid_result'), {
    code: result?.error || 'invalid_result', confirmedRejection: result?.ok === false,
  });
  return result;
}

const immutableAnswer = value => ({ questionId: value.questionId, responseStatus: value.responseStatus, selected: value.selected ?? null });
export function literacyMockMutationReceiptContext(run, contentVersion) {
  return { contentVersion, runRevision: run?.revision || 0, eventRevision: run?.eventRevision || 0,
    responsePrefix: (run?.responses || []).map(immutableAnswer) };
}

/** Verify the requested mutation before discarding its durable retry. */
export function verifyLiteracyMockMutationReceipt(result, request, { sessionId, studentId, contentVersion } = {}) {
  requireLiteracyMockSuccess(result);
  const run = result.run;
  const context = request.receiptContext;
  const invalid = () => { throw Object.assign(new Error('The saved mutation receipt could not be verified.'), { code: 'invalid_receipt' }); };
  if (!run || run.assignmentId !== sessionId || run.studentId !== studentId
    || run.contentVersion !== (context?.contentVersion || contentVersion)
    || !Number.isInteger(run.revision) || !Array.isArray(run.responses)
    || !run.plan || !Array.isArray(run.plan.itemIds) || typeof run.plan.seed !== 'string') invalid();
  const prefix = context?.responsePrefix || [];
  if (run.revision < (context?.runRevision || 0) || run.responses.length < prefix.length
    || prefix.some((answer, index) => JSON.stringify(immutableAnswer(run.responses[index])) !== JSON.stringify(answer))) invalid();
  if (request.type === 'event') {
    if (!['presented', 'help_requested', 'help_cancelled'].includes(request.event)
      || !Number.isInteger(run.eventRevision) || run.eventRevision < (context?.eventRevision || 0)
      || (context && run.eventRevision === context.eventRevision && result.duplicate !== true)) invalid();
    if (request.event === 'presented') {
      if (!run.presentations?.some(value => value.questionId === request.questionId)) invalid();
    } else {
      const help = run.helpRequests?.find(value => value.questionId === request.questionId);
      if (!help || (request.event === 'help_requested' && help.helpRequested !== true)
        || (request.event === 'help_cancelled' && help.helpCancelled !== true && result.duplicate !== true)) invalid();
    }
    return result;
  }
  if (!Number.isInteger(request.expectedRevision) || run.revision < request.expectedRevision || (!request.plan && !request.response)) invalid();
  if (request.plan) {
    if (run.plan.seed !== request.plan.seed) invalid();
    const laterRecovery = result.duplicate === true && run.revision > request.expectedRevision + 1;
    if (!laterRecovery && JSON.stringify(run.plan.itemIds) !== JSON.stringify(request.plan.itemIds)) invalid();
  }
  if (request.response) {
    if (run.revision <= request.expectedRevision) invalid();
    const failure = request.response.responseStatus === 'media_failed';
    const records = failure ? run.mediaFailures : run.responses;
    const saved = records?.find(value => value.questionId === request.response.questionId);
    if (!saved || JSON.stringify(immutableAnswer(saved)) !== JSON.stringify(immutableAnswer(request.response))) invalid();
    if (!failure && context && immutableAnswer(run.responses[prefix.length] || {}).questionId !== request.response.questionId) invalid();
    if (failure && request.response.failedMediaPaths?.some(path => !saved.failedMediaPaths?.some(value => value.split('#')[0] === path.split('#')[0]))) invalid();
  }
  return result;
}

export function recordLiteracyMockEvent({ client, token, sessionId, questionId, event, requestId }) {
  return callMockRpc(client, "student_record_literacy_mock_event", {
    p_token: token, p_session_id: sessionId, p_question_id: questionId, p_event: event, p_request_id: requestId
  });
}

export function resolveLiteracyMockSupport({ client, sessionId, studentId, questionId, assistance, requestId }) {
  return callMockRpc(client, "teacher_resolve_literacy_mock_support", {
    p_session_id: sessionId, p_student_id: studentId, p_question_id: questionId, p_assistance: assistance, p_request_id: requestId
  });
}

export function prepareLiteracyMockFreshCheck({ client, sourceSessionId, studentId, questionId, requestId }) {
  return callMockRpc(client, "teacher_prepare_literacy_mock_fresh_check", {
    p_source_session_id: sourceSessionId, p_student_id: studentId, p_question_id: questionId, p_request_id: requestId
  });
}

export function prepareLiteracyMockEntryCheck({ client, sourceSessionId, studentId, skillId, requestId }) {
  return callMockRpc(client, "teacher_prepare_literacy_mock_entry_check", {
    p_source_session_id: sourceSessionId, p_student_id: studentId, p_skill_id: skillId, p_request_id: requestId
  });
}

export function getLiteracyMockFreshCapacity({ client, sourceSessionId, studentId, questionId = null, skillId = null, signal }) {
  return callMockRpc(client, "teacher_get_literacy_mock_fresh_capacity", {
    p_source_session_id: sourceSessionId, p_student_id: studentId, p_question_id: questionId, p_skill_id: skillId
  }, signal);
}

export function controlLiteracyMockSession({ client, sessionId, action, expectedRevision, requestId }) {
  return callMockRpc(client, "teacher_control_literacy_mock_session", {
    p_session_id: sessionId, p_action: action, p_expected_revision: expectedRevision, p_request_id: requestId
  });
}

export function syncStudentLiteracyMockBatch({ client, token, sessionId, batchId, leaseId = null, requests = [], collectionId = null, signal }) {
  return callMockRpc(client, 'student_sync_literacy_mock_batch', {
    p_token:token, p_session_id:sessionId, p_batch_id:batchId, p_lease_id:leaseId,
    p_requests:requests, p_collection_id:collectionId,
  }, signal);
}

export function listLiteracyMockSessions({ client, classId, limit = 20, signal }) {
  return callMockRpc(client, "teacher_list_literacy_mock_sessions", { p_class_id: classId, p_limit: limit }, signal);
}

export async function listLiteracyMockHistoryPage({ client, classId, studentId = null, cursor = null, limit = 20, signal }) {
  const result = requireLiteracyMockSuccess(await callMockRpc(client, "teacher_list_literacy_mock_history_page", {
    p_class_id: classId, p_student_id: studentId || null, p_before_at: cursor?.startedAt || null,
    p_before_id: cursor?.id || null, p_limit: limit
  }, signal));
  if (!Array.isArray(result.sessions) || typeof result.hasMore !== "boolean"
    || result.sessions.some(session => !session.id || session.class_id !== classId
      || !Array.isArray(session.member_student_ids)
      || (studentId && !session.member_student_ids.includes(studentId)))
    || (result.hasMore && (!result.nextCursor?.id || !Number.isFinite(Date.parse(result.nextCursor.startedAt))))) {
    throw new Error("Session history could not be verified. Try again.");
  }
  return { sessions: result.sessions, hasMore: result.hasMore, nextCursor: result.nextCursor || null };
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
