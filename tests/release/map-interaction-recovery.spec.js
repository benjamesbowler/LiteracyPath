import { expect, test } from '@playwright/test';
const url = '/tests/fixtures/literacy-practice.html';
const saved = page => page.evaluate(() => window.__literacy.session());
const ready = page => expect(page.locator('[data-skills-practice-ready="true"]')).toBeVisible();
async function controlledAudio(page) {
  await page.addInitScript(() => {
    window.__heldCues = [];
    window.Audio = class extends EventTarget {
      constructor() { super(); this.src = ''; this.currentTime = 0; this.readyState = 4; this.paused = true; this.duration = .025; }
      load() { this.dispatchEvent(new Event('canplay')); }
      play() {
        this.paused = false;
        if (sessionStorage.getItem('hold-map-cue')) window.__heldCues.push(this);
        else this.timer = setTimeout(() => this.dispatchEvent(new Event('ended')), 25);
        return Promise.resolve();
      }
      pause() { clearTimeout(this.timer); this.paused = true; }
    };
  });
}
async function seed(page, sourceId, hold = false) {
  await controlledAudio(page); await page.goto(url);
  await page.locator('[data-child-primary-action]').click(); await ready(page);
  await page.getByRole('button', { name: 'Take a break', exact: true }).click();
  const q = await page.evaluate(async ({ sourceId, hold }) => {
    const q = (await window.__literacy.bank()).find(row => row.sourceProvenance?.sourceId === sourceId);
    await window.__literacy.seedQuestion(q.id);
    if (hold) sessionStorage.setItem('hold-map-cue', '1');
    return q;
  }, { sourceId, hold });
  await page.reload(); await page.getByRole('button', { name: 'Carry on', exact: true }).click();
  return q;
}
test('early taps and drags wait for required audio without a saving error or response', async ({ page }) => {
  await seed(page, 'pictures.seed-1', true);
  await expect(page.locator('[data-map-format="order"]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__heldCues.length)).toBeGreaterThan(0);
  const tile = page.getByRole('button', { name: 'Pick picture 1', exact: true });
  const space = page.getByRole('button', { name: 'Place in space 1', exact: true });
  await tile.click(); await space.click();
  const a = await tile.boundingBox(), b = await space.boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 6 }); await page.mouse.up();
  await expect(page.locator('.map-placement-status')).toHaveText('0 of 3 placed.');
  expect((await saved(page)).answers).toHaveLength(0);
  await expect(page.getByRole('button', { name: 'Try saving again', exact: true })).toHaveCount(0);
  await page.evaluate(() => { sessionStorage.removeItem('hold-map-cue'); window.__heldCues.forEach(cue => cue.dispatchEvent(new Event('ended'))); });
  await ready(page); await tile.click(); await space.click();
  await expect(page.getByRole('button', { name: 'Remove from space 1', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Take a break', exact: true }).click();
  await page.reload(); await page.getByRole('button', { name: 'Carry on', exact: true }).click(); await ready(page);
  await expect(page.getByRole('button', { name: 'Remove from space 1', exact: true })).toBeVisible();
  expect((await saved(page)).answers).toHaveLength(0);
});
test('selectable words show one complete sentence and ignore early selection', async ({ page }) => {
  const q = await seed(page, 'mock.text.capital-name', true);
  await expect(page.locator('.map-hot-text')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__heldCues.length)).toBeGreaterThan(0);
  await expect(page.locator('.passage')).toHaveCount(0);
  expect(await page.locator('.map-select-tile').allTextContents()).toEqual(q.passage.split(' '));
  const choice = page.getByRole('button', { name: 'Select word 3: maya', exact: true });
  await choice.click(); expect((await saved(page)).answers).toHaveLength(0);
  await expect(page.getByRole('button', { name: 'Try saving again', exact: true })).toHaveCount(0);
  await page.evaluate(() => { sessionStorage.removeItem('hold-map-cue'); window.__heldCues.forEach(cue => cue.dispatchEvent(new Event('ended'))); });
  await ready(page); await choice.click();
  await expect.poll(async () => (await saved(page)).answers).toEqual([true]);
});
test('required story image failure replaces the question in the same slot without a wrong answer', async ({ page }) => {
  await page.route('**/literacy-interactions/snack-2.webp', route => route.abort());
  const q = await seed(page, 'pictures.snack-1');
  await expect.poll(async () => (await saved(page)).failedQuestionIds?.includes(q.id)).toBe(true); await ready(page);
  const session = await saved(page);
  expect(session.index).toBe(0); expect(session.answers).toHaveLength(0);
  expect(session.responseEpisode.question.id).not.toBe(q.id);
  const steps = await page.evaluate(() => window.__literacy.record().completions.flatMap(event => event.steps));
  expect(steps.some(step => step.questionId === q.id && step.responseStatus === 'media_failed')).toBe(true);
  expect(steps.filter(step => step.responseStatus === 'answered')).toHaveLength(0);
});
