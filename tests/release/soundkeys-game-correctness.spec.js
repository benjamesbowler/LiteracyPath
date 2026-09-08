import { expect, test } from "@playwright/test";

async function installAudioProbe(page) {
  await page.addInitScript(() => {
    window.__soundKeyAudio = [];
    window.Audio = class SoundKeysTestAudio {
      constructor(src) {
        this.src = src;
        this.pauseCount = 0;
        window.__soundKeyAudio.push(this);
      }

      play() {
        return Promise.resolve();
      }

      pause() {
        this.pauseCount += 1;
      }
    };
  });
}

test("SoundKeys locks one wrong attempt and freezes its recovery while paused", async ({ page }) => {
  await installAudioProbe(page);
  await page.goto("/preview/game-overlay.html?game=soundkeys&sound=1&music=0");

  const player = page.getByRole("dialog", { name: "SoundKeys", exact: true });
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });
  const keys = player.locator(".soundkeys-keyboard button");
  const progress = player.locator(".soundkeys-game-progress");
  const feedback = player.locator(".soundkeys-game-word");

  // Every preview round is easy/CVC, so three copies of the first key cannot
  // be a valid word. The first completed wrong attempt must lock the input
  // before React's next render can process the remaining rapid taps.
  await keys.first().click({ clickCount: 3, delay: 0 });
  await expect(feedback).toContainText("Not quite");
  await expect(progress).toContainText("1 misses");
  await keys.first().click({ clickCount: 5, delay: 0 });
  await expect(progress).toContainText("1 misses");

  await page.keyboard.press("Escape");
  const quit = page.getByRole("alertdialog", { name: "Quit SoundKeys", exact: true });
  await expect(quit).toBeVisible();
  await page.waitForTimeout(850);
  await expect(feedback).toContainText("Not quite");
  expect(await page.evaluate(() => window.__soundKeyAudio.some(audio => audio.pauseCount > 0))).toBe(true);

  await quit.getByRole("button", { name: "Keep playing", exact: true }).click();
  await expect(feedback).not.toContainText("Not quite", { timeout: 2_000 });
});
