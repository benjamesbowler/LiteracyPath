import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { buildBurrowMissions, createBurrowWorld, terrainAt, placeBurrowPart } from '../../src/utils/burrowBuildersRules.js';
import { validBurrowWorld } from '../../src/utils/burrowBuildersSession.js';

const snapshot = page => page.evaluate(() => window.__arcadePreviewSnapshot?.());
async function open(page, difficulty = 'easy', sound = false) {
  await page.goto(`/preview/game-overlay.html?game=burrow-builders&difficulty=${difficulty}&sound=${sound ? 1 : 0}&music=0`);
  await expect(page.locator('.burrow-builders').or(page.getByRole('button', { name: 'Continue', exact: true }))).toBeVisible({ timeout: 20000 });
  if (await page.getByRole('button', { name: 'Continue', exact: true }).isVisible()) await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('.burrow-builders')).toBeVisible();
  await expect.poll(async () => (await snapshot(page))?.phase).toBe('ready');
}
const chunk = (page, value) => page.getByRole('button', { name: `Place ${value} block on the blueprint`, exact: true });
async function grid(page, x, z) {
  if (!await page.getByRole('combobox', { name: 'Cell column', exact: true }).isVisible()) await page.getByRole('button', { name: 'Open overhead accessible build view', exact: true }).click();
  await page.getByRole('combobox', { name: 'Cell row', exact: true }).selectOption({ value: String(z) });
  await page.getByRole('combobox', { name: 'Cell column', exact: true }).selectOption({ value: String(x) });
}
async function part(page, name) {
  await page.getByRole('button', { name: 'Choose building piece', exact: true }).click();
  await page.getByRole('dialog', { name: 'Building pieces' }).getByRole('button', { name, exact: true }).click();
}
async function drawerTool(page, name) {
  await page.getByRole('button', { name: 'Choose building piece', exact: true }).click();
  await page.getByRole('button', { name, exact: true }).click();
  await page.getByRole('button', { name: 'Close building choices', exact: true }).click();
}
const undo = page => drawerTool(page, 'Undo this edit');

for (const [name, width, height] of [['phone',320,568], ['short',568,320], ['tablet',1024,768], ['portrait',768,1024], ['desktop',1280,900]]) {
  test(`Burrow ${name}: real world, hidden spelling cue, readable action targets and keyboard/touch movement`, async ({ page }, testInfo) => {
    const errors = []; page.on('pageerror', error => errors.push(error.message)); await page.setViewportSize({ width, height }); await open(page);
    await expect(page.locator('.burrow-builders__world canvas')).toBeVisible();
    const initial = await snapshot(page), mission = buildBurrowMissions('easy', initial.seed, 0)[initial.cursor];
    expect(initial.world.blocks).toHaveLength(3); expect(initial.world.blocks.every(block => block.type === 'bridge' && block.z === 3)).toBe(true);
    expect(initial.evidence.firstResponses).toHaveLength(0); expect(initial.evidence.completions).toHaveLength(0);
    await expect(page.locator('.burrow-builders__tools button')).toHaveCount(1);
    expect(await page.locator('.burrow-builders__cue').innerText()).not.toContain(mission.word);
    await expect(page.getByRole('img', { name: 'Building picture. Hear its word.', exact: true })).toBeVisible();
    await expect(page.locator('.burrow-builders__slots span')).toHaveCount(3);
    const rects = await page.locator('.burrow-builders__controls button:visible,.burrow-builders__utility button:visible,.burrow-builders__rack button:visible').evaluateAll(buttons => buttons.map(button => {
      const rect = button.getBoundingClientRect(), rack = button.closest('.burrow-builders__rack'), clip = rack?.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, bottom: rect.bottom, rack: Boolean(rack), exposed: !clip || rect.x >= clip.x && rect.right <= clip.right && rect.y >= clip.y && rect.bottom <= clip.bottom };
    }));
    for (const rect of rects) { expect(rect.width).toBeGreaterThanOrEqual(56); expect(rect.height).toBeGreaterThanOrEqual(56); if (!rect.rack || rect.exposed) { expect(rect.y).toBeGreaterThanOrEqual(0); expect(rect.bottom).toBeLessThanOrEqual(height + 1); } }
    expect(rects.filter(rect => rect.rack && rect.exposed).length).toBeGreaterThanOrEqual(2);
    const rack = await page.locator('.burrow-builders__rack').boundingBox(); expect(rack.y).toBeGreaterThanOrEqual(0); expect(rack.y + rack.height).toBeLessThanOrEqual(height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect.poll(async () => (await snapshot(page)).rendering.authoredPal).toBe('delivered');
    await page.screenshot({ path: testInfo.outputPath(`${name}-opening.png`) });
    await page.getByRole('button', { name: 'Walk right', exact: true }).click();
    await expect.poll(async () => (await snapshot(page)).world.player.x).toBeGreaterThan(initial.world.player.x);
    await chunk(page, mission.choices.find(c => c !== mission.chunks[0])).focus();
    const before = (await snapshot(page)).world.player.z;
    const input = await page.evaluate(async () => {
      const target = document.activeElement, initialZ = window.__arcadePreviewSnapshot().world.player.z, began = performance.now();
      target.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      while (window.__arcadePreviewSnapshot().world.player.z === initialZ && performance.now() - began < 1500) await new Promise(requestAnimationFrame);
      const stateResponseMs = performance.now() - began;
      await new Promise(requestAnimationFrame);
      const nextAnimationFrameMs = performance.now() - began;
      target.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown', bubbles: true }));
      return { stateResponseMs, nextAnimationFrameMs };
    });
    await expect.poll(async () => (await snapshot(page)).world.player.z).toBeGreaterThan(before);
    await expect.poll(async () => (await snapshot(page)).rendering.frames).toBeGreaterThan(15);
    const measurement = { viewport: { width, height }, input, rendering: (await snapshot(page)).rendering, environment: 'Headless Chromium on this Mac; browser emulation, not physical-device proof' };
    await page.screenshot({ path: testInfo.outputPath(`${name}-world.png`) });
    const metricsPath = testInfo.outputPath(`${name}-frame-input.json`); await fs.writeFile(metricsPath, JSON.stringify(measurement, null, 2));
    await testInfo.attach(`${name}-frame-input`, { path: metricsPath, contentType: 'application/json' }); expect(errors).toEqual([]);
    if (name === 'phone') {
      await page.getByRole('button', { name: 'Enter free building now', exact: true }).click();
      expect((await snapshot(page)).freeBuilding).toBe(true); await page.screenshot({ path: testInfo.outputPath('phone-free-world.png') });
    }
  });
}

