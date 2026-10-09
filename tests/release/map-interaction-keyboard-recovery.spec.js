import { expect, test } from '@playwright/test';
test('keyboard placement works immediately after a cancelled touch drag', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Native touch cancellation uses Chromium CDP.');
  await page.goto('/tests/fixtures/literacy-reference.html?item=mock.build.cat');
  const tile = page.getByRole('button', { name: 'Pick c', exact: true });
  const source = await tile.boundingBox(), cdp = await page.context().newCDPSession(page);
  const x = source.x + source.width / 2, y = source.y + source.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 20, y: y + 20 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await expect(page.getByRole('button', { name: 'Remove from space 1', exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => window.__referenceAnswer)).toBeUndefined();
  for (const [i, letter] of [...'cat'].entries()) {
    await page.getByRole('button', { name: 'Pick ' + letter, exact: true }).focus(); await page.keyboard.press('Space');
    await page.getByRole('button', { name: 'Place in space ' + (i + 1), exact: true }).focus(); await page.keyboard.press('Space');
  }
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(page.getByRole('status').last()).toContainText('Correct');
});
