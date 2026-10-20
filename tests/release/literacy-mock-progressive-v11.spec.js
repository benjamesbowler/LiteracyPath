import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { literacyMockBoundaryState } from '../../src/policy/literacyMockBoundaryPolicy.js';
import { LITERACY_MOCK_AREA_MAX, LITERACY_MOCK_AREA_ORDER, LITERACY_MOCK_BAND_NAMES } from '../../src/policy/literacyMockAdaptivePolicy.js';

import { LITERACY_DOMAINS } from '../../src/policy/literacyPracticePolicy.js';

const root='/tests/fixtures/literacy-mock.html';
const bank=await loadLiteracyMockBank({contentVersion:'literacy-mock-v11',includeUnavailable:true});
const byId=new Map(bank.map(item=>[item.id,item]));
test.describe.configure({timeout:300000});
async function tinyAudio(page){
 await page.addInitScript(()=>{
  window.__v11Audio=[];
  const path=source=>{const url=new URL(source,location.href);return url.protocol==='blob:'?decodeURIComponent(url.hash.slice(1)):url.pathname;};
  window.Audio=class extends EventTarget{
   constructor(){super();this.src='';this.currentTime=0;this.paused=true;}
   play(){
    this.paused=false;window.__v11Audio.push({type:'play',path:path(this.src),time:performance.now()});
    this.onplaying?.(new Event('playing'));
    this.timer=setTimeout(()=>{window.__v11Audio.push({type:'ended',path:path(this.src),time:performance.now()});this.onended?.(new Event('ended'));this.dispatchEvent(new Event('ended'));},5);
    return Promise.resolve();
   }
   pause(){clearTimeout(this.timer);this.paused=true;}load(){}
  };
 });
}
function tileIds(text,choices){
 if(!text)return [];
 for(const choice of choices)if(text.startsWith(choice.label)){
  const rest=tileIds(text.slice(choice.label.length),choices.filter(value=>value.id!==choice.id));
  if(rest)return [choice.id,...rest];
 }
 return null;
}
async function choose(page,item,correct){
 const order=await page.evaluate(id=>window.__literacyMock.choiceOrder(id),item.id);
 const buttons=page.locator('.literacy-mock-choice'),byId=id=>buttons.nth(order.findIndex(choice=>choice.id===id));
 let selected=Array.isArray(item.answer)?[...item.answer]:[item.answer];
 if(item.format==='build_word'){
  selected=tileIds(item.answer,item.choices);expect(selected).not.toBeNull();
  if(!correct){
   const other=selected.findIndex(id=>item.choices.find(choice=>choice.id===id).label!==item.choices.find(choice=>choice.id===selected[0]).label);
   expect(other).toBeGreaterThan(0);[selected[0],selected[other]]=[selected[other],selected[0]];
  }
 }else if(!correct){
  if(['choice','select_text'].includes(item.format))selected=[item.choices.find(choice=>choice.id!==item.answer).id];
  else if(item.format==='multi_select')selected[0]=item.choices.find(choice=>!selected.includes(choice.id)).id;
  else if(selected.length===1)selected[0]=item.choices.find(choice=>choice.id!==selected[0]).id;
  else [selected[0],selected[1]]=[selected[1],selected[0]];
 }
 if(item.format==='select_text')await page.locator('.literacy-mock-text-selection button').nth(item.choices.find(choice=>choice.id===selected[0]).tokenIndex).click();
 else for(let index=0;index<selected.length;index++){
  await byId(selected[index]).click();
  if(item.format==='match')await page.getByRole('button',{name:new RegExp(`^Space ${index+1} for`)}).click();
 }
 return order;
}
async function assertProcessingGap(page,item,order){
 const first=order.map(choice=>item.requiredAudioCues.find(cue=>cue.role==='choice' && (cue.choiceId===choice.id || cue.path===choice.audioPath))).find(Boolean);
 if(!first)return null;
 const finalQuestion=item.requiredAudioCues.filter(cue=>cue.role!=='choice').at(-1);
 const events=await page.evaluate(()=>window.__v11Audio);
 const ended=events.findLast(event=>event.type==='ended' && event.path===finalQuestion.path);
 expect(ended,`Question audio ended for ${item.id}`).toBeTruthy();
 const answer=events.find(event=>event.type==='play' && event.path===first.path && event.time>=ended.time);
 expect(answer,`First answer played for ${item.id}`).toBeTruthy();
 expect(answer.time-ended.time).toBeGreaterThanOrEqual(1950);
 return answer.time-ended.time;
}

