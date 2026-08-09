import { getApprovedPhonicsPatternAudioPath } from "./approvedPhonicsPatternAudio.js";
import { getApprovedPhonemeAudioPath } from "./approvedPhonemeAudio.js";
import { AUDIO_PHONEME_PATHS } from "./generated/audioPhonemePaths.generated.js";
import { isKnownBadAudioPath } from "./knownBadWordAudio.js";

const SHORT_VOWELS = new Set(["a", "e", "i", "o", "u"]);
const SPLIT_DIGRAPHS = /^[aeiou]_e$/;

// Keep the explicit deferred gate for future review rounds. The August 2026
// human-ear review resolved the previous atomic gaps, so none are deferred now.
export const DEFERRED_ATOMIC_SOUND_KEYS = Object.freeze([]);

export function normalizePhonemeKey(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized.match(/^short[_\s-]*([aeiou])$/)?.[1] || normalized;
}

export function phonemeAudioCandidates(value, { anchor = "" } = {}) {
  const key = normalizePhonemeKey(value);
  if (!key) return [];
  const approvedCue = getApprovedPhonemeAudioPath(key);
  if (approvedCue) return [approvedCue];
  if (DEFERRED_ATOMIC_SOUND_KEYS.includes(key)) return [];

  if (key.includes("_") && !SPLIT_DIGRAPHS.test(key)) {
    return [`/audio/quest/alt/${key}.mp3`];
  }

  const reviewedPattern = getApprovedPhonicsPatternAudioPath(key, anchor);
  if (SHORT_VOWELS.has(key)) {
    return [
      reviewedPattern,
      `/audio/phonemes/short_${key}.mp3`
    ].filter(Boolean);
  }
  if (SPLIT_DIGRAPHS.test(key)) {
    return [
      reviewedPattern,
      `/audio/phonemes/${key}.mp3`
    ].filter(Boolean);
  }

  const candidates = [
    reviewedPattern,
    `/audio/phonemes/${key}.mp3`
  ].filter(Boolean);

  // A doubled consonant represents the same sound as its single letter.
  const doubled = /^([bdgmnprt])\1$/.exec(key);
  if (doubled) {
    candidates.push(
      `/audio/phonemes/${doubled[1]}.mp3`
    );
  }
  return [...new Set(candidates)];
}

export function getPreferredPhonemeAudioPath(value, options = {}) {
  return phonemeAudioCandidates(value, options)
    .find(filePath => AUDIO_PHONEME_PATHS.has(filePath) && !isKnownBadAudioPath(filePath)) || "";
}

export function hasPreferredPhonemeAudio(value, options = {}) {
  return Boolean(getPreferredPhonemeAudioPath(value, options));
}
