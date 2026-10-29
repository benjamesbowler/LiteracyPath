import { MISSING_SANDWICH_BOOK_ID } from "./meadowPalsScienceIdentity.js";

// Exact independently reviewed manuscripts. Read Together is a support mode,
// not a route around the graded text rules for an unregistered story.
export const SHARED_READ_ALOUD_CONTRACTS = Object.freeze({
  "bright-ideas-20": Object.freeze({
    title: "Beneath Our Street", expectedPages: 12,
    manuscriptSha256: "33e71ec8d18e20aaad74f608e1c060407f87da3ed38ac3c390e6676930973cbc",
    maximumPageWords: 53, maximumSentenceWords: 21, maximumPageSentences: 10,
    narrationProfile: "leda", reviewDate: "2026-10-29",
    reviewEvidence: "Independent complete-manuscript, ESL meaning, factual-source and teaching-guide review; Foundations Expansion content Bible."
  })
});

export function usesCharacterNarration(book = {}) {
  // Missing Sandwich retains its separate exact voice/segment/hash gate.
  return book.id === MISSING_SANDWICH_BOOK_ID;
}
