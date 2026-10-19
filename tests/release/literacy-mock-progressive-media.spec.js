import { expect, test } from '@playwright/test';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { selectLiteracyMockPlan } from '../../src/utils/literacyMockPlanner.js';
import { MOCK_RUNTIME_INSTRUCTION_AUDIO } from '../../src/data/generated/literacyMockRuntimeAudio.generated.js';

test('a cold iPad opens question one while unused media is held, then retains its answer across a missing-media reload', async ({ page }, info) => {
  test.setTimeout(180000);
  const bank = await loadLiteracyMockBank({ includeUnavailable: true, contentVersion: 'literacy-mock-v10' });
  const plan = selectLiteracyMockPlan(bank.filter(item => item.mediaReady), { sessionId: 'mock-session', studentId: 'student-a', itemCount: 67 });
  const first = bank.find(item => item.id === plan.itemIds[0]);
  const allowed = new Set([...first.requiredAudioPaths, ...first.requiredImagePaths, MOCK_RUNTIME_INSTRUCTION_AUDIO.readPassage].map(path => path.split('#')[0]));
  let release; const held = new Promise(resolve => { release = resolve; });
  let blocked = 0;
  await page.route(url => /^\/(audio|images|media)\//.test(url.pathname), async route => {
    if (!allowed.has(new URL(route.request().url()).pathname)) { blocked++; await held; }
    try { await route.continue(); } catch { /* A reload cancels the previous request. */ }
  });
  // This is a delivery/retention check. Real recorded playback is checked separately.
  await page.addInitScript(() => {
    window.Audio = class extends EventTarget {
      play() { this.paused = false; this.onplaying?.(); this.timer = setTimeout(() => this.onended?.(), 5); return Promise.resolve(); }
      pause() { clearTimeout(this.timer); this.paused = true; } load() {}
    };
  });
  try {
    await page.goto(`/tests/fixtures/literacy-mock.html?case=${encodeURIComponent(info.testId)}&device=1&version=literacy-mock-v10`);
    await expect(page.getByRole('region', { name: 'Question 1', exact: true })).toBeVisible({ timeout: 60000 });
    await expect.poll(() => blocked).toBeGreaterThan(0);
    const initial = await page.evaluate(() => window.__literacyMock.device());
    expect(initial.mediaItemIds.length).toBeGreaterThan(300);
    const choices = await page.evaluate(id => window.__literacyMock.choiceOrder(id), first.id);
    await page.locator('.literacy-mock-choice').nth(choices.findIndex(choice => choice.id !== first.answer)).click();
    await expect(page.getByRole('button', { name: 'Next question', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Next question', exact: true }).click();
    await expect(page.getByText('Getting the next picture and sound…', { exact: true })).toBeVisible();
    const saved = await page.evaluate(() => window.__literacyMock.device());
    expect(saved.run.responses).toHaveLength(1);
    expect(saved.run.mediaFailures).toHaveLength(0);
    expect(saved.run.presentations).toHaveLength(1);
    const nextId = saved.run.plan.itemIds[1];
    await page.reload();
    await expect(page.getByRole('status')).toContainText(/Getting (your questions ready on this iPad|the next picture and sound)/, { timeout: 60000 });
    const resumed = await page.evaluate(() => window.__literacyMock.device());
    expect(resumed.run.responses).toEqual(saved.run.responses);
    expect(resumed.run.plan.itemIds[1]).toBe(nextId);
    expect(resumed.run.mediaFailures).toHaveLength(0);
    expect(resumed.run.presentations).toHaveLength(1);
    release();
    await expect(page.getByRole('region', { name: 'Question 2', exact: true })).toBeVisible({ timeout: 60000 });
    expect(await page.evaluate(() => window.__literacyMock.deviceItem().id)).toBe(nextId);
    expect(await page.evaluate(() => window.__literacyMock.device().run.responses.length)).toBe(1);
    await page.screenshot({ path: info.outputPath('resumed-exact-question.png') });
  } finally { release(); }
});

test('spoken-only choices are visible numbered answers without revealing their words', async ({ page }) => {
  await page.addInitScript(() => {
    window.Audio = class extends EventTarget {
      play() { this.paused = false; this.onplaying?.(); this.timer = setTimeout(() => this.onended?.(), 5); return Promise.resolve(); }
      pause() { clearTimeout(this.timer); this.paused = true; } load() {}
    };
  });
  await page.goto('/tests/fixtures/literacy-mock.html?mode=format&version=literacy-mock-v10&item=mock.v9.sounds.initial.week');
  const choices = page.locator('.is-spoken-choice');
  await expect(choices).toHaveCount(3);
  for (let index = 0; index < 3; index++) {
    await expect(choices.nth(index)).toContainText('Spoken answer');
    await expect(choices.nth(index).locator('.literacy-mock-answer-number')).toHaveText(String(index + 1));
    expect(await choices.nth(index).locator('.literacy-mock-answer-number').evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(32);
    await expect(choices.nth(index)).not.toContainText(/web|dog|fish/);
  }
  const current = await page.evaluate(() => window.__literacyMock.item());
  const ordered = await page.evaluate(id => window.__literacyMock.choiceOrder(id), current.id);
  await choices.nth(ordered.findIndex(choice => choice.id === current.answer)).click();
  await page.getByRole('button', { name: 'Next question', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Answer received');
  expect(await page.evaluate(() => window.__literacyMock.state().lastSubmission.selected)).toBe(current.answer);
});

test('an autoplay-blocked Safari prompt stays below the answer area and recovers on a speaker tap', async ({ page }) => {
  await page.addInitScript(() => {
    let first = true;
    window.Audio = class extends EventTarget {
      play() {
        if (first) { first = false; return Promise.reject(new DOMException('Gesture required', 'NotAllowedError')); }
        this.paused = false; this.onplaying?.(); this.timer = setTimeout(() => this.onended?.(), 5); return Promise.resolve();
      }
      pause() { clearTimeout(this.timer); this.paused = true; } load() {}
    };
  });
  await page.goto('/tests/fixtures/literacy-mock.html?mode=format&version=literacy-mock-v10&item=mock.v9.sounds.initial.week');
  const instruction = page.getByRole('status');
  await expect(instruction).toHaveText('Tap the speaker to listen.');
  await expect(page.locator('.literacy-mock-access').getByRole('status')).toBeVisible();
  const prompt = await instruction.boundingBox(), choices = await page.getByRole('group', { name: 'Answer choices', exact: true }).boundingBox();
  expect(prompt.y).toBeGreaterThanOrEqual(choices.y + choices.height - 1);
  await page.getByRole('button', { name: 'Listen to the question', exact: true }).click();
  await expect(instruction).toHaveCount(0);
});
