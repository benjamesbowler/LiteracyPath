import { expect, test } from '@playwright/test';
import { elSkillsBlockCycles } from '../../src/data/elSkillsBlockCycles.js';
import { buildCyclePlan, cycleStorageKey } from '../../src/components/cycle-practice/cyclePracticeState.js';
import { CYCLE_ACTIVITY_REVISION, CYCLE_PRACTICE_VERSION } from '../../src/policy/cyclePracticePolicy.js';
import { buildStationRounds } from '../../src/components/elQuest/elQuestEngine.js';
import { collectQuestionMedia } from '../../src/utils/preloadQuestionMedia.js';

test.use({ hasTouch: true, viewport: { width: 1024, height: 768 } });

async function audioRecorder(page, { requiresPlay = false } = {}) {
  await page.addInitScript(({ requiresPlay }) => {
    window.__responseAudio = [];
    window.Audio = class extends EventTarget {
      constructor() { super(); this.src = ''; this.readyState = requiresPlay ? 0 : 4; this.currentTime = 0; this.paused = true; }
      load() { if (!requiresPlay) this.dispatchEvent(new Event('canplay')); }
      removeAttribute(name) { if (name === 'src') this.src = ''; }
      play() {
        this.paused = false;
        this.readyState = 4;
        this.dispatchEvent(new Event('canplay'));
        window.__responseAudio.push(this.src);
        this.timer = setTimeout(() => { this.paused = true; this.dispatchEvent(new Event('ended')); }, 50);
        return Promise.resolve();
      }
      pause() { this.paused = true; clearTimeout(this.timer); }
    };
  }, { requiresPlay });
}

test('Cycles starts audio when the browser defers preloading until play', async ({ page }) => {
  await audioRecorder(page, { requiresPlay: true });
  await page.goto('/preview/child-surfaces.html?surface=cycle-practice&cycle=cycle-4');
  await expect(page.locator('.cycle-practice-page')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__responseAudio.length), { timeout: 1500 }).toBeGreaterThan(0);
  await expect(page.locator('.cycle-listen-button')).toHaveAttribute('data-audio-state', 'ready');
});

async function fingerRelease(page, locator, { cancel = false, outside = false } = {}) {
  const box = await locator.boundingBox();
  const client = await page.context().newCDPSession(page);
  const point = { x: box.x + box.width / 2 - 7, y: box.y + box.height / 2 - 7 };
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: outside ? box.x - 20 : point.x + 14, y: point.y + 14 }] });
  await client.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
  await client.detach();
}

test('Cycles loads the following pictures while the child works on the current activity', async ({ page }) => {
  const scope = 'child-surface-preview';
  const cycle = elSkillsBlockCycles.find(item => item.id === 'cycle-4');
  const plan = buildCyclePlan(cycle, `${scope}:preview`).rounds;
  const firstPictures = collectQuestionMedia(plan[0]).images;
  const futurePictures = collectQuestionMedia(plan[1]).images.filter(src => !firstPictures.includes(src));
  expect(futurePictures.length).toBeGreaterThan(0);
  const requests = new Set();
  page.on('request', request => requests.add(new URL(request.url()).pathname));
  await audioRecorder(page);
  await page.addInitScript(({ key, version, activityRevision }) => {
    localStorage.setItem(key, JSON.stringify({ version, activityRevision, mode: 'practice', pass: 0,
      practiceIndex: 0, assessmentIndex: 0, practiceRecords: [], assessmentRecords: [], attempts: 0,
      pendingAttempt: null, result: null, paused: false, earnedCount: 0 }));
  }, { key: cycleStorageKey(scope, 'preview', cycle.id), version: CYCLE_PRACTICE_VERSION, activityRevision: CYCLE_ACTIVITY_REVISION });
  await page.goto('/preview/child-surfaces.html?surface=cycle-practice&cycle=cycle-4');
  await expect(page.locator('.cycle-activity-space')).not.toHaveAttribute('inert');
  await expect.poll(() => futurePictures.filter(src => requests.has(new URL(src, 'https://local.test').pathname)), { timeout: 4000 }).toEqual(futurePictures);
  await expect(page.locator('.cycle-practice-page')).toBeVisible();
  expect(await page.locator('.cycle-activity-space img').evaluateAll(images => images.map(image => new URL(image.src).pathname)))
    .not.toEqual(expect.arrayContaining(futurePictures));
});

test('Adventure Map preloads the next question pictures before the next tap', async ({ page }) => {
  const cycle = elSkillsBlockCycles.find(item => item.id === 'cycle-4');
  const rounds = buildStationRounds(cycle, 'build', { seed: 'adventure:cycle-4:build:initial-v3' });
  const firstPictures = collectQuestionMedia(rounds[0]).images;
  const futurePictures = [...new Set(rounds.slice(1, 3).flatMap(item => collectQuestionMedia(item).images))]
    .filter(src => !firstPictures.includes(src));
  expect(futurePictures.length).toBeGreaterThan(0);
  const requests = new Set();
  page.on('request', request => requests.add(new URL(request.url()).pathname));
  await audioRecorder(page);
  await page.goto('/preview/child-surfaces.html?surface=adventure-map&quest=cycle-4&station=build');
  await expect(page.locator('[data-mechanic-stage="missing-letter"]')).toBeVisible();
  await expect.poll(() => futurePictures.filter(src => requests.has(new URL(src, 'https://local.test').pathname)), { timeout: 4000 }).toEqual(futurePictures);
});

test('Adventure Map accepts a slightly moving finger release once and rejects cancelled/outside releases', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Trusted moving touch uses the Chromium input protocol.');
  await audioRecorder(page);
  await page.goto('/preview/child-surfaces.html?surface=adventure-map&quest=cycle-2&station=trace');
  const stage = page.locator('[data-mechanic-stage="letter-grid"]');
  await expect(stage).toBeVisible();
  const targets = (await stage.locator('.am-simple-target-letters').textContent()).toLowerCase();
  const cells = await stage.locator('[data-cell-id]').evaluateAll(buttons => buttons.map(button => ({ id: button.dataset.cellId, letter: button.querySelector('span').textContent })));
  const correct = cells.find(cell => targets.includes(cell.letter.toLowerCase()));
  const button = stage.locator(`[data-cell-id="${correct.id}"]`);
  await fingerRelease(page, button, { cancel: true });
  await fingerRelease(page, button, { outside: true });
  await expect(button).toHaveAttribute('data-find-state', 'ready');
  await fingerRelease(page, button);
  await expect(button).toHaveAttribute('data-find-state', 'found', { timeout: 1000 });
  await expect(stage.locator('.am-simple-count')).toContainText('1 /');
});
