import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGuidedReadingCompletionPatch,
  getGuidedReadingCompletionMilestone,
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

test("completion persistence preserves historical quiz fields without writing new ones", () => {
  const patch = buildGuidedReadingCompletionPatch({
    now: "2026-09-02T10:00:00.000Z",
    totalPages: 4,
    wasCompleted: true,
    readCount: 2,
    completedAt: "2026-08-01T10:00:00.000Z"
  });
  const legacyReread = {
    quizScore: 3,
    quizTotal: 3,
    quizAt: "2026-08-01T10:01:00.000Z",
    ...patch
  };
  const newCompletion = { ...patch };

  assert.equal(legacyReread.quizScore, 3);
  assert.equal(legacyReread.quizTotal, 3);
  assert.equal(legacyReread.quizAt, "2026-08-01T10:01:00.000Z");
  assert.equal("quizScore" in newCompletion, false);
  assert.equal("quizTotal" in newCompletion, false);
  assert.equal("quizAt" in newCompletion, false);
});
