import { test, expect } from '@playwright/test';
import { openClimb, retainClimbBoundary } from './word-climb-input.js';
test.use({trace:'off'});
const readClimbSnapshot=page=>page.evaluate(()=>window.__arcadePreviewSnapshot({motionOnly:true}));

test('Word Climb native short tap, ascent and pause keep scene and semantic projection together',async({page},info)=>{
  test.setTimeout(45000);await page.setViewportSize({width:1024,height:768});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await openClimb(page);
  await page.locator('.lg-game-player-main').focus();const initial=await readClimbSnapshot(page);
  await page.keyboard.press('ArrowUp');await expect.poll(async()=>(await readClimbSnapshot(page)).world.y).toBeGreaterThan(initial.world.y);
  await page.keyboard.down('ArrowUp');await expect.poll(async()=>(await readClimbSnapshot(page)).world.y,{timeout:10000}).toBeGreaterThan(initial.world.y+30);await page.keyboard.up('ArrowUp');
  const climbed=await readClimbSnapshot(page);expect(climbed.world.y).toBeGreaterThan(initial.world.y+30);
  await page.keyboard.press('Escape');await page.getByRole('heading',{name:'Leave this game?'}).waitFor();
  await page.waitForTimeout(80);const paused=await readClimbSnapshot(page);await page.waitForTimeout(150);
  expect((await readClimbSnapshot(page)).world.y).toBe(paused.world.y);
  await page.getByRole('button',{name:'Keep playing',exact:true}).click();
  await page.waitForTimeout(80);const resumed=await readClimbSnapshot(page);
  expect(resumed.world.y).toBe(paused.world.y);expect(resumed.presentation.y).toBe(resumed.world.y);
  await retainClimbBoundary(page,info);expect(errors).toEqual([]);
});

test('Word Bridge native short nudge, held walking and pause retain builder and camera registration',async({page},info)=>{
  test.setTimeout(45000);await page.setViewportSize({width:1024,height:768});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/preview/game-overlay.html?game=word-bridge&difficulty=easy&sound=0&music=0&review=clear-start');
  await page.waitForFunction(()=>document.querySelector('.word-bridge-world')?.bridgeSnapshot);
  const snapshot=()=>page.locator('.word-bridge-world').evaluate(el=>el.bridgeSnapshot());
  const start=page.getByRole('button',{name:/start building|let.*build|build.*bridge|start/i});
  if(await start.count()===1&&await start.isVisible())await start.click();
  await expect.poll(async()=>(await snapshot()).phase).toBe('PLAYING');
  const initial=await snapshot();await page.keyboard.press('ArrowRight');
  await expect.poll(async()=>(await snapshot()).builder.x).toBeGreaterThan(initial.builder.x);
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(300);await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(100);const moved=await snapshot();expect(moved.builder.x).toBeGreaterThan(initial.builder.x+30);
  await page.keyboard.press('Escape');await page.getByRole('heading',{name:'Leave this game?'}).waitFor();
  await page.waitForTimeout(80);const paused=await snapshot();await page.waitForTimeout(150);expect((await snapshot()).builder.x).toBe(paused.builder.x);
  await page.getByRole('button',{name:'Keep playing',exact:true}).click();await page.waitForTimeout(100);
  const resumed=await snapshot();expect(resumed.builder.x).toBe(paused.builder.x);
  expect(resumed.presentation.builder.x).toBe(resumed.builder.x);
  const tile=resumed.tiles.find(tile=>!tile.placed&&!tile.lost&&tile.x-resumed.presentation.cameraX>24&&tile.x-resumed.presentation.cameraX<resumed.W-24);
  expect(tile).toBeTruthy();const canvas=await page.locator('.word-bridge-world canvas').first().boundingBox();
  await page.mouse.click(canvas.x+tile.x-resumed.presentation.cameraX,canvas.y+tile.y);
  await expect.poll(async()=>(await snapshot()).builder.carrying?.physicalId,{timeout:15000}).toBe(tile.physicalId);
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(200);await page.keyboard.up('ArrowRight');
  expect((await snapshot()).builder.carrying?.physicalId).toBe(tile.physicalId);
  await page.screenshot({path:info.outputPath('bridge-carrying.png')});expect(errors).toEqual([]);
});
