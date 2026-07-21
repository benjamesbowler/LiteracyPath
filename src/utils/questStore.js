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
import {
  reconcileQuestSaveWithStored,
  sanitizeCloudProgressPayload
} from "./progressMerge.js";
import { localProgressStorageKey } from "./progressKeys.js";
import { baseQuestState, normalizeQuestState } from "./questProgress.js";
import {
  QUEST_STORAGE_STATUS_EVENT,
  writeQuestStateWithRecovery
} from "./questStorageRecovery.js";

const DEFAULT_SCOPE = "default";

const warnedStorageScopes = new Set();

export function questProgressStorageKey(scopeKey = DEFAULT_SCOPE) {
  return localProgressStorageKey("phonics_quest", scopeKey);
}

function emitStorageStatus(scopeKey, result) {
  if (typeof window === "undefined" || warnedStorageScopes.has(scopeKey)) return;
  warnedStorageScopes.add(scopeKey);
  window.dispatchEvent(new CustomEvent(QUEST_STORAGE_STATUS_EVENT, {
    detail: {
      scopeKey,
      status: result.ok ? "recovered" : "failed",
      compacted: Boolean(result.compacted)
    }
  }));
}

export function loadQuestProgress(scopeKey = DEFAULT_SCOPE) {
  if (typeof window === "undefined") return baseQuestState();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(questProgressStorageKey(scopeKey)) || "null");
    return normalizeQuestState(parsed);
  } catch {
    // A corrupt save is a bad day; a white screen is a child who never comes
    // back. Always hand back something playable.
    return baseQuestState();
  }
}

export function saveQuestProgress(scopeKey = DEFAULT_SCOPE, state, { syncCloud = true } = {}) {
  let next = normalizeQuestState(state);
  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(
        window.localStorage.getItem(questProgressStorageKey(scopeKey)) || "null"
      );
      if (stored && typeof stored === "object") {
        next = reconcileQuestSaveWithStored(next, stored);
      }
    } catch { /* corrupt/private storage is handled by the recovery writer */ }
    const result = writeQuestStateWithRecovery(
      window.localStorage,
      questProgressStorageKey(scopeKey),
      next
    );
    // The sync queue uses this same localStorage, and anonymous play has no
    // cloud queue at all. Never promise a cloud safety net here: report the
    // first storage failure honestly, after making the bounded recovery pass.
    if (result.recovered || !result.ok) emitStorageStatus(scopeKey, result);
  }
  // TEACHER-OWNED KEYS NEVER TRAVEL UP FROM THE CHILD. The child's client
  // echoes its whole state on every save; with an older `assignment` inside,
  // a Thursday-night offline flush could erase a Friday assignment. The
  // server merge (20260715090000_phonics_quest_merge.sql, live) keeps the
  // existing value when a key is absent from the incoming payload — so the
  // strip is safe AND sufficient. Locally the assignment stays (line above).
  if (syncCloud) {
    const uploadPayload = sanitizeCloudProgressPayload("phonics_quest", next);
    queueProgressSave("phonics_quest", "__all__", uploadPayload, { scopeKey });
  }
  return next;
}
