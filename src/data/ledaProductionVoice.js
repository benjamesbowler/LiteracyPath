// The production voice identity is shared by content metadata and the full
// audio resolver. Keep this tiny module separate so catalog code does not pull
// the complete audio transcript registry into its lazy chunk.
export const LEDA_PRODUCTION_VOICE = "en-US-Chirp3-HD-Leda";
