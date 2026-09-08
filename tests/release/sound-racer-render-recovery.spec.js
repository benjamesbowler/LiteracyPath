import { expect, test } from '@playwright/test';

test.describe.configure({ timeout: 120_000 });
const read = page => page.evaluate(() => window.__SOUND_RACER__.snapshot());
async function open(page, query = 'quality=low') {
  await page.setViewportSize({ width: 800, height: 600 });
  await page.addInitScript(() => localStorage.setItem('lp-arcade-onboarded-v1:sound-racer', '1'));
  await page.goto(`/preview/sound-racer-preview.html?sound=0&music=0&seed=render-recovery&${query}`);
  await expect.poll(() => page.evaluate(() => Boolean(window.__SOUND_RACER__))).toBe(true);
}
async function answer(page, correct) {
  await expect.poll(async () => (await read(page)).state.phase).toBe('decision');
  const { state } = await read(page);
  const choice = state.mission.rounds[state.index].choices.find(item => item.correct === correct);
  await page.getByRole('button', { name: `Choose ${choice.word}, ${['left', 'middle', 'right'][choice.lane]} road`, exact: true }).click();
  await page.getByRole('button', { name: `Drive through ${choice.word}`, exact: true }).click();
}
function expectRetained(before, after) {
  expect(after.state.mission).toEqual(before.state.mission);
  expect(after.state.index).toBe(before.state.index);
  expect(after.state.evidence).toEqual(before.state.evidence);
}
async function recoverMiss(page, before) {
  await page.getByRole('button', { name: 'Try another road', exact: true }).click();
  await answer(page, true);
  const record = (await read(page)).state.evidence[0];
  expect(record.firstResponse).toEqual(before.state.evidence[0].firstResponse);
  expect(record.completed).toBe(true);
  expect(record.attempts).toBe(2);
}

test('G05 unavailable WebGL creates the working semantic rally', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (/webgl/i.test(type)) return null;
      return getContext.call(this, type, ...args);
    };
  });
  await open(page);
  await expect.poll(async () => (await read(page)).graphics).toBe('fallback');
  await answer(page, false);
  const before = await read(page);
  await recoverMiss(page, before);
});

test('G05 actual WebGL context loss preserves the first response and retry', async ({ page }) => {
  await open(page);
  await expect.poll(async () => (await read(page)).graphics, { timeout: 45_000 }).toBe('ready');
  await answer(page, false);
  const before = await read(page);
  await page.evaluate(() => {
    const canvas = document.querySelector('.sr-scene canvas');
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
    const extension = context.getExtension('WEBGL_lose_context');
    if (!extension) throw new Error('WEBGL_lose_context is unavailable in this browser');
    window.__racerContextLostObserved = false;
    canvas.addEventListener('webglcontextlost', () => { window.__racerContextLostObserved = true; }, { once: true });
    extension.loseContext();
  });
  await expect.poll(() => page.evaluate(() => window.__racerContextLostObserved)).toBe(true);
  await expect.poll(async () => (await read(page)).graphics).toBe('fallback');
  expectRetained(before, await read(page));
  await recoverMiss(page, before);
});

test('G05 changing reduced motion rebuilds graphics with an interim semantic board', async ({ page }) => {
  await open(page);
  await expect.poll(async () => (await read(page)).graphics, { timeout: 45_000 }).toBe('ready');
  await answer(page, false);
  const before = await read(page);
  await page.evaluate(() => {
    window.__racerRebuildFallbackObserved = false;
    const observer = new MutationObserver(records => {
      if (records.some(record => [...record.addedNodes].some(node => node.nodeType === 1
        && (node.matches('.sr-fallback') || node.querySelector('.sr-fallback'))))) {
        window.__racerRebuildFallbackObserved = true;
        observer.disconnect();
      }
    });
    observer.observe(document.querySelector('.sr-mission'), { childList: true, subtree: true });
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.sr-mission')).toHaveClass(/sr-reduced-motion/);
  await expect.poll(() => page.evaluate(() => window.__racerRebuildFallbackObserved)).toBe(true);
  await expect.poll(async () => (await read(page)).graphics, { timeout: 45_000 }).toBe('ready');
  expectRetained(before, await read(page));
  await recoverMiss(page, before);
});

test('G05 sustained real slow frame intervals adapt into the same semantic mission', async ({ page }) => {
  await page.addInitScript(() => {
    const request = window.requestAnimationFrame.bind(window);
    const cancel = window.cancelAnimationFrame.bind(window);
    const pending = new Map();
    window.__racerSlowFrames = false;
    window.requestAnimationFrame = callback => {
      const id = request(timestamp => {
        if (!window.__racerSlowFrames) { callback(timestamp); return; }
        pending.set(id, setTimeout(() => {
          pending.delete(id);
          callback(performance.now());
        }, 140));
      });
      return id;
    };
    window.cancelAnimationFrame = id => {
      cancel(id);
      clearTimeout(pending.get(id));
      pending.delete(id);
    };
  });
  // Omit diagnostic quality: production's measured adaptation must remain enabled.
  await open(page, '');
  await expect.poll(async () => (await read(page)).graphics, { timeout: 45_000 }).toBe('ready');
  await answer(page, false);
  const before = await read(page);
  await page.evaluate(() => { window.__racerSlowFrames = true; });
  await expect.poll(async () => (await read(page)).graphics, { timeout: 30_000 }).toBe('fallback');
  expectRetained(before, await read(page));
  await page.evaluate(() => { window.__racerSlowFrames = false; });
  await recoverMiss(page, before);
});
