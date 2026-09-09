import { expect, test } from "@playwright/test";

import { reelReadLadder } from "../../src/utils/reelReadLevels.js";

async function clickTarget(page, target) {
  await expect(target).toBeVisible();
  const box = await target.boundingBox();
  expect(box).toBeTruthy();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("lp-arcade-onboarded-v1:reel-read", "1");
  });
});

test("Reel & Read keeps the assembled deck visible until the learner advances", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/preview/game-overlay.html?game=reel-read&sound=0&music=0");
  const player = page.getByRole("dialog", { name: "Reel & Read", exact: true });
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });
  await expect(player.locator('[data-rr="fish"]').filter({ hasText: "rain" })).toBeEnabled({ timeout: 8_000 });

  const catchTarget = async word => {
    const target = player.locator('[data-rr="fish"]').filter({ hasText: word });
    await clickTarget(page, target);
    await player.locator('[data-rr="cast"]').click();
    await expect(player.locator('[data-rr="cast"]')).toHaveText("CAST", { timeout: 4_000 });
  };
  await catchTarget("rain");
  await catchTarget("bow");
  const result = player.locator('[data-rr="result"]');
  await expect(result).toBeVisible({ timeout: 4_000 });
  await expect(result).toContainText("rain + bow = rainbow");
  await page.waitForTimeout(500);
  await expect(result).toBeVisible();
  await player.locator('[data-rr="next"]').click();
  await expect(result).toBeHidden();
});

test("Reel & Read exposes intentional named targets and a cancel-safe cast", async ({ page }) => {
  for (const size of [{ width: 320, height: 568 }, { width: 568, height: 320 }, { width: 1024, height: 768 }]) {
    await page.setViewportSize(size);
    await page.goto("/preview/game-overlay.html?game=reel-read&sound=0&music=0");
    const player = page.getByRole("dialog", { name: "Reel & Read", exact: true });
    await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });
    await expect(player.locator('[data-rr="status"]')).toHaveText("Choose a fish, then cast.", { timeout: 8_000 });

    const targets = player.locator('[data-rr="fish"]');
    await expect(targets).toHaveCount(5);
    const geometry = await targets.evaluateAll(buttons => buttons.map(button => {
      const rect = button.getBoundingClientRect();
      const center = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return {
        width: rect.width,
        height: rect.height,
        label: button.textContent,
        centerIsTarget: center === button || center?.closest('[data-rr="fish"]') === button
      };
    }));
    for (const item of geometry) {
      expect(item.width).toBeGreaterThanOrEqual(56);
      expect(item.height).toBeGreaterThanOrEqual(56);
      expect(item.label).not.toBe("");
      expect(item.centerIsTarget).toBe(true);
    }

    if (size.width === 568) {
      const correct = targets.filter({ hasText: "rain" });
      await clickTarget(page, correct);
      await expect(player.locator('[data-rr="status"]')).toHaveText("Selected rain. Press CAST.");
      const cast = player.locator('[data-rr="cast"]');
      await expect(cast).toBeEnabled();
      await cast.click();
      await expect(cast).toHaveText("CANCEL");
      await cast.click();
      await expect(cast).toHaveText("CAST");
      await expect(player.locator('[data-rr="status"]')).toContainText("Cast cancelled");
      await expect(player.locator('[data-rr="result"]')).toBeHidden();
      await page.screenshot({ path: ".artifacts/g14-reel-read/reel-read-g14-568x320.png" });
    }
  }
});

test("Reel & Read keeps named fish targets attached while the pond moves", async ({ page }) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const viewport of [{ width: 320, height: 568 }, { width: 568, height: 320 }, { width: 1024, height: 768 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/preview/game-overlay.html?game=reel-read&difficulty=hard&sound=0&music=0");
    const player = page.getByRole("dialog", { name: "Reel & Read", exact: true });
    await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });
    await expect(player.locator('[data-rr="status"]')).toHaveText("Choose a fish, then cast.", { timeout: 8_000 });

    const targets = player.locator('[data-rr="fish"]');
    await expect(targets).toHaveCount(6);
    const before = await targets.evaluateAll(buttons => buttons.map(button => ({ id: button.dataset.fishId, x: button.dataset.projectedX, y: button.dataset.projectedY })));
    await page.waitForTimeout(1_800);
    const after = await targets.evaluateAll(buttons => buttons.map(button => ({ id: button.dataset.fishId, x: button.dataset.projectedX, y: button.dataset.projectedY })));
    expect(after.map(item => item.id)).toEqual(before.map(item => item.id));
    expect(after.some((item, index) => item.x !== before[index].x || item.y !== before[index].y)).toBe(true);

    const target = player.getByRole("button", { name: "Choose fish saur", exact: true });
    await clickTarget(page, target);
    await expect(target).toHaveAttribute("aria-pressed", "true");
    const cast = player.locator('[data-rr="cast"]');
    await cast.click();
    await expect(cast).toHaveText("CANCEL");
    await cast.click();
    await expect(cast).toHaveText("CAST");
  }
});

