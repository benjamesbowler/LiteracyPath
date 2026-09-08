import { expect, test } from '@playwright/test';

test.describe.configure({ timeout: 100_000 });
const snapshot = page => page.evaluate(() => window.__SOUND_RACER__.snapshot());
async function openRally(page, query = '') {
  await page.addInitScript(() => localStorage.setItem('lp-arcade-onboarded-v1:sound-racer', '1'));
  await page.goto(`/preview/sound-racer-preview.html?difficulty=easy&sound=0&music=0&seed=rally-release&${query}`);
  await expect.poll(() => page.evaluate(() => Boolean(window.__SOUND_RACER__?.snapshot))).toBe(true);
}
async function decision(page, index) {
  await expect.poll(async () => {
    const { state } = await snapshot(page);
    return `${state.index}:${state.phase}`;
  }).toBe(`${index}:decision`);
}
async function choose(page, correct) {
  const { state } = await snapshot(page);
  const choice = state.mission.rounds[state.index].choices.find(item => item.correct === correct);
  await page.getByRole('button', { name: `Choose ${choice.word}, ${['left', 'middle', 'right'][choice.lane]} road`, exact: true }).click();
  await page.getByRole('button', { name: `Drive through ${choice.word}`, exact: true }).click();
  return choice;
}

test('G05 holds decisions and preserves the first miss through a complete ten-fork rally', async ({ page }) => {
  await openRally(page, 'fallback=1');
  await decision(page, 0);
  const first = await snapshot(page);
  await page.getByRole('button', { name: 'Steer left', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await snapshot(page)).state.selectedChoiceId).not.toBeNull();
  // Waiting and lane selection cannot answer or move beyond the held fork.
  await page.waitForTimeout(650);
  const held = await snapshot(page);
  expect(held.state.evidence).toEqual([]);
  expect(held.simulation.distance).toBe(first.simulation.distance);
  const wrong = await choose(page, false);
  await expect(page.getByRole('button', { name: 'Try another road', exact: true })).toBeVisible();
  const missed = (await snapshot(page)).state.evidence[0].firstResponse;
  expect(missed.word).toBe(wrong.word);
  expect(missed.correct).toBe(false);
  await page.getByRole('button', { name: 'Try another road', exact: true }).click();
  await choose(page, true);
  // Repeated commit keys during route opening cannot add another response.
  await page.locator('body').click({ position: { x: 2, y: 2 } });
  await page.keyboard.press('Space');
  await page.keyboard.press('Enter');
  const recovered = (await snapshot(page)).state.evidence[0];
  expect(recovered.attempts).toBe(2);
  expect(recovered.firstResponse).toEqual(missed);
  expect(recovered.completed).toBe(true);
  expect(recovered.completionKind).toBe('supported');
  for (let index = 1; index < 10; index += 1) {
    await decision(page, index);
    await choose(page, true);
  }
  await expect(page.getByRole('dialog', { name: 'Sound Racer track complete' })).toBeVisible();
  const final = await snapshot(page);
  expect(final.state.phase).toBe('finished');
  expect(final.state.evidence).toHaveLength(10);
  expect(final.state.evidence.every(item => item.completed)).toBe(true);
  expect(final.state.evidence[0].firstResponse).toEqual(missed);
  await expect(page.getByText('9 first choices matched the target.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Next rally', exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).state.mission.trackIndex).toBe(1);
  expect((await snapshot(page)).state.evidence).toEqual([]);
});

test('G05 manual pause survives visibility return with the same fork and evidence', async ({ page }) => {
  await openRally(page, 'fallback=1');
  await decision(page, 0);
  await page.getByRole('button', { name: 'Pause driving', exact: true }).click();
  const before = await snapshot(page);
  // Synthetic lifecycle events exercise the browser handler, not a controller mutation.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
    delete document.hidden;
  });
  await page.waitForTimeout(350);
  const after = await snapshot(page);
  expect(after.state.paused).toBe(true);
  expect(after.state.index).toBe(before.state.index);
  expect(after.state.evidence).toEqual(before.state.evidence);
  expect(after.simulation.distance).toBe(before.simulation.distance);
  await page.getByRole('button', { name: 'Keep driving', exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).state.paused).toBe(false);
});

test('G05 final curriculum track finishes through semantic fallback with sound off', async ({ page }) => {
  await openRally(page, 'fallback=1&level=9');
  for (let index = 0; index < 10; index += 1) {
    await decision(page, index);
    await choose(page, true);
  }
  await expect(page.getByRole('dialog', { name: 'Sound Racer track complete' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next rally', exact: true })).toHaveCount(0);
  const final = await snapshot(page);
  expect(final.state.mission.trackIndex).toBe(9);
  expect(final.state.evidence.every(record => !record.firstResponse.independent && record.completed)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__SOUND_RACER_PREVIEW__.snapshot().completions.length)).toBe(1);
  const completion = await page.evaluate(() => window.__SOUND_RACER_PREVIEW__.snapshot().completions[0]);
  expect(completion).toMatchObject({ stars: 3, score: 1000, completed: 10 });
  await page.waitForTimeout(350);
  expect((await snapshot(page)).state.evidence).toEqual(final.state.evidence);
  expect(await page.evaluate(() => window.__SOUND_RACER_PREVIEW__.snapshot().completions.length)).toBe(1);
  await page.getByRole('button', { name: 'Drive this track again', exact: true }).click();
  const replay = await snapshot(page);
  expect(replay.state.missionId).not.toBe(final.state.missionId);
  expect(replay.state.evidence).toEqual([]);
});

for (const viewport of [{ width: 390, height: 844 }, { width: 1024, height: 768 }]) {
  test(`G05 reduced-motion fallback keeps readable controls in ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openRally(page, 'fallback=1&motion=reduced');
    await decision(page, 0);
    await expect(page.locator('.sr-mission')).toHaveClass(/sr-reduced-motion/);
    const signs = page.getByRole('group', { name: 'Choose a road' }).getByRole('button');
    await expect(signs).toHaveCount(3);
    for (const button of await signs.all()) {
      const bounds = await button.boundingBox();
      expect(bounds.width).toBeGreaterThanOrEqual(56);
      expect(bounds.height).toBeGreaterThanOrEqual(56);
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
    }
    await choose(page, false);
    const retry = page.getByRole('button', { name: 'Try another road', exact: true });
    const bounds = await retry.boundingBox();
    expect(bounds.height).toBeGreaterThanOrEqual(56);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('G05 missing scene assets preserve the same seeded mission and working controls', async ({ page }) => {
  await openRally(page, 'fallback=1');
  const expected = (await snapshot(page)).state.mission;
  await openRally(page, 'assetFailure=1');
  await expect.poll(async () => (await snapshot(page)).graphics).toBe('fallback');
  expect((await snapshot(page)).state.mission).toEqual(expected);
  await decision(page, 0);
  await choose(page, true);
  expect((await snapshot(page)).state.evidence[0].completed).toBe(true);
});


test('G05 authored low-quality renderer shares the fallback mission and commit rules', async ({ page }) => {
  await openRally(page, 'fallback=1');
  const expected = (await snapshot(page)).state.mission;
  await openRally(page, 'quality=low');
  await expect.poll(async () => (await snapshot(page)).graphics, { timeout: 25_000 }).toBe('ready');
  expect((await snapshot(page)).state.mission).toEqual(expected);
  await decision(page, 0);
  await choose(page, true);
  expect((await snapshot(page)).state.evidence[0].completed).toBe(true);
});
