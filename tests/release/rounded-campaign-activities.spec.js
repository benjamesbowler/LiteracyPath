import { test, expect } from '@playwright/test';
import { CAMPAIGN_MISSIONS } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { createCampaignPreviewProgress } from '../../src/features/soundSeekers/preview/campaignPreview.js';
import { startRoundedMission, currentCampaignCheckpoint } from '../../src/features/soundSeekers/rounded/campaignController.js';
import { updateCampaignCheckpoint } from '../../src/features/soundSeekers/v3/engine/campaignProgress.js';
import { recordTaught } from '../../src/features/soundSeekers/v3/engine/progress.js';
import { createCampaignBeatState } from '../../src/features/soundSeekers/v3/engine/campaignChallenges.js';
import { localProgressStorageKeyForRow } from '../../src/utils/progressKeys.js';
import { campaignLiveKey, applyCampaignLiveJournal, campaignBaseSignature } from '../../src/utils/campaignLiveJournal.js';
import { prepareCampaignLearningRecovery } from '../../src/features/soundSeekers/rounded/campaignLearningResponse.js';

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
let spatialTransferSample, lanternTransferSample;
for (const mission of CAMPAIGN_MISSIONS) {
  const progress = seedMission(mission), cp = currentCampaignCheckpoint(progress);
  if (!cp) throw new Error(`Synthetic mission could not start: ${mission.id}`);
  for (const [index, beat] of cp.challenges.entries()) {
    const key = [beat.familyId, beat.mechanic, beat.view.workshop?.mode || beat.view.phase || beat.view.direction || beat.view.mode || beat.domain].join(':');
    const sample = { mission, index, beat, progress: updateCampaignCheckpoint(progress, mission.id, { attemptId: cp.attemptId, beatIndex: index, beatState: createCampaignBeatState(beat) }, 2) };
    if (!spatialTransferSample && beat.view.phase === 'delivery' && prepareCampaignLearningRecovery(sample.progress, {type:'MODEL_NEXT'})?.transfer) spatialTransferSample = sample;
    if (!lanternTransferSample && beat.familyId === 'lantern-search' && ['echo_hunt', 'story_bridge'].includes(beat.mechanic)) {
      const recovery = prepareCampaignLearningRecovery(sample.progress, { type: 'MODEL_NEXT' });
      if (recovery?.transfer?.question.authoredBeat.familyId === 'lantern-search') lanternTransferSample = sample;
    }
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
    if (!r.width && n.matches("[data-carry-source],[data-lantern]")) return []; // Optional motor aid has native target parity on short screens.
    return r.width < 56 || r.height < 56 || r.left < -.01 || r.right > innerWidth + .01 || r.top < -.01 || r.bottom > innerHeight + .01
      ? [{ name: n.getAttribute('aria-label') || n.textContent, width: r.width, height: r.height, left: r.left, top: r.top, right: r.right, bottom: r.bottom }] : [];
  }));
  expect(issues).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  expect(await page.locator('.rounded-activity').evaluate(n => n.scrollWidth - n.clientWidth)).toBe(0);
}

async function savedCheckpoint(page, key) {
  const bytes = await page.evaluate(({key, liveKey}) => ({base: localStorage.getItem(key), live: localStorage.getItem(liveKey)}), {key, liveKey: campaignLiveKey(key)});
  const base = JSON.parse(bytes.base);
  return currentCampaignCheckpoint(applyCampaignLiveJournal(base, JSON.parse(bytes.live), campaignBaseSignature(bytes.base)));
}

