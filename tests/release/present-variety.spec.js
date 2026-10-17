import {test,expect} from '@playwright/test';
import {buildCyclePresentation} from '../../src/utils/present/presentationBuilder.js';

async function deckPage(page,cycle='cycle-9',day='tuesday',{duplicateWords=false,forceAudioError=false,letterFixture=false}={}){
 const deck=buildCyclePresentation(cycle,{day});
 let html=deck.html;
 if(duplicateWords||forceAudioError)html=html.replace(/data-scramble-card="([^"]*)"/,(_match,encoded)=>{
  const card=JSON.parse(encoded.replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
  if(duplicateWords)card.sentence='I can see a cat and a cat.';
  if(forceAudioError)card.audioPath='/forced-audio-error.mp3';
  return `data-scramble-card="${JSON.stringify(card).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}"`;
 });
 if(letterFixture)html=html.replace(/(<div class="p-match" data-match-game[^>]*>)(\s*<div class="p-match-grid">)[\s\S]*?<\/div>/,(_match,game,grid)=>{
  const cards=['A','a','M','m','A','a','M','m'].map((letter,index)=>`<button class="p-match-card" type="button" data-match-word="${letter.toLowerCase()}" aria-label="Card ${index+1}"><span class="p-card-back">${index+1}</span><span class="p-card-word" hidden>${letter}</span></button>`).join('');
  return game.replace('data-match-game','data-match-game data-match-kind="letters"')+grid+cards+'</div>';
 });
 await page.route('**/present-variety-test' ,route=>route.fulfill({contentType:'text/html',body:html}));
 await page.goto('/present-variety-test');await page.locator('#startBtn').click();return deck;
}
async function jump(page,deck,cls){
 const item=deck.slideIndex.find(slide=>slide.cls===cls);expect(item,cls).toBeTruthy();
 await page.locator('#overview-toggle').click();await page.locator(`[data-go-slide="${item.index}"]`).click();return page.locator('.slide.active');
}
async function startMix(page,active){
 await active.locator('[data-scramble-start]').press('Enter');await page.clock.fastForward(15000);
 await expect(active.locator('[data-scramble-game]')).toHaveAttribute('data-phase','build');
}
async function memoryData(active){return active.locator('[data-match-word]').evaluateAll(nodes=>nodes.map(node=>({word:node.dataset.matchWord,text:node.querySelector('.p-card-word').textContent})));}
async function chooseMismatch(active,data){
 const other=data.findIndex(card=>card.word!==data[0].word);
 expect(other).toBeGreaterThan(0);
 await active.locator('[data-match-word]').nth(0).press('Enter');await active.locator('[data-match-word]').nth(other).press('Enter');
 return [0,other];
}

