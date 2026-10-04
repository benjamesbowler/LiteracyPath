import { test, expect } from '@playwright/test';
import { buildRallyPalsRounds } from '../../src/utils/rallyPalsRules.js';

// The Games-menu click normally activates audio; this isolated preview opens
// directly. Chromium still fetches, decodes and ends the actual recording.
test.use({reducedMotion:'reduce',launchOptions:{args:['--autoplay-policy=no-user-gesture-required']}});
const URL='/preview/game-overlay.html?game=rally-pals';
const snapshot=page=>page.evaluate(()=>window.__arcadePreviewSnapshot?.());
async function open(page,difficulty='easy',sound=false){
  await page.goto(`${URL}&difficulty=${difficulty}&sound=${sound?1:0}`);
  await expect(page.getByTestId('rally-pals-game')).toBeVisible({timeout:30000});
  await expect.poll(async()=>Boolean((await snapshot(page))?.renderer==='webgl'||(await snapshot(page))?.renderer==='canvas')).toBe(true);
  await expect.poll(async()=>(await snapshot(page))?.pictureDelivery).toBe('delivered');
}
async function chooseCorrect(page){
  const current=await snapshot(page),seed=Number(current.roundId.split(':')[2]),journey=Number(current.roundId.split(':')[3]);
  const difficulty=current.roundId.split(':')[1],round=buildRallyPalsRounds(difficulty,seed,journey)[current.index];
  await page.getByRole('button',{name:`Aim at ${round.expected}`,exact:true}).click();
  await page.getByRole('button',{name:'Serve',exact:true}).click();
  return round;
}

