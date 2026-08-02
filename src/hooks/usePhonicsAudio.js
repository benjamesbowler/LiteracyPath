import { useCallback, useEffect, useRef, useState } from "react";
import { Howl, Howler } from "howler";
import { AUDIO_FILE_PATHS } from "../data/generated/audioFilePaths.generated.js";

const soundCache = new Map();
const failedSources = new Set();
const GENERATED_PHONEME_PREFIX = "generated:phoneme:";
const MAX_SOUND_CACHE_ENTRIES = 24;
let playbackRequest = 0;

export function hasPhonicsAudioSource(src) {
  return Boolean(
    src
    && !src.startsWith(GENERATED_PHONEME_PREFIX)
    && AUDIO_FILE_PATHS.has(src)
  );
}

function getHowl(src) {
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

  howl.on("loaderror", () => failedSources.add(src));

  soundCache.set(src, howl);
  evictOldestHowlIfNeeded();
  return howl;
}

function isLongAudioSource(src = "") {
  return /guided-reading|passage|story|sentence|sentences|instructions/i.test(src);
}

function evictOldestHowlIfNeeded() {
  while (soundCache.size > MAX_SOUND_CACHE_ENTRIES) {
    const [oldestSrc, oldestHowl] = soundCache.entries().next().value || [];
    if (!oldestSrc) return;
    soundCache.delete(oldestSrc);
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

  useEffect(() => {
    if (!hasPhonicsAudioSource(src)) return undefined;

    const howl = getHowl(src);
    howlRef.current = howl;

    const onEnd = () => setIsPlaying(false);
    const onStop = () => setIsPlaying(false);
    howl.on("end", onEnd);
    howl.on("stop", onStop);

    return () => {
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
    return playPhonicsAudio(src, {
      onStart: () => {
        if (localPlaybackRequestRef.current === localRequest) setIsPlaying(true);
      },
      onFinish: () => {
        if (localPlaybackRequestRef.current === localRequest) setIsPlaying(false);
      },
      onHowl: howl => { howlRef.current = howl; }
    });
  }, [src]);

  const stop = useCallback(() => {
    localPlaybackRequestRef.current += 1;
    if (howlRef.current) {
      howlRef.current.stop();
    }
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
  if (!hasPhonicsAudioSource(src) || failedSources.has(src)) {
    onFinish?.("unavailable");
    return Promise.resolve("unavailable");
  }

  const request = ++playbackRequest;
  try {
    Howler.stop();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const howl = getHowl(src);
    onHowl?.(howl);
    const soundId = howl.play();
    if (soundId === null || soundId === undefined) {
      onFinish?.("unavailable");
      return Promise.resolve("unavailable");
    }
    onStart?.();

    return new Promise(resolve => {
      let settled = false;
      const settle = status => {
        if (settled) return;
        settled = true;
        howl.off("end", onEnd, soundId);
        howl.off("stop", onStop, soundId);
        howl.off("loaderror", onLoadError, soundId);
        howl.off("playerror", onPlayError, soundId);
        onFinish?.(status);
        resolve(status);
      };
      const onEnd = () => settle("ended");
      const onStop = () => settle(request === playbackRequest ? "stopped" : "superseded");
      const onLoadError = () => {
        failedSources.add(src);
        settle("unavailable");
      };
      // Safari reports a user-gesture block as playerror. It is transient and
      // must never poison this source for the rest of the child's session.
      const onPlayError = () => settle("blocked");
      howl.once("end", onEnd, soundId);
      howl.once("stop", onStop, soundId);
      howl.once("loaderror", onLoadError, soundId);
      howl.once("playerror", onPlayError, soundId);
    });
  } catch {
    onFinish?.("unavailable");
    return Promise.resolve("unavailable");
  }
}

export function stopPhonicsAudio() {
  playbackRequest += 1;
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
