import { expect, test } from "@playwright/test";
import { wordStartsWithTargetSound } from "../../src/utils/rocketRunRounds.js";

async function open(page, difficulty = "easy", sound = 0) {
  await page.goto(`/preview/game-overlay.html?game=word-climb&difficulty=${difficulty}&sound=${sound}&music=0`);
  await expect(page.locator('[data-wc="choice"]')).toHaveCount(3);
  return page.locator(".word-climb");
}
async function choose(page, correct = true, keyboard = false) {
  const target = (await page.locator('[data-wc="target"]').innerText()).replaceAll("/", "");
  const choices = page.locator('[data-wc="choice"]');
  const words = await choices.locator("strong").allTextContents();
  const index = words.findIndex(word => wordStartsWithTargetSound(word, target) === correct);
  await expect(choices.nth(index)).toBeEnabled();
  const id = await choices.nth(index).getAttribute("data-ledge-id");
  if (keyboard) await choices.nth(index).press("Enter");
  else await choices.nth(index).click();
  return { id, word: words[index], target };
}

for (const [difficulty, summit] of [["easy", 6], ["medium", 8], ["hard", 10]]) {
  test(`${difficulty} completes a physical ascent with persistent landings through the summit`, async ({ page }) => {
    test.setTimeout(45_000);
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    const game = await open(page, difficulty);
    for (let row = 1; row <= summit; row++) {
      const { id } = await choose(page, true, row % 2 === 0);
      // Learning progress changes on collision/landing, never on button press.
      await expect(game).toHaveAttribute("data-wc-progress", String(row - 1));
      await expect(game).toHaveAttribute("data-motion-state", "airborne");
      await expect(game).toHaveAttribute("data-wc-progress", String(row));
      await expect(game).toHaveAttribute("data-standing-ledge", id);
      expect(Number(await game.getAttribute("data-world-height"))).toBe(row * 210);
      if (row < summit) {
        await expect(game).toHaveAttribute("data-motion-state", "grounded");
        await page.waitForTimeout(200);
        expect(Number(await game.getAttribute("data-world-height"))).toBe(row * 210);
        expect(Number(await game.getAttribute("data-camera-height"))).toBeGreaterThan((row - 1) * 210);
        const shelf = page.locator(`[data-ledge-id="${id}"]`);
        const feet = await page.locator(".wc-climber").boundingBox();
        const ledge = await shelf.boundingBox();
        expect(Math.abs(feet.y + feet.height - ledge.y)).toBeLessThan(12);
        expect(await shelf.getAttribute("data-world-y")).toBe(String(row * 210));
        const stage = await page.locator(".wc-world").boundingBox();
        for (const next of await page.locator('[data-wc="choice"]').all()) {
          const box = await next.boundingBox();
          expect(box.x).toBeGreaterThanOrEqual(stage.x);
          expect(box.x + box.width).toBeLessThanOrEqual(stage.x + stage.width);
          expect(box.y).toBeGreaterThanOrEqual(stage.y);
        }
        expect(await page.locator(".wc-world").evaluate(n => n.scrollLeft + n.scrollTop)).toBe(0);
      }
    }
    const finish = page.getByRole("alertdialog", { name: "Word Climb complete", exact: true });
    await expect(finish).toBeVisible();
    await expect(finish).toContainText(`${summit * 10} points`);
    await expect(finish).toContainText("Canopy reached");
    expect(errors).toEqual([]);
  });
}

test("a wrong leaf slips back locally, retains the geometry and supports a correct retry", async ({ page }) => {
  const game = await open(page);
  await choose(page);
  await expect(game).toHaveAttribute("data-motion-state", "grounded");
  const geometry = await page.locator('[data-wc="choice"]').evaluateAll(nodes => nodes.map(n => [n.dataset.ledgeId, n.dataset.worldX, n.dataset.worldY]));
  const { word, target } = await choose(page, false);
  await expect(page.locator('[data-wc="feedback"]')).toContainText(`${word} starts with /`);
  await expect(page.locator('[data-wc="feedback"]')).toContainText(`Try a /${target}/ word.`);
  await expect(game).toHaveAttribute("data-motion-state", "grounded");
  await expect(game).toHaveAttribute("data-wc-progress", "1");
  expect(Number(await game.getAttribute("data-world-height"))).toBe(210);
  expect(await page.locator('[data-wc="choice"]').evaluateAll(nodes => nodes.map(n => [n.dataset.ledgeId, n.dataset.worldX, n.dataset.worldY]))).toEqual(geometry);
  await choose(page);
  await expect(game).toHaveAttribute("data-wc-progress", "2");
});

