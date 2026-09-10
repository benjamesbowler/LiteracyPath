import { expect, test } from '@playwright/test';

const games = ['rocket-run', 'sound-racer', 'word-bridge', 'rhyme-pop', 'sound-safari', 'reel-read', 'sound-beat', 'star-gallery'];
for (const game of games) {
  test(`${game} keeps its animated arcade playfield rather than staged confirmation rounds`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/preview/game-overlay.html?game=${game}&sound=0&music=0`);
    await expect(page.locator('.lg-game-loading')).toHaveCount(0, { timeout: 40_000 });
    await expect(page.getByRole('dialog', { name: /instructions|how to play/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^(tap to play|play|to the yard)$/i })).toHaveCount(0);
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    await expect(page.getByRole('button', { name: /^(Fly through|Drive through|Next delivery|Next basket)$/i })).toHaveCount(0);
    if (game === 'rocket-run') {
      const attribute = 'data-rocket-lane';
      const hud = page.locator(`[${attribute}]`);
      await page.getByRole('button', { name: 'Steer left', exact: true }).click();
      await expect(hud).toHaveAttribute(attribute, '0');
      await page.getByRole('button', { name: 'Steer right', exact: true }).click();
      await expect(hud).toHaveAttribute(attribute, '1');
    }
    if (game === 'sound-racer') {
      const hud = page.locator('[data-sound-racer-position]');
      const before = JSON.parse(await hud.getAttribute('data-sound-racer-position'));
      await page.keyboard.down('ArrowLeft');
      await expect.poll(async () => JSON.parse(await hud.getAttribute('data-sound-racer-position')).heading).not.toBe(before.heading);
      await page.keyboard.up('ArrowLeft');
    }
    const first = await canvas.screenshot();
    await page.waitForTimeout(700);
    expect((await canvas.screenshot()).equals(first), 'the playfield should advance without a confirmation click').toBe(false);
    await page.getByRole('button', { name: /^Close / }).click();
    await expect(page.getByRole('button', { name: /Keep playing/i })).toBeVisible();
    expect(errors).toEqual([]);
  });
}
