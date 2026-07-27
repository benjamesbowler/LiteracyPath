import assert from "node:assert/strict";
import test from "node:test";

import {
  ENGAGEMENT_RETRY_POLICY,
  buildEngagementHealthSnapshot,
  engagementRetryDelay,
  enqueueEngagementEvent,
  flushEngagementQueue,
  readEngagementQueue,
  updateEngagementHealth
} from "../../src/utils/engagementQueue.js";

class MemoryStorage {
  constructor() {
    this.values = new Map();
    this.rejectWrites = false;
  }
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) {
    if (this.rejectWrites) throw new DOMException("full", "QuotaExceededError");
    this.values.set(key, String(value));
  }
  removeItem(key) { this.values.delete(key); }
}

test("a failed event remains durable across a queue recreation and later recovers once", async () => {
  const storage = new MemoryStorage();
  const now = () => new Date("2026-07-24T10:00:00.000Z");
  const queued = enqueueEngagementEvent(storage, {
    id: "event-1",
    studentId: "student-1",
    area: "phonics_quest",
    itemId: "s1",
    event: "answer",
    payload: { correct: true }
  }, { now });
  updateEngagementHealth(storage, "student-1", { attempted: 1 }, { now });
  assert.equal(queued.stored, true);

  const failed = await flushEngagementQueue({
    storage,
    studentId: "student-1",
    now,
    force: true,
    send: async () => { throw new Error("offline"); }
  });
  assert.equal(failed.pending, 1);
  assert.equal(readEngagementQueue(storage, "student-1")[0].event.attempts, 1);

  const deliveredIds = [];
  const recovered = await flushEngagementQueue({
    storage,
    studentId: "student-1",
    now: () => new Date("2026-07-24T10:00:03.000Z"),
    send: async event => deliveredIds.push(event.id)
  });
  updateEngagementHealth(storage, "student-1", {
    delivered: recovered.delivered,
    recovered: recovered.recovered
  }, { now });

  assert.deepEqual(deliveredIds, ["event-1"]);
  assert.equal(recovered.recovered, 1);
  assert.equal(readEngagementQueue(storage, "student-1").length, 0);
  assert.deepEqual(
    buildEngagementHealthSnapshot(storage, "student-1"),
    {
      deviceId: buildEngagementHealthSnapshot(storage, "student-1").deviceId,
      attempted: 1,
      delivered: 1,
      recovered: 1,
      storageFailures: 0,
      pending: 0,
      lost: 0,
      lossRate: 0,
      oldestPendingAt: "",
      updatedAt: "2026-07-24T10:00:00.000Z"
    }
  );
});

test("retry backoff is exponential and bounded without dropping the event", () => {
  assert.equal(engagementRetryDelay(1), ENGAGEMENT_RETRY_POLICY.baseDelayMs);
  assert.equal(engagementRetryDelay(2), ENGAGEMENT_RETRY_POLICY.baseDelayMs * 2);
  assert.equal(engagementRetryDelay(99), ENGAGEMENT_RETRY_POLICY.maximumDelayMs);
});

test("a retry-metadata storage failure still returns a bounded retry time", async () => {
  const storage = new MemoryStorage();
  const now = () => new Date("2026-07-24T10:00:00.000Z");
  enqueueEngagementEvent(storage, {
    id: "event-storage-full",
    studentId: "student-1",
    area: "mission",
    event: "task_done"
  }, { now });
  storage.rejectWrites = true;

  const result = await flushEngagementQueue({
    storage,
    studentId: "student-1",
    now,
    send: async () => { throw new Error("offline"); }
  });

  assert.equal(result.storageFailures, 1);
  assert.equal(result.pending, 1);
  assert.equal(result.nextAttemptAt, "2026-07-24T10:00:02.000Z");
});

test("pending durable writes are not counted as lost", () => {
  const storage = new MemoryStorage();
  enqueueEngagementEvent(storage, {
    id: "pending",
    studentId: "student-1",
    area: "mission",
    event: "task_done"
  });
  updateEngagementHealth(storage, "student-1", { attempted: 1 });
  const health = buildEngagementHealthSnapshot(storage, "student-1");
  assert.equal(health.pending, 1);
  assert.equal(health.lost, 0);
  assert.equal(health.lossRate, 0);
});

test("a storage failure becomes an honest potential loss instead of a false delivery", () => {
  const storage = new MemoryStorage();
  storage.rejectWrites = true;
  const queued = enqueueEngagementEvent(storage, {
    id: "lost",
    studentId: "student-1",
    area: "mission",
    event: "task_done"
  });
  const healthUpdate = updateEngagementHealth(storage, "student-1", {
    attempted: 1,
    storageFailures: 1
  });
  const inMemory = buildEngagementHealthSnapshot(storage, "student-1", {
    volatileAttempted: 1,
    volatileStorageFailures: 1,
    volatilePending: 1
  });
  const afterExit = buildEngagementHealthSnapshot(storage, "student-1", {
    volatileAttempted: 1,
    volatileStorageFailures: 1
  });
  assert.equal(queued.stored, false);
  assert.equal(healthUpdate.stored, false);
  assert.equal(inMemory.pending, 1);
  assert.equal(inMemory.lost, 0);
  assert.equal(afterExit.pending, 0);
  assert.equal(afterExit.lost, 1);
  assert.equal(afterExit.lossRate, 1);
});

test("volatile pending age is preserved in the health snapshot", () => {
  const storage = new MemoryStorage();
  const health = buildEngagementHealthSnapshot(storage, "student-1", {
    volatileAttempted: 1,
    volatilePending: 1,
    volatileOldestPendingAt: "2026-07-24T09:00:00.000Z"
  });
  assert.equal(health.pending, 1);
  assert.equal(health.lost, 0);
  assert.equal(health.oldestPendingAt, "2026-07-24T09:00:00.000Z");
});
