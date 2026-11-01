import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { CAMPAIGN_STAGES } from '../../src/features/soundSeekers/v3/content/campaign.js';
import { getCampaignWorldLayout, campaignRoute } from '../../src/features/soundSeekers/rounded/campaignWorldLayouts.js';
import { campaignCollisionLayout } from '../../src/features/soundSeekers/rounded/campaignWorld.js';

test.use({ viewport:{width:1280,height:860} });
const HOST='#world',CANVAS='#world > canvas';
async function open(page,stage='meadow-01',low=false) {
  await page.goto(`/tests/fixtures/sound-seekers-rounded-world.html?stage=${stage}${low?'&low=1':''}`);
  await ready(page,stage);
}
async function ready(page,stage) {
  await expect(page.locator(HOST)).toHaveAttribute('data-ready','true');
  await expect(page.locator(CANVAS)).toHaveAttribute('data-stage-id',stage);
  await expect(page.locator(HOST)).toHaveAttribute('data-failure','');
}
async function metrics(page) {
  return page.locator(CANVAS).evaluate(canvas=>({...canvas.dataset,tabIndex:canvas.tabIndex,width:canvas.width,height:canvas.height}));
}
async function redraw(page,action) {
  const before=Number((await metrics(page)).renderedFrames);
  await action();
  await expect.poll(async()=>Number((await metrics(page)).renderedFrames)).toBeGreaterThan(before);
}

test('all thirty rounded places render before and after exact main repairs, with low-tier parity',async({page},info)=>{
  test.setTimeout(180000);
  const errors=[],proof=[];page.on('pageerror',error=>errors.push(error.message));
  await open(page);
  for(const stage of CAMPAIGN_STAGES){
    if(stage.id!=='meadow-01'){await page.getByLabel('Place',{exact:true}).selectOption(stage.id);await ready(page,stage.id);}
    const before=await metrics(page);
    assertMetrics(before,false);
    await page.screenshot({path:info.outputPath(`${stage.id}-before.png`)});
    await redraw(page,()=>page.getByRole('button',{name:'One main part',exact:true}).click());
    const partial=await metrics(page);
    await expect(page.locator(HOST)).toHaveAttribute('data-completed-parts','1');
    await page.screenshot({path:info.outputPath(`${stage.id}-partial.png`)});
    await redraw(page,()=>page.getByRole('button',{name:'Finished repair',exact:true}).click());
    const full=await metrics(page);
    await expect(page.locator(HOST)).toHaveAttribute('data-completed-parts','5');
    await page.screenshot({path:info.outputPath(`${stage.id}-restored.png`)});
    await redraw(page,()=>page.getByLabel('Low power',{exact:true}).check());
    const low=await metrics(page);assertMetrics(low,true);expect(Number(low.triangles)).toBeLessThan(Number(full.triangles));
    if(['meadow-01','dino-14','moonwood-25'].includes(stage.id))await page.screenshot({path:info.outputPath(`${stage.id}-restored-low.png`)});
    const idle=low.renderedFrames;await page.waitForTimeout(220);expect((await metrics(page)).renderedFrames).toBe(idle);
    proof.push({stageId:stage.id,before,partial,full,low});
    await page.getByLabel('Low power',{exact:true}).uncheck();
  }
  expect(errors).toEqual([]);
  await writeFile(info.outputPath('world-render-proof.json'),JSON.stringify({kind:'Scenery-only canonical receipt rendering; no learner evidence submission',stages:proof},null,2));
});
async function travelDeadline(page,stageId,point) {
  const pose=await metrics(page),start={x:Number(pose.playerX),z:Number(pose.playerZ)},layout=campaignCollisionLayout(getCampaignWorldLayout(stageId),[],true);
  const route=campaignRoute(layout,start,point);expect(route.length).toBeGreaterThan(0);
  let length=0,previous=start;for(const next of route){length+=Math.hypot(next.x-previous.x,next.z-previous.z);previous=next;}
  // Long authored detours need their own travel budget. Arrival is still the
  // actual nearby gate; no artificial movement, clock advance or skipped walk.
  return Math.ceil(length/4.6*2200+4000);
}
function assertMetrics(value,low) {
  expect(Number(value.renderedFrames)).toBeGreaterThan(0);
  expect(Number(value.triangles)).toBeGreaterThan(50000);
  expect(Number(value.drawCalls)).toBeLessThan(low?120:180);
  expect(value.tabIndex).toBe(-1);
}

