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
    function compose(text, choices) {
      if (!text) return [];
      for (const choice of choices) if (text.startsWith(choice.label)) {
        const suffix = compose(text.slice(choice.label.length), choices.filter(value => value.id !== choice.id));
        if (suffix) return [choice.id, ...suffix];
      }
      return null;
    }
    const tiles = compose(current.answer, current.choices);
    expect(tiles, 'The authored tile bank must construct the whole dictated word').not.toBeNull();
    for (const id of tiles) await byId(id).click();
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
  await expect(page.getByText('Your work is waiting to save.', { exact: true })).toBeVisible();
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
  await expect(page.getByText('Your work is waiting to save.', { exact: true })).toBeVisible();
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
  await expect(page.getByRole('button', { name: 'Cancel request', exact: true })).toBeVisible();
  await page.evaluate(id => window.__literacyMock.resolve(id, 'answer'), replacement.id);
  await expect(page.getByText('Your teacher helped with this answer.')).toBeVisible();
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

test('an explicitly timed sample ends without scoring questions not answered', async ({ page }) => {
  await simulatedAudio(page);
  await open(page, '&timed=1');
  await page.evaluate(() => window.__literacyMock.expire());
  await expect(page.getByRole('heading', { name: 'All done. Thank you!', exact: true })).toBeVisible();
  const value = await server(page);
  expect(value.run.responses).toHaveLength(0);
  expect(value.run.unsampledItemIds).toHaveLength(24);
  expect(value.session.mock.end_reason).toBe('time_finished');
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
  const call = (await server(page)).calls.find(call => call.name === 'teacher_prepare_literacy_mock_session_v3');
  expect(call.args.p_student_ids).toEqual([]);
  expect(call.args.p_whole_class).toBe(true);
  const preparations = (await server(page)).calls.filter(call => call.name === 'teacher_prepare_literacy_mock_session_v3');
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

for (const viewport of [{ width: 320, height: 568 }, { width: 1280, height: 720 }]) {
  for (const [kind, itemId] of [['text', 'literacy.writing_purpose.request'], ['picture', 'mock.rhyme.dog-log'], ['order', 'mock.sequence.parcel']]) {
    test(`${kind} replay controls have separate space at ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
      await page.setViewportSize(viewport); await simulatedAudio(page);
      await open(page, `&mode=format&item=${itemId}`);
      const current = await item(page);
      const ordered = await page.evaluate(id => window.__literacyMock.choiceOrder(id), current.id);
      const options = page.locator('.literacy-mock-option');
      await expect(options).toHaveCount(current.choices.length);
      await expect(page.locator('.literacy-mock-access p')).toHaveCount(0);
      for (let index = 0; index < current.choices.length; index++) {
        const option = options.nth(index);
        const replay = option.getByRole('button', { name: `Hear answer ${index + 1}`, exact: true });
        await replay.scrollIntoViewIfNeeded();
        const boxes = await option.evaluate(node => {
          const rect = element => { const r = element.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }; };
          const choice = node.querySelector('.literacy-mock-choice');
          return { choice: rect(choice), audio: rect(node.querySelector('.literacy-mock-choice-audio')),
            content: [...choice.children].map(rect), question: rect(node.closest('.literacy-mock-question')) };
        });
        expect(boxes.audio.width).toBeGreaterThanOrEqual(48);
        expect(boxes.audio.height).toBeGreaterThanOrEqual(48);
        expect(boxes.audio.top - boxes.choice.bottom, 'Replay needs its own row below the entire choice hit area').toBeGreaterThanOrEqual(4);
        expect(boxes.choice.left).toBeGreaterThanOrEqual(boxes.question.left);
        expect(boxes.choice.right).toBeLessThanOrEqual(boxes.question.right);
        for (const content of boxes.content) {
          expect(content.left).toBeGreaterThanOrEqual(boxes.choice.left);
          expect(content.right).toBeLessThanOrEqual(boxes.choice.right);
          expect(content.bottom).toBeLessThanOrEqual(boxes.choice.bottom);
        }
        const before = await page.evaluate(() => window.__mockAudio.played.length);
        await replay.click();
        await expect.poll(() => page.evaluate(() => window.__mockAudio.played.length)).toBe(before + 1);
        expect(await page.evaluate(() => window.__mockAudio.played.at(-1))).toBe(ordered[index].audioPath);
        await expect(page.locator('.literacy-mock-choice[aria-pressed="true"]')).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.locator('.literacy-mock-question').evaluate(node => { node.scrollTop = 0; });
      await page.screenshot({ path: info.outputPath(`replay-${kind}-${viewport.width}.png`) });
      const choiceSizes = () => page.locator('.literacy-mock-choice').evaluateAll(nodes => nodes.map(node => {
        const r = node.getBoundingClientRect(); return { width: r.width, height: r.height };
      }));
      const beforeSelection = await choiceSizes();
      await chooseAnswer(page, current);
      expect(await choiceSizes(), 'Selected emphasis must not resize the choices').toEqual(beforeSelection);
      await next(page);
      await expect(page.getByRole('status')).toHaveText('Answer received');
      expect((await server(page)).lastSubmission.selected).toEqual(current.answer);
    });
  }
}

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
    if (viewport.width < 768) {
      const footer = await page.locator('.literacy-mock-footer').boundingBox();
      const button = await forward.boundingBox();
      expect(footer.x + footer.width - button.x - button.width).toBeLessThanOrEqual(24);
    }
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
  await expect(page.getByText('Your work is waiting to save.', { exact: true })).toBeVisible({ timeout: 15000 });
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
  const requests = (await server(page)).calls.filter(call => call.name === 'teacher_prepare_literacy_mock_session_v3');
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

test('unavailable shared picture art stops safely when no same-construct source remains', async ({ page }) => {
  await simulatedAudio(page);
  await page.route('**/images/assessment/literacy-mock/object-atlas-v1.webp', route => route.abort());
  await open(page, '&item=mock.rhyme.dog-log');
  await expect(page.getByText('A picture or recording did not load. This question will not count.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Go to another question', exact: true }).click();
  await expect.poll(async () => (await server(page)).run.mediaFailures.length).toBe(1);
  await expect(page.getByRole('heading', { name: 'Ask your teacher.', exact: true })).toBeVisible();
  const { run } = await server(page);
  expect(run.responses).toHaveLength(0); expect(run.unsampledItemIds).toHaveLength(24);
  expect(run.mediaFailures[0]).toMatchObject({ responseStatus: 'media_failed', selected: null, isCorrect: null });
  expect(run.plan.itemIds[0]).toBe('mock.rhyme.dog-log');
  expect(run.status).toBe('running');
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

test('a legacy v1 session resumes its draft without treating its own display as prior practice', async ({ page }) => {
  await simulatedAudio(page);
  await open(page, '&version=literacy-mock-v1&item=mock.build.dog');
  await chooseAnswer(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeEnabled();
  await next(page);
  await expect.poll(async () => (await server(page)).run.responses.length).toBe(1);
  const saved = (await server(page)).run;
  expect(saved.contentVersion).toBe('literacy-mock-v1');
  expect(saved.responses[0].itemSnapshot.contentVersion).toBe('literacy-mock-v1');
  expect(saved.responses[0].knownFamiliar).toBeNull();
});

test('recorded public-practice exposure stays familiar in a later mock response', async ({ page }) => {
  await simulatedAudio(page);
  await page.addInitScript(() => localStorage.setItem('lp-literacy-exposure:v1:student-a', JSON.stringify([
    { exposureItemId: 'mock.build.dog', exposurePassageKey: 'dog', exposureFamilyId: '' }
  ])));
  await open(page, '&item=mock.build.dog');
  await chooseAnswer(page);
  await next(page);
  await expect.poll(async () => (await server(page)).run.responses.length).toBe(1);
  expect((await server(page)).run.responses[0].knownFamiliar).toBe(true);
});

test('a displayed unanswered question survives finish as an offer rather than an unseen item', async ({ page }) => {
  await simulatedAudio(page); await open(page);
  await expect(page.getByRole('region', { name: 'Question 1', exact: true })).toBeVisible();
  await expect.poll(async () => (await server(page)).run.presentations.length).toBe(1);
  await page.evaluate(() => window.__literacyMock.teacher('finish'));
  await open(page, '&mode=teacher');
  await page.getByRole('combobox', { name: 'Open a session', exact: true }).selectOption('mock-session');
  await page.getByRole('button', { name: 'View Alex’s report', exact: true }).click();
  const metric = label => page.locator('.literacy-mock-metrics > div').filter({ has: page.getByText(label, { exact: true }) }).locator('dd');
  await expect(metric('Questions not reached')).toHaveText('23');
  await expect(metric('Seen without an answer')).toHaveText('1');
  await expect(metric('Skills with no recorded offer')).toHaveText('46 of 47');
  expect((await server(page)).run.responses).toHaveLength(0);
  const shown = (await server(page)).run.presentations[0].questionId;
  await page.getByText('Seen without a saved answer (1)', { exact: true }).click();
  await page.getByRole('button', { name: 'Prepare a fresh check', exact: true }).click();
  await expect(page.getByText(/A fresh check is prepared with new examples/)).toBeVisible();
  expect((await server(page)).session.mock.candidate_item_ids).not.toContain(shown);
  expect((await server(page)).archives[0].run.responses).toHaveLength(0);
});

test('a lost presentation receipt retries one durable offer without creating an answer or self-familiarity', async ({ page }) => {
  await simulatedAudio(page); await open(page, '&eventFault=receipt-lost');
  await expect(page.getByText('Your work is waiting to save.', { exact: true })).toBeVisible();
  expect((await server(page)).run.presentations).toHaveLength(1);
  expect((await server(page)).run.responses).toHaveLength(0);
  await page.reload();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Question 1', exact: true })).toBeVisible();
  const writes = (await server(page)).calls.filter(call => call.name === 'student_record_literacy_mock_event' && call.args.p_event === 'presented');
  expect(writes).toHaveLength(2); expect(writes[0].args).toEqual(writes[1].args);
  await chooseAnswer(page); await next(page);
  await expect.poll(async () => (await server(page)).run.responses.length).toBe(1);
  expect((await server(page)).run.responses[0].knownFamiliar).toBeNull();
});

test('a child can cancel a help request without converting the answer into supported evidence', async ({ page }) => {
  await simulatedAudio(page); await open(page);
  const current = await item(page);
  await page.getByRole('button', { name: 'I need help', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cancel request', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel request', exact: true }).click();
  await expect(page.getByRole('button', { name: 'I need help', exact: true })).toBeEnabled();
  await chooseAnswer(page, current); await next(page);
  await expect.poll(async () => (await server(page)).run.responses.length).toBe(1);
  expect((await server(page)).run.responses[0]).toMatchObject({ helpRequested: true, supportPending: false, supportUsed: false, assistanceType: 'none', evidenceType: 'independent' });
});

test('teacher access help preserves independence and late answer assistance changes interpretation without rewriting the response', async ({ page }) => {
  await simulatedAudio(page); await open(page);
  const current = await item(page);
  await page.getByRole('button', { name: 'I need help', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cancel request', exact: true })).toBeVisible();
  await chooseAnswer(page, current); await next(page);
  await expect.poll(async () => (await server(page)).run.responses.length).toBe(1);
  expect((await server(page)).run.responses[0]).toMatchObject({ supportPending: true, supportUsed: false, evidenceType: 'unscored' });
  const raw = await page.evaluate(() => window.__literacyMock.rawResponses());
  await open(page, '&mode=teacher');
  await page.getByRole('button', { name: 'Controls or access only', exact: true }).click();
  await expect.poll(async () => (await server(page)).run.responses[0].evidenceType).toBe('independent');
  expect((await server(page)).run.responses[0]).toMatchObject({ accessAssistance: true, supportUsed: false });
  await page.evaluate(id => window.__literacyMock.resolve(id, 'answer'), current.id);
  expect((await server(page)).run.responses[0]).toMatchObject({ evidenceType: 'supported', answerAssistance: true });
  expect(await page.evaluate(() => window.__literacyMock.rawResponses())).toEqual(raw);
  await page.evaluate(id => window.__literacyMock.resolve(id, 'none'), current.id);
  expect((await server(page)).run.responses[0].evidenceType).toBe('supported');
});

test('the default window pauses for a break and resumes the same unsubmitted work', async ({ page }) => {
  await simulatedAudio(page); await open(page);
  const current = await item(page);
  await chooseAnswer(page, current);
  await page.evaluate(() => window.__literacyMock.expire());
  await expect(page.getByRole('heading', { name: 'Time for a break.', exact: true })).toBeVisible();
  const paused = await server(page);
  expect(paused.session.mock).toMatchObject({ state: 'paused', window_mode: 'pause_at_window_end', pause_reason: 'window_elapsed', remaining_seconds: 1200 });
  expect(paused.run.responses).toHaveLength(0);
  await page.evaluate(() => window.__literacyMock.teacher('resume'));
  await expect(page.getByRole('region', { name: 'Question 1', exact: true })).toBeVisible();
  expect((await item(page)).id).toBe(current.id);
  await next(page);
  await expect.poll(async () => (await server(page)).run.responses.length).toBe(1);
  expect((await server(page)).run.responses[0].isCorrect).toBe(true);
});

test('a digraph construction requires its complete authored tile sequence before Next', async ({ page }) => {
  await simulatedAudio(page); await open(page, '&mode=format&item=lp3.cvc_short_vowels.l2.C.short_i.v6');
  const current = await item(page);
  expect(current.answer).toBe('fish');
  expect(current.choices.some(choice => choice.label === 'sh')).toBe(true);
  await page.locator('.literacy-mock-choice').first().click();
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await chooseAnswer(page, current);
  await expect(page.locator('.literacy-mock-construction button')).toHaveCount(3);
  await next(page);
  expect((await server(page)).lastSubmission.selected).toBe('fish');
});

test('a teacher can prepare and complete a genuinely fresh fixed-condition follow-up check', async ({ page }) => {
  await simulatedAudio(page); await open(page, '&item=lp3.initial_sounds.l1.A.a.v1');
  const source = await item(page);
  await chooseAnswer(page, source); await next(page);
  await expect.poll(async () => (await server(page)).run.responses.length).toBe(1);
  await page.evaluate(() => window.__literacyMock.teacher('finish'));
  await open(page, '&mode=teacher');
  await page.getByRole('combobox', { name: 'Open a session', exact: true }).selectOption('mock-session');
  await page.getByRole('button', { name: 'View Alex’s report', exact: true }).click();
  await page.getByText('Question-by-question evidence (1)', { exact: true }).click();
  await page.getByRole('button', { name: 'Prepare a fresh check', exact: true }).click();
  await expect(page.getByText(/A fresh check is prepared with new examples/)).toBeVisible();
  const prepared = await server(page);
  expect(prepared.session.mock.plan_kind).toBe('fresh_check');
  expect(prepared.session.mock.item_count).toBeGreaterThanOrEqual(1);
  expect(prepared.session.mock.item_count).toBeLessThanOrEqual(6);
  expect(prepared.session.mock.candidate_item_ids).not.toContain(source.id);
  await open(page);
  await page.getByRole('button', { name: 'Circle', exact: true }).click();
  await page.getByRole('button', { name: 'Check my sound', exact: true }).click(); await next(page);
  for (const tutorial of await page.evaluate(() => window.__literacyMock.tutorials())) { await chooseAnswer(page, tutorial); await next(page); }
  await expect(page.getByText('Wait for your teacher to start.')).toBeVisible();
  await page.evaluate(() => window.__literacyMock.teacher('start'));
  for (let index = 0; index < prepared.session.mock.item_count; index++) {
    await expect(page.getByRole('region', { name: `Question ${index + 1}`, exact: true })).toBeVisible();
    const fresh = await item(page);
    expect(fresh.skillId).toBe(source.skillId); expect(fresh.constructClaim).toBe(source.constructClaim);
    expect(fresh.level).toBe(source.level); expect(fresh.modality).toBe(source.modality);
    expect(fresh.id).not.toBe(source.id); expect(fresh.stimulusKey).not.toBe(source.stimulusKey);
    await chooseAnswer(page, fresh); await next(page);
  }
  await expect(page.getByRole('heading', { name: 'All done. Thank you!', exact: true })).toBeVisible();
  expect((await server(page)).run.responses).toHaveLength(prepared.session.mock.item_count);
});

test('a v2 sitting still resumes and records its original version without v3 event requirements', async ({ page }) => {
  await simulatedAudio(page); await open(page, '&version=literacy-mock-v2&item=mock.build.dog');
  await chooseAnswer(page); await page.reload({ waitUntil: 'domcontentloaded' }); await next(page);
  await expect.poll(async () => (await server(page)).run.responses.length).toBe(1);
  expect((await server(page)).run.contentVersion).toBe('literacy-mock-v2');
  expect((await server(page)).calls.some(call => call.name === 'student_record_literacy_mock_event')).toBe(false);
});

for (const version of ['literacy-mock-v1', 'literacy-mock-v2']) test(`${version} keeps its original helped-answer flag across reload`, async ({ page }) => {
  await simulatedAudio(page); await open(page, `&version=${version}&item=mock.build.dog`);
  await page.getByRole('button', { name: 'I need help', exact: true }).click();
  await expect(page.getByText('Ask your teacher. Your answer will be marked as helped.', { exact: true })).toBeVisible();
  await chooseAnswer(page); await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'I need help', exact: true })).toBeDisabled();
  await next(page);
  await expect.poll(async () => (await server(page)).run.responses.length).toBe(1);
  expect((await server(page)).run.responses[0]).toMatchObject({ supportUsed: true, evidenceType: 'supported' });
  expect((await server(page)).calls.some(call => call.name === 'student_record_literacy_mock_event')).toBe(false);
});

test('a complete mixed sitting adapts future questions and saves one receipt for every displayed response', async ({ page }) => {
  test.setTimeout(120000);
  await simulatedAudio(page); await open(page);
  const initial = await page.evaluate(() => window.__literacyMock.planItems());
  const answered = [];
  for (let index = 0; index < 24; index++) {
    await expect(page.getByRole('region', { name: `Question ${index + 1}`, exact: true })).toBeVisible();
    const current = await item(page);
    expect(current.skillId).toBe(initial[index].skillId);
    expect(current.constructClaim).toBe(initial[index].constructClaim);
    expect(current.modality).toBe(initial[index].modality);
    await expect.poll(async () => (await server(page)).run.presentations.some(value => value.questionId === current.id)).toBe(true);
    await chooseAnswer(page, current); await next(page);
    await expect.poll(async () => (await server(page)).run.responses.length).toBe(index + 1);
    answered.push(current);
  }
  await expect(page.getByRole('heading', { name: 'All done. Thank you!', exact: true })).toBeVisible();
  const run = (await server(page)).run;
  expect(run.status).toBe('completed');
  expect(run.presentations).toHaveLength(24);
  expect(run.responses.every(response => response.isCorrect && response.evidenceType === 'independent' && response.knownFamiliar !== true)).toBe(true);
  expect(run.responses.map(response => response.questionId)).toEqual(answered.map(value => value.id));
  expect(new Set(answered.map(value => value.stimulusKey)).size).toBe(24);
  expect(answered.some(value => value.level === 2)).toBe(true);
});


for (const [kind, itemId, structure] of [
  ['book cover', 'literacy.print_concepts.book-title', 'h3'],
  ['contents', 'literacy.informational_features.contents-bees', 'table'],
  ['glossary', 'literacy.informational_features.glossary-pup', 'dl']
]) {
  test(`mock ${kind} preserves the structured text feature before submission`, async ({ page }) => {
    await simulatedAudio(page);
    await open(page, `&mode=format&item=${itemId}`);
    const current = await item(page);
    expect(current.displayPassageDuringResponse).toBe(true);
    await expect(page.locator(`.assessment-text-feature ${structure}`)).toBeVisible();
    await expect(page.locator('.literacy-mock-passage')).toHaveCount(0);
    expect(await page.locator('.assessment-text-feature').evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(19);
    await chooseAnswer(page, current);
    expect((await server(page)).lastSubmission).toBeNull();
    await next(page);
    await expect(page.getByRole('status')).toHaveText('Answer received');
  });
}
