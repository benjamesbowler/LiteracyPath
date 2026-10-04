import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const snapshot=page=>page.evaluate(()=>window.__arcadePreviewSnapshot?.());
async function open(page,difficulty='medium',sound=false){
  await page.addInitScript(()=>localStorage.setItem('lp-arcade-onboarded-v1:tower-tumble','1'));
  await page.goto(`/preview/game-overlay.html?game=tower-tumble&difficulty=${difficulty}&sound=${sound?1:0}`);
  await expect(page.locator('.tower-tumble')).toBeVisible();
  await expect.poll(async()=>(await snapshot(page))?.renderer,{timeout:15000}).toMatch(/3d|drawing/);
}
async function reach(page,chunk){
  const prior=await snapshot(page),count=prior.evidence.firstResponses.length+prior.evidence.assistedRetries.length;
  for(let attempt=0;attempt<4;attempt++){
    await page.getByRole('button',{name:`Reach and smash ${chunk} brick`,exact:true}).click();
    await page.waitForFunction(before=>{const s=window.__arcadePreviewSnapshot?.();return s&&(s.evidence.firstResponses.length+s.evidence.assistedRetries.length>before||s.phase==='retry');},count,{timeout:15000});
    const next=await snapshot(page);
    if(next.evidence.firstResponses.length+next.evidence.assistedRetries.length>count)return;
    await retryRoute(page);
  }
  expect((await snapshot(page)).evidence.firstResponses.length+(await snapshot(page)).evidence.assistedRetries.length).toBeGreaterThan(count);
}
async function retryRoute(page){
  const failed=await snapshot(page);expect(failed.phase).toBe('retry');expect(failed.lives).toBe(0);
  await page.getByRole('button',{name:'Retry route · 3 lives',exact:true}).click();
  const recovered=await snapshot(page);expect(recovered.lives).toBe(3);expect(recovered.phase).toBe('playing');
  for(const key of ['index','unitIndex','mistakes','hintUsed','supportReasons','choices','geometry'])expect(recovered[key]).toEqual(failed[key]);
  for(const key of ['firstResponses','assistedRetries','acceptedResponses','completions'])expect(recovered.evidence[key]).toEqual(failed.evidence[key]);
  expect(recovered.evidence.motorEvents.routeRetries).toBe(failed.evidence.motorEvents.routeRetries+1);
  return recovered;
}
async function accessible(page){await page.getByRole('button',{name:'Reach bricks',exact:true}).click();await expect(page.getByRole('group',{name:'Reach and smash a grapheme brick'})).toBeVisible();}

async function walkTo(page,x){
  // Native taps near a ladder do not leave a key held across multiple remote
  // calls. Calibrated timer holds overshot the narrow upper ledge when trace
  // capture delayed key-up; this still traverses the actual collision route.
  for(let step=0;step<120;step++){
    const current=(await snapshot(page)).position.x,delta=x-current;
    if(Math.abs(delta)<.35)return;
    const key=delta>0?'ArrowRight':'ArrowLeft';
    await page.keyboard.press(key,{delay:Math.abs(delta)>2?150:20});
    await page.waitForTimeout(60);
  }
  expect(Math.abs((await snapshot(page)).position.x-x)).toBeLessThan(.35);
}
async function climbTo(page,y){
  await page.keyboard.down('ArrowUp');
  await page.waitForFunction(target=>{const s=window.__arcadePreviewSnapshot?.();return Math.abs(s?.position.y-target)<.005;},y,{timeout:15000});
  await page.keyboard.up('ArrowUp');
}

for(const [difficulty,world,hero] of [['easy','meadow','Bouncy'],['medium','dino','Chompy'],['hard','moonwood','Pip']]){
  test(`${difficulty} has its own world, canonical hero, rescue residents and live drawing fallback`,async({page},info)=>{
    await open(page,difficulty);const initial=await snapshot(page);
    expect(initial.world).toBe(world);expect(initial.hero).toBe(hero);expect(initial.geometry.world).toBe(world);
    await expect(page.locator('.tower-tumble')).toHaveAttribute('data-pal-world',world);
    expect(await page.locator('.tower-tumble__hud').innerText()).not.toContain(initial.word);
    await page.screenshot({path:info.outputPath(`${difficulty}-${world}-opening.png`)});
    await page.locator('.tower-tumble__world canvas').evaluate(canvas=>canvas.dispatchEvent(new Event('webglcontextlost')));
    await expect.poll(async()=>(await snapshot(page)).renderer).toBe('drawing');
    const drawing=await snapshot(page);expect(drawing.world).toBe(world);expect(drawing.hero).toBe(hero);expect(drawing.choices).toEqual(initial.choices);
    await page.screenshot({path:info.outputPath(`${difficulty}-${world}-fallback.png`)});
  });
}

