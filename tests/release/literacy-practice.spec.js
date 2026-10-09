import { expect, test } from '@playwright/test';
import { literacyQuestionDemand } from '../../src/utils/literacyPracticePlanner.js';
const url='/tests/fixtures/literacy-practice.html';
test.describe.configure({timeout:90000});
async function audio(page, duration=25) {
  await page.addInitScript(({duration})=>{
    window.__played=[];
    window.Audio=class extends EventTarget {
      constructor(){super();this.src='';this.currentTime=0;this.volume=1;this.readyState=4;this.duration=duration/1000;this.paused=true;}
      load(){this.dispatchEvent(new Event('canplay'));}
      play(){window.__played.push(this.src);this.paused=false;this.timer=setTimeout(()=>{this.paused=true;this.dispatchEvent(new Event('ended'));},duration);return Promise.resolve();}
      pause(){clearTimeout(this.timer);this.paused=true;}
    };
  },{duration});
}
async function saved(page){return page.evaluate(()=>window.__literacy.session());}
async function focus(page,id){await page.getByText('Choose a particular skill',{exact:true}).click();await page.getByRole('combobox',{name:'Practice skill',exact:true}).selectOption(id);await page.locator('[data-child-primary-action]').click();}
async function ready(page){await expect(page.locator('[data-skills-practice-ready="true"]')).toBeVisible();}
async function answer(page,correct=true){
  const q=(await saved(page)).responseEpisode.question, expected=q.correctAnswers||[q.answer??q.correctAnswer];
  const choices=page.locator('.assessment-answer-card, .ixl-answer-button, .initial-sound-image-button');
  const values=await choices.evaluateAll(nodes=>nodes.map(node=>node.textContent.trim()||node.getAttribute('aria-label')?.replace(/^Choose /,'')));
  const picks=correct?values.map((value,i)=>expected.map(String).includes(value)?i:-1).filter(i=>i>=0):[values.findIndex(value=>!expected.map(String).includes(value))];
  expect(picks[0]).toBeGreaterThanOrEqual(0);
  while(picks.length<expected.length) picks.push(values.findIndex((_,i)=>!picks.includes(i)));
  for(const at of picks.slice(0,expected.length)) await choices.nth(at).click();
}

test('home exposes the eight areas and empty teacher coverage without a fabricated score',async({page})=>{
  await page.goto(url);await expect(page.getByRole('heading',{name:'A little practice. A world to discover.'})).toBeVisible();
  await expect(page.locator('.literacy-practice-domains > button')).toHaveCount(8);
  await expect(page.locator('.literacy-practice-footnote')).not.toContainText('Show me');
  await page.getByRole('button',{name:'Teacher report',exact:true}).click();
  await expect(page.locator('.literacy-practice-report')).toBeVisible();
  await expect(page.locator('.literacy-practice-report')).not.toContainText(/RIT [0-9]|MAP score: [0-9]|[0-9]+(?:st|nd|rd|th) percentile/);
});

test('a listening first answer waits for the entire cue sequence, including after manual replay',async({page})=>{
  await audio(page,350);await page.goto(url);await focus(page,'listen_main_idea');
  await expect(page.locator('.assessment-answer-card').first()).toBeVisible();
  await page.locator('.assessment-answer-card').first().click();
  expect((await saved(page)).answers).toHaveLength(0);
  await page.getByRole('button',{name:'Listen to question',exact:true}).click();
  await ready(page);
  const q=(await saved(page)).responseEpisode.question;
  expect(await page.evaluate(path=>window.__played.filter(value=>value.includes(path)).length,q.passageAudioPath)).toBeGreaterThanOrEqual(1);
  await expect(page.getByRole('button',{name:'Listen to passage',exact:true})).toBeVisible();
  await expect(page.locator('.comprehension-passage-card')).toContainText(q.passage);
  const printedChoicePaths=q.choices.map(text=>q.audioRequirements?.find(cue=>cue.text===text)?.path).filter(Boolean);
  expect(await page.evaluate(paths=>window.__played.some(value=>paths.some(path=>value.includes(path))),printedChoicePaths)).toBe(false);
  await answer(page);
  await expect.poll(async()=>page.evaluate(()=>window.__literacy.record().completions.filter(e=>e.contentVersion==='literacy-practice-v1').length)).toBe(1);
});

