import { test, expect } from '@playwright/test';

async function launch(page, difficulty = 'easy', { low = false, failAsset = false } = {}) {
  await page.setViewportSize({ width: 960, height: 600 });
  if (low) await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 2 });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 2 });
  });
  if (failAsset) await page.route('**/game-assets/sound-racer/models/pip-kart.glb', route => route.abort());
  await page.goto(`/preview/game-overlay.html?game=sound-racer&difficulty=${difficulty}&sound=0&music=0`);
  const hud = page.locator('[data-sound-racer-position]');
  await expect(hud).toBeVisible({ timeout: 45000 });
  await expect(hud).toHaveAttribute('data-sound-racer-asset', 'ready', { timeout: 30000 });
  await expect(hud).toHaveAttribute('data-sound-racer-scenery', 'ready', { timeout: 30000 });
  return hud;
}

test('authored racer initial scene and live steering/brake/pause motion', async ({ page }, info) => {
  test.setTimeout(60000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const hud = await launch(page);
  await page.clock.install();
  await info.attach('initial-scene', { body: JSON.stringify(await page.locator('.sound-racer').evaluate(node => node.racerInspection)), contentType: 'application/json' });
  await page.screenshot({ path: info.outputPath('meadow-authored-start.png') });
  await page.keyboard.down('ArrowLeft');
  await page.clock.runFor(300);
  await expect(hud).toHaveAttribute('data-sound-racer-driver', 'turn_left');
  await info.attach('steering-pose', { body: JSON.stringify(await page.locator('.sound-racer').evaluate(node => node.racerInspection)), contentType: 'application/json' });
  await page.screenshot({ path: info.outputPath('driver-left.png') });
  await page.keyboard.up('ArrowLeft');
  const roll = Number(await hud.getAttribute('data-sound-racer-wheel-roll'));
  await page.keyboard.down('ArrowDown');
  await page.clock.runFor(550);
  await expect(hud).toHaveAttribute('data-sound-racer-driver', 'brake');
  expect(Number(await hud.getAttribute('data-sound-racer-speed'))).toBeLessThan(6);
  expect(Number(await hud.getAttribute('data-sound-racer-wheel-roll'))).not.toBe(roll);
  await page.keyboard.up('ArrowDown');
  await page.getByRole('button', { name: 'Close Sound Racer', exact: true }).click();
  const state = await hud.getAttribute('data-sound-racer-position');
  const pausedRoll = await hud.getAttribute('data-sound-racer-wheel-roll');
  await page.keyboard.down('ArrowRight'); await page.keyboard.down('ArrowDown');
  await page.clock.runFor(800);
  expect(await hud.getAttribute('data-sound-racer-position')).toBe(state);
  expect(await hud.getAttribute('data-sound-racer-wheel-roll')).toBe(pausedRoll);
  await page.getByRole('button', { name: /Keep playing/i }).click();
  await page.clock.runFor(200);
  await expect(hud).toHaveAttribute('data-sound-racer-braking', 'false');
  await page.keyboard.up('ArrowRight'); await page.keyboard.up('ArrowDown');
  expect(errors).toEqual([]);
});

for (const difficulty of ['medium', 'hard']) test(`authored ${difficulty} scene keeps Pip and readable track lighting`, async ({ page }, info) => {
  test.setTimeout(60000);
  const hud = await launch(page, difficulty);
  await page.clock.install();
  await page.screenshot({ path: info.outputPath(`${difficulty}-authored-scene.png`) });
  await expect(hud).toHaveAttribute('data-sound-racer-driver', /drive|turn|recover/);
});

test('low quality and missing primary GLB retain the exact skinned driver', async ({ page }, info) => {
  test.setTimeout(60000);
  const hud = await launch(page, 'hard', { low: true, failAsset: true });
  await page.clock.install();
  await page.keyboard.down('ArrowRight'); await page.clock.runFor(280); await page.keyboard.up('ArrowRight');
  await expect(hud).toHaveAttribute('data-sound-racer-driver', 'turn_right');
  const inspection = await page.locator('.sound-racer').evaluate(node => node.racerInspection);
  expect(inspection.tier).toBe('low');
  expect(inspection.kart.recoveredAsset).toBe(true);
  expect(inspection.kart.wheelCount).toBe(4);
  expect(Math.abs(Number(await hud.getAttribute('data-sound-racer-wheel-roll')))).toBeGreaterThan(.01);
  await page.screenshot({ path: info.outputPath('low-tier-same-driver.png') });
});

test.describe('authored racer touch brake', () => {
  test.use({ hasTouch: true });
  for (const [width, height] of [[390, 844], [844, 390]]) test(`touch controls remain clear at ${width}x${height}`, async ({ page }, info) => {
    test.setTimeout(60000);
    const hud = await launch(page);
    await page.setViewportSize({ width, height });
    await page.clock.install();
    const brake = page.getByRole('button', { name: 'Hold to brake', exact: true });
    const box = await brake.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(56); expect(box.height).toBeGreaterThanOrEqual(56);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }] });
    await page.clock.runFor(400);
    await expect(hud).toHaveAttribute('data-sound-racer-braking', 'true');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await page.clock.runFor(80);
    await expect(hud).toHaveAttribute('data-sound-racer-braking', 'false');
    await page.screenshot({ path: info.outputPath(`authored-touch-${width}.png`) });
  });
});