test('Sentence Mix-Up automatically mixes after fifteen seconds while retaining only the picture as a model',async({page})=>{
 await page.clock.install();const deck=await deckPage(page);const active=await jump(page,deck,'p-sentence-scramble');
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
 const model=active.locator('[data-scramble-model]'),sentence=await model.innerText(),picture=active.locator('.p-class-picture'),src=await picture.getAttribute('src');
 await expect(model).toBeVisible();await expect(active.locator('[data-scramble-check]')).toBeHidden();
 await active.locator('[data-scramble-start]').press('Enter');await page.clock.fastForward(14999);
 await expect(model).toHaveText(sentence);await expect(active.locator('[data-scramble-bank]')).toBeHidden();
 await page.clock.runFor(51);
 await expect(active.locator('[data-scramble-game]')).toHaveAttribute('data-phase','build');
 await expect(model).toBeHidden();await expect(model).toBeEmpty();
 await expect(picture).toBeVisible();await expect(picture).toHaveAttribute('src',src);
 await expect.poll(()=>picture.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
 await expect(active.locator('[data-scramble-hear]')).toBeHidden();
 expect(await active.ariaSnapshot()).not.toContain(sentence);
 const words=sentence.split(/\s+/),tokens=await active.locator('[data-scramble-word]').allTextContents();
 expect([...tokens].sort()).toEqual([...words].sort());expect(tokens).not.toEqual(words);
 await expect(active.locator('[data-scramble-check]')).toBeVisible();
});

test('Sentence Mix-Up retains a wrong selected order, supports placed-word repair and handles duplicate tokens by identity',async({page})=>{
 await page.clock.install();const deck=await deckPage(page,'cycle-9','tuesday',{duplicateWords:true}),active=await jump(page,deck,'p-sentence-scramble');
 await startMix(page,active);
 const tokens=active.locator('[data-scramble-word]');const identities=await tokens.evaluateAll(nodes=>nodes.map(node=>node.dataset.scrambleWord));
 expect(new Set(identities).size).toBe(8);expect(await tokens.allTextContents()).toEqual(expect.arrayContaining(['a','a']));
 const wrong=[7,6,5,4,3,2,1,0];
 for(const index of wrong)await active.locator(`[data-scramble-word="${index}"]`).press('Enter');
 const placed=active.locator('[data-scramble-placed]');await expect(placed).toHaveCount(8);
 expect(await placed.evaluateAll(nodes=>nodes.map(node=>Number(node.dataset.scramblePlaced)))).toEqual(wrong);
 await active.locator('[data-scramble-check]').press('Enter');await expect(active.locator('[data-scramble-feedback]')).toContainText('Keep your sentence');
 expect(await placed.evaluateAll(nodes=>nodes.map(node=>Number(node.dataset.scramblePlaced)))).toEqual(wrong);
 await active.locator('[data-scramble-placed="6"]').press('Space');await expect(active.locator('[data-scramble-word="6"]')).toHaveText('a');await expect(placed).toHaveCount(7);
 await expect(active.locator('[data-scramble-check]')).toBeDisabled();
 for(const index of wrong.filter(index=>index!==6))await active.locator(`[data-scramble-placed="${index}"]`).press('Enter');
 for(let index=0;index<8;index++)await active.locator(`[data-scramble-word="${index}"]`).press('Enter');
 await active.locator('[data-scramble-check]').press('Space');await expect(active.locator('[data-scramble-feedback]')).toContainText('words are in order');
 expect(await placed.allTextContents()).toEqual('I can see a cat and a cat.'.split(' '));
});

test('countdown pause freezes remaining time and deliberately resumes; reset and navigation cancel stale timers',async({page})=>{
 await page.clock.install();const deck=await deckPage(page),active=await jump(page,deck,'p-sentence-scramble');const game=active.locator('[data-scramble-game]'),count=active.locator('[data-scramble-count]'),start=active.locator('[data-scramble-start]');
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await start.click();await page.clock.fastForward(5000);await start.click();await expect(game).toHaveAttribute('data-phase','paused');
 const remaining=await count.innerText();expect(Number(remaining)).toBe(10);await page.clock.fastForward(20000);await expect(count).toHaveText(remaining);await expect(active.locator('[data-scramble-model]')).toBeVisible();
 await start.press('Enter');await page.clock.fastForward(10000);await expect(game).toHaveAttribute('data-phase','build');
 await active.locator('[data-scramble-reset]').press('Enter');await expect(game).toHaveAttribute('data-phase','model');await expect(count).toHaveText('15');
 await start.click();await page.clock.fastForward(4000);await active.locator('[data-scramble-reset]').click();await page.clock.fastForward(20000);
 await expect(game).toHaveAttribute('data-phase','model');await expect(count).toHaveText('15');await expect(active.locator('[data-scramble-check]')).toBeHidden();
 await start.click();await page.clock.fastForward(4000);const index=deck.slideIndex.find(item=>item.cls==='p-sentence-scramble').index;
 await page.locator('#next').click();await page.clock.fastForward(20000);await page.locator('#overview-toggle').click();await page.locator(`[data-go-slide="${index}"]`).click();
 await expect(game).toHaveAttribute('data-phase','model');await expect(count).toHaveText('15');await expect(active.locator('[data-scramble-bank]')).toBeHidden();
});

test('projection pause freezes the active mix countdown and requires deliberate countdown resume',async({page})=>{
 await page.clock.install();const deck=await deckPage(page),active=await jump(page,deck,'p-sentence-scramble');
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await active.locator('[data-scramble-start]').click();await page.clock.fastForward(3000);await page.locator('#blank-toggle').click();
 const count=await active.locator('[data-scramble-count]').innerText();await page.clock.fastForward(20000);await expect(active.locator('[data-scramble-count]')).toHaveText(count);
 await page.locator('#blank-screen').click();await expect(active.locator('[data-scramble-game]')).toHaveAttribute('data-phase','paused');
 await active.locator('[data-scramble-start]').press('Enter');await page.clock.fastForward(Number(count)*1000);await expect(active.locator('[data-scramble-game]')).toHaveAttribute('data-phase','build');
});

test('Sentence Detective keeps wrong selections neutral, explicitly repairs, and updates both pictured rounds',async({page})=>{
 const deck=await deckPage(page,'cycle-9','monday'),active=await jump(page,deck,'p-sentence-detective');
 const rounds=JSON.parse(await active.locator('[data-detective-rounds]').getAttribute('data-detective-rounds'));expect(new Set(rounds.map(round=>round.matches)).size).toBe(2);expect(new Set(rounds.map(round=>round.imagePath)).size).toBe(2);
 for(const round of rounds){
  const image=active.locator('[data-detective-image]');await expect(image).toHaveAttribute('src',round.imagePath);await expect.poll(()=>image.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  await expect(active.locator('[data-detective-sentence]')).toHaveText(round.sentence);
  const wrong=active.locator(`[data-detective-answer="${round.matches?'no':'yes'}"]`);await wrong.press('Enter');
  await expect(wrong).toHaveAttribute('aria-pressed','true');await expect(active.locator('[data-detective-sentence]')).toHaveText(round.sentence);
  await expect(active.locator('[data-detective-feedback]')).toContainText('Talk about your choice');expect(await active.locator('[data-detective-feedback]').innerText()).not.toMatch(/wrong|lose|life|score/i);
  await active.locator('[data-detective-repair]').press('Space');await expect(active.locator('[data-detective-sentence]')).toHaveText(round.correctSentence);
  await active.locator('[data-detective-next]').press('Enter');
 }
 await expect(active.locator('[data-detective-sentence]')).toHaveText(rounds[0].sentence);await expect(active.locator('[data-detective-repair]')).toBeDisabled();
});

test("What's Missing removes the hidden answer from accessible labels, then reveals and restores all items",async({page})=>{
 const deck=await deckPage(page,'cycle-9','wednesday'),active=await jump(page,deck,'p-whats-missing');
 const game=active.locator('[data-missing-game]'),items=JSON.parse(await game.getAttribute('data-missing-items')),order=JSON.parse(await game.getAttribute('data-missing-order'));
 for(let round=0;round<2;round++){
  await active.locator('[data-missing-hide]').press('Enter');const hidden=active.locator(`[data-missing-item="${order[round]}"]`);await expect(hidden).toHaveText('?');
  await expect(hidden).not.toHaveAttribute('aria-label',/.+/);await expect(hidden).not.toHaveAttribute('title',/.+/);
  expect(await hidden.ariaSnapshot()).not.toContain(items[order[round]].text);await expect(active.getByText(items[order[round]].text,{exact:true})).toHaveCount(0);
  await expect(active.locator('[data-missing-next]')).toBeDisabled();await active.locator('[data-missing-reveal]').press('Space');
  await expect(hidden).toHaveText(items[order[round]].text);await active.locator('[data-missing-next]').press('Enter');
  expect(await active.locator('[data-missing-item]').allTextContents()).toEqual(items.map(item=>item.text));
 }
});

for(const [cycle,kind] of [['cycle-8','words'],['cycle-2','letter-variant fixture']])test(`${kind} memory hides a mismatch after exactly two seconds, locks a third card and leaves matches visible`,async({page})=>{
 await page.clock.install();const deck=await deckPage(page,cycle,'friday',{letterFixture:kind!=='words'}),active=await jump(page,deck,'p-sight-match');const cards=active.locator('[data-match-word]');await expect(cards).toHaveCount(8);
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
 const data=await memoryData(active);let chosen;if(kind==='words')chosen=await chooseMismatch(active,data);else{expect(data[0]).toEqual(data[4]);await cards.nth(0).press('Enter');await cards.nth(4).press('Enter');chosen=[0,4];}await expect(active.locator('.is-open')).toHaveCount(2);
 const third=[0,1,2,3,4,5,6,7].find(index=>!chosen.includes(index));await cards.nth(third).press('Enter');await expect(active.locator('.is-open')).toHaveCount(2);
 await page.clock.fastForward(1999);await expect(active.locator('.is-open')).toHaveCount(2);await page.clock.runFor(1);await expect(active.locator('.is-open')).toHaveCount(0);
 const pair=data.findIndex((card,index)=>index>0&&card.word===data[0].word&&(kind==='words'||card.text!==data[0].text));expect(pair).toBeGreaterThan(0);
 await cards.nth(0).press('Enter');await cards.nth(pair).press('Space');await expect(active.locator('.is-matched')).toHaveCount(2);await page.clock.fastForward(3000);await expect(active.locator('.is-matched.is-open')).toHaveCount(2);
});

test('memory restart and navigation cancel the old mismatch callback before a fresh turn',async({page})=>{
 await page.clock.install();const deck=await deckPage(page,'cycle-8','friday'),active=await jump(page,deck,'p-sight-match');
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await chooseMismatch(active,await memoryData(active));await page.clock.fastForward(1000);await active.locator('[data-match-reset]').click();
 await active.locator('[data-match-word]').first().press('Enter');await page.clock.fastForward(1500);await expect(active.locator('.is-open')).toHaveCount(1);
 await active.locator('[data-match-reset]').click();await chooseMismatch(active,await memoryData(active));await page.clock.fastForward(1000);await page.locator('#next').click();
 await jump(page,deck,'p-sight-match');await active.locator('[data-match-word]').first().press('Enter');await page.clock.fastForward(1500);await expect(active.locator('.is-open')).toHaveCount(1);
});

for(const viewport of [{name:'laptop',width:1366,height:768},{name:'tablet',width:1024,height:768}])test(`selected whole-class games fit and remain operable on ${viewport.name}`,async({page})=>{
 await page.setViewportSize(viewport);await page.clock.install();
 for(const [day,cls] of [['monday','p-sentence-detective'],['wednesday','p-whats-missing'],['tuesday','p-sentence-scramble']]){
  const deck=await deckPage(page,'cycle-23',day),active=await jump(page,deck,cls);
  if(day==='tuesday')await startMix(page,active);
  const overflow=await active.evaluate(slide=>{const bounds=slide.getBoundingClientRect();return [...slide.querySelectorAll('button,img,p,[data-missing-item]')].filter(node=>node.getClientRects().length&&getComputedStyle(node).visibility!=='hidden').flatMap(node=>{const r=node.getBoundingClientRect();return r.left<bounds.left-2||r.right>bounds.right+2||r.top<bounds.top-2||r.bottom>bounds.bottom+2?[{tag:node.tagName,text:node.textContent.slice(0,50)}]:[];});});
  expect(overflow).toEqual([]);
  for(const button of await active.locator('button:visible').all())expect(await button.evaluate(node=>{const r=node.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===node;})).toBe(true);
  await page.screenshot({path:`.artifacts/present-variety/${viewport.name}-${cls}.png`});
 }
});


test('a failed model recording pauses the reading countdown and preserves thinking time',async({page})=>{
 await page.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){queueMicrotask(()=>this.dispatchEvent(new Event('error')));return Promise.reject(new Error('Test recording unavailable'));};});
 await page.clock.install();const deck=await deckPage(page,'cycle-9','tuesday',{forceAudioError:true}),active=await jump(page,deck,'p-sentence-scramble');
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await active.locator('[data-scramble-start]').click();await page.clock.fastForward(3000);
 await active.locator('[data-scramble-hear]').click();await expect(page.locator('#audio-status')).toContainText('Recording unavailable');
 await expect(active.locator('[data-scramble-game]')).toHaveAttribute('data-phase','paused');const remaining=await active.locator('[data-scramble-count]').innerText();
 await page.clock.fastForward(20000);await expect(active.locator('[data-scramble-count]')).toHaveText(remaining);await expect(active.locator('[data-scramble-model]')).toBeVisible();
});

test('a failed picture on a future slide does not interrupt the current sentence countdown',async({page})=>{
 await page.route('**/missing-future-picture.webp',route=>route.fulfill({status:404,body:''}));
 await page.clock.install();const deck=await deckPage(page),active=await jump(page,deck,'p-sentence-scramble');await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
 await active.locator('[data-scramble-start]').click();await page.clock.fastForward(3000);
 const future=await page.evaluate(()=>{const slides=[...document.querySelectorAll('.slide')],current=slides.findIndex(slide=>slide.classList.contains('active'));const index=slides.findIndex((slide,index)=>index>current&&slide.querySelector('img:not(.p-pal):not(.p-book-cover)'));if(index>=0)slides[index].querySelector('img:not(.p-pal):not(.p-book-cover)').src='/missing-future-picture.webp';return index;});
 expect(future).toBeGreaterThan(-1);await expect(page.locator('.slide').nth(future)).toHaveAttribute('data-media-interrupted','true');
 await expect(active.locator('[data-scramble-game]')).toHaveAttribute('data-phase','countdown');await page.clock.fastForward(12000);await expect(active.locator('[data-scramble-game]')).toHaveAttribute('data-phase','build');
});
