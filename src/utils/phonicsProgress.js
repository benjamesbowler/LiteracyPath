const STORAGE_PREFIX = "lp_phonics_progress_";

export function loadPhonicsProgress(scopeKey) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + scopeKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function savePhonicsProgress(scopeKey, progress) {
  try {
    localStorage.setItem(STORAGE_PREFIX + scopeKey, JSON.stringify(progress));
  } catch {
    // Storage may be unavailable in private browsing or locked-down webviews.
  }
}
