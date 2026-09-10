import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {buildSoundRacerRace as buildTrack} from '../../src/utils/soundRacerRace.js';
import {soundRacerLadder} from '../../src/utils/soundRacerTracks.js';

test.use({trace:'off'});
import {sampleCircuitPath,offsetCircuitPoint,angleDelta} from '../../src/utils/soundRacerPhysics.js';

test('Sound Racer steering drives a real three-lap race and catches fresh words', async({page},testInfo)=>{
  test.setTimeout(900000);
  // Cap startup rendering while assets arrive. Playwright clock.install
  // subsequently owns RAF at about60Hz; report actual frame counters below.
  await page.addInitScript(() => {
    window.requestAnimationFrame = callback => window.setTimeout(() => callback(performance.now()), 50);
    window.cancelAnimationFrame = id => window.clearTimeout(id);
  });
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:960,height:600});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(() => localStorage.setItem('literacy-guide-learn-games:fullscreen-overlay-preview', JSON.stringify({games:{'sound-racer':{checkpoints:{easy:{level:9,totalLevels:10}}}}})));
  await page.goto('/preview/game-overlay.html?game=sound-racer&sound=0&music=0');
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  const hud=page.locator('[data-sound-racer-position]');
  await expect(hud).toBeVisible({timeout:45000});
  await expect(hud).toHaveAttribute('data-sound-racer-asset','ready',{timeout:30000});
  await page.clock.install();
  const track=buildTrack(soundRacerLadder('easy')[9],{difficulty:'easy',seed:9});
  let held='',left=0,right=0,lastProgress=0;
  for(let i=0;i<3200;i++) {
    const state=JSON.parse(await hud.getAttribute('data-sound-racer-position'));
    if(i%100===0) fs.writeFileSync(testInfo.outputPath('route-progress.json'),JSON.stringify({iterations:i,simulatedSeconds:i/10,state,render:await page.locator('.sound-racer').evaluate(node=>node.racerInspection)},null,2));
    if(state.progress>=track.raceLength && state.wordsCorrect>=track.needed) {lastProgress=state.progress;break;}
    const inspection=await page.locator('.sound-racer').evaluate(node=>node.racerInspection);
    const gate=inspection.nextGates.find(gate=>gate.z>state.progress+1);
    const lookDistance=6;
    let lateral=0;
    if(gate && gate.z-state.progress<22) lateral=gate.correct ? [-3.15,0,3.15][gate.lane] : gate.lane===1 ? 2.9 : 0;
    const aim=offsetCircuitPoint(sampleCircuitPath(track.path,state.progress+lookDistance),lateral);
    const error=angleDelta(state.heading,Math.atan2(aim.x-state.x,-(aim.z-state.z)));
    const desired=error < -0.045 ? 'ArrowLeft' : error > 0.045 ? 'ArrowRight' : '';
    if(desired!==held) {
      if(held)await page.keyboard.up(held);
      if(desired)await page.keyboard.down(desired);
      held=desired;
    }
    if(desired==='ArrowLeft')left++;if(desired==='ArrowRight')right++;
    await page.clock.runFor(100);
    if(i===220 || i===900 || i===1500)await page.screenshot({path:testInfo.outputPath(`corner-${i}.png`)});
    lastProgress=state.progress;
  }
  if(held)await page.keyboard.up(held);
  expect(lastProgress).toBeGreaterThanOrEqual(track.raceLength);
  expect(left).toBeGreaterThan(20);expect(right).toBeGreaterThan(20);
  await expect(page.locator('[data-sr="words"]')).toHaveText(`${track.needed} / ${track.needed} words`);
  await expect(page.getByRole('button',{name:'Next level',exact:true})).toBeVisible();
  expect(errors).toEqual([]);
  fs.writeFileSync(testInfo.outputPath('finished-route.json'),JSON.stringify({state:JSON.parse(await hud.getAttribute('data-sound-racer-position')),render:await page.locator('.sound-racer').evaluate(node=>node.racerInspection)},null,2));
  await testInfo.attach('race-render-metrics',{body:JSON.stringify(await page.locator('.sound-racer').evaluate(node=>node.racerInspection)),contentType:'application/json'});
  await testInfo.attach('race-result',{body:await hud.getAttribute('data-sound-racer-position'),contentType:'application/json'});
  await page.screenshot({path:testInfo.outputPath('full-circuit.png')});
  await page.getByRole('button',{name:'Next level',exact:true}).click();
  await page.clock.runFor(400);
  await expect(page.locator('[data-sr="words"]')).toHaveText(`0 / ${buildTrack(soundRacerLadder('medium')[0],{difficulty:'medium',seed:0}).needed} words`);
  await expect(page.locator('[data-sr="target"]')).not.toHaveText(soundRacerLadder('easy')[9]);
});

