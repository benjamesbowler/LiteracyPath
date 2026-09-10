import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { measureSkateTravel } from '../../src/components/learn/games/games/spellSkatePark.js';
import { grammarGrindLadder } from '../../src/utils/grammarGrindLevels.js';
test.use({
  screenshot: 'only-on-failure',
  trace: 'off'
});
const out = '.artifacts/spell-skate-upgrade';
test.afterEach(async({page},info)=>{
  if(info.status===info.expectedStatus)return;
  const state=await page.locator('[data-skater-asset]').evaluate(node=>({...node.dataset})).catch(()=>null);
  if(state)fs.writeFileSync(`${out}/${info.title.replace(/[^a-z0-9]/gi,'-').slice(0,100)}-failure-state.json`,JSON.stringify(state,null,2));
});
async function open(page, difficulty = 'easy') {
  const runtimeResponse = page.waitForResponse(response => response.url().includes('/games/GrammarGrindGame.jsx'));
  await page.goto(`/preview/game-overlay.html?game=grammar-grind&difficulty=${difficulty}&sound=0&music=0`);
  const servedRuntime = await (await runtimeResponse).text();
  expect(servedRuntime).toContain('skateFrameSteps(dt)');
  expect(servedRuntime).toContain('Destination steering must not collect a different answer');
  expect(servedRuntime).toMatch(/nextSkateQuality\(qualityTier,\s*average\)/);
  const world = page.locator('[data-skater-asset]');
  await expect(world).toHaveAttribute('data-skater-asset', 'ready', {
    timeout: 20000
  });
  return world;
}
async function skate(page, value, kind = 'part') {
  const button = page.locator(`[data-skate-choice="${kind}"][data-value="${value}"]`);
  await expect(button).toBeVisible();
  // Projected labels follow their physical destination, so dispatch a real pointer
  // at their current centre without waiting for the moving label to become still.
  const box = await button.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator('[data-skater-asset]')).toHaveAttribute('data-skate-destination',value);
}
test('authored skater direct play, jump contact and assisted first spelling', async ({
  page
}) => {
  test.setTimeout(90000);
  fs.mkdirSync(out, {
    recursive: true
  });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const world = await open(page);
  await page.screenshot({
    path: `${out}/authored-park-start.png`
  });
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(350);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.press('Space');
  await expect(world).toHaveAttribute('data-skater-grounded', 'false');
  await page.screenshot({
    path: `${out}/authored-jump.png`
  });
  await expect(world).toHaveAttribute('data-skater-grounded', 'true');
  for (const [i, value] of ['c', 'a', 't'].entries()) {
    await skate(page, value);
    await expect(world).toHaveAttribute('data-spelling-step', String(i + 1), {
      timeout: 20000
    });
  }
  await skate(page, 'cat', 'gate');
  await expect(world).toHaveAttribute('data-skate-level', '1', {
    timeout: 20000
  });
  await page.screenshot({
    path: `${out}/authored-first-word.png`
  });
  await page.reload();
  await page.getByRole('button', {
    name: 'Continue',
    exact: true
  }).click();
  await expect(page.locator('[data-skater-asset]')).toHaveAttribute('data-skate-level', '1');
  await expect(page.locator('[data-skate-choice=part][data-value=s]')).toBeVisible();
  expect(errors).toEqual([]);
});
for (const difficulty of ['easy', 'medium', 'hard']) test(`Spell & Skate ${difficulty} full ten-word physical route`, async ({
  page
}) => {
  test.setTimeout(480000);
  const world = await open(page, difficulty);
  const started = Date.now();
  for (const [index, level] of grammarGrindLadder(difficulty).entries()) {
    await expect(world).toHaveAttribute('data-skate-level', String(index), {
      timeout: 20000
    });
    for (const [step, part] of level.segments.entries()) {
      await skate(page, part);
      await expect(world).toHaveAttribute('data-spelling-step', String(step + 1), {
        timeout: 25000
      });
    }
    await skate(page, level.correct, 'gate');
    fs.writeFileSync(`${out}/${difficulty}-progress.json`, JSON.stringify({
      wordsStarted: index + 1,
      elapsedSeconds: (Date.now() - started) / 1000,
      quality: await world.getAttribute('data-skater-quality'),
      meanFrameMs: await world.getAttribute('data-skater-mean-frame-ms'),
      motorRecoveries: await world.getAttribute('data-motor-recoveries')
    }, null, 2));
  }
  await expect(page.getByRole('alertdialog', {
    name: 'Spell & Skate complete'
  })).toBeVisible({
    timeout: 25000
  });
  const elapsedSeconds = (Date.now() - started) / 1000;
  const travels=JSON.parse(await world.getAttribute('data-skate-travel-log'));
  fs.writeFileSync(`${out}/${difficulty}-travel.json`,JSON.stringify(travels));
  const normalCadenceSeconds=measureSkateTravel(travels);
  expect(normalCadenceSeconds).toBeGreaterThan(120);
  fs.writeFileSync(`${out}/${difficulty}-completed.json`, JSON.stringify({ wordsCompleted: 10, elapsedSeconds, normalCadenceSeconds, activeSimulationSeconds: Number(await world.getAttribute('data-skater-active-seconds')) }, null, 2));
  await page.screenshot({path:`${out}/${difficulty}-complete.png`});
  await expect(page.getByRole('button', { name: 'Next level', exact: true })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Replay level', exact: true })).toBeVisible();
  const next = difficulty === 'easy';
  await page.getByRole('button', { name: next ? 'Next level' : 'Replay level', exact: true }).click();
  const restarted = page.locator('[data-skater-asset]');
  await expect(restarted).toHaveAttribute('data-skate-level', '0');
  await expect(restarted).toHaveAttribute('data-skater-asset', 'ready');
  await expect(page.locator(`[data-skate-choice=part][data-value=${next ? 'h' : grammarGrindLadder(difficulty)[0].segments[0]}]`)).toBeVisible();
});
test('retained authored model recovers from unavailable GLB without blocking play', async ({
  page
}) => {
  await page.route('**/game-assets/spell-skate/spell-skater.glb', route => route.abort());
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const world = await open(page);
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(400);
  await page.keyboard.up('ArrowUp');
  await expect(world).toHaveAttribute('data-skater-state', /coast|push/);
  expect(errors).toEqual([]);
});
test('wrong spelling contact penalises once, preserves work and guide pauses travel', async ({
  page
}) => {
  test.setTimeout(90000);
  const world = await open(page);
  await skate(page, 'c');
  await expect(world).toHaveAttribute('data-spelling-step', '1', {
    timeout: 25000
  });
  const wrong = await page.locator('[data-skate-choice=part]').evaluateAll(ns => ns.find(n => n.dataset.value !== 'a').dataset.value);
  await skate(page, wrong);
  await expect(world).toHaveAttribute('data-language-mistakes', '1', {
    timeout: 25000
  });
  await page.waitForTimeout(1700);
  await expect(world).toHaveAttribute('data-language-mistakes', '1');
  await expect(world).toHaveAttribute('data-spelling-step', '1');
  await skate(page, 'a');
  await page.waitForTimeout(300);
  await page.getByRole('button', {
    name: 'Open Spell & Skate mission guide'
  }).click();
  const position = await world.getAttribute('data-skater-position');
  await page.waitForTimeout(400);
  await expect(world).toHaveAttribute('data-skater-position', position);
  await page.getByRole('button', {
    name: 'Keep playing'
  }).click();
  await expect(world).toHaveAttribute('data-spelling-step', '2', {
    timeout: 25000
  });
});
for (const viewport of [{
  width: 390,
  height: 844
}, {
  width: 844,
  height: 390
}]) test(`touch world controls ${viewport.width}x${viewport.height}`, async ({
  browser
}) => {
  const context = await browser.newContext({
    viewport,
    hasTouch: true,
    baseURL: `http://127.0.0.1:${process.env.LP_PLAYWRIGHT_PORT || 4174}`
  });
  const page = await context.newPage();
  try {
    const world = await open(page);
    await page.screenshot({
      path: `${out}/touch-${viewport.width}x${viewport.height}.png`
    });
    for (const key of ['push', 'brake', 'left', 'right', 'jump']) await expect(page.locator(`[data-gg-btn=${key}]`)).toBeVisible();
    const choices = page.locator('[data-skate-choice=part]');
    await expect(choices).toHaveCount(3);
    for (const button of await page.locator('[data-gg-btn]:visible, [data-skate-choice=part]:visible').all()) {
      const b = await button.boundingBox();
      expect(b).toBeTruthy();
      expect(b.width).toBeGreaterThanOrEqual(55);
      expect(b.height).toBeGreaterThanOrEqual(55);
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(b.y + b.height).toBeLessThanOrEqual(viewport.height + 1);
    }
    const target = page.locator('[data-skate-choice=part][data-value=c]');
    const box = await target.boundingBox();
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await expect(world).toHaveAttribute('data-spelling-step', '1', {
      timeout: 25000
    });
  } finally {
    await context.close();
  }
});
async function poseFixture(page, x, z) {
  // Isolated initial-pose fixture, not evidence of travelling here from spawn.
  // All subsequent movement, collision, animation and scoring are live runtime.
  await page.route('**/games/GrammarGrindGame.jsx*', async route => {
    const response = await route.fetch();
    const body = await response.text();
    const patched = body.replace(/pos: new THREE.Vector3\(0, 0, 24\)/, `pos: new THREE.Vector3(${x}, 0, ${z})`).replace(/player.pos.set\(0, 0, 24\)/, `player.pos.set(${x}, 0, ${z})`);
    expect(patched).not.toBe(body);
    await route.fulfill({response,body:patched});
  });
}
test('native steering rides the authored bowl entrance and remains on its solid surface', async ({
  page
}) => {
  test.setTimeout(30000);
  await poseFixture(page, -51, -3);
  const world = await open(page);
  await page.keyboard.down('ArrowUp');
  await expect.poll(async()=>Number(await world.getAttribute('data-skater-height')),{timeout:10000}).toBeGreaterThan(2);
  await page.keyboard.up('ArrowUp');
  await expect(world).toHaveAttribute('data-skater-grounded', 'true');
  await page.screenshot({
    path: `${out}/ramp-board-contact.png`
  });
});
test('leaving while the authored skin loads disposes the late result', async ({
  page
}) => {
  let release;
  const pending = new Promise(resolve => {
    release = resolve;
  });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/game-assets/spell-skate/spell-skater.glb', async route => {
    await pending;
    await route.continue();
  });
  try {
    await page.goto('/preview/game-overlay.html?game=grammar-grind&difficulty=easy&sound=0&music=0');
    await expect(page.locator('[data-skater-asset]')).toHaveAttribute('data-skater-asset', 'loading');
    await page.getByRole('button', {
      name: 'Close Spell & Skate'
    }).click();
    await page.getByRole('button', {
      name: 'Leave',
      exact: true
    }).click();
    release();
    await expect(page.locator('[data-skater-asset]')).toHaveCount(0);
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  } finally {
    release();
  }
});
test('native jump catches the rail with the authored board and releases safely', async ({
  page
}) => {
  test.setTimeout(30000);
  await poseFixture(page, 0, -44);
  const world = await open(page, 'medium');
  await page.keyboard.down('ArrowUp');
  await page.keyboard.down('Space');
  await expect(world).toHaveAttribute('data-skater-state', 'grind', {
    timeout: 5000
  });
  await page.screenshot({
    path: `${out}/rail-board-contact.png`
  });
  await page.keyboard.up('Space');
  await page.keyboard.up('ArrowUp');
  await expect(world).toHaveAttribute('data-skater-grounded', 'true', {
    timeout: 5000
  });
});

test('medium first word verifies safe navigation and measured frame budget',async({page})=>{
 test.setTimeout(60000);const started=Date.now();const world=await open(page,'medium');
 for(const [index,part] of ['h','a','nd'].entries()){await skate(page,part);await expect(world).toHaveAttribute('data-spelling-step',String(index+1),{timeout:12000});}
 await skate(page,'hand','gate');await expect(world).toHaveAttribute('data-skate-level','1',{timeout:15000});
 const metrics={elapsedSeconds:(Date.now()-started)/1000,quality:await world.getAttribute('data-skater-quality'),meanFrameMs:await world.getAttribute('data-skater-mean-frame-ms'),motorRecoveries:await world.getAttribute('data-motor-recoveries')};
 fs.writeFileSync(`${out}/medium-frame-budget.json`,JSON.stringify(metrics,null,2));await page.screenshot({path:`${out}/medium-park.png`});
 expect(metrics.motorRecoveries).toBe('0');
});