test('two wrong placements keep stable choices and accepted chunks; partial help and actual delivery freeze supported repair', async ({ page }) => {
  await open(page, 'medium', true); const initial = await snapshot(page), mission = buildBurrowMissions('medium', initial.seed, 0)[0], wrong = mission.choices.find(c => c !== mission.chunks[0]);
  await expect.poll(async () => (await snapshot(page)).delivery).toBe('delivered');
  await chunk(page, wrong).click(); await expect(page.locator('.burrow-builders__hint')).toHaveCount(0);
  await chunk(page, wrong).click(); await expect(page.locator('.burrow-builders__hint')).toBeVisible();
  expect((await snapshot(page)).choices).toEqual(initial.choices); expect((await snapshot(page)).score).toBe(0);
  await chunk(page, mission.chunks[0]).click(); const repaired = await snapshot(page);
  expect(repaired.chunks).toEqual([mission.chunks[0]]); expect(repaired.evidence.firstResponses[0].correct).toBe(false);
  expect(repaired.evidence.assistedRetries.at(-1).independentPractice).toBe(false); expect(repaired.evidence.assistedRetries.at(-1).modelUsed).toBe(true);
  expect(repaired.evidence.firstResponses[0].deliveryAtResponse).toBe('delivered'); expect(repaired.evidence.firstResponses[0].wordVisible).toBe(false);
});

test('a small-screen touch swipe reveals the remaining grapheme blocks without answering a blueprint', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 }); await open(page);
  const rack = page.locator('.burrow-builders__rack'), bounds = await rack.boundingBox(), client = await page.context().newCDPSession(page);
  const y = Math.round(bounds.y + bounds.height / 2), endX = Math.round(bounds.x + 30), startX = Math.round(bounds.x + bounds.width - 30);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: startX, y }] });
  for (let index = 1; index <= 5; index++) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: Math.round(startX + (endX - startX) * index / 5), y }] });
    await page.waitForTimeout(20);
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => rack.evaluate(element => element.scrollLeft)).toBeGreaterThan(30);
  expect((await snapshot(page)).evidence.firstResponses).toHaveLength(0);
  await page.setViewportSize({ width: 568, height: 320 }); await page.reload(); await page.getByRole('button', { name: 'Continue', exact: true }).click(); await expect(rack).toBeVisible();
  const short = await rack.boundingBox(), x = Math.round(short.x + short.width / 2), fromY = Math.round(short.y + short.height - 15), toY = Math.round(short.y + 15);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: fromY }] });
  for (let index = 1; index <= 5; index++) { await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.round(fromY + (toY - fromY) * index / 5) }] }); await page.waitForTimeout(20); }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => rack.evaluate(element => element.scrollTop)).toBeGreaterThan(20); expect((await snapshot(page)).evidence.firstResponses).toHaveLength(0);
});

test('tapping a visible physical grapheme brick commits that same choice through world ray picking', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 }); await open(page);
  // These are actual visible brick centres from the active renderer, not a
  // reconstructed camera or a response API. The chosen first brick may be
  // correct or incorrect; this checks that the native pointer selects it.
  await expect.poll(async () => (await snapshot(page)).rendering.frames).toBeGreaterThan(20);
  await expect.poll(async () => (await snapshot(page)).rendering.workbenchBricks?.length).toBeGreaterThan(0);
  const initial = await snapshot(page), point = initial.rendering.workbenchBricks.find(brick => brick.chunk === initial.choices[0]), canvas = page.locator('.burrow-builders__world canvas');
  await canvas.click({ position: { x: point.x, y: point.y } });
  await expect.poll(async () => (await snapshot(page)).evidence.firstResponses.length).toBe(1);
  expect((await snapshot(page)).evidence.firstResponses[0].selected).toBe(initial.choices[0]); expect((await snapshot(page)).score).toBe(0);
  await page.screenshot({ path: testInfo.outputPath('world-grapheme-pick.png') });
});

test('an unmuted delivered word cue supports a genuine first correct encoding response', async ({ page }, testInfo) => {
  await open(page, 'easy', true);
  // A real Hear gesture unlocks local browser playback before the first answer.
  await page.getByRole('button', { name: 'Hear the building word again', exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).delivery).toBe('delivered');
  await expect.poll(async () => (await snapshot(page)).pictureDelivery).toBe('delivered');
  const initial = await snapshot(page), mission = buildBurrowMissions('easy', initial.seed, 0)[0];
  await chunk(page, mission.chunks[0]).click();
  const row = (await snapshot(page)).evidence.firstResponses[0];
  expect(row.correct).toBe(true); expect(row.deliveryAtResponse).toBe('delivered'); expect(row.pictureDelivery).toBe('delivered');
  await testInfo.attach('first-response-startup', { body: JSON.stringify({ initial, row }), contentType: 'application/json' });
  expect(row.independentPractice).toBe(true); expect(row.wordVisible).toBe(false); expect(row.practiceOnly).toBe(true);
  const proofPath = testInfo.outputPath('delivered-first-response.json'); await fs.writeFile(proofPath, JSON.stringify(row, null, 2));
  await testInfo.attach('delivered-first-response', { path: proofPath, contentType: 'application/json' });
});

