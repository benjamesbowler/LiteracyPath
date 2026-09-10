import { normalizeCampaignProgress } from "../../src/features/soundSeekers/v3/engine/campaignProgress.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  enqueueProgressQueueEntry,
  LEGACY_PROGRESS_QUEUE_KEY,
  mergeProgressQueueRecords,
  mergeProgressQueueEntries,
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

test("an offline reset replaces older queued Sound Seekers progress", () => {
  const storage = new MemoryStorage();
  enqueueProgressQueueEntry(storage, questEntry("played", ["s1", "s2"], {
    resetEpoch: 0,
    resetAt: "",
    resetId: "legacy",
    resetHistory: [],
    resetPending: false,
    hatched: true,
    mastery: { s: { seen: 8, correct: 8, state: "mastered" } },
    stones: ["s"],
    ledger: { purchases: [{ id: "leaf-cap" }] },
    checkpoint: { stopId: "s3", beatIndex: 1 }
  }), { revision: "played" });
  enqueueProgressQueueEntry(storage, questEntry("reset", [], {
    resetEpoch: 1,
    resetAt: "2026-07-21T09:00:00Z",
    resetId: "reset-a",
    resetHistory: ["legacy"],
    resetPending: true,
    hatched: false,
    trail: { stopsDone: [], stars: {}, drops: {}, routeCursor: 1 },
    mastery: {},
    stones: [],
    trickies: [],
    ledger: { purchases: [] },
    checkpoint: null
  }), { revision: "reset" });

  const merged = mergeProgressQueueRecords(readProgressQueueRecords(storage));
  assert.equal(merged.payload.resetEpoch, 1);
  assert.equal(merged.payload.hatched, false);
  assert.deepEqual(merged.payload.trail.stopsDone, []);
  assert.deepEqual(merged.payload.mastery, {});
  assert.deepEqual(merged.payload.stones, []);
  assert.deepEqual(merged.payload.ledger.purchases, []);
  assert.equal(merged.payload.checkpoint, null);
});

test("a later stale-tab queue write cannot resurrect a newer reset", () => {
  const storage = new MemoryStorage();
  enqueueProgressQueueEntry(storage, questEntry("reset", [], {
    resetEpoch: 3,
    resetAt: "2026-07-21T09:05:00Z",
    resetId: "reset-b",
    resetHistory: ["legacy", "reset-a"],
    resetPending: true,
    hatched: false,
    trail: { stopsDone: [], stars: {}, drops: {}, routeCursor: 1 },
    mastery: {},
    stones: [],
    ledger: { purchases: [] },
    checkpoint: null
  }), { revision: "reset" });
  enqueueProgressQueueEntry(storage, questEntry("stale", ["s1"], {
    resetEpoch: 3,
    resetAt: "2026-07-21T09:00:00Z",
    resetId: "reset-a",
    resetHistory: ["legacy"],
    resetPending: false,
    hatched: true,
    mastery: { s: { seen: 4, correct: 4 } },
    stones: ["s"],
    ledger: { purchases: [{ id: "leaf-cap" }] },
    checkpoint: { stopId: "s2" }
  }), { revision: "stale" });

  const merged = mergeProgressQueueRecords(readProgressQueueRecords(storage));
  assert.equal(merged.payload.resetEpoch, 3);
  assert.equal(merged.payload.hatched, false);
  assert.deepEqual(merged.payload.trail.stopsDone, []);
  assert.deepEqual(merged.payload.mastery, {});
  assert.equal(merged.payload.checkpoint, null);
});

test("a stale-device pending reset wins queue coalescing with a backwards clock", () => {
  const storage = new MemoryStorage();
  enqueueProgressQueueEntry(storage, questEntry("progressed-a", ["s1"], {
    resetEpoch: 9000,
    resetAt: "2026-07-21T09:00:00Z",
    resetId: "reset-device-a",
    resetHistory: ["legacy"],
    resetPending: false,
    hatched: true,
    mastery: { s: { seen: 4, correct: 4 } },
    stones: ["s"],
    checkpoint: { stopId: "s2" }
  }), { revision: "progressed-a" });
  enqueueProgressQueueEntry(storage, questEntry("reset-b", [], {
    resetEpoch: 8000,
    resetAt: "2026-07-21T08:00:00Z",
    resetId: "reset-device-b",
    resetHistory: ["legacy"],
    resetPending: true,
    hatched: false,
    trail: { stopsDone: [], stars: {}, drops: {}, routeCursor: 1 },
    mastery: {},
    stones: [],
    ledger: { purchases: [] },
    checkpoint: null
  }), { revision: "reset-b" });

  const merged = mergeProgressQueueRecords(readProgressQueueRecords(storage));
  assert.equal(merged.payload.resetId, "reset-device-b");
  assert.deepEqual(merged.payload.resetHistory, ["legacy", "reset-device-a"]);
  assert.deepEqual(merged.payload.trail.stopsDone, []);
  assert.deepEqual(merged.payload.mastery, {});
  assert.equal(merged.payload.checkpoint, null);
});

