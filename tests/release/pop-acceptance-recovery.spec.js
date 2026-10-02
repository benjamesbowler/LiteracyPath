import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { hfwOptions, sightWordPool } from '../../src/utils/recognitionPractice.js';
import { gameRandom } from '../../src/utils/gameReplay.js';
import { advanceLearningResponseReceipt, commitLearningResponse, createLearningResponseEpisode, recordLearningGuidedAction, recordLearningGuidedStep, startLearningWithModel } from '../../src/utils/learningResponseState.js';
import { LEARNING_PACE } from '../../src/utils/learningPace.js';

const key = 'literacy-guide-phonics-play:fullscreen-overlay-preview:target:easy';
const progressKey = 'literacy-guide-learn-games:fullscreen-overlay-preview';
const out = '.artifacts/phonics-overhaul/pop-clock-followup';
test.setTimeout(60000);
const read = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const copy = value => JSON.parse(JSON.stringify(value));
const question = (word, options, id) => ({ id, formatType: 'word_recognition', construct: 'high_frequency_word_recognition', word, display: word,
  hideStimulusModel: false, prompt: 'Find the word.', answerOptions: options.map(label => ({ id: label, label })) });

// Use current episode transitions to create exact old envelopes; no fabricated
// phase/cursor shortcuts. Earlier slots mix independent and supported closure.
function learning(words, pool, round, modelFirst = false, unresolved = false) {
  const target = words[round], options = hfwOptions(target, pool, gameRandom(`options:${round}`));
  const fresh = pool.find(word => !words.includes(word));
  const q = question(target, options, `pop:${round}:${target}`);
  const transfer = { question: question(fresh, hfwOptions(fresh, pool, gameRandom(`fresh:${round}`)), `pop:transfer:${fresh}`), expected: fresh };
  let episode = createLearningResponseEpisode({ id: `seed-pop-${round}`, instrument: 'recognition_target', slotId: `seed-pop-${round}`, question: q, expected: target, transfer });
  episode = modelFirst ? startLearningWithModel(episode) : advanceLearningResponseReceipt(commitLearningResponse(episode,
    { selected: options.find(word => word !== target), correct: false, supported: true, supportUsed: ['word_contrast'] }));
  episode = recordLearningGuidedAction(recordLearningGuidedStep(episode, 0), target);
  const receipt = commitLearningResponse(episode, { selected: unresolved ? transfer.question.answerOptions.find(option => option.id !== fresh).id : fresh,
    correct: !unresolved, supported: true, supportUsed: ['word_contrast', 'after_teaching'], media: { targetDelivery: 'unavailable' } });
  episode = advanceLearningResponseReceipt(receipt);
  if (unresolved) episode = recordLearningGuidedAction(recordLearningGuidedStep(episode, 0), fresh);
  return { options, episode, receipt };
}
const first = (round, target, response, correct) => ({ game: 'pop-the-word', round, target, response, correct, practiceOnly: true, independent: false,
  construct: 'high_frequency_word_recognition', supportUsed: ['printed_target'], audioDelivery: 'not_measured' });
const assisted = (round, target, episode) => ({ game: 'pop-the-word', round, target, attempts: episode.firstResponse ? 1 : 0,
  supportUsed: ['worked_model', 'fresh_transfer'], learningEpisode: episode, practiceOnly: true, independent: false, audioDelivery: 'not_measured' });
