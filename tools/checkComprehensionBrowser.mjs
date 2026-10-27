import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {COMPREHENSION_PASSAGES as passages} from '../src/content/comprehension/passages.js';
const base=process.env.LP_COMPREHENSION_BASE||'http://127.0.0.1:4203';
const out='.artifacts/comprehension';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});const results=[];
try{
 const context=await browser.newContext();const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const child=`${base}/preview/child-surfaces.html?surface=reading-comprehension`;
 async function visible(locator){await locator.waitFor({state:'visible'});}
 async function accessibility(){const result=await new AxeBuilder({page}).include('.rc-page').analyze();assert.deepEqual(result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)})),[]);}
 async function contract(){
  const root=page.locator('[data-child-surface="reading-comprehension"]');
  for(const attr of ['title','instruction','choices','progress','primary'])assert.equal(await root.locator(`[data-child-${attr}]`).count(),1,attr);
  assert.equal(await root.locator('h1').count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'body horizontal overflow');
  await root.locator('img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
  const missing=await root.locator('img').evaluateAll(images=>images.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src));assert.deepEqual(missing,[]);
 }
 for(const [width,height] of [[320,568],[568,320],[768,1024],[1024,768],[1366,768],[1920,1080]]){
  await page.setViewportSize({width,height});await page.goto(child);await visible(page.getByRole('button',{name:'Read Muddy and the Mat',exact:true}));await page.evaluate(()=>document.fonts.ready);await contract();
  assert.equal(await page.locator('.kg-stage').getAttribute('data-layout'),'catalogue');
  await page.getByRole('button',{name:'Read Muddy and the Rain Pail',exact:true}).click();await contract();
  const q=passages.find(p=>p.id==='muddy-rain').questions[0];
  assert.equal(await page.getByRole('button',{name:'Next question',exact:true}).isEnabled(),false);
  await page.getByRole('button',{name:q.answer,exact:true}).click();await page.getByRole('button',{name:'Check answer',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Next question',exact:true}).isEnabled(),true);await contract();
  await page.locator('.rc-page').evaluate(el=>{el.scrollTop=0;});
  await page.screenshot({path:`${out}/student-${width}x${height}.png`,fullPage:true});
  await page.getByRole('button',{name:'Start again',exact:true}).click();
  await page.getByRole('button',{name:'← All passages',exact:true}).click();
  results.push({device:`${width}x${height}`,catalogue:true,question:true});
 }
 // Every authored passage exercises the actual answer controls and completion.
 await page.setViewportSize({width:1024,height:768});await page.goto(child);
 for(const p of passages){
  await page.getByRole('button',{name:`Read ${p.title}`,exact:true}).click();
  await page.getByRole('button',{name:'Start again',exact:true}).click();
  if(p===passages[0]){
   const q=p.questions[0],wrong=q.options.find(o=>o!==q.answer);
   await page.getByRole('button',{name:wrong,exact:true}).click();await page.getByRole('button',{name:'Check answer',exact:true}).click();
   assert.match(await page.locator('.rc-feedback').innerText(),/Try another answer/);
   await page.reload();await visible(page.locator('.rc-passage'));assert.match(await page.locator('.rc-feedback').innerText(),/Try another answer/);
  }
  for(let i=0;i<3;i++){
   const q=p.questions[i];await page.getByRole('button',{name:q.answer,exact:true}).click();await page.getByRole('button',{name:'Check answer',exact:true}).click();
   assert.match(await page.locator('.rc-feedback').innerText(),/That fits the story/);
   assert.equal(await page.locator('.rc-passage').innerText().then(t=>t.trim()),p.text);
   if(i<2)await page.getByRole('button',{name:'Next question',exact:true}).click();
  }
  await page.getByRole('button',{name:'Finish practice',exact:true}).click();await visible(page.getByRole('heading',{name:'You finished this practice!',exact:true}));await contract();
  assert.equal(await page.getByRole('button',{name:/Teacher notes/}).count(),0);
  assert.equal(await page.getByRole('option',{name:'Teacher guide and answers',exact:true}).count(),0);
  await page.getByRole('button',{name:'← All passages',exact:true}).click();
 }
 results.push({passagesCompleted:24,questionsAnswered:72,wrongRetryAndReload:true,teacherControlsAbsent:true});
 await page.getByRole('button',{name:'Find a story',exact:true}).click();
 await page.getByRole('searchbox',{name:'Find a story',exact:true}).fill('not-a-story');await page.getByRole('button',{name:'Show all passages',exact:true}).click();assert.equal(await page.locator('.rc-card').count(),24);
 await page.getByRole('combobox',{name:'Phonics',exact:true}).selectOption('teams');assert.equal(await page.locator('.rc-card').count(),10);
 await page.getByRole('combobox',{name:'Focus',exact:true}).selectOption('ai');assert.equal(await page.locator('.rc-card').count(),1);
 await page.getByRole('button',{name:'Read Muddy and the Rain Pail',exact:true}).click();await page.getByRole('button',{name:'Preview page',exact:true}).click();
 await visible(page.getByRole('document',{name:/Reading Comprehension/}));
 const previewFont=await page.locator('.ws-paper-frame').evaluate(el=>getComputedStyle(el.shadowRoot.querySelector('.passage')).fontFamily);assert.match(previewFont,/Worksheet Andika/);
 // Pop-up failure must retain the worksheet and offer a retry.
 await page.evaluate(()=>{window.open=()=>null;});await page.getByRole('button',{name:'Print / Save as PDF',exact:true}).click();await page.getByRole('status').filter({hasText:'Allow pop-ups'}).waitFor();
 await accessibility();
 results.push({filters:true,shadowPreview:true,popupFailure:true,studentA11y:true});
 await page.goto(`${base}/preview/teacher-a11y.html?surface=resources`);
 await page.getByRole('button',{name:'Open Reading Comprehension',exact:true}).click();await visible(page.getByRole('heading',{name:'Reading Comprehension',exact:true}));
 await page.getByRole('button',{name:'Read Muddy and the Rain Pail',exact:true}).click();
 assert.equal(await page.locator('.rc-feedback').count(),0);
 await page.getByRole('button',{name:'Reveal answer and evidence',exact:true}).click();assert.match(await page.locator('.rc-feedback').innerText(),/For a small plant/);assert.ok(await page.locator('.rc-evidence').count()>0);
 await page.screenshot({path:`${out}/whole-group.png`,fullPage:true});
 await page.getByRole('button',{name:'Small group',exact:true}).click();assert.equal(await page.locator('.rc-private h2').count(),0);
 await page.getByRole('button',{name:'Teacher notes · show privately',exact:true}).click();await visible(page.getByRole('heading',{name:'Before',exact:true}));
 await page.screenshot({path:`${out}/small-group.png`,fullPage:true});
 await page.getByRole('button',{name:'Student practice',exact:true}).click();assert.equal(await page.locator('.rc-private').count(),0);
 await page.screenshot({path:`out/teacher-practice.png`.replace('out',out),fullPage:true});
 await page.getByRole('button',{name:'← All passages',exact:true}).click();
 await page.locator('.rc-batch-choice input').nth(0).check();await page.locator('.rc-batch-choice input').nth(1).check();await page.getByRole('combobox',{name:'Phonics',exact:true}).selectOption('teams');assert.match(await page.locator('.rc-batch h2').innerText(),/2 selected/);
 // Real print popup loads embedded assets; do not invoke the OS print dialog.
 await page.context().addInitScript(()=>{window.print=()=>{};});
 const popupWait=page.waitForEvent('popup');await page.getByRole('button',{name:'Print with drawing pages',exact:true}).click();const popup=await popupWait;await popup.waitForURL(/^blob:/);await popup.waitForLoadState('load');
 assert.equal(await popup.locator('section.page').count(),4);assert.ok((await popup.locator('img').first().getAttribute('src')).startsWith('data:image/'));await popup.close();
 await accessibility();
 results.push({teacherA11y:true,teachEntry:true,revealAndEvidence:true,privateSmallGroupNotes:true,batchFilterPersistence:true,embeddedPrintPopup:true});
 await page.goto(`${base}/preview/teacher-a11y.html?surface=worksheets`);await page.getByRole('button',{name:/Reading Comprehension · passages/}).click();await visible(page.getByRole('heading',{name:'Reading Comprehension',exact:true}));
 await page.goto(`${base}/preview/child-surfaces.html?surface=reading-library`);await page.getByRole('button',{name:'Reading Comprehension',exact:true}).click();await visible(page.locator('[data-child-surface="reading-comprehension"]'));
 results.push({worksheetEntry:true,booksEntry:true});
 assert.deepEqual(errors,[]);
 await fs.writeFile(`${out}/browser-check.json`,JSON.stringify({results,pageErrors:errors},null,2));console.log(JSON.stringify({results,pageErrors:errors},null,2));
}finally{await browser.close();}
