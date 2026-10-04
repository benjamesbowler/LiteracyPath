import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

// Keep native video and compact reports. Per-API trace screencasts can alter a
// live rhythm measurement; actual input/tempo/window assertions stay intact.
test.use({ trace: 'off', video: { mode: 'on', size: { width: 1366, height: 768 } }, viewport: { width: 1366, height: 768 } });

const snapshot = page => page.evaluate(() => window.__arcadePreviewSnapshot?.());
const nativeSnapshot = page => page.evaluate(() => {
  const value = window.__arcadePreviewSnapshot();
  const { beatIndex, wordCompleteAt, targetTime, clockTime, lane, paused, ended, stage, score, wordsEnded,
    judgement, currentTask, lastPadEvent, performance: scene, voicePending, speechQueue, supportReasons } = value;
  return { beatIndex, wordCompleteAt, targetTime, clockTime, lane, paused, ended, stage, score, wordsEnded,
    judgement, currentTask, lastPadEvent, performance: scene, voicePending, speechQueue, supportReasons,
    firstResponseCount: value.evidence.firstResponses.length, lastFirstResponse: value.evidence.firstResponses.at(-1),
    lastAcceptedResponse: value.evidence.acceptedResponses.at(-1), motorEvents: value.evidence.motorEvents };
});
const progressKey = 'literacy-guide-learn-games:fullscreen-overlay-preview';
const viewports = [{ width: 320, height: 568 }, { width: 568, height: 320 }, { width: 768, height: 1024 }, { width: 1024, height: 768 },
  { width: 1366, height: 768 }, { width: 1920, height: 1080 }, { width: 320, height: 340 }, { width: 568, height: 260 }];

async function open(page, difficulty = 'easy', sound = false) {
  await page.addInitScript(() => localStorage.setItem('lp-arcade-onboarded-v1:sound-beat', '1'));
  await page.goto(`/preview/game-overlay.html?game=sound-beat&difficulty=${difficulty}&sound=${sound ? 1 : 0}`);
  await page.waitForFunction(() => window.__arcadePreviewSnapshot?.()?.currentTask);
  await page.locator('.lg-game-player-main').focus();
}
async function waitArt(page) {
  await page.waitForFunction(() => {
    const scene = window.__arcadePreviewSnapshot?.()?.performance;
    return scene?.venue === 'delivered' && scene.kit === 'delivered' && scene.actors.length === 2 && scene.actors.every(actor => actor.delivered);
  });
}
async function hit(page, pointer = false, compact = false) {
  const read = compact ? nativeSnapshot : snapshot;
  let before = await read(page);
  while (before.wordCompleteAt !== null) { await page.waitForTimeout(50); before = await read(page); }
  await page.waitForTimeout(Math.max(1, (before.targetTime - before.clockTime) * 1000));
  const at = await page.evaluate(() => performance.now());
  if (pointer) await page.getByRole('group', { name: 'Rhythm pads' }).getByRole('button').nth(before.lane).click();
  else await page.keyboard.press('dfjk'[before.lane]);
  const responseAt = await page.evaluate(() => performance.now()), immediate = await read(page);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  const renderedAt = await page.evaluate(() => performance.now()), after = await read(page);
  expect(after.judgement).toMatch(/^(PERFECT|GREAT|GOOD)$/);
  expect(after.beatIndex).toBe(before.beatIndex + 1);
  return { at, responseAt, renderedAt, before, immediate, after };
}
async function pause(page) {
  await page.getByRole('button', { name: 'Pause Sound Beat', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Sound Beat paused', exact: true })).toBeVisible();
}

for (const viewport of viewports) {
  test(`authored Sound Beat fills ${viewport.width}x${viewport.height} with reachable pads and replay`, async ({ page }) => {
    await page.setViewportSize(viewport); await open(page, 'medium', true); await waitArt(page);
    await expect(page.getByRole('button', { name: 'Hear the current sound again' })).toBeVisible();
    const bounds = await page.getByRole('group', { name: 'Rhythm pads' }).getByRole('button').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().toJSON()));
    for (const box of bounds) {
      expect(box.width).toBeGreaterThanOrEqual(56); expect(box.height).toBeGreaterThanOrEqual(56);
      expect(box.x).toBeGreaterThanOrEqual(0); expect(box.right).toBeLessThanOrEqual(viewport.width);
      expect(box.y).toBeGreaterThanOrEqual(0); expect(box.bottom).toBeLessThanOrEqual(viewport.height);
    }
    for (let index = 1; index < bounds.length; index += 1) expect(bounds[index].x - bounds[index - 1].right).toBeGreaterThanOrEqual(7.99);
    const canvas = await page.locator('canvas').boundingBox(); expect(canvas.width).toBe(viewport.width); expect(canvas.height).toBe(viewport.height);
    await page.screenshot({ path: test.info().outputPath('authored-viewport.png') });
    await hit(page, true);
  });
}

