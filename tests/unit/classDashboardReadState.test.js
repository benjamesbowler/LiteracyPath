import assert from "node:assert/strict";
import test from "node:test";

import {
  beginClassDashboardRead,
  completeClassDashboardRead,
  createClassDashboardReadState,
  failClassDashboardRead,
  getClassDashboardReadView
} from "../../src/appState/classDashboardReadState.js";

test("dashboard rows from one class never belong to a newly selected class", () => {
  const classA = completeClassDashboardRead(
    beginClassDashboardRead(createClassDashboardReadState(), "class-a"),
    "class-a",
    "2026-07-28T10:00:00.000Z"
  );
  const classBLoading = beginClassDashboardRead(classA, "class-b");
  const view = getClassDashboardReadView({
    readState: classBLoading,
    classId: "class-b"
  });

  assert.equal(view.loading, true);
  assert.equal(view.rowsBelongToClass, false);
});

test("a rejected dashboard refresh remains retryable and preserves same-class provenance", () => {
  const complete = completeClassDashboardRead(
    beginClassDashboardRead(createClassDashboardReadState(), "class-a"),
    "class-a"
  );
  const failed = failClassDashboardRead(
    beginClassDashboardRead(complete, "class-a"),
    "class-a",
    "error"
  );
  const view = getClassDashboardReadView({
    readState: failed,
    classId: "class-a"
  });

  assert.equal(view.status, "error");
  assert.equal(view.failed, true);
  assert.equal(view.rowsBelongToClass, true);
});

test("a truncated dashboard read is never marked complete", () => {
  const failed = failClassDashboardRead(
    beginClassDashboardRead(createClassDashboardReadState(), "class-a"),
    "class-a",
    "truncated"
  );
  const view = getClassDashboardReadView({
    readState: failed,
    classId: "class-a"
  });

  assert.equal(view.status, "truncated");
  assert.equal(view.truncated, true);
  assert.equal(view.complete, false);
});
