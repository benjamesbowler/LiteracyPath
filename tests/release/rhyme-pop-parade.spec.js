import { test, expect } from '@playwright/test';
const state = page => page.evaluate(() => window.__rhymePop.snapshot());
async function open(page, { difficulty = 'easy', sound = 0 } = {}) {
  await page.goto(`/preview/game-overlay.html?game=rhyme-pop&difficulty=${difficulty}&sound=${sound}&music=0&rhymeDiagnostics=1&rhymeSeed=41`);
  await expect(page.getByRole('button', { name: 'Start popping', exact: true })).toBeVisible();
  if (sound) {
    // Safari requires a real activation to unlock sound. Exercise the visible
    // replay action rather than assuming browser autoplay permission.
    await page.getByRole('button',{name:'Hear instructions',exact:true}).click();
    await expect(page.locator('.rp-game')).toHaveAttribute('data-delivery', 'completed', { timeout: 20000 });
  }
  await page.getByRole('button', { name: 'Start popping', exact: true }).click();
  if (!sound) await page.getByRole('button', { name: 'Read the words', exact: true }).click();
  await expect(page.locator('[data-rp-choice]').first()).toBeEnabled({timeout:25000});
}
for (const viewport of [{width:320,height:568},{width:568,height:320},{width:1024,height:768}]) {
  test(`seven stable native balloons fit ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport); await open(page, { difficulty: 'hard' });
    const inspect = () => page.locator('[data-rp-choice]').evaluateAll(nodes => nodes.map(node => {
      const box = node.getBoundingClientRect(); const range = document.createRange(); range.selectNodeContents(node.querySelector('.rp-word'));
      return { box: box.toJSON(), text: range.getBoundingClientRect().toJSON(), hit:node.contains(document.elementFromPoint(box.x+box.width/2,box.y+box.height/2)), touch:getComputedStyle(node).touchAction };
    }));
    const first = await inspect(); expect(first).toHaveLength(7); await page.waitForTimeout(800); expect(await inspect()).toEqual(first);
    for (const { box, text, hit, touch } of first) {
      expect(box.width).toBeGreaterThanOrEqual(56); expect(box.height).toBeGreaterThanOrEqual(56);
      expect(box.left).toBeGreaterThanOrEqual(0); expect(box.right).toBeLessThanOrEqual(viewport.width);
      expect(box.top).toBeGreaterThanOrEqual(0); expect(box.bottom).toBeLessThanOrEqual(viewport.height);
      expect(text.left).toBeGreaterThan(box.left); expect(text.right).toBeLessThan(box.right); expect(hit).toBe(true); expect(touch).toBe('none');
    }
  });
}
test('wrong rhyme is explained without counting a pop, and a correct word can count only once', async ({ page }) => {
  await open(page); let current = await state(page);
  const wrong = current.choices.find(choice => !choice.isRhyme);
  await page.locator(`[data-choice-id="${wrong.id}"]`).click();
  await expect(page.getByRole('status').filter({hasText:`${wrong.word} does not rhyme with ${current.target}`})).toBeVisible();
  expect((await state(page)).words).toBe(0);
  await expect(page.locator('[data-rp-choice]').first()).toBeEnabled();
  current = await state(page); const correct = current.choices.find(choice => choice.isRhyme);
  await page.locator(`[data-choice-id="${correct.id}"]`).dblclick({delay:40});
  expect((await state(page)).words).toBe(1);
  await expect(page.locator(`[data-choice-id="${correct.id}"]`)).toHaveCount(0);
  expect((await state(page)).firstResponses).toHaveLength(2);
});

for (const viewport of [{width:320,height:568},{width:568,height:320},{width:1024,height:768}]) for (const difficulty of ['easy','medium','hard']) {
  test(`every ${difficulty} rhyme and replenishment fits ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport); await page.emulateMedia({reducedMotion:'reduce'}); await open(page,{difficulty});
    const audit = await page.evaluate(() => {
      const engine=window.__rhymePop, failures=[], visited=[];
      function inspect(tag) {
        const nodes=[...document.querySelectorAll('.rp-game button')].filter(node=>!node.closest('[inert]') && node.getClientRects().length);
        for(const node of nodes) {
          const b=node.getBoundingClientRect(), word=node.querySelector('.rp-word');
          if(b.width<55.9||b.height<55.9||b.left<0||b.top<0||b.right>innerWidth+.1||b.bottom>innerHeight+.1)failures.push({tag,word:node.textContent,reason:'bounds',box:b.toJSON()});
          if(!node.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)))failures.push({tag,word:node.textContent,reason:'hit centre'});
          if(word){const range=document.createRange();range.selectNodeContents(word);const t=range.getBoundingClientRect();if(t.left<b.left+2||t.right>b.right-2||t.top<b.top||t.bottom>b.bottom)failures.push({tag,word:word.textContent,reason:'text clips'});}
        }
        const boxes=nodes.filter(n=>n.hasAttribute('data-rp-choice')).map(n=>n.getBoundingClientRect());
        for(let a=0;a<boxes.length;a++)for(let b=a+1;b<boxes.length;b++){const x=boxes[a],y=boxes[b];if(Math.min(x.right,y.right)-Math.max(x.left,y.left)>0&&Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top)>0)failures.push({tag,reason:'overlap'});}
      }
      for(let round=0;round<10;round++) {
        engine.seek(round);inspect(`${round}:start`);
        const wrong=engine.snapshot().choices.find(c=>!c.isRhyme);
        document.querySelector(`[data-choice-id="${wrong.id}"]`).click();inspect(`${round}:wrong`);engine.step(1.3);
        const found=[];
        for(let i=0;i<6;i++) {
          const s=engine.snapshot(),c=s.choices.find(c=>c.isRhyme);
          if(!c){failures.push({round,reason:'rhyme omitted'});break;}
          const oldPositions=new Map([...document.querySelectorAll('[data-rp-choice]')].map(node=>[node.dataset.choiceId,node.getBoundingClientRect().toJSON()]));
          document.querySelector(`[data-choice-id="${c.id}"]`).click();found.push(c.word);engine.step(.71);inspect(`${round}:${i}:replenished`);
          for(const node of document.querySelectorAll('[data-rp-choice]'))if(oldPositions.has(node.dataset.choiceId)&&JSON.stringify(oldPositions.get(node.dataset.choiceId))!==JSON.stringify(node.getBoundingClientRect().toJSON()))failures.push({round,reason:'untouched slot moved'});
        }
        const expected=engine.plan[round].rhymingWords.slice().sort();
        if(JSON.stringify(found.slice().sort())!==JSON.stringify(expected))failures.push({round,reason:'coverage',found,expected});
        visited.push({round,found});
      }
      return {failures,visited};
    });
    expect(audit.failures).toEqual([]);expect(audit.visited).toHaveLength(10);
  });
}

