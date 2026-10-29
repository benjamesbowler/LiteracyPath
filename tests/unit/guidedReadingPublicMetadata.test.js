import assert from "node:assert/strict";
import test from "node:test";
import { GUIDED_READING_BOOK_INDEX } from "../../src/data/generated/guidedReadingBookIndex.generated.js";
import { GUIDED_READING_LEVEL_REVIEWS } from "../../src/data/guidedReadingLevelReviews.js";
import { applyGuidedReadingLevelOverride, GUIDED_READING_MOVE_LEVELS } from "../../src/utils/guidedReading/bookLevelOverrides.js";
import { appReadingLevelLabel, getPublicBookMetadata } from "../../src/utils/guidedReading/bookLevelMetadata.js";
import { getRuntimeGuidedReadingBooks } from "../../src/utils/guidedReading/runtimeBooks.js";
import { getBookTextAnalysis } from "../../src/utils/guidedReading/bookTextAnalysis.js";
import { fingerprintBookReadingText, tokenizeReadingText } from "../../src/utils/guidedReading/textMetrics.js";

const books = getRuntimeGuidedReadingBooks();

function assertPending(metadata, status) {
  assert.equal(metadata.levelStatus, status);
  assert.equal(metadata.appReadingLevel, null);
  assert.equal(metadata.levelLabel, "App level pending");
  for (const field of ["pageCount", "wordCount", "reviewedAt", "textFingerprint"]) {
    assert.equal(metadata[field], null, `${field} must not survive an unavailable review`);
  }
}

test("the public discovery index covers every shipped book with its current authored review and literal counts", () => {
  const runtimeIds = books.map(book => book.id).sort();
  assert.deepEqual(GUIDED_READING_BOOK_INDEX.map(book => book.id).sort(), runtimeIds);
  assert.equal(new Set(runtimeIds).size, runtimeIds.length);
  for (const book of books) {
    const review = GUIDED_READING_LEVEL_REVIEWS[book.id];
    const metadata = getPublicBookMetadata(book);
    assert.ok(review, `${book.id}: authored review`);
    assert.equal(metadata.id, book.id);
    assert.equal(metadata.title, book.title);
    assert.equal(metadata.levelStatus, "current", book.id);
    assert.match(review.appReadingLevel, /^[A-H]$/, book.id);
    assert.equal(metadata.appReadingLevel, review.appReadingLevel, book.id);
    assert.equal(metadata.levelLabel, `App level ${review.appReadingLevel}`, book.id);
    assert.equal(metadata.textFingerprint, review.reviewedTextFingerprint, book.id);
    assert.equal(metadata.textFingerprint, fingerprintBookReadingText(book), book.id);
    assert.equal(metadata.reviewedAt, review.reviewedAt, book.id);
    assert.equal(metadata.readingMode, book.readingMode, book.id);
    assert.equal(metadata.pageCount, book.pages.length, book.id);
    assert.equal(metadata.wordCount, book.pages.reduce((total, page) => total + tokenizeReadingText(page.text).length, 0), book.id);
    assert.deepEqual(getPublicBookMetadata(book.id), metadata, `${book.id}: ID and full-book callers agree`);
  }
});

test("a local legacy placement override cannot reclassify any public book label", () => {
  for (const book of books) {
    const originalMetadata = getPublicBookMetadata(book);
    for (const level of GUIDED_READING_MOVE_LEVELS) {
      const moved = applyGuidedReadingLevelOverride(book, { [book.id]: level });
      if (book.readingBandProfile !== "read-aloud") assert.equal(moved.level, level);
      assert.deepEqual(getPublicBookMetadata(moved), originalMetadata, `${book.id}: internal ${level}`);
    }
  }
});

test("The Sun exposes App level D even though its retained internal profile is B", () => {
  const sun = books.find(book => book.id === "gr-a-27");
  assert.ok(sun);
  assert.equal(sun.level, "B");
  assert.equal(getPublicBookMetadata(sun).appReadingLevel, "D");
  assert.equal(getPublicBookMetadata(sun.id).levelLabel, "App level D");
});

