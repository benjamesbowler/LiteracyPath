import { GUIDED_READING_BOOK_INDEX } from "../../data/generated/guidedReadingBookIndex.generated.js";
import { fingerprintBookReadingText } from "./textMetrics.js";
import { isGuidedReadingAssetDeleted, readDeletedMediaManifest } from "../../data/deletedMediaManifest.js";

export const APP_READING_LEVELS = Object.freeze(["A", "B", "C", "D", "E", "F", "G", "H"]);
export const BOOK_LEVEL_SYSTEM = "literacy-guide-a-h-v1";
export const APP_READING_LEVEL_DESCRIPTIONS = Object.freeze({
  A: "Very short, repeated naming and action patterns.",
  B: "Short sentences, small pattern changes and a simple action or result.",
  C: "Varied short language, broader vocabulary and clearly linked ideas.",
  D: "Several connected steps, introductory explanations or clues.",
  E: "Sustained stories or explanations with varied clauses and supported inference.",
  F: "Richer language, specialist ideas or several relationships to keep track of.",
  G: "Extended text with complex clues, representations or rules across the story.",
  H: "The most sustained investigations with integrated specialist explanations."
});

const catalogue = new Map(GUIDED_READING_BOOK_INDEX.map(book => [book.id, book]));

export function appReadingLevelLabel(level) {
  return APP_READING_LEVELS.includes(level) ? `App level ${level}` : "App level pending";
}

// Book complexity is current catalogue metadata, never a saved learner result
// or a conversion of the older internal A/B/C placement profile.
export function getPublicBookMetadata(bookOrId) {
  const book = typeof bookOrId === "string" ? null : bookOrId;
  const id = typeof bookOrId === "string" ? bookOrId : book?.id;
  const entry = catalogue.get(id);
  const hasCurrentReview = APP_READING_LEVELS.includes(entry?.appReadingLevel)
    && entry?.levelSystem === BOOK_LEVEL_SYSTEM && Boolean(entry?.textFingerprint);
  const changedText = hasCurrentReview && Array.isArray(book?.pages)
    && fingerprintBookReadingText(book) !== entry.textFingerprint;
  const retirements = hasCurrentReview ? readDeletedMediaManifest() : [];
  const retiredPage = retirements.length > 0 && entry.reviewedPageMedia?.pages.some(([pageNumber, suffix]) =>
    isGuidedReadingAssetDeleted({ bookId: id, pageNumber, path: entry.reviewedPageMedia.prefix + suffix }, retirements));
  const levelStatus = !hasCurrentReview ? "unreviewed" : changedText || retiredPage ? "stale" : "current";
  const appReadingLevel = levelStatus === "current" ? entry.appReadingLevel : null;
  return {
    id: id || "",
    title: entry?.title || book?.title || "",
    levelSystem: BOOK_LEVEL_SYSTEM,
    levelStatus,
    appReadingLevel,
    levelLabel: appReadingLevelLabel(appReadingLevel),
    readingMode: entry?.readingMode || book?.readingMode || null,
    pageCount: levelStatus === "current" ? entry.pageCount : null,
    wordCount: levelStatus === "current" ? entry.wordCount : null,
    reviewedAt: levelStatus === "current" ? entry.reviewedAt : null,
    textFingerprint: levelStatus === "current" ? entry.textFingerprint : null
  };
}
