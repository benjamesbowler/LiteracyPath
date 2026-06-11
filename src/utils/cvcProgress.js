import { queueProgressSave } from "./progressSync.js";

const STORAGE_PREFIX = "lp_cvc_progress_";
const VALID_STATUSES = new Set(["default", "inprogress", "completed", "locked"]);

function normalizeStatus(value) {
  if (VALID_STATUSES.has(value)) return value;
  if (value && typeof value === "object") {
    if (VALID_STATUSES.has(value.status)) return value.status;
    const recovered = Object.keys(value)
      .filter(key => /^\d+$/.test(key))
      .sort((a, b) => Number(a) - Number(b))
      .map(key => value[key])
      .join("");
    if (VALID_STATUSES.has(recovered)) return recovered;
  }
  return "";
}

function normalizeProgressMap(progress = {}) {
  return Object.fromEntries(
    Object.entries(progress || {})
      .map(([key, payload]) => [key, normalizeStatus(payload)])
      .filter(([, status]) => status)
  );
}

export function loadCvcProgress(scopeKey) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + scopeKey);
    return raw ? normalizeProgressMap(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

export function saveCvcProgress(scopeKey, progress) {
  try {
    const normalized = normalizeProgressMap(progress);
    localStorage.setItem(STORAGE_PREFIX + scopeKey, JSON.stringify(normalized));
    Object.entries(normalized).forEach(([key, status]) => {
      queueProgressSave("cvc", key, { v: 2, status }, { scopeKey });
    });
  } catch {
    // Storage may be unavailable in private browsing or locked-down webviews.
  }
}
