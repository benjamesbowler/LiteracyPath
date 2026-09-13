import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { elSkillsBlockCycles } from '../../src/data/elSkillsBlockCycles.js';
import { buildStationRounds, stationsForCycle } from '../../src/components/elQuest/elQuestEngine.js';
import { buildCyclePlan, cycleStorageKey } from '../../src/components/cycle-practice/cyclePracticeState.js';
import { emptyElQuestProgress } from '../../src/utils/adventureMapProgress.js';

test.use({ hasTouch: true, viewport: { width: 1024, height: 768 }, trace: process.env.LP_CYCLE_CLASSROOM_SOAK === '1' ? 'off' : 'retain-on-failure' });

for (const viewport of [{ width: 1024, height: 768 }, { width: 768, height: 1024 }]) {
  test(`Cycle 4 word recognition is direct and recoverable with touch at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto('/preview/child-surfaces.html?surface=adventure-map&quest=cycle-4&station=quick');
    const view = page.locator('[data-quest-view="round"]');
    const stage = view.locator('[data-mechanic-stage="sight-word-choice"]');
    await expect(stage).toBeVisible();
    const cycle = elSkillsBlockCycles.find(item => item.id === 'cycle-4');
    const rounds = buildStationRounds(cycle, 'quick', { seed: await view.getAttribute('data-run-seed') });
    const first = rounds[0];
    await expect(view.locator('.adventure-round-frame__instruction > p')).toHaveText('Listen. Tap the word.');
    await expect(stage.getByRole('button')).toHaveCount(3);
    await expect(page.getByRole('button', { name: /check answer|submit|hide|reveal/i })).toHaveCount(0);
    await page.getByRole('button', { name: 'Hear the word', exact: true }).tap();
    await expect(stage.getByRole('button').first()).toBeEnabled();
    for (const button of await stage.getByRole('button').all()) {
      const box = await button.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(56);
      expect(box.height).toBeGreaterThanOrEqual(56);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    }
    const wrong = first.choices.find(choice => choice !== first.answer);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await stage.getByRole('button', { name: `Choose ${wrong}`, exact: true }).tap();
      await expect(view.locator('.adventure-round-frame')).toHaveAttribute('data-feedback-tone', 'retry');
      await expect(view.locator('.adventure-round-frame__feedback')).toHaveAttribute('aria-live', 'polite');
      await expect(view.getByRole('heading', { name: `1 of ${rounds.length}`, exact: true })).toBeVisible();
      await expect(stage.getByRole('button', { name: `Choose ${first.answer}`, exact: true })).toBeEnabled();
    }
    await page.screenshot({ path: testInfo.outputPath(`cycle-4-word-retry-${viewport.width}.png`) });
    await stage.getByRole('button', { name: `Choose ${first.answer}`, exact: true }).tap();
    await expect(view.getByRole('heading', { name: `2 of ${rounds.length}`, exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`cycle-4-next-word-game-${viewport.width}.png`) });
  });
}

test('all 27 Adventure Map cycles open and accept a taught sound response on the iPad layout', async ({ page }, testInfo) => {
  test.setTimeout(6 * 60_000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const cycle of elSkillsBlockCycles.filter(item => item.cycleNumber)) {
    const station = stationsForCycle(cycle).find(item => ['sounds', 'pattern'].includes(item.id));
    expect(station, cycle.id).toBeTruthy();
    await page.goto(`/preview/child-surfaces.html?surface=adventure-map&quest=${cycle.id}&station=${station.id}`);
    const view = page.locator('[data-quest-view="round"]');
    await expect(view.locator('[data-mechanic-stage]')).toBeVisible();
    const rounds = buildStationRounds(cycle, station.id, { seed: await view.getAttribute('data-run-seed') });
    const round = rounds[0];
    await expect(view.getByRole('heading', { name: `1 of ${rounds.length}`, exact: true })).toBeVisible();
    await expect(view.getByText(/poem|does not rhyme|take away/i)).toHaveCount(0);
    if ([4, 27].includes(cycle.cycleNumber)) await page.screenshot({ path: testInfo.outputPath(`${cycle.id}-sound-game.png`) });
    if (round.mechanicId === 'letterGrid') {
      for (const cell of round.cells.filter(item => item.matches)) await view.locator(`[data-cell-id="${cell.id}"]`).tap();
    } else {
      expect(round.mechanicId).toBe('soundChoice');
      await view.getByRole('button', { name: round.answer, exact: true }).tap();
    }
    await expect(view.getByRole('heading', { name: `2 of ${rounds.length}`, exact: true })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('completed quests retain honest optional-station progress and Cycle 27 has a practice heading', async ({ page }, testInfo) => {
  const progress = { ...emptyElQuestProgress(), cycles: { 'cycle-4': { stars: 2, stations: { letters: true, sounds: true, hunt: true, quick: true } } } };
  await page.goto('/preview/child-surfaces.html?surface=adventure-map&quest=cycle-4');
  await expect(page.locator('.sbq-cycle-progress')).toBeVisible();
  await page.evaluate(value => {
    localStorage.setItem('lp-el-quest:child-surface-preview', JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('lp-progress-hydrated'));
  }, progress);
  await expect(page.locator('.sbq-cycle-progress')).toHaveAttribute('aria-label', '5 of 10 stations complete');
  await expect(page.locator('[data-station-id="check"]')).toHaveAttribute('data-station-state', 'done');
  for (const id of ['play', 'poem']) {
    await expect(page.locator(`[data-station-id="${id}"]`)).toHaveAttribute('data-station-state', 'open');
    await expect(page.locator(`[data-station-id="${id}"]`)).toContainText('Extra game');
  }
  await page.goto('/preview/child-surfaces.html?surface=adventure-map&quest=cycle-27');
  await expect(page.getByRole('heading', { name: 'Word and sound review', exact: true })).toBeVisible();
  await expect(page.getByText(/poem launch/i)).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('cycle-27-practice-hub.png') });
});

test.describe('classroom duration', () => {
  test('Cycle 4 sustains thirty real active minutes and completes its check with native recordings', async ({ page }, testInfo) => {
    test.skip(process.env.LP_CYCLE_CLASSROOM_SOAK !== '1', 'Opt-in real-time classroom endurance check.');
    test.setTimeout(40 * 60_000);
    page.setDefaultTimeout(15_000);
    page.setDefaultNavigationTimeout(30_000);
    const cycle = elSkillsBlockCycles.find(item => item.id === 'cycle-4');
    const key = cycleStorageKey('child-surface-preview', 'preview', cycle.id);
    const errors = [], failedMedia = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400 && /\.(mp3|webp|png|jpg|woff2?)(\?|$)/.test(response.url())) failedMedia.push({ url: response.url(), status: response.status() });
    });
    await page.goto('/preview/child-surfaces.html?surface=cycle-practice&cycle=cycle-4&motion=reduced', { waitUntil: 'domcontentloaded' });
    const saved = () => page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)), key);
    const ready = async () => {
      await expect(page.locator('.cycle-activity-space')).not.toHaveAttribute('inert', { timeout: 35_000 });
      const listen = page.getByRole('button', { name: 'Hear what to do', exact: true });
      if (await listen.getAttribute('data-audio-state') === 'unavailable') await listen.tap();
      await expect(listen).toHaveAttribute('data-audio-state', 'ready', { timeout: 35_000 });
    };
    const choose = async round => {
      if (round.mechanicId === 'letterTrace') {
        const help = page.getByRole('button', { name: 'Help me trace one part', exact: true });
        for (let count = 0; count < 16 && await help.isEnabled(); count += 1) await help.tap();
      } else if (round.objects?.length) {
        for (const object of round.objects) {
          await ready();
          await page.locator(`[data-cycle-bin="${object.answer}"]`).tap();
        }
      } else if (round.mechanicId === 'wordBuild') {
        for (const part of round.answer) await page.getByRole('button', { name: `Add ${part}`, exact: true }).tap();
      } else if (round.mechanicId === 'soundSort') {
        await page.locator(`[data-cycle-bin="${round.answer}"]`).tap();
      } else {
        const choice = round.choices.find(item => String(item.value) === String(round.answer));
        await page.getByRole('button', { name: choice.label || String(choice.value), exact: true }).tap();
      }
    };
    // Real elapsed time and real trusted touch events feed the production
    // activity clock. No stored clock, result, audio completion or timer is faked.
    const started = Date.now();
    let steps = 0, paused = false, reloaded = false;
    await page.getByRole('button', { name: 'Hear what to do', exact: true }).tap();
    while (!(await saved())?.result) {
      await ready();
      const state = await saved();
      const seed = state.practiceSeed || 'child-surface-preview:preview';
      const assessment = state.mode === 'assessment';
      const rounds = buildCyclePlan(cycle, assessment ? 'child-surface-preview:preview:assessment' : seed, assessment ? 0 : state.pass, assessment).rounds;
      const index = assessment ? state.assessmentIndex : state.practiceIndex;
      if (!assessment) {
        // Pace successive answers rather than artificially lengthening audio.
        await page.waitForTimeout(9_000);
        if (!paused && (state.clock?.activePracticeSeconds || 0) >= 20) {
          await page.getByRole('button', { name: 'Pause practice', exact: true }).tap();
          const beforePause = (await saved()).clock.activePracticeSeconds;
          await page.waitForTimeout(4_000);
          expect((await saved()).clock.activePracticeSeconds).toBe(beforePause);
          await page.locator('.cycle-play-overlay').getByRole('button', { name: 'Resume practice', exact: true }).tap();
          paused = true;
          await ready();
        }
        if (!reloaded && (state.clock?.activePracticeSeconds || 0) >= 60) {
          await page.reload({ waitUntil: 'domcontentloaded' });
          await expect(page.locator('.cycle-playground')).toBeVisible();
          expect((await saved()).practiceIndex).toBe(index);
          if ((await saved()).paused) await page.locator('.cycle-play-overlay').getByRole('button', { name: 'Resume practice', exact: true }).tap();
          await page.getByRole('button', { name: 'Hear what to do', exact: true }).tap();
          reloaded = true;
          await ready();
        }
      }
      await choose(rounds[index]);
      await expect.poll(async () => {
        const next = await saved();
        return Boolean(next.result || next.mode !== state.mode || next.pass !== state.pass || next.practiceIndex !== state.practiceIndex || next.assessmentIndex !== state.assessmentIndex);
      }, { timeout: 35_000 }).toBe(true);
      steps += 1;
      await writeFile(testInfo.outputPath('endurance-progress.json'), JSON.stringify({ elapsedSeconds: (Date.now() - started) / 1000, steps, state: { mode: (await saved()).mode, clock: (await saved()).clock } }, null, 2));
    }
    const complete = await saved();
    expect(Date.now() - started).toBeGreaterThanOrEqual(30 * 60_000);
    expect(complete.frozenPracticeSeconds).toBeGreaterThanOrEqual(1800);
    expect(new Set(complete.practiceRecords.filter(record => record.activityCompleted).map(record => record.semanticKey)).size).toBeGreaterThanOrEqual(36);
    expect(complete.result.savedToTeacher).toBe(false);
    expect(complete.result.questionRecords.some(record => record.audioDelivery === 'delivered')).toBe(true);
    expect(complete.result.questionRecords.filter(record => record.responseStatus === 'media_failed')).toEqual([]);
    expect(errors).toEqual([]);
    expect(failedMedia).toEqual([]);
    await expect(page.getByRole('heading', { name: 'All done!', exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('cycle-4-thirty-minutes-complete.png') });
    await writeFile(testInfo.outputPath('endurance-result.json'), JSON.stringify({ elapsedSeconds: (Date.now() - started) / 1000, steps, paused, reloaded, activePracticeSeconds: complete.frozenPracticeSeconds, practiceResponses: complete.practiceRecords.length, checkResult: complete.result, errors, failedMedia }, null, 2));
  });
});
