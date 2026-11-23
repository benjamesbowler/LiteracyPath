import { expect, test } from '@playwright/test';
import { buildCyclePresentation } from '../../src/utils/present/presentationBuilder.js';

async function loadDeck(page, options = {}) {
  const deck = buildCyclePresentation('cycle-9', { day: 'tuesday', ...options });
  await page.route('**/present-controls-test', route => route.fulfill({
    contentType: 'text/html',
    body: deck.html,
  }));
  await page.goto('/present-controls-test');
  return deck;
}

test('Start owns keyboard focus and fullscreen rejection leaves a usable lesson', async ({ page }) => {
  await page.addInitScript(() => {
    Element.prototype.requestFullscreen = () => Promise.reject(new Error('Fullscreen refused by test'));
  });
  await loadDeck(page);
  const start = page.getByRole('button', { name: 'Start presentation' });
  await expect(start).toBeFocused();
  await expect(page.locator('#scaler')).toHaveJSProperty('inert', true);
  await page.keyboard.press('Tab');
  await expect(start).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('o');
  await page.keyboard.press('b');
  await expect(start).toBeFocused();
  await expect(page.locator('#counter')).toHaveText(/^1 \/ /);
  await expect(page.locator('#overview')).toBeHidden();
  await expect(page.locator('#blank-screen')).toBeHidden();
  await page.keyboard.press('Enter');
  await expect(start).toBeHidden();
  await expect(page.locator('#scaler')).toHaveJSProperty('inert', false);
  await expect(page.locator('#fullscreen-status')).toContainText('Continue in this window');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#counter')).toHaveText(/^2 \/ /);
});