for(const difficulty of ['easy','medium','hard'])test(`@rally-pals ${difficulty} native forehand and Canvas lob launch from actual registered strings`,async({page})=>{
  await open(page,difficulty);
  await expect.poll(async()=>(await snapshot(page)).quality.palActionDelivery?.tennis).toBe('delivered');
  await chooseCorrect(page);const serve=await snapshot(page);
  expect(serve.lastContact.actor).toBe('player');expect(serve.lastContact.style).toBe('forehand');expect(serve.lastContact.renderer).toBe('webgl');
  expect(serve.ball.from).toEqual({x:serve.lastContact.x,z:serve.lastContact.z});expect(serve.ball.startHeight).toBe(serve.lastContact.y);
  expect(serve.ball.startHeight).toBeGreaterThan(1.5);expect(Math.abs(serve.ball.from.x-serve.player.x)).toBeGreaterThan(.7);
  await expect.poll(async()=>(await snapshot(page)).lastContact?.actor,{timeout:10000}).toBe('opponent');
  const rival=await snapshot(page);expect(rival.ball.from).toEqual({x:rival.lastContact.x,z:rival.lastContact.z});expect(rival.ball.startHeight).toBe(rival.lastContact.y);
  await page.getByRole('combobox',{name:'Game mode and tennis court'}).selectOption('targets:meadow');
  await page.locator('.rally-pals-canvas').evaluate(canvas=>{const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');gl.getExtension('WEBGL_lose_context').loseContext();});
  await expect.poll(async()=>(await snapshot(page)).renderer).toBe('canvas');
  await expect.poll(async()=>(await snapshot(page)).quality.palActionDelivery?.tennis).toBe('delivered');
  const before=(await snapshot(page)).evidence.completions.length;
  await page.getByRole('button',{name:/^Aim at /}).nth(1).click();await page.getByRole('button',{name:'Lob',exact:true}).click();
  const lob=await snapshot(page);expect(lob.lastContact.style).toBe('lob');expect(lob.lastContact.renderer).toBe('canvas');
  expect(lob.ball.from).toEqual({x:lob.lastContact.x,z:lob.lastContact.z});expect(lob.ball.startHeight).toBe(lob.lastContact.y);expect(lob.ball.startHeight).toBeGreaterThan(2);
  expect(lob.evidence.completions).toHaveLength(before);
});

for(const difficulty of ['easy','medium','hard'])test(`@rally-pals full ${difficulty} tennis match has six separate learning responses`,async({page})=>{
  test.setTimeout(300000);await open(page,difficulty);
  let last=-1,swings=0;
  for(let iteration=0;iteration<1100;iteration++){
    const current=await snapshot(page);
    if(current.phase==='complete')break;
    if(current.phase==='serve'&&current.index!==last){await chooseCorrect(page);last=current.index;}
    else if(current.phase==='rally'&&current.ball?.direction==='near'&&current.ball.z>7){
      await page.getByRole('button',{name:swings%2?'Lob':'Swing',exact:true}).click();swings++;
    }
    await page.waitForTimeout(100);
  }
  await expect.poll(async()=>(await snapshot(page))?.phase).toBe('complete');
  const result=await snapshot(page);expect(result.completions).toBe(6);expect(result.evidence.firstResponses).toHaveLength(6);
  expect(result.evidence.assistedRetries).toHaveLength(0);expect(result.score).toBe(60);expect(result.matchPoints).toBeGreaterThan(0);
  expect(swings).toBeGreaterThan(6);expect(result.evidence.firstResponses.every(row=>row.practiceOnly&&!row.wordVisible&&!row.independentPractice)).toBe(true);
});

test('@rally-pals wrong aims keep lanes stable, partial help after two and motor misses do not erase literacy',async({page})=>{
  await open(page,'medium');const original=await snapshot(page),seed=Number(original.roundId.split(':')[2]);
  const round=buildRallyPalsRounds('medium',seed)[0],wrong=round.choices.find(choice=>choice!==round.expected);
  expect(await page.getByTestId('rally-pals-game').innerText()).not.toContain(round.word);
  await page.getByRole('button',{name:`Aim at ${wrong}`,exact:true}).click();await page.getByRole('button',{name:'Serve',exact:true}).click();
  await expect.poll(async()=>(await snapshot(page)).wrong).toBe(1);await expect(page.locator('.rally-pals-hint')).toHaveCount(0);
  await page.waitForTimeout(1700);await page.getByRole('button',{name:'Serve',exact:true}).click();
  await expect(page.locator('.rally-pals-hint')).toBeVisible();expect((await snapshot(page)).choices).toEqual(original.choices);
  expect((await snapshot(page)).supportReasons).toContain('partial-hint');
  await page.getByRole('button',{name:'Footwork on',exact:true}).click();await chooseCorrect(page);
  await page.keyboard.down('ArrowLeft');await page.waitForTimeout(750);await page.keyboard.up('ArrowLeft');
  await expect.poll(async()=>(await snapshot(page)).motorMisses,{timeout:14000}).toBeGreaterThan(0);
  const later=await snapshot(page);expect(later.completions).toBe(1);expect(later.evidence.firstResponses[0].correct).toBe(false);
  expect(later.evidence.assistedRetries.at(-1).independentPractice).toBe(false);
  // The in-page diagnostic consumer must never gain a reference to saved
  // learning evidence, including the nested support arrays of retry rows.
  await page.evaluate(()=>{
    const exposed=window.__arcadePreviewSnapshot();
    exposed.evidence.firstResponses[0].correct=true;
    exposed.evidence.firstResponses[0].supportReasons.push('inspector-injection');
    exposed.evidence.firstResponses.push({...exposed.evidence.firstResponses[0],roundId:'inspector-injection'});
    exposed.evidence.assistedRetries[0].selected='inspector-injection';
    exposed.evidence.assistedRetries[0].supportReasons.push('inspector-injection');
    exposed.evidence.assistedRetries.length=0;
    exposed.evidence.completions.push('inspector-injection');
  });
  expect((await snapshot(page)).evidence).toEqual(later.evidence);
});

test('@rally-pals aim is independent of movement; pause releases held inputs and court variants stay selectable',async({page})=>{
  test.setTimeout(90000);await open(page);await page.getByRole('button',{name:/^Aim at /}).nth(2).click();
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(450);await page.keyboard.up('ArrowRight');
  const moved=await snapshot(page);expect(moved.player.x).toBeGreaterThan(.5);expect(moved.aim).toBe(2);
  await page.getByRole('button',{name:'Pause Rally Pals',exact:true}).click();const paused=await snapshot(page);
  await page.waitForTimeout(350);expect((await snapshot(page)).player).toEqual(paused.player);
  await page.getByRole('button',{name:'Resume game',exact:true}).click();
  await page.getByRole('combobox',{name:'Game mode and tennis court'}).selectOption('rooftop');
  await expect.poll(async()=>(await snapshot(page)).renderer).toBe('webgl');
  await page.getByRole('combobox',{name:'Game mode and tennis court'}).selectOption('moonwood');
  await expect(page.getByRole('combobox',{name:'Game mode and tennis court'})).toHaveValue('moonwood');
  await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();await expect(page.getByRole('combobox',{name:'Game mode and tennis court'})).toHaveValue('moonwood');expect((await snapshot(page)).aim).toBe(2);
});

for(const [width,height] of [[320,568],[568,320],[768,1024],[1024,768],[1366,768],[1920,1080]])test(`@rally-pals responsive ${width}x${height} controls stay reachable`,async({page})=>{
  await page.setViewportSize({width,height});await open(page);
  const controls=await page.locator('.rally-pals-game button,.rally-pals-game select').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return{label:node.getAttribute('aria-label')||node.textContent,x:r.x,y:r.y,w:r.width,h:r.height};}));
  for(const control of controls){expect(control.w,control.label).toBeGreaterThanOrEqual(56);expect(control.h,control.label).toBeGreaterThanOrEqual(56);expect(control.x,control.label).toBeGreaterThanOrEqual(0);expect(control.y,control.label).toBeGreaterThanOrEqual(0);expect(control.x+control.w,control.label).toBeLessThanOrEqual(width+1);expect(control.y+control.h,control.label).toBeLessThanOrEqual(height+1);}
  if(width>=768&&height>=768)expect(controls.find(control=>control.label==='Move left').w).toBeGreaterThanOrEqual(72);
  await page.getByRole('button',{name:/^Aim at /}).nth(1).click();await expect.poll(async()=>(await snapshot(page)).aim).toBe(1);
});


