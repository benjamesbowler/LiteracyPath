import { expect, test } from "@playwright/test";
import { driveLeap } from "./letterLeapNative.js";

test.use({ trace: "off" });

const fixtureSeed = 3;
const fixtureStorageKey = "literacy-guide-learn-games:fullscreen-overlay-preview";
const snapshot = page => page.evaluate(() => document.querySelector(".letter-leap").__letterLeapSnapshot());

async function seedGroundFirstEncounter(page) {
  await page.addInitScript(({ seed, key }) => {
    localStorage.setItem("lp-arcade-onboarded-v1:letter-leap", "1");
    localStorage.setItem(key, JSON.stringify({ games: { "letter-leap": { checkpoints: {
      easy: { level: 0, totalLevels: 10, sessionSeed: seed, chapter: 0 }
    } } } }));
  }, { seed: fixtureSeed, key: fixtureStorageKey });
}

async function assertGroundFirstEncounter(page) {
  await page.waitForFunction(() => {
    const state = document.querySelector(".letter-leap")?.__letterLeapSnapshot?.();
    return state?.running && state.player.onGround && Math.abs(state.player.y + state.player.h / 2 - state.groundY) < 1;
  });
  const state = await snapshot(page);
  expect(state.learning.sessionSeed).toBe(fixtureSeed);
  expect(state.word).toBe("MUD");
  expect([state.stageIndex, state.wordIndex, state.letterIndex]).toEqual([0, 0, 0]);
  expect(state.learning.firstResponses).toEqual([]);
  const pair = state.bubbles.filter(choice => choice.decisionWord === 0 && choice.decisionOrder === 0);
  expect(pair).toHaveLength(2);
  const target = pair.find(choice => choice.ch === state.word[0]);
  expect(target).toMatchObject({ ch: "M", word: 0, order: 0, taken: false });
  expect(target.x).toBe(320);
  expect(target.y).toBe(state.groundY - 46);
  expect(pair.find(choice => choice !== target).x).toBe(target.x + 170);
  expect(state.pits.filter(([left, right]) => right > state.player.x && left < target.x)).toEqual([]);
  expect(state.blocks.filter(block => !block.broken && block.x + block.w > state.player.x && block.x < target.x)).toEqual([]);
  return state;
}

async function retainNativeFixture(page, testInfo, label) {
  const packet = await page.evaluate(key => ({
    state: document.querySelector(".letter-leap")?.__letterLeapSnapshot?.() || null,
    rawSave: localStorage.getItem(key), viewport: { width: innerWidth, height: innerHeight }
  }), fixtureStorageKey);
  await testInfo.attach(`${label}-native-state`, { body: JSON.stringify({ state: packet.state, viewport: packet.viewport }, null, 2), contentType: "application/json" });
  if (packet.rawSave) await testInfo.attach(`${label}-exact-local-save`, { body: packet.rawSave, contentType: "application/json" });
  await page.screenshot({ path: testInfo.outputPath(`${label}-actual-frame.png`) });
}

async function pressPointerControl(page, control) {
  const box = await control.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box.x + (box.width / 2), box.y + (box.height / 2));
  await page.mouse.down();
  await page.waitForTimeout(80);
  await page.mouse.up();
}

test("Letter Leap starts immediately and keeps optional guidance out of the play lane", async ({ page }) => {
  await page.goto("/preview/game-overlay.html?game=letter-leap&sound=0&music=0");
  await expect(page.getByRole("dialog", { name: "Letter Leap instructions", exact: true })).toHaveCount(0);
  const jump = page.locator('[data-ll="jump"]');
  await expect(jump).toBeVisible();
  expect(await jump.evaluate(element => element.closest("[inert]") !== null)).toBe(false);
  await page.waitForFunction(() => document.querySelector('.letter-leap')?.__letterLeapSnapshot?.().running);
  await page.getByRole('button', { name: 'Open game controls', exact: true }).click();
  await page.getByRole('button', { name: 'Open Letter Leap mission guide', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Keep playing', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Keep playing', exact: true }).click();
  expect(await jump.evaluate(element => element.closest("[inert]") !== null)).toBe(false);
});

