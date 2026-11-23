import assert from "node:assert/strict";
import { test } from "node:test";
import { reloadOnceForNewVersion } from "../../src/utils/lazyWithRetry.js";
import { registerProgressReloadGuard, retryVolatileProgress } from "../../src/utils/progressReloadGuard.js";

test("a chunk failure never auto-reloads while recoverable work is in memory", async t => {
  const oldWindow = globalThis.window;
  let reloads = 0;
  let pending = true;
  const storage = new Map();
  globalThis.window = {
    sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    location: { reload: () => { reloads += 1; } }
  };
  t.after(() => {
    if (oldWindow === undefined) delete globalThis.window;
    else globalThis.window = oldWindow;
    registerProgressReloadGuard(null);
  });
  registerProgressReloadGuard({
    hasVolatileProgress: () => pending,
    retry: async () => { pending = false; return true; }
  });
  assert.equal(reloadOnceForNewVersion(), false);
  assert.equal(reloads, 0);
  assert.equal(storage.size, 0);
  assert.equal(await retryVolatileProgress(), true);
  assert.equal(reloadOnceForNewVersion(), true);
  assert.equal(reloads, 1);
});
