import { expect, test } from '@playwright/test';

const snapshot = page => page.evaluate(() => document.querySelector('.letter-leap').__letterLeapSnapshot());
const coordinates = s => s.bubbles.map(({ x, y, ch }) => ({ x, y, ch }));
async function collectCurrentLetter(page) {
  const original = await snapshot(page);
  const target = original.bubbles.find(b => !b.taken && b.word === original.wordIndex && b.order === original.letterIndex);
  let held = new Set(), jumpUntil = 0;
  for (let tick = 0; tick < 220; tick += 1) {
    const state = await snapshot(page);
    if (state.letterIndex !== original.letterIndex || state.wordIndex !== original.wordIndex) break;
    let dx = target.x - state.player.x;
    if (target.y > state.player.y + 48 && Math.abs(dx) < 40) {
      const support = [...state.platforms,...state.blocks.filter(b=>!b.broken)].find(p => state.player.x >= p.x && state.player.x <= p.x + p.w && Math.abs(state.player.y + 23 - p.y) < 5);
      if (support) dx = support.x + support.w + 45 - state.player.x;
    }
    if (state.player.onGround && tick >= jumpUntil && target.y < state.player.y - 45 && Math.abs(dx) < 130) jumpUntil = tick + 9;
    const next = new Set([...(Math.abs(dx)>13 ? [dx<0?'ArrowLeft':'ArrowRight'] : []), ...(tick<jumpUntil?['ArrowUp']:[])]);
    for (const key of held) if (!next.has(key)) await page.keyboard.up(key);
    for (const key of next) if (!held.has(key)) await page.keyboard.down(key);
    held=next;
    await page.waitForTimeout(40);
  }
  for (const key of held) await page.keyboard.up(key);
  expect((await snapshot(page)).letterIndex).toBe(original.letterIndex + 1);
}

async function openGame(page, difficulty = 'easy') {
  const moduleResponse = page.waitForResponse(response => response.url().includes('/games/LetterLeapGame.jsx') && response.status() === 200);
  await page.goto(`/preview/game-overlay.html?game=letter-leap&difficulty=${difficulty}&sound=0&music=0`, { waitUntil: 'domcontentloaded' });
  expect(await (await moduleResponse).text()).toContain('bounceLetterLeapSpring');
  await page.waitForFunction(() => document.querySelector('.letter-leap')?.__letterLeapSnapshot);
}

test('Letter Leap clears the answered letter bank and springs launch without holding jump', async ({ page }, testInfo) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.addInitScript(() => { Math.random = () => 0.15; });
  await openGame(page);
  const initial = await snapshot(page);
  const target = initial.bubbles.find(b => b.word === 0 && b.order === 0);
  const neighbour = initial.bubbles.find(b => b !== target && b.choiceId === target.choiceId && b.word === -1);
  await collectCurrentLetter(page);
  const collected = await snapshot(page);
  expect(collected.bubbles.find(b => b.x === neighbour.x)).toMatchObject({ x: neighbour.x, y: neighbour.y, taken: true });
  await page.keyboard.down('ArrowLeft');
  await expect.poll(async () => (await snapshot(page)).player.x).toBeLessThan(350);
  await page.keyboard.up('ArrowLeft');
  await expect.poll(async () => { const s = await snapshot(page); return Math.abs(s.player.y + 23 - s.groundY); }).toBeLessThan(1);
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await snapshot(page)).player.springLaunch, { timeout: 12000 }).toBe(true);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(250);
  const launched = await snapshot(page);
  // Polling can observe the top of the arc. Height proves the spring was not
  // cancelled by released jump input, regardless of the sampled velocity.
  expect(launched.player.y + 23).toBeLessThan(launched.groundY - 180);
  expect(coordinates(launched)).toEqual(coordinates(initial));
  await page.screenshot({ path: testInfo.outputPath('spring-launch.png') });
});

