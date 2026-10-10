import { expect, test } from '@playwright/test';
import { learningResponseEpisodes } from '../../src/utils/learningResponseState.js';
import { getLedaProductionAudioPath } from '../../src/data/ledaProductionAudio.js';

test.describe.configure({timeout:90000});
const url='/tests/fixtures/literacy-practice.html';
const session=page=>page.evaluate(()=>window.__literacy.session());
const ready=(page,timeout=10000)=>expect(page.locator('[data-skills-practice-ready="true"]')).toBeVisible({timeout});
async function openReference(page,id) {
  await page.goto(url);await page.locator('[data-child-primary-action]').click();await ready(page);
  await page.getByRole('button',{name:'Take a break',exact:true}).click();
  const question=await page.evaluate(id=>window.__literacy.seedReference(id),id);
  await page.reload();await page.getByRole('button',{name:'Carry on',exact:true}).click();
  return question;
}
async function nativeAudio(page) {
  await page.addInitScript(()=>{
    window.__nativeDelivery=[];
    const play=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(...args){
      this.addEventListener('ended',()=>window.__nativeDelivery.push({src:this.currentSrc||this.src,duration:this.duration}),{once:true});
      return play.apply(this,args);
    };
  });
}
async function fastAudio(page) {
  await page.addInitScript(()=>{
    window.Audio=class extends EventTarget {
      constructor(){super();this.src='';this.currentTime=0;this.readyState=4;this.paused=true;this.duration=.025;}
      load(){this.dispatchEvent(new Event('canplay'));}
      play(){this.paused=false;this.timer=setTimeout(()=>{this.paused=true;this.dispatchEvent(new Event('ended'));},25);return Promise.resolve();}
      pause(){clearTimeout(this.timer);this.paused=true;}
    };
  });
}
test('native Leda instruction and target finish before a source spelling is scored and retained',async({page},info)=>{
  await nativeAudio(page);const question=await openReference(page,'spell-friends');await ready(page);
  const delivered=await page.evaluate(()=>window.__nativeDelivery);
  for(const cue of question.audioRequirements) expect(delivered.some(row=>row.src.includes(cue.path)&&row.duration>0)).toBe(true);
  await expect(page.getByText('friends',{exact:true})).toHaveCount(0);
  const letters=page.getByRole('group',{name:'Tiles to move',exact:true});
  for(const [i,letter] of [...'friends'].entries()){
    await letters.getByRole('button',{name:'Pick '+letter,exact:true}).click();
    await page.getByRole('button',{name:'Place in space '+(i+1),exact:true}).click();
  }
  await page.getByRole('button',{name:'Check answer',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Correct',exact:true})).toBeVisible();
  await expect.poll(async()=>(await session(page)).answers.length).toBe(1);
  const before=await session(page);expect(before.responseEpisode.firstResponse.isCorrect).toBe(true);
  await page.screenshot({path:info.outputPath('source-spelling-correct.png')});
  await page.getByRole('button',{name:'Take a break',exact:true}).click();await page.reload();
  const saved=await session(page);expect(saved.answers).toEqual(before.answers);expect(saved.questionIds).toHaveLength(40);
});
test('native Leda picture sequencing saves the whole incorrect order, steps down and advances without teaching',async({page})=>{
  await nativeAudio(page);
  await page.goto(url);await page.locator('[data-child-primary-action]').click();await ready(page);
  await page.getByRole('button',{name:'Take a break',exact:true}).click();
  const q=await page.evaluate(async()=>{
    const bank=await window.__literacy.bank();
    const q=bank.find(q=>q.sourceProvenance?.sourceId==='pictures.kite-1-listen');
    await window.__literacy.seedQuestion(q.id);
    return q;
  });
  await page.reload();await page.getByRole('button',{name:'Carry on',exact:true}).click();await ready(page,60000);
  const live=(await session(page)).responseEpisode.question;
  const played=await page.evaluate(()=>window.__nativeDelivery);
  for(const cue of q.audioRequirements)expect(played.some(row=>row.src.includes(cue.path)&&row.duration>0)).toBe(true);
  await expect(page.locator('.passage')).toHaveText(q.passage);
  const key=JSON.parse(q.answer).reverse();
  for(const [i,id] of key.entries()){
    const at=live.answerOptions.findIndex(option=>option.value===id);
    await page.getByRole('button',{name:'Pick picture '+(at+1),exact:true}).click();
    await page.getByRole('button',{name:'Place in space '+(i+1),exact:true}).click();
  }
  expect((await session(page)).answers).toHaveLength(0);
  await page.getByRole('button',{name:'Check answer',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Incorrect',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Next question',exact:true}).click();
  await expect.poll(async()=>(await session(page)).index).toBe(1);
  await ready(page,60000);
  const saved=await session(page);
  expect(saved.answers).toHaveLength(1);
  expect(saved.adaptiveDemand.tier).toBeLessThan(4);
  expect(saved.responseEpisode.question.id).not.toBe(q.id);
  expect(saved.responseEpisode.phase).toBe('answer');
  const first=saved.answers[0];
  expect(first).toBe(false);
});
test('an affix word has printed text and native exact-word replay without a missing passage recording',async({page})=>{
  await nativeAudio(page);const question=await openReference(page,'affix-redo');await ready(page);
  await expect(page.locator('.passage')).toHaveText('redo');
  await page.getByRole('button',{name:'Listen to word',exact:true}).click();
  await expect.poll(()=>page.evaluate(path=>window.__nativeDelivery.some(row=>row.src.includes(path)&&row.duration>0),question.passageAudioPath)).toBe(true);
  await ready(page);await page.getByRole('button',{name:'do again',exact:true}).click();
  await page.getByRole('button',{name:'Check answer',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Correct',exact:true})).toBeVisible();
});
test('a wrong source set is scored once, lowers demand and advances without teaching',async({page})=>{
  await fastAudio(page);const question=await openReference(page,'tools');await ready(page);
  await expect(page.getByRole('heading',{name:'Choose all the tools.',exact:true})).toBeVisible();
  await expect(page.locator('.map-multi-select-panel [role="status"]')).toHaveText('0 selected. Tap again to change your choices.');
  await page.getByRole('button',{name:'Select hammer',exact:true}).click();
  // The key has three tools, but "choose all" must not disclose that count or
  // prevent a child from submitting an incomplete set as their first response.
  await expect(page.locator('.map-multi-select-panel [role="status"]')).toHaveText('1 selected. Tap again to change your choices.');
  await expect(page.getByRole('button',{name:'Check answer',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Check answer',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Incorrect',exact:true})).toBeVisible();
  await expect(page.locator('[data-guided-model]')).toHaveCount(0);
  await page.getByRole('button',{name:'Next question',exact:true}).click();
  await expect.poll(async()=>(await session(page)).index).toBe(1);await ready(page);
  const after=await session(page);expect(after.answers).toHaveLength(1);
  expect(after.adaptiveStrands[question.literacyDomainId].tier).toBeLessThanOrEqual(question.practiceDemand);
  expect(after.responseEpisode.question.id).not.toBe(question.id);expect(after.responseEpisode.role).toBe('first_probe');
  const record=await page.evaluate(()=>window.__literacy.record());
  const episodes=learningResponseEpisodes(record.completions).filter(episode=>episode.firstQuestion.id===question.id);
  expect(episodes).toHaveLength(1);expect(episodes[0].responses).toHaveLength(1);expect(episodes[0].firstResponse.isCorrect).toBe(false);
});
test('an authored choose-two direction requires two selections without submitting early',async({page})=>{
  await fastAudio(page);await openReference(page,'passage-penguin-swim');await ready(page);
  const submit=page.getByRole('button',{name:'Check answer',exact:true});
  const status=page.locator('.map-multi-select-panel [role="status"]');
  await expect(status).toHaveText('0 of 2 selected. Tap again to change your choices.');
  await page.getByRole('button',{name:'Select oily feathers',exact:true}).click();
  await expect(submit).toBeDisabled();
  await page.getByRole('button',{name:'Select strong flippers',exact:true}).click();
  await expect(submit).toBeEnabled();
  expect((await session(page)).answers).toEqual([]);
  await page.getByRole('button',{name:'Select eating fish',exact:true}).click();
  await expect(submit).toBeDisabled();
  await page.getByRole('button',{name:'Select eating fish',exact:true}).click();
  await expect(status).toHaveText('2 of 2 selected. Tap again to change your choices.');
  await submit.click();
  await expect(page.getByRole('heading',{name:'Correct',exact:true})).toBeVisible();
  expect((await session(page)).answers).toEqual([true]);
});
for (const id of ['listen:lp3.key_details.l1.A.who.v43', 'listen:lp3.sequencing.l2.A.before_after_relation.v46']) {
  test(`corrected literal answer uses its exact native Leda recording for ${id}`, async ({ page }) => {
    test.setTimeout(120000);
    await nativeAudio(page);
    await page.goto(url); await page.locator('[data-child-primary-action]').click(); await ready(page);
    await page.getByRole('button', { name: 'Take a break', exact: true }).click();
    const question = await page.evaluate(id => window.__literacy.seedQuestion(id), id);
    await page.reload(); await page.getByRole('button', { name: 'Carry on', exact: true }).click(); await ready(page, 60000);
    await expect(page.locator('.assessment-passage-card .passage')).toHaveText(question.passage);
    await page.getByRole('button', { name: `Listen to ${question.answer}`, exact: true }).click();
    const path = getLedaProductionAudioPath(question.answer);
    expect(path).toBeTruthy();
    await expect.poll(() => page.evaluate(path => window.__nativeDelivery.some(row => row.src.includes(path) && row.duration > 0), path)).toBe(true);
    await ready(page); await page.getByRole('button', { name: question.answer, exact: true }).click();
    await page.getByRole('button',{name:'Check answer',exact:true}).click();
    await expect(page.getByRole('heading', { name: 'Correct', exact: true })).toBeVisible();
    const saved = await session(page);
    expect(saved.answers).toEqual([true]);
    const rows = await page.evaluate(() => window.__literacy.record().completions.flatMap(event => event.steps));
    expect(rows.some(row => row.questionId === question.id && row.responseStatus === 'answered' && row.isCorrect === true)).toBe(true);
  });
}
test('a printed word-count sentence has native exact-passage replay and scores the count',async({page})=>{
  await nativeAudio(page);const question=await openReference(page,'words-2');await ready(page);
  await expect(page.locator('.passage')).toHaveText(question.passage);
  await page.getByRole('button',{name:'Listen to passage',exact:true}).click();
  await expect.poll(()=>page.evaluate(path=>window.__nativeDelivery.some(row=>row.src.includes(path)&&row.duration>0),question.passageAudioPath)).toBe(true);
  await ready(page);await page.getByRole('button',{name:String(question.answer),exact:true}).click();
  await page.getByRole('button',{name:'Check answer',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Correct',exact:true})).toBeVisible();
});
test('a missing source answer picture is replaced without a wrong answer or consumed question',async({page})=>{
  await fastAudio(page);await page.route('**/literacy-classroom/hammer.webp',route=>route.abort());
  const question=await openReference(page,'tools');
  await expect.poll(async()=>(await session(page)).failedQuestionIds?.includes(question.id)).toBe(true);await ready(page);
  const saved=await session(page);expect(saved.index).toBe(0);expect(saved.answers).toHaveLength(0);
  expect(saved.responseEpisode.question.id).not.toBe(question.id);
  const rows=await page.evaluate(()=>window.__literacy.record().completions.flatMap(event=>event.steps));
  expect(rows.some(row=>row.responseStatus==='media_failed'&&row.questionId===question.id)).toBe(true);
  expect(rows.filter(row=>row.responseStatus==='answered')).toHaveLength(0);
});
for(const id of ['affix-recycle','affix-unfriendly','affix-unlucky'])test(`native repaired word recording is delivered for ${id}`,async({page})=>{
  await nativeAudio(page);const question=await openReference(page,id);await ready(page);
  await expect(page.locator('.passage')).toHaveText(question.passage);
  await page.getByRole('button',{name:'Listen to word',exact:true}).click();
  await expect.poll(()=>page.evaluate(path=>window.__nativeDelivery.some(row=>row.src.includes(path)&&row.duration>0),question.passageAudioPath)).toBe(true);
});
test('a long source passage remains printed and its optimized native narration finishes as reading support',async({page})=>{
  await nativeAudio(page);const question=await openReference(page,'passage-approaches');await ready(page);
  await expect(page.locator('.comprehension-passage-card .passage')).toHaveText(question.passage);
  await page.getByRole('button',{name:'Listen to passage',exact:true}).click();
  await expect.poll(()=>page.evaluate(path=>window.__nativeDelivery.some(row=>row.src.includes(path)&&row.duration>30),question.passageAudioPath),{timeout:60000}).toBe(true);
  await ready(page);await page.getByRole('button',{name:question.answer,exact:true}).click();
  await page.getByRole('button',{name:'Check answer',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Correct',exact:true})).toBeVisible();
  const record=await page.evaluate(()=>window.__literacy.record());
  const response=record.completions.flatMap(event=>event.steps).find(step=>step.questionId===question.id&&step.responseStatus==='answered');
  expect(response.evidenceType).toBe('supported');expect(response.itemSnapshot.passageAudioUsed).toBe(true);
});