test("Letter Leap production-word replay is reachable, sized for children, and follows sound state", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:letter-leap", "1");
  });
  await page.goto("/preview/game-overlay.html?game=letter-leap&sound=1");

  const hear = page.getByRole("button", { name: "Hear the word", exact: true });
  await expect(hear).toBeVisible();
  await expect(hear).toBeEnabled();
  const box = await hear.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(56);
  expect(box?.height).toBeGreaterThanOrEqual(56);
  await hear.click();

  await page.getByRole('button', { name: 'Open game controls', exact: true }).click();
  await page.getByRole("button", { name: "Turn spoken audio and game sounds off", exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(hear).toBeHidden();
  await page.getByRole('button', { name: 'Open game controls', exact: true }).click();
  await page.getByRole("button", { name: "Turn spoken audio and game sounds on", exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(hear).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("Letter Leap fullscreen controls prevent selection and receive held pointer input", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:letter-leap", "1");
  });
  await page.goto("/preview/game-overlay.html?game=letter-leap&sound=0");

  const player = page.getByRole("dialog", { name: "Letter Leap", exact: true });
  await expect(player).toBeVisible();
  expect(await player.evaluate(element => element.closest(".student-mode-app"))).toBeNull();

  const controls = [
    page.getByRole("button", { name: "Move left", exact: true }),
    page.getByRole("button", { name: "Move right", exact: true }),
    page.getByRole("button", { name: "Leap right", exact: true })
  ];

  for (const control of controls) {
    await expect(control).toBeVisible();
    const inputStyles = await control.evaluate(element => {
      const styles = getComputedStyle(element);
      return {
        touchAction: styles.touchAction,
        userSelect: styles.userSelect || styles.getPropertyValue("-webkit-user-select")
      };
    });
    expect(inputStyles).toEqual({
      touchAction: "none",
      userSelect: "none"
    });
  }

  await page.evaluate(() => {
    window.__letterLeapPointerEvents = [];
    document.body.addEventListener("pointerdown", event => {
      const control = event.target.closest?.('[data-ll="left"], [data-ll="right"], [data-ll="jump"]');
      if (!control) return;
      window.__letterLeapPointerEvents.push({
        control: control.getAttribute("data-ll"),
        defaultPrevented: event.defaultPrevented
      });
    });
  });

  for (const control of controls) await pressPointerControl(page, control);

  await expect.poll(() => page.evaluate(() => window.__letterLeapPointerEvents)).toEqual([
    { control: "left", defaultPrevented: true },
    { control: "right", defaultPrevented: true },
    { control: "jump", defaultPrevented: true }
  ]);
});

test("Letter Leap keeps the active ordered letter grounded after a fullscreen height change", async ({ page }, testInfo) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await seedGroundFirstEncounter(page);
  await page.setViewportSize({ width: 1024, height: 640 });
  await page.goto("/preview/game-overlay.html?game=letter-leap&sound=0&music=0");
  // The real zero-stage checkpoint now opens the host resume gate before
  // lazy loading the engine. Choose Continue to preserve this fixture.
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  const completedSlots = page.locator('[data-ll="word"] [aria-label^="Completed letter"]');
  await expect(page.getByRole("button", { name: "Leap right", exact: true })).toBeVisible();
  await expect(page.locator(".letter-leap canvas")).toBeVisible();
  await expect(completedSlots).toHaveCount(0);
  const before = await assertGroundFirstEncounter(page);
  await retainNativeFixture(page, testInfo, "height-before");

  // Reproduces the reported floating-letter failure: the shell grows after the
  // level has already stored its world coordinates.
  try {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await expect.poll(async () => (await snapshot(page)).groundY).toBeGreaterThan(before.groundY);
    const resized = await assertGroundFirstEncounter(page);
    const delta = resized.groundY - before.groundY;
    expect(resized.bubbles.map(({ x, y, ch }) => ({ x, y, ch }))).toEqual(
      before.bubbles.map(({ x, y, ch }) => ({ x, y: y + delta, ch }))
    );
    expect(resized.player.y - before.player.y).toBeCloseTo(delta, 5);
    await page.locator(".lg-game-player-main").focus();
    await page.keyboard.down("ArrowRight");
    await expect.poll(() => completedSlots.count()).toBeGreaterThanOrEqual(1);
    await page.keyboard.up("ArrowRight");
    const after = await snapshot(page);
    expect(after.learning.firstResponses).toHaveLength(1);
    expect(after.learning.firstResponses[0]).toMatchObject({ selected: "M", expected: "M", correct: true, slot: 0 });
    expect(after.wrongHits).toBe(0);
    await expect.poll(() => completedSlots.count()).toBeGreaterThanOrEqual(1);
    expect(pageErrors).toEqual([]);
  } finally {
    await page.keyboard.up("ArrowRight");
    await retainNativeFixture(page, testInfo, "height-after");
  }
});

