import { test, expect } from '@playwright/test';
// Keep the full real-control video; automatic trace packaging stalled after
// this long recording passed all assertions. Focused cases retain traces.
test.use({ trace: 'off' });
const state = page => page.evaluate(() => window.__rhymePop.snapshot());
test('full parade completes all ten baskets through real controls, saves once and reopens cleanly', async ({ browser, baseURL }, testInfo) => {
  test.setTimeout(160000);
  const context=await browser.newContext({baseURL,viewport:{width:1024,height:768},recordVideo:{dir:testInfo.outputPath('video'),size:{width:1024,height:768}}});
  const page=await context.newPage();
  try {
    await page.goto('/preview/game-overlay.html?game=rhyme-pop&sound=0&music=0&rhymeDiagnostics=1&rhymeSeed=41');
    await expect(page.getByRole('button',{name:'Start popping',exact:true})).toBeVisible();
    await page.screenshot({path:testInfo.outputPath('opening.png')});
    await page.getByRole('button',{name:'Start popping',exact:true}).click();await page.getByRole('button',{name:'Read the words',exact:true}).click();
    await page.screenshot({path:testInfo.outputPath('first-decision.png')});
    for(let round=0;round<10;round++) {
      for(let i=0;i<6;i++) {
        const c=(await state(page)).choices.find(c=>c.isRhyme);
        await page.locator(`[data-choice-id="${c.id}"]`).click();
        expect((await state(page)).words).toBe(round*6+i+1);
        if(round===0&&i===2)await page.screenshot({path:testInfo.outputPath('collecting.png')});
        if(i<5)await expect(page.locator('[data-rp-choice]').first()).toBeEnabled();
      }
      if(round<9){const next=page.getByRole('button',{name:'Next basket',exact:true});await expect(next).toBeVisible();if(round===0)await page.screenshot({path:testInfo.outputPath('basket-ready.png')});await next.click();}
    }
    const receipt=(await state(page)).receipt;expect(receipt.words).toBe(60);expect(receipt.evidence.firstResponses).toHaveLength(60);
    await expect(page.getByRole('button',{name:'Back to Arcade',exact:true})).toBeVisible();
    await expect(page.getByRole('heading',{name:'Parade ready!',exact:true})).toHaveCount(1);await page.screenshot({path:testInfo.outputPath('completion.png')});
    const readSaved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('literacy-guide-learn-games:fullscreen-overlay-preview')).games['rhyme-pop']);
    const saved=await readSaved();expect(saved.plays).toBe(1);expect(saved.wordsCompleted).toBe(60);expect(saved.practiceRecord.completions).toHaveLength(1);expect(saved.practiceRecord.completions[0].steps).toHaveLength(60);
    await page.getByRole('button',{name:'Back to Arcade',exact:true}).click();await expect(page.locator('.rp-game')).toHaveCount(0);await page.screenshot({path:testInfo.outputPath('exit.png')});
    await page.goto('/preview/game-overlay.html?game=rhyme-pop&sound=0&music=0&rhymeDiagnostics=1');await expect(page.getByRole('button',{name:'Start popping',exact:true})).toBeVisible();
    expect((await state(page)).words).toBe(0);expect((await state(page)).firstResponses).toHaveLength(0);
    const reopened=await readSaved();expect(reopened.plays).toBe(1);expect(reopened.practiceRecord).toEqual(saved.practiceRecord);
    await testInfo.attach('full-route-proof',{body:JSON.stringify({actualWords:receipt.words,baskets:10,firstResponses:receipt.evidence.firstResponses.length,plays:saved.plays,reopenedPlays:reopened.plays}),contentType:'application/json'});
    console.log('Full parade: all action, receipt and reopen assertions passed. Closing recorded context.');
  }finally{await context.close();console.log('Full parade: recorded context closed.');}
});
