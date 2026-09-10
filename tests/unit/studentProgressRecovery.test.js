import { BrowserWorker } from '../helpers/campaignBrowserWorker.js';
import { normalizeCampaignProgress } from '../../src/features/soundSeekers/v3/engine/campaignProgress.js';
import test from "node:test";
import assert from "node:assert/strict";
import { clearProgressSyncSession, configureProgressSync, flushQueuedProgressWrites, fetchStudentCloudProgress, getProgressSyncState, queueProgressSave } from "../../src/utils/progressSync.js";
import { readProgressQueueRecords } from "../../src/utils/progressQueue.js";

function browser(t) {
  const values = new Map();
  const events = [];
  const storage = {
    reject: false,
    get length() { return values.size; },
    key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null,
    setItem(key, value) { if (this.reject) throw new Error("quota"); values.set(key, value); },
    removeItem: key => values.delete(key)
  };
  const previous = globalThis.window;
  globalThis.window = { localStorage: storage, addEventListener() {}, removeEventListener() {},
    dispatchEvent: event => events.push(event), setTimeout() { return 1; }, clearTimeout() {} };
  t.after(() => { clearProgressSyncSession(); globalThis.window = previous; });
  return { storage, events };
}

test("rejected credential stops retry; only the same learner's fresh session recovers evidence", async t => {
  const { storage, events } = browser(t);
  let calls = 0;
  const rejected = { studentId: "recovery-a", mode: "student", token: "old-token", client: {
    call: async () => { calls++; return { data: { ok: false, error: "invalid_session" } }; }
  } };
  configureProgressSync(rejected);
  queueProgressSave("phonics_letters", "m", { status: "done" }, { scopeKey: rejected.studentId });
  await flushQueuedProgressWrites();
  await flushQueuedProgressWrites();
  assert.equal(calls, 1);
  assert.ok(events.some(event => event.type === "lp-student-session-invalid"));
  assert.equal(readProgressQueueRecords(storage).length, 1);
  configureProgressSync({ ...rejected, studentId: "recovery-b", token: "other-token" });
  await flushQueuedProgressWrites();
  assert.equal(calls, 1);
  const sent = [];
  configureProgressSync({ ...rejected, token: "fresh-token", client: { call: async (_, args) => {
    sent.push(args); return { data: { ok: true } };
  } } });
  await flushQueuedProgressWrites();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].p_token, "fresh-token");
  assert.equal(readProgressQueueRecords(storage).length, 0);
});

test("quota plus cloud failure stays visible until actual acknowledgment; stale session cannot flush", async t => {
  const { storage } = browser(t);
  storage.reject = true;
  let fail = true;
  let calls = 0;
  const session = { studentId: "volatile-a", mode: "student", token: "volatile-token", client: {
    call: async () => { calls++; if (fail) throw new Error("offline"); return { data: { ok: true } }; }
  } };
  configureProgressSync(session);
  queueProgressSave("phonics_letters", "s", { status: "done" }, { scopeKey: session.studentId });
  await flushQueuedProgressWrites();
  assert.equal(getProgressSyncState(session.studentId).status, "storage-failed");
  assert.equal(getProgressSyncState(session.studentId).pending, 1);
  fail = false;
  await flushQueuedProgressWrites();
  assert.equal(getProgressSyncState(session.studentId).pending, 0);
  clearProgressSyncSession();
  await flushQueuedProgressWrites(session);
  assert.equal(calls, 2);
});

test("restoration distinguishes rejected credentials from a transport failure", async t => {
  const { events } = browser(t);
  const session = { studentId: "restore-a", mode: "student", token: "restore-token", client: {
    call: async () => { throw new Error("network unavailable"); }
  } };
  configureProgressSync(session);
  await assert.rejects(fetchStudentCloudProgress(session), /network/);
  assert.equal(events.some(event => event.type === "lp-student-session-invalid"), false);
  session.client.call = async () => { throw new Error("invalid_session"); };
  await assert.rejects(fetchStudentCloudProgress(session), /invalid_session/);
  assert.equal(events.filter(event => event.type === "lp-student-session-invalid").length, 1);
});

test("fresh sign-in recovers even while an old credential upload is still in flight", async t => {
  const { storage } = browser(t);
  let release, markStarted;
  const started = new Promise(resolve => { markStarted = resolve; });
  const old = { studentId: "racing-session", mode: "student", token: "racing-old", client: {
    call: () => new Promise(resolve => { release = resolve; markStarted(); })
  } };
  configureProgressSync(old);
  queueProgressSave("phonics_letters", "a", { status: "done" }, { scopeKey: old.studentId });
  const oldFlush = flushQueuedProgressWrites();
  // Reach the actual unresolved RPC before rotating credentials. Preparation
  // may legitimately await a worker; a microtask count or timer is no barrier.
  await started;
  let uploads = 0;
  configureProgressSync({ ...old, token: "racing-fresh", client: { call: async (_, args) => {
    assert.equal(args.p_token, "racing-fresh"); uploads++; return { data: { ok: true } };
  } } });
  const freshFlush = flushQueuedProgressWrites();
  assert.equal(uploads, 0, "fresh credential must join the unresolved old upload");
  assert.equal(readProgressQueueRecords(storage).length, 1);
  release({ data: { ok: false, error: "invalid_session" } });
  await Promise.all([oldFlush, freshFlush]);
  assert.equal(uploads, 1);
  assert.equal(readProgressQueueRecords(storage).length, 0);
});


for (const phase of ["read", "transport"]) test(`fresh sign-in during worker ${phase} prevents the old credential from being dispatched`, async t => {
  const { storage } = browser(t);
  let markReading;
  const reading = new Promise(resolve => { markReading = resolve; });
  const previousWorker = globalThis.Worker;
  globalThis.Worker = class extends BrowserWorker {
    postMessage(value) {
      super.postMessage(value);
      if (value.job.operation === phase) markReading();
    }
  };
  t.after(() => { clearProgressSyncSession(); globalThis.Worker = previousWorker; });
  let oldUploads = 0, freshUploads = 0;
  const old = { studentId: `preparing-session-${phase}`, mode: "student", token: `preparing-old-${phase}`, client: {
    call: async () => { oldUploads++; return { data: { ok: true } }; }
  } };
  configureProgressSync(old);
  assert.equal(await queueProgressSave("phonics_quest", "sound_seekers_v3", normalizeCampaignProgress(null), { scopeKey: old.studentId }), true);
  const oldFlush = flushQueuedProgressWrites();
  await reading;
  configureProgressSync({ ...old, token: `preparing-fresh-${phase}`, client: { call: async (_, args) => {
    assert.equal(args.p_token, `preparing-fresh-${phase}`); freshUploads++; return { data: { ok: true } };
  } } });
  await Promise.all([oldFlush, flushQueuedProgressWrites()]);
  assert.equal(oldUploads, 0);
  assert.equal(freshUploads, 1);
  assert.equal(readProgressQueueRecords(storage).length, 0);
});
