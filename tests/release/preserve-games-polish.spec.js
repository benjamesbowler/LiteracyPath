import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

// Long play records bounded state/captures instead of thousands of traced frames.
test.use({ trace: 'off' });
test.afterEach(async ({ page }, info) => {
  if (info.status === info.expectedStatus || page.isClosed()) return;
  const state = await page.evaluate(() => ({ reel: window.__reelInspect?.(), rhyme: window.__rhymeReview?.debugSnapshot() })).catch(() => null);
  await writeFile(info.outputPath('failure-state.json'), JSON.stringify(state, null, 2));
  await page.screenshot({ path: info.outputPath('failure-scene.png') }).catch(() => {});
});

async function exposeReadOnlyState(page, kind) {
  const file = kind === 'rhyme-pop' ? 'RhymePopArcadeGame' : 'ReelReadGame';
  await page.route(`**/src/components/learn/games/games/${file}.jsx*`, async route => {
    const response = await route.fetch();
    let body = await response.text();
    if (kind === 'rhyme-pop') {
      expect(body).not.toContain('const easyAim');
      expect(body).toContain('shaped.entering = true');
      expect(body).toMatch(/countdown:\s*0/);
      body = body.replace('options.onEngineReady?.(api);', `window.__rhymeModule = ${JSON.stringify({ url: route.request().url(), zeroCountdown: body.includes('countdown: 0') })}; options.onEngineReady?.(api);`);
      body = body.replace('options.onEngineReady?.(api);', 'window.__rhymeReview = api; options.onEngineReady?.(api);');
    } else {
      expect(body).toContain('clearHeldInput');
      expect(body).toContain('clampBoatX');
      expect(body).toContain('stepFishingFight');
      expect(body).toContain('alongsideY');
      body = body.replace('onEngineReady?.(api);', 'window.__reelReview = api; onEngineReady?.(api);');
      body = body.replace('function landFish() {', 'function landFish() { window.__reelLandedFights ||= []; window.__reelLandedFights.push({ levelIndex, word: boat.caughtFish?.word, fight: {...boat.fight} });');
      body = body.replace('startLevel(startAt);', `window.__reelLandedFights = []; window.__reelInspect = () => ({ w, h, paused, phase, levelIndex, mistakes, wordsCaught, score, motorEscapes, landedFights: window.__reelLandedFights || [], caught: [...caught], level, boat: {...boat}, keys: {...keys}, fish: fish.map(item => ({...item})), tip: getRodTip() }); startLevel(startAt);`);
      body = body.replace('function fillRound(ctx, x, y, w, h, r, fill) {', `function fillRound(ctx, x, y, w, h, r, fill) { if (y === 16 && h > 60) { window.__reelPanels ||= {}; window.__reelPanels[x] = {x, y, w, h}; }`);
    }
    await route.fulfill({ response, body });
  });
}

async function resumeAt(page, game, difficulty, level) {
  await page.addInitScript(({ game, difficulty, level }) => {
    localStorage.setItem('literacy-guide-learn-games:fullscreen-overlay-preview', JSON.stringify({ games: { [game]: { checkpoints: { [difficulty]: { level, totalLevels: 10 } } } } }));
  }, { game, difficulty, level });
}

function futureFishX(fish, seconds, width) {
  let x = fish.x + (fish.currentVx ?? fish.vx) * seconds;
  if (!fish.entered) return x;
  const left = 72, right = width - 72;
  for (let i = 0; i < 4 && (x < left || x > right); i++) x = x < left ? left * 2 - x : right * 2 - x;
  return x;
}

