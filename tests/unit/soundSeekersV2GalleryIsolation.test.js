import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { once } from "node:events";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assertSoundSeekersV2Content,
  scanSoundSeekersV2SourcePolicy
} from "../../tools/checkSoundSeekersV2Content.mjs";
import {
  createQuestOfflineControlServer,
  createQuestOfflineRangeServer,
  parseSingleRange,
  validateQuestOfflineRoot
} from "../../tools/serveQuestOfflineRangeTest.mjs";
import { selectQuestExecutablePolicy } from "../../tools/checkQuestOffline.mjs";

const scanVirtualPolicy = options => scanSoundSeekersV2SourcePolicy(options);

test("production bundle analysis fails on every gallery marker and accepts an isolated bundle", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "ssv2-gallery-isolation-"));
  try {
    const clean = path.join(root, "clean.json");
    writeFileSync(clean, JSON.stringify({ inputs: { "src/main.jsx": {} }, outputs: {} }));
    assert.doesNotThrow(() => assertSoundSeekersV2Content({ productionBundlePath: clean }));
    const leaked = path.join(root, "leaked.json");
    writeFileSync(leaked, JSON.stringify({ inputs: { "preview/sound-seekers-v2-content.jsx": {} } }));
    assert.throws(() => assertSoundSeekersV2Content({ productionBundlePath: leaked }));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("gallery isolation follows static, re-export, dynamic, HTML, and CSS edges", () => {
  const cases = [
    ["static import", "src/main.jsx", "import './features/soundSeekers/preview/ContentArtGallery.jsx';"],
    ["named re-export", "src/main.jsx", "export { ContentArtGallery } from './features/soundSeekers/preview/ContentArtGallery.jsx';"],
    ["star re-export", "src/main.jsx", "export * from './features/soundSeekers/preview/galleryReplayRecipes.js';"],
    ["literal dynamic import", "src/main.jsx", "export const load = () => import('./features/soundSeekers/preview/ContentArtGallery.jsx');"],
    ["nonliteral dynamic import", "src/main.jsx", "export const load = () => import('./features/' + 'soundSeekers/preview/ContentArtGallery.jsx');"],
    ["unprovable JavaScript dynamic import", "src/main.js", "const localPath = chooseAtRuntime(); export const load = () => import(localPath);"],
    ["unprovable TypeScript dynamic import", "src/main.ts", "const localPath: string = chooseAtRuntime(); export const load = () => import(localPath);"],
    ["unprovable TSX dynamic import", "src/main.tsx", "const localPath: string = chooseAtRuntime(); export const App = () => <button onClick={() => import(localPath)}>Load</button>;"],
    ["HTML module", "index.html", "<script type=\"module\" src=\"/preview/sound-seekers-v2-content.jsx\"></script>"],
    ["CSS import", "src/index.css", "@import './features/soundSeekers/preview/content-art-gallery.css';"]
  ];
  for (const [label, relativePath, source] of cases) {
    assert.throws(() => scanVirtualPolicy({
      virtualSources: { [relativePath]: source }
    }), undefined, label);
  }
});

test("gallery graph rejects unresolved edges and permits only the exact evidence consumers", () => {
  assert.throws(() => scanVirtualPolicy({
    virtualSources: {
      "preview/sound-seekers-v2-content.jsx": "import '../src/features/soundSeekers/preview/ContentArtGalleryMissing.jsx';"
    }
  }));
  assert.throws(() => scanVirtualPolicy({
    virtualSources: {
      "tests/unit/not-an-authorized-gallery-consumer.test.js":
        "import '../../src/features/soundSeekers/preview/galleryReplayRecipes.js';"
    }
  }));
  assert.throws(() => scanVirtualPolicy({
    removedSources: ["src/features/soundSeekers/preview/ContentArtGallery.jsx"]
  }));
  assert.throws(() => scanVirtualPolicy({
    virtualSources: {
      "src/main.tsx": "export { ContentArtGallery } from './features/soundSeekers/preview/ContentArtGallery.jsx';"
    }
  }));
});

test("preview policy rejects authored transition, evidence, correctness, phase, challenge, and response authority", () => {
  for (const [label, source] of [
    ["transition", "export const x = { presentationTransition: { reducerRevision: 1 } };"],
    ["evidence", "export const x = { evidenceEvent: { domain: 'novel_decoding' } };"],
    ["correctness", "export const x = { correct: true };"],
    ["phase prop", "export const x = <SceneVisual phase=\"resolved\" />;"],
    ["challenge", "export const x = { challenge: { expectedToken: 'x' } };"],
    ["response", "export const x = { response: { token: 'x' } };"],
    ["direct access", "import { issueSceneVisualAccess } from '../engine/sceneVisualAccess.js'; issueSceneVisualAccess({}, {});"]
  ]) {
    assert.throws(() => scanVirtualPolicy({
      virtualSources: { "src/features/soundSeekers/preview/bad.jsx": source }
    }), undefined, label);
  }
  for (const [label, source] of [
    ["replay transition lookalike", "export function replaySoundSeekersGalleryFixture() { return { presentationTransition: { reducerRevision: 1 } }; }"],
    ["replay evidence lookalike", "export function replaySoundSeekersGalleryFixture() { return { evidenceEvent: { domain: 'novel_decoding' } }; }"],
    ["replay phase literal", "export function replaySoundSeekersGalleryFixture() { return { phase: 'resolved' }; }"],
    ["replay direct access lookalike", "export function replaySoundSeekersGalleryFixture() { return issueSceneVisualAccess({}, {}); }"],
    ["replay caller-authored transaction", "export function replaySoundSeekersGalleryFixture() { return completeStoryTransferTransaction(state, { challenge: { expectedToken: 'x' }, response: { kind: 'literacy-answer', token: 'x' } }); }"]
  ]) {
    assert.throws(() => scanVirtualPolicy({
      virtualSources: { "src/features/soundSeekers/preview/galleryReplayRecipes.js": source }
    }), undefined, label);
  }
});

test("the offline range server rejects unsafe roots and implements one standards-compliant range", () => {
  assert.throws(() => validateQuestOfflineRoot("."));
  assert.throws(() => validateQuestOfflineRoot(os.homedir()));
  assert.deepEqual(parseSingleRange("bytes=2-5", 10), { start: 2, end: 5 });
  assert.deepEqual(parseSingleRange("bytes=-3", 10), { start: 7, end: 9 });
  assert.deepEqual(parseSingleRange("bytes=7-", 10), { start: 7, end: 9 });
  assert.throws(() => parseSingleRange("bytes=11-12", 10));
  assert.throws(() => parseSingleRange("bytes=0-1,3-4", 10));
});

test("the offline range server rejects symlink components and unauthenticated shutdown", async () => {
  const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), "ssv2-range-server-")));
  const previousToken = process.env.QUEST_OFFLINE_SHUTDOWN_TOKEN;
  process.env.QUEST_OFFLINE_SHUTDOWN_TOKEN = "a".repeat(64);
  let server = null;
  try {
    const actual = path.join(root, "actual");
    mkdirSync(actual);
    writeFileSync(path.join(actual, "asset.txt"), "not reachable through a symlink");
    symlinkSync(actual, path.join(root, "linked"), "dir");
    server = createQuestOfflineRangeServer({ root });
    server.listen({ host: "127.0.0.1", port: 0, exclusive: true });
    await once(server, "listening");
    const { port } = server.address();
    const base = `http://127.0.0.1:${port}`;
    assert.equal((await fetch(`${base}/linked/asset.txt`)).status, 404);
    assert.equal((await fetch(`${base}/.quest-offline-test/shutdown`, { method: "POST" })).status, 404);
    assert.equal((await fetch(`${base}/.quest-offline-test/shutdown`, {
      method: "POST", headers: { "X-Quest-Offline-Shutdown-Token": "b".repeat(64) }
    })).status, 404);
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    server = null;
  } finally {
    if (server?.listening) await new Promise(resolve => server.close(() => resolve()));
    if (previousToken === undefined) delete process.env.QUEST_OFFLINE_SHUTDOWN_TOKEN;
    else process.env.QUEST_OFFLINE_SHUTDOWN_TOKEN = previousToken;
    rmSync(root, { recursive: true, force: true });
  }
});

