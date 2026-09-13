import { expect, test } from '@playwright/test';
import { elSkillsBlockCycles } from '../../src/data/elSkillsBlockCycles.js';
import { buildStationRounds } from '../../src/components/elQuest/elQuestEngine.js';
import { buildCyclePracticePlan } from '../../src/components/cycle-practice/cyclePracticeContent.js';
import { cycleStorageKey } from '../../src/components/cycle-practice/cyclePracticeState.js';

const cycle = elSkillsBlockCycles.find(item => item.cycleNumber === 2);
const scope = 'child-surface-preview';

async function fastRecordedAudio(page) {
  await page.addInitScript(() => {
    window.Audio = class extends EventTarget {
      constructor(src = '') { super(); this.src = src; this.currentTime = 0; this.volume = 1; this.readyState = 4; this.paused = true; }
      load() { this.dispatchEvent(new Event('canplay')); }
      play() { this.paused = false; this.timer = setTimeout(() => { this.paused = true; this.dispatchEvent(new Event('ended')); }, 5); return Promise.resolve(); }
      pause() { clearTimeout(this.timer); this.paused = true; }
    };
  });
}

test('an older Cycle 1 build link opens the single Letter Find game', async ({ page }) => {
  await page.goto('/preview/child-surfaces.html?surface=adventure-map&quest=cycle-1&station=build&motion=reduced');
  await expect(page.locator('[data-mechanic-stage="letter-grid"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Stop', exact: true })).toBeVisible();
});

test('the S/T map outing plays both cases of S/T and A/M, then starts a fresh replay', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1024, height: 768 });
  await fastRecordedAudio(page);
  await page.goto('/preview/child-surfaces.html?surface=adventure-map&quest=cycle-2&station=letters&motion=reduced');
  const stage = page.locator('[data-quest-view="round"]');
  const seed = await stage.getAttribute('data-run-seed');
  const rounds = buildStationRounds(cycle, 'letters', { seed });
  expect(rounds).toHaveLength(8);
  const seen = [];
  for (const [index, round] of rounds.entries()) {
    await expect(stage.locator('.am-code-sign-slot').first().locator('strong')).toHaveText(round.modelForm);
    await expect(stage.locator('.am-code-sign-slot').nth(1).locator('strong')).toHaveText('?');
    const choice = stage.locator('.am-letter-press-choices').getByRole('button', { name: round.answer, exact: true });
    await expect(choice).toBeEnabled();
    if (index === 0) await page.screenshot({ path: '.artifacts/game-replay/cycle-2-letter-review.png' });
    await choice.click();
    seen.push(round.answer);
    if (index < rounds.length - 1) await expect(stage.getByRole('progressbar', { name: 'Station progress' })).toHaveAttribute('aria-valuenow', String(index + 1));
  }
  expect(seen.sort()).toEqual(['A', 'M', 'S', 'T', 'a', 'm', 's', 't']);
  await expect(page.getByRole('heading', { name: 'Station done!' })).toBeVisible();
  await page.getByRole('button', { name: 'Stop for now', exact: true }).click();
  await expect(page.locator('#sbq-cycle-title')).toHaveText('Tt and Ss');
  await expect(page.locator('[data-cycle-review]')).toHaveText('Review: Aa, Mm');
  await page.screenshot({ path: '.artifacts/game-replay/cycle-2-review-hub.png' });
  await page.getByRole('button', { name: /Letter Match/ }).click();
  await expect(stage).toBeVisible();
  await expect(stage).not.toHaveAttribute('data-run-seed', seed);
});

test('new Cycle Practice visits get fresh decks and reload keeps the saved question', async ({ page, browser }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await fastRecordedAudio(page);
  const route = '/preview/child-surfaces.html?surface=cycle-practice&cycle=cycle-2&motion=reduced';
  const key = cycleStorageKey(scope, 'preview', cycle.id);
  const saved = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
  await page.goto(route);
  await expect(page.locator('.cycle-listen-button')).toHaveAttribute('data-audio-state', 'ready');
  const initial = await saved();
  expect(initial.practiceSeed).toBeTruthy();
  const rounds = buildCyclePracticePlan(cycle, initial.practiceSeed).rounds;
  const answer = rounds[0].choices.find(choice => choice.value === rounds[0].answer);
  await page.getByRole('button', { name: answer.label, exact: true }).click();
  await expect.poll(async () => (await saved()).practiceIndex).toBe(1);
  expect((await saved()).practiceRecords[0].questionId).toBe(rounds[0].id);
  await page.reload();
  await expect(page.locator('.cycle-playground')).toHaveAttribute('data-mechanic-stage', rounds[1].mechanicId);
  expect((await saved()).practiceSeed).toBe(initial.practiceSeed);
  expect((await saved()).practiceIndex).toBe(1);
  await page.locator('.cycle-play-overlay').getByRole('button', { name: 'Resume practice', exact: true }).click();
  await expect(page.locator('.cycle-listen-button')).toHaveAttribute('data-audio-state', 'ready');
  await page.screenshot({ path: '.artifacts/game-replay/cycle-practice-saved-review.png' });
  const freshContext = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  try {
    const fresh = await freshContext.newPage();
    await fastRecordedAudio(fresh);
    await fresh.goto(new URL(route, page.url()).href);
    await expect(fresh.locator('.cycle-playground')).toBeVisible();
    const other = await fresh.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
    expect(other.practiceSeed).not.toBe(initial.practiceSeed);
    expect(buildCyclePracticePlan(cycle, other.practiceSeed).rounds.map(round => round.id)).not.toEqual(rounds.map(round => round.id));
  } finally { await freshContext.close(); }
});

for (const viewport of [{ width: 1024, height: 650 }, { width: 768, height: 650 }, { width: 390, height: 844 }, { width: 425, height: 754 }, { width: 568, height: 320 }]) {
  test(`all three case-match choices fit with the model at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/preview/child-surfaces.html?surface=adventure-map&quest=cycle-2&station=letters&motion=reduced');
    const stage = page.locator('[data-mechanic-stage="letter-press"]');
    await expect(stage).toBeVisible();
    await stage.locator('button').first().hover();
    const bounds = await stage.locator('button, .am-code-sign-slot').evaluateAll(elements => elements.map(element => {
      const r = element.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom,
        reachable: element.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)) };
    }));
    expect(bounds).toHaveLength(5);
    for (const box of bounds) {
      expect(box.width).toBeGreaterThanOrEqual(56);
      expect(box.height).toBeGreaterThanOrEqual(56);
      expect(box.reachable).toBe(true);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      expect(box.bottom).toBeLessThanOrEqual(viewport.height);
    }
    await page.screenshot({ path: `.artifacts/game-replay/letter-choices-${viewport.width}x${viewport.height}.png` });
  });
}