test("Reel & Read reports real cue delivery and keeps printed targets usable when sound is off", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/preview/game-overlay.html?game=reel-read&sound=1&music=0");
  const player = page.getByRole("dialog", { name: "Reel & Read", exact: true });
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });

  const game = player.locator('[data-rr-cue-delivery]').first();
  await expect(game).toHaveAttribute("data-rr-cue-delivery", /completed|failed|unavailable|started|loading/, { timeout: 8_000 });
  await expect(player.locator('[data-rr="fish"]').filter({ hasText: "rain" })).toBeVisible();

  await page.getByRole("button", { name: "Turn spoken audio and game sounds off", exact: true }).click();
  await expect(game).toHaveAttribute("data-rr-cue-delivery", "muted");
  await expect(player.getByRole("button", { name: /sound is off/i })).toBeDisabled();
  await expect(player.locator('[data-rr="fish"]').filter({ hasText: "rain" })).toBeVisible();
});

test("Reel & Read pauses a cast without losing the selected reading target", async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await page.goto("/preview/game-overlay.html?game=reel-read&sound=0&music=0");
  const player = page.getByRole("dialog", { name: "Reel & Read", exact: true });
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });
  await expect(player.locator('[data-rr="status"]')).toHaveText("Choose a fish, then cast.", { timeout: 8_000 });

  const game = player.locator('[data-rr-cue-delivery]').first();
  const target = player.locator('[data-rr="fish"]').filter({ hasText: "rain" });
  await clickTarget(page, target);
  const cast = player.locator('[data-rr="cast"]');
  await cast.click();
  await expect(cast).toHaveText("CANCEL");

  await player.getByRole("button", { name: "Close Reel & Read", exact: true }).click();
  const quit = page.getByRole("alertdialog");
  await expect(quit).toBeVisible();
  await expect(cast).toHaveText("CAST");
  await expect(game).toHaveAttribute("data-rr-selected-fish-id", /rain/);

  await quit.getByRole("button", { name: "Keep playing", exact: true }).click();
  await expect(quit).toBeHidden();
  await expect(cast).toBeEnabled();
  await expect(game).toHaveAttribute("data-rr-phase", "playing");
});

test("Reel & Read records a wrong response as a supported retry without removing the fish", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/preview/game-overlay.html?game=reel-read&sound=0&music=0");
  const player = page.getByRole("dialog", { name: "Reel & Read", exact: true });
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });
  await expect(player.locator('[data-rr="status"]')).toHaveText("Choose a fish, then cast.", { timeout: 8_000 });

  const game = player.locator('[data-rr-cue-delivery]').first();
  const wrong = player.locator('[data-rr="fish"]').filter({ hasNotText: /rain|bow/ }).first();
  const wrongWord = await wrong.textContent();
  await clickTarget(page, wrong);
  await player.locator('[data-rr="cast"]').click();
  await expect(player.locator('[data-rr="status"]')).toContainText(`Try again: ${wrongWord}`);
  await expect(game).toHaveAttribute("data-rr-assisted-retries", "0");

  const correct = player.locator('[data-rr="fish"]').filter({ hasText: "rain" });
  await clickTarget(page, correct);
  await player.locator('[data-rr="cast"]').click();
  await expect(player.locator('[data-rr="status"]')).toHaveText("rain fits!");
  await expect(game).toHaveAttribute("data-rr-first-responses", "1");
  await expect(game).toHaveAttribute("data-rr-assisted-retries", "1");
  await expect(player.locator('[data-rr="fish"]').filter({ hasText: wrongWord })).toBeVisible();
});