for (const family of ['word-pop', 'rescue-bridge']) test(`redesigned desktop scene and controls fit ${family}`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const sample = [...samples.values()].find(item => item.beat.familyId === family &&
    (family === 'word-pop' ? item.beat.view.direction === 'letter-to-sound' : item.beat.mechanic === 'word_forge'));
  await openSample(page, sample, `-desktop-${family}`);
  await expectFit(page);
  await page.waitForFunction(() => [...document.querySelectorAll('.campaign-scene-pal img')].every(img => img.complete && img.naturalWidth > 0));
  const bounds = await page.locator('.campaign-activity-scene').evaluate(n => {
    const r = n.getBoundingClientRect();
    return { width: r.width, height: r.height, top: r.top };
  });
  expect(bounds.width).toBeGreaterThan(800);
  expect(bounds.height).toBeGreaterThanOrEqual(140);
  expect(bounds.top).toBeGreaterThan(64);
  expect(await page.locator('.rounded-activity-header').evaluate(n => n.getBoundingClientRect().top)).toBeGreaterThanOrEqual(76);
  if (family === 'word-pop') {
    await expect(page.locator('.rounded-choices')).toHaveAttribute('data-choice-count', '4');
    const circles = await page.locator('.campaign-scene-bubble-target').evaluateAll(nodes => nodes.map(n => {
      const r = n.getBoundingClientRect(); return Math.abs(r.width - r.height);
    }));
    expect(circles.length).toBeGreaterThan(0);
    expect(circles.every(delta => delta < 1)).toBe(true);
  }
  await page.screenshot({ path: testInfo.outputPath('redesigned.png') });
});

test('bridge artwork restores settled pieces on Undo and freezes when paused', async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  const sample = [...samples.values()].find(item => item.beat.familyId === 'rescue-bridge' && item.beat.mechanic === 'word_forge');
  await openSample(page, sample, '-scene-undo', false, true);
  const scene = page.locator('.campaign-activity-scene');
  await expect(scene).toHaveAttribute('data-scene-progress', '0');
  await page.locator(`[data-choice-id="${sample.beat.key.sequence[0]}"]`).click();
  await expect(scene).toHaveAttribute('data-scene-progress', '1');
  await expect(scene.locator('[data-settled="true"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(scene).toHaveAttribute('data-paused', 'true');
  await expect(scene).toHaveAttribute('data-scene-progress', '1');
  await page.getByRole('button', { name: 'Keep playing', exact: true }).click();
  await page.getByRole('button', { name: 'Remove the last piece', exact: true }).click();
  await expect(scene).toHaveAttribute('data-scene-progress', '0');
  await expect(scene.locator('[data-settled="true"]')).toHaveCount(0);
});

for (const viewport of [{ id: 'phone', width: 320, height: 568 }, { id: 'short', width: 568, height: 320 }, { id: 'classroom', width: 1280, height: 720 }, { id: 'tablet', width: 1024, height: 768 }]) for (const [variant, sample] of samples) {
  test(`integrated ${viewport.id} ${variant}`, async ({ page }, testInfo) => {
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize(viewport);
    await openSample(page, sample);
    await page.waitForFunction(() => [...document.querySelectorAll('.rounded-prop-art')].every(c => c.tagName === 'IMG' && c.complete && c.naturalWidth === 480 && c.naturalHeight === 400));
    await page.waitForFunction(() => [...document.querySelectorAll('.campaign-activity-scene img')].every(img => img.complete && img.naturalWidth > 0));
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
    await page.waitForFunction(() => [...document.querySelectorAll('.rounded-physical-choice .rounded-prop-art')].every(c => c.tagName === 'IMG' && c.complete && c.naturalWidth === 480 && c.naturalHeight === 400));
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
  const explanation = await page.locator('.rounded-written-support').innerText();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.locator('.rounded-written-support')).toHaveText(explanation);
  await page.getByRole('button', { name: 'Keep playing', exact: true }).click();
  await expect(page.locator('.rounded-written-support')).toHaveText(explanation);
  await expect(page.locator('[data-teaching-target]').first()).not.toHaveAttribute('data-teaching-target', target);
  await expectFit(page);
});

test('integrated failed canonical destinations recover using exact supported text', async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await page.route('**/images/sound-seekers/questions/*.webp', route => route.abort());
  const mission = CAMPAIGN_MISSIONS.find(item => item.id === 'moonwood-21-4');
  const progress = seedMission(mission), cp = currentCampaignCheckpoint(progress), index = 7;
  const beat = cp.challenges[index];
  const {key} = await openSample(page, { mission, index, beat, progress: updateCampaignCheckpoint(progress, mission.id, { attemptId: cp.attemptId, beatIndex: index, beatState: createCampaignBeatState(beat) }, 2) }, '-failed');
  await expect(page.getByRole('alert')).toContainText('pictures could not open');
  const choices = page.locator('.rounded-physical-choice');
  for (const choice of await choices.all()) await expect(choice).toBeDisabled();
  await page.getByRole('button', { name: 'Read the clue', exact: true }).click();
  await expect(page.locator('[data-learning-phase]')).toHaveAttribute('data-learning-phase','teaching');
  await expect(page.locator('.rounded-written-support')).toHaveText("Take the basket to Wren's landing.");
  const saved=await savedCheckpoint(page,key);
  expect(saved.beatState.done).toBe(false);
  expect(saved.beatState.learningRecovery.question.answerOptions.map(option=>option.label)).toEqual(["to Wren's landing","to Burrow's landing",'to the new camp']);
  await page.unroute('**/images/sound-seekers/questions/*.webp');
  await page.getByRole('button',{name:'Try pictures again',exact:true}).click();
  await expect.poll(()=>page.locator('.is-modelled img.rounded-prop-art').evaluate(img=>img.complete&&img.naturalWidth===480)).toBe(true);
});

