import { expect, test } from '@playwright/test';
import fs from 'node:fs';

const url = '/tests/fixtures/literacy-practice.html';
test.describe.configure({ timeout: 90000 });
async function installAudio(page) {
  await page.addInitScript(() => {
    performance.setResourceTimingBufferSize(3000);
    window.__warmAudio = []; window.__played = [];
    window.Audio = class extends EventTarget {
      constructor() { super(); this.src = ''; this.currentTime = 0; this.readyState = 4; this.paused = true; }
      load() { if (this.src) window.__warmAudio.push(this.src); this.dispatchEvent(new Event('canplay')); }
      play() { window.__played.push(this.src); this.paused = false; this.timer = setTimeout(() => { this.paused = true; this.dispatchEvent(new Event('ended')); }, 25); return Promise.resolve(); }
      pause() { clearTimeout(this.timer); this.paused = true; }
    };
  });
}

test('focused practice download and launch measurement', async ({ page }, info) => {
  await installAudio(page); await page.goto(url);
  await page.getByText('Choose a particular skill', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Practice skill', exact: true }).selectOption('initial_sounds');
  await page.waitForTimeout(1000);
  const start = Date.now();
  await page.locator('[data-child-primary-action]').click();
  await expect(page.locator('[data-skills-practice-ready="true"]')).toBeVisible();
  const measurement = await page.evaluate(() => ({
    banks: performance.getEntriesByType('resource').filter(row => row.name.includes('/src/data/v3/banks/')).map(row => ({ name: row.name.split('/').at(-1), bytes: row.decodedBodySize })),
    warmed: [...new Set(window.__warmAudio)], played: [...window.__played]
  }));
  expect(measurement.banks.map(bank => bank.name)).toEqual(['initial_sounds.v3.generated.js']);
  measurement.startToReadyMs = Date.now() - start;
  fs.writeFileSync(info.outputPath('loading.json'), JSON.stringify(measurement, null, 2));
  console.log(JSON.stringify({ startToReadyMs: measurement.startToReadyMs, bankRequests: measurement.banks.length, bankBytes: measurement.banks.reduce((sum, row) => sum + row.bytes, 0), warmedCues: measurement.warmed.length }));
});

test('mixed adventure silently warms its actual opening and next questions before Start', async ({ page }) => {
  await installAudio(page); await page.goto(url);
  await expect.poll(() => page.evaluate(() => window.__warmAudio.length)).toBeGreaterThan(3);
  const before = await page.evaluate(() => ({ warmed: [...new Set(window.__warmAudio)], played: window.__played, session: window.__literacy.session() }));
  expect(before.played).toEqual([]); expect(before.session).toBeNull();
  expect(await page.evaluate(() => performance.getEntriesByType('resource').filter(row => row.name.includes('/src/data/v3/banks/')).map(row => row.name.split('/').at(-1)))).toEqual(['initial_sounds.v3.generated.js']);
  await page.locator('[data-child-primary-action]').click();
  await expect(page.locator('[data-skills-practice-ready="true"]')).toBeVisible();
  const first = await page.evaluate(() => window.__literacy.session().responseEpisode.question);
  expect(first.skillId).toBe('initial_sounds');
  const played = await page.evaluate(() => window.__played);
  expect(played.length).toBeGreaterThan(0);
  expect(played.every(path => before.warmed.some(src => path.includes(src)))).toBe(true);
  const cueWindow = await page.evaluate(async () => {
    const bank = await window.__literacy.bank({ skillIds: Object.values(window.__literacy.session().questionSkills) });
    const { literacyPracticeAudioCues } = await import('/src/data/literacyPracticeBank.js');
    const session = window.__literacy.session();
    return session.questionIds.slice(0, 3).flatMap(id => literacyPracticeAudioCues(bank.find(q => q.id === id)).map(cue => cue.path)).filter(Boolean);
  });
  expect(before.warmed.every(path => cueWindow.includes(path))).toBe(true);
  const firstId = await page.evaluate(() => window.__literacy.session().id);
  await page.getByRole('button', { name: 'Take a break', exact: true }).click();
  await page.getByRole('button', { name: 'Carry on', exact: true }).click();
  await expect(page.locator('[data-skills-practice-ready="true"]')).toBeVisible();
  expect(await page.evaluate(() => window.__literacy.session().id)).toBe(firstId);
});

test('a failed speculative image does not prevent starting or delivering the recorded instructions', async ({ page }) => {
  await installAudio(page);
  let failures = 0;
  await page.route('**/images/assessment/**', async route => {
    if (!failures++) return route.abort();
    return route.continue();
  });
  await page.goto(url);
  await expect.poll(() => page.evaluate(() => window.__warmAudio.length)).toBeGreaterThan(3);
  expect(failures).toBeGreaterThan(0);
  await page.locator('[data-child-primary-action]').click();
  await expect(page.locator('[data-skills-practice-ready="true"]')).toBeVisible();
  expect(await page.evaluate(() => window.__played.length)).toBeGreaterThan(0);
});
