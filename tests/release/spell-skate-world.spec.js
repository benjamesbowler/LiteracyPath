import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { measureSkateTravel } from '../../src/components/learn/games/games/spellSkatePark.js';
import { grammarGrindLadder } from '../../src/utils/grammarGrindLevels.js';
test.use({
  screenshot: 'only-on-failure',
  trace: 'off'
});
const out = '.artifacts/spell-skate-upgrade';
fs.mkdirSync(out,{recursive:true});
const snapshot=page=>page.evaluate(()=>window.__arcadePreviewSnapshot());
async function openGuide(page){await page.getByRole('button',{name:'Open game controls',exact:true}).click();await page.getByRole('button',{name:'Open Spell & Skate mission guide',exact:true}).click();}
async function closeGuide(page){await page.getByRole('button',{name:'Keep playing',exact:true}).click();await expect(page.getByRole('dialog',{name:'Spell & Skate mission guide',exact:true})).toBeHidden();await expect.poll(async()=>(await snapshot(page)).paused).toBe(false);await expect(page.getByRole('button',{name:'Open game controls',exact:true})).toBeVisible();}
test.afterEach(async({page},info)=>{
  if(info.status===info.expectedStatus)return;
  const state=await page.locator('[data-skater-asset]').evaluate(node=>({...node.dataset})).catch(()=>null);
  if(state)fs.writeFileSync(`${out}/${info.title.replace(/[^a-z0-9]/gi,'-').slice(0,100)}-failure-state.json`,JSON.stringify(state,null,2));
});
async function open(page, difficulty = 'easy', sound = false) {
  // Physical-route fixtures use the authored deck. Keep its seed through reloads.
  await page.addInitScript(difficulty => {
    const key = 'literacy-guide-learn-games:fullscreen-overlay-preview';
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({
      games: { 'grammar-grind': { checkpoints: { [difficulty]: { level: 0, totalLevels: 10, sessionSeed: 0 } } } }
    }));
  }, difficulty);
  const runtimeResponse = page.waitForResponse(response => response.url().includes('/games/GrammarGrindGame.jsx'));
  await page.goto(`/preview/game-overlay.html?game=grammar-grind&difficulty=${difficulty}&sound=${sound?1:0}&music=0`);
  // Continue starts the lazy engine import; inspect its response after this real host action.
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  const servedRuntime = await (await runtimeResponse).text();
  expect(servedRuntime).toContain('createSkateFixedStepper');
  expect(servedRuntime).toContain('physicsClock.advance(rawDelta)');
  expect(servedRuntime).toContain('Destination steering must not collect a different answer');
  expect(servedRuntime).toContain('frameTelemetry.rendered');
  const world = page.locator('[data-skater-asset]');
  await expect(world).toHaveAttribute('data-skater-asset', 'ready', {
    timeout: 45000
  });
  await page.waitForFunction(()=>window.__arcadePreviewSnapshot?.()?.assetsLoading===false,null,{timeout:45000});
  await page.waitForFunction(()=>{const state=window.__arcadePreviewSnapshot?.();return state&&!state.graphicsLoading&&state.phase==='playing';},null,{timeout:45000,polling:250});
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
  await expect(page.locator('[data-skate-choice=gate]')).toHaveCount(0);
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
  const world = await open(page, difficulty, true);
  const started = Date.now();
  for (const [index, level] of grammarGrindLadder(difficulty).entries()) {
    await expect(world).toHaveAttribute('data-skate-level', String(index), {
      timeout: 20000
    });
    await page.waitForFunction(()=>{
      const state=window.__arcadePreviewSnapshot?.();
      return state&&!state.assetsLoading&&!state.graphicsLoading&&state.phase==='playing'
        &&state.wordDelivery==='delivered'&&state.picture?.delivery==='delivered';
    },null,{timeout:20000,polling:250});
    for (const [step, part] of level.segments.entries()) {
      await skate(page, part);
      await expect(world).toHaveAttribute('data-spelling-step', String(step + 1), {
        timeout: 25000
      });
    }
    await expect(page.locator('[data-skate-choice=gate]')).toHaveCount(0);
    fs.writeFileSync(`${out}/${difficulty}-progress.json`, JSON.stringify({
      wordsStarted: index + 1,
      elapsedSeconds: (Date.now() - started) / 1000,
      quality: await world.getAttribute('data-skater-quality'),
      performance: (await snapshot(page)).performance,
      motorRecoveries: await world.getAttribute('data-motor-recoveries')
    }, null, 2));
  }
  await expect(page.getByRole('alertdialog', {
    name: 'Spell & Skate complete'
  })).toBeVisible({
    timeout: 25000
  });
  const final=await snapshot(page);
  expect(final.evidence.contentVersion).toBe('grammar-grind-v2');
  expect(final.evidence.construct).toBe('picture-audio-ordered-grapheme-encoding');
  expect(final.evidence.completions).toHaveLength(10);
  expect(final.evidence.firstResponses.every(row=>row.wordVisible===false&&row.practiceOnly===true)).toBe(true);
  expect(final.evidence.firstResponses.every(row=>row.independentPractice===true&&row.stimulusDelivered===true
    &&row.wordAudioReceipt?.source.startsWith('/')&&row.supportReasons.length===0)).toBe(true);
  const immutable=await page.evaluate(()=>JSON.parse(localStorage.getItem('literacy-guide-learn-games:fullscreen-overlay-preview')).games['grammar-grind'].practiceRecord.completions.at(-1));
  expect(immutable.practiceContext.construct).toBe(final.evidence.construct);
  expect(immutable.practiceContext.masteryClaim).toBe(false);
  expect(immutable.steps).toEqual(final.evidence.firstResponses);
  expect(immutable.assistedRetries).toEqual(final.evidence.assistedRetries);
  const elapsedSeconds = (Date.now() - started) / 1000;
  const travels=JSON.parse(await world.getAttribute('data-skate-travel-log'));
  fs.writeFileSync(`${out}/${difficulty}-travel.json`,JSON.stringify(travels));
  const normalCadenceSeconds=measureSkateTravel(travels);
  expect(normalCadenceSeconds).toBeGreaterThan(120);
  fs.writeFileSync(`${out}/${difficulty}-completed.json`, JSON.stringify({ wordsCompleted: 10, elapsedSeconds, normalCadenceSeconds, activeSimulationSeconds: Number(await world.getAttribute('data-skater-active-seconds')) }, null, 2));
  await page.screenshot({path:`${out}/${difficulty}-complete.png`});
  await expect(page.getByRole('button', { name: 'Next trail', exact: true })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Play this again', exact: true })).toBeVisible();
  const next = difficulty === 'easy';
  await page.getByRole('button', { name: next ? 'Next trail' : 'Play this again', exact: true }).click();
  const restarted = page.locator('[data-skater-asset]');
  await expect(restarted).toHaveAttribute('data-skate-level', '0');
  await expect(restarted).toHaveAttribute('data-skater-asset', 'ready');
  const chapter = next ? 1 : 0;
  await expect(page.locator('[data-journey-chapter]')).toHaveAttribute('data-journey-chapter', String(chapter));
  const checkpoint = await page.evaluate(d => JSON.parse(localStorage.getItem('literacy-guide-learn-games:fullscreen-overlay-preview')).games['grammar-grind'].checkpoints[d], difficulty);
  expect(checkpoint.chapter).toBe(chapter);
  const firstPart = grammarGrindLadder(difficulty, checkpoint.sessionSeed, chapter)[0].segments[0];
  await expect(page.locator(`[data-skate-choice=part][data-value="${firstPart}"]`)).toBeVisible();
});
test('retained authored model recovers from unavailable GLB without blocking play', async ({
  page
}) => {
  await page.route('**/game-assets/spell-skate/models/bouncy-skater-v2.glb', route => route.abort());
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
  await openGuide(page);
  await expect.poll(async () => (await snapshot(page)).paused).toBe(true);
  // Dataset telemetry publishes on the next draw; the engine snapshot is current.
  const held = await snapshot(page);
  await page.waitForTimeout(400);
  const after = await snapshot(page);
  expect(after.paused).toBe(true);
  expect(after.position).toEqual(held.position);
  expect(after.activeSeconds).toBe(held.activeSeconds);
  await closeGuide(page);
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
    const touchButtons=page.locator('[data-gg-btn]:visible, [data-skate-choice=part]:visible, [data-gg=hear]:visible');
    for (const button of await touchButtons.all()) {
      const b = await button.boundingBox();
      expect(b).toBeTruthy();
      expect(b.width).toBeGreaterThanOrEqual(56 - .01);
      expect(b.height).toBeGreaterThanOrEqual(56 - .01);
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(b.y + b.height).toBeLessThanOrEqual(viewport.height + 1);
    }
    const rectangles=await touchButtons.evaluateAll(buttons=>buttons.map(button=>{
      const rect=button.getBoundingClientRect(),hit=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);
      return {label:button.getAttribute('aria-label')||button.textContent,rect:rect.toJSON(),reachable:hit===button||button.contains(hit)};
    }));
    for(const button of rectangles)expect(button.reachable,button.label).toBe(true);
    for(let i=0;i<rectangles.length;i++)for(let j=i+1;j<rectangles.length;j++){
      const a=rectangles[i].rect,b=rectangles[j].rect,horizontal=Math.max(a.x-b.right,b.x-a.right),vertical=Math.max(a.y-b.bottom,b.y-a.bottom);
      expect(Math.max(horizontal,vertical),`${rectangles[i].label} / ${rectangles[j].label}: eight-pixel control separation`).toBeGreaterThanOrEqual(8-.01);
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
async function poseFixture(page, x, z, yaw = Math.PI) {
  // Isolated initial-pose fixture, not evidence of travelling here from spawn.
  // All subsequent movement, collision, animation and scoring are live runtime.
  await page.route('**/games/GrammarGrindGame.jsx*', async route => {
    const response = await route.fetch();
    const body = await response.text();
    const patched = body.replace(/pos: new THREE.Vector3\(0, 0, 24\)/, `pos: new THREE.Vector3(${x}, 0, ${z})`).replace(/player.pos.set\(0, 0, 24\)/, `player.pos.set(${x}, 0, ${z})`).replace(/yaw: Math.PI/, `yaw: ${yaw}`).replace(/player.yaw = Math.PI/, `player.yaw = ${yaw}`);
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
  await page.route('**/game-assets/spell-skate/models/bouncy-skater-v2.glb', async route => {
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
 await expect(world).toHaveAttribute('data-skate-level','1',{timeout:15000});
 const metrics={elapsedSeconds:(Date.now()-started)/1000,quality:await world.getAttribute('data-skater-quality'),performance:(await snapshot(page)).performance,motorRecoveries:await world.getAttribute('data-motor-recoveries')};
 fs.writeFileSync(`${out}/medium-frame-budget.json`,JSON.stringify(metrics,null,2));await page.screenshot({path:`${out}/medium-park.png`});
 expect(metrics.motorRecoveries).toBe('0');
});


test('five skate controls build speed and share jump, repeat-air trick and keyboard action', async ({ page }) => {
  test.setTimeout(90000);
  await page.clock.install({ time: new Date('2026-09-29T00:00:00Z') });
  const world = await open(page);
  // Keep real keyboard events and the unchanged animation/physics loop, but
  // advance frames explicitly so assertion/screenshot latency cannot consume
  // the flight on a busy GPU. This checks input transitions, not performance.
  await page.clock.pauseAt(new Date('2026-09-29T01:00:00Z'));
  await expect(page.locator('[data-gg-btn]')).toHaveCount(5);
  await expect(page.getByRole('button', { name: 'Boost', exact: true })).toHaveCount(0);
  await page.keyboard.down('ArrowUp');
  await page.clock.runFor(320);
  await expect.poll(async () => Number(await world.getAttribute('data-skater-speed'))).toBeGreaterThan(12);
  await page.keyboard.up('ArrowUp');
  const jump = page.getByRole('button', { name: 'Jump trick', exact: true });
  await jump.focus();
  await page.keyboard.press('Enter');
  await page.clock.runFor(112);
  await expect(world).toHaveAttribute('data-skater-grounded', 'false');
  await page.keyboard.press('Enter');
  await page.clock.runFor(112);
  await expect(world).toHaveAttribute('data-skater-air-tricks', '1');
  await expect.poll(async () => Number(await world.getAttribute('data-skater-spin'))).toBeGreaterThan(.2);
  await page.keyboard.press('Enter');
  await page.clock.runFor(112);
  await expect(world).toHaveAttribute('data-skater-air-tricks', '2');
  // The extra press must be consumed in a separate frame so it tests the cap,
  // rather than being coalesced with the previous press by the input latch.
  await page.keyboard.press('Enter');
  await page.clock.runFor(112);
  await expect(world).toHaveAttribute('data-skater-air-tricks', '2');
  await page.screenshot({ path: `${out}/context-air-spin.png` });
  await page.clock.runFor(1500);
  await expect(world).toHaveAttribute('data-skater-grounded', 'true', { timeout: 2500 });
  await expect(world).toHaveAttribute('data-skater-air-tricks', '0');
  await expect(world).toHaveAttribute('data-spelling-step', '0');
  // A focused forward button has the same acceleration contract as W/up.
  await page.getByRole('button', { name: 'Move forward', exact: true }).focus();
  await page.keyboard.down('Space');
  await page.clock.runFor(112);
  await expect(world).toHaveAttribute('data-skater-auto-speed', 'true');
  await page.keyboard.up('Space');
  await page.clock.runFor(112);
  await expect(world).toHaveAttribute('data-skater-auto-speed', 'false');
});

test('landing in park furniture releases contact and keeps the next spelling choice playable', async ({ page }) => {
  test.setTimeout(180000);
  fs.mkdirSync(out, { recursive: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: new Date('2026-09-29T00:00:00Z') });
  const world = await open(page);
  await page.clock.pauseAt(new Date('2026-09-29T01:00:00Z'));
  const snapshot = () => page.evaluate(() => window.__arcadePreviewSnapshot());
  const checkpoint = () => page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('literacy-guide-learn-games:fullscreen-overlay-preview'))?.games['grammar-grind']?.checkpoints));
  const initial = await snapshot(), saved = await checkpoint();
  // Drive from the normal spawn and ollie over the bench into its planter.
  // Only time is controlled: keyboard handlers, gravity and collisions are live.
  await page.keyboard.down('ArrowLeft');
  await page.clock.runFor(585);
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.down('ArrowUp');
  await page.clock.runFor(650);
  await page.keyboard.press('Space');
  await page.clock.runFor(112);
  await expect(world).toHaveAttribute('data-skater-grounded', 'false');
  let landing = await snapshot();
  for (let elapsed = 0; landing.landingRecoveries === 0 && elapsed < 1800; elapsed += 32) {
    await page.clock.runFor(32);
    landing = await snapshot();
  }
  await page.keyboard.up('ArrowUp');
  expect(landing.landingRecoveries).toBeGreaterThan(0);
  expect(landing.lastContact.kind).toBe('landing');
  expect(landing.grounded).toBe(true);
  expect(landing.obstacles.some(obstacle => Math.hypot(landing.lastContact.from.x - obstacle.x, landing.lastContact.from.z - obstacle.z) < obstacle.radius + 2.15)).toBe(true);
  expect(landing.obstacles.every(obstacle => Math.hypot(landing.position.x - obstacle.x, landing.position.z - obstacle.z) >= obstacle.radius + 2.15)).toBe(true);
  // Choose immediately, while the separated board is still inside the route
  // planner's wider margin; waiting for coasting would conceal the egress bug.
  await skate(page, 'c');
  expect((await snapshot()).assistRoute.length).toBeGreaterThan(0);
  await page.clock.runFor(512);
  const recovered = await snapshot();
  expect(recovered.stun).toBe(0);
  expect(recovered.motorRecoveries).toBe(landing.motorRecoveries);
  expect(recovered.score).toBe(landing.score);
  expect(recovered.mistakes).toBe(initial.mistakes);
  expect(recovered.lineStep).toBe(initial.lineStep);
  expect(recovered.levelIndex).toBe(initial.levelIndex);
  expect(await checkpoint()).toBe(saved);
  let arrived = await snapshot();
  for (let elapsed = 0; arrived.lineStep === 0 && elapsed < 15000; elapsed += 250) {
    await page.clock.runFor(250);
    arrived = await snapshot();
  }
  expect(Math.hypot(arrived.position.x - recovered.position.x, arrived.position.z - recovered.position.z)).toBeGreaterThan(4);
  expect(arrived.lineStep).toBe(1);
  expect(arrived.mistakes).toBe(initial.mistakes);
  fs.writeFileSync(`${out}/landing-contact-regression.json`, JSON.stringify({ initial, landing, recovered, arrived }, null, 2));
});

for (const side of [1, -1]) test(`park banner is readable from its ${side === 1 ? 'front' : 'back'} approach`, async ({ page }) => {
  const rotation = .04 * Math.PI;
  await poseFixture(page, -31 + Math.sin(rotation) * 8 * side, 28 + Math.cos(rotation) * 8 * side, rotation + (side === 1 ? Math.PI : 0));
  const world = await open(page);
  await expect(world).toHaveAttribute('data-garden-world-state', 'ready');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/readable-banner-${side === 1 ? 'front' : 'back'}.png` });
});


test('unavailable garden scenery keeps spelling and the five skate controls playable', async ({ page }) => {
  await page.route('**/game-assets/sound-racer/venues/*.glb', route => route.abort());
  await page.route('**/game-assets/physical-arcade/rally-pals/*', route => route.abort());
  const world = await open(page);
  await expect(world).toHaveAttribute('data-garden-world-state', 'partial');
  await expect(page.locator('[data-gg-btn]')).toHaveCount(5);
  await skate(page, 'c');
  await expect(world).toHaveAttribute('data-spelling-step', '1', { timeout: 20000 });
});

for(const [difficulty,character] of [['easy','Bouncy'],['medium','Chompy'],['hard','Pip']])test(`${character} selected primary failure retains the actual canonical authored skin and native push`,async({page})=>{
 const model={easy:'bouncy',medium:'chompy',hard:'pip'}[difficulty];
 await page.route(`**/game-assets/spell-skate/models/${model}-skater-v2.glb`,route=>route.abort());
 const world=await open(page,difficulty),initial=await snapshot(page);expect(initial.character.character).toBe(character);expect(initial.character.recoveredAsset).toBe(true);expect(initial.character.clips).toHaveLength(10);
 await page.keyboard.down('ArrowUp');await page.waitForTimeout(400);await page.keyboard.up('ArrowUp');expect((await snapshot(page)).speed).toBeGreaterThan(1);await expect(world).toHaveAttribute('data-skater-state',/coast|push/);
 await page.screenshot({path:`${out}/${model}-selected-primary-recovery.png`});
});

test('recorded word response and two wrong intents survive the held-zero checkpoint without exposing the spelling',async({page})=>{
 test.setTimeout(90000);const world=await open(page,'easy',true);
 await page.waitForFunction(()=>window.__arcadePreviewSnapshot?.()?.wordDelivery==='delivered',null,{timeout:20000});
 const initial=await snapshot(page),labels=await page.locator('[data-skate-choice=part]').allTextContents();
 const target=grammarGrindLadder('easy',initial.evidence.sessionSeed,initial.evidence.journeyIndex)[0];
 expect(initial.evidence.firstResponses).toHaveLength(0);expect((await page.locator('[data-gg=picture]').getAttribute('alt'))).not.toContain(target.audioWord);
 expect(await page.locator('.gg-game-hud').innerText()).not.toMatch(new RegExp(`\\b${target.audioWord}\\b`,'i'));
 const wrong=labels.filter(value=>value!==target.segments[0]);await skate(page,wrong[0]);await expect(world).toHaveAttribute('data-language-mistakes','1');expect(await page.locator('[data-gg=coach]').innerText()).not.toContain('Hint:');
 await skate(page,wrong[1]);await expect(world).toHaveAttribute('data-language-mistakes','2');await expect(page.locator('[data-gg=coach]')).toContainText('Hint:');await expect(page.locator('[data-gg=cue]')).toBeVisible();
 const two=await snapshot(page);expect(two.lineStep).toBe(0);expect(two.evidence.firstResponses).toHaveLength(1);expect(two.evidence.assistedRetries).toHaveLength(1);expect(two.evidence.firstResponses[0].wordAudioReceipt.source).toBe(initial.wordReceipt.source);expect(two.evidence.assistedRetries[0].independentPractice).toBe(false);
 await page.screenshot({path:`${out}/two-wrong-readable-partial-hint.png`});
 await page.getByRole('button',{name:'Open game controls',exact:true}).click();const saved=await snapshot(page);await page.waitForTimeout(300);expect((await snapshot(page)).position).toEqual(saved.position);expect((await snapshot(page)).activeSeconds).toBe(saved.activeSeconds);
 await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();await expect(world).toHaveAttribute('data-skater-asset','ready',{timeout:45000});await page.waitForFunction(()=>window.__arcadePreviewSnapshot?.()?.assetsLoading===false);
 const restored=await snapshot(page);expect(restored.evidence).toEqual(saved.evidence);expect(restored.mistakes).toBe(2);expect(restored.levelIndex).toBe(0);expect(restored.lineStep).toBe(0);expect(restored.supportReasons).toContain('resumed-word-cue');expect(await page.locator('[data-skate-choice=part]').allTextContents()).toEqual(labels);
 await skate(page,target.segments[0]);await expect(world).toHaveAttribute('data-spelling-step','1',{timeout:25000});expect((await snapshot(page)).mistakes).toBe(2);
});
