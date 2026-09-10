import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import test from "node:test";

import { questOfflinePlugin, serviceWorkerSource } from "../../tools/viteQuestOfflinePlugin.mjs";

function createWorkerHarness({ cachedResponse = null, networkResponse }) {
  const listeners = new Map();
  const cacheWrites = [];
  const messages = [];
  let skipWaitingCalls = 0;
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
    async skipWaiting() { skipWaitingCalls += 1; },
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
    messages,
    get skipWaitingCalls() { return skipWaitingCalls; },
    async message(data) {
      let waitPromise = Promise.resolve();
      listeners.get("message")({
        data,
        source: { postMessage(value) { messages.push(value); } },
        waitUntil(value) { waitPromise = Promise.resolve(value); }
      });
      await waitPromise;
    },
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

test("a same-origin recovery action can activate a corrected waiting worker", async () => {
  const harness = createWorkerHarness({
    networkResponse: () => new Response(null, { status: 200 })
  });

  await harness.message({ type: "LP_ACTIVATE_UPDATE" });

  assert.equal(harness.skipWaitingCalls, 1);
});

test("the offline worker warms canonical book-character art without accepting generic game assets", async () => {
  const harness = createWorkerHarness({
    networkResponse: () => new Response(new Uint8Array([1, 2, 3]), { status: 200 })
  });
  const characterUrl = "/game-assets/sound-seekers/characters/muddy/outfit-willow-wand.webp";
  await harness.message({
    type: "LP_WARM_QUEST_ASSETS",
    requestId: "character-warm-test",
    chapterId: "star-reach",
    urls: [characterUrl, "/game-assets/unrelated/private.bin"]
  });

  assert.equal(harness.cacheWrites.length, 1);
  assert.equal(new URL(harness.cacheWrites[0].request, "https://literacy.guide").pathname, characterUrl);
  assert.deepEqual(JSON.parse(JSON.stringify(harness.messages)), [{
    type: "LP_QUEST_WARM_COMPLETE",
    buildId: "range-test",
    requestId: "character-warm-test",
    chapterId: "star-reach",
    requested: 1,
    completed: 1,
    failed: 0
  }]);
});

 test("offline precache follows selected v2 runtime without reviving emitted legacy chunks", async () => {
  const {selectQuestExecutablePolicy}=await import("../../tools/checkQuestOffline.mjs");
  const chunk=(fileName,imports=[],extra={})=>({type:"chunk",fileName,imports,dynamicImports:[],code:"",...extra});
  const bundle={
    "assets/main.js":chunk("assets/main.js",[],{isEntry:true}),
    "assets/SoundSeekersRoute-new.js":chunk("assets/SoundSeekersRoute-new.js",[],{dynamicImports:["assets/ActiveStage-new.js"]}),
    "assets/ActiveStage-new.js":chunk("assets/ActiveStage-new.js"),
    "assets/QuestRoot-old.js":chunk("assets/QuestRoot-old.js",["assets/QuestPixelWorld-old.js"]),
    "assets/QuestPixelWorld-old.js":chunk("assets/QuestPixelWorld-old.js")
  };
  const build=source=>{const emitted=[];questOfflinePlugin().generateBundle.call({emitFile:item=>emitted.push(item)}, {}, source);return JSON.parse(emitted.find(item=>item.fileName==="offline-build.json").source);};
  const current=build(bundle);
  assert.ok(current.precache.includes("/assets/ActiveStage-new.js"));
  assert.ok(!current.precache.some(url=>/QuestRoot|QuestPixelWorld/.test(url)));
  assert.equal(selectQuestExecutablePolicy(current.precache,current.questExecutable).mode,"v2");
  const legacy={...bundle};delete legacy["assets/SoundSeekersRoute-new.js"];delete legacy["assets/ActiveStage-new.js"];
  const old=build(legacy);assert.equal(selectQuestExecutablePolicy(old.precache,old.questExecutable).mode,"legacy");
  const explicitPreview=build({...bundle,"assets/preview.js":chunk("assets/preview.js",["assets/QuestRoot-old.js"],{isEntry:true})});
  assert.throws(()=>selectQuestExecutablePolicy(explicitPreview.precache,explicitPreview.questExecutable),/legacy QuestRoot/);
 });
