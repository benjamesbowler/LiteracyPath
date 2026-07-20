// Pure helpers for the Sound Seekers local save recovery path.
//
// This module deliberately knows nothing about React, Supabase, or the browser
// global. questStore passes in window.localStorage, which keeps the recovery
// policy deterministic and unit-testable.

export const QUEST_STORAGE_STATUS_EVENT = "lp-quest-storage-state";
export const CLOUD_PROGRESS_CACHE_KEY = "lp-cloud-progress-rows-v1";
export const RECOVERY_TELEMETRY_SESSION_LIMIT = 12;

export function compactQuestStateForStorage(state = {}) {
  const telemetry = state?.telemetry && typeof state.telemetry === "object"
    ? state.telemetry
    : {};
  return {
    ...state,
    telemetry: {
      ...telemetry,
      sessions: Array.isArray(telemetry.sessions)
        ? telemetry.sessions.slice(-RECOVERY_TELEMETRY_SESSION_LIMIT)
        : [],
      current: telemetry.current || null
    }
  };
}

function tryWrite(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// Preserve learning progress first. A stale cloud-row cache is reproducible,
// and old diagnostic sessions are lower-value than the child's current quest
// state, so they are the only data sacrificed during quota recovery.
export function writeQuestStateWithRecovery(storage, key, state) {
  if (!storage || !key) return { ok: false, recovered: false, compacted: false };
  if (tryWrite(storage, key, state)) {
    return { ok: true, recovered: false, compacted: false };
  }

  try { storage.removeItem(CLOUD_PROGRESS_CACHE_KEY); } catch { /* best effort */ }
  if (tryWrite(storage, key, state)) {
    return { ok: true, recovered: true, compacted: false };
  }

  const compacted = compactQuestStateForStorage(state);
  if (tryWrite(storage, key, compacted)) {
    return { ok: true, recovered: true, compacted: true };
  }

  return { ok: false, recovered: true, compacted: true };
}
