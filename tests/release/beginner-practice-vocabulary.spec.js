import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { elSkillsBlockCycles } from '../../src/data/elSkillsBlockCycles.js';
import { isCyclePictureWordEligible } from '../../src/data/cycleSoundWords.js';
import { buildStationRounds } from '../../src/components/elQuest/elQuestEngine.js';
import { isBeginnerSoundGameWord, wordStartsWithTargetSound } from '../../src/utils/rocketRunRounds.js';
import { climbToStation, readClimbSnapshot, retainClimbBoundary } from './word-climb-input.js';

test.use({ hasTouch: true, viewport: { width: 1024, height: 768 } });

async function retainJson(info, name, value) {
  const path = info.outputPath(`${name}.json`);
  await writeFile(path, JSON.stringify(value, null, 2));
  await info.attach(name, { path, contentType: 'application/json' });
}

async function currentClimbReady(page) {
  await page.waitForFunction(() => document.querySelector('.word-climb')
    || [...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Continue'));
  const resume = page.getByRole('button', { name: 'Continue', exact: true });
  if (await resume.isVisible()) await resume.tap();
  await expect(page.locator('.word-climb')).toBeVisible();
  await expect(page.locator('.wc-scene canvas')).toBeVisible();
  // Inspect delivered artwork, not the older React readiness marker. The real
  // renderer and controls remain active throughout this test, including reload.
  await expect.poll(() => page.locator('.wc-scene').evaluate(node => {
    const visual = node.__wordClimbVisual?.();
    return visual?.representation && visual.representation !== 'loading';
  })).toBeTruthy();
}

test('easy Word Climb uses familiar choices through native play, wrong feedback, reload and a correct landing', async ({ page }, info) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    const key = 'literacy-guide-learn-games:fullscreen-overlay-preview';
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({
      difficulty: 'easy', soundEnabled: true, musicEnabled: false,
      games: { 'word-climb': { checkpoints: { easy: { level: 0, totalLevels: 6, chapter: 0, sessionSeed: 3 } } } }
    }));
  });
  try {
    await page.goto('/preview/game-overlay.html?game=word-climb&difficulty=easy&sound=1&music=0');
    await currentClimbReady(page);
    await climbToStation(page);
    const game = page.locator('.word-climb');
    await expect(game).toHaveAttribute('data-journey-phase', 'word');
    const first = await readClimbSnapshot(page);
    expect(first.session.round.sequence.every(row => isBeginnerSoundGameWord(row.word))).toBe(true);
    const choices = page.locator('[data-wc="choice"]');
    const words = await choices.locator('strong').allTextContents();
    expect(words).toHaveLength(3);
    expect(words.every(isBeginnerSoundGameWord)).toBe(true);
    const target = first.session.target;
    const wrong = words.find(word => !wordStartsWithTargetSound(word, target));
    const right = words.find(word => wordStartsWithTargetSound(word, target));
    await page.locator('[data-wc="replay"]').tap();
    await page.waitForFunction(() => window.__arcadePreviewSnapshot?.()?.cue.delivery === 'delivered');
    await page.screenshot({ path: info.outputPath('climb-familiar-choices.png') });
    await choices.filter({ has: page.getByText(wrong, { exact: true }) }).tap();
    await expect(game).toHaveAttribute('data-reading-errors', '1');
    await expect(page.locator('[data-wc="feedback"]')).toContainText(`${wrong} starts with`);
    await expect.poll(async () => (await readClimbSnapshot(page))?.evidence.firstResponses.length).toBe(1);
    const mistaken = await readClimbSnapshot(page);
    expect(mistaken.evidence.firstResponses[0].selected).toBe(wrong);
    expect(mistaken.evidence.firstResponses[0].correct).toBe(false);
    expect(mistaken.evidence.firstResponses[0].choices.map(choice => choice.word)).toEqual(words);
    await page.reload();
    await currentClimbReady(page);
    await expect(game).toHaveAttribute('data-reading-errors', '1');
    const resumed = await readClimbSnapshot(page);
    expect(resumed.session).toEqual(mistaken.session);
    expect(resumed.evidence.firstResponses).toEqual(mistaken.evidence.firstResponses);
    expect(await choices.locator('strong').allTextContents()).toEqual(words);
    await choices.filter({ has: page.getByText(right, { exact: true }) }).tap();
    await expect(game).toHaveAttribute('data-wc-progress', '1');
    await expect.poll(async () => (await readClimbSnapshot(page))?.evidence.completions.length).toBe(1);
    const completed = await readClimbSnapshot(page);
    expect(completed.evidence.firstResponses).toEqual(mistaken.evidence.firstResponses);
    expect(completed.evidence.assistedRetries.at(-1).selected).toBe(right);
    expect(completed.evidence.assistedRetries.at(-1).correct).toBe(true);
    await retainJson(info, 'climb-vocabulary-and-evidence', { words, target, mistaken, resumed, completed });
    await page.screenshot({ path: info.outputPath('climb-correct-landing.png') });
  } finally {
    await retainClimbBoundary(page, info);
  }
});

