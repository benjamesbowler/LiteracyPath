import {
  emptyElQuestProgress,
  isCurrentElQuestProgress,
  isFutureElQuestProgress,
  isMalformedCurrentElQuestProgress,
  mergeElQuestProgress,
  normalizeElQuestProgress
} from "./adventureMapProgress.js";
import { localProgressStorageKey } from "./progressKeys.js";
import {
  getCachedCloudProgressRows,
  queueProgressSave
} from "./progressSync.js";

// Map, Home, and the Quest all surface unreadable storage as a failed read.
// Once JSON is readable and structurally valid, they share one epoch boundary.
export function readElQuestLocalProgress(scopeKey) {
  if (typeof window === "undefined") return { ok: true, value: {} };
  try {
    const raw = window.localStorage.getItem(localProgressStorageKey("el_quest", scopeKey));
    if (raw === null) return { ok: true, value: {} };
    const parsed = JSON.parse(raw);
    if (isFutureElQuestProgress(parsed)) {
      return { ok: false, reason: "unsupported_version", value: {} };
    }
    if (isMalformedCurrentElQuestProgress(parsed)) {
      return { ok: false, value: {} };
    }
    return { ok: true, value: normalizeElQuestProgress(parsed) };
  } catch {
    return { ok: false, value: {} };
  }
}

// Corrupt Adventure Map JSON must remain an explicit failed read until the
// child chooses this narrowly scoped recovery action. Recovery replaces this
// one key with valid v2 state and queues that same state, so malformed cloud
// data cannot rematerialise on the next hydration. A valid cached cloud row is
// folded forward first; a newer client's row is materialised but never queued
// back by this older client.
export function clearElQuestLocalProgress(scopeKey) {
  if (typeof window === "undefined") return false;
  const empty = emptyElQuestProgress();
  const cachedRow = getCachedCloudProgressRows(scopeKey).find(row => (
    row?.area === "el_quest" && row?.key === "__all__"
  ));
  const cached = cachedRow?.payload;
  const recovered = isFutureElQuestProgress(cached)
    ? cached
    : isCurrentElQuestProgress(cached)
      ? mergeElQuestProgress(empty, cached)
      : empty;
  try {
    window.localStorage.setItem(
      localProgressStorageKey("el_quest", scopeKey),
      JSON.stringify(recovered)
    );
  } catch {
    return false;
  }
  if (!isFutureElQuestProgress(recovered)) {
    queueProgressSave("el_quest", "__all__", recovered, { scopeKey });
  }
  return true;
}

export function loadElQuestProgress(scopeKey) {
  const read = readElQuestLocalProgress(scopeKey);
  if (read.ok) return read.value;
  if (read.reason === "unsupported_version") {
    const error = new Error("Adventure Map progress was saved by a newer app version.");
    error.code = "el_quest_progress_unsupported_version";
    throw error;
  }
  throw new SyntaxError("Adventure Map progress could not be read.");
}