const actionFamilies = new Map();
for (const sample of samples.values()) if (sample.beat.mechanic !== 'sound_signpost' && !actionFamilies.has(sample.beat.familyId)) actionFamilies.set(sample.beat.familyId, sample);
test.describe('native touch family actions', () => {
  test.use({ hasTouch: true });
  for (const [family, sample] of actionFamilies) test(`touch selects a deliberate target in ${family}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openSample(page, sample, `-touch-${family}`, false, true);
    await page.screenshot({ path: testInfo.outputPath('phone-playfield.png') });
    const beat = sample.beat;
    const id = beat.mechanic === 'sound_sort' ? beat.key.bins[beat.view.items[0].id]
      : ['word_forge', 'sentence_build'].includes(beat.mechanic) ? beat.key.sequence[0]
        : beat.key.choiceId || beat.key.optionId;
    const target = page.locator(`[data-choice-id="${id}"]`);
    const tap = async () => { const rect = await target.boundingBox(); await page.touchscreen.tap(rect.x + rect.width / 2, rect.y + rect.height / 2); };
    if (family === 'lantern-search') { await tap(); await expect(page.locator('.rounded-family-scene')).toHaveAttribute('data-motion', 'idle'); }
    await tap();
    await expect(page.locator('.rounded-family-scene')).toHaveAttribute('data-motion', 'accepted');
    await expectFit(page);
    await page.screenshot({ path: testInfo.outputPath('phone-accepted.png') });
  });
});
for (const [family, sample] of actionFamilies) test(`integrated native keyboard action moves ${family}`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 568, height: 320 });
  await openSample(page, sample, `-keyboard-${family}`, false, true);
  const beat = sample.beat;
  const id = beat.mechanic === 'sound_sort' ? beat.key.bins[beat.view.items[0].id]
    : ['word_forge', 'sentence_build'].includes(beat.mechanic) ? beat.key.sequence[0]
      : beat.key.choiceId || beat.key.optionId;
  const control = page.locator(`[data-choice-id="${id}"]`);
  if (family === 'lantern-search') { await control.click(); await expect(page.locator('.rounded-family-scene')).toHaveAttribute('data-motion','idle'); }
  await control.focus(); await expect(control).toBeFocused();
  await Promise.all([
    expect(page.locator('.rounded-family-scene')).toHaveAttribute('data-motion', 'accepted'),
    page.keyboard.press('Enter'),
  ]);
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
    await expect(page.locator('[data-learning-phase]')).toHaveAttribute('data-learning-phase','teaching');
    await expect(page.locator('.rounded-written-support')).toHaveText(sample.beat.key.supportText);
    await expectFit(page);
    const model=page.locator('.is-modelled[data-choice-id]');
    await expect(model).toBeEnabled();
    const bounds=await model.boundingBox();
    expect(bounds.height).toBeGreaterThanOrEqual(56);
    expect(bounds.y+bounds.height).toBeLessThanOrEqual(viewport.height);
  }
});

test('integrated undo resumes exact pieces and a wrong answer freezes the original bank for teaching', async ({ page }) => {
  const word = [...samples.values()].find(item => item.beat.mechanic === 'word_forge' && !item.beat.view.workshop);
  const message = samples.get('nine-slot-message');
  for (const sample of [word, message]) {
    await page.setViewportSize({ width: 320, height: 568 });
    const {key}=await openSample(page, sample, `-undo-${sample.beat.mechanic}`);
    const bank = page.locator('.rounded-piece');
    const ids = await bank.evaluateAll(nodes => nodes.map(node => node.dataset.choiceId));
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
    const next=sample.beat.view.tiles.find(tile=>tile.id===sample.beat.key.sequence[1]);
    const wrong=sample.beat.view.tiles.find(tile=>tile.id!==sample.beat.key.sequence[0]&&tile.grapheme!==next.grapheme);
    await page.locator(`[data-choice-id="${wrong.id}"]`).click();
    await expect(page.locator('[data-sibling-learning-task="sound_seekers_campaign"]')).toBeVisible();
    const saved=await savedCheckpoint(page,key);
    expect(saved.beatState.learningRecovery.question.answerOptions.map(option=>option.id)).toEqual(ids);
    expect(saved.beatState.learningRecovery.selected).toEqual([sample.beat.key.sequence[0],wrong.id]);
    await page.reload();
    await page.getByRole('button',{name:'Carry on',exact:true}).click();
    await expect(page.locator('[data-sibling-learning-task="sound_seekers_campaign"]')).toBeVisible();
    const resumed=await savedCheckpoint(page,key);
    expect(resumed.beatState.learningRecovery.selected).toEqual(saved.beatState.learningRecovery.selected);
    expect(resumed.beatState.learningRecovery.question.answerOptions).toEqual(saved.beatState.learningRecovery.question.answerOptions);
  }
});

test('a supported sound picture and choice order survive an incorrect receipt and its worked model', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const sample = [...samples.values()].find(item => item.beat.view.direction === 'sound-to-letter');
  const cp = currentCampaignCheckpoint(sample.progress);
  const supported = { ...sample, progress: updateCampaignCheckpoint(sample.progress, sample.mission.id,
    { attemptId: cp.attemptId, beatState: { ...cp.beatState, modelShown: true } }, 3) };
  await openSample(page, supported, '-held-picture');
  const picture = page.locator('.rounded-picture-cue img');
  const source = await picture.getAttribute('src');
  const ids = await page.locator('[data-choice-id]').evaluateAll(nodes => nodes.map(node => node.dataset.choiceId));
  const wrong = ids.find(id => id !== sample.beat.key.optionId);
  await page.locator(`[data-choice-id="${wrong}"]`).click();
  await expect(page.locator('[data-learning-phase]')).toHaveAttribute('data-learning-phase', 'receipt');
  await expect(picture).toHaveAttribute('src', source);
  await expect(page.locator('[data-learning-phase]')).toHaveAttribute('data-learning-phase', 'teaching');
  await expect(picture).toHaveAttribute('src', source);
  expect(await page.locator('[data-choice-id]').evaluateAll(nodes => nodes.map(node => node.dataset.choiceId))).toEqual(ids);
  await expectFit(page);
  await page.screenshot({ path: testInfo.outputPath('held-picture-teaching.png') });
});

test('spelling recovery hides the answer and offers only a partial hint after two mistakes', async ({ page }) => {
  const sample = [...samples.values()].find(item => item.beat.mechanic === 'word_forge' && !item.beat.view.workshop);
  const {key} = await openSample(page, sample, '-encoding-hint');
  const wrong = sample.beat.view.tiles.find(tile => tile.id !== sample.beat.key.sequence[0]);
  await page.locator(`[data-choice-id="${wrong.id}"]`).click();
  await expect(page.locator('[data-learning-phase]')).toHaveAttribute('data-learning-phase', 'teaching');
  await expect(page.locator('.is-modelled[data-choice-id]')).toHaveCount(0);
  await expect(page.locator('.rounded-activity-feedback')).not.toContainText('Hint:');
  const before = await savedCheckpoint(page, key);
  const target = new RegExp(`\\b${sample.beat.key.word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`, 'i');
  expect(await page.locator('.rounded-activity').innerText()).not.toMatch(target);
  await page.locator(`[data-choice-id="${wrong.id}"]`).click();
  await expect(page.locator('.rounded-activity-feedback')).toContainText('Hint:');
  await expect(page.locator('.is-modelled[data-choice-id]')).toHaveCount(0);
  expect(await page.locator('.rounded-activity').innerText()).not.toMatch(target);
  const after = await savedCheckpoint(page, key);
  expect(after.beatState.learningRecovery.task.episode.firstResponse).toEqual(before.beatState.learningRecovery.task.episode.firstResponse);
  expect(after.beatState.learningRecovery.task.encodingMistakes).toBe(2);
});

test('fresh lantern practice retains its unscored reveal and saves the opened finds', async ({ page }) => {
  test.setTimeout(60000);
  const sample = lanternTransferSample;
  expect(sample).toBeTruthy();
  const {key} = await openSample(page, sample, '-lantern-transfer');
  await page.getByRole('button', { name: 'Show me', exact: true }).click();
  await expect(page.locator('[data-learning-phase]')).toHaveAttribute('data-learning-phase', 'teaching');
  await page.locator('.is-modelled[data-choice-id]').click();
  await expect(page.locator('.rounded-activity-feedback')).toHaveText('Try a new one with your friend.');
  const before = await savedCheckpoint(page, key);
  const first = page.getByRole('button', { name: 'Look inside lantern 1', exact: true });
  const id = await first.getAttribute('data-choice-id');
  await first.click();
  await expect(page.locator('.rounded-choice-pair.is-open')).toHaveCount(1);
  const opened = await savedCheckpoint(page, key);
  expect(opened.beatState.learningRecovery.task.episode.responses).toEqual(before.beatState.learningRecovery.task.episode.responses);
  expect(opened.beatState.learningRecovery.task.presentation.opened).toEqual([id]);
  await page.reload();
  await page.getByRole('button', { name: 'Carry on', exact: true }).click();
  await expect(page.locator('.rounded-choice-pair.is-open')).toHaveCount(1);
  await expect(page.locator(`[data-choice-id="${id}"]`)).not.toHaveAttribute('aria-label', 'Look inside lantern 1');
});

test('integrated independent letter-to-sound round shows an answer anchor only after explicit model support', async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 320 });
  const sample = [...samples.values()].find(item => item.beat.view.direction === 'letter-to-sound' && item.beat.supportContext.mode === 'independent-check');
  await openSample(page, sample, '-model');
  await expect(page.locator('.rounded-picture-cue')).toHaveCount(0);
  await page.getByRole('button', { name: 'Show me', exact: true }).click();
  await expect(page.locator('[data-learning-phase]')).toHaveAttribute('data-learning-phase','teaching');
  await expect(page.locator('.rounded-picture-cue img')).toBeVisible();
  await expect(page.locator('.rounded-written-support')).toContainText('Apple starts with /a/');
  await expect(page.locator('.is-modelled[data-choice-id]')).toBeEnabled();
});

test('painted question-image failure blocks guessing and recovers the same choices after retry', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const pattern = '**/images/sound-seekers/questions/*.webp';
  await page.route(pattern, route => route.fulfill({ status: 404, body: '' }));
  const sample = [...samples.values()].find(item => item.beat.view.phase === 'delivery');
  await openSample(page, sample, '-painted-image-recovery');
  const choices = page.locator('.rounded-physical-choice');
  const ids = await choices.evaluateAll(nodes => nodes.map(node => node.dataset.choiceId));
  await expect(page.getByRole('button', { name: 'Try pictures again', exact: true })).toBeVisible();
  for (const choice of await choices.all()) await expect(choice).toBeDisabled();
  await expectFit(page);
  await page.unroute(pattern);
  await page.getByRole('button', { name: 'Try pictures again', exact: true }).click();
  await page.waitForFunction(() => [...document.querySelectorAll('.rounded-prop-art')].every(img => img.complete && img.naturalWidth === 480));
  await expect(page.getByRole('button', { name: 'Show me', exact: true })).toBeVisible();
  for (const choice of await choices.all()) await expect(choice).toBeEnabled();
  expect(await choices.evaluateAll(nodes => nodes.map(node => node.dataset.choiceId))).toEqual(ids);
  await expectFit(page);
});

test('spatial worked example displays the exact painted target scene after a deliberate wrong answer', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const sample = [...samples.values()].find(item => item.beat.view.phase === 'delivery' && item.beat.view.objectId === 'towel');
  await openSample(page, sample, '-painted-worked-example');
  const correct = page.locator(`[data-choice-id="${sample.beat.key.choiceId}"] img.rounded-prop-art`);
  const source = await correct.getAttribute('src');
  await page.locator(`.rounded-physical-choice:not([data-choice-id="${sample.beat.key.choiceId}"])`).first().click();
  await expect(page.locator('[data-learning-phase]')).toHaveAttribute('data-learning-phase','teaching');
  const illustration = page.locator('.is-modelled img.rounded-prop-art');
  await expect(illustration).toHaveAttribute('src', source);
  await expect(illustration).toBeVisible();
  await expect.poll(() => illustration.evaluate(img => img.complete && img.naturalWidth === 480)).toBe(true);
  const model = page.locator('.is-modelled[data-choice-id]');
  const bounds = await model.boundingBox();
  expect(bounds.height).toBeGreaterThanOrEqual(56);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(720);
});

for(const viewport of [{name:'phone',width:320,height:568},{name:'short',width:568,height:320},{name:'classroom',width:1280,height:720}]) test(`fresh spatial transfer keeps painted options visible at ${viewport.name}`,async({page},testInfo)=>{
  await page.setViewportSize(viewport);
  const sample=spatialTransferSample;
  expect(sample).toBeTruthy();
  await openSample(page,sample,`-painted-transfer-${viewport.name}`);
  await page.locator(`.rounded-physical-choice:not([data-choice-id="${sample.beat.key.choiceId}"])`).first().click();
  await expect(page.locator('[data-learning-phase]')).toHaveAttribute('data-learning-phase','teaching');
  await page.locator('.is-modelled[data-choice-id]').click();
  await expect(page.locator('.rounded-activity-feedback')).toHaveText('Try a new one with your friend.',{timeout:20000});
  await expect(page.locator('.rounded-physical-choice')).toHaveCount(3);
  await page.waitForFunction(()=>[...document.querySelectorAll('.rounded-physical-choice img.rounded-prop-art')].every(img=>img.complete&&img.naturalWidth===480));
  for(const control of await page.locator('.rounded-physical-choice').all()){
    await expect(control).toBeEnabled();
    const bounds=await control.boundingBox();
    expect(bounds.width).toBeGreaterThanOrEqual(56);expect(bounds.height).toBeGreaterThanOrEqual(56);
    expect(bounds.y+bounds.height).toBeLessThanOrEqual(viewport.height);
  }
  await page.screenshot({path:testInfo.outputPath('painted-transfer.png')});
  if (viewport.name === 'phone') {
    const sources = await page.locator('.rounded-physical-choice img.rounded-prop-art').evaluateAll(images => images.map(image => image.getAttribute('src')));
    const pattern = '**/images/sound-seekers/questions/*.webp';
    await page.route(pattern, route => route.fulfill({status:404,body:''}));
    await page.reload();
    await page.getByRole('button',{name:'Carry on',exact:true}).click();
    await expect(page.getByRole('button',{name:'Try pictures again',exact:true})).toBeVisible();
    for (const control of await page.locator('.rounded-physical-choice').all()) await expect(control).toBeDisabled();
    await page.unroute(pattern);
    await page.getByRole('button',{name:'Try pictures again',exact:true}).first().click();
    await page.waitForFunction(()=>[...document.querySelectorAll('.rounded-physical-choice img.rounded-prop-art')].every(img=>img.complete&&img.naturalWidth===480));
    for (const control of await page.locator('.rounded-physical-choice').all()) await expect(control).toBeEnabled();
    expect(await page.locator('.rounded-physical-choice img.rounded-prop-art').evaluateAll(images=>images.map(image=>image.getAttribute('src')))).toEqual(sources);
  }
});