test('Adventure picture practice renders eligible words and preserves a wrong response in its current teaching flow', async ({ page }, info) => {
  test.setTimeout(60_000);
  // Observe real media end events without replacing playback or shortening it.
  await page.addInitScript(() => {
    window.__beginnerEndedAudio = [];
    const play = HTMLMediaElement.prototype.play;
    const observed = new WeakSet();
    HTMLMediaElement.prototype.play = function (...args) {
      if (!observed.has(this)) {
        observed.add(this);
        this.addEventListener('ended', () => window.__beginnerEndedAudio.push(new URL(this.currentSrc || this.src, location.href).pathname));
      }
      return play.apply(this, args);
    };
  });
  const cycle = elSkillsBlockCycles.find(item => item.id === 'cycle-12');
  const storageKey = 'lp-el-quest:child-surface-preview';
  const saved = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey);
  await page.goto(`/preview/child-surfaces.html?surface=adventure-map&quest=${cycle.id}&preserveAdventure=1&motion=reduced`);
  await page.getByRole('button', { name: /^Picture Sounds / }).tap();
  const view = page.locator('[data-quest-view="round"]');
  await expect(view).toBeVisible();
  const rounds = buildStationRounds(cycle, 'hunt', { seed: await view.getAttribute('data-run-seed') });
  expect(rounds.flatMap(round => round.objects || []).every(object => isCyclePictureWordEligible(object.word))).toBe(true);
  const round = rounds[0];
  const choices = page.locator('.am-simple-picture-choice');
  await expect(choices).toHaveCount(round.objects.length);
  expect(await choices.evaluateAll(nodes => nodes.map(node => node.dataset.sceneWord))).toEqual(round.objects.map(object => object.word));
  await expect.poll(() => choices.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  await page.getByRole('button', { name: 'Hear instructions again', exact: true }).tap();
  await expect.poll(() => page.evaluate(source => window.__beginnerEndedAudio.includes(source), round.audio), { timeout: 15000 }).toBe(true);
  await page.screenshot({ path: info.outputPath('adventure-familiar-choices.png') });
  const wrong = round.objects.find(object => !object.matches).word;
  await page.getByRole('button', { name: `Choose ${wrong}`, exact: true }).tap();
  await expect(page.locator('.adventure-round-frame')).toHaveAttribute('data-feedback-tone', 'retry');
  await expect.poll(async () => (await saved())?.learningCheckpoint?.runState.questionRecords[0]?.selectedAnswer).toBe(wrong);
  await expect(page.getByRole('heading', { name: 'Look, listen, then match', exact: true })).toBeVisible();
  const mistaken = await saved();
  expect(mistaken.learningCheckpoint.runState.questionRecords[0].isCorrect).toBe(false);
  expect(mistaken.learningCheckpoint.runState.questionRecords[0].audioDelivery).toBe('delivered');
  expect(mistaken.learningCheckpoint.episode.phase).toBe('teaching');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Look, listen, then match', exact: true })).toBeVisible();
  const resumed = await saved();
  expect(resumed.learningCheckpoint.runState.questionRecords).toEqual(mistaken.learningCheckpoint.runState.questionRecords);
  expect(resumed.learningCheckpoint.rounds).toEqual(mistaken.learningCheckpoint.rounds);
  await page.getByRole('button', { name: `Match ${round.answer}`, exact: true }).tap();
  await expect.poll(async () => (await saved())?.learningCheckpoint?.episode?.guidedActions.length).toBeGreaterThan(0);
  const guided = await saved();
  expect(guided.learningCheckpoint.runState.questionRecords).toEqual(mistaken.learningCheckpoint.runState.questionRecords);
  await retainJson(info, 'adventure-vocabulary-and-evidence', { round, mistaken, resumed, guided });
  await page.screenshot({ path: info.outputPath('adventure-guided-response.png') });
});
