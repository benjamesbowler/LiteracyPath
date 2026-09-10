// A travelling game object owns its cue, including playback queued during load.
// Aborting that object must not stop another game's feedback or ambient sound.
export function playOwnedClip(howl, src, { signal, onStart } = {}) {
  if (signal?.aborted) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    let settled = false;
    let soundId;
    const onEnd = () => settle(resolve, src);
    const onStop = () => settle(resolve, null);
    const onError = () => settle(reject, new Error(`Unable to play ${src}`));
    const onPlay = () => { if (!settled) onStart?.(); };
    const onAbort = () => {
      settle(resolve, null);
      if (soundId != null) howl.stop(soundId);
    };
    function settle(finish, value) {
      if (settled) return;
      settled = true;
      for (const [event, callback] of handlers) howl.off(event, callback, soundId);
      howl.off('load', start);
      howl.off('loaderror', onError);
      signal?.removeEventListener('abort', onAbort);
      finish(value);
    }
    const handlers = [['end', onEnd], ['stop', onStop], ['loaderror', onError], ['playerror', onError], ['play', onPlay]];
    function start() {
      if (settled || signal?.aborted) return;
      howl.off('loaderror', onError);
      soundId = howl.play();
      if (soundId == null) { onError(); return; }
      for (const [event, callback] of handlers) howl.once(event, callback, soundId);
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
