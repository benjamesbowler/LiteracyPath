import { expect, test } from '@playwright/test';
import { buildCyclePresentation } from '../../src/utils/present/presentationBuilder.js';

async function readinessVoice(page, duration = 1500) {
  await page.addInitScript(duration => {
    window.__presentVoices = [];
    window.Audio = class PreparationVoice extends EventTarget {
      constructor(src) { super(); this.src = src; this.paused = true; this.ended = false; this.currentTime = 0; this.duration = duration / 1000; this.remaining = duration; this.timer = null; window.__presentVoices.push(this); }
      play() {
        this.paused = false; this.started = performance.now();
        this.timer = setTimeout(() => { this.timer = null; this.paused = true; this.ended = true; this.dispatchEvent(new Event('ended')); }, this.remaining);
        this.dispatchEvent(new Event('playing')); return Promise.resolve();
      }
      pause() { if (this.timer !== null) { clearTimeout(this.timer); this.remaining = Math.max(0, this.remaining - (performance.now() - this.started)); } this.timer = null; this.paused = true; }
    };
  }, duration);
}

async function writing(page) {
  const deck = buildCyclePresentation('cycle-3', { day: 'monday', format: 'extended' });
  await page.route('**/learning-pace-present', route => route.fulfill({ contentType: 'text/html', body: deck.html }));
  await page.goto('/learning-pace-present');
  await page.getByRole('button', { name: 'Start presentation', exact: true }).click();
  await page.getByRole('button', { name: 'Choose a slide', exact: true }).click();
  await page.locator(`[data-go-slide="${deck.slideIndex.find(slide => slide.cls === 'p-writing').index}"]`).click();
  return page.locator('.slide.active');
}
async function ink(slide) {
  return slide.locator('[data-write-stroke]').evaluateAll(paths => paths.map(path => ({ length: path.getTotalLength(), remaining: Number(path.style.strokeDashoffset) })));
}
for (const reduced of [false, true]) test(`Present holds preparation, ordered persistent formation and teacher progression (${reduced ? 'reduced' : 'normal'} motion)`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
  await readinessVoice(page);
  await page.clock.install();
  const slide = await writing(page);
  const initial = await ink(slide);
  await page.clock.runFor(7000);
  expect(await ink(slide)).toEqual(initial);
  await expect(slide.locator('[data-write-status]')).toContainText('Your teacher will start');
  await slide.getByRole('button', { name: 'Write with me', exact: true }).click();
  await page.clock.runFor(2900);
  expect(await ink(slide)).toEqual(initial);
  await page.clock.runFor(900);
  const during = await ink(slide);
  if (!reduced) expect(during[0].remaining).toBeGreaterThan(0);
  expect(during.slice(1)).toEqual(initial.slice(1));
  await page.clock.runFor(20000);
  expect((await ink(slide)).every(path => path.remaining === 0)).toBe(true);
  await expect(slide).toHaveClass(/p-writing/);
  await expect(slide.locator('[data-write-status]')).toContainText('Your turn');
  await page.clock.runFor(20000);
  expect((await ink(slide)).every(path => path.remaining === 0)).toBe(true);
  await slide.getByRole('button', { name: 'Watch again', exact: true }).click();
  expect(await ink(slide)).toEqual(initial);
  await page.locator('#next').click();
  await page.clock.runFor(20000);
  await expect(page.locator('.slide.active')).not.toHaveClass(/p-writing/);
});

test('Present waits for the full spoken readiness cue, pauses it, and cancels repeat on teacher Stop', async ({ page }) => {
  await readinessVoice(page, 7000);
  await page.clock.install();
  const slide = await writing(page);
  const initial = await ink(slide);
  await expect(slide).toHaveAttribute('data-writing-ready-audio', /get-your-air-writing-finger-ready-point-your-finger-/);
  await slide.getByRole('button', { name: 'Watch the pencil', exact: true }).click();
  await page.clock.runFor(4000);
  expect(await ink(slide)).toEqual(initial);
  await expect(slide.locator('[data-write-status]')).toContainText('listen to the instruction');
  await page.locator('#blank-toggle').click();
  const remaining = await page.evaluate(() => window.__presentVoices.at(-1).remaining);
  await page.clock.runFor(5000);
  expect(await ink(slide)).toEqual(initial);
  expect(await page.evaluate(() => window.__presentVoices.at(-1).remaining)).toBe(remaining);
  expect(await page.evaluate(() => window.__presentVoices.at(-1).paused)).toBe(true);
  await page.locator('#blank-screen').click();
  await page.clock.runFor(2900);
  expect(await ink(slide)).toEqual(initial);
  await page.clock.runFor(600);
  const during = await ink(slide);
  expect(during[0].remaining).toBeLessThan(initial[0].remaining);
  await slide.getByRole('button', { name: 'Stop writing', exact: true }).click();
  const stopped = await ink(slide);
  await page.clock.runFor(20000);
  expect(await ink(slide)).toEqual(stopped);
  await expect(slide.locator('[data-write-status]')).toContainText('Stopped');
  await slide.getByRole('button', { name: 'Watch again', exact: true }).click();
  expect(await ink(slide)).toEqual(initial);
  await page.locator('#next').click();
  expect(await page.evaluate(() => window.__presentVoices.filter(audio => audio.src.includes('get-your-air-writing-finger-ready')).at(-1).paused)).toBe(true);
  await page.clock.runFor(10000);
  await expect(page.locator('.slide.active')).not.toHaveClass(/p-writing/);
});