test('delivered audio with an unavailable picture remains supported picture/audio practice', async ({ page }, testInfo) => {
  await page.route(/\/(?:images\/child-mode|media)\/.*\.(?:webp|png|jpe?g)(?:\?.*)?$/, request => request.abort());
  await open(page, 'easy', true); await expect(page.getByText('Picture unavailable', { exact: false })).toBeVisible();
  await expect.poll(async () => (await snapshot(page)).delivery).toBe('delivered');
  await expect.poll(async () => (await snapshot(page)).pictureDelivery).toBe('unavailable');
  const initial = await snapshot(page), mission = buildBurrowMissions('easy', initial.seed, 0)[0]; await chunk(page, mission.chunks[0]).click();
  const response = (await snapshot(page)).evidence.firstResponses[0];
  expect(response.deliveryAtResponse).toBe('delivered'); expect(response.pictureDelivery).toBe('unavailable');
  expect(response.independentPractice).toBe(false); expect(response.supportReasons).toContain('undelivered-picture');
  const proofPath = testInfo.outputPath('unavailable-picture-response.json'); await fs.writeFile(proofPath, JSON.stringify(response, null, 2));
  await testInfo.attach('unavailable-picture-response', { path: proofPath, contentType: 'application/json' });
});

test('action sounds follow real construction and learning while teaching, sound-off, pause and hiding own the mix', async ({ page }, testInfo) => {
  test.setTimeout(75000);
  await page.addInitScript(() => {
    window.__burrowMediaProof = []; window.__burrowMediaElements = [];
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function(...args) {
      const row = { src: this.currentSrc || this.src, result: 'pending' };
      window.__burrowMediaProof.push(row); window.__burrowMediaElements.push(this);
      const result = original.apply(this, args);
      result?.then(() => { row.result = 'started'; }, () => { row.result = 'unavailable'; });
      return result;
    };
  });
  await open(page, 'easy', true); const initial = await snapshot(page), missions = buildBurrowMissions('easy', initial.seed, 0);
  await expect.poll(async () => (await snapshot(page)).delivery).toBe('delivered');
  await page.getByRole('button', { name: 'Hear the building word again', exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).actionAudio.teachingBusy).toBe(true);
  await page.getByRole('button', { name: 'Place selected building piece', exact: true }).click();
  expect((await snapshot(page)).actionAudio.suppressed['teaching-priority']).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Enter free building now', exact: true }).click();
  await grid(page, 3, 5); await page.getByRole('button', { name: 'Place selected building piece', exact: true }).click();
  await page.getByRole('button', { name: 'Pick up selected piece or nearby supplies', exact: true }).click();
  await undo(page);
  let requested = (await snapshot(page)).actionAudio.requested;
  expect(requested.place).toBe(1); expect(requested.pickup).toBe(1); expect(requested.recovery).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__burrowMediaProof.some(row => row.src.endsWith('/audio/ui/whoosh.mp3') && row.result === 'started'))).toBe(true);
  await page.getByRole('button', { name: 'Pause Burrow Builders', exact: true }).click();
  expect(await page.evaluate(() => window.__burrowMediaElements.filter(media => /\/audio\/ui\//.test(media.src)).every(media => media.paused))).toBe(true);
  await page.getByRole('button', { name: 'Resume game', exact: true }).click();
  await page.getByRole('button', { name: 'Open game controls', exact: true }).click();
  await page.getByRole('button', { name: 'Turn spoken audio and game sounds off', exact: true }).click();
  await page.getByRole('button', { name: 'Back to the game', exact: true }).click();
  await page.getByRole('button', { name: 'Place selected building piece', exact: true }).click();
  expect((await snapshot(page)).actionAudio.requested).toEqual(requested);
  expect((await snapshot(page)).actionAudio.suppressed['sound-disabled']).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Open game controls', exact: true }).click();
  await page.getByRole('button', { name: 'Turn spoken audio and game sounds on', exact: true }).click();
  await page.getByRole('button', { name: 'Back to the game', exact: true }).click();
  await page.getByRole('button', { name: 'Return to current blueprint', exact: true }).click();
  await page.getByRole('button', { name: 'Return to world view', exact: true }).click();
  for (const [cursor, mission] of missions.entries()) {
    await expect.poll(async () => (await snapshot(page)).cursor).toBe(cursor);
    await expect.poll(async () => (await snapshot(page)).delivery).toBe('delivered');
    for (const value of mission.chunks) await chunk(page, value).click();
    await expect.poll(async () => (await snapshot(page)).evidence.completions.length).toBe(cursor + 1);
  }
  requested = (await snapshot(page)).actionAudio.requested;
  expect(requested.correct).toBe(12); expect(requested.kit).toBe(5); expect(requested.complete).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__burrowMediaProof.some(row => row.src.endsWith('/audio/ui/complete.mp3') && row.result === 'started'))).toBe(true);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect.poll(async () => (await snapshot(page)).paused).toBe(true);
  expect(await page.evaluate(() => window.__burrowMediaElements.filter(media => /\/audio\/ui\//.test(media.src)).every(media => media.paused))).toBe(true);
  expect((await snapshot(page)).actionAudio.requested).toEqual(requested);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect.poll(async () => (await snapshot(page)).phase).toBe('creative');
  const media = await page.evaluate(() => window.__burrowMediaProof.filter(row => /\/audio\/ui\//.test(row.src)));
  for (const name of ['pop','tap','whoosh','correct','star','complete']) expect(media.some(row => row.src.endsWith(`/audio/ui/${name}.mp3`) && row.result === 'started'), `${name} used an actually started local action recording`).toBe(true);
  const actionAudio = (await snapshot(page)).actionAudio, evidence = (await snapshot(page)).evidence;
  await open(page, 'hard', true); const reading = await snapshot(page), plan = buildBurrowMissions('hard', reading.seed, 0)[0], wrongIndex = plan.choices.findIndex(cell => cell.x !== plan.correct.x || cell.z !== plan.correct.z), wrongCell = plan.choices[wrongIndex];
  await page.getByRole('button', { name: `Build at place ${wrongIndex + 1}, column ${wrongCell.x + 1}, row ${wrongCell.z + 1}`, exact: true }).click();
  expect((await snapshot(page)).actionAudio.requested.retry).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__burrowMediaProof.some(row => row.src.endsWith('/audio/ui/incorrect.mp3') && row.result === 'started'))).toBe(true);
  const readingMedia = await page.evaluate(() => window.__burrowMediaProof.filter(row => /\/audio\/ui\//.test(row.src)));
  const proof = testInfo.outputPath('action-audio-lifecycle.json'); await fs.writeFile(proof, JSON.stringify({ media, actionAudio, evidence, readingRetry: { media: readingMedia, actionAudio: (await snapshot(page)).actionAudio, evidence: (await snapshot(page)).evidence }, environment: 'Actual media play receipts; not human listening proof' }, null, 2)); await testInfo.attach('action-audio-lifecycle', { path: proof, contentType: 'application/json' });
});

test('arbitrary stacks, rotated pieces and a traversable stream crossing are saved, editable and locally undoable without learning points', async ({ page }, testInfo) => {
  await open(page); const initialBlocks = (await snapshot(page)).world.blocks.length; await grid(page, 3, 5); await page.getByRole('button', { name: 'Place selected building piece', exact: true }).click();
  await drawerTool(page, 'Turn carried piece'); await page.getByRole('button', { name: 'Place selected building piece', exact: true }).click();
  let state = await snapshot(page); expect(state.world.blocks.filter(b => b.x === 3 && b.z === 5).map(b => b.y)).toEqual([0, 1]); expect(state.world.blocks.find(b => b.x === 3 && b.z === 5 && b.y === 1).rotation).toBe(1); expect(state.score).toBe(0);
  await part(page, 'Bridge'); await grid(page, 5, 5); await page.getByRole('button', { name: 'Place selected building piece', exact: true }).click();
  state = await snapshot(page); expect(state.world.blocks.some(b => b.type === 'bridge' && b.x === 5)).toBe(true);
  const withBridge = state.world;
  const walkUntil = async (key, axis, limit, greater) => {
    await page.locator('.burrow-builders').focus(); await page.keyboard.down(key);
    try { if (greater) await expect.poll(async () => (await snapshot(page)).world.player[axis], { intervals: [30] }).toBeGreaterThan(limit); else await expect.poll(async () => (await snapshot(page)).world.player[axis], { intervals: [30] }).toBeLessThan(limit); }
    finally { await page.keyboard.up(key); }
  };
  // Native walking goes around the two-storey sculpture and onto the bridge.
  await walkUntil('ArrowUp', 'z', 4.35, false); await walkUntil('ArrowRight', 'x', 3.8, true);
  await walkUntil('ArrowDown', 'z', 4.7, true); await walkUntil('ArrowRight', 'x', 5.1, true);
  const onBridge = (await snapshot(page)).world.player; expect(Math.round(onBridge.x)).toBe(5);
  await undo(page); expect((await snapshot(page)).world.blocks).toHaveLength(initialBlocks + 2);
  const afterUndo = (await snapshot(page)).world; expect(afterUndo.player).toEqual({ x: 2, z: 5 });
  await page.reload(); await page.getByRole('button', { name: 'Continue', exact: true }).click(); await expect(page.locator('.burrow-builders')).toBeVisible();
  expect((await snapshot(page)).world.blocks).toHaveLength(initialBlocks + 2); expect((await snapshot(page)).score).toBe(0);
  expect((await snapshot(page)).world.blocks.find(b => b.x === 3 && b.z === 5 && b.y === 1).rotation).toBe(1);
  const proofPath = testInfo.outputPath('crossing-undo-reload.json'); await fs.writeFile(proofPath, JSON.stringify({ withBridge, onBridge, afterUndo, reloaded: (await snapshot(page)).world, score: 0, input: 'Native arrow keys and named placement/undo controls' }, null, 2));
  await testInfo.attach('crossing-undo-reload', { path: proofPath, contentType: 'application/json' });
});

test('held wrong answer, cue order and three different island builds survive reload in the existing learner scope', async ({ page }) => {
  await open(page); const initial = await snapshot(page), mission = buildBurrowMissions('easy', initial.seed, 0)[0];
  await chunk(page, mission.choices.find(c => c !== mission.chunks[0])).click();
  await page.getByRole('button', { name: 'Place selected building piece', exact: true }).click();
  await page.getByRole('button', { name: 'Choose island or blueprint', exact: true }).click(); await page.getByRole('button', { name: /River Workshop/ }).click();
  await page.getByRole('button', { name: 'Place selected building piece', exact: true }).click();
  await page.reload(); await page.getByRole('button', { name: 'Continue', exact: true }).click(); await expect(page.locator('.burrow-builders')).toBeVisible();
  let state = await snapshot(page); expect(state.islandId).toBe('river'); expect(state.world.blocks).toHaveLength(initial.world.blocks.length + 1); expect(state.choices).toEqual(initial.choices); expect(state.evidence.firstResponses[0].correct).toBe(false);
  expect(state.cursor).toBe(0); expect(state.seed).toBe(initial.seed);
  await page.getByRole('button', { name: 'Choose island or blueprint', exact: true }).click(); await page.getByRole('button', { name: /Meadow Homes/ }).click();
  expect((await snapshot(page)).world.blocks).toHaveLength(initial.world.blocks.length + 1);
  const keys = await page.evaluate(() => Object.keys(localStorage).filter(k => /burrow|world-build|voxel/.test(k))); expect(keys).toEqual([]);
});

test('Free Build is immediately available, preserves the unfinished blueprint and does not charge ordinary materials', async ({ page }) => {
  await open(page); const initial = await snapshot(page), mission = buildBurrowMissions('easy', initial.seed, 0)[0];
  // Inspectors report bounded copies, never controller-owned mutable state.
  await page.evaluate(() => { const view = window.__arcadePreviewSnapshot(); view.world.player.x = 999; view.world.blocks.length = 0; view.evidence.completions.push('forged'); view.choices.length = 0; view.supportReasons.push('forged'); });
  const unmodified = await snapshot(page); expect(unmodified.world.player).toEqual(initial.world.player); expect(unmodified.world.blocks.map(block => ({ ...block, growth: 0 }))).toEqual(initial.world.blocks.map(block => ({ ...block, growth: 0 }))); expect(unmodified.evidence).toEqual(initial.evidence); expect(unmodified.choices).toEqual(initial.choices); expect(unmodified.supportReasons).toEqual(initial.supportReasons);
  await chunk(page, mission.chunks[0]).click(); const held = await snapshot(page);
  await page.getByRole('button', { name: 'Enter free building now', exact: true }).click();
  expect((await snapshot(page)).freeBuilding).toBe(true); await expect(page.locator('.burrow-builders__rack')).toHaveCount(0);
  await page.getByRole('button', { name: 'Place selected building piece', exact: true }).click();
  let state = await snapshot(page); expect(state.world.materials.wood).toBe(held.world.materials.wood); expect(state.evidence).toEqual(held.evidence);
  await page.reload(); await page.getByRole('button', { name: 'Continue', exact: true }).click(); await expect(page.locator('.burrow-builders')).toBeVisible();
  expect((await snapshot(page)).freeBuilding).toBe(true);
  await page.getByRole('button', { name: 'Return to current blueprint', exact: true }).click();
  state = await snapshot(page); expect(state.cursor).toBe(held.cursor); expect(state.chunks).toEqual(held.chunks); expect(state.choices).toEqual(held.choices); expect(state.score).toBe(0);
  expect(state.cursor).toBe(0); expect(state.seed).toBe(initial.seed);
});

test('free building has growing gardens, roof-protected beds and editable water dams/channels with undo', async ({ page }, testInfo) => {
  await open(page); const initialBeds = (await snapshot(page)).shelteredBeds; await page.getByRole('button', { name: 'Enter free building now', exact: true }).click();
  await grid(page, 3, 5); await part(page, 'Garden'); await page.getByRole('button', { name: 'Place selected building piece', exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).world.blocks.find(b => b.type === 'garden' && b.x === 3 && b.z === 5)?.growth).toBeGreaterThan(0);
  await grid(page, 2, 4); await part(page, 'Sleep spot'); await page.getByRole('button', { name: 'Place selected building piece', exact: true }).click();
  expect((await snapshot(page)).shelteredBeds).toBe(initialBeds); await part(page, 'Roof'); await page.getByRole('button', { name: 'Place selected building piece', exact: true }).click();
  expect((await snapshot(page)).shelteredBeds).toBe(initialBeds + 1);
  const originalWater = (await snapshot(page)).wetCells; await grid(page, 4, 5); await part(page, 'Channel'); await page.getByRole('button', { name: 'Place selected building piece', exact: true }).click();
  const channelWater = (await snapshot(page)).wetCells; expect(channelWater).toBeGreaterThan(originalWater);
  await grid(page, 5, 2); await part(page, 'Dam'); await page.getByRole('button', { name: 'Place selected building piece', exact: true }).click();
  const damWater = (await snapshot(page)).wetCells; expect(damWater).toBeLessThan(originalWater);
  await undo(page); const restored = await snapshot(page); expect(restored.wetCells).toBeGreaterThan(originalWater);
  expect((await snapshot(page)).evidence.completions).toHaveLength(0); expect((await snapshot(page)).score).toBe(0);
  await page.getByRole('button', { name: 'Return to world view', exact: true }).click(); await page.screenshot({ path: testInfo.outputPath('garden-roof-water-world.png') });
  const proofPath = testInfo.outputPath('garden-shelter-water-undo.json'); await fs.writeFile(proofPath, JSON.stringify({ originalWater, channelWater, damWater, restoredWater: restored.wetCells, shelteredBeds: restored.shelteredBeds, gardenGrowth: restored.world.blocks.find(block => block.type === 'garden' && block.x === 3 && block.z === 5).growth, world: restored.world, score: restored.score, completions: restored.evidence.completions }, null, 2));
  await testInfo.attach('garden-shelter-water-undo', { path: proofPath, contentType: 'application/json' });
});

test('a substantial valid saved sculpture retains responsive input, editable blocks and bounded world textures', async ({ page }, testInfo) => {
  test.setTimeout(90000);
  let fixture = createBurrowWorld();
  for (let layer = 0; layer < 3 && fixture.blocks.length < 150; layer++) for (let z = 0; z < 11 && fixture.blocks.length < 150; z++) for (let x = 0; x < 11 && fixture.blocks.length < 150; x++) {
    const terrain = terrainAt(x, z); if (!terrain || terrain.water || terrain.scenery) continue;
    fixture = placeBurrowPart(fixture, { type: (x + z) % 6 === 0 ? 'stone' : 'wood', x, z, free: true }).world;
  }
  expect(fixture.blocks).toHaveLength(150); expect(validBurrowWorld(fixture, 'meadow')).toBeTruthy();
  await open(page); await page.getByRole('button', { name: 'Enter free building now', exact: true }).click();
  // Run after the old page's owned unload save, before the new app loads.
  // This injects validated artwork only, leaving seed/answers/evidence untouched.
  await page.addInitScript(world => {
    const key = Object.keys(localStorage).find(candidate => candidate.startsWith('literacy-guide-learn-games:') && JSON.parse(localStorage.getItem(candidate)).games?.['burrow-builders']?.practiceSession?.easy);
    const progress = JSON.parse(localStorage.getItem(key)); progress.games['burrow-builders'].practiceSession.easy.worlds.meadow = world; localStorage.setItem(key, JSON.stringify(progress));
  }, fixture);
  await page.reload(); await page.getByRole('button', { name: 'Continue', exact: true }).click(); await expect(page.locator('.burrow-builders__world canvas')).toBeVisible();
  await expect.poll(async () => (await snapshot(page)).world.blocks.length).toBe(150);
  await expect.poll(async () => (await snapshot(page)).rendering.steadyState.samples, { timeout: 30000 }).toBeGreaterThan(120);
  const initial = await snapshot(page), input = await page.evaluate(async () => {
    const target = document.querySelector('.burrow-builders'), before = window.__arcadePreviewSnapshot().world.player, began = performance.now(); target.focus();
    target.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    while (window.__arcadePreviewSnapshot().world.player.x === before.x && performance.now() - began < 1500) await new Promise(requestAnimationFrame);
    const stateResponseMs = performance.now() - began; await new Promise(requestAnimationFrame); const nextAnimationFrameMs = performance.now() - began;
    target.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true })); return { stateResponseMs, nextAnimationFrameMs };
  });
  await expect.poll(async () => (await snapshot(page)).world.player.x).toBeGreaterThan(initial.world.player.x);
  const layersBefore=(await snapshot(page)).rendering.layerUpdates;
  await grid(page, 3, 9); await page.getByRole('button', { name: 'Place selected building piece', exact: true }).click(); expect((await snapshot(page)).world.blocks).toHaveLength(151);
  await undo(page); expect((await snapshot(page)).world.blocks).toHaveLength(150);
  await page.getByRole('button', { name: 'Return to world view', exact: true }).click();
  if(initial.rendering.renderer==='webgl'){
    const message=await page.locator('.burrow-builders__message').boundingBox();
    await expect.poll(async () => (await snapshot(page)).rendering.palBounds?.y).toBeGreaterThan(message.y+message.height+4);
  }
  await page.screenshot({ path: testInfo.outputPath('substantial-build-world.png') }); const state = await snapshot(page);
  expect(state.rendering.textures).toBeLessThan(25); if (state.rendering.renderer === 'canvas') { expect(state.rendering.projectedObjects).toBeGreaterThanOrEqual(150); expect(state.rendering.cachedDepthBanks).toBe(2); expect(state.rendering.canvasDraws).toBeLessThan(12); expect(state.rendering.assetLoads).toBe(1); } expect(state.score).toBe(0); expect(state.evidence.completions).toHaveLength(0);
  if(state.rendering.renderer!=='canvas'){expect(state.rendering.layerUpdates.scenery).toBe(layersBefore.scenery);expect(state.rendering.layerUpdates.blocks).toBeGreaterThan(layersBefore.blocks);}
  expect(initial.rendering.steadyState.meanFrameMs).toBeLessThan(42); expect(input.nextAnimationFrameMs).toBeLessThan(90);
  const proofPath = testInfo.outputPath('substantial-build-frame-input.json'); await fs.writeFile(proofPath, JSON.stringify({ blockCount: 150, input, rendering: initial.rendering, afterRendering: state.rendering, fixture: 'Valid bounded artwork only; no learning answers injected', environment: 'Headless Chromium on this Mac; not physical-device proof' }, null, 2));
  await testInfo.attach('substantial-build-frame-input', { path: proofPath, contentType: 'application/json' });
});

test('Meadow, Dino and Moonwood have different canonical pals, scenery and independently selectable islands', async ({ browser }, testInfo) => {
  test.setTimeout(60000);
  for (const [difficulty, theme, hero, island] of [['easy','meadow','Bouncy','River Workshop'],['medium','dino','Chompy','Fossil Creek'],['hard','moonwood','Pip','Lantern Brook']]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } }), page = await context.newPage();
    try {
      await open(page, difficulty); await expect(page.locator('.burrow-builders')).toHaveAttribute('data-world-theme', theme);
      const state = await snapshot(page); expect(state.theme).toBe(theme); expect(state.hero).toBe(hero);
      await expect(page.locator('.burrow-builders__world canvas')).toBeVisible();
      await expect.poll(async () => (await snapshot(page)).rendering.frames).toBeGreaterThan(15);
      await page.getByRole('button', { name: 'Choose island or blueprint', exact: true }).click(); await page.getByRole('button', { name: new RegExp(island) }).click();
      expect((await snapshot(page)).islandId).toBe('river'); await page.screenshot({ path: testInfo.outputPath(`${difficulty}-${theme}-world.png`) });
      expect((await snapshot(page)).world.blocks).toHaveLength(3);
      await page.locator('.burrow-builders__world canvas').evaluate(canvas => canvas.dispatchEvent(new Event('webglcontextlost')));
      await expect.poll(async () => (await snapshot(page)).rendering.renderer).toBe('canvas');
      await expect.poll(async () => (await snapshot(page)).rendering.authoredPal).toBe('delivered');
      await page.screenshot({ path: testInfo.outputPath(`${difficulty}-${theme}-canvas-clearing.png`) });
    } finally { await context.close(); }
  }
});

