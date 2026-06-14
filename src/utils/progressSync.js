import { supabase } from "../supabaseClient.js";
import { computeHydratedValue } from "./progressMerge.js";
import { localProgressStorageKey, localProgressKeysForStudent, RESET_AREA, shouldApplyReset } from "./progressKeys.js";

export { PROGRESS_AREAS, localProgressKeysForStudent, RESET_AREA } from "./progressKeys.js";

const RESET_APPLIED_PREFIX = "lp-reset-applied:";

const SYNC_QUEUE_KEY = "lp-progress-sync-queue-v1";
const CLOUD_ROW_STORAGE_KEY = "lp-cloud-progress-rows-v1";
const SAVE_DEBOUNCE_MS = 1800;

let activeSession = null;
const pendingTimers = new Map();

function isBrowser() {
  return typeof window !== "undefined";
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
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local progress buffering must never block the child experience.
  }
}

// Wipe ALL local progress for a student: the area stores, this student's cached
// cloud rows, and any of their not-yet-flushed queued writes. Used by the
// teacher "reset progress" action so a reset can't sync straight back.
export function clearLocalProgressForStudent(studentId) {
  if (!isBrowser() || !studentId) return;
  for (const key of localProgressKeysForStudent(studentId)) {
    try { window.localStorage.removeItem(key); } catch { /* best effort */ }
  }
  // Drop this student's queued writes so they don't re-push deleted progress.
  try {
    const queue = readJson(SYNC_QUEUE_KEY, []);
    writeJson(SYNC_QUEUE_KEY, queue.filter(item => item.studentId !== studentId));
  } catch { /* best effort */ }
  // Drop their cached cloud rows.
  try {
    const cache = readJson(CLOUD_ROW_STORAGE_KEY, {});
    delete cache[studentId];
    writeJson(CLOUD_ROW_STORAGE_KEY, cache);
  } catch { /* best effort */ }
}

function cacheCloudRows(studentId, rows = []) {
  const cache = readJson(CLOUD_ROW_STORAGE_KEY, {});
  cache[studentId] = rows;
  writeJson(CLOUD_ROW_STORAGE_KEY, cache);
}

export function getCachedCloudProgressRows(studentId) {
  return readJson(CLOUD_ROW_STORAGE_KEY, {})[studentId] || [];
}

export function configureProgressSync(session = null) {
  activeSession = session?.studentId ? session : null;
}

export function getActiveProgressSyncSession() {
  return activeSession;
}

function enqueueWrite(entry) {
  const queue = readJson(SYNC_QUEUE_KEY, []);
  writeJson(SYNC_QUEUE_KEY, [
    ...queue.filter(item => !(item.studentId === entry.studentId && item.area === entry.area && item.key === entry.key)),
    { ...entry, queuedAt: new Date().toISOString() }
  ]);
}

async function saveCloudProgress(entry) {
  if (!entry?.studentId) return;

  if (entry.mode === "student" && entry.token) {
    const { data, error } = await supabase.rpc("student_save_progress", {
      p_token: entry.token,
      p_area: entry.area,
      p_key: entry.key,
      p_payload: entry.payload
    });
    if (error || data?.ok === false) throw error || new Error(data?.error || "student_save_progress failed");
    return;
  }

  const { error } = await supabase
    .from("student_progress")
    .upsert({
      student_id: entry.studentId,
      area: entry.area,
      key: entry.key,
      payload: entry.payload,
      updated_at: new Date().toISOString()
    }, { onConflict: "student_id,area,key" });
  if (error) throw error;
}

async function flushEntry(entry) {
  try {
    await saveCloudProgress(entry);
    const queue = readJson(SYNC_QUEUE_KEY, []);
    writeJson(SYNC_QUEUE_KEY, queue.filter(item =>
      !(item.studentId === entry.studentId && item.area === entry.area && item.key === entry.key)
    ));
  } catch {
    enqueueWrite(entry);
  }
}

export function queueProgressSave(area, key, payload, { scopeKey } = {}) {
  if (!activeSession?.studentId || activeSession.studentId !== scopeKey) return;
  const entry = {
    mode: activeSession.mode || "teacher",
    token: activeSession.token || "",
    studentId: activeSession.studentId,
    area,
    key,
    payload
  };
  const timerKey = `${entry.studentId}:${area}:${key}`;
  window.clearTimeout?.(pendingTimers.get(timerKey));
  const timer = window.setTimeout(() => {
    pendingTimers.delete(timerKey);
    void flushEntry(entry);
  }, SAVE_DEBOUNCE_MS);
  pendingTimers.set(timerKey, timer);
}

export async function flushQueuedProgressWrites(session = activeSession) {
  if (!session?.studentId) return;
  const queue = readJson(SYNC_QUEUE_KEY, []);
  const own = queue.filter(item => item.studentId === session.studentId);
  for (const item of own) {
    await flushEntry({
      ...item,
      mode: session.mode || item.mode || "teacher",
      token: session.token || item.token || ""
    });
  }
}

export async function fetchStudentCloudProgress(session) {
  if (!session?.studentId) return [];
  if (session.mode === "student" && session.token) {
    const { data, error } = await supabase.rpc("student_get_progress", { p_token: session.token });
    if (error) throw error;
    return data || [];
  }

  const { data, error } = await supabase
    .from("student_progress")
    .select("area, key, payload, updated_at")
    .eq("student_id", session.studentId);
  if (error) throw error;
  return data || [];
}

// If a teacher reset this student more recently than this device has applied,
// wipe the device's local progress before merging - so a reset propagates to
// every shared iPad, not just the one the teacher used. The reset itself leaves
// an empty cloud (just the sentinel), so after this there is nothing to merge.
function applyResetTombstone(studentId, rows) {
  if (!isBrowser() || !studentId) return;
  const resetRow = rows.find(row => row.area === RESET_AREA);
  const cloudResetAt = resetRow?.payload?.at || "";
  const markerKey = `${RESET_APPLIED_PREFIX}${studentId}`;
  let appliedAt = "";
  try { appliedAt = window.localStorage.getItem(markerKey) || ""; } catch { /* ignore */ }
  if (shouldApplyReset(cloudResetAt, appliedAt)) {
    clearLocalProgressForStudent(studentId);
    try { window.localStorage.setItem(markerKey, cloudResetAt); } catch { /* ignore */ }
  }
}

export async function hydrateCloudProgress(session) {
  const rows = await fetchStudentCloudProgress(session);
  applyResetTombstone(session.studentId, rows);
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
      detail: { studentId: session.studentId, rows }
    }));
  }
  return rows;
}

export function clearProgressSyncSession() {
  activeSession = null;
  pendingTimers.forEach(timer => window.clearTimeout?.(timer));
  pendingTimers.clear();
}

/* Lightweight engagement logging. Records a learning event to the existing
   `learn_activity` table via the student_log_activity RPC so we can see real
   usage (daily missions, streaks). Fire-and-forget: it only runs for a signed-in
   student session and NEVER throws into the child experience. */
export function logStudentActivity(area, itemId = null, event = "done", payload = null) {
  if (!isBrowser()) return;
  const session = activeSession;
  if (!session || session.mode !== "student" || !session.token) return;
  try {
    const result = supabase.rpc("student_log_activity", {
      p_token: session.token,
      p_area: area,
      p_item_id: itemId,
      p_event: event,
      p_payload: payload
    });
    // Swallow any rejection; analytics must never surface an error to the UI.
    if (result && typeof result.then === "function") {
      result.then(() => {}, () => {});
    }
  } catch {
    // Never let logging break gameplay.
  }
}
