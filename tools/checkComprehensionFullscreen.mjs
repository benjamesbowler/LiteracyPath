import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {COMPREHENSION_PASSAGES as passages} from '../src/content/comprehension/passages.js';
import {passagePicture} from '../src/content/comprehension/pictures.js';
import {STUDENT_DEVICE_PROFILES} from '../src/policy/studentDeviceMatrix.js';
const base=process.env.LP_COMPREHENSION_BASE||'http://127.0.0.1:4203';
const out='.artifacts/comprehension';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[],errors=[];
const only=process.env.LP_FULLSCREEN_LIMIT?Number(process.env.LP_FULLSCREEN_LIMIT):passages.length;
try{
 const context=await browser.newContext();
 // Freeze each tested document while other workers add public raster files.
 // Vite otherwise reloads the lesson mid-click on every new image.
 await context.route('**/@vite/client',async route=>{const response=await route.fetch();const body=(await response.text()).replace('case "full-reload":','case "full-reload": return;').replace('case "update":','case "update": return;');await route.fulfill({response,body});});
 await context.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('Fullscreen refused for fallback test'));});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 const teacher=`${base}/preview/teacher-a11y.html?surface=resources`;
 async function fit(label){
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(20);
  const defects=await page.locator('[data-fullscreen-lesson]').evaluate(root=>{
   const failures=[],visible=el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
   const bounds=root.getBoundingClientRect();
   for(const el of root.querySelectorAll('button,h1,h2,h3,p,label,fieldset,.rc-text-box,.rc-options,section')){
    if(!visible(el)||el.classList.contains('rc-text-measure'))continue;
    const r=el.getBoundingClientRect();
    if(r.left<bounds.left-1||r.top<bounds.top-1||r.right>bounds.right+1||r.bottom>bounds.bottom+1)failures.push({type:'viewport',element:el.tagName,text:el.textContent,rect:{x:r.x,y:r.y,w:r.width,h:r.height}});
    if(el.tagName==='BUTTON'&&(r.height<43.5||r.width<43.5))failures.push({type:'touch',text:el.textContent,width:r.width,height:r.height});
    if(el.matches('.rc-text-box')){
     const text=el.querySelector('[data-lesson-text]');
     if(text.getBoundingClientRect().bottom>r.bottom+1)failures.push({type:'text-clipped',text:text.textContent,height:r.height,textHeight:text.getBoundingClientRect().height});
    }
    if(el.matches('section,.rc-options,button')&&(el.scrollHeight>el.clientHeight+1||el.scrollWidth>el.clientWidth+1))failures.push({type:'content-overflow',class:el.className,scroll:[el.scrollWidth,el.scrollHeight],client:[el.clientWidth,el.clientHeight]});
   }
   if(document.documentElement.scrollHeight>innerHeight+1||document.documentElement.scrollWidth>innerWidth+1)failures.push({type:'body-scroll'});
   return failures;
  });
  if(defects.length)await page.screenshot({path:`${out}/fullscreen-fit-failure.png`});
  assert.deepEqual(defects,[],label);
 }
 async function allText(kind){
  const values=[];
  for(let i=0;i<60;i++){
   values.push((await page.locator(`[data-lesson-text="${kind}"]:visible`).innerText()).trim());
   const next=page.getByRole('button',{name:`Next ${kind} page`,exact:true,includeHidden:true});
   if(await next.isDisabled())return values.join(' ');
   await next.click();await fit(`${kind} page ${i+1}`);
  }
  assert.fail(`${kind}: pager did not end`);
 }
 for(const {width,height,id} of STUDENT_DEVICE_PROFILES.filter(profile=>!process.env.LP_FULLSCREEN_CHILD_ONLY&&!process.env.LP_FULLSCREEN_STATES_ONLY&&(!process.env.LP_FULLSCREEN_DEVICE||profile.id===process.env.LP_FULLSCREEN_DEVICE)&&(!process.env.LP_FULLSCREEN_DESKTOP_ONLY||profile.width>=960))){
  await page.setViewportSize({width,height});await page.goto(teacher);
  await page.getByRole('button',{name:'Open Reading Comprehension',exact:true}).click();
  if(await page.getByRole('button',{name:'← All passages',exact:true}).count())await page.getByRole('button',{name:'← All passages',exact:true}).click();
  for(const p of passages.slice(0,only)){
   await page.getByRole('button',{name:`Read ${p.title}`,exact:true}).click();
   await page.getByRole('button',{name:'Full screen',exact:true}).click();
   await page.locator('[data-fullscreen-lesson]').waitFor();
   const picture=page.locator('[data-fullscreen-lesson] .rc-lesson-picture img');
   assert.equal(await picture.getAttribute('src'),passagePicture(p).src,`${p.id}: exact story picture`);
   await picture.evaluate(image=>image.decode());
   await fit(`${id}:${p.id}:reading`);
   if(width>=960&&height>=650){
    assert.equal(await page.getByRole('button',{name:'Hear story with Leda',exact:true}).count(),1,'desktop story playback stays reachable');
    assert.equal(await page.getByRole('button',{name:'Hear question and choices',exact:true}).count(),1,'desktop question playback stays reachable without hidden view tabs');
    if(p===passages[0])for(const name of ['Hear story with Leda','Hear question and choices']){
     await page.getByRole('button',{name,exact:true}).click();
     await page.locator('.rc-lesson-status').filter({hasText:'Playing with Leda.'}).waitFor();
     await page.getByRole('button',{name:'Stop voice',exact:true}).click();
     assert.match(await page.locator('.rc-lesson-status').innerText(),/stopped/);
    }
   }
   assert.equal(await page.evaluate(()=>document.fullscreenElement),null,'fallback remains available after native refusal');
   assert.equal(await allText('story'),p.text,`${p.id}: complete text across reading pages`);
   if(width>=960&&height>=650){assert.equal(await page.getByRole('button',{name:'Next story page',exact:true,includeHidden:true}).isDisabled(),true,`${p.id}: desktop complete story`);}
   else{await page.getByRole('button',{name:'Pictures',exact:true}).click();await fit(`${id}:${p.id}:pictures`);await page.getByRole('button',{name:'Hide pictures',exact:true}).click();await fit(`${id}:${p.id}:hidden pictures`);await page.getByRole('button',{name:'Show pictures',exact:true}).click();}
   await page.getByRole('button',{name:'Words',exact:true}).click();await fit(`${id}:${p.id}:support`);
   const words=await allText('word help');for(const [word,meaning] of p.wordHelp)assert.ok(words.includes(`${word}: ${meaning}`));
   await page.getByRole('button',{name:'Words',exact:true}).click();
   if(width<960||height<650)await page.getByRole('button',{name:'Questions',exact:true}).click();
   for(let i=0;i<3;i++){
    await fit(`${id}:${p.id}:q${i+1}`);assert.equal(await page.locator('.rc-lesson-options button:visible').count(),4);
    assert.equal(await page.locator('.rc-lesson-options .rc-option-letter:visible').count(),4,'all four visible option letters match the spoken A–D choices');
    await page.locator('.rc-lesson-options button').first().click();
    await page.getByRole('button',{name:'Reveal answer',exact:true}).click();await fit(`${id}:${p.id}:q${i+1}:clue`);
    if(width<960||height<650){const clue=await allText('story clue');assert.ok(clue.includes(p.questions[i].answer));await page.getByRole('button',{name:'Back to choices',exact:true}).click();await fit(`${id}:${p.id}:revealed choices`);}
    else assert.equal(await page.locator('.rc-lesson-options button:visible').count(),4);
    if(i===0&&p===passages[0]){await page.getByRole('button',{name:'Hide answer',exact:true}).click();assert.equal(await page.locator('.rc-lesson-inline-feedback').count(),0);assert.equal(await page.locator('.rc-lesson-options [data-correct]').count(),0);await fit(`${id}:teacher hides answer`);}
    if(i<2)await page.getByRole('button',{name:'Next',exact:true}).click();
   }
   if(p===passages[0])await page.screenshot({path:`${out}/fullscreen-${width}x${height}.png`});
   await page.keyboard.press('Escape');await page.locator('[data-fullscreen-lesson]').waitFor({state:'detached'});
   assert.equal(await page.getByRole('button',{name:'Full screen',exact:true}).evaluate(el=>document.activeElement===el),true,'Escape restores entry focus');
   await page.getByRole('button',{name:'← All passages',exact:true}).click();
  }
  console.log(`Verified ${Math.min(only,passages.length)} passages at ${width}×${height}`);
  results.push({device:`${width}x${height}`,passages:Math.min(only,passages.length),questions:Math.min(only,passages.length)*3,readPages:true,supportPages:true,reveal:true,zeroScrollAndCompleteContent:true});
 }
 // Focused readers inherit the route's five regions. Audit their actual active
 // surface naming, sound-off task controls and exit instead of inventing a
 // second route-level marker/primary-action policy for the body portal.
 const longestBy=measure=>passages.reduce((longest,p)=>measure(p)>measure(longest)?p:longest);
 const childCases=[...new Map([
  longestBy(p=>p.text.length),
  longestBy(p=>Math.max(...p.questions.map(q=>q.prompt.length))),
  longestBy(p=>Math.max(...p.questions.flatMap(q=>q.options.map(o=>o.length))))
 ].map(p=>[p.id,p])).values()];
 async function activeChild(label,p){
  const dialog=page.getByRole('dialog',{name:`${p.title} · full-screen lesson`,exact:true});
  assert.equal(await dialog.getAttribute('aria-modal'),'true',`${label}: modal reader`);
  assert.equal(await dialog.locator('h1:visible').innerText(),p.title,`${label}: active visible title`);
  assert.equal(await dialog.getByRole('button',{name:`Exit full screen: ${p.title}`,exact:true}).count(),1,`${label}: exit names the active passage`);
  assert.ok(await page.locator('[data-fullscreen-lesson]').evaluate(el=>[...document.body.children].filter(sibling=>sibling!==el).every(sibling=>sibling.inert)),`${label}: hidden route cannot provide interactive controls`);
  await fit(label);
 }
 for(const {width,height} of STUDENT_DEVICE_PROFILES){
  const compact=width<960||height<650;
  await page.setViewportSize({width,height});await page.goto(`${base}/preview/child-surfaces.html?surface=reading-comprehension`);
  for(const p of childCases){
   if(await page.getByRole('button',{name:'← All passages',exact:true}).count())await page.getByRole('button',{name:'← All passages',exact:true}).click();
   await page.getByRole('button',{name:`Read ${p.title}`,exact:true}).click();await page.getByRole('button',{name:'Start again',exact:true}).click();await page.getByRole('button',{name:'Full screen',exact:true}).click();
   await activeChild(`child ${width}x${height}:${p.id}:read`,p);assert.equal(await allText('story'),p.text);
   if(compact){
    await page.getByRole('button',{name:'Pictures',exact:true}).click();await activeChild(`child ${width}x${height}:${p.id}:pictures`,p);
    assert.equal(await page.getByRole('button',{name:'Hide pictures',exact:true}).count(),1);
    await page.getByRole('button',{name:'Questions',exact:true}).click();
   }
   await activeChild(`child ${width}x${height}:${p.id}:questions`,p);
   assert.equal(await page.locator('.rc-lesson-question-title h2:visible').innerText(),p.questions[0].prompt);
   assert.equal(await page.locator('.rc-lesson-options button:visible').count(),4);
   for(let i=0;i<p.questions.length;i++){
    await page.locator('.rc-lesson-options').getByRole('button',{name:p.questions[i].answer,exact:true}).click();await page.getByRole('button',{name:'Check answer',exact:true}).click();
    await activeChild(`child ${width}x${height}:${p.id}:correct clue ${i+1}`,p);
    if(i<p.questions.length-1)await page.getByRole('button',{name:'Next',exact:true}).click();
   }
   await page.getByRole('button',{name:'Finish',exact:true}).click();await activeChild(`child ${width}x${height}:${p.id}:complete`,p);
   assert.equal(await allText('retell'),`Tell the story in your own words. ${p.draw}`);
   await page.getByRole('button',{name:`Exit full screen: ${p.title}`,exact:true}).click();
   assert.equal(await page.getByRole('button',{name:'Full screen',exact:true}).evaluate(el=>document.activeElement===el),true,'child exit restores entry focus');
  }
 }
 results.push({activeChildCases:childCases.map(p=>p.id),activeChildDevices:6,activeChildStates:['read','pictures','questions','correct clue','complete'],activeSurfaceExitNames:true});
 // Real student state survives lesson entry, view switches, exit and reload.
 await page.setViewportSize({width:320,height:568});await page.goto(`${base}/preview/child-surfaces.html?surface=reading-comprehension`);
 if(await page.getByRole('button',{name:'← All passages',exact:true}).count())await page.getByRole('button',{name:'← All passages',exact:true}).click();
 const p=passages[0],q=p.questions[0],wrong=q.options.find(o=>o!==q.answer);
 await page.getByRole('button',{name:`Read ${p.title}`,exact:true}).click();await page.getByRole('button',{name:'Start again',exact:true}).click();
 await page.locator('.rc-options').getByRole('button',{name:wrong,exact:true}).click();await page.getByRole('button',{name:'Full screen',exact:true}).click();
 await page.getByRole('button',{name:'Questions',exact:true}).click();assert.equal(await page.getByRole('button',{name:wrong,exact:true}).getAttribute('aria-pressed'),'true');
 await page.getByRole('button',{name:'Check answer',exact:true}).click();await fit('student wrong clue');assert.match(await allText('story clue'),/Try another answer/);
 await page.getByRole('button',{name:'Back to choices',exact:true}).click();await page.getByRole('button',{name:q.answer,exact:true}).click();await page.getByRole('button',{name:'Read',exact:true}).click();await page.getByRole('checkbox',{name:'Read 1',exact:true}).check();await page.getByRole('button',{name:'Questions',exact:true}).click();assert.equal(await page.getByRole('button',{name:q.answer,exact:true}).getAttribute('aria-pressed'),'true');
 await page.getByRole('button',{name:'Check answer',exact:true}).click();await fit('student correct clue');await page.getByRole('button',{name:/^Exit full screen:/}).click();
 assert.equal(await page.getByRole('checkbox',{name:'Read 1',exact:true}).isChecked(),true);assert.match(await page.locator('.rc-feedback').innerText(),/That fits/);
 await page.reload();assert.match(await page.locator('.rc-feedback').innerText(),/That fits/);
 for(let i=1;i<3;i++){await page.getByRole('button',{name:'Next question',exact:true}).click();await page.locator('.rc-options').getByRole('button',{name:p.questions[i].answer,exact:true}).click();await page.getByRole('button',{name:'Check answer',exact:true}).click();}
 await page.getByRole('button',{name:'Finish practice',exact:true}).click();await page.getByRole('button',{name:'Full screen',exact:true}).click();await page.getByRole('button',{name:'Questions',exact:true}).click();await fit('student complete');assert.equal(await allText('retell'),`Tell the story in your own words. ${p.draw}`);
 // Focus stays in lesson, with private notes and print controls unavailable.
 assert.equal(await page.getByRole('button',{name:/Teacher notes|Print|Preview page/}).count(),0);
 const accessibility=await new AxeBuilder({page}).include('[data-fullscreen-lesson]').analyze();assert.deepEqual(accessibility.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)})),[]);
 const focusable=page.locator('[data-fullscreen-lesson]').locator('button:visible:not(:disabled),input:visible:not(:disabled)');
 await focusable.last().focus();await page.keyboard.press('Tab');assert.equal(await focusable.first().evaluate(el=>document.activeElement===el),true);
 await page.keyboard.press('Shift+Tab');assert.equal(await focusable.last().evaluate(el=>document.activeElement===el),true);
 assert.ok(await page.locator('[data-fullscreen-lesson]').evaluate(el=>el.contains(document.activeElement)));
 await page.getByRole('button',{name:/^Exit full screen:/}).click();
 results.push({studentSelection:true,retry:true,reload:true,reread:true,complete:true,keyboardFocus:true,privateControlsAbsent:true});
 for(const {width,height} of STUDENT_DEVICE_PROFILES){
  await page.setViewportSize({width,height});await page.getByRole('button',{name:'Full screen',exact:true}).click();
  const compact=width<960||height<650;if(compact)await page.getByRole('button',{name:'Questions',exact:true}).click();
  await fit(`complete ${width}x${height}`);assert.equal(await allText('retell'),`Tell the story in your own words. ${p.draw}`);
  await page.getByRole('button',{name:/^Exit full screen:/}).click();
 }
 // A failed image has a reachable recovery action without blocking reading or Leda.
 await page.setViewportSize({width:568,height:320});await context.route('**/images/comprehension/passages/*.webp',route=>route.abort());
 await page.getByRole('button',{name:'Full screen',exact:true}).click();await page.getByRole('button',{name:'Pictures',exact:true}).click();
 await page.getByRole('button',{name:'Try picture again',exact:true}).waitFor();await fit('failed image');
 await page.getByRole('button',{name:'Try picture again',exact:true}).click();await page.getByRole('button',{name:'Try picture again',exact:true}).waitFor();
 await page.getByRole('button',{name:'Read',exact:true}).click();assert.equal(await allText('story'),p.text);
 await page.getByRole('button',{name:'Hear story with Leda',exact:true}).click();await page.locator('.rc-lesson-status').filter({hasText:'Playing with Leda.'}).waitFor();
 await page.getByRole('button',{name:'Stop voice',exact:true}).click();assert.match(await page.locator('.rc-lesson-status').innerText(),/stopped/);
 await page.getByRole('button',{name:'Hear story with Leda',exact:true}).click();await page.locator('.rc-lesson-status').filter({hasText:'Playing with Leda.'}).waitFor();
 await page.getByRole('button',{name:/^Exit full screen:/}).click();assert.match(await page.locator('.rc-speech-note').innerText(),/stopped/);
 results.push({completionDevices:6,failedImageRecovery:true,failedImageReading:true,ledaStarts:true,ledaStops:true,ledaExitStops:true});

 // Native API entry and browser-native exit are exercised without the refusal shim.
 const native=await browser.newPage({viewport:{width:1024,height:768}});native.on('pageerror',e=>errors.push(e.message));
 await native.goto(`${base}/preview/child-surfaces.html?surface=reading-comprehension`);await native.getByRole('button',{name:`Read ${p.title}`,exact:true}).click();await native.getByRole('button',{name:'Full screen',exact:true}).click();
 await native.waitForFunction(()=>document.fullscreenElement?.id==='rc-lesson-stage');
 assert.equal(await native.evaluate(()=>document.fullscreenElement?.id),'rc-lesson-stage','real native fullscreen entry');await native.evaluate(()=>document.exitFullscreen());await native.locator('[data-fullscreen-lesson]').waitFor({state:'detached'});assert.equal(await native.getByRole('button',{name:'Full screen',exact:true}).evaluate(el=>document.activeElement===el),true);
 results.push({nativeEntry:true,nativeExit:true,fallbackRefusal:true});
 assert.deepEqual(errors,[]);await fs.writeFile(`${out}/${process.env.LP_FULLSCREEN_CHILD_ONLY?'fullscreen-child-check.json':process.env.LP_FULLSCREEN_STATES_ONLY?'fullscreen-states-check.json':process.env.LP_FULLSCREEN_DESKTOP_ONLY?'fullscreen-desktop-check.json':process.env.LP_FULLSCREEN_DEVICE||process.env.LP_FULLSCREEN_LIMIT?'fullscreen-quick-check.json':'fullscreen-check.json'}`,JSON.stringify({results,pageErrors:errors},null,2));console.log(JSON.stringify({results,pageErrors:errors},null,2));
}finally{await browser.close();}
