import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {buildSoundRacerRace as buildTrack} from '../../src/utils/soundRacerRace.js';
import {soundRacerLadder} from '../../src/utils/soundRacerTracks.js';

test.use({trace:'off'});
import {angleDelta} from '../../src/utils/soundRacerPhysics.js';

const inspect=page=>page.evaluate(()=>window.__arcadePreviewSnapshot());
async function deterministicRace(page,difficulty='easy',sound=false){
  await page.addInitScript(difficulty=>localStorage.setItem('literacy-guide-learn-games:fullscreen-overlay-preview',JSON.stringify({games:{'sound-racer':{checkpoints:{[difficulty]:{level:0,totalLevels:10,sessionSeed:0,chapter:0}}}}})),difficulty);
  await page.goto(`/preview/game-overlay.html?game=sound-racer&difficulty=${difficulty}&sound=${sound?1:0}&music=0`);
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  const hud=page.locator('[data-sound-racer-position]');
  await expect(hud).toBeVisible({timeout:45000});
  await page.waitForFunction(()=>{const s=window.__arcadePreviewSnapshot?.();return s&&!s.assetsLoading&&!s.graphicsLoading&&s.running;},null,{timeout:45000,polling:250});
  return hud;
}
for(const difficulty of ['easy','medium','hard'])test(`Sound Racer ${difficulty} completes all ten ordinary-clock three-lap circuits`,async({page},testInfo)=>{
  test.setTimeout(2700000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:1280,height:900});
  const hud=await deterministicRace(page,difficulty,true),started=Date.now(),routes=[];
  for(const [index,target]of soundRacerLadder(difficulty,0,0).entries()){
    const track=buildTrack(target,{difficulty,seed:index});
    await page.waitForFunction(()=>{const s=window.__arcadePreviewSnapshot?.();return s&&!s.assetsLoading&&!s.graphicsLoading&&s.running&&s.targetDelivery==='delivered';},null,{timeout:30000,polling:250});
    let held='',left=0,right=0,final=null,lastReport=0;
    const trackStarted=Date.now();
    while(Date.now()-trackStarted<240000){
      const state=await inspect(page);final=state;
      const position=JSON.parse(await hud.getAttribute('data-sound-racer-position'));
      if(position.progress>=track.raceLength&&position.wordsCorrect>=track.needed)break;
      const gate=state.nextGates.find(gate=>gate.word&&gate.z>state.progress+1);
      const aim=gate&&gate.z-state.progress<23?(gate.correct?[-3.15,0,3.15][gate.lane]:gate.lane===1?2.9:0):0;
      const error=aim-state.aimLateral,desired=error<-.2?'ArrowLeft':error>.2?'ArrowRight':'';
      if(desired!==held){if(held)await page.keyboard.up(held);if(desired)await page.keyboard.down(desired);held=desired;}
      if(desired==='ArrowLeft')left++;if(desired==='ArrowRight')right++;
      if(Date.now()-lastReport>10000){lastReport=Date.now();fs.writeFileSync(testInfo.outputPath('route-progress.json'),JSON.stringify({difficulty,index,target,elapsedSeconds:(Date.now()-started)/1000,position,state},null,2));}
      await page.waitForTimeout(120);
    }
    if(held)await page.keyboard.up(held);
    const position=JSON.parse(await hud.getAttribute('data-sound-racer-position'));
    expect(position.progress).toBeGreaterThanOrEqual(track.raceLength);expect(position.wordsCorrect).toBe(track.needed);
    expect(left).toBeGreaterThan(0);expect(right).toBeGreaterThan(0);
    expect(final.evidence.firstResponses.filter(row=>row.roundId.startsWith(`track-${index}:`)).every(row=>row.stimulusDelivered&&row.targetAudioReceipt?.source)).toBe(true);
    routes.push({index,target,elapsedSeconds:(Date.now()-trackStarted)/1000,position,performance:final.performance,presentation:final.presentation});
    fs.writeFileSync(testInfo.outputPath('completed-circuits.json'),JSON.stringify(routes,null,2));
    if(index<9){await page.getByRole('button',{name:'Go to the next map',exact:true}).click();}
  }
  await expect(page.getByRole('alertdialog',{name:'Sound Racer complete'})).toBeVisible();
  const final=await inspect(page);expect(final.evidence.contentVersion).toBe('sound-racer-v2');expect(final.evidence.practiceOnly).toBe(true);
  expect(new Set(final.evidence.completions.map(id=>Number(/^track-(\d+):/.exec(id)[1]))).size).toBe(10);
  const immutable=await page.evaluate(()=>JSON.parse(localStorage.getItem('literacy-guide-learn-games:fullscreen-overlay-preview')).games['sound-racer'].practiceRecord.completions.at(-1));
  expect(immutable.practiceContext.masteryClaim).toBe(false);expect(immutable.practiceContext.construct).toBe('grapheme-phoneme-onset-recognition');expect(immutable.steps).toEqual(final.evidence.firstResponses);
  expect(errors).toEqual([]);fs.writeFileSync(testInfo.outputPath('full-cup.json'),JSON.stringify({elapsedSeconds:(Date.now()-started)/1000,routes,final,immutable},null,2));
  await page.screenshot({path:testInfo.outputPath('full-cup.png')});
  await page.getByRole('button',{name:'Next circuit',exact:true}).click();
  await page.waitForFunction(()=>{const s=window.__arcadePreviewSnapshot?.();return s&&!s.assetsLoading&&!s.graphicsLoading;},null,{timeout:45000,polling:250});
  await expect(page.locator('[data-journey-chapter]')).toHaveAttribute('data-journey-chapter','1');
  const journal=await page.evaluate(d=>JSON.parse(localStorage.getItem('literacy-guide-learn-games:fullscreen-overlay-preview')).games['sound-racer'].journeys[d],difficulty);expect(journal.completed).toEqual([0]);
});

