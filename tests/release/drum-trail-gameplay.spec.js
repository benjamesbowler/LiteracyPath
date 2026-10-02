import { test, expect } from '@playwright/test';

const snapshot = page => page.evaluate(() => window.__arcadePreviewSnapshot?.());
const route = (page, drums) => page.getByRole('button', { name: `Choose the path with ${drums} ${drums === 1 ? 'drum' : 'drums'}`, exact: true });
async function open(page, difficulty = 'medium', sound = false) {
  await page.addInitScript(() => localStorage.setItem('lp-arcade-onboarded-v1:drum-trail', '1'));
  await page.goto(`/preview/game-overlay.html?game=drum-trail&difficulty=${difficulty}&sound=${sound ? 1 : 0}&music=0`);
  await expect(page.locator('.drum-trail')).toBeVisible();
  await expect.poll(async () => (await snapshot(page))?.phase).toBe('ready');
}

for (const [name, width, height] of [['phone',320,568], ['phone-landscape',568,320], ['tablet',1024,768], ['desktop',1280,900]]) {
  test(`Drum Trail ${name}: equal drum targets, no overlaps, complete keyboard/tap layout`, async ({ page }, testInfo) => {
    await page.setViewportSize({width,height}); await open(page,'hard');
    const target = await snapshot(page);
    await expect(page.locator('.drum-trail__supported-word')).toHaveText(target.word);
    await expect(page.getByRole('img', { name: target.word, exact: true })).toBeVisible();
    expect(await page.getByRole('img', { name: target.word, exact: true }).evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    const rectangles = await page.locator('.drum-trail__route').evaluateAll(buttons => buttons.map(button => {
      const rect=button.getBoundingClientRect(), style=getComputedStyle(button);
      return {x:rect.x,y:rect.y,width:rect.width,height:rect.height,right:rect.right,bottom:rect.bottom,touchAction:style.touchAction,userSelect:style.userSelect};
    }));
    expect(rectangles).toHaveLength(3);
    for (const rect of rectangles) {
      expect(rect.width).toBeGreaterThanOrEqual(56); expect(rect.height).toBeGreaterThanOrEqual(56);
      expect(rect.x).toBeGreaterThanOrEqual(0); expect(rect.right).toBeLessThanOrEqual(width);
      expect(rect.y).toBeGreaterThanOrEqual(0); expect(rect.bottom).toBeLessThanOrEqual(height);
      expect(rect.touchAction).toBe('none'); expect(rect.userSelect).toBe('none');
    }
    expect(new Set(rectangles.map(rect=>rect.height)).size).toBe(1);
    for (let i=1;i<rectangles.length;i++) expect(rectangles[i].x-rectangles[i-1].right).toBeGreaterThanOrEqual(8);
    const drums=await page.locator('.drum-trail__drum').evaluateAll(nodes=>nodes.map(node=>getComputedStyle(node).width));
    expect(new Set(drums).size).toBe(1,'single drum icon size is independent of expected answer');
    for (const button of await page.locator('.drum-trail button:visible').all()) {
      const rect=await button.boundingBox(); expect(rect.width).toBeGreaterThanOrEqual(56);expect(rect.height).toBeGreaterThanOrEqual(56);
    }
    await page.screenshot({path:testInfo.outputPath(`${name}-ready.png`)});
    const first=page.locator('.drum-trail__route').first();await first.focus();await page.keyboard.press('ArrowRight');await expect(page.locator('.drum-trail__route').nth(1)).toBeFocused();
    await page.keyboard.press('Space');await expect.poll(async()=>(await snapshot(page)).evidence.firstResponses.length).toBe(1);
    await page.screenshot({path:testInfo.outputPath(`${name}-response.png`)});
  });
}

test('word and picture stay visible with sound on, while a failed picture retains a readable target', async ({page}) => {
  await open(page, 'medium', true);
  await expect.poll(async () => (await snapshot(page)).delivery).toBe('delivered');
  const initial = await snapshot(page);
  await expect(page.locator('.drum-trail__supported-word')).toHaveText(initial.word);
  await route(page, initial.syllables).click();
  const answer = (await snapshot(page)).evidence.firstResponses[0];
  expect(answer.wordVisible).toBe(true);
  expect(answer.independentOralPractice).toBe(false);
  expect(answer.pictureDelivery).toBe('delivered');
  await page.route('**/media/**', request => request.abort());
  await page.route('**/images/child-mode/**', request => request.abort());
  await expect.poll(async () => (await snapshot(page)).index).toBe(1);
  const next = await snapshot(page);
  await expect(page.locator('.drum-trail__supported-word')).toHaveText(next.word);
  await expect(page.locator('.drum-trail__picture-missing')).toHaveText('Picture unavailable');
});

test('first wrong response keeps the same uncued word; second wrong models and a correct retry awards once',async({page})=>{
  await open(page);const initial=await snapshot(page),wrong=initial.routes.find(r=>r.drums!==initial.syllables).drums;
  await route(page,wrong).click();await expect(page.locator('.drum-trail__parts')).toHaveCount(0);
  expect((await snapshot(page)).score).toBe(0);
  await expect.poll(async()=>(await snapshot(page)).phase).toBe('ready');
  expect((await snapshot(page)).word).toBe(initial.word);
  await route(page,wrong).click();await expect(page.locator('.drum-trail__parts')).toBeVisible();
  await expect.poll(async()=>(await snapshot(page)).phase).toBe('ready');
  await route(page,initial.syllables).click();
  const answer=await snapshot(page);expect(answer.score).toBe(10);expect(answer.evidence.firstResponses[0].correct).toBe(false);
  expect(answer.evidence.assistedRetries.at(-1).modelUsed).toBe(true);expect(answer.evidence.assistedRetries.at(-1).independentOralPractice).toBe(false);
  await expect.poll(async()=>(await snapshot(page)).index).toBe(1);
});

test('recorded stimulus must end before the first answer; delayed delivery never repairs that response',async({page})=>{
  await page.route('**/audio/production/**', async request=>{await new Promise(resolve=>setTimeout(resolve,1500));await request.continue();});
  await open(page,'easy',true);const initial=await snapshot(page);expect(initial.delivery).toBe('pending');
  await expect(page.locator('.drum-trail__supported-word')).toHaveText(initial.word);
  await route(page,initial.syllables).click();
  await page.waitForTimeout(100);
  const answer=await snapshot(page);expect(answer.evidence.firstResponses[0].stimulusDelivered).toBe(false);expect(answer.evidence.firstResponses[0].deliveryAtResponse).toBe('pending');
  expect(answer.evidence.firstResponses[0].independentOralPractice).toBe(false);
  await expect.poll(async()=>(await snapshot(page)).index,{timeout:15000}).toBe(1);
  expect((await snapshot(page)).evidence.firstResponses[0].stimulusDelivered).toBe(false);
});

test('pause, replay and visibility pause retain the same result, foreground scene and owned voice dwell',async({page})=>{
  await open(page,'medium',true);
  await page.getByRole('button',{name:'Hear the whole word again',exact:true}).click();
  await expect.poll(async()=>(await snapshot(page)).delivery).toBe('delivered');
  const initial=await snapshot(page);await route(page,initial.syllables).click();
  await page.waitForTimeout(120);await page.getByRole('button',{name:'Pause Drum Trail',exact:true}).click();
  await expect.poll(async()=>(await snapshot(page)).paused).toBe(true);const held=await snapshot(page);
  await page.waitForTimeout(1800);const later=await snapshot(page);expect(later.index).toBe(held.index);expect(later.sceneElapsed).toBe(held.sceneElapsed);
  await page.getByRole('button',{name:'Resume game',exact:true}).click();
  await page.getByRole('button',{name:'Hear the whole word again',exact:true}).click();
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await expect.poll(async()=>(await snapshot(page)).paused).toBe(true);const hidden=await snapshot(page);
  await page.waitForTimeout(1800);expect((await snapshot(page)).index).toBe(initial.index);expect((await snapshot(page)).sceneElapsed).toBe(hidden.sceneElapsed);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
  await expect.poll(async()=>(await snapshot(page)).index,{timeout:15000}).toBe(initial.index+1);
  const result=await snapshot(page);expect(result.evidence.firstResponses[0].stimulusDelivered).toBe(true);expect(result.evidence.firstResponses[0].independentOralPractice).toBe(false);expect(result.evidence.firstResponses[0].wordVisible).toBe(true);expect(result.evidence.completions.length).toBe(1);expect(result.score).toBe(10);
});

test('first wrong answer survives reload and Help marks current oral practice supported',async({page})=>{
  await open(page,'medium',true);await expect.poll(async()=>(await snapshot(page)).delivery).toBe('delivered');
  const initial=await snapshot(page);await route(page,initial.routes.find(r=>r.drums!==initial.syllables).drums).click();
  await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();
  await expect(page.locator('.drum-trail')).toBeVisible();const restored=await snapshot(page);
  expect(restored.index).toBe(0);expect(restored.word).toBe(initial.word);expect(restored.evidence.firstResponses).toHaveLength(1);expect(restored.evidence.firstResponses[0].correct).toBe(false);
  expect(restored.cursor).toBe(0);
  await page.getByRole('button',{name:'Open Drum Trail mission guide',exact:true}).click();
  expect((await snapshot(page)).supportReasons).toContain('mission-help');
  await page.getByRole('button',{name:/Keep playing/}).click();
  await route(page,initial.syllables).click();expect((await snapshot(page)).evidence.assistedRetries.at(-1).independentOralPractice).toBe(false);
});

test('host checkpoint0 without local support history repeats the unresolved word as supported practice',async({page})=>{
  await open(page,'easy',true);await expect.poll(async()=>(await snapshot(page)).delivery).toBe('delivered');const initial=await snapshot(page);
  await route(page,initial.routes.find(r=>r.drums!==initial.syllables).drums).click();
  await page.evaluate(()=>{const key='literacy-guide-learn-games:fullscreen-overlay-preview';const data=JSON.parse(localStorage.getItem(key));delete data.games['drum-trail'].practiceSession;localStorage.setItem(key,JSON.stringify(data));});
  await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();
  await expect.poll(async()=>(await snapshot(page))?.delivery).toBe('delivered');const recovered=await snapshot(page);
  expect(recovered.index).toBe(0);expect(recovered.word).toBe(initial.word);expect(recovered.evidence.firstResponses.length).toBe(0);expect(recovered.supportReasons).toContain('resume_without_support_record');
  await route(page,recovered.syllables).click();expect((await snapshot(page)).evidence.firstResponses[0].independentOralPractice).toBe(false);
});

test('failed durable answer save holds the shown result and Retry save never duplicates its score',async({page})=>{
  await open(page);const initial=await snapshot(page);
  await page.evaluate(()=>{window.__drumStorageSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='literacy-guide-learn-games:fullscreen-overlay-preview')throw new Error('test quota');return window.__drumStorageSetItem.call(this,key,value);};});
  await route(page,initial.syllables).click();await expect(page.getByRole('button',{name:'Retry save',exact:true})).toBeVisible();
  await page.waitForTimeout(2200);expect((await snapshot(page)).index).toBe(0);expect((await snapshot(page)).score).toBe(10);
  await page.evaluate(()=>{Storage.prototype.setItem=window.__drumStorageSetItem;delete window.__drumStorageSetItem;});
  await page.getByRole('button',{name:'Retry save',exact:true}).click();await expect.poll(async()=>(await snapshot(page)).index).toBe(1);
  const recovered=await snapshot(page);expect(recovered.score).toBe(10);expect(recovered.evidence.firstResponses.length).toBe(1);expect(recovered.evidence.completions.length).toBe(1);
});