test('short landscape keeps each whole builder and carried piece clear of the picture plan and controls in both renderers', async ({ browser }, testInfo) => {
  test.setTimeout(75000);
  const proof = [];
  for (const difficulty of ['easy', 'medium', 'hard']) {
    const context = await browser.newContext({ viewport: { width: 568, height: 320 } }), page = await context.newPage();
    try {
      await open(page, difficulty);
      if (difficulty === 'hard') await page.getByRole('button', { name: 'Enter free building now', exact: true }).click();
      for (const renderer of ['webgl', 'canvas']) {
        if (renderer === 'canvas') await page.locator('.burrow-builders__world canvas').evaluate(canvas => canvas.dispatchEvent(new Event('webglcontextlost')));
        await expect.poll(async () => (await snapshot(page)).rendering.renderer).toBe(renderer);
        await expect.poll(async () => (await snapshot(page)).rendering.authoredPal).toBe('delivered');
        await expect.poll(async () => (await snapshot(page)).rendering.palActions?.tools).toBe('delivered');
        await page.screenshot({ path: testInfo.outputPath(`${difficulty}-${renderer}-short-opening.png`) });
        await page.keyboard.down('ArrowDown'); await page.waitForTimeout(80); await page.keyboard.up('ArrowDown');
        const state = await snapshot(page), frame = await page.locator('.burrow-builders__world canvas').boundingBox(), pal = state.rendering.palBounds;
        const rects = await page.locator('.burrow-builders__hud,.burrow-builders__message,.burrow-builders__controls button:visible,.burrow-builders__utility button:visible').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { className: node.className, x: r.x, y: r.y, width: r.width, height: r.height }; }));
        expect(pal).toBeTruthy(); expect(pal.y + frame.y).toBeGreaterThanOrEqual(0);
        for (const r of rects) {
          const overlaps = pal.x + frame.x < r.x + r.width && pal.x + frame.x + pal.width > r.x && pal.y + frame.y < r.y + r.height && pal.y + frame.y + pal.height > r.y;
          expect(overlaps, `${difficulty}/${renderer} whole Pal overlaps ${r.className}`).toBe(false);
        }
        expect(state.rendering.workbenchBricks?.every(brick => brick.y > 180)).toBe(true);
        await page.screenshot({ path: testInfo.outputPath(`${difficulty}-${renderer}-short-carry.png`) });
        proof.push({ difficulty, renderer, pal, frame, rects, rendering: state.rendering });
      }
    } finally { await context.close(); }
  }
  const proofPath = testInfo.outputPath('short-builder-coverage.json'); await fs.writeFile(proofPath, JSON.stringify(proof, null, 2));
  await testInfo.attach('short-builder-coverage', { path: proofPath, contentType: 'application/json' });
});

