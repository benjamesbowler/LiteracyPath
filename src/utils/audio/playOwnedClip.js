// A travelling game object owns its cue, including playback queued during load.
// Aborting that object must not stop another game's feedback or ambient sound.
export function playOwnedClip(howl, src, { signal, onStart, onEnd: onDelivered, schedule = setTimeout, clear = clearTimeout } = {}) {
  if (signal?.aborted) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    let settled = false;
    let soundId;
    let watchdog = schedule(onErrorTimeout, 15000);
    function onErrorTimeout() { onError(); if (soundId != null) howl.stop(soundId); }
    const onEnd = () => settle(resolve, src, true);
    const onStop = () => settle(resolve, null);
    const onError = () => settle(reject, new Error(`Unable to play ${src}`));
    const onPlay = () => { if (!settled) onStart?.(); };
    const onAbort = () => {
      settle(resolve, null);
      if (soundId != null) howl.stop(soundId);
    };
    function settle(finish, value, delivered = false) {
      if (settled) return;
      settled = true;
      clear(watchdog);
      for (const [event, callback] of handlers) howl.off(event, callback, soundId);
      howl.off('load', start);
      howl.off('loaderror', onError);
      signal?.removeEventListener('abort', onAbort);
      // Only the owned sound's actual end event confirms delivery. Observation
      // runs before the promise resolves, after terminal ownership is released.
      if (delivered) {
        try { onDelivered?.(src); } catch { /* An observer cannot turn completed audio into failed playback. */ }
      }
      finish(value);
    }
    const handlers = [['end', onEnd], ['stop', onStop], ['loaderror', onError], ['playerror', onError], ['play', onPlay]];
    function start() {
      if (settled || signal?.aborted) return;
      howl.off('loaderror', onError);
      soundId = howl.play();
      if (soundId == null) { onError(); return; }
      for (const [event, callback] of handlers) howl.once(event, callback, soundId);
      clear(watchdog);
      const duration = Number(howl.duration?.(soundId));
      watchdog = schedule(onErrorTimeout, Number.isFinite(duration) && duration > 0 ? Math.max(5000, duration * 1000 + 2000) : 30000);
    }
    // Howler queues play followed by stop when unloaded. Do not enqueue play
    // at all until load completes: a departed object's voice must stay silent.
    if (howl.state() === 'loaded') start();
    else {
      howl.once('load', start);
      howl.once('loaderror', onError);
      if (howl.state() === 'unloaded') howl.load();
    }
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) onAbort();
  });
}