test('sound-off and unavailable recording are explicitly supported, with fully playable routes',async({page})=>{
  await page.route('**/audio/production/**',request=>request.abort());await open(page,'easy',true);
  await expect(page.locator('.drum-trail__supported-word')).toBeVisible();
  let initial=await snapshot(page);expect(initial.delivery).toBe('unavailable');
  await route(page,initial.syllables).click();expect((await snapshot(page)).evidence.firstResponses[0].independentOralPractice).toBe(false);
  await expect.poll(async()=>(await snapshot(page)).index).toBe(1);
  await page.getByRole('button',{name:'Turn spoken audio and game sounds off',exact:true}).click();
  initial=await snapshot(page);await expect(page.locator('.drum-trail__supported-word')).toBeVisible();await route(page,initial.syllables).click();
  expect((await snapshot(page)).evidence.firstResponses.at(-1).supportReasons).toContain('sound-disabled');
});

test('blocked drum art retains visibly distinct native count shapes and fully playable choices',async({page},testInfo)=>{
  await page.setViewportSize({width:320,height:568});
  await page.route('**/images/arcade/drum-trail/props.webp',request=>request.abort());
  await open(page,'hard');
  await expect(page.locator('.drum-trail')).toHaveAttribute('data-props-ready','false');
  const initial=await snapshot(page),counts=[];
  for(const [index,button] of (await page.locator('.drum-trail__route').all()).entries()){
    const shapes=button.locator('.drum-trail__drum-vector');counts.push(await shapes.count());
    expect(await shapes.count()).toBe(initial.routes[index].drums);
    for(const shape of await shapes.all()){
      await expect(shape).toBeVisible();
      const drawn=await shape.evaluate(node=>({visibility:getComputedStyle(node).visibility,width:node.getBoundingClientRect().width,fill:node.querySelector('ellipse').getAttribute('fill')}));
      expect(drawn.visibility).toBe('visible');expect(drawn.width).toBeGreaterThanOrEqual(20);expect(drawn.fill).not.toBe('none');
    }
  }
  expect(counts.sort()).toEqual([2,3,4]);
  await page.screenshot({path:testInfo.outputPath('native-count-fallback.png')});
  await route(page,initial.syllables).click();
  expect((await snapshot(page)).score).toBe(10);
  await expect.poll(async()=>(await snapshot(page)).index).toBe(1);
});