for (const difficulty of ['easy', 'medium', 'hard']) test(`complete ${difficulty} outing automatically crafts six useful kits and leaves unlimited Free Build playable`, async ({ page }, testInfo) => {
  test.setTimeout(65000); await open(page, difficulty); const initial = await snapshot(page), missions = buildBurrowMissions(difficulty, initial.seed, 0);
  for (let i = 0; i < missions.length; i++) {
    await expect.poll(async () => (await snapshot(page)).cursor).toBe(i);
    const mission = missions[i];
    if (difficulty === 'hard') { expect((await snapshot(page)).world.camera).toBe(0); await page.screenshot({ path: testInfo.outputPath(`hard-reading-${mission.id}.png`) }); }
    if (mission.kind === 'spelling') for (const value of mission.chunks) await chunk(page, value).click();
    else { const index = mission.choices.findIndex(c => c.x === mission.correct.x && c.z === mission.correct.z); await page.getByRole('button', { name: `Build at place ${index + 1}, column ${mission.correct.x + 1}, row ${mission.correct.z + 1}`, exact: true }).click(); }
    await expect.poll(async () => (await snapshot(page)).evidence.completions.length).toBe(i + 1);
  }
  await expect.poll(async () => (await snapshot(page)).phase).toBe('creative');
  const completed = await snapshot(page); if (difficulty === 'hard') { expect(completed.evidence.firstResponses.every(row => row.independentPractice && row.construct === 'literal-spatial-reading-comprehension')).toBe(true); } expect(completed.score).toBe(180); expect(completed.evidence.completions).toHaveLength(6); expect(completed.world.blocks.length).toBeGreaterThan(5);
  await expect(page.locator('.burrow-builders__rack')).toHaveCount(0); await expect(page.getByText('Free build', { exact: true })).toBeVisible();
  const wood = completed.world.materials.wood; await grid(page, 3, 9); await part(page, 'Wood'); await page.getByRole('button', { name: 'Place selected building piece', exact: true }).click();
  const after = await snapshot(page); expect(after.world.materials.wood).toBe(wood); expect(after.score).toBe(180); expect(after.evidence.completions).toHaveLength(6);
  await page.getByRole('button', { name: 'Return to world view', exact: true }).click(); await page.screenshot({ path: testInfo.outputPath(`${difficulty}-free-build.png`) });
});

