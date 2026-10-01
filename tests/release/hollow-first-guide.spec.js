import { expect, test } from '@playwright/test';

test('a visitor without a Guide sees its picture and can choose the first Guide free', async ({ page }) => {
  await page.goto('/preview/child-surfaces.html?surface=my-hollow');
  await expect(page.getByRole('button', { name: 'My Guide', exact: true })).toBeVisible();
  // The regular fixture has a saved Guide. Exercise the actual empty-profile
  // hydration path without altering the fixture or the production policy.
  await page.evaluate(() => {
    localStorage.removeItem('lp-student-profile:child-surface-preview');
    dispatchEvent(new CustomEvent('lp-progress-hydrated', { detail: { studentId: 'child-surface-preview' } }));
  });
  const door = page.getByRole('button', { name: 'My Guide', exact: true });
  await expect.poll(() => door.locator('img').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  await door.click();
  const choices = page.getByRole('dialog', { name: 'Choose a Little Literacy Guide' });
  await expect(choices).toBeVisible();
  await expect(choices.getByText('Your first Guide is free.', { exact: true })).toBeVisible();
  const guides = choices.locator('div > button');
  await expect(guides).toHaveCount(6);
  for (const guide of await guides.all()) await expect(guide).toBeEnabled();
  await choices.getByRole('button', { name: 'Chips Free', exact: true }).click();
  await expect(choices).toHaveCount(0);
  await expect(page.locator('.hollow-pal-stage h2')).toHaveText('Chips');
  const profile = await page.evaluate(() => JSON.parse(localStorage.getItem('lp-student-profile:child-surface-preview')));
  expect(profile.companionId).toBe('chips');
  expect(profile.guideStarsSpent || 0).toBe(0);
  await page.getByRole('button', { name: 'Change Guide', exact: true }).click();
  await expect(choices.getByText('Changing costs 10 stars. You have 0.', { exact: true })).toBeVisible();
  await expect(choices.getByRole('button', { name: 'Fluff ★ 10', exact: true })).toBeDisabled();
  await expect(choices.getByRole('button', { name: 'Chips Your Guide', exact: true })).toBeEnabled();
});
