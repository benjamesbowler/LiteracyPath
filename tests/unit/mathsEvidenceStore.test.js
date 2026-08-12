import assert from "node:assert/strict";
import test from "node:test";

import {
  MATHS_EVIDENCE_QUEUE_PREFIX,
  clearAndVerifyMathsEvidenceForStudent,
  flushMathsEvidenceQueue,
  readMathsEvidenceQueue,
  readTeacherMathsEvidence,
  readTeacherMathsSyncHealth,
  recordStudentMathsEvidence,
  recordTeacherMathsEvidence
} from "../../src/maths/data/mathsEvidenceStore.js";

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  get length() {
    return this.values.size;
  }

  key(index) {
    return [...this.values.keys()][index] ?? null;
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(String(key), String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

const baseEvidence = Object.freeze({
  skillId: "F-N-COUNT-10",
  eventType: "practice_attempt",
  evidence: { schemaVersion: 1, result: "correct", representation: "counter_tray" },
  occurredAt: "2026-08-12T00:00:00.000Z",
  contentVersion: "maths-foundation-v1"
});

test("student Maths evidence is queued before delivery without persisting the session token", async () => {
  const storage = new MemoryStorage();
  const offline = { call: async () => ({ data: null, error: new Error("offline") }) };
  const saved = await recordStudentMathsEvidence({
    client: offline,
    token: "private-student-token",
    studentId: "student-a",
    clientEventId: "event-a",
    storage,
    ...baseEvidence
  });

  assert.deepEqual(saved, {
    durable: true,
    cloudSaved: false,
    queued: true,
    clientEventId: "event-a",
    result: null,
    error: null
  });
  assert.equal(readMathsEvidenceQueue({
    audience: "student",
    scopeId: "student-a",
    storage
  }).length, 1);
  assert.equal([...storage.values.values()].join("\n").includes("private-student-token"), false);

  const calls = [];
  const online = {
    call: async (name, args) => {
      calls.push({ name, args });
      return { data: { ok: true, id: "evidence-a" }, error: null };
    }
  };
  const flushed = await flushMathsEvidenceQueue({
    audience: "student",
    scopeId: "student-a",
    client: online,
    token: "fresh-token",
    storage
  });

  assert.deepEqual(flushed, { flushed: 1, rejected: 0, remaining: 0 });
  assert.equal(calls[0].name, "student_record_maths_evidence");
  assert.equal(calls[0].args.p_token, "fresh-token");
  assert.equal(calls[0].args.p_client_event_id, "event-a");
});

test("repeating a failed client event reuses one durable queue record", async () => {
  const storage = new MemoryStorage();
  const offline = { call: async () => ({ data: null, error: new Error("offline") }) };
  for (let index = 0; index < 2; index += 1) {
    await recordTeacherMathsEvidence({
      client: offline,
      teacherId: "teacher-a",
      classId: "class-a",
      studentId: "student-a",
      clientEventId: "same-event",
      storage,
      ...baseEvidence
    });
  }

  const queued = readMathsEvidenceQueue({
    audience: "teacher",
    scopeId: "teacher-a",
    storage
  });
  assert.equal(queued.length, 1);
  assert.equal(queued[0].entry.attempts, 2);
  assert.equal(queued[0].entry.args.p_student_id, "student-a");
});

test("the same client event id remains distinct across learners", async () => {
  const storage = new MemoryStorage();
  const offline = { call: async () => ({ data: null, error: new Error("offline") }) };
  for (const studentId of ["student-a", "student-b"]) {
    await recordTeacherMathsEvidence({
      client: offline,
      teacherId: "teacher-a",
      classId: "class-a",
      studentId,
      clientEventId: "shared-event-id",
      storage,
      ...baseEvidence
    });
  }

  const queued = readMathsEvidenceQueue({
    audience: "teacher",
    scopeId: "teacher-a",
    storage
  });
  assert.equal(queued.length, 2);
  assert.deepEqual(
    queued.map(record => record.entry.studentId).sort(),
    ["student-a", "student-b"]
  );
});

test("learner cleanup removes only Maths evidence belonging to that learner", async () => {
  const storage = new MemoryStorage();
  const offline = { call: async () => ({ data: null, error: new Error("offline") }) };
  await recordTeacherMathsEvidence({
    client: offline,
    teacherId: "teacher-a",
    classId: "class-a",
    studentId: "student-a",
    clientEventId: "student-a-event",
    storage,
    ...baseEvidence
  });
  await recordTeacherMathsEvidence({
    client: offline,
    teacherId: "teacher-a",
    classId: "class-a",
    studentId: "student-b",
    clientEventId: "student-b-event",
    storage,
    ...baseEvidence
  });

  assert.deepEqual(
    await clearAndVerifyMathsEvidenceForStudent({ studentId: "student-a", storage }),
    { removed: 1, residualCount: 0, storageAvailable: true }
  );
  const remaining = readMathsEvidenceQueue({ storage });
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].entry.studentId, "student-b");
  assert.match(remaining[0].key, new RegExp(`^${MATHS_EVIDENCE_QUEUE_PREFIX}`));
});

