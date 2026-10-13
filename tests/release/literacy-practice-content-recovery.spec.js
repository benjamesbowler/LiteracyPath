import { expect, test } from '@playwright/test';

const url = '/tests/fixtures/literacy-practice.html';
const badId = 'lp3.r_controlled_vowels.l1.C.ur.v9';
test.describe.configure({ timeout: 90000 });
async function seed(page) {
  await page.addInitScript(() => {
    window.Audio = class extends EventTarget {
      constructor() { super(); this.src = ''; this.currentTime = 0; this.readyState = 4; this.paused = true; }
      load() { this.dispatchEvent(new Event('canplay')); }
      play() { this.paused = false; this.timer = setTimeout(() => { this.paused = true; this.dispatchEvent(new Event('ended')); }, 25); return Promise.resolve(); }
      pause() { clearTimeout(this.timer); this.paused = true; }
    };
  });
  await page.goto(url);
  await page.locator('[data-child-primary-action]').click();
  await expect(page.locator('[data-skills-practice-ready="true"]')).toBeVisible();
  await page.getByRole('button', { name: 'Take a break', exact: true }).click();
  await page.evaluate(id => window.__literacy.seedQuestion(id), badId);
}

test('a resumed ambiguous spelling is replaced without an answer or media-failure event', async ({ page }) => {
  await seed(page);
  await page.reload();
  await page.getByRole('button', { name: 'Carry on', exact: true }).click();
  await expect(page.locator('[data-skills-practice-ready="true"]')).toBeVisible();
  const saved = await page.evaluate(() => window.__literacy.session());
  expect(saved.index).toBe(0);
  expect(saved.answers).toEqual([]);
  expect(saved.responseEpisode.question.id).not.toBe(badId);
  expect(saved.contentRepairs).toContainEqual(expect.objectContaining({ questionId: badId, reason: 'ambiguous_spelling' }));
  const steps = await page.evaluate(() => window.__literacy.record().completions.flatMap(event => event.steps));
  expect(steps.filter(step => step.questionId === badId)).toEqual([]);
});

test('an old ambiguous answer keeps its raw response and bypasses incorrect feedback on resume', async ({ page }, info) => {
  await seed(page);
  await page.evaluate(async id => {
    const { createLearningResponseEpisode, commitLearningResponse } = await import('/src/utils/learningResponseState.js');
    const { saveSkillsPracticeEvent } = await import('/src/utils/skillsPracticeProgress.js');
    const { createSkillsPracticeEvent } = await import('/src/utils/skillsPracticeModel.js');
    const saved = window.__literacy.session();
    const question = (await window.__literacy.bank()).find(item => item.id === id);
    const episode = createLearningResponseEpisode({ id: `${saved.id}:slot:0`, instrument: 'literacy-practice', slotId: '0', question, expected: question.answer });
    const committed = commitLearningResponse(episode, { selected: 'er', correct: false, valid: true, feedbackOnly: true });
    const event = createSkillsPracticeEvent({ question, sessionId: saved.id, responseId: `${episode.id}:first_probe`, selected: 'er', isCorrect: false,
      mediaReady: true, targetDelivered: true, instructionDelivery: 'completed', targetDelivery: 'completed' });
    event.gameId = 'literacy-practice'; event.contentVersion = 'literacy-practice-v1';
    event.steps[0].presentationRole = 'first_probe';
    saveSkillsPracticeEvent('literacy-practice-preview', event, { ...saved, answers: [false], responseEpisode: committed }, 'literacy-practice');
  }, badId);
  await page.reload();
  await page.getByRole('button', { name: 'Carry on', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__literacy.session()?.index)).toBe(1);
  await expect(page.locator('[data-skills-practice-ready="true"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Incorrect', exact: true })).toHaveCount(0);
  const raw = await page.evaluate(id => window.__literacy.record().completions.flatMap(event => event.steps).find(step => step.questionId === id && step.responseStatus === 'answered'), badId);
  expect(raw.selected).toBe('er'); expect(raw.answerMatch).toBe(false);
  await page.getByRole('button', { name: 'Take a break', exact: true }).click();
  await page.getByRole('button', { name: 'Teacher report', exact: true }).click();
  await expect(page.getByText('1 question was excluded because the choices were ambiguous. The original responses are retained and do not count as correct or incorrect.', { exact: true })).toBeVisible();
  await page.getByText(/^View question evidence/).click();
  const excluded = page.locator('.literacy-practice-report__evidence tbody tr').filter({ hasText: badId });
  await expect(excluded).toContainText('Question defect — excluded');
  await expect(excluded).toContainText('Stored key (excluded)');
  await excluded.screenshot({ path: info.outputPath('excluded-historical-response.png') });
});
