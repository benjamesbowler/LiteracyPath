import { expect, test } from "@playwright/test";

test("Sound Beat canvas exactly fills the visible game area at desktop and short landscape", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:sound-beat", "1");
  });

  for (const viewport of [
    { width: 1467, height: 953 },
    { width: 568, height: 320 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/preview/game-overlay.html?game=sound-beat&sound=0&music=0");

    const player = page.getByRole("dialog", { name: "Sound Beat", exact: true });
    await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });
    const gameArea = player.locator(".lg-game-player-main");
    const canvas = gameArea.locator("canvas");
    await expect(canvas).toHaveAttribute("data-sound-beat-ready", "true", { timeout: 10_000 });

    const bounds = await gameArea.evaluate(main => {
      const mainRect = main.getBoundingClientRect();
      const canvasRect = main.querySelector("canvas")?.getBoundingClientRect();
      return {
        main: {
          left: mainRect.left,
          top: mainRect.top,
          right: mainRect.right,
          bottom: mainRect.bottom,
          width: mainRect.width,
          height: mainRect.height
        },
        canvas: canvasRect && {
          left: canvasRect.left,
          top: canvasRect.top,
          right: canvasRect.right,
          bottom: canvasRect.bottom,
          width: canvasRect.width,
          height: canvasRect.height
        },
        scrollHeight: main.scrollHeight,
        clientHeight: main.clientHeight
      };
    });

    expect(bounds.canvas, `${viewport.width}x${viewport.height} canvas bounds`).toEqual(bounds.main);
    expect(bounds.scrollHeight, `${viewport.width}x${viewport.height} game area must not scroll`).toBe(bounds.clientHeight);
    expect(bounds.main.bottom, `${viewport.width}x${viewport.height} game area must end at the viewport`).toBe(viewport.height);
  }
});

test("Sound Beat keeps a replay control for its rhythm cue", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lp-arcade-onboarded-v1:sound-beat', '1'));
  await page.goto('/preview/game-overlay.html?game=sound-beat&sound=1&music=0');
  const replay = page.getByRole('button', { name: 'Hear the current sound again' });
  await expect(replay).toBeVisible();
  await replay.click();
  await expect(page.locator('canvas')).toBeVisible();
});
