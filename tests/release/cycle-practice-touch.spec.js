import { expect, test } from '@playwright/test';
import { elSkillsBlockCycles } from '../../src/data/elSkillsBlockCycles.js';
import { buildCyclePlan, cycleStorageKey } from '../../src/components/cycle-practice/cyclePracticeState.js';
import { CYCLE_ACTIVITY_REVISION, CYCLE_PRACTICE_VERSION } from '../../src/policy/cyclePracticePolicy.js';
import { mkdir } from 'node:fs/promises';
import { createCycleTraceModel } from '../../src/components/cycle-practice/cycleTraceRules.js';

const scope = 'child-surface-preview';
const seed = `${scope}:preview`;
const cycles = elSkillsBlockCycles.filter(cycle => cycle.cycleNumber);
const families = ['pictureSound', 'letterMatch', 'rhymeMatch', 'wordBuild', 'soundSort', 'letterTrace'];
test.use({ hasTouch: true, viewport: { width: 1024, height: 768 } });

async function start(page, cycle, match, { duration = 8, mode = 'practice' } = {}) {
  const rounds = buildCyclePlan(cycle, mode === 'assessment' ? `${seed}:assessment` : seed, 0, mode === 'assessment').rounds;
  const index = rounds.findIndex(match);
  expect(index).toBeGreaterThanOrEqual(0);
  const key = cycleStorageKey(scope, 'preview', cycle.id);
  await page.addInitScript(({ key, index, duration, mode, revision, version }) => {
    localStorage.setItem(key, JSON.stringify({ version, activityRevision: revision, mode, practiceIndex: index, assessmentIndex: index,
      pass: 0, assessmentRecords: [], practiceRecords: [], attempts: 0, earnedCount: 0, paused: false,
      pendingAttempt: null, result: null, attemptId: 'cycle-touch-audit', startedAt: '2026-09-09T01:00:00Z',
      clock: { activePracticeSeconds: 0, sessionElapsedSeconds: 0, checkSeconds: 0 } }));
    window.__touchAudio = { duration, played: [] };
    window.Audio = class extends EventTarget {
      constructor() { super(); this.src = ''; this.currentTime = 0; this.volume = 1; this.readyState = 4; this.paused = true; }
      load() { this.dispatchEvent(new Event('canplay')); }
      play() {
        this.paused = false;
        window.__touchAudio.played.push(this.src);
        this.timer = setTimeout(() => { this.paused = true; this.dispatchEvent(new Event('ended')); }, window.__touchAudio.duration);
        return Promise.resolve();
      }
      pause() { clearTimeout(this.timer); this.paused = true; }
    };
  }, { key, index, duration, mode, revision: CYCLE_ACTIVITY_REVISION, version: CYCLE_PRACTICE_VERSION });
  page.on('pageerror', error => { throw error; });
  await page.goto(`/preview/child-surfaces.html?surface=cycle-practice&cycle=${cycle.id}&motion=reduced`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Start playing', exact: true }).tap();
  return { round: rounds[index], index, key, records: () => page.evaluate(({ key, mode }) => JSON.parse(localStorage.getItem(key))[`${mode}Records`], { key, mode }) };
}

async function ready(page) {
  await expect(page.locator('.cycle-listen-button')).toHaveAttribute('data-audio-state', 'ready');
  await expect(page.locator('.cycle-activity-space')).not.toHaveAttribute('inert');
}

async function answer(page, round, drifting = false) {
  const activate = locator => drifting ? drift(page, locator) : locator.tap();
  if (round.mechanicId === 'letterTrace') {
    while (await page.getByRole('button', { name: 'Help me trace one part' }).isEnabled()) {
      await activate(page.getByRole('button', { name: 'Help me trace one part' }));
    }
  } else if (round.objects) {
    for (const object of round.objects) {
      await ready(page);
      await activate(page.locator(`[data-cycle-bin="${object.answer}"]`));
    }
  } else if (round.mechanicId === 'wordBuild' && round.variant !== 'wordParts') {
    if (round.variant === 'wordChange') await activate(page.getByRole('button', { name: `Change letter ${round.changeIndex + 1}: ${round.beforeLetters[round.changeIndex]}`, exact: true }));
    for (const letter of round.variant === 'wordChange' ? [round.answer[round.changeIndex]] : round.answer) await activate(page.getByRole('button', { name: `Add ${letter}`, exact: true }));
  } else if (round.mechanicId === 'soundSort') {
    await activate(page.locator(`[data-cycle-bin="${round.answer}"]`));
  } else {
    const choice = round.choices.find(choice => String(choice.value) === String(round.answer));
    await activate(page.getByRole('button', { name: choice.label || String(choice.value), exact: true }));
  }
}

async function drift(page, locator, { outside = false, cancel = false } = {}) {
  const box = await locator.boundingBox();
  const client = await page.context().newCDPSession(page);
  const point = { x: box.x + box.width / 2 - 7, y: box.y + box.height / 2 - 7 };
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: outside ? box.x - 20 : point.x + 14, y: point.y + 14 }] });
  await client.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
  await client.detach();
}

