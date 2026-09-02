import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { once } from "node:events";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { assertSoundSeekersV2Content } from "../../tools/checkSoundSeekersV2Content.mjs";
import {
  createQuestOfflineRangeServer,
  parseSingleRange,
  validateQuestOfflineRoot
} from "../../tools/serveQuestOfflineRangeTest.mjs";
import { selectQuestExecutablePolicy } from "../../tools/checkQuestOffline.mjs";

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
});
