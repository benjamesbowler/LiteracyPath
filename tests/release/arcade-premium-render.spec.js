import { expect, test } from "@playwright/test";

const GAMES = [
  { id: "sound-racer", title: "Sound Racer" },
  { id: "grammar-grind", title: "Spell & Skate" },
  { id: "star-gallery", title: "Sentence Grove" }
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(gameIds => {
    for (const gameId of gameIds) {
      window.localStorage.setItem(`lp-arcade-onboarded-v1:${gameId}`, "1");
    }
  }, [...GAMES.map(game => game.id), "rocket-run"]);
});

test("Rocket Run delivers its authored flight through its current adaptive renderer", async ({ page }) => {
  test.setTimeout(90_000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const difficulty of ["easy", "medium", "hard"]) {
    await page.goto(`/preview/game-overlay.html?game=rocket-run&difficulty=${difficulty}&sound=0&music=0`);
    await expect(page.getByRole("dialog", { name: "Rocket Run", exact: true })).toBeVisible();
    try {
      await page.waitForFunction(() => window.__arcadePreviewSnapshot?.({ history: false })?.scene?.playable, null, { timeout: 20_000 });
    } catch (error) {
      await test.info().attach(`Rocket ${difficulty} readiness`, { body: JSON.stringify(await page.evaluate(() => ({ hidden: document.hidden, visibility: document.visibilityState, focused: document.hasFocus(), state: window.__arcadePreviewSnapshot?.({ history: false }) })), null, 2), contentType: "application/json" });
      throw error;
    }
    const scene = await page.evaluate(() => window.__arcadePreviewSnapshot({ history: false }).scene);
    expect(["three", "canvas"]).toContain(scene.mode);
    expect(["rich", "balanced", "low", "2d"]).toContain(scene.quality);
    expect(scene.completeActor).toBe(true);
    expect(scene.delivered).toBe(true);
    await expect(page.locator(".rocket-v2 canvas").first()).toBeVisible();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/preview/game-overlay.html?game=rocket-run&sound=0&music=0");
  const startOver = page.getByRole("button", { name: "Start over", exact: true });
  if (await startOver.isVisible()) await startOver.click();
  await page.waitForFunction(() => window.__arcadePreviewSnapshot?.({ history: false })?.scene?.playable, null, { timeout: 20_000 });
  expect(["low", "2d"]).toContain(await page.evaluate(() => window.__arcadePreviewSnapshot({ history: false }).scene.quality));
  expect(errors).toEqual([]);
});

test("every WebGL Arcade game declares its adaptive premium rendering contract", async ({ page }) => {
  test.setTimeout(90_000);
  for (const game of GAMES) {
    await page.goto(`/preview/game-overlay.html?game=${game.id}&sound=0&music=0`);
    const player = page.getByRole("dialog", { name: game.title, exact: true });
    await expect(player).toBeVisible();
    await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });
    const canvas = player.locator("canvas[data-arcade-render-profile]");
    await expect(canvas).toBeVisible();
    const contract = await canvas.evaluate(node => ({ ...node.dataset }));
    expect(["low", "medium", "high"]).toContain(contract.arcadeQualityTier);
    expect(["performance", "enhanced", "cinematic"]).toContain(contract.arcadeRenderProfile);
    expect(["off", "smaa-bloom", "smaa-ssao-bloom"]).toContain(contract.arcadePostEffects);
    expect(["off", "emissive-effects"]).toContain(contract.arcadeBloomScope);
    if (contract.arcadeSoftwareRenderer === "true") {
      expect(contract.arcadeRenderProfile).toBe("performance");
      expect(contract.arcadePostEffects).toBe("off");
    }
  }
});

test("reduced motion keeps the direct-render performance profile", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/preview/game-overlay.html?game=sound-racer&sound=0&music=0");
  const player = page.getByRole("dialog", { name: "Sound Racer", exact: true });
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });
  const canvas = player.locator("canvas[data-arcade-render-profile]");
  await expect(canvas).toHaveAttribute("data-arcade-quality-tier", "low");
  await expect(canvas).toHaveAttribute("data-arcade-render-profile", "performance");
  await expect(canvas).toHaveAttribute("data-arcade-post-effects", "off");
});

test("cinematic rendering keeps the authored race playable after context loss", async ({ page }) => {
  test.setTimeout(60_000);
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { configurable: true, get: () => 8 });
    Object.defineProperty(navigator, "deviceMemory", { configurable: true, get: () => 8 });
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
  await page.goto("/preview/game-overlay.html?game=sound-racer&sound=0&music=0");
  const player = page.getByRole("dialog", { name: "Sound Racer", exact: true });
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });
  const canvas = player.locator("canvas[data-arcade-render-profile]");
  await expect(canvas).toHaveAttribute("data-arcade-quality-tier", "high");
  await expect(canvas).toHaveAttribute("data-arcade-render-profile", "cinematic");
  await expect(canvas).toHaveAttribute("data-arcade-post-effects", "smaa-ssao-bloom");
  await expect(canvas).toHaveAttribute("data-arcade-bloom-scope", "emissive-effects");
  await expect(canvas).toHaveAttribute("data-arcade-render-fallback", "false");
  await page.waitForTimeout(1_200);
  const contextRestored = await canvas.evaluate(async node => {
    const gl = node.getContext("webgl2") || node.getContext("webgl");
    const extension = gl?.getExtension("WEBGL_lose_context");
    if (!extension) return false;
    const restored = new Promise(resolve => {
      const timeout = window.setTimeout(() => resolve(false), 5_000);
      node.addEventListener("webglcontextrestored", () => {
        window.clearTimeout(timeout);
        resolve(true);
      }, { once: true });
    });
    extension.loseContext();
    await new Promise(resolve => window.setTimeout(resolve, 120));
    extension.restoreContext();
    return restored;
  });
  expect(contextRestored).toBe(true);
  await page.waitForFunction(() => {
    const state = window.__arcadePreviewSnapshot?.();
    return state?.presentation?.mode === "canvas" && state.presentation.canvas?.renderCount > 0;
  }, null, { timeout: 10_000 });
  await expect(player.locator("canvas").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Steer left", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Steer right", exact: true })).toBeEnabled();
  expect(pageErrors).toEqual([]);
});
