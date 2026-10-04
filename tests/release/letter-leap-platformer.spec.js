import fs from 'node:fs';
import { expect, test } from '@playwright/test';
import { approachLeapGroundFoe, driveLeap } from './letterLeapNative.js';

test.use({ trace: 'off' });

const snapshot = page => page.evaluate(() => document.querySelector('.letter-leap').__letterLeapSnapshot());
const coordinates = s => s.bubbles.map(({ x, y, ch }) => ({ x, y, ch }));
async function collectCurrentLetter(page) {
  const original = await snapshot(page);
  await driveLeap(page, { timeout: 18000, until: state => state.letterIndex !== original.letterIndex || state.wordIndex !== original.wordIndex });
  expect((await snapshot(page)).letterIndex).toBe(original.letterIndex + 1);
}

async function openGame(page, difficulty = 'easy', seed = 3) {
  await page.addInitScript(({ difficulty, seed }) => {
    const key = 'literacy-guide-learn-games:fullscreen-overlay-preview';
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ games: {
      'letter-leap': { checkpoints: { [difficulty]: { level: 0, totalLevels: 10, sessionSeed: seed, chapter: 0 } } }
    } }));
  }, { difficulty, seed });
  const moduleResponse = page.waitForResponse(response => response.url().includes('/games/LetterLeapGame.jsx') && response.status() === 200);
  await page.goto(`/preview/game-overlay.html?game=letter-leap&difficulty=${difficulty}&sound=0&music=0`, { waitUntil: 'domcontentloaded' });
  // The host deliberately imports the engine only after the resume gate.
  // Waiting for that chunk before Continue deadlocks an otherwise ready UI.
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  expect(await (await moduleResponse).text()).toContain('bounceLetterLeapSpring');
  await page.waitForFunction(() => document.querySelector('.letter-leap')?.__letterLeapSnapshot);
}

test('Letter Leap collects one object, preserves its neighbour and springs launch without holding jump', async ({ page }, testInfo) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1024, height: 768 });
  await openGame(page);
  const initial = await snapshot(page);
  const target = initial.bubbles.find(b => b.word === 0 && b.order === 0);
  const neighbour = initial.bubbles.find(b => b !== target && b.choiceId === target.choiceId && b.word === -1);
  await collectCurrentLetter(page);
  const collected = await snapshot(page);
  expect(collected.bubbles.find(b => b.x === neighbour.x)).toMatchObject({ x: neighbour.x, y: neighbour.y, taken: false });
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