test('an incorrect answer gives a brief receipt then a new first probe, with no teaching or retry after reload',async({page})=>{
  await audio(page);await page.goto(url);await focus(page,'letter_knowledge');await ready(page);
  const first=(await saved(page)).responseEpisode.question;
  await expect(page.getByRole('button',{name:'Show me',exact:true})).toHaveCount(0);
  await answer(page,false);
  await expect(page.getByRole('heading',{name:'Incorrect',exact:true})).toBeVisible();
  await expect(page.locator('[data-guided-model]')).toHaveCount(0);
  await page.getByRole('button',{name:'Take a break',exact:true}).click();await page.reload();await page.getByRole('button',{name:'Carry on',exact:true}).click();
  await expect.poll(async()=> (await saved(page)).index).toBe(1);await ready(page);
  const next=(await saved(page)).responseEpisode;
  expect(next.role).toBe('first_probe');expect(next.question.id).not.toBe(first.id);expect(next.question.level).toBe(1);
  const rows=await page.evaluate(()=>window.__literacy.record().completions.filter(e=>e.contentVersion==='literacy-practice-v1').flatMap(e=>e.steps));
  expect(rows.find(r=>r.questionId===first.id).isCorrect).toBe(false);
  expect(rows.some(r=>r.presentationRole==='transfer')).toBe(false);
});

test('forty deliberately wrong mixed answers stay simple and complete without a teaching detour',async({page},info)=>{
  test.setTimeout(180000);
  await audio(page);await page.goto(url);await page.locator('[data-child-primary-action]').click();
  const offered=[];
  for(let i=0;i<40;i++) {
    await expect.poll(async()=> (await saved(page))?.index).toBe(i);await ready(page);
    const q=(await saved(page)).responseEpisode.question;offered.push(q);
    expect(literacyQuestionDemand(q)).toBe(0);expect(q.passage).toBeFalsy();
    await answer(page,false);await expect(page.getByRole('heading',{name:'Incorrect',exact:true})).toBeVisible();
    await expect(page.locator('[data-guided-model]')).toHaveCount(0);
    if(i===4) await page.screenshot({path:info.outputPath('incorrect-simple-question-five.png')});
  }
  await expect(page.getByText('Your adventure is finished. You can explore again whenever you like.')).toBeVisible();
  expect(new Set(offered.map(q=>q.id)).size).toBe(40);
  const rows=await page.evaluate(()=>window.__literacy.record().completions.filter(e=>e.contentVersion==='literacy-practice-v1').flatMap(e=>e.steps));
  expect(rows.filter(r=>r.responseStatus==='answered')).toHaveLength(40);
  expect(rows.filter(r=>r.responseStatus==='answered').every(r=>r.isCorrect===false&&r.presentationRole==='first_probe')).toBe(true);
});

test('a forty-question mixed sitting advances with correct responses and resumes halfway without losing answers',async({page})=>{
  test.setTimeout(180000);
  await audio(page); await page.goto(url);
  await expect(page.locator('[data-child-progress]')).toContainText('40 questions');
  await page.locator('[data-child-primary-action]').click();
  const offered=[];
  for(let i=0;i<40;i++) {
    await expect.poll(async()=> (await saved(page))?.index).toBe(i); await ready(page);
    const before=await saved(page), q=before.responseEpisode.question;
    expect(before.questionIds).toHaveLength(40); offered.push(q);
    if(i===20) {
      await page.getByRole('button',{name:'Take a break',exact:true}).click();
      await page.reload(); await page.getByRole('button',{name:'Carry on',exact:true}).click(); await ready(page);
      expect((await saved(page)).questionIds).toEqual(before.questionIds);
      expect((await saved(page)).answers).toEqual(before.answers);
    }
    await answer(page,true); await expect(page.getByRole('heading',{name:'Correct',exact:true})).toBeVisible();
  }
  await expect(page.getByText('Your adventure is finished. You can explore again whenever you like.')).toBeVisible();
  expect(new Set(offered.map(q=>q.id)).size).toBe(40);
  expect(offered.slice(0,8).map(literacyQuestionDemand)).toEqual([0,0,1,1,2,2,3,3]);
  expect(offered.slice(8).every(q=>literacyQuestionDemand(q)===4)).toBe(true);
  const rows=await page.evaluate(()=>window.__literacy.record().completions.filter(e=>e.contentVersion==='literacy-practice-v1').flatMap(e=>e.steps));
  expect(rows.filter(r=>r.responseStatus==='answered')).toHaveLength(40);
  expect(rows.filter(r=>r.responseStatus==='answered').every(r=>r.isCorrect===true&&r.presentationRole==='first_probe')).toBe(true);
});

