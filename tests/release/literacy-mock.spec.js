import { expect, test } from '@playwright/test';
import { STUDENT_MINIMUM_TARGET_PX } from '../../src/policy/studentDeviceMatrix.js';

const url = '/tests/fixtures/literacy-mock.html';
test.describe.configure({ timeout: 60000 });
async function simulatedAudio(page, duration = 20) {
  await page.addInitScript(({ duration }) => {
    window.__mockAudio = { played: [], paused: [], failNext: false };
    window.Audio = class extends EventTarget {
      constructor() { super(); this.src = ''; this.paused = true; this.currentTime = 0; }
      play() {
        window.__mockAudio.played.push(this.src); this.paused = false;
        if (window.__mockAudio.failNext) {
          window.__mockAudio.failNext = false;
          this.timer = setTimeout(() => { this.onerror?.(new Event('error')); this.dispatchEvent(new Event('error')); }, duration);
        } else {
          this.onplaying?.(new Event('playing'));
          this.timer = setTimeout(() => { this.onended?.(new Event('ended')); this.dispatchEvent(new Event('ended')); }, duration);
        }
        return Promise.resolve();
      }
      pause() { clearTimeout(this.timer); this.paused = true; window.__mockAudio.paused.push(this.src); }
      load() {}
    };
  }, { duration });
}
const server = page => page.evaluate(() => window.__literacyMock.state());
const item = page => page.evaluate(() => window.__literacyMock.item());
async function open(page, suffix = '') {
  await page.goto(`${url}?case=${test.info().testId}${suffix}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.literacy-mock, .literacy-mock-teacher')).toBeVisible();
}
async function chooseAnswer(page, current = null) {
  current ||= await item(page);
  const buttons = page.locator('.literacy-mock-choice');
  const ordered = await page.evaluate(id => window.__literacyMock.choiceOrder(id), current.id);
  const byId = id => buttons.nth(ordered.findIndex(choice => choice.id === id));
  if (current.format === 'choice') {
    await byId(current.answer).click();
  } else if (current.format === 'select_text') {
    const answer = current.choices.find(choice => choice.id === current.answer);
    await page.locator('.literacy-mock-text-selection button').nth(answer.tokenIndex).click();
  } else if (current.format === 'multi_select' || current.format === 'order') {
    for (const id of current.answer) await byId(id).click();
  } else if (current.format === 'match') {
    for (let i = 0; i < current.answer.length; i++) {
      await byId(current.answer[i]).click();
      await page.getByRole('button', { name: new RegExp(`^Space ${i + 1} for`) }).click();
    }
  } else if (current.format === 'build_word') {
    const unused = [...current.choices];
    for (const letter of current.answer) {
      const index = unused.findIndex(choice => choice.label === letter);
      const [choice] = unused.splice(index, 1);
      await buttons.filter({ has: page.getByText(choice.label, { exact: true }) }).and(page.locator('[aria-pressed="false"]')).first().click();
    }
  }
}
async function next(page) {
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
}

for (const format of ['choice', 'multi_select', 'order', 'match', 'select_text', 'build_word']) {
  test(`${format}: real authored item accepts its intended response after complete audio`, async ({ page }, info) => {
    await simulatedAudio(page, 60);
    await open(page, `&mode=format&format=${format}&includeUnavailable=1`);
    const current = await item(page);
    expect(current.mediaReady, `${format} must have published exact audio`).toBe(true);
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
    await chooseAnswer(page, current);
    await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeEnabled();
    await page.screenshot({ path: info.outputPath(`format-${format}.png`), fullPage: true });
    await next(page);
    await expect(page.getByRole('status')).toHaveText('Answer received');
    const response = (await server(page)).lastSubmission;
    expect(response.questionId).toBe(current.id);
    expect(response.responseStatus).toBe('answered');
    expect(current.requiredAudioPaths.every(path => response.audioDelivery[path] === 'completed')).toBe(true);
    expect(response.supportUsed).toBe(false);
    if (current.answerMode === 'set') expect([...response.selected].sort()).toEqual([...current.answer].sort());
    else expect(response.selected).toEqual(current.answer);
  });
}

test('sound check, waiting room, start, pause and resume preserve the current selection', async ({ page }) => {
  await simulatedAudio(page);
  await open(page, '&warmup=1');
  await page.getByRole('button', { name: 'Circle', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Check my sound', exact: true }).click();
  await next(page);
  const tutorials = await page.evaluate(() => window.__literacyMock.tutorials());
  expect(tutorials).toHaveLength(5);
  for (let index = 0; index < tutorials.length; index++) {
    await expect(page.locator('[data-child-progress]')).toHaveText(`Button practice ${index + 1} of 5`);
    expect((await server(page)).run).toBeNull();
    await chooseAnswer(page, tutorials[index]);
    await next(page);
  }
  await expect(page.getByText('Wait for your teacher to start.')).toBeVisible();
  expect((await server(page)).run.responses).toHaveLength(0);
  expect((await server(page)).run.plan.itemIds.some(id => tutorials.some(item => item.id === id))).toBe(false);
  await page.evaluate(() => window.__literacyMock.teacher('start'));
  await expect(page.getByRole('group', { name: 'Answer choices', exact: true })).toBeVisible();
  await chooseAnswer(page);
  const selected = await page.locator('[aria-pressed="true"]').allTextContents();
  await page.evaluate(() => window.__literacyMock.teacher('pause'));
  await expect(page.getByText('Time for a break.')).toBeVisible();
  expect((await server(page)).run.responses).toHaveLength(0);
  await page.evaluate(() => window.__literacyMock.teacher('resume'));
  await expect(page.getByRole('group', { name: 'Answer choices', exact: true })).toBeVisible();
  expect(await page.locator('[aria-pressed="true"]').allTextContents()).toEqual(selected);
  await next(page);
  await expect.poll(async () => (await server(page)).run.responses.length).toBe(1);
});

test('a lost answer receipt survives reload and retries exactly once without duplicating evidence', async ({ page }) => {
  await simulatedAudio(page);
  await open(page);
  await chooseAnswer(page);
  await page.evaluate(() => window.__literacyMock.setFault('receipt-lost'));
  await next(page);
  await expect(page.getByText('Your answer is waiting to save.', { exact: true })).toBeVisible();
  const committed = await server(page);
  expect(committed.run.responses).toHaveLength(1);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Question 2', exact: true })).toBeVisible();
  const replayed = await server(page);
  expect(replayed.run.responses).toHaveLength(1);
  const requests = replayed.calls.filter(call => call.args.p_response);
  expect(requests).toHaveLength(2);
  expect(requests[0].args).toEqual(requests[1].args);
});

test('a confirmed revision rejection exposes recovery and permits a fresh answer attempt', async ({ page }) => {
  await simulatedAudio(page);
  await open(page);
  await chooseAnswer(page);
  await page.evaluate(() => window.__literacyMock.setFault('stale'));
  await next(page);
  await expect(page.getByRole('alert')).toContainText('Your answer was not saved');
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await next(page);
  await expect.poll(async () => (await server(page)).run.responses.length).toBe(1);
});

test('media failure replaces the same slot, persists excluded assets and keeps helped answers distinct', async ({ page }) => {
  await simulatedAudio(page);
  await page.addInitScript(() => { window.__mockAudio.failNext = !sessionStorage.getItem('mock-first-audio-failed'); sessionStorage.setItem('mock-first-audio-failed', 'true'); });
  await open(page, '&item=lp3.initial_sounds.l1.A.a.v1');
  const failed = await item(page);
  await expect(page.getByText('A picture or recording did not load. This question will not count.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  await page.evaluate(() => window.__literacyMock.setFault('receipt-lost'));
  await page.getByRole('button', { name: 'Go to another question', exact: true }).click();
  await expect.poll(async () => (await server(page)).run.mediaFailures.length).toBe(1);
  await expect(page.getByText('Your answer is waiting to save.', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  const mediaWrites = (await server(page)).calls.filter(call => call.args.p_response?.responseStatus === 'media_failed');
  expect(mediaWrites).toHaveLength(2); expect(mediaWrites[0].args).toEqual(mediaWrites[1].args);
  await expect.poll(async () => (await item(page)).id).not.toBe(failed.id);
  await expect(page.getByRole('region', { name: 'Question 1', exact: true })).toBeVisible();
  let run = (await server(page)).run;
  expect(run.responses).toHaveLength(0); expect(run.plan.itemIds).toHaveLength(24); expect(run.unsampledItemIds).toHaveLength(24);
  expect(run.mediaFailures[0]).toMatchObject({ questionId: failed.id, selected: null, isCorrect: null, evidenceType: 'unscored' });
  const failedUrls = run.mediaFailures.flatMap(failure => failure.failedMediaPaths.map(path => path.split('#')[0]));
  expect(failedUrls.length).toBeGreaterThan(0);
  const hasFailedMedia = value => [...value.requiredImagePaths, ...value.requiredAudioPaths].some(path => failedUrls.includes(path.split('#')[0]));
  expect((await page.evaluate(() => window.__literacyMock.planItems())).some(hasFailedMedia)).toBe(false);
  const replacement = await item(page);
  await page.reload();
  await expect(page.getByRole('region', { name: 'Question 1', exact: true })).toBeVisible();
  expect((await item(page)).id).toBe(replacement.id);
  expect((await page.evaluate(() => window.__literacyMock.planItems())).some(hasFailedMedia)).toBe(false);
  await page.getByRole('button', { name: 'I need help', exact: true }).click();
  await chooseAnswer(page);
  await next(page);
  await expect.poll(async () => (await server(page)).run.responses.length).toBe(1);
  run = (await server(page)).run;
  expect(run.responses[0]).toMatchObject({ supportUsed: true, evidenceType: 'supported' });
  expect(run.mediaFailures).toHaveLength(1); expect(run.unsampledItemIds).toHaveLength(23);
  await open(page, '&mode=teacher');
  await page.getByRole('button', { name: 'View Alex’s report', exact: true }).click();
  await expect(page.getByText('Media availability log (1)', { exact: true })).toBeVisible();
  await expect(page.getByText('Question-by-question evidence (1)', { exact: true })).toBeVisible();
});

test('the authoritative timer ends the attempt without scoring questions not reached', async ({ page }) => {
  await simulatedAudio(page);
  await open(page);
  await page.evaluate(() => window.__literacyMock.expire());
  await expect(page.getByRole('heading', { name: 'All done. Thank you!', exact: true })).toBeVisible();
  const value = await server(page);
  expect(value.run.responses).toHaveLength(0);
  expect(value.run.unsampledItemIds).toHaveLength(24);
  expect(value.session.mock.end_reason).toBe('time_expired');
});

test('teacher can switch from a selected pupil to full class and prepare valid whole-class arguments', async ({ page }) => {
  await open(page, '&mode=teacher');
  await expect(page.getByRole('button', { name: 'Pause assessment', exact: true })).toBeVisible();
  await page.getByText('Prepare a new session', { exact: true }).click();
  await page.getByRole('radio', { name: 'Individual or selected students', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Alex', exact: true }).check();
  await page.getByRole('radio', { name: 'Full class (2)', exact: true }).check();
  await page.evaluate(() => window.__literacyMock.setFault('receipt-lost'));
  await page.getByRole('button', { name: 'Prepare for 2 students', exact: true }).click();
  await page.getByRole('button', { name: 'Retry the same preparation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start assessment', exact: true })).toBeVisible();
  const call = (await server(page)).calls.find(call => call.name === 'teacher_prepare_literacy_mock_session');
  expect(call.args.p_student_ids).toEqual([]);
  expect(call.args.p_whole_class).toBe(true);
  const preparations = (await server(page)).calls.filter(call => call.name === 'teacher_prepare_literacy_mock_session');
  expect(preparations).toHaveLength(2);
  expect(preparations[0].args).toEqual(preparations[1].args);
  await page.getByRole('button', { name: 'Start assessment', exact: true }).click();
  await page.getByRole('button', { name: 'Pause assessment', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Resume assessment', exact: true })).toBeVisible();
  await page.evaluate(() => window.__literacyMock.setFault('receipt-lost'));
  await page.getByRole('button', { name: 'Add 5 minutes', exact: true }).click();
  await page.getByRole('button', { name: 'Retry the same action', exact: true }).click();
  const additions = (await server(page)).calls.filter(call => call.args.p_action === 'add_time');
  expect(additions).toHaveLength(2); expect(additions[0].args).toEqual(additions[1].args);
  await page.getByRole('button', { name: 'Resume assessment', exact: true }).click();
  await page.getByRole('button', { name: 'View Alex’s report', exact: true }).click();
  await expect(page.getByText('All 47 skills and next steps', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Finish assessment', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Finish assessment', exact: true }).click();
  await page.getByRole('button', { name: 'Finish and keep the report', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect((await server(page)).session.mock.state).toBe('completed');
});

for (const viewport of [{ width: 320, height: 568 }, { width: 568, height: 320 }, { width: 1024, height: 768 }, { width: 1280, height: 720 }]) {
  test(`learner controls remain reachable at ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
    await page.setViewportSize(viewport); await simulatedAudio(page);
    await open(page, '&item=lp3.theme_higher_comprehension.l2.A.theme_among_rivals.v22');
    const forward = page.getByRole('button', { name: 'Next', exact: true });
    await expect(page.locator('.literacy-mock-footer')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const assertForwardFits = async () => {
      const rect = await forward.boundingBox();
      expect(rect.height).toBeGreaterThanOrEqual(STUDENT_MINIMUM_TARGET_PX);
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height + 1);
      expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width + 1);
    };
    await assertForwardFits();
    if (viewport.height < 720) expect(await page.locator('.literacy-mock-question').evaluate(node => node.scrollHeight > node.clientHeight)).toBe(true);
    await page.screenshot({ path: info.outputPath('mock-long-passage.png') });
    await chooseAnswer(page);
    await expect(forward).toBeEnabled(); await assertForwardFits();
    await next(page);
    await expect.poll(async () => (await server(page)).run.responses.length).toBe(1);
    await open(page, '&mode=format&format=multi_select&includeUnavailable=1');
    await chooseAnswer(page);
    await expect(forward).toBeEnabled(); await assertForwardFits();
    const question = await page.locator('.literacy-mock-question').boundingBox();
    for (const box of await page.locator('.literacy-mock-choice').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; }))) {
      expect(box.left).toBeGreaterThanOrEqual(question.x);
      expect(box.right).toBeLessThanOrEqual(question.x + question.width + 1);
      if (viewport.width >= 1024) { expect(box.top).toBeGreaterThanOrEqual(question.y); expect(box.bottom).toBeLessThanOrEqual(question.y + question.height + 1); }
    }
    await page.screenshot({ path: info.outputPath('mock-picture-choices.png') });
    await next(page); await expect(page.getByRole('status')).toHaveText('Answer received');
  });
}

