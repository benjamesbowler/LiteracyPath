import { supabase } from "../supabaseClient.js";
import { selectAllRows } from "../data/pagedSelect.js";
import { computeHydratedValue, sanitizeCloudProgressPayload } from "./progressMerge.js";
import {
  PROGRESS_AREAS,
  RETIRED_PROGRESS_AREAS,
  localLearnerDataKeysForStudent,
  localProgressKeysForStudent,
  localProgressStorageKey,
  retiredLocalProgressStorageKey,
  RESET_AREA,
  shouldApplyReset
} from "./progressKeys.js";
import {
  clearProgressQueueForStudent,
  enqueueProgressQueueEntry,
  mergeProgressQueueEntries,
  mergeProgressQueueRecords,
  progressEntryIdentity,
  readProgressQueueRecords,
  removeProgressQueueRecords
} from "./progressQueue.js";
import {
  buildEngagementHealthSnapshot,
  clearEngagementDataForStudent,
  ENGAGEMENT_HEALTH_PREFIX,
  engagementRetryDelay,
  enqueueEngagementEvent,
  flushEngagementQueue,
  readEngagementQueue,
  updateEngagementHealth
} from "./engagementQueue.js";

export { PROGRESS_AREAS, localProgressKeysForStudent, RESET_AREA } from "./progressKeys.js";

const RESET_APPLIED_PREFIX = "lp-reset-applied:";

const CLOUD_ROW_STORAGE_KEY = "lp-cloud-progress-rows-v1";
const SAVE_DEBOUNCE_MS = 1800;
export const PRACTICE_RESET_RETAINED_AREAS = Object.freeze([
  "profile",
  "guided_reading",
  "story_quests"
]);

let activeSession = null;
const pendingTimers = new Map();
const inFlightFlushes = new Map();
const volatileEntries = new Map();
let onlineListenerInstalled = false;
let engagementFlushTimer = null;
const engagementInFlightFlushes = new Map();
const volatileEngagementEvents = new Map();
const volatileEngagementHealth = new Map();
const blockedStudentWrites = new Set();
const blockedPracticeStudentWrites = new Map();

function isBrowser() {
  return typeof window !== "undefined";
}

function engagementStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readJson(key, fallback) {
  if (!isBrowser()) return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Local progress buffering must never block the child experience.
    return false;
  }
}

function operationStorage(providedStorage) {
  if (providedStorage) return providedStorage;
  return engagementStorage();
}

function preservedProgressAreas({ preserveProfile = false, preserveAreas = [] } = {}) {
  const areas = new Set(
    (Array.isArray(preserveAreas) ? preserveAreas : [])
      .map(area => String(area || "").trim())
      .filter(Boolean)
  );
  if (preserveProfile) areas.add("profile");
  return areas;
}

function isPreservedProgressArea(area, retainedAreas) {
  return retainedAreas.has(String(area || ""));
}

function isPreservedProgressIdentity(identity, studentId, retainedAreas) {
  return [...retainedAreas].some(area =>
    String(identity).startsWith(`${studentId}:${area}:`)
  );
}

function isProgressWriteBlocked(studentId, area) {
  const scopedStudentId = String(studentId || "");
  const retainedAreas = blockedPracticeStudentWrites.get(scopedStudentId);
  return blockedStudentWrites.has(scopedStudentId)
    || (
      retainedAreas
      && !isPreservedProgressArea(area, retainedAreas)
    );
}

