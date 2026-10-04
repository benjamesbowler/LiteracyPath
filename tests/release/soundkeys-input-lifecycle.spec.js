import { test, expect } from '@playwright/test';

test.use({ trace: 'off', viewport: { width: 1366, height: 768 } });
const read = page => page.evaluate(() => window.__arcadePreviewSnapshot());
async function open(page) {
  await page.addInitScript(() => localStorage.setItem('lp-arcade-onboarded-v1:soundkeys', '1'));
  await page.goto('/preview/game-overlay.html?game=soundkeys&difficulty=easy&sound=1');
  await page.waitForFunction(() => window.__arcadePreviewSnapshot?.()?.performance?.delivered);
  const start = page.getByRole('button', { name: 'Start playing', exact: true }); if (await start.isVisible()) await start.click();
}
async function token(page, value) {
  const button = page.getByRole('button', { name: `Play ${value}`, exact: true });
  for (let index=0; !(await button.isVisible()) && index<4;index++) await page.getByRole('button', { name: 'Next sound keys', exact:true }).click();
  await expect(button).toBeVisible(); const key = await button.locator('small').textContent();
  await page.locator('.lg-game-player-main').focus(); await page.keyboard.press(key);
}

test('accepted prefix, first wrong and hint survive actual page reload and supported completion', async ({ page }) => {
  test.setTimeout(60000); await open(page); let before = await read(page);
  await token(page,before.target.tokens[0]);
  const wrong = ['s','a','t','p'].find(value=>value!==before.target.tokens[1]);
  await token(page,wrong); await token(page,wrong); before=await read(page);
  expect(before.tokens).toEqual([before.target.tokens[0]]); expect(before.roundMistakes).toBe(2);
  // The compact and roomy cue variants intentionally share hint content; only
  // the current container's presentation is visible and accessibility-exposed.
  const hint = page.locator('[data-phonics-hint]:visible');
  await expect(hint).toHaveCount(1); await expect(hint).toBeVisible();
  const hintText = await hint.textContent();
  await page.reload(); await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.waitForFunction(()=>window.__arcadePreviewSnapshot?.()?.performance?.delivered);
  const restored=await read(page); expect(restored.target.id).toBe(before.target.id); expect(restored.tokens).toEqual(before.tokens);
  expect(restored.roundMistakes).toBe(2); expect(restored.evidence.firstResponses).toEqual(before.evidence.firstResponses);
  await expect(page.locator('[data-phonics-hint]:visible')).toHaveCount(1);
  await expect(page.locator('[data-phonics-hint]:visible')).toHaveText(hintText);
  for (const value of restored.target.tokens.slice(restored.tokens.length)) await token(page,value);
  const completed=await read(page); expect(completed.celebrating).toBe(true); expect(completed.evidence.completions[0].supported).toBe(true);
  expect(completed.evidence.firstResponses.find(row=>row.unit===1).correct).toBe(false);
  expect(completed.evidence.assistedRetries.some(row=>row.correct)).toBe(true);
  await test.info().attach('actual-prefix-reload',{body:JSON.stringify({before,restored,completed}),contentType:'application/json'});
});

test('free held/chord input and outside pointer release cancel without creating spelling responses',async({page})=>{
  await open(page); await page.getByRole('button',{name:/Free play/,exact:false}).click(); const before=await read(page);
  await page.locator('.lg-game-player-main').focus(); await page.keyboard.down('1'); await page.keyboard.down('1');
  expect((await read(page)).pressed.length).toBe(1);
  await page.keyboard.down('2'); await page.keyboard.down('3'); expect((await read(page)).pressed.length).toBe(3);
  await page.keyboard.up('1'); await page.keyboard.up('2'); await page.keyboard.up('3'); expect((await read(page)).pressed).toEqual([]);
  await page.getByRole('button',{name:/Words/,exact:false}).click();
  const button=page.locator('.soundkeys-keyboard button').first(),box=await button.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
  await page.mouse.move(box.x,box.y-30); await page.mouse.up();
  const after=await read(page);expect(after.pressed).toEqual([]);expect(after.tokens).toEqual(before.tokens);expect(after.evidence.firstResponses).toEqual(before.evidence.firstResponses);
  await page.locator('.lg-game-player-main').focus(); await page.keyboard.down('1');
  await page.getByRole('button',{name:'Open game controls',exact:true}).click();const paused=await read(page);expect(paused.pressed).toEqual([]);
  await page.waitForTimeout(250);expect((await read(page)).clock).toBe(paused.clock);await page.keyboard.up('1');await page.keyboard.press('Escape');
  expect((await read(page)).paused).toBe(false);
});