async function catchThroughInput(page, targetLevel, { maximumSteps = 900, progressPath, stopOnHook = false, stopAfterCatches = Infinity } = {}) {
  let simulatedSeconds = 0;
  const visited = new Set();
  for (let i = 0; i < maximumSteps; i++) {
    const state = await page.evaluate(() => window.__reelInspect());
    visited.add(state.levelIndex);
    if (progressPath && i % 30 === 0) await writeFile(progressPath, JSON.stringify({ step: i, simulatedSeconds, visited: [...visited], state }, null, 2));
    if (state.levelIndex > targetLevel || state.phase === 'finished' || state.wordsCaught >= stopAfterCatches) return { simulatedSeconds, visited: [...visited], state };
    if (state.boat.hookState === 'reeling') {
      if (stopOnHook) return { simulatedSeconds, visited: [...visited], state };
      const fight = state.boat.fight;
      if (fight.tension > .76 && state.keys.cast) await page.keyboard.up('Space');
      if (fight.tension < .42 && !state.keys.cast) await page.keyboard.down('Space');
      await page.clock.runFor(150); simulatedSeconds += .15; continue;
    }
    if (state.phase !== 'playing' || state.boat.hookState !== 'ready') {
      await page.clock.runFor(100); simulatedSeconds += .1; continue;
    }
    const required = state.level.orderMatters ? [state.level.correctWords[state.caught.length]] : state.level.correctWords.filter(word => !state.caught.includes(word));
    const candidates = state.fish.filter(fish => required.includes(fish.word) && fish.entered).sort((a, b) => a.y - b.y);
    const fish = candidates[0];
    if (!fish) { await page.clock.runFor(200); simulatedSeconds += .2; continue; }
    const flightSeconds = Math.max(0, fish.y - state.tip.y) / state.level.hookSpeed;
    const targetX = futureFishX(fish, flightSeconds + .03, state.w);
    const delta = targetX - state.tip.x;
    if (Math.abs(delta) > 13) {
      const key = delta > 0 ? 'ArrowRight' : 'ArrowLeft';
      await page.keyboard.down(key);
      const ms = Math.min(150, Math.max(20, Math.abs(delta) / state.boat.speed * 1000));
      await page.clock.runFor(ms); simulatedSeconds += ms / 1000;
      await page.keyboard.up(key);
      continue;
    }
    const blocked = state.fish.some(other => other.id !== fish.id && other.y < fish.y - 18 && Math.abs(futureFishX(other, Math.max(0, other.y - state.tip.y) / state.level.hookSpeed, state.w) - state.tip.x) < 50 * other.scale);
    if (!blocked) await page.keyboard.press('Space');
    await page.clock.runFor(100); simulatedSeconds += .1;
  }
  throw new Error(`Fishing route did not reach the next encounter after ${simulatedSeconds.toFixed(1)} simulated seconds`);
}

test('Rhyme Pop easy judges a physically hit wrong balloon without consuming a required rhyme', async ({ page }, info) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 960, height: 600 });
  await exposeReadOnlyState(page, 'rhyme-pop');
  await page.goto('/preview/game-overlay.html?game=rhyme-pop&difficulty=easy&sound=0&music=0');
  await page.waitForFunction(() => window.__rhymeReview);
  await page.clock.install();
  expect((await page.evaluate(() => window.__rhymeReview.debugSnapshot())).countdown).toBe(0);
  await page.clock.runFor(1800);
  const canvas = page.locator('canvas').first();
  const before = await page.evaluate(() => window.__rhymeReview.debugSnapshot());
  await page.screenshot({ path: info.outputPath('rhyme-before-shot.png') });
  // Keyboard selection follows the actual balloon position at firing time.
  const wrong = before.bubbles.filter(b => b.kind === 'distractor').sort((a, b) => b.y - a.y)[0];
  const wrongIndex = before.bubbles.findIndex(b => b.id === wrong.id);
  for (let i = 0; i <= wrongIndex; i++) await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space');
  await page.clock.runFor(1500);
  const after = await page.evaluate(() => window.__rhymeReview.debugSnapshot());
  await writeFile(info.outputPath('rhyme-shot.json'), JSON.stringify({ module: await page.evaluate(() => window.__rhymeModule), before, after }, null, 2));
  await page.screenshot({ path: info.outputPath('rhyme-after-shot.png') });
  expect.soft(after.coachText).toContain('does not rhyme');
  expect.soft(after.currentTask.correctFound).toBe(before.currentTask.correctFound);
  expect(after.currentTask.totalRhymes).toBe(before.currentTask.totalRhymes);
  const box = await canvas.boundingBox();
  expect(box.y + box.height).toBeLessThanOrEqual(601);
});

