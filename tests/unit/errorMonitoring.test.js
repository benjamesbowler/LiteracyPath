import assert from "node:assert/strict";
import test from "node:test";

import {
  APP_RELEASE_ID,
  ERROR_MONITOR_POLICY,
  buildRemoteErrorEvent,
  clearErrorLog,
  logBoundaryError,
  readErrorLog,
  reportRemoteError,
  sanitizeStackFrames,
  shouldSampleError
} from "../../src/utils/errorLog.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key)
  };
}

function sensitiveError() {
  const error = new Error(
    "Aarav answered spoon; teacher@example.com; answer=spoon; "
    + "bearer eyJabcdefghijklmnopqrstuvwxyz.abcdefghijklmnopqrstuvwxyz.signature"
  );
  error.stack = [
    `Error: ${error.message}`,
    "    at submitAnswer (https://literacy.guide/assets/index.js?learner=Aarav&answer=spoon:10:2)",
    "    at Assessment (https://literacy.guide/assets/assessment.js:20:4)",
    "    at teacher@example.com (https://literacy.guide/app.js:30:6)"
  ].join("\n");
  return error;
}

test("remote error payload keeps release attribution and excludes arbitrary error content", async () => {
  const event = buildRemoteErrorEvent({
    label: "Assessment screen crashed before fallback.",
    error: sensitiveError(),
    source: "release-gate",
    sampleRate: 1,
    releaseId: "release-test-abc123"
  });
  const calls = [];
  const client = {
    async call(name, payload) {
      calls.push({ name, payload });
      return {
        data: { ok: true, alert_required: false, retention_days: 30 },
        error: null
      };
    }
  };

  const result = await reportRemoteError(event, {
    client,
    configured: true,
    random: () => 0
  });
  assert.equal(result.ok, true);
  assert.equal(result.retentionDays, 30);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, "report_app_error");
  assert.equal(calls[0].payload.p_release_id, "release-test-abc123");
  assert.equal(calls[0].payload.p_surface, "assessment");
  assert.equal(calls[0].payload.p_error_type, "Error");
  assert.equal(calls[0].payload.p_source, "release-gate");
  assert.equal(calls[0].payload.p_sample_rate, 1);
  assert.equal("p_message" in calls[0].payload, false);

  const serialized = JSON.stringify(calls[0].payload);
  for (const forbidden of [
    "Aarav",
    "spoon",
    "teacher@example.com",
    "answer=",
    "bearer",
    "eyJabcdefghijklmnopqrstuvwxyz"
  ]) {
    assert.equal(serialized.includes(forbidden), false, `payload leaked ${forbidden}`);
  }
});

test("on-device fallback stores the same redacted fields and remains bounded", () => {
  const previousWindow = globalThis.window;
  globalThis.window = { localStorage: memoryStorage() };
  try {
    clearErrorLog();
    for (let index = 0; index < 25; index += 1) {
      logBoundaryError("Assessment screen crashed before fallback.", sensitiveError(), {
        configured: false,
        releaseId: "release-local-test"
      });
    }
    const rows = readErrorLog();
    assert.equal(rows.length, ERROR_MONITOR_POLICY.localLimit);
    assert.equal(rows[0].releaseId, "release-local-test");
    assert.equal(rows[0].label, "assessment");
    assert.equal(rows[0].message, "Error");
    const serialized = JSON.stringify(rows);
    assert.doesNotMatch(serialized, /Aarav|spoon|teacher@example\.com|answer=|bearer|eyJabcdefghijklmnopqrstuvwxyz/i);
  } finally {
    globalThis.window = previousWindow;
  }
});

test("sampling is explicit while fatal events are never sampled out", () => {
  const sampled = buildRemoteErrorEvent({
    error: new Error("safe"),
    sampleRate: 0.25,
    severity: "error"
  });
  assert.equal(shouldSampleError(sampled, () => 0.2), true);
  assert.equal(shouldSampleError(sampled, () => 0.3), false);

  const fatal = buildRemoteErrorEvent({
    error: new Error("safe"),
    sampleRate: 0.0001,
    severity: "fatal"
  });
  assert.equal(shouldSampleError(fatal, () => 0.9999), true);
  assert.equal(ERROR_MONITOR_POLICY.retentionDays, 30);
  assert.ok(APP_RELEASE_ID);
});

test("stack sanitizer drops the message line, query strings, IDs, emails, and secret fields", () => {
  const frames = sanitizeStackFrames(sensitiveError(), [
    "at LearnerCard (https://literacy.guide/app.js?student_name=Aarav)",
    "at 40000000-0000-4000-8000-000000000001 (https://literacy.guide/app.js)"
  ].join("\n"));
  assert.ok(frames.length >= 2);
  assert.ok(frames.length <= ERROR_MONITOR_POLICY.remoteStackFrameLimit);
  assert.doesNotMatch(JSON.stringify(frames), /Aarav|spoon|teacher@example\.com|40000000-0000-4000-8000-000000000001/i);
});
