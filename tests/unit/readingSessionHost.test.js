import assert from "node:assert/strict";
import test from "node:test";

import { createReadingSessionRetryQueue } from "../../src/hooks/useReadingSessionHost.js";

test("host retry queue preserves optimistic turn order across a failed write", async () => {
  const delivered = [];
  const timers = [];
  let attempts = 0;
  const queue = createReadingSessionRetryQueue({
    send: async payload => {
      attempts += 1;
      if (attempts === 1) throw new Error("offline");
      delivered.push(payload.pageIndex);
    },
    setTimer: callback => { timers.push(callback); return timers.length; },
    clearTimer: () => {}
  });
  const localPages = [];
  localPages.push(1);
  queue.enqueue({ pageIndex: 1 });
  localPages.push(2);
  queue.enqueue({ pageIndex: 2 });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(localPages, [1, 2]);
  assert.deepEqual(delivered, []);
  timers.shift()();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(delivered, [1, 2]);
});

test("host queue exposes the not-sent threshold without blocking the lesson", async () => {
  let clock = 1;
  let latest = null;
  const queue = createReadingSessionRetryQueue({
    send: async () => { clock = 5000; throw new Error("offline"); },
    onPendingChange: value => { latest = value; },
    now: () => clock,
    setTimer: () => 1,
    clearTimer: () => {}
  });
  queue.enqueue({ pageIndex: 1 });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(latest.notSent, true);
  assert.equal(queue.snapshot().length, 1);
});