for (const [name, width, height] of [['wide',1280,900], ['short',568,320], ['phone',320,568]]) test(`all six Hard reading plans retain three truthful unobscured world markers on ${name}`, async ({ page }, testInfo) => {
  test.setTimeout(65000); await page.setViewportSize({ width, height }); await open(page, 'hard');
  const initial = await snapshot(page), missions = buildBurrowMissions('hard', initial.seed, 0), measurements = [];
  for (const [cursor, mission] of missions.entries()) {
    await expect.poll(async () => (await snapshot(page)).cursor).toBe(cursor);
    await expect.poll(async () => (await snapshot(page)).rendering.readingPlaces?.filter(place => place.cursor === cursor).length).toBe(3);
    await expect.poll(async () => (await snapshot(page)).rendering.authoredPal).toBe('delivered');
    const state = await snapshot(page), geometry = await page.evaluate(() => {
      const rect = element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
      const selectors = '.burrow-builders__hud,.burrow-builders__message,.burrow-builders__compass,.burrow-builders__rack,.burrow-builders__utility button,.burrow-builders__controls button,.lg-game-title-chip,.lg-game-player-actions>button';
      return { canvas: rect(document.querySelector('.burrow-builders__world canvas')), hud: [...document.querySelectorAll(selectors)].filter(element => element.checkVisibility()).map(element => ({ kind: element.className || element.getAttribute('aria-label'), ...rect(element) })) };
    });
    expect(await page.locator('.burrow-builders__cue strong').innerText()).toBe(mission.instruction);
    expect(await page.locator('.burrow-builders__message').innerText()).not.toMatch(/Hear|picture word|next sound/i);
    expect(state.world.camera).toBe(0);
    const markers = state.rendering.readingPlaces.map(place => ({ ...place, x: place.x + geometry.canvas.x, y: place.y + geometry.canvas.y }));
    for (const marker of markers) {
      expect(marker.diameter).toBeGreaterThanOrEqual(24); expect(marker.fontPx).toBeGreaterThanOrEqual(13);
      expect(marker.cell).toEqual(mission.choices[marker.index - 1]); expect(marker.x - marker.radius).toBeGreaterThanOrEqual(0); expect(marker.x + marker.radius).toBeLessThanOrEqual(width);
      expect(marker.y - marker.radius).toBeGreaterThanOrEqual(0); expect(marker.y + marker.radius).toBeLessThanOrEqual(height);
      for (const hud of geometry.hud) {
        const nearestX = Math.max(hud.x, Math.min(marker.x, hud.right)), nearestY = Math.max(hud.y, Math.min(marker.y, hud.bottom));
        if (marker.shape === 'square') {
          const overlapX = Math.min(marker.x + marker.radius, hud.right) - Math.max(marker.x - marker.radius, hud.x), overlapY = Math.min(marker.y + marker.radius, hud.bottom) - Math.max(marker.y - marker.radius, hud.y);
          expect(overlapX < -1 || overlapY < -1, `${name} ${mission.id} plaque ${marker.index} clear of ${hud.kind}`).toBe(true);
        } else expect(Math.hypot(marker.x - nearestX, marker.y - nearestY), `${name} ${mission.id} marker ${marker.index} clear of ${hud.kind}`).toBeGreaterThan(marker.radius + 1);
      }
    }
    measurements.push({ mission: mission.id, instruction: mission.instruction, renderer: state.rendering.renderer, markers, hud: geometry.hud });
    await page.screenshot({ path: testInfo.outputPath(`${name}-${mission.id}-reading-places.png`) });
    const index = mission.choices.findIndex(c => c.x === mission.correct.x && c.z === mission.correct.z);
    await page.getByRole('button', { name: `Build at place ${index + 1}, column ${mission.correct.x + 1}, row ${mission.correct.z + 1}`, exact: true }).click();
    await expect.poll(async () => (await snapshot(page)).evidence.completions.length).toBe(cursor + 1);
  }
  const proof = testInfo.outputPath(`${name}-all-six-reading-marker-occlusion.json`); await fs.writeFile(proof, JSON.stringify({ viewport: { width, height }, measurements, evidence: (await snapshot(page)).evidence }, null, 2)); await testInfo.attach('actual-reading-marker-occlusion', { path: proof, contentType: 'application/json' });
});