test('Reel narrow HUD, reachable rod tip and held-input pause remain usable', async ({ page }, info) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 390, height: 844 });
  await exposeReadOnlyState(page, 'reel-read');
  await page.goto('/preview/game-overlay.html?game=reel-read&difficulty=easy&sound=0&music=0');
  await page.waitForFunction(() => window.__reelInspect);
  await page.clock.install();
  await page.screenshot({ path: info.outputPath('reel-narrow.png') });
  const panels = await page.evaluate(() => Object.values(window.__reelPanels));
  for (let i = 0; i < panels.length; i++) for (let j = i + 1; j < panels.length; j++) {
    const a = panels[i], b = panels[j];
    expect.soft(Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)).toBeLessThanOrEqual(0);
  }
  await page.getByRole('button', { name: 'Move left', exact: true }).click();
  await page.keyboard.down('ArrowRight');
  await page.clock.runFor(1600);
  await page.keyboard.up('ArrowRight');
  const edge = await page.evaluate(() => window.__reelInspect());
  expect.soft(edge.tip.x).toBeLessThanOrEqual(edge.w - 8);
  await page.keyboard.press('Space');
  await page.clock.runFor(2200);
  const missed = await page.evaluate(() => window.__reelInspect());
  expect(missed.boat.hookState).toBe('ready');
  expect(missed.wordsCaught).toBe(edge.wordsCaught);
  expect(missed.mistakes).toBe(edge.mistakes);
  await page.keyboard.down('ArrowLeft');
  await page.clock.runFor(200);
  await page.getByRole('button', { name: 'Close Reel & Read', exact: true }).click();
  const paused = await page.evaluate(() => window.__reelInspect());
  await page.keyboard.down('Space');
  await page.clock.runFor(300);
  expect((await page.evaluate(() => window.__reelInspect())).boat.x).toBe(paused.boat.x);
  await page.getByRole('button', { name: /Keep playing/i }).click();
  await page.clock.runFor(300);
  const resumed = await page.evaluate(() => window.__reelInspect());
  await writeFile(info.outputPath('reel-input.json'), JSON.stringify({ panels, edge, missed, paused, resumed }, null, 2));
  expect.soft(resumed.boat.x).toBe(paused.boat.x);
  expect.soft(resumed.boat.hookState).toBe('ready');
  await page.keyboard.up('ArrowLeft'); await page.keyboard.up('Space');
  await page.keyboard.press('Space');
  expect((await page.evaluate(() => window.__reelInspect())).boat.hookState).toBe('dropping');
  await page.setViewportSize({ width: 844, height: 390 });
  await page.clock.runFor(100);
  await page.screenshot({ path: info.outputPath('reel-landscape.png') });
  const landscape = await page.evaluate(() => window.__reelInspect());
  expect(landscape.fish.every(item => item.y < landscape.h - 70)).toBe(true);
  for (const name of ['Move left', 'Move right', 'Cast hook']) {
    const button = name === 'Cast hook' ? page.locator('[data-rr=cast]') : page.getByRole('button', { name, exact: true });
    const box = await button.boundingBox();
    expect.soft(box.y + box.height).toBeLessThanOrEqual(391);
    expect(box.width).toBeGreaterThanOrEqual(56);
    expect(box.height).toBeGreaterThanOrEqual(56);
  }
});

for (const [difficulty, level, target] of [['medium', 4, 'noisy'], ['hard', 3, 'ancient']]) {
  test(`Reel ${target} meaning encounter completes with its two unambiguous catches`, async ({ page }, info) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 960, height: 600 });
    await exposeReadOnlyState(page, 'reel-read');
    await resumeAt(page, 'reel-read', difficulty, level);
    await page.goto(`/preview/game-overlay.html?game=reel-read&difficulty=${difficulty}&sound=0&music=0`);
    await page.getByRole('button', { name: /Continue/i }).click();
    await page.waitForFunction(() => window.__reelInspect);
    await page.clock.install();
    const initial = await page.evaluate(() => window.__reelInspect());
    expect(initial.level.target).toBe(target);
    expect(initial.level.correctWords).toHaveLength(2);
    const result = await catchThroughInput(page, level);
    expect(result.state.levelIndex).toBe(level + 1);
    await writeFile(info.outputPath(`${target}-completion.json`), JSON.stringify(result, null, 2));
    await page.screenshot({ path: info.outputPath(`${target}-complete.png`) });
  });
}

