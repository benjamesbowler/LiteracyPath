import levelA from "../content/world-discovery/level-a.json" with { type: "json" };
import levelB from "../content/world-discovery/level-b.json" with { type: "json" };
import levelC from "../content/world-discovery/level-c.json" with { type: "json" };
import levelD from "../content/world-discovery/level-d.json" with { type: "json" };
import levelE from "../content/world-discovery/level-e.json" with { type: "json" };
import reviews from "../content/world-discovery/reviews.json" with { type: "json" };
import { fingerprintBookReadingText } from "../utils/guidedReading/textMetrics.js";

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

// These source manuscripts remain available to production tools before release.
// Authored review fingerprints are separate, so editing prose never approves it.
export const WORLD_DISCOVERY_MANUSCRIPTS = deepFreeze([
  ...levelA, ...levelB, ...levelC, ...levelD, ...levelE
]);

export const GUIDED_READING_WORLD_DISCOVERY_LEVEL_REVIEWS = deepFreeze(reviews);

export const GUIDED_READING_WORLD_DISCOVERY_BOOKS = deepFreeze(WORLD_DISCOVERY_MANUSCRIPTS.map(row => {
  const review = reviews[row.id];
  const manuscriptReviewed = review?.reviewedTextFingerprint === fingerprintBookReadingText(row)
    && review?.appReadingLevel === row.appLevel;
  const folder = `/guided-reading/world-discovery/${row.appLevel.toLowerCase()}-${String(row.number).padStart(2, "0")}`;
  const qaStatus = manuscriptReviewed ? "approved" : "draft";
  return {
    ...row,
    guidedReadingLevel: row.level,
    collection: "World Discovery",
    seriesTitle: "World Discovery",
    seriesId: "world-discovery",
    seriesOrder: (row.appLevel.charCodeAt(0) - 65) * 10 + row.number,
    active: manuscriptReviewed,
    qaStatus,
    narrationProfile: "leda",
    cast: row.storyBibleReview.canonIds,
    coverImage: `${folder}/cover.webp`,
    cover: `${folder}/cover.webp`,
    coverUrl: `${folder}/cover.webp`,
    pages: row.pages.map(page => ({
      ...page,
      image: `${folder}/page-${String(page.pageNumber).padStart(2, "0")}.webp`,
      pageAudioText: page.text,
      narrationProfile: "leda",
      active: manuscriptReviewed,
      qaStatus,
      // The existing exact-text Leda clearance applies on runtime integration.
      narrationNeedsRebuild: true
    }))
  };
}));

export const GUIDED_READING_WORLD_DISCOVERY_METADATA = deepFreeze(Object.fromEntries(
  WORLD_DISCOVERY_MANUSCRIPTS.map(book => [book.id, {
    readingBandProfile: book.readingBandProfile,
    readingMode: book.readingMode
  }])
));

export const GUIDED_READING_DISCUSSION_PROMPTS_WORLD_DISCOVERY = deepFreeze(Object.fromEntries(
  WORLD_DISCOVERY_MANUSCRIPTS.map(book => [book.id, book.discussion])
));