for(const [name,width,height] of [['phone',390,844],['small-phone',320,568],['small-phone-landscape',568,320],['landscape-phone',844,390],['tablet-landscape',1024,768],['tablet-portrait',768,1024],['desktop',1280,900],['chromebook',1366,768],['projector',1920,1080]]){
  test(`Tower Tumble ${name} world and all native controls fit and stay reachable`,async({page},info)=>{
    await page.setViewportSize({width,height});await open(page);
    await expect(page.locator('.tower-tumble__world canvas')).toBeVisible();
    await expect(page.getByRole('button',{name:'Gentle moves',exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:'Reach bricks',exact:true})).toBeVisible();
    const layout=await page.locator('.tower-tumble button:visible').evaluateAll(buttons=>buttons.map(button=>{const r=button.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};}));
    for(const rect of layout){expect(rect.width).toBeGreaterThanOrEqual(56);expect(rect.height).toBeGreaterThanOrEqual(56);expect(rect.x).toBeGreaterThanOrEqual(0);expect(rect.right).toBeLessThanOrEqual(width+.5);expect(rect.bottom).toBeLessThanOrEqual(height+.5);}
    expect(await page.locator('.tower-tumble').evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
    await page.screenshot({path:info.outputPath(`${name}-world.png`)});
    await accessible(page);
    const choices=await page.locator('.tower-tumble__accessible button').evaluateAll(buttons=>buttons.map(button=>{const r=button.getBoundingClientRect(),field=button.closest('.tower-tumble__playfield').getBoundingClientRect();return{width:r.width,height:r.height,bottom:r.bottom,fieldBottom:field.bottom,hit:button.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};}));
    for(const choice of choices){expect(choice.width).toBeGreaterThanOrEqual(56);expect(choice.height).toBeGreaterThanOrEqual(56);expect(choice.bottom).toBeLessThanOrEqual(choice.fieldBottom+.5);expect(choice.hit).toBe(true);}
    await page.screenshot({path:info.outputPath(`${name}-assisted-choices.png`)});
  });
}

test('actual keyboard walking, jumping, scaffold climbing and smashing preserve motor/learning separation',async({page},info)=>{
  test.setTimeout(70000);await open(page,'easy');
  await page.screenshot({path:info.outputPath('manual-opening-after-coverage.png')});
  const initial=await snapshot(page);await page.locator('.tower-tumble').focus();
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(150);await page.keyboard.up('ArrowRight');
  expect((await snapshot(page)).position.x).toBeGreaterThan(initial.position.x+.3);
  await page.keyboard.press('Space');await expect.poll(async()=>(await snapshot(page)).position.y).toBeGreaterThan(.2);
  await page.waitForTimeout(1000);
  // A real ladder, using deliberate movement and E to demolish route walls.
  const ladder=(await snapshot(page)).geometry.ladders[0];
  const wall=(await snapshot(page)).geometry.shortcuts[0];
  await walkTo(page,wall.x-1);
  await page.keyboard.press('e');await expect.poll(async()=>(await snapshot(page)).evidence.motorEvents.shortcuts).toBeGreaterThan(0);
  await walkTo(page,ladder.x);
  await climbTo(page,3);
  const before=await snapshot(page);const nearest=before.bricks.filter(b=>Math.abs(b.y-before.position.y)<.9).sort((a,b)=>Math.abs(a.x-before.position.x)-Math.abs(b.x-before.position.x))[0];
  expect(nearest).toBeTruthy();
  await walkTo(page,nearest.x);
  await page.keyboard.press('e');await expect.poll(async()=>{const s=await snapshot(page);return s.evidence.firstResponses.length+s.evidence.assistedRetries.length;}).toBeGreaterThan(before.evidence.firstResponses.length+before.evidence.assistedRetries.length);
  expect((await snapshot(page)).evidence.completions.length).toBeLessThanOrEqual(1);
  // A wall between two letter bricks must still be physically demolishable.
  const upperWall=initial.geometry.shortcuts[1],secondLadder=initial.geometry.ladders[1];
  await walkTo(page,upperWall.x+1);
  const shortcuts=(await snapshot(page)).evidence.motorEvents.shortcuts;
  await page.keyboard.press('e');await expect.poll(async()=>(await snapshot(page)).evidence.motorEvents.shortcuts).toBeGreaterThan(shortcuts);
  await walkTo(page,secondLadder.x);
  await climbTo(page,6);
  const thirdLadder=initial.geometry.ladders[2];
  await walkTo(page,thirdLadder.x);
  await climbTo(page,9);
  await page.screenshot({path:info.outputPath('manual-upper-scaffold.png')});
  await page.setViewportSize({width:568,height:320});await page.waitForTimeout(700);
  expect((await snapshot(page)).position.y).toBeCloseTo(9,1);
  await page.screenshot({path:info.outputPath('short-landscape-upper-scaffold.png')});
});

