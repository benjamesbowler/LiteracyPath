import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('rounded campaign prepares graphics before readiness and keeps walking, camera and pause coherent', async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/tests/fixtures/sound-seekers-rounded-world.html?low=1');
  const canvas = page.locator('#world > canvas');
  await expect(page.locator('#world')).toHaveAttribute('data-ready', 'true');
  await expect(canvas).toHaveAttribute('data-graphics-warmup', 'ready');
  await page.getByLabel('Reduced motion', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Explore', exact: true }).click();
  await page.keyboard.down('ArrowUp');
  const frames = await page.evaluate(() => new Promise(resolve => {
    const frames = []; let start;
    const sample = time => {
      start ??= time;
      const d = document.querySelector('#world > canvas').dataset;
      frames.push({ time, x: +d.playerX, z: +d.playerZ,
        renderX: +d.renderPlayerX, renderZ: +d.renderPlayerZ, alpha: +d.motionAlpha });
      if (time - start < 1200) requestAnimationFrame(sample); else resolve(frames);
    };
    requestAnimationFrame(sample);
  }));
  await page.keyboard.up('ArrowUp');
  expect(frames.length).toBeGreaterThan(10);
  expect(Math.hypot(frames.at(-1).x - frames[0].x, frames.at(-1).z - frames[0].z)).toBeGreaterThan(2);
  for (const f of frames) {
    expect(f.alpha).toBeGreaterThanOrEqual(0);
    expect(f.alpha).toBeLessThanOrEqual(1);
    expect(Math.hypot(f.x - f.renderX, f.z - f.renderZ)).toBeLessThan(.12);
  }
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-paused', 'true');
  const before = await canvas.evaluate(c => ({ ...c.dataset }));
  await page.waitForTimeout(200);
  const after = await canvas.evaluate(c => ({ ...c.dataset }));
  expect(after.playerX).toBe(before.playerX);
  expect(after.playerZ).toBe(before.playerZ);
  expect(after.renderedFrames).toBe(before.renderedFrames);
  expect(+after.renderPlayerX).toBeCloseTo(+after.playerX, 2);
  expect(+after.renderPlayerZ).toBeCloseTo(+after.playerZ, 2);
  await expect(page.locator('#world')).toHaveAttribute('data-completed-parts', '0');
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect(canvas).toBeFocused();
  await page.screenshot({ path: info.outputPath('walking-after-pause.png') });
  await writeFile(info.outputPath('walking-frames.json'), JSON.stringify(frames));
  expect(errors).toEqual([]);
});
