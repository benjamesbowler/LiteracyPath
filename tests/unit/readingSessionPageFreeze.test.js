import assert from "node:assert/strict";
import test from "node:test";

import { resolveFollowerPage } from "../../src/hooks/readingSessionFollowerState.js";

test("the follower resolves the frozen page number instead of its local array index", () => {
  const result = resolveFollowerPage({
    books: [{ id: "book", pages: [{ pageNumber: 1 }, { pageNumber: 4 }, { pageNumber: 7 }] }],
    session: { book_id: "book", page_numbers: [1, 7], page_index: 1, content_version: "v1" },
    contentVersion: "v1"
  });
  assert.equal(result.page.pageNumber, 7);
  assert.equal(result.contentOk, true);
});

test("a missing frozen page or stale content version reports content not ready", () => {
  const missing = resolveFollowerPage({
    books: [{ id: "book", pages: [{ pageNumber: 1 }] }],
    session: { book_id: "book", page_numbers: [9], page_index: 0, content_version: "v1" },
    contentVersion: "v1"
  });
  assert.equal(missing.page, null);
  assert.equal(missing.contentOk, false);
  const stale = resolveFollowerPage({
    books: [{ id: "book", pages: [{ pageNumber: 1 }] }],
    session: { book_id: "book", page_numbers: [1], page_index: 0, content_version: "old" },
    contentVersion: "new"
  });
  assert.equal(stale.contentOk, false);
});
