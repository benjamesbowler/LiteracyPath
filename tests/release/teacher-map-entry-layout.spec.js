import { test, expect } from '@playwright/test';

for (const width of [1600, 1366, 1024, 768, 390, 320]) {
  test(`Teach primary actions line up across each card row at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/preview/teacher-a11y.html?surface=resources&context=1');
    if (width < 700) await expect.poll(() => page.locator('.lg-sidebar').evaluate(element => Math.round(element.getBoundingClientRect().width))).toBe(52);
    const cards = page.locator('.teacher-resource-card');
    await expect(cards).toHaveCount(4);
    await expect(page.getByRole('button', { name: 'Browse books', exact: true })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const rows = await cards.evaluateAll(elements => elements.map(card => {
      const rect = card.getBoundingClientRect();
      const button = card.querySelector('.teacher-resource-action').getBoundingClientRect();
      return { row: Math.round(rect.top), top: button.top, bottom: button.bottom, height: button.height };
    }));
    for (const row of new Set(rows.map(item => item.row))) {
      const buttons = rows.filter(item => item.row === row);
      expect(Math.max(...buttons.map(item => item.top)) - Math.min(...buttons.map(item => item.top))).toBeLessThanOrEqual(1);
      expect(Math.max(...buttons.map(item => item.bottom)) - Math.min(...buttons.map(item => item.bottom))).toBeLessThanOrEqual(1);
      for (const button of buttons) expect(button.height).toBeGreaterThanOrEqual(44);
    }
    await expect(page.getByRole('button', { name: 'Read together', exact: true })).toBeVisible();
    const books = page.locator('.teacher-resource-book');
    await expect(books).toHaveCount(4);
    const bookRows = await books.evaluateAll(elements => elements.map(card => ({
      row: Math.round(card.getBoundingClientRect().top),
      bottom: card.querySelector('button').getBoundingClientRect().bottom
    })));
    for (const row of new Set(bookRows.map(item => item.row))) {
      const buttons = bookRows.filter(item => item.row === row);
      expect(Math.max(...buttons.map(item => item.bottom)) - Math.min(...buttons.map(item => item.bottom))).toBeLessThanOrEqual(1);
    }
    await expect(page.getByText('Help with teaching tools', { exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
    await page.screenshot({ path: testInfo.outputPath(`teach-${width}.png`), fullPage: true });
  });
}

test('an empty selected group keeps setup open without broadening to the whole class', async ({ page }) => {
  await page.goto('/preview/teacher-session-simplicity.html?selected=student-1');
  await page.getByRole('button', { name: 'Assess', exact: true }).click();
  await page.getByRole('checkbox', { name: /Ben/ }).uncheck();
  await page.getByRole('button', { name: /^Adaptive Literacy Test/ }).click();
  await expect(page.getByRole('dialog', { name: 'Start student session', exact: true })).toBeVisible();
  await expect(page.getByText('Choose at least one student.', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.__literacyTestLaunch)).toBeUndefined();
  expect(await page.evaluate(() => window.__teacherSessionCalls)).toEqual([]);
});

for (const selected of ['', 'student-1', 'student-1,student-3']) {
  test(`session launcher opens the full test with exact audience ${selected || 'whole class'}`, async ({ page }, testInfo) => {
    await page.goto(`/preview/teacher-session-simplicity.html?selected=${selected}`);
    await expect(page.getByRole('button', { name: 'Practise', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: /^Adaptive Literacy Test/ })).toHaveCount(0);
    if (!selected) await page.screenshot({ path: testInfo.outputPath('practise-launcher.png'), fullPage: true });
    await page.getByRole('button', { name: 'Assess', exact: true }).click();
    await expect(page.getByRole('button', { name: /^Adaptive Literacy Test/ })).toBeVisible();
    if (!selected) await page.screenshot({ path: testInfo.outputPath('assess-launcher.png'), fullPage: true });
    await page.getByRole('button', { name: 'Practise', exact: true }).click();
    await expect(page.getByRole('button', { name: /^Adaptive Literacy Test/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'Assess', exact: true }).click();
    await page.getByRole('button', { name: /^Adaptive Literacy Test/ }).click();
    await expect(page.getByRole('dialog', { name: 'Start student session', exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Adaptive Literacy Test', exact: true })).toBeVisible();
    const context = await page.evaluate(() => window.__literacyTestLaunch);
    expect(context.classId).toBe('class-preview');
    expect(context.purpose).toBe('assess');
    expect(context.administration).toBe('student_independent');
    expect(context.studentIds).toEqual(selected ? selected.split(',') : []);
    expect(context.audience).toBe(selected ? 'selected_students' : 'whole_class');
    await expect(page.locator('.literacy-mock-setup strong').filter({ hasText: '43 questions' })).toBeVisible();
    if (selected) {
      await expect(page.getByRole('checkbox', { name: 'Ben', exact: true })).toBeChecked();
      await expect(page.getByRole('checkbox', { name: 'Amina', exact: true })).not.toBeChecked();
      if (selected.includes('student-3')) await expect(page.getByRole('checkbox', { name: 'Dev', exact: true })).toBeChecked();
    }
    const writes = await page.evaluate(() => window.__teacherSessionCalls.filter(call => /start_|prepare_/.test(call.name)));
    expect(writes).toEqual([]);
  });
}
