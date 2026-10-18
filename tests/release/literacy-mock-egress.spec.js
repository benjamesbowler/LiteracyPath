import { test, expect } from '@playwright/test';

test.describe.configure({ timeout: 60000 });

const reportReads = page => page.evaluate(() => window.__literacyMock.state().calls
  .filter(call => call.name === 'teacher_get_literacy_mock_report').length);

async function openReport(page, { completed = false, pending = 0 } = {}) {
  const caseId = test.info().testId;
  await page.clock.install();
  await page.addInitScript(() => {
    let hidden = false;
    Object.defineProperty(document, 'hidden', { get: () => hidden, configurable: true });
    window.__setReportHidden = value => {
      hidden = value;
      document.dispatchEvent(new Event('visibilitychange'));
    };
  });
  await page.goto(`/tests/fixtures/literacy-mock.html?case=${encodeURIComponent(caseId)}&mode=teacher&session=mock-session&phase=results`);
  await expect(page.getByText('Showing server-confirmed answers.', { exact: false })).toBeVisible();
  if (completed) {
    await page.evaluate(pending => window.__literacyMock.finishCollection(pending), pending);
    await page.getByRole('button', { name: 'Refresh progress', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Finished · Last checked' })).toBeVisible();
  }
}

test('a completed, collected report stops automatic downloads and still allows manual refresh', async ({ page }) => {
  await openReport(page, { completed: true });
  const before = await reportReads(page);
  await page.clock.runFor(16000);
  expect(await reportReads(page)).toBe(before);
  await page.getByRole('button', { name: 'Refresh progress', exact: true }).click();
  await expect.poll(() => reportReads(page)).toBe(before + 1);
});

test('a hidden report stops downloading and refreshes when the teacher returns', async ({ page }) => {
  await openReport(page);
  await page.evaluate(() => window.__setReportHidden(true));
  const before = await reportReads(page);
  await page.clock.runFor(16000);
  expect(await reportReads(page)).toBe(before);
  await page.evaluate(() => window.__setReportHidden(false));
  await expect.poll(() => reportReads(page)).toBe(before + 1);
});

test('an unfinished session keeps refreshing in the results view', async ({ page }) => {
  await openReport(page);
  const before = await reportReads(page);
  await page.clock.runFor(5100);
  await expect.poll(() => reportReads(page)).toBeGreaterThan(before);
});

test('an explicit refresh still confirms evidence if the tab becomes hidden', async ({ page }) => {
  await openReport(page);
  const before = await reportReads(page);
  await page.evaluate(() => window.__setReportHidden(true));
  await page.getByRole('button', { name: 'Refresh progress', exact: true }).click();
  await expect.poll(() => reportReads(page)).toBe(before + 1);
  await page.clock.runFor(16000);
  expect(await reportReads(page)).toBe(before + 1);
});

test('a completed session with unconfirmed iPad delivery keeps refreshing', async ({ page }) => {
  await openReport(page, { completed: true, pending: 1 });
  const before = await reportReads(page);
  await page.clock.runFor(5100);
  await expect.poll(() => reportReads(page)).toBeGreaterThan(before);
});

test('an unknown device collection count does not freeze the report', async ({ page }) => {
  await openReport(page, { completed: true, pending: null });
  const before = await reportReads(page);
  await page.clock.runFor(5100);
  await expect.poll(() => reportReads(page)).toBeGreaterThan(before);
});