test('held native movement releases on pointer up and native Jump and Smash remain usable',async({page})=>{
  await open(page,'easy');const before=await snapshot(page),right=page.getByRole('button',{name:'Move right',exact:true}),rect=await right.boundingBox();
  await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();
  await expect.poll(async()=>(await snapshot(page)).position.x).toBeGreaterThan(before.position.x+.3);await page.mouse.up();
  const released=await snapshot(page);await page.waitForTimeout(200);expect((await snapshot(page)).position.x).toBeCloseTo(released.position.x,1);
  await page.getByRole('button',{name:'Jump',exact:true}).click();await expect.poll(async()=>(await snapshot(page)).position.y).toBeGreaterThan(.1);
  await page.getByRole('button',{name:'Smash',exact:true}).click();expect((await snapshot(page)).evidence.completions).toHaveLength(0);
});

test('two wrong impacts unlock only a partial hint; retries keep geometry, target and shuffled brick order',async({page},info)=>{
  test.setTimeout(50000);await open(page,'medium');await accessible(page);const initial=await snapshot(page),wrong=initial.choices.find(c=>c!==initial.chunks[0]);
  await reach(page,wrong);await expect(page.getByRole('button',{name:'Partial hint',exact:true})).toHaveCount(0);
  await expect(page.locator('.tower-tumble__status')).toHaveText('That spelling part does not fit here. Listen and try again.');
  await reach(page,wrong);await page.getByRole('button',{name:'Partial hint',exact:true}).click();
  const current=await snapshot(page);expect(current.mistakes).toBe(2);expect(current.word).toBe(initial.word);expect(current.choices).toEqual(initial.choices);expect(current.geometry).toEqual(initial.geometry);
  await expect(page.locator('.tower-tumble__hint')).not.toHaveText(initial.word);await expect(page.locator('.tower-tumble__hint')).toContainText('*');
  expect(await page.locator('.tower-tumble__hud').innerText()).not.toContain(initial.word);
  await page.screenshot({path:info.outputPath('wrong-response-partial-hint.png')});
  await reach(page,initial.chunks[0]);const repaired=(await snapshot(page)).evidence.assistedRetries.at(-1);expect(repaired.correct).toBe(true);expect(repaired.independentEncodingPractice).toBe(false);expect(repaired.supportReasons).toContain('partial-spelling-hint');
  await page.screenshot({path:info.outputPath('supported-correct-sound.png')});
});

