import { test, expect } from '@playwright/test';
import { getLedaInstructionAudioPath } from '../../src/data/ledaProductionAudio.js';

test('landscape Arcade names, tabs and star rows are readable in the compact cards', async ({ page }, info) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await page.goto('/preview/child-surfaces.html?surface=arcade');
  await expect(page.getByRole('tab', { name: 'Phonics Practice 9' })).toBeVisible();
  const names = page.locator('.lg-game-tile-name');
  await expect(names).toHaveCount(13);
  for (const name of await names.all()) {
    const size = await name.evaluate(element => ({ font: Number.parseFloat(getComputedStyle(element).fontSize),
      overflow: element.scrollWidth > element.clientWidth, lines: getComputedStyle(element).whiteSpace }));
    expect(size.font).toBeGreaterThanOrEqual(14);
    expect(size.overflow).toBe(false);
    expect(size.lines).toBe('normal');
  }
  await expect(page.locator('.lg-game-tile-foot').first()).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Phonics Practice 9' })).toHaveCSS('font-size', '14px');
  await page.screenshot({ path: info.outputPath('arcade-landscape-readable.png') });
});

test('the Arcade reason has an explicit recorded replay with honest exploration copy', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  const requested = [];
  page.on('request', request => requested.push(new URL(request.url()).pathname));
  await page.goto('/preview/child-surfaces.html?surface=arcade');
  await expect(page.locator('[data-recommendation-surface="arcade"]')).toHaveText('Try a game you have not played yet.');
  const audio = getLedaInstructionAudioPath('Try a game you have not played yet.');
  await page.getByRole('button', { name: 'Hear why this game is suggested', exact: true }).click();
  await expect.poll(() => requested.includes(audio)).toBe(true);
});

test('tablet Arcade cards show complete names above their saved stars and trails', async ({ page }, info) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/preview/child-surfaces.html?surface=arcade');
  const names = page.locator('.lg-game-tile-name');
  await expect(names).toHaveCount(13);
  for (const name of await names.all()) {
    const layout = await name.evaluate(element => {
      const foot = element.closest('.lg-game-tile').querySelector('.lg-game-tile-foot');
      return { width: element.clientWidth, textWidth: element.scrollWidth,
        height: element.clientHeight, textHeight: element.scrollHeight,
        bottom: element.getBoundingClientRect().bottom, footTop: foot.getBoundingClientRect().top };
    });
    expect(layout.textWidth).toBeLessThanOrEqual(layout.width);
    expect(layout.textHeight).toBeLessThanOrEqual(layout.height);
    expect(layout.bottom).toBeLessThanOrEqual(layout.footTop);
  }
  await page.screenshot({ path: info.outputPath('arcade-tablet-complete-names.png') });
});

test('small-phone game header and paused audio labels retain clear space and 56px controls', async ({ page }, info) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/preview/game-overlay.html?game=rocket-run&sound=0&music=0');
  const pause = page.getByRole('button', { name: 'Pause Rocket Run', exact: true });
  await expect(pause).toBeVisible();
  const geometry = await page.locator('.lg-game-player-header').evaluate(header => {
    const bottom = header.getBoundingClientRect().bottom;
    const mainTop = document.querySelector('.lg-game-player-main').getBoundingClientRect().top;
    return { bottom, mainTop, buttons: [...header.querySelectorAll('button')].map(button => {
      const box = button.getBoundingClientRect();
      return { width: box.width, height: box.height, bottom: box.bottom, right: box.right };
    }) };
  });
  expect(geometry.mainTop).toBeGreaterThanOrEqual(geometry.bottom);
  for (const box of geometry.buttons) {
    expect(box.width).toBeGreaterThanOrEqual(56);
    expect(box.height).toBeGreaterThanOrEqual(56);
    expect(box.bottom).toBeLessThanOrEqual(geometry.bottom);
    expect(box.right).toBeLessThanOrEqual(320);
  }
  await pause.click();
  const panel = page.getByRole('dialog', { name: 'Rocket Run paused', exact: true });
  await expect(panel).toBeVisible();
  const settings = panel.locator('.lg-game-audio-settings button');
  for (const setting of await settings.all()) {
    const layout = await setting.evaluate(element => ({ width: element.clientWidth, content: element.scrollWidth, height: element.getBoundingClientRect().height }));
    expect(layout.content).toBeLessThanOrEqual(layout.width);
    expect(layout.height).toBeGreaterThanOrEqual(56);
  }
  await expect(panel.getByRole('button', { name: 'Resume game', exact: true })).toBeFocused();
  await page.screenshot({ path: info.outputPath('arcade-small-phone-pause.png') });
});