test('Letter Leap missed and obsolete pickups stay visible, then current and old paired saves preserve genuine evidence', async ({ page, browser }, testInfo) => {
  test.setTimeout(65000);
  const key='literacy-guide-learn-games:fullscreen-overlay-preview';
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:1280,height:900});
  await openGame(page,'easy',3);
  await expect.poll(async()=>(await snapshot(page)).learning.cue.pictureDelivery).toBe('delivered');
  const initial=await snapshot(page),target=initial.bubbles.find(b=>b.word===0&&b.order===0);
  const neighbour=initial.bubbles.find(b=>b.word===-1&&b.choiceId===target.choiceId);
  const geometry={bubbles:coordinates(initial),blocks:initial.blocks,sections:initial.sections,pits:initial.pits};
  expect(target.y).toBeGreaterThan(neighbour.y);
  await page.keyboard.down('ArrowRight');
  await expect.poll(async()=>(await snapshot(page)).player.x,{intervals:[16]}).toBeGreaterThan(target.x-145);
  await page.keyboard.down('ArrowUp');
  await expect.poll(async()=>(await snapshot(page)).player.x,{intervals:[16]}).toBeGreaterThan(target.x+50);
  await page.keyboard.up('ArrowUp');await page.keyboard.up('ArrowRight');
  const missed=await snapshot(page);
  expect(missed.letterIndex).toBe(0);expect(missed.wrongHits).toBe(0);
  expect(missed.bubbles.every(b=>!b.taken)).toBe(true);expect(coordinates(missed)).toEqual(geometry.bubbles);
  await page.screenshot({path:testInfo.outputPath('missed-pickup-stays-in-place.png')});
  await collectCurrentLetter(page);
  const collected=await snapshot(page),old=collected.bubbles.find(b=>b.x===neighbour.x);
  expect(collected.bubbles.filter(b=>b.taken)).toHaveLength(1);
  expect(old).toMatchObject({x:neighbour.x,y:neighbour.y,taken:false,display:'inactive'});
  const evidence=structuredClone(collected.learning),beforeWrong=collected.wrongHits;
  await page.keyboard.down('ArrowRight');
  await expect.poll(async()=>(await snapshot(page)).player.x,{intervals:[16]}).toBeGreaterThan(neighbour.x-12);
  await page.keyboard.up('ArrowRight');await page.waitForTimeout(180);
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(({x,y})=>{const p=document.querySelector('.letter-leap').__letterLeapMotion().player;return Math.abs(p.x-x)<34&&Math.abs(p.y-y)<42;},neighbour,{timeout:2000});
  await page.keyboard.up('ArrowUp');
  const stale=await snapshot(page);
  expect(Math.abs(stale.player.x-neighbour.x)).toBeLessThan(34);
  expect(stale.letterIndex).toBe(1);expect(stale.wrongHits).toBe(beforeWrong);
  for(const field of ['firstResponses','assistedRetries','acceptedResponses','completions'])expect(stale.learning[field]).toEqual(evidence[field]);
  expect(coordinates(stale)).toEqual(geometry.bubbles);expect(stale.blocks).toEqual(geometry.blocks);
  expect(stale.sections).toEqual(geometry.sections);expect(stale.pits).toEqual(geometry.pits);
  await page.screenshot({path:testInfo.outputPath('uncollected-neighbour-native-jump-no-response.png')});
  await page.getByRole('button',{name:'Open game controls',exact:true}).click();
  const actualRaw=await page.evaluate(key=>localStorage.getItem(key),key);
  fs.writeFileSync(testInfo.outputPath('actual-native-prefix-save.json'),actualRaw);
  const actual=JSON.parse(actualRaw),held=actual.games['letter-leap'].practiceSession.easy;
  expect(held.slot).toBe(1);expect(held.evidence.acceptedResponses).toEqual(evidence.acceptedResponses);
  await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.letter-leap')?.__letterLeapSnapshot?.().letterIndex===1);
  const resumed=await snapshot(page);
  for(const field of ['firstResponses','assistedRetries','acceptedResponses','completions'])expect(resumed.learning[field]).toEqual(evidence[field]);
  expect(resumed.bubbles.map(({x,y,ch,taken,display})=>({x,y,ch,taken,display}))).toEqual(stale.bubbles.map(({x,y,ch,taken,display})=>({x,y,ch,taken,display})));
  await page.screenshot({path:testInfo.outputPath('current-one-pickup-save-restored.png')});
  // A migration fixture changes only the old representation's neighbour flag.
  // Its genuine native response/evidence/world positions remain byte-for-byte
  // values from this run; it invents no answer, completion or earlier progress.
  const oldPair=structuredClone(actual);
  oldPair.games['letter-leap'].practiceSession.easy.world.level.bubbles.find(b=>b.x===neighbour.x).taken=true;
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  try {
    const legacy=await context.newPage();
    legacy.on('pageerror',error=>errors.push(error.message));
    await legacy.addInitScript(({key,value})=>{if(!localStorage.getItem(key))localStorage.setItem(key,value);},{key,value:JSON.stringify(oldPair)});
    await legacy.goto('/preview/game-overlay.html?game=letter-leap&difficulty=easy&sound=0&music=0');
    await legacy.getByRole('button',{name:'Continue',exact:true}).click();
    await legacy.waitForFunction(()=>document.querySelector('.letter-leap')?.__letterLeapSnapshot?.().letterIndex===1);
    const restored=await snapshot(legacy);
    expect(restored.bubbles.find(b=>b.x===neighbour.x)).toMatchObject({taken:false,display:'inactive'});
    expect(restored.bubbles.filter(b=>b.taken)).toHaveLength(1);expect(coordinates(restored)).toEqual(geometry.bubbles);
    for(const field of ['firstResponses','assistedRetries','acceptedResponses','completions'])expect(restored.learning[field]).toEqual(evidence[field]);
    await legacy.screenshot({path:testInfo.outputPath('old-paired-save-neighbour-restored-no-new-evidence.png')});
    expect(errors).toEqual([]);
    fs.writeFileSync(testInfo.outputPath('proof.json'),JSON.stringify({missed:{letterIndex:missed.letterIndex,wrongHits:missed.wrongHits},stale:{player:stale.player,neighbour:old,letterIndex:stale.letterIndex,wrongHits:stale.wrongHits},acceptedResponses:evidence.acceptedResponses,currentReload:true,oldPairNormalized:true,unchangedGeometry:true,errors},null,2));
  }finally{await context.close();}
});

