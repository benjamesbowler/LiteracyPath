import { expect, test } from "@playwright/test";

import { soundRacerLadder } from "../../src/utils/soundRacerTracks.js";
import { wordStartsWithTargetSound } from "../../src/utils/rocketRunRounds.js";

test("A2.9 Sound Racer renders the current target example apart from steering help", async ({ page }, testInfo) => {
  const difficulty = "medium";
  const level = 3;
  const expectedTarget = soundRacerLadder(difficulty)[level];
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.localStorage.removeItem("lp-arcade-onboarded-v1:sound-racer");
  });
  await page.goto(`/preview/sound-racer-preview.html?difficulty=${difficulty}&level=${level}&sound=1&music=0`);

  const overlay = page.locator('[data-sr="overlay"]');
  const phonics = overlay.getByRole("region", { name: "Sound example" });
  const motor = overlay.getByRole("region", { name: "How to steer" });
  await expect(phonics).toBeVisible();
  await expect(motor).toBeVisible();

  const target = await phonics.locator('[data-sr="tutorial-target"]').innerText();
  const exampleWord = await phonics.locator('[data-sr="tutorial-word"]').innerText();
  expect(target.toLowerCase()).toBe(expectedTarget);
  expect(wordStartsWithTargetSound(exampleWord, expectedTarget)).toBe(true);
  const hearExample = phonics.getByRole("button", {
    name: `Hear ${expectedTarget.toUpperCase()} in ${exampleWord}`
  });
  await expect(hearExample).toBeVisible();
  await hearExample.click();
  await expect(phonics).toBeVisible();
  await expect(motor).toContainText("Steer left or right");
  await expect(phonics).not.toContainText("Use ← →");

  const overlayBox = await overlay.boundingBox();
  const viewport = page.viewportSize();
  expect(overlayBox?.width).toBeLessThanOrEqual(viewport?.width || Number.POSITIVE_INFINITY);
  expect(overlayBox?.height).toBeLessThanOrEqual(viewport?.height || Number.POSITIVE_INFINITY);

  if (testInfo.project.name === "desktop") {
    await expect(overlay).toHaveScreenshot("sound-racer-current-target-tutorial.png", {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.02
    });
  }

  await overlay.getByRole("button", { name: "Tap to play" }).click();
  const replayTarget = page.getByRole("button", {
    name: `Hear ${expectedTarget.toUpperCase()} sound again`
  });
  await expect(replayTarget).toBeVisible();
  const replayBounds = await replayTarget.boundingBox();
  expect(replayBounds?.width).toBeGreaterThanOrEqual(56);
  expect(replayBounds?.height).toBeGreaterThanOrEqual(56);
  await replayTarget.click();
  expect(pageErrors).toEqual([]);
});

test("Sound Racer hides its target replay control when production sound is off", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:sound-racer", "1");
  });
  await page.goto("/preview/sound-racer-preview.html?difficulty=hard&level=0&sound=0&music=0");
  await expect(page.locator('[data-sr="hear-target"]')).toBeHidden();
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

  await page.waitForTimeout(3_800);
  await expect(hud).toHaveAttribute("data-sound-racer-lane", "1");
  await rightControl.click();
  await expect(hud).toHaveAttribute("data-sound-racer-lane", "2");

  await rightControl.focus();
  await expect(rightControl).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(hud).toHaveAttribute("data-sound-racer-lane", "1");
});
