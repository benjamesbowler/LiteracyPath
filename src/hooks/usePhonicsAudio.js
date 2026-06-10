import { useCallback, useEffect, useRef, useState } from "react";
import { Howl, Howler } from "howler";

const soundCache = new Map();
const failedSources = new Set();

function speakFallback(text) {
  if (!text || typeof window === "undefined" || !window.speechSynthesis) return false;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.85;
  utterance.pitch = 1.1;
  window.speechSynthesis.speak(utterance);
  return true;
}

function getHowl(src) {
  if (soundCache.has(src)) {
    return soundCache.get(src);
  }

  const howl = new Howl({
    src: [src],
    format: ["mp3"],
    html5: true,
    preload: true
  });

  howl.on("loaderror", () => failedSources.add(src));
  howl.on("playerror", () => failedSources.add(src));

  soundCache.set(src, howl);
  return howl;
}

export function usePhonicsAudio(src, fallbackText) {
  const [isPlaying, setIsPlaying] = useState(false);
  const howlRef = useRef(null);
  const fallbackRef = useRef(fallbackText);

  useEffect(() => {
    fallbackRef.current = fallbackText;
  }, [fallbackText]);

  useEffect(() => {
    if (!src) return undefined;

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
    if (!src) {
      speakFallback(fallbackRef.current);
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
        speakFallback(fallbackRef.current);
        return;
      }

      const handlePlayError = () => {
        setIsPlaying(false);
        speakFallback(fallbackRef.current);
      };

      howl.once("loaderror", handlePlayError);
      howl.once("playerror", handlePlayError);
      howlRef.current = howl;
      setIsPlaying(true);

      const soundId = howl.play();
      if (soundId === null || soundId === undefined) {
        setIsPlaying(false);
        speakFallback(fallbackRef.current);
      }
    } catch {
      setIsPlaying(false);
      speakFallback(fallbackRef.current);
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
  if (src) getHowl(src);
}
