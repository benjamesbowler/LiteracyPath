import test from "node:test";
import assert from "node:assert/strict";
import { validateWorldDiscoveryDrafts, validateWorldDiscoveryReviews, validateWorldDiscoveryNarrationReview } from "../../tools/checkWorldDiscoveryBooks.mjs";
import { fingerprintBookReadingText } from "../../src/utils/guidedReading/textMetrics.js";
import { getRuntimeGuidedReadingBooks } from "../../src/utils/guidedReading/runtimeBooks.js";
import { BOOK_COLLECTIONS, bookCollectionId, buildBookShelves } from "../../src/policy/childLibraryPolicy.js";

test("the library exposes fifty World Discovery books, ten in each reviewed A–E band", () => {
  const books = getRuntimeGuidedReadingBooks().filter(book => book.seriesId === "world-discovery");
  assert.equal(books.length, 50);
  assert.equal(books.reduce((count, book) => count + book.pages.length, 0), 440);
  assert.ok(books.every(book => book.appReadingLevelStatus === "current" && bookCollectionId(book) === "world-discovery"));
  for (const level of "ABCDE") assert.equal(books.filter(book => book.appReadingLevel === level).length, 10);
  assert.equal(BOOK_COLLECTIONS.filter(row => row.id === "world-discovery").length, 1);
  const shelf = buildBookShelves({ books: [...books].reverse(), mode: "all", slots: 50 })[0];
  assert.deepEqual(shelf.books.map(row => row.book.id), books.map(book => book.id));
});

function manuscript() {
  const lines = ["Kit has a red hat.", "The hat is too big.", "Kit folds the hat.", "The hat slips down.", "Kit sees a clip.", "Kit clips the hat.", "The hat stays up.", "Kit can see the path."];
  return {
    id: "world-discovery-a-01", number: 1, title: "Kit's Hat", topic: "identity",
    type: "fiction", appLevel: "A", level: "A", readingBandProfile: "standard",
    readingMode: "predictable-levelled", interestAge: "4–8",
    setting: "A home with a low mirror.", props: ["One red paper hat", "One blue clip"],
    coverBrief: "Kit wears a folded red paper hat secured by one blue clip.",
    levelRationale: "One concrete clause and visible action per page; familiar recurring nouns.",
    languagePrep: [{ word: "clip", meaning: "a small tool that holds things together" }],
    storyBibleReview: { kind: "fiction", canonIds: ["WD-KIT"], storySpine: "Kit makes a paper hat fit by folding and clipping it.", failedAttempt: "The folded hat opens and slips down.", resolution: "The clip holds the fold so Kit can see." },
    pages: lines.map((line, index) => ({ pageNumber: index + 1, text: line, imageBrief: `Moment ${index + 1}: show the red paper hat, the mirror and the blue clip in their current state.`, imageAlt: "Kit works with a red paper hat beside a mirror.", pageDescription: "Kit works with a red paper hat beside a mirror.", state: `Hat position for scene ${index + 1}.`, embeddedImageText: "" })),
    discussion: { oral: { prompt: "How does Kit stop the hat slipping?", listenFor: "A clip holds the folded hat in place." }, visual: { page: 8, prompt: "Where is the blue clip on Kit's red hat?", lookFor: "The clip grips the folded side above Kit's eyes." } }
  };
}

function review(book) {
  return { appReadingLevel: "A", rationale: book.levelRationale, reviewedAt: "2026-11-07", reviewMethod: "codex-full-manuscript-editorial-review", reviewedTextFingerprint: fingerprintBookReadingText(book) };
}

test("source preflight works before production media and reviews exist", () => {
  const book = manuscript();
  assert.deepEqual(validateWorldDiscoveryDrafts([book], { requireComplete: false }).failures, []);
  assert.match(validateWorldDiscoveryReviews([book], {}).join("\n"), /review missing/);
});

test("changing a title, page text or page order invalidates a separately authored review", () => {
  const book = manuscript();
  const reviews = { [book.id]: review(book) };
  assert.deepEqual(validateWorldDiscoveryReviews([book], reviews), []);
  for (const edit of [
    changed => { changed.title = "A New Hat"; },
    changed => { changed.pages[0].text = "Kit has a blue hat."; },
    changed => { [changed.pages[0], changed.pages[1]] = [changed.pages[1], changed.pages[0]]; }
  ]) {
    const changed = structuredClone(book);
    edit(changed);
    assert.match(validateWorldDiscoveryReviews([changed], reviews).join("\n"), /fingerprint is stale/);
  }
});

test("a requested public band cannot override the approved band or internal limits", () => {
  const book = manuscript();
  const reviews = { [book.id]: review(book) };
  book.appLevel = "E";
  assert.match(validateWorldDiscoveryReviews([book], reviews).join("\n"), /public level differs/);
  book.appLevel = "A";
  book.pages[0].text = "Kit has a very large red paper hat.";
  assert.match(validateWorldDiscoveryDrafts([book], { requireComplete: false }).failures.join("\n"), /exceeds A limit/);
});

test("a partial set, missing fact source, duplicate manuscript and missing strand fail", () => {
  const book = manuscript();
  assert.match(validateWorldDiscoveryDrafts([book]).failures.join("\n"), /Expected 50 books/);
  const second = structuredClone(book);
  second.id = "world-discovery-a-02";
  second.number = 2;
  second.title = "Another Hat";
  second.type = "nonfiction";
  second.storyBibleReview = { kind: "nonfiction", canonIds: [], topicQuestion: "What holds a folded hat?", progression: "Compare a loose fold with a clipped fold.", synthesis: "The clip holds the fold." };
  const errors = validateWorldDiscoveryDrafts([book, second], { requireComplete: false }).failures.join("\n");
  assert.match(errors, /duplicates the manuscript/);
  assert.match(errors, /nonfiction requires factual evidence/);
  assert.match(errors, /topic does not match strand/);
});

test("legitimate patterned-line repetition is observed without imposing a blanket ban", () => {
  const book = manuscript();
  book.pages[3].text = book.pages[1].text;
  const result = validateWorldDiscoveryDrafts([book], { requireComplete: false });
  assert.deepEqual(result.failures, []);
  assert.equal(result.warnings.length, 1);
});

test("narration evidence must cover each current page and bind unique text, role and voice", () => {
  const expected = new Map([
    ["/one.mp3", { kind: "page_or_title", texts: new Set(["one page"]) }],
    ["/two.mp3", { kind: "page_or_title", texts: new Set(["two pages"]) }]
  ]);
  const pages = new Set(expected.keys());
  const results = [...expected].map(([audioPath, row]) => ({ audioPath, kind: row.kind,
    text: [...row.texts][0], lookupText: [...row.texts][0], voiceName: "en-US-Chirp3-HD-Leda" }));
  const valid = { status: "automated-review-complete", results };
  assert.deepEqual(validateWorldDiscoveryNarrationReview(valid, expected, pages, 2), []);
  const duplicates = { ...valid, results: [results[0], results[0]] };
  assert.match(validateWorldDiscoveryNarrationReview(duplicates, expected, pages, 2).join("\n"), /duplicate.*\n.*lacks narration screening/);
  for (const [field, value] of [["text", "Wrong page"], ["lookupText", "Wrong page"], ["kind", "word"], ["voiceName", "another voice"]]) {
    const changed = structuredClone(valid);
    changed.results[0][field] = value;
    assert.match(validateWorldDiscoveryNarrationReview(changed, expected, pages, 2).join("\n"), /text\/role\/voice does not match/);
  }
});
