import { expect, test } from '@playwright/test';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { MOCK_RUNTIME_INSTRUCTION_AUDIO } from '../../src/data/generated/literacyMockRuntimeAudio.generated.js';
import { replaceFailedLiteracyMockMedia, selectLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';

const fixture = '/tests/fixtures/literacy-mock.html';
const question = (page, index) => page.getByRole('region', { name: `Question ${index}`, exact: true });
const device = page => page.evaluate(() => window.__literacyMock.device());
const next = page => page.getByRole('button', { name: 'Next question', exact: true });

async function simulatedPlayback(context) {
  // These cases exercise local retention and controls. Actual recordings still
  // download; this overlay only removes hardware/audio timing as a test variable.
  await context.addInitScript(() => {
    window.Audio = class extends EventTarget {
      play() {
        this.onplaying?.();
        this.timer = setTimeout(() => this.onended?.(), 5);
        return Promise.resolve();
      }
      pause() { clearTimeout(this.timer); }
      load() {}
    };
  });
}

async function answerCurrent(page, expectedCount) {
  const item = await page.evaluate(() => window.__literacyMock.deviceItem());
  expect(['choice', 'multi_select']).toContain(item.format);
  const choices = page.locator('.literacy-mock-choice');
  for (let choice = 0; choice < (item.selectCount || 1); choice++) await choices.nth(choice).click();
  if (item.skillId === 'letter_knowledge' && /^[A-Za-z]$/.test(item.passage || '')) {
    await page.getByRole('button', { name: /^Space 1 for/ }).click();
  }
  if (!await next(page).isEnabled()) await page.getByRole('button', { name: 'Listen to the question' }).click();
  await expect(next(page)).toBeEnabled({ timeout: 20000 });
  await next(page).click();
  await expect.poll(async () => (await device(page)).run.responses.length).toBe(expectedCount);
}

test('closing the writer lets a standby tab continue the same offline queue and retry collection exactly once', async ({ context, page }, info) => {
  test.setTimeout(120000);
  await simulatedPlayback(context);
  const url = `${fixture}?case=${encodeURIComponent(info.testId)}&device=1&count=43`;
  await page.goto(url);
  await expect(question(page, 1)).toBeVisible({ timeout: 60000 });
  const standby = await context.newPage();
  await standby.goto(url);
  await expect(standby.getByRole('heading', { name: 'Your test is open in another tab.' })).toBeVisible();
  await expect(standby.getByRole('heading', { name: 'Your test is open in another tab.' })).toBeVisible();
  await expect(standby.locator('.literacy-mock-choice')).toHaveCount(0);

  await page.bringToFront();
  await page.evaluate(() => window.__literacyMock.setFault('offline'));
  await answerCurrent(page, 1);
  const saved = await device(page);
  expect(saved.serverRun.responses).toHaveLength(0);
  await standby.evaluate(() => window.__literacyMock.setFault('offline'));
  await page.close();
  await standby.bringToFront();
  await expect(question(standby, 2)).toBeVisible({ timeout: 60000 });
  const resumed = await device(standby);
  expect(resumed.run.responses).toEqual(saved.run.responses);
  expect(resumed.requests.slice(0, saved.requests.length)).toEqual(saved.requests);
  await answerCurrent(standby, 2);
  await standby.reload();
  await expect(question(standby, 3)).toBeVisible({ timeout: 60000 });
  const beforeCollection = await device(standby);
  expect(beforeCollection.run.responses).toHaveLength(2);
  expect(beforeCollection.serverRun.responses).toHaveLength(0);

  await standby.evaluate(async () => {
    window.__literacyMock.setFault(null);
    await window.__literacyMock.teacher('collect');
    window.__literacyMock.setFault('receipt-lost');
    window.dispatchEvent(new Event('online'));
  });
  await expect.poll(async () => (await device(standby)).requests.length, { timeout: 30000 }).toBe(0);
  const rows = await standby.evaluate(() => window.__literacyMock.rawResponses());
  expect(rows.map(row => row.selected)).toEqual(beforeCollection.run.responses.map(row => row.selected));
  const batches = await standby.evaluate(() => window.__literacyMock.state().calls.filter(call => call.name === 'student_sync_literacy_mock_batch' && call.args.p_requests.some(request => request.response)).map(call => call.args));
  expect(batches).toHaveLength(2);
  expect(batches[1]).toEqual(batches[0]);
});

test('a prior mount releasing its lock does not leave the new assessment in standby', async ({ context, page }, info) => {
  test.setTimeout(90000);
  await simulatedPlayback(context);
  await context.addInitScript(() => {
    const sittingKey = 'lp-mock-outbox:student-a:mock-session';
    const request = navigator.locks.request.bind(navigator.locks);
    let release, requested = false;
    const previousMount = new Promise(resolve => { release = resolve; });
    void request(sittingKey, () => previousMount);
    navigator.locks.request = (name, options, callback) => {
      if (name === sittingKey && !requested) {
        requested = true;
        // Model the previous mount finishing its cleanup after the new mount
        // requests ownership, through the browser's actual lock manager.
        setTimeout(() => release(), 1000);
      }
      return request(name, options, callback);
    };
  });
  await page.goto(`${fixture}?case=${encodeURIComponent(info.testId)}&device=1&count=43&strictMode=1`, { waitUntil: 'domcontentloaded' });
  await expect(question(page, 1)).toBeVisible({ timeout: 60000 });
  await expect(page.getByRole('heading', { name: 'Your test is open in another tab.' })).toHaveCount(0);
});

test('an unrelated passage recording can fail without blocking a starting-sound question', async ({ context, page }, info) => {
  await simulatedPlayback(context);
  await page.route(`**${MOCK_RUNTIME_INSTRUCTION_AUDIO.readPassage}`, route => route.fulfill({ status: 404 }));
  await page.goto(`${fixture}?case=${encodeURIComponent(info.testId)}&device=1&version=literacy-mock-v12&thinPool=1`);
  await expect(question(page, 1)).toBeVisible({ timeout: 60000 });
  const first = await page.evaluate(() => window.__literacyMock.deviceItem());
  expect(first.displayPassageDuringResponse).toBe(false);
  expect(first.requiredAudioPaths).not.toContain(MOCK_RUNTIME_INSTRUCTION_AUDIO.readPassage);
  await answerCurrent(page, 1);
  expect((await device(page)).run.mediaFailures).toHaveLength(0);
});

for (const status of [404, 503]) test(`a required asset returning ${status} preserves evidence and ${status === 404 ? 'offers an exact replacement' : 'resumes the same question'}`, async ({ context, page }, info) => {
  test.setTimeout(120000);
  await simulatedPlayback(context);
  const version = 'literacy-mock-v13';
  const bank = await loadLiteracyMockBank({ contentVersion: version });
  const plan = selectLiteracyMockPlan(bank, { sessionId: 'mock-session', studentId: 'student-a', itemCount: 15 });
  const first = bank.find(item => item.id === plan.itemIds[0]);
  const path = first.requiredAudioPaths.find(mediaPath => {
    const failure = [{ questionId: first.id, failedMediaPaths: [mediaPath] }];
    return mediaPath !== first.requiredAudioPaths[0] && bank.filter(item => item.requiredAudioPaths.includes(mediaPath)).length > 1
      && !replaceFailedLiteracyMockMedia(bank, plan, [], failure).unavailable;
  });
  expect(path).toBeTruthy();
  let blocked = true;
  let tries = 0;
  await page.route(`**${path}`, route => {
    if (!blocked) return route.continue();
    tries++;
    return route.fulfill({ status });
  });
  await page.goto(`${fixture}?case=${encodeURIComponent(info.testId)}&device=1&version=${version}&count=15&thinPool=1`);
  await expect.poll(() => tries).toBeGreaterThan(0);
  await expect(question(page, 1)).toHaveCount(0);
  const before = await device(page);
  expect(before.run.presentations).toHaveLength(0);
  if (status === 404) {
    const replace = page.getByRole('button', { name: 'Go to another question' });
    await expect(replace).toBeVisible({ timeout: 30000 });
    await replace.click();
    await expect.poll(async () => (await device(page)).run.mediaFailures.length).toBe(1);
    await expect(question(page, 1)).toBeVisible({ timeout: 60000 });
    const box = await device(page);
    expect(box.run.mediaFailures[0]).toMatchObject({ questionId: first.id, selected: null, responseStatus: 'media_failed', failedMediaPaths: [path] });
    expect(box.run.plan.itemIds[0]).not.toBe(first.id);
    expect(before.mediaItemIds).not.toContain(box.run.plan.itemIds[0]);
    expect(box.mediaItemIds).toContain(box.run.plan.itemIds[0]);
    expect(box.run.presentations.some(row => row.questionId === first.id)).toBe(false);
    expect(box.run.responses).toHaveLength(0);
  } else {
    await expect(page.getByRole('button', { name: 'Go to another question' })).toHaveCount(0);
    blocked = false;
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await expect(question(page, 1)).toBeVisible({ timeout: 60000 });
    const box = await device(page);
    expect(box.run.plan.itemIds[0]).toBe(first.id);
    expect(box.run.mediaFailures).toHaveLength(0);
    expect(box.run.responses).toHaveLength(0);
  }
});

const longItems = [
  ['mock.capacity.writing.events-detail-5', 'order'],
  ['mock.v4.comprehension.theme.lesson_mistake_fixed.l2.cause.v11', 'reading'],
  ['mock.relations.same-everyday', 'match'],
  ['mock.build.sun', 'build word'],
];

for (const [item, format] of longItems) test(`${format} keeps every answer control reachable at a compact tablet size`, async ({ context, page }) => {
  await simulatedPlayback(context);
  await page.setViewportSize({ width: 768, height: 560 });
  await page.goto(`${fixture}?mode=format&version=literacy-mock-v12&item=${item}`);
  await expect(question(page, 1)).toBeVisible({ timeout: 60000 });
  await page.addStyleTag({ content: '.literacy-mock .literacy-mock-choice { font-size: 25px !important; }' });
  const buttons = page.locator('.literacy-mock-choice, .literacy-mock-slot, .literacy-mock-choice-audio');
  const count = await buttons.count();
  expect(count).toBeGreaterThan(2);
  for (let i = 0; i < count; i++) {
    const control = buttons.nth(i);
    await control.focus();
    await expect(control).toBeFocused();
    await control.click({ trial: true });
    expect(await control.evaluate(element => element.scrollHeight)).toBeLessThanOrEqual(await control.evaluate(element => element.clientHeight + 2));
  }
  await expect(next(page)).toBeInViewport();
});
