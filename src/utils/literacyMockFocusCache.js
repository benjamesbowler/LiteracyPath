import { readAssessmentDraft } from "./assessmentDraftStorage.js";

export const MOCK_OUTBOX_SCHEMA = 1;
export const MOCK_OUTBOX_REQUEST_LIMIT = 512;
export const mockOutboxKey = (studentId, sessionId) => `lp-mock-outbox:${studentId}:${sessionId}`;

export function validMockOutbox(value, studentId, sessionId) {
  return value?.schemaVersion === MOCK_OUTBOX_SCHEMA && value.studentId === studentId && value.sessionId === sessionId
    && value.mock && typeof value.mock === 'object'
    && value.run?.studentId === studentId && value.run?.assignmentId === sessionId
    && value.serverRun?.studentId === studentId && value.serverRun?.assignmentId === sessionId
    && value.run.contentVersion === value.serverRun.contentVersion
    && Array.isArray(value.requests) && value.requests.length <= MOCK_OUTBOX_REQUEST_LIMIT
    && Array.isArray(value.run.responses) && Array.isArray(value.serverRun.responses)
    && value.run.plan?.seed === value.serverRun.plan?.seed;
}

export function readMockOutboxRecord(studentId, sessionId, storage) {
  try {
    const serialized = readAssessmentDraft(mockOutboxKey(studentId, sessionId), studentId, storage || globalThis.localStorage);
    const value = JSON.parse(serialized);
    return validMockOutbox(value, studentId, sessionId) ? { value, serialized } : null;
  } catch {
    return null;
  }
}

export function readCachedMockFocus(studentId, storage, now = Date.now()) {
  try {
    const target = storage || globalThis.localStorage;
    const candidates = [];
    const prefix = mockOutboxKey(studentId, "");
    for (let i=0;i<target.length;i++) {
      const key = target.key(i);
      if (!key?.startsWith(prefix)) continue;
      const value = readMockOutboxRecord(studentId, key.slice(prefix.length), target)?.value;
      if (value?.focusSession?.status === 'active' && Date.parse(value.focusSession.expires_at) > now
        && value.mock.state !== 'completed') candidates.push(value);
    }
    return candidates.sort((a,b) => b.lastServerContactAt.localeCompare(a.lastServerContactAt))[0] || null;
  } catch { return null; }
}

