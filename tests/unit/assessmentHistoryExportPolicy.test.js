import test from "node:test";
import assert from "node:assert/strict";

import {
  ASSESSMENT_HISTORY_EXPORT_STATES,
  assessmentHistoryExportReadiness
} from "../../src/data/assessmentHistoryExportPolicy.js";

test("global history export fails closed while cloud history is loading", () => {
  const readiness = assessmentHistoryExportReadiness({
    readState: { status: "loading", complete: false },
    recordCount: 12
  });

  assert.equal(readiness.state, ASSESSMENT_HISTORY_EXPORT_STATES.LOADING);
  assert.equal(readiness.canExport, false);
  assert.equal(readiness.canRetry, false);
});

test("global history export fails closed and offers retry after a read error", () => {
  const readiness = assessmentHistoryExportReadiness({
    readState: {
      status: "error",
      complete: false,
      error: new Error("network unavailable")
    },
    recordCount: 12
  });

  assert.equal(readiness.state, ASSESSMENT_HISTORY_EXPORT_STATES.ERROR);
  assert.equal(readiness.canExport, false);
  assert.equal(readiness.canRetry, true);
  assert.match(readiness.message, /Nothing has been exported/);
});

test("truncated or otherwise partial history can never be exported", () => {
  for (const readState of [
    { status: "partial", complete: false },
    { status: "complete", complete: false },
    { status: "complete", complete: true, truncated: true }
  ]) {
    const readiness = assessmentHistoryExportReadiness({ readState, recordCount: 5000 });
    assert.equal(readiness.state, ASSESSMENT_HISTORY_EXPORT_STATES.PARTIAL);
    assert.equal(readiness.canExport, false);
    assert.equal(readiness.canRetry, true);
  }
});

test("only a complete non-empty read can be exported", () => {
  const empty = assessmentHistoryExportReadiness({
    readState: { status: "complete", complete: true },
    recordCount: 0
  });
  const ready = assessmentHistoryExportReadiness({
    readState: { status: "complete", complete: true },
    recordCount: 12
  });

  assert.equal(empty.state, ASSESSMENT_HISTORY_EXPORT_STATES.EMPTY);
  assert.equal(empty.canExport, false);
  assert.equal(ready.state, ASSESSMENT_HISTORY_EXPORT_STATES.READY);
  assert.equal(ready.canExport, true);
});
