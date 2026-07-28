import assert from "node:assert/strict";
import test from "node:test";

import { resolveSequencedRows } from "../../src/appState/sequencedRead.js";

test("a superseded successful read keeps rows for its caller without claiming the UI commit", () => {
  const rows = [{ id: "owned-class" }];
  assert.deepEqual(resolveSequencedRows({
    sequence: 2,
    currentSequence: 3,
    data: rows
  }), {
    current: false,
    valid: true,
    rows
  });
});

test("the latest read is marked current and malformed data fails closed to no rows", () => {
  assert.deepEqual(resolveSequencedRows({
    sequence: 4,
    currentSequence: 4,
    data: null
  }), {
    current: true,
    valid: false,
    rows: []
  });
});