test("Letter Leap keeps its target and 56px controls inside 568x320 phone landscape", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:letter-leap", "1");
  });
  await page.setViewportSize({ width: 568, height: 320 });
  await page.goto("/preview/game-overlay.html?game=letter-leap&sound=0&music=0");

  const mount = page.locator(".letter-leap");
  const mountBox = await mount.boundingBox();
  expect(mountBox?.height).toBeGreaterThanOrEqual(240);
  expect(await mount.evaluate(element => element.scrollHeight)).toBe(await mount.evaluate(element => element.clientHeight));

  const visibleControls = [
    page.getByRole("button", { name: "Move left", exact: true }),
    page.getByRole("button", { name: "Move right", exact: true }),
    page.getByRole("button", { name: "Leap right", exact: true }),
    page.locator('[data-ll="target-panel"]')
  ];
  for (const control of visibleControls) {
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(321);
  }

  for (const control of visibleControls.slice(0, 3)) {
    const box = await control.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(56);
    expect(box.height).toBeGreaterThanOrEqual(56);
  }
});

test("Letter Leap completes a word through pointer taps and keyboard leaps", async ({ page }, testInfo) => {
  test.setTimeout(90000);
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await seedGroundFirstEncounter(page);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/preview/game-overlay.html?game=letter-leap&sound=0&music=0");
  // The real zero-stage checkpoint now opens the host resume gate before
  // lazy loading the engine. Choose Continue to preserve this fixture.
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  const right = page.getByRole("button", { name: "Move right", exact: true });
  const completedSlots = page.locator('[data-ll="word"] [aria-label^="Completed letter"]');
  await expect(page.getByRole("button", { name: "Leap right", exact: true })).toBeVisible();
  const before = await assertGroundFirstEncounter(page);
  await retainNativeFixture(page, testInfo, "tap-before");

  // A click used to release before an animation frame and produce no visible
  // movement. Pointer taps plus native Enter activation now reach the first
  // grounded choice without making a focused control swallow the keyboard.
  try {
    for (let tap = 0; tap < 6 && await completedSlots.count() === 0; tap += 1) {
      const position = (await snapshot(page)).player.x;
      if (tap < 2) await right.click();
      else {
        await right.focus();
        await page.keyboard.press("Enter");
      }
      await page.waitForTimeout(220);
      expect((await snapshot(page)).player.x).toBeGreaterThan(position);
    }
    await expect(completedSlots).toHaveCount(1);
    const initial = await snapshot(page);
    expect(initial.learning.firstResponses).toHaveLength(1);
    expect(initial.learning.firstResponses[0]).toMatchObject({ selected: "M", expected: "M", correct: true, slot: 0 });
    expect(initial.wrongHits).toBe(before.wrongHits);
    await driveLeap(page, { timeout: 45000, until: state => state.wordsDone >= 1 });
    expect((await snapshot(page)).wordsDone).toBe(1);
    await expect(page.locator('[data-ll="lab"]')).toContainText(initial.word+' built');
    await expect(page.locator('[data-ll="progress"]')).toHaveAttribute('aria-label', /1 of 50 words completed/);
    await expect.poll(async () => (await snapshot(page)).wordIndex, { timeout: 10000 }).toBe(1);
    await expect(page.locator('[data-ll="lab"]')).toContainText("word 2 of 5");
    expect(pageErrors).toEqual([]);
  } finally {
    await page.keyboard.up("ArrowRight");
    await page.keyboard.up("ArrowUp");
    await retainNativeFixture(page, testInfo, "tap-after");
  }
});

test.describe("Letter Leap Retina rendering", () => {
  test.use({ viewport: { width: 1467, height: 953 }, deviceScaleFactor: 2 });

  test("keeps the live canvas responsive without a multi-million-pixel backing store", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("lp-arcade-onboarded-v1:letter-leap", "1");
    });
    await page.goto("/preview/game-overlay.html?game=letter-leap&sound=0&music=0");
    await expect(page.getByRole("button", { name: "Leap right", exact: true })).toBeVisible();

    const dimensions = await page.locator(".letter-leap").evaluate(element => {
      const canvas = element.querySelector("canvas");
      return {
        clientWidth: element.clientWidth,
        clientHeight: element.clientHeight,
        backingWidth: canvas?.width || 0,
        backingHeight: canvas?.height || 0
      };
    });
    expect(dimensions.backingWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
    expect(dimensions.backingHeight).toBeLessThanOrEqual(dimensions.clientHeight + 1);

    const frameCount = await page.evaluate(() => new Promise(resolve => {
      let frames = 0;
      const startedAt = performance.now();
      const sample = () => {
        frames += 1;
        if (performance.now() - startedAt >= 2000) resolve(frames);
        else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    }));
    expect(frameCount).toBeGreaterThanOrEqual(20);
  });
});
