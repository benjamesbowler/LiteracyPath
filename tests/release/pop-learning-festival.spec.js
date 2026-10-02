import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const key = 'literacy-guide-phonics-play:fullscreen-overlay-preview:target:easy';
const evidence = '.artifacts/phonics-overhaul/pop-learning';
const read = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const episode = async page => (await read(page)).stage.data.recovery.task.episode;
async function open(page, sound = false) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/preview/game-overlay.html?game=pop-the-word&sound=${sound ? 1 : 0}&music=0`);
  await expect(page.locator('.pr-pop')).toBeVisible({ timeout: 30000 });
}
async function restore(page) {
  await page.reload();
  const continuation = page.getByRole('button', { name: 'Continue', exact: true });
  await expect(continuation.or(page.locator('.pr-pop'))).toBeVisible();
  if (await continuation.isVisible()) await continuation.click();
  await expect(page.locator('.pr-pop')).toBeVisible({ timeout: 30000 });
}
async function wrongFirst(page) {
  const state = await read(page), target = state.gameState.words[state.round];
  const wrong = state.stage.data.options.find(word => word !== target);
  await page.getByRole('button', { name: `Pop ${wrong}`, exact: true }).press('Enter');
  await expect(page.locator('[data-learning-phase=receipt]')).toBeVisible();
  await expect(page.locator('.pr-word-balloon')).toHaveCount(0);
  await expect(page.locator('[data-learning-phase=teaching]').first()).toBeVisible();
  return { target, wrong, first: await episode(page) };
}
async function model(page) {
  const task = page.locator('[data-learning-episode]').first();
  await expect(task.locator('[data-guided-model]:enabled')).toHaveCount(1);
  await task.locator('[data-guided-model]:enabled').press('Space');
}
async function setFail(page, condition = 'all') {
  await page.evaluate(({ key, condition }) => {
    if (!window.__popOriginalSetItem) {
      window.__popOriginalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (name, value) {
        const state = name === key ? JSON.parse(value) : null;
        const fail = window.__popSaveFailure === 'all' || window.__popSaveFailure === 'complete' && state?.stage?.data?.popped;
        if (state && fail) throw new DOMException('Held test write', 'QuotaExceededError');
        return window.__popOriginalSetItem.call(this, name, value);
      };
    }
    window.__popSaveFailure = condition;
  }, { key, condition });
}
async function retry(page) {
  await setFail(page, '');
  await page.getByRole('button', { name: 'Retry save', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry save', exact: true })).toHaveCount(0);
}

for (const viewport of [{ width: 320, height: 568 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }]) {
  test(`Pop keeps the first choice, restores its model and bounds a second error at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    test.setTimeout(90000); await page.setViewportSize(viewport); await open(page);
    const { target, wrong, first } = await wrongFirst(page);
    expect(first.firstResponse.selected).toBe(wrong); expect(first.firstResponse.observedCorrect).toBe(false);
    expect(first.firstQuestion.word).toBe(target);
    expect((await read(page)).score).toBe(0);
    await expect(page.locator('.pp-shell.pp-error')).toHaveCount(0);
    await restore(page);
    expect((await episode(page)).firstResponse).toEqual(first.firstResponse);
    const match = page.getByRole('button', { name: `Match ${target}`, exact: true });
    const box = await match.boundingBox(), zone = await page.locator('.pr-learning-zone').boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(56); expect(box.height).toBeGreaterThanOrEqual(56);
    expect(box.y).toBeGreaterThanOrEqual(zone.y); expect(box.y + box.height).toBeLessThanOrEqual(zone.y + zone.height);
    await mkdir(evidence, { recursive: true });
    await page.screenshot({ path: `${evidence}/model-${viewport.width}x${viewport.height}.png` });
    await model(page);
    await expect(page.locator('[data-learning-phase=answer]')).toBeVisible();
    const transfer = await episode(page);
    expect(transfer.role).toBe('transfer'); expect(transfer.question.word).not.toBe(target);
    expect((await read(page)).gameState.words).not.toContain(transfer.question.word);
    expect(transfer.question.answerOptions).not.toEqual(first.firstQuestion.answerOptions);
    const boxes = await page.locator('.learning-guided-action').evaluateAll(buttons => buttons.map(button => button.getBoundingClientRect().toJSON()));
    const freshZone = await page.locator('.pr-learning-zone').boundingBox();
    for (const item of boxes) { expect(item.width).toBeGreaterThanOrEqual(56); expect(item.height).toBeGreaterThanOrEqual(56); expect(item.right).toBeLessThanOrEqual(viewport.width); expect(item.top).toBeGreaterThanOrEqual(freshZone.y); expect(item.bottom).toBeLessThanOrEqual(freshZone.y + freshZone.height); }
    await page.screenshot({ path: `${evidence}/transfer-${viewport.width}x${viewport.height}.png` });
    const other = transfer.question.answerOptions.find(option => option.id !== transfer.expected);
    await page.getByRole('button', { name: `Choose ${other.label}`, exact: true }).click();
    await expect(page.locator('[data-learning-phase=finish_teaching]').first()).toBeVisible();
    await restore(page); expect((await episode(page)).responses).toHaveLength(2);
    await model(page);
    await expect.poll(async () => (await read(page)).round).toBe(1);
    const complete = await read(page), held = complete.evidence.assistedRetries[0].learningEpisode;
    expect(complete.evidence.firstResponses).toHaveLength(1); expect(complete.evidence.firstResponses[0].correct).toBe(false);
    expect(complete.evidence.assistedRetries).toHaveLength(1); expect(held.firstResponse).toEqual(first.firstResponse);
    expect(held.completion.unresolved).toBe(true); expect(held.guidedActions).toHaveLength(2);
    expect(complete.score).toBe(20); expect(complete.correct).toBe(1); expect(complete.modelNext).toBe(true);
    await expect(page.locator('[data-learning-phase=teaching]').first()).toBeVisible();
    expect((await episode(page)).firstResponse).toBeNull(); expect((await episode(page)).modelFirst).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('Pop correct fresh transfer rewards one original slot and preserves first versus assisted evidence', async ({ page }) => {
  await open(page); const { first } = await wrongFirst(page); await model(page);
  await expect(page.locator('[data-learning-phase=answer]')).toBeVisible();
  const transfer = await episode(page);
  await page.getByRole('button', { name: `Choose ${transfer.expected}`, exact: true }).dblclick();
  await expect(page.locator('[data-learning-phase=receipt]')).toBeVisible();
  await page.getByRole('button', { name: 'Pause Pop the Word', exact: true }).click();
  await page.waitForTimeout(1800);
  expect((await read(page)).round).toBe(0); expect((await read(page)).score).toBe(0);
  await page.getByRole('button', { name: 'Resume game', exact: true }).click();
  await expect.poll(async () => (await read(page)).round).toBe(1);
  const saved = await read(page), held = saved.evidence.assistedRetries[0].learningEpisode;
  expect(saved.evidence.firstResponses).toHaveLength(1); expect(saved.evidence.assistedRetries).toHaveLength(1);
  expect(held.firstResponse).toEqual(first.firstResponse); expect(held.responses).toHaveLength(2);
  expect(held.responses[1].evidenceUse).toBe('formative_transfer_after_teaching'); expect(held.completion.unresolved).toBe(false);
  expect(saved.score).toBe(20); expect(saved.correct).toBe(1); expect(saved.modelNext).toBe(false);
  await restore(page); expect((await read(page)).score).toBe(20);
});

