import { expect, test } from '@playwright/test';
import { LETTER_PRACTICE_VERSION } from '../../src/policy/letterPractice.js';
import { shuffleAnswerPositions } from '../../src/utils/answerPositionShuffle.js';
import { cvcPracticeSessionKey } from '../../src/utils/letterPracticeProgress.js';

const key = 'lp_phonics_progress_child-surface-preview:practice-session-v1';
const route = '/preview/child-surfaces.html?surface=phonics';
test.describe.configure({timeout: 90000});
async function open(page) {
  if (!await page.getByRole('button', {name: /^Letter A(?:,|$)/}).count()) await page.getByRole('button', {name: 'Choose a letter', exact: true}).click();
  await page.getByRole('button', {name: /^Letter A(?:,|$)/}).click();
}

for (const [step, index, questionId, target, count, positions] of [[2, 0, 'cvc-build:at:cat', 'c', 5, [0, 4]], [3, 1, 'magic:at:bat:hat', 'hat', 2, [0, 1]]]) {
  for (const position of positions) {
    const seed = Array.from({length: 100}, (_, index) => `workshop-${index}`).find(seed => shuffleAnswerPositions(Array.from({length: count}, (_, index) => index), `${seed}:${questionId}:first-choices`).indexOf(step === 2 ? 0 : 1) === position);
    test(`Word Workshop step ${step} can put its first required choice in slot ${position + 1}`, async ({page}) => {
      const workshopKey = cvcPracticeSessionKey('child-surface-preview');
      await page.addInitScript(({key, seed, step, index}) => {
        if (sessionStorage.getItem('workshop-position-fixture')) return;
        localStorage.setItem(key, JSON.stringify({at: {v: 1, familyId: 'at', id: seed, step, evidence: [], checkpoint: {learningVersion: 1, index, episodes: [], task: null}}}));
        sessionStorage.setItem('workshop-position-fixture', '1');
      }, {key: workshopKey, seed, step, index});
      await page.route('**/*.mp3', route => route.abort());
      await page.goto(`${route}&island=words&unlockWords=1`);
      await page.getByRole('button', {name: 'at word nest', exact: true}).click();
      const board = page.locator(`[data-sibling-learning-task="${step === 2 ? 'cvc_scaffolded_build' : 'cvc_word_magic'}"]`);
      const options = board.locator('.learning-guided-action');
      await expect(options).toHaveCount(count);
      const episode = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).at.checkpoint.task.episode, workshopKey);
      expect(episode.question.id).toBe(questionId);
      expect(episode.question.answerOptions.findIndex(option => option.value === target)).toBe(position);
      if (step === 2) {
        expect(episode.expected).toEqual(['c', 'a', 't']);
        for (const letter of episode.expected) await board.getByRole('button', {name: `Choose ${letter}`, exact: true}).click();
        await expect(board).toHaveAttribute('data-learning-phase', 'receipt');
        const scored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).at.checkpoint.task.episode, workshopKey);
        expect(scored.firstResponse.selected).toEqual(['c', 'a', 't']);
        expect(scored.firstResponse.observedCorrect).toBe(true);
      } else {
        await options.nth(position).click();
        await expect(board).toHaveAttribute('data-learning-phase', 'receipt');
        const scored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).at.checkpoint.task.episode, workshopKey);
        expect(scored.firstResponse.selected).toBe('hat');
        expect(scored.firstResponse.observedCorrect).toBe(true);
      }
    });
  }
}
const snapshot = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)).A.checkpoint.task.episode, key);
for (const position of [0, 1, 2]) {
  const seed = Array.from({length: 100}, (_, index) => `position-${index}`).find(seed => shuffleAnswerPositions([0, 1, 2], `${seed}:printed-match:A:apple:first-choices`).indexOf(0) === position);
  test(`first-round Letters correct picture can occupy slot ${position + 1} and survives replay, error and reload`, async ({page}, info) => {
    await page.addInitScript(({key, seed, version}) => {
      if (sessionStorage.getItem('position-fixture')) return;
      localStorage.setItem(key, JSON.stringify({A: {version, round: 1, step: 3, evidence: [{practiceStep: 1}, {practiceStep: 2}], seed, reviewLetters: []}}));
      sessionStorage.setItem('position-fixture', '1');
    }, {key, seed, version: LETTER_PRACTICE_VERSION});
    await page.route('**/*.mp3', route => route.abort());
    await page.goto(route); await open(page);
    const board = page.locator('[data-sibling-learning-task="printed_letter_matching"]');
    const options = board.locator('.learning-guided-action');
    await expect(options).toHaveCount(3);
    const original = await snapshot(page);
    expect(original.question.answerOptions.findIndex(option => option.id === 'apple')).toBe(position);
    await expect(options.nth(position)).toHaveAttribute('aria-label', 'Choose apple');
    for (const [index, option] of original.question.answerOptions.entries()) await expect(options.nth(index).locator('img')).toHaveAttribute('src', option.image);
    await board.getByRole('button', {name: 'Listen again', exact: true}).click();
    expect((await snapshot(page)).question.answerOptions).toEqual(original.question.answerOptions);
    await page.reload(); await open(page);
    expect((await snapshot(page)).question.answerOptions).toEqual(original.question.answerOptions);
    const wrong = original.question.answerOptions.find(option => option.id !== 'apple');
    await board.getByRole('button', {name: `Choose ${wrong.label}`, exact: true}).click();
    await expect(board).toHaveAttribute('data-learning-phase', 'teaching');
    const receipt = await snapshot(page);
    expect(receipt.firstResponse.observedCorrect).toBe(false);
    await board.getByRole('button', {name: '← Back to question', exact: true}).click();
    await expect(options.nth(position)).toHaveAttribute('aria-label', 'Choose apple');
    await expect(options.nth(position)).toBeDisabled();
    await page.screenshot({path: info.outputPath(`correct-slot-${position + 1}.png`)});
    await page.reload(); await open(page);
    const restored = await snapshot(page);
    expect(restored.firstResponse).toEqual(receipt.firstResponse);
    expect(restored.firstQuestion.answerOptions).toEqual(original.question.answerOptions);
    await board.locator('[data-guided-model]:enabled').click();
    await expect(page.locator('.phonics-practice-count')).toHaveText('Found: 1 / 4');
    const completed = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).A.checkpoint.episodes[0], key);
    expect(completed.firstResponse).toEqual(receipt.firstResponse);
    expect(completed.firstQuestion.answerOptions).toEqual(original.question.answerOptions);
  });
}
