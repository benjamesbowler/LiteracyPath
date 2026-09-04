// Sound Seekers v3 — the only file in v3 that touches localStorage / sync.
// Kept out of the engine so everything else stays Node-testable.

import { queueProgressSave } from "../../../utils/progressSync.js";
import { localProgressStorageKey } from "../../../utils/progressKeys.js";
import { normalizeProgress } from "./engine/progress.js";

const AREA = "phonics_quest";
const KEY = "sound_seekers_v3";

export function storageKey(scopeKey = "default") {
  return `${localProgressStorageKey(AREA, scopeKey)}:v3`;
}

export function loadV3Progress(scopeKey = "default") {
  if (typeof window === "undefined") return normalizeProgress(null);
  try {
    const raw = JSON.parse(window.localStorage.getItem(storageKey(scopeKey)) || "null");
    return normalizeProgress(raw);
  } catch {
    return normalizeProgress(null);
  }
}

let timer = null;
export function saveV3Progress(scopeKey = "default", progress) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(scopeKey), JSON.stringify(progress));
  } catch {
    // storage full or blocked — play continues; sync below still tries
  }
  // one upload per burst of saves
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    try {
      queueProgressSave(AREA, KEY, progress, { scopeKey });
    } catch {
      // offline or unauthenticated: local save already happened
    }
  }, 800);
}