test('Pop blocked first response and final modeled action keep a held save, including paused Retry', async ({ page }) => {
  test.setTimeout(60000); await open(page); await setFail(page);
  const native = await read(page), wrong = native.stage.data.options.find(word => word !== native.gameState.words[0]);
  await page.getByRole('button', { name: `Pop ${wrong}`, exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry save', exact: true })).toBeVisible();
  expect((await read(page)).round).toBe(0); expect((await read(page)).score).toBe(0);
  await page.getByRole('button', { name: 'Pause Pop the Word', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry save', exact: true })).toBeDisabled();
  await page.waitForTimeout(1800); await page.getByRole('button', { name: 'Resume game', exact: true }).click();
  await retry(page); await expect(page.locator('[data-learning-phase=teaching]').first()).toBeVisible();
  const original = await episode(page); await setFail(page); await model(page);
  await expect(page.getByRole('button', { name: 'Retry save', exact: true })).toBeVisible();
  expect((await episode(page)).phase).toBe('teaching'); expect((await read(page)).score).toBe(0);
  await retry(page); await expect(page.locator('[data-learning-phase=answer]')).toBeVisible();
  await restore(page); const transferred = await episode(page);
  expect(transferred.role).toBe('transfer'); expect(transferred.guidedActions).toHaveLength(1);
  expect(transferred.firstResponse).toEqual(original.firstResponse);
  await expect(page.getByRole('button', { name: `Choose ${transferred.expected}`, exact: true })).toBeEnabled();
});

test('Pop blocked completed snapshot retries the exact episode and rewards once', async ({ page }) => {
  await open(page); await wrongFirst(page); await model(page);
  await expect(page.locator('[data-learning-phase=answer]')).toBeVisible();
  const transfer = await episode(page); await setFail(page, 'complete');
  await page.getByRole('button', { name: `Choose ${transfer.expected}`, exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry save', exact: true })).toBeVisible();
  const held = await read(page); expect(held.round).toBe(0); expect(held.score).toBe(0); expect(held.correct).toBe(0);
  expect(held.stage.data.recovery.task.episode.phase).toBe('complete'); expect(held.evidence.assistedRetries).toHaveLength(0);
  await retry(page); await expect.poll(async () => (await read(page)).round).toBe(1);
  const saved = await read(page); expect(saved.score).toBe(20); expect(saved.correct).toBe(1); expect(saved.evidence.assistedRetries).toHaveLength(1);
  expect(saved.evidence.assistedRetries[0].learningEpisode.responses).toHaveLength(2);
  await restore(page); expect((await read(page)).score).toBe(20);
});

test('Pop unavailable transfer audio shows the fresh printed target and remains a supported task', async ({ page }) => {
  await page.route('**/*.mp3', route => route.abort()); await open(page, true);
  await expect(page.locator('.pr-objective strong')).toContainText((await read(page)).gameState.words[0]);
  await wrongFirst(page); await model(page); await expect(page.locator('[data-learning-phase=answer]')).toBeVisible();
  const transfer = await episode(page);
  await expect(page.locator('.learning-teaching-passage')).toHaveText(transfer.question.word);
  await expect.poll(async () => (await read(page)).stage.data.recovery.task.delivery).toBe('unavailable');
  await page.getByRole('button', { name: `Choose ${transfer.expected}`, exact: true }).click();
  await expect.poll(async () => (await read(page)).round).toBe(1);
  expect((await read(page)).evidence.assistedRetries[0].learningEpisode.responses[1].media.targetDelivery).toBe('unavailable');
});

test('Pop recorded lesson replay recovers a blocked gesture without synthetic speech', async ({ page }) => {
  test.setTimeout(60000);
  await page.addInitScript(() => {
    const native = HTMLMediaElement.prototype.play;
    window.__lessonAttempts = 0; window.__lessonPlaying = 0; window.__synthetic = 0;
    if (window.speechSynthesis) window.speechSynthesis.speak = () => { window.__synthetic += 1; };
    HTMLMediaElement.prototype.play = function () {
      window.__lessonAttempts += 1;
      if (window.__blockLesson) { window.__blockLesson = false; return Promise.reject(new DOMException('Blocked lesson gesture', 'NotAllowedError')); }
      this.addEventListener('playing', () => { window.__lessonPlaying += 1; }, { once: true });
      return native.call(this);
    };
  });
  await open(page, true); await wrongFirst(page);
  await page.evaluate(() => { window.__blockLesson = true; });
  await page.getByRole('button', { name: 'Hear it again', exact: true }).click();
  await expect.poll(async () => (await read(page)).stage.data.recovery.task.delivery).toBe('unavailable');
  const before = await page.evaluate(() => window.__lessonPlaying);
  await page.getByRole('button', { name: 'Hear it again', exact: true }).click();
  await expect.poll(async () => (await read(page)).stage.data.recovery.task.delivery).toBe('delivered');
  expect(await page.evaluate(() => window.__lessonPlaying)).toBeGreaterThan(before);
  expect(await page.evaluate(() => window.__synthetic)).toBe(0);
});

test('Pop protects opaque future episode bytes instead of generating a replacement', async ({ page }) => {
  await open(page); await wrongFirst(page);
  const opaque = await page.evaluate(key => {
    const saved = JSON.parse(localStorage.getItem(key)); saved.stage.data.recovery.task.episode.schemaVersion = 999;
    const bytes = JSON.stringify(saved); localStorage.setItem(key, bytes); return bytes;
  }, key);
  await page.reload();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('Your saved practice is kept safe.', { exact: true })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(opaque);
  await expect(page.locator('.pr-word-balloon')).toHaveCount(0);
});

test('Pop without an eligible fresh transfer models once then starts the next slot with no invented first answer', async ({ page }) => {
  await open(page);
  await page.evaluate(key => { const state = JSON.parse(localStorage.getItem(key)); state.gameState.pool = state.gameState.words; localStorage.setItem(key, JSON.stringify(state)); }, key);
  await restore(page); const { first } = await wrongFirst(page); expect(first.transfer).toBeNull(); await model(page);
  await expect.poll(async () => (await read(page)).round).toBe(1);
  const saved = await read(page), done = saved.evidence.assistedRetries[0].learningEpisode;
  expect(done.completion.transferUnavailable).toBe(true); expect(saved.score).toBe(20);
  await expect(page.locator('[data-learning-phase=teaching]').first()).toBeVisible();
  expect((await episode(page)).firstResponse).toBeNull(); expect(saved.evidence.firstResponses).toHaveLength(1);
});

test('Pop restores an older fully placed model cursor into one fresh transfer', async ({ page }) => {
  await open(page); const { first } = await wrongFirst(page);
  await page.evaluate(key => { const saved = JSON.parse(localStorage.getItem(key)); saved.stage.data.recovery.task.episode.guidedCursor = 1; localStorage.setItem(key, JSON.stringify(saved)); }, key);
  await restore(page); await expect(page.locator('[data-learning-phase=answer]')).toBeVisible();
  const restored = await episode(page);
  expect(restored.role).toBe('transfer'); expect(restored.guidedActions).toHaveLength(1);
  expect(restored.firstResponse).toEqual(first.firstResponse); expect(restored.question.word).not.toBe(first.question.word);
  expect((await read(page)).score).toBe(0); expect((await read(page)).evidence.assistedRetries).toHaveLength(0);
  await expect(page.getByRole('button', { name: `Choose ${restored.expected}`, exact: true })).toBeEnabled();
});

test('Pop cannot carry a heard model word into an unheard fresh target delivery', async ({ page }) => {
  await page.addInitScript(() => {
    const native = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (window.__holdFreshCue) return new Promise(() => {});
      return native.call(this);
    };
  });
  await open(page, true); await wrongFirst(page);
  await expect.poll(async () => (await read(page)).stage.data.recovery.task.delivery).toBe('delivered');
  await page.evaluate(() => { window.__holdFreshCue = true; });
  await model(page); await expect(page.locator('[data-learning-phase=answer]')).toBeVisible();
  const transfer = await episode(page);
  await page.getByRole('button', { name: `Choose ${transfer.expected}`, exact: true }).click();
  const held = await episode(page);
  expect(held.responses).toHaveLength(2);
  expect(held.responses[1].media.targetDelivery).toBe('not_played');
  expect(held.firstQuestion.word).not.toBe(held.responses[1].question.word);
});