export function inspectLocalProgressForStudent(studentId, {
  preserveEngagement = false,
  preserveProfile = false,
  preserveAreas = [],
  storage
} = {}) {
  const scopedStudentId = String(studentId || "").trim();
  const localStorage = operationStorage(storage);
  const retainedAreas = preservedProgressAreas({ preserveProfile, preserveAreas });
  if (!scopedStudentId || !localStorage) {
    return {
      storageAvailable: false,
      residualCount: scopedStudentId ? 1 : 0,
      residuals: scopedStudentId ? ["storage_unavailable"] : []
    };
  }

  const residuals = [];
  try {
    const retainedStorageKeys = new Set(
      [...retainedAreas]
        .map(area => localProgressStorageKey(area, scopedStudentId))
        .filter(Boolean)
    );
    const inspectedKeys = retainedAreas.size > 0
      ? localProgressKeysForStudent(scopedStudentId)
      : localLearnerDataKeysForStudent(scopedStudentId);
    for (const key of inspectedKeys) {
      if (retainedStorageKeys.has(key)) continue;
      if (localStorage.getItem(key) !== null) residuals.push(`progress:${key}`);
    }
    for (const record of readProgressQueueRecords(localStorage)) {
      if (
        String(record.entry.studentId) === scopedStudentId
        && !isPreservedProgressArea(record.entry.area, retainedAreas)
      ) {
        residuals.push(`progress_queue:${record.storageKey}`);
      }
    }
    if (!preserveEngagement) {
      for (const record of readEngagementQueue(localStorage, scopedStudentId)) {
        residuals.push(`engagement_queue:${record.key}`);
      }
      if (localStorage.getItem(`${ENGAGEMENT_HEALTH_PREFIX}${scopedStudentId}`) !== null) {
        residuals.push("engagement_health");
      }
    }
    const cachedRows = JSON.parse(localStorage.getItem(CLOUD_ROW_STORAGE_KEY) || "{}");
    if (cachedRows && Object.prototype.hasOwnProperty.call(cachedRows, scopedStudentId)) {
      const studentRows = cachedRows[scopedStudentId];
      const hasResidualRows = retainedAreas.size === 0
        || !Array.isArray(studentRows)
        || studentRows.some(row => !isPreservedProgressArea(row?.area, retainedAreas));
      if (hasResidualRows) residuals.push("cloud_row_cache");
    }
  } catch {
    return {
      storageAvailable: false,
      residualCount: 1,
      residuals: ["storage_unavailable"]
    };
  }

  for (const entry of volatileEntries.values()) {
    if (
      String(entry.studentId) === scopedStudentId
      && !isPreservedProgressArea(entry.area, retainedAreas)
    ) {
      residuals.push("volatile_progress");
    }
  }
  if (!preserveEngagement) {
    for (const entry of volatileEngagementEvents.values()) {
      if (String(entry.studentId) === scopedStudentId) residuals.push("volatile_engagement");
    }
    if (volatileEngagementHealth.has(scopedStudentId)) {
      residuals.push("volatile_engagement_health");
    }
  }

  return {
    storageAvailable: true,
    residualCount: residuals.length,
    residuals
  };
}

// Wipe ALL local progress for a student: the area stores, this student's cached
// cloud rows, and any of their not-yet-flushed queued writes. Deletion callers
// can also block future writes, closing the in-flight retry race after the
// database has removed the learner.
export function clearLocalProgressForStudent(studentId, {
  blockFutureWrites = false,
  preserveEngagement = false,
  preserveProfile = false,
  preserveAreas = [],
  storage
} = {}) {
  const scopedStudentId = String(studentId || "").trim();
  const localStorage = operationStorage(storage);
  const retainedAreas = preservedProgressAreas({ preserveProfile, preserveAreas });
  if (!scopedStudentId || !localStorage) {
    return inspectLocalProgressForStudent(scopedStudentId, { storage: localStorage });
  }
  if (blockFutureWrites) blockedStudentWrites.add(scopedStudentId);
  const retainedStorageKeys = new Set(
    [...retainedAreas]
      .map(area => localProgressStorageKey(area, scopedStudentId))
      .filter(Boolean)
  );
  // A practice reset retains device navigation preferences. A full privacy
  // cleanup has no retained progress areas and removes every learner-local key.
  const clearedKeys = retainedAreas.size > 0
    ? localProgressKeysForStudent(studentId)
    : localLearnerDataKeysForStudent(studentId);
  for (const key of clearedKeys) {
    if (retainedStorageKeys.has(key)) continue;
    try { localStorage.removeItem(key); } catch { /* verified below */ }
  }
  // Drop this student's queued writes so they don't re-push deleted progress.
  try {
    if (retainedAreas.size > 0) {
      const records = readProgressQueueRecords(localStorage).filter(record => (
        String(record.entry.studentId) === scopedStudentId
        && !isPreservedProgressArea(record.entry.area, retainedAreas)
      ));
      removeProgressQueueRecords(localStorage, records);
    } else {
      clearProgressQueueForStudent(localStorage, scopedStudentId);
    }
  } catch { /* verified below */ }
  for (const [identity, entry] of volatileEntries) {
    if (
      String(entry.studentId) === scopedStudentId
      && !isPreservedProgressArea(entry.area, retainedAreas)
    ) {
      volatileEntries.delete(identity);
    }
  }
  if (!preserveEngagement) {
    try {
      clearEngagementDataForStudent(localStorage, scopedStudentId);
    } catch {
      // Verified below.
    }
    for (const [id, entry] of volatileEngagementEvents) {
      if (String(entry.studentId) === scopedStudentId) volatileEngagementEvents.delete(id);
    }
    volatileEngagementHealth.delete(scopedStudentId);
  }
  for (const [identity, timer] of pendingTimers) {
    if (!identity.startsWith(`${scopedStudentId}:`)) continue;
    if (isPreservedProgressIdentity(identity, scopedStudentId, retainedAreas)) continue;
    if (isBrowser()) window.clearTimeout?.(timer);
    pendingTimers.delete(identity);
  }
  if (activeSession?.studentId === scopedStudentId && blockFutureWrites) {
    activeSession = null;
  }
  // Drop their cached cloud rows.
  try {
    const cache = JSON.parse(localStorage.getItem(CLOUD_ROW_STORAGE_KEY) || "{}");
    if (retainedAreas.size > 0 && Array.isArray(cache[scopedStudentId])) {
      const retainedRows = cache[scopedStudentId].filter(row => (
        isPreservedProgressArea(row?.area, retainedAreas)
      ));
      if (retainedRows.length) cache[scopedStudentId] = retainedRows;
      else delete cache[scopedStudentId];
    } else {
      delete cache[scopedStudentId];
    }
    localStorage.setItem(CLOUD_ROW_STORAGE_KEY, JSON.stringify(cache));
  } catch { /* verified below */ }
  return inspectLocalProgressForStudent(scopedStudentId, {
    preserveEngagement,
    preserveProfile,
    preserveAreas,
    storage: localStorage
  });
}

