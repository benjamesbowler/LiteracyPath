import {test,expect} from '@playwright/test';
import {buildCyclePresentation} from '../../src/utils/present/presentationBuilder.js';
async function deckPage(page){const deck=buildCyclePresentation('cycle-19',{day:'friday'});await page.route('**/present-completion-test',route=>route.fulfill({contentType:'text/html',body:deck.html}));await page.goto('/present-completion-test');await page.locator('#startBtn').click();return deck;}
async function jump(page,deck,cls){const entry=deck.slideIndex.find(item=>item.cls===cls);await page.locator('#overview-toggle').click();await page.locator(`[data-go-slide="${entry.index}"]`).click();return page.locator('.slide.active');}

test('cumulative recap has one large target at a time and manual traversal through every earlier item',async({page})=>{
 const deck=await deckPage(page),active=await jump(page,deck,'p-hfw-review');const data=JSON.parse(await active.locator('[data-review-items]').getAttribute('data-review-items'));
 for(let i=0;i<data.length;i++){await expect(active.locator('.p-review-focus')).toHaveText(data[i].text);if(i<data.length-1)await active.locator('[data-review-next]').click();}
 await expect(active.locator('[data-review-next]')).toBeDisabled();await active.locator('[data-review-prev]').click();await expect(active.locator('.p-review-focus')).toHaveText(data.at(-2).text);
 await page.screenshot({path:'.artifacts/present-simplify/recap.png'});
});

test('opening letter recap updates the large spelling, approved picture and separate word playback together',async({page})=>{
 await page.addInitScript(()=>{window.__recapAudio=[];const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){const record={src:this.src};window.__recapAudio.push(record);this.addEventListener('ended',()=>{record.ended=true;},{once:true});return play.call(this);};});
 const deck=await deckPage(page),active=await jump(page,deck,'p-letter-review');
 const cards=JSON.parse(await active.locator('[data-review-items]').getAttribute('data-review-items'));
 for(let i=0;i<cards.length;i++){
  const card=cards[i];await expect(active.locator('.p-review-focus')).toHaveText(card.text);
  const anchor=active.locator('[data-review-anchor]');
  if(card.anchorWord)await expect(anchor.locator('figcaption')).toHaveText(card.anchorWord);
  if(card.imagePath){await expect(anchor.locator('img')).toHaveAttribute('src',card.imagePath);await expect.poll(()=>anchor.locator('img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);}
  else await expect(anchor.locator('img')).toBeHidden();
  if(card.target==='t'){
   await active.locator('[data-review-hear]').click();await expect.poll(()=>page.evaluate(()=>window.__recapAudio.at(-1)?.ended),{timeout:15000}).toBe(true);
   expect(await page.evaluate(()=>window.__recapAudio.at(-1).src)).toBe(new URL(card.audio,page.url()).href);
   await active.locator('[data-review-anchor-hear]').click();await expect.poll(()=>page.evaluate(()=>window.__recapAudio.at(-1)?.ended),{timeout:15000}).toBe(true);
   expect(await page.evaluate(()=>window.__recapAudio.at(-1).src)).toBe(new URL(card.anchorAudio,page.url()).href);
   await expect(active.locator('.p-review-focus')).toHaveText('Tt');
   await page.screenshot({path:'.artifacts/present-simplify/recap-pictures.png'});
  }
  if(i<cards.length-1)await active.locator('[data-review-next]').click();
 }
 expect(await page.evaluate(()=>window.__recapAudio.length)).toBe(2,'No autoplay or automatic advance');
 await expect(active.locator('[data-review-next]')).toBeDisabled();
});

test('installed sentence and story recordings deliver exactly one selected scene and stop on navigation',async({page})=>{
 test.setTimeout(90000);
 await page.addInitScript(()=>{window.__delivery=[];const original=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){const record={src:this.src};window.__delivery.push(record);this.addEventListener('playing',()=>{record.started=true;},{once:true});this.addEventListener('ended',()=>{record.ended=true;record.duration=this.duration;record.currentTime=this.currentTime;},{once:true});this.addEventListener('pause',()=>{record.paused=true;},{once:true});return original.call(this);};});
 const deck=await deckPage(page);
 async function hear(button,path){const start=await page.evaluate(()=>window.__delivery.length);await button.click();await expect.poll(()=>page.evaluate(i=>window.__delivery[i]?.ended,start),{timeout:15000}).toBe(true);const record=await page.evaluate(i=>window.__delivery[i],start);expect(record.src).toBe(new URL(path,page.url()).href);expect(record.started).toBe(true);expect(record.currentTime).toBeGreaterThan(.8);expect(Math.abs(record.currentTime-record.duration)).toBeLessThan(.1);expect(await page.evaluate(i=>window.__delivery.length-i,start)).toBe(1);}
 const caption=await jump(page,deck,'p-sentence-track');await hear(caption.locator('[data-play]'),deck.manifest.slides.find(item=>item.construct==='supported-shared-reading').requiredAudio[0].src);
 const studio=await jump(page,deck,'p-sentence-studio');const sentences=JSON.parse(await studio.locator('[data-studio-sentences]').getAttribute('data-studio-sentences'));
 for(const sentence of sentences){await hear(studio.locator('[data-studio-hear]'),sentence.audioPath);await studio.locator('[data-studio-change]').click();}
 const story=await jump(page,deck,'p-retell-story');const events=JSON.parse(await story.locator('[data-story]').getAttribute('data-story')).events;
 for(const event of events){await hear(story.locator('[data-story-hear]'),event.audioPath);await expect(story.locator('[data-story-text]')).toHaveText(event.text);await story.locator('[data-story-next]').click();}
 await story.locator('[data-retell-reset]').click();const start=await page.evaluate(()=>window.__delivery.length);await story.locator('[data-story-hear]').click();await expect.poll(()=>page.evaluate(i=>window.__delivery[i]?.started,start)).toBe(true);await page.locator('#next').click();await expect.poll(()=>page.evaluate(i=>window.__delivery[i]?.paused,start)).toBe(true);expect(await page.evaluate(i=>window.__delivery.length-i,start)).toBe(1);
});

test('Friday has more game rounds, no teaching stages, and screen pause resumes existing audio',async({page})=>{
 const deck=await deckPage(page);expect(deck.lessonPlan.newWords).toEqual([]);expect(deck.lessonPlan.newGraphemes).toEqual([]);
 for(const cls of ['p-sight-match','p-word-build','p-picture-match'])expect(deck.slideIndex.filter(item=>item.cls===cls)).toHaveLength(2);
 await expect(page.locator('#teaching-sequence')).toHaveCount(0);await expect(page.locator('select')).toHaveCount(0);
 await page.locator('#blank-toggle').click();await expect(page.locator('#blank-screen')).toBeVisible();await page.locator('#blank-screen').click();await expect(page.locator('.slide.active')).toBeVisible();
});