test('independent reading keeps its passage visible and silent while instructions remain available',async({page})=>{
  await audio(page);await page.goto(url);await focus(page,'main_idea');await ready(page);
  const q=(await saved(page)).responseEpisode.question;
  expect(q.literacyModality).toBe('reading');
  await expect(page.locator('.comprehension-passage-card')).toContainText(q.passage);
  await expect(page.getByRole('button',{name:'Listen to passage',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Hear the story',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Listen to question',exact:true}).click();await ready(page);
  const passagePath=await page.evaluate(async passage=>{const audio=await import('/src/data/ledaProductionAudio.js');return audio.getLedaInstructionAudioPath(passage);},q.passage);
  if(passagePath) expect(await page.evaluate(path=>window.__played.some(value=>value.includes(path)),passagePath)).toBe(false);
  await answer(page);
  const rows=await page.evaluate(()=>window.__literacy.record().completions.filter(e=>e.contentVersion==='literacy-practice-v1').flatMap(e=>e.steps));
  expect(rows.find(row=>row.presentationRole==='first_probe').evidenceType).toBe('independent');
});

test('optional passage narration is saved as reading support, including after break and reload',async({page})=>{
  await audio(page);await page.goto(url);await focus(page,'main_idea');await ready(page);
  await page.getByRole('button',{name:'Listen to passage',exact:true}).click();
  await expect.poll(async()=>Boolean((await saved(page)).responseEpisode.passageAudioUsed)).toBe(true);
  await page.getByRole('button',{name:'Take a break',exact:true}).click();await page.reload();
  await page.getByRole('button',{name:'Carry on',exact:true}).click();await ready(page);await answer(page);
  await expect.poll(async()=>page.evaluate(()=>window.__literacy.record().completions.flatMap(e=>e.contentVersion==='literacy-practice-v1'?e.steps:[]).filter(step=>step.responseStatus==='answered').length)).toBe(1);
  const first=await page.evaluate(()=>window.__literacy.record().completions.flatMap(e=>e.steps).find(step=>step.responseStatus==='answered'));
  expect(first.evidenceType).toBe('supported');expect(first.itemSnapshot.passageAudioUsed).toBe(true);
});

test('mixed practice starts with a picture and accepts a first tap after required sound, without cycling text options',async({page})=>{
  await audio(page,1000);await page.goto(url);await page.getByRole('button',{name:'Start a mixed adventure',exact:true}).click();
  await expect(page.getByText('Listen first. Then choose an answer.',{exact:true})).toBeVisible();
  await ready(page);const q=(await saved(page)).responseEpisode.question;
  expect(q.skillId).toBe('initial_sounds');expect(q.level).toBe(1);expect(q.formatType).toBe('FIRST_SOUND');
  await expect(page.locator('.assessment-main-image')).toBeVisible();
  await expect(page.getByText('Choose an answer.',{exact:true})).toBeVisible();await answer(page);
  await expect.poll(async()=> (await saved(page)).index).toBe(1);
  expect(literacyQuestionDemand((await saved(page)).responseEpisode.question)).toBe(0);
  await ready(page);await answer(page);await expect.poll(async()=> (await saved(page)).index).toBe(2);
  expect(literacyQuestionDemand((await saved(page)).responseEpisode.question)).toBe(1);
  expect((await saved(page)).adaptiveDemand.tier).toBe(1);
  await ready(page);await answer(page,false);await expect.poll(async()=> (await saved(page)).index).toBe(3);
  expect(literacyQuestionDemand((await saved(page)).responseEpisode.question)).toBe(0);
  expect((await saved(page)).answers).toEqual([true,true,false]);
});

for(const viewport of [{width:768,height:1024},{width:1024,height:768},{width:390,height:844},{width:844,height:390}])test(`passage, audio and answer controls remain usable at ${viewport.width}x${viewport.height}`,async({page},info)=>{
  await page.setViewportSize(viewport);await audio(page);await page.goto(url);await focus(page,'listen_main_idea');await ready(page);
  await expect(page.locator('.comprehension-passage-card .passage')).toBeVisible();
  await expect(page.getByRole('button',{name:'Listen to passage',exact:true})).toBeVisible();
  const boxes=await page.locator('.comprehension-choice-list .assessment-answer-card').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return {x:r.x,right:r.right,y:r.y,bottom:r.bottom,height:r.height};}));
  for(const box of boxes){expect(box.x).toBeGreaterThanOrEqual(0);expect(box.right).toBeLessThanOrEqual(viewport.width+1);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.bottom).toBeLessThanOrEqual(viewport.height+1);expect(box.height).toBeGreaterThanOrEqual(44);}
  const textFit=await page.locator('.comprehension-choice-list .assessment-answer-card').evaluateAll(nodes=>nodes.map(node=>({label:node.textContent,overflow:node.scrollWidth-node.clientWidth,spanOverflow:node.querySelector('span').scrollWidth-node.querySelector('span').clientWidth})));
  for(const fit of textFit){expect(fit.overflow,fit.label).toBeLessThanOrEqual(1);expect(fit.spanOverflow,fit.label).toBeLessThanOrEqual(1);}
  const headerOverlapsPrompt=await page.locator('.assessment-shell').evaluate(node=>{const a=node.querySelector('.assessment-topbar').getBoundingClientRect(),b=node.querySelector('.assessment-prompt').getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;});
  expect(headerOverlapsPrompt).toBe(false);
  await page.screenshot({path:info.outputPath('literacy-passage.png')});await answer(page);
  await expect.poll(async()=> (await saved(page)).index).toBe(1);
});

