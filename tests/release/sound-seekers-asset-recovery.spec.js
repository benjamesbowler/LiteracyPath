import { test, expect } from '@playwright/test';

const HERO = /\/assets\/characters\/bouncy\.glb\?no-inline$/;
const FIXTURE = '/tests/fixtures/sound-seekers-rounded-world.html?low=1';

test('a temporary model failure recovers the canonical world without resetting play', async ({ page }) => {
  let requests = 0;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(HERO, route => ++requests === 1
    ? route.fulfill({ status: 503, body: 'Temporary asset delivery failure' })
    : route.continue());
  await page.goto(FIXTURE);
  await expect(page.locator('#world')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#world')).toHaveAttribute('data-failure', '');
  expect(requests).toBe(2);
  await expect(page.locator('#world > canvas')).toHaveCount(1);
  await page.getByRole('button', { name: 'Explore', exact: true }).click();
  const before = Number(await page.locator('#world').getAttribute('data-z'));
  await page.keyboard.down('ArrowUp');
  await expect.poll(async () => Math.abs(Number(await page.locator('#world').getAttribute('data-z')) - before)).toBeGreaterThan(.25);
  await page.keyboard.up('ArrowUp');
  await expect(page.locator('#world')).toHaveAttribute('data-completed-parts', '0');
  expect(errors).toEqual([]);
});

test('a missing approved hero fails once without manufacturing a replacement', async ({ page }) => {
  let requests = 0;
  await page.route(HERO, route => {
    requests++;
    return route.fulfill({ status: 404, body: 'Missing approved model' });
  });
  await page.goto(FIXTURE);
  await expect(page.locator('#world')).toHaveAttribute('data-failure', /could not load/i);
  await expect(page.locator('#world > canvas')).toHaveCount(0);
  expect(requests).toBe(1);
});

test('changing place during a transient failure abandons the old scene and retry', async ({ page }) => {
  let requests = 0;
  let failedFirst;
  const firstFailed = new Promise(resolve => { failedFirst = resolve; });
  await page.route(HERO, async route => {
    requests++;
    if (requests === 1) {
      await route.fulfill({ status: 503, body: 'Temporary asset delivery failure' });
      failedFirst();
    } else await route.continue();
  });
  await page.goto(FIXTURE);
  await firstFailed;
  await page.getByLabel('Place', { exact: true }).selectOption('dino-14');
  await expect(page.locator('#world')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#world > canvas')).toHaveCount(1);
  await expect(page.locator('#world > canvas')).toHaveAttribute('data-stage-id', 'dino-14');
  await expect(page.locator('#world')).toHaveAttribute('data-failure', '');
  // At most one bounded retry plus the replacement scene's own request.
  // The unit test controls the exact abort/backoff race; this verifies the
  // rendered lifecycle when a real native place selection interrupts loading.
  expect(requests).toBeGreaterThanOrEqual(2);
  expect(requests).toBeLessThanOrEqual(3);
});
