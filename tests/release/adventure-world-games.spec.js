import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { buildAdventureRoundSet } from '../../src/utils/adventureRounds.js';

test.use({ hasTouch: true, actionTimeout: 10000 });
const out = '.artifacts/phonics-overhaul/adventure-host';
const scope = 'fullscreen-overlay-preview';
const progressKey = `literacy-guide-learn-games:${scope}`;
const games = [
  { id: 'word-rescue', title: 'Word Rescue', mode: 'rescue', response: '[data-aw="pickup"]', value: 'data-value', points: 20 },
  { id: 'sound-sort-factory', title: 'Sound Sort Factory', mode: 'sort', response: '[data-aw="chute"]', value: 'data-bin', points: 15 },
  { id: 'letter-garden', title: 'Letter Garden', mode: 'garden', response: '[data-seed]', value: 'data-seed', points: 16 }
];
const stage = (page, game) => page.locator(`[data-aw-mode="${game.mode}"]`);
const sessionKey = (game, difficulty) => `literacy-guide-adventure-world:${scope}:${game.mode}:${difficulty}`;
const deck = (roundSet, game) => game.mode === 'sort' ? roundSet.sort.items : roundSet[game.mode];
const answer = (item, game) => game.mode === 'sort' ? item.bin : game.mode === 'garden' ? item.word[item.changeIndex] : item.word;
const response = (page, game, value) => page.locator(`${game.response}[${game.value}="${value}"]`);
const saved = (page, game, difficulty = 'easy') => page.evaluate(key => JSON.parse(localStorage.getItem(key)), sessionKey(game, difficulty));
const record = (page, game) => page.evaluate(({ progressKey, id }) => JSON.parse(localStorage.getItem(progressKey)).games[id], { progressKey, id: game.id });

