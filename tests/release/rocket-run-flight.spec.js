import { expect, test } from '@playwright/test';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

const snapshot = page => page.evaluate(() => window.__rocketRun.snapshot());
const step = (page, seconds) => page.evaluate(value => window.__rocketRun.step(value), seconds);
const AUDIO_FILES = /\/audio\/.*\.(mp3|wav|ogg)(\?|$)/;

async function openFlight(page, { sound = 0, width = 1024, height = 768, difficulty = 'easy' } = {}) {
  await page.setViewportSize({ width, height });
  await page.addInitScript(() => localStorage.setItem('lp-arcade-onboarded-v1:rocket-run', '1'));
  await page.goto(`/preview/game-overlay.html?game=rocket-run&difficulty=${difficulty}&sound=${sound}&music=0&rocketDiagnostics=1&rocketSeed=41`);
  const game = page.getByRole('dialog', { name: 'Rocket Run', exact: true });
  await expect(game.locator('.lg-game-loading')).toHaveCount(0, { timeout: 25000 });
  await expect(game.locator('[data-rr-choice]')).toHaveCount(3);
  return game;
}

for (const viewport of [{ width: 320, height: 568 }, { width: 568, height: 320 }, { width: 1024, height: 768 }]) {
  test(`onboarding and host controls fit ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/preview/game-overlay.html?game=rocket-run&sound=0&music=0');
    const launch = page.getByRole('button', { name: 'Launch rocket', exact: true });
    await expect(launch).toBeVisible();
    const boxes = await page.locator('.rr-card, .rr-card button').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().toJSON()));
    for (const box of boxes) { expect(box.top).toBeGreaterThanOrEqual(0); expect(box.bottom).toBeLessThanOrEqual(viewport.height); }
    await launch.click();
    const controls = await page.locator('.lg-game-player-header button').evaluateAll(nodes => nodes.map(node => {
      const box = node.getBoundingClientRect();
      return { name: node.getAttribute('aria-label'), box: box.toJSON(), ownsHit: node.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)) };
    }));
    for (const control of controls) {
      expect(control.box.width, control.name).toBeGreaterThanOrEqual(56);
      expect(control.box.height, control.name).toBeGreaterThanOrEqual(56);
      expect(control.box.left, control.name).toBeGreaterThanOrEqual(0);
      expect(control.box.right, control.name).toBeLessThanOrEqual(viewport.width);
      expect(control.ownsHit, control.name).toBe(true);
    }
  });
}

test('a flight decision requires deliberate selection and release, not a timed collision', async ({ page }) => {
  test.setTimeout(45000);
  const game = await openFlight(page);
  const fly = game.getByRole('button', { name: 'Fly through', exact: true });
  await expect(fly).toBeVisible();
  await expect(fly).toBeDisabled();
  const choices = game.locator('[data-rr-choice]');
  await expect(choices).toHaveCount(3);
  await choices.nth(0).click();
  await expect(fly).toBeEnabled();
  await page.waitForTimeout(1200);
  await expect(game.locator('[data-rr="hud"]')).toHaveAttribute('data-first-responses', '0');
  const box = await fly.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(game.locator('[data-rr="hud"]')).toHaveAttribute('data-first-responses', '0');
  await page.mouse.move(box.x - 10, box.y - 10);
  await page.mouse.up();
  await expect(game.locator('[data-rr="hud"]')).toHaveAttribute('data-first-responses', '0');
  await fly.click();
  await expect(game.locator('[data-rr="hud"]')).toHaveAttribute('data-first-responses', '1');
});

for (const viewport of [{ width: 320, height: 568 }, { width: 568, height: 320 }, { width: 1024, height: 768 }]) {
  for (const difficulty of ['easy', 'medium', 'hard']) {
    test(`every authored ${difficulty} flight item fits ${viewport.width}x${viewport.height} through every phase`, async ({ page }) => {
      // This exhaustive case renders up to 93 gates through five phases with
      // fresh retries, measured layout and hit-testing on a software GPU.
      // Keep all items and phases; this is not a single-interaction latency test.
      test.setTimeout(120000);
      await openFlight(page, { ...viewport, difficulty });
      const audit = await page.evaluate(() => {
        const failures = [], covered = [];
        const engine = window.__rocketRun;
        const inspect = (phase, round, gate) => {
          const nodes = [...document.querySelectorAll('.rr-hud button')].filter(node => !node.closest('[hidden]') && node.getClientRects().length && !node.closest('[inert]'));
          for (const node of nodes) {
            const box = node.getBoundingClientRect();
            const id = node.dataset.rr || node.textContent;
            if (box.width < 55.9 || box.height < 55.9 || box.left < -0.1 || box.right > innerWidth + 0.1 || box.top < 0 || box.bottom > innerHeight + 0.1) failures.push({ phase, round, gate, id, reason: 'control bounds', box: box.toJSON() });
            const owner = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
            if (owner !== node && !node.contains(owner)) failures.push({ phase, round, gate, id, reason: 'another surface owns hit centre', owner: owner?.className });
            const label = node.querySelector('.rr-word');
            if (label) {
              const range = document.createRange(); range.selectNodeContents(label); const text = range.getBoundingClientRect();
              if (text.left < box.left + 2 || text.right > box.right - 2 || text.top < box.top || text.bottom > box.bottom) failures.push({ phase, round, gate, id, reason: 'clipped word', word: label.textContent });
            }
          }
          const choices = nodes.filter(node => node.hasAttribute('data-rr-choice')).map(node => node.getBoundingClientRect()).sort((a, b) => a.x - b.x);
          for (let i = 1; i < choices.length; i++) if (choices[i].left - choices[i - 1].right < 7.9) failures.push({ phase, round, gate, reason: 'choice separation' });
          covered.push(`${round}:${gate}:${phase}`);
        };
        for (const round of engine.plan) for (let gate = 0; gate < round.gates.length; gate++) {
          engine.seek(round.index, gate); inspect('approach', round.index, gate);
          engine.step(0.8); inspect('decision', round.index, gate);
          let state = engine.snapshot();
          const wrong = state.choices.find(choice => choice.word !== state.word);
          document.querySelector(`[data-rr-choice="${wrong.lane}"]`).click(); document.querySelector('[data-rr="fly"]').click();
          inspect('return', round.index, gate); engine.step(1.2); inspect('retry', round.index, gate);
          state = engine.snapshot(); const right = state.choices.find(choice => choice.word === state.word);
          document.querySelector(`[data-rr-choice="${right.lane}"]`).click(); document.querySelector('[data-rr="fly"]').click();
          inspect('commit', round.index, gate); engine.step(1);
          if (['checkpoint', 'complete'].includes(engine.snapshot().phase)) inspect(engine.snapshot().phase, round.index, gate);
        }
        return { failures, covered: covered.length };
      });
      expect(audit.failures.slice(0, 12), `${audit.failures.length} failures: ${difficulty} at ${viewport.width}x${viewport.height}`).toEqual([]);
      expect(audit.covered).toBeGreaterThan(200);
    });
  }
}

test('released moving touch nominates the intended word and cancelled touch cannot submit', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 568, height: 320 }, hasTouch: true });
  const page = await context.newPage();
  try {
    const game = await openFlight(page, { width: 568, height: 320 }); await step(page, 0.8);
    const target = game.locator('[data-rr-choice="2"]'), box = await target.boundingBox();
    const session = await context.newCDPSession(page);
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 };
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...point, x: point.x - 8 }] });
    expect((await snapshot(page)).nominated).toBe(false);
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(target).toHaveAttribute('aria-pressed', 'true');
    const fly = game.getByRole('button', { name: 'Fly through', exact: true }), flyBox = await fly.boundingBox();
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: flyBox.x + 20, y: flyBox.y + 20, id: 2 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    expect((await snapshot(page)).firstResponses).toHaveLength(0);
    await fly.tap(); expect((await snapshot(page)).firstResponses).toHaveLength(1);
  } finally { await context.close(); }
});

test('a second touch cannot release the first steering owner', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 568, height: 320 }, hasTouch: true });
  const page = await context.newPage();
  try {
    const game = await openFlight(page, { width: 568, height: 320 });
    await step(page, 0.8);
    const right = game.getByRole('button', { name: 'Steer right', exact: true }), box = await right.boundingBox();
    const session = await context.newCDPSession(page);
    const first = { x: box.x + 18, y: box.y + 25, id: 1 }, second = { x: box.x + 42, y: box.y + 25, id: 2 };
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [first] });
    await expect(right).toHaveAttribute('data-pressed', 'true');
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [first, second] });
    // CDP touchEnd names the contact being ended, not the remaining contacts.
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [second] });
    await expect(right).toHaveAttribute('data-pressed', 'true');
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(right).toHaveAttribute('data-pressed', 'false');
    expect((await snapshot(page)).firstResponses).toHaveLength(0);
  } finally { await context.close(); }
});

test('focused host controls keep native keys while named steering retains arrow parity', async ({ page }) => {
  const game = await openFlight(page); await step(page, 0.8);
  const guide = game.getByRole('button', { name: 'Open Rocket Run mission guide', exact: true });
  const before = await snapshot(page); await guide.focus(); await page.keyboard.press('ArrowRight');
  expect((await snapshot(page)).lane).toBe(before.lane);
  await game.getByRole('button', { name: 'Steer left', exact: true }).focus(); await page.keyboard.press('ArrowRight');
  expect((await snapshot(page)).lane).toBe(2);
  await guide.focus(); await page.keyboard.press('Enter');
  await expect(game.locator('[data-rr="hud"]')).toHaveAttribute('data-paused', 'true');
  expect((await snapshot(page)).firstResponses).toHaveLength(0);
});

test('wrong answers return to fresh gates and preserve the first response through a supported retry', async ({ page }) => {
  const game = await openFlight(page);
  await step(page, 0.8);
  let state = await snapshot(page);
  const wrong = state.choices.find(choice => choice.word !== state.word);
  await game.getByRole('button', { name: `Fly to ${wrong.word}`, exact: true }).click();
  await game.getByRole('button', { name: 'Fly through', exact: true }).click();
  state = await snapshot(page);
  expect(state.phase).toBe('return');
  expect(state.firstResponses).toHaveLength(1);
  expect(state.firstResponses[0].correct).toBe(false);
  const first = state.firstResponses[0];
  const oldIds = state.choices.map(choice => choice.id);
  await expect(game.locator('[data-rr="feedback"]')).toContainText(wrong.word);
  await step(page, 1.2);
  state = await snapshot(page);
  expect(state.attempt).toBe(1);
  expect(state.choices.every(choice => !oldIds.includes(choice.id))).toBe(true);
  await game.getByRole('button', { name: `Fly to ${state.word}`, exact: true }).click();
  await game.getByRole('button', { name: 'Fly through', exact: true }).click();
  state = await snapshot(page);
  expect(state.firstResponses).toEqual([first]);
  expect(state.assistedRetries).toHaveLength(1);
  expect(state.assistedRetries[0].correct).toBe(true);
  expect(state.assistedRetries[0].supportUsed).toContain('retry_same_target');
});

test('pausing clears a held control and blocks a release that began before the pause', async ({ page }) => {
  const game = await openFlight(page);
  await step(page, 0.8);
  await game.locator('[data-rr-choice="1"]').click();
  const fly = game.getByRole('button', { name: 'Fly through', exact: true });
  const bounds = await fly.boundingBox();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.keyboard.press('Escape');
  await expect(game.locator('[data-rr="hud"]')).toHaveAttribute('data-paused', 'true');
  await page.mouse.up();
  const paused = await snapshot(page);
  await step(page, 2);
  expect((await snapshot(page)).time).toBe(paused.time);
  await page.keyboard.press('Escape');
  await expect(game.locator('[data-rr="hud"]')).toHaveAttribute('data-paused', 'false');
  expect((await snapshot(page)).firstResponses).toHaveLength(0);
  const right = game.getByRole('button', { name: 'Steer right', exact: true });
  const rightBox = await right.boundingBox();
  await page.mouse.move(rightBox.x + 25, rightBox.y + 25); await page.mouse.down();
  await page.keyboard.press('Escape'); await page.mouse.up(); await page.keyboard.press('Escape');
  await expect(right).toHaveAttribute('data-pressed', 'false');
});

test('recorded cues must finish or explicitly disclose reading support after a failed delivery', async ({ page }) => {
  test.setTimeout(60000);
  await page.route(AUDIO_FILES, route => route.abort());
  const game = await openFlight(page, { sound: 1 });
  await step(page, 0.8);
  await game.locator('[data-rr-choice="0"]').click();
  await expect(game.locator('[data-rr="audio-recovery"]')).toBeVisible();
  await expect(game.locator('[data-rr="fly"]')).toBeDisabled();
  await expect(game.locator('[data-rr="fly"]')).toBeHidden();
  expect((await snapshot(page)).firstResponses).toHaveLength(0);
  await page.unroute(AUDIO_FILES);
  await game.getByRole('button', { name: 'Hear again', exact: true }).click();
  await expect(game.locator('[data-rr="hud"]')).toHaveAttribute('data-audio-delivery', 'completed', { timeout: 25000 });
  await expect(game.getByRole('button', { name: 'Fly through', exact: true })).toBeEnabled();
  const delivered = await snapshot(page);
  expect(delivered.mediaEvents.filter(event => event.type === 'completed')).toHaveLength(4);
  expect(delivered.support).not.toContain('printed_sound_support');
  await game.getByRole('button', { name: 'Fly through', exact: true }).click();
  expect((await snapshot(page)).firstResponses[0].audioDelivery).toBe('completed');
});

test('compact audio recovery remains reachable without covering a word choice', async ({ page }) => {
  await page.route(AUDIO_FILES, route => route.abort());
  const game = await openFlight(page, { sound: 1, width: 568, height: 320 });
  await expect(game.locator('[data-rr="audio-recovery"]')).toBeVisible();
  const intersections = await page.evaluate(() => {
    const recovery = document.querySelector('[data-rr="audio-recovery"]').getBoundingClientRect();
    return [...document.querySelectorAll('[data-rr-choice]')].filter(node => {
      const box = node.getBoundingClientRect();
      return recovery.left < box.right && recovery.right > box.left && recovery.top < box.bottom && recovery.bottom > box.top;
    }).map(node => node.textContent);
  });
  expect(intersections).toEqual([]);
  await game.getByRole('button', { name: 'Read the words', exact: true }).click();
  await game.locator('[data-rr-choice="0"]').click();
  await game.getByRole('button', { name: 'Fly through', exact: true }).click();
  expect((await snapshot(page)).firstResponses[0].supportUsed).toContain('printed_sound_support');
});

test('graphics fallback keeps the rocket, choices and saved-answer rules in compact landscape', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return /^webgl|experimental-webgl/.test(type) ? null : original.call(this, type, ...args);
    };
  });
  const game = await openFlight(page, { width: 568, height: 320 });
  await step(page, 0.8);
  await expect(game.locator('.rr-flat-world')).toBeVisible();
  const clear = await page.evaluate(() => {
    const ship = document.querySelector('.rr-flat-ship').getBoundingClientRect();
    const protectedNodes = document.querySelectorAll('.rr-mission, .rr-word-gate, .rr-feedback, .rr-controls');
    return ship.width >= 30 && ship.height >= 30 && [...protectedNodes].every(node => {
      const box = node.getBoundingClientRect();
      return ship.right <= box.left || ship.left >= box.right || ship.bottom <= box.top || ship.top >= box.bottom;
    });
  });
  expect(clear).toBe(true);
  const current = await snapshot(page);
  await game.getByRole('button', { name: `Fly to ${current.word}`, exact: true }).click();
  await game.getByRole('button', { name: 'Fly through', exact: true }).click();
  expect((await snapshot(page)).firstResponses[0].correct).toBe(true);
});

test('actual WebGL context loss freezes a pending decision and restoration recovers it', async ({ page }) => {
  const game = await openFlight(page); await step(page, 0.8);
  await game.locator('[data-rr-choice="1"]').click();
  const before = await snapshot(page);
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas[data-rocket-scene]');
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
    window.__rocketContextExtension = context.getExtension('WEBGL_lose_context');
    if (!window.__rocketContextExtension) throw new Error('Test browser has no context-loss extension');
    window.__rocketContextExtension.loseContext();
  });
  await expect(game.locator('[data-rr="hud"]')).toHaveAttribute('data-paused', 'true');
  const paused = await snapshot(page); await step(page, 2);
  expect((await snapshot(page)).time).toBe(paused.time);
  expect((await snapshot(page)).firstResponses).toEqual(before.firstResponses);
  await page.evaluate(() => window.__rocketContextExtension.restoreContext());
  await expect(game.locator('[data-rr="hud"]')).toHaveAttribute('data-paused', 'false');
  await expect(game.getByRole('button', { name: 'Fly through', exact: true })).toBeEnabled();
  await game.getByRole('button', { name: 'Fly through', exact: true }).click();
  expect((await snapshot(page)).firstResponses).toHaveLength(1);
});

test('a checkpoint keeps its continuation after a click during context loss', async ({ page }) => {
  const game = await openFlight(page);
  await page.evaluate(() => {
    const engine = window.__rocketRun; engine.seek(0, engine.plan[0].gates.length - 1); engine.step(0.8);
    const word = engine.snapshot().word;
    [...document.querySelectorAll('[data-rr-choice]')].find(node => node.textContent === word).click();
    document.querySelector('[data-rr="fly"]').click(); engine.step(1);
    const context = document.querySelector('canvas[data-rocket-scene]').getContext('webgl2');
    window.__rocketContextExtension = context.getExtension('WEBGL_lose_context'); window.__rocketContextExtension.loseContext();
  });
  const next = game.getByRole('button', { name: 'Next delivery', exact: true });
  await expect(next).toBeDisabled();
  await next.evaluate(button => button.click());
  await expect(next).toBeVisible(); expect((await snapshot(page)).phase).toBe('checkpoint');
  await page.evaluate(() => window.__rocketContextExtension.restoreContext());
  await expect(next).toBeEnabled(); await next.click();
  expect((await snapshot(page)).round).toBe(1);
});

test('the exact new instruction plays on its card before launch and replay stays keyboard reachable', async ({ page }) => {
  test.setTimeout(45000);
  await page.goto('/preview/game-overlay.html?game=rocket-run&sound=1&music=0&rocketDiagnostics=1');
  const game = page.getByRole('dialog', { name: 'Rocket Run', exact: true });
  await expect(game.getByText('Choose the word that starts with the sound. Tap its gate, then tap Fly through.', { exact: true })).toBeVisible();
  const hear = game.getByRole('button', { name: 'Hear instructions', exact: true });
  await game.getByRole('button', { name: 'Turn spoken audio and game sounds off', exact: true }).click();
  await expect(game.locator('[data-rr="hud"]')).toHaveAttribute('data-intro-delivery', 'muted');
  await game.getByRole('button', { name: 'Turn spoken audio and game sounds on', exact: true }).click();
  await hear.click();
  await expect(game.locator('[data-rr="intro-play"]')).toBeDisabled();
  await expect(game.locator('[data-rr="hud"]')).toHaveAttribute('data-intro-delivery', 'completed', { timeout: 15000 });
  expect((await snapshot(page)).firstResponses).toHaveLength(0);
  await game.getByRole('button', { name: 'Launch rocket', exact: true }).focus();
  await page.keyboard.press('Tab'); await expect(hear).toBeFocused();
  await game.getByRole('button', { name: 'Launch rocket', exact: true }).click();
  await expect(game.locator('[data-rr="hud"]')).toHaveAttribute('data-paused', 'false');
  await expect(game.locator('[data-rr="hud"]')).toHaveAttribute('data-audio-delivery', 'completed', { timeout: 20000 });
});

test('spoken wrong-answer feedback retains its target and stops during pause', async ({ page }) => {
  test.setTimeout(60000);
  await page.addInitScript(() => {
    window.__rocketMedia = [];
    const NativeAudio = window.Audio;
    window.Audio = function (...args) { const audio = new NativeAudio(...args); window.__rocketMedia.push(audio); return audio; };
  });
  const requested = [];
  page.on('request', request => { if (AUDIO_FILES.test(request.url())) requested.push(request.url()); });
  const game = await openFlight(page, { sound: 1 });
  await expect(game.locator('[data-rr="hud"]')).toHaveAttribute('data-audio-delivery', 'completed', { timeout: 20000 });
  const before = await snapshot(page), wrong = before.choices.find(choice => choice.word !== before.word);
  await game.getByRole('button', { name: `Fly to ${wrong.word}`, exact: true }).click();
  await game.getByRole('button', { name: 'Fly through', exact: true }).click();
  await expect(game.locator('[data-rr="hud"]')).toHaveAttribute('data-feedback-delivery', 'started');
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.__rocketMedia.every(audio => audio.paused || audio.ended))).toBe(true);
  const paused = await snapshot(page); await step(page, 2);
  expect((await snapshot(page)).time).toBe(paused.time);
  await page.keyboard.press('Escape');
  await expect(game.locator('[data-rr="hud"]')).toHaveAttribute('data-assisted-retries', '0');
  await expect.poll(async () => (await snapshot(page)).attempt, { timeout: 20000 }).toBe(1);
  expect(requested.some(url => url.includes('/rocket-run/begins-v3.mp3'))).toBe(true);
  expect(requested.some(url => url.includes('/rocket-run/find-v3.mp3'))).toBe(true);
  expect((await snapshot(page)).target).toBe(before.target);
  expect((await snapshot(page)).firstResponses[0].response).toBe(wrong.word);
});

test('writing an HTML evidence snapshot cannot reload a live flight', async ({ page }, testInfo) => {
  await openFlight(page);
  await page.evaluate(() => { window.__flightIdentity = window.__rocketRun; });
  const artifact = testInfo.outputPath('watch-regression.html');
  await mkdir(path.dirname(artifact), { recursive: true });
  try {
    await writeFile(artifact, '<!doctype html><title>Test evidence only</title>');
    await page.waitForTimeout(900);
    expect(await page.evaluate(() => window.__flightIdentity === window.__rocketRun)).toBe(true);
  } finally { await rm(artifact); }
});

test('a full flight saves once at its final answer before docking or exit', async ({ browser, baseURL }, testInfo) => {
  // Fifty real gates, ten checkpoints, final exit/reopen and a continuous
  // video require a full-route budget on the software renderer.
  test.setTimeout(180000);
  const context = await browser.newContext({ baseURL, recordVideo: { dir: testInfo.outputPath('video'), size: { width: 1024, height: 768 } } });
  const page = await context.newPage();
  try {
  const game = await openFlight(page);
  const plan = await page.evaluate(() => window.__rocketRun.plan);
  const expectedWords = plan.reduce((sum, round) => sum + round.gates.length, 0);
  for (let round = 0; round < plan.length; round++) {
    for (let gate = 0; gate < plan[round].gates.length; gate++) {
      await step(page, 0.8);
      const current = await snapshot(page);
      expect(current.round).toBe(round); expect(current.gate).toBe(gate);
      // Native button activation covers the full curriculum path. Separate
      // tests exercise actual pointer/touch press, movement and cancellation.
      await page.evaluate(word => {
        const choice = [...document.querySelectorAll('[data-rr-choice]')].find(node => node.textContent === word);
        choice.click(); document.querySelector('[data-rr="fly"]').click();
      }, current.word);
      if (round === plan.length - 1 && gate === plan[round].gates.length - 1) {
        const final = await snapshot(page);
        expect(final.phase).toBe('commit');
        expect(final.receipt.words).toBe(expectedWords);
        expect(final.receipt.evidence.firstResponses).toHaveLength(expectedWords);
        expect(final.receipt.evidence.deliveries).toHaveLength(10);
        const saved = await page.evaluate(() => Object.entries(localStorage).filter(([key, value]) => key.includes('learn') && value.includes('rocket-run')));
        expect(saved.length).toBeGreaterThan(0);
        expect(saved.some(([, value]) => value.includes('printed_word_initial_sound_discrimination'))).toBe(true);
      }
      await step(page, 1);
    }
    if (round < plan.length - 1) await game.getByRole('button', { name: 'Next delivery', exact: true }).click();
  }
  const done = game.getByRole('button', { name: 'Back to Arcade', exact: true });
  await expect(done).toBeVisible();
  await expect(done).toBeFocused();
  await page.keyboard.press('Tab'); await expect(done).toBeFocused();
  const before = await page.evaluate(() => Object.entries(localStorage).filter(([key]) => key.includes('learn')));
  await done.click();
  await expect(page.getByRole('status')).toHaveText('Closed Rocket Run');
  expect(await page.evaluate(() => Object.entries(localStorage).filter(([key]) => key.includes('learn')))).toEqual(before);
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Rocket Run', exact: true }).locator('[data-rr-choice]')).toHaveCount(3);
  expect((await snapshot(page)).firstResponses).toHaveLength(0);
  const progressKey = 'literacy-guide-learn-games:fullscreen-overlay-preview';
  const savedRun = JSON.parse(before.find(([key]) => key === progressKey)[1]).games['rocket-run'];
  const after = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).games['rocket-run'], progressKey);
  // Reopening starts a new level-zero checkpoint inside the same progress
  // entry. All completed evidence, scores and play counts must stay unchanged.
  expect(after.checkpoints).toEqual({ easy: { level: 0, totalLevels: 10 } });
  expect({ ...after, checkpoints: savedRun.checkpoints }).toEqual(savedRun);
  expect(after.plays).toBe(1);
  expect(after.practiceRecord.completions).toHaveLength(1);
  } finally { await context.close(); }
});
