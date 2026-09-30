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
