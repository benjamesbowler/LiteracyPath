import assert from "node:assert/strict";
import test from "node:test";

import {
  clearReadingMarkTargetOnTurn,
  nextReadingWordMark,
  readingMarkAction
} from "../../src/hooks/readingSessionMarkTarget.js";

test("a word tap with no reading target selected writes nothing", () => {
  assert.equal(readingMarkAction({ markTarget: null, pageIndex: 0, wordIndex: 2 }), null);
});

test("the reading target clears on every page turn", () => {
  assert.equal(clearReadingMarkTargetOnTurn({ id: "child-1" }), null);
});

test("word marks cycle predictably and preserve the previous value for undo", () => {
  assert.equal(nextReadingWordMark(""), "correct");
  assert.equal(nextReadingWordMark("correct"), "support");
  assert.equal(nextReadingWordMark("support"), "");
  const action = readingMarkAction({
    markTarget: { id: "child-1" }, pageIndex: 1, wordIndex: 4, existingMark: "correct"
  });
  assert.deepEqual(action, {
    studentId: "child-1",
    pageIndex: 1,
    wordIndex: 4,
    previousMark: "correct",
    nextMark: "support"
  });
});
