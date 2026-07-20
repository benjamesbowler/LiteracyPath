import { useCallback, useEffect, useRef, useState } from "react";
import { Howl, Howler } from "howler";
import { AUDIO_FILE_PATHS } from "../data/generated/audioFilePaths.generated.js";

const soundCache = new Map();
const failedSources = new Set();
const GENERATED_PHONEME_PREFIX = "generated:phoneme:";
const MAX_SOUND_CACHE_ENTRIES = 24;

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
  howl.on("playerror", () => failedSources.add(src));

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
    if (!hasPhonicsAudioSource(src)) {
      setIsPlaying(false);
      return;
    }

    try {
      Howler.stop();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      const howl = getHowl(src);
      if (failedSources.has(src)) {
        setIsPlaying(false);
        return;
      }

      const handlePlayError = () => {
        setIsPlaying(false);
      };

      howl.once("loaderror", handlePlayError);
      howl.once("playerror", handlePlayError);
      howlRef.current = howl;
      setIsPlaying(true);

      const soundId = howl.play();
      if (soundId === null || soundId === undefined) {
        setIsPlaying(false);
      }
    } catch {
      setIsPlaying(false);
    }
  }, [src]);

  const stop = useCallback(() => {
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

export function preloadPhonicsAudio(src) {
  if (hasPhonicsAudioSource(src)) getHowl(src);
}

export function getPhonicsAudioCacheSizeForDebug() {
  return soundCache.size;
}
