import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => page.setViewportSize({ width: 1024, height: 768 }));

async function openMagic(page, family = 'at') {
  await page.goto('/preview/child-surfaces.html?surface=phonics&island=words&unlockWords=1&step=3');
  await page.getByRole('button', { name: `${family} word nest`, exact: true }).click();
  await page.getByRole('button', { name: 'Change to b', exact: true }).click();
}

test('Magic preserves intended target and first deliberate wrong choice after modeled exposure', async ({ page }, testInfo) => {
  await page.route('**/*.mp3', route => route.abort());
  await openMagic(page);
  await expect(page.getByRole('button', { name: 'Change to h', exact: true })).toBeEnabled();
  const picture = page.getByRole('button', { name: 'Hear bat', exact: true });
  await expect(picture).toBeVisible();
  const image = picture.getByRole('img', { name: 'bat', exact: true });
  await expect(image).toHaveClass(/is-loaded/);
  await expect.poll(() => image.evaluate(node => node.complete && node.naturalWidth > 0)).toBe(true);
  await expect(page.locator('.cvc-magic-change-word').first()).toHaveText('bat');
  await expect(page.getByRole('button', { name: 'Hear cat', exact: true })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('magic-settled-bat-target-hat.png'), fullPage: true });
  await page.getByRole('button', { name: 'Change to c', exact: true }).click();
  await expect(page.locator('.cvc-magic-feedback')).toContainText('different target');
  await page.getByRole('button', { name: 'Change to h', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('Nest Built!', { exact: true })).toBeVisible();
  const magic = await page.evaluate(() => JSON.parse(localStorage.getItem('lp_cvc_progress_child-surface-preview')).at.completions.at(-1).steps.find(step => step.step === 'magic'));
  expect(magic.firstResponse).toMatchObject({ word: 'bat', targetWord: 'hat', selectedWord: 'cat', selected: 'c', slot: 0 });
  expect(magic.attempts).toBe(2);
  expect(magic.independent).toBe(false);
  expect(magic.completionKind).toBe('supported');
  expect(magic.supportUsed).toEqual(expect.arrayContaining(['modeled_transformation', 'target_grapheme_prompt', 'correction']));
});

test('Magic picture replay supersedes the modeled phoneme without queued word stealing its voice', async ({ page }) => {
  await page.addInitScript(() => { window.__magicAudioCalls = []; });
  await page.route('**/src/hooks/usePhonicsAudio.js*', async route => {
    const response = await route.fetch();
    const source = await response.text();
    expect(source).toContain('const request = ++playbackRequest;');
    await route.fulfill({ response, body: source.replace('const request = ++playbackRequest;', 'window.__magicAudioCalls.push(src); const request = ++playbackRequest;') });
  });
  // Keep actual Howler requests pending to exercise owned supersession rather
  // than replacing the component or its playback/cancellation implementation.
  await page.route('**/*.mp3', () => {});
  await openMagic(page);
  await expect.poll(() => page.evaluate(() => window.__magicAudioCalls.length)).toBe(1);
  await page.getByRole('button', { name: 'Hear bat', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Change to h', exact: true })).toBeEnabled();
  await expect(page.getByText('The sound stopped. Replay the picture when you are ready.', { exact: true })).toBeVisible();
  await page.waitForTimeout(300);
  const calls = await page.evaluate(() => window.__magicAudioCalls);
  expect(calls).toHaveLength(2);
  expect(calls[0]).not.toBe(calls[1]);
  expect(calls[1]).toMatch(/bat/);
});