test.describe('ordinary authored concert performances', () => {
  // A trace screencast plus every accumulated response in each RPC can itself
  // miss a live rhythm window. Retain native video and incremental compact
  // reports instead; the actual game clock and judging policy stay unchanged.
for (const difficulty of ['easy', 'medium', 'hard']) {
  test(`Sound Beat finishes every authored ${difficulty} section with actual sound-on native music play`, async ({ page }) => {
    test.setTimeout(1_200_000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      window.__beatNativeFrames = []; let prior;
      function frame(at) { if (prior !== undefined) window.__beatNativeFrames.push({ at, ms: at - prior }); prior = at; requestAnimationFrame(frame); }
      requestAnimationFrame(frame);
    });
    await open(page, difficulty, true); await waitArt(page);
    await page.getByRole('button', { name: 'Open game controls', exact: true }).click();
    await page.getByRole('button', { name: 'Turn music on', exact: true }).click();
    await page.keyboard.press('Escape'); await page.locator('.lg-game-player-main').focus();
    await page.evaluate(() => {
      window.__beatTeachingEvents = [];
      const original = window.Howl.prototype._emit;
      window.Howl.prototype._emit = function (event, id, message) {
        if (['play', 'end', 'stop', 'playerror', 'loaderror'].includes(event)) window.__beatTeachingEvents.push({ event, src: this._src, id, at: performance.now() });
        return original.call(this, event, id, message);
      };
    });
    const started = await page.evaluate(() => performance.now()), stages = new Set(), inputs = [], sections = [];
    for (let index = 0; index < 650; index += 1) {
      const state = await nativeSnapshot(page);
      if (!stages.has(state.stage)) {
        stages.add(state.stage); sections.push(await snapshot(page));
        await page.screenshot({ path: test.info().outputPath(`section-${state.stage}.png`) });
        await writeFile(test.info().outputPath('native-outing-progress.json'), JSON.stringify({ difficulty, inputs, sections, stage: state.stage, status: 'running', timing: 'ordinary browser/audio clock; real DFJK' }));
      }
      if (state.ended) break;
      if (state.wordCompleteAt !== null) { await page.waitForTimeout(50); index -= 1; continue; }
      inputs.push(await hit(page, false, true));
    }
    await expect(page.getByRole('alertdialog', { name: 'Sound Beat complete', exact: true })).toBeVisible({ timeout: 20000 });
    const final = await snapshot(page), duration = await page.evaluate(() => performance.now()) - started;
    await writeFile(test.info().outputPath('native-outing-progress.json'), JSON.stringify({ difficulty, inputs, sections, final, status: 'completed', timing: 'ordinary browser/audio clock; real DFJK' }));
    expect(stages.size).toBe(10); expect(final.ended).toBe(true); expect(final.wordsEnded).toBe(difficulty === 'hard' ? 43 : 48);
    expect(final.evidence.completions).toHaveLength(final.wordsEnded); expect(final.evidence.firstResponses.length).toBeGreaterThan(140);
    expect(final.evidence.firstResponses.every(row => row.independentEncodingPractice === false && row.wordVisible === false && row.practiceOnly)).toBe(true);
    const observed = await page.evaluate(() => ({ frames: window.__beatNativeFrames, teaching: window.__beatTeachingEvents }));
    expect(observed.teaching.filter(event => event.event === 'stop')).toHaveLength(0);
    expect(errors).toEqual([]);
    await test.info().attach('ordinary-native-full-performance', { body: JSON.stringify({ difficulty, durationMs: duration, inputs, sections, final, observed, errors,
      timing: 'ordinary real browser/audio clock; actual DFJK; no virtual clock or engine answer command', humanListening: 'UNKNOWN', physicalIpad: 'UNKNOWN' }), contentType: 'application/json' });
    await page.screenshot({ path: test.info().outputPath('complete.png') });
  });
}
});

