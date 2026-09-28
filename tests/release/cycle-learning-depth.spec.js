import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { elSkillsBlockCycles } from '../../src/data/elSkillsBlockCycles.js';
import { buildCyclePlan, cycleStorageKey } from '../../src/components/cycle-practice/cyclePracticeState.js';
import { CYCLE_ACTIVITY_REVISION, CYCLE_PRACTICE_VERSION } from '../../src/policy/cyclePracticePolicy.js';
import { buildStationRounds } from '../../src/components/elQuest/elQuestEngine.js';

const scope = 'child-surface-preview';
const seed = `${scope}:preview`;
const cycle = elSkillsBlockCycles.find(item => item.cycleNumber === 3);
const plan = buildCyclePlan(cycle, seed).rounds;
const key = cycleStorageKey(scope, 'preview', cycle.id);
test.use({ hasTouch: true });

async function audio(page) {
  await page.addInitScript(() => {
    window.Audio = class extends EventTarget {
      constructor() { super(); this.src = ''; this.currentTime = 0; this.volume = 1; this.readyState = 4; this.paused = true; }
      load() { this.dispatchEvent(new Event('canplay')); }
      removeAttribute(name) { if (name === 'src') this.src = ''; }
      play() { this.paused = false; this.dispatchEvent(new Event('play')); this.timer = setTimeout(() => { this.paused = true; this.dispatchEvent(new Event('ended')); }, 8); return Promise.resolve(); }
      pause() { clearTimeout(this.timer); this.paused = true; }
    };
  });
}

test('Cycle vocabulary picture-name replay remains supported on a correct first response', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await audio(page);
  const index = plan.findIndex(round => round.variant === 'wordMeaning');
  const round = plan[index];
  await page.addInitScript(({ key, index, revision, version }) => localStorage.setItem(key, JSON.stringify({
    version, activityRevision: revision, mode: 'practice', practiceIndex: index,
    assessmentIndex: 0, pass: 0, practiceRecords: [], assessmentRecords: [], attempts: 0,
    earnedCount: 0, paused: false, pendingAttempt: null, result: null,
    attemptId: 'vocabulary-replay', startedAt: '2026-09-28T00:00:00Z',
    clock: { activePracticeSeconds: 0, sessionElapsedSeconds: 0, checkSeconds: 0 }
  })), { key, index, revision: CYCLE_ACTIVITY_REVISION, version: CYCLE_PRACTICE_VERSION });
  await page.goto(`/preview/child-surfaces.html?surface=cycle-practice&cycle=${cycle.id}&motion=reduced`);
  await expect(page.locator('.cycle-listen-button')).toHaveAttribute('data-audio-state', 'ready');
  await page.getByRole('button', { name: `Hear ${round.answer}`, exact: true }).tap();
  const correct = page.getByRole('button', { name: round.answer, exact: true });
  await expect(correct).toBeEnabled();
  await correct.tap();
  await expect.poll(async () => (await saved(page)).practiceIndex).toBe(index + 1);
  const records = (await saved(page)).practiceRecords;
  expect(records).toHaveLength(1);
  expect(records[0].responseStatus).toBe('supported');
  expect(records[0].isCorrect).toBe(null);
  expect(records[0].evidence.supportUsed).toContain('picture_name_replay');
});

