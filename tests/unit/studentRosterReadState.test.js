import assert from "node:assert/strict";
import test from "node:test";

import {
  beginStudentRosterRead,
  completeStudentRosterRead,
  createStudentRosterReadState,
  failStudentRosterRead,
  getStudentRosterReadView
} from "../../src/appState/studentRosterReadState.js";

test("an initial roster error stays incomplete rather than becoming a genuine empty class", () => {
  const loading = beginStudentRosterRead(createStudentRosterReadState(), "class-a");
  const failed = failStudentRosterRead(loading, "class-a", "unavailable");
  assert.deepEqual(getStudentRosterReadView({
    readState: failed,
    classId: "class-a"
  }), {
    status: "error",
    complete: false,
    incomplete: true,
    error: true,
    truncated: false,
    loading: false,
    rowsBelongToClass: false,
    reason: "unavailable"
  });
});

test("a class-switch error cannot lend the previous class roster to the new class", () => {
  const classA = completeStudentRosterRead(
    beginStudentRosterRead(createStudentRosterReadState(), "class-a"),
    "class-a",
    "2026-07-27T12:00:00.000Z"
  );
  const failedClassB = failStudentRosterRead(
    beginStudentRosterRead(classA, "class-b"),
    "class-b",
    "unavailable"
  );
  const view = getStudentRosterReadView({
    readState: failedClassB,
    classId: "class-b"
  });
  assert.equal(view.incomplete, true);
  assert.equal(view.rowsBelongToClass, false);
});

test("a truncated roster read is explicit and is never treated as complete", () => {
  const failed = failStudentRosterRead(
    beginStudentRosterRead(createStudentRosterReadState(), "class-a"),
    "class-a",
    "truncated"
  );
  const view = getStudentRosterReadView({ readState: failed, classId: "class-a" });
  assert.equal(view.status, "truncated");
  assert.equal(view.complete, false);
  assert.equal(view.truncated, true);
  assert.equal(view.reason, "truncated");
});

test("retry moves an incomplete read through loading to a complete owned roster", () => {
  const initial = failStudentRosterRead(
    beginStudentRosterRead(createStudentRosterReadState(), "class-a"),
    "class-a"
  );
  const retrying = beginStudentRosterRead(initial, "class-a");
  assert.equal(retrying.status, "loading");
  assert.equal(retrying.attempt, 2);

  const complete = completeStudentRosterRead(
    retrying,
    "class-a",
    "2026-07-27T12:05:00.000Z"
  );
  const view = getStudentRosterReadView({ readState: complete, classId: "class-a" });
  assert.equal(view.complete, true);
  assert.equal(view.rowsBelongToClass, true);
  assert.equal(view.reason, "");
});
