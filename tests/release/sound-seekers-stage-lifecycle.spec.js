import { expect, test } from "@playwright/test";

const FIXTURE_URL = "/tests/fixtures/soundSeekersStageLifecycleHarness.html";

async function stageSnapshot(page) {
  return page.evaluate(() => window.__soundSeekersStageSnapshot());
}

async function dispatchCanceledActivation(control, releaseType, pointerId, clickHasPointerId) {
  await control.evaluate((target, detail) => {
    target.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      pointerId: detail.pointerId,
      pointerType: "touch",
      isPrimary: true
    }));
    target.dispatchEvent(new PointerEvent(detail.releaseType, {
      bubbles: true,
      cancelable: true,
      pointerId: detail.pointerId,
      pointerType: "touch",
      isPrimary: true
    }));
    const ClickEvent = detail.clickHasPointerId ? PointerEvent : MouseEvent;
    target.dispatchEvent(new ClickEvent("click", {
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

async function dispatchSwitch(stage, action) {
  await stage.evaluate((target, switchAction) => {
    target.dispatchEvent(new CustomEvent("soundseekers:switch", {
      bubbles: true,
      detail: { action: switchAction }
    }));
  }, action);
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
  const control = page.locator('[data-control-id="listen-card"]');
  await expect(control).toBeDisabled();

  await page.evaluate(() => window.__moveSoundSeekersAvatar(0.82, 0.3));
  await expect.poll(async () => Number(await page.locator("[data-ss-live-avatar]").getAttribute("data-traversal-x")))
    .toBeGreaterThan(0.8);
  const afterMove = await stageSnapshot(page);
  expect(afterMove.avatarX).toBeGreaterThan(before.avatarX + (before.worldWidth * 0.55));
  expect(afterMove.avatarY).toBeLessThan(before.avatarY - (before.worldHeight * 0.08));
  expect(afterMove.nearestInteractionId).toBe("listen-card");
  expect(afterMove.inputs).toEqual([{ type: "arrive", targetId: "listen-card" }]);
  await expect(control).toBeEnabled();

  await page.waitForTimeout(150);
  expect((await stageSnapshot(page)).inputs).toHaveLength(1);
  await page.evaluate(() => window.__resetSoundSeekersStageEffects());
  await page.evaluate(() => window.__moveSoundSeekersAvatar(0.12, 0.58));
  await expect.poll(async () => (await stageSnapshot(page)).nearestInteractionId).toBe(null);
  await page.evaluate(() => window.__moveSoundSeekersAvatar(0.82, 0.3));
  await expect.poll(async () => (await stageSnapshot(page)).inputs.length).toBe(1);
  expect((await stageSnapshot(page)).inputs).toEqual([{ type: "arrive", targetId: "listen-card" }]);

  await page.evaluate(() => window.__resetSoundSeekersStageEffects());
  await page.evaluate(() => window.__resetSoundSeekersRoute());
  await expect.poll(async () => (await stageSnapshot(page)).inputs.length).toBe(1);
  expect((await stageSnapshot(page)).inputs).toEqual([{ type: "arrive", targetId: "listen-card" }]);

  await page.evaluate(() => window.__resetSoundSeekersStageEffects());
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
    await dispatchCanceledActivation(control, releaseType, pointerId, clickHasPointerId);
    effects = await stageSnapshot(page);
    expect(effects.inputs, `${releaseType} input effects`).toEqual([]);
    expect(effects.audio, `${releaseType} audio effects`).toEqual([]);
  }

  await page.evaluate(() => window.__resetSoundSeekersStageEffects());
  await page.evaluate(() => window.__showSoundSeekersReducerScene("s1"));
  await expect.poll(async () => (await stageSnapshot(page)).reducerStopId).toBe("s1");
  await expect(page.locator("[data-sound-seekers-scene]")).toBeVisible();
  let reducer = await stageSnapshot(page);
  expect(reducer.activityPowerId).toBe("story_power");
  expect(reducer.sceneOptionsEnabled).toBe(false);
  expect(reducer.connectedOptionCount).toBeGreaterThan(1);
  expect(reducer.enabledConnectedOptionCount).toBe(0);
  expect(reducer.modelInputTypes).toEqual(["read_text"]);
  const ordinaryOption = page.locator("[data-option-token]").first();
  await expect(ordinaryOption).toBeDisabled();

  const ordinaryStartRevision = reducer.missionRevision;
  await dispatchSwitch(stage, "scan");
  await dispatchSwitch(stage, "activate");
  await expect.poll(async () => (await stageSnapshot(page)).sceneOptionsEnabled).toBe(true);
  reducer = await stageSnapshot(page);
  expect(reducer.inputs).toEqual([{ type: "read_text" }]);
  expect(reducer.reducerMoves).toEqual([{
    type: "read_text",
    beforeRevision: ordinaryStartRevision,
    afterRevision: ordinaryStartRevision + 1,
    changed: true,
    projected: true,
    inputFrozen: true,
    inputKeys: ["type"],
    transitionOutcome: null
  }]);
  expect(reducer.enabledConnectedOptionCount).toBe(reducer.connectedOptionCount);

  const assessedRevision = reducer.missionRevision;
  for (const [releaseType, pointerId, clickHasPointerId] of [
    ["pointercancel", 51, true],
    ["lostpointercapture", 52, false]
  ]) {
    await page.evaluate(() => window.__resetSoundSeekersStageEffects());
    await dispatchCanceledActivation(ordinaryOption, releaseType, pointerId, clickHasPointerId);
    effects = await stageSnapshot(page);
    expect(effects.connectedOptionCount).toBeGreaterThan(0);
    expect(effects.choices, `${releaseType} onChoose effects`).toEqual([]);
    expect(effects.inputs, `${releaseType} connected input effects`).toEqual([]);
    expect(effects.audio, `${releaseType} connected audio effects`).toEqual([]);
    expect(effects.reducerMoves, `${releaseType} reducer effects`).toEqual([]);
    expect(effects.missionRevision, `${releaseType} reducer revision`).toBe(assessedRevision);
  }
  await page.evaluate(() => window.__resetSoundSeekersStageEffects());
  await ordinaryOption.click();
  await expect.poll(async () => (await stageSnapshot(page)).reducerMoves.length).toBe(1);
  effects = await stageSnapshot(page);
  expect(effects.choices).toHaveLength(1);
  expect(effects.inputs).toHaveLength(1);
  expect(effects.inputs[0]).toEqual(effects.choices[0]);
  expect(Object.keys(effects.inputs[0]).sort()).toEqual(["choiceId", "token", "type"]);
  expect(effects.inputs[0].type).not.toBe("choose");
  expect(effects.reducerMoves[0]).toMatchObject({
    type: effects.inputs[0].type,
    changed: true,
    projected: true,
    inputFrozen: true,
    inputKeys: ["choiceId", "token", "type"]
  });
  expect(["advance", "retry", "model_required"]).toContain(effects.reducerMoves[0].transitionOutcome);
  expect(effects.audio).toEqual([]);

  await page.evaluate(() => window.__resetSoundSeekersStageEffects());
  await page.evaluate(() => window.__showSoundSeekersReducerScene("s5"));
  await expect.poll(async () => (await stageSnapshot(page)).reducerStopId).toBe("s5");
  reducer = await stageSnapshot(page);
  expect(reducer.activityStatus).toBe("narrative_choice_pending");
  expect(reducer.sceneOptionsEnabled).toBe(true);
  expect(reducer.sceneChoiceControlCount).toBe(2);
  expect(reducer.modelControlCount).toBe(0);
  const bossNarrativeOption = page.locator("[data-option-token]").first();
  await expect(bossNarrativeOption).toBeEnabled();
  const bossNarrativeRevision = reducer.missionRevision;
  for (const [releaseType, pointerId, clickHasPointerId] of [
    ["pointercancel", 71, true],
    ["lostpointercapture", 72, false]
  ]) {
    await page.evaluate(() => window.__resetSoundSeekersStageEffects());
    await dispatchCanceledActivation(bossNarrativeOption, releaseType, pointerId, clickHasPointerId);
    effects = await stageSnapshot(page);
    expect(effects.choices, `${releaseType} boss onChoose effects`).toEqual([]);
    expect(effects.inputs, `${releaseType} boss input effects`).toEqual([]);
    expect(effects.audio, `${releaseType} boss audio effects`).toEqual([]);
    expect(effects.reducerMoves, `${releaseType} boss reducer effects`).toEqual([]);
    expect(effects.missionRevision).toBe(bossNarrativeRevision);
  }

  await page.evaluate(() => window.__resetSoundSeekersStageEffects());
  await bossNarrativeOption.click();
  await expect.poll(async () => (await stageSnapshot(page)).modelInputTypes[0])
    .toBe("activate_segment");
  effects = await stageSnapshot(page);
  expect(effects.inputs).toHaveLength(1);
  expect(Object.keys(effects.inputs[0]).sort()).toEqual(["choiceId", "type"]);
  expect(effects.inputs[0].type).toBe("choose_narrative_route");
  expect(effects.reducerMoves[0]).toMatchObject({ changed: true, projected: true, inputFrozen: true });
  expect(effects.sceneOptionsEnabled).toBe(false);
  expect(effects.sceneChoiceControlCount).toBe(0);
  expect(effects.connectedOptionCount).toBe(2);
  expect(effects.enabledConnectedOptionCount).toBe(0);

  await page.evaluate(() => window.__resetSoundSeekersStageEffects());
  for (let guard = 0; guard < 8; guard += 1) {
    reducer = await stageSnapshot(page);
    if (!reducer.modelInputTypes.includes("activate_segment")) break;
    const beforeRevision = reducer.missionRevision;
    await page.locator('[data-ss-model-input-type="activate_segment"]').first().click();
    await expect.poll(async () => (await stageSnapshot(page)).missionRevision)
      .toBeGreaterThan(beforeRevision);
  }
  reducer = await stageSnapshot(page);
  expect(reducer.modelInputTypes).toEqual(["sweep_blend"]);
  const beforeSweepRevision = reducer.missionRevision;
  await page.locator('[data-ss-model-input-type="sweep_blend"]').click();
  await expect.poll(async () => (await stageSnapshot(page)).missionRevision)
    .toBeGreaterThan(beforeSweepRevision);
  reducer = await stageSnapshot(page);
  expect(reducer.modelControlCount).toBe(3);
  expect(new Set(reducer.modelInputTypes).size).toBe(1);
  const assessedType = reducer.modelInputTypes[0];
  expect(["activate_segment", "sweep_blend"]).not.toContain(assessedType);
  const bossAssessedChoice = page.locator(`[data-ss-model-input-type="${assessedType}"]`).first();
  const bossAssessedRevision = reducer.missionRevision;
  for (const [releaseType, pointerId, clickHasPointerId] of [
    ["pointercancel", 81, true],
    ["lostpointercapture", 82, false]
  ]) {
    await page.evaluate(() => window.__resetSoundSeekersStageEffects());
    await dispatchCanceledActivation(bossAssessedChoice, releaseType, pointerId, clickHasPointerId);
    effects = await stageSnapshot(page);
    expect(effects.inputs, `${releaseType} assessed input effects`).toEqual([]);
    expect(effects.audio, `${releaseType} assessed audio effects`).toEqual([]);
    expect(effects.reducerMoves, `${releaseType} assessed reducer effects`).toEqual([]);
    expect(effects.missionRevision).toBe(bossAssessedRevision);
  }

  await page.evaluate(() => window.__resetSoundSeekersStageEffects());
  await bossAssessedChoice.focus();
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await stageSnapshot(page)).reducerMoves.length).toBe(1);
  effects = await stageSnapshot(page);
  expect(effects.inputs).toHaveLength(1);
  expect(Object.keys(effects.inputs[0]).sort()).toEqual(["choiceId", "token", "type"]);
  expect(effects.inputs[0].type).toBe(assessedType);
  expect(effects.reducerMoves[0]).toMatchObject({
    changed: true,
    projected: true,
    inputFrozen: true,
    inputKeys: ["choiceId", "token", "type"]
  });
  expect(["advance", "retry", "model_required"]).toContain(effects.reducerMoves[0].transitionOutcome);
  expect(effects.audio).toEqual([]);

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