test('pause and hidden-tab suspend traversal, rescue timing and owned audio; movement resumes after help',async({page})=>{
  await open(page);await page.locator('.tower-tumble').focus();await page.keyboard.down('ArrowRight');await page.waitForTimeout(150);
  await page.getByRole('button',{name:'Pause Tower Tumble',exact:true}).click();const before=await snapshot(page);await page.waitForTimeout(350);expect((await snapshot(page)).position).toEqual(before.position);expect((await snapshot(page)).elapsed).toBe(before.elapsed);
  await page.keyboard.up('ArrowRight');await page.getByRole('button',{name:'Resume game',exact:true}).click();
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});const hidden=await snapshot(page);await page.waitForTimeout(250);expect((await snapshot(page)).elapsed).toBe(hidden.elapsed);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(250);await page.keyboard.up('ArrowRight');expect((await snapshot(page)).position.x).toBeGreaterThan(hidden.position.x);
  await page.getByRole('button',{name:'Open game controls',exact:true}).click();const tools=await snapshot(page);await page.waitForTimeout(150);expect((await snapshot(page)).elapsed).toBe(tools.elapsed);
  await page.getByRole('button',{name:'Open Tower Tumble mission guide',exact:true}).click();await expect(page.getByRole('dialog',{name:'Tower Tumble mission guide',exact:true})).toBeVisible();await page.getByRole('dialog',{name:'Tower Tumble mission guide',exact:true}).getByRole('button',{name:'Keep playing',exact:true}).click();await expect.poll(async()=>(await snapshot(page)).paused).toBe(false);
});

test('recorded word audio is actually delivered before the strike and movement assistance never answers the cue',async({page})=>{
  test.setTimeout(45000);await open(page,'medium',true);
  await page.getByRole('button',{name:'Hear the whole word again',exact:true}).click();
  await expect.poll(async()=>(await snapshot(page)).delivery,{timeout:15000}).toBe('delivered');
  const heard=await snapshot(page);
  await page.getByRole('button',{name:'Gentle moves',exact:true}).click();
  await page.getByRole('button',{name:'Free moves',exact:true}).click();
  expect((await snapshot(page)).evidence.firstResponses).toHaveLength(0);expect((await snapshot(page)).supportReasons).toEqual(heard.supportReasons);
  await accessible(page);await reach(page,heard.chunks[0]);
  const row=(await snapshot(page)).evidence.firstResponses[0];expect(row.deliveryAtResponse).toBe('delivered');expect(row.stimulusDelivered).toBe(true);expect(row.pictureDelivery).toBe('delivered');expect(row.wordVisible).toBe(false);expect(row.independentEncodingPractice).toBe(heard.supportReasons.length===0);
});

