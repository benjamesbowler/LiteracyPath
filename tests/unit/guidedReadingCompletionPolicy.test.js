import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGuidedReadingCompletionPatch,
  getGuidedReadingCompletionMilestone,
  mergeGuidedReadingRecord,
  shouldShowGuidedReadingCompletionSummary
} from "../../src/utils/guidedReading/completionPolicy.js";

test("only a teacher completing a named student's book sees the end-of-book summary", () => {
  assert.equal(shouldShowGuidedReadingCompletionSummary({ mode: "teacher", studentId: "student-1" }), true);
  assert.equal(shouldShowGuidedReadingCompletionSummary({ mode: "teacher", studentId: "" }), false);
  assert.equal(shouldShowGuidedReadingCompletionSummary({ mode: "student", studentId: "student-1" }), false);
  assert.equal(shouldShowGuidedReadingCompletionSummary({ mode: "class", studentId: "student-1" }), false);
  assert.equal(shouldShowGuidedReadingCompletionSummary({ mode: "class", studentId: "" }), false);
});

test("completion identifies the level milestone using the completed record and no quiz result", () => {
  const book = { id: "book-2", level: "C" };
  assert.deepEqual(
    getGuidedReadingCompletionMilestone({
      book,
      levelBooks: [{ id: "book-1", level: "C" }, book],
      records: { "book-1": { completed: true } }
    }),
    { level: "C", count: 2 }
  );
  assert.equal(
    getGuidedReadingCompletionMilestone({
      book,
      levelBooks: [{ id: "book-1", level: "C" }, book],
      records: {}
    }),
    null
  );
});

test("C Standard progression does not wait for C Extended read-together history", () => {
  const standard = { id: "c-standard", level: "C", readingBandProfile: "standard" };
  const extended = { id: "c-extended", level: "C", readingBandProfile: "extended" };
  assert.deepEqual(
    getGuidedReadingCompletionMilestone({
      book: standard,
      levelBooks: [{ id: "c-standard-1", level: "C", readingBandProfile: "standard" }, standard, extended],
      records: { "c-standard-1": { completed: true } }
    }),
    { level: "C", count: 2 }
  );
  assert.equal(
    getGuidedReadingCompletionMilestone({
      book: extended,
      levelBooks: [standard, extended],
      records: { [standard.id]: { completed: true } }
    }),
    null
  );
});

test("record merge preserves raw legacy quiz fields on an existing-record completion update and creates none for a clean completion", () => {
  const patch = buildGuidedReadingCompletionPatch({
    now: "2026-09-02T10:00:00.000Z",
    totalPages: 4,
    wasCompleted: true,
    readCount: 2,
    completedAt: "2026-08-01T10:00:00.000Z"
  });
  const legacyReread = mergeGuidedReadingRecord({
    previous: {
      quizScore: 3,
      quizTotal: 3,
      quizAt: "2026-08-01T10:01:00.000Z"
    },
    studentId: "student-1",
    book: { id: "book-1", title: "Book One", type: "fiction", level: "C" },
    now: "2026-09-02T10:00:00.000Z",
    patch
  });
  const newCompletion = mergeGuidedReadingRecord({
    previous: {},
    studentId: "student-2",
    book: { id: "book-2", title: "Book Two", type: "nonfiction", level: "C" },
    now: "2026-09-02T10:00:00.000Z",
    patch
  });

  assert.deepEqual(legacyReread, {
    studentId: "student-1",
    bookId: "book-1",
    title: "Book One",
    type: "fiction",
    level: "C",
    updatedAt: "2026-09-02T10:00:00.000Z",
    quizScore: 3,
    quizTotal: 3,
    quizAt: "2026-08-01T10:01:00.000Z",
    ...patch
  });

  assert.equal(legacyReread.quizScore, 3);
  assert.equal(legacyReread.quizTotal, 3);
  assert.equal(legacyReread.quizAt, "2026-08-01T10:01:00.000Z");
  assert.equal("quizScore" in newCompletion, false);
  assert.equal("quizTotal" in newCompletion, false);
  assert.equal("quizAt" in newCompletion, false);
});
