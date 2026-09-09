import { expect, test } from "@playwright/test";

import { reelReadLadder } from "../../src/utils/reelReadLevels.js";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:reel-read", "1");
  });
});

test("Reel & Read keeps the assembled deck visible until the learner advances", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/preview/game-overlay.html?game=reel-read&sound=0&music=0");
  const player = page.getByRole("dialog", { name: "Reel & Read", exact: true });
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });
  await expect(player.locator('[data-rr="fish"]').filter({ hasText: "rain" })).toBeEnabled({ timeout: 8_000 });

  const catchTarget = async word => {
    const target = player.locator('[data-rr="fish"]').filter({ hasText: word });
    await target.click({ force: true });
    await player.locator('[data-rr="cast"]').click();
    await expect(player.locator('[data-rr="cast"]')).toHaveText("CAST", { timeout: 4_000 });
  };
  await catchTarget("rain");
  await catchTarget("bow");
  const result = player.locator('[data-rr="result"]');
  await expect(result).toBeVisible({ timeout: 4_000 });
  await expect(result).toContainText("rain + bow = rainbow");
  await page.waitForTimeout(500);
  await expect(result).toBeVisible();
  await player.locator('[data-rr="next"]').click();
  await expect(result).toBeHidden();
});

test("Reel & Read exposes intentional named targets and a cancel-safe cast", async ({ page }) => {
  for (const size of [{ width: 320, height: 568 }, { width: 568, height: 320 }, { width: 1024, height: 768 }]) {
    await page.setViewportSize(size);
    await page.goto("/preview/game-overlay.html?game=reel-read&sound=0&music=0");
    const player = page.getByRole("dialog", { name: "Reel & Read", exact: true });
    await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });
    await expect(player.locator('[data-rr="status"]')).toHaveText("Choose a fish, then cast.", { timeout: 8_000 });

    const targets = player.locator('[data-rr="fish"]');
    await expect(targets).toHaveCount(5);
    const geometry = await targets.evaluateAll(buttons => buttons.map(button => {
      const rect = button.getBoundingClientRect();
      const center = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return {
        width: rect.width,
        height: rect.height,
        label: button.textContent,
        centerIsTarget: center === button || center?.closest('[data-rr="fish"]') === button
      };
    }));
    for (const item of geometry) {
      expect(item.width).toBeGreaterThanOrEqual(56);
      expect(item.height).toBeGreaterThanOrEqual(56);
      expect(item.label).not.toBe("");
      expect(item.centerIsTarget).toBe(true);
    }

    if (size.width === 568) {
      const correct = targets.filter({ hasText: "rain" });
      await correct.click({ force: true });
      await expect(player.locator('[data-rr="status"]')).toHaveText("Selected rain. Press CAST.");
      const cast = player.locator('[data-rr="cast"]');
      await expect(cast).toBeEnabled();
      await cast.click();
      await expect(cast).toHaveText("CANCEL");
      await cast.click();
      await expect(cast).toHaveText("CAST");
      await expect(player.locator('[data-rr="status"]')).toContainText("Cast cancelled");
      await expect(player.locator('[data-rr="result"]')).toBeHidden();
      await page.screenshot({ path: ".artifacts/g14-reel-read/reel-read-g14-568x320.png" });
    }
  }
});

test("Reel & Read reports real cue delivery and keeps printed targets usable when sound is off", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/preview/game-overlay.html?game=reel-read&sound=1&music=0");
  const player = page.getByRole("dialog", { name: "Reel & Read", exact: true });
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });

  const game = player.locator('[data-rr-cue-delivery]').first();
  await expect(game).toHaveAttribute("data-rr-cue-delivery", /completed|failed|unavailable|started|loading/, { timeout: 8_000 });
  await expect(player.locator('[data-rr="fish"]').filter({ hasText: "rain" })).toBeVisible();

  await page.getByRole("button", { name: "Turn spoken audio and game sounds off", exact: true }).click();
  await expect(game).toHaveAttribute("data-rr-cue-delivery", "muted");
  await expect(player.getByRole("button", { name: /sound is off/i })).toBeDisabled();
  await expect(player.locator('[data-rr="fish"]').filter({ hasText: "rain" })).toBeVisible();
});

test("Reel & Read pauses a cast without losing the selected reading target", async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await page.goto("/preview/game-overlay.html?game=reel-read&sound=0&music=0");
  const player = page.getByRole("dialog", { name: "Reel & Read", exact: true });
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });
  await expect(player.locator('[data-rr="status"]')).toHaveText("Choose a fish, then cast.", { timeout: 8_000 });

  const game = player.locator('[data-rr-cue-delivery]').first();
  const target = player.locator('[data-rr="fish"]').filter({ hasText: "rain" });
  await target.click({ force: true });
  const cast = player.locator('[data-rr="cast"]');
  await cast.click();
  await expect(cast).toHaveText("CANCEL");

  await player.getByRole("button", { name: "Close Reel & Read", exact: true }).click();
  const quit = page.getByRole("alertdialog");
  await expect(quit).toBeVisible();
  await expect(cast).toHaveText("CAST");
  await expect(game).toHaveAttribute("data-rr-selected-fish-id", /rain/);

  await quit.getByRole("button", { name: "Keep playing", exact: true }).click();
  await expect(quit).toBeHidden();
  await expect(cast).toBeEnabled();
  await expect(game).toHaveAttribute("data-rr-phase", "playing");
});