test('pause, hidden tab, pointer release and WebGL loss preserve construction and a functional accessible fallback', async ({ page }) => {
  await open(page); await page.getByRole('button', { name: 'Place selected building piece', exact: true }).click();
  const before = await snapshot(page); await page.getByRole('button', { name: 'Pause Burrow Builders', exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).paused).toBe(true); await page.keyboard.down('ArrowDown'); await page.waitForTimeout(160); await page.keyboard.up('ArrowDown');
  expect((await snapshot(page)).world.player).toEqual(before.world.player); await page.getByRole('button', { name: 'Resume game', exact: true }).click();
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect.poll(async () => (await snapshot(page)).paused).toBe(true);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect.poll(async () => (await snapshot(page)).paused).toBe(false);
  await page.locator('.burrow-builders__world canvas').evaluate(canvas => canvas.dispatchEvent(new Event('webglcontextlost')));
  await expect.poll(async () => (await snapshot(page)).rendering.renderer).toBe('canvas'); await expect(page.locator('canvas[data-renderer="authored-canvas"]')).toBeVisible(); expect((await snapshot(page)).fallback).toBe(true); await expect(page.locator('.burrow-builders__map')).toHaveCount(0);
  await grid(page, 3, 8); await page.getByRole('button', { name: 'Place selected building piece', exact: true }).click(); expect((await snapshot(page)).world.blocks).toHaveLength(before.world.blocks.length + 1);
});

