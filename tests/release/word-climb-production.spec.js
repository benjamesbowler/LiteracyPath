import { installCompletedClimb } from "./word-climb-completion-fixture.js";
import fs from 'node:fs';
import { expect, test } from "@playwright/test";
import { wordStartsWithTargetSound } from "../../src/utils/rocketRunRounds.js";
const progressKey="literacy-guide-learn-games:fullscreen-overlay-preview";
import { openClimb,openAtVerifiedStation,climbToStation,readClimbSnapshot,awaitClimbReady,retainClimbBoundary } from "./word-climb-input.js";
test.afterEach(async({page},testInfo)=>retainClimbBoundary(page,testInfo));
async function open(page){test.setTimeout(120_000);await openAtVerifiedStation(page);}
async function destination(page,correct=true){const target=(await page.locator('[data-wc="target"]').innerText()).replaceAll("/","");const words=await page.locator('[data-wc="choice"] strong').allTextContents();return page.locator('[data-wc="choice"]').nth(words.findIndex(w=>wordStartsWithTargetSound(w,target)===correct));}

test("an unreported summit resumes once, traps completion focus, and replay starts one fresh climb",async({page})=>{
  await page.setViewportSize({width:568,height:320});await installCompletedClimb(page);await page.goto("/preview/game-overlay.html?game=word-climb&difficulty=easy&sound=0&music=0");await page.getByRole("button",{name:"Continue",exact:true}).click();const game=page.locator(".word-climb");
  const replay=page.getByRole("button",{name:"Replay this ascent",exact:true}),next=page.getByRole("button",{name:"Next ascent",exact:true});await expect(next).toBeFocused();
  await expect(page.locator(".lg-game-player-header")).toHaveAttribute("inert","");
  await page.keyboard.press("Tab");await expect(replay).toBeFocused();await page.keyboard.press("Shift+Tab");await expect(next).toBeFocused();
  const before=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).games["word-climb"],progressKey);expect(before.plays).toBe(1);expect(before.highScore).toBe(60);
  for(const button of [next,replay]){const box=await button.boundingBox();expect(box.height).toBeGreaterThanOrEqual(56);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(320);}
  await page.screenshot({path:".artifacts/word-climb-production/completion-568.png"});
  await replay.click();await expect(game).toHaveAttribute("data-wc-progress","0");await expect(game).toHaveAttribute("data-reading-errors","0");
  await expect(game).toHaveAttribute("data-journey-phase","climb");await expect(page.locator('[data-wc-scene="ready"]')).toBeVisible();
  const after=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).games["word-climb"],progressKey);expect(after.plays).toBe(1);expect(after.checkpoints.easy.level).toBe(0);
});

test("reload preserves wrong-contact evidence and the exact generated climb",async({page})=>{
  await open(page);const game=page.locator(".word-climb");
  await(await destination(page,false)).click();await expect(game).toHaveAttribute("data-reading-errors","1");await expect(game).toHaveAttribute("data-motion-state","grounded");
  await expect.poll(async()=>(await readClimbSnapshot(page))?.world.wrong).toBe(1);
  const before=await readClimbSnapshot(page);
  await page.reload();await awaitClimbReady(page);
  await expect(game).toHaveAttribute("data-reading-errors","1");await expect(game).toHaveAttribute("data-wc-progress","0");
  const after=await readClimbSnapshot(page);expect(after.session).toEqual(before.session);expect(after.world.platforms).toEqual(before.world.platforms);
  expect(after.evidence.firstResponses).toEqual(before.evidence.firstResponses);expect(after.evidence.assistedRetries).toEqual(before.evidence.assistedRetries);
  await(await destination(page)).click();await expect(game).toHaveAttribute("data-wc-progress","1");
});