test("the store rejects unversioned or unknown Maths evidence before networking", () => {
  const client = { call: async () => assert.fail("invalid evidence reached the network") };
  assert.throws(
    () => recordStudentMathsEvidence({
      client,
      token: "token",
      studentId: "student-a",
      ...baseEvidence,
      evidence: { result: "correct" }
    }),
    /schemaVersion 1/
  );
  assert.throws(
    () => recordStudentMathsEvidence({
      client,
      token: "token",
      studentId: "student-a",
      ...baseEvidence,
      eventType: "teacher_observation"
    }),
    /Students cannot record Maths event type/
  );
  assert.throws(
    () => recordTeacherMathsEvidence({
      client,
      teacherId: "teacher-a",
      classId: "class-a",
      studentId: "student-a",
      ...baseEvidence,
      eventType: "automatic_mastery"
    }),
    /Unknown Maths evidence event type/
  );
  assert.throws(
    () => recordStudentMathsEvidence({
      client,
      token: "token",
      studentId: "student-a",
      ...baseEvidence,
      evidence: { schemaVersion: 1, note: "🙂".repeat(3000) }
    }),
    /larger than the 8 KB limit/
  );
});

test("a permanent backend rejection is removed instead of poisoning the retry queue", async () => {
  const storage = new MemoryStorage();
  const rejected = {
    call: async () => ({
      data: { ok: false, error: "client_event_id_conflict" },
      error: null
    })
  };
  const result = await recordTeacherMathsEvidence({
    client: rejected,
    teacherId: "teacher-a",
    classId: "class-a",
    studentId: "student-a",
    clientEventId: "conflicting-event",
    storage,
    ...baseEvidence
  });

  assert.equal(result.durable, false);
  assert.equal(result.cloudSaved, false);
  assert.equal(result.queued, false);
  assert.equal(result.error?.code, "client_event_id_conflict");
  assert.equal(readMathsEvidenceQueue({ storage }).length, 0);
});

test("teacher reads use the class-scoped cursor-paginated evidence RPC", async () => {
  const calls = [];
  const events = [{ id: "event-1", skillId: "F-N-COUNT-10" }];
  const client = {
    call: async (name, args) => {
      calls.push({ name, args });
      return { data: { ok: true, events }, error: null };
    }
  };
  assert.deepEqual(await readTeacherMathsEvidence({
    client,
    classId: "class-a",
    studentId: "student-a",
    limit: 25
  }), events);
  assert.deepEqual(calls, [{
    name: "teacher_read_maths_evidence_page",
    args: { p_class_id: "class-a", p_student_id: "student-a", p_limit: 25, p_before_occurred_at: null, p_before_id: null }
  }]);
});

test("teacher evidence reads follow cursor pages without duplicating the boundary row", async () => {
  const pages = [
    { ok: true, events: [{ id: "event-2", occurredAt: "2026-08-12T02:00:00Z" }], hasMore: true, nextBeforeOccurredAt: "2026-08-12T02:00:00Z", nextBeforeId: "event-2" },
    { ok: true, events: [{ id: "event-1", occurredAt: "2026-08-12T01:00:00Z" }], hasMore: false }
  ];
  const calls = [];
  const client = { call: async (name, args) => { calls.push({ name, args }); return { data: pages.shift(), error: null }; } };
  const rows = await readTeacherMathsEvidence({ client, classId: "class-a", limit: 2 });
  assert.deepEqual(rows.map(row => row.id), ["event-2", "event-1"]);
  assert.equal(calls[1].args.p_before_id, "event-2");
  assert.equal(calls[1].args.p_before_occurred_at, "2026-08-12T02:00:00Z");
});

test("teacher sync health is class scoped and normalised", async () => {
  const client = { call: async () => ({ data: { ok: true, learners: [{ studentId: "s1", pending: 0, rejected: 0 }] }, error: null }) };
  assert.deepEqual(await readTeacherMathsSyncHealth({ client, classId: "class-a" }), [{ studentId: "s1", pending: 0, rejected: 0 }]);
});