test('pointer release outside, cancel, capture loss and pause cannot answer; keyboard can pop multiple words', async ({ page }) => {
  await open(page);const before=await state(page);const c=before.choices.find(c=>c.isRhyme),button=page.locator(`[data-choice-id="${c.id}"]`);
  const b=await button.boundingBox();
  await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();
  expect((await state(page)).words).toBe(0);await page.mouse.move(b.x-10,b.y-10);await page.mouse.up();expect((await state(page)).words).toBe(0);
  for(const event of ['pointercancel','lostpointercapture']) {
    await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();
    await button.dispatchEvent(event,{pointerId:1});await page.mouse.up();expect((await state(page)).words).toBe(0);
  }
  await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.mouse.up();
  expect((await state(page)).paused).toBe(true);expect((await state(page)).words).toBe(0);
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await button.focus();await page.keyboard.press('Enter');expect((await state(page)).words).toBe(1);
  await expect(page.locator('[data-rp-choice]').first()).toBeEnabled();
  const next=(await state(page)).choices.find(c=>c.isRhyme);await page.locator(`[data-choice-id="${next.id}"]`).focus();await page.keyboard.press('Space');
  expect((await state(page)).words).toBe(2);
});

test('host guide controls keep native keys and do not answer a balloon', async ({ page }) => {
  await open(page);
  const guide = page.getByRole('button', { name: 'Open Rhyme Pop mission guide', exact: true });
  await guide.focus(); await page.keyboard.press('ArrowRight');
  await expect(guide).toBeFocused(); expect((await state(page)).firstResponses).toHaveLength(0);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Rhyme Pop mission guide', exact: true })).toBeVisible();
  expect((await state(page)).paused).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Rhyme Pop mission guide', exact: true })).toHaveCount(0);
  await expect(page.locator('.rp-game')).toBeVisible();
  expect((await state(page)).firstResponses).toHaveLength(0);
  expect((await state(page)).words).toBe(0);
});

