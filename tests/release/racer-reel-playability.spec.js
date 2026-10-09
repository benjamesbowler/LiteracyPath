import { expect, test } from '@playwright/test';
import { openReel, readReel, castReelKeyboard, landReelKeyboard } from './helpers/reelReadNative.js';
import { reelReadV2Ladder } from '../../src/utils/reelReadV2Levels.js';

async function launch(page, game, viewport = { width: 1024, height: 768 }) {
  await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 2 });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 2 });
    // Exercise 10fps rendering: simulation must retain real-time pace.
    window.requestAnimationFrame = callback => window.setTimeout(() => callback(performance.now()), 100);
    window.cancelAnimationFrame = id => window.clearTimeout(id);
  });
  await page.clock.install();
  await page.goto(`/preview/game-overlay.html?game=${game}&sound=0&music=0`);
}

const racerState = page => page.locator('.sound-racer').evaluate(node => node.racerInspection);

test('Sound Racer responsive steering, safe bends and low-frame-rate travel preserve reading', async ({ page }, info) => {
  test.setTimeout(240000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await launch(page, 'sound-racer');
  const hud = page.locator('[data-sound-racer-position]');
  await expect(hud).toBeVisible({ timeout: 45000 });
  await expect(hud).toHaveAttribute('data-sound-racer-asset', 'ready', { timeout: 30000 });
  await page.clock.runFor(500);
  const before = await racerState(page);
  await page.keyboard.down('ArrowRight');
  await page.clock.runFor(700);
  await page.keyboard.up('ArrowRight');
  await page.clock.runFor(500);
  const steered = JSON.parse(await hud.getAttribute('data-sound-racer-position'));
  expect(steered.lateral).toBeGreaterThan(1);
  await page.getByRole('button', { name: 'Close Sound Racer', exact: true }).click();
  const stopped = await racerState(page);
  await page.clock.runFor(1500);
  expect((await racerState(page)).progress).toBe(stopped.progress);
  await page.getByRole('button', { name: /Keep playing/i }).click();
  await page.getByRole('button', { name: 'Open game controls', exact: true }).click();
  const soundToggle = page.getByRole('button', { name: /spoken audio and game sounds/i });
  await soundToggle.click();
  await soundToggle.click();
  await page.getByRole('button', { name: 'Back to the game', exact: true }).click();
  await page.keyboard.down('ArrowLeft');
  await page.clock.runFor(650);
  await page.keyboard.up('ArrowLeft');
  await page.clock.runFor(10000);
  const after = await racerState(page);
  expect(after.timeMs - before.timeMs).toBeGreaterThan(11000);
  expect(after.progress - before.progress).toBeGreaterThan(95);
  const position = JSON.parse(await hud.getAttribute('data-sound-racer-position'));
  expect(position.recoveries).toBe(0);
  expect(errors).toEqual([]);
  await page.screenshot({ path: info.outputPath('sound-racer-assisted-bend.png') });
});


const reelScope = 'literacy-guide-learn-games:fullscreen-overlay-preview';
const school = s => s.fish.map(({ id, word, slot, phase, direction }) => ({ id, word, slot, phase, direction }));
const idleReel = page => page.waitForFunction(() => {
  const s = window.__arcadePreviewSnapshot(); return !s.hook && !s.castPending && !s.fight;
}, null, { timeout: 15000 });

async function catchPart(page, difficulty) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const s = await readReel(page);
    const level = reelReadV2Ladder(difficulty, s.sessionSeed)[s.stage];
    const word = level.correctWords.find(part => !s.landedWords.includes(part));
    const fish = s.fish.find(row => row.word === word);
    expect(fish, 'the next authored part remains in the real swimming school').toBeTruthy();
    const after = await castReelKeyboard(page, fish.id, difficulty);
    if (after.fight) {
      expect(after.fight.fishId).toBe(fish.id);
      const accepted = (await readReel(page)).evidence.acceptedResponses;
      await landReelKeyboard(page);
      const landed = await readReel(page);
      expect(landed.landedWords).toContain(word);
      expect(landed.evidence.acceptedResponses).toEqual(accepted);
      return landed;
    }
    await idleReel(page);
  }
  throw Error('No native correct-part catch within six genuine attempts');
}

async function attachReel(page, info, name) {
  await info.attach(name, { body: JSON.stringify({ snapshot: await readReel(page),
    saved: await page.evaluate(key => localStorage.getItem(key), reelScope) }, null, 2), contentType: 'application/json' });
}

