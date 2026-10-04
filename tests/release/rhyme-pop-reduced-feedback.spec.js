import { test, expect } from '@playwright/test';
import { openRhyme, acceptRhyme, currentRhymeLevel, readRhyme } from './helpers/rhymePopNative.js';
import { RHYME_POP_ART } from '../../src/components/learn/games/games/rhymePopArtData.js';

test('reduced motion keeps genuine native shots while the actual painted reward ribbon stays still', async ({ page }) => {
  const kit = RHYME_POP_ART['meadow-launcher-kit-v1'], rect = kit.parts.ribbon;
  await page.addInitScript(({ runtime, source }) => {
    const original = CanvasRenderingContext2D.prototype.drawImage;
    window.__rhymeRibbonPaints = [];
    CanvasRenderingContext2D.prototype.drawImage = function(image, ...args) {
      if (image?.src?.endsWith(runtime) && args.length === 8 && args[0] === source[0] && args[1] === source[1]
        && args[2] === source[2]-source[0] && args[3] === source[3]-source[1]) {
        if (window.__rhymeRibbonPaints.length < 128) window.__rhymeRibbonPaints.push({ x: args[4], y: args[5], alpha: this.globalAlpha, at: performance.now() });
      }
      return original.call(this, image, ...args);
    };
  }, { runtime: kit.runtime, source: rect });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openRhyme(page);
  await acceptRhyme(page, await currentRhymeLevel(page));
  await page.waitForFunction(() => window.__rhymeRibbonPaints.length >= 5);
  const still = await page.evaluate(() => window.__rhymeRibbonPaints);
  expect(new Set(still.map(row => row.y)).size).toBe(1);
  expect(still.every(row => row.alpha === 1)).toBe(true);
  expect(still.at(-1).at-still[0].at).toBeGreaterThan(40);
  await page.waitForTimeout(550);
  await page.evaluate(() => { window.__rhymeRibbonPaints = []; });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await acceptRhyme(page, await currentRhymeLevel(page));
  await page.waitForFunction(() => window.__rhymeRibbonPaints.length >= 5);
  const moving = await page.evaluate(() => window.__rhymeRibbonPaints);
  expect(new Set(moving.map(row => row.y)).size).toBeGreaterThan(1);
  expect(moving.some(row => row.alpha < 1)).toBe(true);
  const state = await readRhyme(page);
  expect(state.acceptedWords).toHaveLength(2);
  expect(state.evidence.firstResponses).toHaveLength(2);
  expect(state.evidence.firstResponses.every(row => row.correct && row.deliveryReceipt)).toBe(true);
  await test.info().attach('actual-painted-reduced-feedback', { body: JSON.stringify({ still, moving, state }), contentType: 'application/json' });
});
