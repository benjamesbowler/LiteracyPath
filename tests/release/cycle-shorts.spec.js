import {test,expect} from '@playwright/test';
import {CYCLE_SHORTS} from '../../src/content/cycle-shorts/passages.js';
import {buildCyclePresentation} from '../../src/utils/present/presentationBuilder.js';
const out='.artifacts/cycle-shorts';

test('children can find every cycle, read all questions, retry and return to Books',async({page})=>{
 test.setTimeout(180000);
 await page.goto('/preview/child-surfaces.html?surface=reading-library');
 await page.getByRole('button',{name:'Cycle Shorts',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Cycle Shorts',exact:true})).toBeVisible();
 await expect(page.locator('.rc-card')).toHaveCount(27);
 for(const p of CYCLE_SHORTS){
  await page.getByRole('button',{name:`Read Cycle ${p.cycleNumber}: ${p.title}`,exact:true}).click();
  await expect(page.locator('.rc-passage')).toContainText(p.text);
  await expect(page.locator('.rc-passage strong').first()).toBeVisible();
  await page.getByRole('button',{name:'Start again',exact:true}).click();
  for(let i=0;i<3;i++){
   const q=p.questions[i];
   if(i===0){await page.locator('.rc-options').getByRole('button',{name:q.options[1],exact:true}).click();await page.getByRole('button',{name:'Check answer',exact:true}).click();await expect(page.locator('.rc-feedback')).toContainText('Try another answer');}
   await page.locator('.rc-options').getByRole('button',{name:q.answer,exact:true}).click();await page.getByRole('button',{name:'Check answer',exact:true}).click();
   await expect(page.locator('.rc-feedback')).toContainText(q.evidence.join(' '));
   if(i<2)await page.getByRole('button',{name:'Next question',exact:true}).click();
  }
  await page.getByRole('button',{name:'Finish practice',exact:true}).click();
  await expect(page.getByRole('heading',{name:'You finished this practice!',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'← All Cycle Shorts',exact:true}).click();
 }
 await page.getByRole('button',{name:'← Back to Guided Reading',exact:true}).click();await expect(page.getByRole('heading',{name:'Books',exact:true})).toBeVisible();
});

for(const [width,height] of [[320,568],[768,1024],[1024,768],[1920,1080]])test(`Cycle Shorts reading and projector fit at ${width}x${height}`,async({page})=>{
 test.setTimeout(180000);await page.setViewportSize({width,height});
 await page.goto('/preview/child-surfaces.html?surface=reading-library');await page.getByRole('button',{name:'Cycle Shorts',exact:true}).click();
 await page.getByRole('button',{name:`Read Cycle 23: ${CYCLE_SHORTS[22].title}`,exact:true}).click();
 await page.getByRole('button',{name:'Full screen',exact:true}).click();
 await expect(page.locator('#rc-lesson-stage')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:`${out}/reader-${width}x${height}.png`});
 await page.getByRole('button',{name:/Exit full screen:/}).click();
 await page.getByRole('button',{name:'← All Cycle Shorts',exact:true}).click();
 await page.getByRole('button',{name:`Read Cycle 1: ${CYCLE_SHORTS[0].title}`,exact:true}).click();
 await page.getByRole('button',{name:'Full screen',exact:true}).click();
 const pictureTab=page.getByRole('button',{name:'Pictures',exact:true});if(await pictureTab.isVisible())await pictureTab.click();
 expect(await page.locator('#rc-lesson-stage [aria-label="Story pictures"]').evaluate(el=>{const panel=el.getBoundingClientRect(),image=el.querySelector('img').getBoundingClientRect();return image.top>=panel.top&&image.bottom<=panel.bottom;})).toBe(true);
 await page.getByRole('button',{name:/Exit full screen:/}).click();
 // A fixed, authored canvas intentionally scales for the projector. Check all
 // story/question views against its true content region, including longest texts.
 // All manuscripts exercise the fixed canvas at tablet size. Other viewports
 // repeat the shortest and longest representative texts against native controls.
 const manuscripts=width===1024?CYCLE_SHORTS:[CYCLE_SHORTS[0],CYCLE_SHORTS[11],CYCLE_SHORTS[13],CYCLE_SHORTS[22],CYCLE_SHORTS[26]];
 for(const p of manuscripts){
  const deck=buildCyclePresentation(`cycle-${p.cycleNumber}`,{day:'friday',startIndex:buildCyclePresentation(`cycle-${p.cycleNumber}`,{day:'friday'}).slideCount-4});
  await page.route('**/cycle-shorts-deck',route=>route.fulfill({contentType:'text/html',body:deck.html}));
  await page.goto('/cycle-shorts-deck');await page.getByRole('button',{name:'Start presentation',exact:true}).click();
  for(let i=0;i<4;i++){
   const active=page.locator('.slide.active');
   const image=active.locator('.p-short-picture');await expect(image).toBeVisible();
   await expect.poll(()=>image.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
   if(i){await expect(active.locator('.p-answer')).toBeHidden();await active.locator('[data-reveal-toggle]').click();await expect(active.locator('.p-answer')).toBeVisible();await expect(active.locator('.p-answer')).toHaveCSS('opacity','1');await expect(active.locator('.p-answer')).toContainText(p.questions[i-1].answer);}
   const outside=await active.evaluate(el=>{const r=el.getBoundingClientRect();return [...el.querySelectorAll('p,h2,h3,li,button,img')].filter(n=>n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden').filter(n=>{const b=n.getBoundingClientRect();return b.bottom>r.bottom+1||b.right>r.right+1||b.left<r.left-1;}).map(n=>n.textContent);});
   expect(outside,`${p.id} view ${i}`).toEqual([]);
   if(p.cycleNumber===12&&i===0)await page.screenshot({path:`${out}/story-cycle-12-${width}x${height}.png`});
   if([12,23].includes(p.cycleNumber)&&i===1)await page.screenshot({path:`${out}/projector-cycle-${p.cycleNumber}-${width}x${height}.png`});
   if(i<3)await page.keyboard.press('ArrowRight');
  }
  await page.unroute('**/cycle-shorts-deck');
 }
});

test('teacher Guided Reading has the same collection and private answer reveals',async({page})=>{
 await page.goto('/preview/teacher-a11y.html?surface=guided-reading');
 await page.getByRole('button',{name:'Back to reading library',exact:true}).click();
 await page.getByRole('button',{name:'Cycle Shorts · Sunny Meadow Farm',exact:true}).click();
 await page.getByRole('button',{name:`Read Cycle 1: ${CYCLE_SHORTS[0].title}`,exact:true}).click();
 await expect(page.locator('.rc-feedback')).toHaveCount(0);
 await expect(page.locator('.rc-options button')).toHaveCount(4);
 await page.getByRole('button',{name:'Reveal answer and evidence',exact:true}).click();
 await expect(page.locator('.rc-feedback')).toContainText(CYCLE_SHORTS[0].questions[0].answer);
});

test('new Cycle Shorts narration starts and stops in the real reader',async({page})=>{
 await page.goto('/preview/child-surfaces.html?surface=reading-library');await page.getByRole('button',{name:'Cycle Shorts',exact:true}).click();
 await page.getByRole('button',{name:`Read Cycle 1: ${CYCLE_SHORTS[0].title}`,exact:true}).click();
 const delivery=page.waitForResponse(r=>r.url().includes('/audio/production/en-US/cycle-shorts/')&&[200,206].includes(r.status()));
 await page.getByRole('button',{name:'Hear with Leda',exact:true}).click();await delivery;
 await expect(page.locator('.rc-speech-note')).toHaveText('Playing with Leda.');
 await page.getByRole('button',{name:'Stop voice',exact:true}).click();
 expect(await page.evaluate(()=>[...document.querySelectorAll('audio')].every(a=>a.paused))).toBe(true);
});


test('Cycle Shorts full-screen word help matches the bold learning words',async({page})=>{
 await page.goto('/preview/child-surfaces.html?surface=reading-library');await page.getByRole('button',{name:'Cycle Shorts',exact:true}).click();
 await page.getByRole('button',{name:`Read Cycle 1: ${CYCLE_SHORTS[0].title}`,exact:true}).click();
 await page.getByRole('button',{name:'Full screen',exact:true}).click();await page.getByRole('button',{name:'Words',exact:true}).click();
 await expect(page.locator('#rc-lesson-stage .rc-lesson-support')).toContainText('Learning words: I, am, ant, mat.');
});


test('Present story picture failure offers retry and restores the same image',async({page})=>{
 let fail=true;
 await page.route('**/images/comprehension/cycle-shorts/cycle-short-12.webp',route=>fail?route.abort():route.continue());
 const deck=buildCyclePresentation('cycle-12',{day:'tuesday'});
 const ending=buildCyclePresentation('cycle-12',{day:'tuesday',startIndex:deck.slideCount-4});
 await page.route('**/cycle-shorts-deck',route=>route.fulfill({contentType:'text/html',body:ending.html}));
 await page.goto('/cycle-shorts-deck');await page.getByRole('button',{name:'Start presentation',exact:true}).click();
 const active=page.locator('.slide.active');
 await expect(active.locator('.p-media-failure')).toContainText('Picture unavailable');
 await expect(active.locator('.p-short-story')).toContainText(CYCLE_SHORTS[11].text);
 fail=false;await active.getByRole('button',{name:'Retry picture',exact:true}).click();
 await expect(active.locator('.p-media-failure')).toHaveCount(0);
 await expect.poll(()=>active.locator('.p-short-picture').evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
 await page.keyboard.press('ArrowRight');
 await expect(page.locator('.slide.active .p-short-picture')).toBeVisible();
});
