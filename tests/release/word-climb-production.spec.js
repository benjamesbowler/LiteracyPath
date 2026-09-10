import { installCompletedClimb } from "./word-climb-completion-fixture.js";
import { expect, test } from "@playwright/test";
import { wordStartsWithTargetSound } from "../../src/utils/rocketRunRounds.js";
const key="literacy-guide-word-climb:fullscreen-overlay-preview:easy";
const progressKey="literacy-guide-learn-games:fullscreen-overlay-preview";
import { openClimb,openAtVerifiedStation,climbToStation } from "./word-climb-input.js";
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
  await expect.poll(()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k))?.world.wrong,key)).toBe(1);
  const before=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
  await page.reload();const resume=page.getByRole("button",{name:/continue/i});if(await resume.isVisible())await resume.click();
  await expect(game).toHaveAttribute("data-reading-errors","1");await expect(game).toHaveAttribute("data-wc-progress","0");
  const after=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);expect(after.session).toEqual(before.session);expect(after.world.platforms).toEqual(before.world.platforms);
  await(await destination(page)).click();await expect(game).toHaveAttribute("data-wc-progress","1");
});

test("an unavailable character URL uses the exact authored embedded asset and remains playable",async({page})=>{
  await page.route("**/game-assets/word-climb/pip-climber.glb",route=>route.abort());await open(page);
  await(await destination(page)).click();await expect(page.locator(".word-climb")).toHaveAttribute("data-wc-progress","1");
  expect(Number(await page.locator(".wc-scene").getAttribute("data-draw-calls"))).toBeLessThan(100);
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
 await expect.poll(()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k))?.world.y,key)).toBeCloseTo(height,1);
 const before=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
 await page.reload();const resume=page.getByRole('button',{name:'Continue',exact:true});if(await resume.isVisible())await resume.click();
 await expect(game).toHaveAttribute('data-world-height',height.toFixed(2));await page.waitForTimeout(500);
 await expect(game).toHaveAttribute('data-world-height',height.toFixed(2));
 const after=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);expect(after.session).toEqual(before.session);expect(after.world.journey.obstacles).toEqual(before.world.journey.obstacles);
});

for(const [difficulty,stage,width,height] of [['medium',1,568,320],['hard',2,390,844]])test(`${difficulty} route family reaches a readable station and accepts a real touch landing`,async({browser})=>{
 test.setTimeout(90000);const context=await browser.newContext({baseURL:test.info().project.use.baseURL,viewport:{width,height},hasTouch:true});const page=await context.newPage();
 try{
  const game=await openClimb(page,difficulty);await expect(game).toHaveAttribute('data-climb-stage',String(stage));
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