test('cancelled and outside finger releases never answer; repeated letters and keyboard each act once', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Trusted touch movement uses the Chromium input protocol.');
  await start(page, cycles.find(cycle => cycle.highFrequencyWords.includes('good')), round => round.variant === 'highFrequency' && round.targetWord === 'good');
  await ready(page);
  const first = page.getByRole('button', { name: 'Add g', exact: true });
  await drift(page, first, { cancel: true });
  await drift(page, first, { outside: true });
  await expect(page.locator('.cycle-word-car').first()).toHaveAttribute('aria-label', 'Letter 1: empty');
  await drift(page, first);
  await expect(page.locator('.cycle-word-car').nth(1)).toHaveAttribute('aria-label', 'Letter 2: empty');
  const repeated = page.getByRole('button', { name: 'Add o', exact: true });
  await repeated.tap();
  await expect(page.locator('.cycle-word-car').nth(1)).toHaveAttribute('aria-label', 'Letter 2: o');
  await expect(page.locator('.cycle-word-car').nth(2)).toHaveAttribute('aria-label', 'Letter 3: empty');
  await repeated.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('.cycle-word-car').nth(2)).toHaveAttribute('aria-label', 'Letter 3: o');
  await expect(page.locator('.cycle-word-car').nth(3)).toHaveAttribute('aria-label', 'Letter 4: empty');
});

test('lost focus cancels a held answer before re-entry and fresh touch still works', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Trusted held touch uses the Chromium input protocol.');
  await start(page, cycles[2], round => round.variant === 'highFrequency' && round.targetWord === 'and');
  await ready(page);
  const button = page.getByRole('button', { name: 'Add a', exact: true });
  const box = await button.boundingBox();
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }] });
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('.cycle-word-car').first()).toHaveAttribute('aria-label', 'Letter 1: empty');
  await button.tap();
  await expect(page.locator('.cycle-word-car').first()).toHaveAttribute('aria-label', 'Letter 1: a');
});

test('pausing a held touch cancels it through resume and requires a fresh released choice', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Trusted held touch uses the Chromium input protocol.');
  await start(page, cycles[2], round => round.variant === 'highFrequency' && round.targetWord === 'and');
  await ready(page);
  const button = page.getByRole('button', { name: 'Add a', exact: true });
  const box = await button.boundingBox();
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }] });
  await page.getByRole('button', { name: 'Pause practice', exact: true }).evaluate(button => button.click());
  await expect(page.locator('.cycle-play-overlay')).toBeVisible();
  await page.locator('.cycle-play-overlay').getByRole('button', { name: 'Resume practice', exact: true }).evaluate(button => button.click());
  await ready(page);
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('.cycle-word-car').first()).toHaveAttribute('aria-label', 'Letter 1: empty');
  await button.tap();
  await expect(page.locator('.cycle-word-car').first()).toHaveAttribute('aria-label', 'Letter 1: a');
});

test('word construction retains accepted letters after a wrong next letter and pause', async ({ page }) => {
  const fixture = await start(page, cycles[2], round => round.mechanicId === 'wordBuild' && !round.variant);
  const { round, records } = fixture;
  await ready(page);
  await page.getByRole('button', { name: `Add ${round.answer[0]}`, exact: true }).tap();
  const wrong = round.choices.find(choice => choice.value !== round.answer[1]);
  await page.getByRole('button', { name: `Add ${wrong.value}`, exact: true }).tap();
  await expect.poll(async () => (await records()).length).toBe(1);
  await ready(page);
  await expect(page.locator('.cycle-word-car').first()).toHaveAttribute('aria-label', `Letter 1: ${round.answer[0]}`);
  await page.getByRole('button', { name: 'Pause practice', exact: true }).tap();
  await page.locator('.cycle-play-overlay').getByRole('button', { name: 'Resume practice', exact: true }).tap();
  await ready(page);
  for (const letter of round.answer.slice(1)) await page.getByRole('button', { name: `Add ${letter}`, exact: true }).tap();
  await expect.poll(async () => (await records()).length).toBe(2);
  expect((await records())[0].responseStatus).toBe('incorrect');
  expect((await records())[1].responseStatus).toBe('supported');
  expect((await records())[1].selected).toEqual(round.answer);
});