test("Reel & Read records a wrong response as a supported retry without removing the fish", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/preview/game-overlay.html?game=reel-read&sound=0&music=0");
  const player = page.getByRole("dialog", { name: "Reel & Read", exact: true });
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });
  await expect(player.locator('[data-rr="status"]')).toHaveText("Choose a fish, then cast.", { timeout: 8_000 });

  const game = player.locator('[data-rr-cue-delivery]').first();
  const wrong = player.locator('[data-rr="fish"]').filter({ hasNotText: /rain|bow/ }).first();
  const wrongId = await wrong.getAttribute("data-fish-id");
  const wrongWord = await wrong.textContent();
  await wrong.click({ force: true });
  await player.locator('[data-rr="cast"]').click();
  await expect(player.locator('[data-rr="status"]')).toContainText(`Try again: ${wrongWord}`);
  await expect(game).toHaveAttribute("data-rr-assisted-retries", "0");

  const sameFish = player.locator(`[data-rr="fish"][data-fish-id="${wrongId}"]`);
  await expect(sameFish).toHaveCount(1);
  await sameFish.click({ force: true });
  await player.locator('[data-rr="cast"]').click();
  await expect(player.locator('[data-rr="status"]')).toContainText(`Try again: ${wrongWord}`);
  await expect(game).toHaveAttribute("data-rr-first-responses", "1");
  await expect(game).toHaveAttribute("data-rr-assisted-retries", "1");
  await expect(sameFish).toBeVisible();
});

test("Reel & Read saves one evidence-backed receipt before Finish Trip", async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    window.localStorage.setItem("literacy-guide-learn-games:fullscreen-overlay-preview", JSON.stringify({
      games: { "reel-read": { checkpoints: { easy: { level: 9, totalLevels: 10 } } } }
    }));
  });
  await page.goto("/preview/game-overlay.html?game=reel-read&sound=0&music=0");
  const resume = page.getByRole("alertdialog").filter({ hasText: "Welcome back" });
  await expect(resume).toBeVisible();
  await resume.getByRole("button", { name: "Continue", exact: true }).click();

  const player = page.getByRole("dialog", { name: "Reel & Read", exact: true });
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });
  await expect(player.locator('[data-rr="status"]')).toHaveText("Choose a fish, then cast.", { timeout: 8_000 });

  const level = reelReadLadder("easy")[9];
  for (const word of level.correctWords) {
    const fish = player.locator('[data-rr="fish"]').filter({ hasText: word });
    await expect(fish).toHaveCount(1, { timeout: 8_000 });
    await fish.click({ force: true });
    await player.locator('[data-rr="cast"]').click();
    await expect(player.locator('[data-rr="cast"]')).toHaveText("CAST", { timeout: 5_000 });
  }

  const result = player.locator('[data-rr="result"]');
  await expect(result).toBeVisible({ timeout: 5_000 });
  await expect(result).toHaveAttribute("data-result-ready", "true");
  await expect(result).toHaveAttribute("data-first-responses", "2");
  await expect(result).toHaveAttribute("data-assisted-retries", "0");

  const savedBeforeFinish = await page.evaluate(() => JSON.parse(window.localStorage.getItem("literacy-guide-learn-games:fullscreen-overlay-preview")));
  const gameBeforeFinish = savedBeforeFinish.games["reel-read"];
  expect(gameBeforeFinish.plays).toBe(1);
  expect(gameBeforeFinish.practiceRecord.completions).toHaveLength(1);
  expect(gameBeforeFinish.practiceRecord.completions[0].practiceOnly).toBe(true);
  expect(gameBeforeFinish.practiceRecord.completions[0].independent).toBe(false);
  expect(gameBeforeFinish.practiceRecord.completions[0].steps).toHaveLength(2);
  expect(gameBeforeFinish.practiceRecord.completions[0].steps[0].audioDelivery).toBe("muted");
  expect(gameBeforeFinish.practiceRecord.completions[0].assistedRetries).toHaveLength(0);

  await result.getByRole("button", { name: "FINISH TRIP", exact: true }).click();
  const savedAfterFinish = await page.evaluate(() => JSON.parse(window.localStorage.getItem("literacy-guide-learn-games:fullscreen-overlay-preview")));
  expect(savedAfterFinish.games["reel-read"].plays).toBe(1);
  expect(savedAfterFinish.games["reel-read"].practiceRecord.completions).toHaveLength(1);
});
