import { Howl, Howler } from "howler";
import { getLetterSoundCue } from "../components/learn/phonics/cvc/cvcHelpers";

const howlCache = new Map();
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
  if (!howlCache.has(src)) {
    howlCache.set(src, new Howl({ src: [src], html5: true, volume: 1 }));
  }
  return howlCache.get(src);
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
  for (const path of paths.filter(Boolean)) {
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

  if (cue?.src && !cue.src.startsWith("generated:")) {
    const played = await playFirstAvailable([cue.src]);
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

export function speak(text, options = {}) {
  const value = String(text || "").trim();
  if (!value) return;
  if (/^[a-z]+$/i.test(value)) {
    speakWord(value, options);
    return;
  }
  speakWithBrowser(value, options);
}
