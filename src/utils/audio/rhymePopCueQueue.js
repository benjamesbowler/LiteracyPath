// Accepted physical pops each own their spoken name. Wrong feedback is one
// selected-word/anchor packet, so coalescing cannot detach its contrast.
// This queue owns only teaching playback; aim, movement and fire never wait.
export function createRhymePopCueQueue({ play }) {
  let active = null, disposed = false;
  const pending = [], waiters = new Set(), requiredWaiters = new Set(), maxPackets = 8;
  const settleRequired = () => {
    if (active?.required || pending.some(packet => packet.required)) return;
    for (const resolve of requiredWaiters) resolve();
    requiredWaiters.clear();
  };
  const settle = () => {
    settleRequired();
    if (active || pending.length) return;
    for (const resolve of waiters) resolve();
    waiters.clear();
  };
  function drain() {
    if (disposed || active) return;
    const packet = pending.shift();
    if (!packet) { settle(); return; }
    const controller = new AbortController();
    active = { ...packet, index: 0, controller };
    void (async () => {
      for (let index = 0; index < packet.items.length; index++) {
        if (disposed || controller.signal.aborted || active?.controller !== controller) return;
        active.index = index;
        try { await play(packet.items[index], { signal: controller.signal }); }
        catch { /* media failure settles without claiming a delivered cue */ }
      }
    })().finally(() => {
      if (active?.controller !== controller) return;
      active = null; settleRequired(); drain();
    });
  }
  function cancel() {
    const previous = active; active = null; pending.length = 0;
    previous?.controller.abort(); settle();
  }
  return {
    request(value, { manual = false, replaceKey = null, required = false } = {}) {
      if (disposed) return;
      const items = structuredClone(Array.isArray(value) ? value : [value]);
      if (!items.length) return;
      if (manual) cancel();
      if (replaceKey) for (let index = pending.length-1; index >= 0; index--)
        if (pending[index].replaceKey === replaceKey) pending.splice(index, 1);
      // A family has six accepted names and at most one replaceable contrast.
      // Keep a defensive ceiling if a future caller violates that contract.
      if (pending.length >= maxPackets) return false;
      pending.push({ items, replaceKey, required }); drain(); return true;
    },
    whenIdle() { return active || pending.length ? new Promise(resolve => waiters.add(resolve)) : Promise.resolve(); },
    whenRequiredIdle() { return active?.required || pending.some(packet => packet.required)
      ? new Promise(resolve => requiredWaiters.add(resolve)) : Promise.resolve(); },
    pending: () => Boolean(active || pending.length),
    inspect: () => structuredClone({ active: active && { items: active.items, index: active.index, replaceKey: active.replaceKey, required: active.required }, pending, maxPackets, disposed }),
    cancel,
    dispose() { disposed = true; cancel(); }
  };
}
