// Words stay here only while every available recording is defective. The
// former entries (am, ax, of) now have approved Leda replacements.
//
// TO REMOVE AN ENTRY: import the good recording to every path listed in
// the current production replacement, listen-check it,
// then delete the word here.
export const KNOWN_BAD_WORD_AUDIO = new Set();

export function hasKnownBadWordAudio(word) {
  return KNOWN_BAD_WORD_AUDIO.has(String(word || "").toLowerCase());
}

// Exact audio FILES verified defective by ear. The quest's audio resolver
// skips these, so its fallback chain automatically picks the next good copy
// (or goes silent). Add a path here the moment a bad clip is reported;
// remove it when a replacement recording is imported.
export const KNOWN_BAD_AUDIO_PATHS = new Set([
  // 2026-07-06: replaced by real gold-voice recordings (sounds-01 + words-01 batch).
]);

export function isKnownBadAudioPath(path) {
  return KNOWN_BAD_AUDIO_PATHS.has(String(path || ""));
}
