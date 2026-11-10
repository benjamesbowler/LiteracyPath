import { fingerprintBookReadingText } from "../utils/guidedReading/textMetrics.js";
import { worldDiscoverySeriesOrder } from "./worldDiscoveryCohortContract.js";
import { APP_READING_LEVELS } from "../utils/guidedReading/bookLevelMetadata.js";

export function adaptWorldDiscoveryBook(row, review, cohort, releaseReady = false) {
  // The original production band keeps IDs, folders and ordering stable after
  // a repair. Only the exact-text editorial review assigns the public shelf.
  const approved = releaseReady && review?.reviewedTextFingerprint === fingerprintBookReadingText(row) && APP_READING_LEVELS.includes(review?.appReadingLevel);
  const folder = `/guided-reading/world-discovery/${row.appLevel.toLowerCase()}-${String(row.number).padStart(2, "0")}`;
  const qaStatus = approved ? "approved" : "draft";
  return {
    ...row,
    guidedReadingLevel: row.level,
    collection: "World Discovery", seriesTitle: "World Discovery", seriesId: "world-discovery",
    seriesOrder: worldDiscoverySeriesOrder(row, cohort),
    active: approved, qaStatus, narrationProfile: "leda", cast: row.storyBibleReview.canonIds,
    coverImage: `${folder}/cover.webp`, cover: `${folder}/cover.webp`, coverUrl: `${folder}/cover.webp`,
    pages: row.pages.map(page => ({ ...page,
      image: `${folder}/page-${String(page.pageNumber).padStart(2, "0")}.webp`,
      pageAudioText: page.text, narrationProfile: "leda", active: approved, qaStatus, narrationNeedsRebuild: true
    }))
  };
}