test('selected route plays its own counted beats, pause preserves a beat, and modelling remains assisted',async({page})=>{
  await page.addInitScript(()=>{window.__drumNativeMedia=[];window.Audio=new Proxy(window.Audio,{construct(target,args){const audio=Reflect.construct(target,args);window.__drumNativeMedia.push(audio);return audio;}});});
  await open(page,'hard',true);
  await page.getByRole('button',{name:'Turn music on',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.__drumNativeMedia.filter(audio=>audio.loop&&!audio.paused).length)).toBeGreaterThan(0);
  await page.getByRole('button',{name:'Hear the whole word again',exact:true}).click();
  await expect.poll(async()=>(await snapshot(page)).delivery).toBe('delivered');
  const initial=await snapshot(page),wrong=initial.routes.filter(r=>r.drums!==initial.syllables).sort((a,b)=>b.drums-a.drums)[0].drums;
  await page.evaluate(()=>{
    window.__drumObservedBeats=[];
    window.__drumBeatObserver=setInterval(()=>{const state=window.__arcadePreviewSnapshot?.();if(state?.beatIndex!=null){const key=`${state.beatCount}:${state.beatIndex}`;if(window.__drumObservedBeats.at(-1)!==key)window.__drumObservedBeats.push(key);}},40);
  });
  await route(page,wrong).click();
  await expect.poll(async()=>(await snapshot(page)).beatIndex).toBe(0);
  expect((await snapshot(page)).beatCount).toBe(wrong);
  await expect.poll(()=>page.evaluate(()=>window.__drumNativeMedia.filter(audio=>audio.loop&&!audio.paused).every(audio=>audio.volume<=.055))).toBe(true);
  await page.getByRole('button',{name:'Pause Drum Trail',exact:true}).click();
  const held=await snapshot(page);await page.waitForTimeout(700);
  expect((await snapshot(page)).beatIndex).toBe(held.beatIndex);expect((await snapshot(page)).sceneElapsed).toBe(held.sceneElapsed);
  expect(await page.evaluate(()=>window.__drumNativeMedia.filter(audio=>audio.loop).every(audio=>audio.paused))).toBe(true);
  await page.getByRole('button',{name:'Resume game',exact:true}).click();
  await expect.poll(async()=>(await snapshot(page)).phase).toBe('ready');
  expect(await page.evaluate(()=>window.__drumObservedBeats)).toEqual(Array.from({length:wrong},(_,index)=>`${wrong}:${index}`));
  expect((await snapshot(page)).word).toBe(initial.word);
  await page.evaluate(()=>{window.__drumObservedBeats=[];});
  await page.getByRole('button',{name:'Show the word parts — supported practice',exact:true}).filter({visible:true}).click();
  await expect.poll(async()=>(await snapshot(page)).beatCount).toBe(initial.syllables);
  await expect.poll(async()=>(await snapshot(page)).beatIndex).toBe(null);
  expect(await page.evaluate(()=>window.__drumObservedBeats)).toEqual(Array.from({length:initial.syllables},(_,index)=>`${initial.syllables}:${index}`));
  await route(page,initial.syllables).click();
  expect((await snapshot(page)).evidence.assistedRetries.at(-1).modelUsed).toBe(true);
  await page.evaluate(()=>clearInterval(window.__drumBeatObserver));
});

