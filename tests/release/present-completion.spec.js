import {test,expect} from '@playwright/test';
import {buildCyclePresentation} from '../../src/utils/present/presentationBuilder.js';
const artifacts=process.env.LP_PRESENT_ARTIFACT_ROOT||'.artifacts/present-esl-review';
async function deckPage(page){const deck=buildCyclePresentation('cycle-19',{day:'friday'});await page.route('**/present-completion-test',route=>route.fulfill({contentType:'text/html',body:deck.html}));await page.goto('/present-completion-test');await page.locator('#startBtn').click();return deck;}
async function jump(page,deck,cls){const entry=deck.slideIndex.find(item=>item.cls===cls);await page.locator('#overview-toggle').click();await page.locator(`[data-go-slide="${entry.index}"]`).click();return page.locator('.slide.active');}

test('cumulative recap has one large target at a time and manual traversal through each selected review item',async({page})=>{
 const deck=await deckPage(page),active=await jump(page,deck,'p-hfw-review');const data=JSON.parse(await active.locator('[data-review-items]').getAttribute('data-review-items'));
 for(let i=0;i<data.length;i++){await expect(active.locator('.p-review-focus')).toHaveText(data[i].text);if(i<data.length-1)await active.locator('[data-review-next]').click();}
 await expect(active.locator('[data-review-next]')).toBeDisabled();await active.locator('[data-review-prev]').click();await expect(active.locator('.p-review-focus')).toHaveText(data.at(-2).text);
 await page.screenshot({path:`${artifacts}/regression/recap.png`});
});

