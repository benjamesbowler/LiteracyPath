import { test } from "node:test";
import assert from "node:assert/strict";
import {
  enqueueProgressQueueEntry,
  LEGACY_PROGRESS_QUEUE_KEY,
  mergeProgressQueueRecords,
  PROGRESS_QUEUE_ENTRY_PREFIX,
  readProgressQueueRecords,
  removeProgressQueueRecords
} from "../../src/utils/progressQueue.js";

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

function questEntry(revision, stopsDone, extra = {}) {
  return {
    studentId: "child-1",
    area: "phonics_quest",
    key: "__all__",
    revision,
    queuedAt: `2026-07-20T10:00:0${revision.endsWith("b") ? 2 : 1}.000Z`,
    updatedAt: `2026-07-20T10:00:0${revision.endsWith("b") ? 2 : 1}.000Z`,
    payload: { trail: { stopsDone, routeCursor: stopsDone.length + 1 }, ...extra }
  };
}

test("independent tab revisions merge without a shared-array lost update", () => {
  const storage = new MemoryStorage();
  const a = questEntry("rev-a", ["s1"]);
  const b = questEntry("rev-b", ["s2"]);
  // This is the collision v1 could not represent: both tabs append from the
  // same empty snapshot. Distinct keys make both writes independently durable.
  storage.setItem(`${PROGRESS_QUEUE_ENTRY_PREFIX}rev-a`, JSON.stringify(a));
  storage.setItem(`${PROGRESS_QUEUE_ENTRY_PREFIX}rev-b`, JSON.stringify(b));

  const records = readProgressQueueRecords(storage);
  assert.equal(records.length, 2);
  const merged = mergeProgressQueueRecords(records);
  assert.deepEqual([...merged.payload.trail.stopsDone].sort(), ["s1", "s2"]);
  assert.equal(merged.payload.telemetry, undefined);
});

test("sequential offline queue writes keep latest local route/checkpoint while unioning achievements", () => {
  const storage = new MemoryStorage();
  enqueueProgressQueueEntry(storage, questEntry("first", ["s1"], {
    trail: { stopsDone: ["s1"], routeCursor: 2 },
    checkpoint: { stopId: "s2", beatIndex: 1 }
  }), { revision: "first" });
  enqueueProgressQueueEntry(storage, questEntry("second", ["s1", "s2"], {
    trail: { stopsDone: ["s1", "s2"], routeCursor: 3 },
    checkpoint: { stopId: "s3", beatIndex: 0 }
  }), { revision: "second" });

  const merged = mergeProgressQueueRecords(readProgressQueueRecords(storage));
  assert.deepEqual(merged.payload.trail.stopsDone, ["s1", "s2"]);
  assert.equal(merged.payload.trail.routeCursor, 3);
  assert.deepEqual(merged.payload.checkpoint, { stopId: "s3", beatIndex: 0 });
});

test("a flush removes only its snapshot while a concurrent revision survives", () => {
  const storage = new MemoryStorage();
  storage.setItem(`${PROGRESS_QUEUE_ENTRY_PREFIX}rev-a`, JSON.stringify(questEntry("rev-a", ["s1"])));
  const uploadSnapshot = readProgressQueueRecords(storage);
  storage.setItem(`${PROGRESS_QUEUE_ENTRY_PREFIX}rev-b`, JSON.stringify(questEntry("rev-b", ["s2"])));

  removeProgressQueueRecords(storage, uploadSnapshot);
  const remaining = readProgressQueueRecords(storage);
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].entry.revision, "rev-b");
});

test("v1 records migrate into a v2 replacement without losing their payload", () => {
  const storage = new MemoryStorage();
  storage.setItem(LEGACY_PROGRESS_QUEUE_KEY, JSON.stringify([questEntry("legacy-a", ["s1"])]));
  const queued = enqueueProgressQueueEntry(storage, questEntry("incoming", ["s2"]), { revision: "v2-new" });
  assert.equal(queued.stored, true);
  const merged = mergeProgressQueueRecords(readProgressQueueRecords(storage));
  assert.deepEqual([...merged.payload.trail.stopsDone].sort(), ["s1", "s2"]);

  removeProgressQueueRecords(storage, readProgressQueueRecords(storage));
  assert.equal(readProgressQueueRecords(storage).length, 0);
});

test("failed replacement writes leave the previous durable revision intact", () => {
  const storage = new MemoryStorage();
  enqueueProgressQueueEntry(storage, questEntry("first", ["s1"]), { revision: "first" });
  storage.rejectWrites = true;
  const failed = enqueueProgressQueueEntry(storage, questEntry("second", ["s2"]), { revision: "second" });
  assert.equal(failed.stored, false);
  const records = readProgressQueueRecords(storage);
  assert.equal(records.length, 1);
  assert.deepEqual(records[0].entry.payload.trail.stopsDone, ["s1"]);
});

test("an all-writes-rejected queue reports that no durable revision exists", () => {
  const storage = new MemoryStorage();
  storage.rejectWrites = true;
  const failed = enqueueProgressQueueEntry(storage, questEntry("only", ["s1"]), { revision: "only" });
  assert.equal(failed.stored, false);
  assert.equal(readProgressQueueRecords(storage).length, 0);
});
