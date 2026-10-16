import { test,expect } from '@playwright/test';
import fs from 'node:fs';
import { LITERACY_MOCK_AREA_MAX,literacyMockAreaSchedule } from '../../src/policy/literacyMockAdaptivePolicy.js';
test.describe.configure({timeout:240000});
const root='/tests/fixtures/literacy-mock.html';
async function simulatedAudio(page){
 await page.addInitScript(()=>{window.Audio=class extends EventTarget{constructor(){super();this.src='';this.currentTime=0;this.paused=true;}play(){this.paused=false;this.onplaying?.(new Event('playing'));this.timer=setTimeout(()=>{this.onended?.(new Event('ended'));this.dispatchEvent(new Event('ended'));},3);return Promise.resolve();}pause(){clearTimeout(this.timer);this.paused=true;}load(){}};});
}
async function answer(page,q,correct){
 const order=await page.evaluate(id=>window.__literacyMock.choiceOrder(id),q.id),buttons=page.locator('.literacy-mock-choice');
 const byId=id=>buttons.nth(order.findIndex(c=>c.id===id));
 let selected=Array.isArray(q.answer)?[...q.answer]:[q.answer];
 if(q.format==='build_word'){
  const compose=(word,choices)=>{if(!word)return [];for(const c of choices)if(word.startsWith(c.label)){const rest=compose(word.slice(c.label.length),choices.filter(v=>v.id!==c.id));if(rest)return[c.id,...rest];}return null;};
  selected=compose(q.answer,q.choices);expect(selected).not.toBeNull();
  if(!correct){const index=selected.findIndex(id=>q.choices.find(c=>c.id===id).label!==q.choices.find(c=>c.id===selected[0]).label);[selected[0],selected[index]]=[selected[index],selected[0]];}
 }else if(!correct){
  if(['choice','select_text'].includes(q.format))selected=[q.choices.find(c=>c.id!==q.answer).id];
  else if(q.format==='multi_select')selected[0]=q.choices.find(c=>!selected.includes(c.id)).id;
  else if(selected.length===1)selected[0]=q.choices.find(c=>c.id!==selected[0]).id;
  else [selected[0],selected[1]]=[selected[1],selected[0]];
 }
 if(q.format==='select_text')await page.locator('.literacy-mock-text-selection button').nth(q.choices.find(c=>c.id===selected[0]).tokenIndex).click();
 else for(let i=0;i<selected.length;i++){await byId(selected[i]).click();if(q.format==='match'){await expect(byId(selected[i])).toHaveAttribute('aria-pressed','true');const slot=page.getByRole('button',{name:new RegExp(`^Space ${i+1} for`)});await slot.click();await expect(slot).toHaveText(q.choices.find(c=>c.id===selected[i]).label);}}
 const next=page.getByRole('button',{name:/^(Next question|Finish test)$/});await expect(next).toBeEnabled();await next.click();
}
for(const pattern of ['wrong','right','reversal'])test(`v8 complete ${pattern} run, reload, collection and individual/class teacher reports`,async({page},info)=>{
 await simulatedAudio(page);
 await page.setViewportSize({width:1024,height:768});
 const params=`case=${info.testId}&version=literacy-mock-v8&device=1&count=43`;
 await page.goto(`${root}?${params}&focusHook=1`);
 await expect(page.getByRole('region',{name:'Question 1',exact:true})).toBeVisible({timeout:90000});
 await expect.poll(()=>page.evaluate(()=>Boolean(window.__literacyMock.device()?.serverRun.offlineLeaseId))).toBe(true);
 await page.evaluate(()=>window.__literacyMock.setFault('offline'));
 const states=Object.fromEntries(Object.keys(LITERACY_MOCK_AREA_MAX).map(d=>[d,1])),trace=[];
 for(let index=0;index<43;index++){
  await expect(page.getByRole('region',{name:`Question ${index+1}`,exact:true})).toBeVisible();
  const q=await page.evaluate(()=>window.__literacyMock.deviceItem()),correct=pattern==='right'||pattern==='reversal'&&index<16;
  expect(q.domainId).toBe(literacyMockAreaSchedule()[index]);expect(q.adaptiveDemand?.operation).toBeTruthy();expect(q.adaptiveAreaBand).toBe(states[q.domainId]);
  if([1,7,9,13,15,37,41].includes(index))await page.screenshot({path:info.outputPath(`${pattern}-question-${index+1}.png`)});
  await answer(page,q,correct);
  await expect.poll(()=>page.evaluate(()=>window.__literacyMock.device().run.responses.length)).toBe(index+1);
  const saved=await page.evaluate(()=>window.__literacyMock.device().run.responses.at(-1));expect(saved.isCorrect).toBe(correct);
  trace.push({n:index+1,id:q.id,domain:q.domainId,band:q.adaptiveAreaBand,prompt:q.prompt,passage:q.passage,correct});
  states[q.domainId]=Math.max(0,Math.min(LITERACY_MOCK_AREA_MAX[q.domainId],q.adaptiveAreaBand+(correct?1:-1)));
  if(index===14){await page.reload();await expect(page.getByRole('region',{name:'Question 16',exact:true})).toBeVisible({timeout:90000});}
 }
 expect(await page.evaluate(()=>window.__literacyMock.state().run.responses.length)).toBe(0);
 await page.evaluate(()=>{window.__literacyMock.setFault(null);window.dispatchEvent(new Event('online'));});
 await expect.poll(()=>page.evaluate(()=>window.__literacyMock.state().run.responses.length),{timeout:30000}).toBe(43);
 expect(await page.evaluate(()=>window.__literacyMock.rawResponses().map(r=>r.isCorrect))).toEqual(trace.map(r=>r.correct));
 await page.evaluate(()=>window.__literacyMock.teacher('collect'));
 await page.goto(`${root}?${params}&mode=teacher&session=mock-session&student=student-a&phase=results`);
 const summary=page.locator('.literacy-mock-result-summary');
 await expect(summary).toContainText(`${trace.filter(r=>r.correct).length} of 43 independent answers correct`,{timeout:90000});
 await expect(summary).toContainText('Area-by-area profile');
 await expect(page.getByText('All 43 questions answered.',{exact:true})).toBeVisible();
 await expect(page.getByRole('region',{name:'Alex: literacy areas'}).locator('tbody tr')).toHaveCount(8);
 await page.screenshot({path:info.outputPath(`${pattern}-individual-report.png`),fullPage:true});
 await page.getByRole('combobox',{name:'Report for',exact:true}).selectOption('');
 await expect(page.getByRole('region',{name:'Class assessment summary'})).toContainText(`${trace.filter(r=>r.correct).length} of 43 correct`);
 await expect(page.getByRole('region',{name:'Class assessment summary'})).toContainText('Area-by-area profile');
 await expect(page.getByRole('region',{name:'Class assessment summary'})).toContainText('Full sitting received');
 await page.screenshot({path:info.outputPath(`${pattern}-class-report.png`),fullPage:true});
 fs.writeFileSync(info.outputPath('trace.json'),JSON.stringify(trace,null,2));
});