test('@rally-pals target practice suspends learning, permits ordinary contact and restores the chosen lane',async({page})=>{
  test.setTimeout(90000);await open(page);await page.getByRole('button',{name:/^Aim at /}).nth(2).click();
  const before=await snapshot(page);await page.getByRole('combobox',{name:'Game mode and tennis court'}).selectOption('targets:meadow');
  await expect(page.getByRole('button',{name:'Aim at left',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Aim at middle',exact:true}).click();await page.getByRole('button',{name:'Serve',exact:true}).click();
  await expect.poll(async()=>(await snapshot(page)).targetShots,{timeout:15000}).toBeGreaterThan(0);
  await expect.poll(async()=>Boolean((await snapshot(page)).ball?.direction==='near'&&(await snapshot(page)).ball?.z>7),{timeout:15000}).toBe(true);
  await page.getByRole('button',{name:'Lob',exact:true}).click();
  await expect.poll(async()=>(await snapshot(page)).rally).toBeGreaterThan(0);
  const practice=await snapshot(page);expect(practice.evidence).toEqual(before.evidence);expect(practice.score).toBe(before.score);
  await page.getByRole('combobox',{name:'Game mode and tennis court'}).selectOption('targets:rooftop');
  await page.getByRole('combobox',{name:'Game mode and tennis court'}).selectOption('meadow');
  const restored=await snapshot(page);expect(restored.aim).toBe(before.aim);expect(restored.roundId).toBe(before.roundId);expect(restored.evidence).toEqual(before.evidence);
  await page.getByRole('combobox',{name:'Game mode and tennis court'}).selectOption('coop:meadow');await chooseCorrect(page);
  await expect.poll(async()=>Boolean((await snapshot(page)).ball?.direction==='near'),{timeout:15000}).toBe(true);
  expect((await snapshot(page)).ball.lob).toBe(true);expect((await snapshot(page)).mode).toBe('coop');
});

test('@rally-pals context loss keeps a live controllable court; unavailable assets retain supported evidence',async({page})=>{
  test.setTimeout(60000);await page.route('**/audio/production/**',route=>route.abort());await page.route('**/*.webp',route=>route.abort());
  await page.goto(`${URL}&difficulty=hard&sound=1`);await expect(page.getByTestId('rally-pals-game')).toBeVisible({timeout:30000});
  await expect.poll(async()=>(await snapshot(page))?.delivery).toBe('unavailable');
  await expect.poll(async()=>(await snapshot(page))?.pictureDelivery).toBe('unavailable');
  const cue=await snapshot(page),round=buildRallyPalsRounds('hard',Number(cue.roundId.split(':')[2]),Number(cue.roundId.split(':')[3]))[cue.index];
  expect(await page.getByTestId('rally-pals-game').innerText()).not.toContain(round.word);
  await page.locator('.rally-pals-canvas').evaluate(canvas=>{canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));});
  await expect.poll(async()=>(await snapshot(page)).renderer).toBe('canvas');
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(400);await page.keyboard.up('ArrowRight');expect((await snapshot(page)).player.x).toBeGreaterThan(.5);
  await chooseCorrect(page);const after=await snapshot(page);expect(after.completions).toBe(1);expect(after.evidence.firstResponses[0].independentPractice).toBe(false);expect(after.evidence.firstResponses[0].supportReasons).toContain('visual-matching-model');
  await page.getByRole('combobox',{name:'Game mode and tennis court'}).selectOption('targets:meadow');await page.getByRole('button',{name:'Aim at middle',exact:true}).click();await page.getByRole('button',{name:'Serve',exact:true}).click();
  await expect.poll(async()=>(await snapshot(page)).targetShots,{timeout:15000}).toBeGreaterThan(0);expect((await snapshot(page)).completions).toBe(1);
});

test('@rally-pals failed saves hold controls; retry preserves the intent and pointer cancellation releases movement',async({page})=>{
  await open(page);await page.evaluate(()=>{window.__rallyOriginalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.startsWith('literacy-guide-learn-games:'))throw new Error('test quota');return window.__rallyOriginalSetItem.call(this,key,value);};});
  await page.getByRole('button',{name:/^Aim at /}).nth(1).click();await expect(page.getByRole('button',{name:'Try saving again',exact:true})).toBeVisible();
  await page.evaluate(()=>{Storage.prototype.setItem=window.__rallyOriginalSetItem;delete window.__rallyOriginalSetItem;});await page.getByRole('button',{name:'Try saving again',exact:true}).click();await expect.poll(async()=>(await snapshot(page)).saveError).toBe(false);expect((await snapshot(page)).aim).toBe(1);
  const move=page.getByRole('button',{name:'Move left',exact:true}),moveRect=await move.boundingBox(),beforeMove=(await snapshot(page)).player.x;await page.mouse.move(moveRect.x+moveRect.width/2,moveRect.y+moveRect.height/2);await page.mouse.down();await page.waitForTimeout(300);expect((await snapshot(page)).player.x).toBeLessThan(beforeMove);await move.dispatchEvent('pointercancel',{pointerId:1,pointerType:'mouse'});const released=(await snapshot(page)).player.x;
  await page.waitForTimeout(350);expect((await snapshot(page)).player.x).toBeCloseTo(released,1);await page.mouse.up();
  const court=page.locator('.rally-pals-world');const rect=await court.boundingBox();await page.mouse.click(rect.x+rect.width*.33,rect.y+rect.height*.34);expect((await snapshot(page)).aimX).toBeLessThan(0);
});