function fixture(round = 0, { credited = false, native = false, modelFirst = false, unresolved = false, receipt = false } = {}) {
  const pool = sightWordPool('easy'), words = pool.slice(0, 16);
  const current = learning(words, pool, round, modelFirst, unresolved);
  const evidence = { firstResponses: [], assistedRetries: [] };
  // r0 is assisted and r2 is model-first, so correct cannot be mistaken for
  // the number of independently correct first responses at the later slot.
  for (let i = 0; i < round; i += 1) {
    if (i === 0 || i === 2) {
      const prior = learning(words, pool, i, i === 2);
      if (prior.episode.firstResponse) evidence.firstResponses.push(first(i, words[i], prior.episode.firstResponse.selected, false));
      evidence.assistedRetries.push(assisted(i, words[i], prior.episode));
    } else evidence.firstResponses.push(first(i, words[i], words[i], true));
  }
  if (native) evidence.firstResponses.push(first(round, words[round], words[round], true));
  else if (!modelFirst) evidence.firstResponses.push(first(round, words[round], current.episode.firstResponse.selected, false));
  const beforeScore = Array.from({ length: round }, (_, i) => 20 + Math.min(10, i * 2)).reduce((score, award) => score + award, 0);
  const beforeStreak = native || modelFirst ? round : 0;
  const award = 20 + Math.min(10, beforeStreak * 2);
  const discoveries = words.slice(0, round).map((sentence, i) => ({ id: `word-${i}`, sentence }));
  if (credited) {
    discoveries.push({ id: `word-${round}`, sentence: words[round] });
    if (!native) evidence.assistedRetries.push(assisted(round, words[round], current.episode));
  }
  return { v: 1, gameState: { pool, words, rerollKey: 0, sessionSeed: 731 }, round,
    correct: round + Number(credited), score: beforeScore + (credited ? award : 0), streak: beforeStreak + Number(credited), wrongs: round ? 1 + Number(!native && !modelFirst) : Number(!native && !modelFirst),
    evidence, discoveries, modelNext: credited && unresolved,
    stage: { round, data: { options: current.options, still: true, popped: !receipt, wrong: '', attempts: native || modelFirst ? 0 : 1,
      recovery: receipt ? { id: current.receipt.id, modelFirst, task: { episode: current.receipt, draft: [], delivery: 'unavailable' } } : null,
      learningEpisode: native || receipt ? null : current.episode } },
    expected: { award, beforeScore, episode: current.episode } };
}
async function seed(page, entry) {
  const saved = copy(entry); delete saved.expected;
  await page.addInitScript(({ key, progressKey, saved }) => {
    if (sessionStorage.getItem('seed-pop-envelope')) return;
    localStorage.setItem(key, JSON.stringify(saved));
    localStorage.setItem(progressKey, JSON.stringify({ v: 1, games: { 'pop-the-word': { checkpoints: { easy: { level: saved.round, totalLevels: saved.gameState.words.length, sessionSeed: 731 } } } } }));
    sessionStorage.setItem('seed-pop-envelope', '1');
  }, { key, progressKey, saved });
}
async function open(page, continued = true) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/game-overlay.html?game=pop-the-word&sound=0&music=0');
  if (continued) await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('.pr-pop')).toBeVisible();
}
async function freeze(page) { await page.clock.install(); await page.clock.pauseAt(new Date(Date.now() + 1000)); }
async function untilRound(page, round) {
  await expect.poll(async () => { await page.clock.runFor(100); return (await read(page))?.round; }, { intervals: [0, 50, 100], timeout: 10000 }).toBe(round);
}
async function restore(page) {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.clock.runFor(0);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect.poll(async () => { await page.clock.runFor(20); return page.locator('.pr-pop').count(); }, { intervals: [100, 250] }).toBe(1);
}
function unchangedRows(saved, entry) {
  expect(saved.evidence.firstResponses).toEqual(entry.evidence.firstResponses);
  expect(saved.evidence.assistedRetries.filter(row => row.round !== entry.round)).toEqual(entry.evidence.assistedRetries.filter(row => row.round !== entry.round));
}
function creditedOnce(saved, entry, guided = true) {
  expect(saved.correct).toBe(entry.round + 1);
  expect(saved.score).toBe(entry.expected.beforeScore + entry.expected.award);
  expect(saved.discoveries.filter(item => item.id === `word-${entry.round}`)).toHaveLength(1);
  if (entry.correct === entry.round) expect(saved.acceptedReceipts.filter(id => id === `pop:${entry.round}`)).toHaveLength(1);
  unchangedRows(saved, entry);
  const rows = saved.evidence.assistedRetries.filter(row => row.round === entry.round);
  expect(rows).toHaveLength(guided ? 1 : 0);
  if (guided) {
    const actual = copy(rows[0].learningEpisode), expected = copy(entry.expected.episode);
    if (entry.stage.data.recovery) {
      expect(actual.events.slice(0, -1)).toEqual(expected.events.slice(0, -1));
      expect(actual.events.at(-1).type).toBe('closed');
      delete actual.events; delete expected.events;
    }
    expect(actual).toEqual(expected);
  }
}
test.beforeAll(() => mkdir(out, { recursive: true }));

