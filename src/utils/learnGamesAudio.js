import { Howl, Howler } from "howler";
import { getLetterSoundCue } from "../components/learn/phonics/cvc/cvcHelpers";
import { AUDIO_FILE_PATHS } from "../data/generated/audioFilePaths.generated.js";

// Only paths that really exist - the host serves the app shell for missing
// files, which used to stall playback chains and leave games silent.
function existingAudioPaths(paths) {
  return paths.filter(p => p && AUDIO_FILE_PATHS.has(p));
}

const howlCache = new Map();
const MAX_HOWL_CACHE_ENTRIES = 24;
const VOWEL_SOUND_TEXT = {
  a: "ah",
  e: "eh",
  i: "ih",
  o: "o",
  u: "uh"
};
const VOWELS = new Set(Object.keys(VOWEL_SOUND_TEXT));

function normalizedText(value) {
  return String(value || "").trim().toLowerCase();
}

function slugify(value) {
  return normalizedText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function getHowl(src) {
  if (!src) return null;
  if (howlCache.has(src)) {
    const cached = howlCache.get(src);
    howlCache.delete(src);
    howlCache.set(src, cached);
    return cached;
  }

  const howl = new Howl({ src: [src], html5: isLongAudioSource(src), volume: 1 });
  howlCache.set(src, howl);
  evictOldestHowlIfNeeded();
  return howl;
}

function isLongAudioSource(src = "") {
  return /guided-reading|passage|story|sentence|sentences|instructions/i.test(src);
}

function evictOldestHowlIfNeeded() {
  while (howlCache.size > MAX_HOWL_CACHE_ENTRIES) {
    const [oldestSrc, oldestHowl] = howlCache.entries().next().value || [];
    if (!oldestSrc) return;
    howlCache.delete(oldestSrc);
    try {
      oldestHowl.unload();
    } catch {
      // Ignore eviction cleanup failures.
    }
  }
}

function playAudio(src) {
  return new Promise((resolve, reject) => {
    const howl = getHowl(src);
    if (!howl) {
      reject(new Error("No audio source"));
      return;
    }

    const soundId = howl.play();
    howl.once("end", () => resolve(src), soundId);
    howl.once("loaderror", () => reject(new Error(`Unable to load ${src}`)), soundId);
    howl.once("playerror", () => reject(new Error(`Unable to play ${src}`)), soundId);
  });
}

async function playFirstAvailable(paths) {
  for (const path of existingAudioPaths(paths)) {
    try {
      return await playAudio(path);
    } catch {
      // Try the next local media candidate before speech synthesis fallback.
    }
  }
  return null;
}

function speakWithBrowser(text, options = {}) {
  if (typeof window === "undefined" || !window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate || 0.82;
  utterance.pitch = options.pitch || 1.08;
  window.speechSynthesis.speak(utterance);
}

export function cancelSpeech() {
  Howler.stop();
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export async function speakPhoneme(letter, options = {}) {
  const normalizedLetter = normalizedText(letter).slice(0, 1);
  const cue = getLetterSoundCue(normalizedLetter, { vowel: VOWELS.has(normalizedLetter) ? normalizedLetter : "" });
  const spokenFallback = VOWEL_SOUND_TEXT[normalizedLetter] || normalizedLetter;

  // Priority: clean pure-phoneme recordings (no letter names, no "short A"
  // labels) > legacy grapheme recordings > browser speech. The phonemes
  // folder activates automatically once its files are generated.
  const candidates = [];
  if (VOWELS.has(normalizedLetter)) {
    // No legacy fallback here: the old short-vowel recordings say the label
    // "short A" instead of the sound, which teaches the wrong thing.
    candidates.push(`/audio/phonemes/short_${normalizedLetter}.mp3`);
  } else {
    candidates.push(`/audio/phonemes/${normalizedLetter}.mp3`);
  }
  if (cue?.src && !cue.src.startsWith("generated:")) {
    candidates.push(cue.src);
  }

  if (candidates.length) {
    const played = await playFirstAvailable(candidates);
    if (played) return;
  }

  speakWithBrowser(cue?.fallbackText || spokenFallback, options);
}

export async function speakWord(word, options = {}) {
  const slug = slugify(word);
  const candidates = [
    `/audio/child-mode/clean-human/words/${slug}.mp3`,
    `/audio/child-mode/words/${slug}.mp3`,
    `/audio/child-mode/clean-human/hfw/${slug}.mp3`,
    `/audio/child-mode/hfw/${slug}.mp3`,
    `/guided-reading/audio/words/${slug}.mp3`,
    `/audio/vocabulary/${slug}.mp3`
  ];
  const played = await playFirstAvailable(candidates);
  if (!played) speakWithBrowser(word, options);
}

export async function speak(text, options = {}) {
  const value = String(text || "").trim();
  if (!value) return;
  if (/^[a-z]+$/i.test(value)) {
    speakWord(value, options);
    return;
  }
  const slug = slugify(value);
  const played = await playFirstAvailable([
    `/audio/learn-games/instructions/${slug}.mp3`,
    `/audio/learn-games/sentences/${slug}.mp3`,
    `/audio/child-mode/phrases/${slug}.mp3`
  ]);
  if (played) return;
  speakWithBrowser(value, options);
}

export function getLearnGamesAudioCacheSizeForDebug() {
  return howlCache.size;
}
