import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1024, height: 768 }, hasTouch: true });
test.setTimeout(180_000);
const snapshot = page => page.evaluate(() => window.__arcadePreviewSnapshot());

async function open(page) {
  await page.goto('/preview/game-overlay.html?game=tower-tumble&difficulty=easy&sound=0&music=0');
  await expect(page.locator('.tower-tumble')).toBeVisible({ timeout: 90_000 });
  await expect.poll(async () => (await snapshot(page)).renderer, { timeout: 60_000 }).toMatch(/3d|drawing/);
  await page.locator('.tower-tumble').focus();
  // Stop time between real input events, then advance the actual rAF/physics
  // loop. This reproduces a tap whose release arrives before the next frame.
  await page.clock.install({ time: new Date('2026-10-13T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-13T00:01:00Z'));
}

async function hold(page, key, ms) {
  await page.keyboard.down(key);
  await page.clock.runFor(ms);
  await page.keyboard.up(key);
}

test('short keyboard and native touch jump taps survive release, consume once and preserve learning', async ({ page }, info) => {
  await open(page);
  const initial = await snapshot(page);
  await page.keyboard.press('Space');
  expect((await snapshot(page)).position.y).toBe(initial.position.y);
  await page.clock.runFor(80);
  expect((await snapshot(page)).position.y).toBeGreaterThan(.3);
  await page.clock.runFor(1000);
  expect((await snapshot(page)).position.y).toBe(0);
  const jump = await page.getByRole('button', { name: 'Jump', exact: true }).boundingBox();
  await page.touchscreen.tap(jump.x + jump.width / 2, jump.y + jump.height / 2);
  await page.clock.runFor(80);
  expect((await snapshot(page)).position.y).toBeGreaterThan(.3);
  await page.screenshot({ path: info.outputPath('tablet-native-jump.png') });
  await page.clock.runFor(1100);
  const landed = await snapshot(page);
  expect(landed.position.y).toBe(0);
  expect(landed.evidence).toEqual(initial.evidence);
  expect(landed.motion.jumpBuffer).toBe(0);
});

test('pressing jump during the final descent launches on landing without a second press', async ({ page }, info) => {
  await open(page);
  await page.keyboard.press('Space');
  await page.clock.runFor(120);
  for (let i = 0; i < 50; i++) {
    const state = await snapshot(page);
    if (state.motion.verticalVelocity < 0 && state.position.y < .65) break;
    await page.clock.runFor(16);
  }
  const descending = await snapshot(page);
  expect(descending.position.y).toBeGreaterThan(0);
  expect(descending.position.y).toBeLessThan(.65);
  expect(descending.motion.verticalVelocity).toBeLessThan(0);
  await page.keyboard.press('Space');
  await page.clock.runFor(180);
  const jumped = await snapshot(page);
  expect(jumped.position.y).toBeGreaterThan(.4);
  expect(jumped.motion.verticalVelocity).toBeGreaterThan(0);
  expect(jumped.evidence.firstResponses).toEqual([]);
  await page.screenshot({ path: info.outputPath('tablet-buffered-landing.png') });
  await page.clock.runFor(1000);
  expect((await snapshot(page)).position.y).toBe(0);
});

test('a late press after walking off a real scaffold uses brief ledge grace', async ({ page }, info) => {
  await open(page);
  // The child's existing Reach bricks panel rests barrels while leaving
  // manual traversal available. Isolate ledge timing from unrelated contact.
  await page.getByRole('button', { name: 'Reach bricks', exact: true }).focus();
  await page.keyboard.press('Enter');
  expect((await snapshot(page)).hazardsResting).toBe(true);
  await page.locator('.tower-tumble').focus();
  // Traverse the original wall, ladder and platform using real keyboard input.
  await hold(page, 'ArrowRight', 2200);
  await page.keyboard.press('e');
  await hold(page, 'ArrowRight', 500);
  await hold(page, 'ArrowUp', 760);
  const ledge = await snapshot(page);
  expect(ledge.position.y).toBe(3);
  expect(ledge.position.x).toBe(6);
  await hold(page, 'ArrowRight', 400);
  const departed = await snapshot(page);
  expect(departed.position.x).toBeGreaterThan(8);
  expect(departed.motion.grounded).toBe(false);
  expect(departed.motion.ledgeGrace).toBeGreaterThan(0);
  await page.keyboard.press('Space');
  await page.clock.runFor(80);
  const recovered = await snapshot(page);
  expect(recovered.position.y).toBeGreaterThan(3);
  expect(recovered.motion.verticalVelocity).toBeGreaterThan(0);
  expect(recovered.evidence.firstResponses).toEqual([]);
  await page.getByRole('button', { name: 'Hide bricks', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.screenshot({ path: info.outputPath('tablet-ledge-grace.png') });
});

test('pause, blur and hidden-tab boundaries discard pending jumps before resuming', async ({ page }) => {
  await open(page);
  await page.keyboard.press('Space');
  await page.getByRole('button', { name: 'Pause Tower Tumble', exact: true }).focus();
  await page.keyboard.press('Enter');
  expect((await snapshot(page)).paused).toBe(true);
  expect((await snapshot(page)).motion.jumpBuffer).toBe(0);
  await page.getByRole('button', { name: 'Resume game', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.clock.runFor(120);
  expect((await snapshot(page)).position.y).toBe(0);
  await page.locator('.tower-tumble').focus();
  await page.keyboard.press('Space');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.clock.runFor(120);
  expect((await snapshot(page)).position.y).toBe(0);
  await page.keyboard.press('Space');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect((await snapshot(page)).motion.jumpBuffer).toBe(0);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.runFor(120);
  expect((await snapshot(page)).position.y).toBe(0);
  await page.keyboard.press('Space');
  await page.clock.runFor(80);
  expect((await snapshot(page)).position.y).toBeGreaterThan(.3);
});

test('releasing one movement input keeps an overlapping keyboard or pointer hold active', async ({ page }) => {
  await open(page);
  const right = await page.getByRole('button', { name: 'Move right', exact: true }).boundingBox();
  await page.keyboard.down('ArrowRight');
  await page.mouse.move(right.x + right.width / 2, right.y + right.height / 2);
  await page.mouse.down();
  await page.clock.runFor(80);
  await page.mouse.up();
  const pointerReleased = (await snapshot(page)).position.x;
  await page.clock.runFor(80);
  expect((await snapshot(page)).position.x).toBeGreaterThan(pointerReleased + .2);
  await page.mouse.down();
  await page.keyboard.up('ArrowRight');
  const keyboardReleased = (await snapshot(page)).position.x;
  await page.clock.runFor(80);
  expect((await snapshot(page)).position.x).toBeGreaterThan(keyboardReleased + .2);
  await page.mouse.up();
  await page.keyboard.down('ArrowRight');
  await page.keyboard.down('d');
  await page.keyboard.up('ArrowRight');
  const aliasHeld = (await snapshot(page)).position.x;
  await page.clock.runFor(80);
  expect((await snapshot(page)).position.x).toBeGreaterThan(aliasHeld + .2);
  await page.keyboard.up('d');
  const stopped = (await snapshot(page)).position.x;
  await page.clock.runFor(80);
  expect((await snapshot(page)).position.x).toBe(stopped);
  expect((await snapshot(page)).evidence.firstResponses).toEqual([]);
});
