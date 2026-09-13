import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 1467, height: 830 }, { width: 1024, height: 650 },
  { width: 768, height: 650 }, { width: 390, height: 844 },
  { width: 568, height: 320 }
]) {
  test(`sound choices have readable letters and balanced spacing at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const cycle of [1, 24]) {
      await page.goto(`/preview/child-surfaces.html?surface=adventure-map&quest=cycle-${cycle}&station=sounds`);
      const stage = page.locator('[data-mechanic-stage="sound-choice"]');
      await expect(stage).toBeVisible();
      await stage.getByRole("button").first().hover();
      const bounds = await stage.evaluate(element => {
        const stageRect = element.getBoundingClientRect();
        const buttons = [...element.querySelectorAll("button")].map(button => {
          const r = button.getBoundingClientRect();
          return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height,
            fontSize: parseFloat(getComputedStyle(button).fontSize),
            reachable: button.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)) };
        });
        return { center: (stageRect.left + stageRect.right) / 2, buttons,
          left: Math.min(...buttons.map(button => button.left)), right: Math.max(...buttons.map(button => button.right)) };
      });
      expect(Math.abs((bounds.left + bounds.right) / 2 - bounds.center)).toBeLessThan(2);
      for (const button of bounds.buttons) {
        expect(button.width).toBeGreaterThanOrEqual(100);
        expect(button.height).toBeGreaterThanOrEqual(100);
        expect(button.fontSize).toBeGreaterThanOrEqual(48);
        expect(button.reachable).toBe(true);
        expect(button.top).toBeGreaterThanOrEqual(0);
        expect(button.bottom).toBeLessThanOrEqual(viewport.height);
      }
    }
    await page.screenshot({ path: `.artifacts/game-replay/sound-choices-${viewport.width}x${viewport.height}.png` });
  });
}

test("SoundKeys keeps its shuffled phrase on Continue and changes the run on Start over", async ({ page }) => {
  await page.goto("/preview/game-overlay.html?game=soundkeys&sound=0&music=0");
  const stage = page.locator(".sk-stage");
  await expect(stage).toBeVisible();
  const word = await stage.getAttribute("data-target");
  const tokens = await page.evaluate(async word => (await import("/src/features/soundkeys/content.js")).SOUNDKEY_WORDS.find(item => item.id === word).tokens, word);
  for (const token of tokens) {
    for (let bank = 0; bank < 3; bank++) {
      const key = page.locator(`.soundkeys-keyboard [data-token="${token}"]`);
      if (await key.count()) { await key.click(); break; }
      await page.getByRole("button", { name: "Next sound keys", exact: true }).click();
    }
  }
  await expect(stage).toHaveAttribute("data-round", "1");
  const checkpoint = () => page.evaluate(() => JSON.parse(localStorage.getItem("literacy-guide-learn-games:fullscreen-overlay-preview")).games.soundkeys.checkpoints.easy);
  const saved = await checkpoint();
  expect(saved.sessionSeed).toBeGreaterThan(0);
  const nextWord = await stage.getAttribute("data-target");
  await page.reload();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(stage).toHaveAttribute("data-target", nextWord);
  expect((await checkpoint()).sessionSeed).toBe(saved.sessionSeed);
  await page.reload();
  await page.getByRole("button", { name: "Start over", exact: true }).click();
  await expect(stage).toHaveAttribute("data-round", "0");
  await expect.poll(async () => (await checkpoint()).sessionSeed).not.toBe(saved.sessionSeed);
});

for (const game of ["word-bridge", "reel-read"]) {
  test(`${game} renders the target selected by its saved run seed`, async ({ page }) => {
    const targets = [];
    await page.addInitScript(() => {
        const params = new URLSearchParams(location.search);
        const game = params.get("game"), seed = Number(params.get("runSeed"));
        localStorage.setItem("literacy-guide-learn-games:fullscreen-overlay-preview", JSON.stringify({
          games: { [game]: { checkpoints: { easy: { level: 0, totalLevels: 10, sessionSeed: seed } } } }
        }));
        window.renderedGameText = [];
        const fillText = CanvasRenderingContext2D.prototype.fillText;
        CanvasRenderingContext2D.prototype.fillText = function (text, ...args) {
          if (!window.renderedGameText.includes(String(text))) window.renderedGameText.push(String(text));
          return fillText.call(this, text, ...args);
        };
    });
    for (const seed of [271, 941]) {
      await page.goto(`/preview/game-overlay.html?game=${game}&runSeed=${seed}&sound=0&music=0`);
      const target = await page.evaluate(async ({ game, seed }) => {
        const module = await import(`/src/utils/${game === "word-bridge" ? "wordBridgeLevels" : "reelReadLevels"}.js`);
        return module[game === "word-bridge" ? "wordBridgeLadder" : "reelReadLadder"]("easy", seed)[0].target;
      }, { game, seed });
      targets.push(target);
      if (game === "word-bridge") await expect(page.locator('[data-wb="target"]')).toHaveText(target.toUpperCase());
      else await expect.poll(() => page.evaluate(target => window.renderedGameText.some(text => text.toLowerCase().includes(target)), target)).toBe(true);
    }
    expect(targets[0]).not.toBe(targets[1]);
  });
}
