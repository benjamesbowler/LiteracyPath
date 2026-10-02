import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { LEARNING_PACE } from '../../src/utils/learningPace.js';

const evidence = '.artifacts/phonics-overhaul/recognition';
const scope = 'fullscreen-overlay-preview';
const games = [
  { id: 'sight-word-memory', title: 'Sight Word Memory', mode: 'memory', selector: '.pr-memory-card' },
  { id: 'pop-the-word', title: 'Pop the Word', mode: 'target', selector: '.pr-word-balloon' },
  { id: 'word-rescue', title: 'Word Rescue', mode: 'rescue', selector: '.pr-answer-plank' }
];
test.use({ hasTouch: true });

async function open(page, game, difficulty = 'easy') {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/preview/game-overlay.html?game=${game.id}&difficulty=${difficulty}&sound=0&music=0`);
  await expect(page.locator('.pr-game')).toBeVisible();
  await mkdir(evidence, { recursive: true });
}
async function saved(page, game, difficulty = 'easy') {
  return page.evaluate(({ scope, mode, difficulty }) => {
    const family = mode === 'rescue' ? 'adventure-world' : 'phonics-play';
    return JSON.parse(localStorage.getItem(`literacy-guide-${family}:${scope}:${mode}:${difficulty}`));
  }, { scope, mode: game.mode, difficulty });
}
async function clock(page) {
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
}
async function completeMemoryBoard(page) {
  const ids = [...new Set(await page.locator('.pr-memory-card').evaluateAll(cards => cards.map(card => card.dataset.pairId)))];
  expect(ids).toHaveLength(4);
  for (const id of ids) {
    const pair = page.locator(`[data-pair-id="${id}"]`);
    await pair.first().tap();
    await pair.last().tap();
    await expect(pair.first()).toBeDisabled();
  }
}

for (const difficulty of ['easy', 'medium', 'hard']) for (const game of games) {
  test(`${game.id} ${difficulty} completes, replays and saves one outing`, async ({ page }) => {
    test.setTimeout(180000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await open(page, game, difficulty);
    await clock(page);
    await page.screenshot({ path: `${evidence}/${game.id}-${difficulty}-opening.png` });
    const original = await saved(page, game, difficulty);
    const total = game.mode === 'memory' ? original.gameState.boards.length : game.mode === 'target' ? original.gameState.words.length : original.roundSet.rescue.length;
    for (let round = 0; round < total; round += 1) {
      if (game.mode === 'memory') {
        await expect(page.locator('.pr-memory-table')).toHaveAttribute('data-table', String(round));
        await completeMemoryBoard(page);
      } else {
        const current = await saved(page, game, difficulty);
        const target = game.mode === 'target' ? current.gameState.words[round] : current.roundSet.rescue[round].word;
        const response = page.locator(game.selector).filter({ hasText: new RegExp(`^${target}$`) });
        await response.press(round % 2 ? 'Space' : 'Enter');
      }
      if (round === Math.floor(total / 2)) await page.screenshot({ path: `${evidence}/${game.id}-${difficulty}-middle.png` });
      await page.clock.runFor(1800);
    }
    const replay = page.getByRole('button', { name: 'Replay level', exact: true });
    await expect(replay).toBeVisible();
    await page.screenshot({ path: `${evidence}/${game.id}-${difficulty}-complete.png` });
    const records = await page.evaluate(scope => JSON.parse(localStorage.getItem(`literacy-guide-learn-games:${scope}`)), scope);
    expect(records.games[game.id].practiceRecord.completions).toHaveLength(1);
    await replay.click();
    await expect(page.locator('.pr-game')).toBeVisible();
    const repeated = await saved(page, game, difficulty);
    expect(repeated?.correct || repeated?.index || 0).toBe(0);
    if (game.mode === 'memory') {
      expect(repeated.gameState.startBoard).toBe(original.gameState.startBoard);
      expect(repeated.gameState.boards[0]).not.toEqual(original.gameState.boards[0]);
    }
    expect(errors).toEqual([]);
  });
}

for (const game of games) test(`${game.id} first error, pause, retry and resume preserve the same learning task`, async ({ page }) => {
  await open(page, game);
  await clock(page);
  const initial = await saved(page, game);
  if (game.mode === 'memory') {
    const [first, second] = [initial.gameState.boards[0][0], initial.gameState.boards[0].find(card => card.pairId !== initial.gameState.boards[0][0].pairId)];
    await page.locator(`[data-card-id="${first.id}"]`).tap();
    await page.locator(`[data-card-id="${second.id}"]`).tap();
    await expect(page.locator('.pr-feedback')).toContainText('different words');
    await page.getByRole('button', { name: `Pause ${game.title}`, exact: true }).click();
    await expect(page.getByRole('dialog', { name: `${game.title} paused`, exact: true })).toBeVisible();
    await expect(page.locator('.pr-game')).toHaveAttribute('data-engine-paused', 'true');
    await page.clock.runFor(30);
    await page.clock.runFor(3000);
    await expect(page.locator('.pr-memory-card.is-revealed')).toHaveCount(2);
    await page.getByRole('button', { name: 'Resume game', exact: true }).click();
    await expect(page.locator('.pr-game')).toHaveAttribute('data-engine-paused', 'false');
    await page.clock.runFor(30);
    await page.clock.runFor(1800);
    await expect(page.locator('.pr-memory-card.is-revealed')).toHaveCount(0);
    const pair = page.locator(`[data-pair-id="${first.pairId}"]`);
    await pair.first().press('Enter');
    await pair.last().press('Space');
    await expect(page.locator('.pr-memory-card.is-matched')).toHaveCount(2);
  } else if (game.mode === 'target') {
    const target = initial.gameState.words[0];
    const wrong = initial.stage.data.options.find(word => word !== target);
    await page.getByRole('button', { name: `Pop ${wrong}`, exact: true }).tap();
    await expect(page.locator('[data-learning-phase=receipt]')).toBeVisible();
    await expect(page.locator(game.selector)).toHaveCount(0);
    await page.getByRole('button', { name: `Pause ${game.title}`, exact: true }).click();
    await expect(page.getByRole('dialog', { name: `${game.title} paused`, exact: true })).toBeVisible();
    await expect(page.locator('.pr-game')).toHaveAttribute('data-engine-paused', 'true');
    await page.clock.runFor(0);
    await page.clock.runFor(3000);
    expect((await saved(page, game)).stage.data.recovery.task.episode.phase).toBe('receipt');
    await page.getByRole('button', { name: 'Resume game', exact: true }).click();
    await expect(page.locator('.pr-game')).toHaveAttribute('data-engine-paused', 'false');
    await expect.poll(async () => {
      await page.clock.runFor(100);
      return (await saved(page, game)).stage.data.recovery.task.episode.phase;
    }, { intervals: [0, 50, 100], timeout: 10000 }).toBe('teaching');
    await page.screenshot({ path: `${evidence}/${game.id}-wrong.png` });
    await page.getByRole('button', { name: `Match ${target}`, exact: true }).press('Space');
    await expect(page.locator('[data-learning-phase=answer]')).toBeVisible();
    const transfer = (await saved(page, game)).stage.data.recovery.task.episode;
    expect(transfer.question.word).not.toBe(target);
    await page.getByRole('button', { name: `Choose ${transfer.expected}`, exact: true }).press('Enter');
    await expect(page.locator('[data-learning-phase=receipt]')).toBeVisible();
    await expect(page.getByRole('button', { name: `Choose ${transfer.expected}`, exact: true })).toBeDisabled();
    await page.clock.runFor(LEARNING_PACE.word - 1);
    const dwelling = await saved(page, game);
    expect(dwelling.round).toBe(0);
    expect(dwelling.correct).toBe(0);
    expect(dwelling.score).toBe(0);
    expect(dwelling.evidence.assistedRetries).toHaveLength(0);
    // React arms the dwell, settles cue promises and commits completion in
    // separate effects. Observe the saved transition while advancing the
    // frozen clock instead of reading once immediately after a single jump.
    await expect.poll(async () => {
      await page.clock.runFor(100);
      return (await saved(page, game)).round;
    }, { intervals: [0, 50, 100], timeout: 10000 }).toBe(1);
    await page.clock.runFor(3000);
    const awarded = await saved(page, game);
    expect(awarded.round).toBe(1);
    expect(awarded.correct).toBe(1);
    expect(awarded.score).toBe(20);
    expect(awarded.evidence.firstResponses).toHaveLength(1);
    expect(awarded.evidence.assistedRetries).toHaveLength(1);
    expect(awarded.evidence.assistedRetries[0].learningEpisode.firstResponse).toEqual(transfer.firstResponse);
  } else {
    const target = game.mode === 'target' ? initial.gameState.words[0] : initial.roundSet.rescue[0].word;
    const wrong = (await page.locator(game.selector).allTextContents()).find(word => word !== target);
    await page.locator(game.selector).filter({ hasText: new RegExp(`^${wrong}$`) }).tap();
    await expect(page.locator('.pr-feedback')).toContainText(`That says ${wrong}`);
    const incorrect = await saved(page, game);
    expect((game.mode === 'target' ? incorrect.round : incorrect.index)).toBe(0);
    await page.screenshot({ path: `${evidence}/${game.id}-wrong.png` });
    await page.locator(game.selector).filter({ hasText: new RegExp(`^${target}$`) }).press('Enter');
    await page.getByRole('button', { name: `Pause ${game.title}`, exact: true }).click();
    await expect(page.getByRole('dialog', { name: `${game.title} paused`, exact: true })).toBeVisible();
    await expect(page.locator('.pr-game')).toHaveAttribute('data-engine-paused', 'true');
    await page.clock.runFor(30);
    await page.clock.runFor(3000);
    const frozen = await saved(page, game);
    expect((game.mode === 'target' ? frozen.round : frozen.index)).toBe(0);
    await page.getByRole('button', { name: 'Resume game', exact: true }).click();
    await expect(page.locator('.pr-game')).toHaveAttribute('data-engine-paused', 'false');
    await page.clock.runFor(30);
    await page.clock.runFor(1800);
    expect((await saved(page, game))[game.mode === 'target' ? 'round' : 'index']).toBe(1);
  }
  const retry = await saved(page, game);
  expect(retry.evidence.firstResponses[0].correct).toBe(false);
  expect(retry.evidence.assistedRetries[0].independent).toBe(false);
  expect(retry.evidence.assistedRetries[0].practiceOnly).toBe(true);
  await page.clock.resume();
  await page.reload();
  const continuation = page.getByRole('button', { name: 'Continue', exact: true });
  await expect(continuation.or(page.locator('.pr-game'))).toBeVisible();
  if (await continuation.isVisible()) await continuation.click();
  await expect(page.locator('.pr-game')).toBeVisible();
  const restored = await saved(page, game);
  expect(restored.evidence.firstResponses[0].correct).toBe(false);
});

for (const [width, height] of [[1280, 900], [1024, 768], [768, 1024], [320, 568], [568, 320]]) {
  for (const game of games) test(`${game.id} answers fit and remain usable at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await open(page, game, 'hard');
    const boxes = await page.locator(game.selector).evaluateAll(buttons => buttons.map(button => button.getBoundingClientRect().toJSON()));
    expect(boxes.length).toBe(game.mode === 'memory' ? 8 : game.mode === 'target' ? 6 : 3);
    for (const box of boxes) {
      expect(box.width).toBeGreaterThanOrEqual(56);
      expect(box.height).toBeGreaterThanOrEqual(56);
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.top).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(width);
      expect(box.bottom).toBeLessThanOrEqual(height);
    }
    await page.locator(game.selector).first().tap();
    await page.screenshot({ path: `${evidence}/${game.id}-${width}x${height}.png` });
    expect(await page.locator('.pr-game').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  });
}

