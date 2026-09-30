import { test, expect } from '@playwright/test';
import { CAMPAIGN_MISSIONS } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { createCampaignPreviewProgress } from '../../src/features/soundSeekers/preview/campaignPreview.js';
import { startRoundedMission, currentCampaignCheckpoint } from '../../src/features/soundSeekers/rounded/campaignController.js';
import { updateCampaignCheckpoint } from '../../src/features/soundSeekers/v3/engine/campaignProgress.js';
import { recordTaught } from '../../src/features/soundSeekers/v3/engine/progress.js';
import { createCampaignBeatState } from '../../src/features/soundSeekers/v3/engine/campaignChallenges.js';
import { localProgressStorageKeyForRow } from '../../src/utils/progressKeys.js';

function seedMission(mission) {
  let progress = createCampaignPreviewProgress(mission.stageId);
  for (const earlier of CAMPAIGN_MISSIONS) {
    if (earlier.id === mission.id) break;
    if (earlier.stageId !== mission.stageId) continue;
    progress = recordTaught(progress, earlier.curriculum.targetIds || []);
    progress.campaign.completedMissions[earlier.id] = { at: 0, previewFixture: true };
  }
  return startRoundedMission(progress, mission.id, { attemptId: `panel-review:${mission.id}`, now: 1 });
}
const samples = new Map();
for (const mission of CAMPAIGN_MISSIONS) {
  const progress = seedMission(mission), cp = currentCampaignCheckpoint(progress);
  if (!cp) throw new Error(`Synthetic mission could not start: ${mission.id}`);
  for (const [index, beat] of cp.challenges.entries()) {
    const key = [beat.familyId, beat.mechanic, beat.view.workshop?.mode || beat.view.phase || beat.view.direction || beat.view.mode || beat.domain].join(':');
    const sample = { mission, index, beat, progress: updateCampaignCheckpoint(progress, mission.id, { attemptId: cp.attemptId, beatIndex: index, beatState: createCampaignBeatState(beat) }, 2) };
    if (!samples.has(key)) samples.set(key, sample);
    if (beat.view.slots === 9) samples.set('nine-slot-message', sample);
  }
}
const semanticDestinations = new Map();
for (const missionId of ['dino-11-side-2', 'dino-14-4', 'dino-18-side-1']) {
  const mission = CAMPAIGN_MISSIONS.find(item => item.id === missionId), progress = seedMission(mission), cp = currentCampaignCheckpoint(progress);
  const index = cp.challenges.findIndex(beat => beat.view.phase === 'delivery' && beat.view.sceneObjects.some(object => ['on the flat rock', 'in the long basket', 'in the red tray'].includes(object.label)));
  if (index < 0) throw new Error(`Authored semantic destination was not found: ${missionId}`);
  const beat = cp.challenges[index];
  semanticDestinations.set(missionId, { mission, index, beat, progress: updateCampaignCheckpoint(progress, mission.id, { attemptId: cp.attemptId, beatIndex: index, beatState: createCampaignBeatState(beat) }, 2) });
}
async function openSample(page, sample, suffix = '', sound = false, motion = false) {
  const scope = `sound-seekers-preview:rounded:panel-own${suffix}`;
  const key = localProgressStorageKeyForRow('phonics_quest', 'sound_seekers_v3', scope);
  await page.addInitScript(({ key, progress }) => {
    const seeded = `${key}:panel-review-seeded`;
    if (!sessionStorage.getItem(seeded)) {
      localStorage.setItem(key, JSON.stringify(progress));
      sessionStorage.setItem(seeded, '1');
    }
  }, { key, progress: sample.progress });
  await page.goto(`/preview/rounded-campaign.html?stage=${sample.mission.stageId}&scope=panel-own${suffix}&resume=1${sound ? '&sound=1' : ''}${motion ? '&motion=1' : ''}`);
  await page.getByRole('button', { name: 'Carry on', exact: true }).click();
  await expect(page.locator('.rounded-activity')).toHaveAttribute('data-family', sample.beat.familyId);
  return { scope, key };
}
async function expectFit(page) {
  const issues = await page.locator('.rc-header button,.rounded-activity button').evaluateAll(nodes => nodes.flatMap(n => {
    const r = n.getBoundingClientRect();
    return r.width < 56 || r.height < 56 || r.left < -.01 || r.right > innerWidth + .01 || r.top < -.01 || r.bottom > innerHeight + .01
      ? [{ name: n.getAttribute('aria-label') || n.textContent, width: r.width, height: r.height, left: r.left, top: r.top, right: r.right, bottom: r.bottom }] : [];
  }));
  expect(issues).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  expect(await page.locator('.rounded-activity').evaluate(n => n.scrollWidth - n.clientWidth)).toBe(0);
}
for (const viewport of [{ id: 'phone', width: 320, height: 568 }, { id: 'short', width: 568, height: 320 }]) for (const [variant, sample] of samples) {
  test(`integrated ${viewport.id} ${variant}`, async ({ page }, testInfo) => {
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize(viewport);
    await openSample(page, sample);
    await page.waitForFunction(() => [...document.querySelectorAll('.rounded-prop-art')].every(c => c.getContext('2d').getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 3 && v > 0)));
    await expectFit(page);
    if (sample.beat.view.workshop?.mode === 'replace') await expect(page.getByRole('button', { name: 'Remove the last piece', exact: true })).toHaveCount(0);
    expect(errors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath('activity.png') });
  });
}
for (const viewport of [{ id: 'phone', width: 320, height: 568 }, { id: 'short', width: 568, height: 320 }]) for (const [variant, sample] of semanticDestinations) {
  test(`integrated semantic destination ${viewport.id} ${variant}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await openSample(page, sample, '-semantic');
    await page.waitForFunction(() => [...document.querySelectorAll('.rounded-physical-choice .rounded-prop-art')].every(c => c.getContext('2d').getImageData(0, 0, c.width, c.height).data.some((v, i) => i % 4 === 3 && v > 0)));
    await expectFit(page);
    await page.screenshot({ path: testInfo.outputPath('destinations.png') });
  });
}

test('integrated muted teaching supports exposure and moves automatically', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const sample = [...samples.values()].find(item => item.beat.mechanic === 'sound_signpost');
  await openSample(page, sample, '-teaching');
  const target = await page.locator('[data-teaching-target]').first().getAttribute('data-teaching-target');
  await page.getByRole('button', { name: 'Read the clue', exact: true }).click();
  await expect(page.locator('.rounded-written-support')).toBeVisible();
  await expect(page.locator('[data-teaching-target]').first()).not.toHaveAttribute('data-teaching-target', target);
  await expectFit(page);
});

test('integrated failed canonical destinations recover using exact supported text', async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await page.route('**/game-assets/sound-seekers/v3/cast/moonwood/{wren,burrow}.webp', route => route.abort());
  const mission = CAMPAIGN_MISSIONS.find(item => item.id === 'moonwood-21-4');
  const progress = seedMission(mission), cp = currentCampaignCheckpoint(progress), index = 7;
  const beat = cp.challenges[index];
  await openSample(page, { mission, index, beat, progress: updateCampaignCheckpoint(progress, mission.id, { attemptId: cp.attemptId, beatIndex: index, beatState: createCampaignBeatState(beat) }, 2) }, '-failed');
  await expect(page.getByRole('alert')).toContainText('pictures could not open');
  const choices = page.locator('.rounded-physical-choice');
  for (const choice of await choices.all()) await expect(choice).toBeDisabled();
  await page.getByRole('button', { name: 'Read the clue', exact: true }).click();
  await expect(page.locator('.rounded-written-support')).toHaveText("Take the basket to Wren's landing.");
  await expect(choices.nth(0)).toHaveText("to Wren's landing");
  await expect(choices.nth(1)).toHaveText("to Burrow's landing");
  await expect(choices.nth(2)).toHaveText('to the new camp');
  await expectFit(page);
  await choices.nth(0).click();
  await expect(page.locator('.rounded-family-scene')).toHaveAttribute('data-motion', 'accepted');
});

const actionFamilies = new Map();
for (const sample of samples.values()) if (sample.beat.mechanic !== 'sound_signpost' && !actionFamilies.has(sample.beat.familyId)) actionFamilies.set(sample.beat.familyId, sample);
for (const [family, sample] of actionFamilies) test(`integrated native keyboard action moves ${family}`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await openSample(page, sample, `-keyboard-${family}`, false, true);
  const beat = sample.beat;
  const id = beat.mechanic === 'sound_sort' ? beat.key.bins[beat.view.items[0].id]
    : ['word_forge', 'sentence_build'].includes(beat.mechanic) ? beat.key.sequence[0]
      : beat.key.choiceId || beat.key.optionId;
  const control = page.locator(`[data-choice-id="${id}"]`);
  await control.focus(); await expect(control).toBeFocused(); await page.keyboard.press('Enter');
  await expect(page.locator('.rounded-family-scene')).toHaveAttribute('data-motion', 'accepted');
  await expectFit(page);
  await page.screenshot({ path: testInfo.outputPath('accepted.png') });
});

test('integrated recorded replay starts decoded audio and receives actual same-origin files', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 568, height: 320 });
  await page.addInitScript(() => {
    window.__ROUND_AUDIO_STARTED = [];
    const original = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.buffer && this.buffer.duration > .05) window.__ROUND_AUDIO_STARTED.push({ duration: this.buffer.duration, samples: this.buffer.length, contextState: this.context.state });
      return original.apply(this, args);
    };
  });
  const responses = [];
  page.on('response', response => { if (response.url().endsWith('.mp3')) responses.push({ url: response.url(), status: response.status() }); });
  const sample = [...samples.values()].find(item => item.beat.mechanic === 'word_forge' && !item.beat.view.workshop);
  await openSample(page, sample, '-audio', true);
  await expect.poll(() => page.evaluate(() => window.__ROUND_AUDIO_STARTED.length), { timeout: 20000 }).toBeGreaterThan(0);
  await expect(page.locator('.rounded-replay')).toHaveAttribute('data-speaking', 'false', { timeout: 20000 });
  const initial = await page.evaluate(() => window.__ROUND_AUDIO_STARTED.length);
  await page.getByRole('button', { name: 'Hear the instruction again', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__ROUND_AUDIO_STARTED.length), { timeout: 20000 }).toBeGreaterThan(initial);
  const origin = new URL(page.url()).origin;
  expect(responses.some(item => new URL(item.url).origin === origin && new URL(item.url).pathname.startsWith('/audio/') && item.status === 200)).toBe(true);
  expect(await page.evaluate(() => window.__ROUND_AUDIO_STARTED.every(item => item.contextState === 'running' && item.samples > 0))).toBe(true);
});

test('integrated Hear choice plays its recording separately from choosing an answer', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 568, height: 320 });
  await page.addInitScript(() => {
    window.__ROUND_OPTION_STARTS = 0;
    const original = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      if (this.buffer?.duration > .05) window.__ROUND_OPTION_STARTS++;
      return original.apply(this, args);
    };
  });
  const sample = [...samples.values()].find(item => item.beat.view.direction === 'letter-to-sound');
  await openSample(page, sample, '-hear-choice', true);
  await expect.poll(() => page.evaluate(() => window.__ROUND_OPTION_STARTS), { timeout: 20000 }).toBeGreaterThan(0);
  await expect(page.locator('.rounded-replay')).toHaveAttribute('data-speaking', 'false', { timeout: 20000 });
  const initial = await page.evaluate(() => window.__ROUND_OPTION_STARTS);
  await page.getByRole('button', { name: 'Hear sound choice 1', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__ROUND_OPTION_STARTS), { timeout: 20000 }).toBeGreaterThan(initial);
  await expect(page.locator('.rounded-replay')).toHaveAttribute('data-speaking', 'false', { timeout: 20000 });
  await expect(page.locator('.rounded-activity')).toHaveAttribute('data-mechanic', 'echo_hunt');
  await expect(page.locator('.rounded-family-scene')).toHaveAttribute('data-motion', 'idle');
  for (const choice of await page.locator('.rounded-physical-choice').all()) await expect(choice).toBeEnabled();
});

test('integrated recorded teaching advances only after a real completed delivery', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 320, height: 568 });
  const sample = [...samples.values()].find(item => item.beat.mechanic === 'sound_signpost');
  await openSample(page, sample, '-teaching-audio', true);
  const target = sample.beat.view.cards[0].targetId;
  await expect(page.locator('[data-teaching-target]').first()).toHaveAttribute('data-teaching-target', target);
  await page.getByRole('button', { name: /and its example/ }).click();
  await expect(page.locator('[data-teaching-target]').first()).toHaveAttribute('data-teaching-target', target);
  await expect(page.locator('[data-teaching-target]').first()).not.toHaveAttribute('data-teaching-target', target, { timeout: 20000 });
  await expectFit(page);
});

test('integrated recording failure keeps the longest message controls and supported recovery visible', async ({ page }) => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 568, height: 320 }]) {
    await page.setViewportSize(viewport);
    await page.route('**/audio/**/*.mp3', route => route.abort());
    const sample = samples.get('nine-slot-message');
    await openSample(page, sample, `-audio-failure-${viewport.width}`, true);
    await expect(page.locator('.rc-audio-error')).not.toBeEmpty();
    await expectFit(page);
    await page.getByRole('button', { name: 'Read the clue', exact: true }).click();
    await expect(page.locator('.rounded-written-support')).toHaveText(sample.beat.key.supportText);
    await expectFit(page);
  }
});

test('integrated wrong pieces keep stable word and message banks, and undo removes the last accepted piece', async ({ page }) => {
  const word = [...samples.values()].find(item => item.beat.mechanic === 'word_forge' && !item.beat.view.workshop);
  const message = samples.get('nine-slot-message');
  for (const sample of [word, message]) {
    await page.setViewportSize({ width: 320, height: 568 });
    await openSample(page, sample, `-undo-${sample.beat.mechanic}`);
    const bank = page.locator('.rounded-piece');
    const ids = await bank.evaluateAll(nodes => nodes.map(node => node.dataset.choiceId));
    const expected = sample.beat.view.tiles.find(tile => tile.id === sample.beat.key.sequence[0]);
    const wrong = sample.beat.view.tiles.find(tile => tile.grapheme !== expected.grapheme);
    await page.locator(`[data-choice-id="${wrong.id}"]`).click();
    await expect(page.locator('[data-placed-tile]:not([data-placed-tile=""])')).toHaveCount(0);
    expect(await bank.evaluateAll(nodes => nodes.map(node => node.dataset.choiceId))).toEqual(ids);
    for (const id of sample.beat.key.sequence.slice(0, 2)) await page.locator(`[data-choice-id="${id}"]`).click();
    await expect(page.locator('[data-placed-tile]:not([data-placed-tile=""])')).toHaveCount(2);
    await page.getByRole('button', { name: 'Remove the last piece', exact: true }).click();
    await expect(page.locator('[data-placed-tile]:not([data-placed-tile=""])')).toHaveCount(1);
    await expect(page.locator(`[data-choice-id="${sample.beat.key.sequence[1]}"]`)).toBeEnabled();
    expect(await bank.evaluateAll(nodes => nodes.map(node => node.dataset.choiceId))).toEqual(ids);
    await expectFit(page);
    await page.reload();
    await page.getByRole('button', { name: 'Carry on', exact: true }).click();
    await expect(page.locator('[data-placed-tile]:not([data-placed-tile=""])')).toHaveCount(1);
    expect(await bank.evaluateAll(nodes => nodes.map(node => node.dataset.choiceId))).toEqual(ids);
    await expect(page.locator(`[data-choice-id="${sample.beat.key.sequence[1]}"]`)).toBeEnabled();
  }
});

test('integrated independent letter-to-sound round shows an answer anchor only after explicit model support', async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  const sample = [...samples.values()].find(item => item.beat.view.direction === 'letter-to-sound' && item.beat.supportContext.mode === 'independent-check');
  await openSample(page, sample, '-model');
  await expect(page.locator('.rounded-picture-cue')).toHaveCount(0);
  await page.getByRole('button', { name: 'Show me', exact: true }).click();
  await expect(page.locator('.rounded-picture-cue img')).toBeVisible();
  await expect(page.locator('.rounded-family-scene')).toHaveAttribute('data-motion', 'idle');
  for (const choice of await page.locator('.rounded-physical-choice').all()) await expect(choice).toBeEnabled();
  await expectFit(page);
});