test('letter replay uses the authored letter name rather than the same-spelled word',async({page})=>{
  await audio(page);await page.goto(url);await focus(page,'letter_knowledge');await ready(page);
  const q=(await saved(page)).responseEpisode.question;
  const target=q.audioRequirements.find(cue=>cue.role==='target_word');
  expect(target.path).toContain('/letter_name/');
  const before=await page.evaluate(()=>window.__played.length);
  await page.getByRole('button',{name:'Hear the letter name',exact:true}).click();
  await expect.poll(async()=>page.evaluate(()=>window.__played.length)).toBeGreaterThan(before);
  expect((await page.evaluate(()=>window.__played)).at(-1)).toContain(target.path);
});

test('a complete six-turn practice crosses text-only transitions and retains all first responses',async({page})=>{
  await audio(page);await page.goto(url);await focus(page,'letter_knowledge');
  for(let i=0;i<6;i++){
    await ready(page);await expect.poll(async()=> (await saved(page)).index).toBe(i);await answer(page);
    if(i<5) await expect.poll(async()=> (await saved(page))?.index).toBe(i+1);
  }
  await expect(page.getByText('Your adventure is finished. You can explore again whenever you like.')).toBeVisible();
  const rows=await page.evaluate(()=>window.__literacy.record().completions.filter(e=>e.contentVersion==='literacy-practice-v1').flatMap(e=>e.steps));
  expect(rows.filter(r=>r.presentationRole==='first_probe'&&r.responseStatus==='answered')).toHaveLength(6);
});

for(const viewport of [{width:390,height:844},{width:844,height:390},{width:1024,height:768}])test(`home and practice fit ${viewport.width}x${viewport.height}`,async({page},info)=>{
  await page.setViewportSize(viewport);await audio(page);await page.goto(url);
  await expect(page.locator('[data-child-primary-action]')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath('literacy-home.png'),fullPage:true});
  await focus(page,'letter_knowledge');await ready(page);
  const geometry=await page.locator('.assessment-answer-card, .ixl-answer-button').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left,right:r.right,bottom:r.bottom};}));
  expect(geometry.length).toBeGreaterThan(1);for(const r of geometry){expect(r.width).toBeGreaterThanOrEqual(56);expect(r.height).toBeGreaterThanOrEqual(56);expect(r.left).toBeGreaterThanOrEqual(0);expect(r.right).toBeLessThanOrEqual(viewport.width+1);expect(r.bottom).toBeLessThanOrEqual(viewport.height+1);}
  await page.screenshot({path:info.outputPath('literacy-question.png'),fullPage:true});
});

test('spoken sound choices follow the numbered visual order without revealing printed answers',async({page})=>{
  await audio(page,40);await page.goto(url);await focus(page,'sound_manipulation');await ready(page);
  const q=(await saved(page)).responseEpisode.question;
  expect(q.hideWrittenLabels).toBe(true);
  const labels=await page.locator('.assessment-answer-card').allTextContents();
  expect(labels.map(x=>x.trim())).toEqual(q.choices.map((_,i)=>`Choose ${i+1}`));
  const played=await page.evaluate(()=>window.__played);
  const expected=q.choices.map(value=>q.audioRequirements.find(cue=>cue.role==='choice'&&cue.value===value).path);
  const order=expected.map(path=>played.findIndex(actual=>actual.includes(path)));
  expect(order.every(i=>i>=0)).toBe(true);expect([...order].sort((a,b)=>a-b)).toEqual(order);
});

test('failed required audio is replaced and never counted as a wrong first answer',async({page})=>{
  await audio(page,20);
  await page.addInitScript(()=>{const original=window.Audio.prototype.play;let calls=0;window.Audio.prototype.play=function(){if(++calls===2){setTimeout(()=>this.dispatchEvent(new Event('error')),5);return Promise.resolve();}return original.call(this);};});
  await page.goto(url);await focus(page,'letter_knowledge');await ready(page);
  const rows=await page.evaluate(()=>window.__literacy.record().completions.filter(e=>e.contentVersion==='literacy-practice-v1').flatMap(e=>e.steps));
  expect(rows.some(row=>row.responseStatus==='media_failed')).toBe(true);
  expect(rows.every(row=>row.isCorrect!==false)).toBe(true);
  const session=await saved(page);expect(session.failedQuestionIds.length).toBeGreaterThan(0);
  expect(session.failedQuestionIds).not.toContain(session.responseEpisode.question.id);
});