test('accepted sorting pictures occupy a separate gallery without covering labels or speakers', async ({ page }) => {
  const { round } = await start(page, cycles[2], round => round.objects?.length);
  await ready(page);
  for (const object of round.objects.slice(0, 2)) {
    await page.locator(`[data-cycle-bin="${object.answer}"]`).tap();
    await ready(page);
  }
  await expect(page.locator('.cycle-sorted-pictures img')).toHaveCount(2);
  const overlaps = await page.locator('.cycle-sort-bin-wrap').evaluateAll(wrappers => wrappers.flatMap(wrapper => {
    const gallery = wrapper.querySelector('.cycle-sorted-pictures');
    if (!gallery) return [];
    return [...gallery.querySelectorAll('img')].flatMap(img => [...wrapper.querySelectorAll('strong,button')].filter(control => {
      const a = img.getBoundingClientRect(), b = control.getBoundingClientRect();
      return Math.min(a.right, b.right) > Math.max(a.left, b.left) && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top);
    }).map(control => control.getAttribute('aria-label') || control.textContent));
  }));
  expect(overlaps).toEqual([]);
});

test('a missing picture reload does not manufacture an incorrect or supported response', async ({ page }) => {
  const target = buildCyclePlan(cycles[0], seed).rounds[0];
  const pattern = `**${target.image}`;
  await page.route(pattern, route => route.abort());
  const { round, key, records } = await start(page, cycles[0], round => round.id === target.id);
  await expect(page.getByRole('button', { name: 'Reload pictures', exact: true })).toBeVisible();
  expect(await records()).toHaveLength(0);
  await page.unroute(pattern);
  await page.getByRole('button', { name: 'Reload pictures', exact: true }).tap();
  await ready(page);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).attempts, key)).toBe(0);
  await answer(page, round);
  await expect.poll(async () => (await records()).length).toBe(1);
  expect((await records())[0].responseStatus).toBe('correct');
});

test('a stalled picture offers reload without scoring or support', async ({ page }) => {
  await page.clock.install();
  const target = buildCyclePlan(cycles[0], seed).rounds[0];
  const pattern = `**${target.image}`;
  let release, finish;
  const pending = new Promise(resolve => { release = resolve; });
  const delivered = new Promise(resolve => { finish = resolve; });
  await page.route(pattern, async route => { await pending; await route.continue(); finish(); });
  const { round, key, records } = await start(page, cycles[0], round => round.id === target.id);
  await page.clock.fastForward(16000);
  await expect(page.getByRole('button', { name: 'Reload pictures', exact: true })).toBeVisible();
  expect(await records()).toHaveLength(0);
  release();
  await delivered;
  await page.getByRole('button', { name: 'Reload pictures', exact: true }).tap();
  await ready(page);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).attempts, key)).toBe(0);
  await answer(page, round);
  await expect.poll(async () => (await records()).length).toBe(1);
  expect((await records())[0].responseStatus).toBe('correct');
});

test('a wrong check classification keeps its first record while the gallery shows the correct sound match', async ({ page }) => {
  const { round, records } = await start(page, cycles[2], round => round.objects?.length, { mode: 'assessment' });
  await ready(page);
  const first = round.objects[0];
  const wrong = round.choices.find(choice => String(choice.value) !== String(first.answer));
  await page.locator(`[data-cycle-bin="${wrong.value}"]`).tap();
  await ready(page);
  expect((await records())[0].selected).toBe(wrong.value);
  expect((await records())[0].responseStatus).toBe('incorrect');
  await expect(page.getByLabel(`Pictures with ${first.answer}`, { exact: true }).getByAltText(first.word, { exact: true })).toBeVisible();
  await answer(page, { ...round, objects: round.objects.slice(1) });
  await expect.poll(async () => (await records()).length).toBe(3);
  expect((await records())[0].selected).toBe(wrong.value);
});