test("a quota failure holds the actual landing, releases input, and Retry save preserves its exact evidence through reload",async({page})=>{
  await open(page);const game=page.locator('.word-climb');
  const prior=await readClimbSnapshot(page);expect(prior.world.step).toBe(0);
  await page.evaluate(key=>{
    const original=Storage.prototype.setItem;
    window.__restoreClimbStorage=()=>{Storage.prototype.setItem=original;};
    Storage.prototype.setItem=function(name,value){
      if(name===key&&JSON.parse(value)?.games?.['word-climb']?.practiceSession?.easy?.world?.step===1)throw new DOMException('Deliberate scoped quota fault','QuotaExceededError');
      return original.call(this,name,value);
    };
  },progressKey);
  await(await destination(page)).click();
  const dialog=page.getByRole('alertdialog',{name:'Keep your climb',exact:true});
  await expect(dialog).toBeVisible();await expect(dialog.getByRole('button',{name:'Retry save',exact:true})).toBeFocused();
  const held=await page.evaluate(()=>window.__arcadePreviewSnapshot());
  expect(held.saveHeld).toBe(true);expect(held.held).toEqual({left:false,right:false,up:false});
  expect(held.world.step).toBe(1);expect(held.learning.firstResponses).toHaveLength(1);expect(held.learning.completions).toHaveLength(1);
  const frozen=await game.getAttribute('data-world-height');
  await page.keyboard.down('ArrowUp');await page.waitForTimeout(400);await page.keyboard.up('ArrowUp');
  await expect(game).toHaveAttribute('data-world-height',frozen);
  const diskBeforeRetry=(await readClimbSnapshot(page)).evidence;
  for(const field of ['firstResponses','assistedRetries','acceptedResponses','completions'])expect(diskBeforeRetry[field]).toEqual(prior.evidence[field]);
  // The native jump can be saved before the later landing hits the quota fault.
  // Motor evidence is separate from the language response held for Retry save.
  expect(diskBeforeRetry.motorEvents).toEqual(held.learning.motorEvents);
  expect(diskBeforeRetry.motorEvents.jumps).toBe(prior.evidence.motorEvents.jumps+1);
  await page.evaluate(()=>window.__restoreClimbStorage());await dialog.getByRole('button',{name:'Retry save',exact:true}).click();
  await expect(dialog).toBeHidden();await expect.poll(async()=>(await readClimbSnapshot(page))?.world.step).toBe(1);
  const saved=await readClimbSnapshot(page);expect(saved.evidence).toEqual(held.learning);expect(saved.world.platforms).toEqual(held.world.platforms);expect(saved.world.journey.safeRest).toEqual(held.world.journey.safeRest);
  await page.reload();await awaitClimbReady(page);await expect(game).toHaveAttribute('data-wc-progress','1');
  const restored=await readClimbSnapshot(page);expect(restored.evidence).toEqual(saved.evidence);expect(restored.world.platforms).toEqual(saved.world.platforms);
  expect((await page.evaluate(()=>window.__arcadePreviewSnapshot())).held).toEqual({left:false,right:false,up:false});
});

test("Moonwood's unavailable character sources use the actual compressed Pip and retain a real landing",async({page},testInfo)=>{
  test.setTimeout(120_000);
  const failed=[],assets=[],errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(/word-climb|physical-arcade\/pals/.test(request.url()))assets.push({type:'request',url:request.url()});});
  page.on('requestfailed',request=>{if(/word-climb|physical-arcade\/pals/.test(request.url()))assets.push({type:'failed',url:request.url(),error:request.failure()?.errorText});});
  page.on('response',response=>{if(/word-climb|physical-arcade\/pals/.test(response.url()))assets.push({type:'response',url:response.url(),status:response.status()});});
  for(const pattern of ["**/game-assets/physical-arcade/word-climb/characters/*.webp","**/game-assets/physical-arcade/pals/*.webp","**/game-assets/word-climb/pip-climber.glb"]){
    await page.route(pattern,route=>{failed.push(route.request().url());return route.abort();});
  }
  const compressed=page.waitForResponse(response=>/pip-climber\.glb\.gz(?:\?|$)/.test(response.url())&&response.ok()).catch(()=>null);
  try{
  const game=await openClimb(page,"hard",1);
  const response=await compressed;expect(response).not.toBeNull();expect((await response.body()).length).toBeGreaterThan(0);
  const scene=page.locator(".wc-scene");
  await expect.poll(()=>scene.evaluate(node=>node.__wordClimbVisual?.()?.representation)).toBe("legacy-compressed-pip");
  const delivered=await scene.evaluate(node=>node.__wordClimbVisual());
  expect(delivered.legacyDelivery).toBe("delivered");expect(delivered.originalDelivery).toBe("unavailable");expect(delivered.recoveryDelivery).toBe("unavailable");
  expect(failed.some(url=>url.endsWith("/pip-climber.glb"))).toBe(true);
  await climbToStation(page);await page.locator('[data-wc="replay"]').click();
  await page.waitForFunction(()=>window.__arcadePreviewSnapshot?.()?.cue.delivery==='delivered');
  const choice=await destination(page),id=await choice.getAttribute("data-ledge-id");
  await choice.click();await expect(game).toHaveAttribute("data-wc-progress","1");await expect(game).toHaveAttribute("data-standing-ledge",id);
  const saved=await readClimbSnapshot(page);expect(saved.evidence.firstResponses).toHaveLength(1);expect(saved.evidence.completions).toHaveLength(1);
  expect(saved.evidence.firstResponses[0].correct).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({path:".artifacts/word-climb-production/hard-compressed-pip-landing.png"});
  }finally{
    const state=await page.evaluate(()=>({scene:{...document.querySelector('.wc-scene')?.dataset},visual:document.querySelector('.wc-scene')?.__wordClimbVisual?.(),motion:{...document.querySelector('.word-climb')?.dataset},snapshot:window.__arcadePreviewSnapshot?.(),raw:localStorage.getItem('literacy-guide-learn-games:fullscreen-overlay-preview')})).catch(error=>({error:error.message}));
    const file=testInfo.outputPath('actual-compressed-recovery-state.json');fs.writeFileSync(file,JSON.stringify({assets,failed,errors,state},null,2));
    await testInfo.attach('actual-compressed-recovery-state',{path:file,contentType:'application/json'});
  }
});