test.afterEach(async({page},info)=>{if(info.status!==info.expectedStatus){const state=await page.evaluate(()=>window.__literacyMock?.device());if(state)fs.writeFileSync(info.outputPath('device-failure.json'),JSON.stringify(state));}});

test('v8 reserve exhaustion keeps the answer and explains the real problem',async({page},info)=>{
 await simulatedAudio(page);await page.goto(`${root}?case=${info.testId}&version=literacy-mock-v8&device=1&thinPool=1&focusHook=1`);
 await expect(page.getByRole('region',{name:'Question 1',exact:true})).toBeVisible({timeout:90000});
 const q=await page.evaluate(()=>window.__literacyMock.deviceItem());await answer(page,q,false);
 await expect(page.getByRole('alert')).toHaveText('A new question at the right difficulty is not available. Your saved answers are safe.');
 expect(await page.evaluate(()=>window.__literacyMock.device().run.responses.length)).toBe(1);
});

test('an untimed teacher session shows no time limit instead of a zero clock',async({page},info)=>{
 await page.goto(`${root}?case=${info.testId}&version=literacy-mock-v8&device=1&mode=teacher`);
 const metrics=page.locator('.literacy-mock-metrics');
 await expect(metrics).toContainText('Time limit',{timeout:90000});
 await expect(metrics).toContainText('No time limit');
 await expect(metrics).not.toContainText('Time remaining at last check');
});