test('stalled teaching audio exposes replay without scoring the waiting child', async ({ page }) => {
  await page.clock.install();
  const { records } = await start(page, cycles[0], round => round.mechanicId === 'pictureSound', { duration: 60000 });
  await expect(page.locator('.cycle-listen-button')).toHaveAttribute('data-audio-state', 'playing');
  await page.clock.fastForward(21000);
  await expect(page.getByRole('button', { name: 'Play instructions', exact: true })).toBeVisible();
  expect(await records()).toHaveLength(0);
  await page.evaluate(() => { window.__touchAudio.duration = 8; });
  await page.getByRole('button', { name: 'Play instructions', exact: true }).tap();
  await ready(page);
});

test('WebKit touch unlocks the real recorded instruction and records a delivered-audio word response', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'The parent independently exercises real recorded audio in Chromium.');
  test.setTimeout(45_000);
  const cycle = cycles[2];
  const rounds = buildCyclePlan(cycle, seed).rounds;
  const index = rounds.findIndex(round => round.variant === 'highFrequency' && round.targetWord === 'and');
  const key = cycleStorageKey(scope, 'preview', cycle.id);
  await page.addInitScript(({ key, index, version, revision }) => {
    localStorage.setItem(key, JSON.stringify({ version, activityRevision: revision, mode: 'practice', practiceIndex: index, assessmentIndex: 0, pass: 0,
      assessmentRecords: [], practiceRecords: [], attempts: 0, earnedCount: 0, paused: false, pendingAttempt: null, result: null,
      clock: { activePracticeSeconds: 0, sessionElapsedSeconds: 0, checkSeconds: 0 } }));
    window.__realMediaEnded = [];
    const nativePlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...args) {
      this.addEventListener('ended', () => window.__realMediaEnded.push(this.currentSrc || this.src), { once: true });
      return nativePlay.apply(this, args);
    };
  }, { key, index, version: CYCLE_PRACTICE_VERSION, revision: CYCLE_ACTIVITY_REVISION });
  await page.goto('/preview/child-surfaces.html?surface=cycle-practice&cycle=cycle-3&motion=reduced');
  await page.getByRole('button', { name: 'Start playing', exact: true }).tap();
  await expect(page.locator('.cycle-listen-button')).toHaveAttribute('data-audio-state', 'ready', { timeout: 25000 });
  await ready(page);
  expect((await page.evaluate(() => window.__realMediaEnded)).length).toBeGreaterThanOrEqual(2);
  await answer(page, rounds[index]);
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)).practiceRecords.length, key)).toBe(1);
  const record = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).practiceRecords[0], key);
  expect(record.selected).toEqual(['a', 'n', 'd']);
  expect(record.audioDelivery).toBe('delivered');
  await mkdir('.artifacts/cycles-touch-review', { recursive: true });
  await page.screenshot({ path: '.artifacts/cycles-touch-review/webkit-real-audio-and.png' });
});

test('a sorting drag follows the finger, cancels cleanly and accepts its released basket exactly once', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Trusted drag movement uses the Chromium input protocol.');
  const { round, records } = await start(page, cycles[2], round => round.objects?.length);
  await ready(page);
  const source = page.getByRole('button', { name: `Pick up ${round.objects[0].word}`, exact: true });
  const sourceBox = await source.boundingBox();
  const targetBox = await page.locator(`[data-cycle-bin="${round.objects[0].answer}"]`).boundingBox();
  const target = { x: targetBox.x + targetBox.width / 2, y: targetBox.y + targetBox.height / 2 };
  const client = await page.context().newCDPSession(page);
  const down = () => client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sourceBox.x + sourceBox.width / 2, y: sourceBox.y + sourceBox.height / 2 }] });
  await down();
  await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [target] });
  const ghost = await page.locator('.cycle-drag-picture').boundingBox();
  expect(Math.abs(ghost.x + ghost.width / 2 - target.x)).toBeLessThan(1);
  expect(Math.abs(ghost.y + ghost.height * .65 - target.y)).toBeLessThan(1);
  await expect(page.locator(`[data-cycle-bin="${round.objects[0].answer}"]`)).toHaveClass(/cycle-sort-bin--hovered/);
  await client.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await expect(page.locator('.cycle-drag-picture')).toHaveCount(0);
  expect(await records()).toHaveLength(0);
  await down();
  await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [target] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(async () => (await records()).length).toBe(1);
  await ready(page);
  await expect(page.locator('.cycle-sorted-pictures img')).toHaveCount(1);
});

