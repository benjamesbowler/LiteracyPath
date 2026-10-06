import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const CHARACTER={easy:'Bouncy',medium:'Chompy',hard:'Pip'},WORLD={easy:'meadow',medium:'dino',hard:'moonwood'};
const snapshot=page=>page.evaluate(()=>window.__arcadePreviewSnapshot?.());
test.use({trace:'off'});
async function launch(page,difficulty='easy',{low=false,failAsset=false,sound=false}={}){
 await page.setViewportSize({width:1280,height:900});
 await page.addInitScript(difficulty=>localStorage.setItem('literacy-guide-learn-games:fullscreen-overlay-preview',JSON.stringify({games:{'sound-racer':{checkpoints:{[difficulty]:{level:0,totalLevels:10,sessionSeed:0,chapter:0}}}}})),difficulty);
 if(low)await page.addInitScript(()=>{Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>2});Object.defineProperty(navigator,'deviceMemory',{get:()=>2});});
 if(failAsset)await page.route(`**/game-assets/sound-racer/models/${CHARACTER[difficulty].toLowerCase()}-kart-v2.glb`,route=>route.abort());
 await page.goto(`/preview/game-overlay.html?game=sound-racer&difficulty=${difficulty}&sound=${sound?1:0}&music=0`);
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 const hud=page.locator('[data-sound-racer-position]');await expect(hud).toBeVisible({timeout:45000});
 await page.waitForFunction(()=>{const s=window.__arcadePreviewSnapshot?.();return s&&!s.assetsLoading&&!s.graphicsLoading;},null,{timeout:45000});
 await page.waitForFunction(()=>window.__arcadePreviewSnapshot?.()?.running===true,null,{timeout:15000,polling:250});
 await expect(hud).toHaveAttribute('data-sound-racer-asset','ready');
 return hud;
}
async function held(page,key,milliseconds){await page.keyboard.down(key);await page.waitForTimeout(milliseconds);await page.keyboard.up(key);}
async function retain(page,info,label){const state=await snapshot(page);fs.writeFileSync(info.outputPath(`${label}.json`),JSON.stringify(state,null,2));await page.screenshot({path:info.outputPath(`${label}.png`)});return state;}
for(const difficulty of ['easy','medium','hard']){
 test(`${difficulty} canonical athlete keeps six native clips, real wheels, steering, braking and Tools focus`,async({page},info)=>{
  test.setTimeout(90000);const errors=[];page.on('pageerror',error=>errors.push(error.message));const hud=await launch(page,difficulty);
  const first=await retain(page,info,'opening');expect(first.kart.character).toBe(CHARACTER[difficulty]);expect(first.kart.wheelCount).toBe(4);expect(first.kart.clips).toHaveLength(6);expect(first.scenery.world).toBe(WORLD[difficulty]);
  await page.keyboard.down('ArrowLeft');await expect(hud).toHaveAttribute('data-sound-racer-driver','turn_left');await retain(page,info,'native-left');await page.keyboard.up('ArrowLeft');
  const roll=Number(await hud.getAttribute('data-sound-racer-wheel-roll'));await page.keyboard.down('ArrowDown');await expect(hud).toHaveAttribute('data-sound-racer-driver','brake');await page.waitForTimeout(550);expect(Number(await hud.getAttribute('data-sound-racer-speed'))).toBeLessThan(6);expect(Number(await hud.getAttribute('data-sound-racer-wheel-roll'))).not.toBe(roll);await page.keyboard.up('ArrowDown');
  await page.getByRole('button',{name:'Open game controls',exact:true}).click();const paused=await snapshot(page);expect(paused.paused).toBe(true);
  await held(page,'ArrowRight',350);expect((await snapshot(page)).progress).toBe(paused.progress);expect((await snapshot(page)).timeMs).toBe(paused.timeMs);
  await page.keyboard.press('Escape');await held(page,'ArrowRight',250);expect((await snapshot(page)).paused).toBe(false);expect((await snapshot(page)).progress).toBeGreaterThan(paused.progress);
  await expect(hud).toHaveAttribute('data-sound-racer-braking','false');expect(errors).toEqual([]);
 });
 test(`${difficulty} missing primary loads the selected exact-byte canonical kart`,async({page},info)=>{
  test.setTimeout(90000);const hud=await launch(page,difficulty,{low:true,failAsset:true});const first=await snapshot(page);
  expect(first.kart.character).toBe(CHARACTER[difficulty]);expect(first.kart.source).toContain(`${CHARACTER[difficulty].toLowerCase()}-kart-v2.glb`);expect(first.kart.recoveredAsset).toBe(true);expect(first.kart.wheelCount).toBe(4);expect(first.kart.clips).toHaveLength(6);
  await page.keyboard.down('ArrowRight');await expect(hud).toHaveAttribute('data-sound-racer-driver','turn_right');await retain(page,info,'selected-model-recovery');await page.keyboard.up('ArrowRight');
 });
}

