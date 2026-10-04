import { test, expect } from '@playwright/test';
import { openRhyme, readRhyme, readRhymeFrame, fireRhyme, acceptRhyme, currentRhymeLevel } from './helpers/rhymePopNative.js';

test.use({ trace: 'off', viewport: { width: 1366, height: 768 } });
const level = currentRhymeLevel;

test('fixed wrong choices, accepted rhyme and first wrong survive reload and supported automatic completion', async ({ page }) => {
  test.setTimeout(90000);
  await openRhyme(page);
  const wrong = (await readRhymeFrame(page)).bubbles.find(r => r.kind === 'distractor');
  const original = (await readRhymeFrame(page)).bubbles.map(({ id, word, slot }) => ({ id, word, slot }));
  for (let index = 0; index < 2; index++) {
    await fireRhyme(page, wrong.id, await level(page, 'easy'));
    expect((await readRhymeFrame(page)).bubbles.map(({ id, word, slot }) => ({ id, word, slot }))).toEqual(original);
  }
  await expect(page.locator('[data-rhyme-hint]:visible')).toHaveCount(1);
  await acceptRhyme(page, await level(page, 'easy'));
  const before = await readRhyme(page);
  await page.reload();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.waitForFunction(() => window.__arcadePreviewSnapshot?.()?.performance?.delivered);
  const restored = await readRhyme(page);
  expect(restored.currentTask).toEqual(before.currentTask);
  expect(restored.acceptedWords).toEqual(before.acceptedWords);
  expect(restored.hintMistakes).toBe(2);
  expect(restored.bubbles.map(({ id, word, slot }) => ({ id, word, slot }))).toEqual(before.bubbles.map(({ id, word, slot }) => ({ id, word, slot })));
  expect(restored.evidence.firstResponses).toEqual(before.evidence.firstResponses);
  expect(restored.evidence.assistedRetries).toEqual(before.evidence.assistedRetries);
  await expect(page.locator('[data-rhyme-hint]:visible')).toHaveText('Listen to the ending sound.');
  for (let index = restored.acceptedWords.length; index < 6; index++) await acceptRhyme(page, await level(page, 'easy'));
  const completed = await readRhyme(page);
  expect(completed.roundPendingAdvance).toBe(true);
  expect(completed.evidence.completions[0].supported).toBe(true);
  expect(completed.evidence.firstResponses[0].correct).toBe(false);
  expect(completed.evidence.assistedRetries.some(r => r.correct)).toBe(true);
  await page.waitForFunction(() => window.__arcadePreviewSnapshot().stage === 1, null, { timeout: 15000 });
  await test.info().attach('actual-rhyme-prefix-reload', { body: JSON.stringify({ before, restored, completed }), contentType: 'application/json' });
});

test('Tools cancel a queued pressure shot and freeze audio, motion, evidence and resized Canvas', async ({ page }) => {
  await openRhyme(page);
  await page.locator('.lg-game-player-main').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space');
  await page.getByRole('button', { name: 'Open game controls', exact: true }).click();
  const paused = await readRhyme(page);
  await page.setViewportSize({ width: 568, height: 320 });
  await page.waitForTimeout(350);
  const held = await readRhyme(page);
  expect(held.paused).toBe(true);
  expect(held.elapsedSeconds).toBe(paused.elapsedSeconds);
  expect(held.shots).toEqual(paused.shots);
  expect(held.evidence).toEqual(paused.evidence);
  const paint = await page.locator('.rp-authored-world').evaluate(c => {
    const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let colored = 0; for (let i = 0; i < data.length; i += 4) if (data[i] !== data[i + 1] || data[i + 1] !== data[i + 2]) colored++;
    return { colored, total: data.length / 4 };
  });
  expect(paint.colored).toBeGreaterThan(paint.total * .25);
  await page.keyboard.press('Escape');
  const resumed = await readRhymeFrame(page);
  await page.keyboard.press('ArrowRight');
  expect((await readRhymeFrame(page)).keyboardBubbleId).not.toBe(resumed.keyboardBubbleId);
  await test.info().attach('actual-pressure-pause-resize', { body: JSON.stringify({ paused, held, paint, resumed }), contentType: 'application/json' });
});

test('pagehide and repeated or outside-focus keys cannot create delayed pressure shots', async ({ page }) => {
  await openRhyme(page);
  await page.locator('.lg-game-player-main').focus();
  await page.keyboard.down('ArrowRight');
  const once = await readRhymeFrame(page);
  await page.keyboard.down('ArrowRight');
  expect((await readRhymeFrame(page)).keyboardBubbleId).toBe(once.keyboardBubbleId);
  await page.keyboard.up('ArrowRight');
  await page.getByRole('button', { name: 'Open game controls', exact: true }).focus();
  const before = await readRhyme(page);
  await page.keyboard.press('ArrowRight');
  expect((await readRhymeFrame(page)).keyboardBubbleId).toBe(before.keyboardBubbleId);
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  const hidden = await readRhyme(page);
  await page.waitForTimeout(250);
  const held = await readRhyme(page);
  expect(held.paused).toBe(true);
  expect(held.elapsedSeconds).toBe(hidden.elapsedSeconds);
  expect(held.evidence).toEqual(hidden.evidence);
});