test("ID and compact metadata become stale when a reviewed runtime page or book is retired", () => {
  const sun = books.find(book => book.id === "gr-a-27");
  const previousStorage = globalThis.localStorage;
  let retired = [];
  globalThis.localStorage = { getItem: key => key === "lpDeletedMediaManifest" ? JSON.stringify(retired) : null };
  try {
    for (const record of [
      { assetType: "guided-reading-page", bookId: sun.id, pageNumber: sun.pages[0].pageNumber },
      { assetType: "image", path: sun.pages[0].image },
      { assetType: "guided-reading-book", bookId: sun.id }
    ]) {
      retired = [record];
      assertPending(getPublicBookMetadata(sun.id), "stale");
      assertPending(getPublicBookMetadata(GUIDED_READING_BOOK_INDEX.find(book => book.id === sun.id)), "stale");
      assertPending(getPublicBookMetadata(sun), "stale");
      assert.equal(getBookTextAnalysis(sun).status, "stale", "an already loaded full book must also withhold its retired review");
      assert.equal(getBookTextAnalysis(sun).appReadingLevel, null);
    }
    for (const record of [
      { assetType: "image", path: sun.coverImage },
      { assetType: "guided-reading-page", bookId: sun.id, pageNumber: 999 },
      { assetType: "guided-reading-page", bookId: "another-book", pageNumber: sun.pages[0].pageNumber },
      { assetType: "image", path: "/superseded-page.webp" }
    ]) {
      retired = [record];
      assert.equal(getPublicBookMetadata(sun.id).levelStatus, "current", JSON.stringify(record));
      assert.equal(getBookTextAnalysis(sun).status, "current", JSON.stringify(record));
    }
    retired = [];
    assert.equal(getPublicBookMetadata(sun.id).levelStatus, "current");
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
  }
});

test("changed or partial manuscripts with saved level claims cannot expose old review metadata", () => {
  const book = books.find(item => item.id === "gr-a-27");
  const claimed = {
    ...book,
    ...getPublicBookMetadata(book),
    level: "B",
    guidedReadingLevel: "D",
    readingLevel: "D"
  };
  for (const changed of [
    { ...claimed, title: `${book.title} revised` },
    { ...claimed, pages: book.pages.map((page, index) => index ? page : { ...page, text: `${page.text} Added text.` }) },
    { ...claimed, pages: [...book.pages].reverse() },
    { ...claimed, pages: book.pages.slice(1) },
    { ...claimed, pages: [] },
    { ...claimed, pages: book.pages.map((page, index) => index ? page : { ...page, pageNumber: 99 }) },
    { ...claimed, pages: book.pages.map((page, index) => index ? page : { ...page, active: false }) },
    { ...claimed, pages: book.pages.map((page, index) => index ? page : { ...page, qaStatus: "quarantined" }) }
  ]) assertPending(getPublicBookMetadata(changed), "stale");
});

test("unknown books cannot borrow a saved letter, metric or review date", () => {
  for (const unknown of [
    undefined,
    null,
    "unreviewed-book",
    {
      id: "unreviewed-book", title: "A saved title", pages: [],
      level: "A", guidedReadingLevel: "B", appReadingLevel: "H", readingLevel: "G",
      levelLabel: "App level H", levelStatus: "current", pageCount: 99, wordCount: 999,
      reviewedAt: "2026-01-01", textFingerprint: "fnv1a64:0000000000000000"
    }
  ]) assertPending(getPublicBookMetadata(unknown), "unreviewed");
});

test("public level labels accept only the supported A-H alphabet", () => {
  for (const level of ["A", "B", "C", "D", "E", "F", "G", "H"]) {
    assert.equal(appReadingLevelLabel(level), `App level ${level}`);
  }
  for (const invalid of [undefined, null, "", "a", "I", "Z", "READ_ALOUD", "C Standard", "B · Extended", 1, {}, ["A"]]) {
    assert.equal(appReadingLevelLabel(invalid), "App level pending");
  }
});
