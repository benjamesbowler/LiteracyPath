import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { elSkillsBlockCycles } from '../../src/data/elSkillsBlockCycles.js';
import { wordMatchBoardWords, WORD_MATCH_WORDS, WORD_MATCH_VERSION, WORD_MATCH_EXTENSION_START } from '../../src/utils/wordMatchProgression.js';
import { buildStationRounds } from '../../src/components/elQuest/elQuestEngine.js';
import { emptyElQuestProgress } from '../../src/utils/adventureMapProgress.js';

const scope = 'fullscreen-overlay-preview';
const gameUrl = '/preview/game-overlay.html?game=sight-word-memory&sound=0&music=0';
test.use({ hasTouch: true });
const session = (page, difficulty = 'easy') => page.evaluate(({ scope, difficulty }) =>
  JSON.parse(localStorage.getItem(`literacy-guide-phonics-play:${scope}:memory:${difficulty}`)), { scope, difficulty });

async function openMemory(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(gameUrl);
  await expect(page.locator('.pp-memory-card')).toHaveCount(8);
}

async function completeBoard(page) {
  const pairs = [...new Set(await page.locator('.pp-memory-card').evaluateAll(cards => cards.map(card => card.dataset.pairId)))];
  expect(pairs).toHaveLength(4);
  for (const id of pairs) {
    const pair = page.locator(`[data-pair-id="${id}"]`);
    await pair.first().tap();
    await pair.last().tap();
    await expect(pair.first()).toBeDisabled();
  }
}

test('matching preserves ordered content on resume and replay, then advances to the next words', async ({ page }) => {
  test.setTimeout(120000);
  await openMemory(page);
  const first = await session(page);
  expect([...new Set(first.gameState.boards[0].map(card => card.word))].sort()).toEqual(['I', 'a', 'am', 'the']);
  const firstCard = page.locator('.pp-memory-card').first();
  const cardId = await firstCard.getAttribute('data-card-id');
  await firstCard.press('Enter');
  await expect(firstCard).toHaveClass(/is-revealed/);
  await firstCard.press('Enter');
  await expect(page.locator('.pp-memory-card.is-matched')).toHaveCount(0);
  await page.reload();
  const continueButton = page.getByRole('button', { name: 'Continue', exact: true });
  await expect(continueButton.or(page.locator('.pp-play'))).toBeVisible();
  if (await continueButton.isVisible()) await continueButton.click();
  await expect(page.locator(`[data-card-id="${cardId}"]`)).toHaveClass(/is-revealed/);
  for (let board = 0; board < first.gameState.boards.length; board += 1) {
    await expect(page.locator('.pp-memory-table')).toHaveAttribute('data-table', String(board));
    await expect(page.locator('.pp-memory-card')).toHaveCount(8);
    await completeBoard(page);
  }
  await page.getByRole('button', { name: 'Replay level', exact: true }).click();
  await expect(page.locator('.pp-memory-card')).toHaveCount(8);
  const replay = await session(page);
  expect(replay.gameState.startBoard).toBe(0);
  expect(replay.gameState.boards[0]).not.toEqual(first.gameState.boards[0]);
  for (let board = 0; board < replay.gameState.boards.length; board += 1) {
    await expect(page.locator('.pp-memory-table')).toHaveAttribute('data-table', String(board));
    await completeBoard(page);
  }
  await page.getByRole('button', { name: 'Next level', exact: true }).click();
  await expect(page.locator('.pp-memory-card')).toHaveCount(8);
  expect((await session(page, 'medium')).gameState.startBoard).toBe(8);
  await page.getByRole('button', { name: 'Close Sight Word Memory', exact: true }).click();
  await page.getByRole('button', { name: /quit|leave/i }).click();
});

test('next level continues after completed cycle words instead of drawing a random difficulty pool', async ({ page }) => {
  await page.addInitScript(({ scope, steps }) => {
    localStorage.setItem(`literacy-guide-learn-games:${scope}`, JSON.stringify({ games: { 'sight-word-memory': {
      practiceRecord: { v: 3, status: 'completed', completions: [{ id: 'cycle-word-outing', contentVersion: 'learn-game-practice-v1',
        completedAt: '2026-09-14T00:00:00Z', steps }] }
    } } }));
  }, { scope, steps: Array.from({ length: WORD_MATCH_EXTENSION_START }, (_, board) =>
    wordMatchBoardWords(board).map(({ word }, pair) => ({ round: `${WORD_MATCH_VERSION}:${board}:${pair}`, target: word, correct: true }))).flat() });
  await openMemory(page);
  expect((await session(page)).gameState.startBoard).toBe(WORD_MATCH_EXTENSION_START);
  expect([...new Set((await session(page)).gameState.boards[0].map(card => card.word))].sort()).toEqual(['at', 'in', 'it', 'on']);
});