test('a wrong impact gives recorded retry guidance and replays the cue without locking movement or upgrading evidence',async({page})=>{
  test.setTimeout(50000);const requests=[];page.on('request',request=>requests.push(request.url()));
  await open(page,'medium',true);await page.getByRole('button',{name:'Hear the whole word again',exact:true}).click();
  await expect.poll(async()=>(await snapshot(page)).delivery,{timeout:15000}).toBe('delivered');
  await accessible(page);const initial=await snapshot(page),wrong=initial.choices.find(chunk=>chunk!==initial.chunks[0]);
  await reach(page,wrong);const rejected=(await snapshot(page)).evidence.firstResponses[0];expect(rejected.correct).toBe(false);expect(rejected.deliveryAtResponse).toBe('delivered');
  await expect.poll(()=>requests.some(url=>url.includes('/instruction/try-again-'))).toBe(true);
  await expect(page.getByRole('button',{name:'Move right',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Hide bricks',exact:true}).click();await page.locator('.tower-tumble').focus();
  const before=await snapshot(page);await page.keyboard.down('ArrowLeft');await page.waitForTimeout(130);await page.keyboard.up('ArrowLeft');
  expect((await snapshot(page)).performance.inputSamples).toBeGreaterThan(before.performance.inputSamples);
  await expect.poll(async()=>(await snapshot(page)).delivery,{timeout:15000}).toBe('delivered');
  expect((await snapshot(page)).evidence.firstResponses[0]).toEqual(rejected);expect((await snapshot(page)).choices).toEqual(initial.choices);
  await accessible(page);await reach(page,initial.chunks[0]);const accepted=(await snapshot(page)).evidence.assistedRetries.at(-1);
  expect(accepted.correct).toBe(true);expect(accepted.independentEncodingPractice).toBe(false);expect(accepted.supportReasons).toContain('contrast-after-wrong-response');
});

test('reduced motion retains physical actions, native controls and uncued spelling choices',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await open(page,'hard');
  const initial=await snapshot(page);await page.locator('.tower-tumble').focus();await page.keyboard.press('Space');
  await expect.poll(async()=>(await snapshot(page)).position.y).toBeGreaterThan(.1);
  expect((await snapshot(page)).choices).toEqual(initial.choices);expect(await page.locator('.tower-tumble__hud').innerText()).not.toContain(initial.word);
});

test('resume restores accepted sound and first response/support, not a fresh independent answer',async({page})=>{
  test.setTimeout(45000);await open(page,'easy');await accessible(page);const initial=await snapshot(page);await reach(page,initial.chunks[0]);const accepted=await snapshot(page);
  await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();
  await expect.poll(async()=>(await snapshot(page))?.unitIndex).toBe(1);const restored=await snapshot(page);
  expect(restored.choices).toEqual(initial.choices);expect(restored.evidence.firstResponses).toEqual(accepted.evidence.firstResponses);expect(restored.supportReasons).toEqual(accepted.supportReasons);
});

test('WebGL loss and missing picture keep live fallback controls without revealing target text',async({page})=>{
  await page.route('**/images/**',route=>route.abort());await page.route('**/media/**',route=>route.abort());await open(page,'hard');
  await expect(page.getByRole('button',{name:'Retry the word picture',exact:true})).toBeVisible();const original=await snapshot(page);
  await page.locator('.tower-tumble__world canvas').evaluate(canvas=>canvas.dispatchEvent(new Event('webglcontextlost')));
  await expect.poll(async()=>(await snapshot(page)).renderer).toBe('drawing');expect(await page.locator('.tower-tumble__hud').innerText()).not.toContain(original.word);
  await page.locator('.tower-tumble').focus();await page.keyboard.down('ArrowRight');await page.waitForTimeout(150);await page.keyboard.up('ArrowRight');expect((await snapshot(page)).position.x).toBeGreaterThan(original.position.x);
});

for(const fault of ['scene-kit','pal-art'])test(`failed ${fault} assets preserve a complete physical scene, selected response and recovery`,async({page},info)=>{
  test.setTimeout(45000);
  await page.route(fault==='scene-kit'?'**/game-assets/physical-arcade/tower-tumble/**':'**/game-assets/physical-arcade/pals/**',route=>route.abort());
  await open(page,'easy');const before=await snapshot(page);
  if(fault==='pal-art')expect(before.performance.current.art.hero).toBe('unavailable');
  await page.locator('.tower-tumble').focus();await page.keyboard.press('Space');
  await expect.poll(async()=>(await snapshot(page)).position.y).toBeGreaterThan(.1);await page.waitForTimeout(1000);
  await accessible(page);await reach(page,before.chunks[0]);
  const accepted=await snapshot(page);expect(accepted.evidence.firstResponses[0].correct).toBe(true);expect(accepted.choices).toEqual(before.choices);
  expect(await page.locator('.tower-tumble__hud').innerText()).not.toContain(before.word);
  await page.getByRole('button',{name:'Hide bricks',exact:true}).click();
  await page.screenshot({path:info.outputPath(`${fault}-physical-recovery.png`)});
  await page.locator('.tower-tumble__world canvas').evaluate(canvas=>canvas.dispatchEvent(new Event('webglcontextlost')));
  await expect.poll(async()=>(await snapshot(page)).renderer).toBe('drawing');expect((await snapshot(page)).unitIndex).toBe(1);
  await page.screenshot({path:info.outputPath(`${fault}-canvas-recovery.png`)});
});

for(const difficulty of ['easy','medium','hard'])test(`complete ${difficulty} nine-rescue outing advances automatically and saves practice without motor mastery`,async({page},info)=>{
  test.setTimeout(300000);const layouts=[],maps=[];const voiced=difficulty==='medium';await open(page,difficulty,voiced);await accessible(page);
  for(let index=0;index<9;index++){
    await expect.poll(async()=>(await snapshot(page)).index,{timeout:15000}).toBe(index);
    if(voiced){if(index===0)await page.getByRole('button',{name:'Hear the whole word again',exact:true}).click();await expect.poll(async()=>(await snapshot(page)).delivery,{timeout:15000}).toBe('delivered');}
    const round=await snapshot(page);layouts.push(round.geometry.layoutId);maps.push(JSON.stringify([round.geometry.platforms,round.geometry.ladders,round.geometry.shortcuts,round.geometry.collectibles]));
    {
      await page.getByRole('button',{name:'Hide bricks',exact:true}).click();
      await page.screenshot({path:info.outputPath(`${difficulty}-route-${index}-play.png`)});
      await accessible(page);
    }
    for(const chunk of round.chunks)await reach(page,chunk);
    await expect.poll(async()=>(await snapshot(page)).evidence.completions.length).toBe(index+1);
    if(index===2||index===5)await page.screenshot({path:info.outputPath(`tower-${index/3|0}-rescue.png`)});
  }
  expect(new Set(layouts).size).toBe(9);expect(new Set(maps).size).toBe(9);
  const completedPlay=await snapshot(page);
  expect(completedPlay.performance.frames).toBeGreaterThan(0);expect(completedPlay.performance.inputSamples).toBeGreaterThanOrEqual(9);
  expect(completedPlay.performance.steadyState.some(segment=>segment.frames>0&&segment.meanMs>0&&segment.p95Ms>0)).toBe(true);
  if(voiced)expect(completedPlay.evidence.firstResponses.every(row=>row.stimulusDelivered&&row.pictureDelivery==='delivered')).toBe(true);
  else expect(completedPlay.evidence.firstResponses.every(row=>!row.stimulusDelivered&&!row.independentEncodingPractice)).toBe(true);
  const report={game:'tower-tumble',difficulty,world:completedPlay.world,hero:completedPlay.hero,soundEnabled:voiced,viewport:page.viewportSize(),environment:'Playwright Chromium browser emulation; not physical-device proof',rescues:completedPlay.evidence.completions.length,layouts,lives:completedPlay.lives,motorEvents:completedPlay.evidence.motorEvents,performance:completedPlay.performance,
    firstResponses:completedPlay.evidence.firstResponses.map(row=>({responseId:row.responseId,deliveryAtResponse:row.deliveryAtResponse,pictureDelivery:row.pictureDelivery,supportReasons:row.supportReasons,independentEncodingPractice:row.independentEncodingPractice}))};
  await writeFile(info.outputPath(`${difficulty}-sustained-performance.json`),JSON.stringify(report,null,2));
  await expect(page.getByRole('alertdialog',{name:'Tower Tumble complete',exact:true})).toBeVisible({timeout:15000});
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('literacy-guide-learn-games:fullscreen-overlay-preview')));
  const evidence=saved.games['tower-tumble'].practiceRecord;
  expect(evidence).toBeTruthy();expect(saved.games['tower-tumble'].journeys[difficulty].completed).toContain(0);
  expect(evidence.completions[0].practiceOnly).toBe(true);expect(evidence.completions[0].contentVersion).toBe('tower-tumble-v1');expect(evidence.completions[0].practiceContext.masteryClaim).toBe(false);
  await page.screenshot({path:info.outputPath(`${difficulty}-complete.png`)});
});


