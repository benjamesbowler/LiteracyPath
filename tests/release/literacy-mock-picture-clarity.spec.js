import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { createHash } from 'node:crypto';

const cases = [
  { word: 'log', item: 'mock.v5.vocabulary.1.log.v11', old: '/images/assessment/rhyming/variants/og/log-02.webp', current: '/images/assessment/literacy-classroom/log.webp' },
  { word: 'eat', item: 'mock.v8.language.action.0.eat.v11', old: '/media/vocabulary/images/eat.webp', current: '/images/assessment/literacy-mock/clarity/eat-v1.webp' },
  { word: 'tail', item: 'lp3.final_sounds.l1.C.l.v6', old: '/images/assessment/language/variants/homophones-homonyms/tail-tale-01.webp', current: '/images/assessment/literacy-mock/clarity/tail-v1.webp' }
];

for (const row of cases) test(`the ${row.word} picture uses its clear reviewed delivery in the actual question`, async ({ page }, info) => {
  test.setTimeout(90000);
  const responses = [];
  page.on('response', response => { if (new URL(response.url()).pathname === row.current) responses.push(response); });
  await page.goto(`/tests/fixtures/literacy-mock.html?case=${encodeURIComponent(info.testId)}&mode=format&version=literacy-mock-v12&item=${encodeURIComponent(row.item)}`);
  const picture = page.locator(`img[data-assessment-media-kind="evidence"][src^="${row.current}"]`);
  await expect(picture).toBeVisible({ timeout: 60000 });
  await expect.poll(() => picture.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect.poll(() => page.locator('img[data-assessment-media-kind="evidence"]').evaluateAll(images =>
    images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  await expect(page.locator(`img[src^="${row.old}"]`)).toHaveCount(0);
  await expect.poll(() => responses.length).toBeGreaterThan(0);
  const digest = bytes => createHash('sha256').update(bytes).digest('hex');
  expect(digest(await responses[0].body())).toBe(digest(fs.readFileSync(new URL('../../public' + row.current, import.meta.url))));
  await page.screenshot({ path: info.outputPath(`${row.word}-reviewed-question.png`), fullPage: true });
});

test('failure of the new log evidence blocks the question instead of restoring the forest picture', async ({ page }, info) => {
  test.setTimeout(90000);
  const row = cases[0];
  await page.route(`**${row.current}*`, route => route.abort());
  await page.goto(`/tests/fixtures/literacy-mock.html?case=${encodeURIComponent(info.testId)}&mode=format&version=literacy-mock-v12&item=${encodeURIComponent(row.item)}`);
  await expect(page.getByText('A picture or recording did not load. This question will not count.')).toBeVisible({ timeout: 60000 });
  await page.locator('.literacy-mock-choice').first().click();
  await expect(page.getByRole('button', { name: 'Next question', exact: true })).toBeDisabled();
  await expect(page.locator(`img[src^="${row.old}"]`)).toHaveCount(0);
});