for(const stageId of ['meadow-01','dino-14','moonwood-25'])test(`continuous keyboard, real carry/operate/return and pause in ${stageId}`,async({page},info)=>{
  test.setTimeout(150000);
  await open(page,stageId,true);await page.getByRole('button',{name:'Explore',exact:true}).click();
  await expect(page.locator(CANVAS)).toHaveAttribute('tabindex','0');
  const before=await metrics(page),start=Date.now();
  await page.keyboard.down('ArrowUp');await page.waitForTimeout(1600);await page.keyboard.up('ArrowUp');
  const moved=await metrics(page);expect(Math.hypot(Number(moved.playerX)-Number(before.playerX),Number(moved.playerZ)-Number(before.playerZ))).toBeGreaterThan(5);
  await page.getByRole('button',{name:'Walk to first encounter',exact:true}).click();
  await expect(page.locator(HOST)).toHaveAttribute('data-near-mission',`${stageId}-1`,{timeout:18000});
  await expect(page.locator(HOST)).toHaveAttribute('data-completed-parts','0');
  await page.screenshot({path:info.outputPath(`${stageId}-at-encounter.png`)});
  const layout=getCampaignWorldLayout(stageId),carry=layout.discoveries.find(d=>d.id==='carry'),operate=layout.discoveries.find(d=>d.id==='operate');
  const pickupDeadline=await travelDeadline(page,stageId,carry.source);
  await page.getByRole('button',{name:'Walk to carry object',exact:true}).click();
  await expect(page.locator(HOST)).toHaveAttribute('data-interaction','pickup',{timeout:pickupDeadline});
  await page.getByRole('button',{name:'Use nearby object',exact:true}).click();
  await expect(page.locator(HOST)).toHaveAttribute('data-carrying','carry');
  await page.screenshot({path:info.outputPath(`${stageId}-carrying.png`)});
  const operateDeadline=await travelDeadline(page,stageId,operate.source);
  await page.getByRole('button',{name:'Walk to lookout',exact:true}).click();
  await expect(page.locator(HOST)).toHaveAttribute('data-interaction','operate',{timeout:operateDeadline});
  await page.getByRole('button',{name:'Use nearby object',exact:true}).click();
  await expect(page.locator(HOST)).toHaveAttribute('data-discovered','operate');
  await expect(page.locator(HOST)).toHaveAttribute('data-carrying','carry');
  const returnDeadline=await travelDeadline(page,stageId,carry.destination);
  await page.getByRole('button',{name:'Walk to carry object',exact:true}).click();
  await expect(page.locator(HOST)).toHaveAttribute('data-interaction','place',{timeout:returnDeadline});
  await page.getByRole('button',{name:'Use nearby object',exact:true}).click();
  await expect(page.locator(HOST)).toHaveAttribute('data-discovered','operate,carry');
  await expect(page.locator(HOST)).toHaveAttribute('data-carrying','');
  await expect(page.locator(HOST)).toHaveAttribute('data-completed-parts','0');
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  await expect(page.locator(CANVAS)).toHaveAttribute('tabindex','-1');
  await expect(page.locator(CANVAS)).toHaveAttribute('data-paused','true');
  const paused=await metrics(page);await page.waitForTimeout(200);expect((await metrics(page)).renderedFrames).toBe(paused.renderedFrames);
  await page.getByRole('button',{name:'Resume',exact:true}).click();
  await expect(page.locator(CANVAS)).toBeFocused();
  await page.screenshot({path:info.outputPath(`${stageId}-delivered.png`)});
  await writeFile(info.outputPath(`${stageId}-continuous-play.json`),JSON.stringify({stageId,elapsedMs:Date.now()-start,manualKeyboardMs:1600,otherTravel:'Player-selected motor-assisted routes through the actual scene',before,moved,delivered:await metrics(page),noMainPartsAwarded:true},null,2));
});

test('failed and aborted model requests release their scenes without stale readiness or a substitute hero',async({page})=>{
  test.setTimeout(40000);
  await page.route(/\/assets\/characters\/bouncy\.glb\?no-inline$/,route=>route.fulfill({status:404,body:'Missing approved model'}));
  await page.goto('/tests/fixtures/sound-seekers-rounded-world.html');
  await expect(page.locator(HOST)).toHaveAttribute('data-failure',/could not load|aborted/i);
  await expect(page.locator(CANVAS)).toHaveCount(0);
  await page.unroute(/\/assets\/characters\/bouncy\.glb\?no-inline$/);
  let delayed=false;
  await page.route(/\/assets\/characters\/bouncy\.glb\?no-inline$/,async route=>{if(!delayed){delayed=true;await new Promise(resolve=>setTimeout(resolve,350));}try{await route.continue();}catch{/* A deliberately aborted first scene has no live fetch owner. */}});
  await page.reload();
  await page.getByLabel('Place',{exact:true}).selectOption('dino-14');
  await ready(page,'dino-14');
  await expect(page.locator(CANVAS)).toHaveCount(1);
  await page.getByRole('button',{name:'Explore',exact:true}).click();
  await expect(page.locator(CANVAS)).toHaveAttribute('tabindex','0');
});