for(const pattern of ['correct','incorrect','reversal'])test(`V11 child sitting, ${pattern}: gradual per-area route, four choices, durable collection and teacher result`,async({page},info)=>{
 await tinyAudio(page);await page.setViewportSize({width:1024,height:768});
 const params=`case=${encodeURIComponent(info.testId)}&version=literacy-mock-v11&device=1&count=124`;
 await page.goto(`${root}?${params}`);
 await expect(page.getByRole('region',{name:'Question 1',exact:true})).toBeVisible({timeout:90000});
 await expect.poll(()=>page.evaluate(()=>Boolean(window.__literacyMock.device()?.serverRun.offlineLeaseId))).toBe(true);
 await page.evaluate(()=>window.__literacyMock.setFault('offline'));
 const rows=[],routes=Object.fromEntries(LITERACY_MOCK_AREA_ORDER.map(area=>[area,[]])),trace=[];
 while(true){
  const saved=await page.evaluate(()=>window.__literacyMock.device());
  if(saved.run.status==='completed')break;
  const index=rows.length;
  await expect(page.getByRole('region',{name:`Question ${index+1}`,exact:true})).toBeVisible({timeout:60000});
  const item=await page.evaluate(()=>window.__literacyMock.deviceItem());
  const before=literacyMockBoundaryState(rows,{bank:byId})[item.domainId];
  expect(before.complete).toBe(false);expect(item.adaptiveAreaBand).toBe(before.nextBand);
  if(item.format==='choice'){
   expect(item.choices).toHaveLength(4);await expect(page.locator('.literacy-mock-choice')).toHaveCount(4);
   expect(item.choices.filter(choice=>choice.id===item.answer)).toHaveLength(1);
  }
  const areaIndex=routes[item.domainId].length;
  const correct=pattern==='correct' || pattern==='reversal' && (areaIndex<5 || areaIndex>=7 && item.adaptiveAreaBand===1);
  routes[item.domainId].push(item.adaptiveAreaBand);
  const order=await choose(page,item,correct);
  const next=page.getByRole('button',{name:/^(Next question|Finish test)$/});
  await expect(next).toBeEnabled({timeout:30000});
  const gap=await assertProcessingGap(page,item,order);
  if([0,16,32].includes(index))await page.screenshot({path:info.outputPath(`${pattern}-question-${index+1}.png`)});
  await next.click();
  await expect.poll(()=>page.evaluate(()=>window.__literacyMock.device().run.responses.length)).toBe(index+1);
  const response=await page.evaluate(()=>window.__literacyMock.device().run.responses.at(-1));
  expect(response.isCorrect).toBe(correct);expect(response.responseStatus).toBe('answered');rows.push(response);
  trace.push({number:index+1,id:item.id,area:item.domainId,band:item.adaptiveAreaBand,format:item.format,choiceCount:item.choices.length,correct,processingGapMs:gap});
  expect(rows.length).toBeLessThanOrEqual(124);
  if(index===14 && pattern==='correct'){
   await page.reload();await expect(page.getByRole('region',{name:'Question 16',exact:true})).toBeVisible({timeout:90000});
  }
 }
 const total=pattern==='correct'?108:pattern==='incorrect'?16:63;
 expect(rows).toHaveLength(total);
 const states=literacyMockBoundaryState(rows,{bank:byId});
 for(const area of LITERACY_MOCK_AREA_ORDER){
  const expected=pattern==='correct'?[0,0,0,...Array.from({length:LITERACY_MOCK_AREA_MAX[area]},(_,index)=>[index+1,index+1]).flat()]:pattern==='incorrect'?[0,0]:[0,0,0,1,1,2,2,...(area==='print'?[]:[1])];
  expect(routes[area],area).toEqual(expected);
  expect(states[area].stopReason).toBe(pattern==='correct'?'ceiling_confirmed':pattern==='incorrect'?'floor_confirmed':area==='print'?'letter_limit':'adjacent_boundary');
 }
 expect(await page.evaluate(()=>window.__literacyMock.state().run.responses.length)).toBe(0);
 await page.evaluate(()=>{window.__literacyMock.setFault(null);window.dispatchEvent(new Event('online'));});
 await expect.poll(()=>page.evaluate(()=>window.__literacyMock.state().run.responses.length),{timeout:60000}).toBe(total);
 await expect.poll(()=>page.evaluate(()=>window.__literacyMock.device().requests.length),{timeout:30000}).toBe(0);
 await page.evaluate(()=>window.__literacyMock.teacher('collect'));
 await page.goto(`${root}?${params}&mode=teacher&session=mock-session&student=student-a&phase=results`);
 const correctCount=trace.filter(row=>row.correct).length,summary=page.locator('.literacy-mock-result-summary');
 await expect(summary).toContainText(`${correctCount} of ${total} independent answers correct`,{timeout:90000});
 await expect(page.getByText(`All ${total} questions answered.`,{exact:true})).toBeVisible();
 const areas=page.getByRole('region',{name:'Alex: literacy areas'});
 await expect(areas.locator('tbody tr')).toHaveCount(8);
 const boundary=pattern==='correct'?'Repeated observations:':pattern==='incorrect'?'Repeated first-step errors':'Boundary observed: Starter / Early';
 await expect(areas).toContainText(boundary);
 for(const area of LITERACY_MOCK_AREA_ORDER){
  const row=areas.locator('tbody tr').filter({hasText:LITERACY_DOMAINS.find(domain=>domain.id===area).label});
  const observed=pattern==='correct'?`Repeated observations: ${LITERACY_MOCK_BAND_NAMES[LITERACY_MOCK_AREA_MAX[area]]}`
   :pattern==='incorrect'?'Repeated first-step errors':area==='print'?'Letter sample limit reached — uncertain':'Boundary observed: Starter / Early';
  await expect(row).toContainText(observed);
 }
 await page.screenshot({path:info.outputPath(`${pattern}-teacher-result.png`),fullPage:true});
 await page.getByRole('combobox',{name:'Report for',exact:true}).selectOption('');
 const classroom=page.getByRole('region',{name:'Class assessment summary'});
 await expect(classroom).toContainText(`${correctCount} of ${total} correct`);
 await expect(classroom).toContainText('Full sitting received');
 fs.writeFileSync(info.outputPath('route-and-gap.json'),JSON.stringify({pattern,total,correct:correctCount,routes,states,trace},null,2));
});

