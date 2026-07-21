import { expect, test } from "@playwright/test";
import { QUEST_PIXEL_SFX_URLS } from "../../src/utils/questActionAudio.js";

const QUEST_URL = "/preview/quest.html?view=world&stop=s36&done=35&display=pixel&active=0&adapt=0";
const EVIDENCE_URL = "/preview/quest-evidence.html";
const STORAGE_KEY = "lp-quest:preview";

async function savedCheckpoint(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || "null")?.checkpoint || null, STORAGE_KEY);
}

async function offlineHistory(page) {
  return page.evaluate(() => JSON.parse(sessionStorage.getItem("lp-offline-shell-history-v1") || "[]"));
}

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

  const denPage = await context.newPage();
  const denNavigation = await denPage.goto("/preview/quest.html?view=den&resume=1");
  expect(denNavigation?.fromServiceWorker()).toBe(true);
  await expect(denPage.getByRole("heading", { name: "Your Den" })).toBeVisible();
  await denPage.close();

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
