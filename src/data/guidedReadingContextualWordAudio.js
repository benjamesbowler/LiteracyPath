import manifest from "../content/guidedReadingContextualWordAudio.json" with { type: "json" };
import { normalizeLedaAudioText } from "./normalizeLedaAudioText.js";

export const GUIDED_READING_CONTEXTUAL_WORD_AUDIO = Object.freeze(manifest.entries);

// Exact page context selects a reviewed heteronym take without changing the
// shared dictionary pronunciation used by any other book or caller.
export function getContextualGuidedReadingWordAudioPath(word, { bookId, page } = {}, entries = GUIDED_READING_CONTEXTUAL_WORD_AUDIO) {
  if (!bookId || !page?.pageNumber) return undefined;
  const key = normalizeLedaAudioText(word);
  const matches = entries.filter(row => row.bookId === bookId && row.pageNumber === page.pageNumber && row.word === key);
  if (!matches.length) return undefined;
  if (matches.length !== 1) throw Error(`Duplicate contextual narration: ${bookId}:${page.pageNumber}:${key}`);
  const row = matches[0];
  const text = Array.isArray(page.text) ? page.text.join(" ") : String(page.text || "");
  // A stale explicit context must not silently fall back to the other meaning.
  return row.status === "reviewed" && row.pageText === text && row.voiceName === "en-US-Chirp3-HD-Leda"
    ? row.audioPath || "" : "";
}