for (const game of games) test(`${game.id} failed decorative media leaves the learning action playable`, async ({ page }) => {
  await page.route(/\.(?:webp|png|mp3)(?:\?|$)/, route => route.abort());
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await open(page, game);
  if (game.mode === 'memory') {
    await page.locator('.pr-memory-card').first().press('Enter');
    await expect(page.locator('.pr-memory-card.is-revealed')).toHaveCount(1);
  } else {
    const current = await saved(page, game);
    const target = game.mode === 'target' ? current.gameState.words[0] : current.roundSet.rescue[0].word;
    await page.locator(game.selector).filter({ hasText: new RegExp(`^${target}$`) }).tap();
    await expect(page.locator('.pr-feedback')).toContainText(target);
  }
  expect(errors).toEqual([]);
});

for (const game of games.filter(item => item.mode !== 'memory')) test(`${game.id} unavailable recorded target exposes a printed cue and enables retry`, async ({ page }) => {
  await page.route(/\.mp3(?:\?|$)/, route => route.abort());
  await page.goto(`/preview/game-overlay.html?game=${game.id}&sound=1&music=0`);
  await expect(page.locator('.pr-game')).toBeVisible();
  const current = await saved(page, game);
  const target = game.mode === 'target' ? current.gameState.words[0] : current.roundSet.rescue[0].word;
  await expect(page.locator('.pr-objective strong')).toContainText(target);
  const wrong = (await page.locator(game.selector).allTextContents()).find(word => word !== target);
  await page.locator(game.selector).filter({ hasText: new RegExp(`^${wrong}$`) }).tap();
  if (game.mode === 'target') {
    await expect(page.locator('[data-learning-phase=teaching]').first()).toBeVisible();
    await expect(page.getByRole('button', { name: `Match ${target}`, exact: true })).toBeEnabled();
    await expect(page.locator(game.selector)).toHaveCount(0);
  } else {
    await expect(page.locator('.pr-feedback')).toContainText(`That says ${wrong}`);
    await expect(page.locator(game.selector).filter({ hasText: new RegExp(`^${target}$`) })).toBeEnabled();
  }
});

