import { expect, test } from "@playwright/test";

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
