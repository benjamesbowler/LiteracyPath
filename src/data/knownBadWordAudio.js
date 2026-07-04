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