for (const game of games.filter(item => item.mode !== 'memory')) test(`${game.id} a Hear gesture recovers blocked autoplay with the recorded target`, async ({ page }) => {
  await page.addInitScript(() => {
    const nativePlay = HTMLMediaElement.prototype.play;
    window.__phonicsMediaAttempts = 0;
    window.__phonicsRecordedPlaying = 0;
    window.__phonicsSyntheticSpeech = 0;
    if (window.speechSynthesis) window.speechSynthesis.speak = () => { window.__phonicsSyntheticSpeech += 1; };
    HTMLMediaElement.prototype.play = function () {
      window.__phonicsMediaAttempts += 1;
      if (window.__phonicsMediaAttempts === 1) return Promise.reject(new DOMException('Test blocked autoplay', 'NotAllowedError'));
      this.addEventListener('playing', () => { window.__phonicsRecordedPlaying += 1; }, { once: true });
      return nativePlay.call(this);
    };
  });
  await page.goto(`/preview/game-overlay.html?game=${game.id}&sound=1&music=0`);
  await expect(page.locator('.pr-game')).toBeVisible();
  const current = await saved(page, game);
  const target = game.mode === 'target' ? current.gameState.words[0] : current.roundSet.rescue[0].word;
  await expect(page.locator('.pr-objective strong')).toContainText(target);
  const hear = page.getByRole('button', { name: game.mode === 'target' ? 'Hear target' : 'Hear target word', exact: true });
  await expect(hear).toBeEnabled();
  await hear.tap();
  await expect.poll(() => page.evaluate(() => window.__phonicsRecordedPlaying)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__phonicsMediaAttempts)).toBeGreaterThanOrEqual(2);
  expect(await page.evaluate(() => window.__phonicsSyntheticSpeech)).toBe(0);
});

