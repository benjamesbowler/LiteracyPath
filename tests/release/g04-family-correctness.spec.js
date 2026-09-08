import { expect, test } from "@playwright/test";

test("Blend and Build names an authored target and reveals its object after onset choice", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/preview/game-overlay.html?game=blend-and-build&sound=0&music=0");

  const player = page.getByRole("dialog", { name: "Blend & Build", exact: true });
  await expect(player).toBeVisible();
  await expect(player.locator(".lg-family-board button").first()).toBeVisible({ timeout: 90_000 });
  await expect(player.locator("main p").first()).toHaveText("Build the named word: join the first sound to the rime.");

  const options = (await player.locator(".lg-family-board button").allTextContents()).map(text => text.trim());
  expect(options.length).toBeGreaterThanOrEqual(3);
  expect(options.every(Boolean)).toBe(true);
  const target = (await player.locator(".lg-blend-target strong").textContent()).trim();
  const family = (await player.locator(".lg-rime-tile").textContent()).trim();
  const onset = target.slice(0, -family.length + 1);
  const wrongOnset = options.find(value => value !== onset);
  const choices = player.locator(".lg-family-board button");
  await choices.filter({ hasText: new RegExp(`^${wrongOnset}$`) }).click();
  await expect(player.locator(".lg-game-feedback")).toContainText("Try the onset");
  await choices.filter({ hasText: new RegExp(`^${onset}$`) }).click();
  await expect(player.locator(".lg-blend-reveal")).toBeVisible({timeout: 5000});
  await expect(player.locator(".lg-blend-reveal")).toContainText(`Object built`);
  await expect(player.locator(".lg-blend-reuse")).toBeVisible();
  await player.locator(".lg-blend-reuse").click();
  const reuseOnset = player.locator(".lg-blend-reuse-onsets button").first();
  await expect(reuseOnset).toBeVisible();
  await reuseOnset.click();
  await player.locator(".lg-blend-reuse-rime").click();
  await expect(player.locator(".lg-blend-reuse-list")).toContainText("=");
  await expect(player.getByRole("button", { name: "Continue", exact: true })).toBeVisible();
});
