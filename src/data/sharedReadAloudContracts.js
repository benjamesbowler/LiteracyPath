import { MISSING_SANDWICH_BOOK_ID } from "./meadowPalsScienceIdentity.js";

// Exact independently reviewed manuscripts. Read Together is a support mode,
// not a route around the graded text rules for an unregistered story.
export const SHARED_READ_ALOUD_CONTRACTS = Object.freeze({
  "bright-ideas-20": Object.freeze({
    title: "Beneath Our Street", expectedPages: 12,
    manuscriptSha256: "670fc3df5f9ac2ae65faf13d75b18784d17b68df53c653233205abaa3927c741",
    maximumPageWords: 53, maximumSentenceWords: 21, maximumPageSentences: 10,
    narrationProfile: "leda", reviewDate: "2026-11-09",
    reviewEvidence: "Complete-manuscript and picture-sequence re-audit; concrete ESL repairs to water movement, pipe repair and the separate-route conclusion. Factual distinctions and teaching support retained; Foundations Expansion content Bible."
  })
});

export function usesCharacterNarration(book = {}) {
  // Missing Sandwich retains its separate exact voice/segment/hash gate.
  return book.id === MISSING_SANDWICH_BOOK_ID;
}