test('Map vocabulary picture-name replay is preserved in the completed check snapshot', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 1024, height: 768 });
  await audio(page);
  await page.goto(`/preview/child-surfaces.html?surface=adventure-map&quest=${cycle.id}&station=check&motion=reduced`);
  const view = page.locator('[data-quest-view="round"]');
  await expect(view).toBeVisible();
  const rounds = buildStationRounds(cycle, 'check', { seed: await view.getAttribute('data-run-seed') });
  expect(rounds.some(round => round.variant === 'wordMeaning')).toBe(true);
  for (const [index, round] of rounds.entries()) {
    await expect(page.locator('.adventure-round-frame__counter')).toContainText(`${index + 1} /`);
    await expect(page.getByRole('button', { name: 'Hear instructions again' })).toHaveAttribute('data-audio-state', 'ready');
    if (round.variant === 'wordMeaning') await page.getByRole('button', { name: `Hear ${round.answer}`, exact: true }).tap();
    if (round.mechanicId === 'letterGrid') {
      for (const cell of round.cells.filter(item => item.matches)) await view.locator(`[data-cell-id="${cell.id}"]`).tap();
    } else if (round.mechanicId === 'missingLetter') {
      await view.getByRole('button', { name: round.missingGrapheme, exact: true }).tap();
    } else {
      for (const answer of Array.isArray(round.answer) ? round.answer : [round.answer]) {
        await view.getByRole('button', { name: round.choiceStyle === 'picture' || round.mechanicId === 'sightWordChoice' ? `Choose ${answer}` : answer, exact: true }).tap();
      }
    }
  }
  await expect(page.getByRole('heading', { name: 'Cycle 3 complete!', exact: true })).toBeVisible();
  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('lp-el-quest:child-surface-preview')));
  const records = progress.cycles[cycle.id].lastCheck.questionRecords;
  const meaning = records.filter(record => record.construct === 'spoken_word_picture_matching');
  expect(meaning.length).toBeGreaterThan(0);
  for (const record of meaning) {
    expect(record.attempts).toBe(1);
    expect(record.responseStatus).toBe('supported');
    expect(record.isCorrect).toBe(null);
    expect(record.evidence.supportUsed).toContain('picture_name_replay');
  }
  expect(progress.cycles[cycle.id].lastIndependent).toBeLessThan(rounds.length);
});
async function saveImage(page, name) {
  await mkdir('.artifacts/learning-depth/browser', { recursive: true });
  await page.screenshot({ path: `.artifacts/learning-depth/browser/${name}.png` });
}
async function targetsFit(page, selector) {
  const rects = await page.locator(selector).evaluateAll(elements => elements.map(element => { const r = element.getBoundingClientRect(); return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height }; }));
  expect(rects.length).toBeGreaterThan(1);
  for (const r of rects) { expect(r.width).toBeGreaterThanOrEqual(55.5); expect(r.height).toBeGreaterThanOrEqual(55.5); expect(r.left).toBeGreaterThanOrEqual(0); expect(r.top).toBeGreaterThanOrEqual(0); expect(r.right).toBeLessThanOrEqual(page.viewportSize().width); expect(r.bottom).toBeLessThanOrEqual(page.viewportSize().height); }
  await expect(page.getByRole('button', { name: /check answer|submit|^check$/i })).toHaveCount(0);
}
const saved = page => page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)), key);
for (const viewport of [{ width:1024, height:768 }, { width:768, height:1024 }]) {
  for (const variant of ['initial', 'medial', 'final', 'vocabulary']) test(`${viewport.width}: ${variant} practice keeps support and advances after one correct touch`, async ({ page }) => {
    await page.setViewportSize(viewport); await audio(page);
    const index = plan.findIndex(round => variant === 'vocabulary' ? round.variant === 'wordMeaning' : round.variant === 'wordComplete' && round.missingIndex === ['initial','medial','final'].indexOf(variant));
    expect(index).toBeGreaterThanOrEqual(0); const round = plan[index];
    await page.addInitScript(({key,index,revision,version}) => localStorage.setItem(key,JSON.stringify({version,activityRevision:revision,mode:'practice',practiceIndex:index,assessmentIndex:0,pass:0,practiceRecords:[],assessmentRecords:[],attempts:0,earnedCount:0,paused:false,pendingAttempt:null,result:null,attemptId:'depth-touch',startedAt:'2026-09-28T00:00:00Z',clock:{activePracticeSeconds:0,sessionElapsedSeconds:0,checkSeconds:0}})),{key,index,revision:CYCLE_ACTIVITY_REVISION,version:CYCLE_PRACTICE_VERSION});
    await page.goto(`/preview/child-surfaces.html?surface=cycle-practice&cycle=${cycle.id}&motion=reduced`);
    await expect(page.locator('.cycle-listen-button')).toHaveAttribute('data-audio-state','ready');
    await targetsFit(page,variant === 'vocabulary' ? '.cycle-answer--picture' : '.cycle-letter-block');
    if (variant === 'vocabulary') await expect(page.locator('.cycle-sound-sun')).toHaveCount(0);
    await saveImage(page,`${viewport.width}-${variant}`);
    const target = variant === 'vocabulary' ? round.answer : round.answer[round.missingIndex];
    const wrong = round.choices.find(choice => choice.value !== target);
    const button = value => page.getByRole('button',{name:variant === 'vocabulary' ? value : `Add ${value}`,exact:true});
    await button(wrong.value).tap();
    await expect.poll(async () => (await saved(page)).attempts).toBe(1);
    expect((await saved(page)).practiceIndex).toBe(index);
    await expect(button(target)).toBeEnabled();
    if (variant !== 'vocabulary') for (const [slot, letter] of round.initialLetters.entries()) if (letter) await expect(page.locator('.cycle-word-car').nth(slot)).toHaveAttribute('aria-label',`Letter ${slot+1}: ${letter}`);
    await button(target).tap();
    await expect.poll(async () => (await saved(page)).practiceIndex).toBe(index+1);
    const records = (await saved(page)).practiceRecords;
    expect(records).toHaveLength(2); expect(records[0].activityCompleted).toBe(false); expect(records[1].activityCompleted).toBe(true);
    expect(records[1].responseStatus).toBe('supported'); expect(records[1].isCorrect).toBe(null);
    expect((await saved(page)).earnedCount).toBe(1);
  });
  for (const kind of ['final-sound','cvc-recognition']) test(`${viewport.width}: map ${kind} retains error and automatically advances`, async ({page}) => {
    test.setTimeout(60000); await page.setViewportSize(viewport); await audio(page);
    const station = kind === 'final-sound' ? 'hunt' : 'quick';
    const rounds = buildStationRounds(cycle,station,{seed:`adventure:${cycle.id}:${station}:initial-v3`});
    const index = rounds.findIndex(round => kind === 'final-sound' ? round.variant === 'finalSound' : round.decodableWord);
    expect(index).toBeGreaterThanOrEqual(0);
    await page.goto(`/preview/child-surfaces.html?surface=adventure-map&quest=${cycle.id}&station=${station}&motion=reduced`);
    async function answer(round) {
      if (round.mechanicId === 'wordMemory') {
        for (const word of new Set(round.words)) for (const card of round.cards.filter(card => card.word===word)) await page.locator(`[data-card-id="${card.id}"]`).tap();
      } else await page.getByRole('button',{name:`Choose ${round.answer}`,exact:true}).tap();
    }
    for (let n=0;n<index;n++) {
      await expect(page.locator('.adventure-round-frame__counter')).toContainText(`${n+1} /`);
      await expect(page.getByRole('button',{name:'Hear instructions again'})).toHaveAttribute('data-audio-state','ready');
      await answer(rounds[n]);
    }
    await expect(page.locator('.adventure-round-frame__counter')).toContainText(`${index+1} /`);
    const round=rounds[index];
    await expect(page.getByRole('button',{name:'Hear instructions again'})).toHaveAttribute('data-audio-state','ready');
    await targetsFit(page,kind==='final-sound'?'.am-simple-picture-choice':'.am-word-choice__words button');
    await saveImage(page,`${viewport.width}-${kind}`);
    await page.getByRole('button',{name:`Choose ${round.choices.find(choice=>choice!==round.answer)}`,exact:true}).tap();
    await expect(page.locator('.adventure-round-frame')).toHaveAttribute('data-feedback-tone','retry');
    await expect(page.locator('.adventure-round-frame__counter')).toContainText(`${index+1} /`);
    const right=page.getByRole('button',{name:`Choose ${round.answer}`,exact:true}); await expect(right).toBeEnabled(); await right.tap();
    await expect(page.locator('.adventure-round-frame__counter')).toContainText(`${index+2} /`);
  });
}
