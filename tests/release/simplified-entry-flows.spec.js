import { expect, test } from '@playwright/test';

for (const sendHydrationEvent of [true, false]) {
  test(`an open first Guide picker preserves a late saved choice with hydration event ${sendHydrationEvent}`, async ({ page }) => {
    await page.goto('/preview/student-home-preview.html?scenario=profile-pending');
    await page.getByText('Choose something else', { exact: true }).click();
    await page.getByRole('button', { name: 'Choose your Guide', exact: true }).click();
    const picker = page.getByRole('dialog', { name: 'Choose your Little Literacy Guide' });
    await expect(picker).toBeVisible();
    await page.evaluate(notify => {
      localStorage.setItem('lp-student-profile:student-home-preview', JSON.stringify({ companionId: 'chips', companionChosenAt: '2026-09-01T00:00:00Z' }));
      if (notify) window.dispatchEvent(new CustomEvent('lp-progress-hydrated', { detail: { studentId: 'student-home-preview' } }));
    }, sendHydrationEvent);
    if (!sendHydrationEvent) await picker.getByRole('button', { name: /^Fluff Bob and Nan$/ }).click();
    await expect(picker).toHaveCount(0);
    await expect(page.getByLabel('Chips, your Little Literacy Guide')).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('lp-student-profile:student-home-preview')).companionId)).toBe('chips');
  });
}

test('mixed-cycle live sessions name each assignment instead of claiming the first cycle for everyone', async ({ page }) => {
  await page.goto('/preview/student-session-controls.html?active=1&mixedCycles=1');
  const bar = page.getByRole('complementary', { name: 'Active student session' });
  await expect(bar.locator('.student-session-bar-summary')).toContainText('Individual cycles');
  await bar.getByText('Students', { exact: true }).click();
  const rows = bar.locator('li');
  for (let index = 0; index < 3; index += 1) await expect(rows.nth(index)).toContainText(`Cycle ${index + 3}`);
});

test('suggested Guide never overwrites a late saved profile; optional choice keeps keyboard focus', async ({ page }) => {
  await page.goto('/preview/student-home-preview.html?scenario=profile-pending');
  const profileKey = 'lp-student-profile:student-home-preview';
  const play = page.locator('[data-child-primary]');
  await expect(play).toContainText('Play with Fluff');
  await page.getByText('Choose something else', { exact: true }).click();
  const trigger = page.getByRole('button', { name: 'Choose your Guide', exact: true });
  await trigger.click();
  const picker = page.getByRole('dialog', { name: 'Choose your Little Literacy Guide' });
  await expect(picker).toBeVisible();
  await expect(picker.getByRole('button', { name: 'Back to Home' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(await picker.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(picker).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.waitForTimeout(3800);
  await play.click();
  expect(await page.evaluate(key => localStorage.getItem(key), profileKey)).toBeNull();
  await page.evaluate(key => {
    localStorage.setItem(key, JSON.stringify({ companionId: 'chips', companionChosenAt: '2026-09-01T00:00:00Z' }));
    window.dispatchEvent(new CustomEvent('lp-progress-hydrated', { detail: { studentId: 'student-home-preview' } }));
  }, profileKey);
  await expect(page.getByLabel('Chips, your Little Literacy Guide')).toBeVisible();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).companionId, profileKey)).toBe('chips');
});

test('unreadable daily progress stays unknown inside disclosed browsing', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('lp-daily-mission:student-home-preview', '{broken'));
  await page.goto('/preview/student-home-preview.html');
  await page.getByText('Choose something else', { exact: true }).click();
  await expect(page.locator('.kg-home-browse-progress')).toHaveText('Today’s progress could not open');
  await expect(page.locator('[data-child-primary]')).toBeEnabled();
});

test('prepared class link resolves the device-aware class but still requires picture authentication', async ({ page }) => {
  await page.goto('/preview/student-login-preview.html?scenario=prepared-valid#class=ABC123');
  await expect(page.getByRole('heading', { name: 'Who are you?' })).toBeVisible();
  expect(new URL(page.url()).hash).toBe('');
  const calls = await page.evaluate(() => window.__classEntryRequests);
  expect(calls).toHaveLength(1);
  expect(calls[0].name).toBe('student_class_by_code');
  expect(calls[0].args).toEqual({ p_code: 'ABC123', p_device_id: expect.any(String) });
  await page.getByRole('button', { name: /Robin/ }).click();
  await expect(page.getByRole('heading', { name: 'Tap your pictures' })).toBeVisible();
  expect(await page.locator('html').getAttribute('data-student-session')).toBeNull();
});

test('expired prepared link preserves the manual code recovery and creates no student session', async ({ page }) => {
  await page.goto('/preview/student-login-preview.html?scenario=code-expired#class=ABC123');
  await expect(page.locator('[data-login-recovery="code-expired"]')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Class code' })).toHaveValue('ABC123');
  expect(await page.locator('html').getAttribute('data-student-session')).toBeNull();
  expect(await page.evaluate(() => window.__classEntryRequests.length)).toBe(1);
});

for (const initial of ['cycle-6', '']) {
  test(`per-child Cycle practice validates every effective assignment with context '${initial || 'unknown'}'`, async ({ page }) => {
    await page.goto(`/preview/student-session-controls.html?target=cycle_practice&cycle=${initial}`);
    await page.getByRole('button', { name: 'Set a different cycle for each student' }).click();
    const start = page.getByRole('button', { name: 'Start for whole class' });
    const selectors = page.locator('.student-session-cycle-list select');
    await expect(selectors).toHaveCount(3);
    if (!initial) await expect(start).toBeDisabled();
    for (let index = 0; index < 3; index += 1) {
      if (index === 0 || !initial) await selectors.nth(index).selectOption(`cycle-${index + 4}`);
    }
    await expect(start).toBeEnabled();
    await start.click();
    const payload = await page.evaluate(() => window.__studentSessionPreviewLastRpc.args);
    expect(await page.evaluate(() => window.__studentSessionPreviewLastRpc.name)).toBe('teacher_start_cycle_practice_session');
    expect(Object.values(payload.p_assignments).map(row => row.cycle_id).sort()).toEqual(initial ? ['cycle-4', 'cycle-6', 'cycle-6'] : ['cycle-4', 'cycle-5', 'cycle-6']);
  });
}

for (const viewport of [{ width: 320, height: 568 }, { width: 568, height: 320 }]) {
  test(`Home keeps Play and its optional picture menu above navigation at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/preview/student-home-preview.html');
    const menu = page.getByText('Choose something else', { exact: true });
    const pane = await page.locator('.kg-main').boundingBox();
    for (const control of [page.locator('[data-child-primary]'), menu]) {
      const box = await control.boundingBox();
      expect(box.y).toBeGreaterThanOrEqual(pane.y);
      expect(box.y + box.height).toBeLessThanOrEqual(pane.y + pane.height + 1);
    }
    await menu.click();
    const doors = page.locator('.kg-home-door');
    await expect(doors).toHaveCount(6);
    for (const door of await doors.all()) {
      const box = await door.boundingBox();
      expect(box.y + box.height).toBeLessThanOrEqual(pane.y + pane.height + 1);
    }
  });
}