test("Reel & Read saves one evidence-backed receipt before Finish Trip", async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    window.localStorage.setItem("literacy-guide-learn-games:fullscreen-overlay-preview", JSON.stringify({
      games: { "reel-read": { checkpoints: { easy: { level: 9, totalLevels: 10 } } } }
    }));
  });
  await page.goto("/preview/game-overlay.html?game=reel-read&sound=0&music=0");
  const resume = page.getByRole("alertdialog").filter({ hasText: "Welcome back" });
  await expect(resume).toBeVisible();
  await resume.getByRole("button", { name: "Continue", exact: true }).click();

  const player = page.getByRole("dialog", { name: "Reel & Read", exact: true });
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });
  await expect(player.locator('[data-rr="status"]')).toHaveText("Choose a fish, then cast.", { timeout: 8_000 });

  const level = reelReadLadder("easy")[9];
  for (const word of level.correctWords) {
    const fish = player.locator('[data-rr="fish"]').filter({ hasText: word });
    await expect(fish).toHaveCount(1, { timeout: 8_000 });
    await clickTarget(page, fish);
    await player.locator('[data-rr="cast"]').click();
    await expect(player.locator('[data-rr="cast"]')).toHaveText("CAST", { timeout: 5_000 });
  }

  const result = player.locator('[data-rr="result"]');
  await expect(result).toBeVisible({ timeout: 5_000 });
  await expect(result).toHaveAttribute("data-result-ready", "true");
  await expect(result).toHaveAttribute("data-first-responses", "2");
  await expect(result).toHaveAttribute("data-assisted-retries", "0");

  const savedBeforeFinish = await page.evaluate(() => JSON.parse(window.localStorage.getItem("literacy-guide-learn-games:fullscreen-overlay-preview")));
  const gameBeforeFinish = savedBeforeFinish.games["reel-read"];
  expect(gameBeforeFinish.plays).toBe(1);
  expect(gameBeforeFinish.practiceRecord.completions).toHaveLength(1);
  expect(gameBeforeFinish.practiceRecord.completions[0].practiceOnly).toBe(true);
  expect(gameBeforeFinish.practiceRecord.completions[0].independent).toBe(false);
  expect(gameBeforeFinish.practiceRecord.completions[0].steps).toHaveLength(2);
  expect(gameBeforeFinish.practiceRecord.completions[0].steps[0].audioDelivery).toBe("muted");
  expect(gameBeforeFinish.practiceRecord.completions[0].assistedRetries).toHaveLength(0);

  await result.getByRole("button", { name: "FINISH TRIP", exact: true }).click();
  const savedAfterFinish = await page.evaluate(() => JSON.parse(window.localStorage.getItem("literacy-guide-learn-games:fullscreen-overlay-preview")));
  expect(savedAfterFinish.games["reel-read"].plays).toBe(1);
  expect(savedAfterFinish.games["reel-read"].practiceRecord.completions).toHaveLength(1);
});

test("Reel & Read keeps the accepted final receipt when the learner exits immediately", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("literacy-guide-learn-games:fullscreen-overlay-preview", JSON.stringify({
      games: { "reel-read": { checkpoints: { easy: { level: 9, totalLevels: 10 } } } }
    }));
  });
  await page.goto("/preview/game-overlay.html?game=reel-read&sound=0&music=0");
  const resume = page.getByRole("alertdialog").filter({ hasText: "Welcome back" });
  await resume.getByRole("button", { name: "Continue", exact: true }).click();
  const player = page.getByRole("dialog", { name: "Reel & Read", exact: true });
  await player.locator(".lg-game-loading").waitFor({ state: "hidden", timeout: 20_000 });
  await expect(player.locator('[data-rr="status"]')).toHaveText("Choose a fish, then cast.", { timeout: 8_000 });

  const finalWords = reelReadLadder("easy")[9].correctWords;
  for (const [index, word] of finalWords.entries()) {
    const fish = player.getByRole("button", { name: `Choose fish ${word}`, exact: true });
    await clickTarget(page, fish);
    if (index === finalWords.length - 1) {
      await page.clock.install({ time: new Date("2026-09-09T00:00:00Z") });
      await page.clock.pauseAt(new Date("2026-09-09T00:00:01Z"));
    }
    await player.locator('[data-rr="cast"]').click();
    if (index < finalWords.length - 1) await expect(player.locator('[data-rr="cast"]')).toHaveText("CAST", { timeout: 5_000 });
    else {
      for (let frame = 0; frame < 150 && await player.locator('[data-rr="result"]').getAttribute("data-result-ready") !== "true"; frame++) await page.clock.runFor(16);
    }
  }
  await expect(player.locator('[data-rr="result"]')).toHaveAttribute("data-result-ready", "true");
  await expect(player.locator('[data-rr="result"]')).toBeHidden();
  await expect(player.locator('[data-rr="cast"]')).toHaveText("CANCEL");
  const savedBeforeExit = await page.evaluate(() => JSON.parse(window.localStorage.getItem("literacy-guide-learn-games:fullscreen-overlay-preview")));
  await page.screenshot({ path: ".artifacts/g14-production/returning-fish.png" });

  await page.keyboard.press("Escape");
  await expect(page.getByText("Closed Reel & Read", { exact: true })).toBeVisible();
  const savedAfterExit = await page.evaluate(() => JSON.parse(window.localStorage.getItem("literacy-guide-learn-games:fullscreen-overlay-preview")));
  expect(savedAfterExit).toEqual(savedBeforeExit);
});