test('Fern Steps resident notices arrival, reacts to one real repair state and freezes through pause',async({page},info)=>{
  test.setTimeout(60000);
  await open(page,'meadow-02',true);
  await page.getByRole('button',{name:'Explore',exact:true}).click();
  await expect(page.locator(CANVAS)).toHaveAttribute('data-resident-states',/woolly:attend:/);
  await page.getByRole('button',{name:'Walk to first encounter',exact:true}).click();
  await expect(page.locator(HOST)).toHaveAttribute('data-near-mission','meadow-02-1',{timeout:22000});
  await expect(page.locator(CANVAS)).toHaveAttribute('data-resident-states',/woolly:greet:/);
  await expect(page.locator(HOST)).toHaveAttribute('data-completed-parts','0');
  await page.screenshot({path:info.outputPath('fern-resident-greeting.png')});
  await page.getByLabel('Reduced motion',{exact:true}).uncheck();
  await page.getByRole('button',{name:'One main part',exact:true}).click();
  await expect(page.locator(CANVAS)).toHaveAttribute('data-resident-states',/woolly:celebrate:.*:Celebrate/);
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  await expect(page.locator(CANVAS)).toHaveAttribute('data-paused','true');
  const paused=await metrics(page);
  await page.waitForTimeout(250);
  expect((await metrics(page)).residentStates).toBe(paused.residentStates);
  expect((await metrics(page)).renderedFrames).toBe(paused.renderedFrames);
  await page.screenshot({path:info.outputPath('fern-resident-repair-reaction.png')});
  await page.getByRole('button',{name:'Resume',exact:true}).click();
  await expect(page.locator(CANVAS)).toHaveAttribute('data-resident-states',/woolly:greet:.*:Idle/);
  await redraw(page,()=>page.getByLabel('Reduced motion',{exact:true}).check());
  const settled=await metrics(page);
  await page.waitForTimeout(200);
  expect((await metrics(page)).renderedFrames).toBe(settled.renderedFrames);
  expect(Number(settled.contactShadows)).toBeGreaterThanOrEqual(2);
  await expect(page.locator(HOST)).toHaveAttribute('data-completed-parts','1');

  await open(page,'meadow-02',true);
  await page.getByRole('button',{name:'Finished repair',exact:true}).click();
  await page.getByLabel('Reduced motion',{exact:true}).uncheck();
  await page.getByRole('button',{name:'Explore',exact:true}).click();
  await expect(page.locator(CANVAS)).toHaveAttribute('data-resident-states',/woolly:attend:.*:Idle/);
  await expect(page.locator(HOST)).toHaveAttribute('data-completed-parts','5');
});

test('Apple-touch backing density stays capped after state, tier and orientation changes',async({browser},info)=>{
  const context=await browser.newContext({viewport:{width:1024,height:768},deviceScaleFactor:2,hasTouch:true,isMobile:true,
    userAgent:'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
  const page=await context.newPage();
  try{
    await open(page,'meadow-02');
    const check=async()=>{
      await expect(page.locator(CANVAS)).toHaveAttribute('data-pixel-ratio','1');
      const buffer=await page.locator(CANVAS).evaluate(canvas=>{const rect=canvas.getBoundingClientRect();return {width:canvas.width,height:canvas.height,cssWidth:rect.width,cssHeight:rect.height};});
      expect(buffer.cssWidth).toBeGreaterThan(0);expect(buffer.cssHeight).toBeGreaterThan(0);
      expect(Math.abs(buffer.width-buffer.cssWidth)).toBeLessThanOrEqual(1);
      expect(Math.abs(buffer.height-buffer.cssHeight)).toBeLessThanOrEqual(1);
      return buffer;
    };
    const buffers=[await check()];
    await redraw(page,()=>page.getByRole('button',{name:'Explore',exact:true}).click());buffers.push(await check());
    await redraw(page,()=>page.getByRole('button',{name:'One main part',exact:true}).click());buffers.push(await check());
    await redraw(page,()=>page.getByLabel('Low power',{exact:true}).check());buffers.push(await check());
    await redraw(page,()=>page.getByLabel('Low power',{exact:true}).uncheck());buffers.push(await check());
    await redraw(page,()=>page.setViewportSize({width:768,height:1024}));buffers.push(await check());
    await page.screenshot({path:info.outputPath('apple-touch-portrait-buffer.png')});
    await writeFile(info.outputPath('backing-density.json'),JSON.stringify({kind:'Browser device-signal emulation; not physical iPad performance',buffers},null,2));
  }finally{await context.close();}
});
