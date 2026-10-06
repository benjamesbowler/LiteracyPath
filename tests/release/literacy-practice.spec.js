import { expect, test } from '@playwright/test';
import { learningStimulusSignature } from '../../src/utils/learningResponseState.js';
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
async function answer(page,correct=true){const q=(await saved(page)).responseEpisode.question;const key=q.answer??q.correctAnswer;const choices=page.locator('.assessment-answer-card, .ixl-answer-button');const labels=await choices.allTextContents();const at=labels.findIndex(label=>(label.trim()===String(key))===correct);expect(at).toBeGreaterThanOrEqual(0);await choices.nth(at).click();}

test('home exposes the eight areas and empty teacher coverage without a fabricated score',async({page})=>{
  await page.goto(url);await expect(page.getByRole('heading',{name:'A little practice. A world to discover.'})).toBeVisible();
  await expect(page.locator('.literacy-practice-domains > button')).toHaveCount(8);
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
  await expect(page.getByRole('button',{name:'Hear the story',exact:true})).toBeVisible();
  await answer(page);
  await expect.poll(async()=>page.evaluate(()=>window.__literacy.record().completions.filter(e=>e.contentVersion==='literacy-practice-v1').length)).toBe(1);
});

test('incorrect first response teaches then offers a distinct transfer and preserves it on reload',async({page})=>{
  await audio(page);await page.goto(url);await focus(page,'letter_knowledge');await ready(page);
  const first=(await saved(page)).responseEpisode.question;
  await answer(page,false);
  const model=page.locator('[data-guided-model]:enabled');await expect(model.first()).toBeVisible();await model.first().click();
  await ready(page);const transfer=(await saved(page)).responseEpisode;
  expect(transfer.role).toBe('transfer');expect(learningStimulusSignature(transfer.question)).not.toBe(learningStimulusSignature(first));
  const choices=transfer.question.choices;
  await page.getByRole('button',{name:'Take a break',exact:true}).click();await page.reload();await page.getByRole('button',{name:'Carry on',exact:true}).click();await ready(page);
  expect((await saved(page)).responseEpisode.question.choices).toEqual(choices);
  await answer(page);
  const rows=await page.evaluate(()=>window.__literacy.record().completions.filter(e=>e.contentVersion==='literacy-practice-v1').flatMap(e=>e.steps));
  expect(rows.find(r=>r.presentationRole==='first_probe').isCorrect).toBe(false);
  expect(rows.find(r=>r.presentationRole==='transfer').evidenceType).toBe('supported');
});

test('independent reading keeps its passage visible and silent while instructions remain available',async({page})=>{
  await audio(page);await page.goto(url);await focus(page,'main_idea');await ready(page);
  const q=(await saved(page)).responseEpisode.question;
  expect(q.literacyModality).toBe('reading');
  await expect(page.locator('.comprehension-passage-card')).toContainText(q.passage);
  await expect(page.getByRole('button',{name:'Listen to passage',exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Hear the story',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Listen to question',exact:true}).click();await ready(page);
  const passagePath=await page.evaluate(async passage=>{const audio=await import('/src/data/ledaProductionAudio.js');return audio.getLedaInstructionAudioPath(passage);},q.passage);
  if(passagePath) expect(await page.evaluate(path=>window.__played.some(value=>value.includes(path)),passagePath)).toBe(false);
  await answer(page);
  const rows=await page.evaluate(()=>window.__literacy.record().completions.filter(e=>e.contentVersion==='literacy-practice-v1').flatMap(e=>e.steps));
  expect(rows.find(row=>row.presentationRole==='first_probe').evidenceType).toBe('independent');
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