for (const final of [false, true]) test(`word-rescue reload preserves the accepted ${final ? 'final' : 'first'} plank without awarding it twice`, async ({ page }) => {
  test.setTimeout(120000);
  const game = games.find(item => item.mode === 'rescue');
  await open(page, game);
  await clock(page);
  const original = await saved(page, game);
  const round = final ? original.roundSet.rescue.length - 1 : 0;
  for (let index = 0; index <= round; index += 1) {
    await expect(page.locator('.pr-game')).toHaveAttribute('data-aw-index', String(index));
    const target = original.roundSet.rescue[index].word;
    await page.locator(game.selector).filter({ hasText: new RegExp(`^${target}$`) }).press('Enter');
    await expect(page.locator(game.selector).first()).toBeDisabled();
    if (index < round) await page.clock.runFor(1800);
  }
  const accepted = await saved(page, game);
  expect(accepted.accepted).toBe(true);
  expect(accepted.planks).toBe(round + 1);
  expect(accepted.score).toBe((round + 1) * 20);
  expect(accepted.evidence.firstResponses).toHaveLength(round + 1);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.clock.runFor(250);
  const continuation = page.getByRole('button', { name: 'Continue', exact: true });
  await expect(continuation.or(page.locator('.pr-game'))).toBeVisible();
  if (await continuation.isVisible()) await continuation.click();
  await expect.poll(async () => {
    await page.clock.runFor(20);
    return page.locator(game.selector).count();
  }, { intervals: [100, 250], timeout: 10000 }).toBe(3);
  await expect(page.locator(game.selector).first()).toBeDisabled();
  const restored = await saved(page, game);
  expect(restored.accepted).toBe(true);
  expect(restored.score).toBe(accepted.score);
  expect(restored.planks).toBe(accepted.planks);
  expect(restored.evidence.firstResponses).toHaveLength(accepted.evidence.firstResponses.length);
  await page.clock.runFor(1800);
  if (final) {
    await expect(page.getByRole('button', { name: 'Replay level', exact: true })).toBeVisible();
    const records = await page.evaluate(scope => JSON.parse(localStorage.getItem(`literacy-guide-learn-games:${scope}`)), scope);
    expect(records.games[game.id].practiceRecord.completions).toHaveLength(1);
  } else {
    await expect(page.locator('.pr-game')).toHaveAttribute('data-aw-index', '1');
    const next = await saved(page, game);
    expect(next.score).toBe(20);
    expect(next.planks).toBe(1);
    expect(next.accepted).toBe(false);
  }
});
