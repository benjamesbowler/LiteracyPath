import assert from "node:assert/strict";
import test from "node:test";

import {
  describeClassAccessEvent,
  loadClassAccessLog,
  loadClassAccessSummary,
  normalizeClassAccessSummary,
  saveClassCodeExpiry
} from "../../src/data/classAccessSecurity.js";

test("class access summaries normalize counts and preserve anomaly state", () => {
  assert.deepEqual(
    normalizeClassAccessSummary({
      ok: true,
      allowed: 12,
      denied: 5,
      blocked: 2,
      anomaly: true,
      latest_at: "2026-07-25T09:00:00.000Z"
    }),
    {
      allowed: 12,
      denied: 5,
      blocked: 2,
      anomaly: true,
      latestAt: "2026-07-25T09:00:00.000Z"
    }
  );
  assert.equal(normalizeClassAccessSummary({ ok: false }), null);
});

test("teacher access data helpers use class-scoped RPCs and generic event copy", async () => {
  const calls = [];
  const client = {
    async rpc(name, payload) {
      calls.push([name, payload]);
      if (name === "teacher_class_access_summary") {
        return {
          data: { ok: true, allowed: 1, denied: 0, blocked: 0, anomaly: false },
          error: null
        };
      }
      if (name === "teacher_class_access_log") {
        return {
          data: [{
            event_type: "rate_limited",
            outcome: "blocked",
            occurred_at: "2026-07-25T09:00:00.000Z",
            device_label: "Device ABC123"
          }],
          error: null
        };
      }
      return {
        data: { ok: true, access_code_expires_at: payload.p_expires_at },
        error: null
      };
    }
  };

  const summary = await loadClassAccessSummary({ client, classId: "class-a" });
  const log = await loadClassAccessLog({ client, classId: "class-a", limit: 20 });
  const expiry = await saveClassCodeExpiry({
    client,
    classId: "class-a",
    expiresAt: "2026-08-01T09:00:00.000Z"
  });

  assert.equal(summary.data.allowed, 1);
  assert.equal(log.data[0].label, "Abusive burst blocked");
  assert.equal(log.data[0].deviceLabel, "Device ABC123");
  assert.equal(expiry.data.access_code_expires_at, "2026-08-01T09:00:00.000Z");
  assert.deepEqual(calls.map(([name]) => name), [
    "teacher_class_access_summary",
    "teacher_class_access_log",
    "teacher_set_class_code_expiry"
  ]);
  assert.equal(describeClassAccessEvent("login_succeeded"), "Learner sign-in accepted");
  assert.equal(describeClassAccessEvent("unknown"), "Class access event");
});

test("class access data helpers do not turn denied RPCs into empty success", async () => {
  const client = {
    async rpc() {
      return { data: { ok: false, error: "forbidden" }, error: null };
    }
  };
  const summary = await loadClassAccessSummary({ client, classId: "another-class" });
  const expiry = await saveClassCodeExpiry({
    client,
    classId: "another-class",
    expiresAt: null
  });
  assert.equal(summary.data, null);
  assert.equal(summary.error, "forbidden");
  assert.equal(expiry.data, null);
  assert.equal(expiry.error, "forbidden");
});
