import { normalizeElQuestProgress } from "./adventureMapProgress.js";
import { localProgressStorageKey } from "./progressKeys.js";

// Map and Home intentionally surface corrupt storage as a failed read, while
// the Quest itself lets malformed JSON reach its error boundary. Both paths
// share the epoch normalization once JSON has been read successfully.
export function readElQuestLocalProgress(scopeKey) {
  if (typeof window === "undefined") return { ok: true, value: {} };
  try {
    const raw = window.localStorage.getItem(localProgressStorageKey("el_quest", scopeKey));
    if (!raw) return { ok: true, value: {} };
    return { ok: true, value: normalizeElQuestProgress(JSON.parse(raw)) };
  } catch {
    return { ok: false, value: {} };
  }
}

export function loadElQuestProgress(scopeKey) {
  if (typeof window === "undefined") return normalizeElQuestProgress(null);
  const raw = window.localStorage.getItem(localProgressStorageKey("el_quest", scopeKey));
  return normalizeElQuestProgress(JSON.parse(raw || "null"));
}
