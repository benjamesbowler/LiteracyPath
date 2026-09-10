import { expect, test } from '@playwright/test';

const games = ['rocket-run', 'sound-racer', 'word-bridge', 'rhyme-pop', 'sound-safari', 'reel-read', 'sound-beat', 'star-gallery'];
for (const game of games) {
  test(`${game} keeps its animated arcade playfield rather than staged confirmation rounds`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(id => localStorage.setItem(`lp-arcade-onboarded-v1:${id}`, '1'), game);
    await page.goto(`/preview/game-overlay.html?game=${game}&sound=0&music=0`);
    await expect(page.locator('.lg-game-loading')).toHaveCount(0, { timeout: 40_000 });
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    await expect(page.getByRole('button', { name: /^(Fly through|Drive through|Next delivery|Next basket)$/i })).toHaveCount(0);
    if (game === 'rocket-run' || game === 'sound-racer') {
      const attribute = game === 'rocket-run' ? 'data-rocket-lane' : 'data-sound-racer-lane';
      const hud = page.locator(`[${attribute}]`);
      await page.getByRole('button', { name: 'Steer left', exact: true }).click();
      await expect(hud).toHaveAttribute(attribute, '0');
      await page.getByRole('button', { name: 'Steer right', exact: true }).click();
      await expect(hud).toHaveAttribute(attribute, '1');
    }
    const first = await canvas.screenshot();
    await page.waitForTimeout(700);
    expect((await canvas.screenshot()).equals(first), 'the playfield should advance without a confirmation click').toBe(false);
    await page.getByRole('button', { name: /^Close / }).click();
    await expect(page.getByRole('button', { name: /Keep playing/i })).toBeVisible();
    expect(errors).toEqual([]);
  });
}
