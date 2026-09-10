import { expect, test } from '@playwright/test';

test('a coupled sentence departs engine-first and its journey freezes while paused', async ({ page }) => {
  await page.goto('/preview/game-overlay.html?game=sentence-express&sound=0&music=0');
  const train = page.locator('.sx-train');
  for (const word of ['I', 'can', 'run']) await page.getByRole('button', { name: `couple ${word}`, exact: true }).click();
  await expect(train.locator('.sx-ghostbox')).toHaveCount(0);
  await page.getByRole('button', { name: /pull whistle/i }).click();
  await expect(page.locator('.sx-motion-out')).toBeVisible();
  const x = () => train.evaluate(node => new DOMMatrix(getComputedStyle(node).transform).m41);
  const before = await x();
  await expect.poll(x).toBeLessThan(before - 10);
  await page.getByRole('button', { name: 'Close Sentence Express', exact: true }).click();
  await page.evaluate(async () => { await Promise.allSettled(document.querySelector('.sx-stage').getAnimations({ subtree: true }).map(animation => animation.ready)); });
  const paused = await x();
  await page.waitForTimeout(1700);
  expect(await x()).toBeCloseTo(paused, 0);
  await expect(page.locator('.sx-stage')).toHaveAttribute('data-phase', 'depart');
  await page.getByRole('button', { name: 'Keep playing', exact: true }).click();
  await expect(page.locator('.sx-stage')).toHaveAttribute('data-phase', 'shunt');
  await expect(page.getByText(/train 2 of 3/)).toBeVisible();
});

