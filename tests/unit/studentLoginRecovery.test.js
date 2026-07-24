import assert from "node:assert/strict";
import test from "node:test";

import {
  STUDENT_LOGIN_RECOVERY_STATES,
  classifyStudentCodeRecovery
} from "../../src/policy/studentLoginRecovery.js";

test("student code failures are three explicit and non-overlapping recovery states", () => {
  assert.equal(
    classifyStudentCodeRecovery({
      data: { ok: false, error: "not_found" },
      online: true
    }).id,
    "code-not-found"
  );
  assert.equal(
    classifyStudentCodeRecovery({
      error: { code: "network_error", message: "Failed to fetch" },
      online: true
    }).id,
    "offline"
  );
  assert.equal(
    classifyStudentCodeRecovery({
      data: { ok: false, error: "class_unavailable" },
      online: true
    }).id,
    "ask-teacher"
  );
});

test("browser connection state wins when a request fails without a useful error", () => {
  assert.equal(
    classifyStudentCodeRecovery({ error: {}, online: false }).id,
    "offline"
  );
  assert.equal(
    classifyStudentCodeRecovery({ error: { status: 0 }, online: true }).id,
    "offline"
  );
});

test("every recovery has distinct child copy, illustration, and recorded guidance", () => {
  const states = Object.values(STUDENT_LOGIN_RECOVERY_STATES);
  assert.equal(states.length, 3);
  for (const field of ["title", "detail", "image", "audioKey"]) {
    assert.equal(new Set(states.map(state => state[field])).size, 3);
    assert.equal(states.every(state => Boolean(state[field])), true);
  }
  assert.deepEqual(
    states.map(state => state.audioKey),
    ["did-not-match", "try-again", "ask-teacher"]
  );
});