export async function clearAndVerifyLocalProgressForStudent(studentId, {
  allowFutureWritesAfterCleanup = false,
  preserveEngagement = false,
  preserveProfile = false,
  preserveAreas = [],
  storage
} = {}) {
  const scopedStudentId = String(studentId || "").trim();
  const localStorage = operationStorage(storage);
  const retainedAreas = preservedProgressAreas({ preserveProfile, preserveAreas });
  const practiceOnly = preserveEngagement || retainedAreas.size > 0;
  if (practiceOnly) {
    blockedPracticeStudentWrites.set(scopedStudentId, retainedAreas);
  }
  clearLocalProgressForStudent(scopedStudentId, {
    blockFutureWrites: !practiceOnly,
    preserveEngagement,
    preserveProfile,
    preserveAreas,
    storage: localStorage
  });

  // A request that was already on the wire can finish after the first clear
  // and recreate a retry entry in its catch path. Wait for those bounded
  // requests, then clear and inspect once more before privacy completion.
  const pending = [
    ...[...inFlightFlushes.entries()]
      .filter(([identity]) => (
        identity.startsWith(`${scopedStudentId}:`)
        && !isPreservedProgressIdentity(identity, scopedStudentId, retainedAreas)
      ))
      .map(([, task]) => task),
    ...[...engagementInFlightFlushes.entries()]
      .filter(([identity]) => (
        !preserveEngagement
        && String(identity) === scopedStudentId
      ))
      .map(([, task]) => task)
  ];
  if (pending.length) await Promise.allSettled(pending);

  const verification = clearLocalProgressForStudent(scopedStudentId, {
    blockFutureWrites: !practiceOnly,
    preserveEngagement,
    preserveProfile,
    preserveAreas,
    storage: localStorage
  });
  if (!verification.storageAvailable || verification.residualCount > 0) {
    const error = new Error("This browser could not verify that the learner's cached progress was removed.");
    error.code = "LP_LOCAL_CLEANUP_INCOMPLETE";
    error.residuals = verification.residuals;
    throw error;
  }
  if (allowFutureWritesAfterCleanup) {
    if (practiceOnly) blockedPracticeStudentWrites.delete(scopedStudentId);
    else blockedStudentWrites.delete(scopedStudentId);
  }
  return verification;
}

function cacheCloudRows(studentId, rows = []) {
  const cache = readJson(CLOUD_ROW_STORAGE_KEY, {});
  cache[studentId] = rows;
  writeJson(CLOUD_ROW_STORAGE_KEY, cache);
}