test('Reel full easy outing measures active fishing and stays available for the next outing', async ({ page }, info) => {
  test.setTimeout(600000);
  await page.setViewportSize({ width: 960, height: 600 });
  await exposeReadOnlyState(page, 'reel-read');
  await page.goto('/preview/game-overlay.html?game=reel-read&difficulty=easy&sound=0&music=0');
  await page.waitForFunction(() => window.__reelInspect);
  await page.clock.install();
  const result = await catchThroughInput(page, 9, { maximumSteps: 2400, progressPath: info.outputPath('fishing-progress.json') });
  expect(result.visited).toHaveLength(10);
  expect(result.state.phase).toBe('finished');
  expect(result.simulatedSeconds).toBeGreaterThanOrEqual(120);
  expect(result.state.landedFights).toHaveLength(23);
  await writeFile(info.outputPath('full-fishing-outing.json'), JSON.stringify(result, null, 2));
  await page.screenshot({ path: info.outputPath('full-fishing-outing.png') });
  await expect(page.getByRole('button', { name: 'Next level', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next level', exact: true }).click();
  await page.waitForFunction(() => window.__reelInspect?.().level.world === 'dino');
  expect((await page.evaluate(() => window.__reelInspect())).phase).toBe('playing');
});

test('Reel resumed final encounter scores only its played catches and offers replay', async ({ page }, info) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 960, height: 600 });
  await exposeReadOnlyState(page, 'reel-read');
  await resumeAt(page, 'reel-read', 'easy', 9);
  await page.goto('/preview/game-overlay.html?game=reel-read&difficulty=easy&sound=0&music=0');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.waitForFunction(() => window.__reelInspect);
  await page.clock.install();
  const result = await catchThroughInput(page, 9);
  expect(result.state.phase).toBe('finished');
  expect(result.state.wordsCaught).toBe(2);
  expect(result.state.mistakes).toBeLessThanOrEqual(1);
  await expect(page.getByRole('button', { name: 'Replay level', exact: true })).toBeVisible();
  const record = await page.evaluate(() => JSON.parse(localStorage.getItem('literacy-guide-learn-games:fullscreen-overlay-preview')).games['reel-read']);
  expect(record.stars).toBe(3);
  await writeFile(info.outputPath('resumed-reel-score.json'), JSON.stringify({ result, record }, null, 2));
  await page.getByRole('button', { name: 'Replay level', exact: true }).click();
  await page.waitForFunction(() => window.__reelInspect?.().levelIndex === 0);
});

