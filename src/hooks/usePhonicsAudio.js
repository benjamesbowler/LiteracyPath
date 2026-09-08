import { useCallback, useEffect, useRef, useState } from "react";
import { Howl, Howler } from "howler";
import { AUDIO_PHONEME_PATHS } from "../data/generated/audioPhonemePaths.generated.js";

const soundCache = new Map();
const failedSources = new Set();
const GENERATED_PHONEME_PREFIX = "generated:phoneme:";
const MAX_SOUND_CACHE_ENTRIES = 24;
let playbackRequest = 0;
let activePlayback = null;

export function hasPhonicsAudioSource(src) {
  return Boolean(
    src
    && !src.startsWith(GENERATED_PHONEME_PREFIX)
    && (
      AUDIO_PHONEME_PATHS.has(src)
      // Leda paths have already been resolved from the production audio
      // registry by their caller. Keep that shared hook from importing the
      // much larger quest manifest into the initial bundle.
      || src.startsWith("/audio/production/en-US/")
    )
  );
}

function getHowl(src) {
  if (failedSources.has(src)) {
    const failed = soundCache.get(src);
    soundCache.delete(src);
    failedSources.delete(src);
    failed?.unload();
  }
  if (soundCache.has(src)) {
    const cached = soundCache.get(src);
    soundCache.delete(src);
    soundCache.set(src, cached);
    return cached;
  }

  const howl = new Howl({
    src: [src],
    format: ["mp3"],
    html5: isLongAudioSource(src),
    preload: true
  });

  howl.on("loaderror", () => { if (soundCache.get(src) === howl) failedSources.add(src); });

  soundCache.set(src, howl);
  evictOldestHowlIfNeeded();
  return howl;
}

function isLongAudioSource(src = "") {
  return /guided-reading|passage|story|sentence|sentences|instructions/i.test(src);
}

function evictOldestHowlIfNeeded() {
  while (soundCache.size > MAX_SOUND_CACHE_ENTRIES) {
    const [oldestSrc, oldestHowl] = [...soundCache].find(([, howl]) => howl !== activePlayback?.howl) || [];
    if (!oldestSrc) return;
    soundCache.delete(oldestSrc);
    failedSources.delete(oldestSrc);
    try {
      oldestHowl.unload();
    } catch {
      // Eviction should never break playback.
    }
  }
}

export function usePhonicsAudio(src) {
  const [isPlaying, setIsPlaying] = useState(false);
  const howlRef = useRef(null);
  const localPlaybackRequestRef = useRef(0);
  const playbackRef = useRef(null);

  useEffect(() => {
    if (!hasPhonicsAudioSource(src)) return undefined;

    const howl = getHowl(src);
    howlRef.current = howl;

    const onEnd = () => setIsPlaying(false);
    const onStop = () => setIsPlaying(false);
    howl.on("end", onEnd);
    howl.on("stop", onStop);

    return () => {
      localPlaybackRequestRef.current += 1;
      playbackRef.current?.cancel?.();
      howl.off("end", onEnd);
      howl.off("stop", onStop);
    };
  }, [src]);

  const play = useCallback(() => {
    const localRequest = localPlaybackRequestRef.current + 1;
    localPlaybackRequestRef.current = localRequest;
    if (!hasPhonicsAudioSource(src)) {
      setIsPlaying(false);
      return Promise.resolve("unavailable");
    }
    const playback = playPhonicsAudio(src, {
      onStart: () => {
        if (localPlaybackRequestRef.current === localRequest) setIsPlaying(true);
      },
      onFinish: () => {
        if (localPlaybackRequestRef.current === localRequest) setIsPlaying(false);
      },
      onHowl: howl => { howlRef.current = howl; }
    });
    playbackRef.current = playback;
    return playback;
  }, [src]);

  const stop = useCallback(() => {
    localPlaybackRequestRef.current += 1;
    playbackRef.current?.cancel?.();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, []);

  return { play, stop, isPlaying };
}

// Imperative by design: callers can invoke this inside the original pointer
// handler, which is the only reliable place to begin audio on iPad Safari.
// The returned promise settles on end, stop, load failure, or play rejection,
// so sequential phonics never advances on a fixed timer and never hangs after
// a newer cue takes the voice.
export function playPhonicsAudio(src, { onStart, onFinish, onHowl } = {}) {
  const request = ++playbackRequest;
  activePlayback?.cancel("superseded");
  Howler.stop();
  if (!hasPhonicsAudioSource(src) || Howler._muted || Howler.volume() === 0) {
    onFinish?.("unavailable");
    return Promise.resolve("unavailable");
  }
  let cancel = () => {};
  const promise = new Promise(resolve => {
    let howl = null;
    let soundId = null;
    let settled = false;
    let startupTimer = null;
    const settle = status => {
      if (settled) return;
      settled = true;
      clearTimeout(startupTimer);
      for (const [event, handler] of listeners) howl?.off(event, handler);
      if (activePlayback?.request === request) activePlayback = null;
      if (status !== "ended") howl?.stop(soundId ?? undefined);
      onFinish?.(status);
      resolve(status);
    };
    const audible = () => !Howler._muted && !howl?._muted && Howler.volume() > 0 && howl.volume(soundId) > 0;
    const onEnd = id => {
      if (soundId !== null && id !== undefined && id !== soundId) return;
      settle(audible() ? "ended" : "unavailable");
    };
    const ownsSound = id => id == null || soundId === null || id === soundId;
    const onStop = id => { if (ownsSound(id)) settle(request === playbackRequest ? "stopped" : "superseded"); };
    const onLoadError = () => { if (settled) return; failedSources.add(src); settle("unavailable"); };
    const onPlayError = () => settle("blocked");
    const onPlay = id => { if (!ownsSound(id) || settled) return; clearTimeout(startupTimer); onStart?.(); };
    const onOwnedPlayError = id => { if (ownsSound(id)) onPlayError(); };
    const listeners = [["end", onEnd], ["stop", onStop], ["loaderror", onLoadError], ["playerror", onOwnedPlayError], ["play", onPlay]];
    cancel = (status = "stopped") => settle(status);
    try {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
      howl = getHowl(src);
      onHowl?.(howl);
      // Listen before play so a synchronous failure cannot strand its caller.
      for (const [event, handler] of listeners) howl.on(event, handler);
      activePlayback = { request, howl, cancel };
      startupTimer = setTimeout(() => settle("unavailable"), 10000);
      soundId = howl.play();
      if (soundId === null || soundId === undefined) settle("unavailable");
    } catch { settle("unavailable"); }
  });
  promise.cancel = cancel;
  promise.isCurrent = () => request === playbackRequest;
  return promise;
}

export function stopPhonicsAudio() {
  playbackRequest += 1;
  activePlayback?.cancel("stopped");
  Howler.stop();
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function preloadPhonicsAudio(src) {
  if (hasPhonicsAudioSource(src)) getHowl(src);
}

export function getPhonicsAudioCacheSizeForDebug() {
  return soundCache.size;
}
