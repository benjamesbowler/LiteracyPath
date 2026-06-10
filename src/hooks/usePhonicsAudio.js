import { useCallback, useEffect, useRef, useState } from "react";
import { Howl, Howler } from "howler";
import { speakWithBrowser } from "../utils/audio/speakWithBrowser.js";

const soundCache = new Map();
const failedSources = new Set();
const GENERATED_PHONEME_PREFIX = "generated:phoneme:";

const generatedVowelFormants = {
  short_a: { f0: 190, formants: [[750, 0.95], [1700, 0.55], [2450, 0.28]] },
  short_e: { f0: 190, formants: [[560, 0.95], [1850, 0.5], [2500, 0.22]] },
  short_i: { f0: 200, formants: [[430, 0.9], [2050, 0.5], [2700, 0.22]] },
  short_o: { f0: 185, formants: [[620, 0.95], [1150, 0.48], [2550, 0.2]] },
  short_u: { f0: 185, formants: [[650, 0.95], [1220, 0.45], [2550, 0.18]] }
};

function speakFallback(text) {
  return speakWithBrowser(text, { rate: 0.85, pitch: 1.1 });
}

function playGeneratedPhoneme(src, onEnd) {
  if (!src?.startsWith(GENERATED_PHONEME_PREFIX)) return null;
  const phonemeId = src.slice(GENERATED_PHONEME_PREFIX.length);
  const config = generatedVowelFormants[phonemeId];
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!config || !AudioContextClass) return null;

  const context = new AudioContextClass();
  const now = context.currentTime;
  const duration = 0.44;
  const source = context.createOscillator();
  const sourceGain = context.createGain();
  const masterGain = context.createGain();
  const createdNodes = [source, sourceGain, masterGain];

  source.type = "sawtooth";
  source.frequency.setValueAtTime(config.f0, now);
  source.frequency.exponentialRampToValueAtTime(config.f0 * 0.94, now + duration);
  sourceGain.gain.setValueAtTime(0.08, now);
  source.connect(sourceGain);

  config.formants.forEach(([frequency, gainValue]) => {
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(frequency, now);
    filter.Q.setValueAtTime(8, now);
    gain.gain.setValueAtTime(gainValue, now);
    sourceGain.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    createdNodes.push(filter, gain);
  });

  masterGain.gain.setValueAtTime(0.0001, now);
  masterGain.gain.exponentialRampToValueAtTime(0.55, now + 0.035);
  masterGain.gain.setValueAtTime(0.55, now + duration - 0.08);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  masterGain.connect(context.destination);

  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    try {
      source.stop();
    } catch {
      // The sound may already have finished.
    }
    createdNodes.forEach(node => {
      try {
        node.disconnect();
      } catch {
        // Some browsers throw if a node is already disconnected.
      }
    });
    context.close?.().catch(() => {});
  };

  source.onended = () => {
    stop();
    onEnd?.();
  };
  source.start(now);
  source.stop(now + duration);

  return stop;
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
  const generatedStopRef = useRef(null);

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
    if (generatedStopRef.current) {
      generatedStopRef.current();
      generatedStopRef.current = null;
    }

    if (!src) {
      speakFallback(fallbackRef.current);
      return;
    }

    try {
      Howler.stop();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      const generatedStop = playGeneratedPhoneme(src, () => {
        generatedStopRef.current = null;
        setIsPlaying(false);
      });
      if (generatedStop) {
        generatedStopRef.current = generatedStop;
        setIsPlaying(true);
        return;
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
    if (generatedStopRef.current) {
      generatedStopRef.current();
      generatedStopRef.current = null;
    }
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