// Synthetic fixtures use the retained legacy builder and envelope schema,
// including the longer Factory deck. New outings must preserve saved content.
function legacy(game, difficulty = 'easy', index = 1) {
  const roundSet = buildAdventureRoundSet(game.mode, difficulty, 0, () => .37);
  const items = deck(roundSet, game);
  const level = index === 'last' ? items.length - 1 : index;
  return { v: 1, roundSet, index: level, score: level * game.points,
    grown: game.mode === 'garden' ? items.slice(0, level) : [],
    planks: game.mode === 'rescue' ? level : 0,
    wrongs: 0, accepted: false, sortMotion: { phase: 'idle', bin: '', token: 0 },
    evidence: { firstResponses: [], assistedRetries: [] }, attempts: [],
    worldSnapshot: { x: 90, camera: 0, carry: null, friendX: items.length * 1120 + 30, discoveries: [] } };
}
async function seed(page, entries) {
  await page.addInitScript(({ entries, progressKey }) => {
    if (localStorage.getItem(progressKey)) return;
    const games = {};
    for (const entry of entries) {
      const row = games[entry.id] ||= { checkpoints: {} };
      row.checkpoints[entry.difficulty] = { level: entry.saved.index, totalLevels: entry.total, sessionSeed: 731 };
      localStorage.setItem(entry.key, JSON.stringify(entry.saved));
    }
    localStorage.setItem(progressKey, JSON.stringify({ v: 1, games }));
  }, { progressKey, entries: entries.map(({ game, difficulty = 'easy', saved }) => ({ id: game.id, difficulty, saved, key: sessionKey(game, difficulty), total: deck(saved.roundSet, game).length })) });
}
async function open(page, game, difficulty = 'easy', continued = false) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/preview/game-overlay.html?game=${game.id}&difficulty=${difficulty}&sound=0&music=0`);
  if (continued) await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(stage(page, game)).toBeVisible();
}
async function clock(page) {
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
}
async function reloadWithClock(page, game) {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.clock.runFor(250);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  // React's lazy stage import may resolve after the fake clock was paused.
  // Allow short paint tasks without exhausting an accepted response dwell.
  await expect.poll(async () => {
    await page.clock.runFor(20);
    return stage(page, game).count();
  }, { intervals: [100, 250] }).toBe(1);
}
test.beforeAll(async () => mkdir(out, { recursive: true }));

// Each overhaul suite proves full outings, content bands, geometry and motion.
// Here one real final response exercises the shared host completion contract.
for (const game of games) for (const action of ['Replay level', 'Next level']) {
  test(`${game.id}: completion traps focus, makes chrome inert and ${action} starts cleanly`, async ({ page }) => {
    const before = legacy(game, 'easy', 'last');
    await seed(page, [{ game, saved: before }]);
    await open(page, game, 'easy', true);
    await clock(page);
    expect((await saved(page, game)).roundSet).toEqual(before.roundSet);
    await response(page, game, answer(deck(before.roundSet, game).at(-1), game)).press('Enter');
    await page.clock.runFor(1800);
    const next = page.getByRole('button', { name: 'Next level', exact: true });
    const replay = page.getByRole('button', { name: 'Replay level', exact: true });
    await expect(next).toBeFocused();
    await expect(page.locator('.lg-game-player-header')).toHaveAttribute('inert', '');
    await page.keyboard.press('Tab');
    await expect(replay).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(next).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(replay).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(next).toBeFocused();
    expect((await record(page, game)).practiceRecord.completions).toHaveLength(1);
    await page.screenshot({ path: `${out}/${game.id}-${action === 'Replay level' ? 'replay' : 'next'}-completion.png` });
    await page.getByRole('button', { name: action, exact: true }).click();
    await expect(stage(page, game)).toHaveAttribute('data-aw-index', '0');
    const difficulty = action === 'Replay level' ? 'easy' : 'medium';
    await expect(page.locator('.lg-game-title-chip>span')).toHaveText(difficulty);
    await expect(page.locator('.lg-game-player-header')).not.toHaveAttribute('inert');
    const fresh = await saved(page, game, difficulty);
    expect(fresh.score).toBe(0);
    expect(fresh.planks).toBe(0);
    expect(fresh.grown).toEqual([]);
    expect(fresh.evidence.firstResponses).toEqual([]);
    expect(fresh.roundSet).not.toEqual(before.roundSet);
    expect((await record(page, game)).practiceRecord.completions).toHaveLength(1);
  });
}

for (const game of games) test(`${game.id}: legacy deck, wrong-answer evidence and accepted result survive reload and quit recovery`, async ({ page }) => {
  const before = legacy(game);
  await seed(page, [{ game, saved: before }]);
  await open(page, game, 'easy', true);
  await clock(page);
  const target = answer(deck(before.roundSet, game)[1], game);
  const wrong = (await page.locator(game.response).evaluateAll((buttons, attribute) => buttons.map(button => button.getAttribute(attribute)), game.value)).find(value => value !== target);
  const stableLetters = game.mode === 'garden' ? await page.locator('.pb-garden-letter').allTextContents() : null;
  await response(page, game, wrong).tap();
  await expect(stage(page, game)).toHaveAttribute('data-aw-index', '1');
  expect((await saved(page, game)).score).toBe(before.score);
  if (stableLetters) expect(await page.locator('.pb-garden-letter').allTextContents()).toEqual(stableLetters);
  await page.screenshot({ path: `${out}/${game.id}-legacy-wrong.png` });
  await reloadWithClock(page, game);
  const restored = await saved(page, game);
  expect(restored.roundSet).toEqual(before.roundSet);
  expect(restored.score).toBe(before.score);
  expect(restored.grown).toEqual(before.grown);
  expect(restored.planks).toBe(before.planks);
  expect(restored.wrongs).toBe(1);
  expect(restored.evidence.firstResponses).toHaveLength(1);
  expect(restored.evidence.firstResponses[0]).toMatchObject({ round: 1, correct: false });
  await expect(response(page, game, target)).toBeEnabled();
  await response(page, game, target).press('Space');
  await expect(response(page, game, target)).toBeDisabled();
  await page.getByRole('button', { name: `Close ${game.title}`, exact: true }).click();
  const quit = page.getByRole('alertdialog');
  await expect(quit).toBeVisible();
  await expect(page.getByRole('button', { name: 'Keep playing', exact: true })).toBeFocused();
  await expect(page.locator('.lg-game-player-main')).toHaveAttribute('inert', '');
  await expect(stage(page, game)).toHaveClass(/pr-paused|is-paused/);
  await page.clock.runFor(30);
  await page.clock.runFor(3000);
  expect((await saved(page, game)).index).toBe(1);
  expect((await saved(page, game)).accepted).toBe(true);
  await page.getByRole('button', { name: 'Keep playing', exact: true }).click();
  await expect(stage(page, game)).not.toHaveClass(/pr-paused|is-paused/);
  await page.clock.runFor(30);
  await page.clock.runFor(1800);
  await expect(stage(page, game)).toHaveAttribute('data-aw-index', '2');
  const recovered = await saved(page, game);
  expect(recovered.score).toBe(before.score + game.points);
  expect(recovered.evidence.assistedRetries).toHaveLength(1);
  expect(recovered.evidence.assistedRetries[0]).toMatchObject({ round: 1, practiceOnly: true, independent: false });
  expect((await record(page, game)).practiceRecord?.completions || []).toEqual([]);
});

for (const game of games) test(`${game.id}: Start over discards the old partial world and saved deck`, async ({ page }) => {
  const before = legacy(game, 'easy', 2);
  await seed(page, [{ game, saved: before }]);
  await page.goto(`/preview/game-overlay.html?game=${game.id}&sound=0&music=0`);
  await page.getByRole('button', { name: 'Start over', exact: true }).click();
  await expect(stage(page, game)).toHaveAttribute('data-aw-index', '0');
  const fresh = await saved(page, game);
  expect(fresh.score).toBe(0);
  expect(fresh.planks).toBe(0);
  expect(fresh.grown).toEqual([]);
  expect(fresh.roundSet).not.toEqual(before.roundSet);
  expect(fresh.evidence.firstResponses).toEqual([]);
});

test('Factory Next level continues an existing Medium legacy shift instead of replacing it with a shorter fresh outing', async ({ page }) => {
  const game = games.find(item => item.mode === 'sort');
  const easy = legacy(game, 'easy', 'last');
  const medium = legacy(game, 'medium', 30);
  await seed(page, [{ game, saved: easy }, { game, difficulty: 'medium', saved: medium }]);
  await open(page, game, 'easy', true);
  await clock(page);
  await response(page, game, answer(deck(easy.roundSet, game).at(-1), game)).tap();
  await page.clock.runFor(1800);
  await page.getByRole('button', { name: 'Next level', exact: true }).click();
  const continuation = page.getByRole('button', { name: 'Continue', exact: true });
  await expect(continuation).toBeFocused();
  await expect(page.locator('.lg-game-player-main')).toHaveAttribute('inert', '');
  await continuation.click();
  await expect(stage(page, game)).toHaveAttribute('data-aw-index', '30');
  const resumed = await saved(page, game, 'medium');
  expect(resumed.roundSet).toEqual(medium.roundSet);
  expect(resumed.score).toBe(medium.score);
  await expect(response(page, game, answer(deck(medium.roundSet, game)[30], game))).toBeEnabled();
});
