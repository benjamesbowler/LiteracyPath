import { createHash } from "node:crypto";

// Cover, invitation, accessible copy and replay changes need the same review
// refresh as prose, routes and exact narration. Keep one hashing contract.
export function storyQuestReviewFingerprint(quest) {
  const { id, title, shortTitle, hook, level, series, readingSupport,
    contentRevision, coverImageUrl, coverImageAlt, startPageId,
    targetWords, highFrequencyWords, wordCards, pages } = quest;
  return createHash("sha256").update(JSON.stringify({
    id, title, shortTitle, hook, level, series, readingSupport,
    contentRevision, coverImageUrl, coverImageAlt, startPageId,
    targetWords, highFrequencyWords, wordCards,
    pages: pages.map(({ id, text, choicePrompt, replayPrompt, choices,
      imageUrl, imageAlt, audioUrl, narrationNeedsRebuild }) => ({
      id, text, choicePrompt, replayPrompt, choices, imageUrl, imageAlt,
      audioUrl, narrationNeedsRebuild
    }))
  })).digest("hex");
}
