import { expect, test } from "@playwright/test";

import { rocketRunLadder } from "../../src/utils/rocketRunRounds.js";

async function configureRocketRunHighHardware(page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:rocket-run", "1");
    Object.defineProperty(navigator, "hardwareConcurrency", { configurable: true, get: () => 8 });
    Object.defineProperty(navigator, "deviceMemory", { configurable: true, get: () => 8 });
    // Headless Chromium normally identifies its software renderer and takes
    // the safe path for that reason alone. Mask that signal so these checks
    // exercise Rocket Run's own backing-pixel budget.
    for (const name of ["WebGLRenderingContext", "WebGL2RenderingContext"]) {
      const prototype = window[name]?.prototype;
      if (!prototype?.getExtension) continue;
      const original = prototype.getExtension;
      prototype.getExtension = function getExtension(extensionName) {
        if (extensionName === "WEBGL_debug_renderer_info") return null;
        return original.call(this, extensionName);
      };
    }
  });
}

test("Rocket Run keeps the exact target sound replayable without hiding the target", async ({ page }) => {
  const target = rocketRunLadder("easy")[0];
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:rocket-run", "1");
  });
  await page.goto("/preview/game-overlay.html?game=rocket-run&sound=1&music=0");

  const player = page.getByRole("dialog", { name: "Rocket Run", exact: true });
  await expect(player).toBeVisible();
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });

  const replay = player.locator('[data-rr="hear-target"]');
  await expect(replay).toBeVisible();
  await expect(replay).toBeEnabled();
  await expect(replay).toHaveAttribute("aria-label", `Hear the ${target} sound again`);
  await expect(replay.locator('[data-rr="letter"]')).toHaveText(target);
  const bounds = await replay.boundingBox();
  expect(bounds?.width).toBeGreaterThanOrEqual(56);
  expect(bounds?.height).toBeGreaterThanOrEqual(56);
  await replay.click();

  await page.getByRole("button", { name: "Turn spoken audio and game sounds off", exact: true }).click();
  await expect(replay).toBeDisabled();
  await expect(replay).toBeVisible();
  await expect(replay).toHaveAttribute("aria-label", `Target ${target}; sound is off`);
  await expect(replay.locator('[data-rr="letter"]')).toHaveText(target);

  await page.getByRole("button", { name: "Turn spoken audio and game sounds on", exact: true }).click();
  await expect(replay).toBeEnabled();
  expect(pageErrors).toEqual([]);
});

test.describe("Rocket Run high-DPR performance fallback", () => {
  test.use({ viewport: { width: 1467, height: 900 }, deviceScaleFactor: 2 });

  test("keeps a Retina-sized game responsive without allocating full-screen post effects", async ({ page }) => {
    test.setTimeout(45_000);
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    await configureRocketRunHighHardware(page);
    await page.goto("/preview/game-overlay.html?game=rocket-run&sound=0&music=0");

    const player = page.getByRole("dialog", { name: "Rocket Run", exact: true });
    await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });
    const canvas = player.locator("canvas[data-arcade-render-profile]");
    await expect(canvas).toHaveAttribute("data-arcade-quality-tier", "low");
    await expect(canvas).toHaveAttribute("data-arcade-scene-quality-tier", "high");
    await expect(canvas).toHaveAttribute("data-arcade-render-profile", "performance");
    await expect(canvas).toHaveAttribute("data-arcade-post-effects", "off");

    const cadence = await canvas.evaluate(async node => {
      let frames = 0;
      const started = performance.now();
      await new Promise(resolve => {
        const sample = now => {
          frames += 1;
          if (now - started >= 2_000) resolve();
          else requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      return {
        frames,
        backingWidth: node.width,
        backingHeight: node.height,
        cssWidth: node.clientWidth,
        cssHeight: node.clientHeight
      };
    });
    // The low/direct path caps DPR at 1 instead of allocating a Retina-sized
    // composer target while the separate scene-quality contract remains high.
    expect(cadence.backingWidth).toBe(cadence.cssWidth);
    expect(cadence.backingHeight).toBe(cadence.cssHeight);
    expect(cadence.frames).toBeGreaterThanOrEqual(8);
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowRight");
    expect(pageErrors).toEqual([]);
  });

  test("retains cinematic rendering on a bounded high-DPR canvas", async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 600 });
    await configureRocketRunHighHardware(page);
    await page.goto("/preview/game-overlay.html?game=rocket-run&sound=0&music=0");

    const player = page.getByRole("dialog", { name: "Rocket Run", exact: true });
    await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });
    const canvas = player.locator("canvas[data-arcade-render-profile]");
    await expect(canvas).toHaveAttribute("data-arcade-quality-tier", "high");
    await expect(canvas).toHaveAttribute("data-arcade-scene-quality-tier", "high");
    await expect(canvas).toHaveAttribute("data-arcade-render-profile", "cinematic");
    await expect(canvas).toHaveAttribute("data-arcade-post-effects", "smaa-ssao-bloom");
  });
});
