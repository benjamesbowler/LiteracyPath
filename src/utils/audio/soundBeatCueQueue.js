// Speech owns its real playback lifetime; input and the musical clock remain
// independent. A final blend never displaces a queued final-unit model.
export function createSoundBeatCueQueue({ now, settleSeconds, play, onPending = () => {}, onSettled = () => {} }) {
  let active = null, unit = null, blend = null, endedAt = -Infinity, disposed = false;
  function start(request) {
    const controller = new AbortController(); active = { request, controller }; onPending(true);
    void Promise.resolve().then(() => play(request, { signal: controller.signal })).catch(() => false).finally(() => {
      if (active?.controller !== controller) return;
      active = null; endedAt = now(); onPending(false); onSettled(endedAt);
    });
  }
  function cancel() {
    const prior = active; active = null; unit = null; blend = null;
    prior?.controller.abort(); onPending(false);
  }
  function request(value, { manual = false } = {}) {
    if (disposed) return;
    const cue = structuredClone(value);
    if (manual) { cancel(); start(cue); return; }
    if (active || now() < endedAt + settleSeconds) {
      if (cue.kind === 'blend') blend = cue;
      else unit = cue;
      return;
    }
    start(cue);
  }
  function pump() {
    if (disposed || active || now() < endedAt + settleSeconds) return;
    if (unit) { const cue = unit; unit = null; start(cue); }
    else if (blend) { const cue = blend; blend = null; start(cue); }
  }
  return { request, pump, cancel, pending: () => Boolean(active), queued: () => Boolean(unit || blend),
    inspect: () => ({ active: active && structuredClone(active.request), unit: unit && structuredClone(unit), blend: blend && structuredClone(blend), endedAt }),
    dispose() { disposed = true; cancel(); } };
}
