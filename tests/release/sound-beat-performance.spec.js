import { expect, test } from '@playwright/test';

async function exposeEngine(page) {
  await page.route('**/src/components/learn/games/games/Ps1ArcadeGame.jsx*', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace('options.onEngineReady?.(api);', 'window.__beatTest = api; options.onEngineReady?.(api);');
    await route.fulfill({ response, body });
  });
}

for (const difficulty of ['easy', 'medium', 'hard']) {
  test(`Sound Beat completes all ten ${difficulty} tracks through timed pad input`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.clock.install();
    await exposeEngine(page);
    await page.goto(`/preview/game-overlay.html?game=sound-beat&difficulty=${difficulty}&sound=0&music=0`);
    await page.waitForFunction(() => window.__beatTest);
    let completed = false;
    const stages = new Set();
    for (let i = 0; i < 400; i++) {
      const state = await page.evaluate(() => window.__beatTest.debugSnapshot());
      stages.add(state.stage);
      if (state.ended) { completed = true; break; }
      await page.clock.fastForward(Math.max(1, Math.ceil((state.targetTime - state.clockTime) * 1000)));
      await page.keyboard.press('dfjk'[state.lane]);
      const next = await page.evaluate(() => window.__beatTest.debugSnapshot());
      expect(next.judgement).toMatch(/^(PERFECT|GREAT|GOOD)$/);
      expect(next.score).toBeGreaterThanOrEqual(state.score);
    }
    expect(completed).toBe(true);
    expect(stages.size).toBe(10);
    await page.clock.fastForward(2500);
    await expect(page.getByRole('alertdialog', { name: 'Sound Beat complete', exact: true })).toBeVisible();
  });
}

test('Sound Beat ignores scenery and wrong pads, freezes on pause, and has usable touch bounds', async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await page.clock.install(); await exposeEngine(page);
  await page.goto('/preview/game-overlay.html?game=sound-beat&sound=0&music=0');
  await page.waitForFunction(() => window.__beatTest);
  const state = await page.evaluate(() => window.__beatTest.debugSnapshot());
  await page.locator('canvas').click({ position: { x: 15, y: 60 } });
  await page.getByRole('button', { name: `Play ${['cyan','gold','red','purple'][(state.lane + 1) % 4]} pad`, exact: false }).click();
  expect((await page.evaluate(() => window.__beatTest.debugSnapshot())).beatIndex).toBe(0);
  await page.evaluate(() => window.__beatTest.pause());
  const before = await page.evaluate(() => window.__beatTest.debugSnapshot());
  await page.clock.fastForward(90_000);
  const after = await page.evaluate(() => window.__beatTest.debugSnapshot());
  expect(after.clockTime).toBe(before.clockTime);
  expect(after.beatIndex).toBe(before.beatIndex);
  await page.evaluate(() => window.__beatTest.resume());
  for (const pad of await page.getByRole('group', { name: 'Rhythm pads' }).getByRole('button').all()) {
    const box = await pad.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(56);
    expect(box.height).toBeGreaterThanOrEqual(56);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(321);
    await pad.click({ trial: true });
  }
});
