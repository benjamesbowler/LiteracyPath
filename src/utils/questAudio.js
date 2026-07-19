// Audio resolution for Sound Seekers.
//
// WHY THIS FILE EXISTS — a real bug, found while writing the design plan:
//
//   27 gold-voice clips covering the ENTIRE advanced code — a_e e_e i_e o_e u_e,
//   ar er ir or ur, ai ay ea ee eigh ew ie igh oa oe oi oo ou ow oy ue ui — are
//   recorded, on disk, in public/audio/child-mode/clean-human/graphemes/, and
//   NO RUNNING CODE PATH CAN REACH THEM:
//
//     - learnGamesAudio.speakPhoneme() does `.slice(0, 1)` on its input, so it
//       can only ever ask for a single letter.
//     - elQuestEngine.graphemeAudioPath() checks 3 of the 6 folders
//       (consonants, digraphs_blends, short_vowels) and never looks in
//       silent_e, r_controlled or vowel_teams.
//
//   So Act III's phonics audio was already paid for and silently orphaned.
//   This module resolves all six folders. That is the whole trick.
//
// THE OTHER RULE: no synthetic speech, ever. Browser TTS is a deliberate no-op
// in this codebase and generated TTS for phonics failed human ear-checks twice
// (docs/IMPROVEMENT_LOOPS.md rule #3). When there is no recording we return "",
// the caller hides its Listen button, and the app is SILENT. Silence is fine.
// A robot voice teaching a child the wrong phoneme is not.

import { AUDIO_FILE_PATHS } from "../data/generated/audioFilePaths.generated.js";
import { hasKnownBadWordAudio, isKnownBadAudioPath } from "../data/knownBadWordAudio.js";
import { QUEST_STOPS } from "../data/questSequence.js";

// The blends the trail actually teaches (st, bl, sw…). ONLY these may fall
// back to component-phoneme playback — a digraph (sh) is ONE sound and must
// never be spelled out as s-then-h.
const TAUGHT_BLENDS = new Set(
  QUEST_STOPS.flatMap(stop => (stop.teach || []).filter(entry => entry.kind === "blend").map(entry => entry.id))
);

const CLEAN = "/audio/child-mode/clean-human/graphemes";
const VOWELS = new Set(["a", "e", "i", "o", "u"]);
const SPLIT = /^[aeiou]_e$/;
const R_CONTROLLED = new Set(["ar", "er", "ir", "or", "ur"]);
const VOWEL_TEAMS = new Set([
  "ai", "ay", "ea", "ee", "eigh", "ew", "ie", "igh",
  "oa", "oe", "oi", "oo", "ou", "ow", "oy", "ue", "ui"
]);

function firstExisting(paths) {
  return paths.find(path => AUDIO_FILE_PATHS.has(path) && !isKnownBadAudioPath(path)) || "";
}

// Every place a grapheme's recording could live, in preference order.
// Exported so the content check can report exactly which paths it looked at.
export function graphemeCandidates(grapheme) {
  const g = String(grapheme || "").toLowerCase().trim();
  if (!g) return [];

  // Alternative pronunciations and morphs (y_ie, oo_short, c_s, suffix_s…)
  // live in /audio/quest/alt/. This branch is what makes the alt lessons
  // SELF-REVIVING: the pens gate checks hasGraphemeAudio, which resolves
  // through here — record the clip and the sort re-enables with no code
  // change. (Previously altPronunciationSrc pointed at the folder but nothing
  // ever called it, so even recorded clips could never revive the lesson.)
  if (g.includes("_") && !SPLIT.test(g)) {
    return [`/audio/quest/alt/${g}.mp3`];
  }

  if (g.length === 1 && VOWELS.has(g)) {
    return [`/audio/phonemes/short_${g}.mp3`, `${CLEAN}/short_vowels/short_${g}.mp3`];
  }
  if (SPLIT.test(g)) return [`${CLEAN}/silent_e/${g}.mp3`];
  if (R_CONTROLLED.has(g)) return [`${CLEAN}/r_controlled/${g}.mp3`, `/audio/phonemes/${g}.mp3`];
  if (VOWEL_TEAMS.has(g)) return [`${CLEAN}/vowel_teams/${g}.mp3`, `/audio/phonemes/${g}.mp3`];

  const candidates = [
    `/audio/phonemes/${g}.mp3`,
    `${CLEAN}/consonants/${g}.mp3`,
    `${CLEAN}/digraphs_blends/${g}.mp3`
  ];
  // A doubled consonant (pp in "happy") says its single letter's sound — the
  // floss rule adds no new phoneme, so the single letter's clip IS its clip.
  const doubled = /^([bdgmnprt])\1$/.exec(g);
  if (doubled) {
    candidates.push(
      `/audio/phonemes/${doubled[1]}.mp3`,
      `${CLEAN}/consonants/${doubled[1]}.mp3`
    );
  }
  return candidates;
}

// "" when nothing is recorded. Callers MUST treat "" as "hide the button".
export function graphemeSrc(grapheme) {
  return firstExisting(graphemeCandidates(grapheme));
}

// A blend can be SAID even with no clip of its own: it is two sounds the
// child already owns, played back to back (see sayGrapheme's fallback).
export function hasBlendAudio(blend) {
  const g = String(blend || "").toLowerCase().trim();
  if (!TAUGHT_BLENDS.has(g)) return false;
  return blendCandidateSrcs(g).length === g.length;
}

// "Can this be spoken at all" — its own clip, or a complete component
// sequence for a taught blend. 17 of 22 taught blends had no recording and
// every teach button gated here, so three whole stops taught in silence
// while the component clips sat on disk.
export function hasGraphemeAudio(grapheme) {
  return Boolean(graphemeSrc(grapheme)) || hasBlendAudio(grapheme);
}

// The letter NAME, not the sound. Teach Your Monster never says letter names,
// and it is one of the loudest complaints in their parent reviews — a child who
// can't name `s` can't be told "the letters s and h make /sh/". We say both.
export function letterNameSrc(letter) {
  const l = String(letter || "").toLowerCase().trim();
  if (l.length !== 1 || !/[a-z]/.test(l)) return "";
  return firstExisting([`/audio/letter-names/${l}.mp3`]);
}

export function wordSrc(word) {
  const slug = String(word || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  if (!slug || hasKnownBadWordAudio(slug)) return "";
  return firstExisting([
    `/audio/child-mode/clean-human/words/${slug}.mp3`,
    `/audio/child-mode/words/${slug}.mp3`,
    `/audio/child-mode/clean-human/hfw/${slug}.mp3`,
    `/audio/child-mode/hfw/${slug}.mp3`,
    `/guided-reading/audio/words/${slug}.mp3`,
    `/audio/vocabulary/${slug}.mp3`
  ]);
}

export function hasWordAudio(word) {
  return Boolean(wordSrc(word));
}

// Blends (bl, st, sw…) have no recording of their own and don't need one — a
// blend is two sounds the child already owns, said quickly. The shell plays the
// two component phonemes back to back. This returns them in order.
export function blendCandidateSrcs(blend) {
  return String(blend || "").toLowerCase().split("").map(graphemeSrc).filter(Boolean);
}

// An alternative pronunciation (y as /ie/, oo as in `book`) is a NEW sound for
// an OLD spelling, so it needs its own clip; until those are recorded the honest
// fallback is a word that contains it, not the base grapheme's other sound.
// Returning "" is correct and safe: silent, with the button hidden.
export function altPronunciationSrc(altId) {
  return firstExisting([`/audio/quest/alt/${String(altId || "").toLowerCase()}.mp3`]);
}
