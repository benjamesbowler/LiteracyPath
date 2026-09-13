import assert from "node:assert/strict";
import test from "node:test";

import {
  focusSessionContentOkForPoll,
  focusSessionRetryDelay,
  INITIAL_STUDENT_FOCUS_STATE,
  pollStudentFocusSession,
  reduceStudentFocusState
} from "../../src/hooks/useStudentFocusSession.js";
import { STUDENT_FOCUS_CONTENT_VERSION } from "../../src/data/studentFocusSessionCore.js";
import { STUDENT_FOCUS_TARGET_OPTIONS } from "../../src/policy/studentFocusTargets.js";

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

test("a stalled focus request times out and aborts the underlying transport", async () => {
  const controller = new AbortController();
  let receivedSignal;
  const request = new Promise(() => {});
  request.abortSignal = signal => { receivedSignal = signal; return request; };
  const client = { call: () => request };
  await assert.rejects(pollStudentFocusSession({ client, token: "synthetic-token" }, {
    controller, timeoutMs: 10
  }), /student_focus_poll_timeout/);
  assert.equal(receivedSignal, controller.signal);
  assert.equal(receivedSignal.aborted, true);
});

test("cancelling an obsolete focus request settles even when its transport never does", async () => {
  const controller = new AbortController();
  let calls = 0;
  const client = { call: () => { calls += 1; return new Promise(() => {}); } };
  const pending = pollStudentFocusSession({ client, token: "synthetic-token" }, { controller });
  const rejected = assert.rejects(pending, /student_focus_poll_cancelled/);
  controller.abort();
  await rejected;
  assert.equal(calls, 1);
  await assert.rejects(pollStudentFocusSession({ client, token: "synthetic-token" }, { controller }), /student_focus_poll_cancelled/);
  assert.equal(calls, 1, "an already cancelled request must not reach the client");
});

test("a completed focus read preserves its exact protocol and cancels its deadline", async () => {
  const data = { ok: true, session: { id: "synthetic-focus", content_version: STUDENT_FOCUS_CONTENT_VERSION } };
  const calls = [];
  const client = { call: (name, args) => { calls.push({ name, args }); return Promise.resolve({ data, error: null }); } };
  assert.equal(await pollStudentFocusSession({ client, token: "synthetic-token", currentView: "cycle_practice", contentOk: false }), data);
  assert.deepEqual(calls, [{ name: "student_get_focus_session", args: {
    p_token: "synthetic-token", p_current_view: "cycle_practice", p_content_ok: false
  } }]);
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

test("stale unavailable reports cannot poison a replacement whole-class activity", () => {
  for (const option of STUDENT_FOCUS_TARGET_OPTIONS) {
    assert.equal(focusSessionContentOkForPoll({
      ...session,
      target: option.id,
      content_version: STUDENT_FOCUS_CONTENT_VERSION,
      content_ok: false
    }, null), true, option.id);
  }
});

test("current protocol and exact-content failures still fail closed", () => {
  const currentSession = {
    ...session,
    content_version: STUDENT_FOCUS_CONTENT_VERSION
  };
  assert.equal(focusSessionContentOkForPoll(currentSession, null), true);
  assert.equal(focusSessionContentOkForPoll(currentSession, {
    sessionId: "focus-1",
    contentOk: false
  }), false);
  assert.equal(focusSessionContentOkForPoll(currentSession, {
    sessionId: "older-focus",
    contentOk: false
  }), true);
  assert.equal(focusSessionContentOkForPoll(currentSession, {
    sessionId: "focus-1",
    contentOk: true
  }), true);
  assert.equal(focusSessionContentOkForPoll({
    ...currentSession,
    content_version: "student-focus-v999"
  }, null), false);
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