test.use({ hasTouch: true });

for (const viewport of [{ width: 320, height: 568 }, { width: 568, height: 320 }, { width: 1024, height: 768 }]) {
  test(`Reel & Read completes all 30 authored levels with readable separated targets at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    test.setTimeout(600_000);
    const progressKey = "literacy-guide-learn-games:fullscreen-overlay-preview";
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(viewport);
    await page.goto("/preview/game-overlay.html?game=reel-read&sound=0&music=0");
    await page.addInitScript(key => {
      const seed = JSON.parse(sessionStorage.getItem("g14-level-seed") || "null");
      if (!seed) return;
      localStorage.removeItem(key);
      if (seed.levelIndex) localStorage.setItem(key, JSON.stringify({ games: {
        "reel-read": { checkpoints: { [seed.difficulty]: { level: seed.levelIndex, totalLevels: 10 } } }
      } }));
    }, progressKey);

    for (const difficulty of ["easy", "medium", "hard"]) {
      for (const [levelIndex, level] of reelReadLadder(difficulty).entries()) {
        await page.evaluate(seed => sessionStorage.setItem("g14-level-seed", JSON.stringify(seed)), { difficulty, levelIndex });
        await page.goto(`/preview/game-overlay.html?game=reel-read&difficulty=${difficulty}&sound=0&music=0`);
        if (levelIndex) await page.getByRole("alertdialog").filter({ hasText: "Welcome back" }).getByRole("button", { name: "Continue", exact: true }).click();
        const player = page.getByRole("dialog", { name: "Reel & Read", exact: true });
        await expect(player.locator('[data-rr="status"]')).toHaveText("Choose a fish, then cast.", { timeout: 8_000 });
        await page.evaluate(() => document.fonts.ready);
        const targets = player.locator('[data-rr="fish"]');
        await expect(targets).toHaveCount(level.visibleFish);
        const boxes = await player.locator('[data-rr="fish"], [data-rr="left"], [data-rr="right"], [data-rr="cast"], [data-rr="replay"]').evaluateAll(buttons => buttons.map(button => {
          const r = button.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(button);
          const text = range.getBoundingClientRect();
          const hit = document.elementFromPoint(r.x+r.width/2, r.y+r.height/2);
          return { label: button.textContent, fish: button.dataset.rr === "fish", left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height,
            textLeft:text.left, textRight:text.right, centerOwned:button === hit || button.contains(hit) };
        }));
        for (const [index, box] of boxes.entries()) {
          const context = `${difficulty}/${level.target} ${viewport.width}x${viewport.height}: ${JSON.stringify(box)}`;
          expect(box.width, context).toBeGreaterThanOrEqual(56);
          expect(box.height, context).toBeGreaterThanOrEqual(56);
          expect(box.left, context).toBeGreaterThanOrEqual(0);
          expect(box.right, context).toBeLessThanOrEqual(viewport.width);
          expect(box.bottom, context).toBeLessThanOrEqual(viewport.height);
          expect(box.centerOwned, context).toBe(true);
          if (box.fish) {
            expect(box.textLeft, context).toBeGreaterThanOrEqual(box.left+3);
            expect(box.textRight, context).toBeLessThanOrEqual(box.right-3);
          }
          for (const other of boxes.slice(index+1)) {
            const dx = Math.max(0, box.left-other.right, other.left-box.right);
            const dy = Math.max(0, box.top-other.bottom, other.top-box.bottom);
            expect(Math.hypot(dx,dy), `${context}; next:${other.label}`).toBeGreaterThanOrEqual(7.99);
          }
        }
        if ((difficulty === "easy" && levelIndex === 0) || level.target === "brave" || (difficulty === "hard" && levelIndex === 0)) {
          await page.screenshot({ path: `.artifacts/g14-production/${viewport.width}x${viewport.height}-${difficulty}-${level.target}.png` });
        }
        for (const [partIndex, word] of level.correctWords.entries()) {
          const target = player.getByRole("button", { name: `Choose fish ${word}`, exact: true });
          if (partIndex % 2) await target.tap();
          else { await target.focus(); await page.keyboard.press("Enter"); }
          await expect(target).toHaveAttribute("aria-pressed", "true");
          await player.locator('[data-rr="cast"]').tap();
          await expect(player.locator('[data-rr="status"]')).toHaveText(`${word} fits!`, { timeout: 5000 });
          await expect(player.locator('[data-rr="cast"]')).toHaveText("CAST", { timeout:5000 });
        }
        await expect(player.locator('[data-rr="result"]')).toBeVisible();
        await expect(player.locator('[data-rr="result-assembly"]')).toContainText(level.target);
      }
    }
  });
}
