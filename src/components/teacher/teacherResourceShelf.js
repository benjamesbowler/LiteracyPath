// ── THE LEVEL C SHELF ON THE RESOURCES PAGE ────────────────────────────────
//
// The four book tiles under the whole-class tools are read from the real
// catalogue - src/data/firstFactsLevelCBooks.js - and never typed out here. A
// hardcoded title survives a book being withdrawn, renamed or re-levelled, and
// then a teacher taps a tile for a book the reader cannot open.
//
// That catalogue is ~375KB of page text and word audio paths, and the app
// already code-splits it (appRuntimeServices loads the guided-reading data on
// demand). Importing it statically here would drag the whole thing into the
// Resources chunk to print four titles, so the load stays dynamic.

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
  return String(book.type || book.category || "").toLowerCase() === "nonfiction";
}

function shelfRow(book) {
  const parts = [book.seriesTitle, book.type || book.category, `Level ${book.level}`]
    .map(part => String(part || "").trim())
    .filter(Boolean);
  return {
    id: String(book.id || book.title),
    title: String(book.title),
    // "First Facts · nonfiction · Level C" - assembled from the book's own
    // fields so a re-levelled book describes itself correctly.
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
  return import("../../data/firstFactsLevelCBooks.js")
    .then(module => selectLevelCShelf(module.firstFactsLevelCBooks, limit));
}
