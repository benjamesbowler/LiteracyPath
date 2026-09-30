import { expect, test } from '@playwright/test';
import { GAME_LIST } from '../../src/data/learnGamesData.js';
import { getLedaInstructionAudioPath } from '../../src/data/ledaProductionAudio.js';
import { arcadeGuideForGame } from '../../src/components/learn/games/shared/arcadeGuideExamples.js';
import { CAMPAIGN_MISSIONS } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { isCampaignMissionUnlocked } from '../../src/features/soundSeekers/v3/engine/campaignProgress.js';
import { ROUND_CAMPAIGN, startRoundedMission, currentCampaignBeat, currentCampaignCheckpoint, judgeRoundedAction, advanceRoundedMission } from '../../src/features/soundSeekers/rounded/campaignController.js';
import { campaignStorageKey } from '../../src/features/soundSeekers/v3/campaignStorage.js';
import { createCampaignPreviewProgress } from '../../src/features/soundSeekers/preview/campaignPreview.js';

test.use({ viewport: { width: 1024, height: 768 }, hasTouch: true, actionTimeout: 15000 });
test.setTimeout(90000);

async function traceAuthoredPaths(page) {
  const pad = page.locator('.phonics-trace-pad');
  const beforeScroll = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  await pad.evaluate(element => {
    window.__activityTracePointers = [];
    for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
      element.addEventListener(type, event => window.__activityTracePointers.push({ type, trusted: event.isTrusted, pointerType: event.pointerType }));
    }
  });
  const strokes = await pad.locator('svg > path').evaluate(path => {
    const matrix = path.getScreenCTM();
    return path.getAttribute('d').split(/(?=M)/).filter(Boolean).map(d => {
      const stroke = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      stroke.setAttribute('d', d);
      const length = stroke.getTotalLength();
      return Array.from({ length: 81 }, (_, index) => {
        const point = stroke.getPointAtLength(length * index / 80).matrixTransform(matrix);
        return { x: point.x, y: point.y, id: 1, radiusX: 7, radiusY: 7, force: 0.6 };
      });
    });
  });
  const cdp = await page.context().newCDPSession(page);
  try {
    for (const points of strokes) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [points[0]] });
      for (const point of points.slice(1)) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
  } finally { await cdp.detach(); }
  const events = await page.evaluate(() => window.__activityTracePointers);
  expect(events.filter(event => event.type === 'pointermove').length).toBeGreaterThan(10);
  expect(events.some(event => event.type === 'pointercancel')).toBe(false);
  expect(events.every(event => event.trusted && event.pointerType === 'touch')).toBe(true);
  expect(await page.evaluate(() => ({ x: scrollX, y: scrollY }))).toEqual(beforeScroll);
}
test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL).origin;
  await page.route('**/*', async route => {
    if (new URL(route.request().url()).origin !== origin && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(route.request().method())) throw new Error('Isolated control review attempted a hosted write');
    await route.fallback();
  });
});