test('answer hit regions remain stationary from press through release', async ({ page }) => {
  await start(page, cycles[2], round => round.variant === 'highFrequency' && round.targetWord === 'and');
  await ready(page);
  const button = page.getByRole('button', { name: 'Add a', exact: true });
  const before = await button.boundingBox();
  await page.mouse.move(before.x + before.width / 2, before.y + 1);
  await page.mouse.down();
  const held = await button.boundingBox();
  expect(held).toEqual(before);
  await page.mouse.up();
  await expect(page.locator('.cycle-word-car').first()).toHaveAttribute('aria-label', 'Letter 1: a');
});

test('a finger drifting inside a letter still activates on release without scrolling or losing the tap', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Trusted touch movement uses the Chromium input protocol.');
  await start(page, cycles[2], round => round.variant === 'highFrequency' && round.targetWord === 'and');
  await ready(page);
  const button = page.getByRole('button', { name: 'Add a', exact: true });
  const box = await button.boundingBox();
  const client = await page.context().newCDPSession(page);
  const point = { x: box.x + box.width / 2 - 9, y: box.y + box.height / 2 - 9 };
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: point.x + 18, y: point.y + 18 }] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('.cycle-word-car').first()).toHaveAttribute('aria-label', 'Letter 1: a');
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

const variants = [
  ['first-sound', round => round.mechanicId === 'pictureSound' && round.soundPosition === 'first'],
  ['ending-sound', round => round.mechanicId === 'pictureSound' && round.soundPosition === 'ending'],
  ['letter-sound', round => round.mechanicId === 'letterMatch' && !round.variant],
  ['case', round => round.variant === 'letterCase'],
  ['heard-word', round => round.variant === 'wordListen'],
  ['rhyme', round => round.mechanicId === 'rhymeMatch'],
  ['spelling', round => round.mechanicId === 'wordBuild' && !round.variant],
  ['copy', round => round.variant === 'highFrequency' && round.targetWord === 'little'],
  ['change', round => round.variant === 'wordChange'],
  ['parts', round => round.variant === 'wordParts'],
  ['baskets', round => round.objects?.length],
  ['beats', round => round.variant === 'syllableSort'],
  ['trace-team', round => round.mechanicId === 'letterTrace' && round.targetGrapheme.length > 1],
];
for (const viewport of [{ width: 1024, height: 768 }, { width: 834, height: 1194 }, { width: 568, height: 320 }]) {
  test(`all variant controls fit at ${viewport.width}x${viewport.height} with physical targets and separation`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(viewport);
    await mkdir('.artifacts/cycles-touch-review/layout', { recursive: true });
    for (const [variant, match] of variants) {
      const cycle = cycles.find(cycle => buildCyclePlan(cycle, seed).rounds.some(match));
      await start(page, cycle, match);
      await ready(page);
      if (variant === 'baskets') {
        const round = buildCyclePlan(cycle, seed).rounds.find(match);
        for (const object of round.objects.slice(0, 2)) {
          await page.locator(`[data-cycle-bin="${object.answer}"]`).tap();
          await ready(page);
        }
      }
      await page.screenshot({ path: `.artifacts/cycles-touch-review/layout/${viewport.width}x${viewport.height}-${variant}.png` });
      const errors = await page.locator('.cycle-practice-page').evaluate(root => {
        const errors = [];
        const frame = root.getBoundingClientRect();
        const controls = [...root.querySelectorAll('button')].filter(button => button.getClientRects().length);
        for (const control of controls) {
          const r = control.getBoundingClientRect(), label = control.getAttribute('aria-label');
          if (r.width < 55.8 || r.height < 55.8) errors.push(`${label}: target ${r.width.toFixed(1)}x${r.height.toFixed(1)}`);
          if ((r.top < Math.max(0, frame.top) - 1 || r.left < Math.max(0, frame.left) - 1 || r.right > Math.min(innerWidth, frame.right) + 1 || r.bottom > Math.min(innerHeight, frame.bottom) + 1)) errors.push(`${label}: outside frame`);
        }
        for (let i = 0; i < controls.length; i++) for (const other of controls.slice(i + 1)) {
          const a = controls[i].getBoundingClientRect(), b = other.getBoundingClientRect();
          const dx = Math.max(b.left - a.right, a.left - b.right, 0), dy = Math.max(b.top - a.bottom, a.top - b.bottom, 0);
          if (Math.hypot(dx, dy) < 7.8) errors.push(`${controls[i].getAttribute('aria-label')} / ${other.getAttribute('aria-label')}: gap ${Math.hypot(dx, dy).toFixed(1)}`);
        }
        const instruction = root.querySelector('.cycle-instruction-row').getBoundingClientRect();
        const instructionFrame = root.querySelector('.cycle-instruction-row').parentElement.getBoundingClientRect();
        if (instruction.top < instructionFrame.top || instruction.bottom > instructionFrame.bottom) errors.push('Instruction clipped');
        const space = root.querySelector('.cycle-activity-space').getBoundingClientRect();
        const status = root.querySelector('.cycle-readiness').getBoundingClientRect();
        if (status.top < space.bottom - 1) errors.push('Status overlaps learning area');
        for (const object of root.querySelectorAll('.cycle-activity-space img, .cycle-sound-sun, .cycle-copy-model, .cycle-trace__pad, .cycle-word-car, .cycle-sort-bin strong')) {
          if (!object.getClientRects().length) continue;
          const r = object.getBoundingClientRect();
          if (r.top < space.top - 1 || r.bottom > space.bottom + 1 || r.left < space.left - 1 || r.right > space.right + 1) errors.push(`${object.className.baseVal || object.className}: learning object clipped`);
        }
        if (root.querySelector('.cycle-playground').scrollTop !== 0) errors.push('Playground scrolled under header');
        return errors;
      });
      expect(errors, `${variant} at ${viewport.width}x${viewport.height}`).toEqual([]);
      for (const control of await page.locator('.cycle-activity-space button').all()) {
        expect(await control.evaluate(button => {
          const rect = button.getBoundingClientRect();
          return button.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
        }), `${variant}: ${await control.getAttribute('aria-label')} reaches the finger`).toBe(true);
      }
      const round = buildCyclePlan(cycle, seed).rounds.find(match);
      await answer(page, variant === 'baskets' ? { ...round, objects: round.objects.slice(2) } : round);
    }
  });
}

