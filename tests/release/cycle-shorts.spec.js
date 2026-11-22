import {test,expect} from '@playwright/test';
import {CYCLE_SHORTS} from '../../src/content/cycle-shorts/passages.js';
import {resolveComprehensionPassageAudio} from '../../src/content/comprehension/audio.js';
import {buildCyclePresentation} from '../../src/utils/present/presentationBuilder.js';
const out='.artifacts/cycle-shorts';

async function openLibrary(page){
 await page.goto('/preview/child-surfaces.html?surface=reading-library');
 const shorts=page.getByRole('button',{name:'Cycle Shorts',exact:true});
 if(!await shorts.isVisible()){
  await page.getByRole('button',{name:'Find a book',exact:true}).click();
  await page.getByRole('button',{name:'More reading',exact:true}).click();
 }
 await shorts.click();
 await expect(page.getByRole('heading',{name:'Cycle Shorts',exact:true})).toBeVisible();
}

async function openShort(page,p){
 const cards=page.getByRole('group',{name:'Choose a Cycle Short'}).getByRole('button');
 const pager=page.getByRole('navigation',{name:'Cycle Shorts pages'});
 const read=cards.filter({hasText:p.title});
 for(let index=0;index<CYCLE_SHORTS.length&&!await read.count();index++){
  const number=Number((await cards.first().getAttribute('aria-label')).match(/^Read Cycle (\d+)/)[1]);
  const step=pager.getByRole('button',{name:p.cycleNumber<number?'Previous':'Next',exact:true});
  await expect(step).toBeInViewport({ratio:.99});
  await step.click();
 }
 await expect(read).toBeInViewport({ratio:.99});
 await read.click();
 const stage=page.locator('#rc-lesson-stage');
 await expect(stage.getByRole('heading',{name:p.title,exact:true})).toBeVisible();
 return stage;
}

async function expectLessonFits(stage){
 const clipped=await stage.evaluate(el=>{
  const frame=el.getBoundingClientRect();
  return [...el.querySelectorAll('button,h1,h2,p[data-lesson-text],.rc-lesson-picture img')].filter(node=>{
   const rect=node.getBoundingClientRect();
   if(!rect.height||!rect.width||getComputedStyle(node).visibility==='hidden')return false;
   return rect.top<frame.top-1||rect.bottom>frame.bottom+1||rect.left<frame.left-1||rect.right>frame.right+1;
  }).map(node=>node.getAttribute('aria-label')||node.textContent);
 });
 expect(clipped).toEqual([]);
 expect(await stage.evaluate(node=>[node.scrollTop,node.scrollHeight-node.clientHeight])).toEqual([0,0]);
}

test('children can find every cycle, read all questions, retry and return to Books',async({page})=>{
 test.setTimeout(180000);
 await openLibrary(page);
 await expect(page.getByText('27 cycle stories',{exact:true})).toBeVisible();
 for(const p of CYCLE_SHORTS){
  const stage=await openShort(page,p);
  const button=name=>stage.getByRole('button',{name,exact:true});
  const story=stage.locator('[data-lesson-text=story]');
  await expect(story).toContainText(p.text);
  await expect(story.locator('strong').first()).toBeVisible();
  const group=stage.getByRole('group',{name:'Answer choices'});
  const wrong=p.questions[0].options.find(option=>option!==p.questions[0].answer);
  await group.getByRole('button',{name:wrong,exact:true}).click();
  await button('Check answer').click();
  await expect(stage.getByText(/Try another answer/).filter({visible:true})).toBeVisible();
  if(await button('Back to choices').isVisible())await button('Back to choices').click();
  for(let i=0;i<3;i++){
   const q=p.questions[i];
   await expect(group.getByRole('button')).toHaveCount(4);
   await group.getByRole('button',{name:q.answer,exact:true}).click();await button('Check answer').click();
   await expect(stage.locator('.rc-lesson-inline-feedback,.rc-lesson-clue').filter({visible:true})).toContainText(q.evidence.join(' '));
   await button(i<2?'Next':'Finish').click();
  }
  await expect(stage.getByRole('heading',{name:'You finished this practice!',exact:true})).toBeVisible();
  await expectLessonFits(stage);
  await button('All Cycle Shorts').click();
 }
 await page.getByRole('button',{name:'← Back to Guided Reading',exact:true}).click();await expect(page.getByRole('heading',{name:'Books',exact:true})).toBeVisible();
});

for(const [width,height] of [[320,568],[568,320],[768,1024],[1024,768],[1920,1080]])test(`Cycle Shorts reading and projector fit at ${width}x${height}`,async({page})=>{
 test.setTimeout(180000);await page.setViewportSize({width,height});
 await openLibrary(page);
 let stage=await openShort(page,CYCLE_SHORTS[22]);
 await page.evaluate(()=>document.fonts.ready);
 await expectLessonFits(stage);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:`${out}/reader-${width}x${height}.png`});
 await stage.getByRole('button',{name:'All Cycle Shorts',exact:true}).click();
 stage=await openShort(page,CYCLE_SHORTS[0]);
 const pictureTab=stage.getByRole('button',{name:'Pictures',exact:true});if(await pictureTab.isVisible())await pictureTab.click();
 expect(await stage.getByRole('region',{name:'Story pictures'}).evaluate(el=>{const panel=el.getBoundingClientRect(),image=el.querySelector('img').getBoundingClientRect();return image.top>=panel.top&&image.bottom<=panel.bottom;})).toBe(true);
 await expectLessonFits(stage);
 const questions=stage.getByRole('button',{name:'Questions',exact:true});if(await questions.isVisible())await questions.click();
 await expectLessonFits(stage);
 await stage.getByRole('button',{name:'All Cycle Shorts',exact:true}).click();
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

test('revised Cycle Shorts narration starts and stops in the real reader',async({page})=>{
 const passage=CYCLE_SHORTS[4];
 const audio=resolveComprehensionPassageAudio(passage);
 expect(audio.status).toBe('ready');
 await openLibrary(page);
 const stage=await openShort(page,passage);
 const delivery=page.waitForResponse(r=>new URL(r.url()).pathname===audio.path&&[200,206].includes(r.status()));
 await stage.getByRole('button',{name:'Hear story with Leda',exact:true}).click();await delivery;
 await expect(stage.locator('.rc-lesson-status')).toHaveText('Playing with Leda.');
 await stage.getByRole('button',{name:'Stop voice',exact:true}).click();
 expect(await page.evaluate(()=>[...document.querySelectorAll('audio')].every(a=>a.paused))).toBe(true);
});

test('Cycle Shorts lesson word help matches the bold learning words',async({page})=>{
 await openLibrary(page);
 const stage=await openShort(page,CYCLE_SHORTS[0]);
 await stage.getByRole('button',{name:'Words',exact:true}).click();
 await expect(stage.locator('.rc-lesson-support')).toContainText('Learning words: I, am, ant, mat.');
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
