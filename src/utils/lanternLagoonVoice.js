import { createPausableTasks } from './learningPace.js';
import { duckGameMusic, restoreGameMusic } from './audio/gameMusic.js';

// One sentence owns one native recording and its real terminal event. No TTS,
// guessed duration, shared global stop, or silent clip reported as delivered.
export function createLanternVoice(src, { onDelivery, AudioClass = globalThis.Audio, duckMusic = duckGameMusic, restoreMusic = restoreGameMusic, now, schedule, clear } = {}) {
  let audio, settled = false, started = false, paused = false, ducked = false, resolve, observedAt = -1, observedDuration = null;
  const mixOwner = Object.freeze({ game: 'lantern-lagoon', src });
  const tasks = createPausableTasks({ now, schedule, clear });
  const promise = new Promise(done => { resolve = done; });
  const restoreOwnedMix = () => { if (ducked) { ducked = false; restoreMusic(mixOwner); } };
  function finish(status) {
    if (settled) return;
    settled = true; tasks.cancel(); restoreOwnedMix();
    audio?.removeEventListener('playing', playing);
    audio?.removeEventListener('ended', ended);
    audio?.removeEventListener('error', failed);
    audio?.removeEventListener('loadedmetadata', durationChanged);
    audio?.removeEventListener('durationchange', durationChanged);
    audio?.removeEventListener('timeupdate', durationChanged);
    onDelivery?.(status); resolve(status);
  }
  function durationChanged(event) {
    if (!started || settled) return;
    const duration = Number(audio.duration), at = Math.max(0, Number(audio.currentTime) || 0), rate = Math.max(.1, Number(audio.playbackRate) || 1);
    const sameDuration = Object.is(duration, observedDuration);
    if (event && sameDuration && at <= observedAt + .0001) return;
    observedAt = at; observedDuration = duration; tasks.cancel();
    // Actual metadata owns the watchdog. Progress re-arms it, pause freezes
    // it, and a missing terminal event fails honestly instead of hanging.
    const terminalBudget = Number.isFinite(duration) && duration > 0 ? Math.max(5000, (duration - at) / rate * 1000 + 2000) : 30000;
    tasks.schedule(failed, terminalBudget);
  }
  const playing = event => {
    if (settled) return;
    if (paused) { audio?.pause(); return; }
    started = true; if (!ducked) { ducked = true; duckMusic(mixOwner); }
    onDelivery?.('playing'); durationChanged(event);
  };
  const ended = () => finish('ended');
  const failed = () => { audio?.pause(); finish('unavailable'); };
  function play() {
    if (settled || paused) return;
    try { Promise.resolve(audio.play()).catch(failed); } catch { failed(); }
  }
  try {
    audio = new AudioClass(src);
    audio.preload = 'auto';
    audio.addEventListener('playing', playing);
    audio.addEventListener('ended', ended);
    audio.addEventListener('error', failed);
    audio.addEventListener('loadedmetadata', durationChanged);
    audio.addEventListener('durationchange', durationChanged);
    audio.addEventListener('timeupdate', durationChanged);
    // Loading can fail without an error event. This bounds an unavailable
    // connection, not a successfully playing sentence's readable dwell.
    tasks.schedule(() => { if (!started) failed(); }, 15000);
    play();
  } catch { finish('unavailable'); }
  return {
    promise,
    pause() { if (settled || paused) return; paused = true; audio?.pause(); tasks.pause(); restoreOwnedMix(); },
    resume() { if (settled || !paused) return; paused = false; tasks.resume(); play(); },
    cancel() { if (settled) return; audio?.pause(); finish('cancelled'); },
    get active() { return !settled; },
  };
}
