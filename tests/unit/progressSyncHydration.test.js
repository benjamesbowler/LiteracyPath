import assert from "node:assert/strict";
import test from "node:test";

import {
  clearProgressSyncSession,
  configureProgressSync,
  fetchStudentCloudProgress,
  hydrateCloudProgress
} from "../../src/utils/progressSync.js";
import {
  clearElQuestLocalProgress,
  readElQuestLocalProgress
} from "../../src/utils/adventureMapLocalProgress.js";
import { readProgressQueueRecords } from "../../src/utils/progressQueue.js";
import { localProgressStorageKey } from "../../src/utils/progressKeys.js";

function memoryStorage() {
  const values = new Map();
  return {
    get length() {
      return values.size;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    getItem(key) {
      return values.has(String(key)) ? values.get(String(key)) : null;
    },
    setItem(key, value) {
      values.set(String(key), String(value));
    },
    removeItem(key) {
      values.delete(String(key));
    }
  };
}

function progressClient(rows) {
  return {
    async call(name, args) {
      assert.equal(name, "student_get_progress");
      assert.ok(args.p_token);
      return { data: rows, error: null };
    }
  };
}

function mutableProgressClient(initialRows) {
  let rows = structuredClone(initialRows);
  return {
    async call(name, args) {
      if (name === "student_get_progress") {
        assert.ok(args.p_token);
        return { data: structuredClone(rows), error: null };
      }
      assert.equal(name, "student_save_progress");
      assert.ok(args.p_token);
      const next = {
        area: args.p_area,
        key: args.p_key,
        payload: structuredClone(args.p_payload)
      };
      const index = rows.findIndex(row => row.area === next.area && row.key === next.key);
      if (index >= 0) rows[index] = next;
      else rows.push(next);
      return { data: { ok: true }, error: null };
    },
    rows() {
      return structuredClone(rows);
    }
  };
}

function installHydrationBrowser(t) {
  const storage = memoryStorage();
  const events = [];
  const previousWindow = globalThis.window;
  const previousCustomEvent = globalThis.CustomEvent;
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  };
  globalThis.window = {
    localStorage: storage,
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent(event) {
      events.push(event);
    },
    setTimeout() {
      return 1;
    },
    clearTimeout() {}
  };
  t.after(() => {
    clearProgressSyncSession();
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousCustomEvent === undefined) delete globalThis.CustomEvent;
    else globalThis.CustomEvent = previousCustomEvent;
  });
  return { storage, events };
}

test("student progress reads can use the session's validated client", async () => {
  const rows = [{ area: "el_quest", key: "__all__", payload: { cycles: {} } }];
  const result = await fetchStudentCloudProgress({
    mode: "student",
    studentId: "client-seam",
    token: "test-token",
    client: progressClient(rows)
  });
  assert.deepEqual(result, rows);
});

test("real hydration preserves future Adventure progress as exact opaque bytes", async t => {
  const { storage, events } = installHydrationBrowser(t);

  const cases = [
    {
      studentId: "future-schema-hydrate",
      raw: '{\n  "futureOnly" : { "checkpoint" : "keep-schema-bytes" },\n  "cycles" : {},\n  "progressEpoch" : 2,\n  "schemaVersion" : 99\n}'
    },
    {
      studentId: "future-epoch-hydrate",
      raw: '{ "cycles" : { }, "schemaVersion" : 2, "futureOnly" : true, "progressEpoch" : 99 }'
    }
  ];

  for (const fixture of cases) {
    const storageKey = localProgressStorageKey("el_quest", fixture.studentId);
    storage.setItem(storageKey, fixture.raw);
    const rows = [{
      area: "el_quest",
      key: "__all__",
      payload: {
        schemaVersion: 2,
        progressEpoch: 2,
        cycles: { "cycle-1": { stars: 3 } }
      }
    }];

    const hydrated = await hydrateCloudProgress({
      mode: "student",
      studentId: fixture.studentId,
      studentName: "Test learner",
      token: "test-token",
      client: progressClient(rows)
    });

    assert.deepEqual(hydrated, rows);
    assert.equal(storage.getItem(storageKey), fixture.raw);
    const hydratedEvent = events.find(event => (
      event.type === "lp-progress-hydrated"
      && event.detail.studentId === fixture.studentId
    ));
    assert.ok(hydratedEvent);
    assert.deepEqual(hydratedEvent.detail.rows, rows);
  }
});

