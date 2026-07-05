// Words whose ONLY recordings in the app are defective (verified by ear,
// 2026-07-04: every copy of these is a segmented sound-it-out clip - "a...m"
// instead of "am"). Until replacement gold-voice recordings are imported,
// the audio resolvers treat these words as having NO recording, so games
// never play a wrong clip and never make one of them a listen-and-tap target.
//
// TO REMOVE AN ENTRY: import the good recording to every path listed in
// docs/KIMI_SHORT_WORD_AUDIO_RERECORD.md, listen-check it,
// then delete the word here.
export const KNOWN_BAD_WORD_AUDIO = new Set(["am", "ax", "of"]);

export function hasKnownBadWordAudio(word) {
  return KNOWN_BAD_WORD_AUDIO.has(String(word || "").toLowerCase());
}

// Exact audio FILES verified defective by ear. The quest's audio resolver
// skips these, so its fallback chain automatically picks the next good copy
// (or goes silent). Add a path here the moment a bad clip is reported;
// remove it when a replacement recording is imported.
export const KNOWN_BAD_AUDIO_PATHS = new Set([
  // 2026-07-04 (night): the ElevenLabs batch ALSO failed Benjamin's ear-check,
  // so every letter sound, digraph and name is blocked until his wife's real
  // recording is imported (script: docs/RECORDING_SCRIPT.md). Games fall back
  // to word cues; decks hide the sound button.
  "/audio/phonemes/short_a.mp3",
  "/audio/child-mode/clean-human/graphemes/short_vowels/short_a.mp3",
  "/audio/phonemes/b.mp3",
  "/audio/child-mode/clean-human/graphemes/consonants/b.mp3",
  "/audio/phonemes/c.mp3",
  "/audio/child-mode/clean-human/graphemes/consonants/c.mp3",
  "/audio/phonemes/d.mp3",
  "/audio/child-mode/clean-human/graphemes/consonants/d.mp3",
  "/audio/phonemes/short_e.mp3",
  "/audio/child-mode/clean-human/graphemes/short_vowels/short_e.mp3",
  "/audio/phonemes/f.mp3",
  "/audio/child-mode/clean-human/graphemes/consonants/f.mp3",
  "/audio/phonemes/g.mp3",
  "/audio/child-mode/clean-human/graphemes/consonants/g.mp3",
  "/audio/phonemes/h.mp3",
  "/audio/child-mode/clean-human/graphemes/consonants/h.mp3",
  "/audio/phonemes/short_i.mp3",
  "/audio/child-mode/clean-human/graphemes/short_vowels/short_i.mp3",
  "/audio/phonemes/j.mp3",
  "/audio/child-mode/clean-human/graphemes/consonants/j.mp3",
  "/audio/phonemes/k.mp3",
  "/audio/child-mode/clean-human/graphemes/consonants/k.mp3",
  "/audio/phonemes/l.mp3",
  "/audio/child-mode/clean-human/graphemes/consonants/l.mp3",
  "/audio/phonemes/m.mp3",
  "/audio/child-mode/clean-human/graphemes/consonants/m.mp3",
  "/audio/phonemes/n.mp3",
  "/audio/child-mode/clean-human/graphemes/consonants/n.mp3",
  "/audio/phonemes/short_o.mp3",
  "/audio/child-mode/clean-human/graphemes/short_vowels/short_o.mp3",
  "/audio/phonemes/p.mp3",
  "/audio/child-mode/clean-human/graphemes/consonants/p.mp3",
  "/audio/phonemes/q.mp3",
  "/audio/child-mode/clean-human/graphemes/consonants/q.mp3",
  "/audio/phonemes/r.mp3",
  "/audio/child-mode/clean-human/graphemes/consonants/r.mp3",
  "/audio/phonemes/s.mp3",
  "/audio/child-mode/clean-human/graphemes/consonants/s.mp3",
  "/audio/phonemes/t.mp3",
  "/audio/child-mode/clean-human/graphemes/consonants/t.mp3",
  "/audio/phonemes/short_u.mp3",
  "/audio/child-mode/clean-human/graphemes/short_vowels/short_u.mp3",
  "/audio/phonemes/v.mp3",
  "/audio/child-mode/clean-human/graphemes/consonants/v.mp3",
  "/audio/phonemes/w.mp3",
  "/audio/child-mode/clean-human/graphemes/consonants/w.mp3",
  "/audio/phonemes/x.mp3",
  "/audio/child-mode/clean-human/graphemes/consonants/x.mp3",
  "/audio/phonemes/y.mp3",
  "/audio/child-mode/clean-human/graphemes/consonants/y.mp3",
  "/audio/phonemes/z.mp3",
  "/audio/child-mode/clean-human/graphemes/consonants/z.mp3",
  "/audio/phonemes/sh.mp3",
  "/audio/child-mode/clean-human/graphemes/digraphs_blends/sh.mp3",
  "/audio/phonemes/ch.mp3",
  "/audio/child-mode/clean-human/graphemes/digraphs_blends/ch.mp3",
  "/audio/phonemes/th.mp3",
  "/audio/child-mode/clean-human/graphemes/digraphs_blends/th.mp3",
  "/audio/phonemes/ng.mp3",
  "/audio/child-mode/clean-human/graphemes/digraphs_blends/ng.mp3",
  "/audio/phonemes/qu.mp3",
  "/audio/child-mode/clean-human/graphemes/digraphs_blends/qu.mp3",
  "/audio/phonemes/ck.mp3",
  "/audio/child-mode/clean-human/graphemes/digraphs_blends/ck.mp3",
  "/audio/letter-names/a.mp3",
  "/audio/letter-names/b.mp3",
  "/audio/letter-names/c.mp3",
  "/audio/letter-names/d.mp3",
  "/audio/letter-names/e.mp3",
  "/audio/letter-names/f.mp3",
  "/audio/letter-names/g.mp3",
  "/audio/letter-names/h.mp3",
  "/audio/letter-names/i.mp3",
  "/audio/letter-names/j.mp3",
  "/audio/letter-names/k.mp3",
  "/audio/letter-names/l.mp3",
  "/audio/letter-names/m.mp3",
  "/audio/letter-names/n.mp3",
  "/audio/letter-names/o.mp3",
  "/audio/letter-names/p.mp3",
  "/audio/letter-names/q.mp3",
  "/audio/letter-names/r.mp3",
  "/audio/letter-names/s.mp3",
  "/audio/letter-names/t.mp3",
  "/audio/letter-names/u.mp3",
  "/audio/letter-names/v.mp3",
  "/audio/letter-names/w.mp3",
  "/audio/letter-names/x.mp3",
  "/audio/letter-names/y.mp3",
  "/audio/letter-names/z.mp3"
]);

export function isKnownBadAudioPath(path) {
  return KNOWN_BAD_AUDIO_PATHS.has(String(path || ""));
}
