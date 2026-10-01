import { Howl, Howler } from 'howler';
import { playOwnedClip } from './audio/playOwnedClip.js';
import { isKnownBadAudioPath } from '../data/knownBadWordAudio.js';
import { duckGameMusic, restoreGameMusic } from './audio/gameMusic.js';

// Only this engine's clips are owned here. Pause preserves the sound id and
// watchdog's remaining foreground time; resume continues the SAME recording.
export function createDrumTrailVoice({ enabled = () => true, makeHowl = src => new Howl({ src: [src], html5: true, preload: true }), duck = duckGameMusic, restore = restoreGameMusic } = {}) {
  const cache = new Map(), timers = new Set();
  let active = null, paused = false, disposed = false;
  const arm = timer => { timer.started = performance.now(); timer.id = setTimeout(() => { timers.delete(timer); timer.fn(); }, timer.remaining); };
  // A failed/blocked word load gets a supported fallback after five foreground
  // seconds. Once playing, preserve playOwnedClip's full duration-aware guard.
  const schedule = (fn, ms) => { const remaining = active?.howl.state() !== 'loaded' ? Math.min(ms, 5000) : ms; const timer = { fn, remaining, id: null, started: performance.now() }; timers.add(timer); if (!paused) arm(timer); return timer; };
  const clear = timer => { if (!timer) return; clearTimeout(timer.id); timers.delete(timer); };
  const audible = () => enabled() && !Howler._muted && Howler.volume() > 0;
  const restoreOwnedMix = current => { if (!current?.mixDucked) return; current.mixDucked = false; restore(current); };
  const duckOwnedMix = current => { if (active !== current || paused || !audible()) return; current.mixDucked = true; duck(current); };
  const cancel = () => { const current = active; active = null; current?.controller.abort(); restoreOwnedMix(current); };
  return {
    async play(src, { onStart } = {}) {
      cancel();
      if (disposed || !src || isKnownBadAudioPath(src) || !audible()) return { status: 'unavailable' };
      if (!cache.has(src)) {
        if (cache.size >= 10) { const [old, howl] = cache.entries().next().value; howl.unload(); cache.delete(old); }
        cache.set(src, makeHowl(src));
      }
      const howl = cache.get(src), controller = new AbortController();
      const current = { howl, controller, id: null, audible: true, mixDucked: false };
      active = current;
      const onPlay = id => {
        if (active !== current || disposed) return;
        current.id = id;
        if (paused) { howl.pause(id); return; }
        if (!audible()) current.audible = false;
        duckOwnedMix(current); onStart?.();
      };
      howl.on('play', onPlay);
      try {
        const ended = await playOwnedClip(howl, src, { signal: controller.signal, schedule, clear });
        return { status: ended && current.audible && audible() ? 'delivered' : ended ? 'unavailable' : 'interrupted' };
      } catch { return { status: 'unavailable' }; }
      finally { howl.off('play', onPlay); restoreOwnedMix(current); if (active === current) active = null; }
    },
    pause() {
      if (paused) return; paused = true;
      for (const timer of timers) { timer.remaining = Math.max(0, timer.remaining - (performance.now() - timer.started)); clearTimeout(timer.id); timer.id = null; }
      if (active?.id != null) active.howl.pause(active.id);
    },
    resume() {
      if (!paused || disposed) return; paused = false;
      for (const timer of timers) arm(timer);
      // Retain the quiet mix while paused. The player owns music suspension;
      // this owner never starts music. Re-duck a newly resumed player track
      // both before the same sound id resumes and on its actual play event.
      if (active?.id != null) { duckOwnedMix(active); active.howl.play(active.id); }
    },
    cancel,
    dispose() { disposed = true; cancel(); for (const timer of timers) clear(timer); for (const howl of cache.values()) howl.unload(); cache.clear(); },
  };
}