const scope = 'literacy-guide-learn-games:fullscreen-overlay-preview';
async function openAt(page, difficulty, level = 0) {
  await page.addInitScript(({ scope, difficulty, level }) => {
    if (sessionStorage.getItem('sx-seeded')) return;
    localStorage.setItem(scope, JSON.stringify({ games: { 'sentence-express': { checkpoints: { [difficulty]: { level, totalLevels: 10 } } } } }));
    sessionStorage.setItem('sx-seeded', '1');
  }, { scope, difficulty, level });
  await page.goto(`/preview/game-overlay.html?game=sentence-express&difficulty=${difficulty}&sound=0&music=0`);
  if (level) await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('.sx-stage')).toBeVisible();
}
async function assemble(page, train) {
  if (train.engine) await page.getByRole('button', { name: `engine ${train.engine.correct}`, exact: true }).click();
  if (train.rusty) await page.locator('.sx-shed').getByRole('button', { name: train.rusty.correct, exact: true }).click();
  if (train.gap) await page.locator('.sx-crates').getByRole('button', { name: train.gap.correct, exact: true }).click();
  for (const word of train.words.slice(train.engine ? 1 : 0)) await page.getByRole('button', { name: `couple ${word}`, exact: true }).first().click();
  if (train.caboose) await page.locator('.sx-cabooserack').getByRole('button', { name: train.endMark, exact: true }).click();
  await expect(page.getByRole('button', { name: /pull whistle/i })).toBeEnabled();
}
import { buildLevel } from '../../src/utils/sentenceExpressLevels.js';
for (const [difficulty, level] of [['easy', 6], ['medium', 4], ['hard', 9], ['hard', 2]]) {
 test(`${difficulty} level ${level + 1} repairs and all three journeys preserve separate repeated-word cars`, async ({ page }) => {
  test.setTimeout(60000); await openAt(page, difficulty, level);
  const trains = buildLevel(difficulty, level).trains;
  for (const train of trains) {
    await expect(page.locator('.sx-stage')).toHaveAttribute('data-train-id', train.id);
    await assemble(page, train);
    await page.getByRole('button', { name: /pull whistle/i }).click();
    await expect(page.locator('.sx-stage')).toHaveAttribute('data-phase', 'depart');
    await expect(page.locator('.sx-stage')).not.toHaveAttribute('data-phase', 'depart');
  }
  await expect(page.locator('.sx-ticket')).toBeVisible();
  await page.getByRole('button', { name: level === 9 ? 'FINISH THE LINE' : /NEXT DEPARTURE/ }).click();
  if (level === 9) {
    await expect.poll(() => page.evaluate(scope => JSON.parse(localStorage.getItem(scope)).games['sentence-express'].plays, scope)).toBe(1);
    const replay = page.getByRole('button',{name:'Replay level',exact:true});
    const next = page.getByRole('button',{name:'Next level',exact:true});
    await expect(next).toBeFocused();
    await expect(page.locator('.lg-game-player-header')).toHaveAttribute('inert','');
    await page.keyboard.press('Tab');await expect(replay).toBeFocused();
    await page.keyboard.press('Shift+Tab');await expect(next).toBeFocused();
    await replay.click();
    await expect(page.locator('.sx-stage')).toHaveAttribute('data-train-id','hard-l0-t0');
    await expect(page.locator('.sx-clock')).toContainText('ON TIME');
    const state=await page.evaluate(scope=>JSON.parse(localStorage.getItem(scope)),scope);
    expect(state.games['sentence-express'].plays).toBe(1);
    expect(state.games['sentence-express'].checkpoints.hard.level).toBe(0);
  }
  else await expect(page.locator('.sx-stage')).toHaveAttribute('data-train-id', `${difficulty}-l${level + 1}-t0`);
 });
}
for (const viewport of [{width:568,height:320},{width:390,height:844},{width:1024,height:768}]) {
 test(`${viewport.width}px full-size controls stay within their allocated work rows`,async({page})=>{
  await page.setViewportSize(viewport); await openAt(page,'hard',9);
  await page.waitForTimeout(1400);
  const bounds=await page.locator('.sx-stage').boundingBox();
  for(const selector of ['.sx-yard','.sx-master','.sx-lever','.sx-workbench']) {
   const box=await page.locator(selector).boundingBox();expect(box.x).toBeGreaterThanOrEqual(bounds.x);expect(box.x+box.width).toBeLessThanOrEqual(bounds.x+bounds.width+1);expect(box.y+box.height).toBeLessThanOrEqual(bounds.y+bounds.height+1);
  }
  for (const box of await page.locator('.sx-yard button').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().toJSON()))) {expect(box.width).toBeGreaterThanOrEqual(56);expect(box.height).toBeGreaterThanOrEqual(56);}
  await assemble(page,buildLevel('hard',9).trains[0]);
  expect(await page.locator(".sx-stage").evaluate(node=>node.scrollLeft)).toBe(0);
  const lever=await page.locator(".sx-lever").boundingBox(); expect(lever.x).toBeGreaterThanOrEqual(0); expect(lever.x+lever.width).toBeLessThanOrEqual(viewport.width);
  await page.screenshot({path:`.artifacts/sentence-express/assembled-${viewport.width}.png`});
 });
}
test('wrong coupling recovers; uncoupling and reload retain the exact partial train without awarding departure twice',async({page})=>{
 await openAt(page,'easy');
 await page.getByRole('button',{name:'couple run',exact:true}).click();
 await expect(page.locator('.sx-hint')).toBeVisible();
 await page.getByRole('button',{name:'couple I',exact:true}).click();
 await page.getByRole('button',{name:'couple can',exact:true}).click();
 await page.getByRole('button',{name:'Uncouple last car',exact:true}).click();
 await expect(page.getByRole('button',{name:'couple can',exact:true})).toBeVisible();
 await page.reload();await expect(page.locator('.sx-train .sx-ghostbox')).toHaveCount(2);
 await expect(page.locator('.sx-clock')).toContainText('+1 min');
 await page.getByRole('button',{name:'couple can',exact:true}).click();
 await page.getByRole('button',{name:'couple run',exact:true}).click();
 await page.getByRole('button',{name:/pull whistle/i}).click();await page.reload();
 await expect(page.getByRole('button',{name:/pull whistle/i})).toBeEnabled();
 await page.getByRole('button',{name:/pull whistle/i}).click();
 await expect(page.locator('.sx-stage')).toHaveAttribute('data-train-id','easy-l0-t1');
 const snapshot=await page.evaluate(()=>JSON.parse(localStorage.getItem('literacy-guide-sentence-express:fullscreen-overlay-preview:easy')));expect(snapshot.express).toBe(0);expect(snapshot.trainIndex).toBe(1);
});

