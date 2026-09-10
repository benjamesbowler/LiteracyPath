// Musical pitches are accompaniment, never a substitute for spoken phonemes.
export function createSoundKeysInstrument(AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext) {
  let context;
  const voices = new Map();
  const active = new Set();
  function release(id, immediate = false) {
    const voice = voices.get(id);
    if (!voice) return;
    voices.delete(id);
    const releaseAt = immediate ? context.currentTime : Math.max(context.currentTime, voice.started + .12);
    voice.gain.gain.cancelScheduledValues(releaseAt);
    voice.gain.gain.setTargetAtTime(0, releaseAt, .035);
    try { voice.oscillator.stop(releaseAt + .18); } catch { /* Already naturally released. */ }
  }
  return {
    play(id, note, instrument = 'bells') {
      if (!AudioContextClass) return;
      context ||= new AudioContextClass();
      context.resume()?.catch?.(() => {});
      release(id);
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = instrument === 'reeds' ? 'triangle' : 'sine';
      oscillator.frequency.value = 440 * 2 ** ((note - 69) / 12);
      const now = context.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(.15, now + .012);
      gain.gain.exponentialRampToValueAtTime(.001, now + (instrument === 'bells' ? 1.2 : .65));
      oscillator.connect(gain); gain.connect(context.destination);
      const voice = { oscillator, gain, started: now };
      voices.set(id, voice); active.add(voice);
      oscillator.onended = () => { active.delete(voice); if (voices.get(id) === voice) voices.delete(id); oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(); oscillator.stop(now + 1.3);
    },
    release,
    stop() {
      for (const voice of active) {
        voice.gain.gain.cancelScheduledValues(context.currentTime);
        voice.gain.gain.setValueAtTime(0, context.currentTime);
        try { voice.oscillator.stop(context.currentTime); } catch { /* Already ended. */ }
      }
      voices.clear(); active.clear();
    },
    dispose() { this.stop(); context?.close()?.catch?.(() => {}); context = null; }
  };
}

export function phonemeForSoundKey(token, word) {
  return token === 'oo' && ['book', 'cook'].includes(word?.id) ? 'oo_short' : token;
}

export function trySoundKey(prefix, token, target) {
  if (prefix.length >= target.length) return { prefix, correct: false, complete: true };
  if (token !== target[prefix.length]) return { prefix, correct: false, complete: false };
  const next = [...prefix, token];
  return { prefix: next, correct: true, complete: next.length === target.length };
}