test("real hydration preserves unreadable current Adventure bytes until scoped recovery", async t => {
  const { storage, events } = installHydrationBrowser(t);
  const raws = [
    "{not json",
    '{ "schemaVersion" : 2, "progressEpoch" : 2, "cycles" : null }',
    '{ "schemaVersion" : 2, "progressEpoch" : 2, "cycles" : [] }'
  ];

  for (const [index, raw] of raws.entries()) {
    const studentId = `malformed-local-hydrate-${index}`;
    const storageKey = localProgressStorageKey("el_quest", studentId);
    storage.setItem(storageKey, raw);
    const rows = [{
      area: "el_quest",
      key: "__all__",
      payload: {
        schemaVersion: 2,
        progressEpoch: 2,
        cycles: { "cycle-1": { stars: 3 } }
      }
    }];

    await hydrateCloudProgress({
      mode: "student",
      studentId,
      token: "test-token",
      client: progressClient(rows)
    });

    assert.equal(storage.getItem(storageKey), raw);
    assert.deepEqual(readElQuestLocalProgress(studentId), { ok: false, value: {} });
    assert.ok(events.some(event => (
      event.type === "lp-progress-hydrated"
      && event.detail.studentId === studentId
    )));
  }
});

test("real hydration materialises malformed current cloud cycles for recovery", async t => {
  const { storage, events } = installHydrationBrowser(t);
  const cases = [
    { studentId: "malformed-cloud-null", cycles: null },
    { studentId: "malformed-cloud-array", cycles: [] }
  ];

  for (const fixture of cases) {
    const payload = {
      schemaVersion: 2,
      progressEpoch: 2,
      cycles: fixture.cycles
    };
    const rows = [{ area: "el_quest", key: "__all__", payload }];
    const storageKey = localProgressStorageKey("el_quest", fixture.studentId);

    await hydrateCloudProgress({
      mode: "student",
      studentId: fixture.studentId,
      token: "test-token",
      client: progressClient(rows)
    });

    assert.equal(storage.getItem(storageKey), JSON.stringify(payload));
    assert.deepEqual(readElQuestLocalProgress(fixture.studentId), { ok: false, value: {} });
    assert.ok(events.some(event => (
      event.type === "lp-progress-hydrated"
      && event.detail.studentId === fixture.studentId
    )));
  }
});

test("scoped recovery replaces malformed cloud with canonical v2 before a clean rehydrate", async t => {
  const { storage } = installHydrationBrowser(t);
  const studentId = "recover-malformed-cloud";
  const storageKey = localProgressStorageKey("el_quest", studentId);
  const canonical = { schemaVersion: 2, progressEpoch: 2, cycles: {} };
  const client = mutableProgressClient([{
    area: "el_quest",
    key: "__all__",
    payload: { schemaVersion: 2, progressEpoch: 2, cycles: null }
  }]);
  const session = {
    mode: "student",
    studentId,
    token: "test-token",
    client
  };
  configureProgressSync(session);

  await hydrateCloudProgress(session);
  assert.deepEqual(readElQuestLocalProgress(studentId), { ok: false, value: {} });

  assert.equal(clearElQuestLocalProgress(studentId), true);
  assert.equal(storage.getItem(storageKey), JSON.stringify(canonical));
  let queued = readProgressQueueRecords(storage).filter(record => (
    record.entry.studentId === studentId
    && record.entry.area === "el_quest"
    && record.entry.key === "__all__"
  ));
  assert.equal(queued.length, 1);
  assert.deepEqual(queued[0].entry.payload, canonical);

  await hydrateCloudProgress(session);
  assert.deepEqual(client.rows(), [{ area: "el_quest", key: "__all__", payload: canonical }]);
  storage.removeItem(storageKey);
  await hydrateCloudProgress(session);
  assert.deepEqual(readElQuestLocalProgress(studentId), { ok: true, value: canonical });
  queued = readProgressQueueRecords(storage).filter(record => record.entry.studentId === studentId);
  assert.equal(queued.length, 0);
});

