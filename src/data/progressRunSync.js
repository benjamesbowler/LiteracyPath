import { isTemporaryProgressFailure, persistProgressRun, saveProgressRunLocal } from "./progressTestStore.js";

// Local evidence is committed before the UI advances. Only the newest queued
// snapshot is uploaded; its immutable prefix contains every earlier answer.
export function createProgressRunSync({ client, token, onState, onSaved }) {
  let pending = null, latest = null, active = null, disposed = false, retryTimer, failures = 0;
  const publish = state => { if (!disposed) onState?.(state); };
  async function drain() {
    while (pending && !disposed) {
      const run = pending; pending = null;
      try {
        const result = await persistProgressRun(run, { client, token });
        if (disposed) return;
        failures = 0;
        if (result.attempt) onSaved?.(result.attempt);
        if (!pending) publish({ status: result.cloudSaved && latest?.run === run ? "saved" : "device", localSaved: Boolean(latest?.localSaved) });
      } catch (error) {
        if (disposed) return;
        pending ||= latest?.run;
        publish({ status: "error", error, localSaved: Boolean(latest?.localSaved) });
        if (isTemporaryProgressFailure(error)) retryTimer = setTimeout(retry, Math.min(30000, 2000 * 2 ** failures++));
        throw error;
      }
    }
  }
  function retry() {
    clearTimeout(retryTimer);
    if (disposed) return Promise.resolve();
    pending ||= latest?.run;
    if (!active) {
      publish({ status: "pending", localSaved: Boolean(latest?.localSaved) });
      active = drain().finally(() => { active = null; });
      active.catch(() => {});
    }
    return active;
  }
  function checkpoint(run, { upload = true } = {}) {
    let localSaved = false;
    try { localSaved = saveProgressRunLocal(run); } catch {
      // A full/unavailable device store still queues this exact snapshot.
      // persistProgressRun checks the learner-reset guard before any RPC.
    }
    latest = { run, localSaved };
    const mustUpload = upload || !localSaved;
    if (mustUpload || pending) pending = run;
    const promise = mustUpload ? retry() : active || Promise.resolve();
    if (!mustUpload && !active) publish({ status: "device", localSaved });
    return { localSaved, promise };
  }
  function dispose() { disposed = true; pending = null; clearTimeout(retryTimer); }
  return { checkpoint, retry, dispose };
}