test("pausing freezes the physical ascent and the authored character pose together",async({page})=>{
  await open(page);await(await destination(page)).click();
  await page.getByRole("button",{name:"Close Word Climb",exact:true}).click();
  const game=page.locator(".word-climb"),scene=page.locator(".wc-scene");
  const before=[await game.getAttribute("data-world-height"),await scene.getAttribute("data-pose")];
  await page.waitForTimeout(900);expect([await game.getAttribute("data-world-height"),await scene.getAttribute("data-pose")]).toEqual(before);
  await page.getByRole("button",{name:"Keep playing",exact:true}).click();await expect(game).toHaveAttribute("data-wc-progress","1");
});

test("leaving during active climbing restores the same physical route and held input is released",async({page})=>{
 await openClimb(page);const game=page.locator('.word-climb');await game.focus();await page.keyboard.down('ArrowUp');await page.waitForTimeout(900);await page.keyboard.up('ArrowUp');
 const height=Number(await game.getAttribute('data-world-height'));expect(height).toBeGreaterThan(25);
 await expect.poll(async()=>(await readClimbSnapshot(page))?.world.y).toBeCloseTo(height,1);
 const before=await readClimbSnapshot(page);
 await page.reload();await awaitClimbReady(page);
 await expect(game).toHaveAttribute('data-world-height',height.toFixed(2));await page.waitForTimeout(500);
 await expect(game).toHaveAttribute('data-world-height',height.toFixed(2));
 const after=await readClimbSnapshot(page);expect(after.session).toEqual(before.session);expect(after.world.journey.obstacles).toEqual(before.world.journey.obstacles);
});

for(const [difficulty,stage,width,height] of [['medium',1,568,320],['hard',2,390,844]])test(`${difficulty} route family reaches a readable station and accepts a real touch landing`,async({browser})=>{
 test.setTimeout(90000);const context=await browser.newContext({baseURL:test.info().project.use.baseURL,viewport:{width,height},hasTouch:true});const page=await context.newPage();
 try{
  const game=await openClimb(page,difficulty);
  // Replay seeds vary the route; its family is the stage index modulo three.
  expect(Number(await game.getAttribute('data-climb-stage')) % 3).toBe(stage);
  await climbToStation(page);const world=await page.locator('.wc-world').boundingBox();
  for(const control of await page.locator('[data-wc="choice"], .wc-air-controls button').all()){
   const box=await control.boundingBox();expect(box.width).toBeGreaterThanOrEqual(56);expect(box.height).toBeGreaterThanOrEqual(56);expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width);expect(box.y+box.height).toBeLessThanOrEqual(height);
   if(await control.getAttribute('data-wc'))expect(box.y).toBeGreaterThanOrEqual(world.y);
  }
  const ledge=await destination(page),id=await ledge.getAttribute('data-ledge-id');await ledge.tap();
  await expect(game).toHaveAttribute('data-wc-progress','1');await expect(game).toHaveAttribute('data-standing-ledge',id);await expect(game).toHaveAttribute('data-motion-state','grounded');
  await page.screenshot({path:`.artifacts/word-climb-production/family-${difficulty}.png`});
 }finally{await context.close();}
});
