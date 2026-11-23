import { useState, useSyncExternalStore } from "react";
import { hasVolatileProgress, retryVolatileProgress } from "../utils/progressReloadGuard.js";

function subscribe(listener) {
  window.addEventListener("lp-progress-sync-state", listener);
  return () => window.removeEventListener("lp-progress-sync-state", listener);
}

export function ProgressSafeReload({ children = "Reload page", className, style }) {
  const pending = useSyncExternalStore(subscribe, hasVolatileProgress, () => false);
  const [retrying, setRetrying] = useState(false);
  const [retryFailed, setRetryFailed] = useState(false);

  async function retry() {
    setRetrying(true);
    setRetryFailed(false);
    try { setRetryFailed(!await retryVolatileProgress()); }
    catch { setRetryFailed(true); }
    finally { setRetrying(false); }
  }

  if (pending) return <div>
    <p role="status">{retryFailed
      ? "Progress still needs help saving. Keep this page open and ask your teacher."
      : "Some progress is waiting to save. Keep this page open."}</p>
    <button type="button" className={className} style={style} disabled={retrying} onClick={() => void retry()}>
      {retrying ? "Trying to save…" : "Try saving again"}
    </button>
  </div>;

  return <button type="button" className={className} style={style} onClick={() => {
    if (!hasVolatileProgress()) window.location.reload();
  }}>
    {children}
  </button>;
}
