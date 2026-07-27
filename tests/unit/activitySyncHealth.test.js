import assert from "node:assert/strict";
import test from "node:test";

import {
  ACTIVITY_SYNC_HEALTH_POLICY,
  buildClassActivitySyncHealth
} from "../../src/utils/activitySyncHealth.js";

const NOW = new Date("2026-07-24T12:00:00.000Z");

test("class sync health separates pending recovery from actual loss", () => {
  const health = buildClassActivitySyncHealth([
    {
      attempted: 100,
      delivered: 96,
      recovered: 8,
      storage_failures: 0,
      pending: 4,
      lost: 0,
      oldest_pending_at: "2026-07-24T11:50:00.000Z",
      observed_at: "2026-07-24T11:59:00.000Z"
    }
  ], { now: NOW });
  assert.equal(health.status, "healthy");
  assert.equal(health.pending, 4);
  assert.equal(health.lost, 0);
  assert.equal(health.lossRate, 0);
});

test("loss above the published threshold raises an alert", () => {
  const health = buildClassActivitySyncHealth([
    {
      attempted: 100,
      delivered: 97,
      recovered: 2,
      pending: 0,
      lost: 3,
      observed_at: "2026-07-24T11:59:00.000Z"
    }
  ], { now: NOW });
  assert.equal(ACTIVITY_SYNC_HEALTH_POLICY.lossRateAlertThreshold, 0.01);
  assert.equal(health.status, "alert");
  assert.equal(health.lossRatePercent, 3);
});

test("an old pending queue is delayed without being falsely labelled lost", () => {
  const health = buildClassActivitySyncHealth([
    {
      attempted: 20,
      delivered: 19,
      pending: 1,
      lost: 0,
      oldest_pending_at: "2026-07-24T09:00:00.000Z",
      observed_at: "2026-07-24T11:59:00.000Z"
    }
  ], { now: NOW });
  assert.equal(health.status, "delayed");
  assert.equal(health.lost, 0);
});

test("stale device snapshots are excluded from the active class signal", () => {
  const health = buildClassActivitySyncHealth([
    {
      attempted: 10,
      delivered: 0,
      lost: 10,
      observed_at: "2026-07-01T00:00:00.000Z"
    }
  ], { now: NOW });
  assert.equal(health.status, "no-data");
  assert.equal(health.excludedStaleSnapshotCount, 1);
});