test('S04 tracing distinguishes model replay, touch input, and keyboard assistance', async ({ page }, testInfo) => {
  await page.goto('/preview/child-surfaces.html?surface=phonics', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Practise A', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Trace stroke/ })).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Skip', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Show me', exact: true }).click();
  await page.waitForTimeout(3600);
  await expect(page.getByRole('button', { name: 'Next Step', exact: true })).toHaveCount(0);
  // Native pointer tracing is exercised before using the explicit accommodation.
  const box = await page.locator('.phonics-trace-pad').boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByRole('button', { name: 'Next Step', exact: true })).toHaveCount(0);
  const disclosure = page.getByText('Help me trace', { exact: true });
  await disclosure.focus(); await page.keyboard.press('Enter');
  expect(await page.locator('.phonics-trace-help > div').evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(255, 255, 255)');
  expect(await page.locator('.phonics-trace-pad').evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(255, 255, 255)');
  await page.screenshot({ path: testInfo.outputPath('tracing-help.png') });
  while (await page.getByRole('button', { name: /^Trace stroke/ }).count()) {
    const stroke = page.getByRole('button', { name: /^Trace stroke/ });
    await stroke.focus(); await page.keyboard.press('Enter');
  }
  // Resetting the attempt cannot erase the accommodation already used.
  await page.getByRole('button', { name: 'Try Again', exact: true }).click();
  await traceAuthoredPaths(page);
  await page.getByRole('button', { name: 'Next Step', exact: true }).click();
  const trace = await page.evaluate(async () => {
    const { letterPracticeSessionKey } = await import('/src/utils/letterPracticeProgress.js');
    return JSON.parse(localStorage.getItem(letterPracticeSessionKey('child-surface-preview')))?.A?.evidence?.[0];
  });
  expect(trace.completionKind).toBe('supported');
  expect(trace.supportUsed).toContain('switch_trace');
  expect(trace.independent).toBe(false);
});

test('S09 page audio and whole-book audio are distinct and the exact bookmark survives closing', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const BrowserAudio = window.Audio;
    window.__controlAudio = [];
    window.Audio = function ReviewedAudio(src) {
      const audio = new BrowserAudio(src);
      window.__controlAudio.push(audio);
      return audio;
    };
    window.Audio.prototype = BrowserAudio.prototype;
  });
  await page.goto('/preview/guided-reading-preview.html?book=level-c-nonfiction-01-bees', { waitUntil: 'domcontentloaded' });
  const reader = page.getByRole('region', { name: /full-screen reader/ });
  await expect(reader.getByRole('button', { name: 'Hear this page', exact: true })).toBeVisible();
  await expect(reader.getByRole('button', { name: 'Hear the whole book', exact: true })).not.toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('reader.png') });
  await reader.getByRole('button', { name: 'Hear this page', exact: true }).tap();
  await expect(reader.getByRole('button', { name: 'Stop page audio', exact: true })).toBeVisible();
  await reader.getByRole('button', { name: 'Pause', exact: true }).tap();
  await expect(reader.getByRole('button', { name: 'Resume', exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.__controlAudio.filter(audio => !audio.paused).length)).toBe(0);
  await reader.getByRole('button', { name: 'Resume', exact: true }).tap();
  await reader.getByRole('button', { name: 'Stop page audio', exact: true }).tap();
  await expect(reader.getByRole('button', { name: 'Hear this page', exact: true })).toBeVisible();
  await reader.getByLabel('More reader controls').click();
  await expect(reader.getByRole('button', { name: 'Hear the whole book', exact: true })).toBeVisible();
  await reader.getByRole('button', { name: 'Line focus', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowLeft');
  await expect(reader.getByRole('status', { name: 'Reading progress' })).toHaveText(/Page 2 of/);
  await reader.getByRole('button', { name: 'Back to Books', exact: true }).click();
  const record = await page.evaluate(() => window.__guidedReadingPreviewRecords['level-c-nonfiction-01-bees']);
  expect(record.lastPageIndex).toBe(1);
  expect(record.completedPages).toBeGreaterThanOrEqual(3);
  await expect(page.locator('body')).not.toContainText(/Level [A-Z]\b/);
});

test('T11 touch word tools correct marks and play support without changing the reading response', async ({ page }, testInfo) => {
  await page.goto('/preview/guided-reading-preview.html?book=level-c-nonfiction-01-bees&mode=teacher');
  await page.getByRole('button', { name: 'Marking mode', exact: true }).tap();
  const word = page.locator('.guided-word.marking').first();
  const text = await word.innerText();
  await word.tap();
  const tools = page.getByRole('region', { name: 'Selected word tools' });
  await tools.getByRole('button', { name: 'Needs support', exact: true }).tap();
  await expect(word).toHaveClass(/support/);
  await tools.getByRole('button', { name: 'Unmarked', exact: true }).tap();
  await expect(word).toHaveClass(/neutral/);
  await tools.getByRole('button', { name: 'Read correctly', exact: true }).tap();
  await tools.getByRole('button', { name: `Hear ${text}`, exact: true }).tap();
  await expect(word).toHaveClass(/correct/);
  await expect.poll(async () => page.evaluate(() => window.__guidedReadingPreviewRecords['level-c-nonfiction-01-bees']?.pages?.[0]?.supportUseEvents?.length || 0)).toBe(1);
  const record = await page.evaluate(() => window.__guidedReadingPreviewRecords['level-c-nonfiction-01-bees'].pages[0]);
  expect(record.wordMarks[0]).toBe('correct');
  expect(record.supportUseEvents[0].stage).toBe('whole_word_audio');
  await page.screenshot({ path: testInfo.outputPath('teacher-word-tools.png') });
  for (const button of await tools.getByRole('button').all()) {
    const box = await button.boundingBox(); expect(box.height).toBeGreaterThanOrEqual(56); expect(box.width).toBeGreaterThanOrEqual(56);
  }
});

test('S12 game guide replays the actual instruction and its demonstration without a tutorial gate', async ({ page }, testInfo) => {
  const game = GAME_LIST.find(item => item.id === 'rocket-run');
  await page.goto('/preview/game-overlay.html?game=rocket-run&sound=1');
  await page.getByRole('button', { name: /mission guide/i }).click();
  const guide = page.getByRole('dialog', { name: 'Rocket Run mission guide' });
  await expect(guide).toContainText(arcadeGuideForGame(game).instruction);
  await expect(guide.getByText('What you are practising', { exact: true })).not.toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('game-guide.png') });
  await page.clock.install({ time: new Date('2026-10-01T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-01T00:01:00Z'));
  await guide.getByRole('button', { name: 'Show me', exact: true }).click();
  await expect(guide.locator('[data-demo-frame="0"]')).toBeVisible();
  await page.clock.runFor(3000);
  await expect(guide.locator('[data-demo-frame="2"]')).toBeVisible();
  await page.clock.resume();
  const clip = getLedaInstructionAudioPath(arcadeGuideForGame(game).instruction);
  await guide.getByRole('button', { name: 'Hear how to play', exact: true }).click();
  await expect.poll(() => page.evaluate(path => window.Howler?._howls.some(howl => howl._src === path && howl.playing()), clip)).toBe(true);
  await guide.getByRole('button', { name: 'Keep playing', exact: true }).click();
  await expect(guide).toHaveCount(0);
  await expect.poll(() => page.evaluate(path => window.Howler?._howls.some(howl => howl._src === path && howl.playing()) || false, clip)).toBe(false);
});