test("scoped recovery folds valid cached cloud progress forward instead of erasing it", async t => {
  const { storage } = installHydrationBrowser(t);
  const studentId = "recover-valid-cloud";
  const storageKey = localProgressStorageKey("el_quest", studentId);
  const valid = {
    schemaVersion: 2,
    progressEpoch: 2,
    cycles: { "cycle-4": { stars: 3, stations: { letters: true } } }
  };
  const client = mutableProgressClient([{
    area: "el_quest",
    key: "__all__",
    payload: valid
  }]);
  const session = {
    mode: "student",
    studentId,
    token: "test-token",
    client
  };
  configureProgressSync(session);
  storage.setItem(storageKey, "{not json");

  await hydrateCloudProgress(session);
  assert.deepEqual(readElQuestLocalProgress(studentId), { ok: false, value: {} });
  assert.equal(clearElQuestLocalProgress(studentId), true);
  assert.deepEqual(JSON.parse(storage.getItem(storageKey)), valid);
  const [queued] = readProgressQueueRecords(storage).filter(record => (
    record.entry.studentId === studentId && record.entry.area === "el_quest"
  ));
  assert.deepEqual(queued.entry.payload, valid);

  await hydrateCloudProgress(session);
  storage.removeItem(storageKey);
  await hydrateCloudProgress(session);
  assert.deepEqual(readElQuestLocalProgress(studentId), { ok: true, value: valid });
});

test("a valid cloud row wins when recovery is clicked before initial hydration finishes", async t => {
  const { storage } = installHydrationBrowser(t);
  const studentId = "recover-during-hydration";
  const storageKey = localProgressStorageKey("el_quest", studentId);
  const valid = {
    schemaVersion: 2,
    progressEpoch: 2,
    cycles: { "cycle-7": { stars: 2, stations: { story: true } } }
  };
  const client = mutableProgressClient([{
    area: "el_quest",
    key: "__all__",
    payload: valid
  }]);
  const session = {
    mode: "student",
    studentId,
    token: "test-token",
    client
  };
  configureProgressSync(session);
  storage.setItem(storageKey, "{not json");

  assert.equal(clearElQuestLocalProgress(studentId), true);
  assert.deepEqual(JSON.parse(storage.getItem(storageKey)), {
    schemaVersion: 2,
    progressEpoch: 2,
    cycles: {}
  });
  assert.equal(
    readProgressQueueRecords(storage).filter(record => record.entry.studentId === studentId).length,
    1
  );
  await hydrateCloudProgress(session);

  assert.deepEqual(readElQuestLocalProgress(studentId), { ok: true, value: valid });
  assert.deepEqual(client.rows(), [{ area: "el_quest", key: "__all__", payload: valid }]);
});

test("scoped recovery materialises cached future cloud progress without queuing a downgrade", async t => {
  const { storage } = installHydrationBrowser(t);
  const studentId = "recover-future-cloud";
  const storageKey = localProgressStorageKey("el_quest", studentId);
  const future = {
    schemaVersion: 9,
    progressEpoch: 2,
    cycles: { "cycle-8": { stars: 3 } },
    futureOnly: { checkpoint: "keep" }
  };
  const client = mutableProgressClient([{
    area: "el_quest",
    key: "__all__",
    payload: future
  }]);
  const session = {
    mode: "student",
    studentId,
    token: "test-token",
    client
  };
  configureProgressSync(session);
  storage.setItem(storageKey, "{not json");

  await hydrateCloudProgress(session);
  assert.equal(clearElQuestLocalProgress(studentId), true);
  assert.deepEqual(JSON.parse(storage.getItem(storageKey)), future);
  assert.deepEqual(readElQuestLocalProgress(studentId), {
    ok: false,
    reason: "unsupported_version",
    value: {}
  });
  assert.equal(
    readProgressQueueRecords(storage).filter(record => record.entry.studentId === studentId).length,
    0
  );
  assert.deepEqual(client.rows(), [{ area: "el_quest", key: "__all__", payload: future }]);
});