test('ordinary untouched travel invents no deliberate word response or literacy error',async({page},info)=>{
 test.setTimeout(90000);await launch(page,'medium');const first=await snapshot(page);await page.waitForTimeout(10000);const idle=await retain(page,info,'idle-driving');
 expect(idle.progress).toBeGreaterThan(first.progress);expect(idle.hasLaneIntent).toBe(false);expect(idle.evidence.firstResponses).toEqual([]);expect(idle.evidence.assistedRetries).toEqual([]);
 const position=JSON.parse(await page.locator('[data-sound-racer-position]').getAttribute('data-sound-racer-position'));expect(position.wordsWrong).toBe(0);expect(position.wordsCorrect).toBe(0);
});

test('Hear is reachable above broad steering and retains an actual recorded-sound end receipt',async({page},info)=>{
 test.setTimeout(90000);await launch(page,'easy',{sound:true});const hear=page.locator('[data-sr=hear-target]');await expect(hear).toHaveAccessibleName(/^Hear .+ sound again$/);await expect(hear).toBeEnabled();
 const hit=await hear.evaluate(button=>{const b=button.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return hit===button||button.contains(hit);});expect(hit).toBe(true);
 const first=await snapshot(page);await hear.click();await page.waitForFunction(()=>window.__arcadePreviewSnapshot?.()?.targetDelivery==='delivered',null,{timeout:15000});const heard=await retain(page,info,'heard-target');
 expect(heard.hasLaneIntent).toBe(first.hasLaneIntent);expect(heard.evidence.firstResponses).toEqual(first.evidence.firstResponses);expect(heard.targetReceipt.source).toBeTruthy();expect(heard.targetReceipt.deliveredAt).toMatch(/^\d{4}-/);expect(heard.targetReceipt.playTimeMs).toBeGreaterThanOrEqual(0);expect(heard.supportReasons).toContain('target-audio-replay');
});

test.describe('continuous touch steering and brake',()=>{
 test.use({hasTouch:true});
 for(const [width,height]of[[320,568],[568,320],[390,844],[844,390]])test(`controls and muted Hear remain reachable at ${width}x${height}`,async({page},info)=>{
  test.setTimeout(90000);const hud=await launch(page);await page.setViewportSize({width,height});
  const controls=page.locator('[data-sr=left-control],[data-sr=right-control],[data-sr=brake-control],[data-sr=hear-target]');
  await expect(controls).toHaveCount(4);
  for(const button of await controls.all()){
   await expect(button).toBeVisible();const b=await button.boundingBox();expect(b.width).toBeGreaterThanOrEqual(56);expect(b.height).toBeGreaterThanOrEqual(56);expect(b.x).toBeGreaterThanOrEqual(0);expect(b.y).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(width+1);expect(b.y+b.height).toBeLessThanOrEqual(height+1);
  }
  await expect(page.locator('[data-sr=hear-target]')).toBeDisabled();await expect(page.locator('[data-sr=hear-target]')).toHaveAccessibleName(/Sound is off.+Tools/);
  const brake=page.getByRole('button',{name:'Hold to brake',exact:true}),b=await brake.boundingBox(),cdp=await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2,id:1}]});await expect(hud).toHaveAttribute('data-sound-racer-braking','true');await page.waitForTimeout(250);await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await expect(hud).toHaveAttribute('data-sound-racer-braking','false');
  const left=page.getByRole('button',{name:'Steer left',exact:true});await left.tap();await page.waitForTimeout(250);expect((await snapshot(page)).hasLaneIntent).toBe(true);await retain(page,info,'touch-controls');
 });
});

