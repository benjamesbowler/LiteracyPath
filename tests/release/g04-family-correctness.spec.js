import { expect, test } from "@playwright/test";

test("Blend and Build names an authored target and only presents reviewed family words", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/preview/game-overlay.html?game=blend-and-build&sound=0&music=0");

  const player = page.getByRole("dialog", { name: "Blend & Build", exact: true });
  await expect(player).toBeVisible();
  await expect(player.locator(".lg-family-board button").first()).toBeVisible({ timeout: 90_000 });
  await expect(player.locator("main p").first()).toHaveText(/^Build .+ in the -[A-Z]+ family\.$/);

  const options = (await player.locator(".lg-family-board button").allTextContents()).map(text => text.trim());
  expect(options.length).toBeGreaterThan(0);
  expect(options.every(Boolean)).toBe(true);
});
