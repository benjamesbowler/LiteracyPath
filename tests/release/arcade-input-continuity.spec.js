import { expect, test } from '@playwright/test';
import { GAME_LIST } from '../../src/data/learnGamesData.js';

for (const game of GAME_LIST.filter(game => game.surfaces?.includes('arcade'))) {
  test(`${game.id} hands focus back to play on entry and after help`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/preview/game-overlay.html?game=${game.id}&sound=0&music=0`);
    await expect(page.locator('.lg-game-loading')).toHaveCount(0, { timeout: 40_000 });
    const playfield = page.locator('.lg-game-player-main');
    await expect(playfield).toBeFocused();
    await page.getByRole('button', { name: `Open ${game.title} mission guide`, exact: true }).click();
    await page.getByRole('button', { name: 'Keep playing', exact: true }).click();
    await expect(playfield).toBeFocused();
    // Header controls retain native activation; they must not fire game actions.
    await page.getByRole('button', { name: `Close ${game.title}`, exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Keep playing', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(playfield).toBeFocused();
    expect(errors).toEqual([]);
  });
}

test('Rhyme Pop keeps keyboard aiming after sound control focus and resolves actual word shots', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await page.goto('/preview/game-overlay.html?game=rhyme-pop&sound=0&music=0');
  await expect.poll(() => page.evaluate(() => window.__arcadePreviewSnapshot?.()?.bubbles?.length)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Turn music on', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => page.evaluate(() => window.__arcadePreviewSnapshot().keyboardBubbleId)).toBeTruthy();
  await page.locator('.lg-game-player-main').focus();
  const initial = await page.evaluate(() => window.__arcadePreviewSnapshot());
  // Use the rendered equal-weight word choices and real aiming/collision path.
  for (let attempt = 0; attempt < 14; attempt++) {
    const state = await page.evaluate(() => window.__arcadePreviewSnapshot());
    if (state.score > initial.score) break;
    const target = state.bubbles.find(bubble => bubble.kind === 'rhyme' && !bubble.entering);
    if (!target) { await page.waitForTimeout(100); continue; }
    const canvas = await page.locator('main canvas').boundingBox();
    await page.mouse.click(canvas.x + target.x, canvas.y + target.y);
    await page.waitForTimeout(350);
  }
  await expect.poll(() => page.evaluate(() => window.__arcadePreviewSnapshot().score)).toBeGreaterThan(initial.score);
  await page.screenshot({ path: testInfo.outputPath('rhyme-pop.png') });
});

test('Sound Safari retains net movement after header focus and completes ordered sounds with pointer input', async ({ page }, testInfo) => {
  test.setTimeout(45_000);
  await page.goto('/preview/game-overlay.html?game=sound-safari&sound=0&music=0');
  await expect.poll(() => page.evaluate(() => window.__arcadePreviewSnapshot?.()?.critters?.length)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Turn music on', exact: true }).focus();
  const before = await page.evaluate(() => window.__arcadePreviewSnapshot().net.targetX);
  await page.keyboard.press('ArrowLeft');
  await expect.poll(() => page.evaluate(() => window.__arcadePreviewSnapshot().net.targetX)).toBeLessThan(before);
  for (let i = 0; i < 12; i++) {
    const state = await page.evaluate(() => window.__arcadePreviewSnapshot());
    if (state.taskIndex > 0) break;
    const target = state.critters.find(critter => critter.label === state.needed && !critter.hidden && !critter.caught);
    if (!target) { await page.waitForTimeout(150); continue; }
    const canvas = await page.locator('main canvas').boundingBox();
    const box = target.labelBox;
    await page.mouse.click(canvas.x + (box ? box.x + box.w / 2 : target.x), canvas.y + (box ? box.y + box.h / 2 : target.y));
    await page.waitForTimeout(200);
  }
  await expect.poll(() => page.evaluate(() => window.__arcadePreviewSnapshot().taskIndex)).toBeGreaterThan(0);
  await page.screenshot({ path: testInfo.outputPath('sound-safari.png') });
});

test('SoundKeys accepts letter typing after a touch key has focus and advances without confirmation', async ({ page }, testInfo) => {
  await page.goto('/preview/game-overlay.html?game=soundkeys&sound=0&music=0');
  const stage = page.locator('.sk-stage');
  await expect(stage).toBeVisible();
  const id = await stage.getAttribute('data-target');
  const tokens = await page.evaluate(async id => (await import('/src/features/soundkeys/content.js')).SOUNDKEY_WORDS.find(word => word.id === id).tokens, id);
  // Focus the instrument exactly as a preceding pointer tap would leave it.
  await page.locator('.soundkeys-keyboard button').first().focus();
  for (const token of tokens) await page.keyboard.press(token);
  await expect(stage).toHaveAttribute('data-round', '1');
  await page.screenshot({ path: testInfo.outputPath('soundkeys.png') });
});
