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
  "reel-read": {
    title: "Reel Read",
    volume: 0.23,
    sources: ["/audio/music/arcade/reel-read-loop.mp3"]
  },
  "sentence-express": {
    title: "Sentence Express",
    volume: 0.25,
    sources: ["/audio/music/arcade/sentence-express-loop.mp3"]
  },
  "grammar-grind": {
    title: "Grammar Grind",
    volume: 0.26,
    sources: ["/audio/music/arcade/grammar-grind-loop.mp3"]
  },
  meadow: {
    title: "Morning on the Sound Trail",
    volume: 0.21,
    sources: ["/audio/music/quest/meadow-morning-loop.mp3", "/audio/music/meadow-loop.mp3"]
  },
  dino: {
    title: "Fossil Footsteps",
    volume: 0.2,
    sources: ["/audio/music/quest/fossil-footsteps-loop.mp3", "/audio/music/dino-loop.mp3"]
  },
  moonwood: {
    title: "Lanterns in Moonwood",
    volume: 0.2,
    sources: ["/audio/music/quest/moonwood-lanterns-loop.mp3", "/audio/music/moonwood-loop.mp3"]
  },
  "seedwake-ramble": {
    title: "Seedwake Ramble",
    volume: 0.21,
    sources: ["/audio/music/quest/meadow-morning-loop.mp3", "/audio/music/meadow-loop.mp3"]
  },
  "seedwake-ramble-action": {
    title: "Seedwake Ramble - In Play",
    volume: 0.22,
    sources: ["/audio/music/quest/seedwake-action-loop.mp3", "/audio/music/quest/meadow-morning-loop.mp3"]
  },
  "seedwake-ramble-ceremony": {
    title: "Seedwake Ramble - Restored",
    volume: 0.2,
    sources: ["/audio/music/quest/seedwake-ceremony-loop.mp3", "/audio/music/quest/meadow-morning-loop.mp3"]
  },
  "river-garden-paddle": {
    title: "River Garden Paddle",
    volume: 0.21,
    sources: ["/audio/music/quest/river-garden-paddle-loop.mp3", "/audio/music/quest/meadow-morning-loop.mp3"]
  },
  "fossil-ridge-march": {
    title: "Fossil Ridge March",
    volume: 0.2,
    sources: ["/audio/music/quest/fossil-footsteps-loop.mp3", "/audio/music/dino-loop.mp3"]
  },
  "forge-yard-stomp": {
    title: "Forge Yard Stomp",
    volume: 0.2,
    sources: ["/audio/music/quest/forge-yard-stomp-loop.mp3", "/audio/music/quest/fossil-footsteps-loop.mp3"]
  },
  "glass-marsh-drift": {
    title: "Glass Marsh Drift",
    volume: 0.2,
    sources: ["/audio/music/quest/glass-marsh-drift-loop.mp3", "/audio/music/quest/moonwood-lanterns-loop.mp3"]
  },
  "storm-coast-skip": {
    title: "Storm Coast Skip",
    volume: 0.2,
    sources: ["/audio/music/quest/storm-coast-skip-loop.mp3", "/audio/music/quest/moonwood-lanterns-loop.mp3"]
  },
  "lantern-forest-prowl": {
    title: "Lantern Forest Prowl",
    volume: 0.2,
    sources: ["/audio/music/quest/lantern-forest-prowl-loop.mp3", "/audio/music/quest/moonwood-lanterns-loop.mp3"]
  },
  "star-reach-finale": {
    title: "Star Reach Finale",
    volume: 0.21,
    sources: ["/audio/music/quest/star-reach-finale-loop.mp3", "/audio/music/quest/moonwood-lanterns-loop.mp3"]
  }
};

const AMBIENCES = Object.freeze({
  "seedwake-meadow": { title: "Seedwake birds and reeds", volume: 0.085, source: "/audio/music/quest/seedwake-meadow-ambience-loop.mp3" },
  "river-gardens": { title: "River water and garden bells", volume: 0.085, source: "/audio/music/quest/river-gardens-ambience-loop.mp3" },
  "fossil-canyon": { title: "Canyon wind and loose stone", volume: 0.08, source: "/audio/music/quest/fossil-canyon-ambience-loop.mp3" },
  "forge-settlement": { title: "Forge wheels and steam", volume: 0.075, source: "/audio/music/quest/forge-settlement-ambience-loop.mp3" },
  "glass-marsh": { title: "Marsh water and glass reeds", volume: 0.08, source: "/audio/music/quest/glass-marsh-ambience-loop.mp3" },
  "storm-coast": { title: "Coast surf and weather", volume: 0.075, source: "/audio/music/quest/storm-coast-ambience-loop.mp3" },
  "lantern-forest": { title: "Lantern leaves and distant tones", volume: 0.08, source: "/audio/music/quest/lantern-forest-ambience-loop.mp3" },
  "star-reach": { title: "High wind and star glass", volume: 0.075, source: "/audio/music/quest/star-reach-ambience-loop.mp3" }
});

