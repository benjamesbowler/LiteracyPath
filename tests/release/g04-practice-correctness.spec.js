import { expect, test } from '@playwright/test';

async function wordButton(page,word) {
 return page.locator('.lg-hop-grid button:not([disabled])').getByText(word,{exact:true}).first();
}
test('shared practice honors mute, distinct repeated tiles, rapid commits and early saving',async({page})=>{
 await page.route('**/src/data/learnGamesData.js*',async route=>{
  const response=await route.fetch();
  await route.fulfill({response,body:`${await response.text()}\nSENTENCES.level1=['The cat sat.','The cat and the dog can run.'];`});
 });
 await page.addInitScript(()=>{window.testAudioPlays=[];HTMLMediaElement.prototype.play=function(){window.testAudioPlays.push(this.src);return Promise.resolve();};});
 await page.goto('/preview/game-overlay.html?game=word-hopscotch&sound=0&music=0');
 await expect(page.locator('.lg-sentence-model')).toContainText('The cat sat.');
 await page.getByRole('button',{name:'Try a new sentence'}).click();
 await expect(page.locator('.lg-hop-model')).toContainText('The cat and the dog can run.');
 const first=await wordButton(page,'The');
 await first.evaluate(b=>{for(let i=0;i<6;i++)b.click();});
 await expect(page.locator('.lg-sentence-path .done')).toHaveCount(1);
 await expect(page.locator('.lg-game-score')).toHaveText('10 pts');
 for(const word of ['cat','and','the','dog','can']) await (await wordButton(page,word)).click();
 const before=Number((await page.locator('.lg-game-score').textContent()).match(/\d+/)[0]);
 await (await wordButton(page,'run')).evaluate(b=>{for(let i=0;i<6;i++)b.click();});
 await expect(page.locator('.lg-sentence-complete')).toContainText('The cat and the dog can run.');
 await expect(page.locator('.lg-game-score')).toHaveText(`${before+20} pts`);
 expect(await page.evaluate(()=>window.testAudioPlays)).toEqual([]);
 const result=await page.evaluate(()=>JSON.parse(localStorage.getItem('literacy-guide-learn-games:fullscreen-overlay-preview')).games['word-hopscotch']);
 expect(result.plays).toBe(1);
 expect(result.practiceRecord.completions[0].steps).toHaveLength(7);
 expect(new Set(result.practiceRecord.completions[0].steps.map(s=>s.tileId)).size).toBe(7);
 await page.getByRole('button',{name:'Finish',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Word Hopscotch complete!',exact:true})).toBeVisible();
});

test('Sentence Fix-It retains accepted variants and gives no solved sentence audio before repair',async({page})=>{
 await page.route('**/src/data/learnGamesData.js*',async route=>{
  const response=await route.fetch();
  await route.fulfill({response,body:`${await response.text()}\nSENTENCE_FIX.easy=[SENTENCE_FIX.hard.find(item=>item.acceptedAnswers?.includes('her'))];`});
 });
 await page.addInitScript(()=>{window.testAudioPlays=[];HTMLMediaElement.prototype.play=function(){window.testAudioPlays.push(this.src);return Promise.resolve();};});
 await page.goto('/preview/game-overlay.html?game=reading-race&sound=1&music=0');
 await expect(page.locator('.lg-fix-sentence')).toContainText('The wizard kept ___ wand by the door.');
 await expect(page.getByRole('button',{name:'Hear repaired sentence'})).toHaveCount(0);
 const before=await page.evaluate(()=>window.testAudioPlays);
 expect(before.some(src=>/wizard|wand/.test(src))).toBe(false);
 await (await wordButton(page,'him')).click();
 await expect(page.locator('.lg-fix-feedback')).toContainText('Read the whole sentence');
 await (await wordButton(page,'her')).click();
 await expect(page.locator('.lg-fix-sentence')).toHaveText('The wizard kept her wand by the door.');
 await expect(page.getByRole('button',{name:'Finish',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Turn spoken audio and game sounds off'}).click();
 const muted=await page.evaluate(()=>window.testAudioPlays.length);
 await expect(page.locator('.lg-game-audio')).toHaveCount(0);
 await page.getByRole('button',{name:'Finish',exact:true}).click();
 expect(await page.evaluate(()=>window.testAudioPlays.length)).toBe(muted);
 const result=await page.evaluate(()=>JSON.parse(localStorage.getItem('literacy-guide-learn-games:fullscreen-overlay-preview')).games['reading-race']);
 expect(result.plays).toBe(1);
 expect(result.practiceRecord.completions[0].steps[0].response).toBe('him');
 expect(result.practiceRecord.completions[0].steps[0].correct).toBe(false);
 expect(result.practiceRecord.completions[0].assistedRetries).toHaveLength(1);
});
