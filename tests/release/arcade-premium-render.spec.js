import { expect, test } from "@playwright/test";

const GAMES = [
  { id: "rocket-run", title: "Rocket Run" },
  { id: "sound-racer", title: "Sound Racer" },
  { id: "grammar-grind", title: "Spell & Skate" },
  { id: "star-gallery", title: "Sentence Grove" }
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(gameIds => {
    for (const gameId of gameIds) {
      window.localStorage.setItem(`lp-arcade-onboarded-v1:${gameId}`, "1");
    }
  }, GAMES.map(game => game.id));
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
  await page.goto("/preview/game-overlay.html?game=rocket-run&sound=0&music=0");
  const player = page.getByRole("dialog", { name: "Rocket Run", exact: true });
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });
  const canvas = player.locator("canvas[data-arcade-render-profile]");
  await expect(canvas).toHaveAttribute("data-arcade-quality-tier", "low");
  await expect(canvas).toHaveAttribute("data-arcade-render-profile", "performance");
  await expect(canvas).toHaveAttribute("data-arcade-post-effects", "off");
});

test("the cinematic profile renders through the full post-processing path", async ({ page }) => {
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
  await page.goto("/preview/game-overlay.html?game=rocket-run&sound=0&music=0");
  const player = page.getByRole("dialog", { name: "Rocket Run", exact: true });
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
  await expect(canvas).toHaveAttribute("data-arcade-render-profile", "cinematic");
  await expect(canvas).toHaveAttribute("data-arcade-render-fallback", "false");
  await page.waitForTimeout(600);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(canvas).toHaveAttribute("data-arcade-render-profile", "performance");
  await expect(canvas).toHaveAttribute("data-arcade-post-effects", "off");
  await page.waitForTimeout(400);
  expect(pageErrors).toEqual([]);
});
