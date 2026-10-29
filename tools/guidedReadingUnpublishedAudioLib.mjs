import { createHash } from "node:crypto";
import { findNormalizedPageTextCollisions } from "./guidedReadingAudioPipelineLib.mjs";

// A draft shares the published normalized lookup map even before publication.
// Include only live lines whose lookup keys overlap this selected draft so an
// unrelated catalogue issue cannot widen the scoped generation preflight.
export function findUnpublishedAudioCollisions(selectedPages, publishedPages, exactOverrides) {
  const selectedKeys = new Set(selectedPages.map(page => page.normalizedText));
  const collisions = findNormalizedPageTextCollisions([
    ...selectedPages,
    ...publishedPages.filter(page => selectedKeys.has(page.normalizedText))
  ], exactOverrides);
  // An override for an older published variant does not establish the spoken
  // punctuation of a leftover normalized clip. A new draft variant may reuse
  // that clip only when the same exact text is already represented live, or
  // when the draft itself has an exact override. A fresh unmapped variant can
  // still be generated once the older variants have their own overrides.
  return collisions.map(collision => {
    const unverifiedReuses = selectedPages.filter(page =>
      page.normalizedText === collision.normalizedText
      && ["gap_generator", "production_manifest"].includes(page.origin)
      && !collision.overrideTexts.includes(page.displayedText)
      && !publishedPages.some(published => published.displayedText === page.displayedText)
    ).map(page => page.displayedText);
    const unresolvedExactTexts = [...new Set([...collision.unresolvedExactTexts, ...unverifiedReuses])];
    return { ...collision, unresolvedExactTexts, resolved: unresolvedExactTexts.length === 0 };
  });
}

// Media can be finished before a book is made available to children. Require
// an explicit series and the reviewed source hash so a stale draft cannot be
// synthesized accidentally, and never accept an existing catalogue ID here.
export function parseUnpublishedAudioManuscript(source, { sha256, bookPrefix, publishedIds = [] }) {
  if (!bookPrefix?.trim() || !/^[a-f0-9]{64}$/u.test(sha256 || "")) {
    throw new Error("An unpublished manuscript requires --book-prefix and --manuscript-sha256.");
  }
  if (createHash("sha256").update(source).digest("hex") !== sha256) {
    throw new Error("Unpublished manuscript does not match its reviewed SHA-256.");
  }
  const books = JSON.parse(source);
  if (!Array.isArray(books) || !books.length) throw new Error("Expected a nonempty manuscript book array.");
  const ids = new Set(publishedIds);
  for (const book of books) {
    if (!book || typeof book.id !== "string" || !book.id.startsWith(bookPrefix) || ids.has(book.id)) {
      throw new Error("Manuscript IDs must be unique, unpublished and within --book-prefix.");
    }
    ids.add(book.id);
    if (typeof book.title !== "string" || !book.title.trim() || book.active === false
      || !Array.isArray(book.pages) || !book.pages.length) {
      throw new Error(`Invalid unpublished book: ${book.id}`);
    }
    book.pages.forEach((page, index) => {
      if (!page || typeof page.text !== "string" || !page.text.trim() || page.active === false
        || (page.pageNumber !== undefined && page.pageNumber !== index + 1)
        || (page.pageAudioText !== undefined && page.pageAudioText !== page.text)) {
        throw new Error(`Invalid exact page narration: ${book.id} page ${index + 1}`);
      }
    });
  }
  return books;
}
