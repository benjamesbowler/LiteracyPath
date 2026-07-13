const TRACKS = {
  "rocket-run": {
    title: "Rocket Run",
    volume: 0.25,
    sources: ["/audio/music/arcade/rocket-run-loop.mp3"]
  },
  "letter-leap": {
    title: "Letter Leap",
    volume: 0.24,
    sources: ["/audio/music/arcade/letter-leap-loop.mp3"]
  },
  "sound-racer": {
    title: "Sound Racer",
    volume: 0.24,
    sources: ["/audio/music/arcade/sound-racer-loop.mp3"]
  },
  "word-bridge": {
    title: "Word Bridge",
    volume: 0.23,
    sources: ["/audio/music/arcade/word-bridge-loop.mp3"]
  },
  "sound-beat": {
    title: "Sound Beat",
    volume: 0.28,
    sources: ["/audio/music/arcade/sound-beat-loop.mp3"]
  },
  "rhyme-pop": {
    title: "Rhyme Pop",
    volume: 0.24,
    sources: ["/audio/music/arcade/rhyme-pop-loop.mp3"]
  },
  "sound-safari": {
    title: "Sound Safari",
    volume: 0.23,
    sources: ["/audio/music/arcade/sound-safari-loop.mp3"]
  },
  "star-gallery": {
    title: "Sentence Grove",
    volume: 0.24,
    sources: ["/audio/music/arcade/star-gallery-loop.mp3"]
  },
  meadow: {
    title: "Morning on the Sound Trail",
    volume: 0.16,
    sources: ["/audio/music/quest/meadow-morning-loop.mp3", "/audio/music/meadow-loop.mp3"]
  },
  dino: {
    title: "Fossil Footsteps",
    volume: 0.15,
    sources: ["/audio/music/quest/fossil-footsteps-loop.mp3", "/audio/music/dino-loop.mp3"]
  },
  moonwood: {
    title: "Lanterns in Moonwood",
    volume: 0.15,
    sources: ["/audio/music/quest/moonwood-lanterns-loop.mp3", "/audio/music/moonwood-loop.mp3"]
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

function resolveTrackId(trackId, options = {}) {
  if (TRACKS[trackId]) return trackId;
  if (TRACKS[options.fallbackWorldId]) return options.fallbackWorldId;
  return "meadow";
}

export function getGameMusicTrack(trackId, options = {}) {
  return TRACKS[resolveTrackId(trackId, options)];
}

export async function startGameMusic(trackId, options = {}) {
  if (!canUseAudio()) return null;
  const enabled = options.enabled !== false;
  if (!enabled) {
    stopGameMusic();
    return null;
  }

  const resolvedTrackId = resolveTrackId(trackId, options);
  const track = TRACKS[resolvedTrackId];
  const targetVolume = Math.max(0, Math.min(1, Number(options.volume ?? track.volume) || track.volume));

  if (active?.trackId === resolvedTrackId && active.audio) {
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
  active = { audio, source, track, targetVolume, trackId: resolvedTrackId };
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