test('real WebGL context recovery retains the authored driver and route state', async ({ page }, info) => {
  test.setTimeout(60000);
  const hud = await launch(page);
  await page.clock.install();
  const before = await page.locator('.sound-racer').evaluate(node => node.racerInspection);
  await page.locator('.sound-racer canvas').first().evaluate(canvas => {
    const gl = canvas.getContext('webgl2');
    const extension = gl.getExtension('WEBGL_lose_context');
    if (!extension) throw new Error('WEBGL_lose_context unavailable in desktop browser');
    canvas.__racerContextRecovery = extension;
    extension.loseContext();
  });
  await expect.poll(() => page.locator('.sound-racer').evaluate(node => node.racerInspection.paused)).toBe(true);
  const stopped = await hud.getAttribute('data-sound-racer-position');
  await page.clock.runFor(300);
  expect(await hud.getAttribute('data-sound-racer-position')).toBe(stopped);
  await page.locator('.sound-racer canvas').first().evaluate(canvas => canvas.__racerContextRecovery.restoreContext());
  await expect.poll(() => page.locator('.sound-racer').evaluate(node => node.racerInspection.paused)).toBe(false);
  await page.clock.runFor(200);
  const after = await page.locator('.sound-racer').evaluate(node => node.racerInspection);
  expect(after.kart.asset).toBe('ready');
  expect(after.kart.wheelCount).toBe(4);
  expect(after.progress).toBeGreaterThanOrEqual(before.progress);
  expect(after.progress - before.progress).toBeLessThan(8);
  await page.screenshot({ path: info.outputPath('context-restored.png') });
});

test('off-road recovery returns the authored driver without inventing a literacy error', async ({ page }, info) => {
  test.setTimeout(60000);
  const hud = await launch(page, 'easy', { low: true });
  await page.clock.install();
  await page.keyboard.down('ArrowRight');
  let state;
  for (let i = 0; i < 20; i++) {
    await page.clock.runFor(200);
    state = JSON.parse(await hud.getAttribute('data-sound-racer-position'));
    if (state.recoveries > 0) break;
  }
  await page.keyboard.up('ArrowRight');
  expect(state.recoveries).toBeGreaterThan(0);
  expect(state.wordsWrong).toBe(0);
  await expect(hud).toHaveAttribute('data-sound-racer-driver', 'recover');
  await expect(hud).toHaveAttribute('data-sound-racer-asset', 'ready');
  await page.screenshot({ path: info.outputPath('driver-offroad-recovery.png') });
  await page.clock.runFor(1000);
  await expect(hud).toHaveAttribute('data-sound-racer-driver', 'drive');
});