test('Letter Leap completes a real keyboard route with jumps, stable letters and continuous word feedback', async ({ page }) => {
  test.setTimeout(360000);
  await page.setViewportSize({ width: 1024, height: 768 });
  await openGame(page);
  const original = coordinates(await snapshot(page));
  let checkedWords = -1;
  const { metrics } = await driveLeap(page, { timeout: 300000,
    until: state => state.stageIndex === 0 && state.wordIndex === 4 && state.phase === 'word-result',
    onCheckpoint: async state => {
      if (state.stageIndex !== 0 || state.wordsDone === checkedWords) return;
      checkedWords = state.wordsDone;
      expect(coordinates(await snapshot(page))).toEqual(original);
    } });
  const end = await snapshot(page);
  expect(end.wordsDone).toBe(5);
  expect(end.learning.phase).toBe('word-result');
  expect(end.running).toBe(true);
  expect(end.player.x).toBeLessThan(end.flag - 100, 'final spelling completes without an extra finish-flag trip');
  expect(metrics.jumps).toBeGreaterThan(0);
  expect(metrics.landings).toBeGreaterThan(0);
  expect(metrics.movingFeedback).toBe(true);
  await expect.poll(async () => (await snapshot(page)).stageIndex, { timeout: 10000 }).toBe(1);
  await expect(page.getByRole('button', { name: /Next stage/i })).toHaveCount(0);
});

for (const viewport of [{ width: 390, height: 844 }, { width: 568, height: 320 }]) {
  test(`Letter Leap touch movement, backtracking and leap stay usable at ${viewport.width}`, async ({ page }) => {
    test.setTimeout(45000);
    await page.setViewportSize(viewport);
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
  await openGame(page, 'easy', 1);
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

test('Letter Leap real ground-foe collision uses authored bump and recovery without reading credit', async ({ page }, testInfo) => {
  test.setTimeout(35000);
  await page.setViewportSize({ width: 1280, height: 800 });
  await openGame(page);
  await page.waitForFunction(() => Object.values(document.querySelector('.letter-leap').__letterLeapSnapshot().authoredArt.delivery.hero)
    .every(value => value === 'delivered'));
  const initial = await snapshot(page);
  const livesBefore = await page.locator('[data-ll="hearts"]').innerText();
  await approachLeapGroundFoe(page);
  await expect.poll(async () => (await snapshot(page)).authoredArt.hero.action, { intervals: [20], timeout: 1000 }).toBe('bump');
  const bumped = await snapshot(page);
  expect(bumped.learning.motorEvents.foeHits).toBe(1);
  expect(bumped.learning.completions).toEqual(initial.learning.completions);
  expect(bumped.wrongHits).toBe(initial.wrongHits);
  const livesAfter = await page.locator('[data-ll="hearts"]').innerText();
  expect([...livesBefore].filter(value => value === '❤').length - [...livesAfter].filter(value => value === '❤').length).toBe(1);
  await page.screenshot({ path: testInfo.outputPath('native-foe-bump.png') });
  await expect.poll(async () => (await snapshot(page)).authoredArt.hero.action, { intervals: [20], timeout: 1000 }).toBe('recover');
  await page.screenshot({ path: testInfo.outputPath('native-foe-recover.png') });
});
