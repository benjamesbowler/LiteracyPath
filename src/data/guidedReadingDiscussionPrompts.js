import { GUIDED_READING_DISCUSSION_PROMPTS_CORE } from "./guidedReadingDiscussionPrompts.core.js";
import { GUIDED_READING_DISCUSSION_PROMPTS_SERIES } from "./guidedReadingDiscussionPrompts.series.js";
import { GUIDED_READING_DISCUSSION_PROMPTS_WORLD } from "./guidedReadingDiscussionPrompts.world.js";

// Static editorial authority. Source-family modules keep a 206-record human review
// manageable; no discussion language is inferred or templated at runtime.
export const GUIDED_READING_DISCUSSION_PROMPTS = Object.freeze({
  ...GUIDED_READING_DISCUSSION_PROMPTS_CORE,
  ...GUIDED_READING_DISCUSSION_PROMPTS_SERIES,
  ...GUIDED_READING_DISCUSSION_PROMPTS_WORLD
});

export function getGuidedReadingDiscussion(bookOrId) {
  const bookId = typeof bookOrId === "string" ? bookOrId : bookOrId?.id;
  return GUIDED_READING_DISCUSSION_PROMPTS[bookId] || null;
}
