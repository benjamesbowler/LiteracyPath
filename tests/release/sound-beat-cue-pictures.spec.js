import { test, expect } from '@playwright/test';

test.use({ trace: 'off', video: { mode: 'on', size: { width: 1366, height: 768 } }, viewport: { width: 1366, height: 768 } });
const scope = 'fullscreen-overlay-preview';
const read = page => page.evaluate(() => window.__arcadePreviewSnapshot());

async function openSeededCheckpoint(page, difficulty, stage, seed) {
  await page.addInitScript(() => localStorage.setItem('lp-arcade-onboarded-v1:sound-beat', '1'));
  // Establish the origin without launching a random live engine: pagehide
  // legitimately persists that engine and could overwrite a seeded fixture.
  const fixtureUrl = '**/preview/game-overlay.html?seed-fixture=1';
  await page.route(fixtureUrl, route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Checkpoint fixture</title>' }));
  await page.goto('/preview/game-overlay.html?seed-fixture=1');
  await page.evaluate(async ({ scope, difficulty, stage, seed }) => {
    const { saveGameCheckpoint, loadLearnGamesProgress } = await import('/src/utils/learnGamesProgress.js');
    saveGameCheckpoint(scope, 'sound-beat', difficulty, stage, 10, seed, 0);
    const saved = loadLearnGamesProgress(scope).games['sound-beat'].checkpoints[difficulty];
    if (saved.sessionSeed !== seed || saved.level !== stage) throw new Error('Seeded checkpoint was not stored');
  }, { scope, difficulty, stage, seed });
  await page.unroute(fixtureUrl);
  await page.goto(`/preview/game-overlay.html?game=sound-beat&difficulty=${difficulty}&sound=1`);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.waitForFunction(() => window.__arcadePreviewSnapshot?.()?.currentTask);
  const initial = await read(page);
  expect(initial.stage).toBe(stage);
  expect(initial.taskIndex).toBe(0);
  await page.evaluate(async ({ difficulty, stage, seed }) => {
    const { soundBeatLadder } = await import('/src/utils/soundBeatTracks.js');
    const expected = soundBeatLadder(difficulty, seed)[stage].items[0];
    if (window.__arcadePreviewSnapshot().currentTask.item.word !== expected.word) throw new Error('Mounted bank does not match disclosed seed');
  }, { difficulty, stage, seed });
  await page.locator('.lg-game-player-main').focus();
  await page.evaluate(() => {
    window.__cueAudioEnds = []; window.__cueNativeFrames = [];
    const original = window.Howl.prototype._emit;
    window.Howl.prototype._emit = function (event, id, message) {
      if (event === 'end') window.__cueAudioEnds.push({ src: this._src, id, at: performance.now() });
      return original.call(this, event, id, message);
    };
    document.addEventListener('keydown', event => {
      if (event.repeat || !/^[dfjk]$/i.test(event.key)) return;
      const at = performance.now(), key = event.key;
      requestAnimationFrame(frameAt => {
        const state = window.__arcadePreviewSnapshot();
        window.__cueNativeFrames.push({ key, at, frameAt, eventToFirstFrameMs: frameAt - at,
          beatIndex: state.beatIndex, clockTime: state.clockTime, lastPadEvent: state.lastPadEvent,
          contacts: state.performance.contacts.map(value => ({ character: value.character, limb: value.limb, contact: value.contact, separation: value.separation })) });
      });
    }, true);
  });
}

async function hit(page) {
  await page.waitForFunction(() => {
    const state = window.__arcadePreviewSnapshot();
    return state.countdown <= 0 && state.wordCompleteAt === null;
  });
  const before = await read(page);
  await page.waitForTimeout(Math.max(0, (before.targetTime - before.clockTime) * 1000 - 25));
  await page.keyboard.press(['d', 'f', 'j', 'k'][before.lane]);
  const after = await read(page);
  expect(after.judgement).toMatch(/^(GOOD|GREAT|PERFECT)$/);
  expect(after.beatIndex).toBe(before.beatIndex + 1);
}

async function captureCue(page, word) {
  await page.waitForFunction(word => {
    const state = window.__arcadePreviewSnapshot();
    return state.currentTask.item.word === word && state.currentTask.pictureDelivery === 'delivered' && state.wordCompleteAt === null;
  }, word);
  const before = await read(page);
  expect(before.currentTask.attempts).toBe(0);
  await page.screenshot({ path: test.info().outputPath(`${word}-picture-hidden-word.png`) });
  await hit(page);
  if (word === 'magnet') {
    while ((await read(page)).beatIndex < before.currentTask.item.beats.length) await hit(page);
    await page.waitForFunction(() => {
      const state = window.__arcadePreviewSnapshot();
      return state.evidence.audioReceipts.some(receipt => receipt.kind === 'phrase' && receipt.task === state.taskIndex);
    });
  }
  const after = await read(page);
  expect(after.evidence.firstResponses.every(row => row.wordVisible === false && row.practiceOnly)).toBe(true);
  for (const row of after.evidence.firstResponses.filter(row => row.deliveryAtResponse === 'delivered')) {
    expect(after.evidence.audioReceipts).toContainEqual(row.deliveryReceipt);
    expect(row.deliveryReceipt.at).toBeLessThanOrEqual(row.at);
  }
  await test.info().attach(`${word}-cue-and-native-contact`, { body: JSON.stringify({ before, after,
    observed: await page.evaluate(() => ({ teachingEnds: window.__cueAudioEnds, nativeFrames: window.__cueNativeFrames })),
    timing: 'ordinary clock, unchanged windows, actual keyboard inputs from a disclosed seeded checkpoint fixture', humanListening: 'UNKNOWN' }), contentType: 'application/json' });
}

test('reviewed paint and light pictures accompany native recorded-unit practice without a written target', async ({ page }) => {
  test.setTimeout(120000);
  await openSeededCheckpoint(page, 'hard', 0, 5);
  await captureCue(page, 'paint');
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const state = await read(page);
    if (state.currentTask.item.word === 'light') break;
    if (state.wordCompleteAt !== null) { await page.waitForTimeout(80); attempt -= 1; }
    else await hit(page);
  }
  await captureCue(page, 'light');
  const frames = await page.evaluate(() => window.__cueNativeFrames);
  expect(frames.length).toBeGreaterThan(6);
  expect(frames.every(frame => frame.contacts.some(contact => contact.contact && contact.separation === 0))).toBe(true);
});

test('reviewed horseshoe magnet picture retains actual whole-word audio and the authored syllable rhythm', async ({ page }) => {
  test.setTimeout(120000);
  await openSeededCheckpoint(page, 'medium', 4, 0);
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const state = await read(page);
    if (state.currentTask.item.word === 'magnet') break;
    if (state.wordCompleteAt !== null) { await page.waitForTimeout(80); attempt -= 1; }
    else await hit(page);
  }
  await captureCue(page, 'magnet');
  const final = await read(page);
  expect(final.currentTask.item.beats).toEqual(['mag', 'net']);
  expect(final.currentTask.pictureDelivery).toBe('delivered');
  expect(final.evidence.audioReceipts.some(receipt => receipt.kind === 'phrase' && receipt.task === final.taskIndex)).toBe(true);
});