test('complete outing, final result and fresh replay work with reduced motion and honest supported evidence',async({page},testInfo)=>{
  test.setTimeout(90000);await page.emulateMedia({reducedMotion:'reduce'});await open(page,'hard');
  const words=[];
  for(let index=0;index<16;index++){
    await expect.poll(async()=>(await snapshot(page)).phase).toBe('ready');const current=await snapshot(page);words.push(current.word);expect(current.index).toBe(index);
    await route(page,current.syllables).click();
    if(index<15)await expect.poll(async()=>(await snapshot(page)).index).toBe(index+1);
  }
  await expect.poll(async()=>(await snapshot(page)).phase).toBe('complete');
  const result=await snapshot(page);expect(result.score).toBe(160);expect(result.evidence.completions.length).toBe(16);expect(result.evidence.firstResponses.length).toBe(16);
  expect(result.evidence.firstResponses.every(row=>row.independentOralPractice===false)).toBe(true);
  expect(new Set(words).size).toBe(16);
  await page.screenshot({path:testInfo.outputPath('completion.png')});
  const progress=await page.evaluate(()=>JSON.parse(localStorage.getItem('literacy-guide-learn-games:fullscreen-overlay-preview')));
  expect(progress.games['drum-trail'].practiceRecord.completions.at(-1).steps.length).toBe(16);
  await page.getByRole('button',{name:'Play this again',exact:true}).click();
  await expect.poll(async()=>(await snapshot(page)).index).toBe(0);expect((await snapshot(page)).score).toBe(0);expect((await snapshot(page)).evidence.firstResponses.length).toBe(0);
});
