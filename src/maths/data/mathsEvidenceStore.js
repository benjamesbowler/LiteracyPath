export const MATHS_EVIDENCE_QUEUE_PREFIX = "lp-maths-evidence-queue:v1:";
export const MATHS_EVIDENCE_SCHEMA_VERSION = 1;
export const MATHS_CURRENT_LESSON_STORAGE_PREFIX = "lp-maths-lesson:v2:";
export const MATHS_LESSON_STORAGE_NAMESPACE = "lp-maths-lesson:";

export const MATHS_EVIDENCE_EVENT_TYPES = Object.freeze([
  "lesson_exit_observation",
  "practice_attempt",
  "skills_check_response",
  "teacher_observation"
]);
export const STUDENT_MATHS_EVIDENCE_EVENT_TYPES = Object.freeze([
  "practice_attempt",
  "skills_check_response"
]);

const MAX_QUEUE_ENTRIES = 500;
const MAX_RECORDED_ATTEMPTS = 1000;
const activeFlushes = new Map();

function normalizeId(value) {
  return String(value || "").trim();
}

function storageTarget(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

function listStorageKeys(storage) {
  const keys = [];
  if (!storage) return keys;
  try {
    for (let index = 0; index < Number(storage.length || 0); index += 1) {
      const key = storage.key(index);
      if (key) keys.push(key);
    }
  } catch {
    return [];
  }
  return keys;
}

export function mathsLessonStorageKey(studentId, skillId) {
  return `${MATHS_CURRENT_LESSON_STORAGE_PREFIX}${normalizeId(studentId)}:${normalizeId(skillId)}`;
}

function isMathsLessonStorageKeyForStudent(key, studentId) {
  const value = String(key || "");
  const scopedStudentId = normalizeId(studentId);
  if (!value.startsWith(MATHS_LESSON_STORAGE_NAMESPACE) || !scopedStudentId) return false;
  const versionAndScope = value.slice(MATHS_LESSON_STORAGE_NAMESPACE.length);
  const separator = versionAndScope.indexOf(":");
  if (separator < 0 || !/^v\d+$/.test(versionAndScope.slice(0, separator))) return false;
  return versionAndScope.slice(separator + 1).startsWith(`${scopedStudentId}:`);
}

function safeParse(value) {
  try {
    return JSON.parse(value || "null");
  } catch {
    return null;
  }
}

function createClientEventId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `maths-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function queueKey(entry) {
  return `${MATHS_EVIDENCE_QUEUE_PREFIX}${encodeURIComponent(entry.audience)}:`
    + `${encodeURIComponent(entry.scopeId)}:${encodeURIComponent(entry.studentId)}:`
    + encodeURIComponent(entry.clientEventId);
}

function queueScope(audience, scopeId) {
  return `${normalizeId(audience)}:${normalizeId(scopeId)}`;
}

function assertPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }
}

function normalizeEvidenceInput({
  clientEventId = "",
  skillId,
  eventType,
  evidence,
  occurredAt = new Date().toISOString(),
  contentVersion
} = {}) {
  const eventId = normalizeId(clientEventId) || createClientEventId();
  const skill = normalizeId(skillId);
  const type = normalizeId(eventType);
  const version = normalizeId(contentVersion);
  const timestamp = new Date(occurredAt);
  assertPlainObject(evidence, "Maths evidence");

  if (!eventId || eventId.length > 120) {
    throw new TypeError("A Maths evidence event id must contain 1–120 characters.");
  }
  if (!skill || skill.length > 80) {
    throw new TypeError("A Maths skill id must contain 1–80 characters.");
  }
  if (!MATHS_EVIDENCE_EVENT_TYPES.includes(type)) {
    throw new TypeError(`Unknown Maths evidence event type: ${type || "empty"}.`);
  }
  if (!version || version.length > 120) {
    throw new TypeError("A Maths content version must contain 1–120 characters.");
  }
  if (!Number.isFinite(timestamp.getTime())) {
    throw new TypeError("Maths evidence needs a valid occurrence time.");
  }
  if (evidence.schemaVersion !== MATHS_EVIDENCE_SCHEMA_VERSION) {
    throw new TypeError("Maths evidence must use schemaVersion 1.");
  }
  if (new TextEncoder().encode(JSON.stringify(evidence)).byteLength > 8192) {
    throw new TypeError("Maths evidence is larger than the 8 KB limit.");
  }

  return Object.freeze({
    clientEventId: eventId,
    skillId: skill,
    eventType: type,
    evidence: Object.freeze({ ...evidence }),
    occurredAt: timestamp.toISOString(),
    contentVersion: version
  });
}

function readAllQueueRecords(storage) {
  return listStorageKeys(storage)
    .filter(key => key.startsWith(MATHS_EVIDENCE_QUEUE_PREFIX))
    .map(key => ({ key, entry: safeParse(storage.getItem(key)) }))
    .filter(record => (
      record.entry?.schemaVersion === MATHS_EVIDENCE_SCHEMA_VERSION
      && ["student", "teacher"].includes(record.entry?.audience)
      && record.entry?.scopeId
      && record.entry?.clientEventId
      && record.entry?.studentId
      && record.entry?.args
    ))
    .sort((left, right) => (
      String(left.entry.queuedAt).localeCompare(String(right.entry.queuedAt))
      || left.entry.clientEventId.localeCompare(right.entry.clientEventId)
    ));
}

export function readMathsEvidenceQueue({ audience = "", scopeId = "", storage } = {}) {
  const target = storageTarget(storage);
  if (!target) return [];
  const requestedScope = audience && scopeId ? queueScope(audience, scopeId) : "";
  return readAllQueueRecords(target).filter(record => (
    !requestedScope
    || queueScope(record.entry.audience, record.entry.scopeId) === requestedScope
  ));
}

function persistEntry(storage, entry) {
  if (!storage) return false;
  try {
    storage.setItem(queueKey(entry), JSON.stringify(entry));
    return storage.getItem(queueKey(entry)) !== null;
  } catch {
    return false;
  }
}

function removeEntry(storage, key) {
  try {
    storage?.removeItem(key);
    return storage?.getItem(key) === null;
  } catch {
    return false;
  }
}

function makeQueueEntry({ audience, scopeId, studentId, input, teacherArgs = {} }) {
  return {
    schemaVersion: MATHS_EVIDENCE_SCHEMA_VERSION,
    audience,
    scopeId: normalizeId(scopeId),
    studentId: normalizeId(studentId),
    clientEventId: input.clientEventId,
    queuedAt: new Date().toISOString(),
    attempts: 0,
    lastError: "",
    args: {
      ...teacherArgs,
      p_client_event_id: input.clientEventId,
      p_skill_id: input.skillId,
      p_event_type: input.eventType,
      p_evidence: input.evidence,
      p_occurred_at: input.occurredAt,
      p_content_version: input.contentVersion
    }
  };
}

async function deliverEntry(client, entry, token = "") {
  if (!client?.call) throw new Error("The Maths evidence service is unavailable.");
  const name = entry.audience === "student"
    ? "student_record_maths_evidence"
    : "teacher_record_maths_evidence";
  const args = entry.audience === "student"
    ? { p_token: token, ...entry.args }
    : entry.args;
  if (entry.audience === "student" && !normalizeId(token)) {
    throw new Error("A current student session is required to send Maths evidence.");
  }
  const { data, error } = await client.call(name, args);
  if (error) throw error;
  if (!data?.ok) {
    const rejected = new Error(data?.error || "The Maths evidence event was rejected.");
    rejected.code = data?.error || "LP_MATHS_EVIDENCE_REJECTED";
    throw rejected;
  }
  return data;
}

function isPermanentEvidenceRejection(error) {
  return [
    "class_not_found",
    "client_event_id_conflict",
    "invalid_assignment_reference",
    "invalid_content_reference",
    "invalid_payload",
    "learner_archived",
    "learner_not_in_owned_class"
  ].includes(String(error?.code || ""));
}

export async function readTeacherMathsSyncHealth({ client, classId } = {}) {
  if (!client?.call) throw new Error("The Maths evidence service is unavailable.");
  const { data, error } = await client.call("teacher_read_maths_sync_health", {
    p_class_id: classId
  });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || "Maths sync health could not be read.");
  return Array.isArray(data.learners) ? data.learners : [];
}

async function recordEntry({ client, entry, token = "", storage }) {
  const target = storageTarget(storage);
  const existing = readMathsEvidenceQueue({
    audience: entry.audience,
    scopeId: entry.scopeId,
    storage: target
  }).find(record => (
    record.entry.studentId === entry.studentId
    && record.entry.clientEventId === entry.clientEventId
  ));
  let record = existing || null;
  if (!record && readAllQueueRecords(target).length < MAX_QUEUE_ENTRIES) {
    if (persistEntry(target, entry)) record = { key: queueKey(entry), entry };
  }

  try {
    const result = await deliverEntry(client, record?.entry || entry, token);
    if (record) removeEntry(target, record.key);
    return {
      durable: true,
      cloudSaved: true,
      queued: false,
      clientEventId: entry.clientEventId,
      result,
      error: null
    };
  } catch (error) {
    if (isPermanentEvidenceRejection(error)) {
      if (record) removeEntry(target, record.key);
      return {
        durable: false,
        cloudSaved: false,
        queued: false,
        clientEventId: entry.clientEventId,
        result: null,
        error
      };
    }
    if (!record) {
      return {
        durable: false,
        cloudSaved: false,
        queued: false,
        clientEventId: entry.clientEventId,
        result: null,
        error
      };
    }
    persistEntry(target, {
      ...record.entry,
      attempts: Math.min(
        MAX_RECORDED_ATTEMPTS,
        Number(record.entry.attempts || 0) + 1
      ),
      lastError: String(error?.message || "delivery failed").slice(0, 240)
    });
    return {
      durable: true,
      cloudSaved: false,
      queued: true,
      clientEventId: entry.clientEventId,
      result: null,
      error: null
    };
  }
}

export function recordStudentMathsEvidence({
  client,
  token,
  studentId,
  storage,
  ...input
} = {}) {
  const scopedStudentId = normalizeId(studentId);
  if (!scopedStudentId) throw new TypeError("A student id is required for the retry scope.");
  const normalized = normalizeEvidenceInput(input);
  if (!STUDENT_MATHS_EVIDENCE_EVENT_TYPES.includes(normalized.eventType)) {
    throw new TypeError(`Students cannot record Maths event type: ${normalized.eventType}.`);
  }
  return recordEntry({
    client,
    token,
    storage,
    entry: makeQueueEntry({
      audience: "student",
      scopeId: scopedStudentId,
      studentId: scopedStudentId,
      input: normalized
    })
  });
}

export function recordTeacherMathsEvidence({
  client,
  teacherId,
  classId,
  studentId,
  storage,
  ...input
} = {}) {
  const scopedTeacherId = normalizeId(teacherId);
  const scopedClassId = normalizeId(classId);
  const scopedStudentId = normalizeId(studentId);
  if (!scopedTeacherId || !scopedClassId || !scopedStudentId) {
    throw new TypeError("Teacher, class and student ids are required for Maths evidence.");
  }
  const normalized = normalizeEvidenceInput(input);
  return recordEntry({
    client,
    storage,
    entry: makeQueueEntry({
      audience: "teacher",
      scopeId: scopedTeacherId,
      studentId: scopedStudentId,
      input: normalized,
      teacherArgs: {
        p_class_id: scopedClassId,
        p_student_id: scopedStudentId
      }
    })
  });
}

export function flushMathsEvidenceQueue({
  audience,
  scopeId,
  client,
  token = "",
  storage
} = {}) {
  const scopedAudience = normalizeId(audience);
  const scopedId = normalizeId(scopeId);
  const target = storageTarget(storage);
  if (!["student", "teacher"].includes(scopedAudience) || !scopedId || !target) {
    return Promise.resolve({ flushed: 0, rejected: 0, remaining: 0 });
  }
  const key = queueScope(scopedAudience, scopedId);
  if (activeFlushes.has(key)) return activeFlushes.get(key);
  const task = (async () => {
    let flushed = 0;
    let rejected = 0;
    const assignmentIds = new Set();
    for (const record of readMathsEvidenceQueue({
      audience: scopedAudience,
      scopeId: scopedId,
      storage: target
    })) {
      try {
        await deliverEntry(client, record.entry, token);
        if (removeEntry(target, record.key)) {
          flushed += 1;
          const assignmentId = normalizeId(record.entry.args?.p_evidence?.assignmentId);
          if (scopedAudience === "student" && assignmentId) assignmentIds.add(assignmentId);
        }
      } catch (error) {
        if (isPermanentEvidenceRejection(error)) {
          if (removeEntry(target, record.key)) rejected += 1;
          continue;
        }
        persistEntry(target, {
          ...record.entry,
          attempts: Math.min(
            MAX_RECORDED_ATTEMPTS,
            Number(record.entry.attempts || 0) + 1
          ),
          lastError: String(error?.message || "delivery failed").slice(0, 240)
        });
      }
    }
    let assignmentsCompleted = 0;
    let assignmentsPending = 0;
    if (scopedAudience === "student" && normalizeId(token) && client?.call) {
      for (const assignmentId of assignmentIds) {
        try {
          const { data, error } = await client.call("student_complete_maths_assignment", {
            p_token: token,
            p_assignment_id: assignmentId
          });
          if (!error && data?.ok) assignmentsCompleted += 1;
          else assignmentsPending += 1;
        } catch {
          assignmentsPending += 1;
        }
      }
    }
    return {
      flushed,
      rejected,
      ...(assignmentIds.size ? { assignmentsCompleted, assignmentsPending } : {}),
      remaining: readMathsEvidenceQueue({
        audience: scopedAudience,
        scopeId: scopedId,
        storage: target
      }).length
    };
  })().finally(() => {
    if (activeFlushes.get(key) === task) activeFlushes.delete(key);
  });
  activeFlushes.set(key, task);
  return task;
}

export async function clearAndVerifyMathsEvidenceForStudent({ studentId, storage } = {}) {
  const scopedStudentId = normalizeId(studentId);
  const target = storageTarget(storage);
  if (!scopedStudentId || !target) {
    const error = new Error("The Maths evidence retry store is unavailable for privacy cleanup.");
    error.code = "LP_LOCAL_CLEANUP_INCOMPLETE";
    throw error;
  }
  let removed = 0;
  for (const record of readAllQueueRecords(target)) {
    if (record.entry.studentId !== scopedStudentId) continue;
    if (removeEntry(target, record.key)) removed += 1;
  }
  for (let index = target.length - 1; index >= 0; index -= 1) {
    const key = target.key(index);
    if (!isMathsLessonStorageKeyForStudent(key, scopedStudentId)) continue;
    if (removeEntry(target, key)) removed += 1;
  }
  const residuals = readAllQueueRecords(target)
    .filter(record => record.entry.studentId === scopedStudentId)
    .map(record => record.key);
  const lessonResiduals = Array.from({ length: target.length }, (_, index) => target.key(index))
    .filter(key => isMathsLessonStorageKeyForStudent(key, scopedStudentId));
  if (residuals.length || lessonResiduals.length) {
    const error = new Error("Queued Maths evidence remains after learner cleanup.");
    error.code = "LP_LOCAL_CLEANUP_INCOMPLETE";
    throw error;
  }
  return { removed, residualCount: 0, storageAvailable: true };
}

export async function readTeacherMathsEvidence({
  client,
  classId,
  studentId = null,
  since = null,
  source = null,
  limit = 5000,
  returnMetadata = false
} = {}) {
  if (!client?.call) throw new Error("The Maths evidence service is unavailable.");
  const requestedLimit = Math.max(1, Math.min(20_000, Number(limit) || 5000));
  const events = [];
  let beforeOccurredAt = null;
  let beforeId = null;
  let hasMore = false;
  while (events.length < requestedLimit) {
    const pageSize = Math.min(500, requestedLimit - events.length);
    const { data, error } = await client.call("teacher_read_maths_evidence_filtered_page", {
      p_class_id: classId,
      p_student_id: studentId,
      p_since: since,
      p_source: source,
      p_limit: pageSize,
      p_before_occurred_at: beforeOccurredAt,
      p_before_id: beforeId
    });
    if (error) throw error;
    if (!data?.ok) throw new Error(data?.error || "Maths evidence could not be read.");
    const rows = Array.isArray(data.events) ? data.events : [];
    events.push(...rows);
    hasMore = Boolean(data.hasMore);
    if (!data.hasMore || !rows.length) break;
    beforeOccurredAt = data.nextBeforeOccurredAt || rows.at(-1)?.occurredAt || null;
    beforeId = data.nextBeforeId || rows.at(-1)?.id || null;
    if (!beforeOccurredAt || !beforeId) break;
  }
  const result = { events, complete: !hasMore, hasMore, loadedCount: events.length };
  return returnMetadata ? Object.freeze(result) : events;
}
