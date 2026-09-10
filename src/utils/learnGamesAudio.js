import { Howl, Howler } from "howler";
import { playOwnedClip } from "./audio/playOwnedClip.js";
import { hasKnownBadWordAudio, isKnownBadAudioPath } from "../data/knownBadWordAudio.js";
import { getLetterSoundCue } from "../components/learn/phonics/cvc/cvcHelpers";
import { AUDIO_QUEST_PATHS } from "../data/generated/audioQuestPaths.generated.js";
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
  return paths.filter(p => p && AUDIO_QUEST_PATHS.has(p) && !isKnownBadAudioPath(p));
}

const howlCache = new Map();
let currentCueController = null;
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

function playAudio(src, options) {
  const howl = getHowl(src);
  return howl ? playOwnedClip(howl, src, options) : Promise.reject(new Error("No audio source"));
}

async function playFirstAvailable(paths, options = {}) {
  for (const path of existingAudioPaths(paths)) {
    if (options.signal?.aborted) return null;
    try {
      return await playAudio(path, options);
    } catch {
      // Try the next verified recording only while this cue is still relevant.
    }
  }
  return null;
}

export function preloadWordAudio(word) {
  const path = existingAudioPaths(wordAudioCandidates(slugify(word)))[0];
  if (path) getHowl(path);
}

export function wordAudioDuration(word) {
  const path = existingAudioPaths(wordAudioCandidates(slugify(word)))[0];
  const duration = path ? getHowl(path)?.duration() : 0;
  return Number.isFinite(duration) && duration > 0 ? duration : 0.8;
}

// Gold-voice policy: we NEVER play robotic browser TTS. When no recorded clip
// exists we stay silent (games use hasRecordedSpeech() to hide Listen buttons).
// Kept as a no-op so older call sites fail safely.
function speakWithBrowser() {}

export function cancelSpeech() {
  stopCurrentCues();
}

function stopCurrentCues() {
  currentCueController?.abort();
  currentCueController = null;
  Howler.stop();
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function ownCurrentCue(options) {
  if (options.signal) return options;
  stopCurrentCues();
  currentCueController = new AbortController();
  return { ...options, signal: currentCueController.signal };
}

export async function speakPhoneme(letter, options = {}) {
  if (options.signal?.aborted) return;
  options = ownCurrentCue(options);
  const normalized = normalizedText(letter);
  const normalizedLetter = normalized.slice(0, 1);
  const cue = getLetterSoundCue(normalizedLetter, { vowel: VOWELS.has(normalizedLetter) ? normalizedLetter : "" });
  const spokenFallback = VOWEL_SOUND_TEXT[normalizedLetter] || normalizedLetter;

  // Multi-letter graphemes must never degrade to their first letter: saying
  // short /a/ after a child catches "ai" teaches the wrong sound. Try every
  // recorded gold-voice grapheme folder, then stay silent if none exists.
  if (normalized.length > 1) {
    const played = await playFirstAvailable(phonemeAudioCandidates(normalized), options);
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
    const played = await playFirstAvailable(candidates, options);
    if (played) return;
  }

  speakWithBrowser(cue?.fallbackText || spokenFallback, options);
}

export async function speakWord(word, options = {}) {
  if (options.signal?.aborted) return;
  options = ownCurrentCue(options);
  const slug = slugify(word);
  // Words whose only recordings are defective stay silent; never substitute a
  // synthetic voice for a phonics model.
  const candidates = wordAudioCandidates(slug);
  const played = await playFirstAvailable(candidates, options);
  if (!played && !options.signal?.aborted) speakWithBrowser(word, options);
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
  if (options.signal?.aborted) return;
  options = ownCurrentCue(options);
  const value = String(text || "").trim();
  if (!value) return;
  if (/^[a-z]+$/i.test(value)) {
    return speakWord(value, options);
  }
  const played = await playFirstAvailable([
    getLedaInstructionAudioPath(value)
  ], options);
  if (played) return;
  speakWithBrowser(value, options);
}

export function getLearnGamesAudioCacheSizeForDebug() {
  return howlCache.size;
}
