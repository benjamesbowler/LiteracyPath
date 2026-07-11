// SOUND SEEKERS — storage. The only file in the quest that touches localStorage
// or the cloud.
//
// Kept apart from questProgress.js (which holds the pure state transitions)
// because progressSync.js pulls in supabaseClient.js, which reads
// `import.meta.env` — something Node cannot evaluate. Fuse them and every unit
// test for the save file dies on import, before its first assertion. This repo
// already learned that lesson: progressKeys.js says so in its own header.
//
// So: all the LOGIC is testable, and this thin wrapper is the only part that
// isn't.

import { queueProgressSave } from "./progressSync.js";
import { localProgressStorageKey } from "./progressKeys.js";
import { baseQuestState, normalizeQuestState } from "./questProgress.js";

const DEFAULT_SCOPE = "default";

function storageKey(scopeKey = DEFAULT_SCOPE) {
  return localProgressStorageKey("phonics_quest", scopeKey);
}

export function loadQuestProgress(scopeKey = DEFAULT_SCOPE) {
  if (typeof window === "undefined") return baseQuestState();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey(scopeKey)) || "null");
    return normalizeQuestState(parsed);
  } catch {
    // A corrupt save is a bad day; a white screen is a child who never comes
    // back. Always hand back something playable.
    return baseQuestState();
  }
}

export function saveQuestProgress(scopeKey = DEFAULT_SCOPE, state) {
  const next = normalizeQuestState(state);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey(scopeKey), JSON.stringify(next));
  }
  queueProgressSave("phonics_quest", "__all__", next, { scopeKey });
  return next;
}