for (const round of [0, 4]) test(`Pop reconciles legacy guided completion before host credit at slot ${round} and then accepts the next word once`, async ({ page }) => {
  const entry = fixture(round); await seed(page, entry); await open(page); await freeze(page); await untilRound(page, round + 1);
  creditedOnce(await read(page), entry);
  const next = await read(page), target = next.gameState.words[next.round];
  await page.getByRole('button', { name: `Pop ${target}`, exact: true }).press('Enter');
  await expect(page.getByRole('button', { name: `Pop ${target}`, exact: true })).toBeDisabled();
  const accepted = await read(page); expect(accepted.round).toBe(round + 1); expect(accepted.correct).toBe(round + 2);
  await restore(page); expect((await read(page)).correct).toBe(round + 2);
  await untilRound(page, round + 2); await page.clock.runFor(3000);
  const after = await read(page);
  expect(after.round).toBe(round + 2); expect(after.correct).toBe(round + 2); expect(after.score).toBe(accepted.score);
  expect(after.evidence.assistedRetries).toEqual(accepted.evidence.assistedRetries);
  expect(after.evidence.firstResponses).toEqual(accepted.evidence.firstResponses);
  expect(after.discoveries).toEqual(accepted.discoveries);
  expect(after.evidence.firstResponses.filter(row => row.round === round + 1)).toHaveLength(1);
});

for (const round of [0, 4]) test(`Pop restores already credited legacy guided completion at slot ${round} without duplicated reward or evidence`, async ({ page }) => {
  const entry = fixture(round, { credited: true }); await seed(page, entry); await open(page); await freeze(page);
  await untilRound(page, round + 1); const saved = await read(page); creditedOnce(saved, entry);
  expect(saved.evidence).toEqual(entry.evidence); expect(saved.discoveries).toEqual(entry.discoveries);
  await restore(page); await page.clock.runFor(3000);
  expect((await read(page)).round).toBe(round + 1); expect((await read(page)).score).toBe(entry.score);
});

test('Pop recovers a later model-first unresolved closure without inventing a first response', async ({ page }) => {
  const entry = fixture(4, { modelFirst: true, unresolved: true }); await seed(page, entry); await open(page); await freeze(page); await untilRound(page, 5);
  const saved = await read(page); creditedOnce(saved, entry); expect(saved.modelNext).toBe(true);
  expect(saved.evidence.assistedRetries.at(-1).learningEpisode.firstResponse).toBeNull();
  await expect(page.locator('[data-learning-phase=teaching]').first()).toBeVisible();
  expect(saved.stage.data.recovery.task.episode.firstResponse).toBeNull();
  await restore(page); await page.clock.runFor(3000);
  expect((await read(page)).score).toBe(saved.score); expect((await read(page)).correct).toBe(5);
});

for (const credited of [false, true]) test(`Pop restores legacy native popped stage with credit ${credited ? 'already saved' : 'not yet saved'}`, async ({ page }) => {
  const entry = fixture(4, { native: true, credited }); await seed(page, entry); await open(page); await freeze(page);
  await untilRound(page, 5); creditedOnce(await read(page), entry, false);
  await restore(page); await page.clock.runFor(3000); creditedOnce(await read(page), entry, false);
  expect((await read(page)).round).toBe(5);
});

test('Pop receipt reload preserves exact first and transfer responses until the full new dwell ends', async ({ page }) => {
  const entry = fixture(4, { receipt: true }); await seed(page, entry); await open(page); await freeze(page);
  const receipt = (await read(page)).stage.data.recovery.task.episode;
  await page.getByRole('button', { name: 'Pause Pop the Word', exact: true }).click();
  await expect(page.locator('.pr-pop')).toHaveAttribute('data-engine-paused', 'true'); await page.clock.runFor(0); await page.clock.runFor(3000);
  expect((await read(page)).stage.data.recovery.task.episode).toEqual(receipt);
  await restore(page); await expect(page.locator('[data-learning-phase=receipt]')).toBeVisible();
  await page.clock.runFor(LEARNING_PACE.word - 1);
  const held = await read(page); expect(held.round).toBe(4); expect(held.correct).toBe(4); expect(held.score).toBe(entry.score);
  expect(held.stage.data.recovery.task.episode).toEqual(receipt);
  await untilRound(page, 5); creditedOnce(await read(page), entry);
});