test("the offline range listener stays closed until an explicit authenticated restart", async () => {
  const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), "ssv2-range-lifecycle-")));
  const previousToken = process.env.QUEST_OFFLINE_SHUTDOWN_TOKEN;
  process.env.QUEST_OFFLINE_SHUTDOWN_TOKEN = "c".repeat(64);
  let server = null;
  let controlServer = null;
  try {
    writeFileSync(path.join(root, "index.html"), "listener lifecycle");
    server = createQuestOfflineRangeServer({ root });
    server.listen({ host: "127.0.0.1", port: 0, exclusive: true });
    await once(server, "listening");
    const { port } = server.address();
    const base = `http://127.0.0.1:${port}`;
    controlServer = createQuestOfflineControlServer({ assetServer: server });
    controlServer.listen({ host: "127.0.0.1", port: 0, exclusive: true });
    await once(controlServer, "listening");
    const controlBase = `http://127.0.0.1:${controlServer.address().port}`;
    assert.equal((await fetch(base)).status, 200);
    assert.equal((await fetch(`${controlBase}/.quest-offline-test/restart`, { method: "POST" })).status, 404);
    assert.equal((await fetch(`${controlBase}/.quest-offline-test/restart`, {
      method: "POST", headers: { "X-Quest-Offline-Shutdown-Token": "d".repeat(64) }
    })).status, 404);
    const closed = once(server, "close");
    assert.equal((await fetch(`${base}/.quest-offline-test/shutdown`, {
      method: "POST", headers: { "X-Quest-Offline-Shutdown-Token": "c".repeat(64) }
    })).status, 202);
    await closed;
    await new Promise(resolve => setTimeout(resolve, 3_250));
    assert.equal(server.listening, false);
    await assert.rejects(() => fetch(base));
    const restart = await fetch(`${controlBase}/.quest-offline-test/restart`, {
      method: "POST", headers: { "X-Quest-Offline-Shutdown-Token": "c".repeat(64) }
    });
    assert.equal(restart.status, 202);
    assert.equal((await fetch(base)).status, 200);
  } finally {
    if (controlServer?.listening) await new Promise(resolve => controlServer.close(() => resolve()));
    if (server?.listening) await new Promise(resolve => server.close(() => resolve()));
    if (previousToken === undefined) delete process.env.QUEST_OFFLINE_SHUTDOWN_TOKEN;
    else process.env.QUEST_OFFLINE_SHUTDOWN_TOKEN = previousToken;
    rmSync(root, { recursive: true, force: true });
  }
});