test('all-art failure keeps the actual rhythm playable and Reload restores the same prefix', async ({ page }) => {
  let failed = true;
  await page.route('**/game-assets/physical-arcade/sound-beat/**', route => failed ? route.abort('failed') : route.continue());
  await open(page, 'hard');
  await expect(page.getByRole('button', { name: 'Reload the band', exact: true })).toBeVisible();
  await hit(page); const before = await snapshot(page);
  expect(before.performance.venue).toBe('unavailable'); expect(before.performance.kit).toBe('unavailable');
  failed = false;
  await page.getByRole('button', { name: 'Reload the band', exact: true }).click(); await waitArt(page);
  const after = await snapshot(page); expect(after.beatIndex).toBe(before.beatIndex); expect(after.currentTask.item).toEqual(before.currentTask.item);
  expect(after.evidence.firstResponses).toEqual(before.evidence.firstResponses); expect(after.evidence.acceptedResponses).toEqual(before.evidence.acceptedResponses);
  expect(after.supportReasons).toContain('stage-art-recovery');
  await page.screenshot({ path: test.info().outputPath('recovered-band.png') }); await hit(page);
});

test('failed local progress has a retry that preserves accepted sounds and evidence', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (window.__beatFailSave && key.startsWith('literacy-guide-learn-games:')) throw new DOMException('Test quota failure', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  await open(page); await waitArt(page); await page.evaluate(() => { window.__beatFailSave = true; });
  await hit(page); const before = await snapshot(page);
  await expect(page.getByRole('button', { name: 'Save progress again', exact: true })).toBeVisible();
  await page.evaluate(() => { window.__beatFailSave = false; });
  await page.getByRole('button', { name: 'Save progress again', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Save progress again', exact: true })).toBeHidden();
  const after = await snapshot(page); expect(after.beatIndex).toBe(before.beatIndex); expect(after.evidence.firstResponses).toEqual(before.evidence.firstResponses);
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey);
  expect(saved.games['sound-beat'].practiceSession.easy.beatIndex).toBe(before.beatIndex);
});

test('pause and Help retain the accepted prefix and mark the actual resumed practice support', async ({ page }) => {
  await open(page, 'easy', true); await waitArt(page); await hit(page);
  await pause(page); const before = await snapshot(page); await page.waitForTimeout(350); const frozen = await snapshot(page);
  expect(frozen.clockTime).toBe(before.clockTime); expect(frozen.voicePending).toBe(false); expect(frozen.beatIndex).toBe(before.beatIndex);
  await page.getByRole('button', { name: 'How to play', exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).supportReasons).toContain('mission-help');
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await snapshot(page)).paused).toBe(false);
  const after = await snapshot(page); expect(after.evidence.firstResponses).toEqual(before.evidence.firstResponses); expect(after.beatIndex).toBe(before.beatIndex);
  await hit(page);
});

test('actual reload keeps an accepted prefix, the original first response and a saved-replay support label', async ({ page }) => {
  await open(page, 'medium', true); await waitArt(page); await hit(page);
  await pause(page); const before = await snapshot(page);
  await page.reload(); await page.getByRole('button', { name: 'Continue', exact: true }).click(); await waitArt(page);
  const after = await snapshot(page);
  expect(after.currentTask.item).toEqual(before.currentTask.item); expect(after.beatIndex).toBe(before.beatIndex); expect(after.currentTask.attempts).toBe(before.currentTask.attempts);
  expect(after.evidence.firstResponses).toEqual(before.evidence.firstResponses); expect(after.evidence.acceptedResponses).toEqual(before.evidence.acceptedResponses);
  expect(after.supportReasons).toContain('saved-phrase-replay'); expect(after.targetTime).toBeGreaterThan(after.clockTime);
  await page.locator('.lg-game-player-main').focus(); await hit(page);
});

test('reduced motion preserves native contact and never turns decorative accompaniment into an answer', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page); await waitArt(page);
  const result = await hit(page);
  expect(result.after.performance.actors.some(actor => actor.action === 'strike' && actor.contact)).toBe(true);
  expect(result.after.performance.contacts.some(contact => contact.contact && contact.separation < 0.01)).toBe(true);
  expect(result.after.evidence.firstResponses).toHaveLength(1);
});
