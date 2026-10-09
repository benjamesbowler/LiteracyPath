import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";

import { questOfflinePlugin, serviceWorkerSource } from "../../tools/viteQuestOfflinePlugin.mjs";

function createWorkerHarness({ cachedResponse = null, networkResponse, questAssets = [] }) {
  const listeners = new Map();
  const cacheWrites = [];
  const stored = new Map();
  const messages = [];
  let skipWaitingCalls = 0;
  const cache = {
    async match(request) {
      const key = typeof request === "string" ? request : request.url;
      return cachedResponse || stored.get(key)?.clone() || null;
    },
    async put(request, response) {
      cacheWrites.push({ request, response });
      stored.set(typeof request === "string" ? request : request.url, response.clone());
    }
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

  runInNewContext(serviceWorkerSource({ buildId: "range-test", precache: [], questAssets }), {
    Request,
    URL,
    caches: {
      async open() { return cache; },
      async keys() { return []; },
      async delete() { return true; }
    },
    fetch: async request => networkResponse(request),
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
      assert.ok(responsePromise, "the worker should handle the requested owned media");
      return responsePromise;
    }
  };
}

const AUDIO_URL = "https://literacy.guide/audio/production/en-US/guided_page/bob-runs-alone-5821bb27b4.mp3";

test("loaded rounded GLB bytes under Vite's hashed asset root survive an offline scene reload", async () => {
  const modelPaths = ['characters/bouncy.glb', 'forest/tree.glb', 'forest/rock.glb', 'forest/mushrooms.glb',
    'characters/woolly.glb', 'characters/splashy.glb', 'characters/clucky.glb'];
  const models = new Map(modelPaths.map(path => {
    const bytes = readFileSync(new URL(`../../demos/sound-seekers/assets/${path}`, import.meta.url));
    assert.equal(bytes.readUInt32LE(0), 0x46546c67, `${path} is an actual binary glTF model`);
    const stem = path.split('/').at(-1).replace('.glb', '');
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 8);
    return [`https://literacy.guide/assets/${stem}-${hash}.glb`, bytes];
  }));
  let online = true, networkCalls = 0;
  const harness = createWorkerHarness({ networkResponse: request => {
    networkCalls++;
    if (!online) throw new Error('offline');
    const bytes = models.get(request.url);
    assert.ok(bytes, 'only exact current scene model requests are fetched');
    return new Response(bytes, { status: 200, headers: { 'Content-Type': 'model/gltf-binary' } });
  } });
  for (const [url, bytes] of models) {
    const response = await harness.fetch(new Request(url));
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array(bytes));
  }
  assert.equal(harness.cacheWrites.length, models.size);
  online = false;
  for (const [url, bytes] of models) {
    const restored = await harness.fetch(new Request(url));
    assert.deepEqual(new Uint8Array(await restored.arrayBuffer()), new Uint8Array(bytes));
  }
  assert.equal(networkCalls, models.size, 'the offline reload uses saved full model bytes without a network request');
  assert.equal(harness.cacheWrites.length, models.size);
  const resolver = readFileSync(new URL('../../demos/sound-seekers/src/assetUrls.js', import.meta.url), 'utf8');
  assert.match(resolver, /import\.meta\.glob\('[^']*\.\{glb,mp3,png,webp\}'/);
  assert.match(resolver, /query: '\?url&no-inline'/);
});

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

test("campaign warming caches its exact canonical audio roots and excludes private data and unrelated audio", async () => {
  const harness = createWorkerHarness({ networkResponse: () => new Response(new Uint8Array([1, 2, 3]), { status: 200 }) });
  const allowed = [
    "/audio/sound-seekers/campaign/stage-meadow-01-problem.mp3",
    "/audio/phonemes/reviewed/canonical.mp3",
    "/audio/production/en-US/isolated_word/canonical.mp3",
    "/audio/production/en-US/supplemental/canonical.mp3",
    "/audio/production/en-US/pattern/canonical.mp3"
  ];
  await harness.message({ type: "LP_WARM_QUEST_ASSETS", requestId: "mission-warm", chapterId: "meadow-01-1",
    urls: [...allowed, "/api/student_progress", "/audio/production/en-US/private/answer.mp3",
      "https://private.example/audio/sound-seekers/campaign/answer.mp3"] });
  assert.deepEqual(harness.cacheWrites.map(item => new URL(item.request, "https://literacy.guide").pathname), allowed);
  assert.equal(harness.messages[0].requested, allowed.length);
  assert.equal(harness.messages[0].completed, allowed.length);
  assert.equal(harness.messages[0].failed, 0);
});

test("a warmed campaign prompt remains playable offline without caching a partial range response", async () => {
  const cached = new Response(new Uint8Array(2222), { status: 200 });
  const harness = createWorkerHarness({ cachedResponse: cached, networkResponse: () => { throw new Error("offline"); } });
  const response = await harness.fetch(new Request("https://literacy.guide/audio/sound-seekers/campaign/stage-meadow-01-problem.mp3",
    { headers: { Range: "bytes=0-511" } }));
  assert.equal(response, cached);
  assert.equal((await response.arrayBuffer()).byteLength, 2222);
  assert.equal(harness.cacheWrites.length, 0);
});