test('Reel and Read hides its target, teaches after real wrong catches and lands a native catch', async ({ page }, info) => {
  test.setTimeout(150000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await openReel(page, 'easy');
  const initial = await readReel(page);
  const cue = page.locator('.rr-cue');
  await expect(cue).not.toContainText(initial.currentTask.targetWord);
  expect(initial.evidence.audioReceipts.some(row => row.stage === 0 && row.kind === 'target' && Number.isFinite(row.at) && typeof row.src === 'string')).toBe(true);
  await expect(page.locator('[data-reel-hint]')).toHaveCount(0);
  const level = reelReadV2Ladder('easy', initial.sessionSeed)[0];
  const wrong = initial.fish.find(row => !level.correctWords.includes(row.word));
  for (let attempt = 0; attempt < 2; attempt++) {
    const before = await readReel(page);
    await castReelKeyboard(page, wrong.id, 'easy');
    await idleReel(page);
    const after = await readReel(page);
    expect(after.mistakes).toBe(before.mistakes + 1);
    expect(school(after)).toEqual(school(before));
    expect(after.evidence.acceptedResponses).toEqual(before.evidence.acceptedResponses);
    expect(after.landedWords).toEqual(before.landedWords);
    if (attempt === 0) await expect(page.locator('[data-reel-hint]')).toHaveCount(0);
  }
  await expect(page.locator('[data-reel-hint]')).toBeVisible();
  await expect(cue).not.toContainText(initial.currentTask.targetWord);
  const landed = await catchPart(page, 'easy');
  expect(landed.landedWords).toHaveLength(1);
  expect(landed.evidence.firstResponses.length).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Pause Reel & Read', exact: true }).click();
  const paused = await readReel(page);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(180);
  const held = await readReel(page);
  expect(held.boatPosition).toBe(paused.boatPosition);
  expect(held.evidence).toEqual(paused.evidence);
  await page.getByRole('button', { name: 'Resume game', exact: true }).click();
  await attachReel(page, info, 'actual-native-catch-and-save');
  await page.screenshot({ path: info.outputPath('reel-read-actual-landed-part.png') });
  expect(errors).toEqual([]);
});

test('Reel and Read finishes a native final-pond continuation with its partial origin preserved', async ({ page }, info) => {
  test.setTimeout(150000);
  // Explicit legacy partial fixture: no completed stages or child history is invented.
  await page.addInitScript(({ key }) => localStorage.setItem(key, JSON.stringify({ games: {
    'reel-read': { checkpoints: { easy: { level: 9, totalLevels: 10, sessionSeed: 0, chapter: 0 } } }
  } })), { key: reelScope });
  await page.addInitScript(() => localStorage.setItem('lp-arcade-onboarded-v1:reel-read', '1'));
  await page.goto('/preview/game-overlay.html?game=reel-read&difficulty=easy&sound=1&music=0');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.waitForFunction(() => window.__arcadePreviewSnapshot?.()?.scene?.delivered, null, { timeout: 30000 });
  await page.getByRole('button', { name: 'Hear fishing clue again', exact: true }).click();
  await page.waitForFunction(() => window.__arcadePreviewSnapshot().evidence.audioReceipts.length > 0, null, { timeout: 15000 });
  const s = await readReel(page);
  expect(s.originStage).toBe(9);
  expect(s.stage).toBe(9);
  for (let index = 0; index < s.currentTask.totalParts; index++) await catchPart(page, 'easy');
  await expect(page.getByRole('button', { name: 'Next trail', exact: true })).toBeVisible({ timeout: 15000 });
  const finished = await readReel(page);
  expect(finished.complete).toBe(true);
  expect(finished.originStage).toBe(9);
  expect(finished.evidence.completions).toHaveLength(1);
  await attachReel(page, info, 'actual-partial-origin-ending');
  await page.screenshot({ path: info.outputPath('reel-read-native-final-pond.png') });
});

const reelViewports = [
  { width: 320, height: 568 }, { width: 568, height: 260 },
  { width: 768, height: 1024 }, { width: 1024, height: 768 },
  { width: 1366, height: 768 }, { width: 1440, height: 900 },
];
for (const [index, viewport] of reelViewports.entries()) {
  test(`Reel and Read audio-picture cue and controls fit ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
    test.setTimeout(60000);
    const difficulty = ['easy', 'medium', 'hard'][index % 3];
    await page.setViewportSize(viewport);
    await openReel(page, difficulty, { sound: false });
    const s = await readReel(page);
    await expect(page.locator('.rr-cue')).not.toContainText(s.currentTask.targetWord);
    const cue = await page.locator('.rr-cue').boundingBox();
    expect(cue.x).toBeGreaterThanOrEqual(0);
    expect(cue.y).toBeGreaterThanOrEqual(0);
    expect(cue.x + cue.width).toBeLessThanOrEqual(viewport.width);
    expect(cue.y + cue.height).toBeLessThanOrEqual(viewport.height);
    for (const name of ['Steer boat left', 'Steer boat right', 'Cast fishing hook', 'Hear fishing clue again']) {
      const control = page.getByRole('button', { name, exact: true });
      const box = await control.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(56);
      expect(box.height).toBeGreaterThanOrEqual(56);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
      expect(await control.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16);
    }
    await page.screenshot({ path: info.outputPath('reel-read-responsive-native.png') });
    await attachReel(page, info, 'native-layout-delivery');
  });
}
