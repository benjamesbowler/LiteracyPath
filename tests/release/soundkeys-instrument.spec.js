import { test, expect } from '@playwright/test';
test.use({hasTouch:true});
async function open(page, difficulty='easy', start=0) {
  await page.goto(`/preview/game-overlay.html?game=soundkeys&difficulty=${difficulty}&startLevel=${start}&sound=0&music=0`);
  await expect(page.locator('.sk-stage')).toBeVisible({timeout:25000});
}
async function playToken(page, token) {
  for(let i=0;i<4;i++) {
    const key=page.locator(`.soundkeys-keyboard [data-token="${token}"]`);
    if(await key.count()) { await key.click(); return; }
    await page.getByRole('button',{name:'Next sound keys',exact:true}).click();
  }
  throw new Error(`No instrument key for ${token}`);
}
for(const difficulty of ['easy','medium','hard']) test(`SoundKeys ${difficulty} complete performance through physical keys`, async({page})=>{
  test.setTimeout(90000); await open(page,difficulty);
  for(let round=0;round<10;round++) {
    await expect(page.locator('.sk-stage')).toHaveAttribute('data-round',String(round));
    const id=await page.locator('.sk-stage').getAttribute('data-target');
    const tokens=await page.evaluate(async id=>(await import('/src/features/soundkeys/content.js')).SOUNDKEY_WORDS.find(w=>w.id===id).tokens,id);
    for(const token of tokens) await playToken(page,token);
  }
  await expect(page.getByRole('alertdialog',{name:'SoundKeys complete',exact:true})).toBeVisible({timeout:10000});
});
test('SoundKeys keeps prefix on error, free play, key hold, pause, and resume',async({page})=>{
  await open(page);
  const id=await page.locator('.sk-stage').getAttribute('data-target');
  const tokens=await page.evaluate(async id=>(await import('/src/features/soundkeys/content.js')).SOUNDKEY_WORDS.find(w=>w.id===id).tokens,id);
  await playToken(page,tokens[0]);
  await playToken(page,tokens[1]==='s'?'a':'s');
  await expect(page.locator('.soundkeys-token-row .is-filled')).toHaveCount(1);
  await expect(page.getByRole('status').filter({hasText:'Try the next sound'})).toBeVisible();
  await page.getByRole('button',{name:'Free play',exact:true}).click();
  await playToken(page,'a'); await playToken(page,'s');
  await expect(page.locator('.soundkeys-token-row .is-filled')).toHaveCount(1);
  await page.getByRole('button',{name:'Build words',exact:true}).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Keep playing',exact:true}).click();
  await expect(page.locator('.soundkeys-token-row .is-filled')).toHaveCount(1);
  for(const token of tokens.slice(1)) await playToken(page,token);
  await expect(page.locator('.sk-stage')).toHaveAttribute('data-round','1');
});
for(const size of [{width:390,height:844},{width:844,height:390}]) test(`SoundKeys ${size.width}x${size.height} keys remain reachable`,async({page},info)=>{
  await page.setViewportSize(size); await open(page,'hard');
  const buttons=await page.locator('.sk-stage button:visible').evaluateAll(elements=>elements.map(el=>{const r=el.getBoundingClientRect();return {label:el.getAttribute('aria-label')||el.textContent,w:r.width,h:r.height,x:r.x,y:r.y};}));
  for(const b of buttons){expect(b.w,b.label).toBeGreaterThanOrEqual(55.9);expect(b.h,b.label).toBeGreaterThanOrEqual(55.9);expect(b.x+b.w,b.label).toBeLessThanOrEqual(size.width+.5);expect(b.y+b.h,b.label).toBeLessThanOrEqual(size.height+.5);}
  await page.locator('.soundkeys-keyboard button').first().tap();
  await page.screenshot({path:info.outputPath('instrument.png')});
});
test('SoundKeys resumes the saved final phrase and number keys play digraphs',async({page})=>{
  await open(page,'hard');
  await page.evaluate(async()=>{const {saveGameCheckpoint}=await import('/src/utils/learnGamesProgress.js');saveGameCheckpoint('fullscreen-overlay-preview','soundkeys','hard',9,10);});
  await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).click();
  await expect(page.locator('.sk-stage')).toHaveAttribute('data-round','9');
  const id=await page.locator('.sk-stage').getAttribute('data-target');
  const tokens=await page.evaluate(async id=>(await import('/src/features/soundkeys/content.js')).SOUNDKEY_WORDS.find(w=>w.id===id).tokens,id);
  for(const token of tokens){
    for(let bank=0;bank<4;bank++){
      const values=await page.locator('.soundkeys-keyboard button').evaluateAll(els=>els.map(el=>el.dataset.token));
      const index=values.indexOf(token);
      if(index>=0){await page.keyboard.press(String(index+1));break;}
      await page.getByRole('button',{name:'Next sound keys',exact:true}).click();
    }
  }
  await expect(page.getByRole('alertdialog',{name:'SoundKeys complete',exact:true})).toBeVisible();
});
