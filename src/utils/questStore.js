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
    try {
      window.localStorage.setItem(storageKey(scopeKey), JSON.stringify(next));
    } catch {
      // Quota/private-mode failures must never throw into a React handler and
      // white-screen a child mid-game. The cloud queue below still carries
      // the progress; local storage catches up on the next successful save.
    }
  }
  // TEACHER-OWNED KEYS NEVER TRAVEL UP FROM THE CHILD. The child's client
  // echoes its whole state on every save; with an older `assignment` inside,
  // a Thursday-night offline flush could erase a Friday assignment. The
  // server merge (20260715090000_phonics_quest_merge.sql, live) keeps the
  // existing value when a key is absent from the incoming payload — so the
  // strip is safe AND sufficient. Locally the assignment stays (line above).
  const { assignment, ...uploadPayload } = next;
  void assignment;
  queueProgressSave("phonics_quest", "__all__", uploadPayload, { scopeKey });
  return next;
}