test('Letter Leap completes a real keyboard route with jumps, stable letters and continuous word feedback', async ({ page }) => {
  test.setTimeout(360000);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.addInitScript(() => { Math.random = () => 0.85; });
  await openGame(page);
  const original = coordinates(await snapshot(page));
  let keys = new Set();
  const input = async (dir, jump) => {
    const desired = new Set([...(dir < 0 ? ['ArrowLeft'] : dir > 0 ? ['ArrowRight'] : []), ...(jump ? ['ArrowUp'] : [])]);
    for (const key of keys) if (!desired.has(key)) await page.keyboard.up(key);
    for (const key of desired) if (!keys.has(key)) await page.keyboard.down(key);
    keys = desired;
  };
  let jumpUntil = 0, jumps = 0, landings = 0, wasAir = false, movingFeedback = false;
  for (let frame = 0; frame < 4000; frame += 1) {
    const s = await snapshot(page);
    expect(coordinates(s)).toEqual(original);
    if (!s.running) break;
    if (s.wordTransitionT > 0 && s.player.vx > 1) movingFeedback = true;
    if (!s.player.onGround) wasAir = true;
    else if (wasAir) { landings += 1; wasAir = false; }
    const target = s.bubbles.find(b => !b.taken && b.word === s.wordIndex && b.order === s.letterIndex);
    let dx = (target?.x ?? s.flag + 30) - s.player.x;
    if (target && target.y > s.player.y + 48 && Math.abs(dx) < 40) {
      const support = [...s.platforms,...s.blocks.filter(b=>!b.broken)].find(p => s.player.x >= p.x && s.player.x <= p.x + p.w && Math.abs(s.player.y + 23 - p.y) < 5);
      if (support) dx = support.x + support.w + 45 - s.player.x;
    }
    const decoyAhead = s.bubbles.some(b => !b.taken && b.word === -1 && b.decisionWord === s.wordIndex && b.decisionOrder === s.letterIndex && Math.sign(b.x - s.player.x) === Math.sign(dx) && Math.abs(b.x - s.player.x) < 85 && Math.abs(b.x - s.player.x) > 35);
    const foeAhead = s.foes.some(f => Math.sign(f.x - s.player.x) === Math.sign(dx) && Math.abs(f.x - s.player.x) < 120);
    const direction = Math.sign(dx);
    const support = [...s.platforms,...s.blocks.filter(b=>!b.broken)].find(p => s.player.x >= p.x - 12 && s.player.x <= p.x + p.w + 12 && Math.abs(s.player.y + 23 - p.y) < 5);
    const edgeX = support ? (direction > 0 ? support.x + support.w : support.x) : s.player.x;
    const gapAhead = support
      ? Math.abs(edgeX - s.player.x) < 60 && s.pits.some(([a, b]) => edgeX + direction * 35 > a && edgeX + direction * 35 < b)
      : s.pits.some(([a, b]) => s.player.x + direction * 85 > a && s.player.x + direction * 85 < b);
    let jump = frame < jumpUntil;
    if (s.player.onGround && !jump && (gapAhead || decoyAhead || foeAhead || (target && target.y < s.player.y - 50 && Math.abs(dx) < 125))) {
      jumpUntil = frame + 7; jump = true; jumps += 1;
    }
    await input(Math.abs(dx) < 15 ? 0 : Math.sign(dx), jump);
    await page.waitForTimeout(70);
  }
  await input(0, false);
  const end = await snapshot(page);
  expect(end.wordsDone).toBe(5);
  expect(end.running).toBe(false);
  expect(end.player.x).toBeLessThan(end.flag - 100, 'final spelling completes without an extra finish-flag trip');
  expect(jumps).toBeGreaterThan(0);
  expect(landings).toBeGreaterThan(0);
  expect(movingFeedback).toBe(true);
  await expect(page.getByText('Stage complete', { exact: true })).toBeVisible();
});