export function getCachedCloudProgressRows(studentId) {
  return readJson(CLOUD_ROW_STORAGE_KEY, {})[studentId] || [];
}

function emitProgressSyncState(status, entry) {
  if (!isBrowser() || !entry?.studentId) return;
  const pending = readProgressQueueRecords(window.localStorage)
    .filter(record => record.entry.studentId === entry.studentId).length;
  const volatilePending = [...volatileEntries.values()]
    .filter(candidate => candidate.studentId === entry.studentId).length;
  window.dispatchEvent(new CustomEvent("lp-progress-sync-state", {
    detail: {
      status,
      studentId: entry.studentId,
      area: entry.area,
      key: entry.key,
      pending: pending + volatilePending
    }
  }));
}

function handleProgressOnline() {
  void flushQueuedProgressWrites(activeSession);
  void flushQueuedEngagementEvents(activeSession, { force: true });
}

function discardRetiredProgressForStudent(studentId) {
  if (!isBrowser() || !studentId) return;
  for (const area of RETIRED_PROGRESS_AREAS) {
    try { window.localStorage.removeItem(retiredLocalProgressStorageKey(area, studentId)); } catch { /* best effort */ }
  }
  try {
    const retiredRecords = readProgressQueueRecords(window.localStorage)
      .filter(record => (
        record.entry.studentId === studentId
        && RETIRED_PROGRESS_AREAS.includes(record.entry.area)
      ));
    removeProgressQueueRecords(window.localStorage, retiredRecords);
  } catch { /* best effort */ }
  for (const [identity, entry] of volatileEntries) {
    if (entry.studentId === studentId && RETIRED_PROGRESS_AREAS.includes(entry.area)) {
      volatileEntries.delete(identity);
    }
  }
}

export function configureProgressSync(session = null) {
  activeSession = session?.studentId ? session : null;
  if (activeSession) discardRetiredProgressForStudent(activeSession.studentId);
  if (isBrowser() && !onlineListenerInstalled) {
    window.addEventListener("online", handleProgressOnline);
    onlineListenerInstalled = true;
  }
  if (isBrowser() && activeSession?.mode === "student" && activeSession.token) {
    window.setTimeout(() => {
      void flushQueuedEngagementEvents(activeSession);
    }, 0);
  }
}

export function getActiveProgressSyncSession() {
  return activeSession;
}

function enqueueWrite(entry, { deferred = false } = {}) {
  const identity = progressEntryIdentity(entry);
  const candidate = mergeProgressQueueEntries(volatileEntries.get(identity), entry);
  const result = enqueueProgressQueueEntry(window.localStorage, candidate, { deferred });
  if (result.stored) {
    volatileEntries.delete(identity);
  } else {
    result.entry = mergeProgressQueueEntries(volatileEntries.get(identity), result.entry);
    volatileEntries.set(identity, result.entry);
  }
  return result;
}

async function saveCloudProgress(entry) {
  if (!entry?.studentId) return;
  if (!PROGRESS_AREAS.includes(entry.area)) return;
  // Defence in depth for old queued rows and future callers: privacy-bound
  // fields must not leave the device even if they predate queue sanitisation.
  const uploadPayload = sanitizeCloudProgressPayload(entry.area, entry.payload);

  if (entry.mode === "student" && entry.token) {
    const { data, error } = await supabase.call("student_save_progress", {
      p_token: entry.token,
      p_area: entry.area,
      p_key: entry.key,
      p_payload: uploadPayload
    });
    if (error || data?.ok === false) throw error || new Error(data?.error || "student_save_progress failed");
    return;
  }

  const { error } = await supabase
    .table("student_progress")
    .upsert({
      student_id: entry.studentId,
      area: entry.area,
      key: entry.key,
      payload: uploadPayload,
      updated_at: new Date().toISOString()
    }, { onConflict: "student_id,area,key" });
  if (error) throw error;
}

