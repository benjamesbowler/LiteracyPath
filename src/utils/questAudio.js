// Audio resolution for Sound Seekers.
//
// WHY THIS FILE EXISTS — a real bug, found while writing the design plan:
//
//   Historically, advanced grapheme clips and atomic sounds were scattered
//   across several folders, and no single running code path could reach them:
//
//     - learnGamesAudio.speakPhoneme() does `.slice(0, 1)` on its input, so it
//       can only ever ask for a single letter.
//     - elQuestEngine.graphemeAudioPath() checks 3 of the 6 folders
//       (consonants, digraphs_blends, short_vowels) and never looks in
//       silent_e, r_controlled or vowel_teams.
//
//   So Act III's phonics audio was already paid for and silently orphaned.
//   The reviewed bank now owns resolution. Superseded grapheme folders were
//   physically deleted, so this module cannot silently revive them.
//
// THE OTHER RULE: no synthetic speech, ever. Browser TTS is a deliberate no-op
// in this codebase and generated TTS for phonics failed human ear-checks twice
// (docs/IMPROVEMENT_LOOPS.md rule #3). When there is no recording we return "",
// the caller hides its Listen button, and the app is SILENT. Silence is fine.
// A robot voice teaching a child the wrong phoneme is not.

import { AUDIO_QUEST_PATHS } from "../data/generated/audioQuestPaths.generated.js";
import { hasKnownBadWordAudio, isKnownBadAudioPath } from "../data/knownBadWordAudio.js";
import {
  getPreferredPhonemeAudioPath,
  phonemeAudioCandidates
} from "../data/phonemeAudioBank.js";
import {
  getLedaProductionAudioPath,
  getLedaWordAudioPath
} from "../data/ledaProductionAudio.js";
import { QUEST_STOPS } from "../data/questSequence.js";

// The blends the trail actually teaches (st, bl, sw…). ONLY these may fall
// back to component-phoneme playback — a digraph (sh) is ONE sound and must
// never be spelled out as s-then-h.
const TAUGHT_BLENDS = new Set(
  QUEST_STOPS.flatMap(stop => (stop.teach || []).filter(entry => entry.kind === "blend").map(entry => entry.id))
);

function firstExisting(paths) {
  return paths.find(path => AUDIO_QUEST_PATHS.has(path) && !isKnownBadAudioPath(path)) || "";
}

// Every place a grapheme's recording could live, in preference order.
// Exported so the content check can report exactly which paths it looked at.
export function graphemeCandidates(grapheme) {
  return phonemeAudioCandidates(grapheme);
}

// "" when nothing is recorded. Callers MUST treat "" as "hide the button".
export function graphemeSrc(grapheme) {
  return getPreferredPhonemeAudioPath(grapheme);
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
  return firstExisting([getLedaProductionAudioPath(l, ["letter_name"])]);
}

export function wordSrc(word) {
  const slug = String(word || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const ledaPath = getLedaWordAudioPath(word);
  if (!slug || (hasKnownBadWordAudio(slug) && !ledaPath)) return "";
  return firstExisting([ledaPath]);
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
