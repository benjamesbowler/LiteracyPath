// Instrument input remains immediate. Teaching recordings serialize their real
// playback lifetime; rapid exploration keeps the latest unit and final blend.
export function createSoundKeysCueQueue({ play, onPending = () => {} }) {
  let active = null, unit = null, blend = null, disposed = false;
  const idleWaiters = new Set();
  function settleIdle() {
    if (active || unit || blend) return;
    for (const resolve of idleWaiters) resolve();
    idleWaiters.clear();
  }
  function drain() {
    if (disposed || active) return;
    const next = unit || blend;
    if (unit) unit = null; else blend = null;
    if (next) start(next); else settleIdle();
  }
  function start(request) {
    const controller = new AbortController();
    active = { request, controller }; onPending(true);
    void Promise.resolve().then(() => play(request, { signal: controller.signal })).catch(() => false).finally(() => {
      if (active?.controller !== controller) return;
      active = null; onPending(false); drain();
    });
  }
  function cancel() {
    const old = active; active = null; unit = blend = null;
    old?.controller.abort(); onPending(false); settleIdle();
  }
  return {
    request(value, { manual = false } = {}) {
      if (disposed) return;
      const request = structuredClone(value);
      if (manual) { cancel(); start(request); }
      else if (!active) start(request);
      else if (request.kind === 'blend') blend = request;
      else unit = request;
    },
    whenIdle() {
      return active || unit || blend ? new Promise(resolve => idleWaiters.add(resolve)) : Promise.resolve();
    },
    inspect() { return structuredClone({ active: active?.request || null, unit, blend, disposed }); },
    pending: () => Boolean(active || unit || blend),
    cancel,
    dispose() { disposed = true; cancel(); }
  };
}