async function flushEntry(entry, records, volatileRevision = null) {
  if (isProgressWriteBlocked(entry?.studentId, entry?.area)) {
    removeProgressQueueRecords(window.localStorage, records);
    volatileEntries.delete(progressEntryIdentity(entry));
    return { ok: false, needsRecovery: false };
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    const queued = enqueueWrite(entry, { deferred: true });
    emitProgressSyncState(queued.stored ? "deferred" : "storage-failed", queued.entry);
    return { ok: false, needsRecovery: true };
  }
  try {
    await saveCloudProgress(entry);
    // Remove only the revisions represented by this upload. A second tab can
    // append while the request is in flight and its unique record survives for
    // the next loop instead of being erased by a broad identity filter.
    removeProgressQueueRecords(window.localStorage, records);
    const identity = progressEntryIdentity(entry);
    if (volatileRevision && volatileEntries.get(identity)?.revision === volatileRevision) {
      volatileEntries.delete(identity);
    }
    return { ok: true, needsRecovery: Boolean(entry.needsRecovery) };
  } catch {
    if (isProgressWriteBlocked(entry?.studentId, entry?.area)) {
      removeProgressQueueRecords(window.localStorage, records);
      volatileEntries.delete(progressEntryIdentity(entry));
      return { ok: false, needsRecovery: false };
    }
    const queued = enqueueWrite(entry, { deferred: true });
    emitProgressSyncState(queued.stored ? "deferred" : "storage-failed", queued.entry);
    return { ok: false, needsRecovery: true };
  }
}

async function flushQueuedKey(identity, session = activeSession) {
  if (!session?.studentId) return false;
  if (blockedStudentWrites.has(String(session.studentId))) {
    const records = readProgressQueueRecords(window.localStorage)
      .filter(record => progressEntryIdentity(record.entry) === identity);
    removeProgressQueueRecords(window.localStorage, records);
    volatileEntries.delete(identity);
    return false;
  }
  if (inFlightFlushes.has(identity)) return inFlightFlushes.get(identity);

  const task = (async () => {
    let recovered = false;
    let lastEntry = null;
    while (true) {
      const records = readProgressQueueRecords(window.localStorage)
        .filter(record => progressEntryIdentity(record.entry) === identity);
      const volatile = volatileEntries.get(identity) || null;
      const current = mergeProgressQueueRecords(volatile
        ? [...records, { storageKey: null, legacy: false, entry: volatile }]
        : records);
      if (!current || current.studentId !== session.studentId) {
        if (recovered && lastEntry) emitProgressSyncState("recovered", lastEntry);
        return true;
      }
      lastEntry = current;
      const result = await flushEntry({
        ...current,
        mode: session.mode || current.mode || "teacher",
        token: session.token || current.token || ""
      }, records, volatile?.revision || null);
      recovered = recovered || result.needsRecovery;
      if (!result.ok) return false;
    }
  })();

  inFlightFlushes.set(identity, task);
  try {
    return await task;
  } finally {
    if (inFlightFlushes.get(identity) === task) inFlightFlushes.delete(identity);
  }
}

export function queueProgressSave(area, key, payload, { scopeKey } = {}) {
  if (!PROGRESS_AREAS.includes(area)) return false;
  if (activeSession?.mode === "preview") {
    if (isBrowser()) {
      window.dispatchEvent(new CustomEvent("lp-preview-write-blocked", {
        detail: {
          studentId: activeSession.studentId,
          area,
          key
        }
      }));
    }
    return false;
  }
  if (!activeSession?.studentId || activeSession.studentId !== scopeKey) return;
  if (isProgressWriteBlocked(activeSession.studentId, area)) return false;
  const entry = {
    mode: activeSession.mode || "teacher",
    token: activeSession.token || "",
    studentId: activeSession.studentId,
    area,
    key,
    payload: sanitizeCloudProgressPayload(area, payload)
  };
  const queued = enqueueWrite(entry);
  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent("lp-progress-updated", {
      detail: { studentId: scopeKey, area, key }
    }));
  }
  if (!queued.stored) emitProgressSyncState("storage-failed", queued.entry);
  const timerKey = progressEntryIdentity(queued.entry);
  window.clearTimeout?.(pendingTimers.get(timerKey));
  const timer = window.setTimeout(() => {
    pendingTimers.delete(timerKey);
    void flushQueuedKey(timerKey, activeSession);
  }, SAVE_DEBOUNCE_MS);
  pendingTimers.set(timerKey, timer);
  return queued.stored;
}

