import { expect, test } from '@playwright/test';

for (const game of ['star-gallery', 'grammar-grind']) {
  for (const viewport of [{ width: 844, height: 390 }, { width: 390, height: 844 }, { width: 568, height: 320 }]) {
    test(`${game} keeps its prompt and loaded pictures clear of movement at ${viewport.width}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(`/preview/game-overlay.html?game=${game}&sound=1&music=0`);
      const panel = page.locator(game === 'star-gallery' ? '[data-role="prompt-panel"]' : '[data-gg-panel="center"]');
      await expect(panel).toBeVisible();
      if (game === 'star-gallery') {
        const picture = page.locator('[data-role="picture-image"]');
        await expect.poll(() => picture.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
        await expect(picture).toHaveAttribute('alt', 'A cat');
      }
      const main = await page.locator('.lg-game-player-main').boundingBox();
      const prompt = await panel.boundingBox();
      expect(prompt.x).toBeGreaterThanOrEqual(0);
      expect(prompt.x + prompt.width).toBeLessThanOrEqual(viewport.width);
      expect(prompt.y + prompt.height).toBeLessThan(main.y + main.height * 0.52);
      const controls = page.locator(game === 'star-gallery' ? '[data-role="move-controls"] button, [data-role="steer-controls"] button' : '[data-gg-btn]');
      for (const button of await controls.all()) {
        if (!(await button.isVisible())) continue;
        const bounds = await button.boundingBox();
        expect(bounds.y).toBeGreaterThan(prompt.y + prompt.height);
        expect(bounds.width).toBeGreaterThanOrEqual(56);
        expect(bounds.height).toBeGreaterThanOrEqual(56);
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
        await button.click({ trial: true });
      }
      for (const button of await page.locator('.lg-game-player-actions button').all()) await button.click({ trial: true });
    });
  }
}