for(const [difficulty,world,hero,label]of[['easy','meadow','Bouncy','Meadow'],['medium','dino','Chompy','Fern Club'],['hard','moonwood','Pip','Moonwood']])test(`@rally-pals ${difficulty} retains canonical ${hero} world with three court settings`,async({page})=>{
  await open(page,difficulty);await expect(page.getByTestId('rally-pals-game')).toHaveAttribute('data-pal-world',world);await expect(page.getByTestId('rally-pals-game')).toHaveAttribute('data-hero',hero);
  expect(await page.getByRole('combobox',{name:'Game mode and tennis court'}).textContent()).toContain(label);
  for(const court of ['meadow','rooftop','moonwood']){await page.getByRole('combobox',{name:'Game mode and tennis court'}).selectOption(court);expect((await snapshot(page)).world).toBe(world);expect((await snapshot(page)).hero).toBe(hero);}
});

test.describe('recorded audio',()=>{
  test('@rally-pals image and genuinely ended recorded audio support an independent first sound response',async({page})=>{
    const requestedEffects=[];page.on('request',request=>{if(request.url().includes('/audio/ui/'))requestedEffects.push(request.url());});
    test.setTimeout(60000);await open(page,'easy',true);await page.getByRole('button',{name:'Hear the picture cue',exact:true}).click();
    await expect.poll(async()=>(await snapshot(page)).delivery,{timeout:15000}).toBe('delivered');
    const before=await snapshot(page);expect(before.pictureDelivery).toBe('delivered');expect(before.supportReasons).toEqual([]);await expect(page.locator('.rally-pals-visual-model')).toHaveCount(0);
    const round=await chooseCorrect(page),after=await snapshot(page),response=after.evidence.firstResponses[0];
    expect(response.deliveryAtResponse).toBe('delivered');expect(response.stimulusDelivered).toBe(true);expect(response.independentPractice).toBe(true);expect(response.visualModel).toBe(false);
    expect(await page.getByTestId('rally-pals-game').innerText()).not.toContain(round.word);
    expect(after.audioEffects.requested.contact).toBeGreaterThan(0);await expect.poll(()=>requestedEffects.some(url=>url.endsWith('/pop.mp3'))).toBe(true);
    await page.getByRole('button',{name:'Open game controls',exact:true}).click();await expect(page.getByRole('dialog',{name:'Game controls',exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Turn spoken audio and game sounds off',exact:true}).click();await page.keyboard.press('Escape');
    await page.getByRole('combobox',{name:'Game mode and tennis court'}).selectOption('targets:meadow');
    const quiet=(await snapshot(page)).audioEffects.requested;await page.getByRole('button',{name:'Aim at middle',exact:true}).click();await page.getByRole('button',{name:'Lob',exact:true}).click();
    expect((await snapshot(page)).audioEffects.requested).toEqual(quiet);
  });
});

test.describe('measured rendering',()=>{
  test.use({reducedMotion:'no-preference'});
  for(const difficulty of ['easy','medium','hard'])test(`@rally-pals ${difficulty} sustained frame budget preserves input and 3D play`,async({page})=>{
    test.setTimeout(60000);await open(page,difficulty);
    await expect.poll(async()=>{const frame=(await snapshot(page)).pacing;return frame.frames>180&&frame.meanFrameMs<=35&&frame.p95FrameMs<=50;},{timeout:40000}).toBe(true);
    const before=await snapshot(page);expect(before.renderer).toBe('webgl');
    if(before.quality.changes){expect(before.quality.reason).toBe('sustained-frame-budget');expect(before.quality.ceiling).toBeLessThanOrEqual(1120);}
    await page.getByRole('button',{name:/^Aim at /}).nth(1).click();await page.waitForTimeout(100);
    const aimed=await snapshot(page);expect(aimed.aim).toBe(1);expect(aimed.pacing.lastInputLatencyMs).toBeLessThanOrEqual(80);
    await chooseCorrect(page);await expect.poll(async()=>Boolean((await snapshot(page)).ball?.direction==='near'),{timeout:10000}).toBe(true);
  });
});