test('opening letter recap updates the large spelling, approved picture and separate word playback together',async({page})=>{
 await page.addInitScript(()=>{window.__recapAudio=[];const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){const record={src:this.src};window.__recapAudio.push(record);this.addEventListener('ended',()=>{record.ended=true;},{once:true});return play.call(this);};});
 const deck=await deckPage(page),active=await jump(page,deck,'p-letter-review');
 const cards=JSON.parse(await active.locator('[data-review-items]').getAttribute('data-review-items'));
 const audible=cards.find(card=>card.audio&&card.anchorAudio&&card.imagePath);expect(audible).toBeTruthy();
 for(let i=0;i<cards.length;i++){
  const card=cards[i];await expect(active.locator('.p-review-focus')).toHaveText(card.text);
  const anchor=active.locator('[data-review-anchor]');
  if(card.anchorWord)await expect(anchor.locator('figcaption')).toHaveText(card.anchorWord);
  if(card.imagePath){await expect(anchor.locator('img')).toHaveAttribute('src',card.imagePath);await expect.poll(()=>anchor.locator('img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);}
  else await expect(anchor.locator('img')).toBeHidden();
  if(card===audible){
   await active.locator('[data-review-hear]').click();await expect.poll(()=>page.evaluate(()=>window.__recapAudio.at(-1)?.ended),{timeout:15000}).toBe(true);
   expect(await page.evaluate(()=>window.__recapAudio.at(-1).src)).toBe(new URL(card.audio,page.url()).href);
   await active.locator('[data-review-anchor-hear]').click();await expect.poll(()=>page.evaluate(()=>window.__recapAudio.at(-1)?.ended),{timeout:15000}).toBe(true);
   expect(await page.evaluate(()=>window.__recapAudio.at(-1).src)).toBe(new URL(card.anchorAudio,page.url()).href);
   await expect(active.locator('.p-review-focus')).toHaveText(card.text);
   await page.screenshot({path:`${artifacts}/regression/recap-pictures.png`});
  }
  if(i<cards.length-1)await active.locator('[data-review-next]').click();
 }
 expect(await page.evaluate(()=>window.__recapAudio.length)).toBe(2,'No autoplay or automatic advance');
 await expect(active.locator('[data-review-next]')).toBeDisabled();
});

test('daily sentence and detective recordings deliver the selected scene and stop on navigation',async({page})=>{
 test.setTimeout(90000);
 await page.addInitScript(()=>{window.__delivery=[];window.__deliveryAudios=[];const original=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){if(!window.__deliveryAudios.includes(this))window.__deliveryAudios.push(this);const record={src:this.src,position:this.currentTime,identity:window.__deliveryAudios.indexOf(this)};window.__delivery.push(record);this.addEventListener('playing',()=>{record.started=true;},{once:true});this.addEventListener('ended',()=>{record.ended=true;record.duration=this.duration;record.currentTime=this.currentTime;},{once:true});this.addEventListener('pause',()=>{record.paused=true;record.pausedTime=this.currentTime;},{once:true});return original.call(this);};});
 const deck=await deckPage(page);
 async function hear(button,path){const start=await page.evaluate(()=>window.__delivery.length);await button.click();await expect.poll(()=>page.evaluate(i=>window.__delivery[i]?.ended,start),{timeout:15000}).toBe(true);const record=await page.evaluate(i=>window.__delivery[i],start);expect(record.src).toBe(new URL(path,page.url()).href);expect(record.started).toBe(true);expect(record.currentTime).toBeGreaterThan(.8);expect(Math.abs(record.currentTime-record.duration)).toBeLessThan(.1);expect(await page.evaluate(i=>window.__delivery.length-i,start)).toBe(1);}
 const caption=await jump(page,deck,'p-sentence-track');await hear(caption.locator('[data-play]'),deck.manifest.slides.find(item=>item.construct==='supported-shared-reading').requiredAudio[0].src);
 const secondIndex=deck.slideIndex.filter(item=>item.cls==='p-sentence-track')[1].index;
 await page.locator('#overview-toggle').click();await page.locator(`[data-go-slide="${secondIndex}"]`).click();
 const second=page.locator('.slide.active');const secondMedia=deck.manifest.slides[secondIndex].requiredAudio[0];await hear(second.locator('[data-play]'),secondMedia.src);
 const sentence=second.locator('[data-play]');const start=await page.evaluate(()=>window.__delivery.length);await sentence.click();await expect.poll(()=>page.evaluate(i=>window.__delivery[i]?.started,start)).toBe(true);
 await page.waitForTimeout(250);await page.locator('#blank-toggle').click();await expect.poll(()=>page.evaluate(i=>window.__delivery[i]?.paused,start)).toBe(true);
 await page.locator('#blank-screen').click();await expect.poll(()=>page.evaluate(i=>window.__delivery[i+1]?.started,start)).toBe(true);
 const resumed=await page.evaluate(i=>({before:window.__delivery[i],after:window.__delivery[i+1]}),start);expect(resumed.after.identity).toBe(resumed.before.identity);expect(resumed.after.src).toBe(resumed.before.src);expect(resumed.after.position).toBeGreaterThan(.1);expect(Math.abs(resumed.after.position-resumed.before.pausedTime)).toBeLessThan(.1);
 await page.locator('#next').click();await expect.poll(()=>page.evaluate(i=>window.__delivery[i+1]?.paused,start)).toBe(true);
 const detectiveDeck=buildCyclePresentation('cycle-19',{day:'monday'});
 await page.route('**/present-detective-audio-test',route=>route.fulfill({contentType:'text/html',body:detectiveDeck.html}));
 await page.goto('/present-detective-audio-test');await page.locator('#startBtn').click();
 const detective=await jump(page,detectiveDeck,'p-sentence-detective');const rounds=JSON.parse(await detective.locator('[data-detective-rounds]').getAttribute('data-detective-rounds'));
 for(const round of rounds){
  await detective.locator(`[data-detective-answer="${round.matches?'yes':'no'}"]`).click();await detective.locator('[data-detective-repair]').click();
  await hear(detective.locator('[data-detective-hear]'),round.correctAudioPath);await detective.locator('[data-detective-next]').click();
 }
 const cancelStart=await page.evaluate(()=>window.__delivery.length);await detective.locator('[data-detective-answer="yes"]').click();await detective.locator('[data-detective-repair]').click();await detective.locator('[data-detective-hear]').click();
 await expect.poll(()=>page.evaluate(i=>window.__delivery[i]?.started,cancelStart)).toBe(true);await page.locator('#next').click();await expect.poll(()=>page.evaluate(i=>window.__delivery[i]?.paused,cancelStart)).toBe(true);expect(await page.evaluate(i=>window.__delivery.length-i,cancelStart)).toBe(1);
});

test('Friday has more game rounds, no teaching stages, and screen pause resumes existing audio',async({page})=>{
 const deck=await deckPage(page);expect(deck.lessonPlan.minutes).toBe(30);expect(deck.lessonPlan.newWords).toEqual([]);expect(deck.lessonPlan.newGraphemes).toEqual([]);
 for(const [cls,count] of [['p-word-build',3],['p-picture-match',3],['p-sentence-scramble',1],['p-sentence-detective',1],['p-whats-missing',1],['p-sight-match',1],['p-rhyming',3],['p-cooperative-sort',1],['p-sentence-track',6],['p-language',4]])expect(deck.slideIndex.filter(item=>item.cls===cls)).toHaveLength(count);
 await expect(page.locator('#teaching-sequence')).toHaveCount(0);await expect(page.locator('select')).toHaveCount(0);
 await page.locator('#blank-toggle').click();await expect(page.locator('#blank-screen')).toBeVisible();await page.locator('#blank-screen').click();await expect(page.locator('.slide.active')).toBeVisible();
});
