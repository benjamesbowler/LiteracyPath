import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('pageerror', error => { throw error; });
  // Keep recordings pending: input must not depend on a media-ended event.
  await page.addInitScript(() => {
    window.__fluidityAudioStarts = 0;
    window.Audio = class extends EventTarget {
      constructor() { super(); this.readyState = 4; this.paused = true; this.currentTime = 0; this.volume = 1; this.src = ''; }
      load() { this.dispatchEvent(new Event('canplay')); }
      play() { this.paused = false; window.__fluidityAudioStarts++; return Promise.resolve(); }
      pause() { this.paused = true; }
      canPlayType() { return 'probably'; }
    };
  });
});

test('phonics tracing accepts a stroke during the initial demonstration', async ({ page }) => {
  await page.goto('/preview/child-surfaces.html?surface=phonics&step=1', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /^Letter A(?:,|$)/ }).click();
  const stroke = page.getByRole('button', { name: /^Trace stroke 1 of/ });
  await expect(stroke).toBeEnabled();
  await stroke.click();
  await expect(page.getByRole('button', { name: /^Trace stroke 2 of/ })).toBeVisible();
});

test('CVC hearing can advance without starting or finishing narration', async ({ page }) => {
  await page.goto('/preview/child-surfaces.html?surface=phonics&island=words&unlockWords=1&step=1', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'at word nest', exact: true }).click();
  await page.getByRole('button', { name: 'Sound out the word', exact: true }).click();
  await page.getByRole('button', { name: 'Next Word', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Hear bat', exact: true })).toBeVisible();
});

test('CVC building can advance as soon as the word is built', async ({ page }) => {
  await page.goto('/preview/child-surfaces.html?surface=phonics&island=words&unlockWords=1&step=2', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'at word nest', exact: true }).click();
  for (const letter of ['c', 'a', 't']) await page.getByRole('button', { name: `Use ${letter}`, exact: true }).first().click();
  await page.getByRole('button', { name: 'Next Word', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Hear bat', exact: true })).toBeVisible();
});

test('Skills assessment accepts an answer while question narration remains pending', async ({ page }) => {
  // Exercise the real AssessmentPage through its existing preview; replace only
  // its no-op callbacks with a never-ending voice and an answer observer.
  await page.route('**/src/assessment-media-evidence-preview.jsx', async route => {
    const response = await route.fetch();
    const body = (await response.text())
      .replace('speakText: () => {},', 'speakText: () => { window.__questionSpeaking = true; return new Promise(() => {}); },')
      .replace('answerQuestion: () => {},', 'answerQuestion: value => { window.__assessmentAnswer = value; },');
    await route.fulfill({ response, body });
  });
  await page.goto('/preview/assessment-media-evidence.html?scenario=compact-visual-grid');
  await page.getByRole('button', { name: 'Listen to question', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__questionSpeaking)).toBe(true);
  await page.getByRole('button', { name: 'Choose rose', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__assessmentAnswer)).toBe('rose');
});