for (const viewport of [{ width: 320, height: 568 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }]) test(`Pop native failed acceptance keeps the choice and pauses Retry at ${viewport.width}x${viewport.height}`, async ({ page }) => {
  await page.setViewportSize(viewport); await open(page, false); await freeze(page);
  await page.evaluate(key => {
    window.__savePop = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key && JSON.parse(value).stage?.data?.popped && !window.__retryPop) throw new DOMException('Held accepted write', 'QuotaExceededError');
      return window.__savePop.call(this, name, value);
    };
  }, key);
  const before = await read(page), target = before.gameState.words[0];
  await page.getByRole('button', { name: `Pop ${target}`, exact: true }).press('Space');
  const retry = page.getByRole('button', { name: 'Retry save', exact: true }); await expect(retry).toBeVisible();
  await expect(page.locator('.pr-word-balloon:enabled')).toHaveCount(0);
  const box = await retry.boundingBox(); expect(box.width).toBeGreaterThanOrEqual(56); expect(box.height).toBeGreaterThanOrEqual(56);
  expect(box.x).toBeGreaterThanOrEqual(0); expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  await page.getByRole('button', { name: 'Pause Pop the Word', exact: true }).click();
  await expect(page.locator('.pr-pop')).toHaveAttribute('data-engine-paused', 'true'); await expect(retry).toBeDisabled();
  await page.clock.runFor(3000); const held = await read(page); expect(held.correct).toBe(0); expect(held.score).toBe(0); expect(held.round).toBe(0);
  await page.getByRole('button', { name: 'Resume game', exact: true }).click();
  await expect(page.locator('.pr-pop')).toHaveAttribute('data-engine-paused', 'false');
  await page.screenshot({ path: `${out}/native-held-${viewport.width}x${viewport.height}.png` });
  await page.evaluate(() => { window.__retryPop = true; }); await retry.press('Enter');
  await expect(retry).toHaveCount(0); await untilRound(page, 1); const accepted = await read(page);
  expect(accepted.correct).toBe(1); expect(accepted.score).toBe(20); expect(accepted.evidence.firstResponses).toHaveLength(1); expect(accepted.discoveries).toHaveLength(1);
  await restore(page); await page.clock.runFor(3000); expect((await read(page)).score).toBe(20);
});

test('Pop future native acceptance persists popped stage and all credit in the same write', async ({ page }) => {
  await open(page, false); await freeze(page);
  await page.evaluate(key => {
    window.__acceptedWrites = []; const save = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) { if (name === key) { const state = JSON.parse(value); if (state.stage?.data?.popped) window.__acceptedWrites.push(state); } return save.call(this, name, value); };
  }, key);
  const target = (await read(page)).gameState.words[0];
  await page.getByRole('button', { name: `Pop ${target}`, exact: true }).dblclick();
  await expect(page.getByRole('button', { name: `Pop ${target}`, exact: true })).toBeDisabled();
  const writes = await page.evaluate(() => window.__acceptedWrites); expect(writes.length).toBeGreaterThan(0);
  for (const saved of writes) { expect(saved.correct).toBe(1); expect(saved.score).toBe(20); expect(saved.discoveries).toHaveLength(1); expect(saved.evidence.firstResponses).toHaveLength(1); expect(saved.acceptedReceipts).toEqual(['pop:0']); }
  await restore(page); await untilRound(page, 1); const saved = await read(page);
  expect(saved.correct).toBe(1); expect(saved.score).toBe(20); expect(saved.discoveries).toHaveLength(1); expect(saved.evidence.firstResponses).toHaveLength(1);
});