test('Sound Racer pointer steering changes heading, releases, pauses and recovers',async({page})=>{
  test.setTimeout(180000);
  await page.setViewportSize({width:960,height:600});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/preview/game-overlay.html?game=sound-racer&sound=0&music=0');
  const hud=page.locator('[data-sound-racer-position]');await expect(hud).toBeVisible({timeout:45000});
  await page.clock.install();
  const before=JSON.parse(await hud.getAttribute('data-sound-racer-position'));
  const control=await page.getByRole('button',{name:'Steer right',exact:true}).boundingBox();
  await page.mouse.move(control.x+control.width/2,control.y+control.height/2);await page.mouse.down();
  await page.clock.runFor(600);await page.mouse.up();
  const after=JSON.parse(await hud.getAttribute('data-sound-racer-position'));
  expect(Math.abs(angleDelta(before.heading,after.heading))).toBeGreaterThan(.1);
  await page.getByRole('button',{name:'Close Sound Racer',exact:true}).click();
  const paused=await hud.getAttribute('data-sound-racer-position');await page.clock.runFor(2000);
  expect(await hud.getAttribute('data-sound-racer-position')).toBe(paused);
  await page.getByRole('button',{name:/Keep playing/i}).click();
  await page.clock.runFor(30000);
  const recovered=JSON.parse(await hud.getAttribute('data-sound-racer-position'));
  expect(recovered.recoveries).toBeGreaterThan(0);
  expect(recovered.missedCorrect).toBeGreaterThan(0);
});


test.describe('Sound Racer finger controls',()=>{
  test.use({hasTouch:true});
  for(const [width,height] of [[390,844],[844,390]]) test(`short finger taps steer on ${width}x${height}`,async({page},testInfo)=>{
    test.setTimeout(90000);
    await page.setViewportSize({width,height});
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto('/preview/game-overlay.html?game=sound-racer&sound=0&music=0');
    const hud=page.locator('[data-sound-racer-position]');
    await expect(hud).toBeVisible({timeout:45000});
    await page.clock.install();
    const before=JSON.parse(await hud.getAttribute('data-sound-racer-position'));
    const control=await page.getByRole('button',{name:'Steer left',exact:true}).boundingBox();
    expect(control.width).toBeGreaterThanOrEqual(56);expect(control.height).toBeGreaterThanOrEqual(56);
    await page.touchscreen.tap(control.x+control.width/2,control.y+control.height/2);
    await page.clock.runFor(500);
    const after=JSON.parse(await hud.getAttribute('data-sound-racer-position'));
    expect(angleDelta(before.heading,after.heading)).toBeLessThan(-0.03);
    await page.screenshot({path:testInfo.outputPath('finger-steering.png')});
  });
});

test('Sound Racer wrong word gives feedback while the kart keeps racing',async({page})=>{
  test.setTimeout(120000);
  await page.setViewportSize({width:960,height:600});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/preview/game-overlay.html?game=sound-racer&sound=0&music=0');
  const hud=page.locator('[data-sound-racer-position]');await expect(hud).toBeVisible({timeout:45000});
  await page.clock.install();
  const track=buildTrack('b',{difficulty:'easy',seed:0});
  const wrong=track.gates.find(gate=>gate.kind==='word' && !gate.correct);
  let held='',result;
  for(let i=0;i<200;i++) {
    result=JSON.parse(await hud.getAttribute('data-sound-racer-position'));
    if(result.wordsWrong)break;
    const lateral=wrong.z-result.progress<24?[-3.15,0,3.15][wrong.lane]:0;
    const aim=offsetCircuitPoint(sampleCircuitPath(track.path,result.progress+6),lateral);
    const error=angleDelta(result.heading,Math.atan2(aim.x-result.x,-(aim.z-result.z)));
    const desired=error<-.045?'ArrowLeft':error>.045?'ArrowRight':'';
    if(held!==desired){if(held)await page.keyboard.up(held);if(desired)await page.keyboard.down(desired);held=desired;}
    await page.clock.runFor(100);
  }
  if(held)await page.keyboard.up(held);
  expect(result.wordsWrong).toBeGreaterThan(0);
  await expect(page.locator('[data-sr="banner"]')).toContainText(`${wrong.word} starts with`);
  await page.clock.runFor(500);
  expect(JSON.parse(await hud.getAttribute('data-sound-racer-position')).progress).toBeGreaterThan(result.progress);
});

for(const difficulty of ['medium','hard']) test(`Sound Racer ${difficulty} world keeps the live 3D kart`,async({page},testInfo)=>{
  test.setTimeout(90000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:960,height:600});
  await page.goto(`/preview/game-overlay.html?game=sound-racer&difficulty=${difficulty}&sound=0&music=0`);
  const hud=page.locator('[data-sound-racer-position]');await expect(hud).toBeVisible({timeout:45000});
  const before=JSON.parse(await hud.getAttribute('data-sound-racer-position'));
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(700);await page.keyboard.up('ArrowRight');
  const after=JSON.parse(await hud.getAttribute('data-sound-racer-position'));
  expect(after.heading).not.toBe(before.heading);
  expect(errors).toEqual([]);
  await page.screenshot({path:testInfo.outputPath(`${difficulty}-world.png`)});
});