test('real context loss releases its GPU owner and keeps the same circuit/evidence in Canvas',async({page},info)=>{
 test.setTimeout(90000);
 // Lose the genuine context immediately after its first fully loaded render.
 // The normal rAF callback and shared quality policy remain unchanged; this
 // timing also exercises a real loss before a slow software GPU adapts itself.
 await page.addInitScript(()=>{
  const get=HTMLCanvasElement.prototype.getContext,raf=window.requestAnimationFrame.bind(window);window.__racerFaultContexts=[];
  HTMLCanvasElement.prototype.getContext=function(type,...args){const context=get.call(this,type,...args);if(/webgl/i.test(type)&&context&&!window.__racerFaultContexts.includes(context))window.__racerFaultContexts.push(context);return context;};
  window.requestAnimationFrame=callback=>raf(time=>{callback(time);const state=window.__arcadePreviewSnapshot?.();if(window.__lostRacerContext||!state||state.assetsLoading||state.presentation.mode!=='webgl')return;const gl=window.__racerFaultContexts.find(context=>context.canvas.isConnected&&context.canvas.width>100);const extension=gl?.getExtension('WEBGL_lose_context');if(extension){window.__lostRacerContext={gl,canvas:gl.canvas,before:state};extension.loseContext();}});
 });
 await launch(page);
 await page.waitForFunction(()=>{const s=window.__arcadePreviewSnapshot?.();return s?.presentation.mode==='canvas'&&!s.graphicsLoading;},null,{timeout:30000});const switched=await snapshot(page),before=await page.evaluate(()=>window.__lostRacerContext.before);expect(before.presentation.mode).toBe('webgl');
 expect(switched.presentation.reason).toBe('webgl-context-lost');expect(switched.evidence).toEqual(before.evidence);expect(switched.progress).toBeGreaterThanOrEqual(before.progress);expect(switched.progress-before.progress).toBeLessThan(8);
 expect(await page.evaluate(()=>window.__lostRacerContext.gl.isContextLost()&&!window.__lostRacerContext.canvas.isConnected)).toBe(true);
 await held(page,'ArrowLeft',300);await held(page,'ArrowDown',350);await page.waitForTimeout(700);const after=await retain(page,info,'context-canvas');expect(after.progress).toBeGreaterThan(switched.progress);expect(after.kart.character).toBe('Bouncy');expect(after.presentation.canvas.originalAthlete.delivery).toBe('delivered');
});

test('soft guardrails preserve progress and charge only deliberate printed wrong gates',async({page},info)=>{
 test.setTimeout(90000);const hud=await launch(page,'easy',{low:true});const before=JSON.parse(await hud.getAttribute('data-sound-racer-position')),approaching=(await snapshot(page)).nextGates;
 await held(page,'ArrowRight',1600);const after=JSON.parse(await hud.getAttribute('data-sound-racer-position'));expect(after.recoveries).toBe(0);expect(after.progress).toBeGreaterThan(before.progress+10);
 const wrong=approaching.filter(gate=>gate.word&&!gate.correct&&gate.lane===2&&gate.z>before.progress&&gate.z<=after.progress+.58).length;expect(after.wordsWrong-before.wordsWrong).toBe(wrong);expect(after.lateral).toBeGreaterThan(2);await retain(page,info,'soft-guardrail');await expect(hud).toHaveAttribute('data-sound-racer-driver','drive');
});
