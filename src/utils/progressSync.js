import { supabase } from "../supabaseClient.js";

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

function localProgressStorageKey(area, scopeKey) {
  const scope = encodeURIComponent(scopeKey || "default");
  if (area === "story_quests") return `literacyPath.storyQuestProgress.v1.${scope}`;
  if (area === "phonics_letters") return `lp_phonics_progress_${scopeKey || "default"}`;
  if (area === "cvc") return `lp_cvc_progress_${scopeKey || "default"}`;
  if (area === "learn_games") return `literacy-guide-learn-games:${scopeKey || "default"}`;
  if (area === "el_quest") return `lp-el-quest:${scopeKey || "default"}`;
  if (area === "daily_mission") return `lp-daily-mission:${scopeKey || "default"}`;
  if (area === "guided_reading") return `literacyPath.guidedReadingRecords.${scope}`;
  return "";
}

function mergePayload(current, incoming) {
  if (!current || typeof current !== "object") return incoming;
  if (!incoming || typeof incoming !== "object") return current;
  if (Array.isArray(current) || Array.isArray(incoming)) return incoming;
  return { ...current, ...incoming };
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

export async function hydrateCloudProgress(session) {
  const rows = await fetchStudentCloudProgress(session);
  cacheCloudRows(session.studentId, rows);
  rows.forEach(row => {
    const storageKey = localProgressStorageKey(row.area, session.studentId);
    if (!storageKey) return;
    const existing = readJson(storageKey, {});
    const next = row.key === "__all__"
      ? mergePayload(existing, row.payload)
      : { ...existing, [row.key]: mergePayload(existing?.[row.key], row.payload) };
    writeJson(storageKey, next);
  });
  await flushQueuedProgressWrites(session);
  return rows;
}

export function clearProgressSyncSession() {
  activeSession = null;
  pendingTimers.forEach(timer => window.clearTimeout?.(timer));
  pendingTimers.clear();
}
