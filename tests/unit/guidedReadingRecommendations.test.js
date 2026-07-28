import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { TEACHER_COPY } from "../../src/copy/teacherCopy.js";
import { guidedReadingBooks } from "../../src/data/guidedReadingBooks.js";
import { recommendBooksForStudent } from "../../src/utils/guidedReading/recommendBooksForStudent.js";

const guidedReadingPageSource = readFileSync(
  new URL("../../src/components/guided-reading/GuidedReadingPage.jsx", import.meta.url),
  "utf8"
);

test("a student with no saved reading starts with approved Level A suggestions", () => {
  const recommendations = recommendBooksForStudent({
    books: guidedReadingBooks,
    studentProgress: { currentSkillId: "initial_sounds" },
    readingHistory: {}
  }).slice(0, 5);

  assert.equal(recommendations.length, 5);
  assert.ok(recommendations.every(item => item.book.level === "A"));
  assert.ok(recommendations.every(item => item.book.qaStatus === "approved"));
  assert.ok(recommendations.every(item => item.readingLevelSource === "starting-level"));
  assert.ok(recommendations.some(item => item.matchedNeeds.includes("initial-sounds")));
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

  assert.ok(recommendations.every(item => item.book.level === "C"));
  assert.ok(recommendations.every(item => item.readingLevelSource === "saved-reading"));
});

test("generic analyser tokens and unchecked books cannot influence recommendations", () => {
  const approved = {
    ...guidedReadingBooks.find(book => book.level === "A"),
    id: "approved-book",
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

  assert.deepEqual(recommendations.map(item => item.book.id), ["approved-book"]);
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
    guidedReadingPageSource.indexOf("const recommendationLevel")
  );
  const teacherPanel = guidedReadingPageSource.slice(
    guidedReadingPageSource.indexOf('aria-label="Guided reading recommendations"'),
    guidedReadingPageSource.indexOf("{readerOpen && !showSummary")
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