export async function flushQueuedProgressWrites(session = activeSession) {
  if (!session?.studentId) return;
  if (blockedStudentWrites.has(String(session.studentId))) {
    clearLocalProgressForStudent(session.studentId, {
      blockFutureWrites: true
    });
    return;
  }
  const own = readProgressQueueRecords(window.localStorage)
    .filter(record => record.entry.studentId === session.studentId);
  const identities = [...new Set([
    ...own.map(record => progressEntryIdentity(record.entry)),
    ...[...volatileEntries.entries()]
      .filter(([, entry]) => entry.studentId === session.studentId)
      .map(([identity]) => identity)
  ])];
  for (const identity of identities) {
    await flushQueuedKey(identity, session);
  }
}

export async function fetchStudentCloudProgress(session) {
  if (!session?.studentId) return [];
  if (session.mode === "student" && session.token) {
    const { data, error } = await supabase.call("student_get_progress", { p_token: session.token });
    if (error) throw error;
    return data || [];
  }

  const result = await selectAllRows(() => supabase
    .table("student_progress")
    .select("area, key, payload, updated_at")
    .eq("student_id", session.studentId));
  if (result.error) throw result.error;
  if (result.truncated) {
    throw new Error("Student progress exceeded the configured complete-read ceiling.");
  }
  return result.data || [];
}

// If a teacher reset this student more recently than this device has applied,
// wipe the device's local progress before merging - so a reset propagates to
// every shared iPad, not just the one the teacher used. The reset itself leaves
// an empty cloud (just the sentinel), so after this there is nothing to merge.
// Returns true when a wipe actually happened, so the hydrate event can tell
// open surfaces to REPLACE their in-memory state instead of merging it back —
// a forward-only merge applied across a reset resurrects everything the
// teacher just deleted.
async function applyResetTombstone(session, rows) {
  const studentId = session?.studentId || "";
  if (!isBrowser() || !studentId) return false;
  const resetRow = rows.find(row => row.area === RESET_AREA);
  const cloudResetAt = resetRow?.payload?.at || "";
  const markerKey = `${RESET_APPLIED_PREFIX}${studentId}`;
  let appliedAt = "";
  try { appliedAt = window.localStorage.getItem(markerKey) || ""; } catch { /* ignore */ }
  if (shouldApplyReset(cloudResetAt, appliedAt)) {
    await clearAndVerifyLocalProgressForStudent(studentId, {
      allowFutureWritesAfterCleanup: true,
      preserveEngagement: true,
      preserveProfile: true,
      preserveAreas: PRACTICE_RESET_RETAINED_AREAS
    });
    try { window.localStorage.setItem(markerKey, cloudResetAt); } catch { /* ignore */ }
    return true;
  }
  return false;
}

export async function hydrateCloudProgress(session) {
  discardRetiredProgressForStudent(session?.studentId);
  const rows = (await fetchStudentCloudProgress(session)).filter(row => (
    row.area === RESET_AREA || PROGRESS_AREAS.includes(row.area)
  ));
  const resetApplied = await applyResetTombstone(session, rows);
  cacheCloudRows(session.studentId, rows);
  rows.forEach(row => {
    const storageKey = localProgressStorageKey(row.area, session.studentId);
    if (!storageKey) return;
    const existing = readJson(storageKey, {});
    // Forward-only merge: cloud can ADD progress but never wipe out stars,
    // completions, or words the child already has locally. See progressMerge.js.
    writeJson(storageKey, computeHydratedValue(row.area, row.key, existing, row.payload));
  });
  await flushQueuedProgressWrites(session);
  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent("lp-progress-hydrated", {
      detail: {
        studentId: session.studentId,
        studentName: session.studentName || "",
        teacherId: session.teacherId || "",
        rows,
        resetApplied
      }
    }));
  }
  return rows;
}

export function clearProgressSyncSession() {
  activeSession = null;
  pendingTimers.forEach(timer => window.clearTimeout?.(timer));
  pendingTimers.clear();
  if (engagementFlushTimer !== null) {
    window.clearTimeout?.(engagementFlushTimer);
    engagementFlushTimer = null;
  }
  if (isBrowser() && onlineListenerInstalled) {
    window.removeEventListener("online", handleProgressOnline);
    onlineListenerInstalled = false;
  }
}