test("an older pending tab save cannot reverse a newer pending reset in the queue", () => {
  const storage = new MemoryStorage();
  enqueueProgressQueueEntry(storage, questEntry("new-reset", [], {
    resetEpoch: 200,
    resetAt: "2026-07-21T10:00:00Z",
    resetId: "reset-z-new",
    resetHistory: ["legacy"],
    resetPendingIds: ["reset-z-new"],
    resetPending: true,
    hatched: false,
    trail: { stopsDone: [], stars: {}, drops: {}, routeCursor: 1 },
    mastery: {},
    stones: [],
    ledger: { purchases: [] },
    checkpoint: null
  }), { revision: "new-reset" });
  enqueueProgressQueueEntry(storage, questEntry("old-tab-save", ["s1"], {
    resetEpoch: 100,
    resetAt: "2026-07-21T09:00:00Z",
    resetId: "reset-a-old",
    resetHistory: ["legacy"],
    resetPendingIds: ["reset-a-old"],
    resetPending: true,
    hatched: true,
    mastery: { s: { seen: 4, correct: 4 } },
    stones: ["s"],
    checkpoint: { stopId: "s2" }
  }), { revision: "old-tab-save" });

  const merged = mergeProgressQueueRecords(readProgressQueueRecords(storage));
  assert.equal(merged.payload.resetId, "reset-z-new");
  assert.deepEqual(merged.payload.resetPendingIds, ["reset-a-old", "reset-z-new"]);
  assert.deepEqual(merged.payload.trail.stopsDone, []);
  assert.deepEqual(merged.payload.mastery, {});
  assert.equal(merged.payload.checkpoint, null);
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

test("el_quest queue coalescing cannot restore a stale legacy cycle after reset", () => {
  const current = {
    studentId: "child-1",
    area: "el_quest",
    key: "__all__",
    revision: "current",
    queuedAt: "2026-09-02T09:00:00.000Z",
    updatedAt: "2026-09-02T09:00:00.000Z",
    payload: { schemaVersion: 2, progressEpoch: 2, cycles: {} }
  };
  const legacy = {
    ...current,
    revision: "stale-legacy",
    updatedAt: "2026-09-02T09:01:00.000Z",
    payload: { v: 1, cycles: { "cycle-1": { stars: 3 } } }
  };
  const merged = mergeProgressQueueRecords([{ entry: current }, { entry: legacy }]);
  assert.deepEqual(merged.payload, current.payload);
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

test("queued retries never serialize the supplied session credential", () => {
  const storage = new MemoryStorage();
  enqueueProgressQueueEntry(storage, { ...questEntry("secret", ["s1"]), token: "synthetic-secret" });
  assert.equal([...storage.values.values()].some(raw => raw.includes("synthetic-secret")), false);
});

test("credential migration keeps evidence on quota failure and transfers before deleting", async () => {
  const { migrateProgressQueueCredentials } = await import("../../src/utils/progressQueue.js");
  const storage = new MemoryStorage();
  const entry = { ...questEntry("old", ["s1"]), token: "synthetic-secret" };
  storage.setItem(LEGACY_PROGRESS_QUEUE_KEY, JSON.stringify([entry]));
  storage.rejectWrites = true;
  assert.equal(migrateProgressQueueCredentials(storage), false);
  assert.ok(storage.getItem(LEGACY_PROGRESS_QUEUE_KEY));
  storage.rejectWrites = false;
  assert.equal(migrateProgressQueueCredentials(storage), true);
  assert.equal(storage.getItem(LEGACY_PROGRESS_QUEUE_KEY), null);
  assert.deepEqual(readProgressQueueRecords(storage)[0].entry.payload, entry.payload);
  assert.equal([...storage.values.values()].some(raw => raw.includes("synthetic-secret")), false);
});


test("campaign queue entries cannot coalesce across learner, area or row identities", () => {
  const entry = { studentId: "A", area: "phonics_quest", key: "sound_seekers_v3", payload: normalizeCampaignProgress(null) };
  const result = mergeProgressQueueEntries(entry, { ...entry, payload: { ...entry.payload, hero: "bouncy", updatedAt: 10 } });
  assert.equal(result.payload.hero, "bouncy");
  for (const different of [{ studentId: "B" }, { area: "el_quest" }, { key: "__all__" }]) {
    assert.throws(() => mergeProgressQueueEntries(entry, { ...entry, ...different }), /identity mismatch/);
  }
});