test('Slides isolates keyboard focus, Reveal works from the toolbar, and Finish can return to Teach', async ({ page }) => {
  const deck = await loadDeck(page);
  await page.getByRole('button', { name: 'Start presentation' }).click();
  await page.keyboard.press('End');
  const finish = page.locator('#finish');
  await expect(finish).toBeFocused();
  await page.keyboard.press('o');
  const last = page.locator('#overview [data-go-slide]').last();
  await expect(last).toBeFocused();
  await expect(last).toBeInViewport();
  await expect(page.locator('#nav')).toHaveJSProperty('inert', true);
  await page.keyboard.press('Tab');
  await expect(page.locator('#overview-close')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#overview-toggle')).toBeFocused();

  const question = deck.slideIndex.find(slide => slide.cls === 'p-cycle-short-question');
  await page.locator('#overview-toggle').click();
  await page.locator(`[data-go-slide="${question.index}"]`).click();
  await expect(page.locator('#overview-toggle')).toBeFocused();
  await expect(page.locator('.slide.active .p-answer')).toBeHidden();
  await page.keyboard.press('r');
  await expect(page.locator('.slide.active .p-answer')).toBeVisible();
  await expect(page.locator('#counter')).toHaveText(`${question.index + 1} / ${deck.slideCount}`);

  await page.keyboard.press('End');
  await finish.click();
  const finished = page.locator('#finished');
  await expect(finished).toBeVisible();
  await expect(page.locator('#finish-return')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(finished).toBeHidden();
  await expect(finish).toBeFocused();

  await page.route(url => url.pathname === '/', route => route.fulfill({ body: 'Teach' }));
  await finish.click();
  await page.locator('#finish-return').click();
  await expect(page).toHaveURL(/\/#teacher\/teach$/);
});

test('Sentence Mix-Up keeps keyboard focus from countdown through tiles and draft repair', async ({ page }) => {
  await page.clock.install();
  const deck = await loadDeck(page);
  await page.getByRole('button', { name: 'Start presentation' }).click();
  const mix = deck.slideIndex.find(slide => slide.cls === 'p-sentence-scramble');
  await page.locator('#overview-toggle').click();
  await page.locator(`[data-go-slide="${mix.index}"]`).click();
  const board = page.locator('.slide.active');
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  await board.locator('[data-scramble-start]').focus();
  await page.keyboard.press('Enter');
  await page.clock.fastForward(15001);
  const available = board.locator('[data-scramble-word]');
  await expect(available.first()).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(available.first()).toBeFocused();
  const placed = board.locator('[data-scramble-placed]').first();
  const returned = await placed.getAttribute('data-scramble-placed');
  await placed.focus();
  await page.keyboard.press('Enter');
  await expect(board.locator(`[data-scramble-word="${returned}"]`)).toBeFocused();
  const wordCount = await available.count();
  for (let word = 0; word < wordCount; word++) await page.keyboard.press('Enter');
  await expect(board.locator('[data-scramble-check]')).toBeFocused();
});

test('Slide chooser interruption preserves speech until the teacher resumes or navigates', async ({ page }) => {
  await page.addInitScript(() => {
    const calls = [];
    window.presentAudio = calls;
    window.Audio = class extends EventTarget {
      currentTime = 1;
      duration = 60;
      constructor(src) { super(); this.src = src; }
      play() { calls.push({ action: 'play', src: this.src }); this.dispatchEvent(new Event('playing')); return Promise.resolve(); }
      pause() { calls.push({ action: 'pause', src: this.src }); }
    };
  });
  const deck = await loadDeck(page);
  await page.getByRole('button', { name: 'Start presentation' }).click();
  const caption = deck.slideIndex.find(slide => slide.cls === 'p-sentence-track');
  await page.locator('#overview-toggle').click();
  await page.locator(`[data-go-slide="${caption.index}"]`).click();
  await page.locator('.slide.active [data-play]').click();
  await page.locator('#overview-toggle').click();
  const calls = () => page.evaluate(() => window.presentAudio.map(call => call.action));
  expect(await calls()).toEqual(['play', 'pause']);
  await page.keyboard.press('Escape');
  const resume = page.locator('#resume-interrupted');
  await expect(resume).toBeVisible();
  expect(await calls()).toEqual(['play', 'pause']);
  await resume.click();
  expect(await calls()).toEqual(['play', 'pause', 'play']);

  await page.locator('#overview-toggle').click();
  await page.locator(`[data-go-slide="${caption.index + 1}"]`).click();
  await expect(resume).toBeHidden();
  expect(await calls()).toEqual(['play', 'pause', 'play', 'pause', 'pause']);
});

test('Returning to a backgrounded lesson offers to continue the same tracing stroke', async ({ page }) => {
  await page.addInitScript(() => {
    window.Audio = class extends EventTarget {
      play() {
        queueMicrotask(() => this.dispatchEvent(new Event('ended')));
        return Promise.resolve();
      }
      pause() {}
    };
  });
  await page.clock.install();
  const deck = await loadDeck(page, { day: 'monday' });
  await page.getByRole('button', { name: 'Start presentation' }).click();
  const writing = deck.slideIndex.find(slide => slide.cls === 'p-writing');
  await page.locator('#overview-toggle').click();
  await page.locator(`[data-go-slide="${writing.index}"]`).click();
  const slide = page.locator('.slide.active');
  const stroke = slide.locator('[data-writing-letter]:not([hidden]) [data-write-stroke]').first();
  const position = () => stroke.evaluate(path => parseFloat(path.style.strokeDashoffset));
  const setHidden = hidden => page.evaluate(value => {
    Object.defineProperty(document, 'hidden', { value, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  const before = await position();
  await slide.locator('[data-replay]').click();
  await page.clock.runFor(3500);
  const partial = await position();
  expect(partial).toBeGreaterThan(0);
  expect(partial).toBeLessThan(before);

  await setHidden(true);
  await page.clock.fastForward(10000);
  await setHidden(false);
  const resume = page.locator('#resume-interrupted');
  await expect(resume).toBeVisible();
  expect(await position()).toBe(partial);
  await resume.click();
  await page.clock.runFor(250);
  expect(await position()).toBeLessThan(partial);
  await expect(resume).toBeHidden();
});