async function sendStudentActivity(session, entry) {
  const client = session.client || supabase;
  const { data, error } = await client.call("student_log_activity_v2", {
    p_token: session.token,
    p_client_event_id: entry.id,
    p_area: entry.area,
    p_item_id: entry.itemId,
    p_event: entry.event,
    p_payload: entry.payload,
    p_occurred_at: entry.occurredAt,
    p_delivery_attempts: Number(entry.attempts || 0) + 1
  });
  if (error || data?.ok === false) {
    throw error || new Error(data?.error || "student_log_activity_v2 failed");
  }
}

async function reportStudentActivitySyncHealth(session, snapshot) {
  try {
    const client = session.client || supabase;
    const { data, error } = await client.call("student_report_activity_sync_health", {
      p_token: session.token,
      p_device_id: snapshot.deviceId,
      p_attempted: snapshot.attempted,
      p_delivered: snapshot.delivered,
      p_recovered: snapshot.recovered,
      p_storage_failures: snapshot.storageFailures,
      p_pending: snapshot.pending,
      p_lost: snapshot.lost,
      p_oldest_pending_at: snapshot.oldestPendingAt || null
    });
    if (error || data?.ok === false) {
      throw error || new Error(data?.error || "student_report_activity_sync_health failed");
    }
  } catch {
    // The latest cumulative snapshot is retained locally and reported again.
  }
}

function emitEngagementSyncState(snapshot) {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent("lp-engagement-sync-state", {
    detail: snapshot
  }));
}

function scheduleEngagementFlush(session, nextAttemptAt = "") {
  if (!isBrowser() || !session?.studentId || session.mode !== "student") return;
  if (
    activeSession?.studentId !== session.studentId
    || activeSession?.token !== session.token
  ) return;
  if (engagementFlushTimer !== null) window.clearTimeout(engagementFlushTimer);
  const nextAt = new Date(nextAttemptAt || Date.now()).getTime();
  const delay = Math.max(0, Number.isFinite(nextAt) ? nextAt - Date.now() : 0);
  engagementFlushTimer = window.setTimeout(() => {
    engagementFlushTimer = null;
    void flushQueuedEngagementEvents(session);
  }, delay);
}

async function performEngagementFlush(
  session = activeSession,
  { force = false } = {}
) {
  if (!isBrowser() || !session?.studentId || session.mode !== "student" || !session.token) {
    return null;
  }
  if (blockedStudentWrites.has(String(session.studentId))) {
    clearEngagementDataForStudent(engagementStorage(), session.studentId);
    return null;
  }
  const durable = await flushEngagementQueue({
    storage: engagementStorage(),
    studentId: session.studentId,
    force,
    send: entry => sendStudentActivity(session, entry)
  });
  let volatileDelivered = 0;
  let volatileRecovered = 0;
  const now = Date.now();
  for (const [id, entry] of volatileEngagementEvents) {
    if (entry.studentId !== session.studentId) continue;
    if (!force && new Date(entry.nextAttemptAt || 0).getTime() > now) continue;
    try {
      await sendStudentActivity(session, entry);
      volatileEngagementEvents.delete(id);
      volatileDelivered += 1;
      if (entry.attempts > 0) volatileRecovered += 1;
    } catch (error) {
      const attempts = Number(entry.attempts || 0) + 1;
      volatileEngagementEvents.set(id, {
        ...entry,
        attempts,
        nextAttemptAt: new Date(now + engagementRetryDelay(attempts)).toISOString(),
        lastError: String(error?.message || "delivery failed").slice(0, 160)
      });
    }
  }

  const carriedHealth = volatileEngagementHealth.get(session.studentId) || {};
  const healthDelta = {
    attempted: Number(carriedHealth.attempted || 0),
    delivered: Number(carriedHealth.delivered || 0)
      + durable.delivered
      + volatileDelivered,
    recovered: Number(carriedHealth.recovered || 0)
      + durable.recovered
      + volatileRecovered,
    storageFailures: Number(carriedHealth.storageFailures || 0)
      + durable.storageFailures
  };
  const healthUpdate = updateEngagementHealth(
    engagementStorage(),
    session.studentId,
    healthDelta
  );
  if (healthUpdate.stored) volatileEngagementHealth.delete(session.studentId);
  else volatileEngagementHealth.set(session.studentId, healthDelta);
  const volatilePending = [...volatileEngagementEvents.values()]
    .filter(entry => entry.studentId === session.studentId).length;
  const volatileOldestPendingAt = [...volatileEngagementEvents.values()]
    .filter(entry => entry.studentId === session.studentId)
    .map(entry => entry.queuedAt)
    .filter(Boolean)
    .sort()[0] || "";
  const remainingVolatileHealth = volatileEngagementHealth.get(session.studentId) || {};
  const snapshot = buildEngagementHealthSnapshot(
    engagementStorage(),
    session.studentId,
    {
      volatileAttempted: remainingVolatileHealth.attempted,
      volatileDelivered: remainingVolatileHealth.delivered,
      volatileRecovered: remainingVolatileHealth.recovered,
      volatileStorageFailures: remainingVolatileHealth.storageFailures,
      volatilePending,
      volatileOldestPendingAt
    }
  );
  emitEngagementSyncState(snapshot);
  await reportStudentActivitySyncHealth(session, snapshot);

  const nextAttemptAt = [
    durable.nextAttemptAt,
    ...[...volatileEngagementEvents.values()]
      .filter(entry => entry.studentId === session.studentId)
      .map(entry => entry.nextAttemptAt)
  ].filter(Boolean).sort()[0] || "";
  if (snapshot.pending > 0) scheduleEngagementFlush(session, nextAttemptAt);
  return snapshot;
}