test('Pop reloads a held native choice and applies its one acceptance without reopening the first response', async ({ page }) => {
  await open(page, false); await freeze(page);
  await page.evaluate(key => {
    const save = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key && JSON.parse(value).stage?.data?.popped) throw new DOMException('Held native credit', 'QuotaExceededError');
      return save.call(this, name, value);
    };
  }, key);
  const target = (await read(page)).gameState.words[0];
  await page.getByRole('button', { name: `Pop ${target}`, exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry save', exact: true })).toBeVisible();
  const held = await read(page); expect(held.stage.data.pendingAccept).toBe(target); expect(held.correct).toBe(0); expect(held.score).toBe(0);
  expect(held.evidence.firstResponses).toHaveLength(1); expect(held.evidence.firstResponses[0].correct).toBe(true);
  await restore(page); await untilRound(page, 1); const saved = await read(page);
  expect(saved.correct).toBe(1); expect(saved.score).toBe(20); expect(saved.acceptedReceipts).toEqual(['pop:0']);
  expect(saved.evidence.firstResponses).toEqual(held.evidence.firstResponses); expect(saved.discoveries).toHaveLength(1);
  await restore(page); await page.clock.runFor(3000); expect((await read(page)).round).toBe(1); expect((await read(page)).score).toBe(20);
});

test('Pop held guided completion reload commits one atomic reward and the exact evidence', async ({ page }) => {
  const entry = fixture(4, { receipt: true }); await seed(page, entry); await open(page); await freeze(page);
  await page.evaluate(key => {
    window.__acceptedWrites = []; const save = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) { const state = JSON.parse(value); if (state.stage?.data?.popped) { window.__acceptedWrites.push(state); throw new DOMException('Held completed write', 'QuotaExceededError'); } }
      return save.call(this, name, value);
    };
  }, key);
  await expect.poll(async () => { await page.clock.runFor(100); return page.getByRole('button', { name: 'Retry save', exact: true }).count(); }, { intervals: [0, 50, 100] }).toBe(1);
  const held = await read(page); expect(held.correct).toBe(4); expect(held.score).toBe(entry.score); expect(held.stage.data.recovery.task.episode.phase).toBe('complete');
  const writes = await page.evaluate(() => window.__acceptedWrites); expect(writes.length).toBeGreaterThan(0);
  for (const saved of writes) { expect(saved.correct).toBe(5); expect(saved.score).toBe(entry.expected.beforeScore + entry.expected.award); expect(saved.evidence.assistedRetries.filter(row => row.round === 4)).toHaveLength(1); expect(saved.discoveries.filter(item => item.id === 'word-4')).toHaveLength(1); }
  await restore(page); await untilRound(page, 5); creditedOnce(await read(page), entry);
  await restore(page); await page.clock.runFor(3000); creditedOnce(await read(page), entry); expect((await read(page)).round).toBe(5);
});

for (const credited of [false, true]) test(`Pop final curriculum slot with credit ${credited ? 'already saved' : 'not yet saved'} produces one complete outing after reload`, async ({ page }) => {
  const entry = fixture(15, { credited }); await seed(page, entry);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/preview/game-overlay.html?game=pop-the-word&sound=0&music=0');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Replay level', exact: true })).toBeVisible();
  const record = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).games['pop-the-word'], progressKey);
  expect(record.wordsCompleted).toBe(16); expect(record.highScore).toBe(entry.expected.beforeScore + entry.expected.award); expect(record.plays).toBe(1);
  expect(record.practiceRecord.completions).toHaveLength(1);
  const completion = record.practiceRecord.completions[0];
  expect(completion.steps).toEqual(entry.evidence.firstResponses);
  expect(completion.assistedRetries.filter(row => row.round === 15)).toHaveLength(1);
  expect(completion.assistedRetries.at(-1).learningEpisode).toEqual(entry.expected.episode);
  expect(await read(page)).toBeNull();
  await page.reload(); await expect(page.locator('.pr-pop')).toBeVisible();
  const after = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).games['pop-the-word'], progressKey);
  expect(after.plays).toBe(1); expect(after.highScore).toBe(record.highScore); expect(after.practiceRecord).toEqual(record.practiceRecord);
  expect((await read(page)).correct).toBe(0);
});