const GAME_AUDIO_MIXES = Object.freeze({
  travel: Object.freeze({ music: 1, ambience: 1 }),
  // Encounters are the LISTENING-critical phase — a child is discriminating
  // phonemes. Music sits DOWN in the mix there, never up (it was 1.06: six
  // percent louder during the one moment quiet matters most).
  encounter: Object.freeze({ music: 0.8, ambience: 0.58 }),
  ceremony: Object.freeze({ music: 0.92, ambience: 0.46 })
});

const FADE_STEP_MS = 33;

let active = null;
let activeAmbience = null;
let retryListeners = null;
let ambienceRetryListeners = null;
let fadeTimer = null;
let ambienceFadeTimer = null;
let requestToken = 0;
let audioSuspended = false;
const stoppingFades = new Set();

function canUseAudio() {
  return typeof window !== "undefined" && typeof Audio !== "undefined";
}

function canPlaySource(audio, source) {
  if (source.endsWith(".mp3")) return audio.canPlayType("audio/mpeg") !== "";
  if (source.endsWith(".wav")) return audio.canPlayType("audio/wav") !== "";
  return true;
}

function pickSource(track) {
  const probe = new Audio();
  for (const source of track.sources) {
    if (!canPlaySource(probe, source)) continue;
    return source;
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

function fadeOutAudio(audio, seconds = 0.55) {
  if (!audio) return;
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

function removeAmbienceRetryListeners() {
  if (!ambienceRetryListeners) return;
  ambienceRetryListeners.forEach(([eventName, handler]) => window.removeEventListener(eventName, handler));
  ambienceRetryListeners = null;
}

function fadeAmbienceTo(targetVolume, seconds = 0.45) {
  if (!activeAmbience?.audio) return;
  if (ambienceFadeTimer) window.clearInterval(ambienceFadeTimer);
  const audio = activeAmbience.audio;
  const start = audio.volume;
  const steps = Math.max(1, Math.round((seconds * 1000) / FADE_STEP_MS));
  let step = 0;
  ambienceFadeTimer = window.setInterval(() => {
    step += 1;
    const t = Math.min(1, step / steps);
    audio.volume = start + (targetVolume - start) * t;
    if (t >= 1) {
      window.clearInterval(ambienceFadeTimer);
      ambienceFadeTimer = null;
    }
  }, FADE_STEP_MS);
}

function tryPlayAmbience(audio, targetVolume) {
  const promise = audio.play();
  if (!promise?.catch) {
    fadeAmbienceTo(targetVolume, 0.7);
    return;
  }
  promise.then(() => {
    removeAmbienceRetryListeners();
    fadeAmbienceTo(targetVolume, 0.7);
  }).catch(() => {
    removeAmbienceRetryListeners();
    const retry = () => {
      removeAmbienceRetryListeners();
      tryPlayAmbience(audio, targetVolume);
    };
    ambienceRetryListeners = [["pointerdown", retry], ["keydown", retry], ["touchstart", retry]];
    ambienceRetryListeners.forEach(([eventName, handler]) => window.addEventListener(eventName, handler, { once: true }));
  });
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
      .then(() => {
        removeRetryListeners();
        fadeTo(targetVolume, 0.65);
      })
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

export function getGameAmbienceTrack(chapterId) {
  return AMBIENCES[chapterId] || null;
}

export function getGameAudioMix(mode = "travel") {
  return GAME_AUDIO_MIXES[mode] || GAME_AUDIO_MIXES.travel;
}

export function startGameAmbience(chapterId, options = {}) {
  if (!canUseAudio()) return null;
  const track = getGameAmbienceTrack(chapterId);
  if (!track || options.enabled === false) {
    stopGameAmbience();
    return null;
  }
  const mixScale = getGameAudioMix(options.mode).ambience;
  const targetVolume = Math.max(0, Math.min(0.14, Number(options.volume ?? track.volume) * mixScale));
  if (activeAmbience?.chapterId === chapterId && activeAmbience.audio) {
    activeAmbience.targetVolume = targetVolume;
    if (audioSuspended) activeAmbience.resumeAfterSuspend = true;
    else if (activeAmbience.audio.paused) tryPlayAmbience(activeAmbience.audio, targetVolume);
    else fadeAmbienceTo(targetVolume, 0.3);
    return activeAmbience;
  }
  removeAmbienceRetryListeners();
  if (ambienceFadeTimer) window.clearInterval(ambienceFadeTimer);
  ambienceFadeTimer = null;
  const previous = activeAmbience?.audio || null;
  activeAmbience = null;
  fadeOutAudio(previous, 0.6);
  const audio = new Audio(track.source);
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0;
  activeAmbience = { audio, chapterId, targetVolume, track };
  if (audioSuspended) activeAmbience.resumeAfterSuspend = true;
  else tryPlayAmbience(audio, targetVolume);
  return activeAmbience;
}

export function stopGameAmbience(options = {}) {
  removeAmbienceRetryListeners();
  if (ambienceFadeTimer) window.clearInterval(ambienceFadeTimer);
  ambienceFadeTimer = null;
  const audio = activeAmbience?.audio || null;
  activeAmbience = null;
  if (!audio) return;
  const seconds = Math.max(0, Number(options.fadeSeconds ?? 0.45) || 0);
  if (!seconds) finishAudio(audio);
  else fadeOutAudio(audio, seconds);
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
  const mixScale = getGameAudioMix(options.mode).music;
  const targetVolume = Math.max(0, Math.min(1, (Number(options.volume ?? track.volume) || track.volume) * mixScale));

  if (active?.trackId === resolvedTrackId && active.audio) {
    active.targetVolume = targetVolume;
    if (audioSuspended) active.resumeAfterSuspend = true;
    else if (active.audio.paused) {
      queueRetry(() => tryPlay(active.audio, targetVolume));
      tryPlay(active.audio, targetVolume);
    }
    else fadeTo(targetVolume, 0.25);
    return active;
  }

  stopPendingFades();
  removeRetryListeners();
  clearFade();
  const previousAudio = active?.audio || null;
  active = null;
  fadeOutAudio(previousAudio, 0.55);
  const token = ++requestToken;
  const source = pickSource(track);
  if (!canUseAudio() || token !== requestToken) return null;

  const audio = new Audio(source);
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0;
  active = { audio, source, track, targetVolume, trackId: resolvedTrackId };
  if (audioSuspended) active.resumeAfterSuspend = true;
  else {
    queueRetry(() => tryPlay(audio, targetVolume));
    tryPlay(audio, targetVolume);
  }
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

export function duckGameMusic() {
  if (audioSuspended) return;
  if (active?.audio) fadeTo(active.targetVolume * 0.24, 0.12);
  if (activeAmbience?.audio) fadeAmbienceTo(activeAmbience.targetVolume * 0.16, 0.12);
}

export function restoreGameMusic() {
  if (audioSuspended) return;
  if (active?.audio) fadeTo(active.targetVolume, 0.28);
  if (activeAmbience?.audio) fadeAmbienceTo(activeAmbience.targetVolume, 0.3);
}

export function setGameAudioSuspended(suspended = true) {
  const next = Boolean(suspended);
  if (audioSuspended === next) return audioSuspended;
  audioSuspended = next;
  clearFade();
  if (ambienceFadeTimer) window.clearInterval(ambienceFadeTimer);
  ambienceFadeTimer = null;
  removeRetryListeners();
  removeAmbienceRetryListeners();

  if (audioSuspended) {
    if (active?.audio) {
      active.resumeAfterSuspend = true;
      active.audio.pause();
    }
    if (activeAmbience?.audio) {
      activeAmbience.resumeAfterSuspend = true;
      activeAmbience.audio.pause();
    }
    return audioSuspended;
  }

  if (active?.audio && active.resumeAfterSuspend) {
    active.resumeAfterSuspend = false;
    tryPlay(active.audio, active.targetVolume);
  }
  if (activeAmbience?.audio && activeAmbience.resumeAfterSuspend) {
    activeAmbience.resumeAfterSuspend = false;
    tryPlayAmbience(activeAmbience.audio, activeAmbience.targetVolume);
  }
  return audioSuspended;
}

export function isGameMusicPlaying() {
  return Boolean(active?.audio && !active.audio.paused);
}
