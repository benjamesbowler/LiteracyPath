import assert from "node:assert/strict";
import test from "node:test";
import { getRuntimeGuidedReadingBooks } from "../../src/utils/guidedReading/runtimeBooks.js";
import { GUIDED_READING_LEVEL_REVIEWS } from "../../src/data/guidedReadingLevelReviews.js";
import { GUIDED_READING_TEXT_ANALYSIS } from "../../src/data/generated/guidedReadingTextAnalysis.generated.js";
import { GUIDED_READING_LEXILE_MEASURES } from "../../src/data/guidedReadingLexileMeasures.js";
import { APP_READING_LEVELS, appReadingLevelLabel, getBookTextAnalysis, validateLexileReceipt } from "../../src/utils/guidedReading/bookTextAnalysis.js";
import { computeBookTextMetrics, getSentenceUnits, tokenizeReadingText } from "../../src/utils/guidedReading/textMetrics.js";

const books = getRuntimeGuidedReadingBooks();

test("every current runtime book has a pinned full-manuscript review and current analysis", () => {
  assert.deepEqual(Object.keys(GUIDED_READING_LEVEL_REVIEWS).sort(), books.map(book => book.id).sort());
  assert.deepEqual(Object.keys(GUIDED_READING_TEXT_ANALYSIS).sort(), books.map(book => book.id).sort());
  for (const book of books) {
    const analysis = getBookTextAnalysis(book);
    assert.equal(analysis.status, "current", book.id);
    assert.ok(APP_READING_LEVELS.includes(analysis.appReadingLevel), book.id);
    assert.match(analysis.textHash, /^sha256:[0-9a-f]{64}$/);
    assert.equal(analysis.reviewMethod, "codex-full-manuscript-editorial-review");
    assert.ok(analysis.rationale.length >= 90, book.id);
    assert.equal(analysis.metrics.pageCount, book.pages.length, book.id);
    if (analysis.lexile.status === "pending") assert.equal(analysis.lexile.measure, null, book.id);
    else assert.deepEqual(analysis.lexile, validateLexileReceipt(GUIDED_READING_LEXILE_MEASURES[book.id], analysis.textHash), book.id);
  }
});

test("updated, reordered and selectively hidden prose cannot retain stale levels or measures", () => {
  const original = books.find(book => book.id === "bob-and-nan-01");
  const changed = { ...original, pages: original.pages.map((page, index) => index === 0 ? { ...page, text: page.text + " New text." } : page) };
  for (const book of [changed, { ...original, title: "A new title" }, { ...original, pages: [...original.pages].reverse() }, { ...original, pages: original.pages.slice(1) }]) {
    const result = getBookTextAnalysis(book);
    assert.equal(result.status, "stale");
    assert.equal(result.appReadingLevel, null);
    assert.equal(result.metrics, null);
    assert.equal(result.lexile.measure, null);
  }
  assert.equal(getBookTextAnalysis({ id: "new-unreviewed-book", pages: [] }).status, "unreviewed");
});

test("phonics eligibility, supported-reading mode and teacher level overrides do not become new placements", () => {
  const book = books.find(item => item.readingBandProfile === "read-aloud");
  assert.equal(book.level, "READ_ALOUD");
  assert.equal(getBookTextAnalysis(book).appReadingLevel, "H");
  assert.equal(book.readingMode, "supported-read-together");
  const shortBook = books.find(item => item.id === "bob-and-nan-01");
  const moved = { ...shortBook, level: "C", levelOverride: "C" };
  assert.equal(getBookTextAnalysis(moved).appReadingLevel, "A");
  assert.equal(moved.level, "C");
});

test("short specialist nonfiction is distinguished from longer but simpler narrative", () => {
  const cave = getBookTextAnalysis(books.find(book => book.id === "level-c-nonfiction-09-caves"));
  const space = getBookTextAnalysis(books.find(book => book.id === "james-and-anna-01-space"));
  assert.ok(cave.metrics.wordCount < space.metrics.wordCount);
  assert.equal(cave.appReadingLevel, "F");
  assert.equal(space.appReadingLevel, "D");
  assert.match(cave.rationale, /stalactites/);
});

test("literal token and sentence conventions handle dialogue, honorifics, sound effects and decimals", () => {
  assert.deepEqual(tokenizeReadingText("Moonwood's blue-green sky—it's 3.5 degrees!"), ["Moonwood's", "blue-green", "sky", "it's", "3.5", "degrees"]);
  assert.equal(getSentenceUnits('Mr. Baptiste says, "Wait!" Then he counts 3.5 beats.').length, 2);
  const metrics = computeBookTextMetrics({ title: "Title must not count", pages: [
    { text: "Bob runs. Bob runs!", image: "/one.webp" },
    { text: "BOING! Nan walks." },
    { text: "Hidden words must not count.", active: false },
    { text: "Quarantined words must not count.", qaStatus: "quarantined" }
  ] });
  assert.equal(metrics.wordCount, 7);
  assert.equal(metrics.pageCount, 2);
  assert.equal(metrics.sentenceUnitCount, 4);
  assert.equal(metrics.repeatedSentenceUnitCount, 1);
  assert.equal(metrics.illustratedPageCount, 1);
  assert.equal(metrics.averageWordsPerSentence, 1.75);
  assert.equal(computeBookTextMetrics({ pages: [] }).wordCount, 0);
});

test("only exact-text authorized provider receipts can add Lexile values", () => {
  const receipt = {
    measure: "BR100L", provider: "MetaMetrics", measurementType: "authorized-commercial",
    measuredAt: "2026-10-01", receiptReference: "Measurement receipt example",
    textHash: "sha256:example", authorizedForPublication: true
  };
  assert.equal(validateLexileReceipt(receipt, receipt.textHash).measure, "BR100L");
  for (const patch of [
    { measure: "100L-300L" }, { measure: "AI estimated 250L" }, { measurementType: "classroom-estimate" },
    { authorizedForPublication: false }, { textHash: "sha256:wrong" }, { provider: "Formula" },
    { receiptReference: "" }, { measuredAt: "2026-02-31" }
  ]) assert.throws(() => validateLexileReceipt({ ...receipt, ...patch }, receipt.textHash));
  assert.throws(() => validateLexileReceipt(null, receipt.textHash));
  assert.equal(appReadingLevelLabel("D"), "App level D");
  assert.equal(appReadingLevelLabel(null), "App level pending");
});