test('S13/S14 walking arrives before help and Places leads with eligible adventures', async ({ page }, testInfo) => {
  const scope = `control-clarity-${testInfo.project.name}`;
  await page.goto(`/preview/rounded-campaign.html?stage=meadow-01&scope=${scope}&simple=1`);
  await page.getByRole('button', { name: 'Start exploring', exact: true }).click();
  const game = page.locator('[data-sound-seekers-game="rounded-campaign"]');
  await expect(game).toHaveAttribute('data-mode', 'explore');
  await page.getByRole('button', { name: 'Places', exact: true }).click();
  const places = page.getByRole('dialog', { name: 'Places' });
  await expect(places.getByRole('region', { name: 'Here now' })).toBeVisible();
  const progress = createCampaignPreviewProgress('meadow-01');
  const eligible = CAMPAIGN_MISSIONS.filter(item => item.stageId === 'meadow-01' && !progress.campaign.completedMissions[item.id] && isCampaignMissionUnlocked(progress, item.id, ROUND_CAMPAIGN));
  await expect(places.locator('.rc-mission-list button:visible')).toHaveCount(eligible.length);
  await expect(places.locator('button:disabled:visible')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('places.png') });
  await expect(places.getByText('Later in your journey', { exact: true }).first()).not.toBeVisible();
  await places.getByText('Your journey · 30 places', { exact: true }).click();
  await expect(places.locator('.rc-journey-list li')).toHaveCount(30);
  await page.getByRole('button', { name: 'Close Places', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Walk to Muddy', exact: true })).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: 'Walk to Muddy', exact: true }).click();
  await expect(game.locator('canvas')).toHaveAttribute('data-last-walk', 'following');
  await expect(page.getByRole('button', { name: 'Help Muddy', exact: true })).toBeVisible({ timeout: 30000 });
  await expect(game).toHaveAttribute('data-mode', 'explore');
  await expect(game.locator('.rc-objective')).toContainText('Muddy is here');
  await page.screenshot({ path: testInfo.outputPath('walk-arrival.png') });
  await page.getByRole('button', { name: 'Help Muddy', exact: true }).click();
  await expect(game).toHaveAttribute('data-mode', 'activity');
});

test('S15 activity header shows the exact resumed local step once in plain words', async ({ page }, testInfo) => {
  const scope = `header-progress-${testInfo.project.name}`;
  const mission = CAMPAIGN_MISSIONS.find(item => item.id === 'meadow-01-1');
  let progress = startRoundedMission(createCampaignPreviewProgress('meadow-01'), mission.id, { attemptId: scope, now: 1 });
  // Settle the first real signpost through the controller, then render its
  // saved second step. A fresh title-page fixture cannot catch duplicate
  // progress, an off-by-one numerator, or a campaign-wide denominator.
  for (const card of currentCampaignBeat(progress).view.cards) {
    progress = judgeRoundedAction(progress, { type: 'HEARD_CARD', targetId: card.targetId }, 2).progress;
  }
  progress = judgeRoundedAction(progress, { type: 'FINISH' }, 3).progress;
  progress = advanceRoundedMission(progress, 4);
  const checkpoint = currentCampaignCheckpoint(progress);
  expect(checkpoint.beatIndex).toBe(1);
  expect(checkpoint.challenges).toHaveLength(8);
  await page.addInitScript(({ key, saved }) => localStorage.setItem(key, JSON.stringify(saved)), {
    key: campaignStorageKey(`sound-seekers-preview:rounded:${scope}`), saved: progress
  });
  await page.goto(`/preview/rounded-campaign.html?stage=meadow-01&scope=${scope}&simple=1&resume=1`);
  await page.getByRole('button', { name: 'Carry on', exact: true }).click();
  const game = page.locator('[data-sound-seekers-game="rounded-campaign"]');
  await expect(game).toHaveAttribute('data-mode', 'activity');
  const header = game.locator('.rc-header');
  await expect(header.locator('[aria-label="Mission steps"]')).toHaveText('2 of 8');
  await expect(header.locator(':scope > span').nth(1)).toHaveText(mission.title);
  const text = await header.innerText();
  expect(text.match(/\b2 of 8\b/g)).toHaveLength(1);
  expect(text).not.toMatch(/\b\d+\s*\/\s*\d+\b/);
  await page.screenshot({ path: testInfo.outputPath('resumed-local-progress.png') });
});

test('S15 pause has one Keep playing action and excludes paused practice time', async ({ page }, testInfo) => {
  await page.goto('/preview/child-surfaces.html?surface=cycle-practice&cycle=cycle-1&motion=reduced');
  await expect(page.locator('.cycle-practice-topbar__round')).toContainText('0 of 6 turns done');
  await page.getByRole('button', { name: 'Pause practice', exact: true }).click();
  await expect(page.getByText('Take a little break', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Keep playing', exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Resume practice', exact: true })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('cycle-pause.png') });
  await page.getByText('Practice time', { exact: true }).click();
  const clock = page.locator('.cycle-practice-time p');
  const before = await clock.innerText();
  await page.waitForTimeout(1300);
  await expect(clock).toHaveText(before);
  await page.getByRole('button', { name: 'Keep playing', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause practice', exact: true })).toBeVisible();
});

test('T02 selected teacher book supplies its exact assignment context and the action is absent for children', async ({ page }) => {
  const bookId = 'level-c-nonfiction-01-bees';
  for (const mode of ['teacher', 'class']) {
    await page.goto(`/preview/guided-reading-preview.html?book=${bookId}&mode=${mode}&assignment=1`);
    if (mode === 'teacher') await page.getByText('View and notes', { exact: true }).click();
    else await page.getByLabel('More reader controls').click();
    await page.getByRole('button', { name: 'Assign this book', exact: true }).tap();
    expect(await page.evaluate(() => window.__guidedReadingAssignedBookId)).toBe(bookId);
  }
  await page.goto(`/preview/guided-reading-preview.html?book=${bookId}&assignment=1`);
  await page.getByLabel('More reader controls').click();
  await expect(page.getByRole('button', { name: 'Assign this book', exact: true, includeHidden: true })).toHaveCount(0);
});

test('Books Keep reading restores the last page opened even after visiting a later page', async ({ page }) => {
  await page.goto('/preview/child-surfaces.html?surface=reading-library');
  await page.getByRole('button', { name: 'Start reading', exact: true }).click();
  const reader = page.getByRole('region', { name: /full-screen reader/ });
  const progress = reader.getByRole('status', { name: 'Reading progress' });
  await reader.getByRole('button', { name: 'Next page', exact: true }).click();
  await reader.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(progress).toHaveText(/Page 3 of/);
  await reader.getByRole('button', { name: 'Previous page', exact: true }).click();
  await reader.getByRole('button', { name: 'Back to Books', exact: true }).click();
  await expect(page.locator('.kg-continue-page')).toHaveText(/Page 2 of/);
  await page.getByRole('button', { name: 'Keep reading', exact: true }).click();
  await expect(progress).toHaveText(/Page 2 of/);
});

for (const viewport of [{ width: 320, height: 568 }, { width: 568, height: 320 }]) {
  test(`child reader, tracing help and cycle pause keep controls reachable at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const fits = async locator => {
      const box = await locator.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(56); expect(box.height).toBeGreaterThanOrEqual(56);
      expect(box.x).toBeGreaterThanOrEqual(0); expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
    };
    await page.goto('/preview/guided-reading-preview.html?book=first-facts-level-a-03-big-and-little');
    const reader = page.getByRole('region', { name: 'Big and Little full-screen reader' });
    for (const control of await reader.locator('.guided-transport button:visible,.guided-transport summary:visible').all()) await fits(control);
    await expect(reader.getByRole('button', { name: 'Back to Books', exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('reader-compact.png') });
    await page.goto('/preview/child-surfaces.html?surface=phonics');
    await page.getByRole('button', { name: 'Practise A', exact: true }).click();
    const help = page.getByText('Help me trace', { exact: true });
    await help.click();
    await expect.poll(() => help.evaluate(element => {
      let opacity = 1;
      for (let current = element; current; current = current.parentElement) opacity *= Number(getComputedStyle(current).opacity);
      return opacity;
    })).toBe(1);
    await fits(help);
    const explanation = page.locator('.phonics-trace-help p');
    const explanationBox = await explanation.boundingBox();
    expect(explanationBox.y).toBeGreaterThanOrEqual(60);
    expect(explanationBox.x).toBeGreaterThanOrEqual(0);
    expect(explanationBox.x + explanationBox.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(explanationBox.y + explanationBox.height).toBeLessThanOrEqual(viewport.height - 56);
    expect(await explanation.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
    })).toBe(true);
    for (const button of await page.locator('.phonics-trace-help button:visible').all()) await fits(button);
    await page.screenshot({ path: testInfo.outputPath('tracing-compact.png') });
    await page.goto('/preview/child-surfaces.html?surface=cycle-practice&cycle=cycle-1&motion=reduced');
    await page.getByRole('button', { name: 'Pause practice', exact: true }).click();
    const carryOn = page.getByRole('button', { name: 'Keep playing', exact: true });
    await carryOn.scrollIntoViewIfNeeded(); await fits(carryOn);
    await page.screenshot({ path: testInfo.outputPath('cycle-pause-compact.png') });
  });
}
