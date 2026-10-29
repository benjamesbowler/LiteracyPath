import { GUIDED_READING_DISCUSSION_PROMPTS_NEXT_STEPS } from "./guidedReadingNextStepsBooks.js";
import { GUIDED_READING_DISCUSSION_PROMPTS_BRIGHT_IDEAS } from "./guidedReadingBrightIdeasBooks.js";
import { GUIDED_READING_DISCUSSION_PROMPTS_CORE } from "./guidedReadingDiscussionPrompts.core.js";
import { GUIDED_READING_DISCUSSION_PROMPTS_SERIES } from "./guidedReadingDiscussionPrompts.series.js";
import { GUIDED_READING_DISCUSSION_PROMPTS_WORLD } from "./guidedReadingDiscussionPrompts.world.js";
import { GUIDED_READING_DISCUSSION_PROMPTS_WILLOW } from "./guidedReadingDiscussionPrompts.willow.js";
import { GUIDED_READING_DISCUSSION_PROMPTS_SCIENCE } from "./guidedReadingDiscussionPrompts.science.js";
import { GUIDED_READING_DISCUSSION_PROMPTS_SMALL_STEPS } from "./guidedReadingSmallStepsBooks.js";

// Static editorial authority. The approved 206-record source-family modules stay
// intact; Willow adds its own reviewable module. Nothing is inferred at runtime.
export const GUIDED_READING_DISCUSSION_PROMPTS = Object.freeze({
  ...GUIDED_READING_DISCUSSION_PROMPTS_CORE,
  ...GUIDED_READING_DISCUSSION_PROMPTS_SERIES,
  ...GUIDED_READING_DISCUSSION_PROMPTS_WORLD,
  ...GUIDED_READING_DISCUSSION_PROMPTS_WILLOW,
  ...GUIDED_READING_DISCUSSION_PROMPTS_SCIENCE,
  ...GUIDED_READING_DISCUSSION_PROMPTS_SMALL_STEPS,
  ...GUIDED_READING_DISCUSSION_PROMPTS_NEXT_STEPS,
  ...GUIDED_READING_DISCUSSION_PROMPTS_BRIGHT_IDEAS
});

export function getGuidedReadingDiscussion(bookOrId) {
  const bookId = typeof bookOrId === "string" ? bookOrId : bookOrId?.id;
  return GUIDED_READING_DISCUSSION_PROMPTS[bookId] || null;
}
