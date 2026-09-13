// Corrected isolated words take precedence in both the full Leda catalogue
// and the lightweight child-word lookup. Regeneration must not restore an
// older recording. "Bow" is the ribbon /boʊ/, as in rainbow.
// Bow source: Google en-US-Chirp3-HD-Leda, 2026-09-13, speaking rate 0.9,
// SSML <speak><phoneme alphabet="ipa" ph="boʊ">bow</phoneme></speak>.
export const CHILD_WORD_AUDIO_OVERRIDES = Object.freeze({
  bow: "/audio/production/en-US/isolated_word/bow-e8c4e7379e.mp3",
  zipper: "/audio/production/en-US/isolated_word/zipper-10a58c0597.mp3",
  vase: "/audio/production/en-US/isolated_word/vase-8d705e6355.mp3",
  umbrella: "/audio/production/en-US/isolated_word/umbrella-5058250ea7.mp3"
});
