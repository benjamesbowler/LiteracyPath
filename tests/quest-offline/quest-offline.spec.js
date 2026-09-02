import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { QUEST_PIXEL_SFX_URLS } from "../../src/utils/questActionAudio.js";
import { readSoundSeekersV2AssetManifest } from "../../tools/lib/soundSeekersV2AssetManifest.mjs";

const QUEST_URL = "/preview/quest.html?view=world&stop=s36&done=35&display=pixel&active=0&adapt=0";
const EVIDENCE_URL = "/preview/quest-evidence.html";
const STORAGE_KEY = "lp-quest:preview";
const GUIDED_READING_AUDIO_URL = "/audio/production/en-US/guided_page/bob-runs-alone-5821bb27b4.mp3";

function jsonFence(filePath) {
  const match = /```json\n([\s\S]+?)\n```/u.exec(readFileSync(filePath, "utf8"));
  return JSON.parse(match[1]);
}

const V2_BACKGROUNDS = readSoundSeekersV2AssetManifest().assets.map(asset => ({
  path: asset.path,
  sha256: asset.final.sha256
}));
const INSTRUCTION_AUDIO = jsonFence("public/audio/quest-v2/instructions/SOURCE.md").assets[0];
const SCENE_AUDIO = jsonFence("public/audio/quest-v2/SOURCE.md").assets;
const V2_WARM_MEDIA = [
  ...V2_BACKGROUNDS,
  { path: INSTRUCTION_AUDIO.path, sha256: INSTRUCTION_AUDIO.sha256 },
  { path: SCENE_AUDIO[0].path, sha256: SCENE_AUDIO[0].sha256 }
];
const V2_UNWARMED_AUDIO = SCENE_AUDIO.find(asset => !V2_WARM_MEDIA.some(item => item.path === asset.path));

async function savedCheckpoint(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || "null")?.checkpoint || null, STORAGE_KEY);
}

async function offlineHistory(page) {
  return page.evaluate(() => JSON.parse(sessionStorage.getItem("lp-offline-shell-history-v1") || "[]"));
}

test("Sound Seekers v2 media warms exact complete bytes and leaves unwarmed ranges partial", async ({ page, context }) => {
  await page.goto(EVIDENCE_URL);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  const warm = await page.evaluate(async urls => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("v2 warm timeout")), 20_000);
    const listener = event => {
      if (event.data?.type !== "LP_QUEST_WARM_COMPLETE" || event.data?.requestId !== "task6-v2") return;
      clearTimeout(timer);
      navigator.serviceWorker.removeEventListener("message", listener);
      resolve(event.data);
    };
    navigator.serviceWorker.addEventListener("message", listener);
    navigator.serviceWorker.controller.postMessage({
      type: "LP_WARM_QUEST_ASSETS", requestId: "task6-v2", chapterId: "all-v2", urls
    });
  }), V2_WARM_MEDIA.map(item => item.path));
  expect(warm).toMatchObject({ requested: 10, completed: 10, failed: 0 });

  const online = await page.evaluate(async ({ expected, unwarmed }) => {
    const digest = async response => [...new Uint8Array(await crypto.subtle.digest("SHA-256", await response.arrayBuffer()))]
      .map(value => value.toString(16).padStart(2, "0")).join("");
    const complete = [];
    for (const item of expected) {
      const response = await fetch(item.path);
      complete.push({ path: item.path, status: response.status, sha256: await digest(response) });
    }
    const backgroundRange = await fetch(expected[0].path, { headers: { Range: "bytes=0-31" } });
    const audioRange = await fetch(expected[9].path, { headers: { Range: "bytes=0-31" } });
    const partial = await fetch(unwarmed.path, { headers: { Range: "bytes=0-31" } });
    const partialBytes = await partial.arrayBuffer();
    const cachePaths = (await (await caches.open("lp-quest-media-v1")).keys())
      .map(request => new URL(request.url).pathname).filter(pathname => pathname.includes("/sound-seekers/v2/") || pathname.startsWith("/audio/quest-v2/"));
    return {
      complete,
      backgroundRange: { status: backgroundRange.status, sha256: await digest(backgroundRange) },
      audioRange: { status: audioRange.status, sha256: await digest(audioRange) },
      partial: { status: partial.status, contentRange: partial.headers.get("content-range"), byteLength: partialBytes.byteLength },
      cachePaths
    };
  }, { expected: V2_WARM_MEDIA, unwarmed: V2_UNWARMED_AUDIO });
  expect(online.complete).toEqual(V2_WARM_MEDIA.map(item => ({ ...item, status: 200 })));
  expect(online.backgroundRange).toEqual({ status: 200, sha256: V2_WARM_MEDIA[0].sha256 });
  expect(online.audioRange).toEqual({ status: 200, sha256: V2_WARM_MEDIA[9].sha256 });
  expect(online.partial).toEqual({ status: 206, contentRange: expect.stringMatching(/^bytes 0-31\/\d+$/u), byteLength: 32 });
  expect(online.cachePaths.sort()).toEqual(V2_WARM_MEDIA.map(item => item.path).sort());

  const shutdownToken = process.env.QUEST_OFFLINE_SHUTDOWN_TOKEN;
  expect(shutdownToken).toMatch(/^[a-f0-9]{64}$/u);
  const shutdown = await fetch("http://127.0.0.1:5191/.quest-offline-test/shutdown", {
    method: "POST",
    headers: { "X-Quest-Offline-Shutdown-Token": shutdownToken }
  });
  expect(shutdown.status).toBe(202);
  await expect.poll(async () => {
    try { await fetch("http://127.0.0.1:5191/index.html", { cache: "no-store" }); return false; } catch { return true; }
  }).toBe(true);

  await context.setOffline(true);
  await page.close();
  const offlinePage = await context.newPage();
  await offlinePage.goto(EVIDENCE_URL);
  const offline = await offlinePage.evaluate(async ({ expected, unwarmed }) => {
    const complete = [];
    for (const item of expected) complete.push((await fetch(item.path)).status);
    let unwarmedFailed;
    try {
      const response = await fetch(unwarmed.path, { headers: { Range: "bytes=0-31" } });
      unwarmedFailed = !response.ok;
    } catch { unwarmedFailed = true; }
    return { complete, unwarmedFailed };
  }, { expected: V2_WARM_MEDIA, unwarmed: V2_UNWARMED_AUDIO });
  expect(offline.complete).toEqual(Array(10).fill(200));
  expect(offline.unwarmedFailed).toBe(true);
  await context.setOffline(false);
  await expect.poll(async () => {
    try { return (await fetch("http://127.0.0.1:5191/index.html", { cache: "no-store" })).status; } catch { return 0; }
  }, { timeout: 10_000 }).toBe(200);
});

