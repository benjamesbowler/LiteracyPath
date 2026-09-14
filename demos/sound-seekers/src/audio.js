import { DEMO_WORDS, NARRATION } from './content.js';

const PHONEMES = ['a', 'b', 'c', 'd', 'e', 'g', 'i', 'l', 'm', 'n', 'o', 'p', 's', 't', 'u', 'v'];
export const AUDIO = Object.freeze({
  ...Object.fromEntries(Object.keys(NARRATION).map(key => [key, `/assets/audio/${key}.mp3`])),
  ...Object.fromEntries(DEMO_WORDS.map(word => [`word:${word}`, `/assets/audio/word-${word}.mp3`])),
  ...Object.fromEntries(PHONEMES.map(sound => [`phoneme:${sound}`, `/assets/audio/phoneme-${sound}.mp3`])),
});

/** One speech owner, one unlocked Web Audio context. The same context serves
 * every clip on iPad, so changing words does not create a fresh autoplay gate.
 * play/sequence resolve true only after the entire still-current cue finishes.
 * Cancellation, mute, missing media and gesture restrictions resolve false.
 * No browser speech is used for either words or phonemes.
 */
export function createAudio({
  catalog = AUDIO,
  AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext,
  fetcher = globalThis.fetch?.bind(globalThis),
  onError = () => {},
  onSpeakingChange = () => {},
} = {}) {
  let context = null;
  let voiceGain = null;
  let effectsGain = null;
  let generation = 0;
  let current = null;
  let cancelSequence = null;
  let disposed = false;
  let muted = false;
  const decoded = new Map();
  const failed = new Set();
  const requests = new Set();
  const effects = new Map();

  function report(code, path = '', error = null) {
    try { onError({ code, path, error }); } catch { /* Audio recovery stays usable. */ }
  }

  function ensureContext() {
    if (disposed || !AudioContextClass) return null;
    if (!context) {
      context = new AudioContextClass();
      voiceGain = context.createGain();
      voiceGain.gain.value = 0.95;
      voiceGain.connect(context.destination);
      effectsGain = context.createGain();
      effectsGain.gain.value = 0.08;
      effectsGain.connect(context.destination);
    }
    return context;
  }

  // Call directly inside the Start/Continue/tap gesture, before awaiting work.
  async function unlock() {
    if (disposed) return false;
    try {
      const audioContext = ensureContext();
      if (!audioContext) { report('unsupported'); return false; }
      const resumed = audioContext.state === 'running' ? Promise.resolve() : audioContext.resume();
      // This silent source primes mobile Safari during the actual gesture.
      const primer = audioContext.createBufferSource();
      primer.buffer = audioContext.createBuffer(1, 1, audioContext.sampleRate);
      primer.connect(audioContext.destination);
      primer.onended = () => primer.disconnect();
      primer.start();
      await resumed;
      return !disposed && audioContext.state === 'running';
    } catch (error) {
      report('gesture-required', '', error);
      return false;
    }
  }

  function resolvePath(keyOrPath) {
    if (typeof keyOrPath !== 'string') return '';
    return catalog[keyOrPath] || (/^\/assets\/audio\/[a-z0-9-]+\.mp3$/.test(keyOrPath) ? keyOrPath : '');
  }

  function load(path) {
    if (decoded.has(path)) return decoded.get(path);
    const pending = (async () => {
      const audioContext = ensureContext();
      if (!audioContext || !fetcher) throw new Error('Audio playback is unavailable.');
      const controller = new AbortController();
      requests.add(controller);
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        // A failed response may itself be cached (including an HTML fallback).
        // A deliberate replay must fetch the restored recording again.
        const response = await fetcher(path, { signal: controller.signal, cache: failed.has(path) ? 'reload' : 'force-cache' });
        if (!response.ok) throw new Error(`Audio request failed: ${response.status}`);
        const bytes = await response.arrayBuffer();
        if (disposed) throw new Error('Audio player disposed.');
        const buffer = await audioContext.decodeAudioData(bytes);
        if (!(buffer.duration > 0) || !buffer.length) throw new Error('Audio file has no decodable signal.');
        failed.delete(path);
        return buffer;
      } finally {
        clearTimeout(timeout);
        requests.delete(controller);
      }
    })();
    decoded.set(path, pending);
    pending.catch(() => { failed.add(path); if (decoded.get(path) === pending) decoded.delete(path); });
    return pending;
  }

  function stopEffects() {
    for (const [effect, envelope] of effects) {
      effect.onended = null;
      try { effect.stop(); } catch { /* It may already have ended. */ }
      effect.disconnect();
      envelope.disconnect();
    }
    effects.clear();
  }

  function stop(stopDecorations = true) {
    generation += 1;
    const cancel = cancelSequence;
    cancelSequence = null;
    cancel?.();
    const old = current;
    if (old) {
      old.source.onended = null;
      try { old.source.stop(); } catch { /* It may already have ended. */ }
      old.finish(false);
    }
    if (stopDecorations) stopEffects();
    onSpeakingChange(false);
  }

  async function sequence(keys = []) {
    stop(false);
    const ticket = generation;
    if (disposed || muted || globalThis.document?.hidden) return false;
    const requested = typeof keys === 'string' ? [keys] : keys;
    if (!Array.isArray(requested) || !requested.length) return false;
    const paths = requested.map(resolvePath);
    if (paths.some(path => !path)) { report('unknown-cue'); return false; }
    const audioContext = ensureContext();
    if (!audioContext || audioContext.state !== 'running') {
      report(audioContext ? 'gesture-required' : 'unsupported');
      return false;
    }
    onSpeakingChange(true);
    const cancelled = new Promise(resolve => { cancelSequence = () => resolve(null); });
    // Load the following clips together to avoid gaps between letter sounds.
    const buffers = paths.map(path => load(path));
    buffers.forEach(pending => pending.catch(() => {}));
    for (let index = 0; index < paths.length; index += 1) {
      let buffer;
      try { buffer = await Promise.race([buffers[index], cancelled]); }
      catch (error) {
        if (ticket === generation && !disposed) {
          report('media-unavailable', paths[index], error);
          onSpeakingChange(false);
        }
        return false;
      }
      if (!buffer || ticket !== generation || disposed || muted || globalThis.document?.hidden) return false;
      if (audioContext.state !== 'running') {
        report('gesture-required', paths[index]);
        onSpeakingChange(false);
        return false;
      }
      const heard = await new Promise(resolve => {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(voiceGain);
        let settled = false;
        let timeout;
        const owned = {
          source,
          finish(value) {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            source.onended = null;
            source.disconnect();
            if (current === owned) current = null;
            resolve(value);
          },
        };
        current = owned;
        source.onended = () => owned.finish(ticket === generation && !disposed && !muted);
        timeout = setTimeout(() => {
          try { source.stop(); } catch { /* Safe cancellation after interruption. */ }
          owned.finish(false);
        }, Math.max(1000, buffer.duration * 1000 + 2000));
        try { source.start(); }
        catch (error) { report('playback-failed', paths[index], error); owned.finish(false); }
      });
      if (!heard || ticket !== generation) {
        if (ticket === generation) onSpeakingChange(false);
        return false;
      }
    }
    if (ticket === generation) { cancelSequence = null; onSpeakingChange(false); }
    return ticket === generation && !disposed && !muted;
  }

  // Optional warmup: no sound, no evidence of hearing, and no input gate.
  async function preload(keys = Object.keys(catalog)) {
    if (disposed) return false;
    const paths = [...new Set(keys.map(resolvePath).filter(Boolean))];
    const results = await Promise.allSettled(paths.map(load));
    return results.every(result => result.status === 'fulfilled');
  }

  function sfx(kind = 'tap') {
    if (disposed || muted || !context || context.state !== 'running' || globalThis.document?.hidden) return;
    const phrases = {
      tap: [[660, 0, 0.07]],
      seed: [[780, 0, 0.1], [1040, 0.06, 0.13]],
      correct: [[660, 0, 0.14], [880, 0.09, 0.18], [1100, 0.18, 0.22]],
      wrong: [[330, 0, 0.1], [290, 0.07, 0.11]],
      complete: [[523.25, 0, 0.22], [659.25, 0.12, 0.22], [783.99, 0.24, 0.28], [1046.5, 0.4, 0.42]],
    };
    for (const [frequency, delay, duration] of phrases[kind] || phrases.tap) {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      const time = context.currentTime + delay;
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      envelope.gain.setValueAtTime(0.0001, time);
      envelope.gain.exponentialRampToValueAtTime(current ? 0.16 : 0.42, time + 0.015);
      envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      oscillator.connect(envelope);
      envelope.connect(effectsGain);
      effects.set(oscillator, envelope);
      oscillator.onended = () => {
        oscillator.disconnect();
        envelope.disconnect();
        effects.delete(oscillator);
      };
      oscillator.start(time);
      oscillator.stop(time + duration + 0.03);
    }
  }

  const visibilityChanged = () => { if (globalThis.document?.hidden) stop(); };
  globalThis.document?.addEventListener('visibilitychange', visibilityChanged);

  return {
    unlock,
    play: keyOrPath => sequence(Array.isArray(keyOrPath) ? keyOrPath : [keyOrPath]),
    sequence,
    preload,
    stop,
    sfx,
    setMuted(value) { muted = Boolean(value); if (muted) stop(); },
    dispose() {
      if (disposed) return;
      disposed = true;
      stop();
      globalThis.document?.removeEventListener('visibilitychange', visibilityChanged);
      for (const controller of requests) controller.abort();
      requests.clear();
      decoded.clear();
      failed.clear();
      voiceGain?.disconnect();
      effectsGain?.disconnect();
      if (context && context.state !== 'closed') context.close().catch(() => {});
      context = null;
    },
  };
}