test('resuming the last basket saves only six actual rhymes before animation or immediate exit', async ({ page }) => {
  await page.addInitScript(()=>localStorage.setItem('literacy-guide-learn-games:fullscreen-overlay-preview',JSON.stringify({difficulty:'easy',soundEnabled:false,musicEnabled:false,games:{'rhyme-pop':{checkpoints:{easy:{level:9,totalLevels:10}}}}})));
  await page.goto('/preview/game-overlay.html?game=rhyme-pop&sound=0&music=0&rhymeDiagnostics=1');
  await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Start popping',exact:true}).click();await page.getByRole('button',{name:'Read the words',exact:true}).click();
  for(let i=0;i<6;i++) {
    const c=(await state(page)).choices.find(c=>c.isRhyme);await page.locator(`[data-choice-id="${c.id}"]`).click();
    if(i<5)await expect(page.locator('[data-rp-choice]').first()).toBeEnabled();
  }
  const s=await state(page);expect(s.phase).toBe('feedback');expect(s.receipt.words).toBe(6);expect(s.receipt.stars).toBe(3);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('literacy-guide-learn-games:fullscreen-overlay-preview')).games['rhyme-pop']);
  expect(saved.wordsCompleted).toBe(6);expect(saved.plays).toBe(1);expect(saved.practiceRecord.completions).toHaveLength(1);expect(saved.practiceRecord.completions[0].steps).toHaveLength(6);
  await page.keyboard.press('Escape');await expect(page.locator('.rp-game')).toHaveCount(0);
});

test('actual recorded instruction and choices complete, and a failed contrast recovers without inventing delivery', async ({ page }) => {
  test.setTimeout(70000);await open(page,{sound:1});
  const s=await state(page);expect(s.delivery).toBe('completed');expect(s.cueHistory.filter(e=>e.type==='completed')).toHaveLength(s.choices.length+2);
  await page.route('**/audio/rhyme-pop/mismatch-v3.mp3',route=>route.abort());
  const wrong=s.choices.find(c=>!c.isRhyme);await page.locator(`[data-choice-id="${wrong.id}"]`).click();
  await expect(page.getByRole('dialog',{name:'Rhyme Pop sound recovery',exact:true})).toBeVisible();
  const failed=await state(page);expect(failed.delivery).toBe('failed');expect(failed.firstResponses).toHaveLength(1);expect(failed.words).toBe(0);
  await page.getByRole('button',{name:'Read the words',exact:true}).click();await expect(page.locator('[data-rp-choice]').first()).toBeEnabled();
  await page.locator(`[data-choice-id="${wrong.id}"]`).click();
  const retried=await state(page);expect(retried.assistedRetries).toHaveLength(1);expect(retried.assistedRetries[0].supportUsed).toContain('printed_rhyme_support');
  expect(retried.assistedRetries[0].cueHistory.some(e=>e.type==='failed')).toBe(true);expect(retried.assistedRetries[0].audioDelivery).not.toBe('completed');
});


test('stalled instruction exposes recovery and never becomes a delivered cue', async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(()=>{const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){if(this.src.includes('/audio/rhyme-pop/instruction-')){this.dispatchEvent(new Event('stalled'));return new Promise(()=>{});}return play.call(this);};});
  await page.goto('/preview/game-overlay.html?game=rhyme-pop&sound=1&music=0&rhymeDiagnostics=1');
  const start=page.getByRole('button',{name:'Start popping',exact:true});await expect(start).toBeVisible();await expect(start).toBeDisabled();
  await page.clock.runFor(12500);await expect(start).toBeEnabled();
  const s=await state(page);expect(s.delivery).toBe('failed');expect(s.firstResponses).toHaveLength(0);expect(s.cueHistory.some(e=>e.reason==='playback_timeout')).toBe(true);
  await start.click();await expect(page.locator('.rp-game')).toHaveAttribute('data-phase','active');
});

test('audio-enabled cue completion restores usable native keyboard focus', async ({ page }) => {
  test.setTimeout(65000);await open(page,{sound:1});
  expect(await page.evaluate(()=>document.activeElement.hasAttribute('data-rp-choice'))).toBe(true);
  const initial=await state(page),c=initial.choices.find(c=>c.isRhyme);
  await page.locator(`[data-choice-id="${c.id}"]`).focus();await page.keyboard.press('Enter');
  await expect(page.locator('[data-rp-choice]').first()).toBeEnabled({timeout:25000});
  expect(await page.evaluate(()=>document.activeElement.hasAttribute('data-rp-choice'))).toBe(true);
  const focused=await page.evaluate(()=>document.activeElement.dataset.choiceId);await page.keyboard.press('ArrowRight');
  expect(await page.evaluate(()=>document.activeElement.dataset.choiceId)).not.toBe(focused);
});

