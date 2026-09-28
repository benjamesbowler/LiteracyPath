import { expect, test } from '@playwright/test';

async function launch(page, game, viewport = { width: 1024, height: 768 }) {
  await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 2 });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 2 });
    // Exercise 10fps rendering: simulation must retain real-time pace.
    window.requestAnimationFrame = callback => window.setTimeout(() => callback(performance.now()), 100);
    window.cancelAnimationFrame = id => window.clearTimeout(id);
  });
  await page.clock.install();
  await page.goto(`/preview/game-overlay.html?game=${game}&sound=0&music=0`);
}

const fishState = page => page.locator('[data-reel-hook-state]').evaluate(node => node.fishingInspection);
const racerState = page => page.locator('.sound-racer').evaluate(node => node.racerInspection);

async function hookExpectedFish(page) {
  let held = '';
  let hooked = null;
  for (let i = 0; i < 240; i++) {
    const state = await fishState(page);
    if (state.hookState === 'reeling') { hooked = state; break; }
    if (state.hookState !== 'ready') { await page.clock.runFor(100); continue; }
    const fish = state.fish.find(item => item.word === state.expectedWord);
    if (!fish) { await page.clock.runFor(100); continue; }
    const dropSeconds = (fish.y - state.rodTip.y) / state.hookSpeed;
    const aim = fish.x + fish.vx * dropSeconds;
    const error = aim - state.rodTip.x;
    const desired = error < -28 ? 'ArrowLeft' : error > 28 ? 'ArrowRight' : '';
    if (desired !== held) {
      if (held) await page.keyboard.up(held);
      if (desired) await page.keyboard.down(desired);
      held = desired;
    }
    if (!desired) await page.keyboard.down('Space');
    await page.clock.runFor(100);
  }
  if (held) await page.keyboard.up(held);
  expect(hooked, 'the child can line up and hook the printed target using the actual keys').not.toBeNull();
  return hooked;
}

test('Sound Racer responsive steering, safe bends and low-frame-rate travel preserve reading', async ({ page }, info) => {
  test.setTimeout(240000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await launch(page, 'sound-racer');
  const hud = page.locator('[data-sound-racer-position]');
  await expect(hud).toBeVisible({ timeout: 45000 });
  await expect(hud).toHaveAttribute('data-sound-racer-asset', 'ready', { timeout: 30000 });
  await page.clock.runFor(500);
  const before = await racerState(page);
  await page.keyboard.down('ArrowRight');
  await page.clock.runFor(700);
  await page.keyboard.up('ArrowRight');
  await page.clock.runFor(500);
  const steered = JSON.parse(await hud.getAttribute('data-sound-racer-position'));
  expect(steered.lateral).toBeGreaterThan(1);
  await page.getByRole('button', { name: 'Close Sound Racer', exact: true }).click();
  const stopped = await racerState(page);
  await page.clock.runFor(1500);
  expect((await racerState(page)).progress).toBe(stopped.progress);
  await page.getByRole('button', { name: /Keep playing/i }).click();
  const soundToggle = page.getByRole('button', { name: /spoken audio and game sounds/i });
  await soundToggle.click();
  await soundToggle.click();
  await page.keyboard.down('ArrowLeft');
  await page.clock.runFor(650);
  await page.keyboard.up('ArrowLeft');
  await page.clock.runFor(10000);
  const after = await racerState(page);
  expect(after.timeMs - before.timeMs).toBeGreaterThan(11000);
  expect(after.progress - before.progress).toBeGreaterThan(95);
  const position = JSON.parse(await hud.getAttribute('data-sound-racer-position'));
  expect(position.recoveries).toBe(0);
  expect(errors).toEqual([]);
  await page.screenshot({ path: info.outputPath('sound-racer-assisted-bend.png') });
});

test('Reel and Read readable target, short key taps and prompt physical catches', async ({ page }, info) => {
  test.setTimeout(240000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await launch(page, 'reel-read');
  const target = page.locator('[data-rr-target]');
  await expect(target).toBeVisible({ timeout: 40000 });
  await expect.poll(async () => (await fishState(page))?.phase).toBe('playing');
  expect(await target.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(32);
  const start = await fishState(page);
  await page.keyboard.press('ArrowRight');
  const afterRight = (await fishState(page)).boatX;
  expect(afterRight).toBeGreaterThan(start.boatX + 10);
  await page.getByRole('button', { name: 'Move left', exact: true }).click();
  expect((await fishState(page)).boatX).toBeLessThan(afterRight - 10);
  const hooked = await hookExpectedFish(page);
  await page.keyboard.down('Space');
  await page.clock.runFor(3200);
  await page.keyboard.up('Space');
  const landed = await fishState(page);
  expect(landed.wordsCaught).toBe(hooked.wordsCaught + 1);
  expect(landed.mistakes).toBe(hooked.mistakes);
  expect(landed.hookState).toBe('ready');
  await page.screenshot({ path: info.outputPath('reel-read-landed-word.png') });
  expect(errors).toEqual([]);
});

test('Reel and Read finishes the final pond directly after the last landed word', async ({ page }, info) => {
  test.setTimeout(180000);
  await page.addInitScript(() => localStorage.setItem('literacy-guide-learn-games:fullscreen-overlay-preview', JSON.stringify({ games: { 'reel-read': { checkpoints: { easy: { level: 9, totalLevels: 10, sessionSeed: 0, chapter: 0 } } } } })));
  await launch(page, 'reel-read');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('[data-rr-target]')).toBeVisible({ timeout: 40000 });
  for (let index = 0; index < 2; index++) {
    await hookExpectedFish(page);
    await page.keyboard.down('Space');
    await page.clock.runFor(3600);
    await page.keyboard.up('Space');
  }
  await expect(page.getByRole('button', { name: 'Next trail', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /whistle|bell|finish fishing/i })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('reel-read-complete.png') });
});

for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`Reel and Read target and controls fit ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
    await launch(page, 'reel-read', viewport);
    await expect(page.locator('[data-rr-target]')).toBeVisible({ timeout: 40000 });
    const target = await page.locator('[aria-label="Fishing word target"]').boundingBox();
    expect(target.x).toBeGreaterThanOrEqual(0);
    expect(target.x + target.width).toBeLessThanOrEqual(viewport.width);
    if (viewport.height < 430) expect(target.height, 'compact cue leaves the angler visible').toBeLessThan(108);
    for (const name of ['Move left', 'Move right', 'Cast hook']) {
      const box = await page.getByRole('button', { name, exact: true }).boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(56);
      expect(box.height).toBeGreaterThanOrEqual(56);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    }
    await page.screenshot({ path: info.outputPath('reel-read-responsive.png') });
  });
}
