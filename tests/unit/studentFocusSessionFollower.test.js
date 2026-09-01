import assert from "node:assert/strict";
import test from "node:test";

import {
  focusSessionContentOkForPoll,
  focusSessionRetryDelay,
  INITIAL_STUDENT_FOCUS_STATE,
  reduceStudentFocusState
} from "../../src/hooks/useStudentFocusSession.js";

const session = {
  id: "focus-1",
  target: "reading_library",
  status: "active",
  content_version: "release-1"
};

test("focus polling preserves the last lock while an iPad reconnects", () => {
  let state = reduceStudentFocusState(INITIAL_STUDENT_FOCUS_STATE, {
    type: "session",
    session,
    evidenceAttempts: [],
    at: "2026-08-28T12:00:00.000Z"
  });
  state = reduceStudentFocusState(state, { type: "failure" });
  assert.equal(state.connection, "reconnecting");
  assert.equal(state.session, session);
  state = reduceStudentFocusState(state, {
    type: "session",
    session: null,
    evidenceAttempts: [],
    at: "2026-08-28T12:01:00.000Z"
  });
  assert.equal(state.connection, "ended");
  assert.equal(state.session, null);
});

test("an ended session can carry a one-time student-selection command", () => {
  const state = reduceStudentFocusState({
    ...INITIAL_STUDENT_FOCUS_STATE,
    session
  }, {
    type: "session",
    session: null,
    endAction: "student_picker",
    endedSessionId: "focus-1",
    at: "2026-09-01T12:00:00.000Z"
  });

  assert.equal(state.connection, "ended");
  assert.equal(state.session, null);
  assert.equal(state.endAction, "student_picker");
  assert.equal(state.endedSessionId, "focus-1");
});

test("focus retry delay uses the bounded one-to-eight second sequence", () => {
  assert.deepEqual(
    [1, 2, 3, 4, 5, 8].map(focusSessionRetryDelay),
    [1000, 2000, 4000, 8000, 8000, 8000]
  );
});

test("exact-content failures are reported only for the matching focus session", () => {
  assert.equal(focusSessionContentOkForPoll(session, null), true);
  assert.equal(focusSessionContentOkForPoll(session, {
    sessionId: "focus-1",
    contentOk: false
  }), false);
  assert.equal(focusSessionContentOkForPoll(session, {
    sessionId: "older-focus",
    contentOk: false
  }), true);
  assert.equal(focusSessionContentOkForPoll({ ...session, content_ok: false }, {
    sessionId: "focus-1",
    contentOk: true
  }), false);
});

test("student focus polling pauses while hidden and requests an iPad wake lock", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) => readFile(
    new URL("../../src/hooks/useStudentFocusSession.js", import.meta.url),
    "utf8"
  ));
  assert.match(source, /document\.hidden[\s\S]*return/);
  assert.match(source, /navigator\.wakeLock\?\.request/);
  assert.match(source, /document\.addEventListener\("visibilitychange"/);
});
