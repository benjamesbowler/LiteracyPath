import { test, expect } from '@playwright/test';
import { LITERACY_MOCK_RUNTIME_V11 as bank } from '../../src/data/generated/literacyMockRuntimeV11.generated.js';
import { createWholeClassMockSession, advanceWholeClassMockSession, recordWholeClassMockAttempt } from '../../src/components/teacher/wholeClassPracticeModel.js';
import { mockChoices } from '../../src/utils/literacyMockPlanner.js';

const seed = 'class-practice:smooth-class-browser';

async function answerClassQuestion(page,item,index,correct) {
  const choices=mockChoices(item,`${seed}:${index}`);
  const answers=Array.isArray(item.answer)?item.answer:[item.answer];
  const chosen=correct ? answers : [choices.find(choice=>!answers.includes(choice.id)).id];
  if(item.format==='select_text') {
    const choice=item.choices.find(choice=>choice.id===chosen[0]);
    await page.locator('.literacy-mock-text-selection button').nth(choice.tokenIndex).click();
  } else {
    if(item.hideWrittenLabels) {
      await expect(page.locator('.literacy-mock-choice')).toHaveCount(choices.length);
      for(let position=0;position<choices.length;position++)
        await expect(page.locator('.literacy-mock-choice').nth(position)).toHaveAttribute('aria-label',`Answer ${position+1}`);
    } else await expect(page.locator('.literacy-mock-choice')).toHaveText(choices.map(choice=>choice.label));
    for(let slot=0;slot<chosen.length;slot++) {
      await page.locator('.literacy-mock-choice').nth(choices.findIndex(choice=>choice.id===chosen[slot])).click();
      if(item.format==='match') await page.locator('.literacy-mock-slot').nth(slot).click();
    }
  }
  const check=page.getByRole('button',{name:'Check answer',exact:true});
  await expect(check).toBeEnabled({timeout:30000});await check.click();
  await expect(page.locator(`.whole-class-feedback.is-${correct?'correct':'incorrect'}`)).toBeVisible();
}

test('class practice follows a gradual curve through checked answers and keeps revisits stable',async({page})=>{
  test.setTimeout(120000);
  await page.addInitScript(()=>Object.defineProperty(crypto,'randomUUID',{value:()=> 'smooth-class-browser'}));
  await page.goto('/preview/teacher-a11y.html?surface=resources');
  await page.getByRole('button',{name:'Open MAP Mock practice',exact:true}).click();
  await expect(page.getByRole('combobox',{name:'Practice step',exact:true})).toHaveValue('adaptive');
  await page.getByRole('combobox',{name:'Area',exact:true}).selectOption('print');
  await page.getByRole('button',{name:'Start class practice',exact:true}).click();
  const writes=[];
  const media=[];
  await page.route('**/*.mp3',route=>{media.push(route.request().url());return route.abort();});
  page.on('request',request=>{if(request.method()==='POST' && /rpc|rest\/v1/.test(request.url()))writes.push(request.url());});
  let session=createWholeClassMockSession(bank,{area:'print',seed,count:12});
  const bands=[];
  for(let index=0;index<5;index++) {
    const item=session.rounds[index];bands.push(item.adaptiveAreaBand);
    const correct=index<3;
    await answerClassQuestion(page,item,index,correct);
    session=advanceWholeClassMockSession(bank,recordWholeClassMockAttempt(session,index,{correct}));
    await page.getByRole('button',{name:'Next question',exact:true}).click();
  }
  bands.push(session.rounds.at(-1).adaptiveAreaBand);
  expect(bands).toEqual([0,1,2,3,2,1]);
  const sixth=await page.locator('.literacy-mock-choice').allTextContents();
  await page.getByRole('button',{name:'Previous question',exact:true}).click();
  await page.getByRole('button',{name:'Show answer',exact:true}).click();
  await page.getByRole('button',{name:'Next question',exact:true}).click();
  await expect(page.locator('.literacy-mock-choice')).toHaveText(sixth);
  expect(writes).toEqual([]);
  expect(media).toEqual([]);
});