test('the repaired win–lose question plays natively after the real processing pause with four visible answer controls',async({page},info)=>{
 const item=bank.find(item=>item.id==='mock.capacity.language.opposite-win-lose.v11');
 expect(item).toBeTruthy();
 expect(item.prompt).toBe('Which words mean the opposite?');
 expect(item.choices.map(choice=>choice.label)).toEqual(['win — lose','win — play','win — try','win — score']);
 expect(item.requiredAudioCues.filter(cue=>cue.role==='choice')).toHaveLength(4);
 await page.setViewportSize({width:1024,height:768});
 await page.addInitScript(()=>{
  window.__v11Audio=[];const original=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(...args){
   window.__v11Audio.push({type:'play',path:new URL(this.src,location.href).pathname,time:performance.now()});
   if(!this.v11NativeListener){this.v11NativeListener=true;this.addEventListener('ended',()=>window.__v11Audio.push({type:'ended',path:new URL(this.src,location.href).pathname,time:performance.now()}));}
   return original.apply(this,args);
  };
 });
 await page.goto(`${root}?case=${encodeURIComponent(info.testId)}&mode=format&version=literacy-mock-v11&item=${encodeURIComponent(item.id)}`);
 await expect(page.locator('.literacy-mock-choice')).toHaveCount(4,{timeout:60000});
 await expect(page.locator('[data-child-instruction]')).toHaveText('Which words mean the opposite?');
 await expect(page.getByRole('group',{name:'Answer choices',exact:true})).not.toContainText(/triumph|succeed/i);
 await page.getByRole('button',{name:'Listen to the question',exact:true}).click();
 const order=await choose(page,item,true),next=page.getByRole('button',{name:'Next question',exact:true});
 await expect(next).toBeEnabled({timeout:60000});
 const gap=await assertProcessingGap(page,item,order);
 const events=await page.evaluate(()=>window.__v11Audio);
 expect(events.some(event=>event.type==='ended' && event.path.includes('/mock-v11/'))).toBe(true);
 const boxes=await page.locator('.literacy-mock-choice').evaluateAll(nodes=>nodes.map(node=>{const rect=node.getBoundingClientRect();return{x:rect.x,y:rect.y,width:rect.width,height:rect.height};}));
 for(const box of boxes){expect(box.width).toBeGreaterThanOrEqual(48);expect(box.height).toBeGreaterThanOrEqual(48);expect(box.x+box.width).toBeLessThanOrEqual(1025);expect(box.y+box.height).toBeLessThanOrEqual(769);}
 await page.screenshot({path:info.outputPath('native-v11-four-choices.png')});
 await next.click();await expect(page.getByRole('status')).toHaveText('Answer received');
 fs.writeFileSync(info.outputPath('native-recording-gap.json'),JSON.stringify({id:item.id,gapMs:gap,events,boxes},null,2));
});

test.afterEach(async({page},info)=>{
 if(info.status!==info.expectedStatus){
  const state=await page.evaluate(()=>({device:window.__literacyMock?.device(),server:window.__literacyMock?.state(),audio:window.__v11Audio}));
  fs.writeFileSync(info.outputPath('failure-state.json'),JSON.stringify(state,null,2));
 }
});
