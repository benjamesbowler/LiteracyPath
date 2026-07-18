import { expect, test } from "@playwright/test";

const QUEST_URL = "/preview/quest.html?view=world&stop=s36&done=35&display=pixel&active=0&adapt=0";
const STORAGE_KEY = "lp-quest:preview";

async function checkpoint(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || "null")?.checkpoint || null, STORAGE_KEY);
}

async function offlineHistory(page) {
  return page.evaluate(() => JSON.parse(sessionStorage.getItem("lp-offline-shell-history-v1") || "[]"));
}

async function runtimeEvidence(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || "null")?.telemetry?.current?.runtime || {}, STORAGE_KEY);
}

test("an installed update waits for active play, activates cleanly, and preserves offline resume", async ({ page, context, request }) => {
  const release = await request.get("/__quest_update/state").then(response => response.json());
  expect(release.buildA).not.toBe(release.buildB);
  expect(release.active).toBe("a");

  await page.goto(QUEST_URL);
  await expect(page.locator(".qp-root[data-ready='true']")).toBeVisible({ timeout: 25_000 });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await expect.poll(async () => (await offlineHistory(page)).some(item =>
    item.type === "shell-ready" && item.buildId === release.buildA)).toBe(true);

  const originalCheckpoint = await checkpoint(page);
  expect(originalCheckpoint?.activeId).toBeTruthy();
  await page.evaluate(() => {
    window.__questControllerChanges = 0;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.__questControllerChanges += 1;
    });
  });

  await request.post("/__quest_update/activate-b");
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    await registration.update();
  });

  await expect.poll(() => page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration.waiting?.state || "";
  })).toBe("installed");
  await expect.poll(async () => (await offlineHistory(page)).some(item =>
    item.type === "update-ready" && item.buildId === release.buildB)).toBe(true);

  expect(await page.evaluate(() => window.__questControllerChanges)).toBe(0);
  await expect(page.locator(".qp-root[data-ready='true']")).toBeVisible();
  expect(await checkpoint(page)).toEqual(originalCheckpoint);
  await expect.poll(async () => (await runtimeEvidence(page)).offlineUpdates).toBe(1);
  expect((await runtimeEvidence(page)).offlineUpdatesApplied || 0).toBe(0);

  const waitingCaches = await page.evaluate(() => caches.keys());
  expect(waitingCaches.filter(name => name.startsWith("lp-shell-"))).toHaveLength(2);
  expect(waitingCaches.filter(name => name === "lp-quest-media-v1")).toHaveLength(1);
  const checkpointBeforeActivation = await checkpoint(page);
  const warmMediaCount = await page.evaluate(async () => (await (await caches.open("lp-quest-media-v1")).keys()).length);
  expect(warmMediaCount).toBeGreaterThan(20);

  await page.close();
  await new Promise(resolve => setTimeout(resolve, 1200));

  const updatedPage = await context.newPage();
  await updatedPage.goto(`${QUEST_URL}&resume=1`);
  await expect(updatedPage.locator(".qp-root[data-ready='true']")).toBeVisible({ timeout: 25_000 });
  await expect.poll(() => updatedPage.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await expect.poll(async () => (await offlineHistory(updatedPage)).some(item =>
    item.type === "update-applied"
      && item.buildId === release.buildB
      && item.previousBuildId === release.buildA)).toBe(true);

  expect(await checkpoint(updatedPage)).toEqual(checkpointBeforeActivation);
  await expect.poll(async () => (await runtimeEvidence(updatedPage)).offlineUpdatesApplied).toBe(1);
  const appliedEvidence = await runtimeEvidence(updatedPage);
  expect(appliedEvidence.offlineUpdates).toBe(1);
  expect(appliedEvidence.lastOfflineBuildId).toBe(release.buildB);

  const activeCaches = await updatedPage.evaluate(() => caches.keys());
  expect(activeCaches.filter(name => name.startsWith("lp-shell-"))).toHaveLength(1);
  expect(activeCaches).toContain(`lp-shell-${release.buildB}`);
  expect(activeCaches).not.toContain(`lp-shell-${release.buildA}`);
  const retainedMediaCount = await updatedPage.evaluate(async () => (await (await caches.open("lp-quest-media-v1")).keys()).length);
  expect(retainedMediaCount).toBeGreaterThanOrEqual(warmMediaCount);

  const updatedCheckpoint = await checkpoint(updatedPage);
  await context.setOffline(true);
  await updatedPage.close();

  const coldPage = await context.newPage();
  const sameOriginFailures = [];
  coldPage.on("requestfailed", failed => {
    if (failed.url().startsWith("http://127.0.0.1:5192")) sameOriginFailures.push(failed.url());
  });
  const navigation = await coldPage.goto(`${QUEST_URL}&resume=1`);
  expect(navigation?.fromServiceWorker()).toBe(true);
  await expect(coldPage.locator(".qp-root[data-ready='true']")).toBeVisible({ timeout: 25_000 });
  expect(await checkpoint(coldPage)).toEqual(updatedCheckpoint);
  await expect.poll(async () => (await offlineHistory(coldPage)).some(item =>
    item.type === "offline-start" && item.buildId === release.buildB)).toBe(true);
  expect(sameOriginFailures).toEqual([]);
  await context.setOffline(false);
});