test('Rhyme full easy festival measures real shots and keeps next-level play available', async ({ page }, info) => {
  test.setTimeout(600000);
  await page.setViewportSize({ width: 960, height: 600 });
  await exposeReadOnlyState(page, 'rhyme-pop');
  await page.goto('/preview/game-overlay.html?game=rhyme-pop&difficulty=easy&sound=0&music=0');
  await page.waitForFunction(() => window.__rhymeReview);
  await page.clock.install();
  const visited = new Set();
  let seconds = 0;
  for (let step = 0; step < 700; step++) {
    const first = await page.evaluate(() => window.__rhymeReview.debugSnapshot());
    visited.add(first.stage);
    if (step % 10 === 0) await writeFile(info.outputPath('rhyme-progress.json'), JSON.stringify({ step, seconds, visited: [...visited], state: first }, null, 2));
    if (await page.getByRole('button', { name: 'Next level', exact: true }).count()) break;
    if (first.roundPendingAdvance || first.shots) {
      await page.clock.runFor(300); seconds += .3; continue;
    }
    const target = first.bubbles.filter(bubble => bubble.kind === 'rhyme' && bubble.x > 90 && bubble.x < 870).sort((a, b) => b.y - a.y)[0];
    if (!target) { await page.clock.runFor(200); seconds += .2; continue; }
    await page.clock.runFor(100); seconds += .1;
    const second = await page.evaluate(() => window.__rhymeReview.debugSnapshot());
    const moving = second.bubbles.find(bubble => bubble.id === target.id);
    if (!moving) continue;
    const box = await page.locator('canvas').first().boundingBox();
    const speed = Math.min(860, Math.max(560, box.width * .7));
    const travel = Math.hypot(moving.x - box.width / 2, moving.y - box.height * .825) / speed;
    const x = moving.x + (moving.x - target.x) * travel / .1;
    const y = moving.y + (moving.y - target.y) * travel / .1;
    await page.mouse.click(box.x + Math.min(box.width * .9, Math.max(box.width * .1, x)), box.y + Math.min(box.height * .6, Math.max(box.height * .1, y)));
    await page.clock.runFor(700); seconds += .7;
  }
  const final = await page.evaluate(() => window.__rhymeReview.debugSnapshot());
  await writeFile(info.outputPath('full-rhyme-festival.json'), JSON.stringify({ seconds, visited: [...visited], final }, null, 2));
  expect(visited.size).toBe(24);
  expect(final.elapsedSeconds).toBeGreaterThanOrEqual(120);
  await expect(page.getByRole('button', { name: 'Next level', exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('full-rhyme-festival.png') });
  await page.getByRole('button', { name: 'Next level', exact: true }).click();
  await page.waitForFunction(() => window.__rhymeReview?.debugSnapshot().backgroundSrc.includes('dino'));
  expect((await page.evaluate(() => window.__rhymeReview.debugSnapshot())).stage).toBe(0);
});

test('Reel physical fight follows the line, freezes on pause and lands through touch hold and ease', async ({ page }, info) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 960, height: 600 });
  await exposeReadOnlyState(page, 'reel-read');
  await page.goto('/preview/game-overlay.html?game=reel-read&difficulty=easy&sound=0&music=0');
  await page.waitForFunction(() => window.__reelInspect);
  await page.clock.install();
  const hooked = await catchThroughInput(page, 0, { stopOnHook: true });
  expect(hooked.state.boat.hookState).toBe('reeling');
  expect(hooked.state.caught).toEqual([]);
  const progress = page.getByRole('progressbar', { name: 'Fish reeled to boat' });
  await expect(progress).toBeVisible();
  await page.screenshot({ path: info.outputPath('reel-hooked.png') });
  await page.keyboard.down('Space'); await page.clock.runFor(1200);
  await page.getByRole('button', { name: 'Close Reel & Read', exact: true }).click();
  const paused = await page.evaluate(() => window.__reelInspect());
  await page.clock.runFor(600);
  const frozen = await page.evaluate(() => window.__reelInspect());
  expect(frozen.boat.fight).toEqual(paused.boat.fight);
  await page.keyboard.up('Space');
  await page.getByRole('button', { name: /Keep playing/i }).click();
  expect((await page.evaluate(() => window.__reelInspect())).keys.cast).toBe(false);
  const button = page.locator('[data-rr=cast]');
  const box = await button.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(56);
  const touch = await page.context().newCDPSession(page);
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2, radiusX: 5, radiusY: 5 };
  let held = false; const samples = [];
  for (let step = 0; step < 100; step++) {
    const state = await page.evaluate(() => window.__reelInspect());
    if (state.wordsCaught) break;
    expect(state.boat.hookState).toBe('reeling');
    if (!held && state.boat.fight.tension < .42) { await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] }); held = true; }
    if (held && state.boat.fight.tension > .76) { await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); held = false; }
    if (step % 10 === 0) samples.push(state);
    if (step === 20) await page.screenshot({ path: info.outputPath('reel-fighting.png') });
    expect(state.boat.caughtFish.x).toBeCloseTo(state.boat.hookX, 3);
    expect(state.boat.caughtFish.y).toBeCloseTo(state.boat.hookY, 3);
    await page.clock.runFor(150);
  }
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await touch.detach();
  const landed = await page.evaluate(() => window.__reelInspect());
  expect(landed.wordsCaught).toBe(1);
  expect(landed.landedFights[0].fight.elapsed).toBeGreaterThan(5);
  expect(landed.landedFights[0].fight.elapsed).toBeLessThan(11);
  expect(landed.motorEscapes).toBe(0);
  expect(landed.mistakes).toBe(hooked.state.mistakes);
  await writeFile(info.outputPath('reel-physical-fight.json'), JSON.stringify({ hooked, paused, frozen, samples, landed }, null, 2));
  await page.screenshot({ path: info.outputPath('reel-landed.png') });
});

