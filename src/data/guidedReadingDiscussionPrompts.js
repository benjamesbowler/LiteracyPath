import { GUIDED_READING_DISCUSSION_PROMPTS_CORE } from "./guidedReadingDiscussionPrompts.core.js";
import { GUIDED_READING_DISCUSSION_PROMPTS_SERIES } from "./guidedReadingDiscussionPrompts.series.js";
import { GUIDED_READING_DISCUSSION_PROMPTS_WORLD } from "./guidedReadingDiscussionPrompts.world.js";
import { GUIDED_READING_DISCUSSION_PROMPTS_WILLOW } from "./guidedReadingDiscussionPrompts.willow.js";

// Static editorial authority. The approved 206-record source-family modules stay
// intact; Willow adds its own reviewable module. Nothing is inferred at runtime.
export const GUIDED_READING_DISCUSSION_PROMPTS = Object.freeze({
  ...GUIDED_READING_DISCUSSION_PROMPTS_CORE,
  ...GUIDED_READING_DISCUSSION_PROMPTS_SERIES,
  ...GUIDED_READING_DISCUSSION_PROMPTS_WORLD,
  ...GUIDED_READING_DISCUSSION_PROMPTS_WILLOW
});

export function getGuidedReadingDiscussion(bookOrId) {
  const bookId = typeof bookOrId === "string" ? bookOrId : bookOrId?.id;
  return GUIDED_READING_DISCUSSION_PROMPTS[bookId] || null;
}