test('the full short-landscape letter team accepts continuous released finger strokes without scrolling', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Continuous trusted touch paths use the Chromium input protocol.');
  await page.setViewportSize({ width: 568, height: 320 });
  const match = round => round.mechanicId === 'letterTrace' && round.targetGrapheme.length > 1;
  const cycle = cycles.find(cycle => buildCyclePlan(cycle, seed).rounds.some(match));
  const { round, records } = await start(page, cycle, match);
  await ready(page);
  const strokes = await page.locator('.cycle-trace__pad').evaluate((pad, model) => model.strokes.map(stroke => stroke.points.filter((_, i) => i % 3 === 0 || i === stroke.points.length - 1).map(([x, y]) => {
    const p = new DOMPoint(x, y).matrixTransform(pad.getScreenCTM());
    return { x: p.x, y: p.y };
  })), createCycleTraceModel(round.targetGrapheme));
  const client = await page.context().newCDPSession(page);
  for (const stroke of strokes) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [stroke[0]] });
    for (const point of stroke.slice(1)) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await client.detach();
  await expect.poll(async () => (await records()).length).toBe(1);
  expect((await records())[0].evidence.supportUsed).not.toContain('trace_motor_help');
  expect(await page.locator('.cycle-activity-space').evaluate(space => space.scrollTop)).toBe(0);
});

test('instruction playback is visible and repeated Listen taps cannot restart the pending cue', async ({ page }) => {
  const { records } = await start(page, cycles[0], round => round.mechanicId === 'pictureSound', { duration: 350 });
  await expect(page.locator('.cycle-listen-button')).toHaveAttribute('data-audio-state', 'playing');
  await expect(page.locator('.cycle-listen-button')).toBeDisabled();
  await expect(page.getByRole('status', { name: 'Activity readiness' })).toContainText('Listen');
  await page.locator('.cycle-answer').first().tap({ force: true });
  expect(await records()).toHaveLength(0);
  await ready(page);
});

for (const cycle of cycles) {
  const family = families[(cycle.cycleNumber - 1) % families.length];
  test(`${cycle.id} accepts released touch in ${family} and saves exactly its learning actions`, async ({ page, browserName }) => {
    const { round, records } = await start(page, cycle, round => round.mechanicId === family);
    await ready(page);
    for (const image of await page.locator('.cycle-activity-space img').all()) await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    await answer(page, round, browserName === 'chromium');
    await expect.poll(async () => (await records()).length).toBe(round.objects?.length || 1);
    expect((await records()).every(record => record.correct === true || record.evidence?.objectCorrect === true || record.responseStatus === 'supported' || record.responseStatus === 'correct')).toBe(true);
  });
}
