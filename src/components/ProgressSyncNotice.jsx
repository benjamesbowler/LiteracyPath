import { useEffect, useState, useSyncExternalStore } from "react";
import { flushQueuedProgressWrites, getActiveProgressSyncSession, getProgressSyncState, getVolatileProgressCount } from "../utils/progressSync.js";
import "../styles/progress-sync-notice.css";

function subscribe(listener) {
  window.addEventListener("lp-progress-sync-state", listener);
  return () => window.removeEventListener("lp-progress-sync-state", listener);
}

export default function ProgressSyncNotice({ studentId, sessionMessage = "" }) {
  const state = useSyncExternalStore(subscribe, () => getProgressSyncState(studentId), () => null);
  const [retrying, setRetrying] = useState(false);
  const volatileCount = useSyncExternalStore(subscribe, getVolatileProgressCount, () => 0);
  const pending = (state?.pending || 0) + volatileCount;
  useEffect(() => {
    if (!pending) return undefined;
    const preventLoss = event => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", preventLoss);
    return () => window.removeEventListener("beforeunload", preventLoss);
  }, [pending]);
  if (!studentId && volatileCount) return <aside className="progress-sync-notice" role="status"><p>Some progress is still waiting to save. Keep this page open and sign in again.</p></aside>;
  if (!studentId && sessionMessage) return <aside className="progress-sync-notice" role="status"><p>{sessionMessage}</p></aside>;
  if (!studentId || !pending || state?.status !== "storage-failed") return null;
  const retry = async () => {
    const session = getActiveProgressSyncSession();
    if (session?.studentId !== studentId || retrying) return;
    setRetrying(true);
    try { await flushQueuedProgressWrites(session); }
    finally { setRetrying(false); }
  };
  return <aside className="progress-sync-notice" role="status" aria-label="Saving progress">
    <p>Progress needs help saving. Keep this page open and ask your teacher.</p>
    <button type="button" onClick={retry} disabled={retrying}>
      {retrying ? "Trying to save…" : "Try saving again"}
    </button>
  </aside>;
}