test("painted question and banner images warm once and remain available without a network", async () => {
  let online=true;
  const harness=createWorkerHarness({networkResponse:()=>{if(!online)throw new Error('offline');return new Response(new Uint8Array([82,73,70,70]),{status:200});}});
  const urls=['/images/sound-seekers/questions/towel-example.webp','/game-assets/sound-seekers/question-art/landscape-day.webp'];
  await harness.message({type:'LP_WARM_QUEST_ASSETS',urls:[...urls,'/api/student_progress','https://foreign.example/images/sound-seekers/questions/private.webp']});
  assert.equal(harness.cacheWrites.length,urls.length);
  online=false;
  for(const url of urls)assert.equal((await harness.fetch(new Request('https://literacy.guide'+url))).status,200);
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
  const build=source=>{const emitted=[];questOfflinePlugin().generateBundle.handler.call({emitFile:item=>emitted.push(item)}, {}, source);return JSON.parse(emitted.find(item=>item.fileName==="offline-build.json").source);};
  const current=build(bundle);
  assert.ok(!current.precache.includes("/assets/ActiveStage-new.js"));
  assert.ok(current.questExecutable.assets.includes("/assets/ActiveStage-new.js"));
  assert.ok(!current.precache.some(url=>/QuestRoot|QuestPixelWorld/.test(url)));
  assert.equal(selectQuestExecutablePolicy(current.precache,current.questExecutable).mode,"v2");
  const legacy={...bundle};delete legacy["assets/SoundSeekersRoute-new.js"];delete legacy["assets/ActiveStage-new.js"];
  const old=build(legacy);assert.equal(selectQuestExecutablePolicy(old.precache,old.questExecutable).mode,"legacy");
  const explicitPreview=build({...bundle,"assets/preview.js":chunk("assets/preview.js",["assets/QuestRoot-old.js"],{isEntry:true})});
  assert.throws(()=>selectQuestExecutablePolicy(explicitPreview.precache,explicitPreview.questExecutable),/legacy QuestRoot/);
 });

test("activity code and styles stay deferred while Home includes its own styles", () => {
  const chunk = (fileName, extra = {}) => ({ type: "chunk", fileName, imports: [], dynamicImports: [], code: "", ...extra });
  const emitted = [];
  questOfflinePlugin().generateBundle.handler.call({ emitFile: item => emitted.push(item) }, {}, {
    "assets/main.js": chunk("assets/main.js", { isEntry: true }),
    "assets/home.js": chunk("assets/home.js", {
      modules: { "/src/components/StudentHomePage.jsx": {} },
      viteMetadata: { importedCss: new Set(["assets/home.css"]) }
    }),
    "assets/home.css": { type: "asset", fileName: "assets/home.css", source: "" },
    "assets/teacher.css": { type: "asset", fileName: "assets/teacher.css", source: "" },
    "assets/SoundSeekersRoute-now.js": chunk("assets/SoundSeekersRoute-now.js", {
      viteMetadata: { importedCss: new Set(["assets/quest.css"]) }
    }),
    "assets/quest.css": { type: "asset", fileName: "assets/quest.css", source: "" }
  });
  const build = JSON.parse(emitted.find(item => item.fileName === "offline-build.json").source);
  assert.ok(build.precache.includes("/assets/home.js"));
  assert.ok(build.precache.includes("/assets/home.css"));
  assert.ok(!build.precache.includes("/assets/teacher.css"));
  assert.ok(!build.precache.includes("/assets/quest.css"));
  assert.ok(build.questExecutable.assets.includes("/assets/quest.css"));
});

test("only an explicit Quest visit warms its build-matched executable pack", async () => {
  const harness = createWorkerHarness({
    networkResponse: () => new Response(new Uint8Array([1]), { status: 200 }),
    questAssets: ["https://literacy.guide/assets/quest.js", "https://literacy.guide/assets/quest.css"]
  });
  await harness.message({ type: "LP_OFFLINE_STATUS" });
  assert.equal(harness.cacheWrites.length, 0);
  await harness.message({ type: "LP_WARM_QUEST_EXECUTABLE" });
  assert.equal(harness.cacheWrites.length, 2);
  assert.equal(harness.messages.at(-1).type, "LP_QUEST_EXECUTABLE_READY");
  assert.equal(harness.messages.at(-1).failed, 0);
});

test("failed route warmups never report offline readiness", async () => {
  const harness = createWorkerHarness({
    networkResponse: () => { throw new Error("offline"); },
    questAssets: ["https://literacy.guide/assets/quest.js"]
  });
  await harness.message({ type: "LP_WARM_QUEST_EXECUTABLE" });
  assert.equal(harness.messages.at(-1).failed, 1);
});
