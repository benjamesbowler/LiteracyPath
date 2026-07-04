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
  // 2026-07-04 (evening): the full gold-voice letter-audio redo was imported
  // (90 files, hash-verified) and the previous defective clips were all
  // OVERWRITTEN, so the path blocklist is empty again. If Benjamin's
  // ear-check (docs/previews/letter_audio_audit.html) flags any new clip,
  // add its path here to silence it instantly.
]);

export function isKnownBadAudioPath(path) {
  return KNOWN_BAD_AUDIO_PATHS.has(String(path || ""));
}