for(const outcome of ['correct','incorrect','reversal']) test(`complete mixed class practice: ${outcome}`,async({page},info)=>{
  test.setTimeout(360000);
  const count=outcome==='reversal'?24:12;
  await page.addInitScript(()=>Object.defineProperty(crypto,'randomUUID',{value:()=> 'smooth-class-browser'}));
  const writes=[];
  const media=[];
  await page.route('**/*.mp3',route=>{media.push(route.request().url());return route.abort();});
  page.on('request',request=>{if(request.method()==='POST' && /rpc|rest\/v1/.test(request.url()))writes.push(request.url());});
  await page.goto('/preview/teacher-a11y.html?surface=resources');
  await page.getByRole('button',{name:'Open MAP Mock practice',exact:true}).click();
  await expect(page.getByRole('combobox',{name:'Area',exact:true})).toHaveValue('all');
  await expect(page.getByRole('combobox',{name:'Practice step',exact:true})).toHaveValue('adaptive');
  if(count===24) await page.getByRole('combobox',{name:'Questions',exact:true}).selectOption('24');
  await page.getByRole('button',{name:'Start class practice',exact:true}).click();
  let session=createWholeClassMockSession(bank,{seed,count});
  const shown=[];
  for(let index=0;index<count;index++) {
    const item=session.rounds[index],correct=outcome==='correct'||outcome==='reversal'&&index<8;
    await expect(page.locator('[data-child-instruction]')).toHaveText(item.prompt);
    await expect(page.locator('.whole-class-practice-step')).toContainText(item.adaptiveAreaBand===0?'First steps':'Starter');
    const script=page.getByRole('region',{name:'Teacher reading script',exact:true});
    for(const cue of item.requiredAudioCues.filter(cue=>cue.role!=='choice')) await expect(script).toContainText(cue.text);
    shown.push({index:index+1,id:item.id,area:item.domainId,band:item.adaptiveAreaBand,prompt:item.prompt,choices:mockChoices(item,`${seed}:${index}`).map(choice=>choice.label),demand:item.adaptiveDemand,correct});
    await answerClassQuestion(page,item,index,correct);
    if(index===8) await page.screenshot({path:info.outputPath(`${outcome}-question-nine.png`),fullPage:true});
    session=advanceWholeClassMockSession(bank,recordWholeClassMockAttempt(session,index,{correct}));
    await page.getByRole('button',{name:'Next question',exact:true}).click();
  }
  await expect(page.getByText('End of these questions. Choose more practice when the class is ready.',{exact:true})).toBeVisible();
  expect(shown.map(row=>row.band)).toEqual(outcome==='correct'?[...Array(8).fill(0),...Array(4).fill(1)]
    :outcome==='incorrect'?Array(12).fill(0):[...Array(8).fill(0),...Array(8).fill(1),...Array(8).fill(0)]);
  expect(writes).toEqual([]);
  expect(media).toEqual([]);
  await info.attach('actual-questions-and-demand',{body:JSON.stringify(shown,null,2),contentType:'application/json'});
});

test('individual learner recordings retain the two-second processing pause',async({page})=>{
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
  const item=createWholeClassMockSession(bank,{area:'sound_awareness',band:'5',seed,count:12}).rounds[0];
  await page.goto(`/tests/fixtures/literacy-mock.html?mode=format&version=literacy-mock-v11&item=${encodeURIComponent(item.id)}`);
  const instruction=item.requiredAudioCues.filter(cue=>cue.role!=='choice').at(-1).path;
  const firstChoice=mockChoices(item,'browser-format').map(choice=>item.requiredAudioCues.find(cue=>cue.role==='choice' && cue.choiceId===choice.id)).find(Boolean).path;
  await expect.poll(()=>page.evaluate(path=>window.nativeMockAudio.some(event=>event.path===path && event.type==='play'),firstChoice),{timeout:30000}).toBe(true);
  const events=await page.evaluate(()=>window.nativeMockAudio);
  const ended=events.find(event=>event.path===instruction && event.type==='ended');
  const answer=events.find(event=>event.path===firstChoice && event.type==='play');
  expect(ended).toBeTruthy();
  expect(answer.time-ended.time).toBeGreaterThanOrEqual(1950);
});
