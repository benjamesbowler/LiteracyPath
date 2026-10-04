import { expect } from '@playwright/test';
import { rhymeLauncherGeometry, stepRhymeBalloon, stepRhymeProjectile } from '../../../src/utils/rhymePopMotion.js';
import { rhymePopV2Ladder } from '../../../src/utils/rhymePopV2Levels.js';

// Observer data is deliberately bounded. The controller has no QA answer or
// advancement API: all language decisions below use real keyboard projectiles.
export const readRhyme = page => page.evaluate(() => window.__arcadePreviewSnapshot());
export const readRhymeFrame = page => page.evaluate(() => {
  const s = window.__arcadePreviewSnapshot();
  return { stage: s.stage, sessionSeed: s.sessionSeed, currentTask: s.currentTask, elapsedSeconds: s.elapsedSeconds,
    keyboardBubbleId: s.keyboardBubbleId, bubbles: s.bubbles, shots: s.shots,
    mistakes: s.mistakes, hintMistakes: s.hintMistakes, paused: s.paused,
    complete: s.complete, roundPendingAdvance: s.roundPendingAdvance,
    motorMisses: s.motorMisses, motorInterceptions: s.motorInterceptions,
    targetDelivered: s.evidence.audioReceipts.some(r => r.stage === s.stage && r.kind === 'target'),
    performance: { layout: s.performance.layout, delivered: s.performance.delivered } };
});
export async function currentRhymeLevel(page, difficulty = 'easy') {
  const state = await readRhymeFrame(page);
  return rhymePopV2Ladder(difficulty, state.sessionSeed)[state.stage];
}

export async function openRhyme(page, difficulty = 'easy', { sound = true, seed = 913, waitForArt = true, waitForCue = true } = {}) {
  await page.addInitScript(() => localStorage.setItem('lp-arcade-onboarded-v1:rhyme-pop', '1'));
  await page.goto(`/preview/game-overlay.html?game=rhyme-pop&difficulty=${difficulty}&sound=${Number(sound)}&music=0&seed=${seed}`);
  const start = page.getByRole('button', { name: 'Start playing', exact: true });
  if (await start.isVisible()) await start.click();
  await page.waitForFunction(() => Boolean(window.__arcadePreviewSnapshot?.()?.performance?.layout), null, { timeout: 30000 });
  if (waitForArt) await page.waitForFunction(() => window.__arcadePreviewSnapshot().performance.delivered, null, { timeout: 30000 });
  if (sound) {
    await page.getByRole('button', { name: 'Hear rhyme clue again', exact: true }).click();
    if (waitForCue) await page.waitForFunction(() => window.__arcadePreviewSnapshot().evidence.audioReceipts.some(r => r.kind === 'target'), null, { timeout: 15000 });
  }
}

export function clearRhymeRoute(state, intendedId, level) {
  const intended = state.bubbles.find(row => row.id === intendedId);
  if (!intended) return false;
  const { width, height } = state.performance.layout;
  const geometry = rhymeLauncherGeometry(width, height, intended);
  const speed = Math.max(560, Math.min(860, width * .7));
  let shot = { x: geometry.muzzle.x, y: geometry.muzzle.y,
    vx: geometry.direction.x * speed, vy: geometry.direction.y * speed,
    r: Math.max(18, Math.min(28, width * .019)) };
  for (let step = 0; step < 160; step++) {
    const time = state.elapsedSeconds + .085 + (step + 1) / 120;
    const bubbles = state.bubbles.map(row => ({ ...row, ...stepRhymeBalloon(row, state.performance.layout, level, time, (step + 1) / 120) }));
    const path = stepRhymeProjectile(shot, 1 / 120, width, bubbles);
    if (path.impact) return path.impact.balloon.id === intendedId;
    shot = { ...shot, ...path };
    if (shot.y < -80) break;
  }
  return false;
}

export async function aimRhymeKeyboard(page, id) {
  await page.locator('.lg-game-player-main').focus();
  for (let index = 0; index < 9; index++) {
    if ((await readRhymeFrame(page)).keyboardBubbleId === id) return;
    await page.keyboard.press('ArrowRight');
  }
  throw Error(`Actual focus ring did not reach ${id}`);
}

export async function fireRhyme(page, id, level) {
  await aimRhymeKeyboard(page, id);
  for (let attempt = 0; attempt < 180; attempt++) {
    const before = await readRhymeFrame(page);
    if (!before.bubbles.some(row => row.id === id)) return before;
    if (!clearRhymeRoute(before, id, level)) { await page.waitForTimeout(90); continue; }
    await page.keyboard.press('Space');
    await page.waitForFunction(before => {
      const current = window.__arcadePreviewSnapshot();
      return current.mistakes !== before.mistakes || current.currentTask.correctFound !== before.currentTask.correctFound
        || current.motorMisses !== before.motorMisses || current.motorInterceptions !== before.motorInterceptions;
    }, before, { timeout: 3500 });
    const after = await readRhymeFrame(page);
    if (after.mistakes !== before.mistakes || after.currentTask.correctFound !== before.currentTask.correctFound) return after;
  }
  throw Error(`No clear actual first-impact route to ${id}`);
}

export async function acceptRhyme(page, level) {
  for (let attempt = 0; attempt < 400; attempt++) {
    const before = await readRhymeFrame(page);
    const target = before.bubbles.find(row => row.kind === 'rhyme' && clearRhymeRoute(before, row.id, level));
    if (!target) { await page.waitForTimeout(90); continue; }
    const after = await fireRhyme(page, target.id, level);
    expect(after.mistakes).toBe(before.mistakes);
    expect(after.currentTask.correctFound).toBe(before.currentTask.correctFound + 1);
    return after;
  }
  throw Error('No clear native route to any current rhyming choice');
}
