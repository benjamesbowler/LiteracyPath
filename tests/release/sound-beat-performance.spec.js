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
    await page.clock.install({time:new Date('2026-09-28T00:00:00Z')});
    await page.clock.pauseAt(new Date('2026-09-28T00:00:01Z'));
    await exposeEngine(page);
    await page.goto(`/preview/game-overlay.html?game=sound-beat&difficulty=${difficulty}&sound=0&music=0`);
    // Advance the lazy mount explicitly, then freeze wall time between inputs.
    await expect.poll(async()=>{await page.clock.runFor(50);return page.evaluate(()=>Boolean(window.__beatTest));}).toBe(true);
    await page.getByRole('button',{name:'Turn spoken audio and game sounds on',exact:true}).focus();
    const startedAt = (await page.evaluate(() => window.__beatTest.debugSnapshot())).clockTime;
    let completed = false;
    const stages = new Set();
    for (let i = 0; i < 400; i++) {
      const state = await page.evaluate(() => window.__beatTest.debugSnapshot());
      stages.add(state.stage);
      if (state.ended) { completed = true; break; }
      if (state.wordCompleteAt !== null) {
        await page.clock.fastForward(Math.max(1, Math.ceil((state.wordCompleteAt - state.clockTime) * 1000)) + 40);
        continue;
      }
      await page.clock.fastForward(Math.max(1, Math.ceil((state.targetTime - state.clockTime) * 1000)));
      await page.keyboard.press('dfjk'[state.lane]);
      const next = await page.evaluate(() => window.__beatTest.debugSnapshot());
      expect(next.judgement).toMatch(/^(PERFECT|GREAT|GOOD)$/);
      expect(next.score).toBeGreaterThanOrEqual(state.score);
      if(i===7) await page.screenshot({path:test.info().outputPath('rhythm-playing.png')});
    }
    expect(completed).toBe(true);
    expect(stages.size).toBe(10);
    const playedSeconds = (await page.evaluate(() => window.__beatTest.debugSnapshot())).clockTime - startedAt;
    expect(playedSeconds).toBeGreaterThanOrEqual(120);
    await test.info().attach('performance-duration', { body: JSON.stringify({ difficulty, playedSeconds, timing: 'virtual clock, real timed pad inputs' }), contentType: 'application/json' });
    await page.clock.fastForward(2500);
    await expect(page.getByRole('alertdialog', { name: 'Sound Beat complete', exact: true })).toBeVisible();
    await page.setViewportSize({width:568,height:320});
    for (const name of ['Next set','Play this again','Back to Arcade']) {
      const action=page.getByRole('button',{name,exact:true}); const box=await action.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(56);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(320);
    }
    await page.screenshot({path:test.info().outputPath('completion.png')});
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

test('the final sound completes automatically and a missed rhythm cannot earn clean credit', async ({page}) => {
  await page.clock.install(); await exposeEngine(page);
  await page.goto('/preview/game-overlay.html?game=sound-beat&sound=0&music=0');
  await page.waitForFunction(() => window.__beatTest);
  await page.clock.pauseAt(await page.evaluate(() => Date.now()+100));
  let state=await page.evaluate(()=>window.__beatTest.debugSnapshot());
  // Let the first authored note expire, then play the retried sound sequence.
  await page.clock.fastForward(Math.ceil((state.targetTime-state.clockTime)*1000)+800);
  state=await page.evaluate(()=>window.__beatTest.debugSnapshot());
  expect(state.mistakes).toBeGreaterThan(0);
  const item=state.currentTask.item, initialWords=state.wordsEnded;
  for(let index=0;index<item.beats.length;index++) {
    state=await page.evaluate(()=>window.__beatTest.debugSnapshot());
    await page.clock.fastForward(Math.max(1,Math.ceil((state.targetTime-state.clockTime)*1000)));
    await page.keyboard.press('dfjk'[state.lane]);
  }
  state=await page.evaluate(()=>window.__beatTest.debugSnapshot());
  expect(state.beatIndex).toBe(item.beats.length);
  expect(state.wordCompleteAt).not.toBeNull();
  expect(state.currentTask.item.lanes).toHaveLength(item.beats.length);
  await page.evaluate(()=>window.__beatTest.pause());
  await page.clock.fastForward(10000);
  expect((await page.evaluate(()=>window.__beatTest.debugSnapshot())).wordsEnded).toBe(initialWords);
  await page.evaluate(()=>window.__beatTest.resume());
  await page.clock.fastForward(500);
  state=await page.evaluate(()=>window.__beatTest.debugSnapshot());
  expect(state.wordsEnded).toBe(initialWords+1);
  expect(state.correct).toBe(0);
  expect(state.score).toBe(0);
});