test('Sound Racer pointer steering changes heading, releases, pauses and follows bends',async({page})=>{
  test.setTimeout(180000);
  await page.setViewportSize({width:960,height:600});
  await page.emulateMedia({reducedMotion:'reduce'});
  await deterministicRace(page);
  const hud=page.locator('[data-sound-racer-position]');await expect(hud).toBeVisible({timeout:45000});
  const before=JSON.parse(await hud.getAttribute('data-sound-racer-position'));
  const control=await page.getByRole('button',{name:'Steer right',exact:true}).boundingBox();
  await page.mouse.move(control.x+control.width/2,control.y+control.height/2);await page.mouse.down();
  await page.waitForTimeout(600);await page.mouse.up();
  const after=JSON.parse(await hud.getAttribute('data-sound-racer-position'));
  expect(Math.abs(angleDelta(before.heading,after.heading))).toBeGreaterThan(.1);
  await page.getByRole('button',{name:'Close Sound Racer',exact:true}).click();
  const paused=await hud.getAttribute('data-sound-racer-position');await page.waitForTimeout(2000);
  expect(await hud.getAttribute('data-sound-racer-position')).toBe(paused);
  await page.getByRole('button',{name:/Keep playing/i}).click();
  await page.waitForTimeout(30000);
  const recovered=JSON.parse(await hud.getAttribute('data-sound-racer-position'));
  expect(recovered.recoveries).toBe(0);
  expect(recovered.progress).toBeGreaterThan(after.progress + 200);
  expect(recovered.missedCorrect).toBeGreaterThan(0);
});


test.describe('Sound Racer finger controls',()=>{
  test.use({hasTouch:true});
  for(const [width,height] of [[390,844],[844,390]]) test(`short finger taps steer on ${width}x${height}`,async({page},testInfo)=>{
    test.setTimeout(90000);
    await page.setViewportSize({width,height});
    await page.emulateMedia({reducedMotion:'reduce'});
    await deterministicRace(page);
    const hud=page.locator('[data-sound-racer-position]');
    await expect(hud).toBeVisible({timeout:45000});
      const before=JSON.parse(await hud.getAttribute('data-sound-racer-position'));
    const control=await page.getByRole('button',{name:'Steer left',exact:true}).boundingBox();
    expect(control.width).toBeGreaterThanOrEqual(56);expect(control.height).toBeGreaterThanOrEqual(56);
    await page.touchscreen.tap(control.x+control.width/2,control.y+control.height/2);
    await page.waitForTimeout(500);
    const after=JSON.parse(await hud.getAttribute('data-sound-racer-position'));
    expect(angleDelta(before.heading,after.heading)).toBeLessThan(-0.03);
    await page.screenshot({path:testInfo.outputPath('finger-steering.png')});
  });
});

test('Sound Racer wrong word gives feedback while the kart keeps racing',async({page})=>{
  test.setTimeout(120000);
  await page.setViewportSize({width:960,height:600});
  await page.emulateMedia({reducedMotion:'reduce'});
  await deterministicRace(page);
  const hud=page.locator('[data-sound-racer-position]');await expect(hud).toBeVisible({timeout:45000});
  const track=buildTrack('b',{difficulty:'easy',seed:0});
  const wrong=track.gates.find(gate=>gate.kind==='word' && !gate.correct);
  let held='',result;
  for(let i=0;i<200;i++) {
    result=JSON.parse(await hud.getAttribute('data-sound-racer-position'));
    if(result.wordsWrong)break;
    const lateral=wrong.z-result.progress<24?[-3.15,0,3.15][wrong.lane]:0;
    const inspection=await page.locator('.sound-racer').evaluate(node=>node.racerInspection);
    const error=lateral-(inspection.aimLateral ?? result.lateral);
    const desired=error<-.25?'ArrowLeft':error>.25?'ArrowRight':'';
    if(held!==desired){if(held)await page.keyboard.up(held);if(desired)await page.keyboard.down(desired);held=desired;}
    await page.waitForTimeout(100);
  }
  if(held)await page.keyboard.up(held);
  expect(result.wordsWrong).toBeGreaterThan(0);
  await expect(page.locator('[data-sr="banner"]')).toContainText(`${wrong.word} starts with`);
  await page.waitForTimeout(500);
  expect(JSON.parse(await hud.getAttribute('data-sound-racer-position')).progress).toBeGreaterThan(result.progress);
});

for(const difficulty of ['medium','hard']) test(`Sound Racer ${difficulty} world keeps the live 3D kart`,async({page},testInfo)=>{
  test.setTimeout(90000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:960,height:600});
  await deterministicRace(page,difficulty);
  const hud=page.locator('[data-sound-racer-position]');await expect(hud).toBeVisible({timeout:45000});
  const before=JSON.parse(await hud.getAttribute('data-sound-racer-position'));
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(700);await page.keyboard.up('ArrowRight');
  const after=JSON.parse(await hud.getAttribute('data-sound-racer-position'));
  expect(after.heading).not.toBe(before.heading);
  expect(errors).toEqual([]);
  await page.screenshot({path:testInfo.outputPath(`${difficulty}-world.png`)});
});
