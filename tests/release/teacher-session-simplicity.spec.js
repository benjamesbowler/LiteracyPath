import { test, expect } from '@playwright/test';
test.describe.configure({ timeout: 60000 });
const fixture = '/preview/teacher-session-simplicity.html';
const calls = page => page.evaluate(() => window.__teacherSessionCalls);
async function selectBook(page) {
  await page.locator('.reading-session-book-grid > button').first().click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
}

test('read-together handoff preserves explicit selection and never starts a focus assignment', async ({ page }) => {
  await page.goto(`${fixture}?selected=student-1`);
  await page.getByRole('button', { name: 'Read together', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Start student session', exact: true })).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: 'Start reading together', exact: true })).toBeVisible();
  await selectBook(page);
  await expect(page.getByRole('checkbox', { name: /Ben/ })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: /Amina/ })).not.toBeChecked();
  await page.getByRole('button', { name: 'Start reading', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Reading together controls' })).toBeVisible();
  expect((await calls(page)).filter(call => /start_/.test(call.name))).toEqual([{ name: 'teacher_start_reading_session', args: expect.objectContaining({ p_class_id: 'class-preview', p_student_ids: ['student-1'] }) }]);
});

test('whole-class read handoff retains all seven students and requires an explicit smaller group', async ({ page }) => {
  await page.goto(fixture);
  await page.getByRole('button', { name: 'Read together', exact: true }).click();
  await selectBook(page);
  await expect(page.getByText(/You selected 7 students/)).toBeVisible();
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(7);
  await expect(page.getByRole('button', { name: 'Start reading', exact: true })).toBeDisabled();
  await page.getByRole('checkbox', { name: /Gia/ }).uncheck();
  await page.getByRole('button', { name: 'Start reading', exact: true }).click();
  expect((await calls(page)).find(call => call.name === 'teacher_start_reading_session').args.p_student_ids).toHaveLength(6);
});

test('failed reading start retains book and group for recovery', async ({ page }) => {
  await page.goto(`${fixture}?mode=reading&selected=student-0&reject=1`);
  await selectBook(page);
  await page.getByRole('button', { name: 'Start reading', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Amina');
  await expect(page.getByRole('checkbox', { name: /Amina/ })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Start reading', exact: true })).toBeEnabled();
});

test('reading end waits for unsaved marks, reload retains exact event, and recovery confirms saved completion', async ({ page }) => {
  await page.goto(`${fixture}?mode=reading-live&offline=1`);
  await page.getByRole('radio', { name: /Amina/ }).click();
  await page.getByRole('button', { name: 'Record reading mark' }).click();
  await expect(page.locator('.reading-session-unsent')).toBeVisible();
  const first = (await calls(page)).find(call => call.name === 'teacher_save_reading_marks').args.p_client_event_id;
  await page.getByRole('button', { name: 'End session', exact: true }).click();
  await page.getByRole('dialog', { name: 'End reading session' }).getByRole('button', { name: 'End session', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('still waiting to save');
  expect((await calls(page)).some(call => call.name === 'teacher_end_reading_session')).toBe(false);
  await page.reload();
  await expect.poll(async () => (await calls(page)).find(call => call.name === 'teacher_save_reading_marks')?.args.p_client_event_id).toBe(first);
  await page.getByRole('button', { name: 'Restore connection' }).click();
  await expect(page.getByText('Changes waiting to save', { exact: false })).toHaveCount(0);
  await page.getByRole('button', { name: 'End session', exact: true }).click();
  await page.getByRole('dialog', { name: 'End reading session' }).getByRole('button', { name: 'End session', exact: true }).click();
  await expect(page.getByRole('button', { name: 'View saved reading results' })).toBeVisible();
});


test('mock phases preserve protocol controls, original results and reload retry identity', async ({ page }) => {
  await page.goto('/tests/fixtures/literacy-mock.html?mode=teacher&case=session-simplicity');
  await expect(page.getByRole('button', { name: 'Pause assessment', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Live', exact: true }).click();
  await expect(page.locator('.literacy-mock-setup')).toHaveCount(0);
  await page.getByRole('button', { name: 'View Alex’s report', exact: true }).click();
  await expect(page.locator('[data-session-protocol="mock"]')).toHaveAttribute('data-session-phase', 'results');
  await expect(page.getByRole('combobox', { name: 'Open a session', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pause assessment', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Live', exact: true }).click();
  await page.evaluate(() => window.__literacyMock.setFault('receipt-lost'));
  await page.getByRole('button', { name: 'Add 5 minutes', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry the same action', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Retry the same action', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause assessment', exact: true })).toBeEnabled();
  const state = await page.evaluate(() => window.__literacyMock.state());
  const writes = state.calls.filter(call => call.args.p_action === 'add_time');
  expect(writes).toHaveLength(2); expect(writes[0].args).toEqual(writes[1].args);
});


test('reading recovery failure preserves the dialog and prevents overlapping actions', async ({ page }) => {
  await page.goto(`${fixture}?mode=recovery`);
  const dialog = page.getByRole('dialog', { name: 'Reading session still open' });
  await dialog.getByRole('button', { name: 'Continue reading', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'End it', exact: true })).toBeDisabled();
  await expect(dialog.getByRole('button', { name: 'Opening reading…', exact: true })).toBeDisabled();
  await page.evaluate(() => window.__rejectRecovery());
  await expect(dialog.getByRole('alert')).toContainText('Your session and pending changes are still here');
  await expect(dialog.getByRole('button', { name: 'Continue reading', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => window.__resumeCalls)).toBe(1);
});

test('explicit expired-session resume replays marks and ended-session export remains labelled unsaved', async ({ page }) => {
  await page.goto(`${fixture}?mode=reading-live&expired=1`);
  await page.getByRole('radio', { name: /Amina/ }).click();
  await page.getByRole('button', { name: 'Record reading mark' }).click();
  await page.getByRole('button', { name: 'Resume reading to save' }).click();
  await expect(page.locator('.reading-session-unsent')).toHaveCount(0);
  const attempts = (await calls(page)).filter(call => call.name === 'teacher_save_reading_marks');
  expect(attempts.length).toBeGreaterThanOrEqual(2);
  expect(new Set(attempts.map(call => call.args.p_client_event_id)).size).toBe(1);
  await page.goto(`${fixture}?mode=reading-live&expired=1&ended=1`);
  await page.getByRole('radio', { name: /Amina/ }).click();
  await page.getByRole('button', { name: 'Record reading mark' }).click();
  await page.getByRole('button', { name: 'Resume reading to save' }).click();
  await expect(page.getByText(/they have not been marked as received/)).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download unsaved changes' }).click();
  expect((await download).suggestedFilename()).toBe('unsaved-reading-changes.json');
  await expect(page.locator('.reading-session-unsent')).toBeVisible();
});
