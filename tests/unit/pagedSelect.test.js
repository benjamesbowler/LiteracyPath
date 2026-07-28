import assert from "node:assert/strict";
import test from "node:test";

import { selectAllRows } from "../../src/data/pagedSelect.js";

function rangeQuery(rows, failFrom = -1) {
  return {
    async range(from, to) {
      if (from === failFrom) {
        return { data: null, error: new Error("page unavailable") };
      }
      return {
        data: rows.slice(from, to + 1),
        error: null
      };
    }
  };
}

test("reads every page instead of accepting the server row cap", async () => {
  const rows = Array.from({ length: 2_305 }, (_, id) => ({ id }));
  const result = await selectAllRows(() => rangeQuery(rows), { pageSize: 500 });

  assert.equal(result.error, null);
  assert.equal(result.truncated, false);
  assert.equal(result.data.length, rows.length);
  assert.deepEqual(result.data.at(-1), { id: 2_304 });
});

test("a later page failure preserves readable rows but reports a partial result", async () => {
  const rows = Array.from({ length: 1_500 }, (_, id) => ({ id }));
  const result = await selectAllRows(
    () => rangeQuery(rows, 500),
    { pageSize: 500 }
  );

  assert.equal(result.data.length, 500);
  assert.equal(result.truncated, true);
  assert.match(result.error.message, /page unavailable/);
});

test("a non-paging adapter never claims a full-sized page is complete", async () => {
  const rows = Array.from({ length: 500 }, (_, id) => ({ id }));
  const result = await selectAllRows(
    () => Promise.resolve({ data: rows, error: null }),
    { pageSize: 500 }
  );

  assert.equal(result.data.length, 500);
  assert.equal(result.truncated, true);
});

test("the maximum read limit is surfaced as truncation rather than success", async () => {
  const rows = Array.from({ length: 2_000 }, (_, id) => ({ id }));
  const result = await selectAllRows(
    () => rangeQuery(rows),
    { pageSize: 500, maxRows: 1_000 }
  );

  assert.equal(result.data.length, 1_000);
  assert.equal(result.error, null);
  assert.equal(result.truncated, true);
});
