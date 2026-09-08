import { expect, test } from '@playwright/test';
import { SENTENCE_FIX } from '../../src/data/learnGamesData.js';

const scope = 'literacy-guide-learn-games:fullscreen-overlay-preview';
const readResult = (page, game) => page.evaluate(({scope,game}) => JSON.parse(localStorage.getItem(scope) || '{}').games?.[game], {scope,game});
async function open(page, game, difficulty='easy') {
  await page.goto(`/preview/game-overlay.html?game=${game}&difficulty=${difficulty}&sound=0&music=0`);
}
async function tapWord(page, word) {
  await page.locator('.lg-hop-grid button:not([disabled])').getByText(word, {exact:true}).first().click();
}
async function saveShot(page, name) {
  if (process.env.LP_G10_SCREENSHOTS) await page.screenshot({path:`${process.env.LP_G10_SCREENSHOTS}/${name}.png`});
}
async function fitControls(page, selector) {
  const boxes=await page.locator(selector).evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));
  const {width,height}=page.viewportSize();
  for (const r of boxes) {
    expect(r.w).toBeGreaterThanOrEqual(55.9); expect(r.h).toBeGreaterThanOrEqual(55.9);
    expect(r.x).toBeGreaterThanOrEqual(0); expect(r.y).toBeGreaterThanOrEqual(0);
    expect(r.x+r.w).toBeLessThanOrEqual(width+.1); expect(r.y+r.h).toBeLessThanOrEqual(height+.1);
  }
  for (let i=0;i<boxes.length;i++) for (let j=i+1;j<boxes.length;j++) {
    const a=boxes[i],b=boxes[j];
    const gapX=Math.max(a.x-b.x-b.w,b.x-a.x-a.w), gapY=Math.max(a.y-b.y-b.h,b.y-a.y-a.h);
    expect(Math.max(gapX,gapY)).toBeGreaterThanOrEqual(7.9);
  }
}
for (const [difficulty, rounds, pairs] of [['easy',6,3],['medium',8,6],['hard',10,10]]) {
  test(`${difficulty} Memory collects every pair across bounded boards and saves before leaving`, async ({page}) => {
    await open(page,'sight-word-memory',difficulty);
    await expect(page.locator('.lg-match-card').first()).toBeVisible();
    let collected=0;
    while(collected<pairs) {
      const cards=page.locator('.lg-match-card');
      expect(await cards.count()).toBeLessThanOrEqual(10);
      // Structural pairing fixture: this verifies input/commit behaviour, not child reading.
      const ids=[...new Set(await cards.evaluateAll(es=>es.map(e=>e.dataset.pairId)))];
      for(const id of ids) {
        const pair=page.locator(`.lg-match-card[data-pair-id="${id}"]`);
        await pair.first().evaluate(b=>{b.click();b.click();});
        await expect(pair.first()).not.toBeDisabled();
        await pair.last().click(); collected++;
        await expect(page.locator('.lg-memory-collection .collected')).toHaveCount(collected);
      }
      if(collected<pairs) await page.getByRole('button',{name:'Next card set',exact:true}).click();
    }
    await expect.poll(async()=> (await readResult(page,'sight-word-memory'))?.plays).toBe(1);
    await expect(page.getByRole('button',{name:'Finish collection'})).toBeVisible();
    await saveShot(page,`memory-${difficulty}-collection`);
    await page.getByRole('button',{name:'Close Sight Word Memory',exact:true}).click();
    expect((await readResult(page,'sight-word-memory')).plays).toBe(1);
  });
  test(`${difficulty} Pop advances deliberately, preserves retry and saves one result per replay`, async ({page}) => {
    test.setTimeout(90_000);
    await open(page,'pop-the-word',difficulty);
    for(let r=0;r<rounds;r++) {
      const target=(await page.locator('.lg-game-picture-text span').textContent()).trim();
      if(r===0) {
        const wrong=page.locator('.lg-floating-options button').filter({hasNotText:new RegExp(`^${target}$`)}).first();
        await wrong.click(); await expect(page.locator('.lg-pop-feedback')).toBeVisible();
      }
      await page.locator('.lg-floating-options button').getByText(target,{exact:true}).evaluate(b=>{for(let i=0;i<6;i++)b.click();});
      await expect(page.locator('.lg-pop-discovery')).toContainText(`You found ${target}!`);
      await expect.poll(()=>page.locator('.lg-pop-meadow').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
      if(r===rounds-1) {
        expect((await readResult(page,'pop-the-word')).plays).toBe(1);
        await saveShot(page,`pop-${difficulty}-discovery`);
      }
      await page.getByRole('button',{name:r===rounds-1?'Finish':'Next word',exact:true}).click();
    }
    const saved=await readResult(page,'pop-the-word');
    expect(saved.plays).toBe(1);
    expect(saved.practiceRecord.completions).toHaveLength(1);
    expect(saved.practiceRecord.completions[0].steps[0].correct).toBe(false);
    expect(saved.practiceRecord.completions[0].assistedRetries).toHaveLength(1);
    expect(saved.practiceRecord.completions[0].steps.every(s=>s.independent===false)).toBe(true);
    await page.getByRole('button',{name:'Play again',exact:true}).click();
    await expect(page.locator('.lg-floating-options button')).toHaveCount(6);
    expect((await readResult(page,'pop-the-word')).plays).toBe(1);
  });
  test(`${difficulty} Hop uses a fresh target and moves to each committed word stone`, async ({page}) => {
    test.setTimeout(90_000); await page.emulateMedia({reducedMotion:'reduce'});
    await open(page,'word-hopscotch',difficulty);
    const model=await page.locator('.lg-sentence-model > span').textContent();
    await page.getByRole('button',{name:'Try a new sentence'}).click();
    const total=difficulty==='hard'?7:rounds;
    for(let r=0;r<total;r++) {
      const sentence=await page.locator('.lg-hop-model > span').textContent();
      expect(sentence).not.toBe(model);
      const words=sentence.replace(/[.?!]/g,'').split(/\s+/);
      for(let i=0;i<words.length;i++) {
        const before=await page.locator('.lg-hop-pal').evaluate(e=>e.getBoundingClientRect().x);
        await tapWord(page,words[i]);
        await expect(page.locator('.lg-sentence-path .done')).toHaveCount(i+1);
        const after=await page.locator('.lg-hop-pal').evaluate(e=>e.getBoundingClientRect().x);
        expect(after).toBeGreaterThan(before);
      }
      await expect(page.locator('.lg-sentence-complete')).toContainText(sentence);
      await expect(page.locator('.lg-game-audio')).toHaveCount(0);
      if(r===total-1) expect((await readResult(page,'word-hopscotch')).plays).toBe(1);
      await page.getByRole('button',{name:r===total-1?'Finish':'Next sentence',exact:true}).click();
    }
    expect((await readResult(page,'word-hopscotch')).plays).toBe(1);
  });
  test(`${difficulty} Fix-It keeps the repaired message until Next and saves on the last repair`, async ({page}) => {
    test.setTimeout(90_000); await open(page,'reading-race',difficulty);
    const total=Math.min(rounds,SENTENCE_FIX[difficulty].length);
    for(let r=0;r<total;r++) {
      const display=(await page.locator('.lg-fix-sentence').textContent()).trim();
      const fix=SENTENCE_FIX[difficulty].find(f=>f.display===display); expect(fix).toBeTruthy();
      await tapWord(page,fix.answer);
      await expect(page.locator('.lg-repair-piece')).toHaveText(fix.answer);
      await expect(page.locator('.lg-game-audio')).toHaveCount(0);
      if(r===total-1) expect((await readResult(page,'reading-race')).plays).toBe(1);
      await page.getByRole('button',{name:r===total-1?'Finish':'Next message',exact:true}).click();
    }
    expect((await readResult(page,'reading-race')).plays).toBe(1);
  });
}
for(const viewport of [{width:568,height:320},{width:393,height:851},{width:1024,height:768}]) {
 test(`G10 choices and finished products fit ${viewport.width}x${viewport.height}`,async({page})=>{
  test.setTimeout(90_000); await page.setViewportSize(viewport);
  for(const game of ['sight-word-memory','pop-the-word','word-hopscotch','reading-race']) {
   await open(page,game,'hard');
   if(game==='word-hopscotch') await page.getByRole('button',{name:'Try a new sentence'}).click();
   const selector=game==='sight-word-memory'?'.lg-match-card':game==='pop-the-word'?'.lg-floating-options button':'.lg-hop-grid button';
   await fitControls(page,selector);
   await saveShot(page,`${game}-${viewport.width}`);
   if(game==='pop-the-word') {
     const target=await page.locator('.lg-game-picture-text span').textContent();
     const button=page.locator(selector).getByText(target,{exact:true});
     const box=await button.boundingBox(); await button.focus(); await page.keyboard.down('Space');
     expect(await button.boundingBox()).toEqual(box); await page.keyboard.up('Space');
     await expect(page.locator('.lg-pop-world')).toBeVisible(); await fitControls(page,'.lg-pop-discovery button');
   }
  }
 });
}
