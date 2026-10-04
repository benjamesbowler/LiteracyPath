import { test, expect } from '@playwright/test';

test.use({ trace: 'off', video: { mode: 'on', size: { width: 1366, height: 768 } }, viewport: { width: 1366, height: 768 } });
const read = page => page.evaluate(() => window.__arcadePreviewSnapshot());

async function openRound(page, round, difficulty = 'easy', waitForArt = true) {
  await page.addInitScript(() => localStorage.setItem('lp-arcade-onboarded-v1:soundkeys', '1'));
  const fixture = '**/preview/game-overlay.html?keys-fixture=1';
  await page.route(fixture, route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>SoundKeys checkpoint fixture</title>' }));
  await page.goto('/preview/game-overlay.html?keys-fixture=1');
  await page.evaluate(async ({ round, difficulty }) => {
    const { saveGameCheckpoint } = await import('/src/utils/learnGamesProgress.js');
    saveGameCheckpoint('fullscreen-overlay-preview', 'soundkeys', difficulty, round, 24, 913, 0);
  }, { round, difficulty });
  await page.unroute(fixture);
  await page.goto(`/preview/game-overlay.html?game=soundkeys&difficulty=${difficulty}&sound=1`);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.waitForFunction(() => Boolean(window.__arcadePreviewSnapshot?.()?.performance), null, { timeout: 30000 });
  if (waitForArt) await page.waitForFunction(() => window.__arcadePreviewSnapshot().performance.delivered, null, { timeout: 30000 });
  expect((await read(page)).round).toBe(round);
  await page.evaluate(() => {
    window.__keysObserved = { frames: [], ends: [] };
    const emit = window.Howl.prototype._emit;
    window.Howl.prototype._emit = function (event, id, message) {
      if (event === 'end') window.__keysObserved.ends.push({ src: this._src, at: performance.now(), id });
      return emit.call(this, event, id, message);
    };
    document.addEventListener('keydown', event => {
      if (event.repeat || !/^[1-8]$/.test(event.key)) return;
      const at = performance.now();
      requestAnimationFrame(frameAt => {
        const current = window.__arcadePreviewSnapshot();
        window.__keysObserved.frames.push({ key: event.key, at, frameAt, latencyMs: frameAt - at,
          contacts: current.performance.contacts, pressed: current.pressed });
      });
    }, true);
  });
}

async function playToken(page, token) {
  let button = page.getByRole('button', { name: `Play ${token}`, exact: true });
  for (let banks = 0; !(await button.isVisible()) && banks < 4; banks++) await page.getByRole('button', { name: 'Next sound keys', exact: true }).click();
  await expect(button).toBeVisible();
  const key = await button.locator('small').textContent();
  await page.locator('.lg-game-player-main').focus(); await page.keyboard.press(key);
}

async function completeCurrent(page) {
  const current = await read(page);
  await page.getByRole('button', { name: 'Hear target word again', exact: true }).click();
  await page.waitForFunction(round => window.__arcadePreviewSnapshot().evidence.audioReceipts.some(row => row.round === round && row.kind === 'target'), current.round);
  for (const token of current.target.tokens) await playToken(page, token);
  await page.waitForFunction(() => window.__arcadePreviewSnapshot().celebrating);
  await page.waitForTimeout(480);
  const completed = await read(page);
  expect(completed.performance.actors.every(actor => actor.action === 'phrase-finale')).toBe(true);
  for (const actor of completed.performance.actors) {
    const box = actor.bodyBounds, region = actor.stageRegion;
    expect(box.x).toBeGreaterThanOrEqual(region.x - .001);
    expect(box.x + box.width).toBeLessThanOrEqual(region.x + region.width + .001);
    expect(box.y).toBeGreaterThanOrEqual(region.y - .001);
    expect(box.y + box.height).toBeLessThanOrEqual(region.y + region.height + .001);
  }
  return completed;
}

for (const [band, world] of ['meadow', 'dino', 'moonwood'].entries()) {
  test(`${world} actual eight-key contacts and separated phone/short finales`, async ({ page }) => {
    test.setTimeout(90000); const errors = []; page.on('pageerror', error => errors.push(error.message));
    await openRound(page, band * 8);
    await page.screenshot({ path: test.info().outputPath(`${world}-wide-opening.png`) });
    await page.getByRole('button', { name: /Free play/, exact: false }).click();
    const before = await read(page);
    for (let index = 0; index < 8; index++) {
      await page.locator('.lg-game-player-main').focus(); await page.keyboard.down(String(index + 1));
      await page.waitForFunction(index => window.__arcadePreviewSnapshot().performance.contacts.some(row => row.index === index && row.rendered), index);
      const frame = await read(page);
      expect(frame.performance.contacts[0].separation).toBeLessThan(.0001);
      if ([0, 3, 7].includes(index)) await page.screenshot({ path: test.info().outputPath(`${world}-key-${index + 1}-contact.png`) });
      await page.keyboard.up(String(index + 1));
    }
    expect((await read(page)).evidence.firstResponses).toEqual(before.evidence.firstResponses);
    await page.getByRole('button', { name: /Words/, exact: false }).click();
    const frames = [];
    for (const [index, viewport] of [{ width: 320, height: 568 }, { width: 320, height: 340 }, { width: 568, height: 260 }].entries()) {
      await page.setViewportSize(viewport); await page.emulateMedia({ reducedMotion: index ? 'reduce' : 'no-preference' });
      const result = await completeCurrent(page); frames.push({ viewport, result });
      await page.screenshot({ path: test.info().outputPath(`${world}-finale-${viewport.width}x${viewport.height}.png`) });
      const buttons = await page.locator('.sk-stage button:visible').evaluateAll(elements => elements.map(el => { const r = el.getBoundingClientRect(); return { width: r.width, height: r.height, x: r.x, y: r.y }; }));
      for (const r of buttons) { expect(r.width).toBeGreaterThanOrEqual(55.9); expect(r.height).toBeGreaterThanOrEqual(55.9); expect(r.x).toBeGreaterThanOrEqual(-.1); expect(r.y).toBeGreaterThanOrEqual(-.1); expect(r.x + r.width).toBeLessThanOrEqual(viewport.width + .1); expect(r.y + r.height).toBeLessThanOrEqual(viewport.height + .1); }
      await page.waitForFunction(round => window.__arcadePreviewSnapshot().round > round, result.round, { timeout: 10000 });
    }
    expect(errors).toEqual([]);
    await test.info().attach(`${world}-ordinary-native-contacts-and-finales`, { body: JSON.stringify({ frames,
      observed: await page.evaluate(() => window.__keysObserved), errors, humanListening: 'UNKNOWN', physicalIpad: 'UNKNOWN' }), contentType: 'application/json' });
  });
}

test('failed action sheet keeps independent original performer and retry retains the spelling state', async ({ page }) => {
  test.setTimeout(60000); const failed = '**/speedy-keyboard-actions-v1.webp';
  await page.route(failed, route => route.abort());
  await openRound(page, 0, 'easy', false);
  await page.getByRole('button', { name: 'Reload stage art', exact: true }).waitFor();
  await page.waitForFunction(() => window.__arcadePreviewSnapshot().performance.actors.some(actor => actor.character === 'speedy' && actor.fallbackDelivered));
  const before = await read(page);
  expect(before.performance.actors.find(actor => actor.character === 'speedy').fallbackDelivered).toBe(true);
  await page.screenshot({ path: test.info().outputPath('independent-speedy-action-fallback.png') });
  await page.unroute(failed); await page.getByRole('button', { name: 'Reload stage art', exact: true }).click();
  await page.waitForFunction(() => window.__arcadePreviewSnapshot().performance.delivered);
  const after = await read(page);
  expect(after.tokens).toEqual(before.tokens); expect(after.roundMistakes).toBe(before.roundMistakes); expect(after.evidence.firstResponses).toEqual(before.evidence.firstResponses);
  expect(after.performance.actors.every(actor => actor.delivered)).toBe(true);
});

test('failed venue and kit keep the lower-resolution original music world and recover together', async ({ page }) => {
  test.setTimeout(60000);
  const failedVenue = '**/dino-keyboard-venue-v1.webp', failedKit = '**/dino-instrument-kit-v1.webp';
  await page.route(failedVenue, route => route.abort()); await page.route(failedKit, route => route.abort());
  await openRound(page, 8, 'easy', false);
  await page.waitForFunction(() => window.__arcadePreviewSnapshot?.()?.performance?.sceneFallback?.venue === 'delivered'
    && window.__arcadePreviewSnapshot().performance.sceneFallback.kit === 'delivered');
  const before = await read(page);
  expect(before.performance.delivered).toBe(false); expect(before.performance.playableFallback).toBe(true);
  await page.screenshot({ path: test.info().outputPath('independent-dino-venue-kit-fallback.png') });
  await page.unroute(failedVenue); await page.unroute(failedKit);
  await page.getByRole('button', { name: 'Reload stage art', exact: true }).click();
  await page.waitForFunction(() => window.__arcadePreviewSnapshot().performance.delivered);
  expect((await read(page)).tokens).toEqual(before.tokens);
});

test('paused viewport changes repaint the frozen authored world and resume native keys', async ({ page }) => {
  await openRound(page, 0);
  await page.getByRole('button', { name: 'Open game controls', exact: true }).click();
  const before = await read(page), captures = [];
  expect(before.paused).toBe(true);
  for (const viewport of [{ width: 320, height: 568 }, { width: 320, height: 340 }, { width: 568, height: 260 }]) {
    const prior = (await read(page)).performance.frameAt;
    await page.setViewportSize(viewport);
    await page.waitForFunction(({ prior, rows }) => {
      const state = window.__arcadePreviewSnapshot();
      return state.paused && state.performance.frameAt > prior && state.performance.instrumentRows === rows;
    }, { prior, rows: viewport.width >= 520 && viewport.height < 460 ? 1 : 2 });
    const current = await read(page);
    expect(current.clock).toBe(before.clock); expect(current.tokens).toEqual(before.tokens);
    expect(current.evidence).toEqual(before.evidence);
    const pixels = await page.locator('.sk-authored-world').evaluate(canvas => {
      const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      let coloured = 0;
      for (let index = 0; index < data.length; index += 4) if (data[index] || data[index + 1] || data[index + 2]) coloured++;
      return { coloured, total: canvas.width * canvas.height };
    });
    expect(pixels.coloured).toBeGreaterThan(pixels.total / 2);
    captures.push({ viewport, pixels, current });
  }
  await page.getByRole('button', { name: 'Back to the game', exact: true }).click();
  await page.locator('.lg-game-player-main').focus(); await page.keyboard.down('1');
  await page.waitForFunction(() => window.__arcadePreviewSnapshot().performance.contacts.some(row => row.index === 0 && row.rendered));
  await page.keyboard.up('1'); expect((await read(page)).paused).toBe(false);
  await test.info().attach('paused-resize-native-recovery', { body: JSON.stringify(captures), contentType: 'application/json' });
});
