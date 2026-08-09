import test from "node:test";
import assert from "node:assert/strict";
import { appendBuddyTurn, BUDDY_READER_POLICY, buildBuddyReaderPlan, summarizeBuddyReader } from "../../src/utils/guidedReading/buddyReader.js";

test("buddy plan alternates child and LEDA from the current page", () => {
  assert.deepEqual(buildBuddyReaderPlan(5, 1), [
    { pageIndex: 1, reader: "child" },
    { pageIndex: 2, reader: "leda" },
    { pageIndex: 3, reader: "child" },
    { pageIndex: 4, reader: "leda" }
  ]);
});

test("buddy evidence is non-scored and idempotent", () => {
  const turn = { pageIndex: 0, reader: "child", completedAt: "2026-08-09T00:00:00Z", scored: false };
  const once = appendBuddyTurn(null, turn);
  assert.equal(appendBuddyTurn(once, turn), once);
  assert.equal(once.childMediaCollected, false);
  assert.equal(once.turns[0].scored, false);
});

test("buddy policy prohibits child media and fluency scoring", () => {
  assert.equal(BUDDY_READER_POLICY.childMediaCollected, false);
  assert.equal(BUDDY_READER_POLICY.scoresReadingSpeed, false);
  assert.equal(BUDDY_READER_POLICY.scoresPronunciation, false);
});

test("teacher summary reports turn completion without inventing fluency evidence", () => {
  const summary = summarizeBuddyReader({ turns: [
    { reader: "child" }, { reader: "leda" }, { reader: "child" }
  ] });
  assert.deepEqual(summary, {
    childTurns: 2,
    ledaTurns: 1,
    totalTurns: 3,
    completedAt: null,
    evidenceClaim: "turn_completion_only"
  });
});
