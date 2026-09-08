import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:star-gallery", "1");
  });
});

test("Sentence Grove keeps the picture cue separate from the repair sentence", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/preview/game-overlay.html?game=star-gallery&sound=0&music=0");

  const player = page.getByRole("dialog", { name: "Sentence Grove", exact: true });
  const cue = player.locator('[data-role="cue"]');
  const sentence = player.locator('[data-role="display"]');
  await expect(cue).toHaveText("Picture cue: cat", { timeout: 90_000 });
  await expect(sentence).toHaveText("__ cat sat on the mat.");
  await expect(sentence).not.toHaveText("cat __ cat sat on the mat.");

  const replay = player.locator('[data-role="replay"]');
  await expect(replay).toBeDisabled();
  await expect(replay).toHaveText(/Sentence shown - sound off/);
});
