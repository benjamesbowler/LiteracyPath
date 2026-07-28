import assert from "node:assert/strict";
import test from "node:test";

import {
  beginClassListRead,
  completeClassListRead,
  createClassListReadState,
  failClassListRead,
  getClassListReadView
} from "../../src/appState/classListReadState.js";

test("an initial class error is explicit and cannot become a genuine no-classes state", () => {
  const failed = failClassListRead(
    beginClassListRead(createClassListReadState(), "teacher-a"),
    "teacher-a",
    "error"
  );
  const view = getClassListReadView({
    readState: failed,
    teacherId: "teacher-a"
  });

  assert.equal(view.status, "error");
  assert.equal(view.complete, false);
  assert.equal(view.failed, true);
  assert.equal(view.rowsVerified, false);
});

test("a failed refresh retains only rows previously verified for the same teacher", () => {
  const complete = completeClassListRead(
    beginClassListRead(createClassListReadState(), "teacher-a"),
    "teacher-a",
    "2026-07-28T10:00:00.000Z"
  );
  const failed = failClassListRead(
    beginClassListRead(complete, "teacher-a"),
    "teacher-a",
    "error"
  );

  assert.equal(getClassListReadView({
    readState: failed,
    teacherId: "teacher-a"
  }).rowsVerified, true);
  assert.equal(getClassListReadView({
    readState: failed,
    teacherId: "teacher-b"
  }).rowsVerified, false);
});

test("a safety-limit class read is distinct from a network or permission error", () => {
  const failed = failClassListRead(
    beginClassListRead(createClassListReadState(), "teacher-a"),
    "teacher-a",
    "truncated"
  );
  const view = getClassListReadView({
    readState: failed,
    teacherId: "teacher-a"
  });

  assert.equal(view.status, "truncated");
  assert.equal(view.truncated, true);
  assert.equal(view.error, false);
});