test('blocked recordings permit physical completion without a teaching-end or independent learning claim', async ({ page }) => {
  test.setTimeout(60000);
  await page.route('**/*.mp3', route => route.abort());
  await openRhyme(page, 'easy', { waitForCue: false });
  for (let index = 0; index < 6; index++) await acceptRhyme(page, await level(page, 'easy'));
  const completed = await readRhyme(page);
  expect(completed.roundPendingAdvance).toBe(true);
  expect(completed.evidence.audioReceipts).toEqual([]);
  expect(completed.evidence.firstResponses.every(r => r.deliveryAtResponse === 'pending' && !r.independentRhymePractice)).toBe(true);
  expect(completed.evidence.completions[0].supported).toBe(true);
});

test('local quota recovery saves exactly the accepted rhyme and immutable history', async ({ page }) => {
  test.setTimeout(60000);
  await openRhyme(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    window.__restoreRhymeStorage = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function (key, value) {
      if (String(key).includes('learn-games')) throw new DOMException('Injected local quota', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await acceptRhyme(page, await level(page, 'easy'));
  const blocked = await readRhyme(page);
  await expect(page.getByRole('button', { name: 'Try saving again', exact: true })).toBeVisible();
  await page.evaluate(() => window.__restoreRhymeStorage());
  await page.getByRole('button', { name: 'Try saving again', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Try saving again', exact: true })).toHaveCount(0);
  expect((await readRhyme(page)).evidence.firstResponses).toEqual(blocked.evidence.firstResponses);
  await page.reload(); await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.waitForFunction(() => window.__arcadePreviewSnapshot?.()?.performance?.delivered);
  const saved = await readRhyme(page);
  expect(saved.acceptedWords).toEqual(blocked.acceptedWords);
  expect(saved.evidence.firstResponses).toEqual(blocked.evidence.firstResponses);
});

for (const [difficulty, asset] of [['easy', 'meadow-festival-v1'], ['medium', 'dino-launcher-kit-v1'], ['hard', 'pip-launcher-actions-v1']]) {
  test(`${difficulty} independently missing ${asset} keeps the original-art fallback and exact task after recovery`, async ({ page }) => {
    test.setTimeout(60000);
    let blocked = true;
    await page.route(`**/game-assets/physical-arcade/rhyme-pop/${asset}.webp`, route => blocked ? route.abort() : route.continue());
    await openRhyme(page, difficulty, { waitForArt: false });
    await page.waitForFunction(() => window.__arcadePreviewSnapshot().performance.playableFallback);
    await page.setViewportSize({ width: 320, height: 340 });
    await page.waitForTimeout(100);
    const retry = page.getByRole('button', { name: 'Reload festival art', exact: true });
    const recoveryBounds = await retry.boundingBox();
    expect(recoveryBounds.width).toBeGreaterThanOrEqual(56);
    expect(recoveryBounds.height).toBeGreaterThanOrEqual(56);
    expect(await retry.evaluate(element => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
    const field = await readRhymeFrame(page);
    for (const bubble of field.bubbles) {
      const nearestX = Math.max(recoveryBounds.x, Math.min(bubble.x, recoveryBounds.x+recoveryBounds.width));
      const nearestY = Math.max(recoveryBounds.y, Math.min(bubble.y, recoveryBounds.y+recoveryBounds.height));
      expect(Math.hypot(bubble.x-nearestX, bubble.y-nearestY)).toBeGreaterThan(bubble.r);
    }
    const hear = await page.getByRole('button', { name: 'Hear rhyme clue again', exact: true }).boundingBox();
    expect(recoveryBounds.x-hear.x-hear.width).toBeGreaterThanOrEqual(8);
    await page.screenshot({ path: test.info().outputPath(`${difficulty}-independent-art-fallback.png`) });
    await acceptRhyme(page, await level(page, difficulty));
    const before = await readRhyme(page);
    expect(before.performance.delivered).toBe(false);
    expect(before.performance.playableFallback).toBe(true);
    blocked = false;
    await page.getByRole('button', { name: 'Reload festival art', exact: true }).click();
    await page.waitForFunction(() => window.__arcadePreviewSnapshot().performance.delivered);
    const recovered = await readRhyme(page);
    expect(recovered.currentTask).toEqual(before.currentTask);
    expect(recovered.acceptedWords).toEqual(before.acceptedWords);
    expect(recovered.evidence.firstResponses).toEqual(before.evidence.firstResponses);
    await test.info().attach('independent-original-art-recovery', { body: JSON.stringify({ before, recovered }), contentType: 'application/json' });
  });
}
