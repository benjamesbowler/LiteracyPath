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

test("Sound Beat keeps a child-sized current-sound replay control during play", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:sound-beat", "1");
  });
  await page.goto("/preview/game-overlay.html?game=sound-beat&sound=1&music=0");

  const player = page.getByRole("dialog", { name: "Sound Beat", exact: true });
  await expect(player).toBeVisible();
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });
  await expect(player.locator("canvas")).toBeVisible();

  const replay = player.getByRole("button", { name: "Hear the current sound again", exact: true });
  await expect(replay).toBeVisible();
  const bounds = await replay.boundingBox();
  expect(bounds?.width).toBeGreaterThanOrEqual(56);
  expect(bounds?.height).toBeGreaterThanOrEqual(56);
  await replay.click();
  const liveStatus = player.locator('[data-sound-beat-status="true"]');
  const statusBeforeKeyboardReplay = await liveStatus.textContent();
  await replay.focus();
  await page.keyboard.press("Enter");
  await expect(liveStatus).toHaveText(statusBeforeKeyboardReplay || "");
  await expect(replay).toBeVisible();

  const canvas = player.locator("canvas");
  await expect(canvas).toHaveAttribute("data-sound-beat-ready", "true", { timeout: 10_000 });
  const canvasBounds = await canvas.boundingBox();
  const answerIndex = Number(await canvas.getAttribute("data-sound-beat-answer-index"));
  const choiceCount = Number(await canvas.getAttribute("data-sound-beat-choice-count"));
  expect(choiceCount).toBe(4);
  const lanePoint = index => {
    const left = canvasBounds.width * (canvasBounds.width < 560 ? 0.14 : 0.25);
    const right = canvasBounds.width * (canvasBounds.width < 560 ? 0.86 : 0.75);
    return {
      x: left + index * ((right - left) / 3),
      y: canvasBounds.height * 0.86
    };
  };
  const wrongIndex = (answerIndex + 1) % choiceCount;
  await canvas.click({ position: lanePoint(wrongIndex) });
  await expect(canvas).toHaveAttribute("data-sound-beat-index", "0");
  await page.waitForTimeout(280);
  await canvas.click({ position: lanePoint(answerIndex) });
  await expect(canvas).toHaveAttribute("data-sound-beat-index", "1");
  expect(pageErrors).toEqual([]);
});

test("Sound Beat remains answerable in a labelled model mode with sound off", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:sound-beat", "1");
  });
  await page.goto("/preview/game-overlay.html?game=sound-beat&sound=0&music=0");

  const player = page.getByRole("dialog", { name: "Sound Beat", exact: true });
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });
  const canvas = player.locator("canvas");
  await expect(canvas).toHaveAttribute("data-sound-beat-ready", "true", { timeout: 10_000 });
  await expect(canvas).toHaveAttribute("data-sound-beat-prompt-mode", "model");
  await expect(player.getByRole("button", { name: "Hear the current sound again", exact: true })).toHaveCount(0);
  await expect(player.locator('[data-sound-beat-status="true"]')).toContainText("Model: cat.");
  await expect(canvas).toHaveAttribute("aria-label", /Model: cat\./);

  const answerIndex = Number(await canvas.getAttribute("data-sound-beat-answer-index"));
  await canvas.focus();
  await page.keyboard.press(String(answerIndex + 1));
  await expect(canvas).toHaveAttribute("data-sound-beat-index", "1");
});
