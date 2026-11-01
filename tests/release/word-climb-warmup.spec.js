import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { openClimb, retainClimbBoundary } from './word-climb-input.js';
test.use({trace:'off'});
const visual=page=>page.locator('.wc-scene').evaluate(el=>el.__wordClimbVisual());
test('Climb builds once, warms both actor atlases and rebuilds only for a real resize',async({page},info)=>{
  test.setTimeout(45000);await page.setViewportSize({width:1024,height:768});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await openClimb(page);
  const ready=await visual(page);expect(ready.renderer).toBe('three');expect(ready.sceneBuilds).toBe(1);
  expect(ready.warmup.status).toBe('ready');expect(ready.warmup.skippedTextures).toBe(0);expect(ready.warmup.textures).toBeGreaterThanOrEqual(4);
  await page.setViewportSize({width:768,height:1024});
  await expect.poll(async()=>(await visual(page)).sceneBuilds).toBe(2);
  await expect.poll(async()=>(await visual(page)).warmup?.status).toBe('ready');
  await expect(page.locator('[data-wc-scene="ready"]')).toBeVisible();
  await page.locator('.lg-game-player-main').focus();await page.keyboard.press('ArrowUp');
  await expect.poll(()=>page.evaluate(()=>window.__arcadePreviewSnapshot({motionOnly:true}).world.y)).toBeGreaterThan(0);
  await retainClimbBoundary(page,info);expect(errors).toEqual([]);
});

test('Climb context-loss recovery keeps the same physical climb available',async({page},info)=>{
  test.setTimeout(45000);await page.setViewportSize({width:1024,height:768});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await openClimb(page);
  const loss=await page.locator('.wc-scene').evaluate(host=>{
    const before=host.__wordClimbVisual(),canvas=host.querySelector('canvas');
    const gl=canvas.getContext('webgl2'),ext=gl?.getExtension('WEBGL_lose_context');
    if(ext){ext.loseContext();return{renderer:before.renderer,mechanism:'WEBGL_lose_context'};}
    canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));
    return{renderer:before.renderer,mechanism:'context-loss-event'};
  });
  expect(loss.renderer).toBe('three');await expect(page.locator('[data-wc-scene="canvas"]')).toBeVisible();
  await fs.writeFile(info.outputPath('context-loss-mechanism.json'),JSON.stringify(loss,null,2));
  await info.attach('context-loss-mechanism',{body:JSON.stringify(loss),contentType:'application/json'});
  await page.locator('.lg-game-player-main').focus();await page.keyboard.press('ArrowUp');
  await expect.poll(()=>page.evaluate(()=>window.__arcadePreviewSnapshot({motionOnly:true}).world.y)).toBeGreaterThan(0);
  await retainClimbBoundary(page,info);expect(errors).toEqual([]);
});
