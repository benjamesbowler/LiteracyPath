import { test, expect } from '@playwright/test';
import { LITERACY_MOCK_RUNTIME_V11 as bank } from '../../src/data/generated/literacyMockRuntimeV11.generated.js';
import { createWholeClassMockSession, advanceWholeClassMockSession, recordWholeClassMockAttempt } from '../../src/components/teacher/wholeClassPracticeModel.js';
import { mockChoices } from '../../src/utils/literacyMockPlanner.js';

const seed = 'class-practice:smooth-class-browser';

test('class practice follows a gradual curve through native answers and keeps revisits stable',async({page})=>{
  test.setTimeout(120000);
  await page.addInitScript(()=>Object.defineProperty(crypto,'randomUUID',{value:()=> 'smooth-class-browser'}));
  await page.goto('/preview/teacher-a11y.html?surface=resources');
  await page.getByRole('button',{name:'Open MAP Mock practice',exact:true}).click();
  await expect(page.getByRole('combobox',{name:'Practice step',exact:true})).toHaveValue('adaptive');
  await page.getByRole('combobox',{name:'Area',exact:true}).selectOption('print');
  await page.getByRole('button',{name:'Start class practice',exact:true}).click();
  const writes=[];
  page.on('request',request=>{if(request.method()==='POST' && /rpc|rest\/v1/.test(request.url()))writes.push(request.url());});
  let session=createWholeClassMockSession(bank,{area:'print',seed,count:12});
  const bands=[];
  for(let index=0;index<5;index++) {
    const item=session.rounds[index];bands.push(item.adaptiveAreaBand);
    const choices=mockChoices(item,`${seed}:${index}`),correct=index<3;
    const answers=Array.isArray(item.answer)?item.answer:[item.answer];
    const choiceIndex=choices.findIndex(choice=>correct ? answers.includes(choice.id) : !answers.includes(choice.id));
    const labels=choices.map(choice=>choice.label);
    await expect(page.locator('.literacy-mock-choice')).toHaveText(labels);
    await page.locator('.literacy-mock-choice').nth(choiceIndex).click();
    if(item.format==='match') await page.locator('.literacy-mock-slot').first().click();
    const check=page.getByRole('button',{name:'Check answer',exact:true});
    await expect(check).toBeEnabled({timeout:30000});await check.click();
    await expect(page.locator(`.whole-class-feedback.is-${correct?'correct':'incorrect'}`)).toBeVisible();
    session=advanceWholeClassMockSession(bank,recordWholeClassMockAttempt(session,index,{correct}));
    await page.getByRole('button',{name:'Next question',exact:true}).click();
  }
  bands.push(session.rounds.at(-1).adaptiveAreaBand);
  expect(bands).toEqual([0,0,0,1,1,0]);
  const sixth=await page.locator('.literacy-mock-choice').allTextContents();
  await page.getByRole('button',{name:'Previous question',exact:true}).click();
  await page.getByRole('button',{name:'Show answer',exact:true}).click();
  await page.getByRole('button',{name:'Next question',exact:true}).click();
  await expect(page.locator('.literacy-mock-choice')).toHaveText(sixth);
  expect(writes).toEqual([]);
});

test('native answer recordings begin at least two seconds after question ended',async({page})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(crypto,'randomUUID',{value:()=> 'smooth-class-browser'});
    window.nativeMockAudio=[];
    const original=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(...args){
      window.nativeMockAudio.push({type:'play',path:new URL(this.src,location.href).pathname,time:performance.now()});
      if(!this.processingAuditListener){
        this.processingAuditListener=true;
        this.addEventListener('ended',()=>window.nativeMockAudio.push({type:'ended',path:new URL(this.src,location.href).pathname,time:performance.now()}));
      }
      return original.apply(this,args);
    };
  });
  await page.goto('/preview/teacher-a11y.html?surface=resources');
  await page.getByRole('button',{name:'Open MAP Mock practice',exact:true}).click();
  await page.getByRole('combobox',{name:'Area',exact:true}).selectOption('sound_awareness');
  await page.getByRole('combobox',{name:'Practice step',exact:true}).selectOption('5');
  await page.getByRole('button',{name:'Start class practice',exact:true}).click();
  const item=createWholeClassMockSession(bank,{area:'sound_awareness',band:'5',seed,count:12}).rounds[0];
  const instruction=item.requiredAudioCues.filter(cue=>cue.role!=='choice').at(-1).path;
  const firstChoice=mockChoices(item,`${seed}:0`).map(choice=>item.requiredAudioCues.find(cue=>cue.role==='choice' && cue.choiceId===choice.id)).find(Boolean).path;
  await expect.poll(()=>page.evaluate(path=>window.nativeMockAudio.some(event=>event.path===path && event.type==='play'),firstChoice),{timeout:30000}).toBe(true);
  const events=await page.evaluate(()=>window.nativeMockAudio);
  const ended=events.find(event=>event.path===instruction && event.type==='ended');
  const answer=events.find(event=>event.path===firstChoice && event.type==='play');
  expect(ended).toBeTruthy();
  expect(answer.time-ended.time).toBeGreaterThanOrEqual(1950);
});
