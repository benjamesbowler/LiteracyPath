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
  // Three.js cold-start can approach the default 30-second ceiling when this
  // runs after the other full-screen WebGL games in the same worker.
  test.setTimeout(45_000);
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

test("Rocket Run side taps and visible arrows keep pointer, hold, and keyboard steering in parity", async ({ page }) => {
  test.setTimeout(45_000);
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:rocket-run", "1");
  });
  await page.goto("/preview/game-overlay.html?game=rocket-run&sound=0&music=0");

  const player = page.getByRole("dialog", { name: "Rocket Run", exact: true });
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });
  const hud = player.locator('[data-rr="hud"]');
  const leftControl = player.getByRole("button", { name: "Steer left", exact: true });
  const rightControl = player.getByRole("button", { name: "Steer right", exact: true });
  await expect(hud).toHaveAttribute("data-rocket-lane", "1");

  for (const control of [leftControl, rightControl]) {
    await expect(control).toBeVisible();
    const bounds = await control.boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(56);
    expect(bounds?.height).toBeGreaterThanOrEqual(56);
    // The old controls were transparent, 42%-wide buttons. Their global
    // focus ring was the giant green rectangle reported by the user.
    expect(bounds?.width).toBeLessThanOrEqual(80);
    expect(bounds?.height).toBeLessThanOrEqual(80);
  }
  const sideZoneContract = await player.locator('[data-rr="right-zone"]').evaluate(node => ({
    tagName: node.tagName,
    tabIndex: node.tabIndex
  }));
  expect(sideZoneContract).toEqual({ tagName: "DIV", tabIndex: -1 });

  // A pointer tap moves immediately on pointerdown, before release or the
  // next animation frame, and always clears its pressed state on release.
  const rightBounds = await rightControl.boundingBox();
  await page.mouse.move(rightBounds.x + rightBounds.width / 2, rightBounds.y + rightBounds.height / 2);
  await page.mouse.down();
  await expect(hud).toHaveAttribute("data-rocket-lane", "2");
  await page.mouse.up();
  await expect(rightControl).toHaveAttribute("data-pressed", "false");

  // Arrow/WASD steering remains live even when a visible steering button has
  // keyboard focus. Previously the generic interactive-element guard
  // discarded every arrow key once the invisible side button was focused.
  await rightControl.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(hud).toHaveAttribute("data-rocket-lane", "1");
  await page.keyboard.press("a");
  await expect(hud).toHaveAttribute("data-rocket-lane", "0");

  // Holding the visible control keeps the action active and release stops it.
  await page.mouse.move(rightBounds.x + rightBounds.width / 2, rightBounds.y + rightBounds.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();
  await expect(hud).toHaveAttribute("data-rocket-lane", "2");
  await expect(rightControl).toHaveAttribute("data-pressed", "false");
  expect(pageErrors).toEqual([]);
});

test("Rocket Run engine-owned completion is a focused modal that isolates gameplay controls", async ({ page }) => {
  test.setTimeout(45_000);
  await page.goto("/preview/game-overlay.html?game=rocket-run&sound=0&music=0");
  const player = page.getByRole("dialog", { name: "Rocket Run", exact: true });
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });
  const launch = player.locator('[data-rr="intro-play"]');
  await expect(launch).toHaveAttribute("type", "button");
  await expect(player.getByRole("dialog", { name: "Rocket Run instructions", exact: true })).toBeVisible();
  await expect(launch).toBeFocused();
  const launchBox = await launch.boundingBox();
  expect(launchBox?.height).toBeGreaterThanOrEqual(56);
  await page.keyboard.press("Tab");
  await expect(launch).toBeFocused();
  await launch.click();

  const contract = await player.evaluate(async root => {
    const { isolateRocketRunCompletion } = await import("/src/components/learn/games/shared/rocketRunCompletion.js");
    const hud = root.querySelector('[data-rr="hud"]');
    const overlay = hud.querySelector('[data-rr="overlay"]');
    overlay.innerHTML = '<button type="button" data-rr="done">Back to Arcade</button>';
    overlay.style.display = "grid";
    const action = overlay.querySelector('[data-rr="done"]');
    root.querySelector('[data-rr="right-control"]').inert = true;
    isolateRocketRunCompletion(hud, overlay, action);
    return {
      role: overlay.getAttribute("role"),
      ariaModal: overlay.getAttribute("aria-modal"),
      ariaLabel: overlay.getAttribute("aria-label"),
      focused: document.activeElement === action,
      replayIsolated: root.querySelector('[data-rr="hear-target"]').closest("[inert]") !== null,
      leftIsolated: root.querySelector('[data-rr="left-control"]').closest("[inert]") !== null,
      rightIsolated: root.querySelector('[data-rr="right-control"]').closest("[inert]") !== null
    };
  });

  expect(contract).toEqual({
    role: "dialog",
    ariaModal: "true",
    ariaLabel: "Rocket Run complete",
    focused: true,
    replayIsolated: true,
    leftIsolated: true,
    rightIsolated: true
  });

  const action = player.locator('[data-rr="done"]');
  await page.keyboard.press("Tab");
  await expect(action).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(action).toBeFocused();

  const restored = await player.evaluate(async root => {
    const { restoreRocketRunHud } = await import("/src/components/learn/games/shared/rocketRunCompletion.js");
    const hud = root.querySelector('[data-rr="hud"]');
    const overlay = hud.querySelector('[data-rr="overlay"]');
    restoreRocketRunHud(hud, overlay);
    return {
      replayInert: root.querySelector('[data-rr="hear-target"]').closest("[inert]") !== null,
      rightStillInert: root.querySelector('[data-rr="right-control"]').inert,
      modalRole: overlay.getAttribute("role")
    };
  });
  expect(restored).toEqual({ replayInert: false, rightStillInert: true, modalRole: null });
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
