import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";

import { questOfflinePlugin, serviceWorkerSource } from "../../tools/viteQuestOfflinePlugin.mjs";

function createWorkerHarness({ cachedResponse = null, networkResponse, questAssets = [], precache = [] }) {
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

  runInNewContext(serviceWorkerSource({ buildId: "range-test", precache, questAssets }), {
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
    async install() {
      let work;
      listeners.get('install')({waitUntil:promise=>{work=promise;}});
      return work;
    },
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

test('offline-shell installation overlaps four file waits and confirms readiness only after all retained writes', async () => {
  const pending=new Map(),paths=Array.from({length:6},(_,n)=>`https://literacy.guide/assets/boot-${n}.js`);
  let active=0,maximum=0,ready=false;
  const harness=createWorkerHarness({precache:paths,networkResponse:request=>new Promise(resolve=>{
    active++;maximum=Math.max(maximum,active);pending.set(request.url,()=>{active--;resolve(new Response('exact cached app code'));});
  })});
  const installed=harness.install().then(()=>{ready=true;});
  for(let n=0;n<12;n++)await Promise.resolve();
  assert.equal(pending.size,4,'A 400 ms connection must not pay a separate serial wait for every file.');
  assert.equal(ready,false);
  for(const finish of pending.values())finish();pending.clear();
  for(let n=0;n<30;n++)await new Promise(resolve=>setImmediate(resolve));
  assert.equal(pending.size,2);assert.equal(ready,false);
  for(const finish of pending.values())finish();await installed;
  assert.equal(maximum,4);assert.equal(harness.cacheWrites.length,6);assert.equal(ready,true);
});

for (const status of [500, 502, 503, 504]) test(`a temporary HTTP ${status} navigation restores the retained app instead of replacing saved work with an error page`, async () => {
  const harness = createWorkerHarness({ cachedResponse: new Response('retained assessment shell'),
    networkResponse: () => new Response('temporary Wi-Fi gateway error', { status }) });
  const response = await harness.fetch({url:'https://literacy.guide/',mode:'navigate',method:'GET'});
  assert.equal(await response.text(), 'retained assessment shell');
  assert.equal(harness.cacheWrites.length, 0);
});

test('a navigation without a retained shell still returns the actual server error, and access denials stay visible', async () => {
  for (const status of [401, 403, 404, 503]) {
    const harness = createWorkerHarness({cachedResponse: status === 503 ? null : new Response('old app'),
      networkResponse: () => new Response('actual error', {status})});
    const response = await harness.fetch({url:'https://literacy.guide/',mode:'navigate',method:'GET'});
    assert.equal(response.status, status); assert.equal(await response.text(), 'actual error');
  }
});

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

test('assessment offline packs retain current assessment code, bank and styles without eagerly downloading older banks',()=>{
 const emitted=[];
 questOfflinePlugin().generateBundle.handler.call({emitFile:row=>emitted.push(row)}, {}, {
  'assets/main.js':{type:'chunk',isEntry:true,fileName:'assets/main.js',imports:[],modules:{},code:'shell'},
  'assets/mock.js':{type:'chunk',fileName:'assets/mock.js',imports:['assets/helper.js'],dynamicImports:['assets/old-bank.js'],modules:{'/src/components/progress/LiteracyMockPage.jsx':{}},viteMetadata:{importedCss:new Set(['assets/mock.css'])},code:'mock'},
  'assets/helper.js':{type:'chunk',fileName:'assets/helper.js',imports:[],modules:{},code:'helpers'},
  'assets/current-bank.js':{type:'chunk',fileName:'assets/current-bank.js',imports:[],modules:{'/src/data/generated/literacyMockRuntimeV11.generated.js':{}},code:'current'},
  'assets/v3-bank.js':{type:'chunk',fileName:'assets/v3-bank.js',imports:[],modules:{'/src/data/generated/literacyMockV3.generated.js':{}},code:'v3'},
  'assets/old-bank.js':{type:'chunk',fileName:'assets/old-bank.js',imports:[],modules:{'/src/data/generated/literacyMockV1.generated.js':{}},code:'old'},
  'assets/mock.css':{type:'asset',fileName:'assets/mock.css',source:'styles'}
 });
 const manifest=JSON.parse(emitted.find(row=>row.fileName==='offline-build.json').source);
 assert.deepEqual(manifest.mockExecutable.assets,['/assets/current-bank.js','/assets/helper.js','/assets/mock.css','/assets/mock.js']);
 assert.ok(manifest.mockExecutable.byVersion['literacy-mock-v3'].includes('/assets/v3-bank.js'));
 assert.ok(!manifest.mockExecutable.byVersion['literacy-mock-v3'].includes('/assets/old-bank.js'));
 assert.ok(manifest.mockExecutable.byVersion['literacy-mock-v1'].includes('/assets/old-bank.js'));
 assert.ok(!manifest.precache.includes('/assets/mock.js'));
});

test('assessment and cold-start caches retain the lazy auth and RPC validators needed after a disconnected reload',()=>{
 const emitted=[];
 questOfflinePlugin().generateBundle.handler.call({emitFile:row=>emitted.push(row)}, {}, {
  'assets/main.js':{type:'chunk',isEntry:true,fileName:'assets/main.js',imports:[],modules:{},code:'shell'},
  'assets/mock.js':{type:'chunk',fileName:'assets/mock.js',imports:[],modules:{'/src/components/progress/LiteracyMockPage.jsx':{}},code:'mock'},
  'assets/client.js':{type:'chunk',fileName:'assets/client.js',imports:['assets/schema.js'],modules:{'/src/data/boundaries/client.js':{}},code:'rpc validators'},
  'assets/auth.js':{type:'chunk',fileName:'assets/auth.js',imports:['assets/schema.js'],modules:{'/src/data/boundaries/auth.js':{}},code:'auth validator'},
  'assets/schema.js':{type:'chunk',fileName:'assets/schema.js',imports:[],modules:{},code:'schema'},
  'assets/old-bank.js':{type:'chunk',fileName:'assets/old-bank.js',imports:[],modules:{'/src/data/generated/literacyMockV1.generated.js':{}},code:'historical bank'}
 });
 const manifest=JSON.parse(emitted.find(row=>row.fileName==='offline-build.json').source);
 for(const path of ['/assets/client.js','/assets/auth.js','/assets/schema.js']) {
  assert.ok(manifest.precache.includes(path),`Cold-start validator absent: ${path}`);
  assert.ok(manifest.mockExecutable.assets.includes(path),`Assessment validator absent: ${path}`);
 }
 assert.ok(!manifest.mockExecutable.assets.includes('/assets/old-bank.js'));
});

test('the English assessment pack retains its actual Latin font faces without downloading every script and fallback format',()=>{
 const emitted=[];
 const fonts=['reader-latin-400-normal.woff2','reader-latin-400-normal.woff','reader-devanagari-400-normal.woff2','unrelated-latin-700-normal.woff2'];
 const bundle={
  'assets/mock.js':{type:'chunk',fileName:'assets/mock.js',imports:[],modules:{'/src/components/progress/LiteracyMockPage.jsx':{}},viteMetadata:{importedCss:new Set(['assets/mock.css'])},code:'mock'},
  'assets/mock.css':{type:'asset',fileName:'assets/mock.css',source:'@font-face{font-family:reader;src:url(/assets/reader-latin-400-normal.woff2) format("woff2"),url(/assets/reader-latin-400-normal.woff) format("woff");unicode-range:U+0000-00FF,U+0131;}@font-face{font-family:reader;src:url(/assets/reader-devanagari-400-normal.woff2);unicode-range:U+0900-097F;}'}
 };
 for(const file of fonts)bundle['assets/'+file]={type:'asset',fileName:'assets/'+file,source:'font'};
 questOfflinePlugin().generateBundle.handler.call({emitFile:row=>emitted.push(row)},{},bundle);
 const pack=JSON.parse(emitted.find(row=>row.fileName==='offline-build.json').source).mockExecutable.assets;
 assert.ok(pack.includes('/assets/reader-latin-400-normal.woff2'));
 assert.ok(!pack.some(path=>/devanagari|unrelated|\.woff$/.test(path)),pack.join('\n'));
});