test('failed picture and audio remain uncued and supported, while failed local saves remain recoverable', async ({ page }) => {
  await page.route(/\/(?:audio\/production\/.*\.(?:mp3|wav|ogg|m4a)|(?:images\/child-mode|media)\/.*\.(?:webp|png|jpe?g))(?:\?.*)?$/, request => request.abort());
  await open(page, 'easy', true); await expect(page.getByText('Picture unavailable', { exact: false })).toBeVisible();
  await expect.poll(async () => (await snapshot(page)).delivery).toBe('unavailable');
  const initial = await snapshot(page), mission = buildBurrowMissions('easy', initial.seed, 0)[0]; expect(await page.locator('.burrow-builders__cue').innerText()).not.toContain(mission.word);
  await page.evaluate(() => { window.__burrowOriginalSet = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key.startsWith('literacy-guide-learn-games:')) throw new Error('quota'); return window.__burrowOriginalSet.call(this, key, value); }; });
  await chunk(page, mission.chunks[0]).click(); await expect(page.getByRole('button', { name: 'Try saving again', exact: true })).toBeVisible();
  expect((await snapshot(page)).chunks).toEqual([mission.chunks[0]]); expect((await snapshot(page)).evidence.firstResponses[0].independentPractice).toBe(false);
  await page.evaluate(() => { Storage.prototype.setItem = window.__burrowOriginalSet; }); await page.getByRole('button', { name: 'Try saving again', exact: true }).click();
  await expect.poll(async () => (await snapshot(page)).saveError).toBe(false);
});
