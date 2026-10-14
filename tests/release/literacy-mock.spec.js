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
const forwardAction = page => page.getByRole('button', { name: /^(Next|Next question|Finish test)$/ });
async function open(page, suffix = '') {
  await page.goto(`${url}?case=${test.info().testId}${suffix}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.literacy-mock, .literacy-mock-teacher')).toBeVisible({ timeout: 60000 });
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
  await expect(forwardAction(page)).toBeEnabled();
  await forwardAction(page).click();
}

for (const finalQuestion of [false, true]) {
  const label = finalQuestion ? 'Finish test' : 'Next question';
  test(`the question submit button exposes and performs its visible action: ${label}`, async ({ page }) => {
    await simulatedAudio(page);
    await open(page, `&mode=format&format=choice${finalQuestion ? '&finalQuestion=1' : ''}`);
    const primary = page.getByRole('button', { name: label, exact: true });
    await expect(primary).toHaveText(label);
    await expect(primary).toHaveAccessibleName(label);
    await expect(primary).toBeDisabled();
    const current = await item(page);
    await chooseAnswer(page, current);
    await expect(primary).toBeEnabled();
    await primary.click();
    await expect(page.getByRole('status')).toHaveText('Answer received');
    expect((await server(page)).lastSubmission).toMatchObject({
      questionId: current.id, selected: current.answer, responseStatus: 'answered',
    });
  });
}
async function openPreparation(page) {
  await page.getByRole('button', { name: 'Prepare', exact: true }).click();
  const setup = page.locator('.literacy-mock-setup');
  if (!await setup.evaluate(node => node.open)) await setup.locator(':scope > summary').click();
  await expect(setup).toHaveAttribute('open', '');
}

test('a database-ordered plan reaches questions and resumes after reload', async ({ page }) => {
  await simulatedAudio(page);
  await open(page);
  expect(Object.keys((await server(page)).run.plan)).toEqual(['seed', 'itemIds']);
  await expect(page.getByRole('region', { name: 'Question 1', exact: true })).toBeVisible();
  await chooseAnswer(page);
  await next(page);
  await expect(page.getByRole('region', { name: 'Question 2', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('region', { name: 'Question 2', exact: true })).toBeVisible();
  expect((await server(page)).run.responses).toHaveLength(1);
});

for (const format of ['choice', 'multi_select', 'order', 'match', 'select_text', 'build_word']) {
  test(`${format}: real authored item accepts its intended response after complete audio`, async ({ page }, info) => {
    await simulatedAudio(page, 60);
    await open(page, `&mode=format&format=${format}&includeUnavailable=1`);
    const current = await item(page);
    expect(current.mediaReady, `${format} must have published exact audio`).toBe(true);
    await expect(forwardAction(page)).toBeDisabled();
    await chooseAnswer(page, current);
    await expect(forwardAction(page)).toBeEnabled();
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

for (const questionId of ['lp3.sequencing.l1.A.last_event.v4', 'mock.depth.listen_main_idea.bridge', 'mock.v4.comprehension.listen_key_details.who.l2.soup']) {
  test(`new recordings play natively with the correct reading/listening roles: ${questionId}`, async ({ page }) => {
    test.setTimeout(120000);
    await page.addInitScript(() => {
      window.__nativeMockAudioEnded = [];
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function (...args) {
        this.addEventListener('ended', () => window.__nativeMockAudioEnded.push(new URL(this.currentSrc || this.src).pathname), { once: true });
        return play.apply(this, args);
      };
    });
    const served = new Set();
    page.on('response', response => {
      if (response.ok() && /\.mp3(?:\?|$)/.test(response.url())) served.add(new URL(response.url()).pathname);
    });
    await open(page, `&mode=format&item=${questionId}`);
    const current = await item(page);
    expect(current.mediaReady).toBe(true);
    expect(await page.evaluate(() => new Audio() instanceof HTMLAudioElement)).toBe(true);
    if (current.modality === 'reading') {
      expect(current.requiredAudioCues.map(cue => [cue.role, cue.text])).toEqual([['instruction', current.prompt]]);
      await expect(page.getByText(current.passage, { exact: true })).toBeVisible();
    } else {
      expect(current.requiredAudioCues.some(cue => cue.role === 'passage' && cue.text === current.passage)).toBe(true);
      await expect(page.getByText(current.passage, { exact: true })).toHaveCount(0);
    }
    await page.getByRole('button', { name: 'Listen to the question', exact: true }).click();
    await chooseAnswer(page, current);
    await expect.poll(() => page.evaluate(paths => paths.every(path => window.__nativeMockAudioEnded.includes(path)), current.requiredAudioPaths), { timeout: 90000 }).toBe(true);
    expect(current.requiredAudioPaths.every(path => served.has(path))).toBe(true);
    await next(page);
    const response = (await server(page)).lastSubmission;
    expect(response.questionId).toBe(questionId);
    expect(current.requiredAudioPaths.every(path => response.audioDelivery[path] === 'completed')).toBe(true);
  });
}

test('teacher start, sound check, pause and resume preserve the current selection', async ({ page }) => {
  await simulatedAudio(page);
  await open(page, '&mode=teacher&warmup=1');
  await page.getByRole('button', { name: 'Results', exact: true }).click();
  await page.getByRole('combobox', { name: 'Open a session', exact: true }).selectOption('mock-session');
  await page.getByRole('button', { name: 'Live', exact: true }).click();
  await page.getByRole('button', { name: 'Start assessment', exact: true }).click();
  await open(page, '&warmup=1');
  await page.getByRole('button', { name: 'Circle', exact: true }).click();
  await expect(forwardAction(page)).toBeDisabled();
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
  await expect(page.getByRole('group', { name: 'Answer choices', exact: true })).toBeVisible();
  expect((await server(page)).run.responses).toHaveLength(0);
  expect((await server(page)).run.plan.itemIds.some(id => tutorials.some(item => item.id === id))).toBe(false);
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
  await expect(forwardAction(page)).toBeDisabled();
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
  await open(page, '&mode=teacher');
  await page.getByRole('button', { name: 'Help with the answer', exact: true }).click();
  await open(page);
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
  await openPreparation(page);
  await page.getByRole('radio', { name: 'Individual or selected students', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Alex', exact: true }).check();
  await page.getByRole('radio', { name: 'Full class (2)', exact: true }).check();
  await page.evaluate(() => window.__literacyMock.setFault('receipt-lost'));
  await page.getByRole('button', { name: 'Prepare for 2 students', exact: true }).click();
  await page.getByRole('button', { name: 'Retry the same preparation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start assessment', exact: true })).toBeVisible();
  const call = (await server(page)).calls.find(call => call.name === 'teacher_prepare_literacy_mock_session_v4');
  expect(call.args.p_student_ids).toEqual([]);
  expect(call.args.p_whole_class).toBe(true);
  const preparations = (await server(page)).calls.filter(call => call.name === 'teacher_prepare_literacy_mock_session_v4');
  expect(preparations).toHaveLength(2);
  expect(preparations[0].args).toEqual(preparations[1].args);
  const preparedId = (await server(page)).session.id;
  await page.getByRole('button', { name: 'Results', exact: true }).click();
  await page.getByRole('combobox', { name: 'Open a session', exact: true }).selectOption('mock-session');
  await page.getByRole('button', { name: 'Live', exact: true }).click();
  await page.getByRole('button', { name: 'Live', exact: true }).click();
  await page.getByRole('button', { name: 'Finish assessment', exact: true }).click();
  await page.getByRole('button', { name: 'Finish and keep the report', exact: true }).click();
  await page.getByRole('button', { name: 'Results', exact: true }).click();
  await page.getByRole('combobox', { name: 'Open a session', exact: true }).selectOption(preparedId);
  await page.getByRole('button', { name: 'Live', exact: true }).click();
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
  await page.getByRole('button', { name: 'Live', exact: true }).click();
  await page.getByRole('button', { name: 'Finish assessment', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Live', exact: true }).click();
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
        await expect(forwardAction(page)).toBeDisabled();
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
    const forward = forwardAction(page);
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
  await openPreparation(page);
  await page.evaluate(() => window.__literacyMock.setFault('hang-prepare'));
  await page.getByRole('button', { name: 'Prepare for 2 students', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry the same preparation', exact: true })).toBeVisible({ timeout: 15000 });
  await page.evaluate(() => window.__literacyMock.setFault(null));
  await page.getByRole('button', { name: 'Retry the same preparation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start assessment', exact: true })).toBeVisible();
  const requests = (await server(page)).calls.filter(call => call.name === 'teacher_prepare_literacy_mock_session_v4');
  expect(requests).toHaveLength(2); expect(requests[0].args).toEqual(requests[1].args);
});

test('original picture cells render individually for the learner and the saved teacher report', async ({ page }, info) => {
  await simulatedAudio(page); await open(page, '&item=mock.rhyme.dog-log');
  const current = await item(page);
  expect(current.choices.every(choice => choice.image.includes('#mock-cell='))).toBe(true);
  await expect(page.locator('.literacy-mock-choice [data-mock-image-cell]')).toHaveCount(4);
  await chooseAnswer(page, current);
  await expect(forwardAction(page)).toBeEnabled();
  await page.screenshot({ path: info.outputPath('original-picture-choices.png'), fullPage: true });
  await next(page);
  await expect.poll(async () => (await server(page)).run.responses.length).toBe(1);
  await open(page, '&mode=teacher');
  await page.getByRole('button', { name: 'View Alex’s report', exact: true }).click();
  await page.getByText('Question-by-question evidence (1)', { exact: true }).click();
  const currentResponse = page.locator('.literacy-mock-response-list > li').first();
  await expect(currentResponse).toBeVisible();
  const pictures = currentResponse.locator('.literacy-mock-evidence-pictures');
  await expect(pictures.locator('[data-mock-image-cell]')).toHaveCount(4);
  for (const bounds of await pictures.locator('[data-mock-image-cell]').evaluateAll(nodes => nodes.map(node => ({ width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height, overflow: getComputedStyle(node).overflow })))) {
    expect(bounds).toEqual({ width: 110, height: 110, overflow: 'hidden' });
  }
  await pictures.screenshot({ path: info.outputPath('teacher-original-picture-evidence.png') });
});

test('legacy v3 unavailable shared picture art stops safely when no same-construct source remains', async ({ page }) => {
  await simulatedAudio(page);
  await page.route('**/images/assessment/literacy-mock/object-atlas-v1.webp', route => route.abort());
  await open(page, '&version=literacy-mock-v3&item=mock.rhyme.dog-log');
  await expect(page.getByText('A picture or recording did not load. This question will not count.')).toBeVisible();
  await expect(forwardAction(page)).toBeDisabled();
  await page.getByRole('button', { name: 'Go to another question', exact: true }).click();
  await expect.poll(async () => (await server(page)).run.mediaFailures.length).toBe(1);
  await expect(page.getByRole('heading', { name: 'Ask your teacher.', exact: true })).toBeVisible();
  const { run } = await server(page);
  expect(run.responses).toHaveLength(0); expect(run.unsampledItemIds).toHaveLength(24);
  expect(run.mediaFailures[0]).toMatchObject({ responseStatus: 'media_failed', selected: null, isCorrect: null });
  expect(run.plan.itemIds[0]).toBe('mock.rhyme.dog-log');
  expect(run.status).toBe('running');
});

test('v4 failed shared rhyme art uses a fresh same-task replacement without scoring the failure', async ({ page }) => {
  await simulatedAudio(page);
  await page.route('**/images/assessment/literacy-mock/object-atlas-v1.webp', route => route.abort());
  await open(page, '&version=literacy-mock-v4&item=mock.rhyme.dog-log');
  const original = await item(page);
  await expect(page.getByText('A picture or recording did not load. This question will not count.')).toBeVisible();
  await page.getByRole('button', { name: 'Go to another question', exact: true }).click();
  await expect.poll(async () => (await server(page)).run.mediaFailures.length).toBe(1);
  await expect(page.getByRole('region', { name: 'Question 1', exact: true })).toBeVisible();
  const replacement = await item(page);
  expect(replacement.id).not.toBe(original.id);
  expect(replacement.constructClaim).toBe(original.constructClaim);
  expect(replacement.modality).toBe(original.modality);
  expect(replacement.level).toBe(original.level);
  expect(replacement.adaptiveMixedEligible).toBe(true);
  expect((await server(page)).run.responses).toHaveLength(0);
  await chooseAnswer(page, replacement); await next(page);
  await expect.poll(async () => (await server(page)).run.responses.length).toBe(1);
  expect((await server(page)).run.responses[0].questionId).toBe(replacement.id);
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
  await expect(forwardAction(page)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'All done. Thank you!', exact: true })).toHaveCount(0);
  const { run } = await server(page);
  expect(run.responses).toHaveLength(0); expect(run.unsampledItemIds).toHaveLength(24); expect(run.status).toBe('running');
  expect(run.mediaFailures.length).toBeGreaterThan(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Ask your teacher.', exact: true })).toBeVisible();
});

test('an already presented withdrawn question is replaced without creating an answer or a media failure', async ({ page }) => {
  await simulatedAudio(page);
  const withdrawnId = 'lp3.r_controlled_vowels.l1.C.ur.v9';
  await open(page, `&count=43&item=${withdrawnId}&presented=1&priorTaskAnswer=1`);
  await expect(page.getByRole('region', { name: 'Question 2', exact: true })).toBeVisible();
  await expect.poll(async () => (await item(page)).id).not.toBe(withdrawnId);
  const beforeAnswer = await server(page);
  const original = beforeAnswer.run.presentations.find(value => value.questionId === withdrawnId).itemSnapshot;
  const replacement = await item(page);
  expect(replacement.skillId).toBe(original.skillId);
  expect(replacement.constructClaim).toBe(original.constructClaim);
  expect(replacement.modality).toBe(original.modality);
  expect(replacement.level).toBe(original.level);
  expect(beforeAnswer.run.responses).toHaveLength(1);
  expect(beforeAnswer.run.mediaFailures).toHaveLength(0);
  expect(beforeAnswer.run.plan.itemIds).toHaveLength(43);
  expect(beforeAnswer.calls.some(call => call.args.p_response?.responseStatus === 'media_failed')).toBe(false);
  await page.reload();
  await expect(page.getByRole('region', { name: 'Question 2', exact: true })).toBeVisible();
  expect((await item(page)).id).toBe(replacement.id);
  await chooseAnswer(page);
  const forward = page.locator('.literacy-mock-next');
  await expect(forward).toHaveText('Next question');
  await expect(forward).toBeEnabled();
  await forward.click();
  await expect.poll(async () => (await server(page)).run.responses.length).toBe(2);
  expect((await server(page)).run.responses[1].questionId).toBe(replacement.id);
  expect((await server(page)).run.responses[0]).toEqual(beforeAnswer.run.responses[0]);
  await open(page, '&mode=teacher');
  await page.getByRole('button', { name: 'View Alex’s report', exact: true }).click();
  await page.getByText(/^Seen without a saved answer \(\d+\)$/).click();
  await expect(page.getByText('Question withdrawn — unscored', { exact: false })).toBeVisible();
  await expect(page.getByText('Media availability log (1)', { exact: true })).toHaveCount(0);
});

test('a withdrawn question waits safely when the server cannot repair its saved presentation', async ({ page }) => {
  await simulatedAudio(page);
  const withdrawnId = 'lp3.r_controlled_vowels.l1.C.ur.v9';
  await open(page, `&count=43&item=${withdrawnId}&presented=1&legacyContentBackend=1`);
  await expect(page.getByRole('alert')).toHaveText('A question is being checked. Your saved answers are safe.');
  await expect(page.getByRole('button', { name: /^(Next|Next question|Finish test)$/ })).toHaveCount(0);
  const saved = await server(page);
  expect(saved.run.plan.itemIds[0]).toBe(withdrawnId);
  expect(saved.run.responses).toHaveLength(0);
  expect(saved.run.mediaFailures).toHaveLength(0);
  expect(saved.calls.some(call => call.name === 'student_save_literacy_mock_run')).toBe(false);
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('A question is being checked. Your saved answers are safe.');
});

test('a pending pre-withdrawal plan is preserved without retrying it against an older server', async ({ page }) => {
  await simulatedAudio(page);
  await open(page, '&count=43&legacyContentBackend=1');
  const saved = await server(page);
  const pending = { requestId: 'pre-withdrawal-plan', expectedRevision: 0, response: null,
    plan: { ...saved.run.plan, itemIds: ['lp3.r_controlled_vowels.l1.C.ur.v9', ...saved.run.plan.itemIds.slice(1)] } };
  await page.addInitScript(({ saved, pending, caseId }) => {
    localStorage.setItem(`literacy-mock-browser-server:${caseId}`, JSON.stringify({ ...saved, run: null, calls: [] }));
    sessionStorage.setItem('lp-mock-pending:student-a:mock-session', JSON.stringify(pending));
  }, { saved, pending, caseId: test.info().testId });
  await page.reload();
  await expect(page.getByRole('alert')).toHaveText('A question is being checked. Your saved answers are safe.');
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('A question is being checked. Your saved answers are safe.');
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('lp-mock-pending:student-a:mock-session')))).toEqual(pending);
  const blocked = await server(page);
  expect(blocked.run).toBeNull();
  expect(blocked.calls.some(call => call.name === 'student_save_literacy_mock_run')).toBe(false);
});

test('a legacy v1 session resumes its draft without treating its own display as prior practice', async ({ page }) => {
  await simulatedAudio(page);
  await open(page, '&version=literacy-mock-v1&item=mock.build.dog');
  await chooseAnswer(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(forwardAction(page)).toBeEnabled();
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
  await page.getByRole('button', { name: 'Results', exact: true }).click();
  await page.getByRole('combobox', { name: 'Open a session', exact: true }).selectOption('mock-session');
  await page.getByRole('button', { name: 'Live', exact: true }).click();
  await page.getByRole('button', { name: 'View Alex’s report', exact: true }).click();
  const metric = label => page.locator('.literacy-mock-metrics > div').filter({ has: page.getByText(label, { exact: true }) }).locator('dd');
  await expect(metric('Questions not reached')).toHaveText('23');
  await expect(metric('Seen without an answer')).toHaveText('1');
  await expect(metric('Skills with no recorded offer')).toHaveText('46 of 47');
  expect((await server(page)).run.responses).toHaveLength(0);
  const shown = (await server(page)).run.presentations[0].questionId;
  await page.getByText('Seen without a saved answer (1)', { exact: true }).click();
  await expect(page.getByText(`Question ${shown}`, { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Prepare a fresh check', exact: true })).toHaveCount(0);
  expect((await server(page)).run.presentations[0].questionId).toBe(shown);
  expect((await server(page)).run.responses).toHaveLength(0);
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
  await page.getByRole('button', { name: 'View Alex’s report', exact: true }).click();
  await page.getByText('Question-by-question evidence (1)', { exact: true }).click();
  await page.locator('.literacy-mock-response-list').getByText('Record or review assistance', { exact: true }).click();
  await page.getByRole('button', { name: 'Help with the answer', exact: true }).click();
  expect((await server(page)).run.responses[0]).toMatchObject({ evidenceType: 'supported', answerAssistance: true });
  expect(await page.evaluate(() => window.__literacyMock.rawResponses())).toEqual(raw);
  await expect(page.getByRole('button', { name: 'No assistance needed', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Controls or access only', exact: true })).toBeDisabled();
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
  await expect(forwardAction(page)).toBeDisabled();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await chooseAnswer(page, current);
  await expect(page.locator('.literacy-mock-construction button')).toHaveCount(3);
  await next(page);
  expect((await server(page)).lastSubmission.selected).toBe('fish');
});

for (const [questionId, spokenChoices] of [
  ['mock.depth.key_details.ticket', false],
  ['mock.depth.context_clues.bank', true],
]) {
  test(`saved report discloses actual spoken-choice conditions: ${questionId}`, async ({ page }, info) => {
    await simulatedAudio(page);
    await open(page, `&item=${questionId}`);
    await expect(page.getByRole('region', { name: 'Question 1', exact: true })).toBeVisible();
    const current = await item(page);
    // A mixed sitting starts at its entry demand, so a requested depth item may
    // be replaced before presentation. Assert the actual saved access condition.
    expect(current.requiredAudioCues.some(cue => cue.role === 'choice')).toBe(spokenChoices);
    await chooseAnswer(page, current);
    await next(page);
    await expect.poll(async () => (await server(page)).run.responses.length).toBe(1);
    await page.evaluate(() => window.__literacyMock.teacher('finish'));
    await open(page, '&mode=teacher');
    await page.getByRole('button', { name: 'Results', exact: true }).click();
    await page.getByRole('combobox', { name: 'Open a session', exact: true }).selectOption('mock-session');
    await page.getByRole('button', { name: 'Live', exact: true }).click();
    await page.getByRole('button', { name: 'View Alex’s report', exact: true }).click();
    await page.getByText('Question-by-question evidence (1)', { exact: true }).click();
    const evidence = page.locator('.literacy-mock-response-list .literacy-mock-evidence').filter({ hasText: `Question ${current.id}` });
    await expect(evidence).toBeVisible();
    await expect(evidence).toContainText('Printed text');
    if (spokenChoices) await expect(evidence).toContainText('Required choice narration completed');
    else await expect(evidence).not.toContainText(/choice narration|[Cc]hoices read aloud/);
    await expect(evidence).toContainText('Independent first response');
    await evidence.screenshot({ path: info.outputPath('saved-report-access.png') });
  });
}

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

for (const count of [24, 43]) test(`a complete v4 ${count}-question mixed sitting adapts every sampled task and saves every response`, async ({ page }) => {
  test.setTimeout(120000);
  await simulatedAudio(page); await open(page, `&version=literacy-mock-v4&count=${count}`);
  const initial = await page.evaluate(() => window.__literacyMock.planItems());
  const answered = [];
  for (let index = 0; index < count; index++) {
    await expect(page.getByRole('region', { name: `Question ${index + 1}`, exact: true })).toBeVisible();
    const current = await item(page);
    expect(current.skillId).toBe(initial[index].skillId);
    expect(current.constructClaim).toBe(initial[index].constructClaim);
    expect(current.modality).toBe(initial[index].modality);
    expect(current.adaptiveMixedEligible).toBe(true);
    const prior = answered.some(value => value.skillId === current.skillId && value.constructClaim === current.constructClaim);
    expect(current.level).toBe(prior ? 2 : 1);
    await expect.poll(async () => (await server(page)).run.presentations.some(value => value.questionId === current.id)).toBe(true);
    await chooseAnswer(page, current); await next(page);
    await expect.poll(async () => (await server(page)).run.responses.length).toBe(index + 1);
    answered.push(current);
    if (index === 12) await page.reload({ waitUntil: 'domcontentloaded' });
  }
  await expect(page.getByRole('heading', { name: 'All done. Thank you!', exact: true })).toBeVisible();
  const run = (await server(page)).run;
  expect(run.status).toBe('completed');
  expect(run.contentVersion).toBe('literacy-mock-v4');
  expect(run.presentations).toHaveLength(count);
  expect(run.responses).toHaveLength(count);
  expect(run.responses.every(response => response.isCorrect && response.evidenceType === 'independent' && response.knownFamiliar !== true)).toBe(true);
  expect(run.responses.map(response => response.questionId)).toEqual(answered.map(value => value.id));
  expect(new Set(answered.map(value => value.stimulusKey)).size).toBe(count);
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

test('teacher records unsolicited answer assistance after completion using the saved response', async ({ page }) => {
  await simulatedAudio(page); await open(page);
  await chooseAnswer(page); await next(page);
  await expect.poll(async () => (await server(page)).run.responses.length).toBe(1);
  const raw = await page.evaluate(() => window.__literacyMock.rawResponses());
  expect(raw[0].supportUsed).toBe(false);
  await open(page, '&mode=teacher');
  await page.getByRole('button', { name: 'Live', exact: true }).click();
  await page.getByRole('button', { name: 'Finish assessment', exact: true }).click();
  await page.getByRole('button', { name: 'Finish and keep the report', exact: true }).click();
  await page.getByRole('button', { name: 'View Alex’s report', exact: true }).click();
  await page.getByText('Question-by-question evidence (1)', { exact: true }).click();
  await page.locator('.literacy-mock-response-list').getByText('Record or review assistance', { exact: true }).click();
  await page.getByRole('button', { name: 'Help with the answer', exact: true }).click();
  await expect(page.getByText('Help recorded — separate evidence', { exact: false })).toBeVisible();
  expect((await server(page)).run.responses[0]).toMatchObject({ evidenceType: 'supported', helpRequested: false });
  expect(await page.evaluate(() => window.__literacyMock.rawResponses())).toEqual(raw);
  await expect(page.getByRole('button', { name: 'No assistance needed', exact: true })).toBeDisabled();
});

test('selecting a review response opens evidence without offering another MAP test', async ({ page }) => {
  await simulatedAudio(page); await open(page, '&item=lp3.initial_sounds.l1.A.a.v1');
  const current = await item(page);
  const ordered = await page.evaluate(id => window.__literacyMock.choiceOrder(id), current.id);
  await page.locator('.literacy-mock-choice').nth(ordered.findIndex(choice => choice.id !== current.answer)).click();
  await next(page);
  await expect.poll(async () => (await server(page)).run.responses.length).toBe(1);
  await open(page, '&mode=teacher');
  await page.getByRole('button', { name: 'Results', exact: true }).click();
  const group = page.locator('.literacy-mock-groups > details').first();
  await group.locator('summary').click();
  await group.getByRole('checkbox', { name: 'Alex', exact: true }).check();
  await expect(group.getByRole('button', { name: 'Prepare fresh check for Alex', exact: true })).toHaveCount(0);
  await group.getByRole('button', { name: 'Open Alex’s evidence', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Alex — test results', exact: true })).toBeVisible();
});

for (const kind of ['mixed', 'fresh']) test(`${kind} registration keeps server exposure exclusions when local storage writes fail`, async ({ page }) => {
  await simulatedAudio(page);
  await page.addInitScript(() => {
    const save = Storage.prototype.setItem;
    window.__blockedAppWrites = 0;
    Storage.prototype.setItem = function(key, value) {
      // The simulator's remote state stays available; every app-side local
      // persistence attempt fails as on a full or disabled device store.
      if (!key.startsWith('literacy-mock-browser-server:')) {
        window.__blockedAppWrites++;
        throw new DOMException('Storage unavailable', 'QuotaExceededError');
      }
      return save.call(this, key, value);
    };
  });
  await open(page, `&serverExposed=${kind}`);
  const before = await server(page);
  expect(before.run).toBeNull();
  expect(before.serverExposures).toHaveLength(1);
  await page.getByRole('button', { name: 'Circle', exact: true }).click();
  await page.getByRole('button', { name: 'Check my sound', exact: true }).click(); await next(page);
  if (kind === 'mixed') {
    for (const tutorial of await page.evaluate(() => window.__literacyMock.tutorials())) {
      await chooseAnswer(page, tutorial); await next(page);
    }
  }
  await expect(page.getByRole('region', { name: 'Question 1', exact: true })).toBeVisible();
  const after = await server(page);
  expect(after.run.plan.itemIds).not.toContain(before.serverExposures[0].id);
  const registrations = after.calls.filter(call => call.name === 'student_save_literacy_mock_run' && call.args.p_plan);
  expect(registrations).toHaveLength(1);
  expect(await page.evaluate(() => window.__blockedAppWrites)).toBeGreaterThan(0);
  await chooseAnswer(page); await next(page);
  await expect.poll(async () => (await server(page)).run.responses.length).toBe(1);
});

test('an uncertain preparation keeps its retry visible and blocks competing session actions', async ({ page }) => {
  await open(page, '&mode=teacher');
  await expect(page.getByRole('button', { name: 'Pause assessment', exact: true })).toBeVisible();
  await openPreparation(page);
  await page.evaluate(() => window.__literacyMock.setFault('receipt-lost'));
  await page.getByRole('button', { name: 'Prepare for 2 students', exact: true }).click();
  const retry = page.getByRole('button', { name: 'Retry the same preparation', exact: true });
  await expect(retry).toBeVisible();
  await page.getByRole('button', { name: 'Results', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Open a session', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Live', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause assessment', exact: true })).toBeDisabled();
  await openPreparation(page);
  await expect(page.getByRole('button', { name: 'Prepare for 2 students', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Refresh progress', exact: true }).click();
  await expect(retry).toBeVisible();
  await retry.click();
  await expect(page.getByRole('button', { name: 'Start assessment', exact: true })).toBeEnabled();
  const requests = (await server(page)).calls.filter(call => call.name === 'teacher_prepare_literacy_mock_session_v4');
  expect(requests).toHaveLength(2);
  expect(requests[0].args).toEqual(requests[1].args);
});

test('an uncertain control blocks preparation until its exact retry is confirmed', async ({ page }) => {
  await open(page, '&mode=teacher');
  await expect(page.getByRole('button', { name: 'Add 5 minutes', exact: true })).toBeEnabled();
  await page.evaluate(() => window.__literacyMock.setFault('receipt-lost'));
  await page.getByRole('button', { name: 'Add 5 minutes', exact: true }).click();
  const retry = page.getByRole('button', { name: 'Retry the same action', exact: true });
  await expect(retry).toBeVisible();
  await openPreparation(page);
  await expect(page.getByRole('button', { name: 'Prepare for 2 students', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Results', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Open a session', exact: true })).toBeDisabled();
  await retry.click();
  await expect(page.getByRole('button', { name: 'Pause assessment', exact: true })).toBeEnabled();
  await openPreparation(page);
  await expect(page.getByRole('button', { name: 'Prepare for 2 students', exact: true })).toBeEnabled();
  const requests = (await server(page)).calls.filter(call => call.args.p_action === 'add_time');
  expect(requests).toHaveLength(2);
  expect(requests[0].args).toEqual(requests[1].args);
});

test('teacher reload recovers a lost preparation receipt without creating a second draft', async ({ page }) => {
  await open(page, '&mode=teacher');
  await expect(page.getByRole('button', { name: 'Pause assessment', exact: true })).toBeVisible();
  await openPreparation(page);
  await page.evaluate(() => window.__literacyMock.setFault('receipt-lost'));
  await page.getByRole('button', { name: 'Prepare for 2 students', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry the same preparation', exact: true })).toBeVisible();
  const committed = await server(page);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Retry the same preparation', exact: true })).toBeVisible();
  await openPreparation(page);
  await expect(page.getByRole('button', { name: 'Prepare for 2 students', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Retry the same preparation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start assessment', exact: true })).toBeEnabled();
  const recovered = await server(page);
  expect(recovered.session.id).toBe(committed.session.id);
  expect(recovered.archives).toHaveLength(committed.archives.length);
  const requests = recovered.calls.filter(call => call.name === 'teacher_prepare_literacy_mock_session_v4');
  expect(requests).toHaveLength(2);
  expect(requests[0].args).toEqual(requests[1].args);
});

test('same-session external phase navigation opens Live and preserves a pending control receipt', async ({ page }) => {
  await open(page, '&mode=teacher&session=mock-session&phase=results&phaseNavigation=1');
  const workspace = page.locator('[data-session-protocol="mock"]');
  await expect(workspace).toHaveAttribute('data-session-phase', 'results');
  await page.getByRole('button', { name: 'Open this session', exact: true }).click();
  await expect(workspace).toHaveAttribute('data-session-phase', 'live');
  await expect(page.getByRole('button', { name: 'Add 5 minutes', exact: true })).toBeEnabled();
  await page.evaluate(() => window.__literacyMock.setFault('receipt-lost'));
  await page.getByRole('button', { name: 'Add 5 minutes', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry the same action', exact: true })).toBeVisible();
  const committed = await server(page);
  await page.getByRole('button', { name: 'Open this session’s results', exact: true }).click();
  await expect(workspace).toHaveAttribute('data-session-phase', 'results');
  await page.getByRole('button', { name: 'Open this session', exact: true }).click();
  await expect(workspace).toHaveAttribute('data-session-phase', 'live');
  await page.getByRole('button', { name: 'Retry the same action', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause assessment', exact: true })).toBeEnabled();
  const recovered = await server(page);
  expect(recovered.session.mock.time_extension_count).toBe(committed.session.mock.time_extension_count);
  const requests = recovered.calls.filter(call => call.args.p_action === 'add_time');
  expect(requests).toHaveLength(2);
  expect(requests[0].args).toEqual(requests[1].args);
});

test('late history leaves an edited preparation open with its audience and break choice intact', async ({ page }) => {
  await open(page, '&mode=teacher&warmup=1&holdHistory=1');
  const workspace = page.locator('[data-session-protocol="mock"]');
  await expect(workspace).toHaveAttribute('data-session-phase', 'prepare');
  await page.getByRole('radio', { name: 'Individual or selected students', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Bailey', exact: true }).check();
  await page.getByText('Break settings', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Time before a break', exact: true }).selectOption('10');
  await expect.poll(async () => (await server(page)).calls.some(call => call.name === 'teacher_list_literacy_mock_history_page')).toBe(true);
  await page.evaluate(() => window.__literacyMock.releaseHistory());
  await expect(page.getByRole('button', { name: 'Start assessment', exact: true })).toBeVisible();
  await expect(workspace).toHaveAttribute('data-session-phase', 'prepare');
  await expect(page.getByRole('checkbox', { name: 'Bailey', exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Bailey', exact: true })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Alex', exact: true })).not.toBeChecked();
  await expect(page.getByRole('combobox', { name: 'Time before a break', exact: true })).toHaveValue('10');
  await expect(page.getByRole('button', { name: 'Prepare for 1 student', exact: true })).toBeEnabled();
});

test('an explicitly selected report student owns both history and pupil selection after load and reload', async ({ page }) => {
  await open(page, '&mode=teacher&session=mock-session&student=student-b&phase=results');
  const assertSelection = async () => {
    await expect(page.getByRole('combobox', { name: 'Students', exact: true })).toHaveValue('student-b');
    await expect(page.getByRole('combobox', { name: 'Open a session', exact: true })).toHaveValue('mock-session');
    await expect(page.getByRole('combobox', { name: 'Report for', exact: true })).toHaveValue('student-b');
    await expect(page.getByRole('heading', { name: 'Bailey — test results', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Alex — test results', exact: true })).toHaveCount(0);
  };
  await assertSelection();
  await page.reload();
  await assertSelection();
});

test('an exact saved report stays selected while another session control retries its original receipt', async ({ page }) => {
  await simulatedAudio(page);
  await open(page);
  const originalItem = await item(page);
  await chooseAnswer(page, originalItem);
  await next(page);
  await expect.poll(async () => (await server(page)).run.responses.length).toBe(1);
  await page.evaluate(() => window.__literacyMock.teacher('finish'));
  const originalReport = await server(page);
  const originalResponses = await page.evaluate(() => window.__literacyMock.rawResponses());

  // Prepare a different, real session before losing a control receipt on it.
  await open(page, '&mode=teacher');
  await openPreparation(page);
  await page.getByRole('button', { name: 'Prepare for 2 students', exact: true }).click();
  await page.getByRole('button', { name: 'Start assessment', exact: true }).click();
  await page.evaluate(() => window.__literacyMock.setFault('receipt-lost'));
  await page.getByRole('button', { name: 'Add 5 minutes', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry the same action', exact: true })).toBeVisible();
  const committed = await server(page);
  expect(committed.session.id).not.toBe(originalReport.session.id);
  const originalRequest = committed.calls.find(call => call.args.p_action === 'add_time');
  expect(originalRequest.args.p_session_id).toBe(committed.session.id);

  // The explicit saved link must win display selection, without abandoning A's retry.
  await open(page, `&mode=teacher&session=${originalReport.session.id}&student=student-a&phase=results`);
  const workspace = page.locator('[data-session-protocol="mock"]');
  const sessionPicker = page.getByRole('combobox', { name: 'Open a session', exact: true });
  await expect(workspace).toHaveAttribute('data-session-phase', 'results');
  await expect(sessionPicker).toHaveValue(originalReport.session.id);
  await expect(page.getByRole('combobox', { name: 'Students', exact: true })).toHaveValue('student-a');
  await expect(page.getByRole('combobox', { name: 'Report for', exact: true })).toHaveValue('student-a');
  await expect(page.getByRole('heading', { name: 'Alex — test results', exact: true })).toBeVisible();
  await page.getByText('Question-by-question evidence (1)', { exact: true }).click();
  const responses = page.locator('.literacy-mock-response-list > li');
  await expect(responses).toHaveCount(1);
  await expect(responses).toContainText(`Question ${originalItem.id}`);
  await page.getByRole('button', { name: 'Retry the same action', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry the same action', exact: true })).toHaveCount(0);
  await expect(workspace).toHaveAttribute('data-session-phase', 'results');
  await expect(sessionPicker).toHaveValue(originalReport.session.id);
  await expect(responses).toHaveCount(1);
  await expect(responses).toContainText(`Question ${originalItem.id}`);
  const recovered = await server(page);
  const requests = recovered.calls.filter(call => call.args.p_action === 'add_time');
  expect(requests).toHaveLength(2);
  expect(requests[1].args).toEqual(originalRequest.args);
  expect(recovered.session.mock.time_extension_count).toBe(committed.session.mock.time_extension_count);
  expect(recovered.archives.find(record => record.session.id === originalReport.session.id).run.responses)
    .toEqual(originalResponses);
});

test('teacher reload retries a lost time-extension receipt without adding time twice', async ({ page }) => {
  await open(page, '&mode=teacher');
  await expect(page.getByRole('button', { name: 'Add 5 minutes', exact: true })).toBeEnabled();
  await page.evaluate(() => window.__literacyMock.setFault('receipt-lost'));
  await page.getByRole('button', { name: 'Add 5 minutes', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry the same action', exact: true })).toBeVisible();
  const committed = await server(page);
  await page.reload();
  await page.getByRole('button', { name: 'Retry the same action', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause assessment', exact: true })).toBeEnabled();
  const recovered = await server(page);
  expect(recovered.session.mock.time_extension_count).toBe(committed.session.mock.time_extension_count);
  const requests = recovered.calls.filter(call => call.args.p_action === 'add_time');
  expect(requests).toHaveLength(2);
  expect(requests[0].args).toEqual(requests[1].args);
});

test('teacher reload recovers lost assistance confirmation without rewriting the saved answer', async ({ page }) => {
  await simulatedAudio(page);
  await open(page);
  await page.getByRole('button', { name: 'I need help', exact: true }).click();
  await chooseAnswer(page);
  await next(page);
  await expect.poll(async () => (await server(page)).run.responses.length).toBe(1);
  const raw = await page.evaluate(() => window.__literacyMock.rawResponses());
  await open(page, '&mode=teacher');
  await page.evaluate(() => window.__literacyMock.setFault('receipt-lost'));
  await page.getByRole('button', { name: 'Controls or access only', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry the same evidence action', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Retry the same evidence action', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry the same evidence action', exact: true })).toHaveCount(0);
  const recovered = await server(page);
  const requests = recovered.calls.filter(call => call.name === 'teacher_resolve_literacy_mock_support');
  expect(requests).toHaveLength(2);
  expect(requests[0].args).toEqual(requests[1].args);
  expect(recovered.run.responses[0].accessAssistance).toBe(true);
  expect(await page.evaluate(() => window.__literacyMock.rawResponses())).toEqual(raw);
});

test('late assistance commits a failed harder item repair before adapting its replacement', async ({ page }) => {
  await simulatedAudio(page);
  await open(page, '&mode=teacher');
  const seeded = await page.evaluate(async () => {
    const { loadLiteracyMockBank } = await import('/src/data/literacyMockBank.js');
    const { adaptLiteracyMockPlan, replaceFailedLiteracyMockMedia } = await import('/src/utils/literacyMockPlanner.js');
    const bank = await loadLiteracyMockBank();
    const byId = new Map(bank.map(item => [item.id, item]));
    const record = window.__literacyMock.state();
    const responses = record.run.plan.itemIds.slice(0, 8).map((questionId, index) => {
      const item = byId.get(questionId);
      return { questionId, skillId: item.skillId, domainId: item.domainId, level: item.level, itemSnapshot: item,
        selected: item.answer, responseStatus: 'answered', isCorrect: index === 0, evidenceType: 'independent', supportUsed: false };
    });
    const raised = adaptLiteracyMockPlan(bank, record.run.plan, responses);
    const failed = byId.get(raised.itemIds[8]);
    if (failed.level !== 2) throw new Error('The fixture needs a genuine harder same-task follow-up.');
    const failure = failed.requiredAudioPaths.map(path => ({ questionId: failed.id, skillId: failed.skillId,
      domainId: failed.domainId, level: failed.level, itemSnapshot: failed, responseStatus: 'media_failed',
      selected: null, isCorrect: null, evidenceType: 'unscored', failedMediaPaths: [path] }))
      .find(value => !replaceFailedLiteracyMockMedia(bank, raised, responses, [value]).unavailable);
    if (!failure) throw new Error('The fixture needs a replaceable media failure.');
    record.run = { ...record.run, revision: 12, eventRevision: 10, plan: raised, responses,
      mediaFailures: [failure], presentations: [...responses, { questionId: failed.id, itemSnapshot: failed }],
      helpRequests: [{ questionId: responses[0].questionId, helpRequested: false, pending: false, status: 'resolved', assistanceType: 'answer' }] };
    record.calls = [];
    const key = `literacy-mock-browser-server:${new URLSearchParams(location.search).get('case')}`;
    localStorage.setItem(key, JSON.stringify(record));
    return { failedId: failed.id, levels: Object.fromEntries(bank.map(item => [item.id, item.level])) };
  });
  await open(page);
  await expect(page.getByRole('region', { name: 'Question 9', exact: true })).toBeVisible();
  const result = await server(page);
  const plans = result.calls.filter(call => call.name === 'student_save_literacy_mock_run' && call.args.p_plan);
  expect(plans).toHaveLength(2);
  expect(seeded.levels[plans[0].args.p_plan.itemIds[8]]).toBe(2);
  expect(seeded.levels[plans[1].args.p_plan.itemIds[8]]).toBe(1);
  expect(plans[0].args.p_plan.itemIds[8]).not.toBe(seeded.failedId);
  expect(plans[1].args.p_expected_revision).toBe(plans[0].args.p_expected_revision + 1);
  expect(result.run.responses).toHaveLength(8);
  expect(result.run.responses[0].evidenceType).toBe('supported');
  expect(result.run.mediaFailures).toHaveLength(1);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test.describe('comprehensive teacher result delivery', () => {
for (const audience of ['whole class', 'individual']) test(`one full teacher-launched mock delivers two separate results: ${audience}`, async ({ page }, info) => {
  test.setTimeout(480000);
  await simulatedAudio(page);
  await open(page, '&mode=teacher&warmup=1&count=43');
  await page.getByRole('button', { name: 'Results', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Open a session', exact: true })).toHaveValue('mock-session');
  for (let sitting = 1; sitting <= 2; sitting++) {
    await openPreparation(page);
    if (audience === 'individual') {
      await page.getByRole('radio', { name: 'Individual or selected students' }).check();
      await page.getByRole('checkbox', { name: 'Alex', exact: true }).check();
    }
    await expect(page.getByRole('combobox', { name: 'Assessment length' })).toHaveCount(0);
    await expect(page.getByText('Full test · 43 questions', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: `Prepare for ${audience === 'individual' ? '1 student' : '2 students'}`, exact: true }).click();
    await expect(page.getByRole('button', { name: 'Start assessment', exact: true })).toBeEnabled();
    const prepared = await server(page);
    const prepareCalls = prepared.calls.filter(call => call.name === 'teacher_prepare_literacy_mock_session_v4');
    expect(prepareCalls.at(-1).args.p_item_count).toBe(43);
    expect(prepareCalls.at(-1).args.p_window_mode).toBe('pause_at_window_end');
    expect(prepareCalls.at(-1).args.p_student_ids).toEqual(audience === 'individual' ? ['student-a'] : []);
    const sessionId = prepared.session.id;
    await page.getByRole('button', { name: 'Start assessment', exact: true }).click();
    await open(page, '&warmup=1&count=43');
    await page.getByRole('button', { name: 'Circle', exact: true }).click();
    await page.getByRole('button', { name: 'Check my sound', exact: true }).click();
    await next(page);
    for (const tutorial of await page.evaluate(() => window.__literacyMock.tutorials())) {
      await chooseAnswer(page, tutorial); await next(page);
    }
    for (let index = 0; index < 43; index++) {
      await expect(page.getByRole('region', { name: `Question ${index + 1}`, exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: /I don.t know/ })).toHaveCount(0);
      await chooseAnswer(page);
      const primary = page.locator('.literacy-mock-next');
      await expect(primary).toHaveText(index === 42 ? 'Finish test' : 'Next question');
      await expect(primary).toHaveAccessibleName(index === 42 ? 'Finish test' : 'Next question');
      const box = await primary.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(64);
      expect(box.width).toBeGreaterThanOrEqual(160);
      if (index === 0 && sitting === 1) await page.screenshot({ path: info.outputPath('clear-next-question.png') });
      await next(page);
      await expect.poll(() => page.evaluate(() => window.__literacyMock.rawResponses().length)).toBe(index + 1);
      if (index === 12) await page.reload({ waitUntil: 'domcontentloaded' });
    }
    const finished = (await server(page)).run;
    expect(new Set(finished.responses.map(response => response.questionId)).size).toBe(43);
    expect(new Set(finished.responses.map(response => response.domainId)).size).toBe(8);
    await expect(page.getByText('Your answers are saved. Wait for your teacher.', { exact: true })).toBeVisible();
    await open(page, '&mode=teacher&warmup=1&count=43');
    await page.getByRole('button', { name: 'Results', exact: true }).click();
    await page.getByRole('combobox', { name: 'Open a session', exact: true }).selectOption(sessionId);
    await page.getByRole('button', { name: 'Live', exact: true }).click();
    const progress = page.getByRole('region', { name: 'Mock assessment pupil progress', exact: true });
    await expect(progress).toContainText('Finished · report received');
    await expect(progress).toContainText('43 answered of 43');
    await page.getByRole('button', { name: 'View Alex’s report', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Alex — test results', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'What went well', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Practise next', exact: true })).toBeVisible();
    const report = page.locator('.literacy-mock-report');
    await expect(report).toContainText('All 43 questions answered.');
    const shownSkills = new Set(finished.responses.map(response => response.skillId)).size;
    await expect(report.locator('dl').first()).toContainText(`Skills shown in this sitting${shownSkills}`);
    await expect(report).not.toContainText('Skills with no recorded offer');
    await report.getByText('Answer and coverage details', { exact: true }).click();
    await expect(report).toContainText('not a completion target for one sitting');
    await expect(report).toContainText(`${47 - shownSkills} of 47 catalogue skills`);
    if (sitting === 1) {
      for (const width of [320, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(report.getByText('All 43 questions answered.', { exact: true })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
        await report.screenshot({ path: info.outputPath(`answered-and-coverage-${width}.png`) });
      }
    }
    if (sitting === 1) await page.locator('.literacy-mock-report').screenshot({ path: info.outputPath('individual-test-results.png') });
    await page.getByText('Question-by-question evidence (43)', { exact: true }).click();
    await expect(page.locator('.literacy-mock-response-list > li')).toHaveCount(43);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Results', exact: true }).click();
    await page.getByRole('combobox', { name: 'Open a session', exact: true }).selectOption(sessionId);
    await page.getByRole('button', { name: 'Live', exact: true }).click();
    await expect(progress).toContainText('43 answered of 43');
    await page.getByRole('button', { name: 'Finish assessment', exact: true }).click();
    await page.getByRole('button', { name: 'Finish and keep the report', exact: true }).click();
    await expect(page.getByText('Time remaining at last check', { exact: true })).toHaveCount(0);
    if (sitting === 1) await page.screenshot({ path: info.outputPath('teacher-class-results.png') });
  }
  const saved = await server(page);
  const completed = [saved, ...saved.archives].filter(record => record.run?.responses.length === 43);
  expect(completed).toHaveLength(2);
  expect(new Set(completed.map(record => record.session.id)).size).toBe(2);
  expect(completed.every(record => new Set(record.run.responses.map(response => response.questionId)).size === 43)).toBe(true);
});

});