test('a hung save exposes a recoverable timeout and retries the original request', async ({ page }) => {
  await simulatedAudio(page); await open(page);
  await chooseAnswer(page);
  await page.evaluate(() => window.__literacyMock.setFault('hang-save'));
  await next(page);
  await expect(page.getByText('Your answer is waiting to save.', { exact: true })).toBeVisible({ timeout: 15000 });
  await page.evaluate(() => window.__literacyMock.setFault(null));
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect.poll(async () => (await server(page)).run.responses.length).toBe(1);
  const writes = (await server(page)).calls.filter(call => call.args.p_response);
  expect(writes).toHaveLength(2); expect(writes[0].args).toEqual(writes[1].args);
});

test('teacher timeouts preserve verified rows and recover preparation without a second session', async ({ page }) => {
  await open(page, '&mode=teacher');
  await expect(page.getByRole('button', { name: 'Pause assessment', exact: true })).toBeVisible();
  await page.evaluate(() => window.__literacyMock.setFault('hang-report'));
  await page.getByRole('button', { name: 'Refresh progress', exact: true }).click();
  await expect(page.getByText(/Live progress could not be refreshed/)).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('button', { name: 'View Alex’s report', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pause assessment', exact: true })).toBeDisabled();
  await page.evaluate(() => window.__literacyMock.setFault(null));
  await page.getByRole('button', { name: 'Refresh progress', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause assessment', exact: true })).toBeEnabled();
  await page.getByText('Prepare a new session', { exact: true }).click();
  await page.evaluate(() => window.__literacyMock.setFault('hang-prepare'));
  await page.getByRole('button', { name: 'Prepare for 2 students', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry the same preparation', exact: true })).toBeVisible({ timeout: 15000 });
  await page.evaluate(() => window.__literacyMock.setFault(null));
  await page.getByRole('button', { name: 'Retry the same preparation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start assessment', exact: true })).toBeVisible();
  const requests = (await server(page)).calls.filter(call => call.name === 'teacher_prepare_literacy_mock_session');
  expect(requests).toHaveLength(2); expect(requests[0].args).toEqual(requests[1].args);
});

test('original picture cells render individually for the learner and the saved teacher report', async ({ page }, info) => {
  await simulatedAudio(page); await open(page, '&item=mock.rhyme.dog-log');
  const current = await item(page);
  expect(current.choices.every(choice => choice.image.includes('#mock-cell='))).toBe(true);
  await expect(page.locator('.literacy-mock-choice [data-mock-image-cell]')).toHaveCount(4);
  await chooseAnswer(page, current);
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeEnabled();
  await page.screenshot({ path: info.outputPath('original-picture-choices.png'), fullPage: true });
  await next(page);
  await expect.poll(async () => (await server(page)).run.responses.length).toBe(1);
  await open(page, '&mode=teacher');
  await page.getByRole('button', { name: 'View Alex’s report', exact: true }).click();
  await page.getByText('Question-by-question evidence (1)', { exact: true }).click();
  const pictures = page.locator('.literacy-mock-evidence-pictures');
  await expect(pictures.locator('[data-mock-image-cell]')).toHaveCount(4);
  for (const bounds of await pictures.locator('[data-mock-image-cell]').evaluateAll(nodes => nodes.map(node => ({ width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height, overflow: getComputedStyle(node).overflow })))) {
    expect(bounds).toEqual({ width: 110, height: 110, overflow: 'hidden' });
  }
  await pictures.screenshot({ path: info.outputPath('teacher-original-picture-evidence.png') });
});

test('unavailable original picture art is replaced without consuming an answer slot', async ({ page }) => {
  await simulatedAudio(page);
  await page.route('**/images/assessment/literacy-mock/object-atlas-v1.webp', route => route.abort());
  await open(page, '&item=mock.rhyme.dog-log');
  await expect(page.getByText('A picture or recording did not load. This question will not count.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Go to another question', exact: true }).click();
  await expect.poll(async () => (await server(page)).run.mediaFailures.length).toBe(1);
  await expect.poll(async () => (await item(page)).id).not.toBe('mock.rhyme.dog-log');
  await expect(page.getByRole('region', { name: 'Question 1', exact: true })).toBeVisible();
  const { run } = await server(page);
  expect(run.responses).toHaveLength(0); expect(run.unsampledItemIds).toHaveLength(24);
  expect(run.mediaFailures[0]).toMatchObject({ responseStatus: 'media_failed', selected: null, isCorrect: null });
  expect((await page.evaluate(() => window.__literacyMock.planItems())).some(item => item.requiredImagePaths.some(path => path.includes('object-atlas-v1.webp')))).toBe(false);
});

test('a hung learner read times out and recovers without losing its selected answer', async ({ page }) => {
  await simulatedAudio(page); await open(page);
  await chooseAnswer(page);
  await page.evaluate(() => window.__literacyMock.setFault('hang-read'));
  await expect(page.getByText('Ask your teacher to check the connection.', { exact: true })).toBeVisible({ timeout: 15000 });
  expect((await server(page)).run.responses).toHaveLength(0);
  await page.evaluate(() => window.__literacyMock.setFault(null));
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Question 1', exact: true })).toBeVisible();
  await next(page);
  await expect.poll(async () => (await server(page)).run.responses.length).toBe(1);
});

test('exhausted suitable media stops for teacher help without advancing or claiming completion', async ({ page }) => {
  await simulatedAudio(page);
  await open(page, '&item=lp3.initial_sounds.l1.A.a.v1&exhausted=1');
  await expect(page.getByRole('heading', { name: 'Ask your teacher.', exact: true })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('The pictures or sounds for these questions are not available.');
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'All done. Thank you!', exact: true })).toHaveCount(0);
  const { run } = await server(page);
  expect(run.responses).toHaveLength(0); expect(run.unsampledItemIds).toHaveLength(24); expect(run.status).toBe('running');
  expect(run.mediaFailures.length).toBeGreaterThan(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Ask your teacher.', exact: true })).toBeVisible();
});
