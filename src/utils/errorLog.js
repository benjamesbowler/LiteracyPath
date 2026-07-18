// Crash log — a localStorage ring buffer (last 20 render errors). There is no
// external crash service wired up, so this is the flight recorder: every
// ErrorBoundary catch lands here and the admin dashboard surfaces it
// (REVIEW.md, Engineer #7). Storage failures are swallowed — logging must
// never become a second crash.
const ERROR_LOG_KEY = "lp-error-log";
const ERROR_LOG_LIMIT = 20;

export function readErrorLog() {
  try {
    const raw = window.localStorage.getItem(ERROR_LOG_KEY);
    const rows = raw ? JSON.parse(raw) : [];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export function clearErrorLog() {
  try {
    window.localStorage.removeItem(ERROR_LOG_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function logBoundaryError(label, error) {
  try {
    const rows = readErrorLog();
    rows.unshift({
      at: new Date().toISOString(),
      label: String(label || "app"),
      message: String(error?.message || error || "unknown error").slice(0, 300),
      stack: String(error?.stack || "").slice(0, 2000)
    });
    window.localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(rows.slice(0, ERROR_LOG_LIMIT)));
  } catch {
    /* storage unavailable */
  }
}