export async function flushQueuedEngagementEvents(
  session = activeSession,
  { force = false } = {}
) {
  if (!isBrowser() || !session?.studentId || session.mode !== "student" || !session.token) {
    return null;
  }
  if (blockedStudentWrites.has(String(session.studentId))) {
    clearEngagementDataForStudent(engagementStorage(), session.studentId);
    return null;
  }
  const identity = session.studentId;
  const current = engagementInFlightFlushes.get(identity);
  if (current) {
    const result = await current;
    return force
      ? flushQueuedEngagementEvents(session, { force: true })
      : result;
  }
  const task = performEngagementFlush(session, { force });
  engagementInFlightFlushes.set(identity, task);
  try {
    return await task;
  } finally {
    if (engagementInFlightFlushes.get(identity) === task) {
      engagementInFlightFlushes.delete(identity);
    }
  }
}

/* Learning events are written to durable local storage before the RPC starts.
   Delivery is non-blocking, idempotent, and retried with bounded backoff. */
export function logStudentActivity(area, itemId = null, event = "done", payload = null) {
  if (!isBrowser()) return;
  const session = activeSession;
  if (!session || session.mode !== "student" || !session.token) return;
  if (blockedStudentWrites.has(String(session.studentId))) return false;
  try {
    const storage = engagementStorage();
    const queued = enqueueEngagementEvent(storage, {
      studentId: session.studentId,
      area,
      itemId,
      event,
      payload
    });
    const healthUpdate = updateEngagementHealth(storage, session.studentId, {
      attempted: 1,
      storageFailures: queued.stored ? 0 : 1
    });
    if (!healthUpdate.stored) {
      const current = volatileEngagementHealth.get(session.studentId) || {};
      volatileEngagementHealth.set(session.studentId, {
        attempted: Number(current.attempted || 0) + 1,
        delivered: Number(current.delivered || 0),
        recovered: Number(current.recovered || 0),
        storageFailures: Number(current.storageFailures || 0) + (queued.stored ? 0 : 1)
      });
    }
    if (!queued.stored) {
      volatileEngagementEvents.set(queued.event.id, queued.event);
    }
    const pendingHealth = volatileEngagementHealth.get(session.studentId) || {};
    emitEngagementSyncState(buildEngagementHealthSnapshot(
      storage,
      session.studentId,
      {
        volatileAttempted: pendingHealth.attempted,
        volatileDelivered: pendingHealth.delivered,
        volatileRecovered: pendingHealth.recovered,
        volatileStorageFailures: pendingHealth.storageFailures,
        volatilePending: [...volatileEngagementEvents.values()]
          .filter(entry => entry.studentId === session.studentId).length,
        volatileOldestPendingAt: [...volatileEngagementEvents.values()]
          .filter(entry => entry.studentId === session.studentId)
          .map(entry => entry.queuedAt)
          .filter(Boolean)
          .sort()[0] || ""
      }
    ));
    scheduleEngagementFlush(session);
    return queued.stored;
  } catch {
    // Engagement telemetry must never block or break the learner flow.
    return false;
  }
}