for (const viewport of [{ width: 390, height: 844 }, { width: 568, height: 320 }]) {
  test(`Letter Leap touch movement, backtracking and leap stay usable at ${viewport.width}`, async ({ page }) => {
    test.setTimeout(45000);
    await page.setViewportSize(viewport);
    await page.addInitScript(() => { Math.random = () => 0.15; });
    await openGame(page);
    const original = await snapshot(page);
    expect(original.running).toBe(true);
    const initialCoordinates = coordinates(original);
    const right = page.locator('[data-ll="right"]');
    const left = page.locator('[data-ll="left"]');
    const jump = page.locator('[data-ll="jump"]');
    const touch = await page.context().newCDPSession(page);
    await touch.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    const press = async control => {
      const box = await control.boundingBox();
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }] });
    };
    const release = () => touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    for (const control of [left, right, jump]) {
      const box = await control.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(56);
      expect(box.height).toBeGreaterThanOrEqual(56);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      await control.click({ trial: true });
    }
    // Use held pointer controls, including an intentional wrong letter. No
    // state mutation: the same contact/collision system serves touch and keys.
    const firstTarget = original.bubbles.find(b => b.word === 0 && b.order === 0);
    await press(right);
    if (firstTarget.y < original.player.y - 45) {
      await expect.poll(async () => (await snapshot(page)).player.x, { intervals:[16] }).toBeGreaterThan(firstTarget.x - 130);
      await release();
      await press(jump);
    }
    await expect.poll(async () => (await snapshot(page)).letterIndex, { timeout: 10000 }).toBeGreaterThan(0);
    const collected = await snapshot(page);
    await release();
    await press(right);
    await page.waitForTimeout(250);
    const continued = await snapshot(page);
    expect(continued.player.x).toBeGreaterThan(collected.player.x + 20);
    await release();
    expect(coordinates(continued)).toEqual(initialCoordinates);
    expect(continued.player.x).toBeGreaterThan(firstTarget.x - 34);
    await press(left);
    await page.waitForTimeout(500);
    await release();
    const back = await snapshot(page);
    expect(back.player.x).toBeLessThan(continued.player.x);
    await press(jump);
    await page.waitForTimeout(150);
    const airborne = await snapshot(page);
    expect(airborne.player.onGround).toBe(false);
    expect(airborne.player.y).toBeLessThan(back.player.y);
    await release();
    expect(coordinates(airborne)).toEqual(initialCoordinates);
  });
}

test('Letter Leap gives one local wrong-contact response and keeps the upper retry route fixed', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.addInitScript(() => { Math.random = () => 0.85; });
  await openGame(page);
  const initial = await snapshot(page);
  const target = initial.bubbles.find(b => b.word === 0 && b.order === 0);
  const decoy = initial.bubbles.find(b => b.word === -1 && b.decisionOrder === 0);
  expect(target.y).toBeLessThan(decoy.y);
  await page.keyboard.down('ArrowRight');
  await expect.poll(async () => (await snapshot(page)).wrongHits).toBe(1);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(1700);
  expect((await snapshot(page)).wrongHits).toBe(1);
  expect(coordinates(await snapshot(page))).toEqual(coordinates(initial));
  const touch = await page.context().newCDPSession(page);
  await touch.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  const box = await page.locator('[data-ll="jump"]').boundingBox();
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }] });
  await page.waitForTimeout(350);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(async () => (await snapshot(page)).letterIndex).toBe(1);
  expect(coordinates(await snapshot(page))).toEqual(coordinates(initial));
});

test('Letter Leap prize boxes respond to a real head bump without completing the word', async ({ page }, testInfo) => {
  await page.setViewportSize({ width:1024,height:768 });
  await openGame(page);
  const initial = await snapshot(page);
  const prize = initial.blocks.find(block=>block.type==='prize');
  expect(prize).toBeTruthy();
  await page.keyboard.down('ArrowRight');
  await expect.poll(async()=> (await snapshot(page)).player.x, {intervals:[16]}).toBeGreaterThan(prize.x + 5);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(120);
  await page.keyboard.down('ArrowUp');
  await expect.poll(async()=> (await snapshot(page)).blocks.find(block=>block.x===prize.x).used).toBe(true);
  await page.keyboard.up('ArrowUp');
  expect((await snapshot(page)).wordsDone).toBe(0);
  await page.screenshot({ path:testInfo.outputPath('prize-box-head-bump.png') });
});