test('browser-emulated MIDI note holds, disconnect and reconnect retain free-play evidence boundary',async({page})=>{
  await page.addInitScript(()=>{
    const input={name:'Emulated MIDI',type:'input',state:'connected',onmidimessage:null,open:()=>Promise.resolve()};
    const access={inputs:new Map([['emulated',input]]),addEventListener(type,fn){if(type==='statechange')this.listener=fn;},removeEventListener(type,fn){if(this.listener===fn)this.listener=null;}};
    window.__midiFixture={input,access};Object.defineProperty(navigator,'requestMIDIAccess',{configurable:true,value:async()=>access});
  });
  await open(page);await page.getByRole('button',{name:/Free play/,exact:false}).click();const before=await read(page);
  await page.getByRole('button',{name:'Band',exact:true}).click();await page.getByRole('button',{name:'Connect MIDI keyboard',exact:true}).click();
  await expect(page.getByRole('button',{name:'Connect MIDI keyboard',exact:true})).toContainText('MIDI connected');
  await page.evaluate(()=>{const{input}=window.__midiFixture;input.onmidimessage({data:[0x90,48,100]});input.onmidimessage({data:[0x90,48,100]});input.onmidimessage({data:[0x90,49,100]});});
  expect((await read(page)).pressed.length).toBe(2);
  await page.evaluate(()=>{const{input,access}=window.__midiFixture;input.state='disconnected';access.listener({port:input});});
  expect((await read(page)).pressed).toEqual([]);
  await page.evaluate(()=>{const{input,access}=window.__midiFixture;input.state='connected';access.listener({port:input});input.onmidimessage({data:[0x90,50,100]});input.onmidimessage({data:[0x80,50,0]});});
  const after=await read(page);expect(after.pressed).toEqual([]);expect(after.tokens).toEqual(before.tokens);expect(after.evidence.firstResponses).toEqual(before.evidence.firstResponses);
  await test.info().attach('browser-emulated-midi',{body:JSON.stringify({before,after,hardwareMidi:'UNKNOWN',source:'Fake browser MIDIAccess; actual leaf/provider message and lifecycle path'}),contentType:'application/json'});
});

test('late MIDI grant after a real exit immediately releases its handlers',async({page})=>{
  await page.addInitScript(()=>{Object.defineProperty(navigator,'requestMIDIAccess',{configurable:true,value:()=>new Promise(resolve=>{window.__grantMidi=resolve;})});});
  await open(page);await page.getByRole('button',{name:'Band',exact:true}).click();await page.getByRole('button',{name:'Connect MIDI keyboard',exact:true}).click();
  await page.getByRole('button',{name:'Close SoundKeys',exact:true}).click();await page.getByRole('button',{name:'Leave',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Closed SoundKeys');
  await page.evaluate(()=>{const input={name:'Late emulated MIDI',type:'input',state:'connected',open:()=>Promise.resolve(),onmidimessage:null};
    const access={inputs:new Map([['late',input]]),addEventListener(type,fn){this.listener=fn;},removeEventListener(type,fn){if(this.listener===fn)this.listener=null;}};
    window.__lateMidi={input,access};window.__grantMidi(access);});
  await page.waitForFunction(()=>window.__lateMidi.input.onmidimessage===null && window.__lateMidi.access.listener===null);
});

test('blocked teaching audio and unavailable synth stay playable and cannot claim delivered encoding',async({page})=>{
  await page.route('**/*.mp3',route=>route.abort());
  await page.addInitScript(()=>{Object.defineProperty(window,'AudioContext',{configurable:true,value:undefined});Object.defineProperty(window,'webkitAudioContext',{configurable:true,value:undefined});});
  await open(page); const before=await read(page);
  for(const value of before.target.tokens)await token(page,value);
  const completed=await read(page);expect(completed.celebrating).toBe(true);expect(completed.evidence.audioReceipts).toEqual([]);
  expect(completed.evidence.firstResponses.every(row=>row.deliveryAtResponse==='pending' && !row.independentEncodingPractice)).toBe(true);
  expect(completed.evidence.completions[0].supported).toBe(true);
});

test('local quota failure retries the exact accepted prefix without clearing decisions',async({page})=>{
  await open(page);const before=await read(page);
  await page.evaluate(()=>{const original=Storage.prototype.setItem;window.__restoreKeysStorage=()=>{Storage.prototype.setItem=original;};
    Storage.prototype.setItem=function(key,value){if(String(key).includes('learn-games'))throw new DOMException('Injected local quota','QuotaExceededError');return original.call(this,key,value);};});
  await token(page,before.target.tokens[0]);const blocked=await read(page);expect(blocked.tokens).toEqual([before.target.tokens[0]]);
  await expect(page.getByRole('button',{name:'Try saving again',exact:true})).toBeVisible();
  await page.evaluate(()=>window.__restoreKeysStorage());await page.getByRole('button',{name:'Try saving again',exact:true}).click();
  await expect(page.getByRole('button',{name:'Try saving again',exact:true})).toHaveCount(0);
  const saved=await read(page);expect(saved.tokens).toEqual(blocked.tokens);expect(saved.evidence.firstResponses).toEqual(blocked.evidence.firstResponses);
  await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.waitForFunction(()=>window.__arcadePreviewSnapshot?.()?.performance?.delivered);
  expect((await read(page)).tokens).toEqual(blocked.tokens);expect((await read(page)).evidence.firstResponses).toEqual(blocked.evidence.firstResponses);
});
