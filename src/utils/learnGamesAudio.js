import { Howl, Howler } from "howler";
import { hasKnownBadWordAudio, isKnownBadAudioPath } from "../data/knownBadWordAudio.js";
import { getLetterSoundCue } from "../components/learn/phonics/cvc/cvcHelpers";
import { AUDIO_FILE_PATHS } from "../data/generated/audioFilePaths.generated.js";
import { phonemeAudioCandidates } from "../data/phonemeAudioBank.js";
import {
  getLedaInstructionAudioPath,
  getLedaWordAudioPath
} from "../data/ledaProductionAudio.js";

// Only paths that really exist - the host serves the app shell for missing
// files, which used to stall playback chains and leave games silent.
function existingAudioPaths(paths) {
  // Clips verified defective by ear are skipped so the chain falls through
  // to a good copy (or stays silent) instead of teaching the wrong thing.
  return paths.filter(p => p && AUDIO_FILE_PATHS.has(p) && !isKnownBadAudioPath(p));
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

function wordAudioCandidates(slug) {
  if (!slug) return [];
  const ledaPath = getLedaWordAudioPath(slug);
  if (hasKnownBadWordAudio(slug) && !ledaPath) return [];
  return [ledaPath];
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
    // Settle exactly once and detach every sibling listener. A clip cut off by
    // Howler.stop() fires "stop" (never "end"); without that handler the
    // promise hung forever and its listeners accumulated on the cached Howl —
    // a real leak on the hottest clips during a long tap-happy session.
    let settled = false;
    const onEnd = () => settle(resolve, src);
    const onStop = () => settle(resolve, src); // interrupted by a newer cue counts as done
    const onLoadError = () => settle(reject, new Error(`Unable to load ${src}`));
    const onPlayError = () => settle(reject, new Error(`Unable to play ${src}`));
    function settle(finish, value) {
      if (settled) return;
      settled = true;
      howl.off("end", onEnd, soundId);
      howl.off("stop", onStop, soundId);
      howl.off("loaderror", onLoadError, soundId);
      howl.off("playerror", onPlayError, soundId);
      finish(value);
    }
    howl.once("end", onEnd, soundId);
    howl.once("stop", onStop, soundId);
    howl.once("loaderror", onLoadError, soundId);
    howl.once("playerror", onPlayError, soundId);
  });
}

async function playFirstAvailable(paths) {
  for (const path of existingAudioPaths(paths)) {
    try {
      return await playAudio(path);
    } catch {
      // Try the next local recording; if all fail the caller stays silent.
    }
  }
  return null;
}

// Gold-voice policy: we NEVER play robotic browser TTS. When no recorded clip
// exists we stay silent (games use hasRecordedSpeech() to hide Listen buttons).
// Kept as a no-op so older call sites fail safely.
function speakWithBrowser() {}

export function cancelSpeech() {
  Howler.stop();
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function stopCurrentCues() {
  Howler.stop();
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export async function speakPhoneme(letter, options = {}) {
  stopCurrentCues();
  const normalized = normalizedText(letter);
  const normalizedLetter = normalized.slice(0, 1);
  const cue = getLetterSoundCue(normalizedLetter, { vowel: VOWELS.has(normalizedLetter) ? normalizedLetter : "" });
  const spokenFallback = VOWEL_SOUND_TEXT[normalizedLetter] || normalizedLetter;

  // Multi-letter graphemes must never degrade to their first letter: saying
  // short /a/ after a child catches "ai" teaches the wrong sound. Try every
  // recorded gold-voice grapheme folder, then stay silent if none exists.
  if (normalized.length > 1) {
    const played = await playFirstAvailable(phonemeAudioCandidates(normalized));
    if (played) return;
    speakWithBrowser(normalized, options);
    return;
  }

  // Priority: clean pure-phoneme recordings (no letter names, no "short A"
  // labels) > legacy grapheme recordings. Missing clips stay silent.
  const candidates = phonemeAudioCandidates(normalizedLetter);
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
  stopCurrentCues();
  const slug = slugify(word);
  // Words whose only recordings are defective stay silent; never substitute a
  // synthetic voice for a phonics model.
  const candidates = wordAudioCandidates(slug);
  const played = await playFirstAvailable(candidates);
  if (!played) speakWithBrowser(word, options);
}

// True when a real recorded clip exists for this text - games use this to
// hide Listen buttons instead of ever falling back to the robotic browser voice.
export function hasRecordedSpeech(text) {
  const value = String(text || "").trim();
  if (!value) return false;
  if (hasKnownBadWordAudio(value) && !getLedaWordAudioPath(value)) return false;
  if (/^[a-z]+$/i.test(value)) {
    const slug = slugify(value);
    return existingAudioPaths(wordAudioCandidates(slug)).length > 0;
  }
  return existingAudioPaths([
    getLedaInstructionAudioPath(value)
  ]).length > 0;
}

export async function speak(text, options = {}) {
  stopCurrentCues();
  const value = String(text || "").trim();
  if (!value) return;
  if (/^[a-z]+$/i.test(value)) {
    speakWord(value, options);
    return;
  }
  const played = await playFirstAvailable([
    getLedaInstructionAudioPath(value)
  ]);
  if (played) return;
  speakWithBrowser(value, options);
}

export function getLearnGamesAudioCacheSizeForDebug() {
  return howlCache.size;
}
