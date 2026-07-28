import assert from "node:assert/strict";
import test from "node:test";

import {
  clearAndVerifyInsertQueueForStudent,
  clearInsertQueueForStudent,
  flushInsertQueue,
  insertWithRetry,
  readInsertQueue
} from "../../src/utils/insertQueue.js";

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
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(String(key), String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

function insertClient(handler) {
  return {
    table(table) {
      return {
        insert(row) {
          return handler({ operation: "insert", row, table });
        },
        upsert(row, options) {
          return handler({ operation: "upsert", options, row, table });
        }
      };
    }
  };
}

function nextTurn() {
  return new Promise(resolve => setImmediate(resolve));
}

test("an evidence write is durable before a slow network request finishes", async () => {
  const storage = memoryStorage();
  let finishNetwork;
  const client = insertClient(() => new Promise(resolve => {
    finishNetwork = resolve;
  }));

  const result = await insertWithRetry("answers", {
    teacher_id: "teacher-a",
    student_id: "student-1",
    client_event_id: "event-1"
  }, {
    accountId: "teacher-a",
    client,
    onConflict: "teacher_id,client_event_id",
    storage
  });

  assert.deepEqual(
    {
      durable: result.durable,
      cloudSaved: result.cloudSaved,
      queued: result.queued
    },
    { durable: true, cloudSaved: false, queued: true }
  );
  assert.equal(readInsertQueue({ accountId: "teacher-a", storage }).length, 1);

  finishNetwork({ data: null, error: null });
  await nextTurn();
  assert.equal(readInsertQueue({ accountId: "teacher-a", storage }).length, 0);
});

test("flushes are account scoped and cannot deliver another teacher's rows", async () => {
  const storage = memoryStorage();
  const offline = insertClient(async () => ({
    data: null,
    error: new Error("offline")
  }));

  await insertWithRetry("answers", {
    teacher_id: "teacher-a",
    student_id: "student-a",
    client_event_id: "event-a"
  }, { accountId: "teacher-a", client: offline, storage });
  await insertWithRetry("answers", {
    teacher_id: "teacher-b",
    student_id: "student-b",
    client_event_id: "event-b"
  }, { accountId: "teacher-b", client: offline, storage });
  await nextTurn();

  const delivered = [];
  const online = insertClient(async request => {
    delivered.push(request.row);
    return { data: null, error: null };
  });
  const result = await flushInsertQueue({
    accountId: "teacher-a",
    client: online,
    storage
  });

  assert.equal(result.flushed, 1);
  assert.deepEqual(delivered.map(row => row.teacher_id), ["teacher-a"]);
  assert.equal(readInsertQueue({ accountId: "teacher-a", storage }).length, 0);
  assert.equal(readInsertQueue({ accountId: "teacher-b", storage }).length, 1);
});

test("failed delivery remains queued and learner deletion removes only that learner", async () => {
  const storage = memoryStorage();
  const offline = insertClient(async () => ({
    data: null,
    error: new Error("still offline")
  }));

  for (const [eventId, studentId] of [
    ["event-1", "student-1"],
    ["event-2", "student-2"]
  ]) {
    await insertWithRetry("answers", {
      teacher_id: "teacher-a",
      student_id: studentId,
      client_event_id: eventId
    }, { accountId: "teacher-a", client: offline, storage });
  }
  await nextTurn();

  const queued = readInsertQueue({ accountId: "teacher-a", storage });
  assert.equal(queued.length, 2);
  assert.ok(queued.every(record => record.entry.attempts >= 1));

  const removed = clearInsertQueueForStudent({
    accountId: "teacher-a",
    studentId: "student-1",
    storage
  });
  assert.equal(removed, 1);
  assert.deepEqual(
    readInsertQueue({ accountId: "teacher-a", storage })
      .map(record => record.entry.row.student_id),
    ["student-2"]
  );
});

test("when storage and cloud both reject a write, completion is not durable", async () => {
  const storage = {
    length: 0,
    key() { return null; },
    getItem() { return null; },
    setItem() { throw new Error("storage unavailable"); },
    removeItem() {}
  };
  const offline = insertClient(async () => ({
    data: null,
    error: new Error("network unavailable")
  }));

  const result = await insertWithRetry("answers", {
    teacher_id: "teacher-storage-failure",
    student_id: "student-storage-failure",
    client_event_id: "event-1"
  }, {
    accountId: "teacher-storage-failure",
    client: offline,
    storage
  });

  assert.equal(result.durable, false);
  assert.equal(result.cloudSaved, false);
  assert.equal(result.queued, false);
  assert.match(result.error.message, /network unavailable/);
});

test("learner deletion waits for in-flight delivery and prevents a failed request from recreating the queue", async () => {
  const storage = memoryStorage();
  let rejectNetwork;
  let networkCalls = 0;
  const client = insertClient(() => {
    networkCalls += 1;
    return new Promise((resolve, reject) => {
      rejectNetwork = reject;
    });
  });

  const write = await insertWithRetry("answers", {
    teacher_id: "teacher-c",
    student_id: "student-in-flight",
    client_event_id: "event-in-flight"
  }, {
    accountId: "teacher-c",
    client,
    storage
  });
  assert.equal(write.durable, true);
  assert.equal(readInsertQueue({ accountId: "teacher-c", storage }).length, 1);

  const cleanup = clearAndVerifyInsertQueueForStudent({
    accountId: "teacher-c",
    studentId: "student-in-flight",
    storage
  });
  rejectNetwork(new Error("student was deleted"));
  const result = await cleanup;

  assert.equal(result.residualCount, 0);
  assert.equal(readInsertQueue({ accountId: "teacher-c", storage }).length, 0);

  const blockedWrite = await insertWithRetry("answers", {
    teacher_id: "teacher-c",
    student_id: "student-in-flight",
    client_event_id: "event-after-deletion"
  }, {
    accountId: "teacher-c",
    client,
    storage
  });
  assert.equal(blockedWrite.durable, false);
  assert.equal(blockedWrite.error.code, "LP_LEARNER_WRITE_BLOCKED");
  assert.equal(networkCalls, 1);
});
