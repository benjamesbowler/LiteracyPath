import { test, expect } from '@playwright/test';
import { LITERACY_MOCK_RUNTIME_V12 as bank } from '../../src/data/generated/literacyMockRuntimeV12.generated.js';
import { createWholeClassMockSession } from '../../src/components/teacher/wholeClassPracticeModel.js';
import { literacyMockNarrationCues } from '../../src/utils/literacyMockNarration.js';
import { mockChoices } from '../../src/utils/literacyMockPlanner.js';

const seed='class-practice:audio-class-6';
async function auditNativeAudio(page) {
  await page.addInitScript(()=>{
    window.classAudioEvents=[];
    const original=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(...args){
      const path=new URL(this.src,location.href).pathname;
      const record=type=>window.classAudioEvents.push({type,path,time:performance.now()});
      record('play');
      const onended=this.onended;
      this.onended=function(event){record('ended');onended?.call(this,event);};
      return original.apply(this,args);
    };
  });
}
async function openPractice(page,area='sound_awareness',band='adaptive') {
  await page.addInitScript(()=>Object.defineProperty(crypto,'randomUUID',{value:()=> 'audio-class-6'}));
  await page.goto('/preview/teacher-a11y.html?surface=resources');
  await page.getByRole('button',{name:'Open MAP Mock practice',exact:true}).click();
  await page.getByRole('combobox',{name:'Area',exact:true}).selectOption(area);
  if(band!=='adaptive')await page.getByRole('combobox',{name:'Practice step',exact:true}).selectOption(band);
  await page.getByRole('button',{name:'Start class practice',exact:true}).click();
  return createWholeClassMockSession(bank,{area,band,seed,count:12}).rounds[0];
}
async function expectCompleteNarration(page,item) {
  const choices=mockChoices(item,`${seed}:0`);
  const expected=literacyMockNarrationCues(item,choices).map(cue=>cue.path);
  await expect.poll(()=>page.evaluate(()=>window.classAudioEvents.filter(e=>e.type==='ended').map(e=>e.path)),{timeout:60000}).toEqual(expected);
  return {choices,expected,events:await page.evaluate(()=>window.classAudioEvents)};
}

for(const area of ['sound_awareness','phonics','print','vocabulary','listening','language','reading','writing'])test(`class ${area} automatically plays its complete authored narration without a script`,async({page})=>{
  test.setTimeout(90000);
  await auditNativeAudio(page);
  const item=await openPractice(page,area);
  await expect(page.getByRole('button',{name:'Listen to the question',exact:true})).toBeVisible();
  await expect(page.locator('.whole-class-teacher-script')).toHaveCount(0);
  if(area==='sound_awareness')await expect(page.locator('[data-child-instruction]')).toHaveText(`Which word has the same starting sound as ${item.targetWord}?`);
  await page.locator('.literacy-mock-choice').first().click();
  if(item.format==='match')await page.locator('.literacy-mock-slot').first().click();
  await expect(page.getByRole('button',{name:'Check answer',exact:true})).toBeDisabled();
  const {events,choices}=await expectCompleteNarration(page,item);
  await expect(page.getByRole('button',{name:'Check answer',exact:true})).toBeEnabled();
  const firstChoice=choices.find(choice=>choice.audioPath);
  if(firstChoice){
    const preceding=item.requiredAudioCues.filter(cue=>cue.role!=='choice').at(-1).path;
    const ended=events.find(e=>e.type==='ended'&&e.path===preceding);
    const started=events.find(e=>e.type==='play'&&e.path===firstChoice.audioPath);
    expect(started.time-ended.time).toBeGreaterThanOrEqual(1950);
    await page.getByRole('button',{name:`Hear answer ${choices.indexOf(firstChoice)+1}`,exact:true}).click();
    await expect.poll(()=>page.evaluate(()=>window.classAudioEvents.filter(e=>e.type==='play').at(-1).path)).toBe(firstChoice.audioPath);
  }
});

test('the listening passage and blending phonemes remain audible',async({page})=>{
  test.setTimeout(120000);
  await auditNativeAudio(page);
  const item=await openPractice(page,'listening','3');
  await expectCompleteNarration(page,item);
  expect(item.requiredAudioCues.some(cue=>cue.role==='passage')).toBe(true);
  await page.getByRole('button',{name:'Change practice',exact:true}).click();
  await page.getByRole('combobox',{name:'Area',exact:true}).selectOption('sound_awareness');
  await page.getByRole('combobox',{name:'Practice step',exact:true}).selectOption('4');
  await page.evaluate(()=>{window.classAudioEvents=[];});
  await page.getByRole('button',{name:'Start class practice',exact:true}).click();
  const blending=createWholeClassMockSession(bank,{area:'sound_awareness',band:'4',seed,count:12}).rounds[0];
  await expectCompleteNarration(page,blending);
  expect(blending.requiredAudioCues.filter(cue=>cue.role==='phoneme').length).toBeGreaterThan(0);
});

test('a failed required recording blocks checking and can be replayed successfully',async({page})=>{
  test.setTimeout(90000);
  await page.route('**/*.mp3',route=>route.abort());
  await openPractice(page);
  await expect(page.getByText('A picture or recording did not load. Try again or choose another question.',{exact:true})).toBeVisible();
  await page.locator('.literacy-mock-choice').first().click();
  await expect(page.getByRole('button',{name:'Check answer',exact:true})).toBeDisabled();
  await page.unroute('**/*.mp3');
  await page.getByRole('button',{name:'Try sound again',exact:true}).click();
  await expect(page.getByRole('button',{name:'Check answer',exact:true})).toBeEnabled({timeout:60000});
  await expect(page.locator('.whole-class-teacher-script')).toHaveCount(0);
});

test('a broken required picture blocks checking and skipping it cannot promote difficulty',async({page})=>{
  await page.route('**/images/**',route=>route.abort());
  await openPractice(page,'vocabulary');
  await expect(page.getByText('A picture or recording did not load. Try again or choose another question.',{exact:true})).toBeVisible();
  await page.locator('.literacy-mock-choice').first().click();
  await expect(page.getByRole('button',{name:'Check answer',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Go to another question',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Practice question 2 of 12',exact:true})).toBeVisible();
  await expect(page.locator('.whole-class-practice-step')).toContainText('First steps');
});