async function nativeBarrelHit(page){
  const before=await snapshot(page);await page.locator('.tower-tumble').focus();
  await page.waitForFunction(()=>{const s=window.__arcadePreviewSnapshot?.();return s?.barrels.some(b=>Math.abs(b.y-s.position.y)<.3);},{},{timeout:25000});
  for(let step=0;step<100;step++){
    const current=await snapshot(page);if(current.lives<before.lives)return current;
    const barrel=current.barrels.find(b=>Math.abs(b.y-current.position.y)<.5);if(!barrel){await page.waitForTimeout(100);continue;}
    await page.keyboard.press(barrel.x>current.position.x?'ArrowRight':'ArrowLeft',{delay:80});await page.waitForTimeout(40);
  }
  expect((await snapshot(page)).lives).toBe(before.lives-1);return snapshot(page);
}

test('real rolling barrels remove one life, preserve spelling through save/zero-life retry and work in live Canvas',async({page},info)=>{
  test.setTimeout(180000);await open(page,'medium');await accessible(page);const initial=await snapshot(page),wrong=initial.choices.find(c=>c!==initial.chunks[0]);
  await reach(page,wrong);await reach(page,initial.chunks[0]);
  await page.getByRole('button',{name:'Hide bricks',exact:true}).click();
  const current=await snapshot(page);if(current.position.y>0){const ladder=current.geometry.ladders[0];await walkTo(page,ladder.x);await page.keyboard.down('ArrowDown');await page.waitForFunction(()=>window.__arcadePreviewSnapshot?.().position.y===0,{},{timeout:10000});await page.keyboard.up('ArrowDown');}
  await walkTo(page,0);const learned=await snapshot(page),history=JSON.stringify([learned.evidence.firstResponses,learned.evidence.assistedRetries,learned.evidence.acceptedResponses]);
  const hit=await nativeBarrelHit(page);expect(hit.lives).toBe(2);expect(hit.immunity).toBeGreaterThan(0);expect(hit.evidence.motorEvents.barrelHits).toBe(1);
  expect(hit.unitIndex).toBe(1);expect(hit.mistakes).toBe(1);expect(JSON.stringify([hit.evidence.firstResponses,hit.evidence.assistedRetries,hit.evidence.acceptedResponses])).toBe(history);
  await expect(page.getByRole('status',{name:'2 lives remaining',exact:true})).toBeVisible();await page.screenshot({path:info.outputPath('barrel-hit-two-lives.png')});
  await page.waitForTimeout(600);expect((await snapshot(page)).lives).toBe(2);
  await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();await expect.poll(async()=>(await snapshot(page))?.renderer,{timeout:15000}).toMatch(/3d|drawing/);const resumed=await snapshot(page);
  expect(resumed.lives).toBe(2);expect(resumed.unitIndex).toBe(1);expect(resumed.mistakes).toBe(1);expect(resumed.geometry.layoutId).toBe(hit.geometry.layoutId);expect(JSON.stringify([resumed.evidence.firstResponses,resumed.evidence.assistedRetries,resumed.evidence.acceptedResponses])).toBe(history);
  await nativeBarrelHit(page);await nativeBarrelHit(page);const failed=await snapshot(page);expect(failed.lives).toBe(0);expect(failed.phase).toBe('retry');expect(failed.mistakes).toBe(1);
  await page.screenshot({path:info.outputPath('zero-life-route-retry.png')});
  for(const [name,width,height] of [['phone',320,568],['landscape',568,320]]){
    await page.setViewportSize({width,height});const retry=page.getByRole('button',{name:'Retry route · 3 lives',exact:true});await expect(retry).toBeVisible();
    const box=await retry.boundingBox();expect(box.width).toBeGreaterThanOrEqual(56);expect(box.height).toBeGreaterThanOrEqual(56);expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width+.5);expect(box.y+box.height).toBeLessThanOrEqual(height+.5);
    expect(await retry.evaluate(button=>{const r=button.getBoundingClientRect();return button.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
    await page.screenshot({path:info.outputPath(`zero-life-${name}-retry.png`)});
  }
  await page.setViewportSize({width:1280,height:900});await retryRoute(page);
  const retried=await snapshot(page);expect(retried.lives).toBe(3);expect(retried.geometry).toEqual(failed.geometry);expect(retried.unitIndex).toBe(1);expect(retried.evidence.motorEvents.routeRetries).toBe(1);
  expect(JSON.stringify([retried.evidence.firstResponses,retried.evidence.assistedRetries,retried.evidence.acceptedResponses])).toBe(history);
  await page.locator('.tower-tumble__world canvas').evaluate(canvas=>canvas.dispatchEvent(new Event('webglcontextlost')));await expect.poll(async()=>(await snapshot(page)).renderer).toBe('drawing');
  const fallbackHit=await nativeBarrelHit(page);expect(fallbackHit.lives).toBe(2);expect(fallbackHit.evidence.motorEvents.barrelHits).toBe(4);await page.screenshot({path:info.outputPath('canvas-barrel-life.png')});
});

test('an explicitly opened brick-choice panel rests hazards without changing life or learning evidence',async({page})=>{
  await open(page);await accessible(page);const before=await snapshot(page);await page.waitForTimeout(5600);const after=await snapshot(page);
  expect(after.hazardsResting).toBe(true);expect(after.barrels).toHaveLength(0);expect(after.lives).toBe(before.lives);expect(after.evidence).toEqual(before.evidence);
  await page.getByRole('button',{name:'Hide bricks',exact:true}).click();await expect.poll(async()=>(await snapshot(page)).barrels.length,{timeout:8000}).toBeGreaterThan(0);
});
