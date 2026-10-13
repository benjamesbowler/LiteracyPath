// ── THE LEVEL C SHELF ON THE RESOURCES PAGE ────────────────────────────────
//
// The four book tiles under the whole-class tools are read from the real
// runtime catalogue (including its current text rewrites), never typed out here. A
// hardcoded title survives a book being withdrawn, renamed or re-levelled, and
// then a teacher taps a tile for a book the reader cannot open.
//
// The catalogue includes page text and word audio paths, and the app
// already code-splits it (appRuntimeServices loads the guided-reading data on
// demand). Importing it statically here would drag the whole thing into the
// Resources chunk to print four titles, so the load stays dynamic.

import { getGuidedReadingBookMetadata } from "../../data/guidedReadingBookMetadata.js";
import { guidedReadingModeLabel } from "../../policy/guidedReadingCatalogPolicy.js";

import { getBookTextAnalysis, appReadingLevelLabel } from "../../utils/guidedReading/bookTextAnalysis.js";

export const LEVEL_C_SHELF_LIMIT = 4;

// Only books a teacher could actually open: withdrawn and teacher-preview rows
// are excluded rather than filtered in the component, so the same rule is
// testable on its own.
function isSuggestableLevelCBook(book) {
  if (!book || !book.title) return false;
  if (book.active === false) return false;
  if (book.teacherPreviewOnly === true) return false;
  if (String(book.status || "").toLowerCase() !== "approved") return false;
  if (String(book.level || "").toUpperCase() !== "C") return false;
  if (getGuidedReadingBookMetadata(book)?.readingBandProfile !== "standard") return false;
  return String(book.type || book.category || "").toLowerCase() === "nonfiction";
}

function shelfRow(book) {
  const metadata = getGuidedReadingBookMetadata(book);
  const parts = [book.seriesTitle, book.type || book.category, appReadingLevelLabel(getBookTextAnalysis(book).appReadingLevel), guidedReadingModeLabel(metadata?.readingMode)]
    .map(part => String(part || "").trim())
    .filter(Boolean);
  return {
    id: String(book.id || book.title),
    title: String(book.title),
    // Both title and displayed text band come from the same book the reader opens.
    meta: parts.join(" · ")
  };
}

export function selectLevelCShelf(books, limit = LEVEL_C_SHELF_LIMIT) {
  return (Array.isArray(books) ? books : [])
    .filter(isSuggestableLevelCBook)
    .slice()
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .slice(0, Math.max(0, limit))
    .map(shelfRow);
}

export function loadLevelCShelf(limit = LEVEL_C_SHELF_LIMIT) {
  return import("../../utils/guidedReading/runtimeBooks.js")
    .then(module => selectLevelCShelf(module.getRuntimeGuidedReadingBooks()
      .filter(book => book.seriesId === "first-facts-c"), limit));
}