test('Reel deep pull escape preserves literacy progress and the required fish', async ({ page }, info) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 960, height: 600 });
  await exposeReadOnlyState(page, 'reel-read');
  await resumeAt(page, 'reel-read', 'easy', 9);
  await page.goto('/preview/game-overlay.html?game=reel-read&difficulty=easy&sound=0&music=0');
  await page.getByRole('button', { name: /^Continue/ }).click();
  await page.waitForFunction(() => window.__reelInspect);
  await page.clock.install();
  const firstLanded = await catchThroughInput(page, 9, { stopAfterCatches: 1 });
  expect(firstLanded.state.caught).toHaveLength(1);
  await page.keyboard.up('Space');
  const hooked = await catchThroughInput(page, 9, { stopOnHook: true });
  await page.keyboard.down('Space');
  for (let step = 0; step < 100; step++) {
    await page.clock.runFor(120);
    const state = await page.evaluate(() => window.__reelInspect());
    if (state.motorEscapes > hooked.state.motorEscapes || state.wordsCaught > hooked.state.wordsCaught) break;
  }
  await page.keyboard.up('Space');
  const escaped = await page.evaluate(() => window.__reelInspect());
  expect(escaped.motorEscapes).toBe(hooked.state.motorEscapes + 1);
  expect(escaped.mistakes).toBe(hooked.state.mistakes);
  expect(escaped.score).toBe(hooked.state.score);
  expect(escaped.caught).toEqual(hooked.state.caught);
  expect(escaped.fish.some(item => item.word === hooked.state.boat.caughtFish.word)).toBe(true);
  await page.screenshot({ path: info.outputPath('reel-motor-escape.png') });
  await writeFile(info.outputPath('reel-motor-escape.json'), JSON.stringify({ firstLanded, hooked, escaped }, null, 2));
});

test('Reel 100ms rendering frames preserve active line timing', async ({ page }, info) => {
  test.setTimeout(120000);
  await page.addInitScript(() => {
    window.requestAnimationFrame = callback => window.setTimeout(() => callback(performance.now()), 100);
    window.cancelAnimationFrame = id => window.clearTimeout(id);
  });
  await page.setViewportSize({ width: 960, height: 600 });
  await exposeReadOnlyState(page, 'reel-read');
  await page.goto('/preview/game-overlay.html?game=reel-read&difficulty=easy&sound=0&music=0');
  await page.waitForFunction(() => window.__reelInspect);
  await page.clock.install();
  const hooked = await catchThroughInput(page, 0, { stopOnHook: true });
  await page.keyboard.down('Space');
  const before = await page.evaluate(() => window.__reelInspect());
  await page.clock.runFor(2000);
  await page.keyboard.up('Space');
  const after = await page.evaluate(() => window.__reelInspect());
  expect(after.boat.hookState).toBe('reeling');
  expect(after.boat.fight.elapsed - before.boat.fight.elapsed).toBeCloseTo(2, 1);
  expect(after.boat.fight.remaining).toBeLessThan(before.boat.fight.remaining - 4);
  await writeFile(info.outputPath('reel-slow-frame-timing.json'), JSON.stringify({ hooked, before, after }, null, 2));
});
