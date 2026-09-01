import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CLOUD_PROGRESS_CACHE_KEY,
  RECOVERY_TELEMETRY_SESSION_LIMIT,
  compactQuestStateForStorage,
  isQuestStateRecoverable,
  writeQuestStateWithRecovery
} from "../../src/utils/questStorageRecovery.js";
import { createSoundSeekersState } from "../../src/features/soundSeekers/engine/stateV2.js";

test("storage recovery recognizes the minimum v2 state shape", () => {
  assert.equal(isQuestStateRecoverable(createSoundSeekersState()), true);
  assert.equal(isQuestStateRecoverable({ v: 2, contentVersion: "sound-seekers-v2" }), false);
  assert.equal(isQuestStateRecoverable({
    v: 2,
    contentVersion: "sound-seekers-v2",
    reset: null,
    trail: [],
    evidence: [],
    settings: {}
  }), false);
});

function quotaStorage({ failures = 0 } = {}) {
  const values = new Map([[CLOUD_PROGRESS_CACHE_KEY, "stale-cache"]]);
  let remainingFailures = failures;
  return {
    values,
    getItem(key) { return values.get(key) ?? null; },
    removeItem(key) { values.delete(key); },
    setItem(key, value) {
      if (remainingFailures > 0) {
        remainingFailures -= 1;
        throw new DOMException("Storage quota exceeded", "QuotaExceededError");
      }
      values.set(key, value);
    }
  };
}

test("quota recovery evicts the reproducible cloud cache and retries the full quest save", () => {
  const storage = quotaStorage({ failures: 1 });
  const state = { trail: { stopsDone: ["s1"] }, telemetry: { sessions: [] } };
  const result = writeQuestStateWithRecovery(storage, "lp-quest:child", state);

  assert.deepEqual(result, { ok: true, recovered: true, compacted: false });
  assert.equal(storage.getItem(CLOUD_PROGRESS_CACHE_KEY), null);
  assert.deepEqual(JSON.parse(storage.getItem("lp-quest:child")), state);
});

test("quota recovery keeps all learning state while bounding only old local diagnostics", () => {
  const sessions = Array.from({ length: 80 }, (_, index) => ({ id: `session-${index}` }));
  const state = {
    trail: { stopsDone: ["s1", "s2"] },
    mastery: { s: { seen: 9, correct: 8 } },
    telemetry: { sessions, current: { id: "current" } }
  };
  const storage = quotaStorage({ failures: 2 });
  const result = writeQuestStateWithRecovery(storage, "lp-quest:child", state);
  const saved = JSON.parse(storage.getItem("lp-quest:child"));

  assert.deepEqual(result, { ok: true, recovered: true, compacted: true });
  assert.deepEqual(saved.trail, state.trail);
  assert.deepEqual(saved.mastery, state.mastery);
  assert.equal(saved.telemetry.sessions.length, RECOVERY_TELEMETRY_SESSION_LIMIT);
  assert.equal(saved.telemetry.sessions.at(0).id, "session-68");
  assert.equal(saved.telemetry.current.id, "current");
});

test("storage recovery reports an honest failure when private mode rejects every write", () => {
  const storage = quotaStorage({ failures: 3 });
  const result = writeQuestStateWithRecovery(storage, "lp-quest:child", { telemetry: {} });
  assert.deepEqual(result, { ok: false, recovered: true, compacted: true });
});

test("compaction is immutable", () => {
  const state = { telemetry: { sessions: Array.from({ length: 20 }, (_, id) => ({ id })) } };
  const compacted = compactQuestStateForStorage(state);
  assert.equal(state.telemetry.sessions.length, 20);
  assert.equal(compacted.telemetry.sessions.length, RECOVERY_TELEMETRY_SESSION_LIMIT);
});