test('a second touch cannot steal another balloon and a cancelled owner cannot stick after blur', async ({ browser, baseURL }) => {
  const context=await browser.newContext({baseURL,hasTouch:true,viewport:{width:568,height:320}});const page=await context.newPage();
  try {
    await open(page);const choices=(await state(page)).choices.filter(c=>c.isRhyme);
    const a=page.locator(`[data-choice-id="${choices[0].id}"]`),b=page.locator(`[data-choice-id="${choices[1].id}"]`);
    const x=await a.boundingBox(),y=await b.boundingBox(),cdp=await context.newCDPSession(page);
    const first={x:x.x+x.width/2,y:x.y+x.height/2,id:1},second={x:y.x+y.width/2,y:y.y+y.height/2,id:2};
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first]});await expect(a).toHaveAttribute('data-pressed','true');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[first,second]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[second]});
    expect((await state(page)).words).toBe(0);await expect(a).toHaveAttribute('data-pressed','true');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});expect((await state(page)).words).toBe(1);
    await expect(page.locator('[data-rp-choice]').first()).toBeEnabled();
    const next=(await state(page)).choices.find(c=>c.isRhyme),node=page.locator(`[data-choice-id="${next.id}"]`),box=await node.boundingBox();
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2,id:3}]});
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
    // Recovery must not depend on receiving the old pointer's terminal event.
    await node.click();expect((await state(page)).words).toBe(2);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  }finally{await context.close();}
});

test('pausing during a correct pop stops the actual feedback sound', async ({ page }) => {
  test.setTimeout(50000);
  await page.addInitScript(()=>{const OriginalAudio=window.Audio;window.__rhymeAudioElements=[];window.Audio=class extends OriginalAudio{constructor(...args){super(...args);window.__rhymeAudioElements.push(this);}};});
  await open(page,{sound:1});const c=(await state(page)).choices.find(c=>c.isRhyme);
  await page.locator(`[data-choice-id="${c.id}"]`).click();
  await expect.poll(()=>page.evaluate(()=>window.__rhymeAudioElements.some(a=>a.src.endsWith('/audio/ui/correct.mp3')))).toBe(true);
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  expect((await state(page)).paused).toBe(true);
  expect(await page.evaluate(()=>window.__rhymeAudioElements.filter(a=>a.src.endsWith('/audio/ui/correct.mp3')).every(a=>a.paused))).toBe(true);
});

test('a blocked local save retains the last answer, prevents accidental exit and retries exactly once', async ({ page }) => {
  await page.setViewportSize({width:320,height:568});await open(page);
  await page.evaluate(()=>{
    window.__rhymePop.seek(9);window.__failRhymeSave=true;window.__rhymeSaveAttempts=0;
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
      if(key==='literacy-guide-learn-games:fullscreen-overlay-preview'&&JSON.parse(value).games?.['rhyme-pop']?.practiceRecord?.completions?.length){window.__rhymeSaveAttempts++;if(window.__failRhymeSave)throw new DOMException('Injected full storage','QuotaExceededError');}
      return original.call(this,key,value);
    };
  });
  for(let i=0;i<6;i++) {const c=(await state(page)).choices.find(c=>c.isRhyme);await page.locator(`[data-choice-id="${c.id}"]`).click();if(i<5)await page.evaluate(()=>window.__rhymePop.step(.71));}
  const recovery=page.getByRole('dialog',{name:'Save game progress',exact:true});await expect(recovery).toBeVisible();
  const receipt=(await state(page)).receipt;expect(receipt.words).toBe(6);expect((await state(page)).paused).toBe(true);
  await page.keyboard.press('Escape');await expect(recovery).toBeVisible();expect((await state(page)).receipt).toEqual(receipt);
  await page.getByRole('button',{name:'Try saving again',exact:true}).click();await expect(recovery).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('literacy-guide-learn-games:fullscreen-overlay-preview')).games['rhyme-pop'].plays||0)).toBe(0);
  await page.screenshot({path:'.artifacts/g16/rhyme-save-recovery.png'});
  await page.evaluate(()=>{window.__failRhymeSave=false;});await page.getByRole('button',{name:'Try saving again',exact:true}).click();await expect(recovery).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Back to Arcade',exact:true})).toBeVisible();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('literacy-guide-learn-games:fullscreen-overlay-preview')).games['rhyme-pop']);
  expect(saved.plays).toBe(1);expect(saved.practiceRecord.completions).toHaveLength(1);expect(saved.practiceRecord.completions[0].steps).toEqual(receipt.evidence.firstResponses);expect(saved.checkpoints?.easy).toBeUndefined();
});

test('trusted touchscreen taps select the exact balloon and cannot repeat a consumed word', async ({ browser, baseURL }) => {
  const context=await browser.newContext({baseURL,hasTouch:true,viewport:{width:320,height:568}}),page=await context.newPage();
  try {
    await open(page);const c=(await state(page)).choices.find(c=>c.isRhyme),node=page.locator(`[data-choice-id="${c.id}"]`),box=await node.boundingBox();
    await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
    const s=await state(page);expect(s.words).toBe(1);expect(s.firstResponses[0].response).toBe(c.word);expect(s.firstResponses[0].responseId).toBe(c.id);
    await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);expect((await state(page)).words).toBe(1);
  }finally{await context.close();}
});
