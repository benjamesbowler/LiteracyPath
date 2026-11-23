import assert from "node:assert/strict";
import test from "node:test";
import {
  finishGuidedReadingOccurrence,
  getGuidedReadingCompletionMilestone,
  getGuidedReadingProgressionBooks,
  guidedReadingCompletion,
  guidedReadingVisitPatch,
  mergeGuidedReadingRecord,
  shouldShowGuidedReadingCompletionSummary,
  startGuidedReadingOccurrence
} from "../../src/utils/guidedReading/completionPolicy.js";
import { mergeMonotonic, computeHydratedValue } from "../../src/utils/progressMerge.js";
import { buildBookShelves, pickContinueBook, bookReadingProgress } from "../../src/policy/childLibraryPolicy.js";
import { getGuidedReadingProgress } from "../../src/data/guidedReadingBooks.js";
import { buildGuidedReadingReportModel } from "../../src/data/studentReportingWorkspaceModel.js";
import { collectGuidedReadingCompletionRecords } from "../../src/utils/exportGuidedReadingCompletionExcel.js";

test("reader, shelf, teacher and export agree across the last page, Finish, and a saved reread", () => {
  const book = { id: "practice-book", title: "Practice Book", pages: [{}, {}, {}] };
  const totalPages = book.pages.length;
  const now = "2026-11-23T10:15:00.000Z";
  const first = startGuidedReadingOccurrence({}, { totalPages, now });
  const openedLast = guidedReadingVisitPatch({}, { occurrence: first, totalPages, now, pageIndex: 2 });

  function assertSurfaceProgress(record, readCount, bookmark, canContinue) {
    const records = { [book.id]: record };
    const shelf = bookReadingProgress(book, record);
    assert.deepEqual([shelf.readCount, shelf.page], [readCount, bookmark]);
    assert.equal(Boolean(pickContinueBook({ books: [book], records })), canContinue);
    const [{ books: rereadShelf }] = buildBookShelves({ books: [book], records, mode: "read-again" });
    assert.equal(rereadShelf.length > 0, readCount > 0);
    const progress = getGuidedReadingProgress(book, record);
    const [report] = buildGuidedReadingReportModel({ guidedReadingRecords: records }).books;
    const [excel] = collectGuidedReadingCompletionRecords({ guidedReadingRecordsByStudent: [{ studentId: "pupil", records }] });
    for (const row of [progress, report, excel]) {
      assert.deepEqual([row.readCount, row.bookmarkPage, row.completed], [readCount, bookmark, readCount > 0]);
    }
  }

  assertSurfaceProgress(openedLast, 0, 3, true);
  assert.equal(startGuidedReadingOccurrence(openedLast, { totalPages, now }).id, first.id);
  const finished = { ...openedLast, ...finishGuidedReadingOccurrence(openedLast, { occurrence: first, totalPages, now }) };
  assert.equal(finishGuidedReadingOccurrence(finished, { occurrence: first, totalPages, now }), null);
  assert.equal(startGuidedReadingOccurrence(finished, { totalPages, now }), null);
  assertSurfaceProgress(finished, 1, 3, false);

  const second = startGuidedReadingOccurrence(finished, { readAgain: true, totalPages, now });
  assert.notEqual(second.id, first.id);
  const rereading = { ...finished, ...guidedReadingVisitPatch(finished, { occurrence: second, totalPages, now, pageIndex: 0 }) };
  assert.equal(startGuidedReadingOccurrence(rereading, { totalPages, now }).id, second.id);
  // The generic recursive maximum/union is also the hosted progress merge.
  assertSurfaceProgress(mergeMonotonic(rereading, finished), 1, 1, true);
  assertSurfaceProgress(computeHydratedValue("guided_reading", book.id, { [book.id]: rereading }, openedLast)[book.id], 1, 1, true);
  const completedAgain = { ...rereading, ...finishGuidedReadingOccurrence(rereading, { occurrence: second, totalPages, now }) };
  assertSurfaceProgress(completedAgain, 2, 3, false);
  assert.equal(Object.hasOwn(completedAgain, "quizScore"), false);
});

test("only flagless legacy coverage yields inferred completion", () => {
  const historical = { completedPages: 3, totalPages: 3 };
  assert.equal(guidedReadingCompletion(historical).completionEvidence, "legacy-inferred");
  assert.equal(guidedReadingCompletion({ ...historical, completed: false }).readCount, 0);
  assert.equal(guidedReadingCompletion({ ...historical, completed: true }).completionEvidence, "confirmed");
  const now = "2026-11-23T10:15:00.000Z";
  const occurrence = startGuidedReadingOccurrence(historical, { readAgain: true, totalPages: 3, now });
  const incremental = finishGuidedReadingOccurrence(historical, { occurrence, totalPages: 3, now });
  const mixed = guidedReadingCompletion(incremental, 3);
  assert.equal(mixed.completionEvidence, "confirmed");
  assert.deepEqual([mixed.readCount, mixed.inferredReadCount], [2, 1]);
});

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

test("C Standard completion spans fiction and nonfiction while excluding extended books", () => {
  const fiction = { id: "c-fiction", level: "C", type: "fiction", readingBandProfile: "standard" };
  const nonfiction = { id: "c-nonfiction", level: "C", type: "nonfiction", readingBandProfile: "standard" };
  const extended = { id: "c-extended", level: "C", type: "fiction", readingBandProfile: "extended" };
  const progressionBooks = getGuidedReadingProgressionBooks({
    book: fiction,
    books: [
      fiction,
      nonfiction,
      extended,
      { id: "c-unclassified", level: "C", type: "fiction" },
      { id: "b-fiction", level: "B", type: "fiction" }
    ]
  });

  assert.deepEqual(progressionBooks.map(book => book.id), ["c-fiction", "c-nonfiction"]);
  assert.equal(
    getGuidedReadingCompletionMilestone({
      book: fiction,
      levelBooks: progressionBooks,
      records: {}
    }),
    null,
    "finishing only the fiction subset must not complete C Standard"
  );
  assert.deepEqual(
    getGuidedReadingCompletionMilestone({
      book: fiction,
      levelBooks: progressionBooks,
      records: { "c-nonfiction": { completed: true } }
    }),
    { level: "C", count: 2 }
  );
});

test("A and B completion pools remain scoped to the selected book type", () => {
  const selected = { id: "b-fiction-2", level: "B", type: "fiction" };
  assert.deepEqual(
    getGuidedReadingProgressionBooks({
      book: selected,
      books: [
        { id: "b-fiction-1", level: "B", type: "Fiction" },
        selected,
        { id: "b-nonfiction", level: "B", type: "non-fiction" },
        { id: "a-fiction", level: "A", type: "fiction" }
      ]
    }).map(book => book.id),
    ["b-fiction-1", "b-fiction-2"]
  );
});

test("record merge preserves raw legacy quiz fields on an existing-record completion update and creates none for a clean completion", () => {
  const previous = {
    completed: true,
    readCount: 2,
    completedAt: "2026-08-01T10:00:00.000Z"
  };
  const now = "2026-09-02T10:00:00.000Z";
  const patch = finishGuidedReadingOccurrence(previous, {
    now, totalPages: 4, occurrence: startGuidedReadingOccurrence(previous, { readAgain: true, now })
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
