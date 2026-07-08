const TRACKS = {
  meadow: {
    title: "Sunny Meadow",
    volume: 0.23,
    sources: ["/audio/music/meadow-loop.mp3", "/audio/music/meadow-loop.wav"]
  },
  dino: {
    title: "Sunny Hollow",
    volume: 0.22,
    sources: ["/audio/music/dino-loop.mp3", "/audio/music/dino-loop.wav"]
  },
  moonwood: {
    title: "Moonwood",
    volume: 0.24,
    sources: ["/audio/music/moonwood-loop.mp3", "/audio/music/moonwood-loop.wav"]
  }
};

const FADE_STEP_MS = 33;

let active = null;
let retryListeners = null;
let fadeTimer = null;
let requestToken = 0;
const stoppingFades = new Set();

function canUseAudio() {
  return typeof window !== "undefined" && typeof Audio !== "undefined";
}

function canPlaySource(audio, source) {
  if (source.endsWith(".mp3")) return audio.canPlayType("audio/mpeg") !== "";
  if (source.endsWith(".wav")) return audio.canPlayType("audio/wav") !== "";
  return true;
}

async function sourceExists(source) {
  if (typeof fetch !== "function") return true;
  try {
    const response = await fetch(source, { method: "HEAD", cache: "force-cache" });
    return response.ok;
  } catch {
    return !source.endsWith(".mp3");
  }
}

async function pickSource(track) {
  const probe = new Audio();
  for (const source of track.sources) {
    if (!canPlaySource(probe, source)) continue;
    if (await sourceExists(source)) return source;
  }
  return track.sources[track.sources.length - 1];
}

function clearFade() {
  if (fadeTimer) window.clearInterval(fadeTimer);
  fadeTimer = null;
}

function finishAudio(audio) {
  audio.pause();
  audio.currentTime = 0;
}

function stopPendingFades() {
  stoppingFades.forEach(entry => {
    window.clearInterval(entry.timer);
    finishAudio(entry.audio);
  });
  stoppingFades.clear();
}

function fadeTo(targetVolume, seconds = 0.45) {
  if (!active?.audio) return;
  clearFade();
  const audio = active.audio;
  const start = audio.volume;
  const steps = Math.max(1, Math.round((seconds * 1000) / FADE_STEP_MS));
  let step = 0;
  fadeTimer = window.setInterval(() => {
    step += 1;
    const t = Math.min(1, step / steps);
    audio.volume = start + (targetVolume - start) * t;
    if (t >= 1) clearFade();
  }, FADE_STEP_MS);
}

function removeRetryListeners() {
  if (!retryListeners) return;
  retryListeners.forEach(([eventName, handler]) => window.removeEventListener(eventName, handler));
  retryListeners = null;
}

function queueRetry(play) {
  removeRetryListeners();
  const retry = () => {
    removeRetryListeners();
    play();
  };
  retryListeners = [
    ["pointerdown", retry],
    ["keydown", retry],
    ["touchstart", retry]
  ];
  retryListeners.forEach(([eventName, handler]) => window.addEventListener(eventName, handler, { once: true }));
}

function tryPlay(audio, targetVolume) {
  const promise = audio.play();
  if (promise?.then) {
    promise
      .then(() => fadeTo(targetVolume, 0.65))
      .catch(() => queueRetry(() => tryPlay(audio, targetVolume)));
    return;
  }
  fadeTo(targetVolume, 0.65);
}

export function getGameMusicTrack(worldId) {
  return TRACKS[worldId] || TRACKS.meadow;
}

export async function startGameMusic(worldId, options = {}) {
  if (!canUseAudio()) return null;
  const enabled = options.enabled !== false;
  if (!enabled) {
    stopGameMusic();
    return null;
  }

  const track = getGameMusicTrack(worldId);
  const targetVolume = Math.max(0, Math.min(1, Number(options.volume ?? track.volume) || track.volume));

  if (active?.worldId === worldId && active.audio) {
    active.targetVolume = targetVolume;
    if (active.audio.paused) tryPlay(active.audio, targetVolume);
    else fadeTo(targetVolume, 0.25);
    return active;
  }

  stopPendingFades();
  stopGameMusic({ fadeSeconds: 0 });
  const token = ++requestToken;
  const source = await pickSource(track);
  if (!canUseAudio() || token !== requestToken) return null;

  const audio = new Audio(source);
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0;
  active = { audio, source, track, targetVolume, worldId };
  tryPlay(audio, targetVolume);
  return active;
}

export function stopGameMusic(options = {}) {
  requestToken += 1;
  removeRetryListeners();
  if (!active?.audio) {
    stopPendingFades();
    return;
  }
  const audio = active.audio;
  const seconds = Math.max(0, Number(options.fadeSeconds ?? 0.35) || 0);
  clearFade();
  if (seconds === 0) {
    stopPendingFades();
    finishAudio(audio);
    active = null;
    return;
  }
  const start = audio.volume;
  const steps = Math.max(1, Math.round((seconds * 1000) / FADE_STEP_MS));
  let step = 0;
  const entry = { audio, timer: null };
  entry.timer = window.setInterval(() => {
    step += 1;
    const t = Math.min(1, step / steps);
    audio.volume = start * (1 - t);
    if (t >= 1) {
      window.clearInterval(entry.timer);
      stoppingFades.delete(entry);
      finishAudio(audio);
    }
  }, FADE_STEP_MS);
  stoppingFades.add(entry);
  active = null;
}

export function setGameMusicVolume(volume) {
  if (!active?.audio) return;
  const nextVolume = Math.max(0, Math.min(1, Number(volume) || 0));
  active.targetVolume = nextVolume;
  fadeTo(nextVolume, 0.2);
}

export function isGameMusicPlaying() {
  return Boolean(active?.audio && !active.audio.paused);
}