for (const [width, height] of [[1024,768], [768,1024], [320,568], [568,320]]) {
  test(`eight cards stay readable and reachable at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openMemory(page);
    const boxes = await page.locator('.pp-memory-card').evaluateAll(cards => cards.map(card => card.getBoundingClientRect().toJSON()));
    for (const box of boxes) {
      expect(box.width).toBeGreaterThanOrEqual(56);
      expect(box.height).toBeGreaterThanOrEqual(56);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      expect(box.y + box.height).toBeLessThanOrEqual(height);
    }
    await completeBoard(page);
    await expect(page.locator('.pp-memory-table')).toHaveAttribute('data-table', '1');
    await mkdir('.artifacts/word-match', { recursive: true });
    await page.screenshot({ path: `.artifacts/word-match/arcade-${width}x${height}.png` });
  });
}

test('Adventure Map offers and remembers more word matches after all 27 cycles', async ({ page }) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(progress => {
    if (!localStorage.getItem('lp-el-quest:child-surface-preview')) {
      localStorage.setItem('lp-el-quest:child-surface-preview', JSON.stringify(progress));
    }
  }, { ...emptyElQuestProgress(), cycles: Object.fromEntries(elSkillsBlockCycles.filter(cycle => cycle.type === 'cycle').map(cycle => [cycle.id, { stars: 1 }])) });
  await page.goto('/preview/child-surfaces.html?surface=adventure-map&preserveAdventure=1');
  await expect(page.locator('[data-child-primary]')).toHaveCount(1);
  await page.getByRole('button', { name: 'More Word Match', exact: true }).click();
  const cycle = elSkillsBlockCycles.find(item => item.cycleNumber === 27);
  const plan = buildStationRounds(cycle, 'spell', { wordMatchStartBoard: WORD_MATCH_EXTENSION_START });
  for (let index = 0; index < plan.length; index += 1) {
    await expect(page.getByRole('heading', { name: `${index + 1} of ${plan.length}`, exact: true })).toBeVisible();
    await expect(page.locator('.am-word-memory__card')).toHaveCount(8);
    const seen = new Map();
    while (await page.locator('[data-card-state="hidden"]').count()) {
      const hidden = page.locator('[data-card-state="hidden"]');
      const ids = await hidden.evaluateAll(cards => cards.map(card => card.dataset.cardId));
      const first = ids.find(id => seen.has(id) && ids.some(other => other !== id && seen.get(other) === seen.get(id))) || ids[0];
      const card = page.locator(`[data-card-id="${first}"]`);
      await card.tap();
      const word = (await card.textContent()).replace(/\s/g, '');
      seen.set(first, word);
      const second = ids.find(id => id !== first && seen.get(id) === word) || ids.find(id => id !== first && !seen.has(id)) || ids.find(id => id !== first);
      const other = page.locator(`[data-card-id="${second}"]`);
      await other.tap();
      const otherWord = (await other.textContent()).replace(/\s/g, '');
      seen.set(second, otherWord);
      if (word !== otherWord) await expect(page.locator('[data-card-state="open"]')).toHaveCount(0);
      if (ids.length === 2) break;
    }
  }
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('lp-el-quest:child-surface-preview')).cycles['cycle-27'].wordMatchNextBoard))
    .toBe(WORD_MATCH_EXTENSION_START + 3);
  await page.goto('/preview/child-surfaces.html?surface=adventure-map&preserveAdventure=1');
  await page.getByRole('button', { name: 'More Word Match', exact: true }).click();
  await expect(page.locator('.am-word-memory__card')).toHaveCount(8);
  const seed = await page.locator('[data-run-seed]').getAttribute('data-run-seed');
  const resumed = buildStationRounds(cycle, 'spell', { seed, wordMatchStartBoard: WORD_MATCH_EXTENSION_START + 3 });
  const card = page.locator(`[data-card-id="${resumed[0].cards[0].id}"]`);
  await card.click();
  await expect(card).toHaveText(resumed[0].cards[0].word);
});

for (const [width, height] of [[1024,768], [768,1024], [320,568], [568,320]]) {
  test(`later long words fit both matching games at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const longest = WORD_MATCH_WORDS.reduce((a, b) => a.word.length > b.word.length ? a : b);
    const board = Math.floor(WORD_MATCH_WORDS.indexOf(longest) / 4);
    const steps = Array.from({ length: board }, (_, index) => wordMatchBoardWords(index).map(({ word }, pair) => ({
      round: `${WORD_MATCH_VERSION}:${index}:${pair}`, target: word, correct: true
    }))).flat();
    const adventureProgress = { ...emptyElQuestProgress(), cycles: Object.fromEntries(elSkillsBlockCycles.filter(cycle => cycle.type === 'cycle')
      .map(cycle => [cycle.id, { stars: 1, ...(cycle.cycleNumber === 27 ? { wordMatchNextBoard: board } : {}) }])) };
    await page.addInitScript(({ scope, steps, adventureProgress }) => {
      localStorage.setItem(`literacy-guide-learn-games:${scope}`, JSON.stringify({ games: { 'sight-word-memory': {
        practiceRecord: { v: 3, completions: [{ id: 'long-word-practice', contentVersion: 'learn-game-practice-v1', completedAt: '2026-09-14T00:00:00Z', steps }] }
      } } }));
      localStorage.setItem('lp-el-quest:child-surface-preview', JSON.stringify(adventureProgress));
    }, { scope, steps, adventureProgress });

    async function expectTextFits(card, textSelector) {
      await expect(card).toBeVisible();
      const fit = await card.evaluate((element, selector) => {
        const text = element.querySelector(selector);
        const range = document.createRange();
        range.selectNodeContents(text);
        const bounds = range.getBoundingClientRect();
        const box = element.getBoundingClientRect();
        return { contained: bounds.left >= box.left && bounds.right <= box.right,
          width: box.width, height: box.height, font: getComputedStyle(text).fontSize };
      }, textSelector);
      expect(fit.contained, JSON.stringify(fit)).toBe(true);
      expect(fit.width).toBeGreaterThanOrEqual(56);
      expect(fit.height).toBeGreaterThanOrEqual(56);
    }
    await openMemory(page);
    const arcadeState = (await session(page)).gameState;
    const arcadeCard = arcadeState.boards[0].find(card => card.word === longest.word);
    const card = page.locator(`[data-card-id="${arcadeCard.id}"]`);
    await card.click();
    await expectTextFits(card, '.pp-card-front');
    await page.screenshot({ path: `.artifacts/word-match/arcade-long-${width}x${height}.png` });

    await page.goto('/preview/child-surfaces.html?surface=adventure-map&quest=cycle-27&station=spell&preserveAdventure=1');
    await expect(page.locator('.am-word-memory__card')).toHaveCount(8);
    const adventureBoxes = await page.locator('.am-word-memory__card').evaluateAll(cards => cards.map(card => {
      const box = card.getBoundingClientRect();
      const stage = card.closest('.adventure-round-frame__stage').getBoundingClientRect();
      return { width: box.width, height: box.height, visible: box.left >= stage.left && box.right <= stage.right
        && box.top >= stage.top && box.bottom <= stage.bottom && box.top >= 0 && box.bottom <= innerHeight };
    }));
    for (const box of adventureBoxes) {
      expect(box.width).toBeGreaterThanOrEqual(56);
      expect(box.height).toBeGreaterThanOrEqual(56);
      expect(box.visible, JSON.stringify(box)).toBe(true);
    }
    const seed = await page.locator('[data-run-seed]').getAttribute('data-run-seed');
    const rounds = buildStationRounds(elSkillsBlockCycles.find(cycle => cycle.cycleNumber === 27), 'spell', { seed, wordMatchStartBoard: board });
    const adventureCard = rounds[0].cards.find(item => item.word === longest.word);
    const match = page.locator(`[data-card-id="${adventureCard.id}"]`);
    await match.click();
    await expectTextFits(match, 'span');
    await page.screenshot({ path: `.artifacts/word-match/adventure-long-${width}x${height}.png` });
  });
}
