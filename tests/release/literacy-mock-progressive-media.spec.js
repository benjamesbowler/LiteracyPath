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
