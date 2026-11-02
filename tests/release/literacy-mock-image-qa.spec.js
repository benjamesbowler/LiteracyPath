import { expect, test } from '@playwright/test';
import { loadLiteracyMockRuntimeBank } from '../../src/data/literacyMockRuntimeBank.js';
import { withRepairedImageVersion } from '../../src/utils/repairedImageVersion.js';

const historicalItemId = 'lp3.initial_sounds.l1.A.a.v1';
const historicalBank = await loadLiteracyMockRuntimeBank({ contentVersion: 'literacy-mock-v4' });
const blockedPath = historicalBank.find(item => item.id === historicalItemId).requiredImagePaths[0];

for (const sourceSuffix of ['', '?v=retained-cache#historical-image']) {
test(`a shared image quarantine invalidates a resumed historical question${sourceSuffix ? ' with query and fragment' : ''} without an answer or progress`, async ({ page }, info) => {
  test.setTimeout(120000);
  // Reproduce a newly reported quarantine without depending on whether the
  // production replacement has since cleared its earlier rejection.
  await page.route('**/src/data/assessmentImageStyleBlocklist.js*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: `${await response.text()}\nassessmentImageStyleBlockedPaths.add(${JSON.stringify(blockedPath)});\n` });
  });
  if (sourceSuffix) {
    // A retained question may decorate its canonical image URL for caching.
    // Keep the authored source and its required-media list aligned, as the
    // normal item enrichment does, so the server receives a valid failure.
    await page.route('**/tests/fixtures/literacyMockHarness.jsx*', async route => {
      const response = await route.fetch();
      const body = await response.text();
      const bankLoad = /const bank = await loadLiteracyMockBank\([\s\S]*?\);/;
      expect(body).toMatch(bankLoad);
      const override = `\nfor (const item of bank) if (item.id === ${JSON.stringify(historicalItemId)}) { item.image = ${JSON.stringify(blockedPath + sourceSuffix)}; item.requiredImagePaths = item.requiredImagePaths.map(path => path === ${JSON.stringify(blockedPath)} ? item.image : path); }\n`;
      await route.fulfill({ response, body: body.replace(bankLoad, match => match + override) });
    });
  }
  // Recorded sound quality is checked separately; this test exercises image
  // rejection through the real renderer, session owner and mutation receipts.
  await page.addInitScript(() => {
    window.Audio = class extends EventTarget {
      play() {
        this.onplaying?.(new Event('playing'));
        this.timer = setTimeout(() => {
          this.onended?.(new Event('ended'));
          this.dispatchEvent(new Event('ended'));
        }, 5);
        return Promise.resolve();
      }
      pause() { clearTimeout(this.timer); }
      load() {}
    };
  });
  await page.goto(`/tests/fixtures/literacy-mock.html?case=${encodeURIComponent(info.testId)}&version=literacy-mock-v4&item=${historicalItemId}`);
  await expect(page.getByText('A picture or recording did not load. This question will not count.')).toBeVisible({ timeout: 60000 });
  const region = page.getByRole('region', { name: 'Question 1', exact: true });
  await expect(region).toBeVisible();
  await expect(region.locator(`img[src="${blockedPath + sourceSuffix}"]`)).toHaveCount(0);
  const forward = page.getByRole('button', { name: 'Next question', exact: true });
  await page.locator('.literacy-mock-choice').first().click();
  await expect(forward).toBeDisabled();
  const before = await page.evaluate(() => window.__literacyMock.state());
  expect(before.run.responses).toHaveLength(0);
  expect(before.run.mediaFailures).toHaveLength(0);
  expect(before.run.plan.itemIds[0]).toBe(historicalItemId);

  await page.getByRole('button', { name: 'Go to another question', exact: true }).click();
  await expect.poll(async () => (await page.evaluate(() => window.__literacyMock.state())).run.mediaFailures.length).toBe(1);
  await expect.poll(async () => (await page.evaluate(() => window.__literacyMock.item())).id).not.toBe(historicalItemId);
  await expect(region).toBeVisible();
  const after = await page.evaluate(() => window.__literacyMock.state());
  expect(after.run.responses).toHaveLength(0);
  expect(after.run.mediaFailures[0]).toMatchObject({
    questionId: historicalItemId, selected: null, isCorrect: null,
    responseStatus: 'media_failed', evidenceType: 'unscored',
  });
  expect(after.run.mediaFailures[0].failedMediaPaths).toContain(blockedPath + sourceSuffix);
  expect(after.calls.some(call => call.args?.p_response?.responseStatus === 'answered')).toBe(false);
  const planImages = await page.evaluate(() => window.__literacyMock.planItems().flatMap(item => item.requiredImagePaths));
  expect(planImages).not.toContain(blockedPath + sourceSuffix);
  await expect(region.locator('img[data-assessment-media-kind="evidence"]').first()).toBeVisible();

  await page.reload();
  await expect(region).toBeVisible({ timeout: 60000 });
  const resumed = await page.evaluate(() => window.__literacyMock.state());
  expect(resumed.run.responses).toHaveLength(0);
  expect(resumed.run.mediaFailures).toHaveLength(1);
  expect(resumed.run.plan.itemIds[0]).not.toBe(historicalItemId);
});
}

test('an unavailable repaired revision never opens an offline question from its stale canonical cache or records progress', async ({ page }, info) => {
  test.setTimeout(90000);
  const path = '/media/initial-sounds/images/t/table.webp';
  const transport = withRepairedImageVersion(path);
  expect(transport).not.toBe(path);
  await page.addInitScript(({ path }) => {
    window.__oldPictureSeeded = caches.open('lp-mock-public-media-v1').then(cache =>
      cache.put(path, new Response(new Uint8Array([9, 8, 7]), { headers: { 'content-type': 'image/webp' } })));
  }, { path });
  await page.route('**/tests/fixtures/literacyMockHarness.jsx*', async route => {
    const response = await route.fetch();
    const body = await response.text();
    const bankLoad = /const bank = await loadLiteracyMockBank\([\s\S]*?\);/;
    expect(body).toMatch(bankLoad);
    const override = `\nawait window.__oldPictureSeeded;\nfor (const item of bank) if (item.id === ${JSON.stringify(historicalItemId)}) { item.image = ${JSON.stringify(path)}; item.requiredImagePaths = [${JSON.stringify(path)}]; }\n`;
    await route.fulfill({ response, body: body.replace(bankLoad, match => match + override) });
  });
  let revisedRequests = 0;
  await page.route(`**${path}?*`, async route => {
    revisedRequests++;
    await route.fulfill({ status: 503, body: 'Current reviewed image unavailable' });
  });
  await page.goto(`/tests/fixtures/literacy-mock.html?case=${encodeURIComponent(info.testId)}&version=literacy-mock-v4&item=${historicalItemId}&device=1&thinPool=1`);
  await expect(page.getByText('The pictures or sounds are not ready yet. Your work is safe. Keep this iPad open and ask your teacher.')).toBeVisible({ timeout: 60000 });
  expect(revisedRequests).toBeGreaterThan(0);
  await expect(page.getByRole('region', { name: 'Question 1', exact: true })).toHaveCount(0);
  await expect(page.locator('img[data-assessment-media-kind="evidence"]')).toHaveCount(0);
  const state = await page.evaluate(() => window.__literacyMock.state());
  expect(state.run.responses).toHaveLength(0);
  expect(state.run.mediaFailures).toHaveLength(0);
  expect(state.calls.some(call => call.args?.p_response?.responseStatus === 'answered')).toBe(false);
  expect(state.run.plan.itemIds[0]).toBe(historicalItemId);
});
