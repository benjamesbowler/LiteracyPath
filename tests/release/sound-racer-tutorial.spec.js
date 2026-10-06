import { expect, test } from "@playwright/test";

import { soundRacerLadder } from "../../src/utils/soundRacerTracks.js";

// Ubuntu CI renders this full Three.js scene through SwiftShader. The first
// interaction can legitimately arrive after Playwright's default 30-second
// test budget even though the HUD is mounted and responsive. Keep the same
// child-visible behavior and allow the software-rendered accessibility checks
// to finish, as the other full-screen WebGL release gates do.
test.describe.configure({ timeout: 90_000 });

test("Sound Racer keeps its current target and replay readable while input is already live", async ({ page }, testInfo) => {
  const difficulty = "medium";
  const level = 3;
  const expectedTarget = soundRacerLadder(difficulty)[level];
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => window.localStorage.removeItem("lp-arcade-onboarded-v1:sound-racer"));
  await page.goto(`/preview/sound-racer-preview.html?difficulty=${difficulty}&level=${level}&sound=1&music=0`);
  const hud = page.locator('.sound-racer-hud');
  await page.waitForFunction(() => {
    const state = document.querySelector('.sound-racer')?.racerInspection;
    return state?.running && !state.assetsLoading && !state.graphicsLoading;
  }, null, { timeout: 45_000 });
  await expect(hud.locator('[data-sr="target"]')).toHaveText(expectedTarget);
  await expect(hud).toHaveAttribute('data-sound-racer-asset', 'ready');
  await expect(page.locator('[data-sr="overlay"]')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Tap to play', exact: true })).toHaveCount(0);
  const replayTarget = page.getByRole("button", { name: `Hear ${expectedTarget.toUpperCase()} sound again` });
  await expect(replayTarget).toBeVisible();
  const replayBounds = await replayTarget.boundingBox();
  expect(replayBounds?.width).toBeGreaterThanOrEqual(56);
  expect(replayBounds?.height).toBeGreaterThanOrEqual(56);
  await replayTarget.click();
  const before = JSON.parse(await hud.getAttribute('data-sound-racer-position'));
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowRight');
  const after = JSON.parse(await hud.getAttribute('data-sound-racer-position'));
  expect(after.lateral).toBeGreaterThan(before.lateral + .4);
  await expect(replayTarget).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('live-target-replay.png') });
  expect(pageErrors).toEqual([]);
});

test("Sound Racer keeps a reachable disabled target replay control when production sound is off", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:sound-racer", "1");
  });
  await page.goto("/preview/sound-racer-preview.html?difficulty=hard&level=0&sound=0&music=0");
  const replayTarget = page.locator('[data-sr="hear-target"]');
  await expect(replayTarget).toBeVisible();
  await expect(replayTarget).toBeDisabled();
  await expect(replayTarget).toHaveAccessibleName(/Sound is off.+Tools/);
  const feedback = page.locator('[data-sr="banner"]');
  await expect(feedback).toHaveAttribute("role", "status");
  await expect(feedback).toHaveAttribute("aria-live", "polite");
  await expect(feedback).toHaveAttribute("aria-atomic", "true");
});

test("Sound Racer uses compact visible steering controls without blocking lane keys", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:sound-racer", "1");
  });
  await page.goto("/preview/sound-racer-preview.html?difficulty=easy&level=0&sound=0&music=0");

  const hud = page.locator(".sound-racer-hud");
  const leftZone = hud.locator('[data-sr="left-zone"]');
  const rightZone = hud.locator('[data-sr="right-zone"]');
  const leftControl = hud.getByRole("button", { name: "Steer left", exact: true });
  const rightControl = hud.getByRole("button", { name: "Steer right", exact: true });

  await expect(leftControl).toBeVisible();
  await expect(rightControl).toBeVisible();
  for (const control of [leftControl, rightControl]) {
    const box = await control.boundingBox();
    expect(box?.width).toBe(68);
    expect(box?.height).toBe(68);
  }
  for (const zone of [leftZone, rightZone]) {
    await expect(zone).toHaveAttribute("aria-hidden", "true");
    await expect(zone).toHaveJSProperty("tabIndex", -1);
  }

  await page.waitForFunction(() => {
    const state = document.querySelector('.sound-racer')?.racerInspection;
    return state?.running && !state.assetsLoading && !state.graphicsLoading;
  }, null, { timeout: 45_000 });
  const before = JSON.parse(await hud.getAttribute('data-sound-racer-position'));
  await rightControl.click();
  await page.waitForTimeout(650);
  const right = JSON.parse(await hud.getAttribute('data-sound-racer-position'));
  expect(right.lateral).toBeGreaterThan(before.lateral + .3);
  await rightControl.focus();
  await expect(rightControl).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(650);
  const left = JSON.parse(await hud.getAttribute('data-sound-racer-position'));
  expect(left.lateral).toBeLessThan(right.lateral - .3);
});
