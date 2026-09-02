import { expect, test } from "@playwright/test";

const FIXTURE_URL = "/tests/fixtures/soundSeekersStageLifecycleHarness.html";

async function stageSnapshot(page) {
  return page.evaluate(() => window.__soundSeekersStageSnapshot());
}

async function dispatchCanceledActivation(page, releaseType, pointerId, clickHasPointerId) {
  await page.locator('[data-control-id="listen-card"]').evaluate((control, detail) => {
    control.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      pointerId: detail.pointerId,
      pointerType: "touch",
      isPrimary: true
    }));
    control.dispatchEvent(new PointerEvent(detail.releaseType, {
      bubbles: true,
      cancelable: true,
      pointerId: detail.pointerId,
      pointerType: "touch",
      isPrimary: true
    }));
    const ClickEvent = detail.clickHasPointerId ? PointerEvent : MouseEvent;
    control.dispatchEvent(new ClickEvent("click", {
      bubbles: true,
      cancelable: true,
      ...(detail.clickHasPointerId ? {
        pointerId: detail.pointerId,
        pointerType: "touch",
        isPrimary: true
      } : {}),
      detail: 1
    }));
  }, { releaseType, pointerId, clickHasPointerId });
}

test("@sound-seekers-stage Strict Mode keeps one Phaser child canvas and visibly moves one canonical avatar", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto(FIXTURE_URL);

  const stage = page.locator("[data-sound-seekers-stage]");
  await expect(stage).toHaveAttribute("data-runtime-status", "ready");
  await expect(page.locator("[data-ss-phaser-host] > canvas")).toHaveCount(1);
  const player = page.locator('[data-character-id="player"]');
  await expect(player).toHaveCount(1);
  await expect(player).toBeVisible();
  await expect(player).toHaveAttribute("data-appearance-signature", /player-palette-river/u);
  const before = await stageSnapshot(page);
  expect(before.strictSetups).toBe(2);
  expect(before.strictCleanups).toBe(1);
  expect(before.hostCount).toBe(1);
  expect(before.canvasCount).toBe(1);
  expect(before.liveAvatarCount).toBe(1);
  expect(before.avatarWidth).toBeGreaterThan(56);
  expect(before.avatarHeight).toBeGreaterThan(56);
  expect(before.activeInputListeners).toBe(11);
  expect(before.canvasesAdded).toBe(1);
  expect(before.canvasesRemoved).toBe(0);

  await page.evaluate(() => window.__moveSoundSeekersAvatar(0.82, 0.3));
  await expect.poll(async () => Number(await page.locator("[data-ss-live-avatar]").getAttribute("data-traversal-x")))
    .toBeGreaterThan(0.8);
  const afterMove = await stageSnapshot(page);
  expect(afterMove.avatarX).toBeGreaterThan(before.avatarX + (before.worldWidth * 0.55));
  expect(afterMove.avatarY).toBeLessThan(before.avatarY - (before.worldHeight * 0.08));

  const control = page.locator('[data-control-id="listen-card"]');
  await control.click();
  let effects = await stageSnapshot(page);
  expect(effects.inputs).toHaveLength(1);
  expect(effects.audio).toHaveLength(1);

  await page.evaluate(() => window.__resetSoundSeekersStageEffects());
  await control.focus();
  await page.keyboard.press("Enter");
  effects = await stageSnapshot(page);
  expect(effects.inputs).toHaveLength(1);
  expect(effects.audio).toHaveLength(1);

  for (const [releaseType, pointerId, clickHasPointerId] of [
    ["pointercancel", 31, true],
    ["lostpointercapture", 32, false]
  ]) {
    await page.evaluate(() => window.__resetSoundSeekersStageEffects());
    await dispatchCanceledActivation(page, releaseType, pointerId, clickHasPointerId);
    effects = await stageSnapshot(page);
    expect(effects.inputs, `${releaseType} input effects`).toEqual([]);
    expect(effects.audio, `${releaseType} audio effects`).toEqual([]);
  }

  await page.evaluate(() => window.__unmountSoundSeekersStage());
  await expect(stage).toHaveCount(0);
  const afterUnmount = await stageSnapshot(page);
  expect(afterUnmount.canvasCount).toBe(0);
  expect(afterUnmount.activeInputListeners).toBe(0);
  expect(afterUnmount.strictCleanups).toBe(2);
  expect(afterUnmount.canvasesRemoved).toBe(afterUnmount.canvasesAdded);
  expect(afterUnmount.errors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("@sound-seekers-stage unmount during a late Phaser import creates no canvas, game, or live listener", async ({ page }) => {
  let releasePhaser;
  let reportPhaserRequest;
  const phaserReleased = new Promise(resolve => { releasePhaser = resolve; });
  const phaserRequested = new Promise(resolve => { reportPhaserRequest = resolve; });
  let held = false;
  await page.route("**/*", async route => {
    const url = route.request().url();
    if (!held && /(?:phaserSoundSeekers|\/deps\/phaser(?:\.|-))/iu.test(url)) {
      held = true;
      reportPhaserRequest(url);
      await phaserReleased;
    }
    await route.continue();
  });

  await page.goto(FIXTURE_URL, { waitUntil: "domcontentloaded" });
  const phaserRequestUrl = await Promise.race([
    phaserRequested,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Phaser request was not observed")), 10_000))
  ]);
  const phaserResponse = page.waitForResponse(response => response.url() === phaserRequestUrl);
  const beforeUnmount = await stageSnapshot(page);
  expect(beforeUnmount.runtimeStatus).toBe("loading");
  expect(beforeUnmount.canvasCount).toBe(0);
  expect(beforeUnmount.activeInputListeners).toBeGreaterThan(0);

  await page.evaluate(() => window.__unmountSoundSeekersStage());
  releasePhaser();
  await phaserResponse;
  await page.waitForTimeout(100);
  await expect(page.locator("[data-sound-seekers-stage]")).toHaveCount(0);
  await expect.poll(async () => (await stageSnapshot(page)).activeInputListeners).toBe(0);
  const afterLateResolution = await stageSnapshot(page);
  expect(afterLateResolution.canvasCount).toBe(0);
  expect(afterLateResolution.canvasesAdded).toBe(0);
  expect(afterLateResolution.errors).toEqual([]);
});