test("offline executable checks are transition-safe and never accept a mixed legacy/v2 shell", () => {
  assert.deepEqual(selectQuestExecutablePolicy([
    "/assets/QuestRoot-old.js", "/assets/QuestPixelWorld-old.js", "/assets/shared.js"
  ], {
    mode: "legacy",
    roots: ["/assets/QuestRoot-old.js", "/assets/QuestPixelWorld-old.js"],
    graph: [
      { url: "/assets/QuestRoot-old.js", imports: ["/assets/shared.js"] },
      { url: "/assets/QuestPixelWorld-old.js", imports: ["/assets/shared.js"] },
      { url: "/assets/shared.js", imports: [] }
    ]
  }), { mode: "legacy", roots: ["/assets/QuestRoot-old.js", "/assets/QuestPixelWorld-old.js"], closure: [
    "/assets/QuestPixelWorld-old.js", "/assets/QuestRoot-old.js", "/assets/shared.js"
  ] });
  assert.deepEqual(selectQuestExecutablePolicy([
    "/assets/SoundSeekersRoute-new.js", "/assets/Game-new.js", "/assets/Stage-new.js"
  ], {
    mode: "v2",
    roots: ["/assets/SoundSeekersRoute-new.js"],
    graph: [
      { url: "/assets/SoundSeekersRoute-new.js", imports: ["/assets/Game-new.js"] },
      { url: "/assets/Game-new.js", imports: ["/assets/Stage-new.js"] },
      { url: "/assets/Stage-new.js", imports: [] }
    ]
  }), { mode: "v2", roots: ["/assets/SoundSeekersRoute-new.js"], closure: [
    "/assets/Game-new.js", "/assets/SoundSeekersRoute-new.js", "/assets/Stage-new.js"
  ] });
  assert.throws(() => selectQuestExecutablePolicy([
    "/assets/SoundSeekersRoute-new.js", "/assets/Game-new.js",
    "/assets/QuestRoot-old.js", "/assets/QuestPixelWorld-old.js"
  ], {
    mode: "v2", roots: ["/assets/SoundSeekersRoute-new.js"],
    graph: [{ url: "/assets/SoundSeekersRoute-new.js", imports: ["/assets/Game-new.js"] }, { url: "/assets/Game-new.js", imports: [] }]
  }));
  assert.throws(() => selectQuestExecutablePolicy(["/assets/SoundSeekersRoute-new.js"], {
    mode: "v2", roots: ["/assets/SoundSeekersRoute-new.js"],
    graph: [{ url: "/assets/SoundSeekersRoute-new.js", imports: ["/assets/missing.js"] }]
  }));
  assert.throws(() => selectQuestExecutablePolicy([
    "/assets/QuestRoot-old.js", "/assets/QuestPixelWorld-old.js", "/assets/shared.js"
  ], {
    mode: "legacy",
    roots: ["/assets/QuestPixelWorld-old.js"],
    graph: [
      { url: "/assets/QuestPixelWorld-old.js", imports: ["/assets/shared.js"] },
      { url: "/assets/shared.js", imports: [] }
    ]
  }));
  assert.throws(() => selectQuestExecutablePolicy([
    "/assets/SoundSeekersRoute-a.js", "/assets/SoundSeekersRoute-b.js", "/assets/shared.js"
  ], {
    mode: "v2",
    roots: ["/assets/SoundSeekersRoute-a.js"],
    graph: [
      { url: "/assets/SoundSeekersRoute-a.js", imports: ["/assets/shared.js"] },
      { url: "/assets/shared.js", imports: [] }
    ]
  }));
  assert.throws(() => selectQuestExecutablePolicy([
    "/assets/QuestRoot-a.js", "/assets/QuestRoot-b.js", "/assets/QuestPixelWorld-a.js"
  ], {
    mode: "legacy",
    roots: ["/assets/QuestRoot-a.js", "/assets/QuestRoot-b.js", "/assets/QuestPixelWorld-a.js"],
    graph: [
      { url: "/assets/QuestRoot-a.js", imports: [] },
      { url: "/assets/QuestRoot-b.js", imports: [] },
      { url: "/assets/QuestPixelWorld-a.js", imports: [] }
    ]
  }));
});
