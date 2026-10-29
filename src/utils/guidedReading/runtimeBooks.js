// THE RUNTIME BOOK LIST — the library as it actually exists right now.
//
// Moved out of GuidedReadingPage.jsx on 2026-07-29 (phase D of the kids-side
// redesign) because two surfaces need it and only one of them is the reader:
// the child's Books screen (src/components/StudentBooksPage.jsx) shelves these
// books, and the reader opens them. A second copy of this rule is how a child
// ends up tapping a book the reader will not open.
//
// It is NOT `guidedReadingBooks`. Three things happen between the data file and
// what a child may see:
//
//   1. Books the media manifest has retired disappear entirely.
//   2. Pages that are inactive, not yet approved, or whose art has been retired
//      are dropped — and a book left with no pages disappears with them, since
//      a book you cannot turn a page of is not a book.
//   3. Historical placement overrides remain internal to practice/progress.
//      Public book levels use the reviewed A-H metadata and cannot be changed
//      by those older A/B/C overrides.
//
// Kept free of React and of `import.meta.env` so it stays importable from
// `node --test`, and imported only from lazy chunks so the 176-book dataset
// stays out of the initial bundle (see appState/appRuntimeServices.js, which
// code-splits the same data module on purpose).

import { guidedReadingBooks } from "../../data/guidedReadingBooks.js";
import { getGuidedReadingBookMetadata } from "../../data/guidedReadingBookMetadata.js";
import { getPublicBookMetadata } from "./bookLevelMetadata.js";
import {
  isGuidedReadingAssetDeleted,
  isGuidedReadingBookDeleted
} from "../../data/deletedMediaManifest.js";
import {
  applyGuidedReadingLevelOverride,
  readGuidedReadingLevelOverrides
} from "./bookLevelOverrides.js";

export function getRuntimeGuidedReadingBooks() {
  const levelOverrides = readGuidedReadingLevelOverrides();
  return guidedReadingBooks
    .filter(book => !isGuidedReadingBookDeleted(book.id))
    .map(book => {
      const metadata = getGuidedReadingBookMetadata(book);
      if (!metadata) {
        throw new Error(`Guided Reading book ${book.id || "(missing id)"} has no editorial metadata.`);
      }
      return { ...book, ...metadata };
    })
    .map(book => applyGuidedReadingLevelOverride(book, levelOverrides))
    .map(book => ({
      ...book,
      pages: (book.pages || []).filter(page =>
        page.active !== false &&
        (!page.qaStatus || page.qaStatus === "approved") &&
        !isGuidedReadingAssetDeleted({
          bookId: book.id,
          path: page.image,
          pageNumber: page.pageNumber
        })
      )
    }))
    .filter(book => (book.pages || []).length > 0)
    .map(book => {
      const publicMetadata = getPublicBookMetadata(book);
      return {
        ...book,
        appReadingLevel: publicMetadata.appReadingLevel,
        appReadingLevelStatus: publicMetadata.levelStatus,
        appReadingLevelSystem: publicMetadata.levelSystem
      };
    });
}
