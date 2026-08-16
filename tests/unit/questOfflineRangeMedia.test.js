import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import test from "node:test";

import { serviceWorkerSource } from "../../tools/viteQuestOfflinePlugin.mjs";

function createWorkerHarness({ cachedResponse = null, networkResponse }) {
  const listeners = new Map();
  const cacheWrites = [];
  const cache = {
    async match() { return cachedResponse; },
    async put(request, response) { cacheWrites.push({ request, response }); }
  };
  const worker = {
    location: { origin: "https://literacy.guide" },
    clients: {
      async claim() {},
      async matchAll() { return []; }
    },
    addEventListener(type, listener) { listeners.set(type, listener); }
  };

  runInNewContext(serviceWorkerSource({ buildId: "range-test", precache: [] }), {
    Request,
    URL,
    caches: {
      async open() { return cache; },
      async keys() { return []; },
      async delete() { return true; }
    },
    fetch: async () => networkResponse(),
    self: worker
  });

  return {
    cacheWrites,
    async fetch(request) {
      let responsePromise = null;
      listeners.get("fetch")({
        request,
        respondWith(value) { responsePromise = Promise.resolve(value); }
      });
      assert.ok(responsePromise, "the worker should handle Guided Reading media");
      return responsePromise;
    }
  };
}

const AUDIO_URL = "https://literacy.guide/audio/production/en-US/guided_page/bob-runs-alone-5821bb27b4.mp3";

test("the offline worker returns uncached 206 audio without trying to cache it", async () => {
  const harness = createWorkerHarness({
    networkResponse: () => new Response(new Uint8Array(1024), {
      status: 206,
      headers: { "Content-Range": "bytes 0-1023/4344" }
    })
  });
  const response = await harness.fetch(new Request(AUDIO_URL, {
    headers: { Range: "bytes=0-1023" }
  }));

  assert.equal(response.status, 206);
  assert.equal((await response.arrayBuffer()).byteLength, 1024);
  assert.equal(harness.cacheWrites.length, 0);
});

test("the offline worker can still serve a warmed complete media file to a range request", async () => {
  const cachedResponse = new Response(new Uint8Array(4344), { status: 200 });
  const harness = createWorkerHarness({
    cachedResponse,
    networkResponse: () => { throw new Error("offline"); }
  });
  const response = await harness.fetch(new Request(AUDIO_URL, {
    headers: { Range: "bytes=0-1023" }
  }));

  assert.equal(response, cachedResponse);
  assert.equal(response.status, 200);
  assert.equal(harness.cacheWrites.length, 0);
});