test("quit freezes an airborne jump and continues the same flight without losing progress", async ({ page }) => {
  const game = await open(page);
  await choose(page);
  await page.getByRole("button", { name: "Close Word Climb", exact: true }).click();
  const quit = page.getByRole("alertdialog", { name: "Quit Word Climb", exact: true });
  await expect(quit).toBeVisible();
  const height = await game.getAttribute("data-world-height");
  await page.waitForTimeout(1100);
  await expect(game).toHaveAttribute("data-world-height", height);
  await expect(game).toHaveAttribute("data-wc-progress", "0");
  await quit.getByRole("button", { name: "Keep playing", exact: true }).click();
  await expect(game).toHaveAttribute("data-wc-progress", "1");
  await expect(game).toHaveAttribute("data-motion-state", "grounded");
});

test("hidden-page pause and checkpoint reload preserve the last physically landed height", async ({ page }) => {
  const game = await open(page);
  await choose(page);
  await expect(game).toHaveAttribute("data-wc-progress", "1");
  await choose(page);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const height = await game.getAttribute("data-world-height");
  await page.waitForTimeout(1000);
  await expect(game).toHaveAttribute("data-world-height", height);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(game).toHaveAttribute("data-wc-progress", "2");
  await page.reload();
  const resume = page.getByRole("alertdialog", { name: "Resume Word Climb", exact: true });
  await resume.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(game).toHaveAttribute("data-world-height", "420.00");
  await expect(game).toHaveAttribute("data-wc-progress", "2");
  await choose(page);
  await expect(game).toHaveAttribute("data-wc-progress", "3");
});

test("replay follows the live sound setting and the optional guide does not gate starting", async ({ page }) => {
  await open(page, "easy", 1);
  const replay = page.locator('[data-wc="replay"]');
  await expect(replay).toBeEnabled();
  await expect(page.locator('[data-wc="choice"]').first()).toBeEnabled();
  await page.getByRole("button", { name: "Turn spoken audio and game sounds off", exact: true }).click();
  await expect(replay).toBeDisabled();
  await expect(page.locator('[data-wc="target"]')).toBeVisible();
  await page.getByRole("button", { name: "Open Word Climb mission guide", exact: true }).click();
  const guide = page.getByRole("dialog", { name: "Word Climb mission guide", exact: true });
  await expect(guide).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(guide).toBeHidden();
});

for (const [width, height] of [[568, 320], [390, 844], [1024, 768]]) {
  test(`${width}x${height} keeps reachable ledges, target and touch controls visible`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await open(page);
    const hud = await page.locator(".wc-mission-card").boundingBox();
    for (const locator of [page.locator('[data-wc="choice"]'), page.locator(".wc-air-controls button"), page.locator('[data-wc="replay"]')]) {
      for (const element of await locator.all()) {
        const box = await element.boundingBox();
        expect(box.width).toBeGreaterThanOrEqual(56);
        expect(box.height).toBeGreaterThanOrEqual(56);
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
        expect(box.y + box.height).toBeLessThanOrEqual(height);
      }
    }
    for (const leaf of await page.locator('[data-wc="choice"]').all()) {
      expect((await leaf.boundingBox()).y).toBeGreaterThanOrEqual(hud.y + hud.height);
    }
    await choose(page);
    await expect(page.locator(".word-climb")).toHaveAttribute("data-wc-progress", "1");
  });
}


test("held air steering can miss a shelf without counting a wrong word", async ({ page }) => {
  const game = await open(page);
  await page.locator('[data-wc="choice"]').first().click();
  await game.focus();
  await page.keyboard.down("ArrowLeft");
  await expect(game).toHaveAttribute("data-motor-falls", "1");
  await page.keyboard.up("ArrowLeft");
  await expect(game).toHaveAttribute("data-motion-state", "grounded");
  await expect(game).toHaveAttribute("data-world-height", "0.00");
  await expect(game).toHaveAttribute("data-wc-progress", "0");
  await expect(game).toHaveAttribute("data-reading-errors", "0");
  await choose(page);
  await expect(game).toHaveAttribute("data-wc-progress", "1");
});

test("a real browser touch lands on the same destination shelf", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  try {
    const game = await open(page);
    const target = (await page.locator('[data-wc="target"]').innerText()).replaceAll("/", "");
    const words = await page.locator('[data-wc="choice"] strong').allTextContents();
    const leaf = page.locator('[data-wc="choice"]').nth(words.findIndex(w => wordStartsWithTargetSound(w, target)));
    const id = await leaf.getAttribute("data-ledge-id");
    await leaf.tap();
    await expect(game).toHaveAttribute("data-wc-progress", "1");
    await expect(game).toHaveAttribute("data-standing-ledge", id);
  } finally {
    await context.close();
  }
});
