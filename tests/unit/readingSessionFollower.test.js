import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

import {
  followerRetryDelay,
  INITIAL_READING_FOLLOWER_STATE,
  reduceReadingFollowerState
} from "../../src/hooks/readingSessionFollowerState.js";

const session = {
  id: "session-1",
  book_id: "book-1",
  page_numbers: [1, 2, 3],
  page_index: 2,
  content_version: "release-1"
};
const page = { pageNumber: 3, text: "Current page" };

test("reading follower moves idle to live to reconnecting to ended without losing the last page", () => {
  let state = reduceReadingFollowerState(INITIAL_READING_FOLLOWER_STATE, {
    type: "session", session, page, contentOk: true
  });
  assert.equal(state.connection, "live");
  assert.equal(state.page, page);
  state = reduceReadingFollowerState(state, { type: "failure" });
  state = reduceReadingFollowerState(state, { type: "failure" });
  state = reduceReadingFollowerState(state, { type: "failure" });
  assert.equal(state.connection, "reconnecting");
  assert.equal(state.page, page);
  state = reduceReadingFollowerState(state, { type: "session", session: null });
  assert.equal(state.connection, "ended");
  assert.equal(state.page, page);
});

test("reading follower retry delay follows the bounded one-to-eight second sequence", () => {
  assert.deepEqual([1, 2, 3, 4, 5, 8].map(followerRetryDelay), [1000, 2000, 4000, 8000, 8000, 8000]);
});

test("follower failures cannot cover the student app before a real session exists", () => {
  let state = INITIAL_READING_FOLLOWER_STATE;
  state = reduceReadingFollowerState(state, { type: "failure" });
  state = reduceReadingFollowerState(state, { type: "failure" });
  state = reduceReadingFollowerState(state, { type: "failure" });
  assert.equal(state.connection, "idle");
  assert.equal(state.session, null);
  assert.equal(state.failureCount, 3);
});

test("a successful late join uses the teacher's current page immediately", () => {
  const state = reduceReadingFollowerState(INITIAL_READING_FOLLOWER_STATE, {
    type: "session", session, page, contentOk: true
  });
  assert.equal(state.session.page_index, 2);
  assert.equal(state.page.pageNumber, 3);
});

test("visibility resume polls immediately and hidden iPads do not keep a timer loop", () => {
  const source = fs.readFileSync(
    new URL("../../src/hooks/useReadingSessionFollower.js", import.meta.url),
    "utf8"
  );
  assert.match(source, /if \(!document\.hidden\) \{[\s\S]*void poll\(\)/);
  assert.match(source, /document\.hidden[\s\S]*return/);
  assert.match(source, /document\.addEventListener\("visibilitychange"/);
});