test('the complete easy railway reaches all ten stations, keeps totals through reload, and starts a fresh replay', async ({page})=>{
 test.setTimeout(300000); await openAt(page,'easy');
 for(let level=0;level<10;level++) {
  for(const train of buildLevel('easy',level).trains) {
   await expect(page.locator('.sx-stage')).toHaveAttribute('data-train-id',train.id);
   await assemble(page,train);await page.getByRole('button',{name:/pull whistle/i}).click();
   await expect(page.locator('.sx-stage')).not.toHaveAttribute('data-phase','depart');
  }
  await page.getByRole('button',{name:level===9?'FINISH THE LINE':/NEXT DEPARTURE/}).click();
  if(level===4){await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();}
 }
 await expect.poll(()=>page.evaluate(scope=>JSON.parse(localStorage.getItem(scope)).games['sentence-express'].plays,scope)).toBe(1);
 const result=await page.evaluate(scope=>JSON.parse(localStorage.getItem(scope)).games['sentence-express'],scope);
 expect(result.highScore).toBe(450);
 await page.getByRole('button',{name:'Replay level',exact:true}).click();
 await expect(page.locator('.sx-stage')).toHaveAttribute('data-train-id','easy-l0-t0');
 await expect(page.locator('.sx-train .sx-ghostbox')).toHaveCount(3);
});

test('sound can be silenced during readback without halting travel or leaking stale clips into the next train',async({page})=>{
 await page.addInitScript(()=>{window.sxAudio=[];const Base=window.Audio;window.Audio=class extends Base {constructor(...args){super(...args);window.sxAudio.push(this);}};});
 await page.goto('/preview/game-overlay.html?game=sentence-express&sound=1&music=0');
 await assemble(page,buildLevel('easy',0).trains[0]);await page.getByRole('button',{name:/pull whistle/i}).click();
 await expect(page.locator('.sx-stage')).toHaveAttribute('data-phase','depart');
 await page.getByRole('button',{name:'Turn spoken audio and game sounds off',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>window.sxAudio.filter(a=>!a.paused&&!a.ended).length)).toBe(0);
 await expect(page.locator('.sx-stage')).toHaveAttribute('data-train-id','easy-l0-t1');
 await expect.poll(()=>page.evaluate(()=>window.sxAudio.filter(a=>!a.paused&&!a.ended).length)).toBe(0);
});

test.describe('touch and keyboard railway controls',()=>{
 test.use({hasTouch:true,viewport:{width:568,height:320}});
 test('touch couples immediately and keyboard can undo and restore an individual carriage',async({page})=>{
  await page.goto('/preview/game-overlay.html?game=sentence-express&sound=1&music=0');
  await page.getByRole('button',{name:'couple run',exact:true}).tap();
  await expect(page.locator('.sx-hint')).toBeVisible();
  const bank=await page.locator('.sx-workbench').boundingBox();expect(bank.height).toBeGreaterThanOrEqual(56);
  await page.getByRole('button',{name:'couple I',exact:true}).tap();
  await page.getByRole('button',{name:'couple can',exact:true}).tap();
  await page.getByRole('button',{name:'Uncouple last car',exact:true}).focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('button',{name:'couple can',exact:true})).toBeVisible();
  for(const word of ['can','run']){await page.getByRole('button',{name:`couple ${word}`,exact:true}).focus();await page.keyboard.press('Enter');}
  await expect(page.getByRole('button',{name:/pull whistle/i})).toBeEnabled();
  await page.getByRole('button',{name:/pull whistle/i}).tap();await expect(page.locator('.sx-stage')).toHaveAttribute('data-phase','depart');
 });
});

test('a long rendered-frame gap catches the train and scenery up to arrival without extending travel',async({page})=>{
 await page.goto('/preview/game-overlay.html?game=sentence-express&sound=0&music=0');
 await assemble(page,buildLevel('easy',0).trains[0]);await page.getByRole('button',{name:/pull whistle/i}).click();
 await expect(page.locator('.sx-stage')).toHaveAttribute('data-phase','depart');
 // Simulate a genuinely blocked rendering thread, not a fast-forwarded game.
 // The next callback must use elapsed time and finish the expired journey.
 await page.evaluate(()=>{const start=performance.now();while(performance.now()-start<7100){/* synthetic frame gap */}});
 await expect(page.locator('.sx-stage')).toHaveAttribute('data-train-id','easy-l0-t1',{timeout:1000});
});
