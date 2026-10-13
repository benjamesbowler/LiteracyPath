import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { TEACHER_COPY } from "../../src/copy/teacherCopy.js";
import { guidedReadingBooks } from "../../src/data/guidedReadingBooks.js";
import { recommendBooksForStudent } from "../../src/utils/guidedReading/recommendBooksForStudent.js";
import { getRuntimeGuidedReadingBooks } from "../../src/utils/guidedReading/runtimeBooks.js";
import { getBookTextAnalysis, APP_READING_LEVELS } from "../../src/utils/guidedReading/bookTextAnalysis.js";
import { readingRecommendationReason, readingRecommendationSummary } from "../../src/utils/guidedReading/recommendationExplanation.js";

const guidedReadingPageSource = readFileSync(
  new URL("../../src/components/guided-reading/GuidedReadingPage.jsx", import.meta.url),
  "utf8"
);

test("no saved reading suggests simple reviewed texts without inventing an oral-skill match", () => {
  const recommendations = recommendBooksForStudent({
    books: guidedReadingBooks,
    studentProgress: { currentSkillId: "initial_sounds" },
    readingHistory: {}
  }).slice(0, 5);

  assert.equal(recommendations.length, 5);
  assert.ok(recommendations.every(item => item.readingLevel === "A"));
  assert.ok(recommendations.every(item => item.book.qaStatus === "approved"));
  assert.ok(recommendations.every(item => item.readingLevelSource === "starting-text"));
  assert.ok(recommendations.every(item => !item.matchedNeeds.includes("initial-sounds")));
});

test("saved reading history keeps suggestions at the student's latest reading level", () => {
  const levelCBook = guidedReadingBooks.find(book => book.level === "C");
  assert.ok(levelCBook);

  const recommendations = recommendBooksForStudent({
    books: guidedReadingBooks,
    studentProgress: { currentSkillId: "digraphs" },
    readingHistory: {
      [levelCBook.id]: {
        completed: true,
        completedAt: "2026-07-26T12:00:00.000Z",
        completedPages: levelCBook.pages.length
      }
    }
  }).slice(0, 5);

  assert.ok(recommendations.every(item => item.readingLevel === getBookTextAnalysis(levelCBook).appReadingLevel));
  assert.ok(recommendations.every(item => item.readingLevelSource === "saved-reading"));
});

test("C recommendations keep standard progression separate from extended read-together books", () => {
  const books = getRuntimeGuidedReadingBooks();
  const standard = books.find(book => book.level === "C" && book.readingBandProfile === "standard");
  const recommendations = recommendBooksForStudent({
    books,
    studentProgress: { guidedReadingLevel: "C" },
    readingHistory: { [standard.id]: { completed: true } }
  });
  assert.ok(recommendations.length > 0);
  assert.ok(recommendations.every(item => item.book.readingBandProfile === "standard"));
});

test("generic analyser tokens and unchecked books cannot influence recommendations", () => {
  const approved = {
    ...guidedReadingBooks.find(book => book.level === "A"),
    qaStatus: "approved"
  };
  const unchecked = {
    ...approved,
    id: "unchecked-book",
    title: "Unchecked book",
    qaStatus: "draft"
  };

  const recommendations = recommendBooksForStudent({
    books: [unchecked, approved],
    studentProgress: { needs: ["other"] },
    readingHistory: {}
  });

  assert.deepEqual(recommendations.map(item => item.book.id), [approved.id]);
  assert.deepEqual(recommendations[0].matchedNeeds, []);
  assert.doesNotMatch(recommendations[0].reasons.join(" "), /other|QA|approved|draft/u);
});

test("teacher display mappings never fall back to internal Guided Reading labels", () => {
  assert.equal(
    TEACHER_COPY.guidedReading.microphaseLabel("digraphs-and-blends"),
    "Digraphs and blends"
  );
  assert.equal(TEACHER_COPY.guidedReading.patternLabel("other"), "");
  assert.equal(TEACHER_COPY.guidedReading.patternLabel("internal-new-token"), "");
  assert.equal(TEACHER_COPY.guidedReading.patternLabel("digraph-th"), "“th” digraph");
});

test("Guided Reading recommendations use student results rather than the selected book", () => {
  const recommendationBlock = guidedReadingPageSource.slice(
    guidedReadingPageSource.indexOf("const recommendedBooks"),
    guidedReadingPageSource.indexOf("const recommendationDescription")
  );
  const teacherPanel = guidedReadingPageSource.slice(
    guidedReadingPageSource.indexOf('aria-label="Guided reading recommendations"'),
    guidedReadingPageSource.indexOf("{readerOpen && !scoreSummaryOpen")
  );

  assert.match(recommendationBlock, /studentProgress: recommendationEvidenceReady/);
  assert.doesNotMatch(recommendationBlock, /enrichedSelectedBook/);
  assert.doesNotMatch(teacherPanel, /Rule-based match score|QA status|recommendedMicrophase \|\|/);
  assert.doesNotMatch(teacherPanel, /item\.book\.recommendedMicrophase/);
  assert.match(teacherPanel, /formatGuidedReadingType\(item\.book\.type\)/);
  assert.match(guidedReadingPageSource, /role="main"/);
  assert.doesNotMatch(guidedReadingPageSource, /Summary saved locally/);
  assert.doesNotMatch(guidedReadingPageSource, /item\.correct\}\/\{item\.attempted/);
});

test("remapped books use the same reviewed app band in selection, badge and reason", () => {
  const books = getRuntimeGuidedReadingBooks();
  const remapped = books.find(book => book.level === "B" && getBookTextAnalysis(book).appReadingLevel === "D");
  assert.ok(remapped);
  const recommendations = recommendBooksForStudent({ books, readingHistory: { [remapped.id]: { lastReadAt: "2026-10-12T10:00:00Z" } } });
  assert.ok(recommendations.length > 0);
  for (const item of recommendations) {
    assert.equal(item.readingLevel, "D");
    assert.equal(getBookTextAnalysis(item.book).appReadingLevel, "D");
    assert.match(readingRecommendationReason(item).basis, /App level D/);
    assert.match(readingRecommendationReason(item).basis, /does not establish independent reading ability/);
  }
  assert.match(readingRecommendationSummary(recommendations), /^App level D books/);
  assert.doesNotMatch(readingRecommendationSummary(recommendations), /fit.*focus|Level B/);
});

test("all reviewed app bands remain selectable and small bands never fill with another band", () => {
  const books = getRuntimeGuidedReadingBooks();
  for (const level of APP_READING_LEVELS) {
    const recommendations = recommendBooksForStudent({ books, studentProgress: { appReadingLevel: level } });
    assert.ok(recommendations.length > 0, level);
    assert.ok(recommendations.every(item => item.readingLevel === level && getBookTextAnalysis(item.book).appReadingLevel === level), level);
  }
  assert.equal(recommendBooksForStudent({ books, studentProgress: { appReadingLevel: "H" } }).length, 1);
});

test("stale or unreviewed text cannot gain a recommendation from its old instructional letter", () => {
  const book = getRuntimeGuidedReadingBooks()[0];
  assert.deepEqual(recommendBooksForStudent({ books: [{ ...book, title: `${book.title} changed` }] }), []);
  assert.deepEqual(recommendBooksForStudent({ books: [{ ...book, id: "unreviewed" }] }), []);
});