test("streaming audio range requests bypass cache writes and remain playable", async ({ page }) => {
  let streamedResponse = null;
  page.on("response", response => {
    if (new URL(response.url()).pathname === GUIDED_READING_AUDIO_URL) streamedResponse = response;
  });

  await page.goto(EVIDENCE_URL);
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  const result = await page.evaluate(async audioUrl => {
    const response = await fetch(audioUrl, { headers: { Range: "bytes=0-1023" } });
    const bytes = await response.arrayBuffer();
    const cachedRequests = await (await caches.open("lp-quest-media-v1")).keys();
    return {
      status: response.status,
      contentRange: response.headers.get("content-range"),
      byteLength: bytes.byteLength,
      cachedPaths: cachedRequests.map(request => new URL(request.url).pathname)
    };
  }, GUIDED_READING_AUDIO_URL);

  // Vite preview may answer the direct request with the complete file (200),
  // while production/Vercel honours it as a byte range (206). Both are valid
  // media responses; the regression is a worker-generated network failure.
  expect([200, 206]).toContain(result.status);
  expect(result.byteLength).toBeGreaterThan(0);
  if (result.status === 206) {
    expect(result.contentRange).toMatch(/^bytes 0-1023\//);
  }
  expect(result.cachedPaths).not.toContain(GUIDED_READING_AUDIO_URL);
  expect(streamedResponse).not.toBeNull();
  expect(streamedResponse.fromServiceWorker()).toBe(true);
});

test("the production shell cold-starts the saved chapter, accessible task, Den, and map offline", async ({ page, context }) => {
  await page.goto(QUEST_URL);
  await expect(page.locator(".qp-root[data-ready='true']")).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  await expect.poll(async () => {
    const history = await offlineHistory(page);
    return history.findLast(item => item.type === "quest-warm-complete") || null;
  }).toMatchObject({
    chapterId: "star-reach",
    failed: 0
  });

  const warmResult = (await offlineHistory(page)).findLast(item => item.type === "quest-warm-complete");
  expect(warmResult.requested).toBeGreaterThan(20);
  expect(warmResult.completed).toBe(warmResult.requested);
  const interruptedCheckpoint = await savedCheckpoint(page);
  expect(interruptedCheckpoint?.activeId).toBeTruthy();

  const cacheEvidence = await page.evaluate(async () => {
    const names = await caches.keys();
    const shell = names.find(name => name.startsWith("lp-shell-"));
    const shellEntries = shell ? await (await caches.open(shell)).keys() : [];
    const mediaEntries = await (await caches.open("lp-quest-media-v1")).keys();
    return {
      shellCount: names.filter(name => name.startsWith("lp-shell-")).length,
      shellEntries: shellEntries.map(request => new URL(request.url).pathname),
      mediaEntries: mediaEntries.map(request => new URL(request.url).pathname)
    };
  });
  expect(cacheEvidence.shellCount).toBe(1);
  expect(cacheEvidence.shellEntries).toContain("/preview/quest.html");
  expect(cacheEvidence.shellEntries.some(path => path.includes("QuestRoot"))).toBe(true);
  expect(cacheEvidence.shellEntries.some(path => path.includes("QuestPixelWorld"))).toBe(true);
  expect(cacheEvidence.mediaEntries.length).toBeGreaterThanOrEqual(warmResult.completed);
  expect(cacheEvidence.mediaEntries).toEqual(expect.arrayContaining(QUEST_PIXEL_SFX_URLS));

  await context.setOffline(true);
  await page.close();

  const pixelPage = await context.newPage();
  const sameOriginFailures = [];
  pixelPage.on("requestfailed", request => {
    if (request.url().startsWith("http://127.0.0.1:5191")) sameOriginFailures.push(request.url());
  });
  const pixelNavigation = await pixelPage.goto(`${QUEST_URL}&resume=1`);
  expect(pixelNavigation?.fromServiceWorker()).toBe(true);
  await expect(pixelPage.locator(".qp-root[data-ready='true']")).toBeVisible({ timeout: 20_000 });
  expect(await savedCheckpoint(pixelPage)).toEqual(interruptedCheckpoint);
  await expect.poll(async () => (await offlineHistory(pixelPage)).some(item => item.type === "offline-start")).toBe(true);
  expect(sameOriginFailures).toEqual([]);

  await pixelPage.close();

  const accessiblePage = await context.newPage();
  const accessibleNavigation = await accessiblePage.goto(
    `${QUEST_URL.replace("display=pixel", "display=2d")}&resume=1`
  );
  expect(accessibleNavigation?.fromServiceWorker()).toBe(true);
  await expect(accessiblePage.locator(".q2d-root")).toBeVisible();
  await expect(accessiblePage.getByRole("group", { name: /Find/ })).toBeVisible();
  expect(await savedCheckpoint(accessiblePage)).toEqual(interruptedCheckpoint);
  await accessiblePage.close();

  const legacyDenPage = await context.newPage();
  const legacyDenNavigation = await legacyDenPage.goto("/preview/quest.html?view=den&resume=1");
  expect(legacyDenNavigation?.fromServiceWorker()).toBe(true);
  await expect(legacyDenPage.locator(".q-map-v2 h1")).toBeVisible();
  await legacyDenPage.close();

  const mapPage = await context.newPage();
  const mapNavigation = await mapPage.goto("/preview/quest.html?view=map&stop=s36&done=35&resume=1");
  expect(mapNavigation?.fromServiceWorker()).toBe(true);
  await expect(mapPage.getByRole("heading", { name: "Star Reach" })).toBeVisible();
  await expect(mapPage.getByRole("button", { name: /Comet Stair/ })).toBeEnabled();

  await context.setOffline(false);
  await mapPage.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect.poll(() => mapPage.evaluate(() => navigator.onLine)).toBe(true);
});

test("the field console installs its own shell and cold-starts offline", async ({ page, context }) => {
  await page.goto(EVIDENCE_URL);
  await expect(page.getByRole("heading", { name: "First-time child play" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  const cached = await page.evaluate(async () => {
    const shellName = (await caches.keys()).find(name => name.startsWith("lp-shell-"));
    if (!shellName) return [];
    return (await (await caches.open(shellName)).keys()).map(request => new URL(request.url).pathname);
  });
  expect(cached).toContain(EVIDENCE_URL);
  expect(cached.some(path => path.includes("questEvidence"))).toBe(true);

  await context.setOffline(true);
  await page.close();
  const offlinePage = await context.newPage();
  const sameOriginFailures = [];
  offlinePage.on("requestfailed", request => {
    if (request.url().startsWith("http://127.0.0.1:5191")) sameOriginFailures.push(request.url());
  });
  const navigation = await offlinePage.goto(EVIDENCE_URL);
  expect(navigation?.fromServiceWorker()).toBe(true);
  await expect(offlinePage.getByRole("heading", { name: "First-time child play" })).toBeVisible();
  await expect.poll(() => offlinePage.evaluate(() => window.__questEvidenceReady === true)).toBe(true);
  expect(sameOriginFailures).toEqual([]);
  await context.setOffline(false);
});
