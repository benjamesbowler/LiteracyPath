import { queueProgressSave } from "./progressSync.js";

const STORAGE_PREFIX = "lp_cvc_progress_";

export function loadCvcProgress(scopeKey) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + scopeKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCvcProgress(scopeKey, progress) {
  try {
    localStorage.setItem(STORAGE_PREFIX + scopeKey, JSON.stringify(progress));
    Object.entries(progress || {}).forEach(([key, payload]) => {
      queueProgressSave("cvc", key, { v: 1, ...payload }, { scopeKey });
    });
  } catch {
    // Storage may be unavailable in private browsing or locked-down webviews.
  }
}
